import './globals.css';
import { Providers } from './providers';
import ActiveOrderPopup from './components/ActiveOrderPopup';

// Updated metadata for PWA support
export const metadata = {
  title: 'CampusEats | BITS Goa',
  description: 'Order food from BITS Goa eateries easily.',
  manifest: '/manifest.json', // Link to your public/manifest.json
  themeColor: '#ea580c', // Matches your orange branding
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusEats',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Additional tag for mobile address bar color */}
        <meta name="theme-color" content="#ea580c" />
      </head>
      <body className="transition-colors duration-300 bg-gray-50 dark:bg-gray-950">
        <Providers>
          {children}
          <ActiveOrderPopup />
        </Providers>
      </body>
    </html>
  );
}