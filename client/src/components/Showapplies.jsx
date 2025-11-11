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
	<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
		<div className="flex gap-2 w-full sm:w-auto">
			<input
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="Search name, LPU ID, email..."
				className="flex-1 sm:w-80 px-3 py-2 rounded-lg bg-slate-800/50 text-white border border-slate-700 focus:outline-none"
			/>
		</div>

		<div className="flex gap-2 items-center">
			<button onClick={onExportPage} className="px-3 py-2 rounded-lg bg-cyan-600 text-white">
				Export page
			</button>
			<button onClick={onExportAll} className="px-3 py-2 rounded-lg bg-cyan-500 text-white">
				Export all
			</button>

			<button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-slate-700 text-white">
				Refresh
			</button>

			<button
				onClick={onBulkApprove}
				disabled={!anySelected}
				className={`px-3 py-2 rounded-lg text-white ${
					anySelected ? 'bg-emerald-600' : 'bg-slate-800/40'
				}`}
			>
				Approve
			</button>
			<button
				onClick={onBulkReject}
				disabled={!anySelected}
				className={`px-3 py-2 rounded-lg text-white ${
					anySelected ? 'bg-rose-600' : 'bg-slate-800/40'
				}`}
			>
				Reject
			</button>
			<button
				onClick={onBulkDelete}
				disabled={!anySelected}
				className={`px-3 py-2 rounded-lg text-white ${
					anySelected ? 'bg-rose-700' : 'bg-slate-800/40'
				}`}
			>
				Delete
			</button>
		</div>
	</div>
);

const Card = ({ item, onToggle, expanded, selected, onSelect, onApprove, onReject, onDelete }) => (
	<article className="bg-slate-800/40 rounded-xl border border-slate-700 p-4">
		<div className="flex justify-between items-start gap-3">
			<div className="flex items-start gap-3 min-w-0">
				<input
					type="checkbox"
					checked={!!selected}
					onChange={(e) => onSelect(item._id, e.target.checked)}
					className="mt-1"
					aria-label={`Select ${item.fullName}`}
				/>
				<div className="min-w-0">
					<h3 className="text-lg font-semibold text-white truncate">{item.fullName}</h3>
					<div className="text-sm text-gray-400 truncate">
						{item.email} • {item.LpuId}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<span
					className={`px-2 py-1 rounded-full text-xs ${
						item.status === 'approved'
							? 'bg-emerald-700 text-emerald-100'
							: item.status === 'rejected'
							? 'bg-rose-700 text-rose-100'
							: 'bg-amber-700 text-amber-100'
					}`}
				>
					{item.status}
				</span>

				<button
					onClick={() => onApprove(item._id)}
					className="px-3 py-1 rounded-lg bg-emerald-600 text-sm text-white"
					title="Approve"
				>
					✓
				</button>
				<button
					onClick={() => onReject(item._id)}
					className="px-3 py-1 rounded-lg bg-rose-600 text-sm text-white"
					title="Reject"
				>
					✕
				</button>

				<button
					onClick={() => onToggle(item._id)}
					className="px-3 py-1 rounded-lg bg-slate-700 text-sm text-white"
				>
					{expanded ? 'Close' : 'View'}
				</button>

				<button
					onClick={() => onDelete(item._id)}
					className="px-3 py-1 rounded-lg bg-slate-600 text-sm text-white"
					title="Delete"
				>
					🗑
				</button>
			</div>
		</div>

		{expanded && (
			<div className="mt-3 border-t border-slate-700 pt-3 text-sm text-gray-200">
				<p>
					<strong>Phone:</strong> {item.phone || 'N/A'}
				</p>
				<p className="mt-2">
					<strong>Course:</strong> {item.course || 'N/A'}
				</p>
				<p className="mt-2 whitespace-pre-wrap bg-slate-900/30 p-2 rounded">
					{item.bio || '—'}
				</p>
			</div>
		)}
	</article>
);

