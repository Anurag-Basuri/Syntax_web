import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/ApiError.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed MIME types and their extensions
const ALLOWED_FILE_TYPES = {
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/png': 'png',
	'application/pdf': 'pdf',
	'application/msword': 'doc',
};

// 5MB max file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_COUNT = 5; // Set a max count for array uploads

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, UPLOAD_DIR);
	},
	filename: (req, file, cb) => {
		const ext = ALLOWED_FILE_TYPES[file.mimetype];
		if (!ext) return cb(new Error('Invalid file type'));
		const uniqueName = `${uuidv4()}.${ext}`;
		cb(null, uniqueName);
	},
});

// File filter
const fileFilter = (req, file, cb) => {
	if (ALLOWED_FILE_TYPES[file.mimetype]) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type'));
	}
};

// Multer upload instance
const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: MAX_FILE_SIZE,
	},
});

/**
 * Middleware factory to handle multiple file uploads for a single field.
 *
 * @param {string} fieldName - The name of the field in the form-data.
 * @returns {Function} Express middleware.
 */
export const uploadFile = (fieldName) => (req, res, next) => {
	// Use upload.array() to handle multiple files
	upload.array(fieldName, MAX_FILE_COUNT)(req, res, (err) => {
		// If an error occurred and files were uploaded, delete them
		if (err && req.files && req.files.length > 0) {
			req.files.forEach((file) => {
				try {
					fs.unlinkSync(file.path);
				} catch (deleteErr) {
					console.error('Error deleting file after upload error:', deleteErr);
				}
			});
		}

		if (err instanceof multer.MulterError) {
			if (err.code === 'LIMIT_UNEXPECTED_FILE') {
				return next(new ApiError(400, `Too many files. Maximum is ${MAX_FILE_COUNT}.`));
			}
			return next(new ApiError(400, `File upload error: ${err.message}`));
		} else if (err) {
			return next(new ApiError(400, `File upload error: ${err.message}`));
		}

		// req.files is now correctly populated by upload.array()
		next();
	});
};
