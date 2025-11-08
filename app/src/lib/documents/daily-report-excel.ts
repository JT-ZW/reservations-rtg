/**
 * Daily Report Excel Generator
 * Generates an Excel file matching the format from the daily summary template
 */

import * as XLSX from 'xlsx';
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

export async function generateDailyReportExcel(data: DailyReportData): Promise<Buffer> {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Prepare the data for the sheet
  const sheetData: (string | number)[][] = [];

  // Add title row
  sheetData.push([`FUNCTIONS DAILY SUMMARY ${format(data.date, 'dd MMMM yyyy').toUpperCase()}`]);
  sheetData.push([]); // Empty row

  // Add header row
  sheetData.push([
    'TIME',
    'COMPANY',
    'FUNCTION',
    'VENUE',
    'ORGANISER',
    'PAX',
    'USD',
    'ZIG RATE',
    'REVENUE',
    'STATUS',
    'LOBBY SIGN'
  ]);

  // Add booking rows
  data.bookings.forEach(booking => {
    // For the Excel format, we'll split currency into USD and ZIG columns
    const usdAmount = booking.currency === 'USD' ? booking.amount : '';
    const zigAmount = booking.currency === 'ZWG' ? booking.amount : '';
    
    sheetData.push([
      booking.time,
      booking.company,
      booking.function,
      booking.venue,
      booking.organiser,
      booking.pax,
      usdAmount,
      '', // ZIG RATE column (empty for now as per your template)
      zigAmount || usdAmount, // REVENUE column
      booking.status,
      booking.lobbySign
    ]);
  });

  // Calculate totals
  const usdBookings = data.bookings.filter(b => b.currency === 'USD');
  const zwgBookings = data.bookings.filter(b => b.currency === 'ZWG');
  const totalPax = data.bookings.reduce((sum, b) => sum + b.pax, 0);
  const usdTotal = usdBookings.reduce((sum, b) => sum + b.amount, 0);
  const zwgTotal = zwgBookings.reduce((sum, b) => sum + b.amount, 0);
  const grandTotal = usdTotal + zwgTotal; // Note: This mixes currencies, but matches your template

  // Add empty row
  sheetData.push([]);

  // Add summary rows
  sheetData.push(['TOTAL REV FOR CONF PACK', '', '', '', '', totalPax, '', '', '', '', '']);
  sheetData.push(['GRAND FUNCTION REVENUES', '', '', '', '', '', '', '', grandTotal, '', '']);

  // Calculate average conference rate (if applicable)
  if (totalPax > 0 && usdTotal > 0) {
    const avgRate = usdTotal / totalPax;
    sheetData.push(['AVERAGE CONF RATE', '', '', '', '', '', '', '', avgRate, '', '']);
  }

  // Create worksheet from data
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 },  // TIME
    { wch: 30 },  // COMPANY
    { wch: 20 },  // FUNCTION
    { wch: 20 },  // VENUE
    { wch: 20 },  // ORGANISER
    { wch: 8 },   // PAX
    { wch: 12 },  // USD
    { wch: 12 },  // ZIG RATE
    { wch: 12 },  // REVENUE
    { wch: 12 },  // STATUS
    { wch: 30 }   // LOBBY SIGN
  ];

  // Merge title cells (A1:K1)
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({
    s: { r: 0, c: 0 }, // Start: row 0, col 0 (A1)
    e: { r: 0, c: 10 } // End: row 0, col 10 (K1)
  });

  // Style the title row (bold and centered)
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  // Style the header row (bold)
  const headerRow = 3; // Row 3 (index 2 in array)
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach((col) => {
    const cellRef = `${col}${headerRow}`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'D3D3D3' } },
        alignment: { horizontal: 'center' }
      };
    }
  });

  // Style summary rows (bold with background color)
  const summaryStartRow = sheetData.length - (totalPax > 0 && usdTotal > 0 ? 2 : 1);
  for (let i = summaryStartRow; i <= sheetData.length; i++) {
    const cellRef = `A${i}`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'FFE4B5' } } // Peach color
      };
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Summary');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return excelBuffer as Buffer;
}
