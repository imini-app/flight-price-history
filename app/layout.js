import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import HtmlLangUpdater from '@/components/HtmlLangUpdater';
import { I18nProvider } from '@/lib/i18n/context';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://besttimetobook.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Best Time to Fly and Book',
    template: '%s — Flight Price History',
  },
  description: 'Track flight prices for 100+ international routes. Find the cheapest day to fly and the best time to book.',
  keywords: ['flight prices', 'flight deals', 'cheap flights', 'flight history', 'best time to book', 'price tracker', 'airfare trends', 'flight price history'],
  authors: [{ name: 'Flight Price History' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Best Time to Fly and Book',
    title: 'Best Time to Fly and Book',
    description: 'Track flight prices for 100+ international routes. Find the cheapest day to fly.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Time to Fly and Book',
    description: 'Track flight prices for 100+ international routes.',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="https://www.googletagmanager.com/gtag/js?id=G-QR4BPRQ4CQ" as="script" />
        <link
          rel="preload"
          href="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7333533619920700"
          as="script"
          crossOrigin=""
        />
      </head>
      <body>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-QR4BPRQ4CQ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QR4BPRQ4CQ');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7333533619920700"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Best Time to Fly and Book',
              description: 'Track flight prices for 100+ international routes.',
              url: SITE_URL,
              applicationCategory: 'TravelApplication',
              operatingSystem: 'All',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
        <I18nProvider>
          <HtmlLangUpdater />
          <Navbar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
