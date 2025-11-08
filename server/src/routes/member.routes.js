import { Router } from 'express';
import {
	registerMember,
	loginMember,
	logoutMember,
	resetPassword,
	updateProfile,
	updateMemberByAdmin,
	uploadProfilePicture,
	uploadResume,
	getCurrentMember,
	getLeaders,
	sendResetPasswordEmail,
	getAllMembers,
	banMember,
	removeMember,
	unbanMember,
	refreshAccessToken, // Import the refreshAccessToken controller
} from '../controllers/member.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { uploadFile } from '../middlewares/multer.middleware.js';
import { body, param } from 'express-validator';

const router = Router();
const { protect, authorize } = authMiddleware;

// --- Public Routes ---

// Get all members (public)
router.get('/getall', getAllMembers);

// Get Leaders (public)
router.get('/getleaders', getLeaders);

// Login Member
router.post(
	'/login',
	validate([body('password').notEmpty().withMessage('Password is required')]),
	loginMember
);

// Send Password Reset Email
router.post(
	'/send-reset-email',
	validate([body('email').isEmail().withMessage('A valid email is required')]),
	sendResetPasswordEmail
);

// Reset Password (using a token from email would be more secure, but following existing logic)
router.post(
	'/reset-password',
	validate([
		body('LpuId').notEmpty().withMessage('LPU ID is required'),
		body('newPassword').notEmpty().withMessage('New password is required'),
	]),
	resetPassword
);

// Add this new route for refreshing the member's access token
router.post('/refresh-token', refreshAccessToken);

// --- Protected Member Routes (require valid access token) ---

// Logout Member (accessible to any authenticated user)
router.post('/logout', protect, logoutMember);

// Get Current Member
router.get('/me', protect, authorize('member'), getCurrentMember);

// Update own profile
router.put(
	'/:id/update',
	protect,
	authorize('member'), // A member can only update their own profile
	validate([
		param('id').isMongoId().withMessage('Invalid member ID'),
		body('email').optional().isEmail().withMessage('Invalid email format'),
		body('phone').optional().isString().withMessage('Invalid phone number format'),
		body('program').optional().isString().withMessage('Invalid program format'),
		body('year').optional().isInt({ min: 1, max: 5 }).withMessage('Invalid year format'),
		body('skills')
			.optional()
			.isArray({ max: 15 })
			.withMessage('Skills must be an array with a maximum of 15 items'),
		body('hosteler').optional().isBoolean().withMessage('Invalid hosteler format'),
		body('hostel').optional().isString().withMessage('Invalid hostel format'),
		body('socialLinks.*.platform')
			.if(body('socialLinks').exists())
			.notEmpty()
			.withMessage('Platform is required')
			.isString()
			.withMessage('Platform must be a string'),
		body('socialLinks.*.url')
			.if(body('socialLinks').exists())
			.notEmpty()
			.withMessage('URL is required')
			.isString()
			.withMessage('URL must be a string')
			.matches(/^https?:\/\/.*$/)
			.withMessage('Invalid URL format'),
		body('bio').optional().isString().withMessage('Invalid bio format'),
	]),
	updateProfile
);

// Upload own profile picture
router.post(
	'/:id/profile-picture',
	protect,
	authorize('member'),
	uploadFile('profilePicture'), // FIX: Use the imported uploadFile middleware
	validate([param('id').isMongoId().withMessage('Invalid member ID')]),
	uploadProfilePicture
);

// Upload own resume
router.post(
	'/:id/resume',
	protect,
	authorize('member'),
	uploadFile('resume'), // FIX: Use the imported uploadFile middleware
	validate([param('id').isMongoId().withMessage('Invalid member ID')]),
	uploadResume
);

// --- Protected Admin Routes ---

// Register Member
router.post(
	'/register',
	protect,
	authorize('admin'),
	validate([
		body('fullname').notEmpty().withMessage('Full name is required'),
		body('LpuId').notEmpty().withMessage('LPU ID is required'),
		body('department').notEmpty().withMessage('Department is required'),
		body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
	]),
	registerMember
);

// Update any member's profile by Admin
router.put(
	'/:id/admin',
	protect,
	authorize('admin'), // Only admins can use this
	validate([param('id').isMongoId().withMessage('Invalid member ID')]),
	updateMemberByAdmin
);

// Ban Member
router.put(
	'/:id/ban',
	protect,
	authorize('admin'),
	validate([
		param('id').isMongoId().withMessage('Invalid member ID'),
		body('reason').notEmpty().withMessage('Ban reason is required'),
		body('reviewTime').optional().isISO8601().withMessage('Review time must be a valid date'),
	]),
	banMember
);

// Remove Member
router.put(
	'/:id/remove',
	protect,
	authorize('admin'),
	validate([
		param('id').isMongoId().withMessage('Invalid member ID'),
		body('reason').notEmpty().withMessage('Remove reason is required'),
		body('reviewTime').optional().isISO8601().withMessage('Review time must be a valid date'),
	]),
	removeMember
);

// Unban Member
router.put(
	'/:id/unban',
	protect,
	authorize('admin'),
	validate([param('id').isMongoId().withMessage('Invalid member ID')]),
	unbanMember
);

export default router;
