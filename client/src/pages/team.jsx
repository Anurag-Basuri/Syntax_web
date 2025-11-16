import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useMembers } from '../hooks/useMembers.js';
import TeamGrid from '../components/team/TeamGrid.jsx';
import TeamMemberModal from '../components/team/TeamMemberModal.jsx';
import TeamSkeleton from '../components/team/TeamSkeleton.jsx';
import { Search, X, Users, Briefcase, Star, Filter, ChevronDown } from 'lucide-react';
import { isLeadershipRole } from '../constants/team.js';

const ErrorBlock = ({ message, onRetry }) => (
	<div className="flex flex-col items-center justify-center text-center py-24 px-4">
		<div className="text-5xl mb-4">⚠️</div>
		<h2 className="text-xl font-semibold mb-2 text-[var(--accent-1)]">Failed to load team</h2>
		<p className="text-sm mb-6 max-w-md text-[var(--text-secondary)]">{message}</p>
		<button
			onClick={onRetry}
			className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--button-primary-bg)] text-white"
		>
			Retry
		</button>
	</div>
);

const TeamsPage = () => {
	const { data, isLoading, isError, error, refetch } = useMembers();
	const [selectedMember, setSelectedMember] = useState(null);

	// UX: decoupled debounced input to avoid expensive filtering on every keystroke
	const [searchTerm, setSearchTerm] = useState('');
	const [query, setQuery] = useState('');
	useEffect(() => {
		const t = setTimeout(() => setQuery(searchTerm.trim().toLowerCase()), 240);
		return () => clearTimeout(t);
	}, [searchTerm]);

	const [activeFilter, setActiveFilter] = useState('All');
	const [sortBy, setSortBy] = useState('name');
	const [showMobileFilters, setShowMobileFilters] = useState(false);
	const [showMobileSort, setShowMobileSort] = useState(false);

	// prepare enrichedMembers
	const enrichedMembers = useMemo(() => {
		const members = data?.members || [];
		return members.map((m) => {
			const designation = Array.isArray(m.designation) ? m.designation[0] : m.designation;
			const department = Array.isArray(m.department) ? m.department[0] : m.department;
			const primaryDept = m.primaryDepartment || department || 'Other';
			const primaryRole = m.primaryDesignation || designation || 'Member';
			const isLeader = !!(
				m.isLeader || isLeadershipRole(designation || m.primaryDesignation)
			);
			const skills = Array.isArray(m.skills) ? m.skills : [];
			const haystack = [m.fullname, primaryDept, primaryRole, ...skills]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			return { ...m, isLeader, primaryDept, primaryRole, _searchHaystack: haystack };
		});
	}, [data?.members]);

	// department list and counts (better UX: show counts)
	const departments = useMemo(() => {
		const depts = new Map();
		enrichedMembers.forEach((m) =>
			depts.set(m.primaryDept, (depts.get(m.primaryDept) || 0) + 1)
		);
		const list = ['All', 'Leadership', ...Array.from(depts.keys()).sort()];
		return { list, counts: depts };
	}, [enrichedMembers]);

	const filteredMembers = useMemo(() => {
		const q = query || '';
		let filtered = enrichedMembers;
		if (q) filtered = filtered.filter((m) => m._searchHaystack.includes(q));
		if (activeFilter === 'Leadership') filtered = filtered.filter((m) => m.isLeader);
		else if (activeFilter !== 'All')
			filtered = filtered.filter((m) => m.primaryDept === activeFilter);

		const by = (v) => (v || '').toString().toLowerCase();
		const comparators = {
			name: (a, b) => by(a.fullname).localeCompare(by(b.fullname)),
			role: (a, b) => by(a.primaryRole).localeCompare(by(b.primaryRole)),
			dept: (a, b) => by(a.primaryDept).localeCompare(by(b.primaryDept)),
		};
		return [...filtered].sort(comparators[sortBy] || comparators.name);
	}, [query, activeFilter, enrichedMembers, sortBy]);

	const openModal = useCallback((member) => setSelectedMember(member), []);
	const closeModal = useCallback(() => setSelectedMember(null), []);

	if (isError) {
		return (
			<div className="page-container tight-top">
				<ErrorBlock message={error?.message || 'Unknown error'} onRetry={refetch} />
			</div>
		);
	}

	// counts
	const totalCount = enrichedMembers.length;
	const resultCount = filteredMembers.length;

	return (
		<div className="page-container tight-top">
			{/* Premium hero */}
			<header className="rounded-2xl p-6 md:p-8 mb-6 bg-gradient-to-r from-[rgba(6,182,212,0.06)] to-[rgba(124,58,237,0.04)] border border-[var(--glass-border)]">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight brand-text">
							Our Team
						</h1>
						<p className="mt-2 text-sm text-[var(--text-secondary)]">
							A collective of builders, mentors and volunteers driving impact.
						</p>
						<div className="mt-3 flex items-center gap-3 text-sm text-[var(--text-muted)]">
							<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-white/6">
								<Users size={16} /> <strong>{totalCount}</strong> members
							</span>
							<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-white/6">
								<Star size={16} /> Leadership highlighted
							</span>
						</div>
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto">
						{/* Search */}
						<div className="relative flex-1 md:flex-auto">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
							<input
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Escape') {
										setSearchTerm('');
										setQuery('');
									}
								}}
								placeholder="Search name, role, skill..."
								className="pl-10 pr-10 py-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--input-bg)] focus:ring-2 focus:ring-[var(--accent-1)] w-full"
								aria-label="Search team members"
							/>
							{searchTerm && (
								<button
									onClick={() => {
										setSearchTerm('');
										setQuery('');
									}}
									className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md"
									aria-label="Clear search"
								>
									<X size={16} />
								</button>
							)}
						</div>

						{/* Sort select for larger screens */}
						<div className="hidden md:flex items-center gap-2">
							<label className="text-sm text-[var(--text-muted)]">Sort</label>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="rounded-md border border-[var(--glass-border)] py-2 px-3 bg-[var(--input-bg)]"
							>
								<option value="name">Name</option>
								<option value="role">Role</option>
								<option value="dept">Department</option>
							</select>
						</div>

						{/* Mobile filter toggle */}
						<button
							onClick={() => setShowMobileFilters(true)}
							className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)]"
							aria-label="Open filters"
						>
							<Filter size={16} /> Filters
						</button>
					</div>
				</div>
			</header>

			{/* Layout: sidebar + main content */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
				{/* Sidebar for desktop */}
				<aside className="hidden lg:block lg:col-span-1">
					<div className="sticky top-[calc(var(--navbar-height,4.5rem)+1rem)] space-y-4">
						<h4 className="text-sm font-semibold">Departments</h4>
						<div className="flex flex-col gap-2">
							{departments.list.map((dept) => (
								<button
									key={dept}
									onClick={() => setActiveFilter(dept)}
									className={`text-left px-3 py-2 rounded-md flex items-center justify-between ${
										activeFilter === dept
											? 'bg-[var(--button-secondary-bg)] ring-1 ring-[var(--accent-1)]'
											: 'hover:bg-[var(--glass-hover)]'
									}`}
									aria-pressed={activeFilter === dept}
								>
									<span>{dept}</span>
									<span className="text-xs text-[var(--text-muted)]">
										{dept === 'All'
											? totalCount
											: dept === 'Leadership'
											? enrichedMembers.filter((m) => m.isLeader).length
											: departments.counts.get(dept) || 0}
									</span>
								</button>
							))}
						</div>
					</div>
				</aside>

				{/* Main */}
				<main className="lg:col-span-4">
					{/* responsive control bar */}
					<div className="mb-4 flex items-center justify-between gap-3">
						<div className="text-sm text-[var(--text-secondary)] hidden md:block">
							{resultCount} result{resultCount !== 1 ? 's' : ''} • {totalCount} total
						</div>

						<div className="flex items-center gap-2">
							{/* Desktop sort (already above) -- show current on mobile */}
							<div className="md:hidden inline-flex items-center gap-2">
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className="rounded-md border border-[var(--glass-border)] py-2 px-3 bg-[var(--input-bg)]"
								>
									<option value="name">Name</option>
									<option value="role">Role</option>
									<option value="dept">Department</option>
								</select>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="py-3">
						{isLoading ? (
							<TeamSkeleton />
						) : resultCount === 0 ? (
							<div className="py-16 text-center">
								<h3 className="text-xl font-semibold mb-2">No members found</h3>
								<p className="text-sm text-[var(--text-secondary)] mb-4">
									Try adjusting filters or clearing the search to see more
									members.
								</p>
								<div className="flex items-center justify-center gap-3">
									<button
										onClick={() => {
											setSearchTerm('');
											setQuery('');
											setActiveFilter('All');
										}}
										className="px-4 py-2 bg-emerald-600 text-white rounded-md"
									>
										Clear filters
									</button>
									<button
										onClick={() => refetch()}
										className="px-4 py-2 border rounded-md"
									>
										Reload
									</button>
								</div>
							</div>
						) : (
							<TeamGrid members={filteredMembers} onCardClick={openModal} />
						)}
					</div>
				</main>
			</div>

			{/* Mobile filters drawer */}
			{showMobileFilters && (
				<div className="fixed inset-0 z-[60]">
					<div
						className="absolute inset-0 bg-black/40"
						onClick={() => setShowMobileFilters(false)}
					/>
					<div className="absolute bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--card-border)] p-4 rounded-t-xl max-h-[70vh] overflow-auto">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-semibold">Filters</h3>
							<button
								onClick={() => setShowMobileFilters(false)}
								className="p-2 rounded-md"
							>
								<X size={18} />
							</button>
						</div>
						<div className="space-y-3">
							<h4 className="text-sm font-medium">Departments</h4>
							<div className="flex flex-col gap-2">
								{departments.list.map((dept) => (
									<button
										key={dept}
										onClick={() => {
											setActiveFilter(dept);
											setShowMobileFilters(false);
										}}
										className={`text-left px-3 py-2 rounded-md flex items-center justify-between ${
											activeFilter === dept
												? 'bg-[var(--button-secondary-bg)] ring-1 ring-[var(--accent-1)]'
												: 'hover:bg-[var(--glass-hover)]'
										}`}
									>
										<span>{dept}</span>
										<span className="text-xs text-[var(--text-muted)]">
											{dept === 'All'
												? totalCount
												: dept === 'Leadership'
												? enrichedMembers.filter((m) => m.isLeader).length
												: departments.counts.get(dept) || 0}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>
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

export default TeamsPage;
