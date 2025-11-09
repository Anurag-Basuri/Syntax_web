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
		<h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--accent-error)' }}>
			Failed to load team
		</h2>
		<p className="text-sm mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>
			{message}
		</p>
		<button onClick={onRetry} className="btn btn-secondary">
			Retry
		</button>
	</div>
);

const TeamsPage = () => {
	const { data, isLoading, isError, error, refetch } = useMembers();
	const [selectedMember, setSelectedMember] = useState(null);
	const [query, setQuery] = useState('');
	const [activeFilter, setActiveFilter] = useState('All');
	const [sortBy, setSortBy] = useState('name');
	const [showMobileFilters, setShowMobileFilters] = useState(false);
	const [showMobileSort, setShowMobileSort] = useState(false);

	// Close mobile menus when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (showMobileFilters && !e.target.closest('.team-sidebar')) {
				setShowMobileFilters(false);
			}
		};
		if (showMobileFilters) {
			document.addEventListener('click', handleClickOutside);
		}
		return () => document.removeEventListener('click', handleClickOutside);
	}, [showMobileFilters]);

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

	const departments = useMemo(() => {
		const depts = new Set(enrichedMembers.map((m) => m.primaryDept));
		return ['All', 'Leadership', ...Array.from(depts).sort()];
	}, [enrichedMembers]);

	const filteredMembers = useMemo(() => {
		const q = query.trim().toLowerCase();
		let filtered = enrichedMembers;

		if (q) filtered = filtered.filter((m) => m._searchHaystack.includes(q));

		if (activeFilter === 'Leadership') filtered = filtered.filter((m) => m.isLeader);
		else if (activeFilter !== 'All')
			filtered = filtered.filter((m) => m.primaryDept === activeFilter);

		// Sorting
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

	return (
		<div className="page-container tight-top team-page-layout">
			{/* Mobile Filter Toggle Button */}
			<button
				onClick={() => {
					setShowMobileFilters(!showMobileFilters);
					setShowMobileSort(false);
				}}
				className="lg:hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9998] w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
				aria-label="Toggle filters"
				aria-expanded={showMobileFilters}
			>
				<Filter size={20} />
			</button>

			{/* Mobile Filter Overlay */}
			{showMobileFilters && (
				<div
					className="lg:hidden fixed inset-0 z-[9997] bg-black/50 backdrop-blur-sm"
					onClick={() => setShowMobileFilters(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`team-sidebar ${
					showMobileFilters ? 'block' : 'hidden lg:block'
				} lg:relative fixed lg:fixed top-0 right-0 lg:right-auto lg:top-auto h-full lg:h-auto w-80 max-w-[85vw] lg:w-auto z-[9998] lg:z-auto`}
			>
				<div className="team-sidebar-content h-full lg:h-auto overflow-y-auto">
					<div className="flex items-center justify-between mb-4 lg:mb-0">
						<h2 className="filter-header flex-1">
							<Users size={20} />
							<span>Departments</span>
						</h2>
						<button
							onClick={() => setShowMobileFilters(false)}
							className="lg:hidden p-2 rounded-lg hover:bg-glass-hover transition-colors"
							aria-label="Close filters"
						>
							<X size={18} />
						</button>
					</div>
					<nav className="filter-nav">
						{departments.map((dept) => (
							<button
								key={dept}
								className={`filter-button ${activeFilter === dept ? 'active' : ''}`}
								onClick={() => {
									setActiveFilter(dept);
									setShowMobileFilters(false);
								}}
							>
								{dept === 'Leadership' && <Star size={16} />}
								{dept !== 'Leadership' && dept !== 'All' && <Briefcase size={16} />}
								<span>{dept}</span>
							</button>
						))}
					</nav>
				</div>
			</aside>

			{/* Main Content */}
			<main className="team-main-content">
				<header>
					<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 brand-text">
						Our Team
					</h1>
					<p
						className="text-xs sm:text-sm md:text-base lg:text-lg"
						style={{ color: 'var(--text-secondary)' }}
					>
						{isLoading
							? 'Loading amazing people…'
							: `${enrichedMembers.length} talented member${
									enrichedMembers.length !== 1 ? 's' : ''
							  } across ${departments.length - 2} department${
									departments.length - 2 !== 1 ? 's' : ''
							  }`}
					</p>
				</header>

				{/* Controls */}
				<div className="team-controls">
					<div className="search-bar-wrapper">
						<Search className="search-icon" style={{ color: 'var(--text-muted)' }} />
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by name, role, or skill…"
							className="search-input"
							aria-label="Search team members"
						/>
						{query && (
							<button
								type="button"
								aria-label="Clear search"
								onClick={() => setQuery('')}
								className="clear-search-button"
							>
								<X size={16} />
							</button>
						)}
					</div>

					<div className="controls-right">
						{/* Mobile Sort Dropdown */}
						<div className="lg:hidden relative">
							<button
								onClick={() => setShowMobileSort(!showMobileSort)}
								className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]"
								aria-label="Sort team members"
								aria-expanded={showMobileSort}
							>
								<span>
									Sort:{' '}
									{sortBy === 'name'
										? 'Name'
										: sortBy === 'role'
										? 'Role'
										: 'Dept'}
								</span>
								<ChevronDown
									size={16}
									className={`transition-transform ${
										showMobileSort ? 'rotate-180' : ''
									}`}
								/>
							</button>
							{showMobileSort && (
								<>
									<div
										className="fixed inset-0 z-[-1]"
										onClick={() => setShowMobileSort(false)}
									/>
									<div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
										{['name', 'role', 'dept'].map((option) => (
											<button
												key={option}
												onClick={() => {
													setSortBy(option);
													setShowMobileSort(false);
												}}
												className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
													sortBy === option
														? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
														: ''
												}`}
											>
												{option === 'name'
													? 'Name'
													: option === 'role'
													? 'Role'
													: 'Department'}
											</button>
										))}
									</div>
								</>
							)}
						</div>

						{/* Desktop Sort */}
						<div className="hidden lg:flex control-field">
							<label htmlFor="sort-select" className="control-label">
								Sort
							</label>
							<select
								id="sort-select"
								className="control-select"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								aria-label="Sort team members"
							>
								<option value="name">Name</option>
								<option value="role">Role</option>
								<option value="dept">Department</option>
							</select>
						</div>
						<div className="result-count" aria-live="polite" aria-atomic="true">
							{isLoading
								? '—'
								: `${filteredMembers.length} result${
										filteredMembers.length !== 1 ? 's' : ''
								  }`}
						</div>
					</div>
				</div>

				{isLoading ? (
					<TeamSkeleton />
				) : (
					<TeamGrid members={filteredMembers} onCardClick={openModal} />
				)}
			</main>

			<TeamMemberModal
				member={selectedMember}
				isOpen={!!selectedMember}
				onClose={closeModal}
			/>
		</div>
	);
};

const TeamsPageWrapper = () => <TeamsPage />;

export default TeamsPageWrapper;
