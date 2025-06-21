# Business-Specific Data Filtering

This document explains how the system ensures that each business only sees their own data, preventing data leakage between different businesses.

## Overview

The system implements multi-tenancy at the database level, where each business has its own isolated data. This is achieved through:

1. **Authentication Middleware**: Extracts business ID from JWT tokens
2. **Database Queries**: All queries filter by `businessId`
3. **API Routes**: All endpoints enforce business-specific access
4. **Frontend Context**: Business information is stored in authentication context

## How It Works

### 1. Authentication & Authorization

When a user logs in, the system:

1. **Validates credentials** against the database
2. **Generates JWT token** containing:
   - `businessId` (for business users)
   - `userId` (for system users)
   - `type` (business, user, or staffma)
3. **Stores token** in localStorage with business-specific keys

### 2. Server-Side Filtering

All API routes use the `auth` middleware which:

```javascript
// Extracts business ID from token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user.businessId = decoded.businessId; // For business users
req.user.businessId = decoded.businessId; // For system users
```

### 3. Database Queries

All database queries include business filtering:

```javascript
// Dashboard data
const employees = await Employee.find({ businessId: req.user.businessId });

// Employee count
const employeeCount = await Employee.countDocuments({ businessId: req.user.businessId });

// User count
const userCount = await User.countDocuments({ businessId: req.user.businessId });
```

### 4. Frontend Context

The frontend stores business information in the authentication context:

```javascript
// AuthContext.js
const [businessUser, setBusinessUser] = useState(null);

// Dashboard.js
const { businessUser } = useAuth();
console.log('Current business:', businessUser?.businessName);
```

## Key Components

### Authentication Middleware (`server/middleware/auth.js`)

- Extracts business ID from JWT tokens
- Sets `req.user.businessId` for all requests
- Handles different user types (business, user, staffma)

### Dashboard Route (`server/routes/dashboard.js`)

- Filters all data by `businessId`
- Returns only business-specific metrics
- Includes detailed logging for debugging

### Employees Route (`server/routes/employees.js`)

- All employee operations filter by `businessId`
- Prevents cross-business data access
- Validates permissions per business

### Frontend Dashboard (`client/src/components/Dashboard.js`)

- Displays business-specific information
- Shows business name and ID in header
- Includes debug information in development mode

## Testing Business Isolation

### Manual Testing

1. **Login as different businesses** and verify:
   - Dashboard shows correct business name
   - Employee counts are business-specific
   - No data from other businesses is visible

2. **Create employees** and verify:
   - New employees are assigned to correct business
   - Employee lists only show business-specific data

### Automated Testing

Run the test script to verify business isolation:

```bash
node test-business-filtering.js
```

This script will:
- Login as a test business
- Verify dashboard data is business-specific
- Check employee filtering
- Test employee creation
- Validate business isolation

## Debugging

### Server Logs

The system includes detailed logging:

```javascript
console.log('Dashboard request received for user:', {
  userId: req.user._id,
  userType: req.user.type,
  businessId: req.user.businessId,
  email: req.user.email
});
```

### Frontend Debug Panel

In development mode, the dashboard shows:
- Current business user data
- Dashboard business data
- Employee and user counts
- Business ID and email

### Common Issues

1. **Token Issues**: Check if JWT token contains correct `businessId`
2. **Database Queries**: Verify all queries include `businessId` filter
3. **Frontend State**: Ensure business user is properly stored in context

## Security Considerations

1. **JWT Token Security**: Tokens contain business ID, so they must be kept secure
2. **Database Indexing**: Ensure `businessId` fields are properly indexed
3. **API Validation**: All endpoints must validate business access
4. **Frontend Security**: Business data should not be exposed in client-side code

## Example: Yabalo Traders vs Lola vs Lulu

When Yabalo Traders logs in:

1. **Authentication**: JWT token contains Yabalo's `businessId`
2. **Dashboard**: Shows only Yabalo's employees and metrics
3. **Employees**: Lists only Yabalo's employees
4. **Payroll**: Calculates only Yabalo's payroll data

Lola and Lulu businesses will see their own respective data, completely isolated from each other.

## Verification Checklist

- [ ] Login as different businesses shows different data
- [ ] Employee counts are business-specific
- [ ] Creating employees assigns correct business ID
- [ ] No cross-business data leakage
- [ ] Dashboard header shows correct business name
- [ ] All API calls include business filtering
- [ ] Debug logs show correct business context 