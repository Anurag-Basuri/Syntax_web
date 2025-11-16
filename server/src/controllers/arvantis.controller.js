import Arvantis from '../models/arvantis.model.js';
import Event from '../models/event.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadFile, deleteFile, deleteFiles } from '../utils/cloudinary.js';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';

/* helpers */
const slugify = (str = '') =>
	String(str)
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^\w-]+/g, '')
		.replace(/--+/g, '-');

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

/* --- Landing / Latest fest improved --- */
// Get latest fest (ongoing/upcoming preferred, else latest completed, else most recent)
const getLatestFest = asyncHandler(async (req, res) => {
	const currentYear = new Date().getFullYear();

	// Prefer current year's upcoming/ongoing; fallback to latest completed; finally most recent by year
	let fest =
		(await Arvantis.findOne({
			year: currentYear,
			status: { $in: ['upcoming', 'ongoing'] },
		})
			.populate({ path: 'events', select: 'title eventDate category slug description' })
			.exec()) ||
		(await Arvantis.findOne({ status: 'completed' })
			.sort({ year: -1 })
			.populate({ path: 'events', select: 'title eventDate category slug description' })
			.exec()) ||
		(await Arvantis.findOne()
			.sort({ year: -1 })
			.populate({ path: 'events', select: 'title eventDate category slug description' })
			.exec());

	if (!fest) return ApiResponse.success(res, null, 'No fest data available.');

	// build rich payload (ensure no sensitive/large fields are leaked)
	const obj = fest.toObject ? fest.toObject() : fest;
	const hero =
		(obj.hero && { ...obj.hero }) ||
		(obj.poster && { ...obj.poster }) ||
		(obj.gallery && obj.gallery.length ? obj.gallery[0] : null);

	const durationDays =
		obj.startDate && obj.endDate
			? Math.round(
					(new Date(obj.endDate) - new Date(obj.startDate)) / (1000 * 60 * 60 * 24)
				) + 1
			: null;

	const analytics = {
		totalPartners: Array.isArray(obj.partners) ? obj.partners.length : 0,
		totalEvents: Array.isArray(obj.events) ? obj.events.length : 0,
		upcomingEventsCount: Array.isArray(obj.events)
			? obj.events.filter((e) => e.eventDate && new Date(e.eventDate) >= new Date()).length
			: 0,
	};

	const payload = {
		fest: {
			_id: obj._id,
			name: obj.name,
			year: obj.year,
			slug: obj.slug,
			tagline: obj.tagline || null,
			description: obj.description || null,
			startDate: obj.startDate || null,
			endDate: obj.endDate || null,
			status: obj.status,
			location: obj.location || null,
			contactEmail: obj.contactEmail || null,
			themeColors: obj.themeColors || {},
			socialLinks: obj.socialLinks || {},
			visibility: obj.visibility || 'public',
			tracks: obj.tracks || [],
			faqs: obj.faqs || [],
		},
		hero,
		events: obj.events || [],
		partners: (obj.partners || []).map((p) => ({
			name: p.name,
			tier: p.tier,
			website: p.website,
			logo: p.logo ? { url: p.logo.url, caption: p.logo.caption } : undefined,
		})),
		computed: {
			durationDays,
			computedStatus: fest.computedStatus || obj.status,
			...analytics,
		},
	};

	return ApiResponse.success(res, payload, 'Latest fest retrieved successfully');
});

/* --- Existing CRUD controllers (create/get/update/delete etc) --- */
/* Create a new fest */
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

/* Get paginated fests */
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

/* Get fest details */
const getFestDetails = asyncHandler(async (req, res) => {
	const fest = await findFestBySlugOrYear(req.params.identifier, true);
	return ApiResponse.success(res, fest, 'Fest details retrieved successfully');
});

/* Update fest details (admin) */
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

/* Delete fest and associated media */
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
			console.warn('Cloudinary bulk delete warning:', err.message || err);
		}
	}

	// delete fest doc
	await Arvantis.findOneAndDelete({ _id: fest._id }).exec();
	return ApiResponse.success(res, null, 'Fest and associated media deleted successfully', 204);
});

