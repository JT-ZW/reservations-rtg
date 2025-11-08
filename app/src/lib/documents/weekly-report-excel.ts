/**
 * Weekly Report Excel Generator
 * Generates a grid layout matching the Word document format
 */

import * as XLSX from 'xlsx';
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

export async function generateWeeklyReportExcel(data: WeeklyReportData): Promise<Buffer> {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Helper function to format bookings for a cell
  const formatBookings = (bookings: WeeklyBooking[]): string => {
    if (bookings.length === 0) return '';
    return bookings.map(b => 
      `${b.eventName}\n${b.pax}PAX ${b.duration}\n${b.currency}${b.amount.toLocaleString()}`
    ).join('\n\n');
  };

  // Get day date in format dd/MM/yy
  const getDayDate = (dayOffset: number): string => {
    const date = new Date(data.weekStart);
    date.setDate(date.getDate() + dayOffset);
    return format(date, 'dd/MM/yy');
  };

  // Prepare the data for the sheet
  const sheetData: (string | number)[][] = [];

  // Add title row
  const startDate = format(data.weekStart, 'dd-MM');
  const endDate = format(data.weekEnd, 'dd MMMM yyyy');
  sheetData.push([`BANQUETING WEEKLY SUMMARY MONDAY  ${startDate}-${endDate}`.toUpperCase()]);
  sheetData.push([]); // Empty row

  // Add header row with dates
  sheetData.push([
    'ROOM',
    `MONDAY\n${getDayDate(0)}`,
    `TUESDAY\n${getDayDate(1)}`,
    `WEDNESDAY\n${getDayDate(2)}`,
    `THURSDAY\n${getDayDate(3)}`,
    `FRIDAY\n${getDayDate(4)}`,
    `SATURDAY\n${getDayDate(5)}`,
    `SUNDAY\n${getDayDate(6)}`
  ]);

  // Add room rows
  data.rooms.forEach(room => {
    sheetData.push([
      room.name,
      formatBookings(room.bookings.monday),
      formatBookings(room.bookings.tuesday),
      formatBookings(room.bookings.wednesday),
      formatBookings(room.bookings.thursday),
      formatBookings(room.bookings.friday),
      formatBookings(room.bookings.saturday),
      formatBookings(room.bookings.sunday)
    ]);
  });

  // Create worksheet from data
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 },  // ROOM
    { wch: 25 },  // MONDAY
    { wch: 25 },  // TUESDAY
    { wch: 25 },  // WEDNESDAY
    { wch: 25 },  // THURSDAY
    { wch: 25 },  // FRIDAY
    { wch: 25 },  // SATURDAY
    { wch: 25 }   // SUNDAY
  ];

  // Merge title cells (A1:H1)
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({
    s: { r: 0, c: 0 }, // Start: row 0, col 0 (A1)
    e: { r: 0, c: 7 }  // End: row 0, col 7 (H1)
  });

  // Style the title row
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  // Style the header row (row 3)
  const headerRow = 3;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
    const cellRef = `${col}${headerRow}`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 11 },
        fill: { fgColor: { rgb: 'CCCCCC' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
  });

  // Style the room column (bold and centered)
  for (let i = 4; i <= sheetData.length; i++) {
    const cellRef = `A${i}`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
  }

  // Style data cells with borders and wrap text
  for (let i = 4; i <= sheetData.length; i++) {
    ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
      const cellRef = `${col}${i}`;
      if (ws[cellRef]) {
        ws[cellRef].s = {
          alignment: { vertical: 'top', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    });
  }

  // Set row heights for better readability
  ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 25 }; // Title row height
  ws['!rows'][2] = { hpt: 30 }; // Header row height
  
  // Set data row heights
  for (let i = 3; i < sheetData.length; i++) {
    ws['!rows'][i] = { hpt: 60 }; // Data row height
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Weekly Summary');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return excelBuffer as Buffer;
}
