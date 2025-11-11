import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const memberSchema = new mongoose.Schema(
	{
		memberID: {
			type: String,
			default: () => uuidv4(),
			unique: true,
		},

		profilePicture: {
			url: {
				type: String,
				validate: {
					validator: function (v) {
						return /^https?:\/\/.*\.(png|jpg|jpeg)$/.test(v);
					},
					message: 'Profile picture must be a valid image URL',
				},
			},
			publicId: {
				type: String,
			},
		},
		resume: {
			url: {
				type: String,
				validate: {
					validator: function (v) {
						return /^https?:\/\/.*\.(pdf|doc|docx)$/.test(v);
					},
					message: 'Resume must be a valid document URL',
				},
			},
			publicId: {
				type: String,
			},
		},

		fullname: {
			type: String,
			required: [true, 'Full name is required'],
			trim: true,
			minlength: [2, 'Full name must be at least 2 characters'],
			maxlength: [50, 'Full name cannot exceed 50 characters'],
		},
		LpuId: {
			type: String,
			required: [true, 'LPU ID is required'],
			unique: true,
			validate: {
				validator: function (v) {
					return /^\d{8}$/.test(v);
				},
				message: 'LPU ID must be 8 digits',
			},
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
		},
		phone: {
			type: String,
			validate: {
				validator: function (v) {
					return /^\d{10}$/.test(v);
				},
				message: 'Phone number must be 10 digits',
			},
		},
		program: {
			type: String,
			trim: true,
		},
		year: {
			type: Number,
			enum: {
				values: [1, 2, 3, 4],
				message: 'Year must be between 1 and 4',
			},
		},
		skills: {
			type: [String],
			validate: {
				validator: function (v) {
					return v.length <= 15;
				},
				message: 'Skills array cannot exceed 15 items',
			},
		},

		hosteler: {
			type: Boolean,
			default: false,
		},
		hostel: {
			type: String,
			enum: [
				'',
				'BH-1',
				'BH-2',
				'BH-3',
				'BH-4',
				'BH-5',
				'BH-6',
				'BH-7',
				'GH-1',
				'GH-2',
				'GH-3',
				'GH-4',
				'GH-5',
				'GH-6',
				'GH-7',
			],
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [8, 'Password must be at least 8 characters'],
			maxlength: [128, 'Password cannot exceed 128 characters'],
			select: false,
		},

		socialLinks: [
			{
				platform: {
					type: String,
					required: [true, 'Platform is required'],
				},
				url: {
					type: String,
					required: [true, 'URL is required'],
					validate: {
						validator: function (v) {
							return /^https?:\/\/.*$/.test(v);
						},
						message: 'Invalid URL format',
					},
				},
			},
		],

		department: {
			type: [String],
			required: [true, 'At least one department is required'],
			validate: {
				validator: function (v) {
					const validDepartments = [
						'Technical',
						'Marketing',
						'Management',
						'Content Writing',
						'Media',
						'Design',
						'Coordinator',
						'Public Speaking',
					];
					return (
						Array.isArray(v) &&
						v.length > 0 &&
						v.every((dept) => validDepartments.includes(dept))
					);
				},
				message: 'Please select valid departments',
			},
		},
		designation: {
			type: [String],
			validate: {
				validator: function (v) {
					const validDesignations = [
						'CEO',
						'CTO',
						'CFO',
						'CMO',
						'COO',
						'Head',
						'member',
						'HR',
					];
					return (
						Array.isArray(v) && v.every((desig) => validDesignations.includes(desig))
					);
				},
				message: 'Please select valid designations',
			},
			default: ['member'],
		},
		bio: {
			type: String,
			maxlength: [500, 'Bio cannot exceed 500 characters'],
			trim: true,
		},
		joinedAt: {
			type: Date,
			default: Date.now,
		},
		role: {
			type: String,
			default: 'member',
			enum: ['member'],
		},
		status: {
			type: String,
			enum: ['active', 'banned', 'removed'],
			default: 'active',
		},
		restriction: {
			time: {
				type: Date,
				default: null,
			},
			reason: {
				type: String,
				trim: true,
				maxlength: [200, 'Restriction reason cannot exceed 200 characters'],
				default: null,
			},
			isRestricted: {
				type: Boolean,
				default: false,
			},
		},

		refreshToken: {
			type: String,
			select: false,
			default: null,
		},
		resetPasswordToken: {
			type: String,
			select: false,
		},
		resetPasswordExpires: {
			type: Date,
			select: false,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

memberSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
	}
	next();
});

memberSchema.methods.comparePassword = async function (password) {
	const check = await bcrypt.compare(password, this.password);
	return check;
};

memberSchema.methods.generateResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');

	// Hash and store in DB (you can choose to store plain, but hashed is safer)
	this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

	// Set expiration time (e.g., 15 mins)
	this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

	return resetToken;
};

// Add a virtual property to reliably identify leaders
memberSchema.virtual('isLeader').get(function () {
	const leadershipRoles = ['CEO', 'CTO', 'CFO', 'CMO', 'COO'];
	if (Array.isArray(this.designation)) {
		return this.designation.some((d) => leadershipRoles.includes(d));
	}
	return false;
});

memberSchema.virtual('id').get(function () {
	return this._id.toHexString();
});

// Virtuals for easier frontend consumption (handle array vs string mismatch)
memberSchema.virtual('primaryDesignation').get(function () {
	return Array.isArray(this.designation) ? this.designation[0] : this.designation;
});
memberSchema.virtual('primaryDepartment').get(function () {
	return Array.isArray(this.department) ? this.department[0] : this.department;
});

memberSchema.set('toJSON', {
	virtuals: true,
	transform: function (doc, ret) {
		delete ret.__v;
		delete ret.password;
		// Provide flattened fields explicitly
		ret.designationFlat = ret.primaryDesignation;
		ret.departmentFlat = ret.primaryDepartment;
		return ret;
	},
});

memberSchema.statics.findByLpuID = async function (lpuID) {
	// The model field is 'LpuId' (camel-case) — keep it consistent
	return this.findOne({ LpuId: lpuID }).exec();
};

memberSchema.methods.generateAuthToken = function () {
	return jwt.sign(
		{ id: this._id, memberID: this.memberID, role: this.role, designation: this.designation },
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' }
	);
};

memberSchema.methods.generateRefreshToken = function () {
	return jwt.sign({ id: this._id, role: this.role }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
	});
};

// Helper methods
memberSchema.methods.ban = function (reason, reviewTime) {
	this.status = 'banned';
	this.restriction.isRestricted = true;
	this.restriction.reason = reason;
	this.restriction.time = reviewTime || Date.now();
	return this.save();
};

memberSchema.methods.removeMember = function (reason, reviewTime) {
	this.status = 'removed';
	this.restriction.isRestricted = true;
	this.restriction.reason = reason;
	this.restriction.time = reviewTime || Date.now();
	return this.save();
};

memberSchema.methods.unban = function () {
	this.status = 'active';
	this.restriction.isRestricted = false;
	this.restriction.reason = null;
	this.restriction.time = null;
	return this.save();
};

const Member = mongoose.model('Member', memberSchema);

export default Member;
