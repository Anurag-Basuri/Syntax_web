import { Router } from 'express';
import {
	applyController,
	getAllApplications,
	getApplicationById,
	updateApplicationStatus,
	deleteApplication,
	markApplicationAsSeen,
	bulkUpdateStatus,
	getApplicationStats,
} from '../controllers/apply.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { body, param } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

// --- Public Route ---

// Submit a new application
router.post(
	'/',
	validate([
		body('fullName').notEmpty().trim().withMessage('Full name is required'),
		body('LpuId')
			.notEmpty()
			.withMessage('LPU ID is required')
			.isLength({ min: 7, max: 10 })
			.withMessage('LPU ID must be between 7 and 10 digits'),
		body('email').isEmail().withMessage('Invalid email format'),
		body('phone').notEmpty().withMessage('Phone number is required'),
		body('course').notEmpty().withMessage('Course is required'),
		body('domains').isArray({ min: 1 }).withMessage('At least one domain is required'),
		body('accommodation').notEmpty().withMessage('Accommodation preference is required'),
	]),
	applyController
);

// --- Admin-Only Routes ---

// All subsequent routes are protected and restricted to admins
router.use(protect, authorize('admin'));

// Get application statistics
router.get('/stats', getApplicationStats);

// Get all applications
router.get('/', getAllApplications);

// Bulk update application status
router.patch(
	'/bulk/status',
	validate([
		body('ids').isArray({ min: 1 }).withMessage('An array of application IDs is required'),
		body('ids.*').isMongoId().withMessage('All IDs in the array must be valid'),
		body('status')
			.isIn(['approved', 'rejected', 'pending'])
			.withMessage('Invalid status value'),
	]),
	bulkUpdateStatus
);

// Get single application by ID
router.get(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid application ID')]),
	getApplicationById
);

// Update application status
router.patch(
	'/:id/status',
	validate([
		param('id').isMongoId().withMessage('Invalid application ID'),
		body('status')
			.isIn(['approved', 'rejected', 'pending'])
			.withMessage('Invalid status value'),
	]),
	updateApplicationStatus
);

// Mark application as seen
router.patch(
	'/:id/seen',
	validate([param('id').isMongoId().withMessage('Invalid application ID')]),
	markApplicationAsSeen
);

// Delete an application
router.delete(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid application ID')]),
	deleteApplication
);

export default router;
