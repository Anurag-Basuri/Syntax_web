import React from 'react';
import { useNavigate } from 'react-router-dom';
import './policies.css'; // NEW

const RefundPolicy = () => {
	const navigate = useNavigate();

	return (
		<div className="policy-container">
			<main className="policy-card policy-prose" aria-labelledby="refund-heading">
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
					<h1 id="refund-heading">Refund & Cancellation Policy</h1>
					<p style={{ marginTop: 8 }}>
						Effective: <strong>July 2025</strong> — transparent rules for registration,
						ticket and payment refunds.
					</p>
				</header>

				<section style={{ marginBottom: 12 }}>
					<h2>Quick summary</h2>
					<p>
						By default, registrations and ticket purchases are non‑refundable unless an
						event explicitly allows refunds. We will, however, issue full refunds when
						the club or its vendors fail to provide the purchased service, when an event
						is cancelled by Syntax Club, or when a material change prevents attendance.
					</p>
				</section>

				<section aria-labelledby="eligible-refunds" style={{ marginBottom: 12 }}>
					<h3 id="eligible-refunds">When we will issue a refund</h3>
					<ul style={{ paddingLeft: 18 }}>
						<li>
							<strong>Organizer error:</strong> Full refund if we fail to deliver your
							ticket due to a club/vendor error.
						</li>
						<li>
							<strong>Event cancelled:</strong> Full refund if Syntax Club cancels an
							event (unless event page states otherwise).
						</li>
						<li>
							<strong>Material change:</strong> If the event changes substantially and
							you cannot attend, you may request a refund (case‑by‑case).
						</li>
						<li>
							<strong>Duplicate / billing error:</strong> Full refund after
							verification.
						</li>
					</ul>
				</section>

				<section aria-labelledby="exceptions" style={{ marginBottom: 12 }}>
					<h3 id="exceptions">Exceptions & non‑refundables</h3>
					<p>
						Generally non‑refundable items include registrations explicitly marked
						non‑refundable, donations, sponsorships, and merchandise (unless faulty).
						Transaction fees from third‑party processors may be non‑recoverable.
					</p>
				</section>

				<section aria-labelledby="how-to-request" style={{ marginBottom: 12 }}>
					<h3 id="how-to-request">How to request a refund</h3>
					<ol style={{ paddingLeft: 18 }}>
						<li>
							Contact syntax.studorg@gmail.com or the site contact form with your
							registration/ticket ID, full name, event name and reason.
						</li>
						<li>Attach payment receipts or screenshots when available.</li>
						<li>
							We will acknowledge within 3 business days and request any needed
							information.
						</li>
						<li>
							If approved, refunds use the original payment method where possible;
							otherwise we will propose an alternative.
						</li>
					</ol>
				</section>

				<section aria-labelledby="timelines" style={{ marginBottom: 12 }}>
					<h3 id="timelines">Timelines & processing</h3>
					<p>
						Approved refunds are usually processed within{' '}
						<strong>7–14 business days</strong>. The time until funds appear depends on
						your bank/payment provider.
					</p>
				</section>

				<section aria-labelledby="chargebacks" style={{ marginBottom: 12 }}>
					<h3 id="chargebacks">Chargebacks & disputes</h3>
					<p>
						If you initiate a chargeback before contacting us, we may pause your account
						while investigating. Please contact the club first so we can resolve issues
						and, when appropriate, issue refunds.
					</p>
				</section>

				<section aria-labelledby="contact" style={{ marginBottom: 12 }}>
					<h3 id="contact">Contact & support</h3>
					<address style={{ marginTop: 8 }}>
						<div>
							<strong>Email:</strong>{' '}
							<a href="mailto:syntax.studorg@gmail.com">syntax.studorg@gmail.com</a>
						</div>
						<div>
							<strong>Response target:</strong> We aim to respond within 3 business
							days.
						</div>
					</address>
				</section>

				<footer style={{ marginTop: 8, textAlign: 'center' }}>
					<p style={{ color: 'var(--text-secondary)' }}>
						These terms are intended to be fair to participants while protecting club
						operations. Syntax Club may update this policy; material changes will be
						communicated. Last updated: July 2025.
					</p>
				</footer>
			</main>
		</div>
	);
};

export default RefundPolicy;
