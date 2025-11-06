import { Router } from 'express';
import {
	createEvent,
	updateEvent,
	getAllEvents,
	getEventById,
	deleteEvent,
} from '../controllers/event.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { uploadFile } from '../middlewares/multer.middleware.js';
import { body, param } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

// --- Public Routes ---

// GET /api/v1/events - Get all events with filtering, sorting, pagination
router.get('/', getAllEvents);

// GET /api/v1/events/:id - Get a single event by its ID
router.get(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	getEventById
);

// --- Admin-Only Routes ---

// POST /api/v1/events - Create a new event
router.post(
	'/',
	protect,
	authorize('admin'),
	uploadFile('posters'), // Handles multiple poster uploads
	validate([
		body('title').notEmpty().withMessage('Title is required'),
		body('description').notEmpty().withMessage('Description is required'),
		body('date')
			.notEmpty()
			.withMessage('Date is required')
			.isDate({ format: 'YYYY-MM-DD' })
			.withMessage('Date must be in YYYY-MM-DD format'),
		body('time')
			.notEmpty()
			.withMessage('Time is required')
			.matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
			.withMessage('Time must be in HH:MM (24-hour) format'),
		body('venue').notEmpty().withMessage('Venue is required'),
		body('organizer').notEmpty().withMessage('Organizer is required'),
		body('category').notEmpty().withMessage('Category is required'),
		body('totalSpots')
			.optional()
			.isInt({ min: 0 })
			.withMessage('Total spots must be a non-negative integer'),
		body('ticketPrice')
			.optional()
			.isFloat({ min: 0 })
			.withMessage('Ticket price must be a non-negative number'),
	]),
	createEvent
);

// PATCH /api/v1/events/:id - Update an existing event
router.patch(
	'/:id',
	protect,
	authorize('admin'),
	uploadFile('posters'), // Also allow updating posters
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	updateEvent
);

// DELETE /api/v1/events/:id - Delete an event
router.delete(
	'/:id',
	protect,
	authorize('admin'),
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	deleteEvent
);

export default router;
