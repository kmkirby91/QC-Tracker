# Development Guide

## Environment Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to code-server container on Unraid

### Initial Setup
1. Clone repository in code-server
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd frontend
   npm install
   ```

### Development Workflow

#### Starting the Application
Always start backend first, then frontend:

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Application URLs
- Frontend: http://192.168.1.182:3000
- Backend: http://192.168.1.182:5000
- Health Check: http://192.168.1.182:5000/api/health

### Important Development Rules

#### ⚠️ Container Management
- **NEVER restart the code-server container**
- Only restart application processes (node/npm)
- Code-server runs on port 8443 - leave it alone
- Use container IP (192.168.1.182) for all development

#### Process Management
```bash
# Check running processes
ps aux | grep node

# Kill only app processes (NOT code-server)
pkill -f "node src/server.js"
pkill -f "vite"

# Restart backend only
cd backend && npm start

# Restart frontend only  
cd frontend && npm run dev
```

### File Structure

#### Backend Structure
```
backend/
├── src/
│   ├── models/           # MongoDB models (currently unused)
│   │   └── Machine.js    # Machine schema
│   ├── routes/           # Express route handlers
│   │   ├── machines.js   # Machine CRUD operations
│   │   ├── qcTests.js    # QC data and due tasks
│   │   └── reports.js    # PDF report generation
│   ├── services/         # Business logic
│   │   └── pdfGenerator.js # PDF creation service
│   └── server.js         # Main Express server
├── reports/              # Generated PDF files
└── package.json          # Dependencies and scripts
```

#### Frontend Structure
```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── MachineCard.jsx      # Machine summary cards
│   │   ├── MachineDetail.jsx    # Machine detail page
│   │   ├── QCCalendar.jsx       # QC calendar view
│   │   ├── QCHistory.jsx        # QC history list
│   │   ├── QCTestDetail.jsx     # Individual QC test page
│   │   ├── QCStatusDashboard.jsx # QC status widget
│   │   ├── DueToday.jsx         # Overdue tasks page
│   │   ├── StatusSummary.jsx    # Enterprise statistics
│   │   └── FilterBar.jsx        # Machine filters
│   ├── App.jsx           # Main app with routing
│   └── App.css           # Tailwind styles
└── package.json          # Dependencies and scripts
```

### Adding New Features

#### 1. Backend Development

##### Adding New API Endpoints
```javascript
// In routes/[feature].js
const express = require('express');
const router = express.Router();

router.get('/endpoint', (req, res) => {
  // Logic here
  res.json({ data: 'response' });
});

module.exports = router;
```

##### Registering Routes
```javascript
// In server.js
const newRouter = require('./routes/feature');
app.use('/api/feature', newRouter);
```

#### 2. Frontend Development

##### Creating New Components
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NewComponent = ({ prop1, prop2 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Component content */}
    </div>
  );
};

export default NewComponent;
```

##### Adding Routes
```jsx
// In App.jsx
import NewComponent from './components/NewComponent';

// Add to Routes
<Route path="/new-page" element={<NewComponent />} />
```

### Styling Guidelines

#### Using Tailwind CSS
- Use utility classes for styling
- Follow responsive design patterns
- Consistent color scheme:
  - Green: Success/Pass (#10B981)
  - Red: Error/Fail (#EF4444)
  - Yellow: Warning/Conditional (#F59E0B)
  - Blue: Info/Links (#3B82F6)
  - Gray: Neutral (#6B7280)

#### Common Patterns
```jsx
// Card container
<div className="bg-white rounded-lg shadow-md p-6">

// Button styles
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">

// Status badges
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Data Management

#### Mock Data Generation
Currently using generated mock data in `qcTests.js`:
- `generateQCHistory()` creates realistic QC data
- Machine-specific test templates
- Automatic weekend handling
- Random but realistic test results

#### API Integration
```jsx
// Standard API call pattern
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await axios.get('/api/endpoint');
    setData(response.data);
    setError(null);
  } catch (err) {
    setError('Failed to load data: ' + err.message);
  } finally {
    setLoading(false);
  }
};
```

### Testing

#### Manual Testing Checklist
- [ ] All pages load without errors
- [ ] Machine cards clickable and link correctly
- [ ] Calendar views show QC data
- [ ] Calendar days clickable (where QC exists)
- [ ] PDF reports generate and download
- [ ] Due Today page shows overdue tasks
- [ ] Filters work on main dashboard
- [ ] Mobile responsive design

#### API Testing
```bash
# Health check
curl http://192.168.1.182:5000/api/health

# Get machines
curl http://192.168.1.182:5000/api/machines

# Get QC history
curl "http://192.168.1.182:5000/api/qc/machines/MRI-001/qc-history?type=MRI"

# Get due tasks
curl http://192.168.1.182:5000/api/qc/due-tasks
```

### Troubleshooting

#### Backend Issues
```bash
# Check if backend is running
curl http://192.168.1.182:5000/api/health

# Check backend logs
cd backend && npm start

# Check for port conflicts
lsof -i :5000
```

#### Frontend Issues
```bash
# Check if frontend is running
curl -I http://192.168.1.182:3000

# Restart frontend
cd frontend && npm run dev

# Check for port conflicts
lsof -i :3000
```

#### Common Fixes
1. **500 Errors**: Usually backend not running or crashed
2. **CORS Errors**: Backend not accessible from frontend
3. **Route Not Found**: Check if API routes are registered
4. **PDF Issues**: Check if reports directory exists

### Performance Tips

#### Frontend Optimization
- Use React.memo for expensive components
- Implement proper loading states
- Minimize API calls with caching
- Use proper dependency arrays in useEffect

#### Backend Optimization
- Implement request caching
- Use proper error handling
- Optimize mock data generation
- Add request logging

### Security Considerations

#### Current Development Setup
- No authentication (development only)
- CORS enabled for all origins
- Rate limiting at 100 requests/15min
- No input validation (add before production)

#### Production TODO
- [ ] Add authentication/authorization
- [ ] Implement input validation
- [ ] Add request logging
- [ ] Secure API endpoints
- [ ] Add HTTPS
- [ ] Environment-specific configurations