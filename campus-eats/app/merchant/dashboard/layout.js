export const metadata = {
  title: 'Merchant Dashboard | CampusEats',
  description: 'BITS Goa Eatery Management',
};

export const viewport = {
  themeColor: '#ea580c', // Correct place for themeColor in Next.js 15
};

export default function DashboardLayout({ children }) {
  return (
    <section>
      {children}
    </section>
  );
}