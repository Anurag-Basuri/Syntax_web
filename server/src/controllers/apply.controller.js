import Apply from '../models/apply.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

// Create a new application
const applyController = asyncHandler(async (req, res) => {
	const {
		fullName,
		LpuId,
		email,
		phone,
		course,
		gender,
		domains,
		accommodation,
		previousExperience,
		anyotherorg,
		bio,
	} = req.body;

	// Validate required fields
	const requiredFields = { fullName, LpuId, email, phone, course, domains, accommodation };
	const missingFields = Object.entries(requiredFields)
		.filter(([_, value]) => !value)
		.map(([key]) => key);

	if (missingFields.length > 0) {
		throw ApiError.BadRequest(`Missing required fields: ${missingFields.join(', ')}`, {
			missingFields,
		});
	}

	// Validate domains array
	if (!Array.isArray(domains) || domains.length === 0) {
		throw ApiError.BadRequest('At least one domain must be selected');
	}

	// Check for duplicate LPU ID
	const existingLpuId = await Apply.findOne({ LpuId });
	if (existingLpuId) {
		throw ApiError.Conflict('An application with this LPU ID already exists');
	}

	// Check for duplicate email
	const existingEmail = await Apply.findOne({ email: email.toLowerCase() });
	if (existingEmail) {
		throw ApiError.Conflict('An application with this email already exists');
	}

	// Check for duplicate phone
	const existingPhone = await Apply.findOne({ phone });
	if (existingPhone) {
		throw ApiError.Conflict('An application with this phone number already exists');
	}

	try {
		const newApplication = await Apply.create({
			fullName: fullName.trim(),
			LpuId: LpuId.trim(),
			email: email.toLowerCase().trim(),
			phone: phone.trim(),
			course,
			gender,
			domains,
			accommodation,
			previousExperience: previousExperience || false,
			anyotherorg: anyotherorg || false,
			bio: bio?.trim() || '',
		});

		return ApiResponse.success(
			res,
			{
				application: newApplication,
				id: newApplication._id,
			},
			'Application submitted successfully',
			201
		);
	} catch (error) {
		// Handle mongoose validation errors
		if (error.name === 'ValidationError') {
			const validationErrors = Object.values(error.errors).map((err) => err.message);
			throw ApiError.UnprocessableEntity('Validation failed', validationErrors);
		}
		throw error;
	}
});

// Get all applications (with filtering and pagination)
const getAllApplications = asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 10,
		status,
		course,
		startDate,
		endDate,
		search,
		seen,
		sortBy = 'createdAt',
		sortOrder = 'desc',
	} = req.query;

	// Build filter object
	const filter = {};

	if (status && ['pending', 'approved', 'rejected'].includes(status)) {
		filter.status = status;
	}

	if (course) {
		filter.course = course;
	}

	if (seen === 'true') {
		filter.seen = true;
	} else if (seen === 'false') {
		filter.seen = false;
	}

	// Date range filtering
	if (startDate || endDate) {
		filter.createdAt = {};
		if (startDate) {
			const start = new Date(startDate);
			if (isNaN(start.getTime())) {
				throw ApiError.BadRequest('Invalid start date format');
			}
			filter.createdAt.$gte = start;
		}
		if (endDate) {
			const end = new Date(endDate);
			if (isNaN(end.getTime())) {
				throw ApiError.BadRequest('Invalid end date format');
			}
			// Set to end of day
			end.setHours(23, 59, 59, 999);
			filter.createdAt.$lte = end;
		}
	}

	// Search functionality
	if (search && search.trim()) {
		filter.$or = [
			{ fullName: { $regex: search.trim(), $options: 'i' } },
			{ LpuId: { $regex: search.trim(), $options: 'i' } },
			{ email: { $regex: search.trim(), $options: 'i' } },
		];
	}

	// Pagination options
	const pageNum = parseInt(page, 10);
	const limitNum = parseInt(limit, 10);

	if (pageNum < 1) {
		throw ApiError.BadRequest('Page number must be greater than 0');
	}

	if (limitNum < 1 || limitNum > 100) {
		throw ApiError.BadRequest('Limit must be between 1 and 100');
	}

	// Determine sort order
	const sortDirection = sortOrder === 'asc' ? 1 : -1;
	const allowedSortFields = ['createdAt', 'fullName', 'status', 'LpuId'];
	const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

	const options = {
		page: pageNum,
		limit: limitNum,
		sort: { [sortField]: sortDirection },
		lean: true, // Return plain JavaScript objects for better performance
	};

	const applications = await Apply.paginate(filter, options);

	return ApiResponse.paginated(
		res,
		applications.docs,
		{
			totalDocs: applications.totalDocs,
			totalPages: applications.totalPages,
			currentPage: applications.page,
			limit: applications.limit,
			hasNextPage: applications.hasNextPage,
			hasPrevPage: applications.hasPrevPage,
		},
		'Applications retrieved successfully'
	);
});

