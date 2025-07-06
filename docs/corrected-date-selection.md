# Corrected QC Date Selection

## Updated Behavior

The QC form date selection has been corrected to follow proper workflow logic:

### Date Range
- **Past 30 days through today only** (no future dates)
- **Weekends automatically excluded** for daily QC
- **Most recent dates shown first** in dropdown

### Color Coding
- **🟢 Green background**: Available dates (no existing QC data)
- **🔘 Grey background**: Dates with existing QC data
- **Green text**: Available dates for easy identification
- **Grey text**: Dates with existing data (muted appearance)

### Visual Indicators
- **Today marker**: "(Today)" clearly identifies current date
- **Data indicator**: "✓" checkmark shows completed QC dates
- **Legend**: Green square = Available, Grey square = Data exists

## Date Selection Logic

```javascript
// Generate past 30 days up to today (i = -30 to 0)
for (let i = -30; i <= 0; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() + i);
  
  // Skip weekends for daily QC
  if (frequency === 'daily' && (date.getDay() === 0 || date.getDay() === 6)) {
    continue;
  }
  
  // Style based on data existence
  backgroundColor: hasData ? '#f3f4f6' : '#f0fdf4'  // Grey : Green
  color: hasData ? '#6b7280' : '#166534'            // Grey : Green
}
```

## Example Dropdown View

```
┌─ Select Date for QC ────────────────────────────┐
│ ▼ Fri, Jul 4 (Today)                 🟢        │
├─────────────────────────────────────────────────┤
│   Thu, Jul 3 ✓                       🔘        │ 
│   Wed, Jul 2 ✓                       🔘        │
│   Tue, Jul 1 ✓                       🔘        │
│   Fri, Jun 28                        🟢        │
│   Thu, Jun 27                        🟢        │
│   Wed, Jun 26                        🟢        │
│   ...                                           │
└─────────────────────────────────────────────────┘
🟢 Available dates  🔘 Data exists
```

## Workflow Examples

### Normal Daily QC Entry
1. User opens form → Today's date selected (green)
2. Form ready for normal QC entry
3. Submit creates new QC record for today

### Historical QC Entry  
1. User selects previous available date (green background)
2. No warning, clean entry for missing QC
3. Submit fills gap in QC records

### Data Correction
1. User selects date with existing data (grey background, "✓")
2. Warning appears: "QC data already exists for this date"
3. User can proceed to replace incorrect data

## Benefits of Corrected Logic

1. **No future confusion**: Eliminates scheduling complexity
2. **Clear availability**: Green immediately shows open dates  
3. **Data protection**: Grey + warning prevents accidental overwrites
4. **Realistic workflow**: Matches how QC is actually performed
5. **Simple mental model**: Past/today only, green = available, grey = taken

## Removed Elements

- ❌ Future dates (purple background)
- ❌ "(Future)" labels  
- ❌ Advance scheduling capability
- ❌ Complex date planning logic

## Current Status (July 4, 2025)

Looking at MRI-001 daily QC:
- **Today (Jul 4)**: Green - available for entry
- **Jul 3, 2, 1**: Grey with "✓" - existing data 
- **Jun 28, 27, 26**: Green - available (missed dates)
- **Weekends**: Automatically excluded
- **Jul 5+**: Not shown (no future dates)

The corrected system now provides a straightforward, realistic interface for QC data entry that matches actual laboratory workflows.