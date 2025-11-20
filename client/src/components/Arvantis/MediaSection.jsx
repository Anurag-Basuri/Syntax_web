import React from 'react';
import { Trash2 } from 'lucide-react';

const MediaSection = ({
	editForm,
	mediaSelection,
	toggleMediaSelect,
	uploadPoster,
	removePoster,
	heroFile,
	setHeroFile,
	heroCaption,
	setHeroCaption,
	uploadHero,
	removeHero,
	addGallery,
	removeGalleryItem,
	actionBusy,
}) => {
	return (
		<>
			<div className="mb-4">
				<h4 className="font-semibold text-white mb-2">Posters</h4>
				<div className="flex gap-2 flex-wrap mb-3">
					{(editForm.posters || []).length === 0 && (
						<div className="text-sm text-gray-400">No posters uploaded</div>
					)}
					{(editForm.posters || []).map((p) => (
						<div
							key={p.publicId}
							className="relative w-36 h-48 bg-gray-800 rounded overflow-hidden"
						>
							{p.url && (
								<img
									src={p.url}
									alt={p.caption || ''}
									className="object-cover w-full h-full"
								/>
							)}
							<div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 flex items-center justify-between gap-2">
								<div className="text-xs text-white truncate">
									{p.caption || p.publicId}
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => removePoster(p.publicId)}
										disabled={actionBusy}
										className="text-red-400 p-1"
										title="Delete poster"
									>
										<Trash2 className="w-4 h-4" />
									</button>
									<button
										onClick={() => toggleMediaSelect(p.publicId)}
										className={`p-1 rounded-full ${
											mediaSelection.has(p.publicId)
												? 'bg-purple-600 text-white'
												: 'bg-black/50 text-purple-600'
										}`}
										aria-label="Select poster"
									>
										{mediaSelection.has(p.publicId) ? '✓' : 'P'}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
				<input
					type="file"
					multiple
					accept="image/*"
					onChange={(e) => uploadPoster(Array.from(e.target.files || []))}
					disabled={actionBusy}
				/>
			</div>

			<div className="mb-4">
				<h4 className="font-semibold text-white mb-2">Hero Image</h4>
				{editForm.hero ? (
					<div className="flex items-center gap-4 mb-2">
						<img
							src={editForm.hero.url}
							alt="hero"
							className="w-40 h-24 object-cover rounded"
						/>
						<div className="flex-1">
							<div className="text-sm text-gray-400 mb-1">
								{editForm.hero.caption || ''}
							</div>
							<input
								value={heroCaption}
								onChange={(e) => setHeroCaption(e.target.value)}
								placeholder="Edit hero caption (local)"
								className="p-2 bg-white/5 rounded w-full mb-2"
							/>
						</div>
						<div className="ml-auto flex gap-2">
							<button
								onClick={removeHero}
								disabled={actionBusy}
								className="px-3 py-1 rounded bg-red-600 text-white"
							>
								Delete Hero
							</button>
						</div>
					</div>
				) : (
					<div className="text-sm text-gray-400 mb-2">No hero image</div>
				)}

				<div className="flex gap-2 items-center">
					<input
						type="file"
						accept="image/*"
						onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
						disabled={actionBusy}
					/>
					<input
						type="text"
						placeholder="Caption (optional)"
						value={heroCaption}
						onChange={(e) => setHeroCaption(e.target.value)}
						className="p-2 bg-white/5 rounded flex-1"
						disabled={actionBusy}
					/>
					<button
						onClick={() => uploadHero(heroFile, heroCaption)}
						disabled={actionBusy || !heroFile}
						className="px-3 py-2 bg-emerald-600 text-white rounded"
					>
						Upload Hero
					</button>
				</div>
			</div>

			<div className="mb-4">
				<h4 className="font-semibold text-white mb-2">Gallery</h4>
				<div className="flex gap-2 flex-wrap mb-2">
					{editForm.gallery?.map((g, i) => (
						<div
							key={g.publicId || i}
							className="relative w-36 h-24 bg-gray-800 rounded overflow-hidden"
						>
							{g.url && (
								<img
									src={g.url}
									alt={g.caption || ''}
									className="object-cover w-full h-full"
								/>
							)}
							<button
								onClick={() => removeGalleryItem(g.publicId)}
								className="absolute top-1 right-1 p-1 bg-black/50 rounded text-red-400"
								aria-label="Remove gallery item"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					))}
					{editForm.gallery?.length === 0 && (
						<div className="text-sm text-gray-400">No gallery items</div>
					)}
				</div>
				<input
					type="file"
					multiple
					accept="image/*,video/*"
					onChange={(e) => addGallery(Array.from(e.target.files || []))}
					disabled={actionBusy}
				/>
			</div>
		</>
	);
};

export default MediaSection;
