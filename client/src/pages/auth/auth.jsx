import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { publicClient } from '../../services/api.js';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo.png';

/* Lightweight form controls (no heavy animations) */
const InputField = ({
	icon,
	type = 'text',
	name,
	placeholder,
	value,
	onChange,
	required = true,
	error = '',
	className = '',
	...props
}) => (
	<div className={`mb-4 relative ${className}`}>
		{icon && (
			<div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 z-10">
				{icon}
			</div>
		)}
		<input
			type={type}
			name={name}
			placeholder={placeholder}
			required={required}
			value={value}
			onChange={onChange}
			className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
				error ? 'border-red-500' : 'border-blue-500/20'
			} bg-transparent text-current font-poppins text-base transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
			{...props}
		/>
		{error && <p className="mt-1 text-sm text-red-400 pl-2">{error}</p>}
	</div>
);

const GradientButton = ({ children, isLoading, type = 'button', className = '', ...props }) => (
	<button
		type={type}
		className={`w-full py-3 rounded-xl text-white font-poppins text-lg font-semibold cursor-pointer relative overflow-hidden ${className}`}
		disabled={isLoading}
		{...props}
	>
		{isLoading ? (
			<span className="flex items-center justify-center gap-3">
				<svg
					className="animate-spin h-5 w-5 text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
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
				<span>{children}</span>
			</span>
		) : (
			children
		)}
	</button>
);

/* Login form (separate, lean) */
const LoginForm = ({
	loginData,
	handleLoginChange,
	handleLoginSubmit,
	loginLoading,
	loginError,
	showPassword,
	setShowPassword,
	errors = {},
}) => (
	<form className="flex flex-col gap-4" onSubmit={handleLoginSubmit} noValidate>
		<h2 className="text-2xl font-bold text-primary text-center">Welcome Back</h2>

		{loginError && (
			<div className="text-red-400 text-center font-medium py-2 px-4 rounded-lg bg-red-900/10 border border-red-700/20">
				{loginError}
			</div>
		)}

		<InputField
			icon={
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M10 9a3 3 0 100-6 3 3 0 000 6z" />
					<path d="M2 17a8 8 0 1116 0H2z" />
				</svg>
			}
			name="identifier"
			placeholder="LPU ID or email"
			value={loginData.identifier}
			onChange={handleLoginChange}
			error={errors.identifier}
		/>

		<div className="mb-4 relative">
			<div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 z-10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
					<path d="M7 9v-2a3 3 0 016 0v2" />
				</svg>
			</div>
			<input
				type={showPassword ? 'text' : 'password'}
				name="password"
				placeholder="Password"
				required
				value={loginData.password}
				onChange={handleLoginChange}
				className={`w-full pl-12 pr-12 py-3 rounded-xl border ${
					errors.password ? 'border-red-500' : 'border-blue-500/20'
				} bg-transparent text-current`}
			/>
			<button
				type="button"
				className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300"
				onClick={() => setShowPassword((v) => !v)}
			>
				{showPassword ? 'Hide' : 'Show'}
			</button>
			{errors.password && <p className="mt-1 text-sm text-red-400 pl-2">{errors.password}</p>}
		</div>

		<GradientButton
			isLoading={loginLoading}
			type="submit"
			className="bg-gradient-to-r from-blue-600 to-cyan-500"
		>
			{loginLoading ? 'Authenticating...' : 'Login'}
		</GradientButton>
	</form>
);

