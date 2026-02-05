import './globals.css';
export const metadata = {
  title: 'Bits Eateries',
  description: 'Ordering app for BITS Goa',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
