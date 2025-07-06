# DueTasksWidget Update Summary

## What Changed

The QC Tasks widget has been reorganized to split tasks into two main categories: **"Overdue"** and **"Due Today"** instead of organizing by QC frequency.

## New Organization

### Header Section
- **Badge Display**: Now shows two badges:
  - `X Overdue` (red badge) - All overdue tasks across all frequencies
  - `X Due Today` (orange badge) - All tasks due in current periods

### Expanded Content
The widget now has two main sections when expanded:

#### 1. Overdue Section (Red border)
- **Overdue Daily QC**: Daily QC that should have been completed on previous working days
- **Overdue Monthly QC**: Monthly QC from previous months not completed
- **Overdue Quarterly QC**: Quarterly QC from previous quarters not completed  
- **Overdue Annual QC**: Annual QC from previous years not completed

#### 2. Due Today Section (Orange border)
- **Daily QC**: Daily QC due today
- **Monthly QC**: Monthly QC due this month
- **Quarterly QC**: Quarterly QC due this quarter
- **Annual QC**: Annual QC due this year

## Current Status

With sample data (July 4, 2025):
- **0 Overdue tasks**: No machines currently have overdue QC
- **11 Due Today tasks**: 
  - 1 machine with daily QC due today (MRI-001)
  - 5 machines with quarterly QC due this quarter
  - 5 machines with annual QC due this year

## Visual Improvements

- Color-coded sections with left border indicators
- Hierarchical display: Main category → QC frequency → Machine list
- Consistent styling with appropriate urgency colors (red for overdue, orange for due today)
- Maintains all existing functionality (machine links, task details, "View All" button)

## Benefits

1. **Clearer Priority**: Users immediately see what's overdue vs. what's due soon
2. **Better Organization**: Tasks grouped by urgency rather than frequency
3. **Reduced Cognitive Load**: Two clear categories instead of four frequency categories
4. **Maintained Detail**: Still shows specific QC type (daily/monthly/quarterly/annual) within each section

The widget now provides a much clearer view of QC task status, making it easier for users to prioritize their work based on urgency.