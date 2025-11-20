import mongoose from 'mongoose';
import Event from '../models/event.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile, deleteFile, deleteFiles } from '../utils/cloudinary.js';
import { getHeroMedia } from '../utils/arvantisMedia.js';

/**
 * Helper: validate ObjectId and load event populateTickets: boolean - if true populate tickets
 * (admin usage), otherwise do not populate (public)
 */
const findEventById = async (id, { populateTickets = false } = {}) => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw ApiError.BadRequest('Invalid event ID format.');
	}
	let query = Event.findById(id);
	if (populateTickets) {
		query = query.populate({ path: 'tickets', select: 'fullName email ticketId status' });
	}
	const ev = await query.exec();
	if (!ev) throw ApiError.NotFound('Event not found.');
	return ev;
};

// Create a new event (admin)
const createEvent = asyncHandler(async (req, res) => {
	const {
		title,
		description,
		eventDate: eventDateRaw,
		eventTime,
		venue,
		room,
		organizer,
		category,
		subcategory,
		tags,
		totalSpots = 0,
		ticketPrice = 0,
		registrationOpenDate,
		registrationCloseDate,
		registration,
		status,
	} = req.body;

	// Basic required checks (also validated by route)
	if (!title || !description || !eventDateRaw || !venue || !category) {
		throw ApiError.BadRequest('Missing required event fields.');
	}

	const eventDate = new Date(eventDateRaw);
	if (Number.isNaN(eventDate.getTime())) throw ApiError.BadRequest('Invalid eventDate.');

	// Upload posters if present (req.files normalized by multer middleware)
	let uploadedPosters = [];
	try {
		uploadedPosters =
			Array.isArray(req.files) && req.files.length
				? await Promise.all(
						req.files.map((file) => uploadFile(file, { folder: 'events/posters' }))
					)
				: [];
	} catch (uploadErr) {
		// If some uploads succeeded and others failed, ensure we cleanup uploaded ones.
		if (Array.isArray(uploadedPosters) && uploadedPosters.length) {
			const toDelete = uploadedPosters.filter(Boolean).map((u) => ({
				public_id: u.publicId || u.public_id,
				resource_type: u.resource_type || u.resourceType || 'image',
			}));
			try {
				await deleteFiles(toDelete);
			} catch (e) {
				// Log and continue to surface the original upload error
				console.warn('Failed to clean up partially uploaded posters', e.message);
			}
		}
		throw uploadErr;
	}

	// Normalize posters into model shape
	const posters = (uploadedPosters || []).map((u) => ({
		url: u.url || u.secure_url || u.publicUrl || '',
		publicId: u.publicId || u.public_id,
		resource_type: u.resource_type || u.resourceType || 'image',
	}));

	// Normalize tags
	const normalizedTags = Array.isArray(tags)
		? tags.map((t) => String(t).trim()).filter(Boolean)
		: typeof tags === 'string' && tags.length
			? tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [];

	// Registration defaults & validation
	const regObj = registration && typeof registration === 'object' ? registration : {};
	const regMode = regObj.mode || 'none';
	const regExternalUrl = regObj.externalUrl || null;

	if (regMode === 'external' && !regExternalUrl) {
		// cleanup posters on validation error
		if (posters.length) {
			const toDelete = posters.map((p) => ({
				public_id: p.publicId,
				resource_type: p.resource_type || 'image',
			}));
			try {
				await deleteFiles(toDelete);
			} catch (e) {
				console.warn('Failed to clean up posters after validation error', e.message);
			}
		}
		throw ApiError.BadRequest(
			'registration.externalUrl is required when registration.mode is "external".'
		);
	}

	const eventDoc = {
		title: title.trim(),
		description: description.trim(),
		eventDate,
		eventTime: eventTime || undefined,
		venue: venue.trim(),
		room: room?.trim(),
		organizer: organizer?.trim(),
		category: category.trim(),
		subcategory: subcategory?.trim(),
		posters,
		tags: normalizedTags,
		totalSpots: Number(totalSpots) || 0,
		ticketPrice: Number(ticketPrice) || 0,
		registrationOpenDate: registrationOpenDate ? new Date(registrationOpenDate) : undefined,
		registrationCloseDate: registrationCloseDate ? new Date(registrationCloseDate) : undefined,
		registration: {
			mode: regMode,
			externalUrl: regExternalUrl,
			allowGuests: typeof regObj.allowGuests !== 'undefined' ? regObj.allowGuests : true,
			capacityOverride:
				typeof regObj.capacityOverride !== 'undefined'
					? regObj.capacityOverride
					: undefined,
		},
		status: status || 'upcoming',
	};

	let created;
	try {
		created = await Event.create(eventDoc);
	} catch (err) {
		// If creation fails, ensure uploaded posters are deleted from Cloudinary
		if (posters.length) {
			const toDelete = posters.map((p) => ({
				public_id: p.publicId,
				resource_type: p.resource_type || 'image',
			}));
			try {
				await deleteFiles(toDelete);
			} catch (e) {
				console.warn('Failed to clean up posters after Event.create error', e.message);
			}
		}
		throw err;
	}

	return ApiResponse.success(res, created, 'Event created successfully', 201);
});

