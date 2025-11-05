import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const adminSchema = new mongoose.Schema(
	{
		adminID: {
			type: String,
			default: () => uuidv4(),
			unique: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},

		refreshToken: {
			type: String,
			select: false,
		},

		resetPasswordToken: String,
		resetPasswordExpires: Date,
	},
	{ timestamps: true }
);

// Hash password before save
adminSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
adminSchema.methods.generateAuthToken = function () {
	return jwt.sign(
		{ id: this._id, role:'admin', adminID: this.adminID },
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' }
	);
};

// Generate refresh token
adminSchema.methods.generateRefreshToken = function () {
	return jwt.sign(
		{ id: this._id, role: 'admin' },
		process.env.REFRESH_TOKEN_SECRET,
		{ expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
	);
};

// Prevent password from being returned
adminSchema.methods.toJSON = function () {
	const admin = this.toObject();
	delete admin.password;
	return admin;
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
