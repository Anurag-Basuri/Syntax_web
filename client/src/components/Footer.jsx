import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Instagram, Mail, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
	const [openQuick, setOpenQuick] = useState(false);
	const [openPolicies, setOpenPolicies] = useState(false);

	const socialLinks = [
		{
			name: 'LinkedIn',
			icon: <Linkedin className="w-4 h-4" />,
			url: 'https://www.linkedin.com/company/syntax-club/',
		},
		{
			name: 'Instagram',
			icon: <Instagram className="w-4 h-4" />,
			url: 'https://www.instagram.com/syntax.club/',
		},
	];

	const quickLinks = [
		{ name: 'Join Us', to: '/join' },
		{ name: 'Events', to: '/event' },
		{ name: 'Team', to: '/team' },
		{ name: 'Contact', to: '/contact' },
		{ name: 'Socials', to: '/socials' },
	];

	const policiesLinks = [
		{ name: 'Privacy Policy', to: '/policies/privacy' },
		{ name: 'Terms of Service', to: '/policies/terms' },
		{ name: 'Refund Policy', to: '/policies/refund' },
	];

	return (
		<footer className="bg-transparent border-t border-white/6">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* compact vertical spacing on mobile */}
				<div className="py-5 md:py-8">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
						{/* Brand */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-sm text-sm">
									SC
								</div>
								<div>
									<h3 className="text-base md:text-lg font-semibold">
										Syntax Club
									</h3>
									<p className="text-sm text-secondary hidden sm:block max-w-sm">
										Hands-on projects, workshops and a supportive student
										community.
									</p>
								</div>
							</div>

							{/* social icons: slightly larger on mobile for touch */}
							<div className="flex gap-3 mt-1">
								{socialLinks.map((social, i) => (
									<motion.a
										key={i}
										href={social.url}
										target="_blank"
										rel="noopener noreferrer"
										whileHover={{ scale: 1.05 }}
										className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-white/6 border border-white/6 flex items-center justify-center text-accent hover:bg-white/12 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20"
										aria-label={social.name}
									>
										{social.icon}
									</motion.a>
								))}
							</div>

							{/* contact compact for mobile */}
							<div className="mt-2 text-xs text-secondary">
								<a
									href="mailto:syntax.studorg@gmail.com"
									className="hover:text-accent"
								>
									syntax.studorg@gmail.com
								</a>
								<div className="mt-1 hidden sm:block">
									Lovely Professional University, Punjab
								</div>
							</div>
						</div>

						{/* Links area: use collapsible groups on small screens */}
						<div className="flex flex-col gap-4">
							{/* Desktop view */}
							<div className="hidden sm:flex gap-8">
								<div>
									<h4 className="text-sm font-semibold mb-2">Quick Links</h4>
									<ul className="space-y-2 text-sm text-secondary">
										{quickLinks.map((link) => (
											<li key={link.to}>
												<Link
													to={link.to}
													className="hover:text-accent transition-colors"
												>
													{link.name}
												</Link>
											</li>
										))}
									</ul>
								</div>

								<div>
									<h4 className="text-sm font-semibold mb-2">Policies</h4>
									<ul className="space-y-2 text-sm text-secondary">
										{policiesLinks.map((p) => (
											<li key={p.to}>
												<Link
													to={p.to}
													className="hover:text-accent transition-colors"
												>
													{p.name}
												</Link>
											</li>
										))}
									</ul>
								</div>
							</div>

							{/* Mobile collapsible */}
							<div className="sm:hidden">
								<button
									type="button"
									onClick={() => setOpenQuick((s) => !s)}
									className="w-full flex items-center justify-between py-2 px-3 rounded-md bg-white/2 hover:bg-white/4 focus:outline-none focus:ring-2 focus:ring-accent/20"
									aria-expanded={openQuick}
								>
									<span className="font-medium">Quick Links</span>
									{openQuick ? (
										<ChevronUp className="w-4 h-4" />
									) : (
										<ChevronDown className="w-4 h-4" />
									)}
								</button>
								{openQuick && (
									<ul className="mt-2 space-y-2 text-sm text-secondary px-2">
										{quickLinks.map((link) => (
											<li key={link.to}>
												<Link
													to={link.to}
													className="block py-1 hover:text-accent"
												>
													{link.name}
												</Link>
											</li>
										))}
									</ul>
								)}

								<button
									type="button"
									onClick={() => setOpenPolicies((s) => !s)}
									className="mt-3 w-full flex items-center justify-between py-2 px-3 rounded-md bg-white/2 hover:bg-white/4 focus:outline-none focus:ring-2 focus:ring-accent/20"
									aria-expanded={openPolicies}
								>
									<span className="font-medium">Policies</span>
									{openPolicies ? (
										<ChevronUp className="w-4 h-4" />
									) : (
										<ChevronDown className="w-4 h-4" />
									)}
								</button>
								{openPolicies && (
									<ul className="mt-2 space-y-2 text-sm text-secondary px-2">
										{policiesLinks.map((p) => (
											<li key={p.to}>
												<Link
													to={p.to}
													className="block py-1 hover:text-accent"
												>
													{p.name}
												</Link>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>

						{/* Contact column moved below on mobile via grid ordering */}
						<div className="order-last md:order-none">
							<h4 className="text-sm font-semibold mb-2">Contact</h4>
							<ul className="space-y-3 text-sm text-secondary">
								<li>
									<a
										href="mailto:syntax.studorg@gmail.com"
										className="flex items-center gap-3 hover:text-accent"
									>
										<span className="w-8 h-8 rounded-full bg-white/6 border border-white/8 flex items-center justify-center">
											<Mail className="w-4 h-4 text-accent" />
										</span>
										<span className="truncate max-w-[170px]">
											syntax.studorg@gmail.com
										</span>
									</a>
								</li>
								<li>
									<a
										href="https://maps.google.com/?q=Lovely+Professional+University"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-start gap-3 hover:text-accent"
									>
										<span className="w-8 h-8 rounded-full bg-white/6 border border-white/8 flex items-center justify-center">
											<MapPin className="w-4 h-4 text-accent" />
										</span>
										<span className="text-sm">
											Lovely Professional University, Punjab
										</span>
									</a>
								</li>
							</ul>
						</div>
					</div>

					{/* bottom row: compact */}
					<div className="mt-6 pt-4 border-t border-white/6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-secondary">
						<p className="text-center sm:text-left">
							© {new Date().getFullYear()} Syntax Club. All rights reserved.
						</p>
						<p className="text-xs text-secondary/60">
							Developed by the Syntax Dev Team
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
