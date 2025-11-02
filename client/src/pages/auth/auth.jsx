import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth.js';
import { publicClient } from '../../services/api.js';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../assets/logo.png';

// Reusable Components
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
		<div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 z-10">{icon}</div>
		<input
			type={type}
			name={name}
			placeholder={placeholder}
			required={required}
			value={value}
			onChange={onChange}
			className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
				error ? 'border-red-500' : 'border-blue-500/30'
			} bg-blue-900/20 backdrop-blur-sm text-white font-poppins text-base transition-all 
      focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 
      hover:bg-blue-900/30 ${className}`}
			{...props}
		/>
		{error && <p className="mt-1 text-sm text-red-400 pl-2">{error}</p>}
	</div>
);

const GradientButton = ({ children, isLoading, type = 'button', className = '', ...props }) => (
	<motion.button
		type={type}
		className={`w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 
      text-white font-poppins text-lg font-semibold cursor-pointer shadow-lg 
      shadow-blue-500/20 relative overflow-hidden ${className}`}
		whileHover={{ scale: 1.02 }}
		whileTap={{ scale: 0.98 }}
		disabled={isLoading}
		{...props}
	>
		{isLoading ? (
			<span className="flex items-center justify-center">
				<svg
					className="animate-spin h-5 w-5 mr-3 text-white"
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
					></circle>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
				{children}
			</span>
		) : (
			children
		)}
	</motion.button>
);

const LoginForm = ({
	showPassword,
	setShowPassword,
	loginData,
	handleLoginChange,
	handleLoginSubmit,
	loginLoading,
	loginError,
	setShowResetModal,
	errors = {},
}) => (
	<motion.form
		className="flex flex-col gap-4"
		onSubmit={handleLoginSubmit}
		initial={{ opacity: 0, x: 20 }}
		animate={{ opacity: 1, x: 0 }}
		exit={{ opacity: 0, x: -20 }}
		transition={{ duration: 0.3 }}
	>
		<h2 className="text-3xl mb-4 text-center font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
			Welcome Back
		</h2>

		{loginError && (
			<motion.div
				className="text-red-400 text-center font-medium py-2 px-4 rounded-lg bg-red-900/20 border border-red-700/50"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
			>
				{loginError}
			</motion.div>
		)}

		<InputField
			icon={
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
						clipRule="evenodd"
					/>
				</svg>
			}
			name="identifier"
			placeholder="Enter your LPU ID or email"
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
					<path
						fillRule="evenodd"
						d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
						clipRule="evenodd"
					/>
				</svg>
			</div>
			<input
				type={showPassword ? 'text' : 'password'}
				name="password"
				placeholder="Enter your password"
				required
				value={loginData.password}
				onChange={handleLoginChange}
				className={`w-full pl-12 pr-12 py-3 rounded-xl border ${
					errors.password ? 'border-red-500' : 'border-blue-500/30'
				} bg-blue-900/20 backdrop-blur-sm text-white font-poppins text-base transition-all 
        focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 
        hover:bg-blue-900/30`}
			/>
			<button
				type="button"
				className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 transition-all hover:text-blue-100"
				onClick={() => setShowPassword((v) => !v)}
			>
				{showPassword ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
						<path
							fillRule="evenodd"
							d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
							clipRule="evenodd"
						/>
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
							clipRule="evenodd"
						/>
						<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
					</svg>
				)}
			</button>
			{errors.password && <p className="mt-1 text-sm text-red-400 pl-2">{errors.password}</p>}
		</div>

		<GradientButton isLoading={loginLoading} type="submit">
			{loginLoading ? 'Authenticating...' : 'Login'}
		</GradientButton>

		<div className="mt-2 text-center text-sm">
			<button
				type="button"
				onClick={() => setShowResetModal(true)}
				className="text-blue-300 font-medium hover:text-cyan-300 transition-all"
			>
				Forgot Password?
			</button>
		</div>
	</motion.form>
);

const RegisterForm = ({
	registerData,
	handleRegisterChange,
	handleRegisterSubmit,
	registerLoading,
	registerError,
	registerSuccess,
	setActiveTab,
	errors = {},
}) => (
	<motion.form
		className="flex flex-col gap-4"
		onSubmit={handleRegisterSubmit}
		initial={{ opacity: 0, x: 20 }}
		animate={{ opacity: 1, x: 0 }}
		exit={{ opacity: 0, x: -20 }}
		transition={{ duration: 0.3 }}
	>
		<h2 className="text-3xl mb-2 text-center font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
			Join Our Organization
		</h2>

		{registerError && (
			<motion.div
				className="text-red-400 text-center font-medium py-2 px-4 rounded-lg bg-red-900/20 border border-red-700/50"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
			>
				{registerError}
			</motion.div>
		)}

		{registerSuccess && (
			<motion.div
				className="text-green-400 text-center font-medium py-2 px-4 rounded-lg bg-green-900/20 border border-green-700/50"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
			>
				{registerSuccess}
			</motion.div>
		)}

		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<InputField
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
							clipRule="evenodd"
						/>
					</svg>
				}
				name="fullName"
				placeholder="Enter your full name"
				value={registerData.fullName}
				onChange={handleRegisterChange}
				error={errors.fullName}
			/>

			<InputField
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M10 2a1 1 0 011 1v1.323l3.954.985a1 1 0 01.585 1.63l-2.84 3.08 1.1 4.44a1 1 0 01-1.517 1.106L10 13.678l-3.182 1.886a1 1 0 01-1.517-1.106l1.1-4.44-2.84-3.08a1 1 0 01.585-1.63L9 4.323V3a1 1 0 011-1zm-4.768 8.2a.5.5 0 01.585-.366l3.101.773-1.462 5.91a.5.5 0 01-.758.294l-2.382-1.41a.5.5 0 01-.171-.17l-1.41-2.382a.5.5 0 01.294-.758l5.91-1.462a.5.5 0 01.366.585l-.773 3.101a.5.5 0 01-.97 0l-.773-3.1a.5.5 0 01.366-.586z"
							clipRule="evenodd"
						/>
					</svg>
				}
				name="LpuId"
				placeholder="Enter LPU ID"
				value={registerData.LpuId}
				onChange={handleRegisterChange}
				error={errors.LpuId}
			/>

			<InputField
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
						<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
					</svg>
				}
				type="email"
				name="email"
				placeholder="Enter your email"
				value={registerData.email}
				onChange={handleRegisterChange}
				error={errors.email}
			/>

			<InputField
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
					</svg>
				}
				type="tel"
				name="phone"
				placeholder="Enter phone number"
				value={registerData.phone}
				onChange={handleRegisterChange}
				error={errors.phone}
			/>

			<InputField
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
					</svg>
				}
				name="course"
				placeholder="Enter your course"
				value={registerData.course}
				onChange={handleRegisterChange}
				error={errors.course}
			/>

			<div className="mb-4">
				<label className="block mb-2 font-medium text-blue-200">Gender</label>
				<div className="flex gap-4 mt-2">
					<label className="flex items-center gap-2 transition-all text-blue-100">
						<input
							type="radio"
							name="gender"
							value="male"
							required
							checked={registerData.gender === 'male'}
							onChange={handleRegisterChange}
							className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-blue-500"
						/>
						Male
					</label>
					<label className="flex items-center gap-2 transition-all text-blue-100">
						<input
							type="radio"
							name="gender"
							value="female"
							checked={registerData.gender === 'female'}
							onChange={handleRegisterChange}
							className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-blue-500"
						/>
						Female
					</label>
				</div>
				{errors.gender && <p className="mt-1 text-sm text-red-400">{errors.gender}</p>}
			</div>

			<div className="mb-4">
				<label htmlFor="accommodation" className="block mb-2 font-medium text-blue-200">
					Accommodation type
				</label>
				<div className="relative">
					<div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 z-10">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
						</svg>
					</div>
					<select
						id="accommodation"
						name="accommodation"
						required
						value={registerData.accommodation}
						onChange={handleRegisterChange}
						className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
							errors.accommodation ? 'border-red-500' : 'border-blue-500/30'
						} bg-blue-900/20 backdrop-blur-sm text-white font-poppins text-base transition-all 
            focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 
            hover:bg-blue-900/30`}
					>
						<option value="" disabled>
							Select accommodation
						</option>
						<option value="hostel">Hostel</option>
						<option value="day-scholar">Day Scholar</option>
					</select>
					{errors.accommodation && (
						<p className="mt-1 text-sm text-red-400">{errors.accommodation}</p>
					)}
				</div>
			</div>
		</div>

		<div className="mb-4">
			<label htmlFor="domains" className="block mb-2 font-medium text-blue-200">
				Interested Domains <span className="text-xs text-blue-300">(Select up to 2)</span>
			</label>
			<div className="flex flex-wrap gap-2 pl-1">
				{[
					{ value: 'technical', label: 'Technical' },
					{ value: 'data-management', label: 'Data Management' },
					{ value: 'event-management', label: 'Event Management' },
					{ value: 'marketing', label: 'Marketing' },
					{ value: 'media', label: 'Media' },
					{ value: 'content-creation', label: 'Content Creation' },
					{ value: 'content-writing', label: 'Content Writing' },
					{ value: 'arts-and-culture', label: 'Arts and Culture' },
					{ value: 'design', label: 'Design' },
				].map((domain) => {
					const selectedCount = registerData.domains.length;
					const checked = registerData.domains.includes(domain.value);
					const disabled = !checked && selectedCount >= 2;
					return (
						<label
							key={domain.value}
							className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-900/20 cursor-pointer transition-colors
                ${checked ? 'bg-blue-700/30 border-blue-400' : 'hover:bg-blue-900/30'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
						>
							<input
								type="checkbox"
								name="domains"
								value={domain.value}
								checked={checked}
								disabled={disabled}
								onChange={(e) => {
									const checked = e.target.checked;
									handleRegisterChange({
										target: {
											name: 'domains',
											value: checked
												? [...registerData.domains, domain.value]
												: registerData.domains.filter(
														(d) => d !== domain.value
													),
										},
									});
								}}
								className="accent-blue-400 h-4 w-4"
							/>
							<span className="text-blue-100">{domain.label}</span>
						</label>
					);
				})}
			</div>
			{errors.domains && <p className="mt-1 text-sm text-red-400">{errors.domains}</p>}
			<p className="mt-1 text-xs text-blue-300 pl-1">You can select up to two domains</p>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
			<label className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/30 transition-colors cursor-pointer">
				<div className="relative">
					<input
						type="checkbox"
						name="previousExperience"
						checked={registerData.previousExperience}
						onChange={handleRegisterChange}
						className="sr-only"
					/>
					<div
						className={`w-6 h-6 rounded flex items-center justify-center ${registerData.previousExperience ? 'bg-blue-500' : 'bg-blue-900/50'}`}
					>
						{registerData.previousExperience && (
							<svg
								className="w-4 h-4 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						)}
					</div>
				</div>
				<span className="text-blue-100">Previous Experience</span>
			</label>

			<label className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/30 transition-colors cursor-pointer">
				<div className="relative">
					<input
						type="checkbox"
						name="anyotherorg"
						checked={registerData.anyotherorg}
						onChange={handleRegisterChange}
						className="sr-only"
					/>
					<div
						className={`w-6 h-6 rounded flex items-center justify-center ${registerData.anyotherorg ? 'bg-blue-500' : 'bg-blue-900/50'}`}
					>
						{registerData.anyotherorg && (
							<svg
								className="w-4 h-4 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						)}
					</div>
				</div>
				<span className="text-blue-100">Member of Other Organizations</span>
			</label>
		</div>

		<div className="mb-4 relative">
			<label htmlFor="bio" className="block mb-2 font-medium text-blue-200">
				Bio
			</label>
			<div className="relative">
				<div className="absolute left-4 top-4 text-blue-400 z-10">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
				<textarea
					id="bio"
					name="bio"
					placeholder="Tell us about yourself, your interests, and why you want to join..."
					rows={4}
					required
					value={registerData.bio}
					onChange={handleRegisterChange}
					className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
						errors.bio ? 'border-red-500' : 'border-blue-500/30'
					} bg-blue-900/20 backdrop-blur-sm text-white font-poppins text-base transition-all 
          focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 
          hover:bg-blue-900/30`}
				/>
				{errors.bio && <p className="mt-1 text-sm text-red-400">{errors.bio}</p>}
			</div>
		</div>

		<GradientButton isLoading={registerLoading} type="submit">
			{registerLoading ? 'Registering...' : 'Register Now'}
		</GradientButton>
	</motion.form>
);

const AuthPage = () => {
	const location = useLocation();
	const initialTab = location.state?.tab === 'register' ? 'register' : 'login';
	const [activeTab, setActiveTab] = useState(initialTab);
	const [showPassword, setShowPassword] = useState(false);
	const [registerError, setRegisterError] = useState('');
	const [registerSuccess, setRegisterSuccess] = useState('');
	const [registerLoading, setRegisterLoading] = useState(false);
	const [loginError, setLoginError] = useState('');
	const [loginLoading, setLoginLoading] = useState(false);
	const [loginData, setLoginData] = useState({ identifier: '', password: '' });
	const { loginMember } = useAuth();
	const [resetEmail, setResetEmail] = useState('');
	const [showResetModal, setShowResetModal] = useState(false);
	const [resetStatus, setResetStatus] = useState({ message: '', error: false });
	const [resetLoading, setResetLoading] = useState(false);
	const [errors, setErrors] = useState({
		login: {},
		register: {},
	});
	const navigate = useNavigate();

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
	const containerRef = useRef(null);
	const [bgShapes, setBgShapes] = useState([]);
	const [bgError, setBgError] = useState('');

	// Floating particles background
	useEffect(() => {
		try {
			const container = containerRef.current;
			if (!container) return;

			const particles = [];
			const colors = ['#2563eb', '#0ea5e9', '#3b82f6', '#60a5fa'];

			// Create particles
			for (let i = 0; i < 30; i++) {
				const particle = document.createElement('div');
				particle.className = 'absolute rounded-full';
				const size = Math.random() * 8 + 3;
				particle.style.width = `${size}px`;
				particle.style.height = `${size}px`;
				const color = colors[Math.floor(Math.random() * colors.length)];
				particle.style.background = color;
				particle.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
				particle.style.left = `${Math.random() * 100}%`;
				particle.style.top = `${Math.random() * 100}%`;
				particle.style.opacity = `${Math.random() * 0.4 + 0.1}`;
				container.appendChild(particle);
				particles.push(particle);

				// Animate particles
				const duration = 8000 + Math.random() * 8000;
				particle.animate(
					[
						{ transform: 'translate(0, 0)' },
						{
							transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px)`,
						},
						{ transform: 'translate(0, 0)' },
					],
					{
						duration,
						iterations: Infinity,
						easing: 'ease-in-out',
					}
				);
			}

			return () => {
				particles.forEach((p) => p.remove());
			};
		} catch (err) {
			setBgError('Background animation failed to load.');
		}
	}, []);

	useEffect(() => {
		// Generate shapes only once
		setBgShapes(
			Array.from({ length: 8 }).map(() => ({
				width: Math.random() * 200 + 50,
				height: Math.random() * 200 + 50,
				left: Math.random() * 100,
				top: Math.random() * 100,
				rotate: Math.random() * 360,
				x: Math.random() * 100 - 50,
				y: Math.random() * 100 - 50,
				duration: Math.random() * 20 + 20,
			}))
		);
	}, []);

	const validateLogin = () => {
		const newErrors = {};

		if (!loginData.identifier.trim()) {
			newErrors.identifier = 'LPU ID or email is required';
		}

		if (!loginData.password) {
			newErrors.password = 'Password is required';
		} else if (loginData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters';
		}

		setErrors((prev) => ({ ...prev, login: newErrors }));
		return Object.keys(newErrors).length === 0;
	};

	const validateRegister = () => {
		const newErrors = {};

		if (!registerData.fullName.trim()) {
			newErrors.fullName = 'Full name is required';
		}

		if (!registerData.LpuId.trim()) {
			newErrors.LpuId = 'LPU ID is required';
		} else if (!/^\d{8}$/.test(registerData.LpuId)) {
			newErrors.LpuId = 'LPU ID must be exactly 8 digits';
		}

		if (!registerData.email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
			newErrors.email = 'Invalid email format';
		}

		if (!registerData.phone.trim()) {
			newErrors.phone = 'Phone number is required';
		}

		if (!registerData.course.trim()) {
			newErrors.course = 'Course is required';
		}

		if (!registerData.gender) {
			newErrors.gender = 'Gender is required';
		}

		if (registerData.domains.length === 0) {
			newErrors.domains = 'Select at least one domain';
		} else if (registerData.domains.length > 2) {
			newErrors.domains = 'Select maximum two domains';
		}

		if (!registerData.accommodation) {
			newErrors.accommodation = 'Accommodation type is required';
		}

		if (!registerData.bio.trim()) {
			newErrors.bio = 'Bio is required';
		} else if (registerData.bio.length > 500) {
			newErrors.bio = 'Bio cannot exceed 500 characters';
		}

		setErrors((prev) => ({ ...prev, register: newErrors }));
		return Object.keys(newErrors).length === 0;
	};

	const handleLoginChange = (e) => {
		const { name, value } = e.target;
		setLoginData((prev) => ({ ...prev, [name]: value }));

		// Clear error when user types
		if (errors.login[name]) {
			setErrors((prev) => ({
				...prev,
				login: { ...prev.login, [name]: '' },
			}));
		}
	};

	const handleLoginSubmit = async (e) => {
		e.preventDefault();
		setLoginError('');
		if (!validateLogin()) return;

		setLoginLoading(true);

		try {
			await loginMember({
				identifier: loginData.identifier,
				password: loginData.password,
			});

			setTimeout(() => {
				navigate('/member/dashboard', { replace: true });
			}, 1200);
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

		if (type === 'checkbox') {
			setRegisterData((prev) => ({ ...prev, [name]: checked }));
		} else {
			setRegisterData((prev) => ({ ...prev, [name]: value }));
		}

		// Clear error when user types
		if (errors.register[name]) {
			setErrors((prev) => ({
				...prev,
				register: { ...prev.register, [name]: '' },
			}));
		}
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
			setRegisterSuccess('Registration successful! We will contact you soon.');
			setRegisterData(initialRegisterState);
		} catch (err) {
			let errorMsg = 'Registration failed. Please check your details or try again.';
			if (err?.response?.data?.message) errorMsg = err.response.data.message;
			else if (err?.message) errorMsg = err.message;
			setRegisterError(errorMsg);
		} finally {
			setRegisterLoading(false);
		}
	};

	const handlePasswordReset = async (e) => {
		e.preventDefault();
		setResetStatus({ message: '', error: false });

		if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
			setResetStatus({
				message: 'Please enter a valid email address',
				error: true,
			});
			return;
		}

		setResetLoading(true);

		try {
			await publicClient.post('/api/members/send-reset-email', { email: resetEmail });
			setResetStatus({
				message: 'Password reset email sent! Please check your inbox.',
				error: false,
			});
			setResetEmail('');
		} catch (err) {
			let errorMsg = 'Failed to send reset email. Please try again.';
			if (err?.response?.data?.message) errorMsg = err.response.data.message;
			else if (err?.message) errorMsg = err.message;
			setResetStatus({
				message: errorMsg,
				error: true,
			});
		} finally {
			setResetLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e17] to-[#0f172a] overflow-hidden p-4">
			{/* Background elements */}
			<div
				ref={containerRef}
				className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none"
			/>
			{bgError && (
				<div className="absolute top-2 left-2 bg-red-900/80 text-red-300 px-4 py-2 rounded-lg z-50">
					{bgError}
				</div>
			)}

			<div className="absolute inset-0 z-0">
				<div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse-slow" />
				<div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl animate-pulse-slow" />
				<div className="absolute bottom-1/4 left-1/3 w-56 h-56 rounded-full bg-indigo-500/12 blur-3xl animate-pulse-slow" />
			</div>

			{/* Floating decorative elements */}
			<div className="absolute top-0 left-0 w-full h-full z-1 overflow-hidden pointer-events-none">
				{bgShapes.map((shape, i) => (
					<motion.div
						key={i}
						className="absolute rounded-lg bg-gradient-to-r from-blue-600/10 to-cyan-500/10"
						style={{
							width: `${shape.width}px`,
							height: `${shape.height}px`,
							left: `${shape.left}%`,
							top: `${shape.top}%`,
							rotate: `${shape.rotate}deg`,
						}}
						animate={{
							x: [0, shape.x, 0],
							y: [0, shape.y, 0],
						}}
						transition={{
							duration: shape.duration,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
					/>
				))}
			</div>

			<div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 z-10">
				{/* Branding Header */}
				<motion.div
					className="text-center py-10 select-none"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<div className="flex justify-center items-center gap-4 mb-4">
						<div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border-2 border-cyan-400/40 bg-black/70 relative">
							<img
								src={Logo}
								alt="Vibranta Logo"
								className="w-full h-full object-cover"
							/>
						</div>
						<motion.h1
							className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-wide"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							Vibranta
						</motion.h1>
					</div>
					<motion.p
						className="text-lg font-light max-w-xl mx-auto leading-relaxed text-blue-200"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
					>
						Empowering student innovation through{' '}
						<span className="font-semibold text-blue-300">technology</span>,{' '}
						<span className="font-semibold text-cyan-300">community</span>, and{' '}
						<span className="font-semibold text-blue-400">creativity</span>
					</motion.p>
				</motion.div>

				<motion.div
					className="w-full max-w-2xl bg-blue-900/20 backdrop-blur-2xl rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden relative"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.6, duration: 0.5 }}
				>
					<div className="flex border-b border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-cyan-500/10">
						<button
							className={`flex-1 py-5 text-center font-semibold text-lg cursor-pointer transition-all relative ${activeTab === 'login' ? 'text-white' : 'text-blue-300 hover:text-white'}`}
							onClick={() => setActiveTab('login')}
						>
							Login
							{activeTab === 'login' && (
								<span className="absolute bottom-0 left-1/4 w-1/2 h-1 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse" />
							)}
						</button>
						<button
							className={`flex-1 py-5 text-center font-semibold text-lg cursor-pointer transition-all relative ${activeTab === 'register' ? 'text-white' : 'text-blue-300 hover:text-white'}`}
							onClick={() => setActiveTab('register')}
						>
							Join Club
							{activeTab === 'register' && (
								<span className="absolute bottom-0 left-1/4 w-1/2 h-1 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse" />
							)}
						</button>
					</div>
					<div className="p-8 md:p-12 bg-gradient-to-br from-blue-900/10 via-cyan-900/10 to-blue-900/10">
						<AnimatePresence mode="wait">
							{activeTab === 'login' ? (
								<LoginForm
									showPassword={showPassword}
									setShowPassword={setShowPassword}
									loginData={loginData}
									handleLoginChange={handleLoginChange}
									handleLoginSubmit={handleLoginSubmit}
									loginLoading={loginLoading}
									loginError={loginError}
									setShowResetModal={setShowResetModal}
									errors={errors.login}
								/>
							) : (
								<RegisterForm
									registerData={registerData}
									handleRegisterChange={handleRegisterChange}
									handleRegisterSubmit={handleRegisterSubmit}
									registerLoading={registerLoading}
									registerError={registerError}
									registerSuccess={registerSuccess}
									setActiveTab={setActiveTab}
									errors={errors.register}
								/>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
			</div>

			{/* Password Reset Modal */}
			<AnimatePresence>
				{showResetModal && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
							onClick={() => setShowResetModal(false)}
						/>

						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							transition={{ type: 'spring', damping: 25 }}
							className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
						>
							<div className="bg-gradient-to-br from-[#0a0e17] to-[#0f172a] border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
								<div className="p-6 border-b border-blue-500/30">
									<div className="flex justify-between items-center mb-4">
										<h3 className="text-xl font-bold text-white">
											Reset Password
										</h3>
										<button
											onClick={() => setShowResetModal(false)}
											className="p-2 text-blue-300 hover:text-white transition-colors"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 13.678l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									</div>

									<p className="text-blue-300 mb-6">
										Enter your registered email address to reset your password.
										We'll send you a link to create a new password.
									</p>

									{resetStatus.message && (
										<div
											className={`mb-4 p-3 rounded-lg ${
												resetStatus.error
													? 'bg-red-900/30 border border-red-700/50'
													: 'bg-green-900/30 border border-green-700/50'
											}`}
										>
											<p
												className={
													resetStatus.error
														? 'text-red-300'
														: 'text-green-300'
												}
											>
												{resetStatus.message}
											</p>
										</div>
									)}

									<form onSubmit={handlePasswordReset} className="space-y-4">
										<InputField
											icon={
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
													<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
												</svg>
											}
											type="email"
											value={resetEmail}
											onChange={(e) => setResetEmail(e.target.value)}
											placeholder="Enter your registered email"
										/>

										<GradientButton isLoading={resetLoading}>
											{resetLoading ? 'Sending...' : 'Send Reset Link'}
										</GradientButton>
									</form>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default AuthPage;
