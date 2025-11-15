import mongoose from 'mongoose';
import Event from '../models/event.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile, deleteFile, deleteFiles } from '../utils/cloudinary.js';

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
	const uploadedPosters =
		Array.isArray(req.files) && req.files.length
			? await Promise.all(
					req.files.map((file) => uploadFile(file, { folder: 'events/posters' }))
				)
			: [];

	// Normalize posters into model shape
	const posters = (uploadedPosters || []).map((u) => ({
		url: u.url || u.secure_url || u.publicUrl || '',
		publicId: u.publicId || u.public_id || u.public_id,
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

	const created = await Event.create(eventDoc);
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

	// Merge registration updates carefully
	if (req.body.registration) {
		ev.registration = { ...ev.registration?.toObject?.(), ...req.body.registration };
	}
	// convenience flat fields
	if (typeof req.body.registrationMode !== 'undefined')
		((ev.registration = ev.registration || {}),
			(ev.registration.mode = req.body.registrationMode));
	if (typeof req.body.externalUrl !== 'undefined')
		((ev.registration = ev.registration || {}),
			(ev.registration.externalUrl = req.body.externalUrl));
	if (typeof req.body.capacityOverride !== 'undefined')
		((ev.registration = ev.registration || {}),
			(ev.registration.capacityOverride = req.body.capacityOverride));
	if (typeof req.body.allowGuests !== 'undefined')
		((ev.registration = ev.registration || {}),
			(ev.registration.allowGuests = req.body.allowGuests));

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
			ev[k] = typeof req.body[k] === 'string' ? req.body[k].trim() : req.body[k];
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
	if (!req.file && (!req.files || req.files.length === 0))
		throw ApiError.BadRequest('Poster file is required.');

	const file = req.file || (req.files && req.files[0]);
	const uploaded = await uploadFile(file, { folder: 'events/posters' });
	const normalized = {
		url: uploaded.url || uploaded.secure_url || '',
		publicId: uploaded.publicId || uploaded.public_id,
		resource_type: uploaded.resource_type || 'image',
	};
	ev.posters.push(normalized);
	await ev.save();
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

export {
	createEvent,
	getAllEvents,
	getEventById,
	updateEventDetails,
	deleteEvent,
	addEventPoster,
	removeEventPoster,
	getEventRegistrations,
	getEventStats,
	getPublicEventDetails,
};
