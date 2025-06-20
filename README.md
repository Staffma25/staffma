# STAFMA - HR Management System

A comprehensive HR management system designed for small and medium businesses in Kenya, with separate interfaces for business users and system administrators.

## Features

### For Businesses
- **Employee Management**: Digital employee records, document management
- **Payroll Management**: Automated PAYE, NHIF, and NSSF calculations
- **Leave Management**: Request and approve leave applications
- **Performance Reviews**: Set KPIs and conduct employee reviews
- **User Management**: Manage business users and permissions

### For Staffma System Administrators
- **System Monitoring**: Track all business activities and system usage
- **Activity Logs**: Comprehensive logging of all system activities
- **Business Overview**: Monitor all registered businesses
- **System Administration**: Manage system settings and configurations
- **Analytics & Reports**: Generate system-wide reports and insights
- **Staffma User Management**: Create and manage Staffma system users

## User Types

### Business Users
- **Business Owners**: Full access to their business data and operations
- **HR Managers**: Manage employees, payroll, and HR processes
- **Employees**: Access to their own data and leave requests

### Staffma System Users
- **Super Administrators**: Full system access, can create other Staffma users
- **System Administrators**: Manage system operations and business monitoring
- **Support Staff**: Handle support tickets and basic system monitoring

## Login Routes

The system now has separate login routes to differentiate between business users and system administrators:

### Business Users
- **URL**: `/login`
- **Purpose**: For business owners and HR managers to access their business dashboard
- **Features**: Employee management, payroll, leave management, performance reviews

### Staffma System Administrators
- **URL**: `/staffma/login`
- **Purpose**: For system administrators to access Staffma monitoring and administration tools
- **Features**: System monitoring, activity logs, business overview, analytics

### Registration Routes
- **Business Registration**: `/register` - For new businesses to register
- **Staffma Registration**: `/staffma/register` - For Staffma system administrators to register

### Landing Page
- **URL**: `/`
- **Purpose**: Main landing page with links to both login types and registration options

## Quick Start

1. **Start the server**:
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the client**:
   ```bash
   cd client
   npm install
   npm start
   ```

3. **Access the application**:
   - Business Login: http://localhost:3000/login
   - Staffma System Login: http://localhost:3000/staffma/login
   - Business Registration: http://localhost:3000/register
   - Staffma Registration: http://localhost:3000/staffma/register
   - Landing Page: http://localhost:3000/

## Staffma System Setup

### First Time Setup
1. **Register the first Staffma super administrator**:
   - Go to: http://localhost:3000/staffma/register
   - Fill in the registration form
   - The first user will automatically be assigned the "super_admin" role
   - This user can create additional Staffma users

2. **Login to Staffma dashboard**:
   - Go to: http://localhost:3000/staffma/login
   - Use the registered credentials
   - Access the Staffma system administration dashboard

### Creating Additional Staffma Users
Super administrators can create additional Staffma users through the Staffma dashboard:
- System Administrators: Full system management capabilities
- Support Staff: Basic monitoring and support capabilities

## Security

- **Role-based Access Control**: Different interfaces for different user types
- **Protected Routes**: Staffma routes are protected and only accessible by Staffma users
- **Authentication**: JWT-based authentication with refresh tokens
- **Activity Logging**: All system activities are logged for monitoring
- **Separate User Models**: Business users and Staffma users are completely separate entities

## API Endpoints

### Business Routes
- `/api/dashboard` - Business dashboard data
- `/api/employees` - Employee management
- `/api/payroll` - Payroll processing
- `/api/leaves` - Leave management
- `/api/performance-reviews` - Performance reviews

### Staffma Routes
- `/api/staffma/register` - Register new Staffma users
- `/api/staffma/login` - Staffma user login
- `/api/staffma/profile` - Get Staffma user profile
- `/api/staffma/users` - Manage Staffma users (admin only)
- `/api/activities` - Activity logs and monitoring
- `/api/activities/summary` - Activity summary statistics
- `/api/activities/export` - Export activity data

## Testing

Run the Staffma registration test:
```bash
node test-staffma-registration.js
```

This will test the Staffma registration, login, and user management functionality.

## Environment Variables

Make sure to set up the following environment variables in your `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 