// Get all events (public/admin) with filtering, pagination, sorting
const getAllEvents = asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 10,
		status,
		search,
		period,
		sortBy = 'eventDate',
		sortOrder = 'asc',
	} = req.query;

	const pipeline = [];
	const match = {};
	const now = new Date();

	if (search) match.$text = { $search: search.trim() };
	if (status) match.status = status;
	if (period === 'upcoming') match.eventDate = { $gte: now };
	if (period === 'past') match.eventDate = { $lt: now };

	if (Object.keys(match).length) pipeline.push({ $match: match });

	// Add lightweight fields for listing
	pipeline.push({
		$addFields: {
			ticketCount: { $size: { $ifNull: ['$tickets', []] } },
			isRegistrationOpen: {
				$let: {
					vars: {
						open: '$registrationOpenDate',
						close: '$registrationCloseDate',
						mode: '$registration.mode',
					},
					in: {
						$cond: [
							{ $eq: ['$$mode', 'none'] },
							false,
							{
								$and: [
									{
										$cond: [
											{ $ifNull: ['$$open', false] },
											{ $lte: ['$$open', now] },
											true,
										],
									},
									{
										$cond: [
											{ $ifNull: ['$$close', false] },
											{ $gte: ['$$close', now] },
											true,
										],
									},
								],
							},
						],
					},
				},
			},
		},
	});

	pipeline.push({
		$project: {
			title: 1,
			eventDate: 1,
			eventTime: 1,
			venue: 1,
			category: 1,
			status: 1,
			ticketPrice: 1,
			posters: { $slice: ['$posters', 1] },
			ticketCount: 1,
			'registration.mode': 1,
			'registration.externalUrl': 1,
			isRegistrationOpen: 1,
		},
	});

	pipeline.push({ $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1, _id: 1 } });

	const aggregate = Event.aggregate(pipeline);
	const options = { page: parseInt(page, 10), limit: parseInt(limit, 10), lean: true };

	const results = await Event.aggregatePaginate(aggregate, options);
	return ApiResponse.paginated(res, results.docs, results, 'Events retrieved successfully');
});

// Get single event (public)
// NOTE: do NOT populate tickets for public endpoint
const getEventById = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id, { populateTickets: false });
	return ApiResponse.success(res, event.toObject(), 'Event retrieved successfully');
});

// Update event details (admin)
const updateEventDetails = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id);

	// Merge registration updates carefully - support subdocument toObject and plain objects
	const existingRegistration =
		ev.registration && typeof ev.registration === 'object'
			? ev.registration && ev.registration.toObject
				? ev.registration.toObject()
				: ev.registration
			: {};

	if (req.body.registration) {
		ev.registration = { ...existingRegistration, ...req.body.registration };
	}

	// convenience flat fields
	if (typeof req.body.registrationMode !== 'undefined') {
		ev.registration = ev.registration || {};
		ev.registration.mode = req.body.registrationMode;
	}
	if (typeof req.body.externalUrl !== 'undefined') {
		ev.registration = ev.registration || {};
		ev.registration.externalUrl = req.body.externalUrl;
	}
	if (typeof req.body.capacityOverride !== 'undefined') {
		ev.registration = ev.registration || {};
		ev.registration.capacityOverride = req.body.capacityOverride;
	}
	if (typeof req.body.allowGuests !== 'undefined') {
		ev.registration = ev.registration || {};
		ev.registration.allowGuests = req.body.allowGuests;
	}

	// Prevent setting registration.mode to non-internal when tickets exist
	if (
		ev.tickets &&
		ev.tickets.length > 0 &&
		ev.registration &&
		ev.registration.mode !== 'internal'
	) {
		throw ApiError.BadRequest(
			'Cannot set registration.mode to non-internal while tickets exist. Remove tickets first.'
		);
	}

	// Apply other updatable fields
	const updatable = [
		'title',
		'description',
		'eventDate',
		'eventTime',
		'venue',
		'room',
		'organizer',
		'category',
		'subcategory',
		'totalSpots',
		'ticketPrice',
		'registrationOpenDate',
		'registrationCloseDate',
		'status',
		'tags',
	];
	updatable.forEach((k) => {
		if (typeof req.body[k] !== 'undefined') {
			// normalize strings
			if (k === 'tags') {
				// normalize tags array or comma string
				if (Array.isArray(req.body.tags)) {
					ev.tags = req.body.tags.map((t) => String(t).trim()).filter(Boolean);
				} else if (typeof req.body.tags === 'string') {
					ev.tags = req.body.tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean);
				}
			} else {
				ev[k] = typeof req.body[k] === 'string' ? req.body[k].trim() : req.body[k];
			}
		}
	});

	// Validate registration.externalUrl when mode is external (model also enforces)
	if (ev.registration?.mode === 'external' && !ev.registration?.externalUrl) {
		throw ApiError.BadRequest(
			'registration.externalUrl is required when registration.mode is "external".'
		);
	}

	const updated = await ev.save();
	return ApiResponse.success(res, updated, 'Event updated successfully');
});

