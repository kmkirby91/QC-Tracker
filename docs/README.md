# QC Tracker Documentation

## Overview
QC Tracker is a web-based quality control management system for medical imaging equipment (MRI, CT, PET-CT). This system helps healthcare facilities track daily and monthly QC requirements, monitor compliance, and maintain equipment safety standards.

## ⚠️ Development Status
**This is a PROTOTYPE system not intended for clinical use.** The system is currently in development and testing phase.

## System Architecture

### Frontend (React)
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React hooks (useState, useEffect)

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB (currently disabled, using mock data)
- **PDF Generation**: PDFKit
- **Security**: Helmet, CORS, Rate Limiting

### Deployment
- **Environment**: Code-server container on Unraid Docker
- **Network**: Uses container IP (192.168.1.182)
- **Ports**: Frontend (3000), Backend (5000)

## Repository Structure

```
QC-Tracker/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── models/         # Data models (MongoDB schemas)
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic and utilities
│   │   └── server.js       # Main server file
│   ├── reports/            # Generated PDF reports
│   └── package.json        # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main app component with routing
│   │   └── App.css         # Styles
│   └── package.json        # Frontend dependencies
├── docs/                   # Documentation
├── CLAUDE.md              # Development notes
└── README.md              # Project overview
```

## Key Features

### 1. Machine Management
- View all imaging machines in enterprise
- Filter by type, status, location
- Individual machine detail pages

### 2. QC Tracking
- **Daily QC**: Required on working days
- **Monthly QC**: Comprehensive monthly testing
- **Visual calendars**: Color-coded status indicators
- **Clickable days**: Drill down to specific test results

### 3. Compliance Monitoring
- QC Status Dashboard on each machine
- Due Today page for overdue tasks
- Alert system for missed QC
- Priority levels (Critical/High/Medium/Low)

### 4. Reporting
- PDF generation for monthly QC reports
- Detailed test results with pass/fail status
- Historical data tracking

## API Endpoints

### Machines
- `GET /api/machines` - List all machines
- `GET /api/machines/:id` - Get specific machine
- `GET /api/machines/status/:status` - Filter by status
- `GET /api/machines/type/:type` - Filter by type

### QC Data
- `GET /api/qc/machines/:id/qc-history` - Get QC history
- `GET /api/qc/machines/:id/qc-history/:date` - Get specific date QC
- `GET /api/qc/due-tasks` - Get overdue/due QC tasks

### Reports
- `GET /reports/:filename` - Serve PDF reports
- `GET /reports/monthly-qc/:machineId/:year/:month` - Generate monthly report

## Component Architecture

### Core Components
- **App.jsx**: Main app with routing
- **Dashboard**: Main landing page with machine overview
- **MachineCard**: Individual machine summary cards
- **MachineDetail**: Detailed machine page with QC data

### QC Components
- **QCStatusDashboard**: Current QC status widget
- **QCCalendar**: Visual calendar for daily/monthly QC
- **QCHistory**: Detailed QC test history
- **QCTestDetail**: Individual QC test results page
- **DueToday**: Overdue/due QC tasks page

### Utility Components
- **StatusSummary**: Enterprise-wide QC statistics
- **FilterBar**: Machine filtering controls

## Data Flow

1. **Frontend** makes API calls to backend
2. **Backend** generates mock QC data (or queries database in production)
3. **Components** render data with interactive features
4. **User interactions** trigger navigation or data updates
5. **PDF reports** generated on-demand for monthly QC

## Development Workflow

### Starting the Application
```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm run dev
```

### Accessing the Application
- Frontend: http://192.168.1.182:3000
- Backend API: http://192.168.1.182:5000
- Health check: http://192.168.1.182:5000/api/health

### Common Development Tasks
- View machine details: Click any machine card
- Check QC calendar: Machine page → Daily/Monthly QC → Calendar view
- View specific QC results: Click calendar day with QC data
- See overdue tasks: Main dashboard → "View Due Tasks" button
- Generate PDF report: Monthly QC history → "PDF Report" button

## Mock Data Structure

The system currently uses generated mock data including:
- 5 sample machines (MRI, CT, PET-CT)
- 30 days of daily QC data per machine
- 12 months of monthly QC data per machine
- Machine-specific QC tests based on equipment type

## Future Development

### For Production Deployment
1. **Database Integration**: Replace mock data with MongoDB
2. **Authentication**: Add user login/role-based access
3. **Real QC Recording**: Interface for technicians to enter QC data
4. **Notifications**: Email/SMS alerts for overdue QC
5. **Audit Trail**: Track who performed QC and when
6. **Integration**: Connect with PACS/RIS systems
7. **Compliance**: FDA/regulatory compliance features
8. **Multi-tenant**: Support multiple healthcare facilities

### Immediate Next Steps
1. Fix backend server connectivity issues
2. Add error handling and loading states
3. Improve mobile responsiveness
4. Add data validation
5. Implement proper logging

## Troubleshooting

### Backend Not Starting
- Check if port 5000 is available
- Verify Node.js dependencies: `npm install`
- Check server logs for errors

### Frontend Issues
- Verify frontend dependencies: `npm install`
- Check if backend is running and accessible
- Clear browser cache

### Container Issues
- Don't restart code-server container
- Only restart application processes
- Use container IP (192.168.1.182) for all URLs