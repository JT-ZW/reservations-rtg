# Rainbow Towers Conference & Event Booking System
## User Guide

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Bookings](#managing-bookings)
4. [Calendar View](#calendar-view)
5. [Client Management](#client-management)
6. [Reports & Analytics](#reports--analytics)
7. [Admin Functions](#admin-functions)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Navigate to the login page at `https://your-domain.com/login`
2. Enter your email address and password
3. Click **"Sign In"**
4. You'll be redirected to your dashboard

**First Time Login:**
- Use the credentials provided by your system administrator
- You'll be prompted to change your password on first login

### User Roles

The system has five user roles with different permissions:

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | Full system access | Can manage everything including users |
| **Reservations** | Booking management | Can create/edit bookings, manage clients |
| **Sales** | Client-facing operations | Can create bookings, view reports |
| **Finance** | Financial operations | Can manage payments, generate invoices |
| **Auditor** | Read-only access | Can view all data but cannot modify |

---

## Dashboard Overview

### Main Dashboard

After logging in, you'll see the main dashboard with key metrics:

#### Statistics Cards
- **Total Bookings** - Number of bookings this month
- **Confirmed Bookings** - Bookings that are confirmed
- **Pending Bookings** - Bookings awaiting confirmation
- **Revenue This Month** - Total revenue for current month

#### Quick Actions
- **New Booking** - Create a new booking
- **View Calendar** - See calendar view of bookings
- **Client List** - Manage clients
- **Generate Report** - View analytics

#### Recent Bookings
See your 5 most recent bookings with:
- Client name
- Booking date and time
- Room assigned
- Status badge (color-coded)
- Quick action buttons

#### Upcoming Events
View bookings scheduled for the next 7 days:
- Today's bookings highlighted
- Tomorrow's bookings
- Upcoming week preview

---

## Managing Bookings

### Creating a New Booking

#### Step 1: Access Booking Form
- Click **"New Booking"** from dashboard, or
- Go to **Bookings** menu → **"Create Booking"**

#### Step 2: Select Client
- Choose existing client from dropdown, or
- Click **"Add New Client"** to create one

**New Client Quick Form:**
```
- Name: Client's full name
- Organization: Company/organization name
- Email: Contact email
- Phone: Contact phone number
```

#### Step 3: Choose Room
- Select from available conference rooms
- View capacity and rate for each room
- System shows room availability

#### Step 4: Set Date and Time
- **Booking Date:** Choose date from calendar picker
- **Start Time:** Select start time (e.g., 09:00)
- **End Time:** Select end time (e.g., 17:00)

**Conflict Detection:**
- System automatically checks for conflicts
- Red warning appears if room is already booked
- Suggested alternative times shown

#### Step 5: Event Details
- **Event Type:** Select type (Conference, Wedding, Training, etc.)
- **Number of Attendees:** Enter expected attendance
- **Notes:** Add special requirements or instructions

#### Step 6: Add Services (Optional)
Select additional services:
- Catering (per person)
- Projector & Screen (per unit)
- Sound System (per day)
- Tables & Chairs (per unit)
- Decorations (per event)

For each addon:
- Check the checkbox to include
- Enter quantity
- Subtotal calculated automatically

#### Step 7: Review and Submit
- **Total Amount** displayed at bottom
- Review all details
- Click **"Create Booking"** to save
- Booking status set to "Pending"

**Success:**
- Confirmation message appears
- Redirected to booking details page
- Option to generate quotation

### Viewing Booking Details

#### Accessing Bookings
- Go to **Bookings** menu
- Click on any booking from the list

#### Booking Details Page Shows:

**Client Information:**
- Name and organization
- Contact details (email, phone)
- Address

**Booking Information:**
- Booking reference number
- Date and time
- Room details
- Event type
- Number of attendees
- Current status

**Financial Information:**
- Room rate breakdown
- Addons with quantities and prices
- Subtotals
- Total amount
- Payment status

**Actions Available:**
- **Edit Booking** - Modify details
- **Confirm Booking** - Change status to confirmed
- **Cancel Booking** - Cancel the reservation
- **Generate Quotation** - Download PDF quotation
- **Generate Invoice** - Download PDF invoice (for confirmed bookings)

### Editing a Booking

#### Step 1: Access Edit Form
- From booking details page, click **"Edit"**
- Or from bookings list, click edit icon

#### Step 2: Modify Details
You can change:
- Date and time (subject to availability)
- Room (if no conflict)
- Number of attendees
- Addons and quantities
- Notes

**Cannot Change:**
- Client (create new booking instead)
- Booking reference number

#### Step 3: Conflict Check
- System re-validates for conflicts
- Shows warnings if changes create conflicts

#### Step 4: Save Changes
- Click **"Update Booking"**
- Total recalculated automatically
- Updated details saved

### Confirming a Booking

#### When to Confirm:
- Client has agreed to terms
- Payment deposit received
- All details finalized

#### How to Confirm:
1. Open booking details
2. Click **"Confirm Booking"** button
3. Status changes from "Pending" to "Confirmed"
4. Client can now receive official invoice

**Note:** Only pending bookings can be confirmed.

### Cancelling a Booking

#### Cancellation Process:
1. Open booking details
2. Click **"Cancel Booking"** button
3. Enter cancellation reason (optional)
4. Confirm cancellation

**What Happens:**
- Status changes to "Cancelled"
- Room becomes available again
- Record kept for history
- Cannot be undone (create new booking instead)

### Filtering Bookings

Use filters to find specific bookings:

**By Status:**
- All bookings
- Pending only
- Confirmed only
- Cancelled only
- Completed only

**By Date Range:**
- Today
- This Week
- This Month
- Custom date range

**By Room:**
- Select specific room from dropdown

**By Client:**
- Search by client name or organization

**Search:**
- Type to search by booking reference, client name, or notes

---

## Calendar View

### Accessing Calendar
- Click **"Calendar"** in main navigation
- Or click **"View Calendar"** from dashboard

### Calendar Views

#### Month View (Default)
- Shows entire month at a glance
- Each day shows bookings as events
- Color-coded by status:
  - 🟢 Green: Confirmed
  - 🟡 Yellow: Pending
  - 🔴 Red: Cancelled
  - 🔵 Blue: Completed

#### Week View
- Shows 7-day week
- Displays time slots
- Shows booking duration visually
- Easier to see daily schedule

#### Day View
- Shows single day in detail
- Hour-by-hour timeline
- See all bookings for selected day

### Calendar Features

#### Switching Views
- Click **"Month"**, **"Week"**, or **"Day"** buttons at top

#### Navigating Dates
- Click **"Today"** to return to current date
- Use **◀ Previous** and **Next ▶** arrows
- Click on any date to jump to it

#### Viewing Booking Details
- Click on any event in calendar
- Popup shows quick details
- Click **"View Details"** for full information

#### Creating Booking from Calendar
- Click on empty date/time slot
- Quick booking form opens with date pre-filled
- Complete booking as normal

#### Filtering Calendar

**By Room:**
- Select room from dropdown
- Calendar shows only that room's bookings
- "All Rooms" to see everything

**By Status:**
- Filter by Confirmed, Pending, etc.
- Multiple statuses can be selected

**By Event Type:**
- Show only specific event types
- Useful for tracking conferences vs. weddings, etc.

### Calendar Tips
- Hover over events to see quick info
- Drag events to reschedule (if permitted)
- Print calendar view for physical schedules
- Export calendar (coming soon)

---

## Client Management

### Viewing Clients

#### Client List
- Go to **Clients** menu
- See all clients in table format

**Columns Displayed:**
- Name
- Organization
- Email
- Phone
- Number of bookings
- Status (Active/Inactive)
- Actions

#### Sorting and Searching
- Click column headers to sort
- Use search box to find clients
- Filter by active/inactive status

### Adding a New Client

#### Step 1: Access Form
- Click **"Add New Client"** button
- Or click **"+"** icon from client list

#### Step 2: Enter Details

**Required Fields:**
- **Name:** Client's full name
- **Email:** Contact email address
- **Phone:** Contact phone number

**Optional Fields:**
- **Organization:** Company or organization name
- **Address:** Full postal address
- **Notes:** Additional information about client

#### Step 3: Save Client
- Click **"Create Client"**
- Success message appears
- Client now available for bookings

### Editing Client Information

#### Step 1: Access Edit Form
- From client list, click **"Edit"** button
- Or click on client name → **"Edit Details"**

#### Step 2: Update Information
- Modify any field except email (unique identifier)
- To change email, contact administrator

#### Step 3: Save Changes
- Click **"Update Client"**
- Changes saved immediately

### Viewing Client History

#### Booking History
- Click on client name
- See all bookings by this client:
  - Past bookings
  - Upcoming bookings
  - Cancelled bookings

#### Client Statistics
- Total bookings made
- Total amount spent
- Last booking date
- Favorite rooms
- Average booking duration

### Deactivating Clients

#### When to Deactivate:
- Client no longer doing business
- Keep historical data
- Remove from active dropdown lists

#### How to Deactivate:
1. Open client details
2. Click **"Deactivate"** button
3. Confirm action
4. Client marked as inactive

**Note:** Deactivated clients:
- Cannot be used for new bookings
- Historical bookings remain visible
- Can be reactivated anytime

---

## Reports & Analytics

### Accessing Reports
- Click **"Reports"** in main navigation
- Select report type from tabs

### Revenue Report

#### Overview
Track financial performance over time.

#### Features
- **Date Range Selection:**
  - Custom date range picker
  - Quick filters: This Month, Last Month, This Year
  
- **Grouping Options:**
  - By Day - Daily breakdown
  - By Week - Weekly totals
  - By Month - Monthly summaries
  - By Year - Annual overview

#### Metrics Displayed
- Total bookings
- Confirmed bookings
- Cancelled bookings
- Total revenue
- Average booking value

#### Visualizations
- **Line Chart:** Revenue trend over time
- **Bar Chart:** Bookings per period
- **Summary Cards:** Key metrics at top

#### Exporting
- Click **"Export CSV"** to download data
- Use in Excel or other tools for further analysis

### Utilization Report

#### Overview
See how efficiently rooms are being used.

#### Metrics Per Room
- Total bookings
- Confirmed bookings
- Utilization rate (%)
- Total revenue
- Average booking duration

#### Visualizations
- **Bar Chart:** Bookings by room
- **Dual-axis:** Revenue and booking count
- Color-coded bars for easy comparison

#### Use Cases
- Identify most popular rooms
- Spot underutilized spaces
- Plan room pricing adjustments
- Capacity planning

### Client Analytics

#### Overview
Understand client behavior and identify top clients.

#### Metrics Per Client
- Total bookings made
- Total amount spent
- Last booking date
- Average booking value
- Favorite rooms

#### Visualizations
- **Horizontal Bar Chart:** Top 10 clients by revenue
- Sorted from highest to lowest spender

#### Use Cases
- Identify VIP clients
- Target marketing efforts
- Plan loyalty programs
- Forecast repeat business

### Report Tips
- **Schedule:** Run reports monthly for trends
- **Compare:** Use date ranges to compare periods
- **Export:** Download data for presentations
- **Share:** Generate PDFs for stakeholders
- **Act:** Use insights to improve operations

---

## Admin Functions

**Note:** These functions are only available to users with Admin role.

### User Management

#### Viewing Users
- Go to **Admin** → **Users**
- See all system users with their roles

#### Creating New Users

**Step 1: Click "Add New User"**

**Step 2: Enter User Details**
- **Email:** User's email (used for login)
- **Password:** Initial password (user should change)
- **Full Name:** User's full name
- **Role:** Select from dropdown:
  - Admin
  - Reservations
  - Sales
  - Finance
  - Auditor
- **Phone:** Contact number (optional)

**Step 3: Create User**
- Click **"Create User"**
- Credentials emailed to user
- User receives welcome email with login link

#### Managing Users

**Edit User:**
- Change name, phone, or role
- Only admins can change user roles
- Cannot change user email

**Deactivate User:**
- Temporarily disable user access
- User cannot log in
- Data and history preserved
- Can be reactivated later

**Important:** You cannot deactivate your own account.

### Room Management

#### Viewing Rooms
- Go to **Admin** → **Rooms**
- See all rooms in grid layout

#### Adding New Room

**Required Information:**
- **Name:** Room name (e.g., "Conference Room A")
- **Capacity:** Maximum number of people
- **Rate:** Daily rate in USD
- **Description:** Room features and amenities

**Step-by-step:**
1. Click **"Add New Room"**
2. Fill in all fields
3. Click **"Create Room"**
4. Room now available for bookings

#### Editing Room Details

**What You Can Change:**
- Name
- Capacity
- Rate (affects new bookings only)
- Description

**How to Edit:**
1. Click **"Edit"** on room card
2. Modify fields
3. Click **"Update Room"**

#### Managing Room Status

**Activate/Deactivate:**
- Toggle switch on room card
- Deactivated rooms not available for new bookings
- Existing bookings unaffected

### Addons & Event Types

#### Managing Addons

**View Addons:**
- Go to **Admin** → **Addons**
- Click **"Add-ons"** tab

**Add New Addon:**
1. Click **"Add New Addon"**
2. Enter:
   - Name (e.g., "Projector & Screen")
   - Description
   - Rate (price)
   - Unit Type:
     - Per Unit (one-time cost)
     - Per Day
     - Per Hour
     - Per Person (attendee)
3. Click **"Create Addon"**

**Edit Addon:**
- Click **"Edit"** button
- Modify details
- Save changes

**Deactivate Addon:**
- Click **"Deactivate"**
- No longer available for new bookings

#### Managing Event Types

**View Event Types:**
- Go to **Admin** → **Addons**
- Click **"Event Types"** tab

**Add New Event Type:**
1. Click **"Add New Event Type"**
2. Enter:
   - Name (e.g., "Corporate Conference")
   - Description
3. Click **"Create Event Type"**

**Edit/Deactivate:**
- Same process as addons

---

## Common Tasks

### Task 1: Book a Conference Room

**Scenario:** Client needs a room for tomorrow, 9 AM - 5 PM, 30 attendees.

**Steps:**
1. Click **"New Booking"**
2. Select client from dropdown
3. Choose appropriate room (capacity ≥ 30)
4. Set date to tomorrow
5. Set time: 09:00 - 17:00
6. Enter attendees: 30
7. Select event type: "Conference"
8. Add required addons (projector, catering)
9. Click **"Create Booking"**
10. Status: Pending
11. Generate quotation for client

### Task 2: Check Room Availability

**Scenario:** Client asks if Room A is available next Friday afternoon.

**Steps:**
1. Go to **Calendar**
2. Navigate to next Friday
3. Click on Room A filter
4. Check afternoon time slots
5. If empty, available
6. If occupied, note conflicting booking
7. Suggest alternative room or time

### Task 3: Generate Monthly Revenue Report

**Scenario:** Need revenue report for last month for management meeting.

**Steps:**
1. Go to **Reports**
2. Click **"Revenue"** tab
3. Set date range:
   - Start: First day of last month
   - End: Last day of last month
4. Group by: Month
5. Review metrics:
   - Total bookings
   - Total revenue
   - Trends
6. Click **"Export CSV"**
7. Open in Excel
8. Format for presentation

### Task 4: Update Client Contact Information

**Scenario:** Client has new email address and phone number.

**Steps:**
1. Go to **Clients**
2. Search for client by name
3. Click **"Edit"**
4. Update email (if allowed) or contact admin
5. Update phone number
6. Update address if changed
7. Click **"Update Client"**
8. Confirm changes saved

### Task 5: Cancel a Booking

**Scenario:** Client calls to cancel booking for next week.

**Steps:**
1. Go to **Bookings**
2. Find the booking (search by client name)
3. Click on booking to open details
4. Click **"Cancel Booking"**
5. Enter reason: "Client requested cancellation"
6. Click **"Confirm Cancellation"**
7. Status changes to "Cancelled"
8. Room now available
9. Follow company policy for refunds

### Task 6: Confirm Multiple Bookings

**Scenario:** Received deposits for 5 bookings that need confirmation.

**Steps:**
1. Go to **Bookings**
2. Filter by status: "Pending"
3. For each booking:
   - Click to open details
   - Verify payment received
   - Click **"Confirm Booking"**
   - Move to next
4. Status changes to "Confirmed"
5. Clients can now receive invoices

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: Cannot Create Booking - Conflict Error

**Symptoms:**
- Red error message: "Room already booked for this time"
- Cannot submit booking form

**Solutions:**
1. **Check Calendar:**
   - Go to calendar view
   - Select the room and date
   - See conflicting booking
   
2. **Options:**
   - Choose different time slot
   - Choose different room
   - Choose different date
   - Contact conflicting booking to reschedule

3. **Verification:**
   - System checks conflicts in real-time
   - Include buffer time between bookings
   - Consider setup/cleanup time

#### Issue: Cannot Generate Invoice

**Symptoms:**
- "Cannot generate invoice" error
- Button grayed out

**Solutions:**
1. **Check Booking Status:**
   - Only confirmed bookings can have invoices
   - Pending bookings need confirmation first
   
2. **Process:**
   - Confirm booking first
   - Then generate invoice
   
3. **Alternative:**
   - Generate quotation for pending bookings
   - Use quotation to get client approval
   - Confirm and then invoice

#### Issue: Forgot Password

**Symptoms:**
- Cannot log in
- "Invalid credentials" error

**Solutions:**
1. **Click "Forgot Password"** on login page
2. Enter your email address
3. Check email for reset link
4. Click link and set new password
5. Log in with new password

**If no email received:**
- Check spam folder
- Verify email address is correct
- Contact system administrator

#### Issue: Don't See Expected Data

**Symptoms:**
- Empty booking list
- Missing clients
- No reports

**Solutions:**
1. **Check Filters:**
   - Clear all filters
   - Reset date range to "All time"
   - Check status filter

2. **Check Permissions:**
   - Your role may limit access
   - Contact admin for access
   
3. **Check Data:**
   - Verify data exists
   - Check creation dates

#### Issue: Slow Performance

**Symptoms:**
- Pages load slowly
- Reports take long time
- Calendar lags

**Solutions:**
1. **Clear Browser Cache:**
   - Chrome: Ctrl+Shift+Delete
   - Clear cached images and files
   
2. **Reduce Date Range:**
   - Filter to smaller date ranges
   - Load less data at once
   
3. **Check Internet:**
   - Test connection speed
   - Refresh page
   
4. **Contact Admin:**
   - May be server issue
   - Report persistent problems

### Getting Help

#### In-App Help
- Look for **"?"** icon on pages
- Hover for quick tips
- Click for detailed help

#### Contact Support
- **Email:** support@rainbowtowers.com
- **Phone:** +263 (4) 123-4567
- **Hours:** Monday-Friday, 8 AM - 5 PM CAT

#### Documentation
- Technical docs: `TECHNICAL_DOCS.md`
- Testing guide: `TESTING.md`
- This user guide

#### Training
- Request training session from admin
- Video tutorials (coming soon)
- Practice in test environment

---

## Tips & Best Practices

### Booking Management
- ✅ Create bookings as soon as client confirms interest
- ✅ Use notes field for special requirements
- ✅ Confirm bookings promptly after receiving deposit
- ✅ Generate quotations immediately for client approval
- ✅ Double-check date and time before confirming

### Client Management
- ✅ Keep client information up to date
- ✅ Add detailed notes about preferences
- ✅ Review client history before creating new booking
- ✅ Track repeat clients for loyalty programs

### Calendar Usage
- ✅ Check calendar before promising availability
- ✅ Use filters to focus on specific rooms or dates
- ✅ Review upcoming week every Monday
- ✅ Print monthly calendar for physical reference

### Reporting
- ✅ Run monthly reports for performance tracking
- ✅ Export and archive reports
- ✅ Compare month-over-month trends
- ✅ Share insights with team

### Security
- ✅ Log out when leaving workstation
- ✅ Don't share login credentials
- ✅ Use strong passwords
- ✅ Report suspicious activity immediately
- ✅ Keep client information confidential

---

## Keyboard Shortcuts

### Global
- `Ctrl + K` - Quick search
- `Ctrl + N` - New booking
- `Ctrl + /` - Help menu
- `Esc` - Close modal

### Navigation
- `Ctrl + D` - Go to dashboard
- `Ctrl + B` - Go to bookings
- `Ctrl + C` - Go to calendar
- `Ctrl + R` - Go to reports

### Forms
- `Enter` - Submit form (when in text field)
- `Tab` - Move to next field
- `Shift + Tab` - Move to previous field

---

**Need More Help?**  
Contact your system administrator or refer to the technical documentation.

**Version:** 1.0.0  
**Last Updated:** January 2025
