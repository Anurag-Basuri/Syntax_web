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
} from '../controllers/event.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { uploadFile } from '../middlewares/multer.middleware.js';
import { body, param } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

//================================================================================
// --- Public Routes ---
//================================================================================

// Get all events with filtering, sorting, and pagination
router.get('/', getAllEvents);

// Get a single event by its ID
router.get(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	getEventById
);

//================================================================================
// --- Admin-Only Routes ---
//================================================================================

router.use(protect, authorize('admin'));

// --- Analytics & Reports ---
router.get('/admin/statistics', getEventStats);

router.get(
	'/:id/registrations',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	getEventRegistrations
);

// --- Core Event Management ---
router.post(
	'/',
	uploadFile('posters'), // Handles multiple poster uploads via the custom middleware
	validate([
		body('title').notEmpty().trim().withMessage('Title is required'),
		body('description').notEmpty().trim().withMessage('Description is required'),
		body('eventDate')
			.isISO8601()
			.toDate()
			.withMessage('A valid ISO 8601 event date is required'),
		body('venue').notEmpty().trim().withMessage('Venue is required'),
		body('organizer').notEmpty().trim().withMessage('Organizer is required'),
		body('category').notEmpty().trim().withMessage('Category is required'),
		body('tags').optional().isString(),
		body('totalSpots')
			.optional()
			.isInt({ min: 0 })
			.withMessage('Total spots must be a non-negative integer'),
		body('ticketPrice')
			.optional()
			.isFloat({ min: 0 })
			.withMessage('Ticket price must be a non-negative number'),
		body('registrationOpenDate')
			.optional()
			.isISO8601()
			.toDate()
			.withMessage('Invalid registration open date format'),
		body('registrationCloseDate')
			.optional()
			.isISO8601()
			.toDate()
			.withMessage('Invalid registration close date format'),
	]),
	createEvent
);

router.patch(
	'/:id/details',
	validate([
		param('id').isMongoId().withMessage('Invalid event ID'),
		// Add validation for any fields you allow to be updated
		body('title').optional().notEmpty().trim(),
		body('description').optional().notEmpty().trim(),
		body('eventDate').optional().isISO8601().toDate(),
		body('venue').optional().notEmpty().trim(),
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

// --- Poster Management ---
router.post(
	'/:id/posters',
	uploadFile('poster'), // Handles a single poster upload
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	addEventPoster
);

router.delete(
	'/:id/posters/:publicId',
	validate([
		param('id').isMongoId().withMessage('Invalid event ID'),
		param('publicId').notEmpty().withMessage('Poster public ID is required'),
	]),
	removeEventPoster
);

export default router;
