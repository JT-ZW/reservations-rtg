/**
 * Weekly Report PDF Generator
 * Generates a grid layout showing all rooms and their bookings for the week
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface WeeklyBooking {
  eventName: string;
  pax: number;
  duration: string;
  currency: string;
  amount: number;
}

interface WeeklyReportData {
  weekStart: Date; // Monday
  weekEnd: Date;   // Sunday
  rooms: Array<{
    name: string;
    bookings: {
      monday: WeeklyBooking[];
      tuesday: WeeklyBooking[];
      wednesday: WeeklyBooking[];
      thursday: WeeklyBooking[];
      friday: WeeklyBooking[];
      saturday: WeeklyBooking[];
      sunday: WeeklyBooking[];
    };
  }>;
}

export async function generateWeeklyReportPDF(data: WeeklyReportData): Promise<Blob> {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Calculate date range for title
  const startDate = format(data.weekStart, 'dd/MM/yy');
  const endDate = format(data.weekEnd, 'dd/MM/yy');
  
  // Title
  const title = `BANQUETING WEEKLY SUMMARY MONDAY ${startDate} - ${endDate}`;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 40);

  // Helper function to format cell content
  const formatBookings = (bookings: WeeklyBooking[]): string => {
    if (bookings.length === 0) return '';
    return bookings.map(b => 
      `${b.eventName}\n${b.pax}PAX ${b.duration}\n${b.currency}${b.amount.toLocaleString()}`
    ).join('\n\n');
  };

  // Get dates for each day
  const getDayDate = (dayOffset: number): string => {
    const date = new Date(data.weekStart);
    date.setDate(date.getDate() + dayOffset);
    return format(date, 'dd/MM/yy');
  };

  // Prepare table data
  const tableData = data.rooms.map(room => {
    return [
      room.name,
      formatBookings(room.bookings.monday),
      formatBookings(room.bookings.tuesday),
      formatBookings(room.bookings.wednesday),
      formatBookings(room.bookings.thursday),
      formatBookings(room.bookings.friday),
      formatBookings(room.bookings.saturday),
      formatBookings(room.bookings.sunday)
    ];
  });

  // Add table
  autoTable(doc, {
    startY: 60,
    head: [[
      'ROOM',
      `MONDAY\n${getDayDate(0)}`,
      `TUESDAY\n${getDayDate(1)}`,
      `WEDNESDAY\n${getDayDate(2)}`,
      `THURSDAY\n${getDayDate(3)}`,
      `FRIDAY\n${getDayDate(4)}`,
      `SATURDAY\n${getDayDate(5)}`,
      `SUNDAY\n${getDayDate(6)}`
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 5,
      valign: 'top',
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold', halign: 'center', valign: 'middle' }, // ROOM
      1: { cellWidth: 95 }, // Monday
      2: { cellWidth: 95 }, // Tuesday
      3: { cellWidth: 95 }, // Wednesday
      4: { cellWidth: 95 }, // Thursday
      5: { cellWidth: 95 }, // Friday
      6: { cellWidth: 95 }, // Saturday
      7: { cellWidth: 95 }, // Sunday
    },
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
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
