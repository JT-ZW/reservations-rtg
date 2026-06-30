/**
 * PDF Document Generator
 * Generates quotations and invoices with Rainbow Towers branding
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Database } from '@/types/database.types';

type LineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  client?: Database['public']['Tables']['clients']['Row'];
  room?: Database['public']['Tables']['rooms']['Row'];
  event_type?: Database['public']['Tables']['event_types']['Row'];
  currency?: string; // 'USD' | 'ZWG'
  line_items?: LineItem[]; // JSONB array of line items
};

type BookingAddon = {
  addon?: { name: string; unit: string };
  quantity: number;
  rate: number;
  notes?: string | null;
};

interface DocumentData {
  booking: Booking;
  addons: BookingAddon[];
  documentNumber: string;
  documentType: 'quotation' | 'invoice';
}

// Rainbow Towers brand colors
const COLORS = {
  primary: [245, 158, 11] as [number, number, number], // amber-500
  secondary: [217, 119, 6] as [number, number, number], // amber-600
  text: [17, 24, 39] as [number, number, number], // gray-900
  textLight: [107, 114, 128] as [number, number, number], // gray-500
  border: [229, 231, 235] as [number, number, number], // gray-200
};

function drawStar(doc: jsPDF, centerX: number, centerY: number, radius: number, color: [number, number, number]) {
  const outerRadius = radius;
  const innerRadius = radius * 0.45;
  const points = 5;
  const coordinates: [number, number][] = [];

  for (let index = 0; index < points * 2; index += 1) {
    const currentRadius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (index * Math.PI / points);
    coordinates.push([
      centerX + currentRadius * Math.cos(angle),
      centerY + currentRadius * Math.sin(angle),
    ]);
  }

  doc.setFillColor(...color);
  doc.setDrawColor(...color);

  coordinates.forEach((coordinate, index) => {
    if (index === 0) {
      doc.moveTo(coordinate[0], coordinate[1]);
    } else {
      doc.lineTo(coordinate[0], coordinate[1]);
    }
  });

  doc.fill();
}

function drawStarRating(doc: jsPDF, x: number, y: number, size: number, color: [number, number, number], count = 5) {
  const spacing = size * 2.2;
  for (let index = 0; index < count; index += 1) {
    drawStar(doc, x + index * spacing, y, size, color);
  }
}

/**
 * Format currency
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formattedAmount = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  if (currency === 'ZWG') {
    return `ZWG ${formattedAmount}`;
  }
  
  return `$${formattedAmount}`;
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time
 */
function formatTime(timeString: string): string {
  return timeString.substring(0, 5); // HH:MM
}

/**
 * Add header with Rainbow Towers branding
 */
async function loadLogoImageData(): Promise<string | null> {
  try {
    const imagePath = path.join(process.cwd(), 'public', 'rtg-logo.png');
    const imageBuffer = await readFile(imagePath);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  } catch {
    return null;
  }
}

async function addHeader(doc: jsPDF, documentType: 'quotation' | 'invoice') {
  const logoImageData = await loadLogoImageData();
  const docTypeText = documentType === 'quotation' ? 'QUOTATION' : 'INVOICE';
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 8, pageWidth, 30, 'F');

  if (logoImageData) {
    try {
      doc.addImage(logoImageData, 'PNG', 15, 9, 24, 24);
    } catch {
      // Fall back to text-based header if the logo cannot be rendered
    }
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RAINBOW TOWERS HOTEL & CONFERENCE CENTRE', 52, 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Conference & Event Booking', 52, 22);
  doc.text('Harare, Zimbabwe | +263 4 251 666 | events@rainbowtowers.co.zw', 52, 27);
  
  doc.setFillColor(217, 119, 6);
  const textWidth = doc.getTextWidth(docTypeText);
  doc.roundedRect(pageWidth - textWidth - 27, 31, textWidth + 12, 7.5, 1.2, 1.2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(docTypeText, pageWidth - 21 - textWidth, 36, { align: 'right' });
}

/**
 * Add footer with page numbers
 */
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setDrawColor(...COLORS.border);
  doc.line(20, pageHeight - 20, 190, pageHeight - 20);
  
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Rainbow Towers Hotel | P.O. Box 1201, Harare, Zimbabwe',
    105,
    pageHeight - 12,
    { align: 'center' }
  );
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    105,
    pageHeight - 7,
    { align: 'center' }
  );
}

/**
 * Generate Quotation PDF
 */
