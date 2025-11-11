import React, { useEffect, useState } from 'react';
import {
	getAllFests,
	createFest,
	deleteFest,
	linkEventToFest,
	unlinkEventFromFest,
} from '../../services/arvantisServices.js';
import { getAllEvents } from '../../services/eventServices.js';
import { Loader2, Plus, X, Link2, Trash2 } from 'lucide-react';

const ArvantisTab = ({ token, setDashboardError }) => {
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [title, setTitle] = useState('');
	const [year, setYear] = useState(new Date().getFullYear());
	const [createLoading, setCreateLoading] = useState(false);
	const [error, setError] = useState('');
	const [linkFest, setLinkFest] = useState(null);
	const [events, setEvents] = useState([]);
	const [selectedEvent, setSelectedEvent] = useState('');

	async function fetchFests() {
		setLoading(true);
		try {
			const data = await getAllFests();
			setFests(data.data || []);
		} catch (err) {
			setDashboardError(err.message);
		}
		setLoading(false);
	}

	async function fetchEvents() {
		try {
			const data = await getAllEvents();
			setEvents(data.docs || []);
		} catch (err) {
			setDashboardError(err.message);
		}
	}

	useEffect(() => {
		fetchFests();
		fetchEvents();
	}, []);

	const handleCreate = async (e) => {
		e.preventDefault();
		setCreateLoading(true);
		setError('');
		try {
			await createFest({ title, year });
			setShowCreate(false);
			setTitle('');
			setYear(new Date().getFullYear());
			fetchFests();
		} catch (err) {
			setError(err.message);
		}
		setCreateLoading(false);
	};

	const handleDelete = async (festId) => {
		if (!window.confirm('Delete this fest?')) return;
		try {
			await deleteFest(festId);
			fetchFests();
		} catch (err) {
			setDashboardError(err.message);
		}
	};

	const handleLinkEvent = async () => {
		if (!linkFest || !selectedEvent) return;
		try {
			await linkEventToFest(linkFest._id || linkFest.slug || linkFest.year, selectedEvent);
			setLinkFest(null);
			setSelectedEvent('');
			fetchFests();
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div className="max-w-3xl mx-auto my-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Arvantis Fests</h2>
				<button
					className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-xl"
					onClick={() => setShowCreate(true)}
				>
					<Plus className="w-4 h-4" /> Create Fest
				</button>
			</div>
			{loading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-8 h-8 animate-spin" />
				</div>
			) : (
				<table className="w-full text-sm mb-8">
					<thead>
						<tr>
							<th className="text-left p-2">Title</th>
							<th className="text-left p-2">Year</th>
							<th className="text-left p-2">Events Linked</th>
							<th className="text-left p-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{fests.map((fest) => (
							<tr key={fest._id}>
								<td className="p-2">{fest.title}</td>
								<td className="p-2">{fest.year || '-'}</td>
								<td className="p-2">
									{(fest.events || []).length}
									<button
										className="ml-2 text-blue-600 hover:underline"
										onClick={() => {
											setLinkFest(fest);
											fetchEvents();
										}}
									>
										<Link2 className="inline w-4 h-4" /> Link
									</button>
								</td>
								<td className="p-2 flex gap-2 items-center">
									<button
										className="text-red-500 hover:text-red-700"
										onClick={() => handleDelete(fest._id)}
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* Create Modal */}
			{showCreate && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
					<div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg relative max-w-xs w-full">
						<button
							className="absolute top-2 right-2"
							onClick={() => setShowCreate(false)}
						>
							<X />
						</button>
						<form onSubmit={handleCreate} className="space-y-4">
							<h3 className="text-xl font-bold">Create Fest</h3>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Fest Title"
								required
								className="w-full p-2 border rounded"
							/>
							<input
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
								type="number"
								placeholder="Year"
								required
								className="w-full p-2 border rounded"
							/>
							{error && <div className="text-red-500">{error}</div>}
							<button
								disabled={createLoading}
								className="w-full p-2 mt-2 bg-blue-600 text-white rounded"
								type="submit"
							>
								{createLoading ? 'Creating...' : 'Create'}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Link Event Modal */}
			{linkFest && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
					<div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg relative max-w-xs w-full">
						<button
							className="absolute top-2 right-2"
							onClick={() => setLinkFest(null)}
						>
							<X />
						</button>
						<h3 className="font-bold mb-2">Link Event to {linkFest.title}</h3>
						<select
							value={selectedEvent}
							onChange={(e) => setSelectedEvent(e.target.value)}
							className="w-full p-2 border rounded mb-2"
						>
							<option value="">Select event</option>
							{events.map((ev) => (
								<option key={ev._id} value={ev._id}>
									{ev.title} ({ev._id.slice(-4)})
								</option>
							))}
						</select>
						<button
							className="w-full p-2 bg-blue-600 text-white rounded"
							onClick={handleLinkEvent}
						>
							Link Event
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ArvantisTab;
