import Event from '../models/event.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile, deleteFile, deleteFiles } from '../utils/cloudinary.js';
import mongoose from 'mongoose';

// Helper to find an event by its ID
const findEventById = async (id) => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw ApiError.BadRequest('Invalid event ID format.');
	}
	const event = await Event.findById(id);
	if (!event) {
		throw ApiError.NotFound('Event not found.');
	}
	return event;
};

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
	const {
		title,
		description,
		eventDate,
		venue,
		organizer,
		category,
		tags,
		totalSpots = 0,
		ticketPrice = 0,
		registrationOpenDate,
		registrationCloseDate,
		// registration fields may come either as registration.* or top level for convenience
	} = req.body;

	if (!req.files?.length) {
		throw ApiError.BadRequest('At least one event poster is required.');
	}

	// Upload posters
	const uploaded = await Promise.all(
		req.files.map((file) => uploadFile(file, { folder: 'events/posters' }))
	);
	// Normalize uploaded poster shape (some utils return different keys)
	const uploadedPosters = uploaded.map((u) => ({
		url: u.url || u.secure_url || '',
		publicId: u.publicId || u.public_id || u.public_id,
		resource_type: u.resource_type || 'image',
	}));

	// Build registration object from incoming payload (support both nested and flat inputs)
	const regMode =
		(req.body.registration && req.body.registration.mode) ||
		req.body.registrationMode ||
		req.body.mode ||
		'internal';

	const registration = {
		mode: regMode,
		externalUrl:
			(req.body.registration && req.body.registration.externalUrl) ||
			req.body.registrationExternalUrl ||
			req.body.externalUrl ||
			null,
		allowGuests:
			typeof (req.body.registration && req.body.registration.allowGuests) !== 'undefined'
				? req.body.registration.allowGuests
				: typeof req.body.allowGuests !== 'undefined'
					? req.body.allowGuests
					: true,
		capacityOverride:
			(req.body.registration && req.body.registration.capacityOverride) ||
			req.body.capacityOverride ||
			undefined,
	};

	// server-side validation for external mode
	if (registration.mode === 'external' && !registration.externalUrl) {
		throw ApiError.BadRequest('externalUrl is required when registration.mode is "external".');
	}

	const newEvent = await Event.create({
		title: title?.trim(),
		description: description?.trim(),
		eventDate: new Date(eventDate),
		venue: venue?.trim(),
		organizer: organizer?.trim(),
		category: category?.trim(),
		posters: uploadedPosters,
		tags: tags
			? tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [],
		totalSpots: Number(totalSpots),
		ticketPrice: Number(ticketPrice),
		registrationOpenDate: registrationOpenDate ? new Date(registrationOpenDate) : null,
		registrationCloseDate: registrationCloseDate ? new Date(registrationCloseDate) : null,
		registeredUsers: [], // Explicit default
		registration,
	});

	return ApiResponse.success(res, newEvent, 'Event created successfully', 201);
});

// Get all events with filtering, sorting, and pagination
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

	// Add useful computed fields (the model already has virtuals, but computed fields in aggregate are faster)
	pipeline.push({
		$addFields: {
			registeredUsersCount: { $size: { $ifNull: ['$registeredUsers', []] } },
		},
	});

	pipeline.push({
		$project: {
			title: 1,
			eventDate: 1,
			venue: 1,
			category: 1,
			status: 1,
			ticketPrice: 1,
			posters: { $slice: ['$posters', 1] },
			registeredUsersCount: 1,
			// expose a few registration fields so frontend can decide redirect vs ticket flow
			'registration.mode': 1,
			'registration.externalUrl': 1,
			'registration.allowGuests': 1,
			'registration.capacityOverride': 1,
			totalSpots: 1,
		},
	});

	pipeline.push({
		$sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1, _id: 1 },
	});

	const aggregate = Event.aggregate(pipeline);
	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		lean: true,
	};

	const events = await Event.aggregatePaginate(aggregate, options);
	return ApiResponse.paginated(res, events.docs, events, 'Events retrieved successfully');
});

// Get a single event by ID
const getEventById = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);
	// populate legacy registeredUsers for admin views
	await event.populate('registeredUsers', 'fullname email LpuId');
	// include registration-related virtuals (isFull, spotsLeft, effectiveCapacity, registrationStatus)
	return ApiResponse.success(res, event, 'Event retrieved successfully');
});

// Update an existing event's details
const updateFestRegistrationValidation = (event) => {
	// If switching to external mode, ensure externalUrl is present
	if (event.registration?.mode === 'external' && !event.registration?.externalUrl) {
		throw ApiError.BadRequest('externalUrl is required when registration.mode is "external".');
	}
	// registration dates consistency checked in model pre-save
};

