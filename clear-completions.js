// Clear QC completions from localStorage
// Run this in browser console or as a temporary script

console.log('🗑️ Clearing QC completions...');

// Clear localStorage QC data
localStorage.removeItem('qcCompletions');
console.log('✅ localStorage qcCompletions cleared');

// Check what remains
const remainingKeys = Object.keys(localStorage).filter(key => key.toLowerCase().includes('qc'));
if (remainingKeys.length > 0) {
    console.log('📋 Remaining QC-related localStorage keys:', remainingKeys);
} else {
    console.log('✅ No QC-related data found in localStorage');
}

console.log('🔄 Refresh the page to see cleared data');