/* Add partner (expects multer middleware to provide req.file as "logo") */
const addPartner = asyncHandler(async (req, res) => {
	const identifier = req.params.identifier;
	const fest = await findFestBySlugOrYear(identifier);

	const name = req.body.name || req.body.partnerName;
	if (!name) throw new ApiError.BadRequest('Partner name is required.');
	if (!req.file) throw new ApiError.BadRequest('Partner logo file is required (field "logo").');

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
	const added = fest.partners[fest.partners.length - 1];
	return ApiResponse.success(res, added, 'Partner added successfully', 201);
});

/* Remove partner */
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
			console.warn('Failed to delete partner logo from Cloudinary:', err.message || err);
		}
	}
	await fest.save();
	return ApiResponse.success(res, null, 'Partner removed successfully');
});

/* Link / Unlink events */
const linkEventToFest = asyncHandler(async (req, res) => {
	const { eventId } = req.body;
	const fest = await findFestBySlugOrYear(req.params.identifier);

	if (!eventId || !mongoose.isValidObjectId(eventId))
		throw new ApiError.BadRequest('A valid eventId is required.');
	const eventExists = await Event.findById(eventId).lean().exec();
	if (!eventExists) throw new ApiError.NotFound('Event not found with the provided ID.');

	if ((fest.events || []).some((e) => String(e) === String(eventId))) {
		throw new ApiError.Conflict('This event is already linked to the fest.');
	}
	fest.events.push(eventId);
	await fest.save();
	return ApiResponse.success(res, fest.events, 'Event linked successfully');
});

const unlinkEventFromFest = asyncHandler(async (req, res) => {
	const { identifier, eventId } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	if (!mongoose.isValidObjectId(eventId))
		throw new ApiError.BadRequest('A valid eventId is required.');
	fest.events = (fest.events || []).filter((e) => String(e) !== String(eventId));
	await fest.save();
	return ApiResponse.success(res, fest.events, 'Event unlinked successfully');
});

// --- Media management controllers --- //
// Gallery management
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

// Remove gallery media item
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
		console.warn('Failed to delete gallery item from Cloudinary:', err.message || err);
	}
	await fest.save();
	return ApiResponse.success(res, null, 'Gallery media removed successfully');
});

// Fest poster management
const addFestPoster = asyncHandler(async (req, res) => {
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

// Remove fest poster
const removeFestPoster = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	if (!fest.poster || !fest.poster.publicId) {
		throw new ApiError.BadRequest('No poster to remove for this fest.');
	}

	try {
		await deleteFile({
			public_id: fest.poster.publicId,
			resource_type: fest.poster.resource_type || 'image',
		});
	} catch (err) {
		console.warn('Failed to delete poster from Cloudinary:', err.message || err);
	}

	fest.poster = undefined;
	await fest.save();
	return ApiResponse.success(res, null, 'Fest poster removed successfully');
});

// Fest hero management
const updateFestHero = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	if (!req.file) throw new ApiError.BadRequest('hero file is required (field "hero").');

	const uploaded = await uploadFile(req.file, { folder: `arvantis/${fest.year}/hero` });

	if (fest.heroMedia?.publicId) {
		try {
			await deleteFile({
				public_id: fest.heroMedia.publicId,
				resource_type: fest.heroMedia.resource_type || 'image',
			});
		} catch (err) {
			console.warn('Failed to delete previous hero media:', err.message || err);
		}
	}

	fest.heroMedia = {
		url: uploaded.url,
		publicId: uploaded.publicId,
		resource_type: uploaded.resource_type,
		caption: req.body.caption || undefined,
	};
	await fest.save();
	return ApiResponse.success(res, fest.heroMedia, 'Hero media updated successfully', 200);
});

// Remove fest hero
const removeFestHero = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);
	if (!fest.heroMedia || !fest.heroMedia.publicId) {
		throw new ApiError.BadRequest('No hero media to remove for this fest.');
	}

	try {
		await deleteFile({
			public_id: fest.heroMedia.publicId,
			resource_type: fest.heroMedia.resource_type || 'image',
		});
	} catch (err) {
		console.warn('Failed to delete hero media from Cloudinary:', err.message || err);
	}

	fest.heroMedia = undefined;
	await fest.save();
	return ApiResponse.success(res, null, 'Fest hero media removed successfully');
});

