/**
 * Daily Report PDF Generator
 * Generates a PDF report of all bookings/events for tomorrow
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface DailyReportBooking {
  time: string;
  company: string;
  function: string;
  venue: string;
  organiser: string;
  pax: number;
  currency: string;
  amount: number;
  status: string;
  lobbySign: string;
}

interface DailyReportData {
  date: Date;
  bookings: DailyReportBooking[];
}

export async function generateDailyReportPDF(data: DailyReportData): Promise<Blob> {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Title
  const title = `FUNCTIONS DAILY SUMMARY ${format(data.date, 'dd MMMM yyyy').toUpperCase()}`;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 40);

  // Prepare table data
  const tableData = data.bookings.map(booking => [
    booking.time,
    booking.company,
    booking.function,
    booking.venue,
    booking.organiser,
    booking.pax.toString(),
    booking.currency,
    booking.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    booking.status,
    booking.lobbySign
  ]);

  // Calculate totals by currency
  const usdBookings = data.bookings.filter(b => b.currency === 'USD');
  const zwgBookings = data.bookings.filter(b => b.currency === 'ZWG');

  const usdTotal = usdBookings.reduce((sum, b) => sum + b.amount, 0);
  const zwgTotal = zwgBookings.reduce((sum, b) => sum + b.amount, 0);
  const totalPax = data.bookings.reduce((sum, b) => sum + b.pax, 0);

  // Add table
  autoTable(doc, {
    startY: 60,
    head: [[
      'TIME',
      'COMPANY',
      'FUNCTION',
      'VENUE',
      'ORGANISER',
      'PAX',
      'CURRENCY',
      'AMOUNT',
      'STATUS',
      'LOBBY SIGN'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'center' }, // TIME
      1: { cellWidth: 100 }, // COMPANY
      2: { cellWidth: 80 }, // FUNCTION
      3: { cellWidth: 80 }, // VENUE
      4: { cellWidth: 80 }, // ORGANISER
      5: { cellWidth: 40, halign: 'center' }, // PAX
      6: { cellWidth: 50, halign: 'center' }, // CURRENCY
      7: { cellWidth: 80, halign: 'right' }, // AMOUNT
      8: { cellWidth: 60, halign: 'center' }, // STATUS
      9: { cellWidth: 100 }, // LOBBY SIGN
    },
    didDrawPage: () => {
      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      const pageCurrent = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${pageCurrent} of ${pageCount}`,
        pageWidth - 100,
        doc.internal.pageSize.height - 20
      );
    },
  });

  // Add summary section
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  // Total PAX
  doc.setFillColor(220, 220, 220);
  doc.rect(40, finalY, 300, 25, 'F');
  doc.text('TOTAL PAX:', 50, finalY + 15);
  doc.text(totalPax.toString(), 250, finalY + 15);

  // USD Revenue
  if (usdTotal > 0) {
    doc.setFillColor(255, 248, 220);
    doc.rect(40, finalY + 30, 300, 25, 'F');
    doc.text('TOTAL REVENUE (USD):', 50, finalY + 45);
    doc.text(
      `$ ${usdTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      250,
      finalY + 45
    );
  }

  // ZWG Revenue
  if (zwgTotal > 0) {
    const zwgY = usdTotal > 0 ? finalY + 60 : finalY + 30;
    doc.setFillColor(240, 255, 240);
    doc.rect(40, zwgY, 300, 25, 'F');
    doc.text('TOTAL REVENUE (ZWG):', 50, zwgY + 15);
    doc.text(
      `ZWG ${zwgTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      250,
      zwgY + 15
    );
  }

  // Average Conference Rate (per PAX)
  if (totalPax > 0 && usdTotal > 0) {
    const avgRate = usdTotal / totalPax;
    const avgY = zwgTotal > 0 ? finalY + 90 : finalY + 60;
    doc.setFillColor(173, 216, 230);
    doc.rect(40, avgY, 300, 25, 'F');
    doc.text('AVERAGE CONF RATE (USD):', 50, avgY + 15);
    doc.text(
      `$ ${avgRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      250,
      avgY + 15
    );
  }

  // Footer with generation info
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    40,
    doc.internal.pageSize.height - 20
  );

  return doc.output('blob');
}
