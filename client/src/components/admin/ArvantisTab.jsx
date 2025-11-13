import React, { useEffect, useState } from 'react';
import {
	getAllFests,
	createFest,
	deleteFest,
	linkEventToFest,
	addPartner,
	removePartner,
} from '../../services/arvantisServices.js';
import { getAllEvents } from '../../services/eventServices.js';
import { Loader2, Plus, X, Link2, Trash2, UploadCloud } from 'lucide-react';

const FestsPanel = ({ fests, loading, fetchFests, fetchEvents, events, setDashboardError }) => {
	const [showCreate, setShowCreate] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [form, setForm] = useState({
		name: '',
		year: new Date().getFullYear(),
		description: '',
		startDate: '',
		endDate: '',
	});
	const [linkFest, setLinkFest] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		// ensure events list is available when linking
		if (linkFest) fetchEvents();
	}, [linkFest, fetchEvents]);

	const resetForm = () =>
		setForm({
			name: '',
			year: new Date().getFullYear(),
			description: '',
			startDate: '',
			endDate: '',
		});

	const handleCreate = async (e) => {
		e?.preventDefault();
		setCreateLoading(true);
		setError('');
		const { name, description, startDate, endDate, year } = form;
		if (!name || !description || !startDate || !endDate) {
			setError('Please fill name, description, start and end dates.');
			setCreateLoading(false);
			return;
		}
		if (new Date(endDate) < new Date(startDate)) {
			setError('End date cannot be before start date.');
			setCreateLoading(false);
			return;
		}
		try {
			await createFest({
				name: name.trim(),
				year: Number(year),
				description: description.trim(),
				startDate,
				endDate,
			});
			setShowCreate(false);
			resetForm();
			await fetchFests();
		} catch (err) {
			setError(err.message || 'Failed to create fest.');
		} finally {
			setCreateLoading(false);
		}
	};

	const handleDelete = async (fest) => {
		const identifier = fest.slug || fest.year || fest._id;
		if (!identifier) {
			setDashboardError('Cannot determine fest identifier to delete.');
			return;
		}
		if (!window.confirm(`Delete fest "${fest.name}"? This cannot be undone.`)) return;
		try {
			await deleteFest(identifier);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to delete fest.');
		}
	};

	const openLinkModal = (fest) => {
		setLinkFest(fest);
		setSelectedEvent('');
		setError('');
	};

	const handleLinkEvent = async () => {
		if (!linkFest || !selectedEvent) {
			setError('Select a fest and an event to link.');
			return;
		}
		const identifier = linkFest.slug || linkFest.year || linkFest._id;
		try {
			await linkEventToFest(identifier, selectedEvent);
			setLinkFest(null);
			setSelectedEvent('');
			await fetchFests();
		} catch (err) {
			setError(err.message || 'Failed to link event.');
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold">Fests</h3>
				<button
					className="flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white"
					onClick={() => setShowCreate(true)}
				>
					<Plus className="w-4 h-4" /> Create
				</button>
			</div>

			{loading ? (
				<div className="py-8 flex justify-center">
					<Loader2 className="w-8 h-8 animate-spin" />
				</div>
			) : (
				<table className="w-full text-sm mb-6">
					<thead>
						<tr>
							<th className="text-left p-2">Name</th>
							<th className="text-left p-2">Year</th>
							<th className="text-left p-2">Events</th>
							<th className="text-left p-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{fests.map((fest) => (
							<tr key={fest._id || fest.slug || fest.year}>
								<td className="p-2">{fest.name}</td>
								<td className="p-2">{fest.year}</td>
								<td className="p-2">
									{Array.isArray(fest.events)
										? fest.events.length
										: fest.eventsCount ?? '-'}
									<button
										className="ml-2 text-blue-600 inline-flex items-center gap-1"
										onClick={() => openLinkModal(fest)}
									>
										<Link2 className="w-4 h-4" /> Link
									</button>
								</td>
								<td className="p-2">
									<button
										className="text-red-500 hover:text-red-700"
										onClick={() => handleDelete(fest)}
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
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full relative">
						<button
							className="absolute top-3 right-3"
							onClick={() => setShowCreate(false)}
						>
							<X />
						</button>
						<form onSubmit={handleCreate} className="space-y-3">
							<input
								placeholder="Fest name"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								className="w-full p-2 border rounded"
								required
							/>
							<input
								type="number"
								placeholder="Year"
								value={form.year}
								onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
								className="w-full p-2 border rounded"
								required
							/>
							<textarea
								placeholder="Description"
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="w-full p-2 border rounded h-24"
								required
							/>
							<div className="grid grid-cols-2 gap-2">
								<input
									type="date"
									value={form.startDate}
									onChange={(e) =>
										setForm({ ...form, startDate: e.target.value })
									}
									className="p-2 border rounded"
									required
								/>
								<input
									type="date"
									value={form.endDate}
									onChange={(e) => setForm({ ...form, endDate: e.target.value })}
									className="p-2 border rounded"
									required
								/>
							</div>

							{error && <div className="text-red-500">{error}</div>}

							<button
								type="submit"
								disabled={createLoading}
								className="w-full py-2 bg-blue-600 text-white rounded"
							>
								{createLoading ? 'Creating...' : 'Create Fest'}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Link Event Modal */}
			{linkFest && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
					<div className="bg-white dark:bg-gray-800 p-5 rounded-lg max-w-xs w-full relative">
						<button
							className="absolute top-3 right-3"
							onClick={() => setLinkFest(null)}
						>
							<X />
						</button>
						<h4 className="font-semibold mb-2">Link Event to {linkFest.name}</h4>
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
						{error && <div className="text-red-500 mb-2">{error}</div>}
						<button
							className="w-full py-2 bg-blue-600 text-white rounded"
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

const PartnersPanel = ({ fests, fetchFests, setDashboardError }) => {
	const [selectedFestId, setSelectedFestId] = useState('');
	const [partners, setPartners] = useState([]);
	const [loadingPartners, setLoadingPartners] = useState(false);
	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState({ name: '', tier: 'sponsor', website: '', logo: null });
	const [error, setError] = useState('');

	useEffect(() => {
		if (selectedFestId) loadPartners(selectedFestId);
		else setPartners([]);
	}, [selectedFestId]);

	const loadPartners = async (identifier) => {
		setLoadingPartners(true);
		try {
			const fest = fests.find(
				(f) => f._id === identifier || f.slug === identifier || f.year === identifier
			);
			if (!fest) {
				setPartners([]);
			} else {
				// fetch fresh fest details
				const resp = await getAllFests({ page: 1, limit: 50 }); // getAllFests returns paginated list; easier: call getFestDetails service if available
				// try to find the specific fest in response
				const found = (resp.data || []).find((x) => x._id === fest._id) || fest;
				setPartners(found.partners || fest.partners || []);
			}
		} catch (err) {
			setDashboardError(err.message || 'Failed to load partners.');
		} finally {
			setLoadingPartners(false);
		}
	};

	const handleFileChange = (e) => {
		setForm({ ...form, logo: e.target.files?.[0] || null });
	};

	const handleAddPartner = async () => {
		setError('');
		if (!selectedFestId) {
			setError('Select a fest first');
			return;
		}
		if (!form.name || !form.logo) {
			setError('Partner name and logo are required');
			return;
		}
		setAdding(true);
		try {
			const fest = fests.find((f) => f._id === selectedFestId);
			const identifier = fest.slug || fest.year || fest._id;
			const fd = new FormData();
			fd.append('name', form.name);
			// allow either tier or type
			fd.append('tier', form.tier || '');
			if (form.website) fd.append('website', form.website);
			fd.append('logo', form.logo);
			await addPartner(identifier, fd);
			await fetchFests();
			setForm({ name: '', tier: 'sponsor', website: '', logo: null });
			await loadPartners(selectedFestId);
		} catch (err) {
			setError(err.message || 'Failed to add partner.');
		} finally {
			setAdding(false);
		}
	};

	const handleRemovePartner = async (partnerName) => {
		if (!selectedFestId) return;
		if (!window.confirm(`Remove partner "${partnerName}"?`)) return;
		try {
			const fest = fests.find((f) => f._id === selectedFestId);
			const identifier = fest.slug || fest.year || fest._id;
			await removePartner(identifier, partnerName);
			await fetchFests();
			await loadPartners(selectedFestId);
		} catch (err) {
			setDashboardError(err.message || 'Failed to remove partner.');
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold">Partners</h3>
			</div>

			<div className="mb-4">
				<select
					className="p-2 border rounded w-full"
					value={selectedFestId}
					onChange={(e) => setSelectedFestId(e.target.value)}
				>
					<option value="">Select Fest</option>
					{fests.map((f) => (
						<option key={f._id} value={f._id}>
							{f.name} ({f.year})
						</option>
					))}
				</select>
			</div>

			{loadingPartners ? (
				<div className="py-6 flex justify-center">
					<Loader2 className="w-8 h-8 animate-spin" />
				</div>
			) : (
				<div>
					{partners.length === 0 ? (
						<div className="text-sm text-muted">No partners for selected fest.</div>
					) : (
						<ul className="space-y-3">
							{partners.map((p) => (
								<li
									key={p.name}
									className="flex items-center justify-between p-3 bg-gray-50 rounded"
								>
									<div className="flex items-center gap-3">
										{p.logo?.url ? (
											<img
												src={p.logo.url}
												alt={p.name}
												className="w-12 h-12 object-cover rounded"
											/>
										) : (
											<div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
												<UploadCloud />
											</div>
										)}
										<div>
											<div className="font-medium">{p.name}</div>
											<div className="text-xs text-gray-600">
												{p.tier || '-'}
											</div>
										</div>
									</div>
									<button
										className="text-red-500"
										onClick={() => handleRemovePartner(p.name)}
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{/* Add Partner Form */}
			<div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded shadow-sm">
				<h4 className="font-semibold mb-2">Add Partner</h4>
				<div className="space-y-2">
					<input
						placeholder="Partner name"
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						className="w-full p-2 border rounded"
					/>
					<div className="flex gap-2">
						<select
							value={form.tier}
							onChange={(e) => setForm({ ...form, tier: e.target.value })}
							className="p-2 border rounded flex-1"
						>
							<option value="sponsor">Sponsor</option>
							<option value="collaborator">Collaborator</option>
							<option value="other">Other</option>
						</select>
						<input
							placeholder="Website (optional)"
							value={form.website}
							onChange={(e) => setForm({ ...form, website: e.target.value })}
							className="p-2 border rounded flex-1"
						/>
					</div>
					<div>
						<input type="file" accept="image/*" onChange={handleFileChange} />
					</div>
					{error && <div className="text-red-500">{error}</div>}
					<button
						className="mt-2 w-full py-2 bg-green-600 text-white rounded"
						onClick={handleAddPartner}
						disabled={adding}
					>
						{adding ? 'Adding...' : 'Add Partner'}
					</button>
				</div>
			</div>
		</div>
	);
};

const ArvantisTab = ({ token, setDashboardError }) => {
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);
	const [active, setActive] = useState('fests'); // 'fests' | 'partners'

	const fetchFests = async () => {
		setLoading(true);
		try {
			const data = await getAllFests({
				page: 1,
				limit: 50,
				sortBy: 'year',
				sortOrder: 'desc',
			});
			setFests(data.data || []);
		} catch (err) {
			setDashboardError(err.message || 'Failed to fetch fests.');
		} finally {
			setLoading(false);
		}
	};

	const fetchEvents = async () => {
		try {
			const resp = await getAllEvents({ page: 1, limit: 200 });
			setEvents(resp.docs || []);
		} catch (err) {
			setDashboardError(err.message || 'Failed to fetch events.');
		}
	};

	useEffect(() => {
		fetchFests();
		fetchEvents();
	}, []);

	return (
		<div className="max-w-5xl mx-auto py-6">
			<div className="flex gap-3 mb-4">
				<button
					className={`px-4 py-2 rounded ${
						active === 'fests' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
					}`}
					onClick={() => setActive('fests')}
				>
					Fests
				</button>
				<button
					className={`px-4 py-2 rounded ${
						active === 'partners'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-100'
					}`}
					onClick={() => setActive('partners')}
				>
					Partners
				</button>
			</div>

			{active === 'fests' ? (
				<FestsPanel
					fests={fests}
					loading={loading}
					fetchFests={fetchFests}
					events={events}
					fetchEvents={fetchEvents}
					setDashboardError={setDashboardError}
				/>
			) : (
				<PartnersPanel
					fests={fests}
					fetchFests={fetchFests}
					setDashboardError={setDashboardError}
				/>
			)}
		</div>
	);
};

export default ArvantisTab;
