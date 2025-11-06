import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { applyCors } from './middlewares/cors.middleware.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';

// --- Route Imports ---
import adminRouter from './routes/admin.routes.js';
import applyRouter from './routes/apply.routes.js';
import contactRouter from './routes/contact.routes.js';
import eventRoutes from './routes/event.routes.js';
import memberRoutes from './routes/member.routes.js';
import socialRouter from './routes/socials.routes.js';
import ticketRouter from './routes/ticket.routes.js';

const app = express();

// --- Core Middlewares ---
app.use(helmet()); // Set security HTTP headers
app.use(applyCors); // Apply custom CORS policy
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // Sanitize user-supplied data
app.use(hpp()); // Protect against HTTP Parameter Pollution

// --- API Routes ---
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/apply', applyRouter);
app.use('/api/v1/contact', contactRouter);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/socials', socialRouter);
app.use('/api/v1/tickets', ticketRouter);

// --- Health Check Route ---
app.get('/api/v1/health', (req, res) => {
	return ApiResponse.success(res, { status: 'ok' }, 'API is healthy');
});

// --- Error Handling ---
// 404 Not Found handler for API routes
app.use('/api', (req, res, next) => {
	next(ApiError.NotFound('The requested resource was not found on this server.'));
});

// Global error handler
app.use((err, req, res, next) => {
	// If the error is not an instance of our custom ApiError, create one
	const apiError =
		err instanceof ApiError
			? err
			: new ApiError(err.statusCode || 500, err.message || 'Internal Server Error');

	// Log the error for debugging
	console.error(
		`❌ [${apiError.statusCode}] - ${apiError.message} - ${req.originalUrl} - ${req.method}`.red
	);
	if (process.env.NODE_ENV === 'development' && apiError.stack) {
		console.error(apiError.stack.grey);
	}

	// Send a standardized error response
	return ApiResponse.error(res, apiError);
});

export default app;
