import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle2, Phone, AtSign } from 'lucide-react';
import { sendContactMessage } from '../services/contactServices.js';
import { toast } from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme.js';

const ContactPage = () => {
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		lpuID: '',
		subject: '',
		message: '',
	});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState('');

	const panelCls = isDark
		? 'rounded-2xl p-8 backdrop-blur-md bg-slate-900/50 border border-white/6 text-white shadow-xl'
		: 'rounded-2xl p-8 backdrop-blur-md bg-white/70 border border-slate-200/20 text-slate-900 shadow-xl';

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((s) => ({ ...s, [name]: value }));
	};

	// Normalize phone: accept formats like +91 98765 43210, 0919876543210, 919876543210, 09876543210, (98765)43210, etc.
	// Strategy:
	//  - remove non-digits
	//  - if digits length === 10 => ok
	//  - if starts with '0' and len === 11 => drop leading 0
	//  - if starts with '91' and len === 12 => drop '91'
	//  - otherwise if len > 10 => take last 10 digits (fallback)
	//  - otherwise invalid
	const normalizePhone = (raw) => {
		if (!raw) return null;
		const digits = String(raw).replace(/\D/g, '');
		if (!digits) return null;

		if (digits.length === 10) return digits;
		if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
		if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
		// common input like '9198...' (length 12) handle dropping leading country code
		if (digits.length > 10) return digits.slice(-10);
		return null;
	};

	const validate = (data) => {
		if (!data.name.trim()) return 'Name is required';
		if (!data.email.trim()) return 'Email is required';
		// simple email check
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Invalid email';
		if (!data.phone.trim()) return 'Phone is required';

		const normalized = normalizePhone(data.phone);
		if (!normalized)
			return 'Invalid phone — please enter a 10-digit mobile number (country code +91 or leading zero are supported)';
		// LPU ID basic check
		if (!data.lpuID.trim()) return 'LPU ID is required';
		if (!/^\d{4,12}$/.test(data.lpuID)) return 'LPU ID looks invalid';
		if (!data.subject.trim()) return 'Subject is required';
		if (!data.message.trim() || data.message.trim().length < 5)
			return 'Message must be at least 5 characters';
		return null;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		const v = validate(formData);
		if (v) {
			setError(v);
			return toast.error(v);
		}

		// Normalize phone for sending to server (server expects 10-digit number)
		const normalizedPhone = normalizePhone(formData.phone);
		if (!normalizedPhone) {
			const msg = 'Invalid phone number after normalization';
			setError(msg);
			return toast.error(msg);
		}

		const payload = {
			...formData,
			phone: Number(normalizedPhone),
			lpuID: String(formData.lpuID).trim(),
		};

		setLoading(true);
		try {
			await sendContactMessage(payload);
			setSuccess(true);
			toast.success('Message sent — thank you!');
			setFormData({ name: '', email: '', phone: '', lpuID: '', subject: '', message: '' });
			setTimeout(() => setSuccess(false), 3500);
		} catch (err) {
			const msg = err?.message || 'Failed to send message';
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen section-padding">
			<div className="max-w-5xl mx-auto">
				<div className={panelCls}>
					<div className="grid md:grid-cols-5 gap-6">
						<aside className="md:col-span-2 flex flex-col gap-6">
							<div className="flex items-start gap-4">
								<div
									className="w-14 h-14 rounded-2xl flex items-center justify-center"
									style={{
										background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
									}}
								>
									<Mail className="w-7 h-7 text-white" />
								</div>
								<div>
									<h1 className="text-2xl font-bold">Contact Us</h1>
									<p className="mt-1 text-sm text-slate-300">
										Questions, feedback or partnership enquiries — send us a
										message and we'll reply shortly.
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-start gap-3">
									<div
										className="w-12 h-12 rounded-lg flex items-center justify-center"
										style={{ background: 'rgba(255,255,255,0.04)' }}
									>
										<Phone className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-semibold">Phone</h4>
										<p className="text-sm text-slate-300">+91 97710 72294</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div
										className="w-12 h-12 rounded-lg flex items-center justify-center"
										style={{ background: 'rgba(255,255,255,0.04)' }}
									>
										<AtSign className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-semibold">Email</h4>
										<p className="text-sm text-slate-300">
											vibranta.helpdesk@gmail.com
										</p>
									</div>
								</div>
							</div>
						</aside>

						<main className="md:col-span-3">
							<AnimatePresence>
								{success && (
									<motion.div
										initial={{ opacity: 0, y: -8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										className="mb-4 p-3 rounded-lg flex items-center gap-3"
										style={{ background: 'rgba(16,185,129,0.08)' }}
									>
										<CheckCircle2 className="text-green-400 w-5 h-5" />
										<div className="text-sm text-green-400">
											Thanks — your message was sent successfully.
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{error && (
								<div
									role="alert"
									className="mb-4 p-3 rounded-lg"
									style={{
										background: 'rgba(239,68,68,0.06)',
										color: 'var(--text-danger)',
									}}
								>
									{error}
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<label className="flex flex-col">
										<span className="text-sm mb-2">Full name</span>
										<input
											name="name"
											value={formData.name}
											onChange={handleChange}
											required
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:outline-none"
											placeholder="John Doe"
										/>
									</label>

									<label className="flex flex-col">
										<span className="text-sm mb-2">LPU ID</span>
										<input
											name="lpuID"
											value={formData.lpuID}
											onChange={handleChange}
											required
											pattern="\d{4,12}"
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:outline-none"
											placeholder="12345678"
										/>
									</label>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<label className="flex flex-col">
										<span className="text-sm mb-2">Email</span>
										<input
											name="email"
											type="email"
											value={formData.email}
											onChange={handleChange}
											required
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:outline-none"
											placeholder="you@example.com"
										/>
									</label>

									<label className="flex flex-col">
										<span className="text-sm mb-2">Phone</span>
										<input
											name="phone"
											value={formData.phone}
											onChange={handleChange}
											required
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:outline-none"
											placeholder="+91 98765 43210 or 09876543210"
										/>
									</label>
								</div>

								<label className="flex flex-col">
									<span className="text-sm mb-2">Subject</span>
									<input
										name="subject"
										value={formData.subject}
										onChange={handleChange}
										required
										className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:outline-none"
										placeholder="How can we help?"
									/>
								</label>

								<label className="flex flex-col">
									<span className="text-sm mb-2">Message</span>
									<textarea
										name="message"
										value={formData.message}
										onChange={handleChange}
										required
										rows={6}
										className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:outline-none resize-none"
										placeholder="Tell us more..."
									/>
								</label>

								<button
									type="submit"
									disabled={loading}
									className="w-full inline-flex items-center justify-center gap-3 py-3 rounded-lg font-semibold"
									style={{
										background: 'linear-gradient(90deg,#06b6d4,#3b82f6)',
										color: '#fff',
									}}
								>
									{loading ? (
										<svg
											className="animate-spin h-5 w-5"
											viewBox="0 0 24 24"
											aria-hidden
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
												fill="none"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
											/>
										</svg>
									) : (
										<Send className="w-4 h-4" />
									)}
									<span>{loading ? 'Sending...' : 'Send Message'}</span>
								</button>
							</form>
						</main>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;
