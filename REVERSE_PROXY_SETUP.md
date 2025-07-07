# Reverse Proxy Setup for QC Tracker

## Overview
This document explains how to configure QC Tracker for public access through a reverse proxy at `qctracker.a-naviq.com`.

## Changes Made

### Backend Configuration (`backend/src/server.js`)
- **CORS Configuration**: Added support for `qctracker.a-naviq.com` domain
- **Helmet Security**: Configured CSP headers for reverse proxy
- **Proxy Trust**: Added `app.set('trust proxy', true)` for proper IP handling
- **Allowed Origins**: Supports both local and public domains

### Frontend Configuration (`frontend/vite.config.js`)
- **Host Binding**: Changed from specific IP to `0.0.0.0` for universal access
- **Proxy Debugging**: Added logging for troubleshooting
- **Base Path**: Configured for reverse proxy compatibility

### Environment Variables
- **Development**: `frontend/.env.development` - Uses local API
- **Production**: `frontend/.env.production` - Uses public domain API

## Reverse Proxy Configuration

### Nginx Configuration Example
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name qctracker.a-naviq.com;

    # SSL configuration (if using HTTPS)
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend (React app)
    location / {
        proxy_pass http://192.168.1.182:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://192.168.1.182:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://qctracker.a-naviq.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Forwarded-For, X-Real-IP, X-Forwarded-Proto" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

### Apache Configuration Example
```apache
<VirtualHost *:80>
    ServerName qctracker.a-naviq.com
    
    # Frontend
    ProxyPass / http://192.168.1.182:3000/
    ProxyPassReverse / http://192.168.1.182:3000/
    
    # Backend API
    ProxyPass /api http://192.168.1.182:5000/api
    ProxyPassReverse /api http://192.168.1.182:5000/api
    
    # Headers for proper proxy handling
    ProxyPreserveHost On
    ProxyAddHeaders On
    
    # CORS headers
    Header always set Access-Control-Allow-Origin "https://qctracker.a-naviq.com"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Forwarded-For, X-Real-IP, X-Forwarded-Proto"
</VirtualHost>
```

## Deployment Steps

1. **Update Configuration**: The changes have been applied to both backend and frontend
2. **Restart Services**: Run `./restart-services.sh` or manually restart:
   ```bash
   # Stop existing services
   pkill -f "node src/server.js"
   pkill -f "vite"
   
   # Start backend
   cd backend && npm start &
   
   # Start frontend
   cd frontend && npm run dev &
   ```
3. **Configure Reverse Proxy**: Set up your reverse proxy server (Nginx/Apache) with the configuration above
4. **Test Access**: Access `https://qctracker.a-naviq.com` to verify functionality

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**
   - Check CORS configuration in `backend/src/server.js`
   - Verify reverse proxy headers are being passed correctly
   - Ensure `qctracker.a-naviq.com` is in the allowed origins

2. **API Calls Failing**
   - Check browser console for CORS errors
   - Verify `/api` routes are properly proxied
   - Test direct API access: `https://qctracker.a-naviq.com/api/health`

3. **Assets Not Loading**
   - Verify base path configuration in `vite.config.js`
   - Check that static assets are being served through the proxy

### Debug Commands
```bash
# Check if services are running
ps aux | grep node

# Test API health endpoint
curl http://192.168.1.182:5000/api/health
curl https://qctracker.a-naviq.com/api/health

# View backend logs
cd backend && npm start

# View frontend logs
cd frontend && npm run dev
```

## Security Considerations

- **HTTPS**: Ensure SSL/TLS is properly configured for production
- **Rate Limiting**: The backend has rate limiting enabled (1000 requests per 15 minutes)
- **CORS**: Restricted to specific domains to prevent unauthorized access
- **Headers**: Security headers are configured through Helmet.js

## Environment Variables

The application now supports environment-specific configuration:

- **VITE_API_URL**: API base URL (automatically set based on environment)
- **VITE_APP_TITLE**: Application title

For production deployment, you may want to build the frontend:
```bash
cd frontend
npm run build
# Serve the dist/ folder through your web server
```