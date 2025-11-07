import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const AdminAuthPage = () => {
	const [formData, setFormData] = useState({
		fullname: '',
		password: '',
		secret: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showSecret, setShowSecret] = useState(false);
	const { loginAdmin } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		setSuccess('');
		try {
			await loginAdmin({
				fullname: formData.fullname,
				password: formData.password,
				secret: formData.secret,
			});
			setSuccess('Login successful! Redirecting...');
			setTimeout(() => navigate('/admin/dashboard'), 1000);
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Invalid admin credentials.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full bg-transparent flex items-center justify-center py-8 px-4 sm:px-6">
			<motion.div
				className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-xl"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: 'easeOut' }}
			>
				<div className="p-6 sm:p-8">
					<div className="text-center mb-6">
						<motion.h1
							className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent"
							initial={{ scale: 0.98 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.3 }}
						>
							Admin Login
						</motion.h1>
						<p className="text-sm text-gray-300/80 mt-2">
							Sign in with your admin credentials to access the dashboard.
						</p>
					</div>

					<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
						{error && (
							<motion.div
								className="px-4 py-3 rounded-lg bg-red-900/25 border border-red-700/40 text-red-200 text-sm"
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
							>
								<div className="flex items-start gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 mt-0.5 flex-shrink-0"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									<span>{error}</span>
								</div>
							</motion.div>
						)}

						{success && (
							<motion.div
								className="px-4 py-3 rounded-lg bg-green-900/25 border border-green-700/40 text-green-200 text-sm"
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
							>
								<div className="flex items-start gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 mt-0.5 flex-shrink-0"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									<span>{success}</span>
								</div>
							</motion.div>
						)}

						<div>
							<label className="block mb-2 text-sm font-medium text-gray-300">
								Full Name
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 108 0 4 4 0 00-8 0z"
										/>
									</svg>
								</div>
								<input
									type="text"
									name="fullname"
									required
									value={formData.fullname}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											fullname: e.target.value,
										}))
									}
									className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent"
									placeholder="Enter your full name"
									autoComplete="username"
								/>
							</div>
						</div>

						<div>
							<label className="block mb-2 text-sm font-medium text-gray-300">
								Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
										/>
									</svg>
								</div>
								<input
									type={showPassword ? 'text' : 'password'}
									name="password"
									required
									value={formData.password}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											password: e.target.value,
										}))
									}
									className="w-full pl-10 pr-10 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent"
									placeholder="Enter your password"
									autoComplete="current-password"
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-3 flex items-center"
									onClick={() => setShowPassword((v) => !v)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className={`h-5 w-5 ${
											showPassword ? 'text-cyan-400' : 'text-gray-500'
										}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										{showPassword ? (
											<>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59"
												/>
											</>
										) : (
											<>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												/>
											</>
										)}
									</svg>
								</button>
							</div>
						</div>

						<div>
							<label className="block mb-2 text-sm font-medium text-gray-300">
								Admin Secret Key
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
										/>
									</svg>
								</div>
								<input
									type={showSecret ? 'text' : 'password'}
									name="secret"
									required
									value={formData.secret}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											secret: e.target.value,
										}))
									}
									className="w-full pl-10 pr-10 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent"
									placeholder="Enter admin secret"
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-3 flex items-center"
									onClick={() => setShowSecret((v) => !v)}
									aria-label={showSecret ? 'Hide secret' : 'Show secret'}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className={`h-5 w-5 ${
											showSecret ? 'text-cyan-400' : 'text-gray-500'
										}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										{showSecret ? (
											<>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59"
												/>
											</>
										) : (
											<>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												/>
											</>
										)}
									</svg>
								</button>
							</div>
						</div>

						<motion.button
							type="submit"
							disabled={loading}
							whileHover={{ scale: loading ? 1 : 1.02 }}
							whileTap={{ scale: loading ? 1 : 0.98 }}
							className="w-full py-3.5 rounded-lg btn-primary text-white font-medium text-sm cursor-pointer shadow-lg relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
						>
							<span className="relative z-10 flex items-center justify-center">
								{loading ? (
									<>
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
											></path>
										</svg>
										Authenticating...
									</>
								) : (
									'Login to Dashboard'
								)}
							</span>
						</motion.button>

						<div className="text-center pt-1">
							<button
								type="button"
								onClick={() => navigate('/login')}
								className="text-xs text-gray-300 hover:text-white underline underline-offset-4 transition-colors"
							>
								Member? Go to Login
							</button>
						</div>
					</form>
				</div>
			</motion.div>
		</div>
	);
};

export default AdminAuthPage;
