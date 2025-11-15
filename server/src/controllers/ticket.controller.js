import Event from '../models/event.model.js';
import Ticket from '../models/ticket.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { generateTicketQR } from '../services/qrcode.service.js';
import { sendRegistrationEmail } from '../services/email.service.js';
import { deleteFile } from '../utils/cloudinary.js';

// Register for an event (internal registration -> creates a Ticket)
const registerForEvent = asyncHandler(async (req, res) => {
	const eventId = req.params.id;
	const {
		fullName,
		email,
		phone,
		lpuId,
		gender,
		course,
		hosteler = false,
		hostel,
		paymentDetails = null,
	} = req.body;

	// Basic required checks (route also validates but keep defensive)
	if (!fullName || !email || !phone || !lpuId || !gender || !course) {
		return ApiResponse.error(res, 'Missing required attendee fields.', 400);
	}

	// Load event (read-only)
	const event = await Event.findById(eventId).lean();
	if (!event) return ApiResponse.notFound(res, 'Event not found');

	// Ensure event uses internal registration
	const mode = (event.registration && event.registration.mode) || 'none';
	if (mode !== 'internal') {
		if (mode === 'external') {
			return ApiResponse.error(
				res,
				'This event uses external registration. Use the external link.',
				400,
				{ externalUrl: event.registration?.externalUrl || null }
			);
		}
		return ApiResponse.error(res, 'Registration for this event is not available.', 400);
	}

	// Check registration window (respect optional open/close)
	const now = Date.now();
	if (event.registrationOpenDate && now < new Date(event.registrationOpenDate).getTime()) {
		return ApiResponse.error(res, 'Registration has not opened yet.', 400);
	}
	if (event.registrationCloseDate && now > new Date(event.registrationCloseDate).getTime()) {
		return ApiResponse.error(res, 'Registration has already closed.', 400);
	}

	// Hosteler check
	if (hosteler && (!hostel || String(hostel).trim().length === 0)) {
		return ApiResponse.error(res, 'Hostel is required for hosteler attendees.', 400);
	}

	// Use transaction to avoid race conditions (overbooking) and to atomically create ticket + update event
	const session = await mongoose.startSession();
	let createdTicket = null;
	try {
		await session.withTransaction(async () => {
			// Re-load event inside transaction
			const ev = await Event.findById(eventId).session(session);
			if (!ev) throw ApiError.NotFound('Event not found during registration.');

			// Capacity: respect capacityOverride > 0 else totalSpots (0 = unlimited)
			const effectiveCap =
				ev.registration?.capacityOverride && ev.registration.capacityOverride > 0
					? ev.registration.capacityOverride
					: ev.totalSpots || 0;

			if (effectiveCap > 0) {
				// Count active tickets (exclude cancelled)
				const soldCount = await Ticket.countDocuments({
					eventId,
					status: { $ne: 'cancelled' },
				})
					.session(session)
					.exec();
				if (soldCount >= effectiveCap) {
					throw ApiError.BadRequest('Event is full.');
				}
			}

			// Build ticket (no user account required)
			const ticketPayload = {
				eventId: ev._id,
				eventName: ev.title || ev.name || 'Event',
				fullName: String(fullName).trim(),
				email: String(email).toLowerCase().trim(),
				phone: String(phone).trim(),
				lpuId: String(lpuId).trim(),
				gender,
				course: String(course).trim(),
				hosteler: !!hosteler,
				hostel: hosteler ? String(hostel).trim() : undefined,
				paymentDetails: paymentDetails || undefined,
			};

			// Create ticket within transaction (unique indexes will be enforced)
			createdTicket = await Ticket.create([ticketPayload], { session }).then((arr) => arr[0]);

			// Link ticket to event.tickets (keeps event document in sync)
			await Event.findByIdAndUpdate(
				ev._id,
				{ $addToSet: { tickets: createdTicket._id } },
				{ session }
			);
		});
	} catch (err) {
		// Translate duplicate key into friendly message
		if (err && err.code === 11000) {
			return ApiResponse.conflict(
				res,
				'You have already registered for this event with this Email or LPU ID.',
				{ detail: err.keyValue || null }
			);
		}
		// ApiError instances should be forwarded with proper messages
		if (err instanceof ApiError) {
			return ApiResponse.error(
				res,
				err.message || 'Registration failed',
				err.statusCode || 400
			);
		}
		console.error('Registration transaction failed', err);
		return ApiResponse.error(res, 'Registration failed due to server error', 500);
	} finally {
		session.endSession();
	}

	// Post-transaction side effects (QR + email) — run outside transaction
	try {
		const qrCode = await generateTicketQR(createdTicket.ticketId);
		createdTicket.qrCode = { url: qrCode.url, publicId: qrCode.public_id };
		// attempt to send email (best-effort)
		await sendRegistrationEmail({
			to: createdTicket.email,
			name: createdTicket.fullName,
			eventName: createdTicket.eventName,
			eventDate: event.eventDate || event.startDate || null,
			qrUrl: createdTicket.qrCode.url,
		});
		createdTicket.emailStatus = 'sent';
	} catch (sideEffectError) {
		console.error(
			'Post-registration side effects failed',
			sideEffectError?.message || sideEffectError
		);
		createdTicket.emailStatus = 'failed';
	}

	// Persist side-effect changes (non-transactional)
	try {
		await Ticket.findByIdAndUpdate(
			createdTicket._id,
			{ qrCode: createdTicket.qrCode, emailStatus: createdTicket.emailStatus },
			{ new: true, runValidators: true }
		);
	} catch (persistErr) {
		console.error('Failed to persist ticket side-effects', persistErr);
	}

	return ApiResponse.success(res, { ticket: createdTicket }, 'Ticket created', 201);
});

