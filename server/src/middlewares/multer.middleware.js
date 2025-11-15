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
	'image/webp': 'webp',
	'image/gif': 'gif',
	'video/mp4': 'mp4',
	'video/webm': 'webm',
	'video/ogg': 'ogg',
	'application/pdf': 'pdf',
	'application/msword': 'doc',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	'application/vnd.ms-excel': 'xls',
};

// 5MB max file size for images, let's increase for videos
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
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
 * Middleware factory to handle file uploads for a single field.
 *
 * @param {string} fieldName - The name of the field in the form-data.
 * @param {{ multiple?: boolean; maxCount?: number }} options
 * @returns {Function} Express middleware.
 */
export const uploadFile = (fieldName, options = {}) => {
	const { multiple = false, maxCount = MAX_FILE_COUNT } = options;

	return (req, res, next) => {
		// Choose the proper multer handler
		const handler = multiple ? upload.array(fieldName, maxCount) : upload.single(fieldName);

		console.log(
			`[MULTER] starting upload handler for field="${fieldName}" multiple=${multiple}`
		);

		handler(req, res, (err) => {
			// Normalize multer outputs and log
			if (!multiple) {
				// multer.single sets req.file (single) and may set req.files undefined
				if (req.file) {
					console.log(
						`[MULTER] received single file: field="${req.file.fieldname}" filename="${req.file.filename}" size=${req.file.size}`
					);
				} else {
					console.log('[MULTER] no single file received');
				}
			} else {
				// multer.array sets req.files (array)
				const files = req.files || [];
				console.log(`[MULTER] received ${files.length} file(s) for field="${fieldName}"`);
				files.forEach((f) => {
					console.log(`[MULTER]  - ${f.filename} (${f.mimetype}, ${f.size} bytes)`);
				});
			}

			// Clean up any saved files if an error occurred
			if (err) {
				const toDelete = [];
				if (req.file) toDelete.push(req.file);
				if (req.files && req.files.length) toDelete.push(...req.files);

				if (toDelete.length > 0) {
					toDelete.forEach((file) => {
						try {
							fs.unlinkSync(file.path);
							console.log(
								`[MULTER] deleted uploaded file due to error: ${file.path}`
							);
						} catch (e) {
							console.error('[MULTER] error deleting file after upload error:', e);
						}
					});
				}
			}

			// Handle multer errors and convert to ApiError
			if (err instanceof multer.MulterError) {
				if (err.code === 'LIMIT_UNEXPECTED_FILE') {
					return next(
						new ApiError(
							400,
							`Too many files for field '${fieldName}'. Maximum is ${maxCount}.`
						)
					);
				}
				return next(new ApiError(400, `File upload error: ${err.message}`));
			} else if (err) {
				return next(new ApiError(400, `File upload error: ${err.message}`));
			}

			// Final normalization:
			// - for single: ensure req.files is an array with zero or one item (useful for downstream code that expects arrays)
			// - for multiple: req.files is already an array
			if (!multiple) {
				req.files = req.file ? [req.file] : [];
			} else {
				req.file = undefined; // ensure single slot isn't set for arrays
			}

			console.log(`[MULTER] upload handler completed successfully for field="${fieldName}"`);
			next();
		});
	};
};
