import dotenv from 'dotenv';
import colors from 'colors';
import connectDB, { closeDB } from './database/index.js';
import { checkCloudinaryConnection } from './utils/cloudinary.js';
import { createRateLimiter } from './middlewares/rateLimit.middleware.js';
import app from './app.js';

// --- Initialization ---
dotenv.config();
colors.enable();

// --- Environment Variable Validation ---
const requiredEnvVars = [
	'PORT',
	'MONGODB_URI',
	'NODE_ENV',
	'ACCESS_TOKEN_SECRET',
	'CLOUDINARY_CLOUD_NAME',
	'CLOUDINARY_API_KEY',
	'CLOUDINARY_API_SECRET',
];
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

	const exitCode = error ? 1 : 0;
	const signalType = error ? 'Critical Error' : 'Signal';

	console.log(`\n🔄 Received ${signal}. Starting graceful shutdown due to: ${signalType}`.yellow);

	if (error) {
		console.error(`❌ ${error.name || 'Error'}:`.red.bold, error.message);
		console.error(error.stack?.grey);
	}

	// 1. Close the HTTP server to stop accepting new connections
	if (server) {
		server.close(async () => {
			console.log('✅ HTTP server closed.'.green);

			// 2. Close the database connection
			await closeDB();

			console.log('👋 Shutdown complete.'.green.bold);
			process.exit(exitCode);
		});
	} else {
		// If server isn't running, just close DB and exit
		await closeDB();
		console.log('👋 Shutdown complete.'.green.bold);
		process.exit(exitCode);
	}

	// Force shutdown after a timeout if graceful shutdown fails
	setTimeout(() => {
		console.error('⚠️ Could not close connections in time, forcing shutdown.'.red);
		process.exit(1);
	}, 10000).unref();
};

// --- Server Startup ---
const startServer = async () => {
	try {
		// 1. Connect to the database (critical)
		await connectDB();

		// 2. Initialize and apply rate limiter
		if (process.env.REDIS_URL) {
			try {
				const rateLimiter = await createRateLimiter();
				app.use(rateLimiter);
				console.log('⚡ Rate Limiter Initialized and applied.'.cyan);
			} catch (redisErr) {
				console.warn(
					'⚠️  Rate limiter not initialized:'.yellow,
					redisErr?.message || redisErr
				);
			}
		} else {
			console.warn('⚠️  Rate limiter disabled: REDIS_URL not set.'.yellow);
		}

		// 3. Check Cloudinary connection (non-critical)
		try {
			await checkCloudinaryConnection();
			console.log('☁️  Cloudinary connection verified.'.cyan.bold);
		} catch (cloudinaryErr) {
			console.warn('\n----------------------------------------------------'.yellow);
			console.warn('⚠️  Cloudinary Connection Failed!'.yellow.bold);
			console.warn(`   Reason: ${cloudinaryErr.message}`.grey);
			console.warn(
				"\n   The server will run, but it's flying without its cloud. \n   All file upload and delete operations will be grounded."
					.yellow
			);
			console.warn('----------------------------------------------------\n'.yellow);
		}

		// 4. Start the Express server
		server = server = app.listen(PORT, '0.0.0.0', () => {
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
			// For unhandled rejections, we treat the 'reason' as the error
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
