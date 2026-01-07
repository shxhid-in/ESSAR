import React, { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [secondaryLogo, setSecondaryLogo] = useState('');

  useEffect(() => {
    // Load secondary logo
    (window.electronAPI as any)?.getSecondaryLogoBase64?.().then((base64: string) => {
      if (base64) {
        setSecondaryLogo(base64);
      }
    });
  }, []);

  return (
    <div className="page-header">
      <div className="header-content">
        {secondaryLogo && (
          <div className="header-logo">
            <img 
              src={secondaryLogo} 
              alt="Company Logo" 
              className="header-logo-img"
              onError={(e) => {
                // Fallback if image doesn't load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="header-text">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
