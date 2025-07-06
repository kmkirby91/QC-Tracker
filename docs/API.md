# API Documentation

## Base URL
`http://192.168.1.182:5000`

## Authentication
Currently no authentication required (development phase).

## Error Responses
All endpoints return JSON error responses in the format:
```json
{
  "error": "Error message description"
}
```

## Endpoints

### Health Check
Check if the API server is running.

**GET** `/api/health`

**Response:**
```json
{
  "status": "OK",
  "message": "QC Tracker API is running"
}
```

---

### Machines

#### Get All Machines
Retrieve list of all machines in the system.

**GET** `/api/machines`

**Response:**
```json
[
  {
    "machineId": "MRI-001",
    "name": "Siemens MAGNETOM Vida",
    "type": "MRI",
    "manufacturer": "Siemens",
    "model": "MAGNETOM Vida 3T",
    "serialNumber": "SN-MRI-2021-001",
    "location": {
      "building": "Main Hospital",
      "floor": "2",
      "room": "MRI Suite 1"
    },
    "installationDate": "2021-03-15",
    "status": "operational",
    "lastQC": {
      "date": "2024-01-02",
      "result": "pass",
      "performedBy": "John Smith",
      "notes": "All parameters within normal limits"
    },
    "nextQCDue": "2024-01-09",
    "qcSchedule": {
      "daily": true,
      "weekly": true,
      "monthly": true,
      "quarterly": true,
      "annual": true
    }
  }
]
```

#### Get Machine by ID
Retrieve details for a specific machine.

**GET** `/api/machines/:id`

**Parameters:**
- `id` (string): Machine ID (e.g., "MRI-001")

**Response:** Single machine object (same structure as above)

#### Get Machines by Status
Filter machines by operational status.

**GET** `/api/machines/status/:status`

**Parameters:**
- `status` (string): One of "operational", "maintenance", "offline", "critical"

**Response:** Array of machine objects matching the status

#### Get Machines by Type
Filter machines by equipment type.

**GET** `/api/machines/type/:type`

**Parameters:**
- `type` (string): One of "MRI", "CT", "PET", "PET-CT", "X-Ray", "Ultrasound"

**Response:** Array of machine objects matching the type

#### Update Machine Status
Update the operational status of a machine.

**PATCH** `/api/machines/:id/status`

**Parameters:**
- `id` (string): Machine ID

**Request Body:**
```json
{
  "status": "maintenance"
}
```

**Response:** Updated machine object

---

### QC Data

#### Get QC History
Retrieve complete QC history for a machine.

**GET** `/api/qc/machines/:machineId/qc-history`

**Query Parameters:**
- `type` (string): Machine type for generating appropriate QC tests

**Response:**
```json
{
  "daily": [
    {
      "date": "2024-01-02",
      "overallResult": "pass",
      "tests": [
        {
          "testName": "Center Frequency Check",
          "result": "pass",
          "value": "127.3 MHz",
          "tolerance": "±0.1 MHz",
          "notes": "Within tolerance",
          "performedBy": "John Smith"
        }
      ],
      "completedAt": "2024-01-02T08:30:00.000Z"
    }
  ],
  "monthly": [
    {
      "date": "2024-01-01",
      "overallResult": "pass",
      "tests": [
        {
          "testName": "Slice Position Accuracy",
          "result": "pass",
          "value": "±0.5mm",
          "tolerance": "±1.0mm",
          "notes": "Excellent accuracy",
          "performedBy": "Tom Brown"
        }
      ],
      "completedAt": "2024-01-01T10:00:00.000Z",
      "reportUrl": "http://192.168.1.182:5000/reports/monthly-qc-MRI-001-2024-01.pdf"
    }
  ]
}
```

#### Get QC Data for Specific Date
Retrieve QC data for a specific date.

**GET** `/api/qc/machines/:machineId/qc-history/:date`

**Parameters:**
- `machineId` (string): Machine ID
- `date` (string): Date in YYYY-MM-DD format

**Query Parameters:**
- `type` (string): Machine type

**Response:**
```json
{
  "daily": {
    "date": "2024-01-02",
    "overallResult": "pass",
    "tests": [...],
    "completedAt": "2024-01-02T08:30:00.000Z"
  },
  "monthly": null
}
```

#### Get Due QC Tasks
Retrieve all QC tasks that are overdue or due today/this month.

**GET** `/api/qc/due-tasks`

**Response:**
```json
{
  "dailyOverdue": [
    {
      "machineId": "CT-002",
      "machineName": "Siemens SOMATOM Force",
      "type": "CT",
      "location": "Emergency Department - Trauma CT",
      "daysOverdue": 3,
      "nextDue": "2024-01-04",
      "lastQC": "2024-01-01",
      "priority": "critical"
    }
  ],
  "dailyDueToday": [
    {
      "machineId": "MRI-001",
      "machineName": "Siemens MAGNETOM Vida",
      "type": "MRI",
      "location": "Main Hospital - MRI Suite 1",
      "daysOverdue": 0,
      "nextDue": "2024-01-05",
      "lastQC": "2024-01-04",
      "priority": "medium"
    }
  ],
  "monthlyOverdue": [],
  "monthlyDueThisMonth": []
}
```

---

### Reports

#### Serve PDF Report
Download a generated PDF report.

**GET** `/reports/:filename`

**Parameters:**
- `filename` (string): PDF filename (e.g., "monthly-qc-MRI-001-2024-01.pdf")

**Response:** PDF file download

#### Generate Monthly QC Report
Generate a PDF report for monthly QC data.

**GET** `/reports/monthly-qc/:machineId/:year/:month`

**Parameters:**
- `machineId` (string): Machine ID
- `year` (string): Year (e.g., "2024")
- `month` (string): Month number (e.g., "01")

**Response:**
```json
{
  "message": "Report generated successfully",
  "filename": "monthly-qc-MRI-001-2024-01.pdf",
  "downloadUrl": "/reports/monthly-qc-MRI-001-2024-01.pdf"
}
```

---

## Data Types

### Machine Status
- `operational`: Machine is working normally
- `maintenance`: Machine is under planned maintenance
- `offline`: Machine is not available
- `critical`: Machine has critical issues requiring immediate attention

### QC Result
- `pass`: QC test passed all requirements
- `fail`: QC test failed requirements
- `conditional`: QC test passed with minor issues requiring monitoring

### Machine Types
- `MRI`: Magnetic Resonance Imaging
- `CT`: Computed Tomography
- `PET`: Positron Emission Tomography
- `PET-CT`: Combined PET and CT scanner
- `X-Ray`: Radiographic imaging
- `Ultrasound`: Ultrasound imaging

### Priority Levels
- `critical`: Requires immediate attention (3+ days overdue)
- `high`: High priority (1-2 days overdue)
- `medium`: Medium priority (due today/this month)
- `low`: Low priority (upcoming but not urgent)

## Rate Limiting
API requests are limited to 100 requests per 15-minute window per IP address.

## CORS
Cross-Origin Resource Sharing is enabled for all origins during development.