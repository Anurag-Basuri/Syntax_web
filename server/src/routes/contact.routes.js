import { Router } from 'express';
import {
	sendContact,
	getAllContacts,
	getContactById,
	updateContactStatus,
	deleteContact,
	bulkDeleteContacts,
	getContactStats,
} from '../controllers/contact.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { body, param } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

// --- Public Route ---

// Apply rate limiter to contact form submission
router.post(
	'/send',
	validate([
		body('name').notEmpty().trim().withMessage('Name is required'),
		body('phone').notEmpty().trim().withMessage('Phone number is required'),
		body('lpuID').notEmpty().trim().withMessage('LPU ID is required'),
		body('email').isEmail().withMessage('Invalid email format'),
		body('subject').notEmpty().trim().withMessage('Subject is required'),
		body('message').notEmpty().trim().withMessage('Message is required'),
	]),
	sendContact
);

// --- Admin-Only Routes ---

// All routes below are protected and restricted to admins
router.use(protect, authorize('admin'));

// Get statistics about contacts
router.get('/stats', getContactStats);

// Get all contacts with filtering and pagination
router.get('/', getAllContacts);

// Get a single contact by ID
router.get(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid contact ID')]),
	getContactById
);

// Update a contact's status
router.patch(
	'/:id/status',
	validate([
		param('id').isMongoId().withMessage('Invalid contact ID'),
		body('status')
			.isIn(['pending', 'resolved', 'closed'])
			.withMessage('Invalid status provided'),
	]),
	updateContactStatus
);

// Delete a single contact by ID
router.delete(
	'/:id',
	validate([param('id').isMongoId().withMessage('Invalid contact ID')]),
	deleteContact
);

// Bulk delete contacts
router.delete(
	'/',
	validate([
		body('ids').isArray({ min: 1 }).withMessage('An array of contact IDs is required.'),
		body('ids.*').isMongoId().withMessage('All items in the array must be valid IDs.'),
	]),
	bulkDeleteContacts
);

export default router;
