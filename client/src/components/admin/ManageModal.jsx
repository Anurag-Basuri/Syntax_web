import React, { useEffect, useState } from 'react';
import { Trash2, Plus, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
	addEventPartner,
	removeEventPartner,
	addEventSpeaker,
	removeEventSpeaker,
	addEventResource,
	removeEventResource,
	addEventCoOrganizer,
	removeEventCoOrganizerByIndex,
	removeEventCoOrganizerByName,
	addEventPoster,
	removeEventPoster,
} from '../../services/eventServices.js';
import formatApiError from '../../utils/formatApiError.js';

const TABS = ['partners', 'speakers', 'resources', 'coOrganizers', 'posters'];

const ManageModal = ({ open = true, event, onClose, onDone, setParentError }) => {
	const [tab, setTab] = useState('partners');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [partnerForm, setPartnerForm] = useState({ name: '', website: '', logo: null });
	const [speakerForm, setSpeakerForm] = useState({ name: '', title: '', bio: '', photo: null });
	const [resourceForm, setResourceForm] = useState({ title: '', url: '' });
	const [coName, setCoName] = useState('');
	const [posterFile, setPosterFile] = useState(null);

	useEffect(() => {
		setError('');
		setPartnerForm({ name: '', website: '', logo: null });
		setSpeakerForm({ name: '', title: '', bio: '', photo: null });
		setResourceForm({ title: '', url: '' });
		setCoName('');
		setPosterFile(null);
	}, [event, open]);

	const handleApiError = (err) => {
		const msg = formatApiError(err);
		setError(msg);
		setParentError?.(msg);
		toast.error(msg);
	};

	// Partners
	const handleAddPartner = async () => {
		if (!partnerForm.name || !partnerForm.name.trim()) return setError('Name required');
		setError('');
		setLoading(true);
		try {
			let payload;
			if (partnerForm.logo instanceof File) {
				payload = new FormData();
				payload.append('name', partnerForm.name.trim());
				if (partnerForm.website) payload.append('website', partnerForm.website.trim());
				payload.append('logo', partnerForm.logo);
			} else {
				payload = {
					name: partnerForm.name.trim(),
					website: partnerForm.website?.trim(),
				};
			}
			await addEventPartner(event._id, payload);
			setPartnerForm({ name: '', website: '', logo: null });
			toast.success('Partner added');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemovePartner = async (ident) => {
		if (!ident) return;
		if (!window.confirm('Remove partner?')) return;
		setLoading(true);
		try {
			await removeEventPartner(event._id, ident);
			toast.success('Partner removed');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	// Speakers
	const handleAddSpeaker = async () => {
		if (!speakerForm.name || !speakerForm.name.trim()) return setError('Name required');
		setError('');
		setLoading(true);
		try {
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
			await addEventSpeaker(event._id, payload);
			setSpeakerForm({ name: '', title: '', bio: '', photo: null });
			toast.success('Speaker added');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveSpeaker = async (index) => {
		if (!window.confirm('Remove speaker?')) return;
		setLoading(true);
		try {
			await removeEventSpeaker(event._id, index);
			toast.success('Speaker removed');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	// Resources
	const handleAddResource = async () => {
		if (!resourceForm.title || !resourceForm.url) return setError('Title and URL required');
		setError('');
		setLoading(true);
		try {
			await addEventResource(event._id, {
				title: resourceForm.title.trim(),
				url: resourceForm.url.trim(),
			});
			setResourceForm({ title: '', url: '' });
			toast.success('Resource added');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveResource = async (index) => {
		if (!window.confirm('Remove resource?')) return;
		setLoading(true);
		try {
			await removeEventResource(event._id, index);
			toast.success('Resource removed');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	// Co-organizers
	const handleAddCo = async () => {
		if (!coName || !coName.trim()) return setError('Name required');
		setError('');
		setLoading(true);
		try {
			await addEventCoOrganizer(event._id, { name: coName.trim() });
			setCoName('');
			toast.success('Co-organizer added');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveCoIndex = async (idx) => {
		if (!window.confirm('Remove co-organizer?')) return;
		setLoading(true);
		try {
			await removeEventCoOrganizerByIndex(event._id, idx);
			toast.success('Co-organizer removed');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveCoName = async (name) => {
		if (!name) return;
		if (!window.confirm(`Remove co-organizer "${name}"?`)) return;
		setLoading(true);
		try {
			await removeEventCoOrganizerByName(event._id, name);
			toast.success('Co-organizer removed');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	// Posters
	const handleAddPoster = async () => {
		if (!posterFile) return setError('Choose a file first');
		setError('');
		setLoading(true);
		try {
			const fd = new FormData();
			fd.append('poster', posterFile);
			await addEventPoster(event._id, fd);
			setPosterFile(null);
			toast.success('Poster added');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemovePoster = async (publicId) => {
		if (!publicId) return;
		if (!window.confirm('Remove poster?')) return;
		setLoading(true);
		try {
			await removeEventPoster(event._id, publicId);
			toast.success('Poster removed');
			onDone && onDone();
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
		}
	};

	if (!open) return null;

	// derive lists from event
	const partners = event.partners || [];
	const speakers = event.speakers || [];
	const resources = event.resources || [];
	const coOrganizers = event.coOrganizers || [];
	const posters = event.posters || [];

	return (
		<div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60">
			<div className="w-full max-w-3xl bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
				<div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
					<h3 className="text-lg font-semibold">Manage: {event.title}</h3>
					<div className="flex items-center gap-2">
						<button
							onClick={() => onClose?.()}
							className="px-3 py-1 rounded bg-gray-800 text-white"
						>
							Close
						</button>
						<button
							onClick={() => onDone?.()}
							className="px-3 py-1 rounded bg-blue-600 text-white"
						>
							Done
						</button>
					</div>
				</div>

				<div className="flex">
					{/* tabs */}
					<nav className="w-40 border-r border-gray-800">
						{TABS.map((t) => (
							<button
								key={t}
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

					{/* content */}
					<div className="flex-1 p-4 min-h-[300px]">
						{error && <div className="mb-3 text-sm text-red-400">{error}</div>}

						{tab === 'partners' && (
							<div className="space-y-4">
								{/* list */}
								<div className="space-y-2">
									{partners.length === 0 && (
										<div className="text-sm text-gray-400">No partners</div>
									)}
									{partners.map((p, i) => (
										<div
											key={i}
											className="flex items-center justify-between bg-gray-800 rounded p-2"
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
													{p.logo?.url ? (
														<img
															src={p.logo.url}
															alt={p.name}
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
												<div>
													<div className="font-medium text-white">
														{p.name}
													</div>
													<div className="text-xs text-gray-400">
														{p.website || p.tier || ''}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() =>
														handleRemovePartner(
															p.logo?.publicId ||
																p.logo?.public_id ||
																p.name
														)
													}
													className="text-red-400 p-1"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</div>
									))}
								</div>

								{/* add */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
									<input
										placeholder="Name"
										value={partnerForm.name}
										onChange={(e) =>
											setPartnerForm((v) => ({ ...v, name: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded"
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
										className="px-3 py-2 bg-gray-800 rounded"
									/>
									<div className="flex items-center gap-2">
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												setPartnerForm((v) => ({
													...v,
													logo: e.target.files?.[0] || null,
												}))
											}
										/>
										<button
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
										key={idx}
										className="flex items-center justify-between bg-gray-800 rounded p-2"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
												{s.photo?.url ? (
													<img
														src={s.photo.url}
														className="object-cover w-full h-full"
														alt={s.name}
													/>
												) : (
													<User className="h-4 w-4 text-gray-300" />
												)}
											</div>
											<div>
												<div className="font-medium text-white">
													{s.name}
												</div>
												<div className="text-xs text-gray-400">
													{s.title}
												</div>
											</div>
										</div>
										<div>
											<button
												onClick={() => handleRemoveSpeaker(idx)}
												className="text-red-400 p-1"
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
										className="px-3 py-2 bg-gray-800 rounded"
									/>
									<input
										placeholder="Title"
										value={speakerForm.title}
										onChange={(e) =>
											setSpeakerForm((v) => ({ ...v, title: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded"
									/>
									<input
										placeholder="Bio"
										value={speakerForm.bio}
										onChange={(e) =>
											setSpeakerForm((v) => ({ ...v, bio: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded"
									/>
									<div className="flex items-center gap-2">
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												setSpeakerForm((v) => ({
													...v,
													photo: e.target.files?.[0] || null,
												}))
											}
										/>
										<button
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
										key={idx}
										className="flex items-center justify-between bg-gray-800 rounded p-2"
									>
										<div>
											<div className="font-medium text-white">{r.title}</div>
											<div className="text-xs text-gray-400 truncate">
												{r.url}
											</div>
										</div>
										<div>
											<button
												onClick={() => handleRemoveResource(idx)}
												className="text-red-400 p-1"
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
										className="px-3 py-2 bg-gray-800 rounded"
									/>
									<input
										placeholder="URL"
										value={resourceForm.url}
										onChange={(e) =>
											setResourceForm((v) => ({ ...v, url: e.target.value }))
										}
										className="px-3 py-2 bg-gray-800 rounded"
									/>
									<button
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
										key={idx}
										className="flex items-center justify-between bg-gray-800 rounded p-2"
									>
										<div className="text-white">{c}</div>
										<div className="flex gap-2">
											<button
												onClick={() => handleRemoveCoIndex(idx)}
												className="text-red-400 p-1"
											>
												<Trash2 className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleRemoveCoName(c)}
												className="text-yellow-400 p-1"
											>
												Remove by name
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
									/>
									<button
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
											key={idx}
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
													onClick={() =>
														handleRemovePoster(
															p.publicId || p.public_id
														)
													}
													className="text-red-400 p-1"
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
										onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
									/>
									<button
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
