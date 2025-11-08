import { Router } from 'express';
import {
	createAdmin,
	loginAdmin,
	logoutAdmin,
	currentAdmin,
	refreshAccessToken,
} from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { body } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

// --- Public Admin Routes ---

router.post(
	'/register',
	validate([
		body('fullname').notEmpty().withMessage('Fullname is required'),
		body('password').notEmpty().withMessage('Password is required'),
	]),
	createAdmin
);

router.post(
	'/login',
	validate([
		body('fullname').notEmpty().withMessage('Fullname is required'),
		body('password').notEmpty().withMessage('Password is required'),
		body('secret').notEmpty().withMessage('Secret is required'),
	]),
	loginAdmin
);

// Add this new route for refreshing the admin's access token
router.post('/refresh-token', refreshAccessToken);

// --- Protected Admin Routes ---

// This route now uses the new 'protect' and 'authorize' middleware.
// 'authorize('admin')' ensures only users with the 'admin' role can proceed.
router.post('/logout', protect, authorize('admin'), logoutAdmin);

// This route is also updated to use the new, more secure middleware chain.
router.get('/me', protect, authorize('admin'), currentAdmin);

export default router;
