import { useEffect, useState, useMemo } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useApplications, useApplication, useManageApplication } from '../hooks/useApplications.js';
import { markApplicationAsSeen } from '../services/applyServices.js';

const ShowApplies = () => {
	// local view state
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [seenFilter, setSeenFilter] = useState('all');
	const [sortOption, setSortOption] = useState('newest');
	const [expandedId, setExpandedId] = useState(null);
	const [copiedEmail, setCopiedEmail] = useState(null);
	const [showExport, setShowExport] = useState(false);
	const [exportFormat, setExportFormat] = useState('csv');
	const [showMobileFilters, setShowMobileFilters] = useState(false);
	const [errorMsg, setErrorMsg] = useState(null);

	const queryClient = useQueryClient();

	// debounce search
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
		return () => clearTimeout(t);
	}, [searchTerm]);

	const buildQuery = useMemo(() => {
		const q = { page, limit };
		if (statusFilter && statusFilter !== 'all') q.status = statusFilter;
		if (seenFilter === 'seen') q.seen = 'true';
		if (seenFilter === 'notseen') q.seen = 'false';
		if (debouncedSearch) q.search = debouncedSearch;
		return q;
	}, [page, limit, statusFilter, seenFilter, debouncedSearch]);

	// query for list
	const applicationsQuery = useApplications(buildQuery);

	// detail query for expanded item
	const applicationDetailQuery = useApplication(expandedId);

	// mutations for update/delete (from hook)
	const { updateStatus, isUpdating, removeApplication, isDeleting } = useManageApplication();

	// local mutation for mark-as-seen
	const { mutateAsync: markAsSeenMut, isLoading: markLoading } = useMutation({
		mutationFn: (id) => markApplicationAsSeen(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['application'] });
		},
		onError: (err) => {
			console.error('Failed to mark seen:', err);
		},
	});

	// derived UI state from query
	const loading = applicationsQuery.isLoading || applicationsQuery.isFetching;
	const payload = applicationsQuery.data ?? {};
	const paginated = payload?.data ?? payload;
	const applications = paginated?.docs ?? [];
	const totalPages = paginated?.totalPages ?? 1;
	const totalDocs = paginated?.totalDocs ?? 0;

	// helper to refresh list
	const fetchApplications = async (p = page) => {
		setErrorMsg(null);
		try {
			await applicationsQuery.refetch();
		} catch (err) {
			setErrorMsg(err?.message ?? 'Failed to load applications');
		}
	};

	// reset to first page when filters/search change
	useEffect(() => {
		setPage(1);
	}, [statusFilter, seenFilter, debouncedSearch]);

	// refetch when page changes (buildQuery memo depends on page so hook will auto-run,
	// still expose explicit refetch when user presses Refresh)
	useEffect(() => {
		// applicationsQuery will auto-fetch because buildQuery changed
		// nothing else required here
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	const handleExpand = (id) => {
		if (expandedId === id) {
			setExpandedId(null);
			// clear detail query cache entry for tidiness (optional)
			queryClient.removeQueries({ queryKey: ['application', id], exact: true });
			return;
		}
		setExpandedId(id);
		// useApplication hook will fetch automatically when expandedId is set
	};

	const handleStatusUpdate = async (id, status) => {
		try {
			// wrap mutate to use promise-style callbacks
			await new Promise((resolve, reject) => {
				updateStatus(
					{ id, status },
					{
						onSuccess: () => {
							// optimistic UI update for current page
							queryClient.setQueryData(['applications', buildQuery], (old) => {
								if (!old) return old;
								const data = old?.data ?? old;
								const docs = data?.docs?.map((d) =>
									d._id === id ? { ...d, status } : d
								);
								const next = { ...data, docs };
								return { ...old, data: next };
							});
							resolve();
						},
						onError: (err) => reject(err),
					}
				);
			});
		} catch (err) {
			setErrorMsg(err?.message ?? 'Failed to update status');
		}
	};

	const handleMarkAsSeen = async (id) => {
		try {
			await markAsSeenMut(id);
			// update local list quickly
			queryClient.setQueryData(['applications', buildQuery], (old) => {
				if (!old) return old;
				const data = old?.data ?? old;
				const docs = data?.docs?.map((d) => (d._id === id ? { ...d, seen: true } : d));
				const next = { ...data, docs };
				return { ...old, data: next };
			});
		} catch (err) {
			setErrorMsg(err?.message ?? 'Failed to mark seen');
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this application?')) return;
		try {
			await new Promise((resolve, reject) => {
				removeApplication(id, {
					onSuccess: () => resolve(),
					onError: (err) => reject(err),
				});
			});
			// after delete, refresh current page
			if (applications.length === 1 && page > 1) {
				setPage((s) => s - 1);
			} else {
				await fetchApplications(page);
			}
			if (expandedId === id) setExpandedId(null);
		} catch (err) {
			setErrorMsg(err?.message ?? 'Failed to delete');
		}
	};

	const copyEmail = (email) => {
		if (!navigator?.clipboard) return;
		navigator.clipboard.writeText(email).then(() => {
			setCopiedEmail(email);
			setTimeout(() => setCopiedEmail(null), 1200);
		});
	};

	// client-side sort (server returns paginated set already filtered by search/filters)
	const sorted = [...applications].sort((a, b) =>
		sortOption === 'newest'
			? new Date(b.createdAt) - new Date(a.createdAt)
			: new Date(a.createdAt) - new Date(b.createdAt)
	);

	const exportData = () => {
		const data = sorted;
		if (!data.length) {
			alert('No data to export');
			return;
		}
		if (exportFormat === 'csv') {
			const headers = [
				'Name',
				'LPU ID',
				'Email',
				'Phone',
				'Course',
				'Domains',
				'Bio',
				'Status',
				'Seen',
				'Created At',
			];
			const rows = data.map((r) =>
				[
					`"${r.fullName || ''}"`,
					`"${r.LpuId || ''}"`,
					`"${r.email || ''}"`,
					`"${r.phone || ''}"`,
					`"${r.course || ''}"`,
					`"${r.domains || ''}"`,
					`"${r.bio || ''}"`,
					`"${r.status || ''}"`,
					`"${r.seen ? 'Yes' : 'No'}"`,
					`"${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}"`,
				].join(',')
			);
			const csv = [headers.join(','), ...rows].join('\n');
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} else {
			const json = JSON.stringify(
				data.map((r) => ({
					fullName: r.fullName,
					LpuId: r.LpuId,
					email: r.email,
					phone: r.phone,
					course: r.course,
					domains: r.domains,
					bio: r.bio,
					status: r.status,
					seen: !!r.seen,
					createdAt: r.createdAt,
				})),
				null,
				2
			);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `applications-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		}
		setShowExport(false);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'approved':
				return 'bg-emerald-900/50 text-emerald-200 ring-1 ring-emerald-500/50';
			case 'rejected':
				return 'bg-rose-900/50 text-rose-200 ring-1 ring-rose-500/50';
			default:
				return 'bg-amber-900/50 text-amber-200 ring-1 ring-amber-500/50';
		}
	};

	return (
		<div className="min-h-screen bg-slate-950 relative overflow-hidden">
			{/* Background effects */}
			<div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-cyan-900/20"></div>
			<div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
			<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

			<div className="relative z-10 p-4 md:p-8">
				{/* Error banner */}
				{errorMsg && (
					<div className="max-w-7xl mx-auto mb-6">
						<div className="bg-red-900/50 backdrop-blur-sm border border-red-500/30 text-red-100 p-4 rounded-2xl shadow-2xl">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
										<span className="text-white text-xs">!</span>
									</div>
									<span>{errorMsg}</span>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => fetchApplications(page)}
										className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition-colors"
									>
										Retry
									</button>
									<button
										onClick={() => setErrorMsg(null)}
										className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
									>
										Dismiss
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Export modal */}
				{showExport && (
					<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
						<div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md border border-cyan-500/30 shadow-2xl">
							<div className="flex justify-between items-center mb-6">
								<h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
									Export Applications
								</h3>
								<button
									onClick={() => setShowExport(false)}
									className="text-gray-400 hover:text-white transition-colors"
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
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
							<div className="space-y-6">
								<div>
									<label className="block text-gray-300 mb-3 font-medium">
										Format
									</label>
									<div className="grid grid-cols-2 gap-3">
										{['csv', 'json'].map((f) => (
											<button
												key={f}
												onClick={() => setExportFormat(f)}
												className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
													exportFormat === f
														? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
														: 'bg-slate-700 text-gray-300 hover:bg-slate-600'
												}`}
											>
												{f.toUpperCase()}
											</button>
										))}
									</div>
								</div>

								<div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
									<button
										onClick={() => setShowExport(false)}
										className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-xl transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={exportData}
										className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25"
									>
										Export
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Mobile Filters */}
				{showMobileFilters && (
					<div className="fixed inset-0 z-40 flex items-start justify-center md:hidden">
						<div
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setShowMobileFilters(false)}
						/>
						<div className="relative mt-20 w-full max-w-md bg-slate-800/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 mx-4 shadow-2xl">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-bold text-white">Filters</h3>
								<button
									onClick={() => setShowMobileFilters(false)}
									className="text-gray-400 hover:text-white transition-colors"
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
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							<div className="space-y-6">
								<div>
									<label className="block text-gray-300 mb-3 font-medium">
										Status
									</label>
									<div className="space-y-3">
										{['all', 'pending', 'approved', 'rejected'].map((s) => (
											<label
												key={s}
												className="flex items-center gap-3 cursor-pointer"
											>
												<input
													type="radio"
													name="m-status"
													checked={statusFilter === s}
													onChange={() => setStatusFilter(s)}
													className="w-4 h-4 text-cyan-600"
												/>
												<span className="capitalize text-gray-300">
													{s}
												</span>
											</label>
										))}
									</div>
								</div>

								<div>
									<label className="block text-gray-300 mb-3 font-medium">
										Seen
									</label>
									<div className="space-y-3">
										{['all', 'seen', 'notseen'].map((s) => (
											<label
												key={s}
												className="flex items-center gap-3 cursor-pointer"
											>
												<input
													type="radio"
													name="m-seen"
													checked={seenFilter === s}
													onChange={() => setSeenFilter(s)}
													className="w-4 h-4 text-cyan-600"
												/>
												<span className="text-gray-300">
													{s === 'notseen' ? 'Not Seen' : s}
												</span>
											</label>
										))}
									</div>
								</div>

								<div className="flex justify-between pt-6 border-t border-slate-700">
									<button
										onClick={() => {
											setSearchTerm('');
											setDebouncedSearch('');
											setStatusFilter('all');
											setSeenFilter('all');
											setShowMobileFilters(false);
										}}
										className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-xl transition-colors"
									>
										Clear
									</button>
									<button
										onClick={() => setShowMobileFilters(false)}
										className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl transition-colors"
									>
										Apply
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
						<div>
							<h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
								Job Applications
							</h1>
						</div>

						<div className="flex gap-3 w-full lg:w-auto">
							<div className="relative flex-1 lg:w-80">
								<input
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder="Search by name, LPU ID, or email..."
									className="bg-slate-800/50 backdrop-blur-sm rounded-2xl py-3 pl-12 pr-4 text-white border border-slate-700 w-full focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
								/>
								<svg
									className="w-5 h-5 text-gray-400 absolute left-4 top-3.5"
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
								className="px-4 py-3 bg-slate-800/60 backdrop-blur-sm text-gray-200 rounded-2xl lg:hidden border border-slate-700 hover:bg-slate-700 transition-colors"
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
										strokeWidth={2}
										d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
									/>
								</svg>
							</button>

							<button
								onClick={() => setShowExport(true)}
								className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl transition-all duration-200 shadow-lg shadow-cyan-500/25 font-medium"
							>
								Export
							</button>

							<button
								onClick={() => fetchApplications(page)}
								className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl transition-colors font-medium border border-slate-600"
								disabled={loading}
							>
								{loading ? (
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
										Loading...
									</div>
								) : (
									'Refresh'
								)}
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
						{/* Sidebar */}
						<aside className="xl:col-span-3 hidden lg:block">
							<div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 sticky top-8 shadow-2xl">
								<div className="flex justify-between items-center mb-6">
									<h3 className="text-xl font-bold text-white">Filters</h3>
									<button
										onClick={() => {
											setSearchTerm('');
											setDebouncedSearch('');
											setStatusFilter('all');
											setSeenFilter('all');
										}}
										className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
									>
										Clear All
									</button>
								</div>

								<div className="space-y-6">
									<div>
										<label className="block text-gray-300 mb-3 font-medium">
											Status
										</label>
										<div className="space-y-3">
											{['all', 'pending', 'approved', 'rejected'].map((s) => (
												<label
													key={s}
													className="flex items-center gap-3 cursor-pointer group"
												>
													<input
														type="radio"
														name="status"
														checked={statusFilter === s}
														onChange={() => setStatusFilter(s)}
														className="w-4 h-4 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
													/>
													<span className="capitalize text-gray-300 group-hover:text-white transition-colors">
														{s}
													</span>
												</label>
											))}
										</div>
									</div>

									<div>
										<label className="block text-gray-300 mb-3 font-medium">
											Seen Status
										</label>
										<div className="space-y-3">
											{['all', 'seen', 'notseen'].map((s) => (
												<label
													key={s}
													className="flex items-center gap-3 cursor-pointer group"
												>
													<input
														type="radio"
														name="seen"
														checked={seenFilter === s}
														onChange={() => setSeenFilter(s)}
														className="w-4 h-4 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
													/>
													<span className="text-gray-300 group-hover:text-white transition-colors">
														{s === 'notseen'
															? 'Not Seen'
															: s === 'all'
															? 'All'
															: 'Seen'}
													</span>
												</label>
											))}
										</div>
									</div>

									<div className="pt-6 border-t border-slate-700">
										<h4 className="text-gray-300 font-medium mb-4">
											Statistics
										</h4>
										<div className="space-y-3 text-sm">
											<div className="flex justify-between items-center">
												<span className="text-gray-400">
													Total Applications
												</span>
												<span className="font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-lg">
													{totalDocs}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-gray-400">
													Unseen (Current Page)
												</span>
												<span className="font-bold text-amber-400 bg-amber-900/30 px-2 py-1 rounded-lg">
													{applications.filter((a) => !a.seen).length}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-gray-400">
													Pending (Current Page)
												</span>
												<span className="font-bold text-orange-400 bg-orange-900/30 px-2 py-1 rounded-lg">
													{
														applications.filter(
															(a) => a.status === 'pending'
														).length
													}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</aside>

						{/* Main Content */}
						<main className="xl:col-span-9">
							{loading && (
								<div className="flex flex-col items-center justify-center h-64 bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-slate-700">
									<div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
									<p className="text-gray-400 text-lg">Loading applications...</p>
								</div>
							)}

							{!loading && !applications.length && !errorMsg && (
								<div className="flex flex-col items-center justify-center h-64 bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-slate-700">
									<div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
										<svg
											className="w-8 h-8 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									</div>
									<p className="text-gray-400 text-lg">No applications found</p>
									<p className="text-gray-500 text-sm mt-1">
										Try adjusting your filters or search terms
									</p>
								</div>
							)}

							<div className="space-y-4">
								{sorted.map((app) => (
									<article
										key={app._id}
										className={`group bg-slate-800/40 backdrop-blur-xl rounded-3xl border transition-all duration-300 hover:shadow-2xl ${
											expandedId === app._id
												? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
												: 'border-slate-700/50 hover:border-slate-600'
										}`}
									>
										<div className="p-6">
											<div
												className="flex justify-between items-start gap-4 cursor-pointer"
												onClick={() => handleExpand(app._id)}
											>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-3 mb-2">
														<h3 className="text-xl font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
															{app.fullName}
														</h3>
														{!app.seen && (
															<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-900/50 text-amber-200 ring-1 ring-amber-500/50">
																New
															</span>
														)}
													</div>
													<div className="text-gray-400 mb-1 flex items-center gap-2">
														<svg
															className="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M16 12a4 4 0 10-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
															/>
														</svg>
														<span className="truncate">
															{app.email}
														</span>
														<span className="text-gray-500">•</span>
														<span>{app.LpuId}</span>
													</div>
													<div className="text-sm text-gray-500 flex items-center gap-2">
														<svg
															className="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
														{new Date(app.createdAt).toLocaleString()}
													</div>
												</div>

												<div className="flex items-start gap-3">
													<div
														className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
															app.status
														)}`}
													>
														{app.status}
													</div>
													<button
														onClick={(e) => {
															e.stopPropagation();
															setExpandedId(
																expandedId === app._id
																	? null
																	: app._id
															);
														}}
														className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
													>
														{expandedId === app._id ? 'Close' : 'View'}
													</button>
												</div>
											</div>

											{expandedId === app._id && (
												<div className="mt-6 pt-6 border-t border-slate-700">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
														<div className="space-y-4">
															<div>
																<label className="text-sm font-medium text-gray-400">
																	Phone
																</label>
																<p className="text-white mt-1">
																	{app.phone || 'N/A'}
																</p>
															</div>
															<div>
																<label className="text-sm font-medium text-gray-400">
																	Course
																</label>
																<p className="text-white mt-1">
																	{app.course || 'N/A'}
																</p>
															</div>
														</div>
														<div className="space-y-4">
															<div>
																<label className="text-sm font-medium text-gray-400">
																	Domains
																</label>
																<p className="text-white mt-1">
																	{Array.isArray(app.domains)
																		? app.domains.join(', ')
																		: app.domains || 'N/A'}
																</p>
															</div>
															<div>
																<label className="text-sm font-medium text-gray-400">
																	Bio
																</label>
																<p className="text-white mt-1 max-h-20 overflow-y-auto">
																	{app.bio || 'N/A'}
																</p>
															</div>
														</div>
													</div>

													<div className="flex flex-wrap gap-3 mb-4">
														<button
															onClick={() =>
																handleStatusUpdate(
																	app._id,
																	'approved'
																)
															}
															disabled={isUpdating}
															className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{isUpdating ? 'Updating...' : 'Approve'}
														</button>
														<button
															onClick={() =>
																handleStatusUpdate(
																	app._id,
																	'rejected'
																)
															}
															disabled={isUpdating}
															className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{isUpdating ? 'Updating...' : 'Reject'}
														</button>
														<button
															onClick={() => copyEmail(app.email)}
															className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
														>
															{copiedEmail === app.email
																? 'Copied!'
																: 'Copy Email'}
														</button>
														<button
															onClick={() =>
																handleMarkAsSeen(app._id)
															}
															disabled={markLoading || app.seen}
															className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{markLoading
																? 'Marking...'
																: app.seen
																? 'Seen'
																: 'Mark Seen'}
														</button>
														<button
															onClick={() => handleDelete(app._id)}
															disabled={isDeleting}
															className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{isDeleting ? 'Deleting...' : 'Delete'}
														</button>
													</div>

													<div className="text-xs text-gray-500 font-mono bg-slate-900/50 p-2 rounded-lg">
														ID: {app._id}
													</div>
												</div>
											)}
										</div>
									</article>
								))}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex justify-center mt-12">
									<nav className="inline-flex items-center bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-2 shadow-2xl">
										<button
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
											className="px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
										>
											Previous
										</button>

										<div className="hidden sm:flex items-center gap-1 mx-4">
											{(() => {
												const maxButtons = 7;
												const pages = [];
												if (totalPages <= maxButtons) {
													for (let i = 1; i <= totalPages; i++)
														pages.push(i);
												} else {
													pages.push(1);
													const left = Math.max(2, page - 2);
													const right = Math.min(
														totalPages - 1,
														page + 2
													);
													if (left > 2) pages.push('left-ellipsis');
													for (let i = left; i <= right; i++)
														pages.push(i);
													if (right < totalPages - 1)
														pages.push('right-ellipsis');
													pages.push(totalPages);
												}
												return pages.map((p, idx) =>
													p === 'left-ellipsis' ||
													p === 'right-ellipsis' ? (
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
															className={`min-w-[44px] px-3 py-2 rounded-xl font-medium transition-all duration-200 ${
																page === p
																	? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
																	: 'text-gray-300 hover:text-white hover:bg-slate-700'
															}`}
														>
															{p}
														</button>
													)
												);
											})()}
										</div>

										<div className="flex sm:hidden items-center gap-3 mx-4 text-sm text-gray-300">
											<span>Page</span>
											<span className="font-bold text-cyan-400">{page}</span>
											<span className="text-gray-500">/</span>
											<span className="font-bold text-cyan-400">
												{totalPages}
											</span>
										</div>

										<button
											onClick={() =>
												setPage((p) => Math.min(totalPages, p + 1))
											}
											disabled={page === totalPages}
											className="px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
										>
											Next
										</button>
									</nav>
								</div>
							)}
						</main>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ShowApplies;
