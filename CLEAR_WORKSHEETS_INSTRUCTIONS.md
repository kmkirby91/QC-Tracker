# Clear All Worksheets Instructions

## Method 1: Using the Application UI (Recommended)

1. **Navigate to the Worksheets page** in the QC Tracker application
2. **Look for the "🗑️ Clear All Worksheets" button** at the bottom of the filters section
3. **Click the button** - it will show a confirmation dialog
4. **Confirm the deletion** - this will delete all worksheets but preserve templates

## Method 2: Using Browser Developer Console

If you prefer to use the browser console:

1. **Open the QC Tracker application** in your browser
2. **Open Developer Tools** (F12 or right-click → Inspect)
3. **Go to the Console tab**
4. **Run this command:**

```javascript
// Check current counts
console.log('Current worksheets:', JSON.parse(localStorage.getItem('qcWorksheets') || '[]').length);
console.log('Current templates:', JSON.parse(localStorage.getItem('qcModalityTemplates') || '[]').length);

// Clear all worksheets (keeps templates)
localStorage.setItem('qcWorksheets', JSON.stringify([]));

// Refresh the page to see changes
window.location.reload();

console.log('✅ All worksheets cleared. Templates preserved.');
```

## Method 3: Selective Clearing

If you want to be more selective, you can filter worksheets:

```javascript
// View all current worksheets
const worksheets = JSON.parse(localStorage.getItem('qcWorksheets') || '[]');
console.log('All worksheets:', worksheets);

// Example: Keep only worksheets for a specific machine
const keepOnlyMachine = 'MACHINE_ID_HERE';
const filteredWorksheets = worksheets.filter(w => 
  w.assignedMachines && w.assignedMachines.includes(keepOnlyMachine)
);

localStorage.setItem('qcWorksheets', JSON.stringify(filteredWorksheets));
window.location.reload();
```

## Verification

After clearing, you can verify the results:

```javascript
// Check what remains
console.log('Remaining worksheets:', JSON.parse(localStorage.getItem('qcWorksheets') || '[]').length);
console.log('Templates (should be unchanged):', JSON.parse(localStorage.getItem('qcModalityTemplates') || '[]').length);
```

## Important Notes

- ⚠️ **Worksheets cannot be recovered** once deleted
- ✅ **Templates are preserved** - they are stored separately
- 🔄 **Refresh the page** after running console commands to see changes
- 📝 **Backup recommendation**: Export important data before clearing

## Storage Keys Reference

- `qcWorksheets` - Contains all worksheet assignments to machines
- `qcModalityTemplates` - Contains all templates (preserved)
- `machineDicomConfigs` - Contains DICOM configurations (preserved)