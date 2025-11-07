import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Instagram, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
	const socialLinks = [
		{
			name: 'GitHub',
			icon: <Github className="w-5 h-5" />,
			url: 'https://github.com/your-org',
		},
		{
			name: 'LinkedIn',
			icon: <Linkedin className="w-5 h-5" />,
			url: 'https://www.linkedin.com/company/syntax-club/',
		},
		{
			name: 'Instagram',
			icon: <Instagram className="w-5 h-5" />,
			url: 'https://www.instagram.com/syntax.club/',
		},
	];

	const quickLinks = [
		{ name: 'Events', to: '/event' },
		{ name: 'Team', to: '/team' },
		{ name: 'Contact', to: '/contact' },
		{ name: 'Socials', to: '/socials' },
	];

	return (
		<footer className="pt-24 pb-12 px-4 relative z-10 overflow-hidden bg-transparent">
			<div className="max-w-6xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
					<div className="lg:col-span-2">
						<div className="flex items-center gap-3 mb-6">
							<h3 className="font-bold text-2xl brand-text">Syntax Club</h3>
						</div>
						<p className="text-secondary mb-8 max-w-md leading-relaxed">
							Empowering the next generation of innovators through hands-on projects,
							workshops, and community building.
						</p>
						<div className="flex gap-4">
							{socialLinks.map((social, index) => (
								<motion.a
									key={index}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									whileHover={{ scale: 1.1, y: -2 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-accent hover:text-white hover:bg-white/20 transition-all duration-300"
									aria-label={social.name}
								>
									{social.icon}
								</motion.a>
							))}
						</div>
					</div>

					<div>
						<h4 className="text-primary font-semibold mb-6 text-lg relative inline-block">
							Quick Links
							<div
								className="absolute bottom-0 left-0 w-full h-0.5"
								style={{
									background:
										'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
								}}
							></div>
						</h4>
						<ul className="space-y-4 text-secondary">
							{quickLinks.map((link) => (
								<li key={link.name}>
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
						<h4 className="text-primary font-semibold mb-6 text-lg relative inline-block">
							Contact Us
							<div
								className="absolute bottom-0 left-0 w-full h-0.5"
								style={{
									background:
										'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
								}}
							></div>
						</h4>
						<ul className="space-y-4 text-secondary">
							<li className="flex items-start gap-3">
								<a
									href="mailto:syntax.studorg@gmail.com"
									className="flex items-start gap-3 hover:text-accent transition-colors"
								>
									<div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center flex-shrink-0">
										<Mail className="h-4 w-4 text-accent" />
									</div>
									<span className="text-sm">syntax.studorg@gmail.com</span>
								</a>
							</li>
							<li className="flex items-start gap-3">
								<a
									href="https://maps.google.com/?q=Lovely+Professional+University"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-start gap-3 hover:text-accent transition-colors"
								>
									<div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center flex-shrink-0">
										<MapPin className="h-4 w-4 text-accent" />
									</div>
									<span className="text-sm">
										Lovely Professional University, Punjab
									</span>
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
					<p className="text-secondary text-center md:text-left text-sm">
						© {new Date().getFullYear()} Syntax Club. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
