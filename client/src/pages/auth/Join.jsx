import React, { useState } from 'react';
import { publicClient } from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, BookOpen, Users, Info } from 'lucide-react';

// Reusable, lightweight form components
const InputField = ({ icon, type, name, placeholder, value, onChange, error }) => (
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

const JoinPage = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		fullName: '',
		LpuId: '',
		email: '',
		phone: '',
		course: '',
		gender: '',
		bio: '',
	});
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

	const validate = () => {
		const newErrors = {};
		if (!formData.fullName) newErrors.fullName = 'Full name is required.';
		if (!/^\d{8}$/.test(formData.LpuId))
			newErrors.LpuId = 'A valid 8-digit LPU ID is required.';
		if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid email is required.';
		if (!formData.phone) newErrors.phone = 'Phone number is required.';
		if (!formData.course) newErrors.course = 'Your course is required.';
		if (!formData.gender) newErrors.gender = 'Please select a gender.';
		if (!formData.bio) newErrors.bio = 'A short bio is required.';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
		if (serverMessage.text) setServerMessage({ type: '', text: '' });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		setLoading(true);
		setServerMessage({ type: '', text: '' });
		try {
			await publicClient.post('/api/apply/apply', formData);
			setServerMessage({
				type: 'success',
				text: 'Application submitted! Check your email for next steps.',
			});
			setFormData({
				fullName: '',
				LpuId: '',
				email: '',
				phone: '',
				course: '',
				gender: '',
				bio: '',
			});
		} catch (err) {
			setServerMessage({
				type: 'error',
				text: err?.response?.data?.message || 'An error occurred. Please try again.',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
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

				<form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-10" noValidate>
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
								placeholder="LPU ID (e.g., 12345678)"
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
									<option value="other">Other</option>
								</select>
								{errors.gender && (
									<p className="mt-1.5 text-sm text-red-400">{errors.gender}</p>
								)}
							</div>
						</div>
					</fieldset>

					{/* Step 3: About You */}
					<fieldset className="auth-fieldset">
						<legend className="auth-legend">
							<span className="auth-legend-step">3</span>
							About You
						</legend>
						<InputField
							icon={<Info size={18} />}
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
