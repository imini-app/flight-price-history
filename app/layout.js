import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Flight Price History',
  description: 'Track and explore historic flight prices for major international routes',
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}