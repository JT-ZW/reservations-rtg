/**
 * Generate Quotation Button Component
 * Downloads PDF quotation for a booking
 */

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { generateQuotationPDF } from '@/lib/pdf/quotation-generator';

interface GenerateQuotationButtonProps {
  bookingId: string;
}

export default function GenerateQuotationButton({ bookingId }: GenerateQuotationButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      // Fetch quotation data from API
      const response = await fetch(`/api/bookings/${bookingId}/quotation`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotation data');
      }

      const data = await response.json();

      // Generate PDF
      const pdf = generateQuotationPDF(data);

      // Download PDF
      const fileName = `PROFORMA_INVOICE_${data.booking.booking_number}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating quotation:', error);
      alert('Failed to generate quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      loading={loading}
      disabled={loading}
      size="lg"
    >
      <span className="mr-2">📄</span>
      {loading ? 'Generating...' : 'Generate Quotation'}
    </Button>
  );
}
