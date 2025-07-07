# QC Tracker Development Notes

## Current Development Status
- **Phase**: Prototyping (NOT for clinical deployment)
- **Environment**: Code-server container on Unraid Docker
- **Purpose**: Testing and development of medical imaging QC tracking system

## Development Environment Setup
- **Container**: Headless code-server on Unraid
- **IP Address**: 192.168.1.182 (code-server container IP)
- **Ports**: 
  - Backend: 5000
  - Frontend: 3000
  - Code-server: 8443

## Important Notes for Development
- **DO NOT restart code-server** - only restart application services
- **Piggyback IP**: Using code-server container IP (192.168.1.182) for testing
- **Mock Data**: Currently using generated mock data, no real database
- **MongoDB**: Commented out for development phase

## Application URLs
- **Public Access**: https://qctracker.a-naviq.com (reverse proxy)
- Frontend: http://192.168.1.182:3000
- Backend API: http://192.168.1.182:5000
- Code-server: http://192.168.1.182:8443

## Development Commands
- **Quick restart**: `./restart-services.sh`
- Start backend: `cd backend && npm start`
- Start frontend: `cd frontend && npm run dev`
- Check processes: `ps aux | grep node`
- Kill app processes: `pkill -f "node src/server.js"` (NOT code-server)

## Reverse Proxy Configuration
- **Status**: ✅ Configured for public access
- **Domain**: qctracker.a-naviq.com
- **CORS**: Configured for both local and public domains
- **Security**: Rate limiting and security headers enabled
- **Documentation**: See `REVERSE_PROXY_SETUP.md` for detailed configuration

## Recent Development Work
- ✅ Machine detail pages with QC tracking
- ✅ Daily/Monthly QC calendars
- ✅ Clickable calendar days for detailed QC views
- ✅ QC Status Dashboard on machine pages
- ✅ Due Today page for overdue QC tracking
- ✅ PDF report generation for monthly QC

## Next Steps for Production
- Replace mock data with real database
- Add user authentication
- Implement actual QC test recording
- Add proper error handling
- Security hardening
- Clinical validation