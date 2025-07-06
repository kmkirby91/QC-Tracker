# Perform QC Buttons Fix

## Issue
Only the daily QC section had "Perform QC" buttons, while monthly, quarterly, and annual QC sections were missing these functional buttons.

## Solution
Added "Perform QC" buttons to all QC frequency sections in the DueTasksWidget component.

## Changes Made

### 1. Monthly QC Section
- Added "Perform QC" button with yellow styling
- Route: `/qc/perform/:machineId/monthly`
- Button class: `bg-yellow-600 hover:bg-yellow-700`

### 2. Quarterly QC Section  
- Added "Perform QC" button with blue styling
- Route: `/qc/perform/:machineId/quarterly`
- Button class: `bg-blue-600 hover:bg-blue-700`

### 3. Annual QC Section
- Added "Perform QC" button with purple styling
- Route: `/qc/perform/:machineId/annual`
- Button class: `bg-purple-600 hover:bg-purple-700`

## Updated Widget Layout

Each QC frequency section now follows the same pattern:

```jsx
<div className="flex items-center space-x-2">
  <span className="text-[color]-600 text-xs">Due [Period]</span>
  <Link
    to={`/qc/perform/${task.machineId}/[frequency]`}
    className="bg-[color]-600 text-white px-3 py-1 rounded text-xs hover:bg-[color]-700 transition-colors"
  >
    Perform QC
  </Link>
</div>
```

## Color-Coded Buttons

- **Daily QC**: Blue buttons (`bg-blue-600`)
- **Monthly QC**: Yellow buttons (`bg-yellow-600`) 
- **Quarterly QC**: Blue buttons (`bg-blue-600`)
- **Annual QC**: Purple buttons (`bg-purple-600`)

## Current Status (July 4, 2025)

The widget now displays "Perform QC" buttons for:

### Daily QC (1 machine)
- **MRI-001**: Daily QC due today → Blue "Perform QC" button

### Quarterly QC (5 machines)  
- **All machines**: Q3 2025 QC due → Blue "Perform QC" buttons
- Routes to `/qc/perform/[machineId]/quarterly`

### Annual QC (5 machines)
- **All machines**: 2025 annual QC due → Purple "Perform QC" buttons  
- Routes to `/qc/perform/[machineId]/annual`

## Navigation Flow

All buttons now work consistently:

1. **Click "Perform QC"** → Navigate to QC form
2. **Form loads** → Shows appropriate test templates for frequency
3. **Complete form** → Submit QC data
4. **Success** → Return to machine detail page

## Example Widget Display

```
┌─ Due Today (11) ────────────────────────────────┐
│                                                 │
│ Daily QC                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Siemens MAGNETOM Vida (MRI)    [Perform QC]│ │  ← Blue button
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Quarterly QC                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ Siemens MAGNETOM Vida (MRI)    [Perform QC]│ │  ← Blue button
│ │ GE Revolution CT (CT)          [Perform QC]│ │  ← Blue button
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Annual QC                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Siemens MAGNETOM Vida (MRI)    [Perform QC]│ │  ← Purple button
│ │ GE Revolution CT (CT)          [Perform QC]│ │  ← Purple button
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Testing

All "Perform QC" buttons now:
- ✅ Navigate to correct QC form routes
- ✅ Load appropriate test templates  
- ✅ Display proper QC frequency in form header
- ✅ Function consistently across all sections

The fix ensures complete functionality across all QC frequencies, providing users with direct access to perform any type of QC that's due.