import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Mail,
	Send,
	CheckCircle2,
	Phone,
	AtSign,
	Loader2,
	AlertCircle,
	X,
	RefreshCw,
	Copy,
} from 'lucide-react';
import { sendContactMessage } from '../services/contactServices.js';
import { toast } from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme.js';

/**
 * ContactPage (industry-grade)
 *
 * - Public, responsive contact page with:
 *   - Robust validation & server error mapping
 *   - Honeypot anti-spam
 *   - Submission cooldown + retry on failure
 *   - Autosave to localStorage with debounce
 *   - Accessibility: aria-live, roles, keyboard-friendly controls
 *   - Responsive layout: stacked on small screens, 2-column on larger
 *
 * Notes:
 * - The backend endpoint `/api/v1/contact/send` already validates server-side.
 * - Client-side validation is a UX convenience; do not rely on it for security.
 */

/* ----------------------
   Config
   ---------------------- */
const DRAFT_KEY = 'contact_form_draft_v1';
const AUTOSAVE_DEBOUNCE = 700; // ms
const SUBMIT_COOLDOWN = 20; // seconds
const MESSAGE_MAX = 2000;

/* ----------------------
   Helpers
   ---------------------- */

const normalizePhone = (raw) => {
	if (!raw) return null;
	const digits = String(raw).replace(/\D/g, '');
	if (!digits) return null;
	let d = digits.replace(/^0+/, '');
	if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
	if (d.length >= 10) return d.slice(-10);
	return null;
};

const defaultForm = {
	name: '',
	email: '',
	phone: '',
	subject: '',
	message: '',
	website: '', // honeypot (must be empty)
};

const validators = {
	name: (v) => (v.trim() ? null : 'Please enter your full name.'),
	email: (v) =>
		!v.trim()
			? 'Please enter your email.'
			: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
			? null
			: 'Enter a valid email address.',
	phone: (v) =>
		!v.trim()
			? 'Please enter your phone number.'
			: normalizePhone(v)
			? null
			: 'Enter a valid 10-digit mobile number.',
	subject: (v) => (v.trim() ? null : 'Please add a short subject.'),
	message: (v) =>
		!v.trim()
			? 'Please enter a message.'
			: v.trim().length < 10
			? 'Message must be at least 10 characters.'
			: v.trim().length > MESSAGE_MAX
			? `Message must be ${MESSAGE_MAX} characters or fewer.`
			: null,
	website: (v) => (v ? 'Bot detected' : null),
};

const validateField = (name, value) => (validators[name] ? validators[name](value) : null);
const validateAll = (form) => {
	const errs = {};
	Object.keys(validators).forEach((k) => {
		const e = validateField(k, form[k]);
		if (e) errs[k] = e;
	});
	return Object.keys(errs).length ? errs : null;
};

/* ----------------------
   Component
   ---------------------- */

