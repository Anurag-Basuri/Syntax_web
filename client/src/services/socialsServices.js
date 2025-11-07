import { apiClient, publicClient } from './api.js';

// Fetches all social posts with pagination.
export const getAllPosts = async (params) => {
	try {
		const response = await publicClient.get('/api/v1/socials', { params });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch posts.');
	}
};

// Fetches a single post by its ID.
export const getPostById = async (id) => {
	try {
		const response = await publicClient.get(`/api/v1/socials/${id}`);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch post.');
	}
};

// Creates a new social post (Admin only).
export const createPost = async (formData) => {
	try {
		const response = await apiClient.post('/api/v1/socials', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to create post.');
	}
};

// Deletes a post by its ID (Admin only).
export const deletePost = async (id) => {
	try {
		const response = await apiClient.delete(`/api/v1/socials/${id}`);
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to delete post.');
	}
};