const updateEventDetails = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);

	// Allow updating registration object safely: merge only known registration keys
	if (req.body.registration) {
		event.registration = {
			...event.registration?.toObject?.(),
			...event.registration,
			...req.body.registration,
		};
	}
	// Allow some flat registration fields for convenience
	if (typeof req.body.registrationMode !== 'undefined') {
		event.registration = event.registration || {};
		event.registration.mode = req.body.registrationMode;
	}
	if (typeof req.body.externalUrl !== 'undefined') {
		event.registration = event.registration || {};
		event.registration.externalUrl = req.body.externalUrl;
	}
	if (typeof req.body.allowGuests !== 'undefined') {
		event.registration = event.registration || {};
		event.registration.allowGuests = req.body.allowGuests;
	}
	if (typeof req.body.capacityOverride !== 'undefined') {
		event.registration = event.registration || {};
		event.registration.capacityOverride = req.body.capacityOverride;
	}

	// Apply other updatable top-level fields
	const updatable = [
		'title',
		'description',
		'eventDate',
		'venue',
		'organizer',
		'category',
		'totalSpots',
		'ticketPrice',
		'registrationOpenDate',
		'registrationCloseDate',
		'status',
		'tags',
	];
	updatable.forEach((key) => {
		if (typeof req.body[key] !== 'undefined') {
			// sanitize simple string fields
			event[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
		}
	});

	// Validate registration constraints before saving
	updateFestRegistrationValidation(event);

	const updatedEvent = await event.save();
	return ApiResponse.success(res, updatedEvent, 'Event details updated successfully');
});

// Delete an event
const deleteEvent = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);

	if (event.posters && event.posters.length > 0) {
		// Delete posters from cloudinary, providing shape expected by deleteFiles util
		const mediaToDelete = event.posters
			.map((p) => p.publicId || p.public_id)
			.filter(Boolean)
			.map((publicId) => ({ public_id: publicId, resource_type: 'image' }));
		if (mediaToDelete.length > 0) {
			await deleteFiles(mediaToDelete);
		}
	}

	await Event.findByIdAndDelete(req.params.id);
	// 204 No Content
	return res.status(204).send();
});

// --- Poster Management ---

// Add a new poster to an event
const addEventPoster = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);
	if (!req.file) throw ApiError.BadRequest('Poster file is required.');

	const poster = await uploadFile(req.file, { folder: 'events/posters' });
	const normalized = {
		url: poster.url || poster.secure_url || '',
		publicId: poster.publicId || poster.public_id,
		resource_type: poster.resource_type || 'image',
	};
	event.posters.push(normalized);
	await event.save();

	return ApiResponse.success(res, event.posters, 'Poster added successfully', 201);
});

// Remove a poster from an event by its publicId
const removeEventPoster = asyncHandler(async (req, res) => {
	const { id, publicId } = req.params;
	const event = await findEventById(id);

	const posterIndex = event.posters.findIndex((p) => (p.publicId || p.public_id) === publicId);
	if (posterIndex === -1) throw ApiError.NotFound('Poster not found on this event.');

	const [removedPoster] = event.posters.splice(posterIndex, 1);
	// Delete using normalized object expected by cloudinary util
	if (removedPoster?.publicId || removedPoster?.public_id) {
		await deleteFile({
			public_id: removedPoster.publicId || removedPoster.public_id,
			resource_type: removedPoster.resource_type || 'image',
		});
	}
	await event.save();

	return ApiResponse.success(res, null, 'Poster removed successfully');
});

// --- Analytics & Registrations ---

// Get statistics about all events
const getEventStats = asyncHandler(async (req, res) => {
	const stats = await Event.aggregate([
		{
			$facet: {
				byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
				totalRegistrations: [
					{
						$group: {
							_id: null,
							total: {
								$sum: {
									$size: { $ifNull: ['$registeredUsers', []] },
								},
							},
						},
					},
				],
				totalEvents: [{ $count: 'count' }],
			},
		},
		{
			$project: {
				totalEvents: { $ifNull: [{ $arrayElemAt: ['$totalEvents.count', 0] }, 0] },
				totalRegistrations: {
					$ifNull: [{ $arrayElemAt: ['$totalRegistrations.total', 0] }, 0],
				},
				statusCounts: {
					$arrayToObject: {
						$map: {
							input: '$byStatus',
							as: 's',
							in: { k: '$$s._id', v: '$$s.count' },
						},
					},
				},
			},
		},
	]);

	return ApiResponse.success(res, stats[0], 'Event statistics retrieved successfully.');
});

// Get a list of all users registered for a specific event
const getEventRegistrations = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);
	await event.populate({
		path: 'registeredUsers',
		select: 'fullname email LpuId department',
	});

	return ApiResponse.success(
		res,
		event.registeredUsers,
		'Successfully retrieved event registrations.'
	);
});

export {
	createEvent,
	getAllEvents,
	getEventById,
	updateEventDetails,
	deleteEvent,
	addEventPoster,
	removeEventPoster,
	getEventStats,
	getEventRegistrations,
};