// Create a new ticket (event registration)
const createTicket = asyncHandler(async (req, res) => {
	const { eventId, fullName, email, phone, lpuId, gender, course, hosteler, hostel } = req.body;

	// 1. Find the event and validate its status
	const event = await Event.findById(eventId);
	if (!event) {
		throw ApiError.NotFound('The specified event does not exist.');
	}

	// If event uses external registration, instruct client to redirect
	if (event.registration?.mode === 'external') {
		throw ApiError.BadRequest(
			'This event uses an external registration flow. Redirect the user to the external URL.',
			{ externalUrl: event.registration.externalUrl }
		);
	}

	// Use model virtual to check if registration is open
	if (event.registrationStatus !== 'OPEN') {
		throw ApiError.BadRequest(
			`Registration is currently not open. Status: ${event.registrationStatus}`
		);
	}

	// Start a transaction to avoid race conditions
	// Post-create side effects (QR + email) — run outside transaction
	try {
		const qrCode = await generateTicketQR(ticket.ticketId);
		ticket.qrCode = { url: qrCode.url, publicId: qrCode.public_id };
		await ticket.save();
		await sendRegistrationEmail({
			to: ticket.email,
			name: ticket.fullName,
			eventName: ticket.eventName,
			eventDate: (await Event.findById(eventId)).eventDate,
			qrUrl: ticket.qrCode.url,
		});
		ticket.emailStatus = 'sent';
	} catch (sideEffectError) {
		console.error('Post-creation error (QR/Email):', sideEffectError.message);
		ticket.emailStatus = 'failed';
		await ticket.save();
	}

	return ApiResponse.success(
		res,
		{ ticket },
		'Registration successful! Your ticket will be sent to your email.',
		201
	);
});

// Get a ticket by its ticketId
const getTicketById = asyncHandler(async (req, res) => {
	const { ticketId } = req.params;
	const ticket = await Ticket.findOne({ ticketId }).populate('eventId', 'title eventDate venue');

	if (!ticket) {
		throw ApiError.NotFound('Ticket not found.');
	}

	return ApiResponse.success(res, { ticket }, 'Ticket retrieved successfully.');
});

