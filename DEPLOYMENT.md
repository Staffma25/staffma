# Deployment Guide

## Environment Variables

### Frontend (React App)

Create a `.env` file in the `client` directory:

```env
# API Configuration
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### Backend (Node.js/Express)

Create a `.env` file in the `server` directory:

```env
# JWT Secret (use a strong, random string)
JWT_SECRET=your_very_secure_jwt_secret_here

# MongoDB Connection
MONGODB_URI=mongodb://your-mongodb-connection-string

# Server Configuration
PORT=5001
NODE_ENV=production
```

## Session Management Fixes

The following fixes have been implemented to resolve short session issues:

### 1. Token Expiration Alignment
- **Business tokens**: 24 hours
- **Staffma tokens**: 24 hours (previously 8 hours)

### 2. Environment Variable Support
- All hardcoded `localhost:5001` URLs replaced with `process.env.REACT_APP_API_URL`
- Fallback to localhost for development

### 3. Better Error Handling
- Graceful handling of expired tokens
- Automatic session cleanup on 401 errors
- Preserved tokens for network errors

## Deployment Steps

### 1. Backend Deployment
1. Deploy your Node.js server to your hosting provider
2. Set environment variables in your hosting platform
3. Ensure MongoDB is accessible from your server

### 2. Frontend Deployment
1. Set the `REACT_APP_API_URL` environment variable to point to your backend
2. Deploy the React app to your hosting provider
3. Ensure CORS is properly configured on your backend

### 3. Testing After Deployment
1. Test business user login and session persistence
2. Test Staffma user login and session persistence
3. Test multiple concurrent sessions
4. Test navigation between pages without session drops

## Common Issues and Solutions

### Session Drops
- **Cause**: Incorrect API URL in production
- **Solution**: Verify `REACT_APP_API_URL` is set correctly

### Token Expiration
- **Cause**: Tokens expiring too quickly
- **Solution**: Tokens now expire in 24 hours for both user types

### CORS Errors
- **Cause**: Backend not configured for frontend domain
- **Solution**: Update CORS configuration in backend

## Multiple Session Support

The system now supports:
- ✅ Concurrent business and Staffma sessions
- ✅ Independent token storage
- ✅ Separate user states
- ✅ Proper route protection
- ✅ Session persistence across page refreshes

## Security Considerations

1. **JWT Secret**: Use a strong, random string
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS to only allow your frontend domain
4. **Environment Variables**: Never commit `.env` files to version control 