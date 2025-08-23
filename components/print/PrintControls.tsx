'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Printer, ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PrintControlsProps {
  className?: string;
}

export function PrintControls({ className = '' }: PrintControlsProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(100);
  const [originalZoom, setOriginalZoom] = useState(100);

  // 印刷前後のズーム管理
  useEffect(() => {
    const handleBeforePrint = () => {
      setOriginalZoom(zoom);
      setZoom(100);
    };

    const handleAfterPrint = () => {
      setZoom(originalZoom);
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [zoom, originalZoom]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.back();
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  return (
    <div
      className={`print:hidden flex items-center justify-between mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}
      data-testid="print-controls"
    >
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
        <Button
          onClick={handlePrint}
          variant="default"
          size="sm"
          data-testid="print-button"
        >
          <Printer className="w-4 h-4 mr-2" />
          印刷
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">表示倍率:</span>
        <Button
          onClick={handleZoomOut}
          variant="outline"
          size="sm"
          disabled={zoom <= 50}
          aria-label="ズームアウト"
          data-testid="zoom-out-button"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span
          className="text-sm font-medium min-w-[3rem] text-center"
          aria-live="polite"
          data-testid="zoom-level"
        >
          {zoom}%
        </span>
        <Button
          onClick={handleZoomIn}
          variant="outline"
          size="sm"
          disabled={zoom >= 150}
          aria-label="ズームイン"
          data-testid="zoom-in-button"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      <style jsx>{`
        :global(.print-page) {
          transform: scale(${zoom / 100});
          transform-origin: top center;
        }
        @media print {
          :global(.print-page) {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
