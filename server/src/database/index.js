import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let cachedConnection = null;

const connectDB = async () => {
	if (cachedConnection) {
		console.log('✅ Using existing MongoDB connection');
		return cachedConnection;
	}

	try {
		const uri = process.env.MONGODB_URI;

		if (!uri) {
			throw new Error('❌ MongoDB URI is not defined. Check your .env file.');
		}

		console.log('🔌 Connecting to MongoDB...');

		const options = {
			bufferCommands: false,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			family: 4,
		};

		const conn = await mongoose.connect(uri, options);

		cachedConnection = conn;

		console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

		mongoose.connection.on('error', err => {
			console.error('❌ MongoDB connection error:', err);
			cachedConnection = null;
		});

		return conn;
	} catch (error) {
		console.error(`❌ MongoDB connection failed: ${error.message}`);
		throw error;
	}
};

// Gracefully close the MongoDB connection on termination
process.on('SIGINT', async () => {
	try {
		await mongoose.connection.close();
		console.log('🔒 MongoDB connection closed due to app termination');
		process.exit(0);
	} catch (err) {
		console.error('❌ Error during MongoDB disconnection:', err);
		process.exit(1);
	}
});

// Helper to check current DB connection status
export const getConnectionStatus = () => mongoose.connection.readyState;

export default connectDB;
