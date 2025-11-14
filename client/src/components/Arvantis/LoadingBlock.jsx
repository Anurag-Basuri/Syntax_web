import { Loader2 } from 'lucide-react';

const LoadingBlock = ({ label = 'Loading...' }) => (
	<div className="py-16 flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
		<Loader2 className="animate-spin" />
		<span className="text-sm">{label}</span>
	</div>
);

export default LoadingBlock;
