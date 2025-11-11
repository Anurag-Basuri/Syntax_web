import Ticket from '../models/ticket.model.js';
import Event from '../models/event.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateTicketQR } from '../services/qrcode.service.js';
import { sendRegistrationEmail } from '../services/email.service.js';
import { deleteFile } from '../utils/cloudinary.js';
import mongoose from 'mongoose';

// Create a new ticket (event registration)
const createTicket = asyncHandler(async (req, res) => {
	const { eventId, fullName, email, phone, lpuId, gender, course, hosteler, hostel } = req.body;

	// 1. Find the event and validate its status
	const event = await Event.findById(eventId);
	if (!event) {
		throw ApiError.NotFound('The specified event does not exist.');
	}

	// Use the powerful registrationStatus virtual property from the Event model
	if (event.registrationStatus !== 'OPEN') {
		throw ApiError.BadRequest(
			`Registration is currently not open. Status: ${event.registrationStatus}`
		);
	}

	// 2. Create the ticket instance
	const ticket = new Ticket({
		eventId,
		eventName: event.title, // Denormalize event name for convenience
		fullName,
		email,
		phone,
		lpuId,
		gender,
		course,
		hosteler,
		hostel: hosteler ? hostel : undefined,
	});

	// 3. Save the ticket and handle potential conflicts
	try {
		await ticket.save();
	} catch (error) {
		if (error.code === 11000) {
			throw ApiError.Conflict(
				'You have already registered for this event with this Email or LPU ID.'
			);
		}
		throw error; // Re-throw other validation errors
	}

	// 4. Perform side effects (QR generation, email) after successful creation
	try {
		// Generate and save QR code
		const qrCode = await generateTicketQR(ticket.ticketId);
		ticket.qrCode = { url: qrCode.url, publicId: qrCode.public_id };
		await ticket.save();

		// Send registration email
		await sendRegistrationEmail({
			to: email,
			name: fullName,
			eventName: event.title,
			eventDate: event.eventDate, // Use dynamic event date
			qrUrl: qrCode.url,
		});
		ticket.emailStatus = 'sent';
	} catch (sideEffectError) {
		console.error('Post-creation error (QR/Email):', sideEffectError.message);
		// The ticket is created, but a side-effect failed. Mark for admin review.
		ticket.emailStatus = 'failed';
		// Don't throw an error to the user, as their registration is successful.
		// The frontend can show a message based on the response.
	} finally {
		await ticket.save();
	}

	// 5. Update the event's registered users list
	await Event.findByIdAndUpdate(eventId, { $addToSet: { registeredUsers: ticket._id } });

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

// Update ticket status
const updateTicketStatus = asyncHandler(async (req, res) => {
	const { ticketId } = req.params;
	const { status } = req.body; // Expecting 'active', 'used', or 'cancelled'

	const ticket = await Ticket.findOneAndUpdate(
		{ ticketId },
		{ status },
		{ new: true, runValidators: true }
	);

	if (!ticket) {
		throw ApiError.NotFound('Ticket not found.');
	}

	return ApiResponse.success(res, { ticket }, 'Ticket status updated successfully.');
});

// Delete a ticket
const deleteTicket = asyncHandler(async (req, res) => {
	const { ticketId } = req.params;
	const ticket = await Ticket.findOneAndDelete({ ticketId });

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
};
