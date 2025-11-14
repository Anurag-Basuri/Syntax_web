import { CalendarDays, MapPin, BookOpen, X } from 'lucide-react';

const EventModal = ({ isEdit, open, onClose, eventFields, setEventFields, onSubmit, loading }) => {
	if (!open) return null;

	const handleChange = (e) => {
		const { name, value } = e.target;
		setEventFields((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e) => {
		const files = Array.from(e.target.files || []);
		setEventFields((prev) => ({ ...prev, posters: files }));
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
			<div className="w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
				<div className="flex justify-between items-center p-4 border-b border-gray-700">
					<h3 className="text-lg font-semibold text-white">
						{isEdit ? 'Edit Event' : 'Create New Event'}
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white rounded-full p-1"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6">
					<div className="space-y-5">
						<div>
							<label className="block text-sm text-gray-400 mb-1">
								Event Title *
							</label>
							<div className="relative">
								<BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									name="title"
									value={eventFields.title}
									onChange={handleChange}
									className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter event title"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm text-gray-400 mb-1">
									Date & Time *
								</label>
								<div className="relative">
									<CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										type="datetime-local"
										name="date"
										value={eventFields.date}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">
									Location *
								</label>
								<div className="relative">
									<MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										type="text"
										name="location"
										value={eventFields.location}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Enter location"
									/>
								</div>
							</div>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Description</label>
							<textarea
								name="description"
								value={eventFields.description}
								onChange={handleChange}
								rows="3"
								className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Describe your event..."
							></textarea>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Status</label>
							<select
								name="status"
								value={eventFields.status}
								onChange={handleChange}
								className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="upcoming">Upcoming</option>
								<option value="ongoing">Ongoing</option>
								<option value="completed">Completed</option>
							</select>
						</div>

						{/* Posters file input (create only or optional for edit) */}
						<div>
							<label className="block text-sm text-gray-400 mb-1">
								Event Posters {isEdit ? '(optional)' : '*'}
							</label>
							<input
								type="file"
								name="posters"
								onChange={handleFileChange}
								accept="image/*"
								multiple
								className="w-full text-sm text-gray-300 bg-gray-700/50 border border-gray-600 rounded-lg p-2"
							/>
							{eventFields.posters && eventFields.posters.length > 0 && (
								<div className="mt-2 text-xs text-gray-400">
									{eventFields.posters.map((f, i) => (
										<div key={i}>{f.name}</div>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
						>
							Cancel
						</button>
						<button
							onClick={onSubmit}
							disabled={loading}
							className={`px-6 py-2 rounded-lg text-white ${
								loading
									? 'bg-blue-500/50 cursor-not-allowed'
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
