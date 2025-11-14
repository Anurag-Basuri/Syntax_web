import React, { useState, useEffect, useRef } from 'react';
import { submitApplication } from '../../services/applyServices.js';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, BookOpen, Users, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

/* --- Enhanced presentational components --- */
const InputField = ({
	icon,
	type = 'text',
	name,
	placeholder,
	value,
	onChange,
	error,
	ariaLabel,
}) => (
	<div className="relative w-full group">
		{icon && (
			<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-purple-400 transition-colors">
				{icon}
			</div>
		)}
		<input
			aria-label={ariaLabel || name}
			type={type}
			name={name}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			className={`w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 ${
				error ? 'border-red-500/50 focus:ring-red-500/50' : ''
			}`}
		/>
		{error && (
			<p className="mt-2 text-sm text-red-400 flex items-center gap-1" role="alert">
				<XCircle size={14} /> {error}
			</p>
		)}
	</div>
);

const TextAreaField = ({ name, placeholder, value, onChange, error, maxLength, remaining }) => (
	<div className="w-full group">
		<textarea
			aria-label={name}
			name={name}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			maxLength={maxLength}
			rows={5}
			className={`w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-y transition-all duration-200 ${
				error ? 'border-red-500/50 focus:ring-red-500/50' : ''
			}`}
		/>
		<div className="flex justify-between items-center mt-2">
			{error && (
				<p className="text-sm text-red-400 flex items-center gap-1" role="alert">
					<XCircle size={14} /> {error}
				</p>
			)}
			{remaining !== undefined && (
				<p className={`text-xs ${remaining < 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
					{remaining} characters left
				</p>
			)}
		</div>
	</div>
);

const GradientButton = ({ children, isLoading, ...props }) => (
	<button
		type="submit"
		className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 ${
			isLoading ? 'opacity-75 cursor-not-allowed' : ''
		}`}
		disabled={isLoading}
		{...props}
	>
		{isLoading ? (
			<>
				<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
					<circle
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="3"
						className="opacity-25"
					/>
					<path
						d="M4 12a8 8 0 018-8"
						stroke="currentColor"
						strokeWidth="3"
						className="opacity-75"
					/>
				</svg>
				<span>Submitting...</span>
			</>
		) : (
			<>
				{children}
				<ArrowRight size={18} />
			</>
		)}
	</button>
);

const StepIndicator = ({ step, totalSteps, title }) => (
	<div className="flex items-center gap-3 mb-4">
		<div
			className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
				step <= totalSteps
					? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
					: 'bg-white/10 text-gray-400'
			}`}
		>
			{step}
		</div>
		<h3 className="text-lg font-semibold text-white">{title}</h3>
	</div>
);

/* --- Domain options (expanded) --- */
const DOMAIN_OPTIONS = [
	{ key: 'development', label: 'Development' },
	{ key: 'design', label: 'Design' },
	{ key: 'marketing', label: 'Marketing' },
	{ key: 'content', label: 'Content' },
	{ key: 'events', label: 'Events' },
	{ key: 'ai', label: 'AI/ML' },
	{ key: 'devops', label: 'DevOps' },
	{ key: 'uiux', label: 'UI/UX' },
	{ key: 'graphics', label: 'Graphics' },
	{ key: 'qa', label: 'Quality Assurance' },
];

const JoinPage = () => {
	const navigate = useNavigate();
	const hostelRef = useRef(null);
	const [formData, setFormData] = useState({
		fullName: '',
		LpuId: '',
		email: '',
		phone: '',
		course: '',
		gender: '',
		domains: [],
		accommodation: '',
		hostelName: '',
		previousExperience: false,
		anyotherorg: false,
		bio: '',
	});
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
	const [successCountdown, setSuccessCountdown] = useState(0);

	useEffect(() => {
		let t;
		if (successCountdown > 0) {
			t = setTimeout(() => setSuccessCountdown((c) => c - 1), 1000);
		} else if (successCountdown === 0 && serverMessage.type === 'success') {
			navigate('/login');
		}
		return () => clearTimeout(t);
	}, [successCountdown, serverMessage, navigate]);

	useEffect(() => {
		if (formData.accommodation === 'hostler' && hostelRef.current) {
			hostelRef.current.focus();
		}
	}, [formData.accommodation]);

	const BIO_MAX = 500;
	const bioRemaining = BIO_MAX - (formData.bio?.length || 0);

	const validate = () => {
		const newErrors = {};
		if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
		if (!/^\d{8}$/.test(formData.LpuId.trim()))
			newErrors.LpuId = 'LPU ID must be exactly 8 digits.';
		if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid email is required.';
		if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.';
		if (!formData.course.trim()) newErrors.course = 'Your course is required.';
		if (!formData.gender) newErrors.gender = 'Please select a gender.';
		if (!Array.isArray(formData.domains) || formData.domains.length === 0)
			newErrors.domains = 'Select at least one domain.';
		if (Array.isArray(formData.domains) && formData.domains.length > 2)
			newErrors.domains = 'You can select up to 2 domains.';
		if (!formData.accommodation) newErrors.accommodation = 'Select accommodation preference.';
		if (formData.accommodation === 'hostler' && !formData.hostelName.trim())
			newErrors.hostelName = 'Hostel name required for hostlers.';
		if (!formData.bio.trim()) newErrors.bio = 'A short bio is required.';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const parseServerError = (err) => {
		const resp = err?.response?.data;
		if (!resp) return err?.message || 'Unknown error';
		if (Array.isArray(resp.details) && resp.details.length) {
			return [resp.message, ...resp.details].join(' — ');
		}
		return resp.message || JSON.stringify(resp) || err.message || 'Request failed';
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;

		if (type === 'checkbox' && (name === 'previousExperience' || name === 'anyotherorg')) {
			setFormData((prev) => ({ ...prev, [name]: checked }));
			setErrors((prev) => ({ ...prev, [name]: '' }));
			return;
		}

		if (type === 'checkbox' && name === 'domains') {
			setFormData((prev) => {
				const next = new Set(prev.domains || []);
				if (checked) {
					if (next.size >= 2) {
						setErrors((prevErr) => ({
							...prevErr,
							domains: 'You can select up to 2 domains only.',
						}));
						return prev;
					}
					next.add(value);
				} else {
					next.delete(value);
				}
				setErrors((prevErr) => ({
					...prevErr,
					domains: next.size <= 2 ? '' : prevErr.domains,
				}));
				return { ...prev, domains: Array.from(next) };
			});
			return;
		}

		if (name === 'LpuId') {
			const digits = value.replace(/\D/g, '').slice(0, 8);
			setFormData((prev) => ({ ...prev, LpuId: digits }));
			if (errors.LpuId) setErrors((prev) => ({ ...prev, LpuId: '' }));
			return;
		}

		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
		if (serverMessage.text) setServerMessage({ type: '', text: '' });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		setLoading(true);
		setServerMessage({ type: '', text: '' });

		const payload = {
			fullName: formData.fullName.trim(),
			LpuId: formData.LpuId.trim(),
			email: formData.email.trim(),
			phone: formData.phone.trim(),
			course: formData.course.trim(),
			gender: formData.gender,
			domains: formData.domains,
			accommodation: formData.accommodation,
			hostelName: formData.hostelName?.trim() || '',
			previousExperience: !!formData.previousExperience,
			anyotherorg: !!formData.anyotherorg,
			bio: formData.bio.trim(),
		};

		try {
			await submitApplication(payload);
			setServerMessage({
				type: 'success',
				text: 'Application submitted — redirecting to login in 3s.',
			});
			setSuccessCountdown(3);
			setFormData({
				fullName: '',
				LpuId: '',
				email: '',
				phone: '',
				course: '',
				gender: '',
				domains: [],
				accommodation: '',
				hostelName: '',
				previousExperience: false,
				anyotherorg: false,
				bio: '',
			});
			setErrors({});
		} catch (err) {
			setServerMessage({ type: 'error', text: parseServerError(err) });
		} finally {
			setLoading(false);
		}
	};

	const domainsSelectedCount = formData.domains.length;
	const disableMoreDomains = domainsSelectedCount >= 2;

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0a0e17] via-[#0f172a] to-[#1e1b4b] flex justify-center p-4">
			<div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 mt-8">
				<header className="text-center mb-8">
					<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
						Become a Syntax Builder
					</h1>
					<p className="mt-3 text-gray-300 text-lg">
						Join a community of creators, innovators, and developers. Select up to 2
						domains.
					</p>
				</header>

				{serverMessage.text && (
					<div
						className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
							serverMessage.type === 'success'
								? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
								: 'text-red-400 bg-red-500/10 border-red-500/20'
						}`}
						role="status"
					>
						{serverMessage.type === 'success' ? (
							<CheckCircle size={20} />
						) : (
							<XCircle size={20} />
						)}
						<span>{serverMessage.text}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-8" noValidate>
					{/* Personal */}
					<div className="space-y-4">
						<StepIndicator step={1} totalSteps={4} title="Personal Information" />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<InputField
								icon={<User size={18} />}
								name="fullName"
								placeholder="Full name"
								value={formData.fullName}
								onChange={handleChange}
								error={errors.fullName}
							/>
							<InputField
								icon={<Mail size={18} />}
								type="email"
								name="email"
								placeholder="Email address"
								value={formData.email}
								onChange={handleChange}
								error={errors.email}
							/>
						</div>
					</div>

					{/* Academic */}
					<div className="space-y-4">
						<StepIndicator step={2} totalSteps={4} title="Academic Details" />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<InputField
								icon={<User size={18} />}
								name="LpuId"
								placeholder="LPU ID (8 digits)"
								value={formData.LpuId}
								onChange={handleChange}
								error={errors.LpuId}
								ariaLabel="LPU ID"
							/>
							<InputField
								icon={<BookOpen size={18} />}
								name="course"
								placeholder="Course (e.g., B.Tech CSE)"
								value={formData.course}
								onChange={handleChange}
								error={errors.course}
							/>
							<InputField
								icon={<Phone size={18} />}
								type="tel"
								name="phone"
								placeholder="Phone number"
								value={formData.phone}
								onChange={handleChange}
								error={errors.phone}
							/>
							<div className="relative w-full">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
									<Users size={18} />
								</div>
								<select
									aria-label="gender"
									name="gender"
									value={formData.gender}
									onChange={handleChange}
									className={`w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 ${
										errors.gender
											? 'border-red-500/50 focus:ring-red-500/50'
											: ''
									}`}
								>
									<option value="" disabled>
										Select gender
									</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
								</select>
								{errors.gender && (
									<p
										className="mt-2 text-sm text-red-400 flex items-center gap-1"
										role="alert"
									>
										<XCircle size={14} /> {errors.gender}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Preferences */}
					<div className="space-y-4">
						<StepIndicator step={3} totalSteps={4} title="Preferences & Domains" />
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-3">
									Select domains{' '}
									<span className="text-xs text-gray-400">
										({domainsSelectedCount}/2)
									</span>
								</label>
								<div className="grid grid-cols-2 gap-3">
									{DOMAIN_OPTIONS.map((opt) => {
										const checked = formData.domains.includes(opt.key);
										const disabled = !checked && disableMoreDomains;
										return (
											<label
												key={opt.key}
												className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
													checked
														? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
														: disabled
														? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
														: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
												}`}
											>
												<input
													type="checkbox"
													name="domains"
													value={opt.key}
													checked={checked}
													onChange={handleChange}
													disabled={disabled}
													className="form-checkbox"
													aria-checked={checked}
												/>
												<span className="text-sm">{opt.label}</span>
											</label>
										);
									})}
								</div>
								{errors.domains && (
									<p className="mt-3 text-sm text-red-400 flex items-center gap-1">
										<XCircle size={14} /> {errors.domains}
									</p>
								)}
							</div>

							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Accommodation
									</label>
									<select
										name="accommodation"
										value={formData.accommodation}
										onChange={handleChange}
										className={`w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 ${
											errors.accommodation
												? 'border-red-500/50 focus:ring-red-500/50'
												: ''
										}`}
									>
										<option value="" disabled>
											Select accommodation
										</option>
										<option value="hostler">Hostler</option>
										<option value="non-hostler">Non-Hostler</option>
									</select>
									{errors.accommodation && (
										<p className="mt-2 text-sm text-red-400 flex items-center gap-1">
											<XCircle size={14} /> {errors.accommodation}
										</p>
									)}
								</div>

								{formData.accommodation === 'hostler' && (
									<div>
										<input
											name="hostelName"
											ref={hostelRef}
											placeholder="Hostel name"
											value={formData.hostelName}
											onChange={handleChange}
											className={`w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 ${
												errors.hostelName
													? 'border-red-500/50 focus:ring-red-500/50'
													: ''
											}`}
										/>
										{errors.hostelName && (
											<p className="mt-2 text-sm text-red-400 flex items-center gap-1">
												<XCircle size={14} /> {errors.hostelName}
											</p>
										)}
									</div>
								)}

								<div className="space-y-3">
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											name="previousExperience"
											checked={formData.previousExperience}
											onChange={handleChange}
											className="form-checkbox"
										/>
										<span className="text-sm text-gray-200">
											Previous experience
										</span>
									</label>
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											name="anyotherorg"
											checked={formData.anyotherorg}
											onChange={handleChange}
											className="form-checkbox"
										/>
										<span className="text-sm text-gray-200">
											Associated with other org
										</span>
									</label>
								</div>
							</div>
						</div>
					</div>

					{/* About */}
					<div className="space-y-4">
						<StepIndicator step={4} totalSteps={4} title="About You" />
						<TextAreaField
							name="bio"
							placeholder="A short bio about your interests and skills"
							value={formData.bio}
							onChange={(e) => {
								if (e.target.value.length > BIO_MAX) return;
								handleChange(e);
							}}
							error={errors.bio}
							maxLength={BIO_MAX}
							remaining={bioRemaining}
						/>
					</div>

					<div className="flex justify-end pt-4">
						<GradientButton isLoading={loading}>Submit Application</GradientButton>
					</div>
				</form>

				<footer className="mt-8 text-center text-sm text-gray-400">
					Already a member?{' '}
					<button
						onClick={() => navigate('/login')}
						className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
					>
						Login
					</button>
				</footer>
			</div>
		</div>
	);
};

export default JoinPage;
