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

      // Create descriptive filename: EventName_ClientName_Date.pdf
      const eventName = data.booking.event_type?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event';
      const clientName = data.booking.client?.organization_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Client';
      const bookingDate = new Date(data.booking.start_date).toISOString().split('T')[0];
      const fileName = `${eventName}_${clientName}_${bookingDate}.pdf`;
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
