import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

// --- Custom Middlewares & Utils ---
import { initRateLimiter, rateLimiter } from './middlewares/rateLimit.middleware.js';
import { applyCors } from './middlewares/cors.middleware.js';
import { InitializeCloudinary } from './utils/cloudinary.js';
import { ApiError } from './utils/ApiError.js';

// --- Route Imports ---
import adminRouter from './routes/admin.routes.js';
import applyRouter from './routes/apply.routes.js';
import contactRouter from './routes/contact.routes.js';
import eventRoutes from './routes/event.routes.js';
import memberRoutes from './routes/member.routes.js';
import socialRouter from './routes/socials.routes.js';
import ticketRouter from './routes/ticket.routes.js';
import cashFreeRoutes from './routes/cashFree.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import instamojoRoutes from './routes/instamojo.routes.js';

// --- Initialization ---
dotenv.config();
const app = express();
colors.enable();

// --- Service Initializations ---
InitializeCloudinary();
console.log('☁️  Cloudinary Initialized'.cyan);

if (process.env.REDIS_URL) {
	try {
		await initRateLimiter();
		console.log('⚡ Rate Limiter Initialized'.cyan);
		app.use(rateLimiter); // Enable rate limiter globally
	} catch (err) {
		console.warn('⚠️  Rate limiter not initialized:'.yellow, err?.message || err);
	}
} else {
	console.warn('⚠️  Rate limiter disabled: REDIS_URL not set'.yellow);
}

// --- Core Middlewares ---
app.use(helmet()); // Set security HTTP headers
app.use(express.json({ limit: '16kb' })); // Body parser, with size limit
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(mongoSanitize()); // Sanitize user-supplied data to prevent MongoDB operator injection
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks
app.use(applyCors); // Apply custom CORS policy

// --- API Routes ---
app.use('/api/admin', adminRouter);
app.use('/api/apply', applyRouter);
app.use('/api/contact', contactRouter);
app.use('/api/events', eventRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/socials', socialRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/cashfree', cashFreeRoutes);
app.use('/api/instamojo', instamojoRoutes);
app.use('/api/coupons', couponRoutes);

// --- Health Check Route ---
app.get('/api/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API is running'.green });
});

// --- Error Handling ---
// 404 Not Found handler
app.use((req, res, next) => {
	next(new ApiError(404, 'Route not found'));
});

// Global error handler
app.use((err, req, res, next) => {
	const status = err.statusCode || 500;
	const message = err.message || 'Internal Server Error';

	// Log the error for debugging
	console.error(`❌  [${status}] - ${message} - ${req.originalUrl} - ${req.method}`.red);
	if (process.env.NODE_ENV === 'development') {
		console.error(err.stack.grey);
	}

	res.status(status).json({
		success: false,
		message: message,
		errors: err.errors || (process.env.NODE_ENV === 'development' ? err.stack : null),
	});
});

export default app;
