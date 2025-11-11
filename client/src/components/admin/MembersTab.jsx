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
const DESIGNATION_OPTIONS = ['CEO', 'CTO', 'CFO', 'CMO', 'COO', 'Head', 'member'];

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

// Member Row Component
const MemberRow = React.memo(({ member, onEdit, onBan, onUnban, onRemove, actionLoading }) => (
	<tr key={member._id} className="hover:bg-gray-750/50 transition">
		<td className="px-6 py-4 whitespace-nowrap">
			<div className="flex items-center">
				<div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
					<User className="h-5 w-5 text-gray-400" />
				</div>
				<div className="ml-4">
					<div className="text-sm font-medium text-white">{member.fullname}</div>
				</div>
			</div>
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{member.email}</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
			{member.LpuId || 'N/A'}
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
			{member.department || '-'}
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
			{member.designation || '-'}
		</td>
		{/* Removed program column */}
		<td className="px-6 py-4 whitespace-nowrap">
			<div className="flex items-center gap-2">
				<StatusBadge status={member.status} />
				<span className="text-xs text-gray-400">{statusString(member)}</span>
			</div>
		</td>
		<td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
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

// Action Modal Component
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

// Edit Member Modal Component
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
				department: member.department || '',
				designation: member.designation || 'member',
				LpuId: member.LpuId || '',
				joinedAt: member.joinedAt
					? new Date(member.joinedAt).toISOString().split('T')[0]
					: '',
			});
		}
	}, [isOpen, member]);

	const handleSubmit = () => {
		onSubmit(member._id, editData);
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

// Register Member Modal Component
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
		onSubmit(formData);
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

const MembersTab = ({ token, setDashboardError }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [departmentFilter, setDepartmentFilter] = useState('all');
	const [showFilters, setShowFilters] = useState(false);

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

	// Fetch members on mount
	useEffect(() => {
		getAllMembers().catch(() => {
			setDashboardError('Failed to load members');
		});
	}, []);

	// Handle API errors
	useEffect(() => {
		if (membersError) setError('fetch', membersError);
		if (banError) setError('ban', banError);
		if (unbanError) setError('unban', unbanError);
		if (removeError) setError('remove', removeError);
		if (updateError) setError('update', updateError);
	}, [membersError, banError, unbanError, removeError, updateError, setError]);

	// Handle ban member
	const handleBanMember = async (id, reason, reviewTime) => {
		clearError('ban');
		try {
			await banMember(id, reason, reviewTime, token);
			setBanModalOpen(false);
			await getAllMembers();
		} catch (err) {
			// Error handled by useEffect above
		}
	};

	// Handle unban member
	const handleUnbanMember = async (member) => {
		clearError('unban');
		try {
			await unbanMember(member._id, token);
			await getAllMembers();
		} catch (err) {
			// Error handled by useEffect above
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
			// Error handled by useEffect above
		}
	};

	// Handle update member
	const handleUpdateMember = async (id, data) => {
		clearError('update');
		try {
			await updateMemberByAdmin(id, data, token);
			setEditModalOpen(false);
			await getAllMembers();
		} catch (err) {
			// Error handled by useEffect above
		}
	};

	// Handle register member
	const handleRegisterMember = async (formData) => {
		clearError('register');
		setRegisterLoading(true);
		setRegisterSuccess('');

		try {
			// Validate enums
			if (!DEPARTMENT_OPTIONS.includes(formData.department)) {
				throw new Error('Please select a valid department.');
			}
			if (!DESIGNATION_OPTIONS.includes(formData.designation)) {
				throw new Error('Please select a valid designation.');
			}
			if (formData.password.length < 8) {
				throw new Error('Password must be at least 8 characters.');
			}

			await memberRegister(formData);
			setRegisterSuccess('Member registered successfully!');
			setTimeout(() => {
				setRegisterModalOpen(false);
				getAllMembers();
			}, 1500);
		} catch (err) {
			setError(
				'register',
				err?.response?.data?.message ||
					err?.response?.data?.error ||
					err?.message ||
					'Registration failed'
			);
		} finally {
			setRegisterLoading(false);
		}
	};

	// Memoized filtered members for performance
	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			// Search filter
			const matchesSearch =
				member.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				member.LpuId?.toLowerCase().includes(searchTerm.toLowerCase());

			// Status filter
			const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

			// Department filter
			const matchesDepartment =
				departmentFilter === 'all' || member.department === departmentFilter;

			return matchesSearch && matchesStatus && matchesDepartment;
		});
	}, [members, searchTerm, statusFilter, departmentFilter]);

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
			<div className="flex flex-col md:flex-row justify-between gap-4">
				<h2 className="text-xl font-bold text-white">Member Management</h2>
				<div className="flex gap-2">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search members..."
							className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							aria-label="Search members"
						/>
					</div>
					<button
						className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
						onClick={() => setShowFilters(!showFilters)}
					>
						<Filter className="h-5 w-5" />
						Filters
						<ChevronDown
							className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
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
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
			) : filteredMembers.length === 0 ? (
				<div className="text-center py-12 bg-gray-700/30 rounded-xl border border-gray-600">
					<Users className="h-12 w-12 mx-auto text-gray-500" />
					<h3 className="text-xl font-bold text-gray-400 mt-4">No members found</h3>
					<p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
				</div>
			) : (
				<div className="overflow-x-auto rounded-lg border border-gray-700">
					<table className="min-w-full divide-y divide-gray-700">
						<thead className="bg-gray-750">
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
							{filteredMembers.map((member) => (
								<MemberRow
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
						</tbody>
					</table>
				</div>
			)}

			{/* Ban Modal */}
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

			{/* Remove Modal */}
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

			{/* Edit Modal */}
			<EditMemberModal
				isOpen={editModalOpen}
				onClose={closeAllModals}
				member={selectedMember}
				onSubmit={handleUpdateMember}
				loading={updateLoading}
				error={errors.update}
			/>

			{/* Register Modal */}
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
