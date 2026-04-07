'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import './preview.css';

export default function PreviewPage() {
  const [origin, setOrigin] = useState('');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setOrigin(window.location.origin);

    const handleResize = () => {
      const availableHeight = window.innerHeight - 80; // 40px padding top/bottom
      const availableWidth = window.innerWidth - 80;
      
      const scaleH = availableHeight / 844;
      const scaleW = availableWidth / 390;
      
      // Use the smaller scale but cap at 1
      const newScale = Math.min(scaleH, scaleW, 1);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!origin) return null;

  return (
    <div className="device-container">
      {/* Controls Overlay */}
      <div className="preview-controls">
        <h2>Simulação Mobile</h2>
        <p>Esta é uma pré-visualização em moldura de iPhone 15 para testes de UX mobile.</p>
        <Link href="/" className="btn-back">
          Voltar para Desktop
        </Link>
        <div style={{ marginTop: '10px', fontSize: '0.8rem', opacity: 0.6 }}>
          Pressione F12 para inspecionar e testar inputs touch se necessário.
        </div>
      </div>

      {/* iPhone Frame wrapper for scaling */}
      <div 
        className="iphone-frame-wrapper" 
        style={{ transform: `scale(${scale})` }}
      >
        <div className="iphone-frame">
          {/* Notch - Dynamic Island */}
          <div className="iphone-island" />
          
          {/* Webview - iframe loading the app root with ?preview=true */}
          <iframe 
            className="iphone-screen"
            src={`${origin}?preview=true`}
            title="Mobile Simulation"
          />

          {/* Home Indicator */}
          <div className="iphone-home-indicator" />
        </div>
      </div>
    </div>
  );
}