// Delete event (admin)
const deleteEvent = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id);

	// collect poster public_ids
	const mediaToDelete = (ev.posters || [])
		.map((p) =>
			p.publicId || p.public_id
				? {
						public_id: p.publicId || p.public_id,
						resource_type: p.resource_type || 'image',
					}
				: null
		)
		.filter(Boolean);

	if (mediaToDelete.length) await deleteFiles(mediaToDelete);

	await Event.findByIdAndDelete(ev._id);
	return res.status(204).send();
});

// Add poster (admin)
const addEventPoster = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id);
	// multer middleware normalizes req.files => array, req.file may/may not be set
	const file = req.file || (req.files && req.files[0]);
	if (!file) throw ApiError.BadRequest('Poster file is required.');

	let uploaded;
	try {
		uploaded = await uploadFile(file, { folder: 'events/posters' });
	} catch (err) {
		// uploadFile will throw ApiError; just rethrow
		throw err;
	}

	const normalized = {
		url: uploaded.url || uploaded.secure_url || '',
		publicId: uploaded.publicId || uploaded.public_id,
		resource_type: uploaded.resource_type || 'image',
	};

	ev.posters.push(normalized);

	try {
		await ev.save();
	} catch (saveErr) {
		// Rollback cloudinary upload when DB save fails
		try {
			await deleteFile({
				public_id: normalized.publicId,
				resource_type: normalized.resource_type || 'image',
			});
		} catch (cleanupErr) {
			console.warn('Failed to cleanup poster after DB save error', cleanupErr.message);
		}
		throw saveErr;
	}

	return ApiResponse.success(res, ev.posters, 'Poster added', 201);
});

// Remove poster (admin)
const removeEventPoster = asyncHandler(async (req, res) => {
	const { id, publicId } = req.params;
	const ev = await findEventById(id);
	const idx = ev.posters.findIndex((p) => (p.publicId || p.public_id) === publicId);
	if (idx === -1) throw ApiError.NotFound('Poster not found on this event.');

	const [removed] = ev.posters.splice(idx, 1);
	if (removed && (removed.publicId || removed.public_id)) {
		await deleteFile({
			public_id: removed.publicId || removed.public_id,
			resource_type: removed.resource_type || 'image',
		});
	}
	await ev.save();
	return ApiResponse.success(res, null, 'Poster removed');
});

// Add partner (admin)
const addEventPartner = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id);

	const { name, website, tier, booth, description } = req.body;
	if (!name || !String(name).trim()) {
		throw ApiError.BadRequest('Partner name is required.');
	}

	// handle optional logo upload (single file expected under req.file or req.files[0])
	const file = req.file || (req.files && req.files[0]);
	let logo = null;
	if (file) {
		let uploaded;
		try {
			uploaded = await uploadFile(file, { folder: 'events/partners' });
		} catch (err) {
			throw err;
		}
		logo = {
			url: uploaded.url || uploaded.secure_url || '',
			publicId: uploaded.publicId || uploaded.public_id,
			resource_type: uploaded.resource_type || 'image',
		};
	}

	const partner = {
		name: String(name).trim(),
		logo: logo || undefined,
		website: website ? String(website).trim() : undefined,
		tier: tier ? String(tier).trim() : undefined,
		booth: booth ? String(booth).trim() : undefined,
		description: description ? String(description).trim() : undefined,
	};

	ev.partners.push(partner);

	try {
		await ev.save();
	} catch (saveErr) {
		// rollback uploaded logo if DB save fails
		if (logo && logo.publicId) {
			try {
				await deleteFile({
					public_id: logo.publicId,
					resource_type: logo.resource_type || 'image',
				});
			} catch (cleanupErr) {
				console.warn(
					'Failed to cleanup partner logo after DB save error',
					cleanupErr.message
				);
			}
		}
		throw saveErr;
	}

	return ApiResponse.success(res, ev.partners, 'Partner added', 201);
});

