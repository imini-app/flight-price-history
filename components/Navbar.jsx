'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const path = usePathname();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: t('navbar.priceCheck') },
    { href: '/explore', label: t('navbar.routeHistory') },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>{t('navbar.brand')}</Link>
        <button
          className={`navbar-hamburger ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
        <div className={`navbar-right ${mobileOpen ? 'navbar-mobile-open' : ''}`}>
          <div className="navbar-links">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link ${path === link.href ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}