import React, { useState, useMemo, useCallback } from 'react';
import { useMembers } from '../hooks/useMembers.js';
import DepartmentSection from '../components/team/DepartmentSection.jsx';
import TeamMemberModal from '../components/team/TeamMemberModal.jsx';
import TeamSkeleton from '../components/team/TeamSkeleton.jsx';
import ErrorBoundary from '../components/team/ErrorBoundary.jsx';
import { Search } from 'lucide-react';
import { isLeadershipRole } from '../constants/team.js';

const ErrorBlock = ({ message, onRetry }) => (
	<div className="py-24 text-center">
		<div className="text-5xl mb-4">⚠️</div>
		<h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
			Failed to load team
		</h2>
		<p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
		<button
			onClick={onRetry}
			className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
		>
			Retry
		</button>
	</div>
);

const EmptyState = () => (
	<div className="py-24 text-center">
		<div className="text-6xl mb-4">👥</div>
		<h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
			No members yet
		</h2>
		<p className="text-sm text-gray-500 dark:text-gray-400">
			Check back later. Team onboarding in progress.
		</p>
	</div>
);

const TeamsPage = () => {
	const { data, isLoading, isError, error, refetch } = useMembers();
	const [selectedMember, setSelectedMember] = useState(null);
	const [expandedDepartments, setExpandedDepartments] = useState({});
	const [query, setQuery] = useState('');

	const members = data?.members || [];

	const enrichedMembers = useMemo(() => {
		return members.map((m) => {
			const designation = Array.isArray(m.designation) ? m.designation[0] : m.designation;
			const department = Array.isArray(m.department) ? m.department[0] : m.department;
			const primaryDept = m.primaryDepartment || department || 'Other';
			const primaryRole = m.primaryDesignation || designation || 'Member';
			const isLeader = !!(
				m.isLeader || isLeadershipRole(designation || m.primaryDesignation)
			);
			const skills = Array.isArray(m.skills) ? m.skills : [];
			const haystack = [
				m.fullname,
				primaryDept,
				primaryRole,
				designation,
				department,
				...skills,
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();

			return {
				...m,
				isLeader,
				primaryDept,
				primaryRole,
				_searchHaystack: haystack,
			};
		});
	}, [members]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return enrichedMembers;
		return enrichedMembers.filter((m) => m._searchHaystack.includes(q));
	}, [query, enrichedMembers]);

	const leadership = useMemo(() => filtered.filter((m) => m.isLeader), [filtered]);
	const nonLeadership = useMemo(() => filtered.filter((m) => !m.isLeader), [filtered]);

	const departments = useMemo(() => {
		const map = {};
		for (const m of nonLeadership) {
			const dept = m.primaryDept || 'Other';
			if (!map[dept]) map[dept] = [];
			map[dept].push(m);
		}
		return map;
	}, [nonLeadership]);

	const totalDepartments = Object.keys(departments).length;

	const openModal = useCallback((member) => setSelectedMember(member), []);
	const closeModal = useCallback(() => setSelectedMember(null), []);

	const toggleDepartment = (dept) =>
		setExpandedDepartments((prev) => ({ ...prev, [dept]: !prev[dept] }));

	const expandAll = () => {
		const next = {};
		Object.keys(departments).forEach((d) => (next[d] = true));
		setExpandedDepartments(next);
	};
	const collapseAll = () => setExpandedDepartments({});

	if (isError) {
		return (
			<div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
				<ErrorBlock message={error?.message || 'Unknown error'} onRetry={refetch} />
			</div>
		);
	}

	return (
		<div className="page-container min-h-screen text-gray-900 dark:text-gray-100">
			<header className="mb-8">
				<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
					Our Team
				</h1>
				<p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
					{isLoading
						? 'Loading amazing people…'
						: `${members.length} talented members across ${totalDepartments} departments`}
				</p>
			</header>

			<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
				<div className="relative w-full lg:w-96">
					<Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search members, roles, departments, skills…"
						className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					/>
					{query && (
						<button
							type="button"
							aria-label="Clear search"
							onClick={() => setQuery('')}
							className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
						>
							<span className="text-lg leading-none">×</span>
						</button>
					)}
				</div>

				<div className="flex gap-3">
					<button
						onClick={expandAll}
						className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
					>
						Expand All
					</button>
					<button
						onClick={collapseAll}
						className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
					>
						Collapse All
					</button>
				</div>
			</div>

			{isLoading ? (
				<TeamSkeleton />
			) : members.length === 0 ? (
				<EmptyState />
			) : (
				<div className="space-y-6">
					{leadership.length > 0 && (
						<DepartmentSection
							title="Leadership"
							members={leadership}
							onClick={openModal}
							isExpanded={true}
							onToggle={() => {}}
						/>
					)}

					{Object.entries(departments).map(([dept, list]) => (
						<DepartmentSection
							key={dept}
							title={dept}
							members={list}
							onClick={openModal}
							isExpanded={!!expandedDepartments[dept]}
							onToggle={() => toggleDepartment(dept)}
						/>
					))}
				</div>
			)}

			<TeamMemberModal
				member={selectedMember}
				isOpen={!!selectedMember}
				onClose={closeModal}
			/>
		</div>
	);
};

const TeamsPageWrapper = () => (
	<ErrorBoundary>
		<TeamsPage />
	</ErrorBoundary>
);

export default TeamsPageWrapper;
