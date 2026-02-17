// app/merchant/dashboard/layout.js

export const metadata = {
  title: 'Merchant Dashboard | CampusEats',
  description: 'BITS Goa Eatery Management',
};

// This resolves the "Unsupported metadata themeColor" warning
export const viewport = {
  themeColor: '#ea580c', 
};

export default function DashboardLayout({ children }) {
  return <>{children}</>;
}