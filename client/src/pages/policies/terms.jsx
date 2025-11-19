import React from 'react';
import { useNavigate } from 'react-router-dom';
import './policies.css'; // NEW

const TermsPolicy = () => {
	const navigate = useNavigate();

	return (
		<div className="policy-container">
			<main className="policy-card policy-prose" aria-labelledby="terms-heading">
				<nav className="policy-nav">
					<button
						onClick={() => navigate(-1)}
						className="policy-back-btn"
						aria-label="Go back"
					>
						← Back
					</button>
				</nav>

				<header className="text-center" style={{ marginBottom: 16 }}>
					<h1 id="terms-heading">Terms of Service</h1>
					<p style={{ marginTop: 8 }}>
						Effective: <strong>July 2025</strong> — rules for use of Syntax Club
						services, membership, and events.
					</p>
				</header>

				<section style={{ marginBottom: 12 }}>
					<h2>1. Acceptance</h2>
					<p>
						By creating an account, applying for membership, attending events, or using
						our services you accept these Terms and our Privacy Policy. If you disagree,
						please do not use the services.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>2. Eligibility & Membership</h2>
					<p>
						Syntax Club is a student organization. Membership is limited to students who
						meet eligibility criteria on the Join page. Membership may require
						institutional verification (LPU ID) and can be revoked for violations.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>3. Accounts & Security</h2>
					<ul style={{ paddingLeft: 18 }}>
						<li>You are responsible for your account credentials and activity.</li>
						<li>Notify us immediately about suspected unauthorized access.</li>
						<li>
							We may suspend accounts to protect the community or comply with law.
						</li>
					</ul>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>4. Events & Tickets</h2>
					<p>
						Event registrations and tickets are subject to event-specific rules and
						fees. Cancellation, refund and transfer policies are posted per event.
						Contact organizers for clarifications before purchasing.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>5. Code of Conduct</h2>
					<p>
						Participants must act respectfully. Prohibited behavior includes harassment,
						discrimination, unlawful activity, and sharing personal data without
						consent. Violations may lead to warnings, suspension, or removal.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>6. Content & IP</h2>
					<p>
						Club-created materials are owned by Syntax Club unless noted. Members keep
						ownership of personal submissions but grant the club a non-exclusive license
						to use them for club activities.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>7. Moderation & Removal</h2>
					<p>
						We may remove content or block accounts that violate these Terms or the law.
						Where possible we'll provide notice and an opportunity to appeal.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>8. Privacy</h2>
					<p>
						Our Privacy Policy explains data handling. We obtain explicit consent for
						sensitive data collection.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>9. Third-party Services</h2>
					<p>
						We use third-party providers (payments, hosting, analytics). Their policies
						govern their services; we select reputable providers and enforce data
						protection requirements where applicable.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>10. Disclaimers & Liability</h2>
					<p>
						Services are provided "as is". To the extent permitted by law, Syntax Club
						disclaims warranties and limits liability for indirect or consequential
						damages.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>11. Indemnification</h2>
					<p>
						You agree to indemnify Syntax Club for claims arising from your violation of
						these Terms or unlawful actions.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>12. Termination</h2>
					<p>
						We may suspend or terminate accounts for breaches. Account closure requests
						can be submitted to the contact below; some records may be retained for
						legal reasons.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2>13. Changes</h2>
					<p>
						We may update these Terms. Material changes will be communicated. Continued
						use constitutes acceptance of updates.
					</p>
				</section>

				<section style={{ marginBottom: 12 }}>
					<h2 id="governing-law">14. Governing Law</h2>
					<p>
						These Terms are governed by the law where the club operates. Parties should
						try to resolve disputes in good faith before legal action.
					</p>
				</section>

				<section style={{ marginBottom: 8 }}>
					<h2>15. Contact</h2>
					<address style={{ marginTop: 8 }}>
						<div>
							<strong>Syntax Club</strong>
						</div>
						<div>
							<strong>Email:</strong>{' '}
							<a href="mailto:syntax.studorg@gmail.com">syntax.studorg@gmail.com</a>
						</div>
					</address>
				</section>

				<footer style={{ marginTop: 8, textAlign: 'center' }}>
					<p style={{ color: 'var(--text-secondary)' }}>Last updated: July 2025</p>
				</footer>
			</main>
		</div>
	);
};

export default TermsPolicy;
