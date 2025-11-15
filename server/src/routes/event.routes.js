import { Router } from 'express';
import {
	createEvent,
	getAllEvents,
	getEventById,
	getPublicEventDetails,
	updateEventDetails,
	deleteEvent,
	addEventPoster,
	removeEventPoster,
	addEventPartner,
	removeEventPartner,
	addEventSpeaker,
	removeEventSpeaker,
	addEventResource,
	removeEventResource,
	addEventCoOrganizer,
	removeEventCoOrganizer,
	getEventStats,
	getEventRegistrations,
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

// Public sanitized details (explicit endpoint) — place before '/:id' to avoid param collision with 'public'
router.get(
	'/:id/public',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	getPublicEventDetails
);

// Get a single event by its ID (public, sanitized)
router.get(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid event ID')]),
	getEventById
);

// --------------------- Admin routes ---------------------
router.use(protect, authorize('admin'));

// Analytics & admin reports
router.get('/admin/statistics', getEventStats);

router.get('/:id/registrations', validate([param('id').isMongoId()]), getEventRegistrations);

// Core event management
router.post(
	'/',
	uploadFile('posters', { multiple: true, maxCount: 5 }),
	normalizeEventPayload,
	validate([
		body('title').notEmpty().trim().withMessage('Title is required'),
		body('description').notEmpty().trim().withMessage('Description is required'),
		body('eventDate')
			.notEmpty()
			.withMessage('Event date is required')
			.bail()
			.custom((value, { req }) => {
				const val = value ?? req.body.date ?? req.body.eventDate;
				if (!val) return false;
				const dt = new Date(val);
				return !Number.isNaN(dt.getTime());
			})
			.withMessage('eventDate must be a valid ISO/datetime-local string'),
		body('venue').notEmpty().trim().withMessage('Venue is required'),
		body('category').notEmpty().trim().withMessage('Category is required'),
		body('tags')
			.optional()
			.customSanitizer((value, { req }) => {
				const v = typeof value !== 'undefined' ? value : req.body.tags;
				if (Array.isArray(v)) return v;
				if (typeof v === 'string') {
					if (v.includes(','))
						return v
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean);
					if (v.trim().length) return [v.trim()];
					return [];
				}
				return v;
			})
			.isArray()
			.withMessage('Tags must be an array or a comma-separated string'),
		body('totalSpots')
			.optional()
			.customSanitizer((v, { req }) => {
				const val = typeof v !== 'undefined' ? v : req.body.totalSpots;
				if (typeof val === 'string' && val.trim() !== '') {
					const n = Number(val);
					return Number.isNaN(n) ? val : n;
				}
				return val;
			})
			.isInt({ min: 0 })
			.toInt(),
		body('ticketPrice')
			.optional()
			.customSanitizer((v, { req }) => {
				const val = typeof v !== 'undefined' ? v : req.body.ticketPrice;
				if (typeof val === 'string' && val.trim() !== '') {
					const n = Number(val);
					return Number.isNaN(n) ? val : n;
				}
				return val;
			})
			.isFloat({ min: 0 })
			.toFloat(),
		body('registration.mode')
			.optional()
			.custom((value, { req }) => {
				const mode =
					typeof value !== 'undefined'
						? value
						: (req.body.registrationMode ?? req.body?.registration?.mode);
				return ['internal', 'external', 'none'].includes(mode);
			})
			.withMessage('Invalid registration.mode'),
		body('registration.externalUrl')
			.optional({ checkFalsy: true })
			.custom((value, { req }) => {
				const url =
					typeof value !== 'undefined'
						? value
						: (req.body.externalUrl ?? req.body?.registration?.externalUrl);
				if (!url) return true;
				try {
					/* eslint-disable no-new */
					new URL(url);
					return true;
				} catch {
					return false;
				}
			})
			.withMessage('registration.externalUrl must be a valid URL'),
	]),
	createEvent
);

router.patch(
	'/:id/details',
	normalizeEventPayload,
	validate([
		param('id').isMongoId().withMessage('Invalid event ID'),
		body('eventDate')
			.optional()
			.custom((value, { req }) => {
				const val =
					typeof value !== 'undefined' ? value : (req.body.date ?? req.body.eventDate);
				if (!val) return true;
				const dt = new Date(val);
				return !Number.isNaN(dt.getTime());
			})
			.withMessage('Invalid date format'),
		body('venue').optional().trim(),
		body('title').optional().trim().isLength({ min: 1 }),
		body('description').optional().trim().isLength({ min: 1 }),
		body('category').optional().trim(),
		body('tags')
			.optional()
			.customSanitizer((value, { req }) => {
				const v = typeof value !== 'undefined' ? value : req.body.tags;
				if (Array.isArray(v)) return v;
				if (typeof v === 'string') {
					if (v.includes(','))
						return v
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean);
					if (v.trim().length) return [v.trim()];
					return [];
				}
				return v;
			})
			.isArray()
			.withMessage('Tags must be an array or a comma-separated string'),
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

// Partner endpoints (admin)
router.post(
	'/:id/partners',
	validate([
		param('id').isMongoId().withMessage('Invalid event ID'),
		body('name').notEmpty().trim().withMessage('Partner name is required'),
	]),
	uploadFile('logo', { multiple: false }),
	addEventPartner
);
router.delete(
	'/:id/partners/:partnerId',
	validate([param('id').isMongoId(), param('partnerId').notEmpty()]),
	removeEventPartner
);

// Speaker endpoints (admin)
router.post(
	'/:id/speakers',
	validate([
		param('id').isMongoId().withMessage('Invalid event ID'),
		body('name').notEmpty().trim().withMessage('Speaker name is required'),
	]),
	uploadFile('photo', { multiple: false }),
	addEventSpeaker
);
router.delete(
	'/:id/speakers/:index',
	validate([
		param('id').isMongoId(),
		param('index').isInt().withMessage('Invalid speaker index'),
	]),
	removeEventSpeaker
);

// Resources endpoints (admin)
router.post(
	'/:id/resources',
	validate([
		param('id').isMongoId(),
		body('title').notEmpty().trim(),
		body('url').notEmpty().trim(),
	]),
	addEventResource
);
router.delete(
	'/:id/resources/:index',
	validate([
		param('id').isMongoId(),
		param('index').isInt().withMessage('Invalid resource index'),
	]),
	removeEventResource
);

// Co-organizers endpoints (admin)
router.post(
	'/:id/co-organizers',
	validate([param('id').isMongoId(), body('name').notEmpty().trim()]),
	addEventCoOrganizer
);
router.delete(
	'/:id/co-organizers/:index',
	validate([param('id').isMongoId(), param('index').isInt().withMessage('Invalid index')]),
	removeEventCoOrganizer
);
router.delete(
	'/:id/co-organizers/name/:name',
	validate([param('id').isMongoId(), param('name').notEmpty().trim()]),
	removeEventCoOrganizer
);

export default router;
