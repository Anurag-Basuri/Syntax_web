import React from 'react';

const isoLocal = (v) => (v ? new Date(v).toISOString().slice(0, 16) : '');

const BasicDetails = ({ editForm, setEditForm, heroCaption, setHeroCaption }) => {
	return (
		<div className="grid grid-cols-2 gap-4 mb-4">
			<input
				value={editForm.location || ''}
				onChange={(e) => setEditForm((s) => ({ ...s, location: e.target.value }))}
				className="p-3 bg-white/5 rounded"
				placeholder="Location"
			/>
			<input
				value={editForm.contactEmail || ''}
				onChange={(e) => setEditForm((s) => ({ ...s, contactEmail: e.target.value }))}
				className="p-3 bg-white/5 rounded"
				placeholder="Contact email"
			/>
			<textarea
				value={editForm.description || ''}
				onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
				className="col-span-2 p-3 bg-white/5 rounded"
				rows={4}
				placeholder="Description"
			/>
			<input
				value={editForm.tagline || ''}
				onChange={(e) => setEditForm((s) => ({ ...s, tagline: e.target.value }))}
				className="p-3 bg-white/5 rounded"
				placeholder="Tagline (short)"
			/>
			<input
				type="datetime-local"
				value={isoLocal(editForm.startDate)}
				onChange={(e) => setEditForm((s) => ({ ...s, startDate: e.target.value || null }))}
				className="p-3 bg-white/5 rounded"
			/>
			<input
				type="datetime-local"
				value={isoLocal(editForm.endDate)}
				onChange={(e) => setEditForm((s) => ({ ...s, endDate: e.target.value || null }))}
				className="p-3 bg-white/5 rounded"
			/>
		</div>
	);
};

export default BasicDetails;
