import { Router } from 'express';
import {
	getLatestFest,
	createFest,
	getAllFests,
	getFestDetails,
	updateFestDetails,
	deleteFest,
	addPartner,
	removePartner,
	linkEventToFest,
	unlinkEventFromFest,
	addGalleryMedia,
	removeGalleryMedia,
	addFestPoster,
	removeFestPoster,
	updateFestHero,
	removeFestHero,
	updatePartner,
	reorderPartners,
	reorderGallery,
	bulkDeleteMedia,
	duplicateFest,
	setFestStatus,
	updatePresentation,
	exportFestsCSV,
	getFestStatistics,
	getFestAnalytics,
	generateFestReport,
	updateSocialLinks,
	updateThemeColors,
	addTrack,
	removeTrack,
	addFAQ,
	removeFAQ,
	reorderFAQs,
	setVisibility,
} from '../controllers/arvantis.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadFile } from '../middlewares/multer.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { body, param } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

// ----------------------------- Public Routes -----------------------------
// Landing / summary list / public detail (public)
router.get('/landing', getLatestFest);

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
		body('year').isInt({ min: 2000 }).withMessage('A valid year is required'),
		body('description').notEmpty().trim().withMessage('Description is required'),
		body('startDate').isISO8601().withMessage('Valid start date is required'),
		body('endDate').isISO8601().withMessage('Valid end date is required'),
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
		body('startDate').optional().isISO8601(),
		body('endDate').optional().isISO8601(),
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

// Duplicate, status, presentation, visibility
router.post(
	'/:identifier/duplicate',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('year').isInt({ min: 2000 }).withMessage('Target year is required'),
	]),
	duplicateFest
);

router.patch(
	'/:identifier/status',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('status')
			.notEmpty()
			.isIn(['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'])
			.withMessage('Invalid status'),
	]),
	setFestStatus
);

router.patch(
	'/:identifier/presentation',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	updatePresentation
);

router.patch(
	'/:identifier/social-links',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	updateSocialLinks
);

router.patch(
	'/:identifier/theme',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	updateThemeColors
);

router.patch(
	'/:identifier/visibility',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('visibility')
			.isIn(['public', 'private', 'unlisted'])
			.withMessage('Invalid visibility'),
	]),
	setVisibility
);

// Partner management
router.post(
	'/:identifier/partners',
	(req, res, next) => {
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

router.patch(
	'/:identifier/partners/:partnerName',
	uploadFile('logo', { multiple: false, maxCount: 1 }),
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		param('partnerName').notEmpty().withMessage('Partner name is required'),
		body('website').optional().isURL().withMessage('Must be a valid URL'),
	]),
	updatePartner
);

router.delete(
	'/:identifier/partners/:partnerName',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		param('partnerName').notEmpty().withMessage('Partner name is required'),
	]),
	removePartner
);

router.patch(
	'/:identifier/partners/reorder',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	reorderPartners
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
	'/:identifier/posters',
	(req, res, next) => {
		/* eslint-disable no-console */
		console.log('[ROUTE] PATCH /:identifier/posters', {
			identifier: req.params.identifier,
			contentType: req.headers['content-type'],
		});
		/* eslint-enable no-console */
		next();
	},
	// accept multiple poster uploads now
	uploadFile('posters', { multiple: true, maxCount: 20 }),
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	addFestPoster
);

// Delete poster (legacy body-based)
router.delete(
	'/:identifier/poster',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	removeFestPoster
);

// Delete poster by publicId (recommended)
router.delete(
	'/:identifier/posters/:publicId',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		param('publicId').notEmpty().withMessage('Poster public ID is required'),
	]),
	removeFestPoster
);

// Tracks CRUD (note: update/reorder handlers not implemented in controller - only add/remove present)
router.post(
	'/:identifier/tracks',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('title').notEmpty().withMessage('Track title is required'),
	]),
	addTrack
);

router.delete(
	'/:identifier/tracks/:trackKey',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	removeTrack
);

// FAQs CRUD
router.post(
	'/:identifier/faqs',
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('question').notEmpty().withMessage('Question is required'),
		body('answer').notEmpty().withMessage('Answer is required'),
	]),
	addFAQ
);

router.delete(
	'/:identifier/faqs/:faqId',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	removeFAQ
);

router.patch(
	'/:identifier/faqs/reorder',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	reorderFAQs
);

export default router;
