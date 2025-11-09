import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const contactSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
			minlength: [2, 'Name must be at least 2 characters'],
			maxlength: [50, 'Name cannot exceed 50 characters'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			lowercase: true,
			validate: {
				validator: function (v) {
					return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
				},
				message: 'Invalid email format',
			},
		},
		phone: {
			type: Number,
			required: [true, 'Phone number is required'],
			validate: {
				validator: function (v) {
					return /^\d{10}$/.test(v);
				},
				message: 'Phone number must be 10 digits',
			},
		},
		lpuID: {
			type: String,
			required: [true, 'LPU ID is required'],
			validate: {
				validator: function (v) {
					return /^\d{8}$/.test(v);
				},
				message: 'LPU ID must be 8 digits',
			},
		},

		subject: {
			type: String,
			trim: true,
			minlength: [2, 'Subject must be at least 2 characters'],
			maxlength: [100, 'Subject cannot exceed 100 characters'],
		},
		message: {
			type: String,
			required: [true, 'Message is required'],
			trim: true,
			minlength: [5, 'Message must be at least 5 characters'],
			maxlength: [500, 'Message cannot exceed 500 characters'],
		},
		status: {
			type: String,
			enum: {
				values: ['pending', 'resolved', 'closed'],
				message: 'Status must be either pending, resolved, or closed',
			},
			default: 'pending',
		},
	},
	{
		timestamps: true,
	}
);

contactSchema.index({ name: 'text', email: 'text', subject: 'text', message: 'text' });

contactSchema.plugin(mongooseAggregatePaginate);

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
