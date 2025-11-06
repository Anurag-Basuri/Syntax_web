import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const posterSchema = new mongoose.Schema({
	url: {
		type: String,
		required: [true, 'Poster URL is required'],
		// A more robust URL validation regex
		match: [
			/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/,
			'Please provide a valid URL for the poster.',
		],
	},
	publicId: {
		type: String,
		required: [true, 'Cloudinary public_id is required for the poster'],
	},
});

const EventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true,
			minlength: [3, 'Title must be at least 3 characters long'],
			maxlength: [150, 'Title cannot exceed 150 characters'],
		},
		description: {
			type: String,
			required: [true, 'Description is required'],
			trim: true,
			minlength: [10, 'Description must be at least 10 characters long'],
			maxlength: [2000, 'Description cannot exceed 2000 characters'],
		},
		// Combined date and time for easier querying and time zone management
		eventDate: {
			type: Date,
			required: [true, 'Event date and time are required'],
			validate: {
				validator: function (v) {
					// Ensure the event date is not in the past at the time of creation/update
					return v.getTime() >= Date.now() - 60000; // Allow a 1-minute grace period
				},
				message: 'Event date cannot be in the past.',
			},
		},
		venue: {
			type: String,
			required: [true, 'Venue is required'],
			trim: true,
			minlength: [2, 'Venue must be at least 2 characters'],
			maxlength: [150, 'Venue cannot exceed 150 characters'],
		},
		organizer: {
			type: String,
			required: [true, 'Organizer is required'],
			trim: true,
			minlength: [2, 'Organizer must be at least 2 characters'],
			maxlength: [100, 'Organizer cannot exceed 100 characters'],
		},
		category: {
			type: String,
			required: [true, 'Event category is required (e.g., Workshop, Competition)'],
			trim: true,
		},
		posters: {
			type: [posterSchema],
			validate: [(val) => val.length > 0, 'At least one event poster is required.'],
		},
		tags: {
			type: [String],
			default: [],
		},
		totalSpots: {
			type: Number,
			min: [0, 'Total spots cannot be negative'],
			default: 0, // Default to unlimited spots
		},
		ticketPrice: {
			type: Number,
			min: [0, 'Ticket price cannot be negative'],
			default: 0, // Default to a free event
		},
		// This array stores references to User documents, not Tickets.
		// This is better for quickly checking who has registered.
		registeredUsers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		status: {
			type: String,
			enum: {
				values: ['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'],
				message:
					'Status must be one of: upcoming, ongoing, completed, cancelled, postponed',
			},
			default: 'upcoming',
		},
		
		registrationOpenDate: {
			type: Date,
		},
		registrationCloseDate: {
			type: Date,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtual property to check if the event is free
EventSchema.virtual('isFree').get(function () {
	return this.ticketPrice === 0;
});

// Virtual property to calculate remaining spots
EventSchema.virtual('spotsLeft').get(function () {
	if (this.totalSpots === 0) {
		return Infinity; // Unlimited spots
	}
	return Math.max(0, this.totalSpots - this.registeredUsers.length);
});

// Virtual property to check if the event is full
EventSchema.virtual('isFull').get(function () {
	if (this.totalSpots === 0) {
		return false; // Never full if spots are unlimited
	}
	return this.registeredUsers.length >= this.totalSpots;
});

EventSchema.virtual('registrationStatus').get(function () {
	const now = new Date();

	// Handle definitive statuses first
	if (this.status === 'cancelled') return 'CANCELLED';
	if (this.status === 'completed' || this.status === 'ongoing') return 'CLOSED';
	if (this.isFull) return 'FULL';

	// If dates are not set, registration is considered closed unless the event is upcoming
	if (!this.registrationOpenDate || !this.registrationCloseDate) {
		return this.status === 'upcoming' ? 'CLOSED' : 'PAST';
	}

	// Logic based on dates
	if (now < this.registrationOpenDate) {
		return 'COMING_SOON';
	}
	if (now >= this.registrationOpenDate && now <= this.registrationCloseDate) {
		return 'OPEN';
	}
	if (now > this.registrationCloseDate) {
		return 'CLOSED';
	}

	return 'UNAVAILABLE'; // Fallback
});

// Text index for efficient searching on title, description, and tags
EventSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text' });
// Index for common filtering and sorting
EventSchema.index({ eventDate: 1, status: 1 });

// Pre-save hook to sanitize tags array
EventSchema.pre('save', function (next) {
	if (this.isModified('tags')) {
		this.tags = this.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
	}
	if (
		this.registrationOpenDate &&
		this.registrationCloseDate &&
		this.registrationOpenDate > this.registrationCloseDate
	) {
		return next(new Error('Registration open date cannot be after the close date.'));
	}
	next();
});

// Add pagination plugin
EventSchema.plugin(mongoosePaginate);

const Event = mongoose.model('Event', EventSchema);

export default Event;
