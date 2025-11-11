import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	useApplications,
	useManageApplication,
	useApplicationStats,
} from '../hooks/useApplications.js';
import {
	getAllApplications as fetchAllApplicationsService,
	markApplicationAsSeen as markAsSeenService,
	bulkUpdateApplicationStatus as bulkUpdateService,
} from '../services/applyServices.js';
import { toast } from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme.js';

const Toolbar = ({
	search,
	setSearch,
	onRefresh,
	onExportPage,
	onExportAll,
	anySelected,
	onBulkApprove,
	onBulkReject,
	onBulkDelete,
}) => (
	<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
		<div className="flex items-center gap-3 w-full md:w-auto">
			<div className="relative w-full md:w-96">
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by name, LPU ID, email..."
					className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/6 placeholder:text-slate-400 text-white border border-white/8 focus:outline-none focus:ring-2 focus:ring-cyan-400"
				/>
				<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
			</div>

			<button
				onClick={onRefresh}
				className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/6 text-sm"
			>
				⟳ Refresh
			</button>
		</div>

		<div className="flex items-center gap-2 flex-wrap">
			<button
				onClick={onExportPage}
				className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md text-sm"
			>
				Export page
			</button>
			<button onClick={onExportAll} className="px-4 py-2 rounded-xl bg-cyan-700/80 text-sm">
				Export all
			</button>

			<button
				onClick={onBulkApprove}
				disabled={!anySelected}
				className={`px-4 py-2 rounded-xl text-sm ${
					anySelected ? 'bg-emerald-500' : 'bg-white/5 text-slate-400'
				}`}
			>
				Approve
			</button>
			<button
				onClick={onBulkReject}
				disabled={!anySelected}
				className={`px-4 py-2 rounded-xl text-sm ${
					anySelected ? 'bg-rose-500' : 'bg-white/5 text-slate-400'
				}`}
			>
				Reject
			</button>
			<button
				onClick={onBulkDelete}
				disabled={!anySelected}
				className={`px-4 py-2 rounded-xl text-sm ${
					anySelected ? 'bg-rose-700' : 'bg-white/5 text-slate-400'
				}`}
			>
				Delete
			</button>
		</div>
	</div>
);

const StatusBadge = ({ status }) => {
	const map = {
		approved: 'bg-emerald-600 text-emerald-50',
		rejected: 'bg-rose-600 text-rose-50',
		pending: 'bg-amber-600 text-amber-50',
	};
	return (
		<span
			className={`px-3 py-1 rounded-full text-xs font-semibold ${
				map[status] || 'bg-slate-600'
			}`}
		>
			{status}
		</span>
	);
};

