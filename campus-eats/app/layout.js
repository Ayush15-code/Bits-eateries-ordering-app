import './globals.css';
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}