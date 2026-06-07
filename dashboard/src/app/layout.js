import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'CallTrack — Team Call Monitoring',
  description: 'Monitor your team call activity in real-time'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ style: { background: '#16213e', color: '#fff', border: '1px solid #1a1a2e' } }} />
      </body>
    </html>
  );
}
