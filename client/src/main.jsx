import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';
import './design.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client for React Query
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Stale-while-revalidate strategy
			staleTime: 1000 * 60 * 5, // 5 minutes
			// Refetch data automatically when the window is focused
			refetchOnWindowFocus: true,
			// Retry failed queries up to 2 times
			retry: 2,
		},
	},
});

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<ThemeProvider>
			<BrowserRouter>
				<AuthProvider>
					<QueryClientProvider client={queryClient}>
						<App />
					</QueryClientProvider>
				</AuthProvider>
			</BrowserRouter>
		</ThemeProvider>
	</React.StrictMode>
);
