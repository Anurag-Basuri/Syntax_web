import { CircleAlert } from 'lucide-react';

const ErrorBlock = ({ message, onRetry }) => (
	<div className="py-20 text-center">
		<CircleAlert className="w-10 h-10 mx-auto text-red-500 mb-3" />
		<h2 className="text-lg font-semibold mb-2">Failed to load Arvantis</h2>
		<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
		<button
			onClick={onRetry}
			className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
		>
			Retry
		</button>
	</div>
);

export default ErrorBlock;