/* Register form (separate, lean). Keeps validation & submit handlers from original file */
const RegisterForm = ({
	registerData,
	handleRegisterChange,
	handleRegisterSubmit,
	registerLoading,
	registerError,
	registerSuccess,
	errors = {},
}) => (
	<form className="flex flex-col gap-4" onSubmit={handleRegisterSubmit} noValidate>
		<h2 className="text-2xl font-bold text-primary text-center">Join the Club</h2>

		{registerError && (
			<div className="text-red-400 text-center font-medium py-2 px-4 rounded-lg bg-red-900/10 border border-red-700/20">
				{registerError}
			</div>
		)}
		{registerSuccess && (
			<div className="text-green-400 text-center font-medium py-2 px-4 rounded-lg bg-green-900/10 border border-green-700/20">
				{registerSuccess}
			</div>
		)}

		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<InputField
				name="fullName"
				placeholder="Full name"
				value={registerData.fullName}
				onChange={handleRegisterChange}
				error={errors.fullName}
			/>
			<InputField
				name="LpuId"
				placeholder="LPU ID (8 digits)"
				value={registerData.LpuId}
				onChange={handleRegisterChange}
				error={errors.LpuId}
			/>
			<InputField
				type="email"
				name="email"
				placeholder="Email"
				value={registerData.email}
				onChange={handleRegisterChange}
				error={errors.email}
			/>
			<InputField
				name="phone"
				placeholder="Phone"
				value={registerData.phone}
				onChange={handleRegisterChange}
				error={errors.phone}
			/>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<InputField
				name="course"
				placeholder="Course"
				value={registerData.course}
				onChange={handleRegisterChange}
				error={errors.course}
			/>
			<select
				name="gender"
				value={registerData.gender}
				onChange={handleRegisterChange}
				className={`w-full pl-4 pr-4 py-3 rounded-xl border ${
					errors.gender ? 'border-red-500' : 'border-blue-500/20'
				} bg-transparent`}
			>
				<option value="">Gender</option>
				<option value="male">Male</option>
				<option value="female">Female</option>
				<option value="other">Other</option>
			</select>
		</div>

		<InputField
			name="bio"
			placeholder="Short bio (max 200 chars)"
			value={registerData.bio}
			onChange={handleRegisterChange}
			error={errors.bio}
		/>

		<GradientButton
			isLoading={registerLoading}
			type="submit"
			className="bg-gradient-to-r from-green-500 to-teal-400"
		>
			{registerLoading ? 'Registering...' : 'Register Now'}
		</GradientButton>
	</form>
);

