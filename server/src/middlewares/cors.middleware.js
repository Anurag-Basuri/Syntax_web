import cors from 'cors';

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const corsOptions = {
	origin: function (origin, callback) {
		// allow requests with no origin (like mobile apps, curl, server-to-server)
		if (!origin) return callback(null, true);
		if (allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	exposedHeaders: ['Set-Cookie', 'Content-Type'],
	methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
};

// Export middleware function to be used as app.use(corsMiddleware)
export function applyCors(app) {
	app.use(cors(corsOptions));
	// Also respond to OPTIONS preflight fast
	app.options('*', cors(corsOptions));
}