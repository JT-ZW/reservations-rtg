import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';
import { generateWeeklyReportPDF } from '@/lib/pdf/weekly-report-generator';
import { generateWeeklyReportExcel } from '@/lib/documents/weekly-report-excel';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';

interface WeeklyBooking {
  eventName: string;
  pax: number;
  duration: string;
  currency: string;
  amount: number;
}

interface RoomBookings {
  monday: WeeklyBooking[];
  tuesday: WeeklyBooking[];
  wednesday: WeeklyBooking[];
  thursday: WeeklyBooking[];
  friday: WeeklyBooking[];
  saturday: WeeklyBooking[];
  sunday: WeeklyBooking[];
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get('format') || 'pdf'; // 'pdf' or 'excel'

    // Calculate next week's Monday to Sunday
    // If today is Friday or later, get next week. Otherwise, get current week.
    const today = new Date();
    const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const nextSunday = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

    // Fetch all rooms (ordered by name)
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('is_available', true)
      .order('name', { ascending: true });

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
      throw roomsError;
    }

    // Fetch all bookings for the week
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        start_time,
        end_time,
        final_amount,
        number_of_attendees,
        currency,
        room_id,
        clients!inner (
          organization_name
        ),
        event_types (
          name
        )
      `)
      .gte('start_date', nextMonday.toISOString())
      .lte('start_date', nextSunday.toISOString())
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (bookingsError) {
      console.error('Error fetching bookings for weekly report:', bookingsError);
      throw bookingsError;
    }

    // Helper function to get day of week (0 = Monday, 6 = Sunday)
    const getDayOfWeek = (dateStr: string): number => {
      const date = new Date(dateStr);
      const day = date.getDay();
      return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    };

    // Helper function to get day key from day index
    const getDayKey = (dayIndex: number): keyof RoomBookings => {
      const days: (keyof RoomBookings)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return days[dayIndex];
    };

    // Initialize room bookings structure
    const roomBookingsMap = new Map<string, RoomBookings>();
    
    rooms?.forEach(room => {
      roomBookingsMap.set(room.id, {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      });
    });

    // Group bookings by room and day
    bookings?.forEach((booking) => {
      const roomId = (booking as { room_id: string }).room_id;
      if (!roomBookingsMap.has(roomId)) return;

      const dayIndex = getDayOfWeek((booking as { start_date: string }).start_date);
      const dayKey = getDayKey(dayIndex);

      const bookingData = booking as {
        event_types?: { name?: string } | null;
        number_of_attendees?: number | null;
        start_time?: string | null;
        end_time?: string | null;
        currency?: string | null;
        final_amount?: number | null;
      };

      const weeklyBooking: WeeklyBooking = {
        eventName: bookingData.event_types?.name || 'Event',
        pax: bookingData.number_of_attendees || 0,
        duration: `${bookingData.start_time || '00:00'}-${bookingData.end_time || '23:59'}`,
        currency: bookingData.currency || 'USD',
        amount: bookingData.final_amount || 0
      };

      roomBookingsMap.get(roomId)![dayKey].push(weeklyBooking);
    });

    // Prepare report data
    const reportData = {
      weekStart: nextMonday,
      weekEnd: nextSunday,
      rooms: (rooms || []).map(room => ({
        name: room.name,
        bookings: roomBookingsMap.get(room.id) || {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        }
      }))
    };

    // Generate report based on format
    if (formatType === 'excel') {
      const excelBuffer = await generateWeeklyReportExcel(reportData);
      const filename = `Weekly_Report_${format(nextMonday, 'yyyy-MM-dd')}.xlsx`;

      return new NextResponse(Buffer.from(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Default to PDF
      const pdfBlob = await generateWeeklyReportPDF(reportData);
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const filename = `Weekly_Report_${format(nextMonday, 'yyyy-MM-dd')}.pdf`;

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly report' },
      { status: 500 }
    );
  }
}
