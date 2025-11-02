import React from 'react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white px-4 py-16 flex justify-center items-start">
			<div className="w-full max-w-3xl bg-blue-950/80 backdrop-blur-md rounded-3xl p-10 shadow-2xl border border-blue-500/40">
				<button
					onClick={() => navigate(-1)}
					className="mb-8 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold shadow transition-colors"
				>
					← Back
				</button>
				<h1 className="text-4xl font-extrabold text-blue-400 mb-4 text-center tracking-tight drop-shadow">
					Cookie Policy
				</h1>
				<p className="text-blue-200 mb-8 text-sm text-center">
					Effective from: <span className="text-blue-300 font-medium">July 2025</span>
				</p>
				<div className="mb-8 flex justify-center">
					<div className="w-16 h-1 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300"></div>
				</div>
				<ol className="list-decimal pl-6 space-y-8 text-blue-100 text-base leading-relaxed">
					<li>
						<span className="font-semibold text-blue-300">What Are Cookies?</span>
						<br />
						<span className="text-blue-200">
							Cookies are small text files stored on your device by your browser when
							you visit our website. They help us provide a better user experience and
							enable certain site functionalities.
						</span>
					</li>
					<li>
						<span className="font-semibold text-blue-300">How We Use Cookies</span>
						<br />
						<span className="text-blue-200">
							We use cookies to:
							<ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-blue-200">
								<li>Remember your preferences and login status</li>
								<li>Enable smooth navigation and page transitions</li>
								<li>Analyze site usage and improve performance</li>
								<li>Support security and authentication features</li>
							</ul>
						</span>
					</li>
					<li>
						<span className="font-semibold text-blue-300">Types of Cookies We Use</span>
						<br />
						<span className="text-blue-200">
							<ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-blue-200">
								<li>
									<b>Essential Cookies:</b> Required for basic site functionality
									(e.g., authentication, session management).
								</li>
								<li>
									<b>Performance Cookies:</b> Help us analyze site usage and
									improve user experience.
								</li>
								<li>
									<b>Preference Cookies:</b> Store your settings and preferences.
								</li>
							</ul>
						</span>
					</li>
					<li>
						<span className="font-semibold text-blue-300">Third-Party Cookies</span>
						<br />
						<span className="text-blue-200">
							We do not use third-party advertising or tracking cookies. However, some
							features (such as embedded content or payment gateways) may set their
							own cookies. Please refer to their respective policies for details.
						</span>
					</li>
					<li>
						<span className="font-semibold text-blue-300">Managing Cookies</span>
						<br />
						<span className="text-blue-200">
							You can manage or delete cookies in your browser settings. Disabling
							cookies may affect your experience and some features may not work as
							intended.
						</span>
					</li>
					<li>
						<span className="font-semibold text-blue-300">Changes to This Policy</span>
						<br />
						<span className="text-blue-200">
							We may update this Cookie Policy from time to time. Changes will be
							posted on this page with the updated effective date.
						</span>
					</li>
					<li>
						<span className="font-semibold text-blue-300">Contact Us</span>
						<br />
						<span className="text-blue-200">
							For questions about our Cookie Policy, email us at{' '}
							<a
								href="mailto:vibranta.studorg@gmail.com"
								className="underline text-blue-300"
							>
								vibranta.studorg@gmail.com
							</a>
							.
						</span>
					</li>
				</ol>
				<div className="mt-10 flex justify-center">
					<div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
				</div>
				<p className="mt-8 text-sm text-center text-blue-300 italic">
					By using our website, you consent to our use of cookies as described in this
					policy.
				</p>
			</div>
		</div>
	);
};

export default CookiePolicy;
