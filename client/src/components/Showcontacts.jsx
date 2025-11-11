import React, { useEffect, useMemo, useState } from 'react';
import {
	useGetAllContacts,
	useGetContactById,
	useMarkContactAsResolved,
	useDeleteContact,
} from '../hooks/useContact.js';
import { toast } from 'react-hot-toast';

const Toolbar = ({ search, setSearch, onRefresh, onExport }) => (
	<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
		<div className="flex items-center gap-3 w-full md:w-auto">
			<div className="relative w-full md:w-80">
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search contacts..."
					className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/6 placeholder:text-slate-400 text-white border border-white/8 focus:outline-none focus:ring-2 focus:ring-cyan-400"
				/>
				<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
			</div>

			<button
				onClick={onRefresh}
				className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/6 text-sm"
			>
				⟳ Refresh
			</button>
		</div>

		<div className="flex gap-2">
			<button
				onClick={onExport}
				className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm"
			>
				Export
			</button>
		</div>
	</div>
);

const ContactCard = ({ c, expanded, onToggle, onResolve, onDelete }) => (
	<article className="group bg-white/3 border border-white/6 rounded-2xl p-4 hover:shadow-xl transition-transform transform hover:-translate-y-1">
		<div className="flex justify-between items-start gap-4">
			<div className="min-w-0">
				<h3 className="text-lg font-semibold text-white truncate">{c.name}</h3>
				<div className="text-sm text-slate-300 truncate">{c.email}</div>
				<div className="text-xs text-slate-400 mt-1">
					{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<span
					className={`px-3 py-1 rounded-full text-xs font-semibold ${
						c.status === 'resolved'
							? 'bg-emerald-600 text-emerald-50'
							: 'bg-amber-600 text-amber-50'
					}`}
				>
					{c.status}
				</span>
				<button
					onClick={() => onToggle(c._id)}
					className="px-3 py-1 rounded-lg bg-white/6 text-sm"
				>
					{expanded ? 'Close' : 'View'}
				</button>
			</div>
		</div>

		{expanded && (
			<div className="mt-4 border-t border-white/6 pt-3 text-sm text-slate-200">
				<p>
					<strong>Subject:</strong>{' '}
					<span className="text-slate-300">{c.subject || '—'}</span>
				</p>
				<div className="mt-2 p-3 bg-white/5 rounded whitespace-pre-wrap">
					{c.message || '—'}
				</div>

				<div className="mt-3 flex gap-2">
					{c.status !== 'resolved' && (
						<button
							onClick={() => onResolve(c._id)}
							className="px-3 py-1 rounded bg-emerald-500 text-white"
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
	const { getContactById } = useGetContactById();
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

	useEffect(() => setPage(1), [debounced, status]);

	useEffect(() => {
		const load = async () => {
			try {
				const resp = await getAllContacts(params);
				setItems(resp?.docs ?? []);
				setTotalPages(resp?.totalPages ?? 1);
			} catch (e) {
				console.error(e);
				toast.error('Failed to load contacts');
			}
		};
		load();
	}, [page, debounced, status]);

	const refresh = async () => {
		setPage(1);
		try {
			const resp = await getAllContacts(params);
			setItems(resp?.docs ?? []);
			setTotalPages(resp?.totalPages ?? 1);
			toast.success('Refreshed');
		} catch (e) {
			console.error(e);
			toast.error('Refresh failed');
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
		if (expandedId === id) setExpandedId(null);
		else {
			setExpandedId(id);
			getContactById(id).catch(() => {});
		}
	};

	const handleResolve = async (id) => {
		try {
			await markAsResolved(id);
			setItems((prev) => prev.map((i) => (i._id === id ? { ...i, status: 'resolved' } : i)));
			toast.success('Marked resolved');
		} catch {
			toast.error('Action failed');
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this contact?')) return;
		try {
			await deleteContact(id);
			setItems((prev) => prev.filter((i) => i._id !== id));
			toast.success('Deleted');
		} catch {
			toast.error('Delete failed');
		}
	};

	return (
		<section className="max-w-6xl mx-auto p-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
					<div className="text-sm text-slate-400 mt-1">Manage messages and responses</div>
				</div>

				<select
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="bg-white/6 text-white rounded-xl px-3 py-2 border border-white/8"
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
				<div className="grid gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-28 rounded-2xl bg-white/4 animate-pulse" />
					))}
				</div>
			) : error ? (
				<div className="text-center py-8 text-rose-400">Error loading contacts</div>
			) : items.length === 0 ? (
				<div className="text-center py-12 text-slate-400">No contacts found</div>
			) : (
				<div className="grid gap-4">
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

			{totalPages > 1 && (
				<div className="mt-6 flex justify-center gap-3 items-center">
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						className="px-3 py-1 rounded bg-white/6"
					>
						Prev
					</button>
					<span className="px-3 py-1 bg-white/5 rounded text-sm">
						{page} / {totalPages}
					</span>
					<button
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						className="px-3 py-1 rounded bg-white/6"
					>
						Next
					</button>
				</div>
			)}
		</section>
	);
};

export default ShowContacts;
