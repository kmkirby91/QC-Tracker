# QC Form Date Selection Feature

## Overview
The QC form now includes intelligent date selection with visual indicators for data status and warnings for data replacement.

## Date Selection Features

### 1. Date Range
- **Past 30 days**: Available for historical QC entry
- **Today**: Highlighted as current date
- **Next 7 days**: Available for advance scheduling
- **Weekend filtering**: Daily QC automatically skips weekends

### 2. Visual Status Indicators

#### In Dropdown Options:
- **Green background**: Available dates (no existing data)
- **Gray background**: Dates with existing QC data
- **Yellow background**: Today's date
- **Purple background**: Future dates

#### Option Labels:
- **Today marker**: "(Today)" appended to current date
- **Future marker**: "(Future)" appended to upcoming dates  
- **Data indicator**: "✓" checkmark for dates with existing data
- **Day format**: "Mon, Jul 4" for easy identification

#### Legend Below Dropdown:
- Green square: "Available dates"
- Gray square: "Data exists"

### 3. Replace Data Warning

When selecting a date with existing data:
```
⚠️ Replace Existing Data
QC data already exists for this date. 
Submitting will replace the existing data.
```

## Date Selection UI

```
┌─ QC Date Selection ─────────────────────────────┐
│ Select Date for QC *                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ ▼ Fri, Jul 4 (Today)                       │ │
│ └─────────────────────────────────────────────┘ │
│ 🟢 Available dates  🔘 Data exists             │
│                                                 │
│ ⚠️  Replace Existing Data                      │
│     QC data already exists for this date.      │
│     Submitting will replace the existing data. │
└─────────────────────────────────────────────────┘
```

## Technical Implementation

### Frontend Logic
```javascript
const generateDateOptions = () => {
  // Generate 30 days past + 7 days future
  // Skip weekends for daily QC
  // Check against existing QC dates
  // Apply appropriate styling and labels
};

const handleDateChange = (date) => {
  setSelectedDate(date);
  const hasExistingData = existingQCDates.includes(date);
  setShowReplaceWarning(hasExistingData);
};
```

### Data Flow
1. **Form loads** → Fetch existing QC dates from history API
2. **User selects date** → Check if data exists, show warning if needed
3. **Form submits** → Use selected date in QC submission

### Backend Integration
- Uses existing `/qc/machines/:id/qc-history` endpoint
- Extracts dates from frequency-specific QC data
- No additional backend changes required

## Example Scenarios

### Scenario 1: Normal Entry (Today)
- User opens form, today's date pre-selected
- Today shows in yellow with "(Today)" label
- No warning, normal submission flow

### Scenario 2: Historical Entry (Available Date)
- User selects date from 3 days ago (green background)
- No existing data, no warning
- Clean submission for missing QC data

### Scenario 3: Data Replacement (Existing Date)
- User selects date with existing data (gray background, "✓" mark)
- Warning appears: "Replace Existing Data"
- User acknowledges and can proceed with replacement

### Scenario 4: Future Planning
- User selects next Monday (purple background, "(Future)")
- Allows advance QC scheduling
- System accepts future dates for planning

## Benefits

1. **Flexibility**: Can enter QC for any date, not just today
2. **Data integrity**: Clear warnings before overwriting existing data
3. **Visual clarity**: Immediate feedback on data status
4. **Workflow support**: Handles missed QC, corrections, and advance planning
5. **Error prevention**: Obvious indicators prevent accidental overwrites

## Use Cases

- **Missed QC**: Enter yesterday's QC that was forgotten
- **Corrections**: Replace incorrect QC data with corrected values
- **Advance planning**: Schedule QC for upcoming maintenance windows
- **Historical completion**: Fill gaps in QC records
- **Weekend makeup**: Enter Friday QC on Monday if needed

The date selection feature transforms the QC form from a today-only tool into a comprehensive QC management interface that supports real-world workflow needs.