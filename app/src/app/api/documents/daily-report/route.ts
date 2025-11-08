import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';
import { generateDailyReportPDF } from '@/lib/pdf/daily-report-generator';
import { generateDailyReportExcel } from '@/lib/documents/daily-report-excel';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

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

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get('format') || 'pdf'; // 'pdf' or 'excel'

    // Get tomorrow's date
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    // Fetch all bookings for tomorrow with related data
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        final_amount,
        number_of_attendees,
        status,
        currency,
        special_requirements,
        clients!inner (
          organization_name,
          contact_person
        ),
        rooms!inner (
          name
        ),
        event_types (
          name
        )
      `)
      .gte('start_date', tomorrowStart.toISOString())
      .lte('start_date', tomorrowEnd.toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings for daily report:', error);
      throw error;
    }

    // Transform bookings data into report format
    const reportBookings: DailyReportBooking[] = (bookings || []).map((booking) => {
      const bookingData = booking as {
        start_date: string;
        clients?: { organization_name?: string; contact_person?: string } | null;
        event_types?: { name?: string } | null;
        rooms?: { name?: string } | null;
        number_of_attendees?: number | null;
        currency?: string | null;
        final_amount?: number | null;
        status?: string | null;
        special_requirements?: string | null;
      };
      
      const startTime = format(new Date(bookingData.start_date), 'HH:mm');
      
      return {
        time: startTime,
        company: bookingData.clients?.organization_name || 'N/A',
        function: bookingData.event_types?.name || 'General',
        venue: bookingData.rooms?.name || 'TBD',
        organiser: bookingData.clients?.contact_person || 'N/A',
        pax: bookingData.number_of_attendees || 0,
        currency: bookingData.currency || 'USD',
        amount: bookingData.final_amount || 0,
        status: bookingData.status?.toUpperCase() || 'PENDING',
        lobbySign: bookingData.special_requirements || ''
      };
    });

    // Prepare report data
    const reportData = {
      date: tomorrow,
      bookings: reportBookings
    };

    // Generate report based on format
    if (formatType === 'excel') {
      const excelBuffer = await generateDailyReportExcel(reportData);
      const filename = `Daily_Report_${format(tomorrow, 'yyyy-MM-dd')}.xlsx`;

      return new NextResponse(Buffer.from(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Default to PDF
      const pdfBlob = await generateDailyReportPDF(reportData);
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const filename = `Daily_Report_${format(tomorrow, 'yyyy-MM-dd')}.pdf`;

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating daily report:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily report' },
      { status: 500 }
    );
  }
}
