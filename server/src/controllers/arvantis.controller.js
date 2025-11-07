import Arvantis from '../models/arvantis.model.js';
import Event from '../models/event.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadFile, deleteFile, deleteFiles } from '../utils/cloudinary.js';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';

// --- Helper Function to find a fest by slug or year ---
const findFestBySlugOrYear = async (identifier, populate = false) => {
	const query = /^\d{4}$/.test(identifier) ? { year: identifier } : { slug: identifier };
	let festQuery = Arvantis.findOne(query);

	if (populate) {
		festQuery = festQuery.populate({
			path: 'events',
			select: 'name eventDate type',
		});
	}

	const fest = await festQuery;
	if (!fest) {
		throw new ApiError(404, `Fest with identifier '${identifier}' not found.`);
	}
	return fest;
};

// --- Frontend-Specific Controllers ---

// Get landing page data: current or most recent fest
export const getLandingPageData = asyncHandler(async (req, res) => {
	const currentYear = new Date().getFullYear();
	let fest;

	// 1. Try to find the current year's fest if it's upcoming or ongoing
	fest = await Arvantis.findOne({
		year: currentYear,
		status: { $in: ['upcoming', 'ongoing'] },
	}).select('name year slug description status poster gallery');

	// 2. If not found, find the most recent 'completed' fest
	if (!fest) {
		fest = await Arvantis.findOne({ status: 'completed' })
			.sort({ year: -1 })
			.select('name year slug description status poster gallery');
	}

	if (!fest) {
		return ApiResponse.success(res, null, 'No active or past fest data available.');
	}

	return ApiResponse.success(res, fest, 'Landing page data retrieved successfully.');
});

// --- Core Fest Management ---

// Create a new Arvantis fest
export const createFest = asyncHandler(async (req, res) => {
	const { name, year, description, startDate, endDate, status } = req.body;

	const existingFest = await Arvantis.findOne({ year });
	if (existingFest) {
		throw new ApiError(409, `A fest for the year ${year} already exists.`);
	}

	const fest = await Arvantis.create({ name, year, description, startDate, endDate, status });
	return ApiResponse.success(res, fest, 'Fest created successfully', 201);
});

// Get all fests with pagination
export const getAllFests = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10, sortBy = 'year', sortOrder = 'desc' } = req.query;
	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
		lean: true,
	};

	const aggregate = Arvantis.aggregate([
		{ $project: { name: 1, year: 1, slug: 1, status: 1, startDate: 1, endDate: 1 } },
	]);
	const fests = await Arvantis.aggregatePaginate(aggregate, options);

	return ApiResponse.paginated(res, fests.docs, fests, 'Fests retrieved successfully');
});

// Get fest details by slug or year
export const getFestDetails = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier, true);
	return ApiResponse.success(res, fest, 'Fest details retrieved successfully');
});

// Update fest details
export const updateFestDetails = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier);
	Object.assign(fest, req.body);
	await fest.save({ validateBeforeSave: true });
	return ApiResponse.success(res, fest, 'Fest details updated successfully');
});

// Delete a fest and all associated media
export const deleteFest = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier);

	// Collect all public_ids for associated media
	const mediaToDelete = [];
	if (fest.poster?.publicId) mediaToDelete.push(fest.poster.publicId);
	fest.gallery.forEach((item) => mediaToDelete.push(item.publicId));
	fest.partners.forEach((p) => {
		if (p.logo?.publicId) mediaToDelete.push(p.logo.publicId);
	});

	// Bulk delete from Cloudinary if there are any files
	if (mediaToDelete.length > 0) {
		await deleteFiles(mediaToDelete);
	}

	await Arvantis.findByIdAndDelete(fest._id);
	return ApiResponse.success(
		res,
		null,
		'Fest and all associated media deleted successfully',
		204
	);
});

// --- Partner Management ---

// Add a new partner (sponsor or collaborator) to a fest
export const addPartner = asyncHandler(async (req, res) => {
	const { name, website, type, tier } = req.body;
	const fest = await findFestBySlugOrYear(req.params.identifier);

	if (!req.file) throw new ApiError(400, 'Partner logo is required.');

	const logoFile = await uploadFile(req.file, { folder: `arvantis/${fest.year}/partners` });
	const newPartner = {
		name,
		website,
		type,
		tier,
		logo: { url: logoFile.secure_url, publicId: logoFile.public_id },
	};

	fest.partners.push(newPartner);
	await fest.save();
	return ApiResponse.success(res, fest.partners, 'Partner added successfully', 201);
});