export async function generateQuotation(data: DocumentData): Promise<Blob> {
  const doc = new jsPDF();
  const { booking, addons, documentNumber } = data;
  
  // Get currency from booking
  const currency = booking.currency || 'USD';
  
  // Header
  await addHeader(doc, 'quotation');
  
  // Document details
  let yPos = 60;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Quotation No: ${documentNumber}`, 20, yPos);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, 140, yPos);
  
  yPos += 7;
  doc.text(`Booking No: ${booking.booking_number}`, 20, yPos);
  doc.text(`Valid Until: ${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}`, 140, yPos);
  
  // Client information
  yPos += 12;
  doc.setFillColor(248, 250, 252); // gray-50
  doc.rect(20, yPos, 170, 35, 'F');
  
  yPos += 7;
  doc.setFontSize(11);
  doc.text('BILL TO:', 25, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  doc.text(booking.client?.organization_name || 'N/A', 25, yPos);
  yPos += 5;
  doc.text(`Attention: ${booking.client?.contact_person || 'N/A'}`, 25, yPos);
  yPos += 5;
  doc.text(`Email: ${booking.client?.email || 'N/A'}`, 25, yPos);
  yPos += 5;
  doc.text(`Phone: ${booking.client?.phone || 'N/A'}`, 25, yPos);
  
  // Event details
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EVENT DETAILS', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const eventDetails = [
    ['Event Name:', booking.event_name],
    ['Event Type:', booking.event_type?.name || 'N/A'],
    ['Room:', booking.room?.name || 'N/A'],
    ['Room Capacity:', `${booking.room?.capacity || 'N/A'} persons`],
    ['Expected Attendees:', `${booking.number_of_attendees || 'Not specified'} persons`],
    ['Date:', `${formatDate(booking.start_date)} to ${formatDate(booking.end_date)}`],
    ['Time:', `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`],
  ];
  
  eventDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPos);
    yPos += 5;
  });
  
  // Calculate number of days
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Items table
  yPos += 10;
  
  const tableData: (string | number)[][] = [];
  
  // Check if line_items exist and are not empty
  if (booking.line_items && Array.isArray(booking.line_items) && booking.line_items.length > 0) {
    // Use line items from booking
    booking.line_items.forEach((item: LineItem) => {
      tableData.push([
        item.description || 'N/A',
        '-', // No additional description column for line items
        item.quantity.toString(),
        formatCurrency(item.rate, currency),
        formatCurrency(item.amount, currency),
      ]);
    });
  } else {
    // Fallback to legacy room rental + addons approach
    // Room rental
    tableData.push([
      'Room Rental',
      `${booking.room?.name || 'N/A'}`,
      numberOfDays.toString(),
      formatCurrency(booking.room?.rate_per_day || 0, currency),
      formatCurrency((booking.room?.rate_per_day || 0) * numberOfDays, currency),
    ]);
    
    // Add-ons
    addons.forEach(addon => {
      tableData.push([
        addon.addon?.name || 'N/A',
        addon.notes || '-',
        addon.quantity.toString(),
        formatCurrency(addon.rate, currency),
        formatCurrency(addon.rate * addon.quantity, currency),
      ]);
    });
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Summary
  const finalY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  yPos = finalY + 10;
  
  const summaryX = 130;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  doc.text('Subtotal:', summaryX, yPos);
  doc.text(formatCurrency(booking.total_amount, currency), 190, yPos, { align: 'right' });
  
  if (booking.discount_amount > 0) {
    yPos += 6;
    doc.text('Discount:', summaryX, yPos);
    doc.text(`-${formatCurrency(booking.discount_amount, currency)}`, 190, yPos, { align: 'right' });
  }
  
  yPos += 8;
  doc.setDrawColor(...COLORS.border);
  doc.line(summaryX, yPos, 190, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', summaryX, yPos);
  doc.text(formatCurrency(booking.final_amount, currency), 190, yPos, { align: 'right' });
  
  // Terms and conditions
  yPos += 15;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TERMS & CONDITIONS', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  
  const terms = [
    '1. This quotation is valid for 30 days from the date of issue.',
    '2. A 50% deposit is required to confirm the booking.',
    '3. Full payment must be received 7 days before the event date.',
    '4. Cancellations made less than 14 days before the event will incur a 50% cancellation fee.',
    '5. Room setup and breakdown time is included in the booking.',
    '6. Additional charges may apply for services not included in this quotation.',
    '7. All prices are in US Dollars and exclude VAT where applicable.',
  ];
  
  terms.forEach(term => {
    doc.text(term, 20, yPos, { maxWidth: 170 });
    yPos += 5;
  });
  
  // Special requirements
  if (booking.special_requirements) {
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.text('SPECIAL REQUIREMENTS:', 20, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(booking.special_requirements, 20, yPos, { maxWidth: 170 });
  }
  
  // Footer
  addFooter(doc, 1, 1);
  
  return doc.output('blob');
}

/**
 * Generate Invoice PDF
 */
export async function generateInvoice(data: DocumentData): Promise<Blob> {
  const doc = new jsPDF();
  const { booking, addons, documentNumber } = data;
  
  // Get currency from booking
  const currency = booking.currency || 'USD';
  
  // Header
  await addHeader(doc, 'invoice');
  
  // Document details
  let yPos = 60;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: ${documentNumber}`, 20, yPos);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, 140, yPos);
  
  yPos += 7;
  doc.text(`Booking No: ${booking.booking_number}`, 20, yPos);
  
  // Payment status badge
  const isPaid = booking.status === 'completed';
  doc.setFillColor(isPaid ? 34 : 239, isPaid ? 197 : 68, isPaid ? 94 : 68);
  const statusText = isPaid ? 'PAID' : 'UNPAID';
  const statusWidth = doc.getTextWidth(statusText);
  doc.rect(185 - statusWidth - 8, yPos - 5, statusWidth + 6, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(statusText, 188 - statusWidth, yPos, { align: 'right' });
  
  doc.setTextColor(...COLORS.text);
  
  // Client information
  yPos += 12;
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, 170, 35, 'F');
  
  yPos += 7;
  doc.setFontSize(11);
  doc.text('BILL TO:', 25, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  doc.text(booking.client?.organization_name || 'N/A', 25, yPos);
  yPos += 5;
  doc.text(`Attention: ${booking.client?.contact_person || 'N/A'}`, 25, yPos);
  yPos += 5;
  doc.text(`Email: ${booking.client?.email || 'N/A'}`, 25, yPos);
  yPos += 5;
  doc.text(`Phone: ${booking.client?.phone || 'N/A'}`, 25, yPos);
  
  // Event details
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EVENT DETAILS', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const eventDetails = [
    ['Event Name:', booking.event_name],
    ['Event Type:', booking.event_type?.name || 'N/A'],
    ['Room:', booking.room?.name || 'N/A'],
    ['Date:', `${formatDate(booking.start_date)} to ${formatDate(booking.end_date)}`],
    ['Time:', `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`],
  ];
  
  eventDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPos);
    yPos += 5;
  });
  
  // Calculate number of days
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Items table
  yPos += 10;
  
  const tableData: (string | number)[][] = [];
  
  // Check if line_items exist and are not empty
  if (booking.line_items && Array.isArray(booking.line_items) && booking.line_items.length > 0) {
    // Use line items from booking
    booking.line_items.forEach((item: LineItem) => {
      tableData.push([
        item.description || 'N/A',
        '-', // No additional description column for line items
        item.quantity.toString(),
        formatCurrency(item.rate, currency),
        formatCurrency(item.amount, currency),
      ]);
    });
  } else {
    // Fallback to legacy room rental + addons approach
    // Room rental
    tableData.push([
      'Room Rental',
      `${booking.room?.name || 'N/A'}`,
      numberOfDays.toString(),
      formatCurrency(booking.room?.rate_per_day || 0, currency),
      formatCurrency((booking.room?.rate_per_day || 0) * numberOfDays, currency),
    ]);
    
    // Add-ons
    addons.forEach(addon => {
      tableData.push([
        addon.addon?.name || 'N/A',
        addon.notes || '-',
        addon.quantity.toString(),
        formatCurrency(addon.rate, currency),
        formatCurrency(addon.rate * addon.quantity, currency),
      ]);
    });
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Summary
  const finalY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  yPos = finalY + 10;
  
  const summaryX = 130;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  doc.text('Subtotal:', summaryX, yPos);
  doc.text(formatCurrency(booking.total_amount, currency), 190, yPos, { align: 'right' });
  
  if (booking.discount_amount > 0) {
    yPos += 6;
    doc.text('Discount:', summaryX, yPos);
    doc.text(`-${formatCurrency(booking.discount_amount, currency)}`, 190, yPos, { align: 'right' });
  }
  
  yPos += 8;
  doc.setDrawColor(...COLORS.border);
  doc.line(summaryX, yPos, 190, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('AMOUNT DUE:', summaryX, yPos);
  doc.text(formatCurrency(booking.final_amount, currency), 190, yPos, { align: 'right' });
  
  // Payment information
  yPos += 15;
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PAYMENT INFORMATION', 20, yPos);
  
  yPos += 8;
  doc.setFillColor(254, 243, 199); // amber-100
  doc.rect(20, yPos, 170, 35, 'F');
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Bank Details:', 25, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  const bankDetails = [
    'Bank Name: Standard Chartered Bank Zimbabwe',
    'Account Name: Rainbow Towers Hotel',
    'Account Number: 0100 1234 5678',
    'Branch: Harare',
    'Swift Code: SCBLZWHX',
  ];
  
  bankDetails.forEach(detail => {
    doc.text(detail, 25, yPos);
    yPos += 4;
  });
  
  // Payment terms
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PAYMENT TERMS', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  
  const paymentTerms = [
    '• Payment is due within 7 days of invoice date.',
    '• Please include the invoice number as payment reference.',
    '• For any payment queries, contact our accounts department at accounts@rainbowtowers.co.zw',
  ];
  
  paymentTerms.forEach(term => {
    doc.text(term, 20, yPos);
    yPos += 5;
  });
  
  // Footer
  addFooter(doc, 1, 1);
  
  return doc.output('blob');
}
