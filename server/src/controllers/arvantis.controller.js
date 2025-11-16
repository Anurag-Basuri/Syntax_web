import Arvantis from '../models/arvantis.model.js';
import Event from '../models/event.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadFile, deleteFile, deleteFiles } from '../utils/cloudinary.js';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';

/**
 * Helper: resolve fest by id / slug / year
 *
 * - Returns a mongoose document (not .lean()) so callers can modify & save.
 */
const findFestBySlugOrYear = async (identifier, populate = false) => {
	if (!identifier) throw new ApiError.BadRequest('Fest identifier is required');

	const idStr = String(identifier).trim();

	// try by ObjectId first
	if (mongoose.isValidObjectId(idStr)) {
		let q = Arvantis.findById(idStr);
		if (populate) q = q.populate({ path: 'events', select: 'title eventDate category slug' });
		const doc = await q.exec();
		if (doc) return doc;
		// fallthrough
	}

	// year (4 digit) or slug
	const isYear = /^\d{4}$/.test(idStr);
	const query = isYear ? { year: parseInt(idStr, 10) } : { slug: idStr };

	let q = Arvantis.findOne(query);
	if (populate) q = q.populate({ path: 'events', select: 'title eventDate category slug' });
	const fest = await q.exec();
	if (!fest) throw new ApiError.NotFound(`Fest with identifier '${identifier}' not found.`);
	return fest;
};

// Get landing page data (current or most recent completed)
const getLandingPageData = asyncHandler(async (req, res) => {
	const currentYear = new Date().getFullYear();
	let fest = await Arvantis.findOne({
		year: currentYear,
		status: { $in: ['upcoming', 'ongoing'] },
	})
		.select('name year slug description status partners poster gallery')
		.exec();

	if (!fest) {
		fest = await Arvantis.findOne({ status: 'completed' })
			.sort({ year: -1 })
			.select('name year slug description status poster gallery')
			.exec();
	}

	if (!fest) {
		return ApiResponse.success(res, null, 'No active or past fest data available.');
	}

	return ApiResponse.success(res, fest, 'Landing page data retrieved successfully.');
});

// Create a new fest
const createFest = asyncHandler(async (req, res) => {
	const { year, description, startDate, endDate, status, name, location } = req.body;

	if (!year || !startDate || !endDate) {
		throw new ApiError.BadRequest('year, startDate and endDate are required');
	}

	const y = parseInt(year, 10);
	if (Number.isNaN(y)) throw new ApiError.BadRequest('Invalid year value');

	// ensure no duplicate year
	const exists = await Arvantis.findOne({ year: y }).lean().exec();
	if (exists) throw new ApiError.Conflict(`A fest for the year ${y} already exists.`);

	const fest = await Arvantis.create({
		name: name || 'Arvantis',
		year: y,
		description,
		startDate,
		endDate,
		status,
		location,
	});

	return ApiResponse.success(res, fest, 'Fest created successfully', 201);
});

// Get paginated fests
const getAllFests = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10, sortBy = 'year', sortOrder = 'desc' } = req.query;
	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
		lean: true,
	};

	const aggregate = Arvantis.aggregate([
		{
			$project: {
				name: 1,
				year: 1,
				slug: 1,
				status: 1,
				startDate: 1,
				endDate: 1,
				poster: 1,
				totalPartners: { $size: { $ifNull: ['$partners', []] } },
				totalEvents: { $size: { $ifNull: ['$events', []] } },
			},
		},
	]);

	const result = await Arvantis.aggregatePaginate(aggregate, options);
	return ApiResponse.paginated(res, result.docs, result, 'Fests retrieved successfully');
});

// Get fest details
const getFestDetails = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier, true);
	return ApiResponse.success(res, fest, 'Fest details retrieved successfully');
});