const Card = ({ item, onToggle, expanded, selected, onSelect, onApprove, onReject, onDelete }) => (
	<article className="group relative bg-gradient-to-br from-white/3 to-white/2 border border-white/6 rounded-2xl p-4 hover:shadow-2xl transition-transform transform hover:-translate-y-1">
		<div className="flex items-start justify-between gap-4">
			<div className="flex items-start gap-4 min-w-0">
				<input
					type="checkbox"
					checked={!!selected}
					onChange={(e) => onSelect(item._id, e.target.checked)}
					className="mt-1 accent-cyan-400"
				/>
				<div className="min-w-0">
					<h3 className="text-lg font-semibold text-white truncate">{item.fullName}</h3>
					<div className="text-sm text-slate-300 truncate">
						{item.email} • {item.LpuId}
					</div>
					<div className="text-xs text-slate-400 mt-1">
						{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<StatusBadge status={item.status} />
				<button
					onClick={() => onApprove(item._id)}
					className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm"
				>
					✓
				</button>
				<button
					onClick={() => onReject(item._id)}
					className="px-3 py-1 rounded-lg bg-rose-600 text-white text-sm"
				>
					✕
				</button>
				<button
					onClick={() => onToggle(item._id)}
					className="px-3 py-1 rounded-lg bg-white/6 text-sm"
				>
					{expanded ? 'Close' : 'View'}
				</button>
				<button
					onClick={() => onDelete(item._id)}
					className="px-3 py-1 rounded-lg bg-white/6 text-sm"
				>
					🗑
				</button>
			</div>
		</div>

		{expanded && (
			<div className="mt-4 border-t border-white/6 pt-3 text-sm text-slate-200">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div>
						<strong>Phone:</strong>{' '}
						<span className="text-slate-300">{item.phone || 'N/A'}</span>
					</div>
					<div>
						<strong>Course:</strong>{' '}
						<span className="text-slate-300">{item.course || 'N/A'}</span>
					</div>
					<div className="col-span-1 md:col-span-3">
						<strong>Bio:</strong>
						<div className="mt-2 p-3 bg-white/5 rounded">{item.bio || '—'}</div>
					</div>
				</div>
			</div>
		)}
	</article>
);

const Pagination = ({ page, totalPages, onPageChange }) => {
	const pagesToShow = 5;
	let start = Math.max(1, page - Math.floor(pagesToShow / 2));
	let end = Math.min(totalPages, start + pagesToShow - 1);
	if (end - start < pagesToShow - 1) start = Math.max(1, end - pagesToShow + 1);
	const pages = [];
	for (let i = start; i <= end; i++) pages.push(i);

	return (
		<div className="flex items-center gap-3 justify-center mt-6">
			<button onClick={() => onPageChange(1)} className="px-3 py-1 rounded bg-white/6">
				«
			</button>
			<button
				onClick={() => onPageChange(Math.max(1, page - 1))}
				className="px-3 py-1 rounded bg-white/6"
			>
				Prev
			</button>
			{pages.map((p) => (
				<button
					key={p}
					onClick={() => onPageChange(p)}
					className={`px-3 py-1 rounded ${
						p === page
							? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
							: 'bg-white/5'
					}`}
				>
					{p}
				</button>
			))}
			<button
				onClick={() => onPageChange(Math.min(totalPages, page + 1))}
				className="px-3 py-1 rounded bg-white/6"
			>
				Next
			</button>
			<button
				onClick={() => onPageChange(totalPages)}
				className="px-3 py-1 rounded bg-white/6"
			>
				»
			</button>
		</div>
	);
};

const ShowApplies = () => {
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [search, setSearch] = useState('');
	const [debounced, setDebounced] = useState('');
	const [status, setStatus] = useState('all');
	const [expandedId, setExpandedId] = useState(null);
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [selectAllOnPage, setSelectAllOnPage] = useState(false);

	const { theme } = useTheme();
	const isDark = theme === 'dark';
	const queryClient = useQueryClient();

	// panel classes for content area
	const contentPanelCls = isDark
		? 'rounded-2xl p-6 backdrop-blur-md bg-slate-900/40 border border-white/6 text-white'
		: 'rounded-2xl p-6 backdrop-blur-md bg-white/70 border border-slate-200/20 text-slate-900';

	useEffect(() => {
		const t = setTimeout(() => setDebounced(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);

	const params = useMemo(() => {
		const p = { page, limit };
		if (debounced) p.search = debounced;
		if (status !== 'all') p.status = status;
		return p;
	}, [page, limit, debounced, status]);

	useEffect(() => setPage(1), [debounced, status]);

	const { data, isLoading, error, refetch } = useApplications(params);
	const statsQuery = useApplicationStats();
	const {
		updateStatus,
		updateStatusAsync,
		isUpdating,
		removeApplication,
		removeApplicationAsync,
		isDeleting,
	} = useManageApplication();

	const dataObj = data ?? {};
	const items = dataObj.docs ?? dataObj.data?.docs ?? dataObj._raw?.docs ?? [];
	const totalPages =
		Number(
			dataObj.totalPages ??
				dataObj.total_pages ??
				dataObj.meta?.totalPages ??
				dataObj._raw?.totalPages
		) || 1;

	useEffect(() => {
		if (page < totalPages) {
			const nextParams = { ...params, page: page + 1 };
			const key = ['applications', JSON.stringify(nextParams)];
			queryClient.prefetchQuery(key, () => fetchAllApplicationsService(nextParams));
		}
	}, [page, totalPages, params, queryClient]);

	useEffect(() => {
		if (error) {
			console.error('Applications fetch error', error);
			toast.error(error.message || 'Failed to load applications');
		}
	}, [error]);

	const toggleSelect = (id, checked) => {
		setSelectedIds((prev) => {
			const s = new Set(prev);
			if (checked) s.add(id);
			else s.delete(id);
			setSelectAllOnPage(items.length > 0 && items.every((it) => s.has(it._id)));
			return s;
		});
	};

	const toggleSelectAllOnPage = (checked) => {
		setSelectAllOnPage(checked);
		setSelectedIds((prev) => {
			const s = new Set(prev);
			if (checked) items.forEach((it) => s.add(it._id));
			else items.forEach((it) => s.delete(it._id));
			return s;
		});
	};

	const onToggleExpand = async (id) => {
		const next = expandedId === id ? null : id;
		setExpandedId(next);
		if (next) {
			try {
				await markAsSeenService(id);
				queryClient.invalidateQueries({ queryKey: ['applications'] });
				queryClient.invalidateQueries({ queryKey: ['application', id] });
				queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
			} catch (err) {
				console.error('Mark seen failed', err);
			}
		}
	};

	const handleApprove = async (id) => {
		if (!window.confirm('Approve this application?')) return;
		try {
			if (updateStatusAsync) await updateStatusAsync({ id, status: 'approved' });
			else updateStatus({ id, status: 'approved' });
			toast.success('Approved');
		} catch {
			toast.error('Approve failed');
		}
	};

	const handleReject = async (id) => {
		if (!window.confirm('Reject this application?')) return;
		try {
			if (updateStatusAsync) await updateStatusAsync({ id, status: 'rejected' });
			else updateStatus({ id, status: 'rejected' });
			toast.success('Rejected');
		} catch {
			toast.error('Reject failed');
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this application? This cannot be undone.')) return;
		try {
			if (removeApplicationAsync) await removeApplicationAsync(id);
			else removeApplication(id);
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			toast.success('Deleted');
			setSelectedIds((prev) => {
				const s = new Set(prev);
				s.delete(id);
				return s;
			});
		} catch {
			toast.error('Delete failed');
		}
	};

	const performBulkUpdate = async (idsArray, action) => {
		if (!idsArray.length) return toast('No applications selected');
		if (!window.confirm(`Confirm ${action} for ${idsArray.length} applications?`)) return;
		try {
			if (action === 'delete') {
				if (removeApplicationAsync)
					await Promise.all(idsArray.map((id) => removeApplicationAsync(id)));
				else idsArray.forEach((id) => removeApplication(id));
			} else {
				await bulkUpdateService(idsArray, action);
			}
			toast.success(`Bulk ${action} done`);
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			setSelectedIds(new Set());
			setSelectAllOnPage(false);
		} catch {
			toast.error('Bulk action failed');
		}
	};

	const exportPageCsv = () => {
		if (!items.length) return alert('No data to export');
		const headers = ['Name', 'LPU ID', 'Email', 'Phone', 'Course', 'Status', 'Created At'];
		const rows = items.map((r) =>
			[
				`"${r.fullName || ''}"`,
				`"${r.LpuId || ''}"`,
				`"${r.email || ''}"`,
				`"${r.phone || ''}"`,
				`"${r.course || ''}"`,
				`"${r.status || ''}"`,
				`"${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}"`,
			].join(',')
		);
		const csv = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `applications-page-${page}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	const exportAllCsv = async () => {
		try {
			const resp = await fetchAllApplicationsService({
				page: 1,
				limit: 1000,
				search: debounced || undefined,
				status: status !== 'all' ? status : undefined,
			});
			const allDocs = resp?.docs ?? resp?.data?.docs ?? resp?._raw?.docs ?? [];
			if (!allDocs.length) return alert('No data to export');
			const headers = ['Name', 'LPU ID', 'Email', 'Phone', 'Course', 'Status', 'Created At'];
			const rows = allDocs.map((r) =>
				[
					`"${r.fullName || ''}"`,
					`"${r.LpuId || ''}"`,
					`"${r.email || ''}"`,
					`"${r.phone || ''}"`,
					`"${r.course || ''}"`,
					`"${r.status || ''}"`,
					`"${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}"`,
				].join(',')
			);
			const csv = [headers.join(','), ...rows].join('\n');
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `applications-all.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch {
			toast.error('Failed to export all');
		}
	};

	return (
		<section className="max-w-6xl mx-auto p-6">
			{/* glass content wrapper */}
			<div className={contentPanelCls}>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Applications</h1>
						<div className="text-sm text-slate-400 mt-1">
							{statsQuery?.data
								? `Total: ${statsQuery.data.total || '-'} • Unseen: ${
										statsQuery.data.unseen || '-'
								  }`
								: ''}
						</div>
					</div>

					<div className="flex items-center gap-3">
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="bg-white/6 text-white rounded-xl px-3 py-2 border border-white/8"
						>
							<option value="all">All</option>
							<option value="pending">Pending</option>
							<option value="approved">Approved</option>
							<option value="rejected">Rejected</option>
						</select>
					</div>
				</div>

				<Toolbar
					search={search}
					setSearch={setSearch}
					onRefresh={() => refetch()}
					onExportPage={exportPageCsv}
					onExportAll={exportAllCsv}
					anySelected={selectedIds.size > 0}
					onBulkApprove={() => performBulkUpdate(Array.from(selectedIds), 'approved')}
					onBulkReject={() => performBulkUpdate(Array.from(selectedIds), 'rejected')}
					onBulkDelete={() => performBulkUpdate(Array.from(selectedIds), 'delete')}
				/>

				{isLoading ? (
					<div className="grid gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className="h-28 bg-gradient-to-br from-white/3 to-white/2 rounded-2xl animate-pulse"
							/>
						))}
					</div>
				) : items.length === 0 ? (
					<div className="text-center py-12 text-slate-400">
						<p className="text-lg">No applications found</p>
					</div>
				) : (
					<>
						<div className="grid gap-4">
							<div className="flex items-center justify-between">
								<label className="flex items-center gap-2 text-sm text-slate-300">
									<input
										type="checkbox"
										checked={selectAllOnPage}
										onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
										className="accent-cyan-400"
									/>
									Select all on page
								</label>
								<div className="text-sm text-slate-400">
									Selected: {selectedIds.size}
								</div>
							</div>

							{items.map((item) => (
								<Card
									key={item._id}
									item={item}
									expanded={expandedId === item._id}
									selected={selectedIds.has(item._id)}
									onSelect={toggleSelect}
									onToggle={onToggleExpand}
									onApprove={handleApprove}
									onReject={handleReject}
									onDelete={handleDelete}
								/>
							))}
						</div>

						<Pagination
							page={page}
							totalPages={totalPages}
							onPageChange={(p) => setPage(p)}
						/>
					</>
				)}
			</div>
		</section>
	);
};

export default ShowApplies;
