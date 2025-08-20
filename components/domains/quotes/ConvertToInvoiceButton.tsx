'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Quote } from '@/lib/domains/quotes/types';

import { InvoiceConversionDialog } from './InvoiceConversionDialog';

interface ConvertToInvoiceButtonProps {
  quote: Quote;
  onSuccess: (invoiceId: string) => void;
}

export function ConvertToInvoiceButton({
  quote,
  onSuccess,
}: ConvertToInvoiceButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const handleConversionSuccess = (invoiceId: string) => {
    setShowDialog(false);
    onSuccess(invoiceId);
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="sm"
      >
        請求書作成
      </Button>

      <InvoiceConversionDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        quote={quote}
        onSuccess={handleConversionSuccess}
      />
    </>
  );
}
