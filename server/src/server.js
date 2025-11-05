import dotenv from 'dotenv';
import colors from 'colors';
import connectDB, { gracefulShutdown as closeDB } from './database/index.js';
import app from './app.js';

// --- Initialization ---
dotenv.config();
colors.enable();

// --- Environment Variable Validation ---
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'NODE_ENV', 'ACCESS_TOKEN_SECRET'];
for (const key of requiredEnvVars) {
	if (!process.env[key]) {
		console.error(`❌ Missing required environment variable: ${key}`.red.bold);
		process.exit(1);
	}
}

const PORT = process.env.PORT || 8000;
let server;
let isShuttingDown = false;

// --- Graceful Shutdown Logic ---
const gracefulShutdown = async (signal, error) => {
	if (isShuttingDown) return;
	isShuttingDown = true;

	if (error) {
		console.error(`\n❌ Critical Error: ${error.name}`.red.bold, error.message);
		console.error(error.stack.grey);
	}

	console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`.yellow);

	// 1. Close the HTTP server
	server.close(async () => {
		console.log('✅ HTTP server closed.'.green);

		// 2. Close the database connection
		await closeDB();

		console.log('👋 Shutdown complete.'.green.bold);
		process.exit(error ? 1 : 0);
	});

	// Force shutdown after a timeout
	setTimeout(() => {
		console.error('⚠️ Could not close connections in time, forcing shutdown.'.red);
		process.exit(1);
	}, 10000).unref(); // .unref() allows the process to exit if the server closes sooner
};

// --- Server Startup ---
const startServer = async () => {
	try {
		// 1. Connect to the database
		await connectDB();

		// 2. Start the Express server
		server = app.listen(PORT, () => {
			console.log(
				`🚀 Server is running in ${process.env.NODE_ENV.cyan} mode at http://localhost:${PORT}`
					.green.bold
			);
		});

		// --- Process Event Listeners for graceful shutdown ---
		process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
		process.on('SIGINT', () => gracefulShutdown('SIGINT'));

		process.on('unhandledRejection', (reason, promise) => {
			console.error('❌ Unhandled Rejection at:'.red, promise);
			gracefulShutdown('unhandledRejection', reason);
		});

		process.on('uncaughtException', (error) => {
			console.error('❌ Uncaught Exception:'.red, error);
			gracefulShutdown('uncaughtException', error);
		});
	} catch (err) {
		console.error('❌ Server startup failed:'.red.bold, err.message);
		process.exit(1);
	}
};

startServer();