// Remove partner (admin)
// partnerId param can be either partner logo publicId or partner name (case-insensitive)
const removeEventPartner = asyncHandler(async (req, res) => {
	const { id, partnerId } = req.params;
	const ev = await findEventById(id);

	if (!partnerId) throw ApiError.BadRequest('Partner identifier is required.');

	const idx = ev.partners.findIndex((p) => {
		const logoId = p.logo && (p.logo.publicId || p.logo.public_id);
		if (logoId && logoId === partnerId) return true;
		if (p.name && String(p.name).toLowerCase() === String(partnerId).toLowerCase()) return true;
		return false;
	});

	if (idx === -1) throw ApiError.NotFound('Partner not found on this event.');

	const [removed] = ev.partners.splice(idx, 1);

	// delete logo from cloud if present
	if (removed && removed.logo && (removed.logo.publicId || removed.logo.public_id)) {
		try {
			await deleteFile({
				public_id: removed.logo.publicId || removed.logo.public_id,
				resource_type: removed.logo.resource_type || 'image',
			});
		} catch (err) {
			// log, but continue to save DB state
			console.warn('Failed to delete partner logo from cloudinary', err.message);
		}
	}

	await ev.save();
	return ApiResponse.success(res, null, 'Partner removed');
});

// Get event registrations (admin) -- populate tickets for admin
const getEventRegistrations = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id, { populateTickets: true });
	return ApiResponse.success(res, ev.tickets || [], 'Event registrations retrieved');
});

// Get event statistics (admin)
const getEventStats = asyncHandler(async (_req, res) => {
	const stats = await Event.aggregate([
		{
			$facet: {
				byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
				totalEvents: [{ $count: 'count' }],
				withTickets: [{ $match: { 'tickets.0': { $exists: true } } }, { $count: 'count' }],
			},
		},
		{
			$project: {
				totalEvents: { $ifNull: [{ $arrayElemAt: ['$totalEvents.count', 0] }, 0] },
				withTickets: { $ifNull: [{ $arrayElemAt: ['$withTickets.count', 0] }, 0] },
				statusCounts: {
					$arrayToObject: {
						$map: { input: '$byStatus', as: 's', in: { k: '$$s._id', v: '$$s.count' } },
					},
				},
			},
		},
	]);
	return ApiResponse.success(res, stats[0] || {}, 'Event statistics retrieved');
});

// Add speaker (admin)
const addEventSpeaker = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id);
	const { name, title, bio, links } = req.body;
	if (!name || !String(name).trim()) throw ApiError.BadRequest('Speaker name is required.');

	// optional photo upload
	const file = req.file || (req.files && req.files[0]);
	let photo = null;
	if (file) {
		const uploaded = await uploadFile(file, { folder: 'events/speakers' });
		photo = {
			url: uploaded.url || uploaded.secure_url || '',
			publicId: uploaded.publicId || uploaded.public_id,
			resource_type: uploaded.resource_type || 'image',
		};
	}

	const speaker = {
		name: String(name).trim(),
		title: title ? String(title).trim() : undefined,
		bio: bio ? String(bio).trim() : undefined,
		photo: photo || undefined,
		links:
			typeof links === 'string'
				? (() => {
						try {
							return JSON.parse(links);
						} catch {
							return undefined;
						}
					})()
				: links,
	};

	ev.speakers.push(speaker);
	await ev.save();
	return ApiResponse.success(res, ev.speakers, 'Speaker added', 201);
});

