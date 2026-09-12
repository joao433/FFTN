import React from 'react';

interface ParkLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  monochrome?: boolean;
  altText?: string;
  variant?: 'default' | 'white' | 'auto';
}

export default function ParkLogo({
  className = '',
  size = 'md',
  altText = 'Family Fun Town - Parque de Diversões & Kart',
}: ParkLogoProps) {
  // Dimension presets to fit neatly maintaining original proportions without stretching
  const heightClasses = {
    sm: 'h-9 sm:h-10',
    md: 'h-11 sm:h-12 md:h-14',
    lg: 'h-16 sm:h-20 md:h-24',
    xl: 'h-24 sm:h-28 md:h-32',
  };

  // Official logo image: exactly the uploaded image file
  const logoSrc = '/logo-official.png';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt={altText}
        className={`${heightClasses[size] || heightClasses.md} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
        loading="eager"
        onError={(e) => {
          // Fallback to Supabase Storage if needed
          const target = e.currentTarget;
          const fallbackUrl =
            'https://hyfdqwnuvcyxrnmqikfu.supabase.co/storage/v1/object/public/package-images/uploads/1788902545141-p47475q-fd9118a6-7c86-4e98-8e43-d83153.png';
          if (target.src !== fallbackUrl) {
            target.src = fallbackUrl;
          }
        }}
      />
    </div>
  );
}
