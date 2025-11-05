import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { apiClient, publicClient } from '../services/api.js';
import { getToken, decodeToken } from '../utils/handleTokens.js';

const ContactPage = () => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		lpuID: '',
		subject: '',
		message: '',
	});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState('');
	const [contacts, setContacts] = useState([]);
	const [adminLoading, setAdminLoading] = useState(false);
	const [expandedId, setExpandedId] = useState(null);
	const token = getToken();
	const user = token ? decodeToken(token) : null;

	useEffect(() => {
		if (user?.adminID) {
			fetchContacts();
		}
	}, [user]);

	const fetchContacts = async () => {
		setAdminLoading(true);
		try {
			const response = await apiClient.get('/api/contacts/getall');
			// If paginated, use response.data.contacts.docs
			const contactsArr = response.data.contacts?.docs || response.data.contacts || [];
			setContacts(contactsArr);
		} catch (error) {
			setError('Failed to fetch contacts');
		} finally {
			setAdminLoading(false);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			await publicClient.post('/api/contact/send', formData);
			setSuccess(true);
			setFormData({
				name: '',
				email: '',
				phone: '',
				lpuID: '',
				subject: '',
				message: '',
			});
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to send message');
		} finally {
			setLoading(false);
		}
	};

	const markAsResolved = async (id) => {
		try {
			await apiClient.patch(`/api/contacts/${id}/resolve`);
			setContacts(
				contacts.map((contact) =>
					contact._id === id ? { ...contact, status: 'resolved' } : contact
				)
			);
		} catch (error) {
			setError('Failed to mark as resolved');
		}
	};

	const toggleExpand = (id) => {
		setExpandedId(expandedId === id ? null : id);
	};

	return (
		<div className="min-h-screen py-12 px-4">
			{!user?.adminID ? (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="max-w-3xl mx-auto bg-gradient-to-br from-[#1e2a5a]/80 to-[#142045]/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-[#2a3a72]"
				>
					<div className="md:flex">
						<div className="md:w-1/3 bg-gradient-to-br from-[#1e2a5a] to-[#142045] text-white p-8 flex flex-col items-center justify-center">
							<Mail className="h-14 w-14 mb-4 text-[#5d7df5]" />
							<h2 className="text-3xl font-bold mb-2">Contact Us</h2>
							<p className="opacity-80 mb-8 text-center">
								Have questions? Reach out to our team for assistance.
							</p>
							<div className="space-y-4 w-full">
								{/* Support Phone */}
								<a
									href="tel:+919771072294"
									className="flex items-center gap-3 group hover:bg-[#1e2a5a]/30 rounded-lg px-2 py-1 transition"
									title="Call Support"
								>
									<svg
										className="h-5 w-5 text-[#5d7df5] group-hover:text-blue-400 transition"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
										/>
									</svg>
									<div>
										<h3 className="font-medium">Support</h3>
										<p className="text-sm opacity-80 underline group-hover:text-blue-300 transition">
											+91 9771072294
										</p>
									</div>
								</a>
								{/* Support Email */}
								<a
									href="mailto:vibranta.helpdesk@gmail.com"
									className="flex items-center gap-3 group hover:bg-[#1e2a5a]/30 rounded-lg px-2 py-1 transition"
									title="Send Email"
								>
									<svg
										className="h-5 w-5 text-[#5d7df5] group-hover:text-blue-400 transition"
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
									<div>
										<h3 className="font-medium">Email</h3>
										<p className="text-sm opacity-80 underline group-hover:text-blue-300 transition">
											vibranta.helpdesk@gmail.com
										</p>
									</div>
								</a>
							</div>
						</div>
						<div className="md:w-2/3 p-8">
							<h3 className="text-2xl font-bold text-gray-200 mb-6">
								Send us a message
							</h3>
							<AnimatePresence>
								{success && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										className="mb-6 bg-green-900/30 text-green-400 p-4 rounded-lg flex items-center border border-green-700/50"
									>
										<CheckCircle2 className="h-5 w-5 mr-2" />
										Your message has been sent successfully!
									</motion.div>
								)}
								{error && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										className="mb-6 bg-red-900/30 text-red-400 p-4 rounded-lg border border-red-700/50"
									>
										{error}
									</motion.div>
								)}
							</AnimatePresence>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-400 mb-1">
											Full Name
										</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											required
											className="w-full px-4 py-2 bg-[#0d1326] border border-[#2a3a72] text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-400 mb-1">
											LPU ID
										</label>
										<input
											type="text"
											name="lpuID"
											value={formData.lpuID}
											onChange={handleChange}
											required
											className="w-full px-4 py-2 bg-[#0d1326] border border-[#2a3a72] text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-400 mb-1">
											Email Address
										</label>
										<input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											required
											className="w-full px-4 py-2 bg-[#0d1326] border border-[#2a3a72] text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-400 mb-1">
											Phone Number
										</label>
										<input
											type="tel"
											name="phone"
											value={formData.phone}
											onChange={handleChange}
											required
											className="w-full px-4 py-2 bg-[#0d1326] border border-[#2a3a72] text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">
										Subject
									</label>
									<input
										type="text"
										name="subject"
										value={formData.subject}
										onChange={handleChange}
										required
										className="w-full px-4 py-2 bg-[#0d1326] border border-[#2a3a72] text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">
										Message
									</label>
									<textarea
										name="message"
										value={formData.message}
										onChange={handleChange}
										required
										rows={4}
										className="w-full px-4 py-2 bg-[#0d1326] border border-[#2a3a72] text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
									></textarea>
								</div>
								<div>
									<motion.button
										type="submit"
										disabled={loading}
										whileHover={{ scale: 1.03 }}
										whileTap={{ scale: 0.98 }}
										className="w-full py-3 bg-gradient-to-r from-[#3a56c9] to-[#5d7df5] text-white font-semibold rounded-xl flex items-center justify-center shadow-lg shadow-[#3a56c9]/30 transition-all"
									>
										{loading ? (
											<svg
												className="animate-spin h-5 w-5 mr-2 text-white"
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
										) : (
											<Send className="h-5 w-5 mr-2" />
										)}
										{loading ? 'Sending...' : 'Send Message'}
									</motion.button>
								</div>
							</form>
						</div>
					</div>
				</motion.div>
			) : (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="max-w-6xl mx-auto bg-gradient-to-br from-[#1e2a5a]/80 to-[#142045]/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-[#2a3a72] p-8"
				>
					<div className="flex items-center mb-8">
						<ShieldCheck className="h-10 w-10 text-[#5d7df5] mr-4" />
						<h2 className="text-3xl font-bold text-gray-200">Contact Requests</h2>
					</div>
					{adminLoading ? (
						<div className="flex justify-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5d7df5]"></div>
						</div>
					) : contacts.length === 0 ? (
						<div className="text-center py-12 text-gray-400 text-lg">
							No contact requests found
						</div>
					) : (
						<div className="space-y-6">
							{contacts.map((contact) => (
								<motion.div
									key={contact._id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.3 }}
									className={`rounded-xl overflow-hidden border transition-all ${
										contact.status === 'resolved'
											? 'border-green-700/50 bg-green-900/10'
											: 'border-[#2a3a72] bg-[#0d1326]/80'
									}`}
								>
									<div
										className="flex justify-between items-center p-5 cursor-pointer hover:bg-[#1e2a5a]/20 transition-all"
										onClick={() => toggleExpand(contact._id)}
									>
										<div className="flex items-center gap-4">
											<div
												className={`w-3 h-3 rounded-full ${
													contact.status === 'resolved'
														? 'bg-green-500'
														: 'bg-yellow-500'
												}`}
											></div>
											<div>
												<h3 className="font-semibold text-gray-200">
													{contact.subject}
												</h3>
												<p className="text-sm text-gray-400">
													{contact.name} • {contact.email}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-gray-500">
												{new Date(contact.createdAt).toLocaleDateString()}
											</span>
											{expandedId === contact._id ? (
												<ChevronUp className="h-5 w-5 text-gray-500" />
											) : (
												<ChevronDown className="h-5 w-5 text-gray-500" />
											)}
										</div>
									</div>
									<AnimatePresence>
										{expandedId === contact._id && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: 'auto', opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.3 }}
												className="border-t border-[#2a3a72] bg-[#0d1326]/60"
											>
												<div className="p-5">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
														<div>
															<p className="text-sm text-gray-400">
																LPU ID
															</p>
															<p className="text-gray-200 font-mono">
																{contact.lpuID}
															</p>
														</div>
														<div>
															<p className="text-sm text-gray-400">
																Phone
															</p>
															<p className="text-gray-200 font-mono">
																{contact.phone}
															</p>
														</div>
													</div>
													<div className="mb-4">
														<p className="text-sm text-gray-400">
															Message
														</p>
														<p className="text-gray-200 whitespace-pre-line">
															{contact.message}
														</p>
													</div>
													{contact.status !== 'resolved' && (
														<motion.button
															whileHover={{ scale: 1.04 }}
															whileTap={{ scale: 0.98 }}
															onClick={() =>
																markAsResolved(contact._id)
															}
															className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl flex items-center text-sm font-semibold shadow transition-all"
														>
															<CheckCircle2 className="h-4 w-4 mr-2" />
															Mark as Resolved
														</motion.button>
													)}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</motion.div>
							))}
						</div>
					)}
				</motion.div>
			)}
		</div>
	);
};

export default ContactPage;
