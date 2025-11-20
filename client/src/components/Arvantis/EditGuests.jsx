import React from 'react';

const EditGuests = ({
	items = [],
	quickName,
	setQuickName,
	quickBio,
	setQuickBio,
	onAdd,
	onUpdate,
	onRemove,
	actionBusy,
}) => {
	return (
		<div className="mb-4">
			<div className="flex items-center justify-between mb-2">
				<h4 className="font-semibold text-white">Guests ({items.length})</h4>
				<div className="flex items-center gap-2">
					<input
						value={quickName}
						onChange={(e) => setQuickName(e.target.value)}
						placeholder="Name"
						className="p-2 bg-white/5 rounded w-44"
					/>
					<input
						value={quickBio}
						onChange={(e) => setQuickBio(e.target.value)}
						placeholder="Bio (short)"
						className="p-2 bg-white/5 rounded w-64"
					/>
					<button
						onClick={onAdd}
						disabled={actionBusy}
						className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
					>
						Add
					</button>
				</div>
			</div>

			<div className="space-y-2">
				{items.map((g, idx) => (
					<div
						key={String(g._id || g.id || idx)}
						className="flex items-center justify-between p-3 bg-white/3 rounded"
					>
						<div className="flex items-center gap-3">
							{g.photo?.url ? (
								<img
									src={g.photo.url}
									alt={g.name}
									className="w-10 h-10 object-cover rounded"
								/>
							) : (
								<div className="w-10 h-10 bg-gray-700 rounded" />
							)}
							<div>
								<div className="font-medium text-white">{g.name}</div>
								<div className="text-sm text-gray-400">{g.bio}</div>
							</div>
						</div>
						<div className="flex gap-2 items-center">
							<button
								onClick={() => onUpdate(g._id || g.id)}
								className="text-blue-400"
							>
								Edit
							</button>
							<button
								onClick={() => onRemove(g._id || g.id)}
								className="text-red-400"
							>
								Remove
							</button>
						</div>
					</div>
				))}
				{items.length === 0 && <div className="text-sm text-gray-400">No guests</div>}
			</div>
		</div>
	);
};

export default EditGuests;
