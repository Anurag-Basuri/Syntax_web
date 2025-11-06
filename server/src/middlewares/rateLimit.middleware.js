import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Create and configure rate limiter middleware
export const createRateLimiter = async () => {
    const options = {
        windowMs: 5 * 60 * 1000, // 5 minutes
        limit: 200, // Limit each IP to 200 requests per window
        standardHeaders: 'draft-7', // Use standard `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers
        keyGenerator: ipKeyGenerator, // Use the helper for proper IP handling
        message: {
            status: 'error',
            message: 'Too many requests from this IP, please try again after 15 minutes.',
        },
    };

    // Use Redis for storage in production or if REDIS_URL is set
    if (process.env.REDIS_URL) {
        try {
            const { default: RedisStore } = await import('rate-limit-redis');
            const { default: Redis } = await import('ioredis');
            const redisClient = new Redis(process.env.REDIS_URL);

            options.store = new RedisStore({
                // ioredis v5 uses `.call` instead of `.sendCommand`
                sendCommand: (...args) => redisClient.call(...args),
                prefix: 'rate-limit:',
            });
        } catch (err) {
            console.error('Failed to import or connect to Redis for rate limiting:'.red, err);
            // Re-throw to be caught by the startup logic in server.js
            throw new Error('Redis setup for rate limiting failed.');
        }
    }

    // Return the configured rate-limit middleware
    return rateLimit(options);
};

// Optional placeholder for cache middleware
export const cacheMiddleware = (duration) => {
    return async (req, res, next) => {
        // Caching logic can be implemented here in the future
        next();
    };
};
