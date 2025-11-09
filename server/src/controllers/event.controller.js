import Event from '../models/event.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile, deleteFile, deleteFiles } from '../utils/cloudinary.js';
import mongoose from 'mongoose';

// Helper to find an event by its ID
const findEventById = async (id) => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError(400, 'Invalid event ID format.');
	}
	const event = await Event.findById(id);
	if (!event) {
		throw new ApiError(404, 'Event not found.');
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
	} = req.body;

	if (!req.files?.length) {
		throw new ApiError(400, 'At least one event poster is required.');
	}

	const uploadedPosters = await Promise.all(
		req.files.map((file) => uploadFile(file, { folder: 'events/posters' }))
	);

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

	// FIX: Safe size computation even if field missing
	pipeline.push({
		$addFields: {
			registeredUsersCount: {
				$size: { $ifNull: ['$registeredUsers', []] },
			},
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
			isFree: 1,
			spotsLeft: 1,
			isFull: 1,
			registrationStatus: 1,
		},
	});

	pipeline.push({ $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1, _id: 1 } });

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
	await event.populate('registeredUsers', 'fullname email LpuId');
	return ApiResponse.success(res, event, 'Event retrieved successfully');
});

// Update an existing event's details
const updateEventDetails = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);
	Object.assign(event, req.body);
	const updatedEvent = await event.save();
	return ApiResponse.success(res, updatedEvent, 'Event details updated successfully');
});

// Delete an event
const deleteEvent = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);

	if (event.posters && event.posters.length > 0) {
		// FIX: Cloudinary delete only needs public_ids for images
		const publicIdsToDelete = event.posters.map((p) => p.publicId);
		await deleteFiles(publicIdsToDelete);
	}

	await Event.findByIdAndDelete(req.params.id);
	return ApiResponse.success(res, null, 'Event deleted successfully', 204);
});

// --- Poster Management ---

// Add a new poster to an event
const addEventPoster = asyncHandler(async (req, res) => {
	const event = await findEventById(req.params.id);
	if (!req.file) throw new ApiError(400, 'Poster file is required.');

	const poster = await uploadFile(req.file, { folder: 'events/posters' });
	event.posters.push(poster);
	await event.save();

	return ApiResponse.success(res, event.posters, 'Poster added successfully', 201);
});

// Remove a poster from an event by its publicId
const removeEventPoster = asyncHandler(async (req, res) => {
	const { id, publicId } = req.params;
	const event = await findEventById(id);

	const posterIndex = event.posters.findIndex((p) => p.publicId === publicId);
	if (posterIndex === -1) throw new ApiError(404, 'Poster not found on this event.');

	const [removedPoster] = event.posters.splice(posterIndex, 1);
	// FIX: Cloudinary delete only needs the public_id for images
	await deleteFile(removedPoster.publicId);
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
									$size: { $ifNull: ['$registeredUsers', []] }, // FIX
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
