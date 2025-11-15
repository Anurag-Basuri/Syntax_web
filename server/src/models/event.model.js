import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

// Sub-schema for media (posters, gallery)
const mediaSchema = new mongoose.Schema(
	{
		url: {
			type: String,
			required: [true, 'Poster URL is required'],
			match: [
				/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/,
				'Please provide a valid URL for the poster.',
			],
		},
		publicId: {
			type: String,
			required: [true, 'Cloudinary public_id is required for the poster'],
		},
		caption: {
			type: String,
			trim: true,
			maxlength: 250,
		},
		resource_type: {
			type: String,
			enum: ['image', 'video'],
			default: 'image',
		},
	},
	{ timestamps: false, _id: false }
);

const speakerSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		title: {
			type: String,
			trim: true,
			maxlength: 120,
		},
		photo: {
			type: mediaSchema,
		},
		bio: {
			type: String,
			trim: true,
			maxlength: 1000,
		},
		links: {
			twitter: String,
			linkedin: String,
			website: String,
		},
	},
	{ _id: false }
);

const partnerSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		logo: {
			type: mediaSchema,
			required: false,
		},
		website: {
			type: String,
			trim: true,
			validate: {
				validator: (v) => !v || urlRegex.test(v),
				message: (props) => `${props.value} is not a valid website URL`,
			},
			set: (v) => {
				if (!v) return v;
				if (!/^https?:\/\//i.test(v)) return `https://${v}`;
				return v;
			},
		},
		tier: {
			type: String,
			trim: true,
			maxlength: 40,
		},
		booth: {
			type: String,
			trim: true,
			maxlength: 40,
		},
		description: { type: String, trim: true, maxlength: 500 },
	},
	{ _id: false }
);

// --- Main Event Schema ---
const EventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true,
			minlength: [3, 'Title must be at least 3 characters long'],
			maxlength: [150, 'Title cannot exceed 150 characters'],
		},
		slug: { type: String, trim: true, lowercase: true, index: true },
		description: {
			type: String,
			required: [true, 'Description is required'],
			trim: true,
			minlength: [10, 'Description must be at least 10 characters long'],
			maxlength: [2000, 'Description cannot exceed 2000 characters'],
		},
		eventDate: {
			type: Date,
			required: [true, 'Event date and time are required'],
			validate: {
				validator: function (v) {
					return v.getTime() >= Date.now() - 60000;
				},
				message: 'Event date cannot be in the past.',
			},
		},
		eventTime: {
			type: String,
			trim: true,
			validate: {
				validator: function (v) {
					if (!v) return true;
					return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
				},
				message: 'Event time must be in HH:MM 24-hour format.',
			},
		},
		venue: {
			type: String,
			required: [true, 'Venue is required'],
			trim: true,
			minlength: [2, 'Venue must be at least 2 characters'],
			maxlength: [150, 'Venue cannot exceed 150 characters'],
		},
		room: {
			type: String,
			trim: true,
			maxlength: 60,
		},
		organizer: {
			type: String,
			trim: true,
			default: 'Syntax Organization',
			maxlength: [100, 'Organizer cannot exceed 100 characters'],
		},
		coOrganizers: {
			type: [String],
			default: [],
		},
		category: {
			type: String,
			required: [true, 'Event category is required (e.g., Workshop, Competition)'],
			trim: true,
		},
		subcategory: { type: String, trim: true },
		posters: {
			type: [mediaSchema],
			default: [],
			validate: {
				validator: function (v) {
					return Array.isArray(v) && v.length <= 5;
				},
				message: 'You can upload a maximum of 5 posters per event.',
			},
		},
		gallery: {
			type: [mediaSchema],
			default: [],
		},
		speakers: {
			type: [speakerSchema],
			default: [],
		},
		totalSpots: {
			type: Number,
			min: [0, 'Total spots cannot be negative'],
			default: 0,
		},
		ticketPrice: {
			type: Number,
			min: [0, 'Ticket price cannot be negative'],
			default: 0,
		},
		tickets: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Ticket',
			},
		],
		prerequisites: {
			type: [String],
			default: [],
		},
		resources: {
			type: [{ title: String, url: String }],
			default: [],
		},
		registration: {
			mode: {
				type: String,
				enum: ['internal', 'external', 'none'],
				default: 'none',
				required: true,
			},
			externalUrl: {
				type: String,
				trim: true,
				validate: {
					validator: function (v) {
						if (!v) return true;
						return /^(https?:\/\/)?((([a-zA-Z0-9\-_]+\.)+[a-zA-Z]{2,})|localhost)(:\d{2,5})?(\/[^\s]*)?$/.test(
							v
						);
					},
					message: 'Invalid external registration URL',
				},
			},
			allowGuests: { type: Boolean, default: true },
			capacityOverride: { type: Number, min: [0, 'Capacity cannot be negative'] },
		},
		status: {
			type: String,
			enum: {
				values: ['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'],
				message:
					'Status must be one of: upcoming, ongoing, completed, cancelled, postponed',
			},
			default: 'upcoming',
		},
		registrationOpenDate: { type: Date },
		registrationCloseDate: { type: Date },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtuals
EventSchema.virtual('isFree').get(function () {
	return this.ticketPrice === 0;
});

EventSchema.virtual('effectiveCapacity').get(function () {
	const cap = this.registration?.capacityOverride;
	if (typeof cap === 'number' && cap > 0) return cap;
	return this.totalSpots;
});

EventSchema.virtual('spotsLeft').get(function () {
	const cap = this.effectiveCapacity || 0;
	if (!cap) return Infinity;
	const registeredCount = Array.isArray(this.registeredUsers) ? this.registeredUsers.length : 0;
	return Math.max(0, cap - registeredCount);
});

