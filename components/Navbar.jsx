'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const path = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/trend', label: 'Price Trend' },
    { href: '/explore', label: 'Explore Routes' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">✈ Flight Price History</Link>
        <div className="navbar-links">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`navbar-link ${path === link.href ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}