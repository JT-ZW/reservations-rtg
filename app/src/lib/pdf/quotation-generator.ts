/**
 * Rainbow Towers Quotation PDF Generator
 * Generates professional proforma invoices matching company template EXACTLY
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuotationData {
  booking: {
    booking_number: string;
    event_name: string;
    start_date: string;
    end_date: string;
    total_amount: number;
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
  const pageHeight = doc.internal.pageSize.getHeight();

  // RTG Gold Color
  const goldColor: [number, number, number] = [218, 165, 32];
  const darkGold: [number, number, number] = [184, 134, 11];
  
  // ============================================================
  // PAGE 1: PROFORMA INVOICE
  // ============================================================
  
  let yPos = 15;
  
  // LEFT SIDE: RTG Logo (from public folder)
  const logoPath = '/rtg-logo.png';
  try {
    doc.addImage(logoPath, 'PNG', 12, yPos, 40, 15);
  } catch (error) {
    console.warn('Logo not found, continuing without it');
  }
  
  // RIGHT SIDE: Hotel Information
  const rightStart = 60;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGold);
  doc.text('THE RAINBOW', rightStart, yPos + 5);
  doc.text('TOWERS', rightStart, yPos + 12);
  
  // Stars
  doc.setFontSize(10);
  doc.text('★ ★ ★ ★ ★', rightStart, yPos + 18);
  
  // Hotel details
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('PREMIER LEISURE HOTEL & CONFERENCE CENTRE', rightStart, yPos + 24);
  
  doc.setFont('helvetica', 'normal');
  doc.text('1 Pennefather Avenue, P.O. Box 3033, Causeway, Harare, Zimbabwe', rightStart, yPos + 28);
  doc.text('Tel: +263 242 772633 - 9', rightStart, yPos + 32);
  doc.text('Email: reservations@rtgafrica.com', rightStart, yPos + 36);
  doc.text('Website: www.rtgafrica.com', rightStart, yPos + 40);
  
  // DATE (top right corner)
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`DATE: ${currentDate}`, pageWidth - 15, yPos, { align: 'right' });
  
  // PROFORMA INVOICE Header (gold bar)
  yPos = 50;
  doc.setFillColor(...goldColor);
  doc.rect(12, yPos, pageWidth - 24, 8, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PROFORMA INVOICE', pageWidth / 2, yPos + 5.5, { align: 'center' });
  
  // ============================================================
  // TWO COLUMN LAYOUT: Client Details (Left) | VAT/Bank (Right)
  // ============================================================
  
  yPos = 63;
  const leftCol = 12;
  const labelCol = leftCol + 18;
  const rightCol = 110;
  const rightLabelCol = rightCol + 30;
  
  // LEFT COLUMN HEADER: Contact Person (Client)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Contact Person', leftCol, yPos);
  
  // RIGHT COLUMN HEADER: VAT REG NUMBER
  doc.text('VAT REG NUMBER', rightCol, yPos);
  
  yPos += 1;
  
  // RIGHT: Bank Details Header
  doc.text('BANK DETAILS', rightCol, yPos + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('10001189', rightLabelCol + 15, yPos + 3);
  
  // Client details - LEFT SIDE
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  doc.text('Company', leftCol, yPos);
  doc.text(data.booking.client.contact_person || '', labelCol, yPos);
  
  // Bank details - RIGHT SIDE
  doc.text('Account Name: The Rainbow Towers', rightCol, yPos + 3);
  
  yPos += 4;
  doc.text('Phone', leftCol, yPos);
  doc.text(data.booking.client.organization_name || '', labelCol, yPos);
  
  doc.text('Bank Name: Stanbic', rightCol, yPos + 3);
  
  yPos += 4;
  doc.text('Address', leftCol, yPos);
  doc.text(data.booking.client.phone || '', labelCol, yPos);
  
  doc.text('Branch: Nelson Mandela', rightCol, yPos + 3);
  
  yPos += 4;
  doc.text('Email', leftCol, yPos);
  if (data.booking.client.address) {
    const addressLines = doc.splitTextToSize(data.booking.client.address, 60);
    doc.text(addressLines[0], labelCol, yPos);
  }
  
  doc.text('Acc Number: 9140000892512', rightCol, yPos + 3);
  
  yPos += 4;
  doc.text('Mobile', leftCol, yPos);
  doc.text(data.booking.client.email || '', labelCol, yPos);
  
  doc.text('Nostro FCA', rightCol, yPos + 3);
  
  yPos += 4;
  doc.text('', leftCol, yPos);
  doc.text(data.booking.client.mobile || '', labelCol, yPos);
  
  // LEFT COLUMN: Contact Person (Rainbow Towers Staff)
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Contact Person', leftCol, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Address', leftCol, yPos);
  doc.text(data.booking.reservationist.full_name || '', labelCol, yPos);
  
  yPos += 4;
  doc.text('', leftCol, yPos);
  doc.text('1 Pennefather Ave, Harare', labelCol, yPos);
  
  yPos += 4;
  doc.text('Phone', leftCol, yPos);
  doc.text(data.booking.reservationist.phone || '0242 772633', labelCol, yPos);
  
  yPos += 4;
  doc.text('Mobile', leftCol, yPos);
  doc.text(data.booking.reservationist.mobile || '', labelCol, yPos);
  
  yPos += 4;
  doc.text('Website', leftCol, yPos);
  doc.text('www.rtgafrica.com', labelCol, yPos);
  
  yPos += 4;
  doc.text('Facebook', leftCol, yPos);
  doc.text(data.booking.reservationist.facebook || 'rtgreservations', labelCol, yPos);
  
  yPos += 4;
  doc.text('Skype', leftCol, yPos);
  doc.text(data.booking.reservationist.skype || '', labelCol, yPos);
  
  // Event Name Header
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(data.booking.event_name, leftCol, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('THE RAINBOW TOWERS HOTEL', leftCol, yPos);
  
  // Services Table
  yPos += 6;
  
  const tableData = [[
    data.booking.room.name,
    '',
    '1',
    data.booking.total_amount.toFixed(2),
    '1',
    data.booking.total_amount.toFixed(2)
  ]];
  
  // Add additional services if needed
  if (data.booking.notes && data.booking.notes.includes('holding')) {
    tableData.push([
      'Holding rooms',
      '',
      '2',
      '250.00',
      '1',
      '500.00'
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
      'TOTAL AMOUNT\nUS$'
    ]],
    body: tableData,
    foot: [[
      '',
      '',
      '',
      '',
      'TOTAL\nUS$',
      data.booking.total_amount.toFixed(2)
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: goldColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: 12, right: 12 },
    didDrawCell: (data) => {
      // Ensure all cells have borders
      if (data.section === 'body' || data.section === 'foot') {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
      }
    }
  });

  // ============================================================
  // PAGE 2: TERMS AND CONDITIONS
  // ============================================================
  
  doc.addPage();
  yPos = 20;
  
  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TERMS AND CONDITIONS', leftCol, yPos);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Main Terms
  yPos += 6;
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
    yPos += lines.length * 4 + 1;
  });
  
  // Airport Transfers
  yPos += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('AIRPORT TRANSFERS AND ACTIVITIES', leftCol, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const heaText = 'The hotel through it\'s subsidiary Heritage Expeditions Africa ( HExA) provides the following ground handling services';
  const heaLines = doc.splitTextToSize(heaText, pageWidth - 24);
  doc.text(heaLines, leftCol, yPos);
  yPos += heaLines.length * 4;
  
  yPos += 3;
  doc.text('Shuttle Services', leftCol, yPos);
  yPos += 4;
  doc.text('City Tours', leftCol, yPos);
  yPos += 4;
  doc.text('Day Trips', leftCol, yPos);
  yPos += 4;
  doc.text('Various Activities', leftCol, yPos);
  
  // Cancellation Policy
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CANCELLATION POLICY', leftCol, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Accommodation and conference rooms booked are subject to the following policy.', leftCol, yPos);
  
  yPos += 6;
  doc.text('15 - 29 Days', leftCol, yPos);
  doc.text('50% refund is made', leftCol + 50, yPos);
  
  yPos += 4;
  doc.text('8 - 14 Days', leftCol, yPos);
  doc.text('25% refund is made', leftCol + 50, yPos);
  
  yPos += 4;
  doc.text('0 - 7 Days', leftCol, yPos);
  doc.text('No refund', leftCol + 50, yPos);
  
  // Payment
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PAYMENT', leftCol, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const paymentText = 'We require confirmation of payment 2 weeks before arrival to secure your booking. Payment can be a purchase order, cash or bank tranfer.';
  const paymentLines = doc.splitTextToSize(paymentText, pageWidth - 24);
  doc.text(paymentLines, leftCol, yPos);
  yPos += paymentLines.length * 4;
  
  yPos += 3;
  const liabilityText = 'Please note that we hold the right to cancel your reservation if we have not received your full payment,an order or letter of commitment to pay';
  const liabilityLines = doc.splitTextToSize(liabilityText, pageWidth - 24);
  doc.text(liabilityLines, leftCol, yPos);
  yPos += liabilityLines.length * 4;
  
  yPos += 3;
  const quotationText = 'This quotation does not constitute an undertaking by RTG to provide the requested services.';
  const quotationLines = doc.splitTextToSize(quotationText, pageWidth - 24);
  doc.text(quotationLines, leftCol, yPos);
  yPos += quotationLines.length * 4;
  
  yPos += 3;
  const undertakingText = 'It will only remain a quotation and may only constitute an undertaking to provide services after both payment has been made and the booking confirmed.';
  const undertakingLines = doc.splitTextToSize(undertakingText, pageWidth - 24);
  doc.text(undertakingLines, leftCol, yPos);
  yPos += undertakingLines.length * 4;
  
  // Increase in Numbers
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('INCREASE IN NUMBERS OR ADDITIONAL SERVICES', leftCol, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Day conferences – numbers to be communicated by 0900hrs', leftCol, yPos);
  yPos += 4;
  doc.text('Lunch Bookings – numbers to be communicated by 0900hrs', leftCol, yPos);
  yPos += 4;
  doc.text('Dinner/ Cocktail bookings – numbers to be communicated by 1200hrs', leftCol, yPos);
  
  yPos += 5;
  const reductionText = 'Please note that if there is no communication regarding the reduction of numbers, the hotel will charge as per original booking numbers.';
  const reductionLines = doc.splitTextToSize(reductionText, pageWidth - 24);
  doc.text(reductionLines, leftCol, yPos);
  yPos += reductionLines.length * 4;
  
  yPos += 3;
  const increaseText = 'In the event of an increase in numbers for either conferencing or accommodation bookings, the hotel will charge accordingly and your organisation will be required to provide order, commitment letter or payment within 24 hours.';
  const increaseLines = doc.splitTextToSize(increaseText, pageWidth - 24);
  doc.text(increaseLines, leftCol, yPos);
  yPos += increaseLines.length * 4;
  
  // No Shows
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NO SHOWS', leftCol, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const noShowText = 'Guests with a valid room reservation who do not arrive on the day of the reservation will be considered no-shows and the applicable room rate equal to one night stay will be charged.';
  const noShowLines = doc.splitTextToSize(noShowText, pageWidth - 24);
  doc.text(noShowLines, leftCol, yPos);
  yPos += noShowLines.length * 4;
  
  // Signature Section
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('If in agreement, please sign and return copy to certify confirmation', leftCol, yPos);
  
  yPos += 8;
  doc.text('Name', leftCol, yPos);
  doc.line(leftCol + 10, yPos, leftCol + 60, yPos);
  doc.text('Signature', leftCol + 70, yPos);
  doc.line(leftCol + 90, yPos, leftCol + 140, yPos);
  doc.text('Date', leftCol + 150, yPos);
  doc.line(leftCol + 160, yPos, pageWidth - 12, yPos);

  return doc;
}

// Usage example:
// const pdf = generateQuotationPDF(bookingData);
// pdf.save('Rainbow-Towers-Quotation.pdf');
// Or to display in browser: pdf.output('dataurlnewwindow');