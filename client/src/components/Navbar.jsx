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
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ThemeToggle from './ThemeToggle.jsx';
import NavLogo from './NavLogo.jsx';
import logo from '../assets/logo.png';

const navSections = [
	{
		items: [
			{ name: 'Home', icon: Home, path: '/' },
			{ name: 'Events', icon: Calendar, path: '/event' },
			{ name: 'Team', icon: User, path: '/team' },
			{ name: 'Contact', icon: Mail, path: '/contact' },
		],
	},
];

const pathToNavName = (pathname) => {
	if (pathname === '/') return 'Home';
	if (pathname.startsWith('/event')) return 'Events';
	if (pathname.startsWith('/team')) return 'Team';
	if (pathname.startsWith('/contact')) return 'Contact';
	return 'Home';
};

const Navbar = ({ scrollProgress }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeLink, setActiveLink] = useState('Home');
	const { user, isAuthenticated, loading, logoutMember, logoutAdmin } = useAuth();
	const [isUserOpen, setIsUserOpen] = useState(false);
	const [elevated, setElevated] = useState(false);
	const userRef = useRef(null);
	const menuButtonRef = useRef(null);
	const drawerRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();

	const isMember = Boolean(user?.memberID);

	useEffect(() => {
		setActiveLink(pathToNavName(location.pathname));
	}, [location.pathname]);

	useEffect(() => {
		const handleScroll = () => {
			setElevated(window.scrollY > 10);
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		const onOutside = (e) => {
			if (
				userRef.current &&
				!userRef.current.contains(e.target) &&
				menuButtonRef.current &&
				!menuButtonRef.current.contains(e.target)
			) {
				setIsUserOpen(false);
			}
		};
		document.addEventListener('mousedown', onOutside);
		document.addEventListener('touchstart', onOutside);
		return () => {
			document.removeEventListener('mousedown', onOutside);
			document.removeEventListener('touchstart', onOutside);
		};
	}, []);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			document.body.style.touchAction = 'none';
		} else {
			document.body.style.overflow = '';
			document.body.style.touchAction = '';
		}
		return () => {
			document.body.style.overflow = '';
			document.body.style.touchAction = '';
		};
	}, [isOpen]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (drawerRef.current && !drawerRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('touchstart', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('touchstart', handleClickOutside);
		};
	}, [isOpen]);

	useEffect(() => {
		const onEsc = (e) => {
			if (e.key === 'Escape') {
				setIsOpen(false);
				setIsUserOpen(false);
			}
		};
		document.addEventListener('keydown', onEsc);
		return () => document.removeEventListener('keydown', onEsc);
	}, []);

	const handleLinkClick = (name) => {
		setActiveLink(name);
		setIsOpen(false);
		setIsUserOpen(false);
		const found = navSections.flatMap((s) => s.items).find((item) => item.name === name);
		if (found) navigate(found.path);
	};

	const handleLogoClick = () => {
		navigate('/');
		setActiveLink('Home');
		setIsOpen(false);
		setIsUserOpen(false);
	};

	const handleLogout = () => {
		try {
			if (isMember) logoutMember();
			else logoutAdmin();
		} catch {
			logoutMember();
		}
		setIsUserOpen(false);
		setIsOpen(false);
		navigate('/auth');
	};

	const handleDashboardClick = () => {
		setIsUserOpen(false);
		setIsOpen(false);
		if (isMember) navigate('/member/dashboard');
		else navigate('/admin/dashboard');
	};

	const handleQRScannerClick = () => {
		setIsUserOpen(false);
		setIsOpen(false);
		navigate('/vib/qrscanner');
	};

	const handleAlreadyMember = () => {
		setIsOpen(false);
		setIsUserOpen(false);
		navigate('/auth/login');
	};

	const handleJoinClub = () => {
		setIsOpen(false);
		setIsUserOpen(false);
		navigate('/auth/register');
	};

	if (loading) return null;

	return (
		<>
			<a
				href="#main"
				className="sr-only focus:not-sr-only fixed top-2 left-2 z-[1000] px-3 py-2 rounded-lg"
				style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
			>
				Skip to content
			</a>

			<nav role="navigation" aria-label="Primary" className="navbar" data-elevated={elevated}>
				<div className="navbar-progress-bar" style={{ width: `${scrollProgress}%` }} />

				<div className="navbar-grid">
					{/* Left Section - Logo */}
					<div className="navbar-section-left">
						<NavLogo onClick={handleLogoClick} elevated={elevated} />
					</div>

					{/* Center Section - Navigation Links */}
					<div className="navbar-section-center">
						{navSections.flatMap((section) =>
							section.items.map((item) => {
								const isActive = activeLink === item.name;
								return (
									<button
										key={item.name}
										onClick={() => handleLinkClick(item.name)}
										className={`nav-link ${isActive ? 'active' : ''}`}
										aria-current={isActive ? 'page' : undefined}
									>
										<item.icon size={18} className="nav-link-icon" />
										<span className="nav-link-text">{item.name}</span>
										{isActive && <span className="nav-pill" />}
									</button>
								);
							})
						)}
					</div>

					{/* Right Section - Theme + Auth */}
					<div className="navbar-section-right">
						<div className="navbar-theme-toggle">
							<ThemeToggle size="sm" />
						</div>

						{isAuthenticated ? (
							<div className="navbar-user-menu" ref={userRef}>
								<button
									onClick={() => setIsUserOpen((v) => !v)}
									className="user-menu-button"
									aria-haspopup="menu"
									aria-expanded={isUserOpen}
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
											transform: isUserOpen
												? 'rotate(180deg)'
												: 'rotate(0deg)',
										}}
									/>
								</button>

								{isUserOpen && (
									<div id="user-menu" className="user-dropdown" role="menu">
										<div className="user-dropdown-items">
											<button
												onClick={handleDashboardClick}
												className="user-dropdown-item"
												role="menuitem"
											>
												<LayoutDashboard className="dropdown-icon" />
												<span>
													{isMember
														? 'Member Dashboard'
														: 'Admin Dashboard'}
												</span>
											</button>
											<button
												onClick={() => navigate('/show')}
												className="user-dropdown-item"
												role="menuitem"
											>
												<QrCode className="dropdown-icon" />
												<span>Show</span>
											</button>
											<button
												onClick={handleQRScannerClick}
												className="user-dropdown-item"
												role="menuitem"
											>
												<QrCode className="dropdown-icon" />
												<span>QR Scanner</span>
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
									</div>
								)}
							</div>
						) : (
							<div className="navbar-auth-buttons">
								<button
									onClick={handleAlreadyMember}
									className="auth-button auth-button-secondary"
								>
									<LogIn className="h-4 w-4" />
									<span>Login</span>
								</button>
								<button
									onClick={handleJoinClub}
									className="auth-button auth-button-primary"
								>
									<UserPlus className="h-4 w-4" />
									<span>Join</span>
								</button>
							</div>
						)}

						<button
							ref={menuButtonRef}
							className="mobile-menu-button"
							onClick={() => setIsOpen(true)}
							aria-label="Open menu"
							aria-controls="mobile-drawer"
							aria-expanded={isOpen}
						>
							<Menu className="w-6 h-6" />
						</button>
					</div>
				</div>
			</nav>

			{/* Mobile Drawer */}
			{isOpen && (
				<div
					className="mobile-drawer-overlay"
					role="dialog"
					aria-modal="true"
					id="mobile-drawer"
				>
					<div
						className="mobile-drawer-backdrop"
						onClick={() => setIsOpen(false)}
						aria-hidden="true"
					/>
					<div ref={drawerRef} className="mobile-drawer">
						<div className="mobile-drawer-content">
							{/* Drawer Header */}
							<div className="mobile-drawer-header">
								<div className="mobile-drawer-logo">
									<img src={logo} alt="Logo" draggable="false" />
									<div className="mobile-drawer-logo-glow" aria-hidden="true">
										<div className="mobile-drawer-logo-glow-inner" />
									</div>
								</div>
								<div className="mobile-drawer-actions">
									<ThemeToggle size="sm" />
									<button
										className="mobile-drawer-close"
										onClick={() => setIsOpen(false)}
										aria-label="Close menu"
									>
										<X size={20} />
									</button>
								</div>
							</div>

							{/* Drawer Navigation */}
							<div className="mobile-drawer-nav">
								{navSections.map((section, idx) => (
									<div key={idx}>
										<ul className="mobile-nav-list">
											{section.items.map((item) => {
												const isActive = activeLink === item.name;
												return (
													<li key={item.name}>
														<button
															onClick={() =>
																handleLinkClick(item.name)
															}
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
								))}
							</div>

							{/* Drawer Auth */}
							{!isAuthenticated && (
								<div className="mobile-drawer-auth">
									<button
										onClick={handleAlreadyMember}
										className="mobile-auth-button secondary"
									>
										<LogIn className="h-4 w-4" />
										<span>Already a member</span>
									</button>
									<button
										onClick={handleJoinClub}
										className="mobile-auth-button primary"
									>
										<UserPlus className="h-4 w-4" />
										<span>Join Club</span>
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Navbar;
