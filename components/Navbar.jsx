'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const path = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: '/', label: t('navbar.priceCheck') },
    { href: '/explore', label: t('navbar.routeHistory') },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">{t('navbar.brand')}</Link>
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}