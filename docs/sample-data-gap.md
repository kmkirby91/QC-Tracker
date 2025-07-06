# Sample Data with QC Gap

## Overview
The sample data now includes a realistic gap in QC completion to demonstrate the date selection functionality.

## MRI-001 Sample Data Gap

### Missing QC Date
- **Date**: Monday, June 30, 2025
- **Machine**: MRI-001 (Siemens MAGNETOM Vida)
- **Type**: Daily QC
- **Status**: Not completed (simulates missed QC)

### QC Form Date Dropdown Display

When opening the QC form for MRI-001, users will see:

```
┌─ Select Date for QC ────────────────────────────┐
│ ▼ Fri, Jul 4 (Today)                 🟢        │
├─────────────────────────────────────────────────┤
│   Thu, Jul 3 ✓                       🔘        │ 
│   Wed, Jul 2 ✓                       🔘        │
│   Tue, Jul 1 ✓                       🔘        │
│   Mon, Jun 30                        🟢        │  ← Missing QC
│   Thu, Jun 27 ✓                      🔘        │
│   Wed, Jun 26 ✓                      🔘        │
│   ...                                           │
└─────────────────────────────────────────────────┘
```

### Data Pattern
- **July 1-3**: Complete QC data (grey with ✓)
- **June 30**: **Missing** - shows in green as available
- **June 27 and earlier**: Complete QC data (grey with ✓)
- **Weekends**: Automatically excluded from dropdown

## Backend Implementation

```javascript
// Skip June 30th QC for MRI-001 to simulate a missed QC date
if (i === 4 && machineId === 'MRI-001') continue;
```

Where `i = 4` represents 4 days ago from today (July 4), which is June 30, 2025.

## Use Case Demonstration

This gap allows demonstration of:

1. **Current QC Entry**: Select July 4 (Today) - green, no warning
2. **Historical Completion**: Select June 30 - green, fill missed QC  
3. **Data Replacement**: Select July 3 - grey, shows replacement warning

## Date Verification

```bash
June 30, 2025 = Monday (weekday, eligible for daily QC)
July 4, 2025 = Friday (today)
```

## API Response Example

```json
// GET /api/qc/machines/MRI-001/qc-history?type=MRI
{
  "daily": [
    {"date": "2025-07-03", "overallResult": "pass", ...},
    {"date": "2025-07-02", "overallResult": "pass", ...},  
    {"date": "2025-07-01", "overallResult": "pass", ...},
    // June 30 missing - gap in data
    {"date": "2025-06-27", "overallResult": "pass", ...},
    {"date": "2025-06-26", "overallResult": "pass", ...}
  ]
}
```

## Realistic Scenario

This simulates a real-world scenario where:
- **Monday, June 30**: Technician forgot to perform daily QC
- **Tuesday, July 1**: Normal QC resumed  
- **User discovers gap**: Can now go back and complete June 30 QC
- **Form shows green**: Indicates June 30 is available for entry

The gap provides a perfect example of the system's flexibility for handling missed QC dates while protecting existing data with clear visual indicators.