const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const dayOfWeek = today.getDay();

console.log('Current Date Info:');
console.log('- Today:', todayStr);
console.log('- Day of week:', dayOfWeek, '(0=Sun, 6=Sat)');
console.log('- Is weekend:', dayOfWeek === 0 || dayOfWeek === 6);

// Test QC history generation
const generateTestHistory = (machineId) => {
  const history = { daily: [] };
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const day = date.getDay();
    
    // Skip weekends
    if (day === 0 || day === 6) {
      console.log(`- Day ${i}: ${dateStr} (skipped - weekend)`);
      continue;
    }
    
    // Skip today for MRI-001
    if (i === 0 && machineId === 'MRI-001') {
      console.log(`- Day ${i}: ${dateStr} (skipped - simulating missing QC for ${machineId})`);
      continue;
    }
    
    // Skip yesterday for CT-002
    if (i === 1 && machineId === 'CT-002') {
      console.log(`- Day ${i}: ${dateStr} (skipped - simulating overdue QC for ${machineId})`);
      continue;
    }
    
    history.daily.push({ date: dateStr, completed: true });
    console.log(`- Day ${i}: ${dateStr} (completed)`);
  }
  
  return history;
};

console.log('\nTesting MRI-001 (should be missing today):');
generateTestHistory('MRI-001');

console.log('\nTesting CT-002 (should be missing yesterday):');
generateTestHistory('CT-002');