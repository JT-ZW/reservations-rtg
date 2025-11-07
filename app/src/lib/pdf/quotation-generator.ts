/**
 * Rainbow Towers Quotation PDF Generator
 * Generates professional proforma invoices matching company template EXACTLY
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface QuotationData {
  booking: {
    booking_number: string;
    event_name: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    currency?: string; // 'USD' or 'ZWG'
    line_items?: LineItem[]; // JSONB array
    notes?: string;
    client: {
      organization_name: string;
      contact_person: string;
      email: string;
      phone: string;
      address?: string;
      mobile?: string;
    };
    room: {
      name: string;
      capacity: number;
    };
    reservationist: {
      full_name: string;
      email: string;
      phone?: string;
      mobile?: string;
      facebook?: string;
      skype?: string;
    };
  };
}

export function generateQuotationPDF(data: QuotationData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // RTG Gold Color
  const goldColor: [number, number, number] = [218, 165, 32];
  const darkGold: [number, number, number] = [184, 134, 11];
  
  // Set default font to helvetica (closest to Century Gothic in jsPDF)
  doc.setFont('helvetica');
  
  // ============================================================
  // HEADER SECTION - Compact layout
  // ============================================================
  
  let yPos = 12;
  
  // LEFT SIDE: RTG Logo
  const logoPath = '/rtg-logo.png';
  try {
    doc.addImage(logoPath, 'PNG', 12, yPos, 35, 13);
  } catch {
    console.warn('Logo not found, continuing without it');
  }
  
  // CENTER/RIGHT: Hotel Information (more compact)
  const rightStart = 55;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGold);
  doc.text('THE RAINBOW TOWERS', rightStart, yPos + 4);
  
  // Stars - 5 star hotel rating
  doc.setFontSize(12);
  doc.setTextColor(...goldColor);
  doc.text('★ ★ ★ ★ ★', rightStart, yPos + 10);
  
  // Hotel details - more compact
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('PREMIER LEISURE HOTEL & CONFERENCE CENTRE', rightStart, yPos + 13);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('1 Pennefather Avenue, P.O. Box 3033, Causeway, Harare, Zimbabwe', rightStart, yPos + 16.5);
  doc.text('Tel: +263 242 772633 - 9', rightStart, yPos + 19.5);
  doc.text('Email: reservations@rtgafrica.com | Website: www.rtgafrica.com', rightStart, yPos + 22.5);
  
  // DATE (top right corner)
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`DATE: ${currentDate}`, pageWidth - 12, yPos, { align: 'right' });
  
  // PROFORMA INVOICE Header (gold bar) - moved down to not overlap
  yPos = 38;
  doc.setFillColor(...goldColor);
  doc.rect(12, yPos, pageWidth - 24, 7, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PROFORMA INVOICE', pageWidth / 2, yPos + 4.8, { align: 'center' });
  
  // ============================================================
  // TWO COLUMN LAYOUT: Client Details (Left) | VAT/Bank (Right)
  // ============================================================
  
  yPos = 50;
  const leftCol = 12;
  const labelCol = leftCol + 20;
  const rightCol = 115;
  
  // LEFT COLUMN HEADER: Contact Person
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Contact Person', leftCol, yPos);
  
  // RIGHT COLUMN HEADERS
  doc.text('VAT REG NUMBER', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('10001189', rightCol + 32, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('BANK DETAILS', rightCol, yPos);
  
  // Client details - LEFT SIDE (properly aligned)
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Company', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.booking.client.organization_name || '', labelCol, yPos);
  
  // Bank details - RIGHT SIDE
  doc.setFontSize(7);
  doc.text('Account Name: The Rainbow Towers', rightCol, yPos);
  
  yPos += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Phone', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.booking.client.phone || '', labelCol, yPos);
  
  doc.text('Bank Name: Stanbic', rightCol, yPos);
  
  yPos += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Address', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.booking.client.address || data.booking.client.phone || '', labelCol, yPos);
  
  doc.text('Branch: Nelson Mandela', rightCol, yPos);
  
  yPos += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Email', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.booking.client.email || '', labelCol, yPos);
  
  doc.text('Acc Number: 9140000892512', rightCol, yPos);
  
  yPos += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Mobile', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.booking.client.mobile || '', labelCol, yPos);
  
  doc.text('Nostro FCA', rightCol, yPos);
  
  // ============================================================
  // TABLE SECTION: Booking Details - Compact
  // ============================================================
  
  yPos += 6;
  
  // Event Name Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.booking.event_name, leftCol, yPos);
  
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('THE RAINBOW TOWERS HOTEL', leftCol, yPos);
  
  // Services Table
  yPos += 4;
  
  // Get currency (default to USD if not set)
  const currency = data.booking.currency || 'USD';
  const currencyLabel = currency === 'ZWG' ? 'ZWG' : 'US$';
  
  // Build table data - use line_items if available, otherwise fallback to room
  const tableData: string[][] = [];
  
  if (data.booking.line_items && Array.isArray(data.booking.line_items) && data.booking.line_items.length > 0) {
    // Use line items
    data.booking.line_items.forEach((item: LineItem) => {
      tableData.push([
        item.description || '',
        '',
        item.quantity.toString(),
        item.rate.toFixed(2),
        '1',
        item.amount.toFixed(2)
      ]);
    });
  } else {
    // Fallback to legacy room rental
    tableData.push([
      data.booking.room.name,
      '',
      '1',
      data.booking.total_amount.toFixed(2),
      '1',
      data.booking.total_amount.toFixed(2)
    ]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [[
      'REQUESTED SERVICE',
      'NO. OF PAX',
      'NO. OF\nROOMS',
      'UNIT PRICE/PER\nPERSON',
      'NO. OF\nDAYS',
      `TOTAL AMOUNT\n${currencyLabel}`
    ]],
    body: tableData,
    foot: [[
      '',
      '',
      '',
      '',
      `TOTAL\n${currencyLabel}`,
      data.booking.total_amount.toFixed(2)
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: goldColor,
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 1.5
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 1.5
    },
    bodyStyles: {
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1.5
    },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: 12, right: 12, top: 0, bottom: 0 },
    didDrawCell: (data) => {
      if (data.section === 'body' || data.section === 'foot') {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
      }
    }
  });

  // Get final Y position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY;
  
  // ============================================================
  // TERMS AND CONDITIONS - Same Page
  // ============================================================
  
  yPos = finalY + 6;
  
  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TERMS AND CONDITIONS', leftCol, yPos);
  
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  
  // Main Terms
  yPos += 4;
  const terms = [
    '1. The hotel will provide all required equipment for the conference at a cost.',
    '2. The hotel shall not allow clients to bring own equipment as this is a service provided by the hotel. Equipment shall include but not limited to PA systems, screens, translation equipment…………',
    '3. All Equipment needs to be communicated at the point of making a reservation.',
    '4. 100% of the total amount quoted is required within 48 hours of making an enquiry to guarantee your booking.',
    '5. Full payment is required for confirmation of the booking.',
    '6. Rates are subject to change without notice'
  ];
  
  terms.forEach(term => {
    const lines = doc.splitTextToSize(term, pageWidth - 24);
    doc.text(lines, leftCol, yPos);
    yPos += lines.length * 3;
  });
  
  // Airport Transfers
  yPos += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('AIRPORT TRANSFERS AND ACTIVITIES', leftCol, yPos);
  
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const heaText = 'The hotel through it\'s subsidiary Heritage Expeditions Africa ( HExA) provides the following ground handling services';
  const heaLines = doc.splitTextToSize(heaText, pageWidth - 24);
  doc.text(heaLines, leftCol, yPos);
  yPos += heaLines.length * 3;
  
  yPos += 2;
  doc.text('Shuttle Services', leftCol, yPos);
  yPos += 3;
  doc.text('City Tours', leftCol, yPos);
  yPos += 3;
  doc.text('Day Trips', leftCol, yPos);
  yPos += 3;
  doc.text('Various Activities', leftCol, yPos);
  
  // Cancellation Policy
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CANCELLATION POLICY', leftCol, yPos);
  
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Accommodation and conference rooms booked are subject to the following policy.', leftCol, yPos);
  
  yPos += 4;
  doc.text('15 - 29 Days', leftCol, yPos);
  doc.text('50% refund is made', leftCol + 50, yPos);
  
  yPos += 3;
  doc.text('8 - 14 Days', leftCol, yPos);
  doc.text('25% refund is made', leftCol + 50, yPos);
  
  yPos += 3;
  doc.text('0 - 7 Days', leftCol, yPos);
  doc.text('No refund', leftCol + 50, yPos);
  
  // Payment
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAYMENT', leftCol, yPos);
  
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const paymentText = 'We require confirmation of payment 2 weeks before arrival to secure your booking. Payment can be a purchase order, cash or bank tranfer.';
  const paymentLines = doc.splitTextToSize(paymentText, pageWidth - 24);
  doc.text(paymentLines, leftCol, yPos);
  yPos += paymentLines.length * 3;
  
  yPos += 2;
  const liabilityText = 'Please note that we hold the right to cancel your reservation if we have not received your full payment,an order or letter of commitment to pay';
  const liabilityLines = doc.splitTextToSize(liabilityText, pageWidth - 24);
  doc.text(liabilityLines, leftCol, yPos);
  yPos += liabilityLines.length * 3;
  
  yPos += 2;
  const quotationText = 'This quotation does not constitute an undertaking by RTG to provide the requested services.';
  const quotationLines = doc.splitTextToSize(quotationText, pageWidth - 24);
  doc.text(quotationLines, leftCol, yPos);
  yPos += quotationLines.length * 3;
  
  yPos += 2;
  const undertakingText = 'It will only remain a quotation and may only constitute an undertaking to provide services after both payment has been made and the booking confirmed.';
  const undertakingLines = doc.splitTextToSize(undertakingText, pageWidth - 24);
  doc.text(undertakingLines, leftCol, yPos);
  yPos += undertakingLines.length * 3;
  
  // Increase in Numbers
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('INCREASE IN NUMBERS OR ADDITIONAL SERVICES', leftCol, yPos);
  
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Day conferences – numbers to be communicated by 0900hrs', leftCol, yPos);
  yPos += 3;
  doc.text('Lunch Bookings – numbers to be communicated by 0900hrs', leftCol, yPos);
  yPos += 3;
  doc.text('Dinner/ Cocktail bookings – numbers to be communicated by 1200hrs', leftCol, yPos);
  
  yPos += 3;
  const reductionText = 'Please note that if there is no communication regarding the reduction of numbers, the hotel will charge as per original booking numbers.';
  const reductionLines = doc.splitTextToSize(reductionText, pageWidth - 24);
  doc.text(reductionLines, leftCol, yPos);
  yPos += reductionLines.length * 3;
  
  yPos += 2;
  const increaseText = 'In the event of an increase in numbers for either conferencing or accommodation bookings, the hotel will charge accordingly and your organisation will be required to provide order, commitment letter or payment within 24 hours.';
  const increaseLines = doc.splitTextToSize(increaseText, pageWidth - 24);
  doc.text(increaseLines, leftCol, yPos);
  yPos += increaseLines.length * 3;
  
  // No Shows
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('NO SHOWS', leftCol, yPos);
  
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const noShowText = 'Guests with a valid room reservation who do not arrive on the day of the reservation will be considered no-shows and the applicable room rate equal to one night stay will be charged.';
  const noShowLines = doc.splitTextToSize(noShowText, pageWidth - 24);
  doc.text(noShowLines, leftCol, yPos);
  yPos += noShowLines.length * 3;
  
  // Signature Section
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('If in agreement, please sign and return copy to certify confirmation', leftCol, yPos);
  
  yPos += 5;
  doc.text('Name', leftCol, yPos);
  doc.line(leftCol + 10, yPos, leftCol + 60, yPos);
  doc.text('Signature', leftCol + 70, yPos);
  doc.line(leftCol + 90, yPos, leftCol + 140, yPos);
  doc.text('Date', leftCol + 150, yPos);
  doc.line(leftCol + 160, yPos, pageWidth - 12, yPos);

  return doc;
}