# QC Form Autofill Feature

## Overview
When a user selects a date with existing QC data, the form automatically fetches and populates all fields with the previous values, allowing for easy review, correction, or updates.

## How It Works

### 1. Date Selection
- User opens QC form (any frequency: daily, monthly, quarterly, annual)
- Date dropdown shows available dates (green) and completed dates (grey with ✓)
- User selects a date with existing data (grey option)

### 2. Automatic Data Fetching
```javascript
const handleDateChange = async (date) => {
  const hasExistingData = existingQCDates.includes(date);
  
  if (hasExistingData) {
    await fetchExistingQCData(date);  // Fetch and populate
  } else {
    resetFormToBlank();               // Clear form
  }
};
```

### 3. Form Population
- **Loading indicator**: Shows "Loading existing QC data..." with spinner
- **API call**: `GET /api/qc/machines/:id/qc-history/:date?type=MRI`
- **Field population**: All form fields automatically filled with existing values

## What Gets Autofilled

### Test Fields (Per Test)
- **Measured Value**: Previous measurement (e.g., "-2.1 mm")
- **Result**: Previous pass/fail determination (e.g., "pass")
- **Notes**: Any test-specific notes (e.g., "Within tolerance")

### Global Fields
- **Performed By**: Original technician name (e.g., "John Smith")
- **Comments**: Overall session comments (e.g., "All tests within normal limits")

### Visual Indicators
- **Replace warning**: "Editing Existing Data" notification
- **Submit button**: Changes to "Update QC Data" instead of "Complete QC"
- **Form styling**: No visual changes to maintain consistency

## User Experience Flow

### Scenario: Editing July 3rd MRI QC Data

1. **Open form**: Navigate to `/qc/perform/MRI-001/daily`
2. **Select date**: Choose "Thu, Jul 3 ✓" from dropdown (grey option)
3. **Loading**: Brief "Loading existing QC data..." message
4. **Form populated**: All fields filled with July 3rd data:

```
┌─ Table Positioning ─────────────────────────────┐
│ Value: [2.9 mm]        → Result: [Pass ✓]      │
│ Notes: [Within tolerance]                       │
└─────────────────────────────────────────────────┘

┌─ Center Frequency ──────────────────────────────┐
│ Value: [63.858 MHz]    → Result: [Fail ✗]      │
│ Notes: [Service engineer notified]              │
└─────────────────────────────────────────────────┘

┌─ Technician Info ───────────────────────────────┐
│ Performed By: [John Smith]                      │
└─────────────────────────────────────────────────┘

┌─ Comments ──────────────────────────────────────┐
│ Failed tests: Center Frequency. Service         │
│ engineer notified about frequency drift.        │
└─────────────────────────────────────────────────┘
```

5. **Edit as needed**: User can modify any values
6. **Submit**: Click "Update QC Data" to save changes

## API Integration

### Existing Endpoint Usage
```
GET /api/qc/machines/MRI-001/qc-history/2025-07-03?type=MRI
```

**Response Structure:**
```json
{
  "daily": {
    "date": "2025-07-03",
    "performedBy": "John Smith",
    "comments": "Failed tests: Center Frequency...",
    "tests": [
      {
        "testName": "Table Positioning",
        "value": "2.9 mm",
        "result": "pass",
        "notes": "Within tolerance"
      }
    ]
  }
}
```

### Data Mapping
```javascript
// Populate test data
existingQC.tests.forEach(test => {
  populatedData[test.testName] = {
    value: test.value || '',
    result: test.result || '',
    notes: test.notes || ''
  };
});

// Populate global fields
populatedData.performedBy = existingQC.performedBy || '';
populatedData.comments = existingQC.comments || '';
```

## Error Handling

### Scenarios Covered
1. **API failure**: Gracefully falls back to blank form
2. **Missing data**: Populates available fields, leaves others blank
3. **Network timeout**: Shows error, resets to blank form
4. **Invalid date**: No action taken, form remains in current state

### User Feedback
- **Loading state**: Clear indication data is being fetched
- **Error recovery**: Silent fallback to blank form
- **Success indication**: Form populated without disruption

## Benefits

### For Users
1. **Data review**: Easy examination of previous QC results
2. **Error correction**: Simple fixes to incorrect values
3. **Time saving**: No need to re-enter all data for minor corrections
4. **Audit trail**: Clear indication when editing vs. creating new data

### For Quality Assurance
1. **Data integrity**: Maintains complete history of changes
2. **Accountability**: Shows who performed original vs. updated QC
3. **Traceability**: Full record of modifications and reasons
4. **Compliance**: Supports regulatory requirements for data corrections

## Use Cases

### 1. Data Correction
- **Scenario**: Wrong measurement value entered yesterday
- **Process**: Select yesterday's date → Form autofills → Correct value → Update
- **Result**: Corrected QC record with updated timestamp

### 2. Missing Information
- **Scenario**: Technician forgot to add notes about unusual reading
- **Process**: Select date → Form autofills → Add missing notes → Update
- **Result**: Complete QC record with all required information

### 3. Follow-up Actions
- **Scenario**: Need to update status after service engineer review
- **Process**: Select date → Form autofills → Update result/notes → Update
- **Result**: QC record reflects final resolution status

## Technical Implementation

### State Management
```javascript
const [loadingExistingData, setLoadingExistingData] = useState(false);
const [showReplaceWarning, setShowReplaceWarning] = useState(false);
```

### Async Data Loading
```javascript
const fetchExistingQCData = async (date) => {
  setLoadingExistingData(true);
  try {
    // Fetch and populate data
  } finally {
    setLoadingExistingData(false);
  }
};
```

### Form Reset Logic
```javascript
const resetFormToBlank = () => {
  // Clear all fields when switching to available date
};
```

The autofill feature transforms the QC form from a create-only interface into a comprehensive data management tool that supports the full lifecycle of QC record maintenance.