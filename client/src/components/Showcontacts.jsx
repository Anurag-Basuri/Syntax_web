import React, { useEffect, useMemo, useState } from 'react';
import {
	useGetAllContacts,
	useGetContactById,
	useMarkContactAsResolved,
	useDeleteContact,
} from '../hooks/useContact.js';

const Toolbar = ({ search, setSearch, onRefresh, onExport }) => (
	<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
		<div className="flex gap-2 w-full sm:w-auto">
			<input
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="Search contacts..."
				className="flex-1 sm:w-80 px-3 py-2 rounded-lg bg-slate-800/50 text-white border border-slate-700 focus:outline-none"
			/>
		</div>

		<div className="flex gap-2">
			<button onClick={onExport} className="px-3 py-2 rounded-lg bg-cyan-600 text-white">
				Export
			</button>
			<button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-slate-700 text-white">
				Refresh
			</button>
		</div>
	</div>
);

const ContactCard = ({ c, expanded, onToggle, onResolve, onDelete }) => (
	<article className="bg-slate-800/40 rounded-xl border border-slate-700 p-4">
		<div className="flex justify-between items-start gap-3">
			<div className="min-w-0">
				<h3 className="text-lg font-semibold text-white truncate">{c.name}</h3>
				<div className="text-sm text-gray-400 truncate">{c.email}</div>
				<div className="text-xs text-gray-500 mt-1">
					{new Date(c.createdAt).toLocaleDateString()}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<span
					className={`px-2 py-1 rounded-full text-xs ${
						c.status === 'resolved'
							? 'bg-emerald-700 text-emerald-100'
							: 'bg-amber-700 text-amber-100'
					}`}
				>
					{c.status}
				</span>
				<button
					onClick={() => onToggle(c._id)}
					className="px-3 py-1 rounded-lg bg-slate-700 text-white"
				>
					{expanded ? 'Close' : 'View'}
				</button>
			</div>
		</div>

		{expanded && (
			<div className="mt-3 border-t border-slate-700 pt-3 text-sm text-gray-200">
				<p>
					<strong>Subject:</strong> {c.subject || '—'}
				</p>
				<p className="mt-2 whitespace-pre-wrap bg-slate-900/30 p-2 rounded">
					{c.message || '—'}
				</p>

				<div className="mt-3 flex gap-2">
					{c.status !== 'resolved' && (
						<button
							onClick={() => onResolve(c._id)}
							className="px-3 py-1 rounded bg-emerald-600 text-white"
						>
							Mark Resolved
						</button>
					)}
					<button
						onClick={() => onDelete(c._id)}
						className="px-3 py-1 rounded bg-rose-600 text-white"
					>
						Delete
					</button>
				</div>
			</div>
		)}
	</article>
);

const ShowContacts = () => {
	const { getAllContacts, loading, error } = useGetAllContacts();
	const { getContactById, contact: selectedContact } = useGetContactById();
	const { markAsResolved } = useMarkContactAsResolved();
	const { deleteContact } = useDeleteContact();

	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [search, setSearch] = useState('');
	const [debounced, setDebounced] = useState('');
	const [status, setStatus] = useState('all');
	const [expandedId, setExpandedId] = useState(null);
	const [items, setItems] = useState([]);
	const [totalPages, setTotalPages] = useState(1);

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

	// Reset to page 1 when filters/search change
	useEffect(() => {
		setPage(1);
	}, [debounced, status]);

	useEffect(() => {
		const load = async () => {
			try {
				const resp = await getAllContacts(params);
				// svc returns normalized paginated object
				setItems(resp?.docs ?? []);
				setTotalPages(resp?.totalPages ?? 1);
			} catch (e) {
				console.error(e);
			}
		};
		load();
		// eslint-disable-next-line
	}, [page, debounced, status]);

	const refresh = async () => {
		setPage(1);
		try {
			const resp = await getAllContacts(params);
			setItems(resp?.docs ?? []);
			setTotalPages(resp?.totalPages ?? 1);
		} catch (e) {
			console.error(e);
		}
	};

	const exportCsv = () => {
		if (!items.length) return alert('No data to export');
		const headers = ['Name', 'Email', 'Subject', 'Status', 'Created At'];
		const rows = items.map((r) =>
			[
				`"${r.name || ''}"`,
				`"${r.email || ''}"`,
				`"${r.subject || ''}"`,
				`"${r.status || ''}"`,
				`"${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}"`,
			].join(',')
		);
		const csv = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	const handleToggle = (id) => {
		if (expandedId === id) {
			setExpandedId(null);
		} else {
			setExpandedId(id);
			getContactById(id).catch(() => {});
		}
	};

	const handleResolve = async (id) => {
		try {
			await markAsResolved(id);
			setItems((prev) => prev.map((i) => (i._id === id ? { ...i, status: 'resolved' } : i)));
		} catch (e) {
			console.error(e);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this contact?')) return;
		try {
			await deleteContact(id);
			setItems((prev) => prev.filter((i) => i._id !== id));
		} catch (e) {
			alert('Failed to delete');
		}
	};

	return (
		<section className="max-w-7xl mx-auto p-4">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-white">Contacts</h1>
				<select
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="bg-slate-800/50 text-white rounded-lg px-3 py-2 border border-slate-700"
				>
					<option value="all">All</option>
					<option value="pending">Pending</option>
					<option value="resolved">Resolved</option>
				</select>
			</div>

			<Toolbar
				search={search}
				setSearch={setSearch}
				onRefresh={refresh}
				onExport={exportCsv}
			/>

			{loading ? (
				<div className="text-center py-8 text-gray-400">Loading...</div>
			) : error ? (
				<div className="text-center py-8 text-red-400">Error loading contacts</div>
			) : items.length === 0 ? (
				<div className="text-center py-8 text-gray-400">No contacts found</div>
			) : (
				<div className="space-y-3">
					{items.map((c) => (
						<ContactCard
							key={c._id}
							c={c}
							expanded={expandedId === c._id}
							onToggle={handleToggle}
							onResolve={handleResolve}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="mt-6 flex justify-center gap-2">
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
				</div>
			)}
		</section>
	);
};

export default ShowContacts;
