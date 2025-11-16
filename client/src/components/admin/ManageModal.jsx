import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Plus, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
	addEventPoster,
	removeEventPoster,
	addEventPartner,
	removeEventPartner,
	addEventSpeaker,
	removeEventSpeaker,
	addEventResource,
	removeEventResource,
	addEventCoOrganizer,
	removeEventCoOrganizerByIndex,
	removeEventCoOrganizerByName,
} from '../../services/eventServices.js';
import formatApiError from '../../utils/formatApiError.js';

const TABS = ['partners', 'speakers', 'resources', 'coOrganizers', 'posters'];

const ManageModal = ({ open = true, event, onClose, onDone, setParentError }) => {
	// Local state (keeps UI simple)
	const [tab, setTab] = useState('partners');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [partnerForm, setPartnerForm] = useState({ name: '', website: '', logo: null });
	const [speakerForm, setSpeakerForm] = useState({ name: '', title: '', bio: '', photo: null });
	const [resourceForm, setResourceForm] = useState({ title: '', url: '' });
	const [coName, setCoName] = useState('');
	const [posterFile, setPosterFile] = useState(null);

	const abortRef = useRef(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			if (abortRef.current) {
				abortRef.current.abort();
				abortRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		// reset forms when opening a new event
		if (open) {
			setError('');
			setPartnerForm({ name: '', website: '', logo: null });
			setSpeakerForm({ name: '', title: '', bio: '', photo: null });
			setResourceForm({ title: '', url: '' });
			setCoName('');
			setPosterFile(null);
		}
	}, [event, open]);

	const createAbortSignal = () => {
		if (abortRef.current) abortRef.current.abort();
		abortRef.current = new AbortController();
		return abortRef.current.signal;
	};

	const handleApiError = (err) => {
		const msg = formatApiError(err);
		if (mountedRef.current) setError(msg);
		setParentError?.(msg);
		toast.error(msg);
	};

	const ensureEventId = () => {
		if (!event || !event._id) {
			const msg = 'Event not available';
			if (mountedRef.current) setError(msg);
			toast.error(msg);
			return null;
		}
		return event._id;
	};

	// small helper to centralize loading / error handling
	const run = async (fn, successMessage) => {
		setError('');
		if (!mountedRef.current) return;
		setLoading(true);
		const signal = createAbortSignal();
		try {
			await fn(signal);
			if (mountedRef.current && successMessage) toast.success(successMessage);
			onDone?.();
			return true;
		} catch (err) {
			// ignore abort cancellations
			if (err?.name === 'CanceledError' || err?.message === 'canceled') return false;
			handleApiError(err);
			return false;
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	};

	// Partners
	const handleAddPartner = async () => {
		if (!partnerForm.name?.trim()) return setError('Partner name is required');
		const id = ensureEventId();
		if (!id) return;

		await run(async (signal) => {
			let payload;
			if (partnerForm.logo instanceof File) {
				payload = new FormData();
				payload.append('name', partnerForm.name.trim());
				if (partnerForm.website) payload.append('website', partnerForm.website.trim());
				payload.append('logo', partnerForm.logo);
			} else {
				payload = { name: partnerForm.name.trim(), website: partnerForm.website?.trim() };
			}
			await addEventPartner(id, payload, { signal });
			// reset only after success
			if (mountedRef.current) setPartnerForm({ name: '', website: '', logo: null });
		}, 'Partner added');
	};

	const handleRemovePartner = async (identifier) => {
		if (!identifier) return;
		if (!window.confirm('Remove partner?')) return;
		const id = ensureEventId();
		if (!id) return;
		await run((signal) => removeEventPartner(id, identifier, { signal }), 'Partner removed');
	};

	// Speakers
	const handleAddSpeaker = async () => {
		if (!speakerForm.name?.trim()) return setError('Speaker name is required');
		const id = ensureEventId();
		if (!id) return;

		await run(async (signal) => {
			let payload;
			if (speakerForm.photo instanceof File) {
				payload = new FormData();
				payload.append('name', speakerForm.name.trim());
				if (speakerForm.title) payload.append('title', speakerForm.title.trim());
				if (speakerForm.bio) payload.append('bio', speakerForm.bio.trim());
				payload.append('photo', speakerForm.photo);
			} else {
				payload = {
					name: speakerForm.name.trim(),
					title: speakerForm.title?.trim(),
					bio: speakerForm.bio?.trim(),
				};
			}
			await addEventSpeaker(id, payload, { signal });
			if (mountedRef.current) setSpeakerForm({ name: '', title: '', bio: '', photo: null });
		}, 'Speaker added');
	};

	const handleRemoveSpeaker = async (index) => {
		if (!window.confirm('Remove speaker?')) return;
		const id = ensureEventId();
		if (!id) return;
		await run((signal) => removeEventSpeaker(id, index, { signal }), 'Speaker removed');
	};

	// Resources
	const handleAddResource = async () => {
		if (!resourceForm.title?.trim() || !resourceForm.url?.trim())
			return setError('Title and URL are required');
		const id = ensureEventId();
		if (!id) return;

		await run(async (signal) => {
			await addEventResource(
				id,
				{ title: resourceForm.title.trim(), url: resourceForm.url.trim() },
				{ signal }
			);
			if (mountedRef.current) setResourceForm({ title: '', url: '' });
		}, 'Resource added');
	};

	const handleRemoveResource = async (index) => {
		if (!window.confirm('Remove resource?')) return;
		const id = ensureEventId();
		if (!id) return;
		await run((signal) => removeEventResource(id, index, { signal }), 'Resource removed');
	};

	// Co-organizers
	const handleAddCo = async () => {
		if (!coName?.trim()) return setError('Name required');
		const id = ensureEventId();
		if (!id) return;
		await run(
			(signal) => addEventCoOrganizer(id, { name: coName.trim() }, { signal }),
			'Co-organizer added'
		);
		if (mountedRef.current) setCoName('');
	};

	const handleRemoveCoIndex = async (idx) => {
		if (!window.confirm('Remove co-organizer?')) return;
		const id = ensureEventId();
		if (!id) return;
		await run(
			(signal) => removeEventCoOrganizerByIndex(id, idx, { signal }),
			'Co-organizer removed'
		);
	};

	const handleRemoveCoName = async (name) => {
		if (!name) return;
		if (!window.confirm(`Remove co-organizer "${name}"?`)) return;
		const id = ensureEventId();
		if (!id) return;
		await run(
			(signal) => removeEventCoOrganizerByName(id, name, { signal }),
			'Co-organizer removed'
		);
	};

	// Posters
	const handleAddPoster = async () => {
		if (!posterFile) return setError('Choose a file first');
		const id = ensureEventId();
		if (!id) return;
		await run(async (signal) => {
			const fd = new FormData();
			fd.append('poster', posterFile);
			await addEventPoster(id, fd, { signal });
			if (mountedRef.current) setPosterFile(null);
		}, 'Poster added');
	};

	const handleRemovePoster = async (publicId) => {
		if (!publicId) return;
		if (!window.confirm('Remove poster?')) return;
		const id = ensureEventId();
		if (!id) return;
		await run((signal) => removeEventPoster(id, publicId, { signal }), 'Poster removed');
	};

	if (!open || !event) return null;

	// derive lists from event safely
	const partners = Array.isArray(event.partners) ? event.partners : [];
	const speakers = Array.isArray(event.speakers) ? event.speakers : [];
	const resources = Array.isArray(event.resources) ? event.resources : [];
	const coOrganizers = Array.isArray(event.coOrganizers) ? event.coOrganizers : [];
	const posters = Array.isArray(event.posters) ? event.posters : [];

	return (
		<div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60">
			<div className="w-full max-w-3xl sm:rounded-lg bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl">
				<div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
					<h3 className="text-lg font-semibold truncate">Manage: {event.title || '—'}</h3>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => onClose?.()}
							className="px-3 py-1 rounded bg-gray-800 text-white"
						>
							Close
						</button>
						<button
							type="button"
							onClick={() => onDone?.()}
							className="px-3 py-1 rounded bg-blue-600 text-white"
						>
							Done
						</button>
					</div>
				</div>

				<div className="flex flex-col md:flex-row">
					<nav className="hidden md:block w-40 border-r border-gray-800">
						{TABS.map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => {
									setTab(t);
									setError('');
								}}
								className={`w-full text-left px-4 py-3 ${
									tab === t
										? 'bg-gray-800 text-white'
										: 'text-gray-300 hover:bg-gray-800/40'
								}`}
							>
								{t === 'partners' && 'Partners'}
								{t === 'speakers' && 'Speakers'}
								{t === 'resources' && 'Resources'}
								{t === 'coOrganizers' && 'Co-organizers'}
								{t === 'posters' && 'Posters'}
							</button>
						))}
					</nav>

					<div className="md:hidden border-b border-gray-800 overflow-x-auto">
						<div className="flex gap-1 px-2">
							{TABS.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => {
										setTab(t);
										setError('');
									}}
									className={`px-3 py-2 rounded whitespace-nowrap ${
										tab === t
											? 'bg-gray-800 text-white'
											: 'text-gray-300 hover:bg-gray-800/40'
									}`}
								>
									{t === 'partners' && 'Partners'}
									{t === 'speakers' && 'Speakers'}
									{t === 'resources' && 'Resources'}
									{t === 'coOrganizers' && 'Co-organizers'}
									{t === 'posters' && 'Posters'}
								</button>
							))}
						</div>
					</div>

					<div className="flex-1 p-4 min-h-[300px] max-h-[70vh] overflow-y-auto">
						{error && <div className="mb-3 text-sm text-red-400">{error}</div>}

						{tab === 'partners' && (
							<div className="space-y-4">
								<div className="space-y-2">
									{partners.length === 0 && (
										<div className="text-sm text-gray-400">No partners</div>
									)}
									{partners.map((p, i) => (
										<div
											key={p._id || p.name || i}
											className="flex items-center justify-between bg-gray-800 rounded p-2"
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
													{p.logo?.url ? (
														<img
															src={p.logo.url}
															alt={p.name || 'partner logo'}
															className="object-cover w-full h-full"
														/>
													) : (
														<span className="text-xs text-gray-300">
															{(p.name || '')
																.slice(0, 2)
																.toUpperCase()}
														</span>
													)}
												</div>
												<div className="min-w-0">
													<div className="font-medium text-white truncate">
														{p.name}
													</div>
													<div className="text-xs text-gray-400 truncate">
														{p.website || p.tier || ''}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() =>
														handleRemovePartner(
															p.logo?.publicId ||
																p.logo?.public_id ||
																p.name
														)
													}
													className="text-red-400 p-1"
													disabled={loading}
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</div>
									))}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
									<input
										placeholder="Name"
										value={partnerForm.name}
										onChange={(e) =>
											setPartnerForm((v) => ({ ...v, name: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded w-full"
										disabled={loading}
									/>
									<input
										placeholder="Website"
										value={partnerForm.website}
										onChange={(e) =>
											setPartnerForm((v) => ({
												...v,
												website: e.target.value,
											}))
										}
										className="px-3 py-2 bg-gray-800 rounded w-full"
										disabled={loading}
									/>
									<div className="flex items-center gap-2">
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												setPartnerForm((v) => ({
													...v,
													logo: e?.target?.files?.[0] || null,
												}))
											}
											className="text-sm"
											disabled={loading}
										/>
										<button
											type="button"
											onClick={handleAddPartner}
											disabled={loading}
											className="px-3 py-2 bg-blue-600 rounded text-white"
										>
											<Plus className="inline-block mr-2 h-4 w-4" /> Add
										</button>
									</div>
								</div>
							</div>
						)}

						{tab === 'speakers' && (
							<div className="space-y-4">
								{speakers.length === 0 && (
									<div className="text-sm text-gray-400">No speakers</div>
								)}
								{speakers.map((s, idx) => (
									<div
										key={s._id || s.name || idx}
										className="flex items-center justify-between bg-gray-800 rounded p-2"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
												{s.photo?.url ? (
													<img
														src={s.photo.url}
														className="object-cover w-full h-full"
														alt={s.name || 'speaker photo'}
													/>
												) : (
													<User className="h-4 w-4 text-gray-300" />
												)}
											</div>
											<div className="min-w-0">
												<div className="font-medium text-white truncate">
													{s.name}
												</div>
												<div className="text-xs text-gray-400 truncate">
													{s.title}
												</div>
											</div>
										</div>
										<div>
											<button
												type="button"
												onClick={() => handleRemoveSpeaker(idx)}
												className="text-red-400 p-1"
												disabled={loading}
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</div>
								))}
								<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
									<input
										placeholder="Name"
										value={speakerForm.name}
										onChange={(e) =>
											setSpeakerForm((v) => ({ ...v, name: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded w-full"
										disabled={loading}
									/>
									<input
										placeholder="Title"
										value={speakerForm.title}
										onChange={(e) =>
											setSpeakerForm((v) => ({ ...v, title: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded w-full"
										disabled={loading}
									/>
									<input
										placeholder="Bio"
										value={speakerForm.bio}
										onChange={(e) =>
											setSpeakerForm((v) => ({ ...v, bio: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded w-full"
										disabled={loading}
									/>
									<div className="flex items-center gap-2">
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												setSpeakerForm((v) => ({
													...v,
													photo: e?.target?.files?.[0] || null,
												}))
											}
											className="text-sm"
											disabled={loading}
										/>
										<button
											type="button"
											onClick={handleAddSpeaker}
											disabled={loading}
											className="px-3 py-2 bg-blue-600 rounded text-white"
										>
											<Plus className="inline-block mr-2 h-4 w-4" /> Add
										</button>
									</div>
								</div>
							</div>
						)}

						{tab === 'resources' && (
							<div className="space-y-4">
								{resources.length === 0 && (
									<div className="text-sm text-gray-400">No resources</div>
								)}
								{resources.map((r, idx) => (
									<div
										key={r.title || r.url || idx}
										className="flex items-center justify-between bg-gray-800 rounded p-2"
									>
										<div className="min-w-0">
											<div className="font-medium text-white truncate">
												{r.title}
											</div>
											<div className="text-xs text-gray-400 truncate">
												{r.url}
											</div>
										</div>
										<div>
											<button
												type="button"
												onClick={() => handleRemoveResource(idx)}
												className="text-red-400 p-1"
												disabled={loading}
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</div>
								))}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
									<input
										placeholder="Title"
										value={resourceForm.title}
										onChange={(e) =>
											setResourceForm((v) => ({
												...v,
												title: e.target.value,
											}))
										}
										className="px-3 py-2 bg-gray-800 rounded w-full"
										disabled={loading}
									/>
									<input
										placeholder="URL"
										value={resourceForm.url}
										onChange={(e) =>
											setResourceForm((v) => ({ ...v, url: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded w-full"
										disabled={loading}
									/>
									<button
										type="button"
										onClick={handleAddResource}
										disabled={loading}
										className="px-3 py-2 bg-blue-600 rounded text-white"
									>
										<Plus className="inline-block mr-2 h-4 w-4" /> Add
									</button>
								</div>
							</div>
						)}

						{tab === 'coOrganizers' && (
							<div className="space-y-4">
								{coOrganizers.length === 0 && (
									<div className="text-sm text-gray-400">No co-organizers</div>
								)}
								{coOrganizers.map((c, idx) => (
									<div
										key={`${c}-${idx}`}
										className="flex items-center justify-between bg-gray-800 rounded p-2"
									>
										<div className="text-white truncate">{c}</div>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => handleRemoveCoIndex(idx)}
												className="text-red-400 p-1"
												disabled={loading}
											>
												<Trash2 className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() => handleRemoveCoName(c)}
												className="text-yellow-400 p-1"
												disabled={loading}
											>
												By name
											</button>
										</div>
									</div>
								))}
								<div className="flex gap-2">
									<input
										placeholder="Name"
										value={coName}
										onChange={(e) => setCoName(e.target.value)}
										className="px-3 py-2 bg-gray-800 rounded flex-1"
										disabled={loading}
									/>
									<button
										type="button"
										onClick={handleAddCo}
										disabled={loading}
										className="px-3 py-2 bg-blue-600 rounded text-white"
									>
										<Plus className="inline-block mr-2 h-4 w-4" /> Add
									</button>
								</div>
							</div>
						)}

						{tab === 'posters' && (
							<div className="space-y-4">
								{posters.length === 0 && (
									<div className="text-sm text-gray-400">No posters</div>
								)}
								<div className="flex gap-2 flex-wrap">
									{posters.map((p, idx) => (
										<div
											key={p.publicId || p.public_id || idx}
											className="w-32 bg-gray-800 rounded overflow-hidden p-1"
										>
											{p.url ? (
												<img
													src={p.url}
													alt={p.caption || 'poster'}
													className="object-cover w-full h-20"
												/>
											) : (
												<div className="h-20 bg-gray-700" />
											)}
											<div className="flex items-center justify-between mt-1">
												<div className="text-xs text-gray-300 truncate">
													{p.caption || ''}
												</div>
												<button
													type="button"
													onClick={() =>
														handleRemovePoster(
															p.publicId || p.public_id
														)
													}
													className="text-red-400 p-1"
													disabled={loading}
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</div>
									))}
								</div>
								<div className="flex items-center gap-2">
									<input
										type="file"
										accept="image/*"
										onChange={(e) =>
											setPosterFile(e?.target?.files?.[0] || null)
										}
										className="text-sm"
										disabled={loading}
									/>
									<button
										type="button"
										onClick={handleAddPoster}
										disabled={loading}
										className="px-3 py-2 bg-blue-600 rounded text-white"
									>
										<Plus className="inline-block mr-2 h-4 w-4" /> Add
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ManageModal;
