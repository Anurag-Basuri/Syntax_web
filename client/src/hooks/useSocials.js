import { useState, useEffect } from 'react';
import { getAllPosts } from '../services/socialsServices.js';

const useSocials = () => {
	const [socials, setSocials] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchPosts = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await getAllPosts({ page: 1, limit: 50 });
			// Response structure: { data: [...posts], pagination: {...} }
			const posts = response.data || response || [];
			setSocials(Array.isArray(posts) ? posts : []);
		} catch (err) {
			setError(err.message || 'Failed to fetch posts');
			setSocials([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPosts();
	}, []);

	return { socials, loading, error, refetch: fetchPosts };
};

export default useSocials;
