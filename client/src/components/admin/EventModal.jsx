import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';

const MAX_POSTERS = 5;

const EventModal = ({
	isEdit,
	open,
	onClose,
	eventFields,
	setEventFields,
	onSubmit,
	loading,
	existingPosters = [],
	onRemovePoster = null,
}) => {
	const [tagsInput, setTagsInput] = useState((eventFields.tags || []).join(', '));
	const [localError, setLocalError] = useState('');
	const [activeTab, setActiveTab] = useState('basic');
	const firstInputRef = useRef(null);

	useEffect(() => {
		setTagsInput((eventFields.tags || []).join(', '));
	}, [eventFields.tags, open]);

	useEffect(() => {
		if (open && firstInputRef.current) {
			firstInputRef.current.focus();
		}
	}, [open]);

	useEffect(() => {
		if (open) document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	useEffect(() => {
		const onEsc = (e) => {
			if (e.key === 'Escape') onClose?.();
		};
		if (open) window.addEventListener('keydown', onEsc);
		return () => window.removeEventListener('keydown', onEsc);
	}, [open, onClose]);

	if (!open) return null;

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		if (type === 'checkbox') {
			setEventFields((prev) => ({ ...prev, [name]: checked }));
			return;
		}
		setEventFields((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;
		const existingCount = (eventFields.posters || []).length + (existingPosters || []).length;
		if (existingCount + files.length > MAX_POSTERS) {
			setLocalError(`You can upload a maximum of ${MAX_POSTERS} posters (existing + new).`);
			return;
		}
		setLocalError('');
		setEventFields((prev) => ({ ...prev, posters: [...(prev.posters || []), ...files] }));
		// clear input value
		e.target.value = null;
	};

	const handleRemoveNewPoster = (idx) => {
		setEventFields((prev) => {
			const arr = Array.isArray(prev.posters) ? [...prev.posters] : [];
			arr.splice(idx, 1);
			return { ...prev, posters: arr };
		});
	};

	const handleTagsBlur = () => {
		const arr = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		setEventFields((prev) => ({ ...prev, tags: arr }));
	};

	const handleTagKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleTagsBlur();
		}
	};

	const handleArrayChange = (field, idx, key, value) => {
		setEventFields((prev) => {
			const arr = Array.isArray(prev[field]) ? [...prev[field]] : [];
			arr[idx] = { ...arr[idx], [key]: value };
			return { ...prev, [field]: arr };
		});
	};

	const handleAddArrayItem = (field, template) => {
		setEventFields((prev) => {
			const arr = Array.isArray(prev[field]) ? [...prev[field]] : [];
			arr.push(template);
			return { ...prev, [field]: arr };
		});
	};

	const handleRemoveArrayItem = (field, idx) => {
		setEventFields((prev) => {
			const arr = Array.isArray(prev[field]) ? [...prev[field]] : [];
			arr.splice(idx, 1);
			return { ...prev, [field]: arr };
		});
	};

	const submit = async () => {
		setLocalError('');
		await onSubmit();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
			<div className="w-full max-w-3xl bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
				<div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
					<h3 className="text-lg font-semibold">
						{isEdit ? 'Edit Event' : 'Create Event'}
					</h3>
					<button onClick={onClose} className="p-2">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-4 space-y-4">
					{/* tabs */}
					<div className="flex gap-2">
						<button
							className={`px-3 py-1 rounded ${
								activeTab === 'basic'
									? 'bg-gray-800 text-white'
									: 'bg-transparent text-gray-300'
							}`}
							onClick={() => setActiveTab('basic')}
						>
							Basic
						</button>
						<button
							className={`px-3 py-1 rounded ${
								activeTab === 'registration'
									? 'bg-gray-800 text-white'
									: 'bg-transparent text-gray-300'
							}`}
							onClick={() => setActiveTab('registration')}
						>
							Registration
						</button>
						<button
							className={`px-3 py-1 rounded ${
								activeTab === 'media'
									? 'bg-gray-800 text-white'
									: 'bg-transparent text-gray-300'
							}`}
							onClick={() => setActiveTab('media')}
						>
							Media
						</button>
					</div>

					{localError && <div className="text-sm text-red-400">{localError}</div>}

					{/* Basic tab */}
					{activeTab === 'basic' && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<input
								ref={firstInputRef}
								name="title"
								placeholder="Title"
								value={eventFields.title || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded col-span-2"
							/>
							<input
								type="datetime-local"
								name="date"
								value={eventFields.date || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								name="eventTime"
								placeholder="Event Time (HH:MM)"
								value={eventFields.eventTime || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								name="location"
								placeholder="Venue"
								value={eventFields.location || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded col-span-2"
							/>
							<input
								name="category"
								placeholder="Category"
								value={eventFields.category || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								name="subcategory"
								placeholder="Subcategory"
								value={eventFields.subcategory || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<textarea
								name="description"
								placeholder="Description"
								value={eventFields.description || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded col-span-2"
								rows={4}
							/>
							<input
								name="organizer"
								placeholder="Organizer"
								value={eventFields.organizer || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								name="room"
								placeholder="Room"
								value={eventFields.room || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								name="totalSpots"
								placeholder="Total Spots"
								type="number"
								min="0"
								value={eventFields.totalSpots ?? ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								name="ticketPrice"
								placeholder="Ticket Price"
								type="number"
								min="0"
								step="0.01"
								value={eventFields.ticketPrice ?? ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<div className="col-span-2">
								<label className="text-sm text-gray-400">
									Tags (comma separated)
								</label>
								<input
									value={tagsInput}
									onChange={(e) => setTagsInput(e.target.value)}
									onBlur={handleTagsBlur}
									onKeyDown={handleTagKeyDown}
									className="w-full px-3 py-2 bg-gray-800 rounded mt-1"
								/>
							</div>
						</div>
					)}

					{/* Registration tab */}
					{activeTab === 'registration' && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<select
								name="registrationMode"
								value={eventFields.registrationMode || 'none'}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							>
								<option value="none">No registration</option>
								<option value="internal">Internal</option>
								<option value="external">External</option>
							</select>
							<input
								name="externalUrl"
								placeholder="External registration URL"
								value={eventFields.externalUrl || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								type="datetime-local"
								name="registrationOpenDate"
								value={eventFields.registrationOpenDate || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<input
								type="datetime-local"
								name="registrationCloseDate"
								value={eventFields.registrationCloseDate || ''}
								onChange={handleChange}
								className="px-3 py-2 bg-gray-800 rounded"
							/>
							<div className="flex items-center gap-2 col-span-2">
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										name="allowGuests"
										checked={!!eventFields.allowGuests}
										onChange={handleChange}
									/>
									<span className="text-sm">Allow guests</span>
								</label>
								<input
									name="capacityOverride"
									placeholder="Capacity override"
									type="number"
									min="0"
									value={eventFields.capacityOverride ?? ''}
									onChange={handleChange}
									className="px-3 py-2 bg-gray-800 rounded"
								/>
							</div>
						</div>
					)}

					{/* Media tab */}
					{activeTab === 'media' && (
						<div className="space-y-3">
							<div>
								<label className="text-sm text-gray-400">Existing posters</label>
								<div className="flex gap-2 mt-2 flex-wrap">
									{(existingPosters || []).map((p, i) => (
										<div
											key={i}
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
												{onRemovePoster && (
													<button
														onClick={() =>
															onRemovePoster(
																p.publicId || p.public_id
															)
														}
														className="text-red-400 p-1"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												)}
											</div>
										</div>
									))}
								</div>
							</div>

							<div>
								<label className="text-sm text-gray-400">Add posters</label>
								<div className="flex items-center gap-2 mt-2">
									<input
										type="file"
										accept="image/*"
										multiple
										onChange={handleFileChange}
									/>
									<button
										onClick={() => {}}
										className="px-3 py-2 bg-gray-800 rounded text-white"
										disabled
									>
										<Plus className="h-4 w-4" /> Upload
									</button>
								</div>
								{(eventFields.posters || []).length > 0 && (
									<div className="flex gap-2 mt-2 flex-wrap">
										{eventFields.posters.map((f, idx) => (
											<div
												key={idx}
												className="w-32 bg-gray-800 rounded overflow-hidden p-1"
											>
												<div className="h-20 flex items-center justify-center text-xs text-gray-300">
													{f.name}
												</div>
												<div className="flex items-center justify-between mt-1">
													<button
														onClick={() => handleRemoveNewPoster(idx)}
														className="text-red-400 p-1"
													>
														<Trash2 className="h-4 w-4" />
													</button>
													<span className="text-xs text-gray-400">
														{Math.round((f.size || 0) / 1024)} KB
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					<div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
						<button onClick={onClose} className="px-4 py-2 rounded bg-gray-800">
							Cancel
						</button>
						<button
							onClick={submit}
							disabled={loading}
							className="px-4 py-2 rounded bg-blue-600 text-white"
						>
							{loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create event'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EventModal;
