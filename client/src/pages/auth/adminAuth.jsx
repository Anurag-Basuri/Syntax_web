import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { memberRegister } from '../../services/authServices.js';

const AdminAuthPage = () => {
	const [activeTab, setActiveTab] = useState('admin');
	const [formData, setFormData] = useState({
		fullName: '',
		LpuId: '',
		email: '',
		department: '',
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

	// Common handler for both admin login and member register
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		setSuccess('');
		try {
			if (activeTab === 'admin') {
				await loginAdmin({
					fullname: formData.fullName,
					password: formData.password,
					secret: formData.secret,
				});
				setSuccess('Login successful! Redirecting...');
				setTimeout(() => navigate('/admin/dashboard'), 1200);
			} else {
				// Member registration: send only required fields
				await memberRegister({
					fullname: formData.fullName,
					LpuId: formData.LpuId,
					email: formData.email,
					department: formData.department,
					password: formData.password,
				});
				setSuccess('Registration successful! You can now login.');
				setFormData({
					fullName: '',
					LpuId: '',
					email: '',
					department: '',
					password: '',
					secret: '',
				});
			}
		} catch (err) {
			setError(
				err?.response?.data?.message ||
					err?.message ||
					(activeTab === 'admin' ? 'Invalid admin credentials' : 'Registration failed.')
			);
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center py-8 px-4 sm:px-6">
			<motion.div
				className="w-full max-w-xl bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
			>
				<div className="p-6 sm:p-8">
					<div className="flex border-b border-white/10">
						<button
							className={`flex-1 py-4 text-center font-medium text-base cursor-pointer transition-all relative ${
								activeTab === 'admin'
									? 'text-white'
									: 'text-gray-400 hover:text-white'
							}`}
							onClick={() => setActiveTab('admin')}
						>
							Admin Login
							{activeTab === 'admin' && (
								<motion.span
									className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-[#3a56c9] to-[#5d7df5]"
									layoutId="tabIndicator"
									initial={false}
									transition={{ type: 'spring', stiffness: 300, damping: 30 }}
								/>
							)}
						</button>
						<button
							className={`flex-1 py-4 text-center font-medium text-base cursor-pointer transition-all relative ${
								activeTab === 'member'
									? 'text-white'
									: 'text-gray-400 hover:text-white'
							}`}
							onClick={() => setActiveTab('member')}
						>
							Member Register
							{activeTab === 'member' && (
								<motion.span
									className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-[#5d7df5] to-[#3a56c9]"
									layoutId="tabIndicator"
									initial={false}
									transition={{ type: 'spring', stiffness: 300, damping: 30 }}
								/>
							)}
						</button>
					</div>

					<div className="py-8">
						<AnimatePresence mode="wait">
							<motion.form
								key={activeTab}
								className="flex flex-col gap-6"
								onSubmit={handleSubmit}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
							>
								<h2 className="text-xl font-bold text-center text-white">
									{activeTab === 'admin'
										? 'Administrator Sign In'
										: 'Member Registration'}
								</h2>

								{error && (
									<motion.div
										className="px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm"
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
										className="px-4 py-3 rounded-lg bg-green-900/30 border border-green-700/50 text-green-300 text-sm"
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

								<div className="space-y-4">
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
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 108 0 4 4 0 00-8 0zm10-10V7a4 4 0 00-8 0v4h8z"
													/>
												</svg>
											</div>
											<input
												type="text"
												name="fullName"
												required
												value={formData.fullName}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														fullName: e.target.value,
													}))
												}
												className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5d7df5]/50 focus:border-transparent"
												placeholder="Enter your full name"
											/>
										</div>
									</div>

									{activeTab === 'member' && (
										<>
											<div>
												<label className="block mb-2 text-sm font-medium text-gray-300">
													LPU ID
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
																d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
															/>
														</svg>
													</div>
													<input
														type="text"
														name="LpuId"
														required
														value={formData.LpuId}
														onChange={(e) =>
															setFormData((prev) => ({
																...prev,
																LpuId: e.target.value,
															}))
														}
														className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5d7df5]/50 focus:border-transparent"
														placeholder="Enter your LPU ID"
													/>
												</div>
											</div>
											<div>
												<label className="block mb-2 text-sm font-medium text-gray-300">
													Email Address
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
																d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
															/>
														</svg>
													</div>
													<input
														type="email"
														name="email"
														required
														value={formData.email}
														onChange={(e) =>
															setFormData((prev) => ({
																...prev,
																email: e.target.value,
															}))
														}
														className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5d7df5]/50 focus:border-transparent"
														placeholder="Enter your email"
													/>
												</div>
											</div>
											<div>
												<label className="block mb-2 text-sm font-medium text-gray-300">
													Department
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
																d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
															/>
														</svg>
													</div>
													<select
														name="department"
														required
														value={formData.department}
														onChange={(e) =>
															setFormData((prev) => ({
																...prev,
																department: e.target.value,
															}))
														}
														className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5d7df5]/50 focus:border-transparent"
													>
														<option value="">
															Select your department
														</option>
														<option value="HR">HR</option>
														<option value="Technical">Technical</option>
														<option value="Marketing">Marketing</option>
														<option value="Management">
															Management
														</option>
														<option value="Social Media">
															Social Media
														</option>
														<option value="Content Writing">
															Content Writing
														</option>
														<option value="Event Management">
															Event Management
														</option>
														<option value="Media">Media</option>
														<option value="Design">Design</option>
													</select>
												</div>
											</div>
										</>
									)}

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
												minLength={activeTab === 'member' ? 6 : undefined}
												value={formData.password}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														password: e.target.value,
													}))
												}
												className="w-full pl-10 pr-10 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5d7df5]/50 focus:border-transparent"
												placeholder={
													activeTab === 'admin'
														? 'Enter your password'
														: 'Create a password'
												}
											/>
											<button
												type="button"
												className="absolute inset-y-0 right-0 pr-3 flex items-center"
												onClick={() => setShowPassword(!showPassword)}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className={`h-5 w-5 ${showPassword ? 'text-blue-400' : 'text-gray-500'}`}
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
																d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
												className="w-full pl-10 pr-10 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5d7df5]/50 focus:border-transparent"
												placeholder="Enter secret key"
											/>
											<button
												type="button"
												className="absolute inset-y-0 right-0 pr-3 flex items-center"
												onClick={() => setShowSecret(!showSecret)}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className={`h-5 w-5 ${showSecret ? 'text-blue-400' : 'text-gray-500'}`}
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
																d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
								</div>

								<motion.button
									type="submit"
									disabled={loading}
									className={`w-full py-3.5 rounded-lg bg-gradient-to-r ${
										activeTab === 'admin'
											? 'from-[#3a56c9] to-[#5d7df5]'
											: 'from-[#5d7df5] to-[#3a56c9]'
									} text-white font-medium text-sm cursor-pointer shadow-lg relative overflow-hidden`}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
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
												{activeTab === 'admin'
													? 'Authenticating...'
													: 'Creating Account...'}
											</>
										) : activeTab === 'admin' ? (
											'Login to Dashboard'
										) : (
											'Register as Member'
										)}
									</span>
									<div
										className={`absolute inset-0 bg-gradient-to-r ${
											activeTab === 'admin'
												? 'from-[#3a56c9]/0 to-[#5d7df5]/0 group-hover:from-[#3a56c9]/20 group-hover:to-[#5d7df5]/20'
												: 'from-[#5d7df5]/0 to-[#3a56c9]/0 group-hover:from-[#5d7df5]/20 group-hover:to-[#3a56c9]/20'
										} transition-all`}
									></div>
								</motion.button>
							</motion.form>
						</AnimatePresence>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default AdminAuthPage;
