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
	Search,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ThemeToggle from './ThemeToggle.jsx';
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

const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeLink, setActiveLink] = useState('Home');
	const { user, isAuthenticated, loading, logoutMember, logoutAdmin } = useAuth();
	const [isUserOpen, setIsUserOpen] = useState(false);
	const [elevated, setElevated] = useState(false);
	const [showNavbar, setShowNavbar] = useState(true);
	const [progress, setProgress] = useState(0);
	const userRef = useRef(null);
	const menuButtonRef = useRef(null);
	const drawerRef = useRef(null);
	const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
	const navigate = useNavigate();
	const location = useLocation();

	const isMember = Boolean(user?.memberID);

	useEffect(() => {
		setActiveLink(pathToNavName(location.pathname));
	}, [location.pathname]);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			const doc = document.documentElement;
			const max = (doc.scrollHeight || 0) - (window.innerHeight || 1);
			setProgress(Math.min(100, Math.max(0, (currentScrollY / Math.max(1, max)) * 100)));
			setElevated(currentScrollY > 8);

			if (currentScrollY <= 0) {
				setShowNavbar(true);
			} else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
				setShowNavbar(false);
			} else if (currentScrollY < lastScrollY.current - 2) {
				setShowNavbar(true);
			}
			lastScrollY.current = currentScrollY;
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

		if (name === 'QR Scanner') {
			navigate('/vib/qrscanner');
			return;
		}
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
		navigate('/auth', { state: { tab: 'login' } });
	};

	const handleJoinClub = () => {
		setIsOpen(false);
		setIsUserOpen(false);
		navigate('/auth', { state: { tab: 'register' } });
	};

	if (loading) return null;

	return (
		<>
			<style>{`
                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .navbar {
                    transition: transform .4s cubic-bezier(.4,0,.2,1), background .35s, box-shadow .35s, border-color .35s, height .25s;
                }
                .nav-link {
                    position: relative;
                    transition: color .25s ease, background .25s ease, transform .2s ease;
                }
                .nav-pill {
                    position: absolute;
                    inset: 0;
                    border-radius: 14px;
                    background: linear-gradient(90deg, color-mix(in srgb, var(--accent-1) 12%, transparent), color-mix(in srgb, var(--accent-2) 12%, transparent));
                    opacity: 0;
                    transform: scale(.96);
                    transition: opacity .25s, transform .25s;
                }
                .nav-link:hover .nav-pill { opacity: .6; transform: scale(1); }
                .nav-link.active .nav-pill { opacity: .9; transform: scale(1); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, var(--accent-1), var(--accent-2));
                    border-radius: 6px; border: 1px solid rgba(255,255,255,.1);
                }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,.2); border-radius: 6px; }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--accent-1) rgba(0,0,0,.2); }
            `}</style>

			<a
				href="#main"
				className="sr-only focus:not-sr-only fixed top-2 left-2 z-[1000] px-3 py-2 rounded-lg"
				style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
			>
				Skip to content
			</a>

			<nav
				role="navigation"
				aria-label="Primary"
				className="fixed top-0 left-0 w-full z-50 navbar"
				style={{
					height: elevated ? '4.5rem' : '5rem',
					borderBottom: elevated
						? '1px solid rgba(255,255,255,0.10)'
						: '1px solid rgba(255,255,255,0.06)',
					boxShadow: elevated
						? '0 8px 28px rgba(0,0,0,0.35)'
						: '0 8px 32px rgba(10,17,32,0.18), 0 1.5px 8px #1e293b',
					background: elevated
						? 'linear-gradient(90deg, rgba(7,12,20,0.9) 55%, rgba(18,28,43,0.88) 100%)'
						: 'linear-gradient(90deg, rgba(10,17,32,0.92) 60%, rgba(30,41,59,0.85) 100%)',
					backdropFilter: 'blur(16px)',
					transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
				}}
			>
				<div
					aria-hidden="true"
					className="absolute top-0 left-0 h-[2px]"
					style={{
						width: `${progress}%`,
						background: 'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
						boxShadow: '0 0 12px rgba(0,200,255,0.55)',
					}}
				/>
				<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-full">
					<div className="flex items-center justify-between h-full w-full">
						<button
							onClick={handleLogoClick}
							className="flex items-center gap-2 sm:gap-3 flex-shrink-0 relative select-none"
							aria-label="Go to home"
						>
							<div
								className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border relative overflow-hidden"
								style={{
									borderColor: 'rgba(255,255,255,0.08)',
									background: 'rgba(10,17,32,0.85)',
									boxShadow: elevated
										? '0 2px 16px rgba(0,200,255,0.4)'
										: '0 4px 24px rgba(0,200,255,0.7)',
								}}
							>
								<div className="absolute inset-0 pointer-events-none z-0">
									<div
										style={{
											position: 'absolute',
											inset: 0,
											background:
												'radial-gradient(circle at 60% 40%, var(--accent-1) 16%, transparent 70%), radial-gradient(circle at 30% 70%, var(--accent-2) 14%, transparent 70%)',
											opacity: 0.25,
											filter: 'blur(12px)',
										}}
									/>
									<div
										style={{
											position: 'absolute',
											inset: 0,
											background:
												'radial-gradient(circle at 70% 60%, var(--accent-2) 14%, transparent 70%), radial-gradient(circle at 40% 80%, var(--accent-1) 12%, transparent 70%)',
											opacity: 0.18,
											filter: 'blur(18px)',
										}}
									/>
								</div>
								<img
									src={logo}
									alt="Syntax Logo"
									loading="lazy"
									decoding="async"
									className="relative z-10"
									style={{
										background: '#0a0e17',
										borderRadius: '0.75rem',
										width: '78%',
										height: '78%',
										objectFit: 'contain',
										boxShadow: '0 2px 10px rgba(0,200,255,0.25)',
									}}
								/>
							</div>
							<h1
								className="font-extrabold text-lg sm:text-xl md:text-2xl bg-clip-text text-transparent tracking-wide"
								style={{
									letterSpacing: '0.04em',
									background:
										'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
									color: 'transparent',
								}}
							>
								Syntax
							</h1>
						</button>

						<div className="hidden lg:flex items-center gap-1 xl:gap-2">
							{navSections.flatMap((section) =>
								section.items.map((item) => {
									const isActive = activeLink === item.name;
									return (
										<button
											key={item.name}
											onClick={() => handleLinkClick(item.name)}
											className={`nav-link relative flex items-center gap-2 px-2.5 md:px-3 xl:px-4 py-2 rounded-[14px] font-medium text-sm xl:text-base ${
												isActive
													? 'active text-white'
													: 'text-slate-200 hover:text-white'
											}`}
											aria-current={isActive ? 'page' : undefined}
										>
											<span className="nav-pill" />
											<item.icon
												size={18}
												className="transition-all duration-300"
												style={isActive ? { color: 'var(--accent-1)' } : {}}
											/>
											<span className="whitespace-nowrap">{item.name}</span>
										</button>
									);
								})
							)}
						</div>

						<div className="flex items-center gap-2 sm:gap-3">
							<div className="hidden sm:flex">
								<ThemeToggle variant="inline" />
							</div>

							<button
								type="button"
								className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
								title="Search (coming soon)"
								disabled
								style={{
									background: 'var(--glass-bg)',
									border: '1px solid var(--glass-border)',
									opacity: 0.7,
									cursor: 'not-allowed',
								}}
							>
								<Search className="w-4 h-4" />
								<span className="text-secondary">Search</span>
							</button>

							{isAuthenticated ? (
								<div className="relative" ref={userRef}>
									<button
										onClick={() => setIsUserOpen((v) => !v)}
										className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-3.5 py-2 rounded-full transition-all"
										style={{
											background: 'var(--glass-bg)',
											border: '1px solid var(--glass-border)',
											backdropFilter: 'blur(10px)',
										}}
										aria-haspopup="menu"
										aria-expanded={isUserOpen}
										aria-controls="user-menu"
									>
										<div
											className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg"
											style={{
												background:
													'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
											}}
										>
											<User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
										</div>
										<span className="hidden sm:block text-white font-medium text-xs sm:text-sm">
											{isMember ? 'Member' : 'Admin'}
										</span>
										<ChevronDown
											className="h-4 w-4 text-white transition-transform duration-300"
											style={{
												transform: isUserOpen
													? 'rotate(180deg)'
													: 'rotate(0deg)',
											}}
										/>
									</button>

									{isUserOpen && (
										<div
											id="user-menu"
											className="absolute right-0 mt-3 w-56 sm:w-64 rounded-2xl backdrop-blur-lg border shadow-2xl overflow-hidden z-50"
											style={{
												background: 'rgba(2,6,12,0.9)',
												borderColor: 'rgba(255,255,255,0.12)',
											}}
											role="menu"
										>
											<div className="py-2">
												<button
													onClick={handleDashboardClick}
													className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all text-white"
													role="menuitem"
												>
													<LayoutDashboard
														className="h-5 w-5"
														style={{ color: 'var(--accent-1)' }}
													/>
													<span>
														{isMember
															? 'Member Dashboard'
															: 'Admin Dashboard'}
													</span>
												</button>
												<button
													onClick={() => navigate('/show')}
													className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all text-white"
													role="menuitem"
												>
													<QrCode
														className="h-5 w-5"
														style={{ color: 'var(--accent-2)' }}
													/>
													<span>Show</span>
												</button>
												<button
													onClick={handleQRScannerClick}
													className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all text-white"
													role="menuitem"
												>
													<QrCode
														className="h-5 w-5"
														style={{ color: 'var(--accent-1)' }}
													/>
													<span>QR Scanner</span>
												</button>
											</div>
											<div
												className="p-3 border-t"
												style={{ borderColor: 'rgba(255,255,255,0.1)' }}
											>
												<button
													className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all"
													onClick={handleLogout}
													style={{
														background:
															'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(239,68,68,0.75))',
													}}
												>
													<LogOut className="h-4 w-4" />
													<span>Log Out</span>
												</button>
											</div>
										</div>
									)}
								</div>
							) : (
								<div className="hidden sm:flex gap-2 items-center">
									<button
										onClick={handleAlreadyMember}
										className="btn btn-secondary rounded-xl text-sm"
										style={{ padding: '0.5rem 0.9rem' }}
									>
										<LogIn className="h-4 w-4" />
										<span>Already a member</span>
									</button>
									<button
										onClick={handleJoinClub}
										className="btn btn-primary rounded-xl text-sm"
										style={{ padding: '0.5rem 0.9rem' }}
									>
										<UserPlus className="h-4 w-4" />
										<span>Join Club</span>
									</button>
								</div>
							)}

							<button
								ref={menuButtonRef}
								className="lg:hidden p-2 sm:p-3 rounded-xl text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
								onClick={() => setIsOpen(true)}
								aria-label="Open menu"
								aria-controls="mobile-drawer"
								aria-expanded={isOpen}
								style={{
									background:
										'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
									zIndex: 60,
								}}
							>
								<Menu className="w-6 h-6 sm:w-7 sm:h-7" />
							</button>
						</div>
					</div>
				</div>
			</nav>

			{isOpen && (
				<div
					className="fixed inset-0 z-[100] lg:hidden"
					role="dialog"
					aria-modal="true"
					id="mobile-drawer"
				>
					<div
						className="fixed inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setIsOpen(false)}
						style={{ zIndex: 90 }}
						aria-hidden="true"
					/>
					<div
						ref={drawerRef}
						className="fixed top-0 left-0 h-[100dvh] w-72 max-w-[90vw] backdrop-blur-lg border-r shadow-2xl overflow-hidden z-[100]"
						style={{
							background: 'rgba(2,6,12,0.92)',
							borderColor: 'rgba(255,255,255,0.12)',
							animation: 'slideIn .3s ease-out',
						}}
					>
						<div className="h-full flex flex-col">
							<div
								className="flex justify-between items-center p-4 sm:p-6 border-b"
								style={{
									borderColor: 'rgba(255,255,255,0.1)',
									background:
										'linear-gradient(90deg, color-mix(in srgb, var(--accent-1) 12%, transparent), color-mix(in srgb, var(--accent-2) 12%, transparent))',
								}}
							>
								<div className="flex items-center gap-3">
									<div
										className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
										style={{
											background:
												'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
										}}
									>
										<LayoutDashboard size={22} />
									</div>
									<h1
										className="font-bold text-lg sm:text-xl bg-clip-text text-transparent"
										style={{
											background:
												'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
										}}
									>
										Syntax
									</h1>
								</div>
								<div className="flex items-center gap-2">
									<ThemeToggle variant="inline" />
									<button
										className="p-2 rounded-xl text-white transition-all"
										onClick={() => setIsOpen(false)}
										aria-label="Close menu"
										style={{
											background: 'var(--glass-bg)',
											border: '1px solid var(--glass-border)',
											backdropFilter: 'blur(10px)',
										}}
									>
										<X size={20} />
									</button>
								</div>
							</div>

							<div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
								<div className="space-y-6">
									{navSections.map((section, idx) => (
										<div key={idx}>
											<ul className="space-y-2">
												{section.items.map((item) => {
													const isActive = activeLink === item.name;
													return (
														<button
															key={item.name}
															onClick={() =>
																handleLinkClick(item.name)
															}
															className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl text-left transition-all ${
																isActive
																	? 'text-white'
																	: 'text-slate-300 hover:text-white'
															}`}
														>
															<div
																className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all border"
																style={{
																	background: isActive
																		? 'linear-gradient(90deg, color-mix(in srgb, var(--accent-1) 20%, transparent), color-mix(in srgb, var(--accent-2) 20%, transparent))'
																		: 'rgba(255,255,255,0.05)',
																	borderColor: isActive
																		? 'color-mix(in srgb, var(--accent-1) 30%, rgba(255,255,255,0.15))'
																		: 'rgba(255,255,255,0.1)',
																}}
															>
																<item.icon
																	size={20}
																	style={{
																		color: isActive
																			? 'var(--accent-1)'
																			: 'inherit',
																	}}
																/>
															</div>
															<span className="font-medium">
																{item.name}
															</span>
														</button>
													);
												})}
											</ul>
										</div>
									))}
								</div>
							</div>

							{!isAuthenticated && (
								<div
									className="p-4 sm:p-6 border-t space-y-3"
									style={{
										borderColor: 'rgba(255,255,255,0.1)',
										background:
											'linear-gradient(90deg, color-mix(in srgb, var(--accent-1) 10%, transparent), color-mix(in srgb, var(--accent-2) 10%, transparent))',
									}}
								>
									<button
										onClick={handleAlreadyMember}
										className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm"
										style={{
											background: 'var(--glass-bg)',
											border: '1px solid var(--glass-border)',
											color: 'var(--text-primary)',
											backdropFilter: 'blur(10px)',
										}}
									>
										<LogIn className="h-4 w-4" />
										<span>Already a member</span>
									</button>
									<button
										onClick={handleJoinClub}
										className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white text-sm"
										style={{
											background:
												'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
										}}
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
