const http = require('http');
const https = require('https');

async function testWebapp() {
  console.log('🔍 Debugging QC Tracker webapp...');
  
  // Test 1: Check if frontend is serving files
  console.log('\n1️⃣ Testing frontend server...');
  try {
    const response = await fetch('http://192.168.1.182:3000');
    console.log('✅ Frontend responds with status:', response.status);
    
    const html = await response.text();
    console.log('📄 HTML length:', html.length);
    console.log('🔍 Contains root div:', html.includes('<div id="root">'));
    console.log('🔍 Contains main.jsx script:', html.includes('/src/main.jsx'));
    
  } catch (error) {
    console.log('❌ Frontend error:', error.message);
  }
  
  // Test 2: Check if main.jsx is accessible
  console.log('\n2️⃣ Testing main.jsx file...');
  try {
    const response = await fetch('http://192.168.1.182:3000/src/main.jsx');
    console.log('✅ main.jsx responds with status:', response.status);
    
    if (response.status === 200) {
      const content = await response.text();
      console.log('📄 main.jsx content preview:', content.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ main.jsx error:', error.message);
  }
  
  // Test 3: Check if App.jsx is accessible
  console.log('\n3️⃣ Testing App.jsx file...');
  try {
    const response = await fetch('http://192.168.1.182:3000/src/App.jsx');
    console.log('✅ App.jsx responds with status:', response.status);
    
    if (response.status === 200) {
      const content = await response.text();
      console.log('📄 App.jsx has Link import:', content.includes('import { Link }'));
      console.log('📄 App.jsx has router import:', content.includes('BrowserRouter'));
    }
  } catch (error) {
    console.log('❌ App.jsx error:', error.message);
  }
  
  // Test 4: Check API proxy
  console.log('\n4️⃣ Testing API proxy...');
  try {
    const response = await fetch('http://192.168.1.182:3000/api/health');
    console.log('✅ API proxy responds with status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('📊 API response:', data);
    }
  } catch (error) {
    console.log('❌ API proxy error:', error.message);
  }
  
  // Test 5: Direct backend test
  console.log('\n5️⃣ Testing direct backend...');
  try {
    const response = await fetch('http://192.168.1.182:5000/api/health');
    console.log('✅ Backend responds with status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('📊 Backend response:', data);
    }
  } catch (error) {
    console.log('❌ Backend error:', error.message);
  }
  
  // Test 6: Check for JavaScript modules
  console.log('\n6️⃣ Testing JavaScript modules...');
  try {
    const response = await fetch('http://192.168.1.182:3000/@vite/client');
    console.log('✅ Vite client responds with status:', response.status);
  } catch (error) {
    console.log('❌ Vite client error:', error.message);
  }
  
  console.log('\n🏁 Debug completed');
}

testWebapp().catch(console.error);