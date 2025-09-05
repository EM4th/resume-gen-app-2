"use client";

import { useEffect } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSense({ 
  adSlot, 
  adFormat = "auto", 
  fullWidthResponsive = true,
  style = { display: 'block' },
  className = ""
}: AdSenseProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS !== 'false';

  console.log('AdSense render:', { adSlot, isDevelopment, adsEnabled, className });

  useEffect(() => {
    console.log('AdSense useEffect:', { isDevelopment, adsEnabled });
    if (!isDevelopment && adsEnabled) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [isDevelopment, adsEnabled]);

  console.log('AdSense showing placeholder:', isDevelopment || !adsEnabled);

  // Show placeholder in development or when ads are disabled
  if (isDevelopment || !adsEnabled) {
    return (
      <div className={`adsense-container ${className}`}>
        <div 
          style={{
            ...style,
            backgroundColor: '#f8f9fa',
            border: '2px dashed #dee2e6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            minHeight: '150px',
          }}
        >
          <div className="text-center p-4">
            <div className="text-2xl mb-2">📢</div>
            <div>Advertisement Space</div>
            <div className="text-xs mt-1">
              Slot: {adSlot}
            </div>
            <div className="text-xs mt-1 font-semibold">
              ✅ AdSense Approved - Ready for Real Ads!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-7524647518323966"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}