const ContactPage = () => {
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const [form, setForm] = useState(() => {
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			return raw ? { ...defaultForm, ...JSON.parse(raw) } : { ...defaultForm };
		} catch {
			return { ...defaultForm };
		}
	});
	const [touched, setTouched] = useState({});
	const [errors, setErrors] = useState({});
	const [nonFieldError, setNonFieldError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [lastFailedPayload, setLastFailedPayload] = useState(null);
	const autosaveTimer = useRef(null);
	const cooldownTimer = useRef(null);
	const firstInputRef = useRef(null);
	const statusLiveRef = useRef(null);

	useEffect(() => {
		// focus first input for keyboard users
		firstInputRef.current?.focus();
	}, []);

	useEffect(() => {
		// cleanup timers on unmount
		return () => {
			if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
			if (cooldownTimer.current) clearInterval(cooldownTimer.current);
		};
	}, []);

	// Autosave with debounce
	useEffect(() => {
		if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
		autosaveTimer.current = setTimeout(() => {
			try {
				const toSave = { ...form };
				delete toSave.website; // don't persist honeypot
				localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
			} catch {
				// ignore storage errors
			}
		}, AUTOSAVE_DEBOUNCE);
	}, [form]);

	// Start cooldown helper
	const startCooldown = (secs = SUBMIT_COOLDOWN) => {
		setCooldown(secs);
		if (cooldownTimer.current) clearInterval(cooldownTimer.current);
		cooldownTimer.current = setInterval(() => {
			setCooldown((c) => {
				if (c <= 1) {
					clearInterval(cooldownTimer.current);
					cooldownTimer.current = null;
					return 0;
				}
				return c - 1;
			});
		}, 1000);
	};

	// Map common server error shapes to field errors
	const mapServerErrors = (payload) => {
		const fieldMap = {};
		if (!payload) return fieldMap;
		// Axios error response may be in payload.message or payload.errors
		if (Array.isArray(payload.errors)) {
			payload.errors.forEach((it) => {
				// support { field, message } shapes
				if (it.field) fieldMap[it.field] = it.message || it.msg || String(it);
			});
		} else if (payload.errors && typeof payload.errors === 'object') {
			Object.entries(payload.errors).forEach(([k, v]) => {
				fieldMap[k] = typeof v === 'string' ? v : v?.message ?? JSON.stringify(v);
			});
		} else if (payload.field && payload.message) {
			fieldMap[payload.field] = payload.message;
		}
		return fieldMap;
	};

	/* ----------------------
	   Event handlers
	   ---------------------- */

	const onChange = (e) => {
		const { name, value } = e.target;
		setForm((s) => ({ ...s, [name]: value }));
		// clear server-level error when user types
		setNonFieldError('');
		// revalidate this field if touched
		if (touched[name]) {
			const err = validateField(name, value);
			setErrors((prev) => {
				const copy = { ...prev };
				if (err) copy[name] = err;
				else delete copy[name];
				return copy;
			});
		}
	};

	const onBlur = (e) => {
		const { name, value } = e.target;
		setTouched((t) => ({ ...t, [name]: true }));
		const err = validateField(name, value);
		setErrors((prev) => {
			const copy = { ...prev };
			if (err) copy[name] = err;
			else delete copy[name];
			return copy;
		});
	};

	const onResetDraft = () => {
		setForm({ ...defaultForm });
		setErrors({});
		setTouched({});
		localStorage.removeItem(DRAFT_KEY);
		toast.success('Draft cleared');
		firstInputRef.current?.focus();
	};

	const submit = async (e) => {
		e?.preventDefault?.();
		setNonFieldError('');
		setLastFailedPayload(null);

		// honeypot check
		if (form.website) {
			setNonFieldError('Invalid submission.');
			toast.error('Invalid submission.');
			return;
		}

		// client-side validation
		const allErrors = validateAll(form);
		if (allErrors) {
			setErrors(allErrors);
			const first = Object.keys(allErrors)[0];
			document.querySelector(`[name="${first}"]`)?.focus();
			toast.error('Please fix the highlighted fields.');
			return;
		}

		// prepare payload
		const payload = {
			name: form.name.trim(),
			email: form.email.trim(),
			phone: normalizePhone(form.phone),
			subject: form.subject.trim(),
			message: form.message.trim(),
		};

		setIsSubmitting(true);
		try {
			await sendContactMessage(payload);
			// success
			setSuccess(true);
			toast.success('Message sent — thank you!');
			// clear persisted draft
			localStorage.removeItem(DRAFT_KEY);
			setForm({ ...defaultForm });
			startCooldown(SUBMIT_COOLDOWN);
			// announce to screen readers
			if (statusLiveRef.current) statusLiveRef.current.focus();
			// reset visual success after a while
			setTimeout(() => setSuccess(false), 8000);
		} catch (err) {
			// robust error handling: map potential shapes
			const resp = err?.response?.data ?? null;
			const serverMessage = resp?.message || err?.message || 'Failed to send message. Try again later.';
			const mapped = mapServerErrors(resp);
			if (Object.keys(mapped).length) {
				setErrors(mapped);
				const first = Object.keys(mapped)[0];
				document.querySelector(`[name="${first}"]`)?.focus();
				toast.error('Please fix the highlighted fields.');
			} else {
				// network or server error: surface non-field error and allow "Retry"
				setNonFieldError(serverMessage);
				setLastFailedPayload(payload);
				toast.error(serverMessage);
			}
			console.error('Contact send error', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const retryLast = async () => {
		if (!lastFailedPayload) return;
		setIsSubmitting(true);
		setNonFieldError('');
		try {
			await sendContactMessage(lastFailedPayload);
			setSuccess(true);
			toast.success('Message sent — thank you!');
			localStorage.removeItem(DRAFT_KEY);
			setForm({ ...defaultForm });
			startCooldown(SUBMIT_COOLDOWN);
			if (statusLiveRef.current) statusLiveRef.current.focus();
			setTimeout(() => setSuccess(false), 8000);
		} catch (err) {
			const serverMessage = err?.response?.data?.message || err?.message || 'Retry failed';
			setNonFieldError(serverMessage);
			toast.error(serverMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const copyFailure = async () => {
		if (!lastFailedPayload) return;
		const text = `I tried to contact you via the site but it failed. Name: ${lastFailedPayload.name}, Email: ${lastFailedPayload.email}, Subject: ${lastFailedPayload.subject}, Message: ${lastFailedPayload.message}`;
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Message copied to clipboard. You can email it to us.');
		} catch {
			toast('Unable to copy. Please manually copy the message.');
		}
	};

	/* ----------------------
	   Presentation & Layout
	   ---------------------- */

	const panelCls = isDark
		? 'rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-md bg-gradient-to-br from-slate-900/64 to-slate-800/48 border border-white/6 text-white shadow-2xl'
		: 'rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-md bg-gradient-to-br from-white/88 to-slate-50/88 border border-slate-200/40 text-slate-900 shadow-lg';

	return (
		<main id="main" className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
			<div className="max-w-6xl mx-auto">
				<section className={panelCls} aria-labelledby="contact-heading">
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
						{/* Left column: contact info */}
						<div className="lg:col-span-2">
							<div className="flex items-start gap-4">
								<div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
									<Mail className="w-7 h-7 text-white" />
								</div>
								<div className="min-w-0">
									<h1 id="contact-heading" className="text-2xl sm:text-3xl font-extrabold leading-tight">Get in touch</h1>
									<p className="mt-2 text-sm text-[var(--text-muted)]">We’re here to help — send a message and our team will respond within 48–72 hours.</p>
								</div>
							</div>

							<div className="mt-6 space-y-5">
								<div className="flex items-start gap-3">
									<div className="w-11 h-11 rounded-lg flex items-center justify-center bg-[color-mix(in srgb,var(--bg-soft) 65%,transparent)] border border-[var(--glass-border)]">
										<Phone className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-semibold">Phone</h4>
										<p className="text-sm text-[var(--text-muted)]">+91 93349 86732 (Mon–Fri, 9am–6pm)</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div className="w-11 h-11 rounded-lg flex items-center justify-center bg-[color-mix(in srgb,var(--bg-soft) 65%,transparent)] border border-[var(--glass-border)]">
										<AtSign className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-semibold">Email</h4>
										<p className="text-sm text-[var(--text-muted)]">syntax.studorg@gmail.com</p>
									</div>
								</div>

								<p className="text-xs text-[var(--text-muted)]">
									<strong>Privacy</strong> — we only use your details to respond to your enquiry. By sending a message you agree to our{' '}
									<a className="underline" href="/policies/privacy">privacy policy</a>.
								</p>

								{/* Draft controls */}
								<div className="flex gap-2 mt-2 items-center">
									<button
										type="button"
										onClick={onResetDraft}
										className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
									>
										<X className="w-4 h-4" /> Clear draft
									</button>
									<span className="text-xs text-[var(--text-muted)]">Autosave enabled</span>
								</div>
							</div>
						</div>

						{/* Right column: form */}
						<div className="lg:col-span-3">
							{/* Live region for screen reader announcements */}
							<div
								ref={statusLiveRef}
								tabIndex={-1}
								aria-live="polite"
								className="sr-only"
							/>

							<AnimatePresence>
								{success && (
									<motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-100">
										<div className="flex items-start gap-3">
											<CheckCircle2 className="text-emerald-600 w-5 h-5" />
											<div className="text-sm font-medium text-emerald-700">Thanks — your message was sent successfully. We'll reply within 48–72 hours.</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{nonFieldError && (
								<div role="alert" className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-100">
									<div className="flex items-start gap-3">
										<AlertCircle className="text-rose-600 w-5 h-5" />
										<div className="text-sm text-rose-700">{nonFieldError}</div>
									</div>
									{lastFailedPayload && (
										<div className="mt-3 flex gap-2">
											<button onClick={retryLast} disabled={isSubmitting} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--button-primary-bg)] text-white">
												{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Retry
											</button>
											<button onClick={copyFailure} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm">
												<Copy className="w-4 h-4" /> Copy message
											</button>
										</div>
									)}
								</div>
							)}

							<form onSubmit={submit} className="space-y-4" noValidate>
								{/* Honeypot (hidden) */}
								<div style={{ display: 'none' }} aria-hidden>
									<label>Website</label>
									<input name="website" value={form.website} onChange={onChange} />
								</div>

								{/* name / email */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<label className="flex flex-col">
										<span className="text-sm mb-1">Full name</span>
										<input
											ref={firstInputRef}
											name="name"
											value={form.name}
											onChange={onChange}
											onBlur={onBlur}
											disabled={isSubmitting || cooldown > 0}
											className={`px-3 py-2 rounded-md border ${errors.name ? 'border-rose-400' : 'border-[var(--glass-border)]'} bg-transparent`}
											placeholder="John Doe"
											aria-invalid={!!errors.name}
											aria-describedby={errors.name ? 'err-name' : undefined}
										/>
										{errors.name && <div id="err-name" className="text-rose-500 text-xs mt-1">{errors.name}</div>}
									</label>

									<label className="flex flex-col">
										<span className="text-sm mb-1">Email</span>
										<input
											name="email"
											type="email"
											value={form.email}
											onChange={onChange}
											onBlur={onBlur}
											disabled={isSubmitting || cooldown > 0}
											className={`px-3 py-2 rounded-md border ${errors.email ? 'border-rose-400' : 'border-[var(--glass-border)]'} bg-transparent`}
											placeholder="you@example.com"
											aria-invalid={!!errors.email}
											aria-describedby={errors.email ? 'err-email' : undefined}
										/>
										{errors.email && <div id="err-email" className="text-rose-500 text-xs mt-1">{errors.email}</div>}
									</label>
								</div>

								{/* phone / subject */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<label className="flex flex-col">
										<span className="text-sm mb-1">Phone</span>
										<input
											name="phone"
											value={form.phone}
											onChange={onChange}
											onBlur={onBlur}
											disabled={isSubmitting || cooldown > 0}
											className={`px-3 py-2 rounded-md border ${errors.phone ? 'border-rose-400' : 'border-[var(--glass-border)]'} bg-transparent`}
											placeholder="+91 93349 86732"
											aria-invalid={!!errors.phone}
											aria-describedby={errors.phone ? 'err-phone' : undefined}
										/>
										{errors.phone && <div id="err-phone" className="text-rose-500 text-xs mt-1">{errors.phone}</div>}
										{form.phone.trim().length > 0 && normalizePhone(form.phone) && (
											<div className="text-xs text-[var(--text-muted)] mt-1">Will be submitted as: <span className="font-mono">{normalizePhone(form.phone)}</span></div>
										)}
									</label>

									<label className="flex flex-col">
										<span className="text-sm mb-1">Subject</span>
										<input
											name="subject"
											value={form.subject}
											onChange={onChange}
											onBlur={onBlur}
											disabled={isSubmitting || cooldown > 0}
											className={`px-3 py-2 rounded-md border ${errors.subject ? 'border-rose-400' : 'border-[var(--glass-border)]'} bg-transparent`}
											placeholder="How can we help?"
											aria-invalid={!!errors.subject}
											aria-describedby={errors.subject ? 'err-subject' : undefined}
										/>
										{errors.subject && <div id="err-subject" className="text-rose-500 text-xs mt-1">{errors.subject}</div>}
									</label>
								</div>

								{/* message */}
								<label className="flex flex-col">
									<span className="text-sm mb-1">Message</span>
									<textarea
										name="message"
										value={form.message}
										onChange={onChange}
										onBlur={onBlur}
										rows={7}
										maxLength={MESSAGE_MAX}
										disabled={isSubmitting || cooldown > 0}
										className={`px-3 py-2 rounded-md border ${errors.message ? 'border-rose-400' : 'border-[var(--glass-border)]'} bg-transparent resize-vertical`}
										placeholder="Tell us more..."
										aria-invalid={!!errors.message}
										aria-describedby={errors.message ? 'err-message' : undefined}
									/>
									<div className="flex items-center justify-between mt-1">
										{errors.message ? <div id="err-message" className="text-rose-500 text-xs">{errors.message}</div> : <div className="text-xs text-[var(--text-muted)]">Be specific — helps us respond faster.</div>}
										<div className="text-xs text-[var(--text-muted)]">{form.message.length}/{MESSAGE_MAX}</div>
									</div>
								</label>

								{/* actions */}
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
									<div className="flex items-center gap-3">
										<button
											type="submit"
											disabled={isSubmitting || cooldown > 0}
											className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white ${isSubmitting ? 'opacity-90' : ''}`}
											style={{ background: 'linear-gradient(90deg,var(--accent-1),var(--accent-2))' }}
											aria-disabled={isSubmitting || cooldown > 0}
										>
											{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
											<span>{isSubmitting ? 'Sending...' : (cooldown > 0 ? `Try again in ${cooldown}s` : 'Send Message')}</span>
										</button>

										<button type="button" onClick={onResetDraft} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm">
											<X className="w-4 h-4" /> Clear
										</button>
									</div>

									<div className="text-sm text-[var(--text-muted)]">
										<div>Typical response time: <span className="font-medium">48–72 hours</span></div>
										{cooldown > 0 && <div className="text-xs text-[var(--text-muted)]">Submission cooldown active</div>}
									</div>
								</div>
							</form>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
};

export default ContactPage;
