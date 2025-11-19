import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight, XCircle } from 'lucide-react';
import './login.css'; // new stylesheet for improved theme & responsiveness

// Reusable, lightweight form components
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
	<div className="input-wrap">
		{icon && <div className="input-icon">{icon}</div>}
		<input
			aria-label={ariaLabel || name}
			type={type}
			name={name}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			className={`input-field ${error ? 'input-error' : ''}`}
		/>
		{error && (
			<p className="input-error-text" role="alert">
				<XCircle size={14} /> {error}
			</p>
		)}
	</div>
);

const GradientButton = ({ children, isLoading, ...props }) => (
	<button
		type="submit"
		className={`btn-primary ${isLoading ? 'loading' : ''}`}
		disabled={isLoading}
		{...props}
	>
		{isLoading ? (
			<>
				<span className="spinner" aria-hidden />
				<span className="sr-only">Authenticating…</span>
			</>
		) : (
			<>
				<span>{children}</span>
				<ArrowRight size={18} />
			</>
		)}
	</button>
);

const LoginPage = () => {
	const navigate = useNavigate();
	const { loginMember } = useAuth();
	const [loginData, setLoginData] = useState({
		identifier: '',
		password: '',
	});
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
		<div className="auth-page">
			<div className="auth-shell">
				<aside className="auth-brand">
					<div className="logo" aria-hidden>
						SC
					</div>
					<div className="brand-text">
						<h1>Welcome Back</h1>
						<p className="muted">Sign in to access the admin dashboard</p>
					</div>
				</aside>

				<main className="auth-card" role="main" aria-labelledby="login-heading">
					<header className="card-header">
						<h2 id="login-heading" className="card-title">
							Log in to your account
						</h2>
						<p className="card-sub">Enter credentials to continue</p>
					</header>

					{serverError && (
						<div className="server-error" role="status">
							<XCircle size={18} />
							<span>{serverError}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="form-stack" noValidate>
						<InputField
							icon={<User size={18} />}
							type="text"
							name="identifier"
							placeholder="LPU ID or Email"
							value={loginData.identifier}
							onChange={handleChange}
							error={errors.identifier}
						/>

						<div className="input-wrap">
							<div className="input-icon">
								<Lock size={18} />
							</div>
							<input
								aria-label="password"
								type={showPassword ? 'text' : 'password'}
								name="password"
								placeholder="Password"
								value={loginData.password}
								onChange={handleChange}
								className={`input-field ${errors.password ? 'input-error' : ''}`}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="password-toggle"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
							{errors.password && (
								<p className="input-error-text" role="alert">
									<XCircle size={14} /> {errors.password}
								</p>
							)}
						</div>

						<div className="form-actions">
							<button
								type="button"
								className="link-muted"
								onClick={() => navigate('/forgot')}
							>
								Forgot Password?
							</button>

							<GradientButton isLoading={loading}>Login</GradientButton>
						</div>
					</form>

					<footer className="auth-footer">
						Don't have an account?{' '}
						<button onClick={() => navigate('/join')} className="link-cta">
							Join the Club
						</button>
					</footer>
				</main>
			</div>
		</div>
	);
};

export default LoginPage;
