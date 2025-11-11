import React, { useState } from 'react';
import ShowContacts from '../components/Showcontacts.jsx';
import ShowApplies from '../components/Showapplies.jsx';

const TabButton = ({ active, onClick, children }) => (
	<button
		onClick={onClick}
		className={`px-5 py-2 rounded-2xl font-medium ${
			active
				? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
				: 'bg-slate-800/60 text-gray-300 border border-slate-700'
		}`}
	>
		{children}
	</button>
);

const ShowPage = () => {
	const [view, setView] = useState('applications');

	return (
		<div className="min-h-screen bg-slate-950 relative">
			{/* subtle background */}
			<div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/5 to-cyan-900/5 pointer-events-none"></div>

			<div className="relative z-10 p-6">
				<div className="max-w-7xl mx-auto">
					<div className="flex gap-3 mb-6">
						<TabButton
							active={view === 'applications'}
							onClick={() => setView('applications')}
						>
							Applications
						</TabButton>
						<TabButton active={view === 'contacts'} onClick={() => setView('contacts')}>
							Contacts
						</TabButton>
					</div>

					{view === 'applications' ? <ShowApplies /> : <ShowContacts />}
				</div>
			</div>
		</div>
	);
};

export default ShowPage;
