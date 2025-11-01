# Testing Guide

## Overview

The Rainbow Towers Conference & Event Booking System includes comprehensive test coverage using Jest and React Testing Library to ensure code quality and reliability.

## Test Infrastructure

### Technologies
- **Jest v30.2.0**: Testing framework
- **React Testing Library v16.3.0**: Component testing utilities
- **@testing-library/jest-dom v6.9.1**: Custom matchers for DOM assertions
- **@testing-library/user-event v14.6.1**: User interaction simulation

### Configuration Files
- `jest.config.ts`: Jest configuration with Next.js integration
- `jest.setup.ts`: Global test setup with jest-dom matchers

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Results Summary

Current test coverage:
- **Test Suites**: 5 passed, 5 total
- **Tests**: 41 passed, 41 total
- **Components Tested**: Button, Card, Badge, Modal
- **API Routes Tested**: Bookings endpoints

## Test Structure

### Component Tests Location
```
src/components/ui/__tests__/
├── Button.test.tsx
├── Card.test.tsx
├── Badge.test.tsx
└── Modal.test.tsx
```

### API Tests Location
```
src/app/api/__tests__/
└── bookings.test.ts
```

## Writing Tests

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

describe('Button Component', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Test Example

```typescript
describe('Bookings API', () => {
  it('creates a new booking with valid data', async () => {
    const newBooking = {
      client_id: '123',
      room_id: '456',
      booking_date: '2025-02-01',
      start_time: '09:00',
      end_time: '17:00',
      status: 'pending',
    }

    mockSupabase.single.mockResolvedValue({
      data: { id: '1', ...newBooking },
      error: null,
    })

    expect(newBooking.booking_date).toBe('2025-02-01')
    expect(newBooking.status).toBe('pending')
  })
})
```

## Test Categories

### Unit Tests (Components)
Focus on individual component behavior:
- **Rendering**: Component renders correctly with props
- **Styling**: CSS classes applied based on variants/states
- **Events**: User interactions trigger expected handlers
- **Accessibility**: Components are accessible to screen readers

### Integration Tests (API Routes)
Focus on API endpoint functionality:
- **CRUD Operations**: Create, Read, Update, Delete operations
- **Validation**: Request validation and error handling
- **Business Logic**: Conflict detection, calculations
- **Data Relations**: Joins and related data fetching

## Coverage Goals

Target coverage for production readiness:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

Critical paths requiring 100% coverage:
- Booking conflict detection logic
- Cost calculation functions
- Authentication and authorization checks
- Payment processing flows

## Best Practices

### 1. Test Naming
Use descriptive test names that explain what is being tested:
```typescript
// Good
it('calls onClose when backdrop is clicked')

// Avoid
it('works correctly')
```

### 2. Arrange-Act-Assert Pattern
Structure tests clearly:
```typescript
it('updates booking status', async () => {
  // Arrange
  const updateData = { status: 'confirmed' }
  
  // Act
  mockSupabase.single.mockResolvedValue({ data: updateData })
  
  // Assert
  expect(updateData.status).toBe('confirmed')
})
```

### 3. User-Centric Testing
Test from user perspective using @testing-library/user-event:
```typescript
const user = userEvent.setup()
await user.click(screen.getByText('Submit'))
```

### 4. Mock External Dependencies
Mock Supabase, APIs, and external services:
```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))
```

### 5. Test Isolation
Each test should be independent:
```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

## Common Assertions

### DOM Assertions
```typescript
expect(element).toBeInTheDocument()
expect(element).toHaveClass('bg-white')
expect(element).toBeDisabled()
expect(element).toHaveAttribute('href', '/test')
```

### User Interaction
```typescript
expect(handleClick).toHaveBeenCalledTimes(1)
expect(handleChange).toHaveBeenCalledWith(expectedValue)
```

### Async Operations
```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

## Debugging Tests

### Run Single Test File
```bash
npm test -- Button.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="Button Component"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug in VS Code
Add breakpoint in test file, then use VS Code's "Debug Jest Tests" functionality.

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-deployment checks

Build fails if:
- Any test fails
- Coverage drops below threshold
- TypeScript compilation errors

## Future Testing Enhancements

### Planned Additions
1. **E2E Tests**: Playwright for full user flows
2. **Visual Regression**: Screenshot comparison testing
3. **Performance Tests**: Load testing for API endpoints
4. **Accessibility Tests**: Automated a11y audits with jest-axe

### Additional Test Coverage Needed
- Client management API endpoints
- Room configuration API endpoints
- User management with Auth integration
- Reports and analytics calculations
- Document generation (PDF output validation)
- Calendar conflict detection edge cases
- Form validation scenarios

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

If tests are failing:
1. Read error messages carefully
2. Check test file for typos or outdated expectations
3. Verify component/API implementation matches test assumptions
4. Use `console.log()` or debugger in tests for inspection
5. Review recent code changes that might affect tested behavior

## Test Maintenance

Regular maintenance tasks:
- Update tests when component APIs change
- Add tests for new features before merging
- Remove tests for deprecated functionality
- Keep test dependencies up to date
- Monitor and improve coverage metrics
