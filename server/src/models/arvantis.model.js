import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// Minimal slug helper (no extra dependency)
const slugify = (str = '') =>
    str
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');

// Re-usable URL validator (simple, permissive)
const urlRegex =
    /^(https?:\/\/)?((([a-zA-Z0-9\-_]+\.)+[a-zA-Z]{2,})|localhost)(:\d{2,5})?(\/[^\s]*)?$/;

// --- Shared Media Schema ---
const mediaSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (v) => Boolean(v) && urlRegex.test(v),
                message: (props) => `${props.value} is not a valid URL`,
            },
        },
        publicId: {
            type: String,
            required: true,
            trim: true,
        },
        resource_type: {
            type: String,
            enum: ['image', 'video'],
            default: 'image',
        },
        caption: {
            type: String,
            trim: true,
            maxlength: 250,
        },
        alt: {
            type: String,
            trim: true,
            maxlength: 150,
        },
    },
    { _id: false }
);

// --- Sub-schema for Partners (Sponsors, Collaborators) ---
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

// --- Main Arvantis Fest Schema ---
const arvantisSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: false,
            default: 'Arvantis',
            trim: true,
            maxlength: 140,
        },
        year: {
            type: Number,
            required: [true, 'Fest year is required.'],
            index: true,
            validate: {
                validator: (v) =>
                    Number.isInteger(v) && v >= 2000 && v <= new Date().getFullYear() + 10,
                message: (props) => `${props.value} is not a valid year`,
            },
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        tagline: {
			type: String,
			trim: true, 
			maxlength: 200
		},
        description: {
			type: String,
			trim: true, 
			maxlength: 5000 
		},
        startDate: {
            type: Date,
            required: [true, 'Start date is required.'],
            index: true,
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required.'],
            index: true,
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'],
            default: 'upcoming',
            index: true,
        },
        events: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Event',
            },
        ],
        partners: {
            type: [partnerSchema],
            default: [],
        },
        poster: {
            type: mediaSchema,
        },
        heroMedia: {
            type: mediaSchema,
        },
        gallery: {
            type: [mediaSchema],
            default: [],
        },
        location: {
            type: String,
            trim: true,
            default: 'Lovely Professional University',
            maxlength: 200,
        },
        contactEmail: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: (v) => !v || /^\S+@\S+\.\S+$/.test(v),
                message: (props) => `${props.value} is not a valid email`,
            },
        },
        contactPhone: {
			type: String,
			trim: true,
			maxlength: 40 
		},
        socialLinks: {
            website: { 
				type: String, 
				trim: true 
			},
            twitter: { 
				type: String, 
				trim: true 
			},
            instagram: { 
				type: String, 
				trim: true 
			},
            facebook: { 
				type: String, 
				trim: true 
			},
            linkedin: { 
				type: String, 
				trim: true 
			},
        },
        themeColors: {
            primary: { 
				type: String, 
				trim: true, 
				default: '#06b6d4' 
			},
            accent: { 
				type: String, 
				trim: true, 
				default: '#0284c7' 
			},
            bg: { 
				type: String, 
				trim: true, 
				default: '#0f172a' 
			},
        },
		// Additional fields for extended functionality
        tracks: {
            type: [
                {
                    key: String,
                    title: String,
                    description: String,
                    color: String,
                },
            ],
            default: [],
        },
        faqs: {
            type: [
                {
                    question: String,
                    answer: String,
                },
            ],
            default: [],
        },
        seo: {
            title: String,
            description: String,
            ogImage: mediaSchema,
        },
        visibility: { 
			type: String, enum: ['public', 'private', 'unlisted'], 
			default: 'public'
		},
		
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// --- VIRTUALS ---
arvantisSchema.virtual('durationDays').get(function () {
    if (!this.startDate || !this.endDate) return null;
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
});

arvantisSchema.virtual('id').get(function () {
    return this._id?.toString();
});

arvantisSchema.virtual('computedStatus').get(function () {
    const now = new Date();
    if (this.status === 'cancelled' || this.status === 'postponed') return this.status;
    if (this.startDate && this.endDate) {
        if (now < this.startDate) return 'upcoming';
        if (now >= this.startDate && now <= this.endDate) return 'ongoing';
        return 'completed';
    }
    return this.status;
});

arvantisSchema.virtual('upcomingEventsCount').get(function () {
    return Array.isArray(this.events) ? this.events.length : 0;
});

arvantisSchema.virtual('totalPartners').get(function () {
    return Array.isArray(this.partners) ? this.partners.length : 0;
});

arvantisSchema.virtual('hero').get(function () {
    return this.heroMedia || this.poster || (this.gallery && this.gallery[0]) || null;
});

// --- MIDDLEWARE (HOOKS) ---
arvantisSchema.pre('save', async function (next) {
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
        return next(new Error('End date cannot be before the start date.'));
    }

    if (this.isModified('name') || this.isModified('year') || !this.slug) {
        const base = `${slugify(this.name || 'arvantis')}-${this.year || new Date().getFullYear()}`;
        let candidate = base;
        let i = 0;
        /* eslint-disable no-await-in-loop */
        while (
            await mongoose.models.Arvantis.findOne({
                slug: candidate,
                _id: { $ne: this._id },
            }).lean()
        ) {
            i += 1;
            candidate = `${base}-${i}`;
        }
        /* eslint-enable no-await-in-loop */
        this.slug = candidate;
    }

    // sanitize social links
    if (this.socialLinks) {
        Object.keys(this.socialLinks).forEach((k) => {
            if (this.socialLinks[k] && !/^https?:\/\//i.test(this.socialLinks[k])) {
                this.socialLinks[k] = `https://${this.socialLinks[k]}`;
            }
        });
    }

    next();
});

arvantisSchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getFilter()).lean();
        if (doc && Array.isArray(doc.events) && doc.events.length > 0) {
            await mongoose
                .model('Event')
                .updateMany({ _id: { $in: doc.events } }, { $pull: { arvantis: doc._id } })
                .exec();
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.warn('Arvantis cleanup failed', err);
    }
    next();
});

// --- INDEXES ---
arvantisSchema.index({ year: -1 });
arvantisSchema.index({ slug: 1 }, { unique: true, sparse: true });
arvantisSchema.index({ name: 'text', description: 'text' });
arvantisSchema.index({ startDate: 1, endDate: 1, status: 1 });

// --- METHODS / STATICS ---
arvantisSchema.methods.isOngoing = function () {
    const now = new Date();
    return this.startDate && this.endDate && now >= this.startDate && now <= this.endDate;
};

arvantisSchema.methods.isUpcoming = function () {
    const now = new Date();
    return this.startDate && now < this.startDate;
};

arvantisSchema.statics.findByYear = function (year) {
    return this.findOne({ year }).exec();
};

// --- PLUGIN ---
arvantisSchema.plugin(mongooseAggregatePaginate);

const Arvantis = mongoose.model('Arvantis', arvantisSchema);

export default Arvantis;