EventSchema.virtual('isFull').get(function () {
	const cap = this.effectiveCapacity || 0;
	if (!cap) return false;
	const registeredCount = Array.isArray(this.registeredUsers) ? this.registeredUsers.length : 0;
	return registeredCount >= cap;
});

// new virtual: ticket count (reads tickets array length safely)
EventSchema.virtual('ticketCount').get(function () {
	return Array.isArray(this.tickets) ? this.tickets.length : 0;
});

// Helper: check if now is within optional open/close window
function _isWithinWindow(open, close) {
	const now = Date.now();
	if (open && now < new Date(open).getTime()) return false;
	if (close && now > new Date(close).getTime()) return false;
	return true;
}

// Returns boolean: is registration currently open according to mode & optional window
EventSchema.virtual('isRegistrationOpen').get(function () {
	const mode = this.registration?.mode || 'none';

	// If mode is 'none' -> not open
	if (mode === 'none') return false;

	// If mode is 'external' or 'internal' we respect registration window if provided,
	// otherwise assume open.
	const open = this.registrationOpenDate;
	const close = this.registrationCloseDate;
	return _isWithinWindow(open, close);
});

// Human-friendly registration info for frontend consumption
EventSchema.virtual('registrationInfo').get(function () {
	const mode = this.registration?.mode || 'none';
	const isOpen = this.isRegistrationOpen;
	const externalUrl = this.registration?.externalUrl || null;

	// Compose message + CTA info
	if (mode === 'none') {
		return {
			mode: 'none',
			isOpen: false,
			message: 'Registration has not started.',
			actionLabel: null,
			actionUrl: null,
		};
	}

	// External registration flow
	if (mode === 'external') {
		if (!externalUrl) {
			return {
				mode: 'external',
				isOpen: false,
				message: 'External registration is configured but no link is provided.',
				actionLabel: null,
				actionUrl: null,
			};
		}
		if (!isOpen) {
			return {
				mode: 'external',
				isOpen: false,
				message: 'External registration is not open at the moment.',
				actionLabel: null,
				actionUrl: externalUrl,
			};
		}
		// open & external link present
		return {
			mode: 'external',
			isOpen: true,
			message: 'Register on the external site.',
			actionLabel: 'Register (External)',
			actionUrl: externalUrl,
		};
	}

	// Internal registration flow
	if (mode === 'internal') {
		if (!isOpen) {
			return {
				mode: 'internal',
				isOpen: false,
				message: 'Registration is not open yet.',
				actionLabel: null,
				actionUrl: null,
			};
		}
		// Provide a default internal CTA path (frontend can map to route using id/slug)
		const actionUrl = this.slug
			? `/events/${this.slug}/register`
			: `/events/${this._id}/register`;
		return {
			mode: 'internal',
			isOpen: true,
			message: 'Register on our website.',
			actionLabel: 'Register',
			actionUrl,
		};
	}

	// Fallback
	return {
		mode,
		isOpen: false,
		message: 'Registration is not available.',
		actionLabel: null,
		actionUrl: null,
	};
});

// Virtual for simplified registration status
EventSchema.virtual('registrationStatus').get(function () {
	const info = this.registrationInfo;
	if (info.mode === 'none') return 'NOT_STARTED';
	if (info.mode === 'external') return info.isOpen ? 'OPEN_EXTERNAL' : 'CLOSED';
	if (info.mode === 'internal') return info.isOpen ? 'OPEN_INTERNAL' : 'CLOSED';
	return 'CLOSED';
});

// Indexes
EventSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text' });
EventSchema.index({ eventDate: 1, status: 1 });

// Pre-save sanitization and validations
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

	if (this.registration?.mode === 'external' && !this.registration.externalUrl) {
		return next(
			new Error('External registration URL is required when registration.mode is "external".')
		);
	}

	if (this.registration?.capacityOverride && this.registration.capacityOverride < 0) {
		return next(new Error('registration.capacityOverride cannot be negative.'));
	}

	// Ensure tickets belong only to events with internal registration
	if (this.tickets && this.tickets.length > 0 && this.registration?.mode !== 'internal') {
		return next(
			new Error(
				'Tickets are only allowed when registration.mode is "internal". Set registration.mode to "internal" or clear tickets.'
			)
		);
	}

	// Generate slug if missing
	if (!this.slug && this.title) {
		let base = this.title
			.toString()
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]+/g, '')
			.replace(/--+/g, '-');
		this.slug = `${base}-${Date.now().toString().slice(-5)}`;
	}

	next();
});

// Prevent changing registration.mode to non-internal if tickets exist
EventSchema.pre('findOneAndUpdate', async function (next) {
	try {
		const update = this.getUpdate() || {};
		// Support nested $set
		const maybeSet = update.$set || update;
		const newMode =
			maybeSet.registration && typeof maybeSet.registration.mode !== 'undefined'
				? maybeSet.registration.mode
				: undefined;

		if (typeof newMode !== 'undefined' && newMode !== 'internal') {
			// Check existing document for tickets
			const doc = await this.model
				.findOne(this.getQuery())
				.select('tickets registration')
				.lean();
			const hasTickets = doc && Array.isArray(doc.tickets) && doc.tickets.length > 0;
			if (hasTickets) {
				return next(
					new Error(
						'Cannot change registration.mode to non-internal while tickets exist for this event. Remove tickets first or keep registration.mode "internal".'
					)
				);
			}
		}
		return next();
	} catch (err) {
		return next(err);
	}
});

// Ensure array defaults exist (already present for registeredUsers)
EventSchema.plugin(aggregatePaginate);

const Event = mongoose.model('Event', EventSchema);

export default Event;
