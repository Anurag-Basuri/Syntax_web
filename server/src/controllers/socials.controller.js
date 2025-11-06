import Post from '../models/socials.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile, deleteFile } from '../utils/cloudinary.js';
import mongoose from 'mongoose';

// Create a new post with media uploads
const createPost = asyncHandler(async (req, res) => {
	const { title, content, status } = req.body;
	const authorId = req.user._id; // From 'protect' middleware

	if (!req.files || req.files.length === 0) {
		throw ApiError.BadRequest('At least one image or video file is required.');
	}

	// Upload all files to Cloudinary
	const uploadPromises = req.files.map((file) => uploadFile(file, { folder: 'posts' }));
	const uploadedFiles = await Promise.all(uploadPromises);

	// Map to the media schema structure
	const media = uploadedFiles.map((file) => ({
		url: file.url,
		publicId: file.public_id,
		resource_type: file.resource_type, // 'image' or 'video'
	}));

	const post = await Post.create({
		author: authorId,
		title,
		content,
		status,
		media,
	});

	return ApiResponse.success(res, { post }, 'Post created successfully', 201);
});

// Get all posts with pagination and optional search
const getAllPosts = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10, search } = req.query;

	const filter = { status: 'published' };
	if (search) {
		filter.$text = { $search: search };
	}

	const aggregate = Post.aggregate([
		{ $match: filter },
		{ $sort: { createdAt: -1 } },
		{
			$lookup: {
				from: 'admins',
				localField: 'author',
				foreignField: '_id',
				as: 'authorInfo',
				pipeline: [{ $project: { fullname: 1 } }],
			},
		},
		{ $unwind: '$authorInfo' },
		{ $addFields: { author: '$authorInfo' } },
		{ $project: { authorInfo: 0 } },
	]);

	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
	};

	const paginatedPosts = await Post.aggregatePaginate(aggregate, options);

	return ApiResponse.paginated(
		res,
		paginatedPosts.docs,
		{
			totalDocs: paginatedPosts.totalDocs,
			totalPages: paginatedPosts.totalPages,
			currentPage: paginatedPosts.page,
			limit: paginatedPosts.limit,
		},
		'Posts retrieved successfully'
	);
});

// Get a single post by ID
const getPostById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const post = await Post.findById(id).populate('author', 'fullname');

	if (!post || post.status !== 'published') {
		throw ApiError.NotFound('Post not found or is not published.');
	}

	return ApiResponse.success(res, { post }, 'Post retrieved successfully.');
});

// Delete a post by ID
const deletePost = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const post = await Post.findByIdAndDelete(id);

	if (!post) {
		throw ApiError.NotFound('Post not found.');
	}

	// Delete all associated media from Cloudinary
	if (post.media && post.media.length > 0) {
		const deletePromises = post.media.map((file) =>
			deleteFile({ public_id: file.publicId, resource_type: file.resource_type })
		);
		await Promise.all(deletePromises);
	}

	return ApiResponse.success(res, null, 'Post deleted successfully.');
});

export { createPost, getAllPosts, getPostById, deletePost };
