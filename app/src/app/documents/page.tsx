'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';

export default function DocumentsPage() {
  useAuth(); // Ensure user is authenticated
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGenerateQuotation = () => {
    setMessage({ type: 'success', text: 'To generate a quotation, please create or view a booking and use the "Generate Quotation" button.' });
  };

  const handleGenerateInvoice = () => {
    setMessage({ type: 'success', text: 'To generate an invoice, please create or view a confirmed booking and use the "Generate Invoice" button.' });
  };

  const handleGenerateDailyReport = async (format: 'pdf' | 'excel') => {
    try {
      setGenerating(true);
      setMessage(null);

      const response = await fetch(`/api/documents/daily-report?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate daily report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Daily_Report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: `Daily report generated successfully as ${format.toUpperCase()}!` });
    } catch (error) {
      console.error('Error generating daily report:', error);
      setMessage({ type: 'error', text: 'Failed to generate daily report. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateWeeklyReport = async (format: 'pdf' | 'excel') => {
    try {
      setGenerating(true);
      setMessage(null);

      const response = await fetch(`/api/documents/weekly-report?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate weekly report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Weekly_Report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: `Weekly report generated successfully as ${format.toUpperCase()}!` });
    } catch (error) {
      console.error('Error generating weekly report:', error);
      setMessage({ type: 'error', text: 'Failed to generate weekly report. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate quotations and invoices for bookings
          </p>
        </div>

        {message && (
          <Alert variant={message.type === 'success' ? 'info' : 'error'}>
            {message.text}
          </Alert>
        )}

        {/* Document Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Report Card */}
          <Card className="p-6">
            <div className="flex items-start">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Daily Report</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate tomorrow&apos;s events summary with all bookings, venues, and totals.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={() => handleGenerateDailyReport('pdf')}
                    disabled={generating}
                    size="sm"
                    variant="primary"
                  >
                    📄 PDF
                  </Button>
                  <Button 
                    onClick={() => handleGenerateDailyReport('excel')}
                    disabled={generating}
                    size="sm"
                    variant="secondary"
                  >
                    📊 Excel
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Weekly Report Card */}
          <Card className="p-6">
            <div className="flex items-start">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Weekly Report</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate next week&apos;s schedule showing all rooms and their bookings Mon-Sun.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={() => handleGenerateWeeklyReport('pdf')}
                    disabled={generating}
                    size="sm"
                    variant="primary"
                  >
                    📄 PDF
                  </Button>
                  <Button 
                    onClick={() => handleGenerateWeeklyReport('excel')}
                    disabled={generating}
                    size="sm"
                    variant="secondary"
                  >
                    📊 Excel
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Quotation Card */}
          <Card className="p-6">
            <div className="flex items-start">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Quotation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate professional quotations for potential bookings. Includes room details, pricing breakdown, and terms.
                </p>
                <div className="mt-4">
                  <Button 
                    onClick={handleGenerateQuotation}
                    disabled={generating}
                    size="sm"
                  >
                    📄 How to Generate
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Invoice Card */}
          <Card className="p-6">
            <div className="flex items-start">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Invoice</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate invoices for confirmed bookings. Includes payment details, due dates, and company information.
                </p>
                <div className="mt-4">
                  <Button 
                    onClick={handleGenerateInvoice}
                    disabled={generating}
                    size="sm"
                  >
                    📄 How to Generate
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How to Generate Documents</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-semibold">1</span>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">For Daily Reports</h4>
                <p className="text-sm text-gray-600">
                  Click the <strong>PDF</strong> or <strong>Excel</strong> button to generate tomorrow&apos;s events summary.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-semibold">2</span>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">For Weekly Reports</h4>
                <p className="text-sm text-gray-600">
                  Click the <strong>PDF</strong> or <strong>Excel</strong> button to generate next week&apos;s schedule (Mon-Sun) by room.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-semibold">3</span>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">For Quotations</h4>
                <p className="text-sm text-gray-600">
                  Go to <strong>Bookings</strong> → View a booking → Click <strong>Generate Quotation</strong> button
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-semibold">4</span>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">For Invoices</h4>
                <p className="text-sm text-gray-600">
                  Go to <strong>Bookings</strong> → View a <strong>confirmed</strong> booking → Click <strong>Generate Invoice</strong> button
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-semibold">5</span>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">Download</h4>
                <p className="text-sm text-gray-600">
                  All documents will be downloaded automatically to your computer in the selected format
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Document Features */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Document Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Professional Rainbow Towers branding
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Detailed pricing breakdown
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Client and booking information
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Terms and conditions
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Room and addon details
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              PDF format for easy sharing
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="flex gap-4">
          <Button 
            onClick={() => window.location.href = '/bookings'}
            variant="primary"
          >
            View Bookings
          </Button>
          <Button 
            onClick={() => window.location.href = '/bookings/new'}
            variant="secondary"
          >
            Create New Booking
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
