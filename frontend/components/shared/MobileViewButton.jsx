import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getBackendUrl } from '../../utils/config';

export default function MobileViewButton() {
  const [showQR, setShowQR] = useState(false);
  const [networkIp, setNetworkIp] = useState('');

  const isLocalHost = () => {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    );
  };

  useEffect(() => {
    if (!isLocalHost()) {
      return; // Skip fetching local network IP when deployed in production
    }

    const backendUrl = getBackendUrl();
    fetch(`${backendUrl}/api/network-ip`)
      .then(res => res.json())
      .then(data => setNetworkIp(data.ip))
      .catch(err => console.error('Failed to get network IP', err));
  }, []);

  const getMobileUrl = () => {
    if (!isLocalHost()) {
      return window.location.origin;
    }
    if (!networkIp || networkIp === '127.0.0.1') return 'http://localhost:5173';
    return `http://${networkIp}:5173`;
  };


  return (
    <>
      <button 
        className="btn-pill btn-pill-secondary hide-on-mobile" 
        onClick={() => setShowQR(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', width: '100%', marginTop: 'auto' }}
        title="Scan to view on mobile"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>qr_code_scanner</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mobile View</span>
      </button>

      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '2rem', maxWidth: '350px' }}>
            <h2>Scan to View on Mobile</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {isLocalHost()
                ? "Ensure your phone is on the same Wi-Fi network as this computer."
                : "Scan this QR code to view the live app on your mobile device."}
            </p>
            
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem' }}>
              <QRCodeSVG value={getMobileUrl()} size={200} />
            </div>
            
            <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              URL: {getMobileUrl()}
            </div>
            
            <button className="btn-pill btn-pill-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowQR(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
