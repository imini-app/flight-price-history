import './globals.css';

export const metadata = {
  title: 'Flight Price History',
  description: 'Track and explore historic flight prices for major international routes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
