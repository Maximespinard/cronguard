import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './app.css';

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">CronGuard</h1>
        <p className="mt-4 text-lg text-gray-400">Cron job monitoring, simplified.</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