const AuthPage = () => {
	// route-based tab selection: /auth/register -> register form; otherwise login
	const location = useLocation();
	const navigate = useNavigate();
	const isRegisterPath = location.pathname.includes('/register');
	const [showPassword, setShowPassword] = useState(false);

	/* shared state and handlers (kept from original) */
	const [loginData, setLoginData] = useState({ identifier: '', password: '' });
	const [loginLoading, setLoginLoading] = useState(false);
	const [loginError, setLoginError] = useState('');
	const { loginMember } = useAuth();

	const initialRegisterState = {
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
	};
	const [registerData, setRegisterData] = useState(initialRegisterState);
	const [registerLoading, setRegisterLoading] = useState(false);
	const [registerError, setRegisterError] = useState('');
	const [registerSuccess, setRegisterSuccess] = useState('');
	const [errors, setErrors] = useState({ login: {}, register: {} });

	useEffect(() => {
		// simple redirect helpers: if user landed on /auth show login by default
		if (location.pathname === '/auth') navigate('/auth/login', { replace: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const validateLogin = () => {
		const newErrors = {};
		if (!loginData.identifier.trim()) newErrors.identifier = 'LPU ID or email is required';
		if (!loginData.password) newErrors.password = 'Password is required';
		else if (loginData.password.length < 6)
			newErrors.password = 'Password must be at least 6 characters';
		setErrors((prev) => ({ ...prev, login: newErrors }));
		return Object.keys(newErrors).length === 0;
	};

	const validateRegister = () => {
		const newErrors = {};
		if (!registerData.fullName.trim()) newErrors.fullName = 'Full name is required';
		if (!registerData.LpuId.trim()) newErrors.LpuId = 'LPU ID is required';
		else if (!/^\d{8}$/.test(registerData.LpuId)) newErrors.LpuId = 'LPU ID must be 8 digits';
		if (!registerData.email.trim()) newErrors.email = 'Email is required';
		if (!registerData.phone.trim()) newErrors.phone = 'Phone is required';
		if (!registerData.course.trim()) newErrors.course = 'Course is required';
		if (!registerData.gender) newErrors.gender = 'Gender is required';
		if (!registerData.bio.trim()) newErrors.bio = 'Bio is required';
		setErrors((prev) => ({ ...prev, register: newErrors }));
		return Object.keys(newErrors).length === 0;
	};

	const handleLoginChange = (e) => {
		const { name, value } = e.target;
		setLoginData((p) => ({ ...p, [name]: value }));
		if (errors.login[name]) setErrors((p) => ({ ...p, login: { ...p.login, [name]: '' } }));
	};

	const handleLoginSubmit = async (e) => {
		e.preventDefault();
		setLoginError('');
		if (!validateLogin()) return;
		setLoginLoading(true);
		try {
			await loginMember({ identifier: loginData.identifier, password: loginData.password });
			navigate('/member/dashboard', { replace: true });
		} catch (err) {
			let errorMsg = 'Invalid credentials. Please try again.';
			if (err?.response?.data?.message) errorMsg = err.response.data.message;
			else if (err?.message) errorMsg = err.message;
			setLoginError(errorMsg);
		} finally {
			setLoginLoading(false);
		}
	};

	const handleRegisterChange = (e) => {
		const { name, value, type, checked } = e.target;
		if (type === 'checkbox') setRegisterData((p) => ({ ...p, [name]: checked }));
		else setRegisterData((p) => ({ ...p, [name]: value }));
		if (errors.register[name])
			setErrors((p) => ({ ...p, register: { ...p.register, [name]: '' } }));
	};

	const handleRegisterSubmit = async (e) => {
		e.preventDefault();
		setRegisterError('');
		setRegisterSuccess('');
		if (!validateRegister()) return;
		setRegisterLoading(true);
		try {
			const payload = {
				...registerData,
				accommodation: registerData.accommodation === 'hostel' ? 'hostler' : 'non-hostler',
			};
			await publicClient.post('/api/apply/apply', payload);
			setRegisterSuccess('Registration successful. Check your email.');
			setRegisterData(initialRegisterState);
		} catch (err) {
			let errorMsg = 'Registration failed. Please try again.';
			if (err?.response?.data?.message) errorMsg = err.response.data.message;
			else if (err?.message) errorMsg = err.message;
			setRegisterError(errorMsg);
		} finally {
			setRegisterLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-transparent p-4">
			<div className="w-full max-w-3xl mx-auto">
				{/* header */}
				<div className="flex items-center gap-4 mb-6">
					<img src={Logo} alt="logo" className="w-12 h-12 rounded-lg object-cover" />
					<div>
						<h1 className="text-2xl font-bold text-primary">Syntax Club</h1>
						<p className="text-sm text-secondary">
							Build. Ship. Grow — join the community.
						</p>
					</div>
				</div>

				{/* simple tabs (route-driven) */}
				<div className="mb-6 flex gap-2">
					<button
						onClick={() => navigate('/auth/login')}
						className={`flex-1 py-2 rounded-xl ${
							!isRegisterPath
								? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
								: 'bg-transparent border border-blue-600/20 text-primary'
						}`}
					>
						Login
					</button>
					<button
						onClick={() => navigate('/auth/register')}
						className={`flex-1 py-2 rounded-xl ${
							isRegisterPath
								? 'bg-gradient-to-r from-green-500 to-teal-400 text-white'
								: 'bg-transparent border border-green-500/20 text-primary'
						}`}
					>
						Join
					</button>
				</div>

				{/* panel */}
				<div className="bg-transparent border border-blue-500/10 rounded-2xl p-6">
					{isRegisterPath ? (
						<RegisterForm
							registerData={registerData}
							handleRegisterChange={handleRegisterChange}
							handleRegisterSubmit={handleRegisterSubmit}
							registerLoading={registerLoading}
							registerError={registerError}
							registerSuccess={registerSuccess}
							errors={errors.register}
						/>
					) : (
						<LoginForm
							loginData={loginData}
							handleLoginChange={handleLoginChange}
							handleLoginSubmit={handleLoginSubmit}
							loginLoading={loginLoading}
							loginError={loginError}
							showPassword={showPassword}
							setShowPassword={setShowPassword}
							errors={errors.login}
						/>
					)}
				</div>

				{/* small footer */}
				<div className="mt-4 text-center text-sm text-muted">
					Need help?{' '}
					<button
						className="text-accent-1 underline"
						onClick={() => navigate('/contact')}
					>
						Contact us
					</button>
				</div>
			</div>
		</div>
	);
};

export default AuthPage;
