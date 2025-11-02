import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white px-4 py-16 flex justify-center items-start">
			<div className="w-full max-w-4xl bg-blue-900/30 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-blue-500/40">
				<button
					onClick={() => navigate(-1)}
					className="mb-8 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors"
				>
					← Back
				</button>

				<h1 className="text-4xl font-bold text-blue-400 mb-6 text-center">
					Privacy Policy
				</h1>

				<p className="text-blue-200 mb-6 text-sm text-center">
					Effective from: <span className="text-blue-300 font-medium">July 2025</span>
				</p>

				<div className="text-blue-100 text-base leading-relaxed space-y-8">
					<p>
						<span className="font-semibold text-blue-300">Legal Name: Subham Raj</span>
						<br />
						This Privacy Policy describes how we collect, use, disclose, and protect
						your personal information when you use our website and services.
					</p>
					<ul className="list-disc pl-6 space-y-4">
						<li>
							<span className="font-semibold text-blue-300">
								Information Collection:
							</span>
							<br />
							We collect information you provide during registration, event
							participation, and when you contact us. This may include your name,
							email, phone number, LPU ID, and other details relevant to our services.
						</li>
						<li>
							<span className="font-semibold text-blue-300">
								Usage of Information:
							</span>
							<br />
							Your information is used to provide and improve our services, process
							registrations, communicate with you, and comply with legal obligations.
						</li>
						<li>
							<span className="font-semibold text-blue-300">Data Sharing:</span>
							<br />
							We do not sell or rent your personal information. We may share data with
							trusted partners or vendors only as necessary to deliver our services,
							or if required by law.
						</li>
						<li>
							<span className="font-semibold text-blue-300">Cookies & Tracking:</span>
							<br />
							We use cookies and similar technologies to enhance your experience,
							remember preferences, and analyze site usage. You can manage cookies in
							your browser settings.
						</li>
						<li>
							<span className="font-semibold text-blue-300">Data Security:</span>
							<br />
							We implement reasonable security measures to protect your data from
							unauthorized access, alteration, or disclosure.
						</li>
						<li>
							<span className="font-semibold text-blue-300">Third-Party Links:</span>
							<br />
							Our website may contain links to third-party sites. We are not
							responsible for their privacy practices. Please review their policies
							before providing any information.
						</li>
						<li>
							<span className="font-semibold text-blue-300">Children's Privacy:</span>
							<br />
							Our services are not intended for children under 13. We do not knowingly
							collect personal information from children.
						</li>
						<li>
							<span className="font-semibold text-blue-300">Policy Updates:</span>
							<br />
							We may update this Privacy Policy from time to time. Changes will be
							posted on this page with the updated effective date.
						</li>
						<li>
							<span className="font-semibold text-blue-300">Contact Us:</span>
							<br />
							For any questions or concerns regarding this Privacy Policy, please
							email us at{' '}
							<a
								href="mailto:subhamraj.helpdesk@gmail.com"
								className="underline text-blue-300"
							>
								subhamraj.helpdesk@gmail.com
							</a>
							.
						</li>
					</ul>
				</div>

				<div className="mt-10 flex justify-center">
					<div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
				</div>
				<p className="mt-8 text-sm text-center text-blue-300 italic">
					By using our website and services, you consent to the collection and use of your
					information as described in this Privacy Policy.
				</p>
			</div>
		</div>
	);
};

export default PrivacyPolicy;
