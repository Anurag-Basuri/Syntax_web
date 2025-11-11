import {jwtDecode} from 'jwt-decode';

const STORAGE_KEY = 'sc_auth_token';

export const setToken = (tokenOrObject) => {
	if (!tokenOrObject) {
		localStorage.removeItem(STORAGE_KEY);
		return;
	}
	let payload;
	if (typeof tokenOrObject === 'string') payload = { accessToken: tokenOrObject };
	else if (typeof tokenOrObject === 'object' && tokenOrObject !== null) payload = tokenOrObject;
	else payload = { accessToken: String(tokenOrObject) };

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch (err) {
		try {
			localStorage.setItem(STORAGE_KEY, String(payload.accessToken || ''));
		} catch {}
	}
};

export const getToken = () => {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed === 'string') return { accessToken: parsed };
		if (typeof parsed === 'object' && parsed !== null) return parsed;
		return null;
	} catch (err) {
		return { accessToken: raw };
	}
};

export const removeToken = () => {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {}
};

export const decodeToken = (token) => {
	if (!token || typeof token !== 'string') return null;
	try {
		return jwtDecode(token);
	} catch (err) {
		return null;
	}
};

export const isTokenExpired = (token) => {
	const decoded = decodeToken(token);
	if (!decoded) return true;
	const exp = decoded.exp;
	if (!exp) return true;
	const now = Math.floor(Date.now() / 1000);
	return exp < now;
};

export const isTokenValid = () => {
	const tokens = getToken();
	const accessToken = tokens?.accessToken || null;
	if (!accessToken) return false;
	return !isTokenExpired(accessToken);
};

// Simple boolean: do we have an access token stored locally
export const shouldBeAuthenticated = () => {
	return !!getToken()?.accessToken;
};
