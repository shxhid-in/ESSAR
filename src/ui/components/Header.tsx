import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="page-header">
      <div className="header-content">
        <div className="header-logo">
          <img 
            src="/src/assets/trayIconTemplate.png" 
            alt="Essar Travel Hub Logo" 
            className="header-logo-img"
            onError={(e) => {
              // Fallback if image doesn't load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="header-text">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
