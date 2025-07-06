# QC Tracker System Summary

## Current Date: July 4, 2025

## Key Features Implemented

### 1. Unified Technician per QC Session
- All daily QC tests are performed by a single technician
- Monthly, quarterly, and annual QC are each performed by appropriate specialists
- Technician name is recorded at both the session and individual test level

### 2. Comments Section
Each QC session now includes a comprehensive comments field that contains:
- Summary of test results (pass/fail/conditional)
- Specific failed tests listed
- Actions taken (e.g., "Service engineer notified")
- Additional observations (e.g., "Helium level at 85%")
- Machine-specific notes

### 3. Actual Clinical MRI Tests
Daily QC tests now include real clinical tests with appropriate pass/fail criteria:
- **Table Positioning**: ±5 mm tolerance
- **Setup and Scanning**: Pass/Fail based on system readiness
- **Center Frequency**: ±3 ppm tolerance
- **Transmitter Gain**: ±5% tolerance
- **Geometric Accuracy**: ±2 mm tolerance
- **High Contrast Resolution**: All spokes visible
- **Low Contrast Resolution**: ≥37 objects visible
- **Artifact Analysis**: Qualitative assessment
- **Film QC**: Console match verification
- **Visual Checklist**: Safety systems check

### 4. Four-Tier QC Frequency
The system tracks QC at four frequencies:
- **Daily**: Weekdays only
- **Monthly**: Comprehensive monthly tests
- **Quarterly**: Safety and performance assessments
- **Annual**: Regulatory compliance and certification

## Sample Data Structure

### Daily QC Example (MRI-001, July 3, 2025)
```json
{
  "date": "2025-07-03",
  "overallResult": "fail",
  "performedBy": "Jane Doe",
  "comments": "Failed tests: Center (Central) Frequency. Service engineer notified about frequency drift.",
  "tests": [
    {
      "testName": "Table Positioning",
      "result": "pass",
      "value": "-2.0 mm",
      "tolerance": "±5 mm",
      "performedBy": "Jane Doe"
    },
    {
      "testName": "Center (Central) Frequency",
      "result": "fail",
      "value": "63.858 MHz",
      "tolerance": "±3 ppm",
      "notes": "Drift of 31.3 ppm exceeds ±3 ppm limit",
      "performedBy": "Jane Doe"
    }
  ]
}
```

### Monthly QC Example
```json
{
  "date": "2025-07-04",
  "overallResult": "conditional",
  "performedBy": "Tom Brown",
  "comments": "Conditional pass: Slice Thickness Accuracy. Monitor closely next month.",
  "tests": [...]
}
```

## Due Dates Overview

### Machines with QC Due
- **Daily QC Due Today**: MRI-001 (Siemens MAGNETOM Vida)
- **Quarterly QC Due (Q3 2025)**: All 5 machines
- **Annual QC Due (2025)**: All 5 machines

### Sample Missing QC
- **MRI-001**: Daily QC not completed for July 4, 2025
- **CT-002**: Configured to skip yesterday's QC (would show as overdue)
- **PET-001**: Configured to skip last month's QC (would show as overdue)

## API Endpoints

### Get Due Tasks
`GET /api/qc/due-tasks`
Returns all machines with QC due or overdue, organized by frequency.

### Get QC History
`GET /api/qc/machines/:machineId/qc-history?type=MRI`
Returns complete QC history with tests, results, comments, and performer information.

### Get Specific QC Date
`GET /api/qc/machines/:machineId/qc-history/:date?type=MRI`
Returns QC data for a specific date.

## Technical Implementation

- Backend: Node.js/Express with mock data generation
- Frontend: React with Tailwind CSS
- All QC data includes realistic test values based on clinical tolerances
- Pass/fail logic implemented based on actual acceptance criteria
- Comments automatically generated based on test results
- Single technician assignment per QC session ensures consistency