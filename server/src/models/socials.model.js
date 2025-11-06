import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// --- POST SCHEMA ---
const postSchema = new mongoose.Schema(
	{
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Admin', // Posts are authored by Admins
			required: true,
			index: true,
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
postSchema.index({ createdAt: -1 });
// Text index for searching by title and content
postSchema.index({ title: 'text', content: 'text' });

// --- PLUGIN ---

postSchema.plugin(mongooseAggregatePaginate);

const Post = mongoose.model('Post', postSchema);

export default Post;
