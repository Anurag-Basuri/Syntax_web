import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
	Search,
	Filter,
	UserPlus,
	Users,
	User,
	Info,
	Pencil,
	Ban,
	Trash2,
	RotateCcw,
	Eye,
	EyeOff,
	ChevronDown,
	XCircle,
	CheckCircle,
	AlertCircle,
	Loader2,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react';
import {
	useGetAllMembers,
	useBanMember,
	useUnbanMember,
	useRemoveMember,
	useUpdateMemberByAdmin,
} from '../../hooks/useMembers.js';
import { memberRegister } from '../../services/authServices.js';
import LoadingSpinner from './LoadingSpinner.jsx';
import StatusBadge from './StatusBadge.jsx';
import Modal from './Modal.jsx';

// Enum options for department and designation
const DEPARTMENT_OPTIONS = [
	'HR',
	'Technical',
	'Marketing',
	'Management',
	'Content Writing',
	'Event Management',
	'Media',
	'Design',
	'Coordinator',
	'PR',
];
const DESIGNATION_OPTIONS = ['CEO', 'CTO', 'CFO', 'CMO', 'COO', 'HR', 'Head', 'member'];

const statusString = (member) => {
	if (member.status === 'banned') return 'Banned';
	if (member.status === 'removed') return 'Removed';
	return 'Active';
};

// Custom hook for error management
const useErrorManager = () => {
	const [errors, setErrors] = useState({
		fetch: '',
		ban: '',
		unban: '',
		remove: '',
		update: '',
		register: '',
	});

	const setError = useCallback((type, message) => {
		setErrors((prev) => ({ ...prev, [type]: message }));
	}, []);

	const clearError = useCallback((type) => {
		setErrors((prev) => ({ ...prev, [type]: '' }));
	}, []);

	const clearAllErrors = useCallback(() => {
		setErrors({ fetch: '', ban: '', unban: '', remove: '', update: '', register: '' });
	}, []);

	return { errors, setError, clearError, clearAllErrors };
};

// helper to safely read flattened fields (model provides departmentFlat/designationFlat)
const getFlat = (member, key, fallbackKey) => {
	if (!member) return '';
	if (member[key]) return member[key];
	if (fallbackKey && member[fallbackKey]) return member[fallbackKey];
	// fallback to arrays or string
	const raw = member[fallbackKey || key];
	if (Array.isArray(raw)) return raw.join(', ');
	if (typeof raw === 'string') return raw;
	return '';
};

// Member Row Component (updated display fields)
const MemberRow = React.memo(({ member, onEdit, onBan, onUnban, onRemove, actionLoading }) => (
	<tr key={member._id} className="hover:bg-gray-750/50 transition">
		<td className="px-6 py-4 whitespace-nowrap">
			<div className="flex items-center">
				<div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
					<User className="h-5 w-5 text-gray-400" />
				</div>
				<div className="ml-4">
					<div className="text-sm font-medium text-white">{member.fullname}</div>
					<div className="text-xs text-gray-400">{member.email}</div>
				</div>
			</div>
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{member.email}</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
			{member.LpuId || 'N/A'}
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
			{getFlat(member, 'departmentFlat', 'department') || '-'}
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
			{getFlat(member, 'designationFlat', 'designation') || '-'}
		</td>
		<td className="px-6 py-4 whitespace-nowrap">
			<div className="flex items-center gap-2">
				<StatusBadge status={member.status} />
				<span className="text-xs text-gray-400">{statusString(member)}</span>
			</div>
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 max-w-[240px]">
			{member.restriction?.isRestricted ? (
				<div className="flex flex-col gap-1">
					<span>
						<b>Reason:</b> {member.restriction.reason || '-'}
					</span>
					{member.restriction.time && (
						<span>
							<b>Review:</b> {new Date(member.restriction.time).toLocaleString()}
						</span>
					)}
				</div>
			) : (
				<span className="text-gray-600">-</span>
			)}
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
			<button
				className="text-blue-400 hover:text-blue-300"
				title="View Details (coming soon)"
				disabled
			>
				<Info className="inline h-4 w-4" />
			</button>
			<button
				className="text-gray-400 hover:text-gray-200"
				title="Edit member"
				onClick={() => onEdit(member)}
				disabled={actionLoading}
			>
				<Pencil className="inline h-4 w-4" />
			</button>
			{member.status === 'active' && (
				<>
					<button
						onClick={() => onBan(member)}
						className="text-yellow-500 hover:text-yellow-400"
						title="Ban member"
						disabled={actionLoading}
					>
						<Ban className="inline h-4 w-4" />
					</button>
					<button
						onClick={() => onRemove(member)}
						className="text-red-500 hover:text-red-400"
						title="Remove member"
						disabled={actionLoading}
					>
						<Trash2 className="inline h-4 w-4" />
					</button>
				</>
			)}
			{member.status === 'banned' && (
				<button
					onClick={() => onUnban(member)}
					className="text-green-500 hover:text-green-400"
					title="Unban member"
					disabled={actionLoading}
				>
					<RotateCcw className="inline h-4 w-4" />
				</button>
			)}
		</td>
	</tr>
));

