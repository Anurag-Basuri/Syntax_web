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

//================================================================================
// --- Public Routes ---
// Accessible by anyone.
//================================================================================

// Get data for the main landing page (current fest or last completed one)
router.get('/landing', getLandingPageData);

// Get a paginated list of all fests (summary view)
router.get('/', getAllFests);

// Get full details for a single fest by its unique slug or year
router.get(
	'/:identifier',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	getFestDetails
);

//================================================================================
// --- Admin-Only Routes ---
// All subsequent routes are protected and require admin privileges.
//================================================================================

router.use(protect, authorize('admin'));

// --- Admin Analytics & Reports ---
router.get('/export/csv', exportFestsCSV);
router.get('/analytics/overview', getFestAnalytics);
router.get('/statistics/overview', getFestStatistics);
router.get(
	'/reports/:identifier',
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	generateFestReport
);

// --- Core Fest Management ---
router.post(
	'/',
	validate([
		body('name').notEmpty().trim().withMessage('Fest name is required'),
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
		// Allow optional updates to any of these fields
		body('name').optional().notEmpty().trim(),
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

// --- Partner Management ---

// Add a new partner (sponsor or collaborator) to a fest
router.post(
	'/:identifier/partners',
	uploadFile('logo'),
	validate([
		param('identifier').notEmpty().withMessage('Fest identifier is required'),
		body('name').notEmpty().trim().withMessage('Partner name is required'),
		// allow either `type` or `tier` from the client; validate if supplied
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

// --- Event Linking ---
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

// --- Media Management ---
router.patch(
	'/:identifier/poster',
	uploadFile('poster'), // Correctly use the uploadFile middleware factory
	validate([param('identifier').notEmpty().withMessage('Fest identifier is required')]),
	updateFestPoster
);

router.post(
	'/:identifier/gallery',
	uploadFile('media'), // Correctly use the uploadFile middleware factory
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
