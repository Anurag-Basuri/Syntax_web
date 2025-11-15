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
		caption: { type: String, trim: true, maxlength: 250 },
		alt: { type: String, trim: true, maxlength: 150 },
		resource_type: { type: String, enum: ['image', 'video'], default: 'image' },
	},
	{ timestamps: false, _id: false }
);

const speakerSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 120 },
		title: { type: String, trim: true, maxlength: 120 },
		photo: { type: mediaSchema },
		bio: { type: String, trim: true, maxlength: 1000 },
		company: { type: String, trim: true, maxlength: 140 },
		links: {
			twitter: String,
			linkedin: String,
			website: String,
		},
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
		durationMinutes: { type: Number, min: 0 },
		venue: {
			type: String,
			required: [true, 'Venue is required'],
			trim: true,
			minlength: [2, 'Venue must be at least 2 characters'],
			maxlength: [150, 'Venue cannot exceed 150 characters'],
		},
		locationCoordinates: {
			lat: Number,
			lng: Number,
		},
		room: { type: String, trim: true, maxlength: 60 },
		organizer: {
			type: String,
			trim: true,
			default: 'Syntax Organization',
			maxlength: [100, 'Organizer cannot exceed 100 characters'],
		},
		coOrganizers: { type: [String], default: [] },
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
		thumbnail: { type: mediaSchema },
		gallery: { type: [mediaSchema], default: [] },
		speakers: { type: [speakerSchema], default: [] },
		tags: { type: [String], default: [] },
		totalSpots: { type: Number, min: [0, 'Total spots cannot be negative'], default: 0 },
		ticketPrice: { type: Number, min: [0, 'Ticket price cannot be negative'], default: 0 },
		prerequisites: { type: [String], default: [] },
		resources: { type: [{ title: String, url: String }], default: [] },
		livestream: {
			enabled: { type: Boolean, default: false },
			platform: { type: String, trim: true },
			url: { type: String, trim: true },
		},
		registration: {
			mode: {
				type: String,
				enum: ['internal', 'external', 'none'],
				default: 'internal',
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
		registeredUsers: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: 'Member',
			default: [],
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
		isFeatured: { type: Boolean, default: false },
		language: { type: String, trim: true, default: 'en' },
		accessibility: {
			captions: { type: Boolean, default: false },
			accessibleSeating: { type: Boolean, default: false },
		},
		seo: {
			title: String,
			description: String,
			ogImage: mediaSchema,
		},
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

EventSchema.virtual('registrationStatus').get(function () {
	const now = new Date();
	if (this.registration?.mode === 'none') return 'CLOSED';
	if (this.registration?.mode === 'external') {
		return this.registration?.externalUrl ? 'EXTERNAL' : 'CLOSED';
	}
	if (this.status === 'cancelled') return 'CANCELLED';
	if (this.status === 'completed' || this.status === 'ongoing') return 'CLOSED';
	if (this.isFull) return 'FULL';
	if (!this.registrationOpenDate || !this.registrationCloseDate) {
		return this.status === 'upcoming' ? 'CLOSED' : 'PAST';
	}
	if (now < this.registrationOpenDate) return 'COMING_SOON';
	if (now >= this.registrationOpenDate && now <= this.registrationCloseDate) return 'OPEN';
	if (now > this.registrationCloseDate) return 'CLOSED';
	return 'UNAVAILABLE';
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

// Ensure array defaults exist (already present for registeredUsers)
EventSchema.plugin(aggregatePaginate);

const Event = mongoose.model('Event', EventSchema);

export default Event;
