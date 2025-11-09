import React, { useState, useMemo, useCallback } from 'react';
import { useMembers } from '../hooks/useMembers.js';
import DepartmentSection from '../components/team/DepartmentSection.jsx';
import TeamMemberModal from '../components/team/TeamMemberModal.jsx';
import TeamSkeleton from '../components/team/TeamSkeleton.jsx';
import ErrorBoundary from '../components/team/ErrorBoundary.jsx';
import { Search } from 'lucide-react';
import { isLeadershipRole } from '../constants/team.js';

// Error & Empty blocks unchanged
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

	// Normalize + enrich members once
	const enrichedMembers = useMemo(
		() =>
			members.map((m) => {
				const isLeader =
					m.isLeader || isLeadershipRole(m.designation || m.primaryDesignation);
				const primaryDept =
					m.primaryDepartment ||
					(Array.isArray(m.department) ? m.department[0] : m.department) ||
					'Other';
				const primaryRole =
					m.primaryDesignation ||
					(Array.isArray(m.designation) ? m.designation[0] : m.designation) ||
					'Member';
				return {
					...m,
					isLeader,
					primaryDept,
					primaryRole,
					_searchHaystack: [
						m.fullname,
						primaryDept,
						primaryRole,
						Array.isArray(m.designation) ? m.designation.join(' ') : m.designation,
						Array.isArray(m.department) ? m.department.join(' ') : m.department,
						...(m.skills || []),
					]
						.filter(Boolean)
						.join(' ')
						.toLowerCase(),
				};
			}),
		[members]
	);

	const filtered = useMemo(() => {
		if (!query) return enrichedMembers;
		const q = query.toLowerCase();
		return enrichedMembers.filter((m) => m._searchHaystack.includes(q));
	}, [query, enrichedMembers]);

	const leadership = useMemo(() => filtered.filter((m) => m.isLeader), [filtered]);
	const nonLeadership = useMemo(() => filtered.filter((m) => !m.isLeader), [filtered]);

	const departments = useMemo(() => {
		const map = {};
		for (const m of nonLeadership) {
			map[m.primaryDept] ||= [];
			map[m.primaryDept].push(m);
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
		<div className="min-h-screen max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
			<header className="mb-6">
				<h1 className="text-3xl font-bold tracking-tight mb-2">
					Team
					<span className="ml-2 text-base font-medium text-gray-500 dark:text-gray-400">
						/ people behind the club
					</span>
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					{isLoading
						? 'Loading…'
						: `Total: ${members.length} • Leadership: ${leadership.length} • Departments: ${totalDepartments}`}
				</p>
			</header>

			{/* Toolbar */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
				<div className="relative w-full sm:w-80">
					<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search members, roles, departments, skills…"
						className="w-full pl-9 pr-8 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
					/>
					{query && (
						<button
							type="button"
							aria-label="Clear search"
							onClick={() => setQuery('')}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs"
						>
							✕
						</button>
					)}
				</div>

				<div className="flex gap-2">
					<button
						onClick={expandAll}
						className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						Expand all
					</button>
					<button
						onClick={collapseAll}
						className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						Collapse all
					</button>
				</div>
			</div>

			{isLoading ? (
				<TeamSkeleton />
			) : members.length === 0 ? (
				<EmptyState />
			) : (
				<>
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
							isExpanded={expandedDepartments[dept] || false}
							onToggle={() => toggleDepartment(dept)}
						/>
					))}
				</>
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