// Get single application by ID
const getApplicationById = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw ApiError.BadRequest('Invalid application ID format');
	}

	const application = await Apply.findById(id);

	if (!application) {
		throw ApiError.NotFound('Application not found');
	}

	return ApiResponse.success(res, { application }, 'Application retrieved successfully');
});

// Update status (approve/reject)
const updateApplicationStatus = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw ApiError.BadRequest('Invalid application ID format');
	}

	const validStatuses = ['approved', 'rejected', 'pending'];
	if (!status || !validStatuses.includes(status)) {
		throw ApiError.BadRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
	}

	const application = await Apply.findById(id);

	if (!application) {
		throw ApiError.NotFound('Application not found');
	}

	// Prevent status change if already approved/rejected (optional business logic)
	if (application.status !== 'pending' && status === 'pending') {
		throw ApiError.BadRequest('Cannot revert status back to pending');
	}

	application.status = status;
	await application.save();

	return ApiResponse.success(res, { application }, `Application ${status} successfully`);
});

// Delete an application
const deleteApplication = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw ApiError.BadRequest('Invalid application ID format');
	}

	const deleted = await Apply.findByIdAndDelete(id);

	if (!deleted) {
		throw ApiError.NotFound('Application not found');
	}

	return ApiResponse.success(
		res,
		{ deletedApplication: deleted },
		'Application deleted successfully'
	);
});

// Mark application as seen
const markApplicationAsSeen = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw ApiError.BadRequest('Invalid application ID format');
	}

	const application = await Apply.findById(id);

	if (!application) {
		throw ApiError.NotFound('Application not found');
	}

	// Only update if not already seen
	if (application.seen) {
		return ApiResponse.success(res, { application }, 'Application already marked as seen');
	}

	application.seen = true;
	await application.save();

	return ApiResponse.success(res, { application }, 'Application marked as seen');
});

// Bulk operations
const bulkUpdateStatus = asyncHandler(async (req, res) => {
	const { ids, status } = req.body;

	if (!Array.isArray(ids) || ids.length === 0) {
		throw ApiError.BadRequest('Provide an array of application IDs');
	}

	const validStatuses = ['approved', 'rejected', 'pending'];
	if (!status || !validStatuses.includes(status)) {
		throw ApiError.BadRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
	}

	// Validate all IDs
	const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
	if (invalidIds.length > 0) {
		throw ApiError.BadRequest('Some application IDs are invalid', { invalidIds });
	}

	const result = await Apply.updateMany({ _id: { $in: ids } }, { $set: { status } });

	return ApiResponse.success(
		res,
		{
			modifiedCount: result.modifiedCount,
			matchedCount: result.matchedCount,
		},
		`${result.modifiedCount} application(s) updated successfully`
	);
});

// Get application statistics
const getApplicationStats = asyncHandler(async (req, res) => {
	const stats = await Apply.aggregate([
		{
			$facet: {
				statusCount: [
					{
						$group: {
							_id: '$status',
							count: { $sum: 1 },
						},
					},
				],
				courseCount: [
					{
						$group: {
							_id: '$course',
							count: { $sum: 1 },
						},
					},
				],
				unseenCount: [
					{
						$match: { seen: false },
					},
					{
						$count: 'count',
					},
				],
				totalCount: [
					{
						$count: 'count',
					},
				],
			},
		},
	]);

	const formattedStats = {
		total: stats[0].totalCount[0]?.count || 0,
		unseen: stats[0].unseenCount[0]?.count || 0,
		byStatus: stats[0].statusCount.reduce((acc, item) => {
			acc[item._id] = item.count;
			return acc;
		}, {}),
		byCourse: stats[0].courseCount.reduce((acc, item) => {
			acc[item._id] = item.count;
			return acc;
		}, {}),
	};

	return ApiResponse.success(res, { stats: formattedStats }, 'Statistics retrieved successfully');
});

// Export all controller functions
export {
	applyController,
	getAllApplications,
	getApplicationById,
	updateApplicationStatus,
	deleteApplication,
	markApplicationAsSeen,
	bulkUpdateStatus,
	getApplicationStats,
};
