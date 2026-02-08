import './globals.css';
import { Providers } from './providers';
import ActiveOrderPopup from './components/ActiveOrderPopup';

export const metadata = {
  title: 'CampusEats | BITS Goa',
  description: 'Food ordering for BITSians',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="transition-colors duration-300 bg-gray-50 dark:bg-gray-950">
        <Providers>
          {/* Main content of the app */}
          {children}

          {/* This stays globally active at the bottom of the screen.
              It will only show up if there is an active order in localStorage.
          */}
          <ActiveOrderPopup />
        </Providers>
      </body>
    </html>
  );
}