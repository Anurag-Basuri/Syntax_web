import { apiClient, publicClient } from './api.js';

/**
 * Normalize server pagination responses into a consistent shape:
 * { docs, totalDocs, page, totalPages, limit, hasPrevPage, hasNextPage, prevPage, nextPage }
 */
const normalizePagination = (raw) => {
	const payload = raw?.data ?? raw ?? {};
	const data = payload.data ?? payload.docs ?? payload;
	if (Array.isArray(data)) {
		const docs = payload.data || payload.docs || data;
		const pagination = payload.pagination || payload;
		return {
			docs,
			totalDocs: pagination.totalDocs ?? pagination.total ?? docs.length,
			page: pagination.page ?? pagination.currentPage ?? 1,
			totalPages: pagination.totalPages ?? pagination.total ?? 1,
			limit: pagination.limit ?? pagination.perPage ?? docs.length,
			hasPrevPage: !!pagination.hasPrevPage,
			hasNextPage: !!pagination.hasNextPage,
			prevPage: pagination.prevPage ?? null,
			nextPage: pagination.nextPage ?? null,
		};
	}
	if (payload.data && !Array.isArray(payload.data)) {
		return { docs: [payload.data], totalDocs: 1, page: 1, totalPages: 1, limit: 1 };
	}
	if (Array.isArray(payload.docs)) {
		return {
			docs: payload.docs,
			totalDocs: payload.totalDocs ?? payload.docs.length,
			page: payload.page ?? 1,
			totalPages: payload.totalPages ?? 1,
			limit: payload.limit ?? payload.docs.length,
			hasPrevPage: !!payload.hasPrevPage,
			hasNextPage: !!payload.hasNextPage,
			prevPage: payload.prevPage ?? null,
			nextPage: payload.nextPage ?? null,
		};
	}
	return { docs: [], totalDocs: 0, page: 1, totalPages: 0, limit: 0 };
};

const extractError = (err, fallback = 'Request failed') =>
	err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

const clientFor = (admin = false) => (admin ? apiClient : publicClient);

// ---------------- Public services ----------------
export const getArvantisLandingData = async () => {
	try {
		const resp = await publicClient.get('/api/v1/arvantis/landing');
		return resp.data?.data ?? null;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to fetch landing data.'));
	}
};

export const getAllFests = async (params = {}, options = { admin: false }) => {
	try {
		const client = clientFor(options.admin);
		const resp = await client.get('/api/v1/arvantis', { params });
		return normalizePagination(resp.data ?? resp);
	} catch (err) {
		throw new Error(extractError(err, 'Failed to fetch fests.'));
	}
};

export const getFestDetails = async (identifier, options = { admin: false }) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const client = clientFor(options.admin);
		const resp = await client.get(`/api/v1/arvantis/${encodeURIComponent(identifier)}`);
		return resp.data?.data ?? null;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to fetch fest details.'));
	}
};

// ---------------- Admin services ----------------
export const createFest = async (festData) => {
	try {
		const isForm = festData instanceof FormData;
		const resp = isForm
			? await apiClient.post('/api/v1/arvantis', festData)
			: await apiClient.post('/api/v1/arvantis', festData);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to create fest.'));
	}
};

export const updateFestDetails = async (identifier, updateData) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/update`,
			updateData
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update fest details.'));
	}
};

export const deleteFest = async (identifier) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const resp = await apiClient.delete(`/api/v1/arvantis/${encodeURIComponent(identifier)}`);
		return resp.status === 204 ? { success: true } : resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to delete fest.'));
	}
};

export const duplicateFest = async (identifier, year) => {
	if (!identifier || !year) throw new Error('Identifier and target year required.');
	try {
		const resp = await apiClient.post(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/duplicate`,
			{ year }
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to duplicate fest.'));
	}
};

export const setFestStatus = async (identifier, status) => {
	if (!identifier || !status) throw new Error('Identifier and status required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/status`,
			{ status }
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to set fest status.'));
	}
};