// Small card view for mobile (responsive)
const MemberCard = React.memo(({ member, onEdit, onBan, onUnban, onRemove, actionLoading }) => {
	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-3">
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center">
					<User className="h-6 w-6 text-gray-400" />
				</div>
				<div className="flex-1">
					<div className="flex items-center justify-between gap-2">
						<div>
							<div className="text-sm font-semibold text-white">
								{member.fullname}
							</div>
							<div className="text-xs text-gray-400">{member.email}</div>
						</div>
						<div className="text-right">
							<StatusBadge status={member.status} />
						</div>
					</div>

					<div className="mt-2 text-xs text-gray-300 grid grid-cols-2 gap-2">
						<div>
							<div className="text-gray-400">LPU</div>
							<div className="text-white">{member.LpuId || 'N/A'}</div>
						</div>
						<div>
							<div className="text-gray-400">Dept</div>
							<div className="text-white">
								{getFlat(member, 'departmentFlat', 'department') || '-'}
							</div>
						</div>
						<div>
							<div className="text-gray-400">Designation</div>
							<div className="text-white">
								{getFlat(member, 'designationFlat', 'designation') || '-'}
							</div>
						</div>
						<div>
							<div className="text-gray-400">Status</div>
							<div className="text-white">{statusString(member)}</div>
						</div>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between gap-2 pt-2">
				<div className="flex items-center gap-2">
					<button
						className="text-gray-400 hover:text-gray-200 p-2 rounded"
						title="Edit"
						onClick={() => onEdit(member)}
						disabled={actionLoading}
					>
						<Pencil className="h-4 w-4" />
					</button>
					{member.status === 'active' && (
						<>
							<button
								onClick={() => onBan(member)}
								className="text-yellow-500 hover:text-yellow-400 p-2 rounded"
								title="Ban member"
								disabled={actionLoading}
							>
								<Ban className="h-4 w-4" />
							</button>
							<button
								onClick={() => onRemove(member)}
								className="text-red-500 hover:text-red-400 p-2 rounded"
								title="Remove member"
								disabled={actionLoading}
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</>
					)}
					{member.status === 'banned' && (
						<button
							onClick={() => onUnban(member)}
							className="text-green-500 hover:text-green-400 p-2 rounded"
							title="Unban member"
							disabled={actionLoading}
						>
							<RotateCcw className="h-4 w-4" />
						</button>
					)}
				</div>

				<div className="text-xs text-gray-400">
					{member.restriction?.isRestricted ? 'Restricted' : ''}
				</div>
			</div>
		</div>
	);
});

