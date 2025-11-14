import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';

const Modal = ({ title, children, onClose, size = 'md' }) => {
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const sizes = {
		sm: 'max-w-md',
		md: 'max-w-2xl',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl',
	};

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.2 }}
					className={`w-full ${sizes[size]} ${
						isDark
							? 'bg-gray-800 rounded-xl border border-gray-700 shadow-2xl'
							: 'bg-white rounded-xl border border-gray-200 shadow-lg'
					} overflow-hidden`}
				>
					<div
						className={`flex justify-between items-center p-4 border-b ${
							isDark ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'
						}`}
					>
						<h3 className="text-lg font-semibold">{title}</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-700 rounded-full p-1"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
					<div className={`p-6 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
						{children}
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default Modal;
