import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Resume Generator | resume-gen.app",
  description: "Instantly tailor your resume for any job description with the power of AI. Free online tool with PDF and Word download.",
  keywords: "AI resume generator, resume builder, job application, ATS optimization, career tools",
  openGraph: {
    title: "AI Resume Generator | resume-gen.app",
    description: "Transform your resume with AI to match any job description perfectly",
    url: "https://www.resume-gen.app",
    siteName: "AI Resume Generator",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "google-adsense-account": "ca-pub-7524647518323966",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="corporate">
      <head>
        {/* Import Inter font via CSS instead of next/font to avoid build-time network issues */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7524647518323966"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        
        {children}
        
        {/* Google AdSense Auto Ads */}
        <Script id="google-adsense-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined' && !window.adsbygoogle_initialized) {
              try {
                (adsbygoogle = window.adsbygoogle || []).push({
                  google_ad_client: "ca-pub-7524647518323966",
                  enable_page_level_ads: true
                });
                window.adsbygoogle_initialized = true;
                console.log('AdSense page-level ads initialized');
              } catch (error) {
                console.error('AdSense initialization error:', error);
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}
