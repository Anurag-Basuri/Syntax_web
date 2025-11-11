import React, { useEffect, useState, useMemo } from 'react';
import {
	useGetAllContacts,
	useGetContactById,
	useMarkContactAsResolved,
	useDeleteContact,
} from '../hooks/useContact.js';

const ShowContacts = () => {
	const { getAllContacts, loading, error, reset } = useGetAllContacts();
	const {
		getContactById,
		contact: selectedContact,
		loading: loadingContact,
		error: errorContact,
		reset: resetContact,
	} = useGetContactById();
	const { markAsResolved, loading: resolving, error: errorResolve } = useMarkContactAsResolved();
	const { deleteContact, loading: deleting } = useDeleteContact();

	const [contacts, setContacts] = useState([]);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [totalDocs, setTotalDocs] = useState(0);

	const [expandedId, setExpandedId] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [showExportOptions, setShowExportOptions] = useState(false);
	const [exportType, setExportType] = useState('current');
	const [exportFormat, setExportFormat] = useState('csv');
	const [copiedEmail, setCopiedEmail] = useState(null);
	const [showMobileFilters, setShowMobileFilters] = useState(false);
	const [debouncedSearch, setDebouncedSearch] = useState('');

	// debounce searchTerm
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
		return () => clearTimeout(t);
	}, [searchTerm]);

	const params = useMemo(
		() => ({
			page,
			limit,
			search: debouncedSearch !== '' ? debouncedSearch : undefined,
			status: statusFilter !== 'all' ? statusFilter : undefined,
		}),
		[page, limit, debouncedSearch, statusFilter]
	);

	// Fetch contacts for current page via hook
	const fetchContacts = async (pageNum = 1) => {
		try {
			const resp = await getAllContacts({
				page: pageNum,
				limit,
				search: debouncedSearch || undefined,
				status: statusFilter !== 'all' ? statusFilter : undefined,
			});
			const docs = resp?.data?.docs || [];
			setContacts(docs);
			setTotalPages(resp?.data?.totalPages || 1);
			setTotalDocs(resp?.data?.totalDocs || 0);
		} catch (e) {
			// getAllContacts hook exposes error via `error` var; additional handling here optional
			console.error('Failed to fetch contacts', e);
		}
	};

	useEffect(() => {
		// reset page on filter/search change
		setPage(1);
	}, [debouncedSearch, statusFilter]);

	useEffect(() => {
		fetchContacts(page);
		// eslint-disable-next-line
	}, [page, debouncedSearch, statusFilter]);

	const handleRefresh = async () => {
		await fetchContacts(page);
	};

	const handleExpand = async (id) => {
		if (expandedId === id) {
			setExpandedId(null);
			resetContact();
		} else {
			setExpandedId(id);
			await getContactById(id);
		}
	};

	const handleResolve = async (id) => {
		try {
			await markAsResolved(id);
			setContacts((prev) =>
				prev.map((c) => (c._id === id ? { ...c, status: 'resolved' } : c))
			);
		} catch (e) {
			console.error('Resolve failed', e);
		}
	};

	const handleCopyEmail = (email) => {
		navigator.clipboard.writeText(email);
		setCopiedEmail(email);
		setTimeout(() => setCopiedEmail(null), 2000);
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Are you sure you want to delete this contact?')) return;
		try {
			await deleteContact(id);
			// refresh
			if (contacts.length === 1 && page > 1) setPage((p) => p - 1);
			else await fetchContacts(page);
			if (expandedId === id) setExpandedId(null);
		} catch (e) {
			alert('Failed to delete contact. Please try again.');
		}
	};

	const filteredContacts = contacts
		.filter((c) => {
			const s = debouncedSearch.toLowerCase();
			return (
				!s ||
				c.name.toLowerCase().includes(s) ||
				c.email.toLowerCase().includes(s) ||
				(c.subject || '').toLowerCase().includes(s)
			);
		})
		.filter((c) => statusFilter === 'all' || c.status === statusFilter);

	const getStatusColor = (status) => {
		switch (status) {
			case 'resolved':
				return 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30';
			case 'pending':
			default:
				return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30';
		}
	};

	// Export functionality
	const exportData = () => {
		const dataToExport = exportType === 'current' ? filteredContacts : contacts;

		if (dataToExport.length === 0) {
			alert('No data to export');
			return;
		}

		let content = '';
		const headers = [
			'Name',
			'Email',
			'Phone',
			'LPU ID',
			'Subject',
			'Status',
			'Created At',
			'Message',
		];

		// CSV format
		if (exportFormat === 'csv') {
			content += headers.join(',') + '\n';
			dataToExport.forEach((contact) => {
				content += `"${contact.name}","${contact.email}","${contact.phone}","${
					contact.lpuID
				}","${contact.subject || ''}","${contact.status}","${new Date(
					contact.createdAt
				).toLocaleString()}","${(contact.message || '').replace(/"/g, '""')}"\n`;
			});

			const blob = new Blob([content], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
		// JSON format
		else {
			const jsonData = dataToExport.map((contact) => ({
				name: contact.name,
				email: contact.email,
				phone: contact.phone,
				lpuID: contact.lpuID,
				subject: contact.subject,
				status: contact.status,
				createdAt: new Date(contact.createdAt).toISOString(),
				message: contact.message,
			}));

			const jsonString = JSON.stringify(jsonData, null, 2);
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `contacts-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}

		setShowExportOptions(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-8">
			{/* Export Modal */}
			{showExportOptions && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
					<div className="bg-gray-800/80 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-bold text-cyan-300">Export Options</h3>
							<button
								onClick={() => setShowExportOptions(false)}
								className="text-gray-400 hover:text-white transition-colors"
								aria-label="Close"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<p className="text-xs text-gray-400 mt-1">
									Exporting {filteredContacts.length} contacts
								</p>
							</div>

							<div>
								<label className="block text-gray-300 mb-2">Format</label>
								<div className="flex gap-3">
									{['csv', 'json'].map((format) => (
										<button
											key={format}
											onClick={() => setExportFormat(format)}
											className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
												exportFormat === format
													? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
													: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
											}`}
										>
											{format.toUpperCase()}
										</button>
									))}
								</div>
							</div>

							<div className="pt-4 flex justify-end gap-3">
								<button
									onClick={() => setShowExportOptions(false)}
									className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={exportData}
									className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center transition-colors shadow-lg shadow-cyan-500/30"
								>
									<svg
										className="w-5 h-5 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									Export Data
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Mobile Filters Panel */}
			{showMobileFilters && (
				<div className="fixed inset-0 z-40 flex items-start justify-center md:hidden">
					<div
						className="absolute inset-0 bg-black/60"
						onClick={() => setShowMobileFilters(false)}
					></div>
					<div className="relative mt-20 w-full max-w-md bg-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-xl p-5 shadow-2xl">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-white">Filters</h3>
							<button
								onClick={() => setShowMobileFilters(false)}
								className="text-gray-400 hover:text-white"
								aria-label="Close filters"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						<div className="mb-4">
							<label className="block text-gray-300 mb-2">Status</label>
							<div className="space-y-2">
								{['all', 'pending', 'resolved'].map((status) => (
									<div key={status} className="flex items-center group">
										<input
											type="radio"
											id={`m-status-${status}`}
											name="m-status"
											value={status}
											checked={statusFilter === status}
											onChange={() => setStatusFilter(status)}
											className="mr-2 accent-cyan-500 cursor-pointer"
										/>
										<label
											htmlFor={`m-status-${status}`}
											className="text-gray-300 capitalize cursor-pointer group-hover:text-white transition-colors"
										>
											{status}
										</label>
									</div>
								))}
							</div>
						</div>

						<div className="flex justify-between items-center mt-4">
							<button
								onClick={() => {
									setSearchTerm('');
									setStatusFilter('all');
									setShowMobileFilters(false);
								}}
								className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg"
							>
								Clear Filters
							</button>
							<button
								onClick={() => setShowMobileFilters(false)}
								className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
							>
								Apply
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
							Contact Queries
						</h1>
					</div>

					{/* Controls: responsive layout */}
					<div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 items-stretch md:items-center">
						<div className="flex gap-2 w-full sm:w-auto">
							<button
								onClick={() => setShowExportOptions(true)}
								title="Export contacts"
								className="flex-1 sm:flex-none px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								<span className="text-sm">Export</span>
							</button>

							<button
								onClick={handleRefresh}
								title="Refresh list"
								className="flex-1 sm:flex-none px-3 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm transition-colors flex items-center justify-center"
								disabled={loading}
							>
								{loading ? (
									<svg
										className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
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
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
										></path>
									</svg>
								) : (
									<svg
										className="w-4 h-4 mr-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"
										/>
									</svg>
								)}
								<span className="text-sm">
									{loading ? 'Refreshing...' : 'Refresh'}
								</span>
							</button>
						</div>

						{/* Search + Filters (responsive) */}
						<div className="flex gap-2 w-full md:ml-4">
							<div className="relative flex-1">
								<input
									type="text"
									placeholder="Search contacts..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="bg-gray-800/50 backdrop-blur-lg rounded-xl py-2 pl-10 pr-4 text-white border border-gray-700 focus:border-cyan-500 focus:outline-none w-full shadow-sm"
									aria-label="Search contacts"
								/>
								<svg
									className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>

							<button
								onClick={() => setShowMobileFilters(true)}
								className="px-3 py-2 bg-gray-800/60 text-gray-200 rounded-lg flex items-center justify-center sm:hidden"
								title="Filters"
								aria-label="Open filters"
							>
								<svg
									className="w-4 h-4 mr-1"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V18a1 1 0 01-1 1H10a1 1 0 01-1-1v-5.586L3.293 6.707A1 1 0 013 6V4z"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
					{/* Filters sidebar */}
					<aside className="md:col-span-3 hidden md:block">
						<div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl sticky top-4">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-semibold text-white">Filters</h3>
								<button
									onClick={() => {
										setSearchTerm('');
										setStatusFilter('all');
									}}
									className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center"
									title="Clear filters"
								>
									<svg
										className="w-4 h-4 mr-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M19 9l-7 7-7-7"
										/>
									</svg>
									Clear
								</button>
							</div>

							<div className="mb-6">
								<label className="block text-gray-300 mb-2">Status</label>
								<div className="space-y-2">
									{['all', 'pending', 'resolved'].map((status) => (
										<div key={status} className="flex items-center group">
											<input
												type="radio"
												id={`status-${status}`}
												name="status"
												value={status}
												checked={statusFilter === status}
												onChange={() => setStatusFilter(status)}
												className="mr-2 accent-cyan-500 cursor-pointer"
											/>
											<label
												htmlFor={`status-${status}`}
												className="text-gray-300 capitalize cursor-pointer group-hover:text-white transition-colors"
											>
												{status}
											</label>
										</div>
									))}
								</div>
							</div>

							<div className="mt-6 pt-4 border-t border-gray-700">
								<div className="flex items-center justify-between mb-2">
									<span className="text-gray-300">Total Contacts</span>
									<span className="text-white font-medium bg-gray-700/50 px-2 py-1 rounded-md">
										{totalDocs}
									</span>
								</div>
								<div className="flex items-center justify-between mb-2">
									<span className="text-gray-300">Pending</span>
									<span className="text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded-md">
										{contacts.filter((c) => c.status === 'pending').length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-gray-300">Resolved</span>
									<span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-md">
										{contacts.filter((c) => c.status === 'resolved').length}
									</span>
								</div>
							</div>
						</div>
					</aside>

					{/* Main content */}
					<main className="md:col-span-9">
						{loading && (
							<div className="flex flex-col items-center justify-center h-48 bg-gray-800/30 backdrop-blur-lg rounded-2xl border border-gray-700">
								<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-3"></div>
								<p className="text-gray-400 text-sm">Loading contacts...</p>
							</div>
						)}

						{error && (
							<div className="bg-red-900/30 backdrop-blur-lg rounded-2xl p-6 border border-red-700 shadow-xl">
								<div className="flex items-center text-red-300">
									<svg
										className="w-6 h-6 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<span className="text-lg font-medium">
										Error loading contacts: {error}
									</span>
								</div>
								<button
									onClick={reset}
									className="mt-4 px-4 py-2 bg-red-700/50 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
								>
									<svg
										className="w-5 h-5 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"
										/>
									</svg>
									Try Again
								</button>
							</div>
						)}

						{!loading && !error && (
							<>
								{filteredContacts.length === 0 ? (
									<div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl text-center">
										<div className="flex justify-center mb-3">
											<svg
												className="w-12 h-12 text-gray-500"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
										<h3 className="text-lg font-medium text-gray-300 mb-1">
											No contacts found
										</h3>
										<p className="text-gray-500 max-w-md mx-auto text-sm">
											{statusFilter !== 'all'
												? `There are no contacts with status "${statusFilter}" matching your search.`
												: 'No contacts match your search criteria. Try adjusting your filters.'}
										</p>
										<button
											onClick={() => {
												setSearchTerm('');
												setStatusFilter('all');
											}}
											className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-colors"
										>
											Clear Filters
										</button>
									</div>
								) : (
									<div className="space-y-4">
										{filteredContacts.map((contact) => (
											<article
												key={contact._id}
												className={`bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/30 ${
													expandedId === contact._id
														? 'ring-2 ring-cyan-500 border-cyan-500/50'
														: ''
												}`}
											>
												<div
													className={`p-4 sm:p-5 cursor-pointer transition-all duration-200 ${
														contact.status === 'pending'
															? 'bg-gradient-to-r from-cyan-900/10 to-blue-900/10 border-l-4 border-cyan-500'
															: ''
													}`}
													onClick={() => handleExpand(contact._id)}
												>
													<div className="flex items-start justify-between gap-3">
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-3">
																<h3 className="text-base sm:text-lg font-semibold text-white truncate">
																	{contact.name}
																</h3>
																{contact.status === 'pending' && (
																	<span className="ml-1 px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full animate-pulse flex items-center">
																		<svg
																			className="w-3 h-3 mr-1"
																			fill="none"
																			stroke="currentColor"
																			viewBox="0 0 24 24"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth="2"
																				d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
																			/>
																		</svg>
																		New
																	</span>
																)}
															</div>
															<div className="flex items-center mt-1 text-sm flex-wrap gap-2">
																<span className="text-gray-400 truncate flex items-center">
																	<svg
																		className="w-4 h-4 mr-1"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth="2"
																			d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
																		/>
																	</svg>
																	{contact.email}
																</span>
																<span className="mx-1 text-gray-600 hidden sm:inline">
																	•
																</span>
																<span className="text-cyan-400 truncate flex items-center max-w-xs">
																	<svg
																		className="w-4 h-4 mr-1"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth="2"
																			d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
																		/>
																	</svg>
																	{contact.subject || '—'}
																</span>
															</div>
														</div>

														<div className="flex items-center space-x-3">
															<div
																className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
																	contact.status
																)}`}
															>
																{contact.status}
															</div>
															<div className="text-xs text-gray-500 flex items-center">
																<svg
																	className="w-4 h-4 mr-1"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth="2"
																		d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
																	/>
																</svg>
																{new Date(
																	contact.createdAt
																).toLocaleDateString()}
															</div>
														</div>
													</div>

													{expandedId === contact._id &&
														(loadingContact ? (
															<div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-3">
																<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500"></div>
																<p className="text-gray-400 text-sm">
																	Loading details...
																</p>
															</div>
														) : selectedContact ? (
															<div className="mt-4 pt-4 border-t border-gray-700">
																<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
																	<div>
																		<h4 className="text-gray-400 text-sm font-medium mb-1 flex items-center">
																			Name
																		</h4>
																		<p className="text-gray-300 text-sm">
																			{selectedContact.name}
																		</p>
																	</div>
																	<div>
																		<h4 className="text-gray-400 text-sm font-medium mb-1 flex items-center">
																			Email
																		</h4>
																		<p className="text-gray-300 text-sm">
																			{selectedContact.email}
																		</p>
																	</div>
																	<div>
																		<h4 className="text-gray-400 text-sm font-medium mb-1 flex items-center">
																			Phone
																		</h4>
																		<p className="text-gray-300 text-sm">
																			{selectedContact.phone}
																		</p>
																	</div>
																	<div>
																		<h4 className="text-gray-400 text-sm font-medium mb-1 flex items-center">
																			Subject
																		</h4>
																		<p className="text-gray-300 text-sm">
																			{
																				selectedContact.subject
																			}
																		</p>
																	</div>
																	<div className="sm:col-span-2">
																		<h4 className="text-gray-400 text-sm font-medium mb-1 flex items-center">
																			Message
																		</h4>
																		<p className="text-gray-300 text-sm bg-gray-900/30 rounded-lg p-3 whitespace-pre-wrap">
																			{
																				selectedContact.message
																			}
																		</p>
																	</div>
																	<div>
																		<h4 className="text-gray-400 text-sm font-medium mb-1 flex items-center">
																			Status
																		</h4>
																		<p className="text-gray-300 text-sm">
																			{selectedContact.status}
																		</p>
																	</div>
																	<div>
																		<h4 className="text-gray-400 text-sm font-medium mb-1 flex items-center">
																			Created At
																		</h4>
																		<p className="text-gray-300 text-sm">
																			{new Date(
																				selectedContact.createdAt
																			).toLocaleString()}
																		</p>
																	</div>
																</div>

																<div className="mt-4 flex flex-wrap gap-2">
																	{selectedContact.status ===
																		'pending' && (
																		<button
																			className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center disabled:opacity-50"
																			disabled={resolving}
																			onClick={() =>
																				handleResolve(
																					contact._id
																				)
																			}
																		>
																			{resolving ? (
																				<>
																					<svg
																						className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
																							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
																						></path>
																					</svg>
																					Processing...
																				</>
																			) : (
																				<>
																					<svg
																						className="w-4 h-4 mr-1"
																						fill="none"
																						stroke="currentColor"
																						viewBox="0 0 24 24"
																					>
																						<path
																							strokeLinecap="round"
																							strokeLinejoin="round"
																							strokeWidth="2"
																							d="M5 13l4 4L19 7"
																						/>
																					</svg>
																					Mark as Resolved
																				</>
																			)}
																		</button>
																	)}
																	<button
																		className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition flex items-center"
																		onClick={() =>
																			handleCopyEmail(
																				contact.email
																			)
																		}
																	>
																		{copiedEmail ===
																		contact.email ? (
																			<>
																				<svg
																					className="w-4 h-4 mr-1 text-emerald-400"
																					fill="none"
																					stroke="currentColor"
																					viewBox="0 0 24 24"
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						strokeWidth="2"
																						d="M5 13l4 4L19 7"
																					/>
																				</svg>
																				Copped!
																			</>
																		) : (
																			<>
																				<svg
																					className="w-4 h-4 mr-1"
																					fill="none"
																					stroke="currentColor"
																					viewBox="0 0 24 24"
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						strokeWidth="2"
																						d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
																					/>
																				</svg>
																				Copy Email
																			</>
																		)}
																	</button>
																	{errorResolve && (
																		<div className="text-red-400 mt-2 text-sm w-full">
																			{errorResolve}
																		</div>
																	)}
																</div>
															</div>
														) : (
															<div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-400">
																Failed to load contact details
															</div>
														))}
												</div>

												<div className="px-4 py-3 bg-gray-800/70 border-t border-gray-700 flex justify-between items-center text-sm">
													<div className="text-xs text-gray-500 font-mono truncate">
														ID: {contact._id}
													</div>
													<div className="flex items-center gap-2">
														<button
															onClick={() =>
																handleDelete(contact._id)
															}
															className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
														>
															Delete
														</button>
													</div>
												</div>
											</article>
										))}
									</div>
								)}
							</>
						)}
					</main>
				</div>

				{/* Pagination Controls */}
				{totalPages > 1 && (
					<div className="flex justify-center mt-8">
						{(() => {
							// build a compact page list with ellipses for large page counts
							const maxButtons = 7;
							const pages = [];
							if (totalPages <= maxButtons) {
								for (let i = 1; i <= totalPages; i++) pages.push(i);
							} else {
								pages.push(1);
								const left = Math.max(2, page - 2);
								const right = Math.min(totalPages - 1, page + 2);
								if (left > 2) pages.push('left-ellipsis');
								for (let i = left; i <= right; i++) pages.push(i);
								if (right < totalPages - 1) pages.push('right-ellipsis');
								pages.push(totalPages);
							}

							return (
								<nav
									className="inline-flex items-center rounded-md shadow-sm overflow-auto px-2"
									aria-label="Pagination"
								>
									<button
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
										className={`px-3 py-2 md:px-4 md:py-2 rounded-l-md border border-gray-700 bg-gray-800 text-gray-300 hover:bg-cyan-700 hover:text-white transition ${
											page === 1 ? 'opacity-50 cursor-not-allowed' : ''
										}`}
										aria-label="Previous page"
									>
										Prev
									</button>

									{/* Desktop / wide screens: show compact buttons; mobile: show page indicator */}
									<div className="hidden sm:flex items-center gap-1 mx-2">
										{pages.map((p, idx) =>
											p === 'left-ellipsis' || p === 'right-ellipsis' ? (
												<span
													key={p + idx}
													className="px-3 py-2 text-gray-400 select-none"
												>
													…
												</span>
											) : (
												<button
													key={p}
													onClick={() => setPage(p)}
													aria-current={p === page ? 'page' : undefined}
													className={`min-w-[44px] px-3 py-2 border-t border-b border-gray-700 bg-gray-800 text-gray-300 hover:bg-cyan-700 hover:text-white transition ${
														page === p
															? 'bg-cyan-700 text-white font-semibold ring-1 ring-cyan-400'
															: ''
													}`}
												>
													{p}
												</button>
											)
										)}
									</div>

									<div className="flex sm:hidden items-center gap-3 mx-2 px-2 text-sm text-gray-300">
										<span className="whitespace-nowrap">Page</span>
										<span className="font-medium">{page}</span>
										<span className="text-gray-500">/</span>
										<span className="font-medium">{totalPages}</span>
									</div>

									<button
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={page === totalPages}
										className={`px-3 py-2 md:px-4 md:py-2 rounded-r-md border border-gray-700 bg-gray-800 text-gray-300 hover:bg-cyan-700 hover:text-white transition ${
											page === totalPages
												? 'opacity-50 cursor-not-allowed'
												: ''
										}`}
										aria-label="Next page"
									>
										Next
									</button>
								</nav>
							);
						})()}
					</div>
				)}
			</div>
		</div>
	);
};

export default ShowContacts;
