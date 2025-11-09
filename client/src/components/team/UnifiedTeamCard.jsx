import React from 'react';

const UnifiedTeamCard = ({ member, onClick }) => {
	if (!member) return null;
	const initials = member.fullname
		.split(' ')
		.map((n) => n[0])
		.join('')
		.substring(0, 2)
		.toUpperCase();

	return (
		<div
			onClick={() => onClick?.(member)}
			className="group cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3 hover:shadow-md transition bg-transparent"
		>
			<div className="w-16 h-16 rounded-full overflow-hidden mx-auto border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
				{member.profilePicture ? (
					<img
						src={member.profilePicture}
						alt={member.fullname}
						className="w-full h-full object-cover"
						loading="lazy"
						onError={(e) => {
							e.target.onerror = null;
							e.target.src =
								`data:image/svg+xml;charset=UTF-8,` +
								encodeURIComponent(
									`<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='50%' dy='.35em' fill='white' font-family='Arial' font-size='20' text-anchor='middle'>${initials}</text></svg>`
								);
						}}
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
						{initials}
					</div>
				)}
			</div>
			<div className="text-center space-y-1">
				<h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
					{member.fullname}
				</h3>
				<p className="text-xs text-blue-600 dark:text-blue-300 truncate">
					{member.primaryDesignation || 'Member'}
				</p>
				<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
					{member.primaryDepartment || 'Department'}
				</p>
			</div>
			<button
				onClick={(e) => {
					e.stopPropagation();
					onClick?.(member);
				}}
				className="text-xs mt-auto w-full py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
			>
				View
			</button>
		</div>
	);
};

export default React.memo(UnifiedTeamCard);