const ShowApplies = () => {
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [search, setSearch] = useState('');
	const [debounced, setDebounced] = useState('');
	const [status, setStatus] = useState('all');
	const [expandedId, setExpandedId] = useState(null);
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [selectAllOnPage, setSelectAllOnPage] = useState(false);

	const queryClient = useQueryClient();

	// debounce input
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

	// Reset to page 1 when filters/search change to avoid staying on out-of-range pages
	useEffect(() => {
		setPage(1);
	}, [debounced, status]);

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

	// Normalize data shapes from the service / API (be defensive)
	const dataObj = data ?? {};
	const items = dataObj.docs ?? dataObj.data?.docs ?? dataObj._raw?.docs ?? [];
	const totalPages =
		Number(
			dataObj.totalPages ??
				dataObj.total_pages ??
				dataObj.meta?.totalPages ??
				dataObj._raw?.totalPages
		) || 1;
	const serverPage =
		Number(dataObj.page ?? dataObj.currentPage ?? dataObj.meta?.page ?? dataObj._raw?.page) ||
		page;

	// Always keep local page within bounds returned by server (avoid surprising UI)
	useEffect(() => {
		if (serverPage && serverPage !== page) {
			// only adjust if server claims a different page (prevents tiny loops)
			setPage(serverPage);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [serverPage]);

	// show fetch error inline so user knows
	useEffect(() => {
		if (error) {
			console.error('Applications fetch error', error);
			toast.error(error.message || 'Failed to load applications');
		}
	}, [error]);

	// prefetch next page for snappy UX
	useEffect(() => {
		if (page < totalPages) {
			const nextParams = { ...params, page: page + 1 };
			// use the same serialized key shape as useApplications
			const key = ['applications', JSON.stringify(nextParams)];
			queryClient.prefetchQuery(key, () => fetchAllApplicationsService(nextParams));
		}
	}, [page, totalPages, params, queryClient]);

	// keep selected consistent when items change
	useEffect(() => {
		// if no items, clear selection
		if (!items || items.length === 0) {
			setSelectedIds((prev) => {
				if (prev.size === 0) return prev;
				return new Set();
			});
			setSelectAllOnPage(false);
			return;
		}

		// if selectAllOnPage active, ensure current page ids are included once
		if (selectAllOnPage) {
			setSelectedIds((prev) => {
				const pageIds = items.map((it) => it._id);
				const needAdd = pageIds.some((id) => !prev.has(id));
				if (!needAdd) return prev;
				const s = new Set(prev);
				pageIds.forEach((id) => s.add(id));
				return s;
			});
		}
		// only depend on items & selectAllOnPage to avoid eql problems with Set identity
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items, selectAllOnPage]);

	const toggleSelect = (id, checked) => {
		setSelectedIds((prev) => {
			const s = new Set(prev);
			if (checked) s.add(id);
			else s.delete(id);
			// update selectAllOnPage based on new set
			const allOnPage = items.length > 0 && items.every((it) => s.has(it._id));
			setSelectAllOnPage(allOnPage);
			return s;
		});
	};

	const toggleSelectAllOnPage = (checked) => {
		setSelectAllOnPage(checked);
		setSelectedIds((prev) => {
			const s = new Set(prev);
			if (checked) {
				items.forEach((it) => s.add(it._id));
			} else {
				items.forEach((it) => s.delete(it._id));
			}
			return s;
		});
	};

	const onToggleExpand = async (id) => {
		const next = expandedId === id ? null : id;
		setExpandedId(next);

		// mark as seen if opening details
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

	// per-item actions (use mutateAsync so we can await and show UI feedback)
	const handleApprove = async (id) => {
		if (!window.confirm('Approve this application?')) return;
		try {
			if (updateStatusAsync) {
				await updateStatusAsync({ id, status: 'approved' });
			} else {
				updateStatus({ id, status: 'approved' });
			}
		} catch (err) {
			console.error('Approve failed', err);
			toast.error('Failed to approve');
		}
	};

	const handleReject = async (id) => {
		if (!window.confirm('Reject this application?')) return;
		try {
			if (updateStatusAsync) {
				await updateStatusAsync({ id, status: 'rejected' });
			} else {
				updateStatus({ id, status: 'rejected' });
			}
		} catch (err) {
			console.error('Reject failed', err);
			toast.error('Failed to reject');
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this application? This cannot be undone.')) return;
		try {
			if (removeApplicationAsync) {
				await removeApplicationAsync(id);
			} else {
				removeApplication(id);
			}
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
			// remove id from selected set if present
			setSelectedIds((prev) => {
				if (!prev.has(id)) return prev;
				const s = new Set(prev);
				s.delete(id);
				return s;
			});
		} catch (err) {
			console.error('Delete failed', err);
			toast.error('Failed to delete');
		}
	};

	// bulk actions
	const performBulkUpdate = async (idsArray, action) => {
		if (!idsArray.length) return toast('No applications selected');
		const confirmMessage =
			action === 'delete'
				? `Delete ${idsArray.length} application(s)? This cannot be undone.`
				: `${action === 'approved' ? 'Approve' : 'Reject'} ${
						idsArray.length
				  } application(s)?`;
		if (!window.confirm(confirmMessage)) return;

		try {
			if (action === 'delete') {
				if (removeApplicationAsync) {
					await Promise.all(idsArray.map((id) => removeApplicationAsync(id)));
				} else {
					idsArray.forEach((id) => removeApplication(id));
				}
				toast.success('Bulk delete completed');
				queryClient.invalidateQueries({ queryKey: ['applications'] });
				queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
			} else {
				await bulkUpdateService(idsArray, action);
				toast.success(`Bulk ${action} successful`);
				queryClient.invalidateQueries({ queryKey: ['applications'] });
				queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
			}
			// clear selection
			setSelectedIds(new Set());
			setSelectAllOnPage(false);
		} catch (err) {
			console.error('Bulk action failed', err);
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
		a.download = `applications-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`;
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
			a.download = `applications-all-${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Export all failed', err);
			toast.error('Failed to export all applications');
		}
	};

	return (
		<section className="max-w-7xl mx-auto p-4">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-white">Applications</h1>
					<div className="text-sm text-gray-400 mt-1">
						{statsQuery?.data
							? `Total: ${statsQuery.data.total || '-'} • Unseen: ${
									statsQuery.data.unseen || '-'
							  }`
							: null}
					</div>
				</div>

				<select
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="bg-slate-800/50 text-white rounded-lg px-3 py-2 border border-slate-700"
				>
					<option value="all">All</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
				</select>
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

			<div className="space-y-3">
				{isLoading ? (
					<div className="text-center py-8 text-gray-400">Loading...</div>
				) : items.length === 0 ? (
					<div className="text-center py-8 text-gray-400">No applications found</div>
				) : (
					<>
						<div className="flex items-center gap-4 mb-2">
							<label className="text-sm text-gray-300 flex items-center gap-2">
								<input
									type="checkbox"
									checked={selectAllOnPage}
									onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
								/>
								Select all on page
							</label>
							<div className="text-sm text-gray-400">
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
					</>
				)}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="mt-6 flex justify-center gap-2 items-center">
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						className="px-3 py-1 rounded bg-slate-700 text-white"
					>
						Prev
					</button>
					<span className="px-3 py-1 bg-slate-800 text-gray-300 rounded">
						{page} / {totalPages}
					</span>
					<button
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						className="px-3 py-1 rounded bg-slate-700 text-white"
					>
						Next
					</button>

					<div className="flex items-center gap-2 ml-4">
						<label className="text-sm text-gray-400">Go to</label>
						<input
							type="number"
							min={1}
							max={totalPages}
							value={page}
							onChange={(e) => {
								const v = Number(e.target.value || 1);
								if (v >= 1 && v <= totalPages) setPage(v);
							}}
							className="w-20 px-2 py-1 rounded bg-slate-800 text-white text-center"
						/>
					</div>
				</div>
			)}
		</section>
	);
};

export default ShowApplies;
