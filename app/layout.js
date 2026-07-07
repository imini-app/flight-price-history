import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import HtmlLangUpdater from '@/components/HtmlLangUpdater';
import { I18nProvider } from '@/lib/i18n/context';
import { buildMetadata, getLocaleFromSearchParams, SITE_URL } from '@/lib/seo';

export const metadataBase = new URL(SITE_URL);

export function generateMetadata({ searchParams }) {
  const locale = getLocaleFromSearchParams(searchParams);
  return {
    ...buildMetadata({ locale }),
    keywords: ['flight prices', 'flight deals', 'cheap flights', 'flight history', 'best time to book', 'price tracker', 'airfare trends', 'flight price history', '机票价格', '特价机票', '最佳订票时间', '机票历史'],
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
  };
}

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
