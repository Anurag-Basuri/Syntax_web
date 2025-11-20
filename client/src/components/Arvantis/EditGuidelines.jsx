import React from 'react';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const EditGuidelines = ({
	items = [],
	quickTitle,
	setQuickTitle,
	quickDetails,
	setQuickDetails,
	onAdd,
	onRemove,
	onReorder,
	actionBusy,
	onUpdate, // optional
}) => {
	return (
		<div className="mb-4">
			<div className="flex items-start justify-between mb-2 gap-3">
				<h4 className="font-semibold text-white">Guidelines ({items.length})</h4>
				<div className="flex-1 flex items-start gap-2">
					<input
						value={quickTitle}
						onChange={(e) => setQuickTitle(e.target.value)}
						placeholder="Short title (optional)"
						className="p-2 bg-white/5 rounded w-44"
					/>
					<textarea
						value={quickDetails}
						onChange={(e) => setQuickDetails(e.target.value)}
						placeholder="Details / instructions (supports multiple lines)"
						className="p-2 bg-white/5 rounded flex-1 min-h-[56px] resize-y"
						rows={3}
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
						className="flex items-start justify-between p-3 bg-white/3 rounded"
					>
						<div className="flex-1">
							<div className="font-medium text-white">{g.title || '(untitled)'}</div>
							{/* preserve line breaks and paragraphs */}
							<div className="text-sm text-gray-400 whitespace-pre-wrap mt-1">
								{g.details}
							</div>
						</div>
						<div className="flex gap-2 items-start">
							{onUpdate && (
								<button
									onClick={() => {
										const newTitle = prompt(
											'Edit guideline title',
											g.title || ''
										)?.trim();
										const newDetails = prompt(
											'Edit guideline details (multiline ok)',
											g.details || ''
										)?.trim();
										if (
											(newTitle !== null && newTitle !== g.title) ||
											(newDetails !== null && newDetails !== g.details)
										) {
											onUpdate(g._id || g.id, {
												title: newTitle ?? g.title,
												details: newDetails ?? g.details,
											});
										}
									}}
									className="text-blue-400"
								>
									Edit
								</button>
							)}
							<button
								onClick={() => onRemove(g._id || g.id)}
								className="text-red-400"
							>
								<Trash2 className="w-5 h-5" />
							</button>
							<button
								onClick={() => onReorder(idx, idx - 1)}
								disabled={idx === 0 || actionBusy}
								className="text-gray-400"
								title="Move up"
							>
								<ArrowUp />
							</button>
							<button
								onClick={() => onReorder(idx, idx + 1)}
								disabled={idx === items.length - 1 || actionBusy}
								className="text-gray-400"
								title="Move down"
							>
								<ArrowDown />
							</button>
						</div>
					</div>
				))}
				{items.length === 0 && <div className="text-sm text-gray-400">No guidelines</div>}
			</div>
		</div>
	);
};

export default EditGuidelines;
