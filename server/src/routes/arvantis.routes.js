import { Router } from 'express';
import {
	getLandingPageData,
	createFest,
	getAllFests,
	getFestDetails,
	updateFestDetails,
	deleteFest,
	addPartner,
	removePartner,
	linkEventToFest,
	unlinkEventFromFest,
	updateFestPoster,
	addGalleryMedia,
	removeGalleryMedia,
	exportFestsCSV,
	getFestStatistics,
	getFestAnalytics,
	generateFestReport,
} from '../controllers/arvantis.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadFile } from '../middlewares/multer.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { body, param } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

// ----------------------------- Public Routes -----------------------------
// Landing / summary list / public detail (public)
router.get('/landing', getLandingPageData);

router.get('/', getAllFests);

// Public detail route - must be before admin-only middleware so it's accessible without auth
router.get(
	'/:identifier',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	getFestDetails
);

// ----------------------------- Admin Routes ------------------------------
// Protect everything below
router.use(protect, authorize('admin'));

// Admin exports / analytics / reports
router.get('/export/csv', exportFestsCSV);
router.get('/analytics/overview', getFestAnalytics);
router.get('/statistics/overview', getFestStatistics);
router.get(
	'/reports/:identifier',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	generateFestReport
);

// Core fest management
router.post(
	'/',
	validate([
		body('year').isInt({ min: 2020 }).withMessage('A valid year (e.g., 2025) is required'),
		body('description').notEmpty().trim().withMessage('Description is required'),
		body('startDate').isISO8601().toDate().withMessage('Valid start date is required'),
		body('endDate').isISO8601().toDate().withMessage('Valid end date is required'),
		body('status')
			.optional()
			.isIn(['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed']),
	]),
	createFest
);

router.patch(
	'/:identifier/update',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('description').optional().notEmpty().trim(),
		body('startDate').optional().isISO8601().toDate(),
		body('endDate').optional().isISO8601().toDate(),
		body('status')
			.optional()
			.isIn(['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed']),
	]),
	updateFestDetails
);

router.delete(
	'/:identifier',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	deleteFest
);

// Partner management
router.post(
	'/:identifier/partners',
	(req, res, next) => {
		// debug log useful for diagnosing upload/content-type issues
		/* eslint-disable no-console */
		console.log('[ROUTE] POST /:identifier/partners', {
			identifier: req.params.identifier,
			contentType: req.headers['content-type'],
		});
		/* eslint-enable no-console */
		next();
	},
	uploadFile('logo', { multiple: false, maxCount: 1 }),
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('name').notEmpty().trim().withMessage('Partner name is required'),
		body('type')
			.optional()
			.isIn(['sponsor', 'collaborator'])
			.withMessage('Invalid partner type'),
		body('tier')
			.optional()
			.isIn(['sponsor', 'collaborator'])
			.withMessage('Invalid partner tier'),
		body('website').optional().isURL().withMessage('Must be a valid URL'),
	]),
	addPartner
);

router.delete(
	'/:identifier/partners/:partnerName',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		param('partnerName').notEmpty().withMessage('Partner name is required'),
	]),
	removePartner
);

// Event linking
router.post(
	'/:identifier/events',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('eventId').isMongoId().withMessage('A valid event ID is required'),
	]),
	linkEventToFest
);

router.delete(
	'/:identifier/events/:eventId',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		param('eventId').isMongoId().withMessage('A valid event ID is required'),
	]),
	unlinkEventFromFest
);

// Media management
router.patch(
	'/:identifier/poster',
	(req, res, next) => {
		/* eslint-disable no-console */
		console.log('[ROUTE] PATCH /:identifier/poster', {
			identifier: req.params.identifier,
			contentType: req.headers['content-type'],
		});
		/* eslint-enable no-console */
		next();
	},
	uploadFile('poster', { multiple: false, maxCount: 1 }),
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	updateFestPoster
);

router.post(
	'/:identifier/gallery',
	(req, res, next) => {
		/* eslint-disable no-console */
		console.log('[ROUTE] POST /:identifier/gallery', {
			identifier: req.params.identifier,
			contentType: req.headers['content-type'],
		});
		/* eslint-enable no-console */
		next();
	},
	uploadFile('media', { multiple: true, maxCount: 10 }),
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	addGalleryMedia
);

router.delete(
	'/:identifier/gallery/:publicId',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		param('publicId').notEmpty().withMessage('Media public ID is required'),
	]),
	removeGalleryMedia
);

export default router;
