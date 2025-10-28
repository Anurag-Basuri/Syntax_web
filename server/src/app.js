import express from 'express';
import { initRateLimiter, rateLimiter } from './middlewares/rateLimit.middleware.js';
import { applyCors } from './middlewares/cors.middleware.js';
import { InitializeCloudinary } from './utils/cloudinary.js';
import { ApiError } from './utils/ApiError.js';

import dotenv from 'dotenv';
dotenv.config();

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

const app = express();

// Initialize Cloudinary
InitializeCloudinary();

// Initialize rate limiter
if (process.env.REDIS_URL) {
  try {
    await initRateLimiter();
    // app.use(rateLimiter);
  } catch (err) {
    console.warn('⚠️ Rate limiter not initialized:', err?.message || err);
  }
} else {
  console.warn('⚠️ Rate limiter disabled: REDIS_URL not set');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(applyCors);

// API routes
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

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

// 404 handler
app.use((req, res, next) => {
    next(new ApiError(404, 'Route not found'));
});

// Global error handler
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: err.errors || null,
    });
});

export default app;
