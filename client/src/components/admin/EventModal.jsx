import React, { useState, useEffect, useRef } from 'react';
import {
	CalendarDays,
	MapPin,
	BookOpen,
	X,
	Tag,
	DollarSign,
	Users,
	UploadCloud,
	Clock,
	Link,
	Plus,
	Trash2,
} from 'lucide-react';

const MAX_POSTERS = 5;
const MAX_GALLERY = 10;

const EventModal = ({ isEdit, open, onClose, eventFields, setEventFields, onSubmit, loading }) => {
	const [tagsInput, setTagsInput] = useState((eventFields.tags || []).join(', '));
	const [localError, setLocalError] = useState('');
	const [activeTab, setActiveTab] = useState('basic');
	const firstInputRef = useRef(null);

	useEffect(() => {
		setTagsInput((eventFields.tags || []).join(', '));
	}, [eventFields.tags, open]);

	// focus first input when modal opens
	useEffect(() => {
		if (open) {
			setTimeout(() => {
				firstInputRef.current?.focus?.();
			}, 60);
		}
	}, [open]);

	// block background scroll while modal open
	useEffect(() => {
		if (!open) return;
		const prev = {
			overflow: document.documentElement.style.overflow,
			bodyOverflow: document.body.style.overflow,
		};
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
		return () => {
			document.documentElement.style.overflow = prev.overflow || '';
			document.body.style.overflow = prev.bodyOverflow || '';
		};
	}, [open]);

	// close on ESC
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	if (!open) return null;

	// handlers
	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		if (type === 'checkbox') {
			// checkboxes for registration.allowGuests etc.
			setEventFields((prev) => {
				// if checkbox is for nested registration
				if (name === 'allowGuests') {
					return {
						...prev,
						registration: { ...(prev.registration || {}), allowGuests: checked },
					};
				}
				return { ...prev, [name]: checked };
			});
			return;
		}

		// flattened registration fields supported by backend
		if (name === 'registrationMode') {
			setEventFields((prev) => ({
				...prev,
				registrationMode: value,
				registration: { ...(prev.registration || {}), mode: value },
			}));
			return;
		}
		if (name === 'externalUrl') {
			setEventFields((prev) => ({
				...prev,
				externalUrl: value,
				registration: { ...(prev.registration || {}), externalUrl: value },
			}));
			return;
		}
		// capacity override lives under registration
		if (name === 'capacityOverride') {
			setEventFields((prev) => ({
				...prev,
				registration: {
					...(prev.registration || {}),
					capacityOverride: value === '' ? undefined : value,
				},
			}));
			return;
		}

		// numeric keep as string; parent will normalize
		if (['totalSpots', 'ticketPrice'].includes(name)) {
			setEventFields((prev) => ({ ...prev, [name]: value }));
			return;
		}

		setEventFields((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e, field) => {
		const files = Array.from(e.target.files || []);
		if (field === 'posters') {
			if (files.length > MAX_POSTERS) {
				setLocalError(`Max ${MAX_POSTERS} posters allowed.`);
				return;
			}
			// keep raw File objects (EventsTab will append to FormData with key 'posters')
			setEventFields((prev) => ({ ...prev, posters: files }));
		} else if (field === 'gallery') {
			if (files.length > MAX_GALLERY) {
				setLocalError(`Max ${MAX_GALLERY} gallery images allowed.`);
				return;
			}
			setEventFields((prev) => ({ ...prev, gallery: files }));
		}
	};

	const handleTagsBlur = () => {
		const normalized =
			typeof tagsInput === 'string'
				? tagsInput
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				: [];
		setEventFields((prev) => ({ ...prev, tags: normalized }));
		setTagsInput(normalized.join(', '));
	};

	const handleTagKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleTagsBlur();
		}
	};

	// arrays helpers (coOrganizers, speakers, prerequisites, resources)
	const handleArrayChange = (field, idx, key, value) => {
		const arr = [...(eventFields[field] || [])];
		if (key === null) arr[idx] = value;
		else arr[idx] = { ...(arr[idx] || {}), [key]: value };
		setEventFields((prev) => ({ ...prev, [field]: arr }));
	};

	const handleAddArrayItem = (field, template) => {
		setEventFields((prev) => ({ ...prev, [field]: [...(prev[field] || []), template] }));
	};

	const handleRemoveArrayItem = (field, idx) => {
		const arr = [...(eventFields[field] || [])];
		arr.splice(idx, 1);
		setEventFields((prev) => ({ ...prev, [field]: arr }));
	};

	// tabs
	const tabs = [
		{ key: 'basic', label: 'Basic Info' },
		{ key: 'registration', label: 'Registration' },
		{ key: 'media', label: 'Media' },
	];

	return (
		// overlay: extremely high z-index and strong blur
		<div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
			{/* modal container */}
			<div
				className="w-full max-w-3xl bg-gray-900 rounded-xl border border-gray-800 shadow-[0_20px_50px_rgba(2,6,23,0.9)] overflow-hidden"
				role="dialog"
				aria-modal="true"
				aria-labelledby="event-modal-title"
			>
				{/* header */}
				<div className="flex justify-between items-center p-4 border-b border-gray-800">
					<h3 id="event-modal-title" className="text-lg font-semibold text-white">
						{isEdit ? 'Edit Event' : 'Create New Event'}
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white rounded-full p-1"
						aria-label="Close"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* tabs */}
				<div className="flex border-b border-gray-800 bg-gray-900/50">
					{tabs.map((tab) => (
						<button
							key={tab.key}
							className={`px-4 py-2 text-sm font-medium ${
								activeTab === tab.key
									? 'text-blue-400 border-b-2 border-blue-400'
									: 'text-gray-400'
							}`}
							onClick={() => setActiveTab(tab.key)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* content: constrained height, scrollable */}
				<div className="p-6 overflow-y-auto max-h-[85vh] scroll-smooth" tabIndex={0}>
					{localError && (
						<div className="mb-4 text-sm text-red-300 bg-red-900/10 p-2 rounded">
							{localError}
						</div>
					)}

					{/* BASIC */}
					{activeTab === 'basic' && (
						<div className="space-y-5">
							{/* title */}
							<div>
								<label className="block text-sm text-gray-400 mb-1">
									Event Title *
								</label>
								<div className="relative">
									<BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										ref={firstInputRef}
										name="title"
										value={eventFields.title || ''}
										onChange={handleChange}
										type="text"
										className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
										placeholder="Enter event title"
										required
									/>
								</div>
							</div>

							{/* date / category */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Date & Time *
									</label>
									<div className="relative">
										<CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
										<input
											name="date"
											value={eventFields.date || ''}
											onChange={handleChange}
											type="datetime-local"
											className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
											required
										/>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Times are sent as ISO (UTC) by parent.
									</p>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Optional Time (HH:MM)
									</label>
									<div className="relative">
										<Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
										<input
											name="eventTime"
											value={eventFields.eventTime || ''}
											onChange={handleChange}
											type="text"
											placeholder="14:30"
											className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Category *
									</label>
									<input
										name="category"
										value={eventFields.category || ''}
										onChange={handleChange}
										type="text"
										placeholder="Workshop, Competition..."
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
										required
									/>
								</div>
							</div>

							{/* venue / room / organizer */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Venue *
									</label>
									<div className="relative">
										<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
										<input
											name="location"
											value={eventFields.location || ''}
											onChange={handleChange}
											type="text"
											placeholder="Venue or address"
											className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
											required
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">Room</label>
									<input
										name="room"
										value={eventFields.room || ''}
										onChange={handleChange}
										type="text"
										placeholder="Room / hall"
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									/>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Organizer
									</label>
									<div className="relative">
										<Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
										<input
											name="organizer"
											value={eventFields.organizer || ''}
											onChange={handleChange}
											type="text"
											placeholder="Organizer name"
											className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
										/>
									</div>
								</div>
							</div>

							{/* description */}
							<div>
								<label className="block text-sm text-gray-400 mb-1">
									Description *
								</label>
								<textarea
									name="description"
									value={eventFields.description || ''}
									onChange={handleChange}
									rows={4}
									className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									placeholder="Describe the event (min 10 chars)"
									required
								/>
							</div>

							{/* subcategory / co-organizers */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Subcategory
									</label>
									<input
										name="subcategory"
										value={eventFields.subcategory || ''}
										onChange={handleChange}
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									/>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Co-organizers
									</label>
									{(eventFields.coOrganizers || []).map((co, idx) => (
										<div key={idx} className="flex gap-2 mb-2">
											<input
												value={co}
												onChange={(e) =>
													handleArrayChange(
														'coOrganizers',
														idx,
														null,
														e.target.value
													)
												}
												className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
											/>
											<button
												type="button"
												className="text-red-400"
												onClick={() =>
													handleRemoveArrayItem('coOrganizers', idx)
												}
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									))}
									<button
										type="button"
										className="mt-1 px-3 py-1 bg-blue-700/30 text-blue-300 rounded"
										onClick={() => handleAddArrayItem('coOrganizers', '')}
									>
										<Plus className="h-4 w-4 inline" /> Add
									</button>
								</div>
							</div>
						</div>
					)}

					{/* REGISTRATION */}
					{activeTab === 'registration' && (
						<div className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Mode</label>
									<select
										name="registrationMode"
										value={
											(eventFields.registration &&
												eventFields.registration.mode) ||
											eventFields.registrationMode ||
											'none'
										}
										onChange={handleChange}
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									>
										<option value="none">None</option>
										<option value="internal">Internal</option>
										<option value="external">External</option>
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										External URL
									</label>
									<div className="relative">
										<Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
										<input
											name="externalUrl"
											value={
												(eventFields.registration &&
													eventFields.registration.externalUrl) ||
												eventFields.externalUrl ||
												''
											}
											onChange={handleChange}
											type="url"
											placeholder="https://example.com/register"
											className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Allow Guests
									</label>
									<select
										name="allowGuests"
										value={
											(eventFields.registration &&
												String(eventFields.registration.allowGuests)) ||
											'true'
										}
										onChange={handleChange}
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									>
										<option value="true">Yes</option>
										<option value="false">No</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Registration open
									</label>
									<input
										name="registrationOpenDate"
										value={eventFields.registrationOpenDate || ''}
										onChange={(e) =>
											setEventFields((prev) => ({
												...prev,
												registrationOpenDate: e.target.value,
											}))
										}
										type="datetime-local"
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Registration close
									</label>
									<input
										name="registrationCloseDate"
										value={eventFields.registrationCloseDate || ''}
										onChange={(e) =>
											setEventFields((prev) => ({
												...prev,
												registrationCloseDate: e.target.value,
											}))
										}
										type="datetime-local"
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Capacity override
									</label>
									<input
										name="capacityOverride"
										value={
											(eventFields.registration &&
												eventFields.registration.capacityOverride) ??
											''
										}
										onChange={handleChange}
										type="number"
										min="0"
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Total Spots
									</label>
									<input
										name="totalSpots"
										value={eventFields.totalSpots ?? ''}
										onChange={handleChange}
										type="number"
										min="0"
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
										placeholder="0 = unlimited"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Ticket Price
									</label>
									<div className="relative">
										<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
										<input
											name="ticketPrice"
											value={eventFields.ticketPrice ?? ''}
											onChange={handleChange}
											type="number"
											min="0"
											step="0.01"
											className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
											placeholder="0 for free"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Status
									</label>
									<select
										name="status"
										value={eventFields.status || 'upcoming'}
										onChange={handleChange}
										className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									>
										<option value="upcoming">Upcoming</option>
										<option value="ongoing">Ongoing</option>
										<option value="completed">Completed</option>
										<option value="cancelled">Cancelled</option>
										<option value="postponed">Postponed</option>
									</select>
								</div>
							</div>
						</div>
					)}

					{/* MEDIA */}
					{activeTab === 'media' && (
						<div className="space-y-5">
							<div>
								<label className="block text-sm text-gray-400 mb-1">
									Event Posters {isEdit ? '(optional)' : '*'}
								</label>
								<div className="flex items-center gap-3">
									<label className="w-full cursor-pointer">
										<div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
											<UploadCloud className="h-5 w-5 text-gray-300" />
											<span className="text-sm">Choose poster images</span>
										</div>
										<input
											type="file"
											name="posters"
											onChange={(e) => handleFileChange(e, 'posters')}
											accept="image/*"
											multiple
											className="hidden"
										/>
									</label>
								</div>
								{eventFields.posters && eventFields.posters.length > 0 && (
									<div className="mt-2 flex gap-2 flex-wrap text-xs text-gray-400">
										{eventFields.posters.map((f, i) => (
											<div key={i}>{f.name}</div>
										))}
									</div>
								)}
								{!isEdit && (
									<p className="mt-2 text-xs text-gray-500">
										At least 1 poster required for creation (server expects
										'posters' files).
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Gallery</label>
								<div className="flex items-center gap-3">
									<label className="w-full cursor-pointer">
										<div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
											<UploadCloud className="h-5 w-5 text-gray-300" />
											<span className="text-sm">Choose gallery images</span>
										</div>
										<input
											type="file"
											name="gallery"
											onChange={(e) => handleFileChange(e, 'gallery')}
											accept="image/*"
											multiple
											className="hidden"
										/>
									</label>
								</div>
								{eventFields.gallery && eventFields.gallery.length > 0 && (
									<div className="mt-2 flex gap-2 flex-wrap text-xs text-gray-400">
										{eventFields.gallery.map((f, i) => (
											<div key={i}>{f.name}</div>
										))}
									</div>
								)}
							</div>

							{/* tags */}
							<div>
								<label className="block text-sm text-gray-400 mb-1">Tags</label>
								<div className="relative">
									<Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										name="tags"
										value={tagsInput}
										onChange={(e) => setTagsInput(e.target.value)}
										onBlur={handleTagsBlur}
										onKeyDown={handleTagKeyDown}
										placeholder="Comma separated tags"
										className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
									/>
								</div>
								{(eventFields.tags || []).length > 0 && (
									<div className="mt-2 flex flex-wrap gap-2">
										{eventFields.tags.map((t, i) => (
											<span
												key={i}
												className="px-2.5 py-0.5 text-xs bg-blue-600/20 text-blue-300 rounded-full"
											>
												{t}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* actions */}
					<div className="flex justify-end gap-3 pt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={onSubmit}
							disabled={loading}
							className={`px-6 py-2 rounded-lg text-white ${
								loading
									? 'bg-blue-600/50 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-500'
							}`}
						>
							{loading
								? isEdit
									? 'Updating...'
									: 'Creating...'
								: isEdit
								? 'Update Event'
								: 'Create Event'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EventModal;
