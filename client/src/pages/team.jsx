import React, { useState, useMemo, useCallback } from 'react';
import { useMembers } from '../hooks/useMembers.js';
import TeamGrid from '../components/team/TeamGrid.jsx';
import TeamMemberModal from '../components/team/TeamMemberModal.jsx';
import TeamSkeleton from '../components/team/TeamSkeleton.jsx';
import { Search, X, Users, Briefcase, Star } from 'lucide-react';
import { isLeadershipRole } from '../constants/team.js';

const ErrorBlock = ({ message, onRetry }) => (
	<div className="flex flex-col items-center justify-center text-center py-24">
		<div className="text-5xl mb-4">⚠️</div>
		<h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--accent-error)' }}>
			Failed to load team
		</h2>
		<p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
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

		if (q) {
			filtered = filtered.filter((m) => m._searchHaystack.includes(q));
		}

		if (activeFilter === 'All') {
			return filtered;
		}
		if (activeFilter === 'Leadership') {
			return filtered.filter((m) => m.isLeader);
		}
		return filtered.filter((m) => m.primaryDept === activeFilter);
	}, [query, activeFilter, enrichedMembers]);

	const openModal = useCallback((member) => setSelectedMember(member), []);
	const closeModal = useCallback(() => setSelectedMember(null), []);

	if (isError) {
		return (
			<div className="page-container">
				<ErrorBlock message={error?.message || 'Unknown error'} onRetry={refetch} />
			</div>
		);
	}

	return (
		<div className="page-container team-page-layout">
			{/* --- Sticky Sidebar for Filters --- */}
			<aside className="team-sidebar">
				<div className="team-sidebar-content">
					<h2 className="filter-header">
						<Users size={20} />
						<span>Departments</span>
					</h2>
					<nav className="filter-nav">
						{departments.map((dept) => (
							<button
								key={dept}
								className={`filter-button ${activeFilter === dept ? 'active' : ''}`}
								onClick={() => setActiveFilter(dept)}
							>
								{dept === 'Leadership' && <Star size={14} />}
								{dept !== 'Leadership' && dept !== 'All' && <Briefcase size={14} />}
								<span>{dept}</span>
							</button>
						))}
					</nav>
				</div>
			</aside>

			{/* --- Main Content Area --- */}
			<main className="team-main-content">
				<header className="mb-8">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 brand-text">
						Our Team
					</h1>
					<p className="text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
						{isLoading
							? 'Loading amazing people…'
							: `${enrichedMembers.length} talented members across ${
									departments.length - 2
							  } departments`}
					</p>
				</header>

				<div className="search-bar-wrapper">
					<Search className="search-icon" style={{ color: 'var(--text-muted)' }} />
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search by name, role, or skill…"
						className="search-input"
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