// Get tickets with filtering, sorting, and pagination
const getTicketsByEvent = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10, eventId, status } = req.query;

	const filter = {};
	if (eventId) {
		// ensure correct ObjectId type for aggregate matching
		try {
			filter.eventId = new mongoose.Types.ObjectId(eventId);
		} catch (e) {
			// invalid id -> force no results
			filter.eventId = null;
		}
	}
	if (status) filter.status = status;

	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		sort: { createdAt: -1 },
		populate: { path: 'eventId', select: 'title' },
	};

	// Build an aggregate pipeline and use the aggregate-paginate plugin (aggregatePaginate)
	const aggregate = Ticket.aggregate();
	if (Object.keys(filter).length) {
		aggregate.match(filter);
	}
	if (options.sort) {
		aggregate.sort(options.sort);
	}

	// Use aggregatePaginate provided by mongoose-aggregate-paginate-v2
	const tickets = await Ticket.aggregatePaginate(aggregate, options);

	// Return paginated response (structure stays the same as before)
	return ApiResponse.paginated(res, tickets.docs, tickets, 'Tickets retrieved successfully.');
});

// Helper: find ticket by either ticketId (business id) or _id (mongo)
const findTicketByIdentifier = async (identifier) => {
	if (!identifier) return null;
	// try as ObjectId first
	if (mongoose.isValidObjectId(identifier)) {
		const byId = await Ticket.findById(identifier);
		if (byId) return byId;
	}
	// fallback to business ticketId
	return await Ticket.findOne({ ticketId: identifier });
};

// Update ticket status
const updateTicketStatus = asyncHandler(async (req, res) => {
	const { ticketId: identifier } = req.params;
	const { status } = req.body; // Expecting 'active', 'used', or 'cancelled'

	// Validate status server-side as extra safety
	if (!['active', 'used', 'cancelled'].includes(status)) {
		throw ApiError.BadRequest("Status must be one of: 'active', 'used', 'cancelled'");
	}

	// Find ticket by _id or ticketId and update
	let ticket = null;
	if (mongoose.isValidObjectId(identifier)) {
		ticket = await Ticket.findOneAndUpdate(
			{ _id: identifier },
			{ status },
			{ new: true, runValidators: true }
		);
	}
	if (!ticket) {
		ticket = await Ticket.findOneAndUpdate(
			{ ticketId: identifier },
			{ status },
			{ new: true, runValidators: true }
		);
	}

	if (!ticket) {
		throw ApiError.NotFound('Ticket not found.');
	}

	return ApiResponse.success(res, { ticket }, 'Ticket status updated successfully.');
});

// Delete a ticket
const deleteTicket = asyncHandler(async (req, res) => {
	const { ticketId: identifier } = req.params;

	// Try delete by _id first, then by ticketId
	let ticket = null;
	if (mongoose.isValidObjectId(identifier)) {
		ticket = await Ticket.findByIdAndDelete(identifier);
	}
	if (!ticket) {
		ticket = await Ticket.findOneAndDelete({ ticketId: identifier });
	}

	if (!ticket) {
		throw ApiError.NotFound('Ticket not found.');
	}

	// Remove ticket from the event's registration list
	await Event.findByIdAndUpdate(ticket.eventId, { $pull: { registeredUsers: ticket._id } });

	// Delete QR code from Cloudinary if it exists
	if (ticket.qrCode?.publicId) {
		await deleteFile({ public_id: ticket.qrCode.publicId, resource_type: 'image' });
	}

	return ApiResponse.success(res, null, 'Ticket deleted successfully.');
});

// Check availability of email or LPU ID for an event
const checkAvailability = asyncHandler(async (req, res) => {
	const { email, lpuId, eventId } = req.body;

	if (!eventId) {
		throw ApiError.BadRequest('Event ID is required.');
	}

	const orConditions = [];
	if (email) orConditions.push({ email: email.toLowerCase().trim() });
	if (lpuId) orConditions.push({ lpuId });

	if (orConditions.length === 0) {
		throw ApiError.BadRequest('Either email or LPU ID is required.');
	}

	const existingTicket = await Ticket.findOne({ eventId, $or: orConditions });

	if (existingTicket) {
		throw ApiError.Conflict('This Email or LPU ID is already registered for this event.');
	}

	return ApiResponse.success(res, { available: true }, 'Available for registration.');
});

export {
	createTicket,
	getTicketById,
	updateTicketStatus,
	getTicketsByEvent,
	deleteTicket,
	checkAvailability,
	registerForEvent,
};
