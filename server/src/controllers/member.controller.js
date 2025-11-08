import Member from '../models/member.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadFile, uploadResume as resumeUpload, deleteFile } from '../utils/cloudinary.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import jwt from 'jsonwebtoken';

// Helper function to generate tokens and set cookies
const generateAndSendTokens = async (member, res, message, statusCode) => {
	const accessToken = member.generateAuthToken();
	const refreshToken = member.generateRefreshToken();

	// Save refresh token to database
	member.refreshToken = refreshToken;
	await member.save({ validateBeforeSave: false });

	const options = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	};

	return ApiResponse.success(
		res.cookie('refreshToken', refreshToken, options),
		{ user: member.toJSON(), accessToken },
		message,
		statusCode
	);
};

// Register a new member
const registerMember = asyncHandler(async (req, res) => {
	const { fullname, LpuId, email, password, department, designation, joinedAt } = req.body;

	if (!fullname || !LpuId || !password || !department || !designation) {
		throw ApiError.BadRequest(
			'Full name, LPU ID, password, department, and designation are required'
		);
	}

	const existingMember = await Member.findOne({ LpuId });
	if (existingMember) {
		throw ApiError.Conflict('Member with this LPU ID already exists');
	}

	const member = await Member.create({
		fullname,
		LpuId,
		email,
		password,
		department,
		designation,
		joinedAt: joinedAt || Date.now(),
	});

	return generateAndSendTokens(member, res, 'Member registered successfully', 201);
});

// Login member
const loginMember = asyncHandler(async (req, res) => {
	const { LpuId, email, password } = req.body;

	if ((!LpuId && !email) || !password) {
		throw ApiError.BadRequest('LPU ID or email and password are required');
	}

	const query = LpuId ? { LpuId } : { email };
	const member = await Member.findOne(query).select('+password +refreshToken');

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	// Block login if banned or removed
	if (member.status === 'banned') {
		const reviewTime = member.restriction?.time
			? new Date(member.restriction.time).toLocaleString()
			: 'N/A';
		throw ApiError.Forbidden(
			`Your account is banned. Reason: ${member.restriction?.reason || 'No reason provided'}. Review at: ${reviewTime}`
		);
	}

	if (member.status === 'removed') {
		throw ApiError.Forbidden(
			`Your account has been removed. Reason: ${member.restriction?.reason || 'No reason provided'}.`
		);
	}

	const isPasswordValid = await member.comparePassword(password);
	if (!isPasswordValid) {
		throw ApiError.Unauthorized('Invalid credentials');
	}

	return generateAndSendTokens(member, res, 'Login successful', 200);
});

// Ban member (admin only)
const banMember = asyncHandler(async (req, res) => {
	const { reason, reviewTime } = req.body;
	const member = await Member.findById(req.params.id);

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	await member.ban(reason, reviewTime);

	return ApiResponse.success(res, { user: member.toJSON() }, 'Member banned successfully');
});

// Remove member (admin only)
const removeMember = asyncHandler(async (req, res) => {
	const { reason, reviewTime } = req.body;
	const member = await Member.findById(req.params.id);

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	await member.removeMember(reason, reviewTime);

	return ApiResponse.success(res, { user: member.toJSON() }, 'Member removed successfully');
});

// Unban member (admin only)
const unbanMember = asyncHandler(async (req, res) => {
	const member = await Member.findById(req.params.id);

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	await member.unban();

	return ApiResponse.success(res, { user: member.toJSON() }, 'Member unbanned successfully');
});

// Logout member
const logoutMember = asyncHandler(async (req, res) => {
	const member = req.user; // FIX: Changed from req.member to req.user

	if (!member) {
		throw ApiError.Unauthorized('Unauthorized access');
	}

	// Clear refresh token from database
	await Member.findByIdAndUpdate(member._id, { $unset: { refreshToken: 1 } }, { new: true });

	const options = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
	};

	return ApiResponse.success(res.clearCookie('refreshToken', options), null, 'Logout successful');
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
	const { LpuId, newPassword } = req.body;

	if (!LpuId || !newPassword) {
		throw ApiError.BadRequest('LPU ID and new password are required');
	}

	const member = await Member.findOne({ LpuId });

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	member.password = newPassword;
	await member.save();

	return ApiResponse.success(res, { user: member.toJSON() }, 'Password reset successfully');
});

// Update member profile
const updateProfile = asyncHandler(async (req, res) => {
	const { email, phone, program, year, skills, hosteler, hostel, socialLinks, bio } = req.body;

	const member = await Member.findById(req.params.id);

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	// Update fields
	if (email !== undefined) member.email = email;
	if (phone !== undefined) member.phone = phone;
	if (program !== undefined) member.program = program;
	if (year !== undefined) member.year = year;
	if (skills !== undefined) member.skills = skills;
	if (hosteler !== undefined) member.hosteler = hosteler;
	if (socialLinks !== undefined) member.socialLinks = socialLinks;
	if (bio !== undefined) member.bio = bio;

	// Handle hostel field based on hosteler status
	if (hosteler === false) {
		member.hostel = '';
	} else if (hostel !== undefined) {
		member.hostel = hostel;
	}

	// Validation: if hosteler is true, hostel cannot be empty
	if (member.hosteler === true && (!member.hostel || member.hostel.trim() === '')) {
		throw ApiError.BadRequest('Hostel name is required when hosteler is true');
	}

	await member.save();

	return ApiResponse.success(res, { user: member.toJSON() }, 'Profile updated successfully');
});

