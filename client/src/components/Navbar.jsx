import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	Home,
	Calendar,
	UserPlus,
	LogIn,
	LayoutDashboard,
	Menu,
	X,
	User,
	LogOut,
	ChevronDown,
	Eye,
	Sparkles,
	Users,
	Contact,
	Info,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.js';
import ThemeToggle from './ThemeToggle.jsx';
import NavLogo from './NavLogo.jsx';

// --- Hooks ---
const useClickOutside = (ref, callback) => {
	useEffect(() => {
		const handleClick = (e) => {
			if (ref.current && !ref.current.contains(e.target)) {
				callback();
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [ref, callback]);
};

// --- Data ---
const navItems = [
	{ name: 'Home', icon: Home, path: '/' },
	{ name: 'Events', icon: Calendar, path: '/event' },
	{ name: 'Team', icon: Users, path: '/team' },
	{ name: 'Arvantis', icon: Sparkles, path: '/arvantis' },
	{ name: 'Socials', icon: Info, path: '/socials' },
	{ name: 'Contact', icon: Contact, path: '/contact' },
];

// --- Sub-components ---

const DesktopNav = ({ onNavigate }) => {
	const { pathname } = useLocation();
	return (
		<nav className="navbar-section-center" role="menubar" aria-label="Primary navigation">
			<ul className="nav-list">
				{navItems.map((item) => {
					const isActive =
						item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
					return (
						<li key={item.name} role="none">
							<button
								onClick={() => onNavigate(item.path)}
								className={`nav-link ${isActive ? 'active' : ''}`}
								aria-current={isActive ? 'page' : undefined}
								role="menuitem"
								aria-label={item.name}
							>
								<item.icon size={18} className="nav-link-icon" aria-hidden="true" />
								<span className="nav-link-text">{item.name}</span>
								{isActive && <span className="nav-pill" aria-hidden="true" />}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

const AuthSection = ({ onNavigate }) => {
	const { isAuthenticated, user, logoutMember, logoutAdmin } = useAuth();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const userMenuRef = useRef(null);
	useClickOutside(userMenuRef, () => setIsUserMenuOpen(false));

	// Prefer explicit role check (fallback to presence of memberID)
	const isMember = user?.role === 'member' || !!user?.memberID;
	const isAdmin = user?.role === 'admin';

	const handleLogout = async () => {
		try {
			if (isAdmin && typeof logoutAdmin === 'function') {
				await logoutAdmin();
				onNavigate('/admin/auth');
			} else {
				// default to member logout
				if (typeof logoutMember === 'function') await logoutMember();
				onNavigate('/auth/login');
			}
		} catch (err) {
			console.error('Logout failed:', err);
			// still navigate to login to clear UI state
			onNavigate(isAdmin ? '/admin/auth' : '/auth/login');
		}
	};

	if (isAuthenticated) {
		return (
			<div className="navbar-user-menu" ref={userMenuRef}>
				<button
					onClick={() => setIsUserMenuOpen((v) => !v)}
					className="user-menu-button"
					aria-haspopup="menu"
					aria-expanded={isUserMenuOpen}
					aria-controls="user-menu"
				>
					<div className="user-avatar">
						<User className="user-avatar-icon" />
					</div>
					<span className="user-role-text">{isMember ? 'Member' : 'Admin'}</span>
					<ChevronDown
						className="user-menu-chevron"
						style={{
							transform: `rotate(${isUserMenuOpen ? 180 : 0}deg)`,
						}}
					/>
				</button>
				<AnimatePresence>
					{isUserMenuOpen && (
						<motion.div
							id="user-menu"
							className="user-dropdown"
							role="menu"
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2, ease: 'easeOut' }}
						>
							<div className="user-dropdown-items">
								<button
									onClick={() =>
										onNavigate(isMember ? '/member' : '/admin/dashboard')
									}
									className="user-dropdown-item"
									role="menuitem"
								>
									<LayoutDashboard className="dropdown-icon" />
									<span>Dashboard</span>
								</button>
								<button
									onClick={() => onNavigate('/appliesandcontacts/show')}
									className="user-dropdown-item"
									role="menuitem"
								>
									<Eye className="dropdown-icon" />
									<span>Show</span>
								</button>
								<button
									onClick={() => onNavigate('/edit/arvantis')}
									className="user-dropdown-item"
									role="menuitem"
								>
									<Sparkles className="dropdown-icon" />
									<span>Arvantis</span>
								</button>
							</div>
							<div className="user-dropdown-footer">
								<button className="logout-button" onClick={handleLogout}>
									<LogOut className="h-4 w-4" />
									<span>Log Out</span>
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		);
	}

	return (
		<div className="navbar-auth-buttons">
			<button
				onClick={() => onNavigate('/auth/login')}
				className="auth-button auth-button-secondary"
			>
				<LogIn className="h-4 w-4" />
				<span>Login</span>
			</button>
			<button
				onClick={() => onNavigate('/auth/join')}
				className="auth-button auth-button-primary"
			>
				<UserPlus className="h-4 w-4" />
				<span>Join</span>
			</button>
		</div>
	);
};

const MobileDrawer = ({ isOpen, onClose, onNavigate }) => {
	const { pathname } = useLocation();
	const { isAuthenticated } = useAuth();
	const mobileMenuRef = useRef(null);
	useClickOutside(mobileMenuRef, onClose);

	useEffect(() => {
		document.body.style.overflow = isOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	return (
		<AnimatePresence>
			{isOpen && (
				<div
					className="mobile-drawer-overlay"
					role="dialog"
					aria-modal="true"
					aria-label="Mobile navigation"
				>
					<motion.div
						className="mobile-drawer-backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						onClick={onClose}
						aria-hidden="true"
					/>
					<motion.div
						ref={mobileMenuRef}
						className="mobile-drawer"
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', stiffness: 260, damping: 28 }}
					>
						<div className="mobile-drawer-content">
							<div className="mobile-drawer-header">
								<NavLogo onClick={() => onNavigate('/')} />
								<div className="mobile-drawer-actions">
									<ThemeToggle size="sm" />
									<button
										className="mobile-drawer-close"
										onClick={onClose}
										aria-label="Close menu"
									>
										<X size={20} />
									</button>
								</div>
							</div>
							<nav className="mobile-drawer-nav" aria-label="Mobile menu">
								<ul className="mobile-nav-list" role="menubar">
									{navItems.map((item) => {
										const isActive = pathname.startsWith(item.path);
										return (
											<li key={item.name} role="none">
												<button
													onClick={() => onNavigate(item.path)}
													className={`mobile-nav-item ${
														isActive ? 'active' : ''
													}`}
													role="menuitem"
													aria-current={isActive ? 'page' : undefined}
													aria-label={item.name}
												>
													<div className="mobile-nav-icon">
														<item.icon size={20} aria-hidden="true" />
													</div>
													<span className="mobile-nav-text">
														{item.name}
													</span>
												</button>
											</li>
										);
									})}
								</ul>
							</nav>
							{!isAuthenticated && (
								<div className="mobile-drawer-auth">
									<button
										onClick={() => onNavigate('/auth/login')}
										className="mobile-auth-button secondary"
									>
										<LogIn className="h-4 w-4" />
										<span>Login</span>
									</button>
									<button
										onClick={() => onNavigate('/auth/join')}
										className="mobile-auth-button primary"
									>
										<UserPlus className="h-4 w-4" />
										<span>Join Club</span>
									</button>
								</div>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

const NavbarSkeleton = () => (
	<div className="navbar" data-elevated="false" data-visible="true">
		<div className="navbar-grid">
			<div className="navbar-section-left">
				<div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
			</div>
			<div className="navbar-section-center">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
					/>
				))}
			</div>
			<div className="navbar-section-right">
				<div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
				<div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
			</div>
		</div>
	</div>
);

// --- Main Component ---

const Navbar = ({ scrollProgress, isVisible }) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isElevated, setIsElevated] = useState(false);
	const { loading } = useAuth();
	const navigate = useNavigate();
	const navRef = useRef(null);

	const handleNavigation = useCallback(
		(path) => {
			navigate(path);
			setIsMobileMenuOpen(false);
		},
		[navigate]
	);

	useEffect(() => {
		const handleScroll = () => setIsElevated(window.scrollY > 10);
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Keep --navbar-height accurate on resize for perfect content offset
	useEffect(() => {
		const setHeight = () => {
			if (navRef.current) {
				document.documentElement.style.setProperty(
					'--navbar-height',
					`${navRef.current.offsetHeight}px`
				);
			}
		};
		setHeight();
		window.addEventListener('resize', setHeight);
		return () => window.removeEventListener('resize', setHeight);
	}, []);

	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape') setIsMobileMenuOpen(false);
		};
		document.addEventListener('keydown', handleEsc);
		return () => document.removeEventListener('keydown', handleEsc);
	}, []);

	if (loading) {
		return <NavbarSkeleton />;
	}

	return (
		<>
			<a href="#main" className="skip-link">
				Skip to content
			</a>
			<div className={`nav-shell ${isVisible ? 'show' : 'hide'}`} aria-hidden={!isVisible}>
				<nav
					ref={navRef}
					role="navigation"
					aria-label="Site navigation"
					className="navbar"
					data-elevated={isElevated}
				>
					<div
						className="navbar-progress-bar"
						style={{ width: `${scrollProgress}%` }}
						aria-hidden="true"
					/>
					<div className="navbar-grid">
						<div className="navbar-section-left">
							<NavLogo onClick={() => handleNavigation('/')} />
						</div>
						<DesktopNav onNavigate={handleNavigation} />
						<div className="navbar-section-right">
							<div className="navbar-theme-toggle">
								<ThemeToggle size="sm" />
							</div>
							<AuthSection onNavigate={handleNavigation} />
							<button
								className="mobile-menu-button"
								onClick={() => setIsMobileMenuOpen(true)}
								aria-label="Open menu"
								aria-controls="mobile-drawer"
								aria-expanded={isMobileMenuOpen}
							>
								<Menu className="w-6 h-6" aria-hidden="true" />
							</button>
						</div>
					</div>
				</nav>
			</div>
			<MobileDrawer
				isOpen={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
				onNavigate={handleNavigation}
			/>
		</>
	);
};

export default Navbar;
