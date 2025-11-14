import React, { useState } from 'react';
import { submitApplication } from '../../services/applyServices.js';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, BookOpen, Users } from 'lucide-react';

// Reusable, lightweight form components
const InputField = ({ icon, type = 'text', name, placeholder, value, onChange, error }) => (
	<div className="relative w-full">
		{icon && (
			<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
				{icon}
			</div>
		)}
		<input
			type={type}
			name={name}
			placeholder={placeholder}
			required
			value={value}
			onChange={onChange}
			className={`auth-input ${error ? 'border-red-500/50' : ''}`}
		/>
		{error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
	</div>
);

const TextAreaField = ({ name, placeholder, value, onChange, error }) => (
	<div className="w-full">
		<textarea
			name={name}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			rows={4}
			className={`auth-input resize-none ${error ? 'border-red-500/50' : ''}`}
		/>
		{error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
	</div>
);

const GradientButton = ({ children, isLoading, ...props }) => (
	<button type="submit" className="auth-button group" disabled={isLoading} {...props}>
		<span className="auth-button-sheen" />
		{isLoading ? (
			<span className="flex items-center justify-center gap-2">
				<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/>
				</svg>
				<span>Submitting...</span>
			</span>
		) : (
			children
		)}
	</button>
);

const DOMAIN_OPTIONS = [
	{ key: 'development', label: 'Development' },
	{ key: 'design', label: 'Design' },
	{ key: 'marketing', label: 'Marketing' },
	{ key: 'content', label: 'Content' },
	{ key: 'events', label: 'Events' },
];

const JoinPage = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		fullName: '',
		LpuId: '',
		email: '',
		phone: '',
		course: '',
		gender: '',
		domains: [],
		accommodation: '',
		previousExperience: false,
		anyotherorg: false,
		bio: '',
	});
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

	const validate = () => {
		const newErrors = {};
		if (!formData.fullName) newErrors.fullName = 'Full name is required.';
		// LPU must be exactly 8 digits to match backend model
		if (!/^\d{8}$/.test(formData.LpuId))
			newErrors.LpuId = 'A valid LPU ID (8 digits) is required.';
		if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid email is required.';
		if (!formData.phone) newErrors.phone = 'Phone number is required.';
		if (!formData.course) newErrors.course = 'Your course is required.';
		if (!formData.gender) newErrors.gender = 'Please select a gender.';
		if (!Array.isArray(formData.domains) || formData.domains.length === 0)
			newErrors.domains = 'Select at least one domain.';
		// enforce max 2 domains client-side
		if (Array.isArray(formData.domains) && formData.domains.length > 2)
			newErrors.domains = 'You can select up to 2 domains';
		if (!formData.accommodation) newErrors.accommodation = 'Select accommodation preference.';
		if (!formData.bio) newErrors.bio = 'A short bio is required.';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;

		// handle boolean toggles
		if (type === 'checkbox' && (name === 'previousExperience' || name === 'anyotherorg')) {
			setFormData((prev) => ({ ...prev, [name]: checked }));
			if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
			return;
		}

		// handle domain checkboxes (limit to 2)
		if (type === 'checkbox' && name === 'domains') {
			setFormData((prev) => {
				const next = new Set(prev.domains || []);
				if (checked) {
					// prevent selecting more than 2
					if (next.size >= 2) {
						setErrors((prevErr) => ({
							...prevErr,
							domains: 'You can select up to 2 domains only',
						}));
						return prev; // no change
					}
					next.add(value);
				} else {
					next.delete(value);
				}
				// clear domain error when within limit
				if (next.size <= 2 && errors.domains) {
					setErrors((prevErr) => ({ ...prevErr, domains: '' }));
				}
				return { ...prev, domains: Array.from(next) };
			});
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

		// Prepare payload exactly as server expects
		const payload = {
			fullName: formData.fullName.trim(),
			LpuId: formData.LpuId.trim(),
			email: formData.email.trim(),
			phone: formData.phone.trim(),
			course: formData.course.trim(),
			gender: formData.gender, // 'male' or 'female'
			domains: formData.domains,
			accommodation: formData.accommodation, // 'hostler' or 'non-hostler'
			previousExperience: !!formData.previousExperience,
			anyotherorg: !!formData.anyotherorg,
			bio: formData.bio.trim(),
		};

		try {
			// Use client service which matches backend route and error shapes
			await submitApplication(payload);
			setServerMessage({
				type: 'success',
				text: 'Application submitted! Check your email for next steps.',
			});
			// reset
			setFormData({
				fullName: '',
				LpuId: '',
				email: '',
				phone: '',
				course: '',
				gender: '',
				domains: [],
				accommodation: '',
				previousExperience: false,
				anyotherorg: false,
				bio: '',
			});
			setErrors({});
		} catch (err) {
			// applyServices throws an Error with a helpful message (server or fallback)
			const message = err?.message || 'An error occurred. Please try again.';
			setServerMessage({ type: 'error', text: message });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto p-6">
			<div className="auth-card">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-primary">Become a Syntax Builder</h1>
					<p className="mt-2 text-secondary">
						Join a community of creators, innovators, and developers.
					</p>
				</div>

				{serverMessage.text && (
					<div
						className={`mt-6 text-center p-3 rounded-lg border ${
							serverMessage.type === 'success'
								? 'text-green-400 bg-green-500/10 border-green-500/20'
								: 'text-red-400 bg-red-500/10 border-red-500/20'
						}`}
					>
						{serverMessage.text}
					</div>
				)}

				<form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8" noValidate>
					{/* Step 1: Personal Info */}
					<fieldset className="auth-fieldset">
						<legend className="auth-legend">
							<span className="auth-legend-step">1</span>
							Personal Information
						</legend>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<InputField
								icon={<User size={18} />}
								name="fullName"
								placeholder="Full Name"
								value={formData.fullName}
								onChange={handleChange}
								error={errors.fullName}
							/>
							<InputField
								icon={<Mail size={18} />}
								type="email"
								name="email"
								placeholder="Email Address"
								value={formData.email}
								onChange={handleChange}
								error={errors.email}
							/>
						</div>
					</fieldset>

					{/* Step 2: Academic Info */}
					<fieldset className="auth-fieldset">
						<legend className="auth-legend">
							<span className="auth-legend-step">2</span>
							Academic Details
						</legend>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<InputField
								icon={<User size={18} />}
								name="LpuId"
								placeholder="LPU ID (7-10 digits)"
								value={formData.LpuId}
								onChange={handleChange}
								error={errors.LpuId}
							/>
							<InputField
								icon={<BookOpen size={18} />}
								name="course"
								placeholder="Your Course (e.g., B.Tech CSE)"
								value={formData.course}
								onChange={handleChange}
								error={errors.course}
							/>
							<InputField
								icon={<Phone size={18} />}
								type="tel"
								name="phone"
								placeholder="Phone Number"
								value={formData.phone}
								onChange={handleChange}
								error={errors.phone}
							/>
							<div className="relative w-full">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
									<Users size={18} />
								</div>
								<select
									name="gender"
									value={formData.gender}
									onChange={handleChange}
									className={`auth-input ${
										errors.gender ? 'border-red-500/50' : ''
									}`}
								>
									<option value="" disabled>
										Select Gender
									</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
								</select>
								{errors.gender && (
									<p className="mt-1.5 text-sm text-red-400">{errors.gender}</p>
								)}
							</div>
						</div>
					</fieldset>

					{/* Step 3: Preferences */}
					<fieldset className="auth-fieldset">
						<legend className="auth-legend">
							<span className="auth-legend-step">3</span>
							Preferences & Domains
						</legend>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Select Domains (pick one or more)
								</label>
								<div className="grid grid-cols-2 gap-2">
									{DOMAIN_OPTIONS.map((opt) => (
										<label
											key={opt.key}
											className="inline-flex items-center gap-2 cursor-pointer"
										>
											<input
												type="checkbox"
												name="domains"
												value={opt.key}
												checked={formData.domains.includes(opt.key)}
												onChange={handleChange}
												className="form-checkbox"
											/>
											<span className="text-sm text-gray-200">
												{opt.label}
											</span>
										</label>
									))}
								</div>
								{errors.domains && (
									<p className="mt-1.5 text-sm text-red-400">{errors.domains}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Accommodation
								</label>
								<select
									name="accommodation"
									value={formData.accommodation}
									onChange={handleChange}
									className={`auth-input ${
										errors.accommodation ? 'border-red-500/50' : ''
									}`}
								>
									<option value="" disabled>
										Select Accommodation
									</option>
									<option value="hostler">Hostler</option>
									<option value="non-hostler">Non-Hostler</option>
								</select>
								{errors.accommodation && (
									<p className="mt-1.5 text-sm text-red-400">
										{errors.accommodation}
									</p>
								)}

								<div className="mt-4 space-y-2">
									<label className="inline-flex items-center gap-2">
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
									<label className="inline-flex items-center gap-2">
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
					</fieldset>

					{/* Step 4: About You */}
					<fieldset className="auth-fieldset">
						<legend className="auth-legend">
							<span className="auth-legend-step">4</span>
							About You
						</legend>
						<TextAreaField
							name="bio"
							placeholder="A short bio about your interests and skills..."
							value={formData.bio}
							onChange={handleChange}
							error={errors.bio}
						/>
					</fieldset>

					<GradientButton isLoading={loading}>Submit Application</GradientButton>
				</form>

				<div className="mt-8 text-center text-sm text-secondary">
					Already a member?{' '}
					<button
						onClick={() => navigate('/login')}
						className="font-semibold text-accent-1 hover:underline"
					>
						Login
					</button>
				</div>
			</div>
		</div>
	);
};

export default JoinPage;