// Update partner details (with optional logo update)
const updatePartner = asyncHandler(async (req, res) => {
	const { identifier, partnerName } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	const decoded = decodeURIComponent(partnerName);
	const idx = fest.partners.findIndex((p) => p.name === decoded);
	if (idx === -1) throw new ApiError.NotFound(`Partner '${decoded}' not found.`);

	const partner = fest.partners[idx];

	if (req.file) {
		const uploaded = await uploadFile(req.file, { folder: `arvantis/${fest.year}/partners` });
		if (partner.logo?.publicId) {
			try {
				await deleteFile({
					public_id: partner.logo.publicId,
					resource_type: partner.logo.resource_type || 'image',
				});
			} catch (err) {
				console.warn('Failed to delete previous partner logo:', err.message || err);
			}
		}
		partner.logo = {
			url: uploaded.url,
			publicId: uploaded.publicId,
			resource_type: uploaded.resource_type,
			caption: req.body.logoCaption || partner.logo?.caption,
		};
	}

	if (req.body.name) partner.name = String(req.body.name).trim();
	if (req.body.website) partner.website = String(req.body.website).trim();
	if (req.body.tier) partner.tier = req.body.tier;
	if (req.body.description) partner.description = String(req.body.description).trim();

	fest.markModified('partners');
	await fest.save();
	return ApiResponse.success(res, partner, 'Partner updated successfully', 200);
});

// Reorder partners
const reorderPartners = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { order } = req.body;
	if (!Array.isArray(order))
		throw new ApiError.BadRequest('Order must be an array of partner names.');

	const fest = await findFestBySlugOrYear(identifier);
	const map = new Map((fest.partners || []).map((p) => [p.name, p]));
	const newArr = [];
	order.forEach((n) => {
		if (map.has(n)) {
			newArr.push(map.get(n));
			map.delete(n);
		}
	});
	for (const p of map.values()) newArr.push(p);

	fest.partners = newArr;
	await fest.save();
	return ApiResponse.success(res, fest.partners, 'Partners reordered successfully', 200);
});

// Reorder gallery media
const reorderGallery = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { order } = req.body;
	if (!Array.isArray(order))
		throw new ApiError.BadRequest('Order must be an array of publicIds.');

	const fest = await findFestBySlugOrYear(identifier);
	const map = new Map((fest.gallery || []).map((g) => [g.publicId, g]));
	const newArr = [];
	order.forEach((id) => {
		if (map.has(id)) {
			newArr.push(map.get(id));
			map.delete(id);
		}
	});
	for (const g of map.values()) newArr.push(g);

	fest.gallery = newArr;
	await fest.save();
	return ApiResponse.success(res, fest.gallery, 'Gallery reordered successfully', 200);
});

// Bulk delete media items (gallery, partner logos, poster, hero)
const bulkDeleteMedia = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { publicIds } = req.body;
	if (!Array.isArray(publicIds) || publicIds.length === 0)
		throw new ApiError.BadRequest('publicIds array is required.');

	const fest = await findFestBySlugOrYear(identifier);
	const toDelete = [];

	fest.gallery = (fest.gallery || []).filter((g) => {
		if (publicIds.includes(g.publicId)) {
			toDelete.push({ public_id: g.publicId, resource_type: g.resource_type || 'image' });
			return false;
		}
		return true;
	});

	fest.partners = (fest.partners || []).map((p) => {
		if (p.logo?.publicId && publicIds.includes(p.logo.publicId)) {
			toDelete.push({
				public_id: p.logo.publicId,
				resource_type: p.logo.resource_type || 'image',
			});
			return { ...(p.toObject ? p.toObject() : p), logo: undefined };
		}
		return p;
	});

	if (fest.poster?.publicId && publicIds.includes(fest.poster.publicId)) {
		toDelete.push({
			public_id: fest.poster.publicId,
			resource_type: fest.poster.resource_type || 'image',
		});
		fest.poster = undefined;
	}
	if (fest.heroMedia?.publicId && publicIds.includes(fest.heroMedia.publicId)) {
		toDelete.push({
			public_id: fest.heroMedia.publicId,
			resource_type: fest.heroMedia.resource_type || 'image',
		});
		fest.heroMedia = undefined;
	}

	if (toDelete.length > 0) {
		try {
			await deleteFiles(toDelete);
		} catch (err) {
			console.warn('bulkDeleteMedia: deleteFiles failed', err.message || err);
		}
	}

	await fest.save();
	return ApiResponse.success(
		res,
		{ removed: toDelete.length },
		'Media removed successfully',
		200
	);
});

