const puppeteer = require('puppeteer');

async function testWebapp() {
  console.log('🚀 Starting webapp test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });
  
  // Listen for errors
  page.on('error', err => {
    console.log('❌ Page error:', err.message);
  });
  
  page.on('pageerror', err => {
    console.log('❌ Page error:', err.message);
  });
  
  try {
    console.log('📡 Navigating to http://192.168.1.182:3000...');
    
    // Navigate to the webapp
    await page.goto('http://192.168.1.182:3000', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    console.log('✅ Page loaded');
    
    // Wait a bit for React to load
    await page.waitForTimeout(3000);
    
    // Check if React app mounted
    const reactRoot = await page.$('#root');
    if (reactRoot) {
      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
          hasContent: root.children.length > 0,
          innerHTML: root.innerHTML.substring(0, 200) + '...',
          childCount: root.children.length
        };
      });
      
      console.log('📊 React root status:', rootContent);
    }
    
    // Check for any network errors
    const response = await page.goto('http://192.168.1.182:3000', { waitUntil: 'load' });
    console.log('📊 Response status:', response.status());
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'webapp-test.png' });
    console.log('📸 Screenshot saved as webapp-test.png');
    
    // Check if API is reachable from frontend
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('🔌 API test result:', apiTest);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

testWebapp().catch(console.error);