import { Router } from 'express';
import {
	createEvent,
	getAllEvents,
	getEventById,
	updateEventDetails,
	deleteEvent,
	addEventPoster,
	removeEventPoster,
	getEventStats,
	getEventRegistrations,
	getPublicEventDetails,
} from '../controllers/event.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { uploadFile } from '../middlewares/multer.middleware.js';
import { body, param, query } from 'express-validator';
import normalizeEventPayload from '../middlewares/normalizeEvent.middleware.js';

const router = Router();
const { protect, authorize } = authMiddleware;

// --------------------- Public routes ---------------------

router.get(
	'/',
	validate([
		query('page').optional().isInt({ min: 1 }).toInt(),
		query('limit').optional().isInt({ min: 1 }).toInt(),
	]),
	getAllEvents
);

// Get a single event by its ID (public, sanitized)
router.get(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	getEventById
);

// Public sanitized details (explicit endpoint)
router.get(
	'/:id/public',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	getPublicEventDetails
);

// --------------------- Admin routes ---------------------
router.use(protect, authorize('admin'));

// Analytics & admin reports
router.get('/admin/statistics', getEventStats);

router.get('/:id/registrations', validate([param('id').isMongoId()]), getEventRegistrations);

// Core event management
router.post(
	'/',
	// multer must parse multipart/form-data before validators that read req.body
	uploadFile('posters', { multiple: true, maxCount: 5 }),
	normalizeEventPayload,
	validate([
		body('title').notEmpty().trim().withMessage('Title is required'),
		body('description').notEmpty().trim().withMessage('Description is required'),
		body('eventDate')
			.notEmpty()
			.withMessage('Event date is required')
			.bail()
			.isISO8601()
			.withMessage('eventDate must be ISO-8601'),
		body('venue').notEmpty().trim().withMessage('Venue is required'),
		body('category').notEmpty().trim().withMessage('Category is required'),
		body('tags').optional().isArray().withMessage('Tags must be an array'),
		body('totalSpots').optional().isInt({ min: 0 }).toInt(),
		body('ticketPrice').optional().isFloat({ min: 0 }).toFloat(),
		body('registration.mode')
			.optional()
			.isIn(['internal', 'external', 'none'])
			.withMessage('Invalid registration.mode'),
		body('registration.externalUrl')
			.optional()
			.isURL()
			.withMessage('registration.externalUrl must be a valid URL'),
	]),
	createEvent
);

router.patch(
	'/:id/details',
	normalizeEventPayload,
	validate([
		param('id').isMongoId().withMessage('Invalid event ID'),
		body('eventDate').optional().isISO8601().withMessage('Invalid date format'),
		body('venue').optional().trim(),
		body('title').optional().trim().isLength({ min: 1 }),
		body('description').optional().trim().isLength({ min: 1 }),
		body('category').optional().trim(),
		body('tags').optional().isArray(),
		body('status')
			.optional()
			.isIn(['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed']),
	]),
	updateEventDetails
);

router.delete(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	deleteEvent
);

// Poster endpoints
// Validate route params before accepting uploaded file to avoid unnecessary uploads when id invalid
router.post(
	'/:id/posters',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	uploadFile('poster', { multiple: false }),
	addEventPoster
);
router.delete(
	'/:id/posters/:publicId',
	validate([param('id').isMongoId(), param('publicId').notEmpty()]),
	removeEventPoster
);

// Keep ticket-specific admin endpoints in ticket.routes.js (do not duplicate here)

export default router;
