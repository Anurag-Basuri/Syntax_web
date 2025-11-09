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

	// Lock body scroll when mobile sidebar is open
	useEffect(() => {
		if (showMobileFilters) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [showMobileFilters]);

	// Close mobile menus when clicking outside or pressing Escape
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (showMobileFilters) {
				const sidebar = document.querySelector('.team-sidebar');
				const filterButton = document.querySelector('[aria-label="Toggle filters"]');
				if (
					sidebar &&
					!sidebar.contains(e.target) &&
					filterButton &&
					!filterButton.contains(e.target)
				) {
					setShowMobileFilters(false);
				}
			}
			if (showMobileSort) {
				const sortButton = document.querySelector('[aria-label="Sort team members"]');
				const sortDropdown = document.querySelector('.mobile-sort-dropdown');
				if (
					sortButton &&
					!sortButton.contains(e.target) &&
					sortDropdown &&
					!sortDropdown.contains(e.target)
				) {
					setShowMobileSort(false);
				}
			}
		};

		const handleEscape = (e) => {
			if (e.key === 'Escape') {
				setShowMobileFilters(false);
				setShowMobileSort(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [showMobileFilters, showMobileSort]);

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
				onClick={(e) => {
					e.stopPropagation();
					setShowMobileFilters(!showMobileFilters);
					setShowMobileSort(false);
				}}
				className="lg:hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform touch-manipulation"
				aria-label="Toggle filters"
				aria-expanded={showMobileFilters}
			>
				<Filter size={18} className="sm:w-5 sm:h-5" />
			</button>

			{/* Mobile Filter Overlay */}
			{showMobileFilters && (
				<div
					className="lg:hidden fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity"
					onClick={(e) => {
						e.stopPropagation();
						setShowMobileFilters(false);
					}}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`team-sidebar ${showMobileFilters ? 'mobile-sidebar-open' : ''} ${
					showMobileFilters ? 'block' : 'hidden lg:block'
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="team-sidebar-content">
					<div className="flex items-center justify-between mb-4 lg:mb-0">
						<h2 className="filter-header flex-1">
							<Users size={20} />
							<span>Departments</span>
						</h2>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setShowMobileFilters(false);
							}}
							className="lg:hidden p-2 rounded-lg hover:bg-glass-hover transition-colors touch-manipulation"
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
								onClick={(e) => {
									e.stopPropagation();
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
					<h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 brand-text">
						Our Team
					</h1>
					<p
						className="text-xs xs:text-sm sm:text-base md:text-lg"
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
							type="search"
						/>
						{query && (
							<button
								type="button"
								aria-label="Clear search"
								onClick={() => setQuery('')}
								className="clear-search-button touch-manipulation"
							>
								<X size={16} />
							</button>
						)}
					</div>

					<div className="controls-right">
						{/* Mobile Sort Dropdown */}
						<div className="lg:hidden relative mobile-sort-container">
							<button
								onClick={(e) => {
									e.stopPropagation();
									setShowMobileSort(!showMobileSort);
									setShowMobileFilters(false);
								}}
								className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[110px] max-w-[140px] touch-manipulation"
								aria-label="Sort team members"
								aria-expanded={showMobileSort}
							>
								<span className="truncate">
									{sortBy === 'name'
										? 'Name'
										: sortBy === 'role'
										? 'Role'
										: 'Dept'}
								</span>
								<ChevronDown
									size={14}
									className={`flex-shrink-0 transition-transform ${
										showMobileSort ? 'rotate-180' : ''
									}`}
								/>
							</button>
							{showMobileSort && (
								<div className="mobile-sort-dropdown absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[10000] overflow-hidden min-w-[140px]">
									{['name', 'role', 'dept'].map((option) => (
										<button
											key={option}
											onClick={(e) => {
												e.stopPropagation();
												setSortBy(option);
												setShowMobileSort(false);
											}}
											className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation ${
												sortBy === option
													? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
													: 'text-gray-700 dark:text-gray-300'
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