// Action Modal Component (guard member presence)
const ActionModal = ({ isOpen, onClose, title, actionType, member, onSubmit, loading, error }) => {
	const [reason, setReason] = useState('');
	const [reviewTime, setReviewTime] = useState('');

	useEffect(() => {
		if (isOpen) {
			setReason('');
			setReviewTime('');
		}
	}, [isOpen]);

	const handleSubmit = () => {
		if (!member) return;
		onSubmit(member._id, reason, reviewTime);
	};

	if (!isOpen) return null;

	return (
		<Modal title={title} onClose={onClose}>
			<div className="space-y-4">
				{error && (
					<div className="bg-red-700/20 border border-red-500 text-red-300 px-4 py-2 rounded flex items-center">
						<AlertCircle className="h-5 w-5 mr-2" />
						{error}
					</div>
				)}

				<div>
					<label className="block text-gray-300 mb-1">
						Reason <span className="text-red-400">*</span>
					</label>
					<textarea
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
						placeholder="Enter reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={3}
						required
					/>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">Review Date (Optional)</label>
					<input
						type="datetime-local"
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
						value={reviewTime}
						onChange={(e) => setReviewTime(e.target.value)}
					/>
				</div>

				<div className="flex justify-end gap-3 pt-4">
					<button
						className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
						onClick={onClose}
						type="button"
						disabled={loading}
					>
						Cancel
					</button>
					<button
						className={`px-4 py-2 rounded-lg transition ${
							actionType === 'ban'
								? 'bg-yellow-600 hover:bg-yellow-500'
								: 'bg-red-600 hover:bg-red-500'
						}`}
						onClick={handleSubmit}
						disabled={loading || !reason}
						type="button"
					>
						{loading ? (
							<Loader2 className="h-4 w-4 animate-spin mx-2" />
						) : (
							`${actionType === 'ban' ? 'Ban' : 'Remove'} Member`
						)}
					</button>
				</div>
			</div>
		</Modal>
	);
};

