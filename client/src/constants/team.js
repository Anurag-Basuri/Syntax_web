export const LEADERSHIP_ROLES = ['CEO', 'CTO', 'CFO', 'CMO', 'COO', 'Head', 'President', 'Lead'];

export const isLeadershipRole = (designation) => {
	if (!designation) return false;
	if (Array.isArray(designation)) {
		return designation.some((d) => LEADERSHIP_ROLES.includes(d));
	}
	return LEADERSHIP_ROLES.includes(designation);
};
