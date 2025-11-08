import Admin from '../models/admin.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const generateAndSendTokens = async (admin, res, message, statusCode) => {
	const accessToken = admin.generateAuthToken();
	const refreshToken = admin.generateRefreshToken();

	// Save the new refresh token to the database
	admin.refreshToken = refreshToken;
	await admin.save({ validateBeforeSave: false });

	const options = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
	};

	return ApiResponse.success(
		res.cookie('refreshToken', refreshToken, options),
		{ user: admin, accessToken },
		message,
		statusCode
	);
};

// Create Admin (for initial setup, should be protected)
const createAdmin = asyncHandler(async (req, res) => {
	const { fullname, password } = req.body;

	if (!fullname || !password) {
		throw ApiError.BadRequest('Fullname and password are required');
	}

	const existing = await Admin.findOne({ fullname });
	if (existing) {
		throw ApiError.Conflict('Admin with this fullname already exists');
	}

	const admin = await Admin.create({ fullname, password });

	return generateAndSendTokens(admin, res, 'Admin created successfully', 201);
});

// Login Admin
const loginAdmin = asyncHandler(async (req, res) => {
	const { fullname, password, secret } = req.body;

	if (!fullname || !password) {
		throw ApiError.BadRequest('Fullname and password are required');
	}

	if (!secret || secret !== process.env.ADMIN_SECRET) {
		throw ApiError.Forbidden('Invalid admin secret');
	}

	const admin = await Admin.findOne({ fullname });
	if (!admin || !(await admin.comparePassword(password))) {
		throw ApiError.Unauthorized('Invalid credentials');
	}

	return generateAndSendTokens(admin, res, 'Login successful', 200);
});

// Logout Admin
const logoutAdmin = asyncHandler(async (req, res) => {
	const adminId = req.admin?._id;

	if (!adminId) {
		throw ApiError.Unauthorized('No admin to logout');
	}

	// Clear the refresh token from the database
	await Admin.findByIdAndUpdate(adminId, { $unset: { refreshToken: 1 } }, { new: true });

	const options = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
	};

	return ApiResponse.success(res.clearCookie('refreshToken', options), null, 'Logout successful');
});

// Get current admin
const currentAdmin = asyncHandler(async (req, res) => {
	const admin = req.admin;
	if (!admin) {
		throw ApiError.Unauthorized('Unauthorized request');
	}
	return ApiResponse.success(res, { user: admin }, 'Current admin retrieved successfully');
});

export { createAdmin, loginAdmin, logoutAdmin, currentAdmin };
