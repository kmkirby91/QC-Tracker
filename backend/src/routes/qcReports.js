const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();

// Generate PDF report for a specific machine
router.post('/generate-report/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;
    const {
      startDate,
      endDate,
      includeDaily,
      includeMonthly,
      includeQuarterly,
      includeAnnual,
      includeFailedOnly,
      includeComments,
      includeCharts,
      machineType,
      machineName
    } = req.body;

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="QC-Report-${machineId}-${startDate}-to-${endDate}.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('Quality Control Report', { align: 'center' });
    doc.moveDown(0.5);
    
    // Machine info
    doc.fontSize(14).text(`Machine: ${machineName}`, { align: 'left' });
    doc.text(`Machine ID: ${machineId}`);
    doc.text(`Type: ${machineType}`);
    doc.text(`Report Period: ${startDate} to ${endDate}`);
    doc.moveDown(0.5);
    
    // QC Types included
    const includedTypes = [];
    if (includeDaily) includedTypes.push('Daily');
    if (includeMonthly) includedTypes.push('Monthly');
    if (includeQuarterly) includedTypes.push('Quarterly');
    if (includeAnnual) includedTypes.push('Annual');
    
    doc.text(`QC Types: ${includedTypes.join(', ')}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown(1);

    // Add horizontal line
    doc.strokeColor('#ccc').lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    doc.moveDown(0.5);

    // Mock data for demonstration - in production, fetch from database
    const qcData = generateMockQCData(machineId, machineType, startDate, endDate, {
      includeDaily,
      includeMonthly,
      includeQuarterly,
      includeAnnual,
      includeFailedOnly
    });

    // Generate report sections
    if (includeDaily && qcData.daily.length > 0) {
      addQCSection(doc, 'Daily QC Results', qcData.daily, includeComments, includeFailedOnly);
    }
    
    if (includeMonthly && qcData.monthly.length > 0) {
      addQCSection(doc, 'Monthly QC Results', qcData.monthly, includeComments, includeFailedOnly);
    }
    
    if (includeQuarterly && qcData.quarterly.length > 0) {
      addQCSection(doc, 'Quarterly QC Results', qcData.quarterly, includeComments, includeFailedOnly);
    }
    
    if (includeAnnual && qcData.annual.length > 0) {
      addQCSection(doc, 'Annual QC Results', qcData.annual, includeComments, includeFailedOnly);
    }

    // Add summary section
    addSummarySection(doc, qcData, includedTypes);
    
    // Add footer
    doc.fontSize(8).text(
      'This report was generated automatically by the QC Tracker system.',
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

function generateMockQCData(machineId, machineType, startDate, endDate, options) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data = { daily: [], monthly: [], quarterly: [], annual: [] };

  // Generate daily QC data
  if (options.includeDaily) {
    const current = new Date(start);
    while (current <= end) {
      // Skip weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        const qc = generateDailyQC(machineId, machineType, current, options.includeFailedOnly);
        if (qc) data.daily.push(qc);
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // Generate monthly QC data
  if (options.includeMonthly) {
    const monthlyQC = generateMonthlyQC(machineId, machineType, start, options.includeFailedOnly);
    if (monthlyQC) data.monthly.push(monthlyQC);
  }

  // Generate quarterly QC data
  if (options.includeQuarterly) {
    const quarterlyQC = generateQuarterlyQC(machineId, machineType, start, options.includeFailedOnly);
    if (quarterlyQC) data.quarterly.push(quarterlyQC);
  }

  // Generate annual QC data
  if (options.includeAnnual) {
    const annualQC = generateAnnualQC(machineId, machineType, start, options.includeFailedOnly);
    if (annualQC) data.annual.push(annualQC);
  }

  return data;
}

function generateDailyQC(machineId, machineType, date, failedOnly) {
  // Skip some dates to simulate realistic data
  if (Math.random() < 0.3) return null;

  const tests = getMockTests(machineType, 'daily');
  const qcTests = tests.map(test => {
    const result = Math.random() < 0.9 ? 'pass' : 'fail'; // 90% pass rate
    if (failedOnly && result === 'pass') return null;
    
    return {
      testName: test.testName,
      value: generateMockValue(test),
      result,
      notes: result === 'fail' ? 'Requires attention' : 'Within tolerance'
    };
  }).filter(Boolean);

  if (failedOnly && qcTests.length === 0) return null;

  return {
    date: date.toISOString().split('T')[0],
    performedBy: ['John Smith', 'Sarah Johnson', 'Mike Davis'][Math.floor(Math.random() * 3)],
    overallResult: qcTests.some(t => t.result === 'fail') ? 'fail' : 'pass',
    tests: qcTests,
    comments: qcTests.some(t => t.result === 'fail') ? 'Some tests failed - see individual test notes' : 'All tests within normal limits'
  };
}

function generateMonthlyQC(machineId, machineType, date, failedOnly) {
  const tests = getMockTests(machineType, 'monthly');
  const qcTests = tests.map(test => {
    const result = Math.random() < 0.95 ? 'pass' : 'fail';
    if (failedOnly && result === 'pass') return null;
    
    return {
      testName: test.testName,
      value: generateMockValue(test),
      result,
      notes: result === 'fail' ? 'Service required' : 'Acceptable'
    };
  }).filter(Boolean);

  if (failedOnly && qcTests.length === 0) return null;

  return {
    date: date.toISOString().split('T')[0],
    performedBy: 'Senior Technician',
    overallResult: qcTests.some(t => t.result === 'fail') ? 'fail' : 'pass',
    tests: qcTests,
    comments: 'Monthly QC completed as scheduled'
  };
}

function generateQuarterlyQC(machineId, machineType, date, failedOnly) {
  const tests = getMockTests(machineType, 'quarterly');
  const qcTests = tests.map(test => {
    const result = Math.random() < 0.98 ? 'pass' : 'fail';
    if (failedOnly && result === 'pass') return null;
    
    return {
      testName: test.testName,
      value: generateMockValue(test),
      result,
      notes: 'Quarterly assessment completed'
    };
  }).filter(Boolean);

  if (failedOnly && qcTests.length === 0) return null;

  return {
    date: date.toISOString().split('T')[0],
    performedBy: 'QC Specialist',
    overallResult: qcTests.some(t => t.result === 'fail') ? 'fail' : 'pass',
    tests: qcTests,
    comments: 'Comprehensive quarterly evaluation'
  };
}

function generateAnnualQC(machineId, machineType, date, failedOnly) {
  const tests = getMockTests(machineType, 'annual');
  const qcTests = tests.map(test => {
    const result = Math.random() < 0.99 ? 'pass' : 'fail';
    if (failedOnly && result === 'pass') return null;
    
    return {
      testName: test.testName,
      value: generateMockValue(test),
      result,
      notes: 'Annual certification test'
    };
  }).filter(Boolean);

  if (failedOnly && qcTests.length === 0) return null;

  return {
    date: date.toISOString().split('T')[0],
    performedBy: 'Medical Physicist',
    overallResult: qcTests.some(t => t.result === 'fail') ? 'fail' : 'pass',
    tests: qcTests,
    comments: 'Annual quality assurance review completed'
  };
}

function getMockTests(machineType, frequency) {
  if (machineType === 'MRI' && frequency === 'daily') {
    return [
      { testName: 'Table Positioning', tolerance: '±5mm' },
      { testName: 'Center Frequency', tolerance: '±3ppm' },
      { testName: 'Transmitter Gain', tolerance: '±5%' }
    ];
  }
  // Add other machine types and frequencies as needed
  return [
    { testName: 'System Check', tolerance: 'Pass/Fail' },
    { testName: 'Calibration Verification', tolerance: '±2%' }
  ];
}

function generateMockValue(test) {
  const testName = test.testName;
  if (testName.includes('Positioning')) {
    return `${(Math.random() * 6 - 3).toFixed(1)} mm`;
  } else if (testName.includes('Frequency')) {
    return `${(63.86 + Math.random() * 0.2 - 0.1).toFixed(3)} MHz`;
  } else if (testName.includes('Gain')) {
    return `${(Math.random() * 8 - 4).toFixed(1)}%`;
  }
  return 'Pass';
}

function addQCSection(doc, title, qcData, includeComments, failedOnly) {
  doc.fontSize(16).text(title, { underline: true });
  doc.moveDown(0.5);

  qcData.forEach(qc => {
    // Date and technician
    doc.fontSize(12).text(`Date: ${qc.date} | Performed by: ${qc.performedBy}`, { continued: true });
    doc.text(` | Overall: ${qc.overallResult.toUpperCase()}`, { 
      color: qc.overallResult === 'pass' ? '#166534' : '#DC2626' 
    });
    doc.fillColor('black');
    
    // Tests table header
    doc.moveDown(0.3);
    doc.fontSize(10);
    const startY = doc.y;
    doc.text('Test', 70, startY, { width: 150 });
    doc.text('Value', 220, startY, { width: 80 });
    doc.text('Result', 300, startY, { width: 60 });
    doc.text('Notes', 360, startY, { width: 140 });
    
    // Underline headers
    doc.strokeColor('#ccc').lineWidth(0.5)
       .moveTo(70, doc.y + 2)
       .lineTo(500, doc.y + 2)
       .stroke();
    
    doc.moveDown(0.3);
    
    // Test results
    qc.tests.forEach(test => {
      const currentY = doc.y;
      doc.text(test.testName, 70, currentY, { width: 150 });
      doc.text(test.value, 220, currentY, { width: 80 });
      doc.fillColor(test.result === 'pass' ? '#166534' : '#DC2626');
      doc.text(test.result.toUpperCase(), 300, currentY, { width: 60 });
      doc.fillColor('black');
      doc.text(test.notes || '', 360, currentY, { width: 140 });
      doc.moveDown(0.2);
    });
    
    // Comments
    if (includeComments && qc.comments) {
      doc.moveDown(0.2);
      doc.fontSize(9).text(`Comments: ${qc.comments}`, { color: '#6B7280' });
    }
    
    doc.moveDown(0.5);
    
    // Add page break if needed
    if (doc.y > 700) {
      doc.addPage();
    }
  });
  
  doc.moveDown(0.5);
}

function addSummarySection(doc, qcData, includedTypes) {
  // Add page break for summary
  if (doc.y > 600) {
    doc.addPage();
  }
  
  doc.fontSize(16).text('Summary', { underline: true });
  doc.moveDown(0.5);
  
  const totalTests = qcData.daily.length + qcData.monthly.length + qcData.quarterly.length + qcData.annual.length;
  const failedTests = [
    ...qcData.daily,
    ...qcData.monthly,
    ...qcData.quarterly,
    ...qcData.annual
  ].filter(qc => qc.overallResult === 'fail').length;
  
  doc.fontSize(12);
  doc.text(`Total QC Sessions: ${totalTests}`);
  doc.text(`Passed Sessions: ${totalTests - failedTests}`);
  doc.text(`Failed Sessions: ${failedTests}`);
  doc.text(`Success Rate: ${totalTests > 0 ? ((totalTests - failedTests) / totalTests * 100).toFixed(1) : 0}%`);
  
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Report includes: ${includedTypes.join(', ')} QC data`);
}

module.exports = router;