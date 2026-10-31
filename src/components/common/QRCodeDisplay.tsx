import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 140,
  className = '',
  includeMargin = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: includeMargin ? 2 : 0,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (error) => {
        if (error) {
          console.error('QR code generation error:', error);
        }
      }
    );
  }, [value, size, includeMargin]);

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
      <canvas ref={canvasRef} className="rounded-lg" />
    </div>
  );
};
