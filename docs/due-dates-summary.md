# QC Due Dates Summary

## Current Date: July 4, 2025 (Friday)

### Daily QC Status
- **MRI-001**: Due Today (July 4, 2025) - Not completed yet
- **CT-002**: Should be overdue (missing July 3, 2025) - but not showing in API
- **Other machines**: Up to date

### Monthly QC Status  
- **PET-001**: Should be overdue (missing June 2025) - but not showing in API
- **Other machines**: Up to date for July 2025

### Quarterly QC Status
All machines due this quarter (Q3 2025):
- **MRI-001**: Due July 1, 2025
- **CT-001**: Due July 1, 2025  
- **PET-001**: Due July 1, 2025
- **MRI-002**: Due July 1, 2025
- **CT-002**: Due July 1, 2025

### Annual QC Status
All machines due this year:
- **MRI-001**: Due January 1, 2025
- **CT-001**: Due January 1, 2025
- **PET-001**: Due January 1, 2025
- **MRI-002**: Due January 1, 2025
- **CT-002**: Due January 1, 2025

## API Response Summary

The `/api/qc/due-tasks` endpoint returns:
- 1 machine with daily QC due today (MRI-001)
- 0 machines with overdue daily QC (CT-002 should appear here)
- 0 machines with monthly QC overdue (PET-001 should appear here)
- 5 machines with quarterly QC due this quarter
- 5 machines with annual QC due this year

## Sample Data Configuration

In the backend code (`/backend/src/routes/qcTests.js`):
- MRI-001: Skips today's daily QC (simulating not done yet)
- CT-002: Skips yesterday's daily QC (simulating overdue)
- PET-001: Skips last month's monthly QC (simulating overdue)