// Update fest details (admin)
const updateFestDetails = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier);

	// prevent changing critical fields via this route
	['name', 'location', 'slug', 'year'].forEach((k) => {
		if (k in req.body) delete req.body[k];
	});

	Object.assign(fest, req.body);
	await fest.save({ validateBeforeSave: true });
	return ApiResponse.success(res, fest, 'Fest details updated successfully');
});

// Delete fest and associated media
const deleteFest = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier);

	// collect media to delete
	const mediaToDelete = [];

	if (fest.poster?.publicId) {
		mediaToDelete.push({
			public_id: fest.poster.publicId,
			resource_type: fest.poster.resource_type || 'image',
		});
	}
	if (fest.heroMedia?.publicId) {
		mediaToDelete.push({
			public_id: fest.heroMedia.publicId,
			resource_type: fest.heroMedia.resource_type || 'image',
		});
	}
	(fest.gallery || []).forEach((g) => {
		if (g?.publicId)
			mediaToDelete.push({
				public_id: g.publicId,
				resource_type: g.resource_type || 'image',
			});
	});
	(fest.partners || []).forEach((p) => {
		if (p.logo?.publicId)
			mediaToDelete.push({
				public_id: p.logo.publicId,
				resource_type: p.logo.resource_type || 'image',
			});
	});

	// attempt cloudinary deletions (best-effort)
	if (mediaToDelete.length > 0) {
		try {
			await deleteFiles(mediaToDelete);
		} catch (err) {
			// log and continue - deletion should not block fest deletion
			/* eslint-disable no-console */
			console.warn('Cloudinary bulk delete warning:', err.message || err);
			/* eslint-enable no-console */
		}
	}

	// delete fest doc
	await Arvantis.findOneAndDelete({ _id: fest._id }).exec();
	return ApiResponse.success(res, null, 'Fest and associated media deleted successfully', 204);
});

// Add partner (expects multer middleware to provide req.file as "logo")
const addPartner = asyncHandler(async (req, res) => {
	const identifier = req.params.identifier;
	const fest = await findFestBySlugOrYear(identifier);

	// validate presence of name
	const name = req.body.name || req.body.partnerName;
	if (!name) throw new ApiError.BadRequest('Partner name is required.');

	// multer should provide req.file
	if (!req.file) throw new ApiError.BadRequest('Partner logo file is required (field "logo").');

	// upload logo
	const uploaded = await uploadFile(req.file, { folder: `arvantis/${fest.year}/partners` });

	const partner = {
		name: name.trim(),
		website: req.body.website ? String(req.body.website).trim() : undefined,
		tier: req.body.tier || req.body.type || undefined,
		description: req.body.description ? String(req.body.description).trim() : undefined,
		logo: {
			url: uploaded.url,
			publicId: uploaded.publicId,
			resource_type: uploaded.resource_type,
			caption: req.body.logoCaption || undefined,
		},
	};

	fest.partners.push(partner);
	await fest.save();
	// return the newly added partner (last element)
	const added = fest.partners[fest.partners.length - 1];
	return ApiResponse.success(res, added, 'Partner added successfully', 201);
});

// Remove partner by partnerName (encoded in URL)
const removePartner = asyncHandler(async (req, res) => {
	const { identifier, partnerName } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	const decoded = decodeURIComponent(partnerName);
	const idx = fest.partners.findIndex((p) => p.name === decoded);
	if (idx === -1) throw new ApiError.NotFound(`Partner '${decoded}' not found.`);

	const [removed] = fest.partners.splice(idx, 1);
	if (removed.logo?.publicId) {
		try {
			await deleteFile({
				public_id: removed.logo.publicId,
				resource_type: removed.logo.resource_type || 'image',
			});
		} catch (err) {
			// log and continue
			/* eslint-disable no-console */
			console.warn('Failed to delete partner logo from Cloudinary:', err.message || err);
			/* eslint-enable no-console */
		}
	}
	await fest.save();
	return ApiResponse.success(res, null, 'Partner removed successfully');
});

