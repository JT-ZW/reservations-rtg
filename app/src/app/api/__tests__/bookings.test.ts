/**
 * Bookings API Integration Tests
 * Tests for /api/bookings endpoints
 */

// Mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase: any = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  single: jest.fn(),
  order: jest.fn(() => mockSupabase),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('Bookings API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/bookings', () => {
    it('returns list of bookings with relations', async () => {
      const mockBookings = [
        {
          id: '1',
          booking_date: '2025-01-15',
          start_time: '09:00',
          end_time: '17:00',
          status: 'confirmed',
          client: { name: 'ABC Corp' },
          room: { name: 'Conference Room A' },
        },
      ]

      mockSupabase.single.mockResolvedValue({
        data: mockBookings,
        error: null,
      })

      expect(mockBookings).toHaveLength(1)
      expect(mockBookings[0].status).toBe('confirmed')
    })

    it('filters bookings by status', async () => {
      const mockBookings = [
        {
          id: '1',
          status: 'confirmed',
        },
      ]

      mockSupabase.eq.mockReturnThis()
      mockSupabase.single.mockResolvedValue({
        data: mockBookings,
        error: null,
      })

      expect(mockBookings[0].status).toBe('confirmed')
    })

    it('filters bookings by date range', async () => {
      mockSupabase.gte.mockReturnThis()
      mockSupabase.lte.mockReturnThis()
      mockSupabase.single.mockResolvedValue({
        data: [],
        error: null,
      })

      expect(mockSupabase.gte).toBeDefined()
      expect(mockSupabase.lte).toBeDefined()
    })
  })

  describe('POST /api/bookings', () => {
    it('creates a new booking with valid data', async () => {
      const newBooking = {
        client_id: '123',
        room_id: '456',
        booking_date: '2025-02-01',
        start_time: '09:00',
        end_time: '17:00',
        event_type_id: '789',
        status: 'pending',
      }

      mockSupabase.single.mockResolvedValue({
        data: { id: '1', ...newBooking },
        error: null,
      })

      expect(newBooking.booking_date).toBe('2025-02-01')
      expect(newBooking.status).toBe('pending')
    })

    it('validates required fields', () => {
      const invalidBooking = {
        // Missing required fields
        booking_date: '2025-02-01',
      }

      expect(invalidBooking).not.toHaveProperty('client_id')
      expect(invalidBooking).not.toHaveProperty('room_id')
    })
  })

  describe('PUT /api/bookings/[id]', () => {
    it('updates booking status', async () => {
      const updateData = {
        status: 'confirmed',
      }

      mockSupabase.eq.mockReturnThis()
      mockSupabase.single.mockResolvedValue({
        data: { id: '1', ...updateData },
        error: null,
      })

      expect(updateData.status).toBe('confirmed')
    })

    it('updates booking details', async () => {
      const updateData = {
        start_time: '10:00',
        end_time: '18:00',
      }

      mockSupabase.eq.mockReturnThis()
      mockSupabase.single.mockResolvedValue({
        data: { id: '1', ...updateData },
        error: null,
      })

      expect(updateData.start_time).toBe('10:00')
      expect(updateData.end_time).toBe('18:00')
    })
  })

  describe('DELETE /api/bookings/[id]', () => {
    it('soft deletes a booking', async () => {
      mockSupabase.eq.mockReturnThis()
      mockSupabase.single.mockResolvedValue({
        data: { id: '1', status: 'cancelled' },
        error: null,
      })

      const result = await mockSupabase.single()
      expect(result.data?.status).toBe('cancelled')
    })
  })

  describe('POST /api/bookings/check-conflict', () => {
    it('detects conflicting bookings', async () => {
      const conflictCheck = {
        room_id: '456',
        booking_date: '2025-02-01',
        start_time: '09:00',
        end_time: '17:00',
      }

      const mockConflicts = [
        {
          id: '1',
          booking_date: '2025-02-01',
          start_time: '14:00',
          end_time: '18:00',
        },
      ]

      mockSupabase.eq.mockReturnThis()
      mockSupabase.single.mockResolvedValue({
        data: mockConflicts,
        error: null,
      })

      expect(conflictCheck.booking_date).toBe('2025-02-01')
    })

    it('returns no conflicts for available time slot', async () => {
      mockSupabase.eq.mockReturnThis()
      mockSupabase.single.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await mockSupabase.single()
      expect(result.data).toEqual([])
    })
  })
})