// Update by admin
const updateMemberByAdmin = asyncHandler(async (req, res) => {
	const { department, designation, LpuId, joinedAt } = req.body;

	const member = await Member.findById(req.params.id);

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	if (department !== undefined) member.department = department;
	if (designation !== undefined) member.designation = designation;
	if (LpuId !== undefined) member.LpuId = LpuId;
	if (joinedAt !== undefined) member.joinedAt = joinedAt;

	await member.save();

	return ApiResponse.success(res, { user: member.toJSON() }, 'Member updated successfully');
});

// Upload profile picture
const uploadProfilePicture = asyncHandler(async (req, res) => {
	const files = req.files;

	if (!files || files.length === 0) {
		throw ApiError.BadRequest('No files uploaded');
	}

	const member = await Member.findById(req.user.id);

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	// Delete old profile picture from Cloudinary
	if (member.profilePicture && member.profilePicture.publicId) {
		await deleteFile({
			public_id: member.profilePicture.publicId,
			resource_type: 'image',
		});
	}

	// Upload new profile picture to Cloudinary
	const uploadResponse = await uploadFile(files[0]);
	member.profilePicture = {
		url: uploadResponse.url,
		publicId: uploadResponse.publicId,
	};
	await member.save();

	return ApiResponse.success(
		res,
		{ user: member.toJSON() },
		'Profile picture uploaded successfully'
	);
});

// Upload resume
const uploadResume = asyncHandler(async (req, res) => {
	const files = req.files;

	if (!files || files.length === 0) {
		throw ApiError.BadRequest('No files uploaded');
	}

	const member = await Member.findById(req.user.id);

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	// Delete old resume from Cloudinary
	if (member.resume && member.resume.publicId) {
		await deleteFile({
			public_id: member.resume.publicId,
			resource_type: 'raw',
		});
	}

	// Upload new resume to Cloudinary
	const uploadResponse = await resumeUpload(files[0]);
	member.resume = {
		url: uploadResponse.url,
		publicId: uploadResponse.publicId,
	};
	await member.save();

	return ApiResponse.success(res, { user: member.toJSON() }, 'Resume uploaded successfully');
});

// Get current member
const getCurrentMember = asyncHandler(async (req, res) => {
	const member = req.user;

	if (!member) {
		throw ApiError.Unauthorized('Unauthorized access');
	}

	return ApiResponse.success(res, member.toJSON(), 'Current member retrieved successfully');
});

// Get the leaders
const getLeaders = asyncHandler(async (req, res) => {
	const leaders = await Member.find({ isLeader: true }).select(
		'fullname designation profilePicture socialLinks'
	);
	return ApiResponse.success(res, { members: leaders }, 'Club leaders retrieved successfully');
});

// Add this new controller function
const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken = req.body.refreshToken || req.cookies.refreshToken;

	if (!incomingRefreshToken) {
		throw new ApiError(401, 'Refresh token is required');
	}

	const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

	const member = await Member.findById(decodedToken._id);

	if (!member) {
		throw new ApiError(401, 'Invalid refresh token');
	}

	if (incomingRefreshToken !== member.refreshToken) {
		throw new ApiError(401, 'Refresh token is expired or has been used');
	}

	const accessToken = member.generateAuthToken();

	return ApiResponse.success(res, { accessToken }, 'Access token refreshed successfully');
});

// Send password reset email
const sendResetPasswordEmail = asyncHandler(async (req, res) => {
	const { email } = req.body;

	if (!email) {
		throw ApiError.BadRequest('Email is required');
	}

	const member = await Member.findOne({ email });

	if (!member) {
		throw ApiError.NotFound('Member not found');
	}

	// Generate reset token
	const resetToken = member.generateResetToken();
	await member.save({ validateBeforeSave: false });

	// Send the reset email
	await sendPasswordResetEmail(email, resetToken);

	return ApiResponse.success(res, null, 'Password reset email sent successfully');
});

// Get all members
const getAllMembers = asyncHandler(async (req, res) => {
	const members = await Member.find().select('-password -refreshToken');
	const totalMembers = await Member.countDocuments();

	return ApiResponse.success(res, { members, totalMembers }, 'Members retrieved successfully');
});

export {
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
	refreshAccessToken,
	sendResetPasswordEmail,
	getAllMembers,
	banMember,
	removeMember,
	unbanMember,
};