// Remove a partner from a fest
export const removePartner = asyncHandler(async (req, res) => {
	const { identifier, partnerName } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	const partnerIndex = fest.partners.findIndex((p) => p.name === partnerName);
	if (partnerIndex === -1) {
		throw new ApiError(404, `Partner '${partnerName}' not found.`);
	}

	const [removedPartner] = fest.partners.splice(partnerIndex, 1);
	if (removedPartner.logo?.publicId) {
		await deleteFile(removedPartner.logo.publicId);
	}
	await fest.save();

	return ApiResponse.success(res, null, 'Partner removed successfully');
});

// --- Event Linking ---

// Link an event to a fest
export const linkEventToFest = asyncHandler(async (req, res) => {
	const { eventId } = req.body;
	const fest = await findFestBySlugOrYear(req.params.identifier);

	if (!mongoose.isValidObjectId(eventId) || !(await Event.findById(eventId))) {
		throw new ApiError(404, 'Event not found with the provided ID.');
	}
	if (fest.events.includes(eventId)) {
		throw new ApiError(409, 'This event is already linked to the fest.');
	}

	fest.events.push(eventId);
	await fest.save();
	return ApiResponse.success(res, fest.events, 'Event linked successfully');
});

// Unlink an event from a fest
export const unlinkEventFromFest = asyncHandler(async (req, res) => {
	const { identifier, eventId } = req.params;
	const fest = await findFestBySlugOrYear(identifier);
	fest.events.pull(eventId);
	await fest.save();
	return ApiResponse.success(res, fest.events, 'Event unlinked successfully');
});

// --- Media Management (Poster & Gallery) ---

// Update fest poster
export const updateFestPoster = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier);
	if (!req.file) throw new ApiError(400, 'Poster file is required.');

	if (fest.poster?.publicId) await deleteFile(fest.poster.publicId);

	const posterFile = await uploadFile(req.file, { folder: `arvantis/${fest.year}` });
	fest.poster = { url: posterFile.secure_url, publicId: posterFile.public_id };
	await fest.save();

	return ApiResponse.success(res, fest.poster, 'Fest poster updated successfully');
});

// Add media items to the gallery
export const addGalleryMedia = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier);
	if (!req.files?.length) throw new ApiError(400, 'At least one media file is required.');

	const uploadPromises = req.files.map((file) =>
		uploadFile(file, { folder: `arvantis/${fest.year}/gallery` })
	);
	const uploadedFiles = await Promise.all(uploadPromises);

	const newMediaItems = uploadedFiles.map((file) => ({
		url: file.secure_url,
		publicId: file.public_id,
		resource_type: file.resource_type,
	}));

	fest.gallery.push(...newMediaItems);
	await fest.save();
	return ApiResponse.success(res, fest.gallery, 'Gallery media added successfully', 201);
});

// Remove a media item from the gallery
export const removeGalleryMedia = asyncHandler(async (req, res) => {
	const { identifier, publicId } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	const mediaIndex = fest.gallery.findIndex((item) => item.publicId === publicId);
	if (mediaIndex === -1) throw new ApiError(404, 'Media item not found in the gallery.');

	await deleteFile(publicId);
	fest.gallery.splice(mediaIndex, 1);
	await fest.save();

	return ApiResponse.success(res, null, 'Gallery media removed successfully');
});

// --- Data Export ---

// Export all fests data as CSV
export const exportFestsCSV = asyncHandler(async (req, res) => {
	const fests = await Arvantis.find().sort({ year: -1 }).lean();
	if (fests.length === 0) throw new ApiError(404, 'No fest data to export.');

	const fields = [
		{ label: 'Year', value: 'year' },
		{ label: 'Name', value: 'name' },
		{ label: 'Slug', value: 'slug' },
		{ label: 'Status', value: 'status' },
		{ label: 'Start Date', value: 'startDate' },
		{ label: 'End Date', value: 'endDate' },
		{ label: 'Events Count', value: 'events.length' },
	];
	const json2csvParser = new Parser({ fields });
	const csv = json2csvParser.parse(fests);

	res.header('Content-Type', 'text/csv');
	res.attachment(`arvantis-fests-export-${new Date().toISOString()}.csv`);
	res.send(csv);
}); 

// 
const statistics = asyncHandler(async (req, res) => {
    // Placeholder for future statistics implementation
    return ApiResponse.success(res, {}, 'Statistics endpoint is under construction.');
});