export const updatePresentation = async (identifier, data) => {
	if (!identifier || !data) throw new Error('Identifier and presentation data required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/presentation`,
			data
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update presentation.'));
	}
};

export const updateSocialLinks = async (identifier, socialLinks) => {
	if (!identifier || !socialLinks) throw new Error('Identifier and socialLinks required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/social-links`,
			socialLinks
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update social links.'));
	}
};

export const updateThemeColors = async (identifier, themeColors) => {
	if (!identifier || !themeColors) throw new Error('Identifier and themeColors required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/theme`,
			themeColors
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update theme colors.'));
	}
};

export const setVisibility = async (identifier, visibility) => {
	if (!identifier || !visibility) throw new Error('Identifier and visibility required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/visibility`,
			{ visibility }
		);
		return resp.data?.data ?? resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update visibility.'));
	}
};

// Partners
export const addPartner = async (identifier, formData) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const resp = await apiClient.post(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/partners`,
			formData
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to add partner.'));
	}
};

export const updatePartner = async (identifier, partnerName, formData) => {
	if (!identifier || !partnerName) throw new Error('Identifier and partnerName required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/partners/${encodeURIComponent(
				partnerName
			)}`,
			formData
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update partner.'));
	}
};

export const removePartner = async (identifier, partnerName) => {
	if (!identifier || !partnerName) throw new Error('Identifier and partnerName required.');
	try {
		const resp = await apiClient.delete(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/partners/${encodeURIComponent(
				partnerName
			)}`
		);
		return resp.status === 204 ? { success: true } : resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to remove partner.'));
	}
};

export const reorderPartners = async (identifier, order) => {
	if (!identifier || !Array.isArray(order))
		throw new Error('Identifier and order array required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/partners/reorder`,
			{ order }
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to reorder partners.'));
	}
};

// Events
export const linkEventToFest = async (identifier, eventId) => {
	if (!identifier || !eventId) throw new Error('Identifier and eventId required.');
	try {
		const resp = await apiClient.post(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/events`,
			{ eventId }
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to link event to fest.'));
	}
};

export const unlinkEventFromFest = async (identifier, eventId) => {
	if (!identifier || !eventId) throw new Error('Identifier and eventId required.');
	try {
		const resp = await apiClient.delete(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/events/${encodeURIComponent(
				eventId
			)}`
		);
		return resp.data?.data ?? { success: true };
	} catch (err) {
		throw new Error(extractError(err, 'Failed to unlink event from fest.'));
	}
};

// Media: poster / hero / gallery / bulk delete
// Note: server route/controller names use addFestPoster / addGalleryMedia etc.
// Client exposes clear names and keeps aliases for backward compatibility.

export const addFestPoster = async (identifier, formData) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/poster`,
			formData
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to upload poster.'));
	}
};
export const updateFestPoster = addFestPoster; // alias

export const removeFestPoster = async (identifier) => {
	if (!identifier) throw new Error('Identifier required.');
	try {
		const resp = await apiClient.delete(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/poster`
		);
		return resp.status === 204 ? { success: true } : resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to remove poster.'));
	}
};

export const updateFestHero = async (identifier, formData) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/hero`,
			formData
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update hero media.'));
	}
};
export const addFestHero = updateFestHero; // alias

export const removeFestHero = async (identifier) => {
	if (!identifier) throw new Error('Identifier required.');
	try {
		const resp = await apiClient.delete(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/hero`
		);
		return resp.status === 204 ? { success: true } : resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to remove hero media.'));
	}
};

export const addGalleryMedia = async (identifier, formData) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const resp = await apiClient.post(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/gallery`,
			formData
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to add gallery media.'));
	}
};

export const removeGalleryMedia = async (identifier, publicId) => {
	if (!identifier || !publicId) throw new Error('Identifier and publicId required.');
	try {
		const resp = await apiClient.delete(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/gallery/${encodeURIComponent(
				publicId
			)}`
		);
		return resp.status === 204 ? { success: true } : resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to remove gallery media.'));
	}
};