// Edit Member Modal Component (use flat fields and send arrays)
const EditMemberModal = ({ isOpen, onClose, member, onSubmit, loading, error }) => {
	const [editData, setEditData] = useState({
		department: '',
		designation: '',
		LpuId: '',
		joinedAt: '',
	});

	useEffect(() => {
		if (isOpen && member) {
			setEditData({
				department: getFlat(member, 'departmentFlat', 'department') || '',
				designation: getFlat(member, 'designationFlat', 'designation') || 'member',
				LpuId: member.LpuId || '',
				joinedAt: member.joinedAt
					? new Date(member.joinedAt).toISOString().split('T')[0]
					: '',
			});
		}
	}, [isOpen, member]);

	const handleSubmit = () => {
		// convert to server-expected shapes (arrays)
		const payload = {
			LpuId: editData.LpuId || undefined,
			joinedAt: editData.joinedAt || undefined,
			department: editData.department ? [editData.department] : undefined,
			designation: editData.designation ? [editData.designation] : undefined,
		};
		onSubmit(member._id, payload);
	};

	if (!isOpen) return null;

	return (
		<Modal title="Update Member" onClose={onClose}>
			<div className="space-y-4">
				{error && (
					<div className="bg-red-700/20 border border-red-500 text-red-300 px-4 py-2 rounded flex items-center">
						<AlertCircle className="h-5 w-5 mr-2" />
						{error}
					</div>
				)}

				<div>
					<label className="block text-gray-300 mb-1">Department</label>
					<select
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={editData.department}
						onChange={(e) => setEditData({ ...editData, department: e.target.value })}
					>
						<option value="">Select Department</option>
						{DEPARTMENT_OPTIONS.map((dep) => (
							<option key={dep} value={dep}>
								{dep}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">Designation</label>
					<select
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={editData.designation}
						onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
					>
						<option value="">Select Designation</option>
						{DESIGNATION_OPTIONS.map((des) => (
							<option key={des} value={des}>
								{des}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">LPU ID</label>
					<input
						type="text"
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={editData.LpuId}
						onChange={(e) => setEditData({ ...editData, LpuId: e.target.value })}
					/>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">Joined At</label>
					<input
						type="date"
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={editData.joinedAt}
						onChange={(e) => setEditData({ ...editData, joinedAt: e.target.value })}
					/>
				</div>

				<div className="flex justify-end gap-3 pt-4">
					<button
						className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
						onClick={onClose}
						type="button"
						disabled={loading}
					>
						Cancel
					</button>
					<button
						className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
						onClick={handleSubmit}
						disabled={loading}
						type="button"
					>
						{loading ? <Loader2 className="h-4 w-4 animate-spin mx-2" /> : 'Update'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

// Register Member Modal Component (send arrays)
const RegisterMemberModal = ({ isOpen, onClose, onSubmit, loading, error, success }) => {
	const [formData, setFormData] = useState({
		fullname: '',
		LpuId: '',
		email: '',
		password: '',
		department: '',
		designation: '',
		joinedAt: '',
	});
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setFormData({
				fullname: '',
				LpuId: '',
				email: '',
				password: '',
				department: '',
				designation: '',
				joinedAt: '',
			});
			setShowPassword(false);
		}
	}, [isOpen]);

	const handleSubmit = (e) => {
		e.preventDefault();
		// normalise to arrays for backend/model
		const payload = {
			...formData,
			department: formData.department ? [formData.department] : [],
			designation: formData.designation ? [formData.designation] : ['member'],
		};
		onSubmit(payload);
	};

	if (!isOpen) return null;

	return (
		<Modal title="Register New Member" onClose={onClose}>
			<form className="space-y-4" onSubmit={handleSubmit}>
				{error && (
					<div className="bg-red-700/20 border border-red-500 text-red-300 px-4 py-2 rounded flex items-center">
						<AlertCircle className="h-5 w-5 mr-2" />
						{error}
					</div>
				)}

				{success && (
					<div className="bg-green-700/20 border border-green-500 text-green-300 px-4 py-2 rounded flex items-center">
						<CheckCircle className="h-5 w-5 mr-2" />
						{success}
					</div>
				)}

				<div>
					<label className="block text-gray-300 mb-1">
						Full Name <span className="text-red-400">*</span>
					</label>
					<input
						type="text"
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={formData.fullname}
						onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
						required
					/>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">
						LPU ID <span className="text-red-400">*</span>
					</label>
					<input
						type="text"
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={formData.LpuId}
						onChange={(e) => setFormData({ ...formData, LpuId: e.target.value })}
						required
					/>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">Email</label>
					<input
						type="email"
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
					/>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">
						Password <span className="text-red-400">*</span>
					</label>
					<div className="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
							value={formData.password}
							onChange={(e) => setFormData({ ...formData, password: e.target.value })}
							required
							minLength={8}
						/>
						<button
							type="button"
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					</div>
					<p className="text-xs text-gray-400 mt-1">Must be at least 8 characters</p>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">
						Department <span className="text-red-400">*</span>
					</label>
					<select
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={formData.department}
						onChange={(e) => setFormData({ ...formData, department: e.target.value })}
						required
					>
						<option value="">Select Department</option>
						{DEPARTMENT_OPTIONS.map((dep) => (
							<option key={dep} value={dep}>
								{dep}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">
						Designation <span className="text-red-400">*</span>
					</label>
					<select
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={formData.designation}
						onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
						required
					>
						<option value="">Select Designation</option>
						{DESIGNATION_OPTIONS.map((des) => (
							<option key={des} value={des}>
								{des}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-gray-300 mb-1">Joined Date</label>
					<input
						type="date"
						className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={formData.joinedAt}
						onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
					/>
				</div>

				<div className="flex justify-end gap-3 pt-4">
					<button
						className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
						onClick={onClose}
						type="button"
						disabled={loading}
					>
						Cancel
					</button>
					<button
						className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
						type="submit"
						disabled={loading}
					>
						{loading ? <Loader2 className="h-4 w-4 animate-spin mx-2" /> : 'Register'}
					</button>
				</div>
			</form>
		</Modal>
	);
};

// MembersTab (main) — minor UI improvements + safer handlers
const MembersTab = ({ token, setDashboardError }) => {
	// debounce search: input vs applied query
	const [searchInput, setSearchInput] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [departmentFilter, setDepartmentFilter] = useState('all');
	const [showFilters, setShowFilters] = useState(false);

	// Pagination
	const [page, setPage] = useState(1);
	const PAGE_SIZE = 10;

	// Modal states
	const [banModalOpen, setBanModalOpen] = useState(false);
	const [removeModalOpen, setRemoveModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [registerModalOpen, setRegisterModalOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState(null);

	// Register modal states
	const [registerLoading, setRegisterLoading] = useState(false);
	const [registerSuccess, setRegisterSuccess] = useState('');

	// Error management
	const { errors, setError, clearError, clearAllErrors } = useErrorManager();

	const {
		getAllMembers,
		members,
		totalMembers,
		loading: membersLoading,
		error: membersError,
	} = useGetAllMembers();

	const { banMember, loading: banLoading, error: banError, reset: resetBan } = useBanMember();
	const {
		unbanMember,
		loading: unbanLoading,
		error: unbanError,
		reset: resetUnban,
	} = useUnbanMember();
	const {
		removeMember,
		loading: removeLoading,
		error: removeError,
		reset: resetRemove,
	} = useRemoveMember();
	const {
		updateMemberByAdmin,
		loading: updateLoading,
		error: updateError,
		reset: resetUpdate,
	} = useUpdateMemberByAdmin();

	// debounce effect for search input
	useEffect(() => {
		const t = setTimeout(() => setSearchTerm(searchInput), 250);
		return () => clearTimeout(t);
	}, [searchInput]);

	// helper to extract message
	const formatError = useCallback((err) => {
		if (!err) return '';
		return (
			err?.message ||
			err?.response?.data?.message ||
			err?.response?.data?.error ||
			(typeof err === 'string' ? err : String(err))
		);
	}, []);

	// Fetch members on mount
	useEffect(() => {
		getAllMembers()
			.then(() => {})
			.catch((err) => {
				const msg = formatError(err) || 'Failed to load members';
				setDashboardError?.(msg);
				setError('fetch', msg);
			});
	}, [getAllMembers, formatError, setDashboardError, setError]);

	// Handle API errors (store readable messages)
	useEffect(() => {
		if (membersError) setError('fetch', formatError(membersError));
		if (banError) setError('ban', formatError(banError));
		if (unbanError) setError('unban', formatError(unbanError));
		if (removeError) setError('remove', formatError(removeError));
		if (updateError) setError('update', formatError(updateError));
	}, [membersError, banError, unbanError, removeError, updateError, formatError, setError]);

	// Reset page when filters/search change
	useEffect(() => {
		setPage(1);
	}, [searchTerm, statusFilter, departmentFilter, members?.length]);

	// Handle ban member
	const handleBanMember = async (id, reason, reviewTime) => {
		clearError('ban');
		try {
			await banMember(id, reason, reviewTime, token);
			setBanModalOpen(false);
			await getAllMembers();
		} catch (err) {
			setError('ban', formatError(err));
		}
	};

	// Handle unban member
	const handleUnbanMember = async (member) => {
		clearError('unban');
		try {
			await unbanMember(member._id, token);
			await getAllMembers();
		} catch (err) {
			setError('unban', formatError(err));
		}
	};

	// Handle remove member
	const handleRemoveMember = async (id, reason, reviewTime) => {
		clearError('remove');
		try {
			await removeMember(id, reason, reviewTime, token);
			setRemoveModalOpen(false);
			await getAllMembers();
		} catch (err) {
			setError('remove', formatError(err));
		}
	};

	// Handle update member (normalize arrays)
	const handleUpdateMember = async (id, data) => {
		clearError('update');
		try {
			const payload = {
				...data,
				department: data.department
					? Array.isArray(data.department)
						? data.department
						: [data.department]
					: undefined,
				designation: data.designation
					? Array.isArray(data.designation)
						? data.designation
						: [data.designation]
					: undefined,
			};
			await updateMemberByAdmin(id, payload, token);
			setEditModalOpen(false);
			await getAllMembers();
		} catch (err) {
			setError('update', formatError(err));
		}
	};

	// Handle register member (normalize arrays)
	const handleRegisterMember = async (formData) => {
		clearError('register');
		setRegisterLoading(true);
		setRegisterSuccess('');

		try {
			// Validate enums
			if (!DEPARTMENT_OPTIONS.includes(formData.department?.[0] || formData.department)) {
				throw new Error('Please select a valid department.');
			}
			if (!DESIGNATION_OPTIONS.includes(formData.designation?.[0] || formData.designation)) {
				throw new Error('Please select a valid designation.');
			}
			if (!formData.password || formData.password.length < 8) {
				throw new Error('Password must be at least 8 characters.');
			}

			await memberRegister(formData);
			setRegisterSuccess('Member registered successfully!');
			setTimeout(() => {
				setRegisterModalOpen(false);
				getAllMembers();
			}, 900);
		} catch (err) {
			setError('register', formatError(err));
		} finally {
			setRegisterLoading(false);
		}
	};

	// Memoized filtered members for performance
	const filteredMembers = useMemo(() => {
		if (!Array.isArray(members)) return [];
		return members.filter((member) => {
			const q = searchTerm.trim().toLowerCase();
			const matchesSearch =
				!q ||
				(member.fullname && member.fullname.toLowerCase().includes(q)) ||
				(member.email && member.email.toLowerCase().includes(q)) ||
				(member.LpuId && member.LpuId.toLowerCase().includes(q));

			const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
			const memberDepartment = getFlat(member, 'departmentFlat', 'department');
			const matchesDepartment =
				departmentFilter === 'all' || memberDepartment === departmentFilter;

			return matchesSearch && matchesStatus && matchesDepartment;
		});
	}, [members, searchTerm, statusFilter, departmentFilter]);

	// Pagination calculations
	const totalFiltered = filteredMembers.length;
	const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
	const paginatedMembers = useMemo(() => {
		const start = (page - 1) * PAGE_SIZE;
		return filteredMembers.slice(start, start + PAGE_SIZE);
	}, [filteredMembers, page]);

	// Open edit modal
	const openEditModal = (member) => {
		setSelectedMember(member);
		setEditModalOpen(true);
		clearError('update');
	};

	// Open ban modal
	const openBanModal = (member) => {
		setSelectedMember(member);
		setBanModalOpen(true);
		clearError('ban');
	};

	// Open remove modal
	const openRemoveModal = (member) => {
		setSelectedMember(member);
		setRemoveModalOpen(true);
		clearError('remove');
	};

	// Close all modals and reset states
	const closeAllModals = () => {
		setBanModalOpen(false);
		setRemoveModalOpen(false);
		setEditModalOpen(false);
		setRegisterModalOpen(false);
		setSelectedMember(null);
		clearAllErrors();
		resetBan();
		resetUnban();
		resetRemove();
		resetUpdate();
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
				<h2 className="text-xl font-bold text-white flex items-center gap-3">
					Member Management
					<span className="text-sm text-gray-400 font-medium">({totalMembers ?? 0})</span>
				</h2>
				<div className="flex gap-2 w-full md:w-auto">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search members by name, email or LPU ID"
							className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							aria-label="Search members"
						/>
					</div>
					<button
						className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
						onClick={() => setShowFilters((v) => !v)}
						aria-expanded={showFilters}
					>
						<Filter className="h-5 w-5" />
						Filters
						<ChevronDown
							className={`h-4 w-4 transition-transform ${
								showFilters ? 'rotate-180' : ''
							}`}
						/>
					</button>
					<button
						className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
						onClick={() => setRegisterModalOpen(true)}
						title="Register new member"
					>
						<UserPlus className="h-5 w-5" />
						Add Member
					</button>
				</div>
			</div>

			{/* Filters Panel */}
			{showFilters && (
				<div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
						<div>
							<label className="block text-gray-300 mb-2">Status</label>
							<select
								className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
							>
								<option value="all">All Statuses</option>
								<option value="active">Active</option>
								<option value="banned">Banned</option>
								<option value="removed">Removed</option>
							</select>
						</div>
						<div>
							<label className="block text-gray-300 mb-2">Department</label>
							<select
								className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
								value={departmentFilter}
								onChange={(e) => setDepartmentFilter(e.target.value)}
							>
								<option value="all">All Departments</option>
								{DEPARTMENT_OPTIONS.map((dep) => (
									<option key={dep} value={dep}>
										{dep}
									</option>
								))}
							</select>
						</div>
						<div className="flex gap-2">
							<button
								className="px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600"
								onClick={() => {
									setStatusFilter('all');
									setDepartmentFilter('all');
								}}
							>
								Clear
							</button>
							<button
								className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
								onClick={() => {
									setShowFilters(false);
								}}
							>
								Apply
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Error Messages */}
			{errors.fetch && (
				<div className="bg-red-700/20 border border-red-500 text-red-300 px-4 py-3 rounded flex items-center justify-between">
					<div className="flex items-center">
						<AlertCircle className="h-5 w-5 mr-2" />
						<span>{errors.fetch}</span>
					</div>
					<button
						className="ml-4 px-3 py-1 bg-red-800/40 rounded text-sm hover:bg-red-700/60 flex items-center gap-1"
						onClick={() => getAllMembers()}
					>
						<RotateCcw className="h-4 w-4" />
						Retry
					</button>
				</div>
			)}

			{membersLoading ? (
				<LoadingSpinner />
			) : totalFiltered === 0 ? (
				<div className="text-center py-12 bg-gray-700/30 rounded-xl border border-gray-600">
					<Users className="h-12 w-12 mx-auto text-gray-500" />
					<h3 className="text-xl font-bold text-gray-400 mt-4">No members found</h3>
					<p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
					<button
						className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white"
						onClick={() => setRegisterModalOpen(true)}
					>
						Add first member
					</button>
				</div>
			) : (
				<>
					{/* Desktop table */}
					<div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700">
						<table className="min-w-full divide-y divide-gray-700">
							<thead className="bg-gray-750 sticky top-0">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Email
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										LPU ID
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Department
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Designation
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Restriction
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-gray-800 divide-y divide-gray-700">
								{paginatedMembers.map((member) => (
									<MemberRow
										key={member._id}
										member={member}
										onEdit={openEditModal}
										onBan={openBanModal}
										onUnban={handleUnbanMember}
										onRemove={openRemoveModal}
										actionLoading={
											banLoading ||
											unbanLoading ||
											removeLoading ||
											updateLoading
										}
									/>
								))}
							</tbody>
						</table>
					</div>

					{/* Mobile cards */}
					<div className="md:hidden grid grid-cols-1 gap-3">
						{paginatedMembers.map((member) => (
							<MemberCard
								key={member._id}
								member={member}
								onEdit={openEditModal}
								onBan={openBanModal}
								onUnban={handleUnbanMember}
								onRemove={openRemoveModal}
								actionLoading={
									banLoading || unbanLoading || removeLoading || updateLoading
								}
							/>
						))}
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between gap-4 mt-4">
						<div className="text-sm text-gray-400">
							Showing {(page - 1) * PAGE_SIZE + 1}–
							{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered} result
							{totalFiltered > 1 ? 's' : ''}
						</div>
						<div className="flex items-center gap-2">
							<button
								className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page <= 1}
								aria-label="Previous page"
							>
								<ChevronsLeft className="h-4 w-4 text-white" />
							</button>
							<div className="text-sm text-gray-300 px-3">
								Page {page} / {totalPages}
							</div>
							<button
								className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page >= totalPages}
								aria-label="Next page"
							>
								<ChevronsRight className="h-4 w-4 text-white" />
							</button>
						</div>
					</div>
				</>
			)}

			{/* Modals (unchanged usage) */}
			<ActionModal
				isOpen={banModalOpen}
				onClose={closeAllModals}
				title="Ban Member"
				actionType="ban"
				member={selectedMember}
				onSubmit={handleBanMember}
				loading={banLoading}
				error={errors.ban}
			/>

			<ActionModal
				isOpen={removeModalOpen}
				onClose={closeAllModals}
				title="Remove Member"
				actionType="remove"
				member={selectedMember}
				onSubmit={handleRemoveMember}
				loading={removeLoading}
				error={errors.remove}
			/>

			<EditMemberModal
				isOpen={editModalOpen}
				onClose={closeAllModals}
				member={selectedMember}
				onSubmit={handleUpdateMember}
				loading={updateLoading}
				error={errors.update}
			/>

			<RegisterMemberModal
				isOpen={registerModalOpen}
				onClose={closeAllModals}
				onSubmit={handleRegisterMember}
				loading={registerLoading}
				error={errors.register}
				success={registerSuccess}
			/>
		</div>
	);
};

export default MembersTab;
