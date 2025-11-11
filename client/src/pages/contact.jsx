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
	const [serverError, setServerError] = useState('');
	const [fieldError, setFieldError] = useState(null);

	const panelCls = isDark
		? 'rounded-3xl p-8 md:p-10 backdrop-blur-md bg-gradient-to-br from-slate-900/60 to-slate-800/50 border border-white/6 text-white shadow-2xl'
		: 'rounded-3xl p-8 md:p-10 backdrop-blur-md bg-gradient-to-br from-white/80 to-slate-50/80 border border-slate-200/40 text-slate-900 shadow-lg';

	const accentGradient = 'bg-[linear-gradient(90deg,#06b6d4,#3b82f6)]';

	const handleChange = (e) => {
		setFieldError(null);
		const { name, value } = e.target;
		setFormData((s) => ({ ...s, [name]: value }));
	};

	// Robust phone normalization: strip non-digits, drop leading 0s or country code, return last 10 digits
	const normalizePhone = (raw) => {
		if (!raw) return null;
		const digits = String(raw).replace(/\D/g, '');
		if (!digits) return null;
		let d = digits.replace(/^0+/, '');
		if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
		if (d.length >= 10) return d.slice(-10);
		return null;
	};

	const validate = (data) => {
		if (!data.name.trim()) return { field: 'name', msg: 'Please enter your full name.' };
		if (!data.email.trim()) return { field: 'email', msg: 'Please enter your email.' };
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
			return { field: 'email', msg: 'Enter a valid email address.' };
		if (!data.phone.trim()) return { field: 'phone', msg: 'Please enter your phone number.' };
		const normalized = normalizePhone(data.phone);
		if (!normalized)
			return {
				field: 'phone',
				msg: 'Enter a valid 10-digit mobile number (country code/leading zeros supported).',
			};
		if (!data.lpuID.trim()) return { field: 'lpuID', msg: 'LPU ID is required.' };
		if (!/^\d{4,12}$/.test(data.lpuID))
			return { field: 'lpuID', msg: 'LPU ID must be 4–12 digits.' };
		if (!data.subject.trim()) return { field: 'subject', msg: 'Please add a subject.' };
		if (!data.message.trim() || data.message.trim().length < 5)
			return { field: 'message', msg: 'Message must be at least 5 characters.' };
		return null;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setServerError('');
		const v = validate(formData);
		if (v) {
			setFieldError(v);
			return toast.error(v.msg);
		}

		const normalizedPhone = normalizePhone(formData.phone);
		if (!normalizedPhone) {
			const msg = 'Invalid phone number';
			setServerError(msg);
			return toast.error(msg);
		}

		const payload = {
			name: formData.name.trim(),
			email: formData.email.trim(),
			phone: normalizedPhone,
			lpuID: String(formData.lpuID).trim(),
			subject: formData.subject.trim(),
			message: formData.message.trim(),
		};

		setLoading(true);
		try {
			await sendContactMessage(payload);
			setSuccess(true);
			toast.success('Message sent — thank you!');
			setFormData({ name: '', email: '', phone: '', lpuID: '', subject: '', message: '' });
			setTimeout(() => setSuccess(false), 3500);
		} catch (err) {
			console.error('contact submit', err);
			const msg = err?.response?.data?.message || err?.message || 'Failed to send message';
			setServerError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen section-padding">
			<div className="max-w-6xl mx-auto">
				<div className={panelCls}>
					<div className="grid md:grid-cols-5 gap-6 items-start">
						<aside className="md:col-span-2 flex flex-col gap-6">
							<div className="flex items-start gap-4">
								<div
									className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl"
									style={{
										background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
									}}
								>
									<Mail className="w-8 h-8 text-white" />
								</div>
								<div>
									<h1 className="text-3xl font-extrabold leading-tight">
										Get in touch
									</h1>
									<p className="mt-2 text-sm text-slate-400">
										We’re here to help — send a message and our team will
										respond within 48–72 hours.
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-start gap-3">
									<div
										className="w-12 h-12 rounded-lg flex items-center justify-center"
										style={{
											background: isDark
												? 'rgba(255,255,255,0.03)'
												: 'rgba(2,6,23,0.03)',
										}}
									>
										<Phone className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-semibold">Phone</h4>
										<p className="text-sm text-slate-400">
											+91 93349 86732 (Mon–Fri, 9am–6pm)
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div
										className="w-12 h-12 rounded-lg flex items-center justify-center"
										style={{
											background: isDark
												? 'rgba(255,255,255,0.03)'
												: 'rgba(2,6,23,0.03)',
										}}
									>
										<AtSign className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-semibold">Email</h4>
										<p className="text-sm text-slate-400">
											syntax.studorg@gmail.com
										</p>
									</div>
								</div>

								<div className="mt-4 text-xs text-slate-400">
									<strong>Privacy</strong> — we only use your details to respond
									to your enquiry. By sending a message you agree to our{' '}
									<a className="underline" href="/policies/privacy">
										privacy policy
									</a>
									.
								</div>
							</div>
						</aside>

						<main className="md:col-span-3">
							<AnimatePresence>
								{success && (
									<motion.div
										initial={{ opacity: 0, y: -6 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										className="mb-4 p-3 rounded-lg flex items-center gap-3"
										style={{ background: 'rgba(12,185,122,0.07)' }}
									>
										<CheckCircle2 className="text-emerald-400 w-5 h-5" />
										<div className="text-sm font-medium text-emerald-400">
											Thanks — your message was sent successfully. We'll reply
											within 48–72 hours.
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{serverError && (
								<div
									role="alert"
									className="mb-4 p-3 rounded-lg"
									style={{
										background: 'rgba(239,68,68,0.06)',
										color: 'var(--text-danger)',
									}}
								>
									{serverError}
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-4" noValidate>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<label className="flex flex-col">
										<span className="text-sm mb-2">Full name</span>
										<input
											name="name"
											value={formData.name}
											onChange={handleChange}
											required
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:ring-2 focus:ring-cyan-400 outline-none"
											placeholder="John Doe"
											aria-invalid={fieldError?.field === 'name'}
										/>
										{fieldError?.field === 'name' && (
											<div className="text-rose-400 text-xs mt-1">
												{fieldError.msg}
											</div>
										)}
									</label>

									<label className="flex flex-col">
										<span className="text-sm mb-2">LPU ID</span>
										<input
											name="lpuID"
											value={formData.lpuID}
											onChange={handleChange}
											required
											pattern="\d{4,12}"
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:ring-2 focus:ring-cyan-400 outline-none"
											placeholder="12345678"
											aria-invalid={fieldError?.field === 'lpuID'}
										/>
										{fieldError?.field === 'lpuID' && (
											<div className="text-rose-400 text-xs mt-1">
												{fieldError.msg}
											</div>
										)}
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
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:ring-2 focus:ring-cyan-400 outline-none"
											placeholder="you@example.com"
											aria-invalid={fieldError?.field === 'email'}
										/>
										{fieldError?.field === 'email' && (
											<div className="text-rose-400 text-xs mt-1">
												{fieldError.msg}
											</div>
										)}
									</label>

									<label className="flex flex-col">
										<span className="text-sm mb-2">Phone</span>
										<input
											name="phone"
											value={formData.phone}
											onChange={handleChange}
											required
											className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:ring-2 focus:ring-cyan-400 outline-none"
											placeholder="+91 93349 86732 or 09334986732"
											aria-invalid={fieldError?.field === 'phone'}
										/>
										{fieldError?.field === 'phone' && (
											<div className="text-rose-400 text-xs mt-1">
												{fieldError.msg}
											</div>
										)}
										{formData.phone.trim().length > 0 &&
											normalizePhone(formData.phone) && (
												<div className="text-xs text-slate-400 mt-1">
													Will be submitted as:{' '}
													<span className="font-mono">
														{normalizePhone(formData.phone)}
													</span>
												</div>
											)}
									</label>
								</div>

								<label className="flex flex-col">
									<span className="text-sm mb-2">Subject</span>
									<input
										name="subject"
										value={formData.subject}
										onChange={handleChange}
										required
										className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:ring-2 focus:ring-cyan-400 outline-none"
										placeholder="How can we help?"
										aria-invalid={fieldError?.field === 'subject'}
									/>
									{fieldError?.field === 'subject' && (
										<div className="text-rose-400 text-xs mt-1">
											{fieldError.msg}
										</div>
									)}
								</label>

								<label className="flex flex-col">
									<span className="text-sm mb-2">Message</span>
									<textarea
										name="message"
										value={formData.message}
										onChange={handleChange}
										required
										rows={6}
										className="px-4 py-3 rounded-lg bg-transparent border border-white/10 focus:ring-2 focus:ring-cyan-400 outline-none resize-none"
										placeholder="Tell us more..."
										aria-invalid={fieldError?.field === 'message'}
									/>
									{fieldError?.field === 'message' && (
										<div className="text-rose-400 text-xs mt-1">
											{fieldError.msg}
										</div>
									)}
								</label>

								<div className="flex items-center gap-4">
									<button
										type="submit"
										disabled={loading}
										className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white shadow ${accentGradient}`}
										aria-disabled={loading}
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

									<div className="text-sm text-slate-400">
										<div>
											Typical response time:{' '}
											<span className="font-medium text-slate-200">
												48–72 hours
											</span>
										</div>
									</div>
								</div>
							</form>
						</main>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;
