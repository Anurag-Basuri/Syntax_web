import { useState, useEffect, useCallback } from 'react';
import { getAllPosts } from '../services/socialsServices.js';

/**
 * useSocials hook
 *
 * - Fetches published posts.
 * - Supports optional params (page, limit, search) for future pagination.
 * - Returns { socials, loading, error, refetch }
 *
 * Note: server already provides pagination; the hook is prepared to pass params through.
 */
const useSocials = (initialParams = { page: 1, limit: 50, search: '' }) => {
	const [socials, setSocials] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [params, setParams] = useState(initialParams);

	const fetchPosts = useCallback(
		async (overrideParams) => {
			const p = { ...(overrideParams || params) };
			try {
				setLoading(true);
				setError(null);
				const response = await getAllPosts(p);
				// Normalize response: service returns an array or an object { data, pagination }
				let posts = [];
				if (Array.isArray(response)) posts = response;
				else if (response && Array.isArray(response.data)) posts = response.data;
				else if (response && Array.isArray(response.docs)) posts = response.docs;
				else posts = response.data || response || [];
				setSocials(Array.isArray(posts) ? posts : []);
				// If caller passed new params, update local params
				if (overrideParams) setParams(overrideParams);
			} catch (err) {
				setError(err.message || 'Failed to fetch posts');
				setSocials([]);
			} finally {
				setLoading(false);
			}
		},
		[params]
	);

	useEffect(() => {
		// initial fetch
		fetchPosts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { socials, loading, error, refetch: fetchPosts, setParams };
};

export default useSocials;