// Duplicate fest (without media/events)
const duplicateFest = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { year } = req.body;
	if (!year) throw new ApiError.BadRequest('Target year is required.');
	const y = parseInt(year, 10);
	if (Number.isNaN(y)) throw new ApiError.BadRequest('Invalid year value');

	const exists = await Arvantis.findOne({ year: y }).lean().exec();
	if (exists) throw new ApiError.Conflict(`A fest for the year ${y} already exists.`);

	const fest = await findFestBySlugOrYear(identifier, false);
	const data = fest.toObject ? fest.toObject() : fest;
	const copy = {
		...data,
		_id: undefined,
		year: y,
		name: data.name ? `${data.name} ${y}` : `Arvantis ${y}`,
		startDate: null,
		endDate: null,
		poster: undefined,
		heroMedia: undefined,
		gallery: [],
		events: [],
		partners: (data.partners || []).map((p) => ({
			name: p.name,
			website: p.website,
			tier: p.tier,
			description: p.description,
		})),
	};

	const created = await Arvantis.create(copy);
	return ApiResponse.success(res, created, 'Fest duplicated (media/events not copied)', 201);
});

// Set fest status
const setFestStatus = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { status } = req.body;
	if (!status) throw new ApiError.BadRequest('Status is required.');
	if (!['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'].includes(status))
		throw new ApiError.BadRequest('Invalid status value.');

	const fest = await findFestBySlugOrYear(identifier);
	fest.status = status;
	await fest.save();
	return ApiResponse.success(res, fest, 'Fest status updated', 200);
});

// Update fest presentation (theme colors, social links)
const updatePresentation = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);

	const { themeColors, socialLinks } = req.body;
	if (themeColors && typeof themeColors === 'object') {
		fest.themeColors = { ...fest.themeColors, ...themeColors };
	}
	if (socialLinks && typeof socialLinks === 'object') {
		fest.socialLinks = { ...fest.socialLinks, ...socialLinks };
	}
	await fest.save();
	return ApiResponse.success(
		res,
		{ themeColors: fest.themeColors, socialLinks: fest.socialLinks },
		'Presentation updated',
		200
	);
});

// Export fests data as CSV
const exportFestsCSV = asyncHandler(async (req, res) => {
	const fests = await Arvantis.find().sort({ year: -1 }).lean().exec();
	if (!fests || fests.length === 0) throw new ApiError.NotFound('No fest data to export.');

	const fields = [
		{ label: 'Year', value: 'year' },
		{ label: 'Name', value: 'name' },
		{ label: 'Status', value: 'status' },
		{
			label: 'Start Date',
			value: (row) => (row.startDate ? new Date(row.startDate).toISOString() : ''),
		},
		{
			label: 'End Date',
			value: (row) => (row.endDate ? new Date(row.endDate).toISOString() : ''),
		},
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

// Fest statistics and analytics
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

// Fest yearly analytics
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

// Generate fest report
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

// Update social links
const updateSocialLinks = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);
	const incoming = req.body.socialLinks || req.body;
	if (!incoming || typeof incoming !== 'object')
		throw new ApiError.BadRequest('socialLinks object required.');
	const allowed = ['website', 'twitter', 'instagram', 'facebook', 'linkedin'];
	Object.keys(incoming).forEach((k) => {
		if (!allowed.includes(k)) delete incoming[k];
	});
	fest.socialLinks = { ...fest.socialLinks, ...incoming };
	await fest.save();
	return ApiResponse.success(res, fest.socialLinks, 'Social links updated', 200);
});

// Update theme colors
const updateThemeColors = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const fest = await findFestBySlugOrYear(identifier);
	const incoming = req.body.themeColors || req.body;
	if (!incoming || typeof incoming !== 'object')
		throw new ApiError.BadRequest('themeColors object required.');
	const allowed = ['primary', 'accent', 'bg'];
	Object.keys(incoming).forEach((k) => {
		if (!allowed.includes(k)) delete incoming[k];
	});
	fest.themeColors = { ...fest.themeColors, ...incoming };
	await fest.save();
	return ApiResponse.success(res, fest.themeColors, 'Theme colors updated', 200);
});