// Remove speaker (admin) by index
const removeEventSpeaker = asyncHandler(async (req, res) => {
	const { id, index } = req.params;
	const ev = await findEventById(id);
	const idx = Number.isFinite(Number(index)) ? parseInt(index, 10) : -1;
	if (idx < 0 || idx >= (ev.speakers || []).length) throw ApiError.NotFound('Speaker not found.');
	const [removed] = ev.speakers.splice(idx, 1);
	// delete photo if present
	if (removed && removed.photo && (removed.photo.publicId || removed.photo.public_id)) {
		try {
			await deleteFile({
				public_id: removed.photo.publicId || removed.photo.public_id,
				resource_type: removed.photo.resource_type || 'image',
			});
		} catch (e) {
			console.warn('Failed to delete speaker photo from cloud', e.message);
		}
	}
	await ev.save();
	return ApiResponse.success(res, ev.speakers, 'Speaker removed');
});

// Resources (title + url) management (index-based)
const addEventResource = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id);
	const { title, url } = req.body;
	if (!title || !url) throw ApiError.BadRequest('Resource title and url are required.');
	ev.resources = ev.resources || [];
	ev.resources.push({ title: String(title).trim(), url: String(url).trim() });
	await ev.save();
	return ApiResponse.success(res, ev.resources, 'Resource added', 201);
});

// Remove event resource (admin) - params: id, index
const removeEventResource = asyncHandler(async (req, res) => {
	const { id, index } = req.params;
	const ev = await findEventById(id);
	const idx = Number.isFinite(Number(index)) ? parseInt(index, 10) : -1;
	if (idx < 0 || idx >= (ev.resources || []).length)
		throw ApiError.NotFound('Resource not found.');
	ev.resources.splice(idx, 1);
	await ev.save();
	return ApiResponse.success(res, ev.resources, 'Resource removed');
});

// Co-organizers
const addEventCoOrganizer = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id);
	const { name } = req.body;
	if (!name || !String(name).trim()) throw ApiError.BadRequest('Co-organizer name is required.');
	ev.coOrganizers = ev.coOrganizers || [];
	ev.coOrganizers.push(String(name).trim());
	await ev.save();
	return ApiResponse.success(res, ev.coOrganizers, 'Co-organizer added', 201);
});

// Remove co-organizer by index or name (case-insensitive)
const removeEventCoOrganizer = asyncHandler(async (req, res) => {
	const { id, index, name } = req.params;
	const ev = await findEventById(id);
	if (typeof index !== 'undefined') {
		const idx = Number.isFinite(Number(index)) ? parseInt(index, 10) : -1;
		if (idx < 0 || idx >= (ev.coOrganizers || []).length)
			throw ApiError.NotFound('Co-organizer not found.');
		ev.coOrganizers.splice(idx, 1);
	} else if (typeof name !== 'undefined') {
		ev.coOrganizers = (ev.coOrganizers || []).filter(
			(n) => String(n).toLowerCase() !== String(name).toLowerCase()
		);
	} else {
		throw ApiError.BadRequest('Provide index or name to remove co-organizer.');
	}
	await ev.save();
	return ApiResponse.success(res, ev.coOrganizers, 'Co-organizer removed');
});

// Get public event details
const getPublicEventDetails = asyncHandler(async (req, res) => {
	const ev = await findEventById(req.params.id, { populateTickets: false });
	const publicObj = {
		_id: ev._id,
		title: ev.title,
		description: ev.description,
		eventDate: ev.eventDate,
		eventTime: ev.eventTime,
		venue: ev.venue,
		room: ev.room,
		category: ev.category,
		subcategory: ev.subcategory,
		posters: ev.posters,
		gallery: ev.gallery,
		tags: ev.tags,
		ticketPrice: ev.ticketPrice,
		registrationInfo: ev.registrationInfo, // virtual
		registrationStatus: ev.registrationStatus, // virtual
		ticketCount: ev.ticketCount,
		status: ev.status,
	};
	return ApiResponse.success(res, publicObj, 'Public event details retrieved');
});

// Example: when preparing event response that included fest.poster previously:
const someHandler = asyncHandler(async (req, res) => {
	// ...existing code that obtains fest ...
	// const poster = fest.poster || null;    // old
	const poster = getHeroMedia(fest); // new - works with posters[], heroMedia, poster virtual, gallery
	// ...use poster.url or poster.caption safely...
});

export {
	createEvent,
	getAllEvents,
	getEventById,
	updateEventDetails,
	deleteEvent,
	addEventPoster,
	removeEventPoster,
	addEventPartner,
	removeEventPartner,
	getEventRegistrations,
	getEventStats,
	addEventSpeaker,
	removeEventSpeaker,
	addEventResource,
	removeEventResource,
	addEventCoOrganizer,
	removeEventCoOrganizer,
	getPublicEventDetails,
};
