async function finalTest() {
  console.log('🎯 Final QC Tracker Test');
  console.log('='.repeat(50));
  
  // Test all key endpoints
  const tests = [
    { name: 'Frontend HTML', url: 'http://192.168.1.182:3000' },
    { name: 'API Health', url: 'http://192.168.1.182:3000/api/health' },
    { name: 'Machines API', url: 'http://192.168.1.182:3000/api/machines' },
    { name: 'QC History', url: 'http://192.168.1.182:3000/api/qc/machines/MRI-001/qc-history?type=MRI' },
    { name: 'Due Tasks', url: 'http://192.168.1.182:3000/api/qc/due-tasks' }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      const status = response.status === 200 ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${response.status}`);
      
      if (test.name === 'Machines API' && response.status === 200) {
        const data = await response.json();
        console.log(`   📊 Found ${data.length} machines`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n🌐 Access URLs:');
  console.log('   Main Dashboard: http://192.168.1.182:3000');
  console.log('   Due Today Page: http://192.168.1.182:3000/due-today');
  console.log('   Backend API:    http://192.168.1.182:5000');
  
  console.log('\n🎉 QC Tracker is ready for testing!');
}

finalTest().catch(console.error);