/* Tracks CRUD */
// Add track
const addTrack = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { title, description, color, key } = req.body;
	if (!title) throw new ApiError.BadRequest('Track title is required.');
	const fest = await findFestBySlugOrYear(identifier);
	const newKey = key ? String(key).trim() : slugify(title);
	// ensure unique key
	let candidate = newKey;
	let i = 0;
	while ((fest.tracks || []).some((t) => t.key === candidate)) {
		i += 1;
		candidate = `${newKey}-${i}`;
	}
	const track = {
		key: candidate,
		title: String(title).trim(),
		description: description || '',
		color: color || '',
	};
	fest.tracks.push(track);
	await fest.save();
	return ApiResponse.success(res, track, 'Track added', 201);
});

// Update track
const removeTrack = asyncHandler(async (req, res) => {
	const { identifier, trackKey } = req.params;
	const fest = await findFestBySlugOrYear(identifier);
	const before = (fest.tracks || []).length;
	fest.tracks = (fest.tracks || []).filter((t) => t.key !== trackKey);
	if (fest.tracks.length === before) throw new ApiError.NotFound('Track not found.');
	await fest.save();
	return ApiResponse.success(res, null, 'Track removed', 200);
});

/* FAQs CRUD */
// Add FAQ
const addFAQ = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { question, answer } = req.body;
	if (!question || !answer) throw new ApiError.BadRequest('question and answer are required.');
	const fest = await findFestBySlugOrYear(identifier);
	// push will create subdoc with _id
	fest.faqs.push({ question: String(question).trim(), answer: String(answer).trim() });
	await fest.save();
	const added = fest.faqs[fest.faqs.length - 1];
	return ApiResponse.success(res, added, 'FAQ added', 201);
});

// Remove FAQ
const removeFAQ = asyncHandler(async (req, res) => {
	const { identifier, faqId } = req.params;
	const fest = await findFestBySlugOrYear(identifier);
	const before = (fest.faqs || []).length;
	// use id removal if available
	if (fest.faqs.id) {
		const sub = fest.faqs.id(faqId);
		if (!sub) throw new ApiError.NotFound('FAQ not found.');
		sub.remove();
	} else {
		fest.faqs = (fest.faqs || []).filter((f) => String(f._id) !== String(faqId));
	}
	if ((fest.faqs || []).length === before) throw new ApiError.NotFound('FAQ not found.');
	await fest.save();
	return ApiResponse.success(res, null, 'FAQ removed', 200);
});

// Reorder FAQs
const reorderFAQs = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { order } = req.body;
	if (!Array.isArray(order)) throw new ApiError.BadRequest('order must be array of faq ids.');
	const fest = await findFestBySlugOrYear(identifier);
	const map = new Map((fest.faqs || []).map((f) => [String(f._id), f]));
	const newArr = [];
	order.forEach((id) => {
		if (map.has(String(id))) {
			newArr.push(map.get(String(id)));
			map.delete(String(id));
		}
	});
	for (const f of map.values()) newArr.push(f);
	fest.faqs = newArr;
	await fest.save();
	return ApiResponse.success(res, fest.faqs, 'FAQs reordered', 200);
});

/* Visibility */
const setVisibility = asyncHandler(async (req, res) => {
	const { identifier } = req.params;
	const { visibility } = req.body;
	if (!['public', 'private', 'unlisted'].includes(visibility))
		throw new ApiError.BadRequest('Invalid visibility.');
	const fest = await findFestBySlugOrYear(identifier);
	fest.visibility = visibility;
	await fest.save();
	return ApiResponse.success(res, { visibility: fest.visibility }, 'Visibility updated', 200);
});

/* export */
export {
	getLatestFest,
	createFest,
	getAllFests,
	getFestDetails,
	updateFestDetails,
	deleteFest,
	addPartner,
	removePartner,
	linkEventToFest,
	unlinkEventFromFest,
	addGalleryMedia,
	removeGalleryMedia,
	addFestPoster,
	removeFestPoster,
	updateFestHero,
	removeFestHero,
	updatePartner,
	reorderPartners,
	reorderGallery,
	bulkDeleteMedia,
	duplicateFest,
	setFestStatus,
	updatePresentation,
	exportFestsCSV,
	getFestStatistics,
	getFestAnalytics,
	generateFestReport,
	updateSocialLinks,
	updateThemeColors,
	addTrack,
	removeTrack,
	addFAQ,
	removeFAQ,
	reorderFAQs,
	setVisibility,
};