// Link an event to the fest
const linkEventToFest = asyncHandler(async (req, res) => {
	const { eventId } = req.body;
	const fest = await findFestBySlugOrYear(req.params.identifier);

	if (!eventId || !mongoose.isValidObjectId(eventId))
		throw new ApiError.BadRequest('A valid eventId is required.');
	const eventExists = await Event.findById(eventId).lean().exec();
	if (!eventExists) throw new ApiError.NotFound('Event not found with the provided ID.');

	// avoid duplicates
	if ((fest.events || []).some((e) => String(e) === String(eventId))) {
		throw new ApiError.Conflict('This event is already linked to the fest.');
	}
	fest.events.push(eventId);
	await fest.save();
	return ApiResponse.success(res, fest.events, 'Event linked successfully');
});

// Unlink an event from fest
const unlinkEventFromFest = asyncHandler(async (req, res) => {
	const { identifier, eventId } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	if (!mongoose.isValidObjectId(eventId))
		throw new ApiError.BadRequest('A valid eventId is required.');
	fest.events = (fest.events || []).filter((e) => String(e) !== String(eventId));
	await fest.save();
	return ApiResponse.success(res, fest.events, 'Event unlinked successfully');
});

// Update fest poster (expects multer middleware to provide req.file "poster")
const updateFestPoster = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	if (!req.file) throw new ApiError.BadRequest('Poster file is required (field "poster").');

	// delete existing poster if present
	if (fest.poster?.publicId) {
		try {
			await deleteFile({
				public_id: fest.poster.publicId,
				resource_type: fest.poster.resource_type || 'image',
			});
		} catch (err) {
			/* eslint-disable no-console */
			console.warn('Failed to delete previous poster from Cloudinary:', err.message || err);
			/* eslint-enable no-console */
		}
	}

	const uploaded = await uploadFile(req.file, { folder: `arvantis/${fest.year}` });
	fest.poster = {
		url: uploaded.url,
		publicId: uploaded.publicId,
		resource_type: uploaded.resource_type,
		caption: req.body.caption || undefined,
	};
	await fest.save();
	return ApiResponse.success(res, fest.poster, 'Fest poster updated successfully');
});

// Add gallery media (expects req.files)
const addGalleryMedia = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	if (!req.files || req.files.length === 0)
		throw new ApiError.BadRequest('At least one media file is required.');

	const uploadPromises = req.files.map((f) =>
		uploadFile(f, { folder: `arvantis/${fest.year}/gallery` })
	);
	const uploaded = await Promise.all(uploadPromises);

	const items = uploaded.map((u) => ({
		url: u.url,
		publicId: u.publicId,
		resource_type: u.resource_type,
	}));

	fest.gallery.push(...items);
	await fest.save();
	return ApiResponse.success(res, items, 'Gallery media added successfully', 201);
});

// Remove gallery media by publicId
const removeGalleryMedia = asyncHandler(async (req, res) => {
	const { identifier, publicId } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	const idx = (fest.gallery || []).findIndex((g) => g.publicId === publicId);
	if (idx === -1) throw new ApiError.NotFound('Media item not found in the gallery.');

	const [removed] = fest.gallery.splice(idx, 1);
	try {
		await deleteFile({
			public_id: removed.publicId,
			resource_type: removed.resource_type || 'image',
		});
	} catch (err) {
		/* eslint-disable no-console */
		console.warn('Failed to delete gallery item from Cloudinary:', err.message || err);
		/* eslint-enable no-console */
	}
	await fest.save();
	return ApiResponse.success(res, null, 'Gallery media removed successfully');
});