export const reorderGallery = async (identifier, order) => {
	if (!identifier || !Array.isArray(order))
		throw new Error('Identifier and order array required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/gallery/reorder`,
			{ order }
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to reorder gallery.'));
	}
};

export const bulkDeleteMedia = async (identifier, publicIds) => {
	if (!identifier || !Array.isArray(publicIds))
		throw new Error('Identifier and publicIds array required.');
	try {
		const resp = await apiClient.post(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/media/bulk-delete`,
			{ publicIds }
		);
		return resp.data?.data ?? resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to bulk delete media.'));
	}
};

// Exports, analytics, reports
export const exportFestsCSV = async () => {
	try {
		const resp = await apiClient.get('/api/v1/arvantis/export/csv', { responseType: 'blob' });
		return resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to export CSV.'));
	}
};

export const getFestAnalytics = async () => {
	try {
		const resp = await apiClient.get('/api/v1/arvantis/analytics/overview');
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to fetch analytics.'));
	}
};

export const getFestStatistics = async () => {
	try {
		const resp = await apiClient.get('/api/v1/arvantis/statistics/overview');
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to fetch statistics.'));
	}
};

export const generateFestReport = async (identifier) => {
	if (!identifier) throw new Error('Fest identifier is required.');
	try {
		const resp = await apiClient.get(
			`/api/v1/arvantis/reports/${encodeURIComponent(identifier)}`
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to generate report.'));
	}
};

// Tracks
export const addTrack = async (identifier, payload) => {
	if (!identifier || !payload?.title) throw new Error('Identifier and track title required.');
	try {
		const resp = await apiClient.post(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/tracks`,
			payload
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to add track.'));
	}
};

export const updateTrack = async (identifier, trackKey, payload) => {
	if (!identifier || !trackKey) throw new Error('Identifier and trackKey required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/tracks/${encodeURIComponent(
				trackKey
			)}`,
			payload
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update track.'));
	}
};

export const removeTrack = async (identifier, trackKey) => {
	if (!identifier || !trackKey) throw new Error('Identifier and trackKey required.');
	try {
		const resp = await apiClient.delete(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/tracks/${encodeURIComponent(
				trackKey
			)}`
		);
		return resp.status === 204 ? { success: true } : resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to remove track.'));
	}
};

export const reorderTracks = async (identifier, order) => {
	if (!identifier || !Array.isArray(order))
		throw new Error('Identifier and order array required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/tracks/reorder`,
			{ order }
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to reorder tracks.'));
	}
};

// FAQs
export const addFAQ = async (identifier, payload) => {
	if (!identifier || !payload?.question || !payload?.answer)
		throw new Error('Identifier, question and answer required.');
	try {
		const resp = await apiClient.post(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/faqs`,
			payload
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to add FAQ.'));
	}
};

export const updateFAQ = async (identifier, faqId, payload) => {
	if (!identifier || !faqId) throw new Error('Identifier and faqId required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/faqs/${encodeURIComponent(faqId)}`,
			payload
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to update FAQ.'));
	}
};

export const removeFAQ = async (identifier, faqId) => {
	if (!identifier || !faqId) throw new Error('Identifier and faqId required.');
	try {
		const resp = await apiClient.delete(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/faqs/${encodeURIComponent(faqId)}`
		);
		return resp.status === 204 ? { success: true } : resp.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to remove FAQ.'));
	}
};

export const reorderFAQs = async (identifier, order) => {
	if (!identifier || !Array.isArray(order))
		throw new Error('Identifier and order array required.');
	try {
		const resp = await apiClient.patch(
			`/api/v1/arvantis/${encodeURIComponent(identifier)}/faqs/reorder`,
			{ order }
		);
		return resp.data?.data;
	} catch (err) {
		throw new Error(extractError(err, 'Failed to reorder FAQs.'));
	}
};
