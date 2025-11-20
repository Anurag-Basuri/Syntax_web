import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const EditPrizes = ({
	items = [],
	quickTitle,
	setQuickTitle,
	quickPosition,
	setQuickPosition,
	quickAmount,
	setQuickAmount,
	quickCurrency,
	setQuickCurrency,
	quickDescription,
	setQuickDescription,
	onAdd,
	onRemove,
	onReorder,
	onUpdate, // optional
	actionBusy,
}) => {
	return (
		<div className="mb-4">
			<div className="flex items-start justify-between mb-2 gap-3">
				<h4 className="font-semibold text-white">Prizes ({items.length})</h4>
				<div className="flex-1 flex items-start gap-2">
					<input
						value={quickTitle}
						onChange={(e) => setQuickTitle(e.target.value)}
						placeholder="Prize title (optional)"
						className="p-2 bg-white/5 rounded w-40"
					/>
					<input
						value={quickPosition}
						onChange={(e) => setQuickPosition(e.target.value)}
						placeholder="Position (e.g. 1st)"
						className="p-2 bg-white/5 rounded w-28"
					/>
					<input
						value={quickAmount}
						onChange={(e) => setQuickAmount(e.target.value)}
						placeholder="Amount"
						type="number"
						className="p-2 bg-white/5 rounded w-24"
					/>
					<select
						value={quickCurrency}
						onChange={(e) => setQuickCurrency(e.target.value)}
						className="p-2 bg-white/5 rounded w-24"
					>
						<option>INR</option>
						<option>USD</option>
						<option>EUR</option>
					</select>
					<textarea
						value={quickDescription}
						onChange={(e) => setQuickDescription(e.target.value)}
						placeholder="Short description (supports multiple lines)"
						className="p-2 bg-white/5 rounded flex-1 min-h-[56px] resize-y"
						rows={2}
					/>
					<button
						onClick={() =>
							onAdd({
								title: quickTitle?.trim(),
								position: quickPosition?.trim(),
								amount: quickAmount ? Number(quickAmount) : undefined,
								currency: quickCurrency,
								description: quickDescription?.trim(),
							})
						}
						disabled={actionBusy}
						className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
					>
						Add
					</button>
				</div>
			</div>

			<div className="space-y-2">
				{items.map((p, idx) => (
					<div
						key={String(p._id || p.id || idx)}
						className="flex items-start justify-between p-3 bg-white/3 rounded"
					>
						<div className="flex-1">
							<div className="font-medium text-white">
								{p.title || p.position || '(prize)'}
							</div>
							<div className="text-sm text-gray-400">
								{p.position}{' '}
								{p.amount ? `— ${p.amount} ${p.currency || 'INR'}` : ''}
							</div>
							<div className="text-sm text-gray-400 whitespace-pre-wrap mt-1">
								{p.description}
							</div>
						</div>
						<div className="flex gap-2 items-start">
							{onUpdate && (
								<button
									onClick={() => {
										const newTitle = prompt(
											'Prize title',
											p.title || ''
										)?.trim();
										const newPosition = prompt(
											'Prize position',
											p.position || ''
										)?.trim();
										const newAmountRaw = prompt(
											'Prize amount (leave empty to keep)',
											p.amount ?? ''
										)?.trim();
										const newDescription = prompt(
											'Prize description (multiline ok)',
											p.description || ''
										)?.trim();
										const payload = {};
										if (newTitle !== null) payload.title = newTitle;
										if (newPosition !== null) payload.position = newPosition;
										if (newAmountRaw !== null && newAmountRaw !== '')
											payload.amount = Number(newAmountRaw);
										if (newDescription !== null)
											payload.description = newDescription;
										onUpdate(p._id || p.id, payload);
									}}
									className="text-blue-400"
								>
									Edit
								</button>
							)}
							<button
								onClick={() => onRemove(p._id || p.id)}
								className="text-red-400"
							>
								Remove
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
				{items.length === 0 && (
					<div className="text-sm text-gray-400">No prizes defined</div>
				)}
			</div>
		</div>
	);
};

export default EditPrizes;
