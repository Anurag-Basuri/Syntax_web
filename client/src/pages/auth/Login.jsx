import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

// Reusable, lightweight form components
const InputField = ({ icon, type, name, placeholder, value, onChange, error }) => (
	<div className="relative w-full">
		<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
			{icon}
		</div>
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
				<span>Authenticating...</span>
			</span>
		) : (
			children
		)}
	</button>
);

const LoginPage = () => {
	const navigate = useNavigate();
	const { loginMember } = useAuth();
	const [loginData, setLoginData] = useState({ identifier: '', password: '' });
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const validate = () => {
		const newErrors = {};
		if (!loginData.identifier) newErrors.identifier = 'LPU ID or email is required.';
		if (!loginData.password) newErrors.password = 'Password is required.';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setLoginData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
		if (serverError) setServerError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		setLoading(true);
		setServerError('');
		try {
			await loginMember(loginData);
			navigate('/member/dashboard', { replace: true });
		} catch (err) {
			setServerError(
				err?.response?.data?.message || 'Invalid credentials. Please try again.'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card max-w-md">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-primary">Welcome Back, Builder</h1>
					<p className="mt-2 text-secondary">
						Log in to access your dashboard and projects.
					</p>
				</div>

				{serverError && (
					<div className="mt-6 text-center text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
						{serverError}
					</div>
				)}

				<form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6" noValidate>
					<InputField
						icon={<User size={18} />}
						type="text"
						name="identifier"
						placeholder="LPU ID or Email"
						value={loginData.identifier}
						onChange={handleChange}
						error={errors.identifier}
					/>
					<div>
						<div className="relative w-full">
							<InputField
								icon={<Lock size={18} />}
								type={showPassword ? 'text' : 'password'}
								name="password"
								placeholder="Password"
								value={loginData.password}
								onChange={handleChange}
								error={errors.password}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-4 top-3.5 text-muted hover:text-primary transition-colors"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
						<div className="text-right mt-2">
							<button type="button" className="auth-link">
								Forgot Password?
							</button>
						</div>
					</div>
					<GradientButton isLoading={loading}>Login</GradientButton>
				</form>

				<div className="mt-8 text-center text-sm text-secondary">
					Don't have an account?{' '}
					<button
						onClick={() => navigate('/join')}
						className="font-semibold text-accent-1 hover:underline"
					>
						Join the Club
					</button>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
