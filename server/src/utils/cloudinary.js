import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';
import fs from 'fs';
import path from 'path';

// Renamed for consistency
const initializeCloudinary = () => {
	try {
		const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
		const apiKey = process.env.CLOUDINARY_API_KEY;
		const apiSecret = process.env.CLOUDINARY_API_SECRET;

		if (!cloudName || !apiKey || !apiSecret) {
			throw new Error('Cloudinary credentials are not fully set in environment variables.');
		}

		cloudinary.config({
			cloud_name: cloudName,
			api_key: apiKey,
			api_secret: apiSecret,
			secure: true, // Enforce https
		});
	} catch (error) {
		// This will be caught by the checkCloudinaryConnection function
		throw new Error(`Failed to initialize Cloudinary: ${error.message}`);
	}
};

// Check Cloudinary connection
const checkCloudinaryConnection = async () => {
	initializeCloudinary(); // First, set up the configuration
	const response = await cloudinary.api.ping();
	if (response?.status !== 'ok') {
		throw new Error(`Cloudinary ping failed. Status: ${response?.status || 'unknown'}`);
	}
};

// Allowed file types for uploads
const ALLOWED_FILE_TYPES = {
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'video/mp4': 'mp4',
	'video/mpeg': 'mpeg',
	'video/quicktime': 'mov',
	'video/webm': 'webm',
	'video/ogg': 'ogg',
	'application/pdf': 'pdf',
	'application/msword': 'doc',
};

// MAX file size in bytes (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Validate file type and size
const validateFile = (file) => {
	if (!file || !file.mimetype || !ALLOWED_FILE_TYPES[file.mimetype]) {
		throw ApiError.badRequest(
			`Invalid file type "${file?.mimetype}". Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`
		);
	}

	if (file.size > MAX_FILE_SIZE) {
		throw ApiError.badRequest(
			`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`
		);
	}
};

// Upload file to Cloudinary
const uploadFile = async (file, options = {}) => {
	validateFile(file);

	try {
		const uploadResponse = await cloudinary.uploader.upload(file.path, {
			resource_type: 'auto',
			folder: options.folder, // Use folder from options
			overwrite: true,
		});

		// Clean up local file after upload
		try {
			fs.unlinkSync(file.path);
		} catch (fsErr) {
			// Log but don't throw, as upload succeeded
			console.warn('Failed to delete local file after upload:', file.path, fsErr.message);
		}

		return {
			url: uploadResponse.secure_url,
			publicId: uploadResponse.public_id,
			resource_type: uploadResponse.resource_type, // Return resource_type
		};
	} catch (error) {
		throw new ApiError(
			500,
			`Failed to upload file "${file.originalname || file.path}" to Cloudinary`,
			[error.message]
		);
	}
};

// Upload resume to cloudinary
const uploadResume = async (file) => {
	validateFile(file);

	try {
		const uploadResponse = await cloudinary.uploader.upload(file.path, {
			resource_type: 'raw',
			type: 'upload',
			folder: 'resumes',
			public_id: path.basename(file.originalname),
			overwrite: true,
		});

		// Clean up local file after upload
		try {
			fs.unlinkSync(file.path);
		} catch (fsErr) {
			console.warn('Failed to delete local file after upload:', file.path, fsErr.message);
		}

		return {
			url: uploadResponse.secure_url,
			publicId: uploadResponse.public_id,
		};
	} catch (error) {
		throw ApiError.internal(
			`Failed to upload resume "${file.originalname || file.path}" to Cloudinary`,
			[error.message]
		);
	}
};

// Delete file from Cloudinary
const deleteFile = async ({ public_id, resource_type }) => {
	if (!public_id || !resource_type) {
		throw ApiError.badRequest('public_id and resource_type are required to delete a file');
	}

	try {
		const result = await cloudinary.uploader.destroy(public_id, { resource_type });
		if (result.result !== 'ok' && result.result !== 'not found') {
			throw new ApiError(
				500,
				`Cloudinary did not confirm deletion of "${public_id}" (result: ${result.result})`
			);
		}
		return result;
	} catch (error) {
		console.error('Error deleting file from Cloudinary: ', error);
		throw new ApiError(500, `Failed to delete file "${public_id}" from Cloudinary`, [
			error.message,
		]);
	}
};

// Bulk delete files from Cloudinary
const deleteFiles = async (files) => {
	if (!files || files.length === 0) return;

	try {
		// Separate files by resource type for bulk deletion API
		const publicIdsByResourceType = files.reduce((acc, file) => {
			const type = file.resource_type || 'image';
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push(file.public_id);
			return acc;
		}, {});

		for (const resource_type in publicIdsByResourceType) {
			await cloudinary.api.delete_resources(publicIdsByResourceType[resource_type], {
				resource_type,
			});
		}
	} catch (error) {
		console.error('Error during bulk file deletion from Cloudinary: ', error);
		// Don't throw an error that stops the flow, just log it.
		// The primary operation (e.g., deleting a fest) should still succeed.
	}
};

export {
	initializeCloudinary,
	checkCloudinaryConnection,
	uploadFile,
	uploadResume,
	deleteFile,
	deleteFiles,
};
