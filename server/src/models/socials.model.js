import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// --- SCHEMA DEFINITION ---
const socialSchema = new mongoose.Schema(
	{
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Admin', // Posts are authored by Admins
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: [true, 'Title is required.'],
			trim: true,
			maxlength: [200, 'Title cannot exceed 200 characters.'],
		},
		content: {
			type: String,
			required: [true, 'Content/description is required.'],
			trim: true,
			maxlength: [5000, 'Content cannot exceed 5000 characters.'],
		},
		// Array of media (images or videos) associated with the post
		media: [
			{
				url: {
					type: String,
					required: true,
				},
				publicId: {
					type: String,
					required: true,
				},
			},
		],
		status: {
			type: String,
			enum: ['published', 'draft'],
			default: 'published',
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

// --- INDEXES ---

// Index for sorting posts by creation date
socialSchema.index({ createdAt: -1 });
// Text index for searching by title and content
socialSchema.index({ title: 'text', content: 'text' });

// --- PLUGIN ---

socialSchema.plugin(mongooseAggregatePaginate);

const Post = mongoose.model('Post', socialSchema);

export default Post;