// Export fests as CSV
const exportFestsCSV = asyncHandler(async (req, res) => {
	const fests = await Arvantis.find().sort({ year: -1 }).lean().exec();
	if (!fests || fests.length === 0) throw new ApiError.NotFound('No fest data to export.');

	const fields = [
		{ label: 'Year', value: 'year' },
		{ label: 'Name', value: 'name' },
		{ label: 'Status', value: 'status' },
		{ label: 'Start Date', value: (row) => row.startDate?.toISOString() || '' },
		{ label: 'End Date', value: (row) => row.endDate?.toISOString() || '' },
		{ label: 'Events Count', value: (row) => (row.events || []).length },
		{ label: 'Partners Count', value: (row) => (row.partners || []).length },
	];
	const parser = new Parser({ fields });
	const csv = parser.parse(fests);

	const filename = `arvantis-fests-export-${new Date().toISOString()}.csv`;
	res.header('Content-Type', 'text/csv; charset=utf-8');
	res.attachment(filename);
	res.send(csv);
});

// High level statistics
const getFestStatistics = asyncHandler(async (req, res) => {
	const stats = await Arvantis.aggregate([
		{
			$facet: {
				totalFests: [{ $count: 'count' }],
				statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
				totalPartners: [
					{ $project: { partnerCount: { $size: { $ifNull: ['$partners', []] } } } },
					{ $group: { _id: null, total: { $sum: '$partnerCount' } } },
				],
				totalEvents: [
					{ $project: { eventCount: { $size: { $ifNull: ['$events', []] } } } },
					{ $group: { _id: null, total: { $sum: '$eventCount' } } },
				],
			},
		},
		{
			$project: {
				totalFests: { $arrayElemAt: ['$totalFests.count', 0] },
				statusCounts: '$statusCounts',
				totalPartners: { $arrayElemAt: ['$totalPartners.total', 0] },
				totalEvents: { $arrayElemAt: ['$totalEvents.total', 0] },
			},
		},
	]).exec();

	const s = stats[0] || {};
	const formatted = {
		totalFests: s.totalFests || 0,
		totalPartners: s.totalPartners || 0,
		totalEvents: s.totalEvents || 0,
		statusCounts: (s.statusCounts || []).reduce((acc, cur) => {
			acc[cur._id] = cur.count;
			return acc;
		}, {}),
	};
	return ApiResponse.success(res, formatted, 'Fest statistics retrieved successfully');
});

// Analytics over years
const getFestAnalytics = asyncHandler(async (req, res) => {
	const analytics = await Arvantis.aggregate([
		{ $sort: { year: 1 } },
		{
			$project: {
				_id: 0,
				year: '$year',
				eventCount: { $size: { $ifNull: ['$events', []] } },
				partnerCount: { $size: { $ifNull: ['$partners', []] } },
				sponsorCount: {
					$size: {
						$filter: {
							input: { $ifNull: ['$partners', []] },
							as: 'p',
							cond: { $eq: ['$$p.tier', 'sponsor'] },
						},
					},
				},
				collaboratorCount: {
					$size: {
						$filter: {
							input: { $ifNull: ['$partners', []] },
							as: 'p',
							cond: { $eq: ['$$p.tier', 'collaborator'] },
						},
					},
				},
			},
		},
	]).exec();

	return ApiResponse.success(res, analytics, 'Fest analytics retrieved successfully');
});

// Generate single fest report
const generateFestReport = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier, true);
	const report = {
		festDetails: {
			name: fest.name,
			year: fest.year,
			status: fest.status,
			startDate: fest.startDate,
			endDate: fest.endDate,
			location: fest.location || null,
		},
		events: fest.events || [],
		partners: (fest.partners || []).map((p) => ({
			name: p.name,
			tier: p.tier,
			website: p.website,
		})),
	};
	return ApiResponse.success(res, report, 'Fest report generated successfully');
});

export {
	getLandingPageData,
	createFest,
	getAllFests,
	getFestDetails,
	updateFestDetails,
	deleteFest,
	addPartner,
	removePartner,
	linkEventToFest,
	unlinkEventFromFest,
	updateFestPoster,
	addGalleryMedia,
	removeGalleryMedia,
	exportFestsCSV,
	getFestStatistics,
	getFestAnalytics,
	generateFestReport,
};
