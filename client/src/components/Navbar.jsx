import React, { useState, useEffect, useRef } from 'react';
import {
	Home,
	Calendar,
	Mail,
	UserPlus,
	LogIn,
	LayoutDashboard,
	Menu,
	X,
	User,
	LogOut,
	ChevronDown,
	QrCode,
	Sparkles,
	Users,
	Contact,
	Info,
} from 'lucide-react';
import { useNavigate, useLocation, NavLink as NavLinkBase } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ThemeToggle from './ThemeToggle.jsx';
import NavLogo from './NavLogo.jsx';

// Custom hook to handle clicks outside of a referenced element
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

// Unified navigation items
const navItems = [
	{ name: 'Home', icon: Home, path: '/' },
	{ name: 'Events', icon: Calendar, path: '/events' },
	{ name: 'Team', icon: Users, path: '/team' },
	{ name: 'Arvantis', icon: Sparkles, path: '/arvantis' },
	{ name: 'Socials', icon: Info, path: '/socials' },
	{ name: 'Contact', icon: Contact, path: '/contact' },
];

const Navbar = ({ scrollProgress, isVisible }) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isElevated, setIsElevated] = useState(false);

	const { isAuthenticated, user, logout, loading } = useAuth();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const userMenuRef = useRef(null);
	const mobileMenuRef = useRef(null);

	const isMember = !!user?.memberID;

	// Close menus on outside click
	useClickOutside(userMenuRef, () => setIsUserMenuOpen(false));
	useClickOutside(mobileMenuRef, () => setIsMobileMenuOpen(false));

	// Handle scroll elevation effect
	useEffect(() => {
		const handleScroll = () => setIsElevated(window.scrollY > 10);
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll(); // Initial check
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Close menus on Escape key press
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape') {
				setIsMobileMenuOpen(false);
				setIsUserMenuOpen(false);
			}
		};
		document.addEventListener('keydown', handleEsc);
		return () => document.removeEventListener('keydown', handleEsc);
	}, []);

	// Prevent body scroll when mobile menu is open
	useEffect(() => {
		document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [isMobileMenuOpen]);

	const handleNavigation = (path) => {
		navigate(path);
		setIsMobileMenuOpen(false);
		setIsUserMenuOpen(false);
	};

	const handleLogout = () => {
		logout();
		handleNavigation('/auth/login');
	};

	if (loading) {
		return null;
	}

	return (
		<>
			<a
				href="#main"
				className="sr-only focus:not-sr-only fixed top-2 left-2 z-[1000] px-3 py-2 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700"
			>
				Skip to content
			</a>

			<nav
				role="navigation"
				aria-label="Primary"
				className="navbar"
				data-elevated={isElevated}
				data-visible={isVisible}
			>
				<div className="navbar-progress-bar" style={{ width: `${scrollProgress}%` }} />

				<div className="navbar-grid">
					{/* Left Section - Logo */}
					<div className="navbar-section-left">
						<button onClick={() => handleNavigation('/')} aria-label="Go to Homepage">
							<NavLogo elevated={isElevated} />
						</button>
					</div>

					{/* Center Section - Navigation Links */}
					<div className="navbar-section-center">
						{navItems.map((item) => {
							const isActive =
								item.path === '/'
									? pathname === '/'
									: pathname.startsWith(item.path);
							return (
								<button
									key={item.name}
									onClick={() => handleNavigation(item.path)}
									className={`nav-link ${isActive ? 'active' : ''}`}
									aria-current={isActive ? 'page' : undefined}
								>
									<item.icon size={18} className="nav-link-icon" />
									<span className="nav-link-text">{item.name}</span>
									{isActive && <span className="nav-pill" />}
								</button>
							);
						})}
					</div>

					{/* Right Section - Theme + Auth */}
					<div className="navbar-section-right">
						<div className="navbar-theme-toggle">
							<ThemeToggle size="sm" />
						</div>

						{isAuthenticated ? (
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
									<span className="user-role-text">
										{isMember ? 'Member' : 'Admin'}
									</span>
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
														handleNavigation(
															isMember
																? '/member'
																: '/admin/dashboard'
														)
													}
													className="user-dropdown-item"
													role="menuitem"
												>
													<LayoutDashboard className="dropdown-icon" />
													<span>Dashboard</span>
												</button>
												<button
													onClick={() => handleNavigation('/show')}
													className="user-dropdown-item"
													role="menuitem"
												>
													<QrCode className="dropdown-icon" />
													<span>Show</span>
												</button>
											</div>
											<div className="user-dropdown-footer">
												<button
													className="logout-button"
													onClick={handleLogout}
												>
													<LogOut className="h-4 w-4" />
													<span>Log Out</span>
												</button>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						) : (
							<div className="navbar-auth-buttons">
								<button
									onClick={() => handleNavigation('/auth/login')}
									className="auth-button auth-button-secondary"
								>
									<LogIn className="h-4 w-4" />
									<span>Login</span>
								</button>
								<button
									onClick={() => handleNavigation('/auth/join')}
									className="auth-button auth-button-primary"
								>
									<UserPlus className="h-4 w-4" />
									<span>Join</span>
								</button>
							</div>
						)}

						<button
							className="mobile-menu-button"
							onClick={() => setIsMobileMenuOpen(true)}
							aria-label="Open menu"
							aria-controls="mobile-drawer"
							aria-expanded={isMobileMenuOpen}
						>
							<Menu className="w-6 h-6" />
						</button>
					</div>
				</div>
			</nav>

			{/* Mobile Drawer */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<div
						className="mobile-drawer-overlay"
						role="dialog"
						aria-modal="true"
						id="mobile-drawer"
					>
						<motion.div
							className="mobile-drawer-backdrop"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							onClick={() => setIsMobileMenuOpen(false)}
							aria-hidden="true"
						/>
						<motion.div
							ref={mobileMenuRef}
							className="mobile-drawer"
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						>
							<div className="mobile-drawer-content">
								<div className="mobile-drawer-header">
									<NavLogo />
									<div className="mobile-drawer-actions">
										<ThemeToggle size="sm" />
										<button
											className="mobile-drawer-close"
											onClick={() => setIsMobileMenuOpen(false)}
											aria-label="Close menu"
										>
											<X size={20} />
										</button>
									</div>
								</div>

								<div className="mobile-drawer-nav">
									<ul className="mobile-nav-list">
										{navItems.map((item) => {
											const isActive = pathname.startsWith(item.path);
											return (
												<li key={item.name}>
													<button
														onClick={() => handleNavigation(item.path)}
														className={`mobile-nav-item ${
															isActive ? 'active' : ''
														}`}
													>
														<div className="mobile-nav-icon">
															<item.icon size={20} />
														</div>
														<span className="mobile-nav-text">
															{item.name}
														</span>
													</button>
												</li>
											);
										})}
									</ul>
								</div>

								{!isAuthenticated && (
									<div className="mobile-drawer-auth">
										<button
											onClick={() => handleNavigation('/auth/login')}
											className="mobile-auth-button secondary"
										>
											<LogIn className="h-4 w-4" />
											<span>Login</span>
										</button>
										<button
											onClick={() => handleNavigation('/auth/join')}
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
		</>
	);
};

export default Navbar;
