import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScannerModal({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState('');

  const handleScan = (data: any) => {
    if (data && data.text) {
      // Check if it's a URL and extract the patient ID
      const text = data.text;
      if (text.includes('/doctor/patient/')) {
        const parts = text.split('/');
        const patientId = parts[parts.length - 1];
        onScan(patientId);
      } else {
        onScan(text);
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError('Could not access camera. Please check permissions.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Camera className="w-5 h-5 text-blue-600" />
            Scan QR Code
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative aspect-square bg-gray-900 rounded-2xl overflow-hidden shadow-inner">
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Scanner Overlay UI */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-blue-500/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-lg" />
              </div>
            </div>
          </div>
          
          {error && (
            <p className="mt-4 text-sm text-red-600 font-medium text-center">{error}</p>
          )}
          
          <p className="mt-6 text-xs text-gray-400 text-center uppercase tracking-widest font-bold">
            Align Patient QR within frame
          </p>
        </div>
      </div>
    </div>
  );
}
