import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

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
			default: 0, // 0 = unlimited
		},
		ticketPrice: {
			type: Number,
			min: [0, 'Ticket price cannot be negative'],
			default: 0, // Default to a free event
		},

		// registration object: supports two registration types
		registration: {
			mode: {
				type: String,
				enum: ['internal', 'external', 'none'],
				default: 'internal',
				required: true,
			},
			// when mode === 'external' client should provide this URL
			externalUrl: {
				type: String,
				trim: true,
				validate: {
					validator: function (v) {
						if (!v) return true; // allow empty unless mode === external (checked in pre-save)
						return /^(https?:\/\/)?((([a-zA-Z0-9\-_]+\.)+[a-zA-Z]{2,})|localhost)(:\d{2,5})?(\/[^\s]*)?$/.test(
							v
						);
					},
					message: 'Invalid external registration URL',
				},
			},
			// if true, allow anonymous/guest ticketing (no member account required)
			allowGuests: {
				type: Boolean,
				default: true,
			},
			// optional per-event capacity that overrides totalSpots when set (0/unset = use totalSpots)
			capacityOverride: {
				type: Number,
				min: [0, 'Capacity cannot be negative'],
			},
		},

		// This array stores references to Member documents (legacy quick-check).
		registeredUsers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Member',
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

// derived capacity used for registration calculations
EventSchema.virtual('effectiveCapacity').get(function () {
	// If registration.capacityOverride is a positive number use it, otherwise use totalSpots.
	const cap = this.registration?.capacityOverride;
	if (typeof cap === 'number' && cap > 0) return cap;
	return this.totalSpots;
});

// Virtual property to calculate remaining spots (for internal registration)
EventSchema.virtual('spotsLeft').get(function () {
	const cap = this.effectiveCapacity || 0;
	// treat 0 as unlimited
	if (!cap) return Infinity;
	const registeredCount = Array.isArray(this.registeredUsers) ? this.registeredUsers.length : 0;
	return Math.max(0, cap - registeredCount);
});

// Virtual property to check if the event is full
EventSchema.virtual('isFull').get(function () {
	const cap = this.effectiveCapacity || 0;
	if (!cap) return false; // unlimited
	const registeredCount = Array.isArray(this.registeredUsers) ? this.registeredUsers.length : 0;
	return registeredCount >= cap;
});

// Virtual property for registration status (accounts for external mode)
EventSchema.virtual('registrationStatus').get(function () {
	const now = new Date();

	// If registration explicitly disabled
	if (this.registration?.mode === 'none') return 'CLOSED';

	// External registration: report as EXTERNAL if URL present, otherwise CLOSED
	if (this.registration?.mode === 'external') {
		return this.registration?.externalUrl ? 'EXTERNAL' : 'CLOSED';
	}

	// Internal registration flow
	if (this.status === 'cancelled') return 'CANCELLED';
	if (this.status === 'completed' || this.status === 'ongoing') return 'CLOSED';
	if (this.isFull) return 'FULL';

	// If dates are not set, consider closed unless upcoming
	if (!this.registrationOpenDate || !this.registrationCloseDate) {
		return this.status === 'upcoming' ? 'CLOSED' : 'PAST';
	}

	if (now < this.registrationOpenDate) return 'COMING_SOON';
	if (now >= this.registrationOpenDate && now <= this.registrationCloseDate) return 'OPEN';
	if (now > this.registrationCloseDate) return 'CLOSED';

	return 'UNAVAILABLE';
});

// Text index for efficient searching on title, description, and tags
EventSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text' });
// Index for common filtering and sorting
EventSchema.index({ eventDate: 1, status: 1 });

// Pre-save hook to sanitize tags and validate dates + registration constraints
EventSchema.pre('save', function (next) {
	if (this.isModified('tags') && this.tags) {
		this.tags = this.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
	}

	if (
		this.registrationOpenDate &&
		this.registrationCloseDate &&
		this.registrationOpenDate > this.registrationCloseDate
	) {
		return next(new Error('Registration open date cannot be after the close date.'));
	}

	// If external mode ensure externalUrl exists
	if (this.registration?.mode === 'external') {
		if (!this.registration.externalUrl) {
			return next(
				new Error(
					'External registration URL is required when registration.mode is "external".'
				)
			);
		}
	}

	// Ensure capacity override is not negative and not greater than a sensible max (optional)
	if (this.registration?.capacityOverride && this.registration.capacityOverride < 0) {
		return next(new Error('registration.capacityOverride cannot be negative.'));
	}

	next();
});

// Ensure array defaults exist
EventSchema.add({
	registeredUsers: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: 'Member',
		default: [],
	},
});

EventSchema.plugin(aggregatePaginate);

const Event = mongoose.model('Event', EventSchema);

export default Event;
