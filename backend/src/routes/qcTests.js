const express = require('express');
const router = express.Router();
const { calculateNextDueDate, getMissedQCDates, getQCPriority, generateSampleWorksheetAssignments, generateQCDueDates, getWorksheetQCStatus, getSystemOverdueStatus } = require('../utils/qcScheduling');
const { 
  addQCCompletion, 
  getAllQCCompletions, 
  getQCCompletionsByMachine, 
  getQCCompletionsByWorksheet,
  getCompletionDates 
} = require('../utils/qcStorage');

// QC test templates by machine type
const qcTestTemplates = {
  MRI: {
    weekly: [
      'Table Positioning',
      'Setup and Scanning',
      'Center (Central) Frequency',
      'Transmitter Gain or Attenuation',
      'Geometric Accuracy',
      'High Contrast (Spatial) Resolution',
      'Low Contrast Resolution (Detectability)',
      'Artifact Analysis',
      'Film (Hardcopy Image) QC',
      'Visual Checklist'
    ],
    monthly: [
      'Slice Position Accuracy',
      'Slice Thickness Accuracy',
      'Field Homogeneity',
      'Gradient Calibration',
      'Transmit Gain Calibration',
      'Magnetic Field Drift',
      'Helium Level Check',
      'Cold Head Temperature'
    ],
    annual: [
      'Full System Calibration',
      'Magnet Shimming Verification',
      'Safety System Certification',
      'Electrical Safety Testing',
      'Fire Safety System Check'
    ]
  },
  CT: {
    daily: [
      'Warm-up Procedure',
      'CT Number Accuracy (Water)',
      'Image Noise Assessment',
      'Artifact Check',
      'Table Movement Accuracy',
      'Laser Alignment'
    ],
    monthly: [
      'CT Number Linearity',
      'Spatial Resolution (MTF)',
      'Low Contrast Detectability',
      'Slice Thickness Verification',
      'Patient Dose Verification',
      'kVp Accuracy',
      'mA Linearity',
      'Timer Accuracy'
    ],
    annual: [
      'Full Dosimetry Calibration',
      'X-ray Tube Performance Assessment',
      'Radiation Safety Survey',
      'Regulatory Compliance Review',
      'Preventive Maintenance Audit'
    ]
  },
  'PET': {
    daily: [
      'Daily Normalization',
      'Coincidence Timing Resolution',
      'Energy Resolution Check',
      'Detector Efficiency',
      'CT Warm-up',
      'PET/CT Alignment Check'
    ],
    quarterly: [
      'Well Counter Cross-Calibration',
      'Partial Volume Correction QC',
      'Advanced Reconstruction QC',
      'Radiation Safety Assessment',
      'Sensitivity Measurement',
      'Spatial Resolution Test',
      'Count Rate Performance',
      'Image Quality Phantom'
    ],
    annual: [
      'Full System Performance Evaluation',
      'Detector Block Replacement Assessment',
      'Radiation Safety Certification',
      'Nuclear Medicine License Review',
      'Comprehensive System Validation'
    ]
  },
  'Mammography': {
    daily: [
      'Phantom Image Quality Assessment',
      'Automatic Exposure Control (AEC) Function',
      'Breast Thickness Compensation',
      'kVp Accuracy and Reproducibility',
      'Beam Quality (Half Value Layer)',
      'Compression Force Check'
    ],
    weekly: [
      'Screen Contact Test',
      'Phantom Image Quality (Weekly)',
      'Automatic Exposure Control Consistency',
      'Compression Plate Alignment',
      'Light Field Congruence',
      'Magnification Mode QC'
    ],
    monthly: [
      'Phantom Image Quality (Monthly)',
      'Automatic Exposure Control Performance',
      'kVp Accuracy and Reproducibility',
      'Beam Quality Assessment',
      'Compression Force Measurement',
      'Spatial Resolution Test',
      'Contrast Sensitivity Evaluation',
      'Artifact Analysis'
    ],
    quarterly: [
      'Repeat/Reject Analysis',
      'Compression Force Calibration',
      'Viewbox and Viewing Conditions',
      'Processor QC (if applicable)',
      'Darkroom Fog Test',
      'Screen-Film Contact Assessment'
    ],
    annual: [
      'Full System Performance Evaluation',
      'Mammography Medical Physicist Survey',
      'Radiation Safety Survey',
      'Quality Control Program Review',
      'Staff Training Assessment',
      'ACR Phantom Evaluation',
      'Patient Dose Assessment',
      'Equipment Calibration Verification'
    ]
  }
};

// Generate mock QC history
const generateQCHistory = (machineType, machineId) => {
  const tests = qcTestTemplates[machineType] || qcTestTemplates['CT'] || {};
  
  // Ensure all test types exist as empty arrays if not defined
  if (!tests.daily) tests.daily = [];
  if (!tests.weekly) tests.weekly = [];
  if (!tests.monthly) tests.monthly = [];
  if (!tests.quarterly) tests.quarterly = [];
  if (!tests.annual) tests.annual = [];
  const history = {
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    annual: []
  };

  // Add completed QCs from persistent storage (real submissions)
  const realCompletions = getQCCompletionsByMachine(machineId);
  realCompletions.forEach(qc => {
    if (history[qc.frequency]) {
      // Add the real completed QC to history
      history[qc.frequency].push({
        id: qc.id,
        date: qc.date,
        overallResult: qc.overallResult,
        completedAt: qc.completedAt,
        performedBy: qc.performedBy,
        comments: qc.comments,
        tests: qc.tests,
        worksheetId: qc.worksheetId,
        worksheetTitle: qc.worksheetTitle,
        isRealSubmission: true // Mark as real submission vs mock
      });
    }
  });
  
  // Also add from in-memory storage for backward compatibility with existing mock data
  if (global.completedQCs) {
    const machineCompletedQCs = global.completedQCs.filter(qc => qc.machineId === machineId);
    
    machineCompletedQCs.forEach(qc => {
      if (history[qc.frequency]) {
        // Check if this completion is already added from persistent storage
        const existingCompletion = history[qc.frequency].find(existing => 
          existing.id === qc.id || 
          (existing.date === qc.date && existing.frequency === qc.frequency && existing.isRealSubmission)
        );
        
        if (!existingCompletion) {
          // Add the real completed QC to history
          history[qc.frequency].push({
            id: qc.id,
            date: qc.date,
            overallResult: qc.overallResult,
            completedAt: qc.completedAt,
            performedBy: qc.performedBy,
            comments: qc.comments,
            tests: qc.tests,
            worksheetId: qc.worksheetId,
            worksheetTitle: qc.worksheetTitle,
            isRealSubmission: true // Mark as real submission vs mock
          });
        }
      }
    });
  }

  // IMPORTANT: Only generate history for machines that actually have worksheets assigned
  // Since we no longer use sample assignments, this will return false by default
  const hasWorksheetAssigned = (machine, frequency) => {
    // Check for real worksheet assignments from localStorage/database
    // For now, return false to prevent generating fake QC history
    return false;
  };

  // Generate daily QC for last 30 days (only if machine has daily tests AND worksheet assigned)
  if (tests.daily && tests.daily.length > 0 && hasWorksheetAssigned(machineId, 'daily')) {
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends for daily QC
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Skip if real QC already exists for this date
      if (history.daily.some(qc => qc.date === dateStr && qc.isRealSubmission)) continue;
      
      // Skip today's QC for MRI-ESS-001 to simulate missing daily QC
      if (i === 0 && machineId === 'MRI-ESS-001') continue;
      
      // Skip today's QC for CT-ESS-001 to simulate missing daily QC
      if (i === 0 && machineId === 'CT-ESS-001') continue;
      
      // Skip yesterday's QC for CT-GON-001 to simulate overdue daily QC
      if (i === 1 && machineId === 'CT-GON-001') continue;
      
      // Skip yesterday's QC for PET-WOM-001 to simulate overdue daily QC
      if (i === 1 && machineId === 'PET-WOM-001') continue;
      
      // Skip June 28th QC for MRI-ESS-001 to simulate a missed QC date in the past
      if (i === 4 && machineId === 'MRI-ESS-001') continue;
      
      // Select a single technician for this day's QC
      const technicians = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams'];
      const todaysTechnician = technicians[Math.floor(Math.random() * technicians.length)];
      
      const dailyTests = tests.daily.map(test => {
      const value = generateTestValue(test);
      let result = 'pass';
      let notes = '';
      
      // Determine pass/fail based on specific criteria
      if (test === 'Table Positioning') {
        const deviation = parseFloat(value);
        if (Math.abs(deviation) > 5) {
          result = 'fail';
          notes = 'Exceeds ±5 mm tolerance';
        }
      } else if (test === 'Setup and Scanning') {
        if (value !== 'Successful') {
          result = 'fail';
          notes = value;
        }
      } else if (test === 'Center (Central) Frequency') {
        const freq = parseFloat(value);
        const expectedFreq = 63.86; // MHz at 1.5T
        const ppmDrift = Math.abs((freq - expectedFreq) / expectedFreq * 1e6);
        if (ppmDrift > 3) {
          result = 'fail';
          notes = `Drift of ${ppmDrift.toFixed(1)} ppm exceeds ±3 ppm limit`;
        }
      } else if (test === 'Transmitter Gain or Attenuation') {
        const change = parseFloat(value);
        if (Math.abs(change) > 5) {
          result = 'fail';
          notes = 'Exceeds ±5% tolerance';
        }
      } else if (test === 'Geometric Accuracy') {
        const error = parseFloat(value);
        if (Math.abs(error) > 2) {
          result = 'fail';
          notes = 'Exceeds ±2 mm tolerance';
        }
      } else if (test === 'Low Contrast Resolution (Detectability)') {
        const objects = parseInt(value);
        if (objects < 37) {
          result = 'fail';
          notes = 'Less than 37 objects visible';
        }
      } else if (test === 'Visual Checklist' && value !== 'All items operational') {
        result = 'fail';
        notes = value;
      }
      
      // Random occasional failures for other tests
      if (result === 'pass' && Math.random() > 0.97) {
        result = 'fail';
        notes = 'Performance degradation detected';
      }
      
      // Add tolerance/criteria info
      let tolerance = '';
      if (test === 'Table Positioning') tolerance = '±5 mm';
      else if (test === 'Center (Central) Frequency') tolerance = '±3 ppm';
      else if (test === 'Transmitter Gain or Attenuation') tolerance = '±5%';
      else if (test === 'Geometric Accuracy') tolerance = '±2 mm';
      else if (test === 'Low Contrast Resolution (Detectability)') tolerance = '≥37 objects';
      
      return {
        testName: test,
        result: result,
        value: value,
        tolerance: tolerance,
        notes: notes,
        performedBy: todaysTechnician
      };
    });

    // Generate comments based on test results
    const failedTests = dailyTests.filter(t => t.result === 'fail');
    let comments = '';
    
    if (failedTests.length > 0) {
      comments = `Failed tests: ${failedTests.map(t => t.testName).join(', ')}. `;
      if (failedTests.some(t => t.testName === 'Center (Central) Frequency')) {
        comments += 'Service engineer notified about frequency drift. ';
      }
      if (failedTests.some(t => t.testName === 'Geometric Accuracy')) {
        comments += 'Gradient calibration scheduled. ';
      }
    } else {
      const randomComments = [
        'All tests within normal limits.',
        'System performing well.',
        'No issues identified during QC.',
        'Routine QC completed successfully.',
        'All parameters within tolerance.'
      ];
      comments = randomComments[Math.floor(Math.random() * randomComments.length)];
    }
    
    // Add occasional general comments
    if (Math.random() > 0.8) {
      comments += ' Note: ' + [
        'Slight temperature variation in scan room.',
        'New phantom used for testing.',
        'Helium level at 85%.',
        'Monthly PM scheduled for next week.',
        'Coil cables inspected - no damage.'
      ][Math.floor(Math.random() * 5)];
    }
    
    history.daily.push({
      date: dateStr,
      overallResult: dailyTests.some(t => t.result === 'fail') ? 'fail' : 'pass',
      tests: dailyTests,
      performedBy: todaysTechnician,
      comments: comments,
      completedAt: new Date(date.setHours(7 + Math.random() * 2)).toISOString()
    });
    }
  }

  // Generate weekly QC for last 12 weeks (only if worksheet assigned)
  if (tests.weekly && hasWorksheetAssigned(machineId, 'weekly')) {
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Go back by weeks
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip if real QC already exists for this date
      if (history.weekly.some(qc => qc.date === dateStr && qc.isRealSubmission)) continue;
      
      // Select a single technician for weekly QC
      const weeklyTechnician = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams'][Math.floor(Math.random() * 4)];
      
      const weeklyTests = tests.weekly.map(test => ({
        testName: test,
        result: Math.random() > 0.95 ? 'fail' : Math.random() > 0.9 ? 'conditional' : 'pass',
        value: generateTestValue(test),
        tolerance: '±5%',
        notes: Math.random() > 0.8 ? 'Within tolerance' : '',
        performedBy: weeklyTechnician
      }));

      const weeklyComments = 'Weekly QC completed successfully. All parameters within tolerance.';
      
      history.weekly.push({
        date: dateStr,
        overallResult: weeklyTests.some(t => t.result === 'fail') ? 'fail' : 
                       weeklyTests.some(t => t.result === 'conditional') ? 'conditional' : 'pass',
        tests: weeklyTests,
        performedBy: weeklyTechnician,
        comments: weeklyComments,
        completedAt: new Date(date.setHours(8 + Math.random() * 2)).toISOString()
      });
    }
  }

  // Generate monthly QC for last 12 months (only if machine has monthly tests AND worksheet assigned)
  if (tests.monthly && tests.monthly.length > 0 && hasWorksheetAssigned(machineId, 'monthly')) {
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip if real QC already exists for this date
      if (history.monthly.some(qc => qc.date === dateStr && qc.isRealSubmission)) continue;
      
      // Skip last month's QC for PET-WOM-001 to simulate overdue monthly QC
      if (i === 1 && machineId === 'PET-WOM-001') continue;
      
      // Select a single QC specialist for monthly QC
      const monthlyTechnician = ['Tom Brown', 'Alice Green', 'Dr. Patricia Lee'][Math.floor(Math.random() * 3)];
      
      const monthlyTests = tests.monthly.map(test => ({
      testName: test,
      result: Math.random() > 0.98 ? 'fail' : Math.random() > 0.9 ? 'conditional' : 'pass',
      value: generateTestValue(test),
      tolerance: '±5%',
      notes: Math.random() > 0.8 ? 'Within tolerance' : '',
      performedBy: monthlyTechnician
    }));

    // Generate monthly comments
    const monthlyFailedTests = monthlyTests.filter(t => t.result === 'fail');
    const conditionalTests = monthlyTests.filter(t => t.result === 'conditional');
    let monthlyComments = '';
    
    if (monthlyFailedTests.length > 0) {
      monthlyComments = `Failed tests: ${monthlyFailedTests.map(t => t.testName).join(', ')}. Immediate attention required. `;
    } else if (conditionalTests.length > 0) {
      monthlyComments = `Conditional pass: ${conditionalTests.map(t => t.testName).join(', ')}. Monitor closely next month. `;
    } else {
      monthlyComments = 'All monthly QC tests passed. System performance meets specifications. ';
    }
    
    // Add monthly-specific comments
    if (machineType === 'MRI') {
      if (Math.random() > 0.7) {
        monthlyComments += 'Helium level: ' + (Math.random() * 15 + 80).toFixed(0) + '%. ';
      }
      if (Math.random() > 0.8) {
        monthlyComments += 'Cold head service performed this month. ';
      }
    }
    
    history.monthly.push({
      date: dateStr,
      overallResult: monthlyTests.some(t => t.result === 'fail') ? 'fail' : 
                     monthlyTests.some(t => t.result === 'conditional') ? 'conditional' : 'pass',
      tests: monthlyTests,
      performedBy: monthlyTechnician,
      comments: monthlyComments,
      completedAt: new Date(date.setHours(10 + Math.random() * 4)).toISOString(),
      reportUrl: `http://192.168.1.182:5000/reports/monthly-qc-${machineId}-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}.pdf`
    });
    }
  }

  // Generate quarterly QC for last 8 quarters (only if worksheet assigned)
  if (tests.quarterly && tests.quarterly.length > 0 && hasWorksheetAssigned(machineId, 'quarterly')) {
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      const currentQuarter = Math.floor(date.getMonth() / 3);
      const quarterStart = new Date(date.getFullYear(), currentQuarter * 3 - (i * 3), 1);
      const dateStr = quarterStart.toISOString().split('T')[0];
      
      // Skip if real QC already exists for this date
      if (history.quarterly.some(qc => qc.date === dateStr && qc.isRealSubmission)) continue;
      
      // Select a single physicist/specialist for quarterly QC
      const quarterlySpecialist = ['Dr. Patricia Lee', 'Dr. Michael Chen', 'Dr. Robert Zhang'][Math.floor(Math.random() * 3)];
      
      const quarterlyTests = tests.quarterly.map(test => ({
        testName: test,
        result: Math.random() > 0.95 ? 'fail' : Math.random() > 0.85 ? 'conditional' : 'pass',
        value: generateTestValue(test),
        tolerance: '±10%',
        notes: Math.random() > 0.7 ? 'Quarterly assessment completed' : '',
        performedBy: quarterlySpecialist
      }));

      // Generate quarterly comments
      let quarterlyComments = `Quarterly comprehensive QC performed by ${quarterlySpecialist}. `;
      if (quarterlyTests.some(t => t.result === 'fail')) {
        quarterlyComments += 'Critical issues identified - service required. ';
      } else if (quarterlyTests.some(t => t.result === 'conditional')) {
        quarterlyComments += 'Some parameters approaching limits. ';
      } else {
        quarterlyComments += 'All safety and performance tests passed. ';
      }
      
      history.quarterly.push({
        date: dateStr,
        quarter: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`,
        overallResult: quarterlyTests.some(t => t.result === 'fail') ? 'fail' : 
                       quarterlyTests.some(t => t.result === 'conditional') ? 'conditional' : 'pass',
        tests: quarterlyTests,
        performedBy: quarterlySpecialist,
        comments: quarterlyComments,
        completedAt: new Date(quarterStart.setHours(14 + Math.random() * 3)).toISOString(),
        reportUrl: `http://192.168.1.182:5000/reports/quarterly-qc-${machineId}-${quarterStart.getFullYear()}-Q${Math.floor(quarterStart.getMonth() / 3) + 1}.pdf`
      });
    }
  }

  // Generate annual QC for last 3 years (only if worksheet assigned)
  if (tests.annual && tests.annual.length > 0 && hasWorksheetAssigned(machineId, 'annual')) {
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      const year = date.getFullYear() - i;
      const yearStart = new Date(year, 0, 1);
      const dateStr = yearStart.toISOString().split('T')[0];
      
      // Skip if real QC already exists for this date
      if (history.annual.some(qc => qc.date === dateStr && qc.isRealSubmission)) continue;
      
      // Select a senior physicist/engineer for annual QC
      const annualSpecialist = ['Dr. Richard Thompson', 'Dr. Sarah Martinez', 'Dr. Elizabeth Kumar'][Math.floor(Math.random() * 3)];
      
      const annualTests = tests.annual.map(test => ({
        testName: test,
        result: Math.random() > 0.97 ? 'fail' : Math.random() > 0.9 ? 'conditional' : 'pass',
        value: generateTestValue(test),
        tolerance: '±15%',
        notes: Math.random() > 0.6 ? 'Annual comprehensive assessment' : '',
        performedBy: annualSpecialist
      }));

      // Generate annual comments
      let annualComments = `Annual regulatory compliance QC completed. `;
      if (annualTests.some(t => t.result === 'fail')) {
        annualComments += 'System does not meet regulatory requirements - immediate remediation required. ';
      } else {
        annualComments += 'System meets all regulatory and safety requirements. ';
        if (machineType === 'MRI') {
          annualComments += 'ACR accreditation requirements satisfied. ';
        } else if (machineType === 'CT') {
          annualComments += 'Dose optimization protocols reviewed and approved. ';
        } else if (machineType === 'PET-CT') {
          annualComments += 'Nuclear medicine license requirements met. ';
        }
      }
      
      history.annual.push({
        date: dateStr,
        year: year,
        overallResult: annualTests.some(t => t.result === 'fail') ? 'fail' : 
                       annualTests.some(t => t.result === 'conditional') ? 'conditional' : 'pass',
        tests: annualTests,
        performedBy: annualSpecialist,
        comments: annualComments,
        completedAt: new Date(yearStart.setHours(15 + Math.random() * 2)).toISOString(),
        reportUrl: `http://192.168.1.182:5000/reports/annual-qc-${machineId}-${year}.pdf`
      });
    }
  }

  return history;
};

const generateTestValue = (testName) => {
  // MRI specific test values
  if (testName === 'Table Positioning') {
    const deviation = Math.random() * 6 - 3; // -3 to +3 mm typically
    return `${deviation.toFixed(1)} mm`;
  }
  if (testName === 'Setup and Scanning') {
    return Math.random() > 0.95 ? 'Coil not detected' : 'Successful';
  }
  if (testName === 'Center (Central) Frequency') {
    const baseFreq = 63.86; // MHz at 1.5T
    const drift = (Math.random() * 4 - 2) / 1000; // ±2 ppm typical
    return `${(baseFreq + drift).toFixed(3)} MHz`;
  }
  if (testName === 'Transmitter Gain or Attenuation') {
    const baseline = 100;
    const change = Math.random() * 6 - 3; // ±3% typical
    return `${change.toFixed(1)}% from baseline`;
  }
  if (testName === 'Geometric Accuracy') {
    const error = Math.random() * 2.5 - 1.25; // ±1.25 mm typical
    return `${error.toFixed(1)} mm error`;
  }
  if (testName === 'High Contrast (Spatial) Resolution') {
    return Math.random() > 0.95 ? 'Some spokes obscured' : 'All spokes visible';
  }
  if (testName === 'Low Contrast Resolution (Detectability)') {
    const objects = Math.floor(Math.random() * 5) + 37; // 37-41 objects typically
    return `${objects} objects visible`;
  }
  if (testName === 'Artifact Analysis') {
    const artifacts = ['None detected', 'Minimal ghosting', 'Slight shading', 'Minor zipper artifact'];
    return artifacts[Math.floor(Math.random() * artifacts.length)];
  }
  if (testName === 'Film (Hardcopy Image) QC') {
    return Math.random() > 0.98 ? 'Contrast mismatch' : 'Matches console';
  }
  if (testName === 'Visual Checklist') {
    return Math.random() > 0.99 ? 'RF door light out' : 'All items operational';
  }
  
  // Generic values for other tests
  if (testName.includes('Temperature')) return `${(Math.random() * 5 + 20).toFixed(1)}°C`;
  if (testName.includes('Level')) return `${(Math.random() * 10 + 90).toFixed(0)}%`;
  if (testName.includes('Accuracy')) return `${(Math.random() * 2 + 98).toFixed(1)}%`;
  if (testName.includes('Resolution')) return `${(Math.random() * 0.5 + 2).toFixed(2)} mm`;
  if (testName.includes('Dose')) return `${(Math.random() * 5 + 15).toFixed(1)} mGy`;
  return `${(Math.random() * 10 + 95).toFixed(1)}`;
};

// Get QC history for a specific machine
router.get('/machines/:machineId/qc-history', (req, res) => {
  // In real implementation, this would fetch from database
  // For now, generate mock data based on machine type
  const machineType = req.query.type || 'CT';
  const history = generateQCHistory(machineType, req.params.machineId);
  res.json(history);
});

// Get specific QC test details
router.get('/machines/:machineId/qc-history/:date', (req, res) => {
  const machineType = req.query.type || 'CT';
  const history = generateQCHistory(machineType, req.params.machineId);
  const { date } = req.params;
  
  // Handle different date/period formats for different frequencies
  let dailyQC = null;
  let weeklyQC = null;
  let monthlyQC = null;
  let quarterlyQC = null;
  let annualQC = null;
  
  // Daily QC - exact date match
  dailyQC = history.daily.find(qc => qc.date === date);
  
  // Weekly QC - exact date match
  weeklyQC = history.weekly.find(qc => qc.date === date);
  
  // Monthly QC - check if date falls within the same month
  if (date.includes('-')) {
    const dateMonth = date.slice(0, 7); // Extract YYYY-MM
    monthlyQC = history.monthly.find(qc => qc.date.startsWith(dateMonth));
  }
  
  // Quarterly QC - check if date falls within the same quarter
  if (date.includes('-')) {
    const dateObj = new Date(date);
    const dateQuarter = Math.floor(dateObj.getMonth() / 3);
    const dateYear = dateObj.getFullYear();
    
    quarterlyQC = history.quarterly.find(qc => {
      const qcDate = new Date(qc.date);
      const qcQuarter = Math.floor(qcDate.getMonth() / 3);
      const qcYear = qcDate.getFullYear();
      return qcYear === dateYear && qcQuarter === dateQuarter;
    });
  } else if (date.includes('Q')) {
    // Handle quarter format like "2025-Q1"
    const [yearStr, quarterStr] = date.split('-Q');
    const targetYear = parseInt(yearStr);
    const targetQuarter = parseInt(quarterStr) - 1; // Convert to 0-based
    
    quarterlyQC = history.quarterly.find(qc => {
      const qcDate = new Date(qc.date);
      const qcQuarter = Math.floor(qcDate.getMonth() / 3);
      const qcYear = qcDate.getFullYear();
      return qcYear === targetYear && qcQuarter === targetQuarter;
    });
  }
  
  // Annual QC - check if date falls within the same year
  let targetYear = null;
  if (date.length === 4 && !isNaN(date)) {
    // Handle year format like "2025"
    targetYear = parseInt(date);
  } else if (date.includes('-')) {
    // Handle date format like "2025-01-15"
    targetYear = new Date(date).getFullYear();
  }
  
  if (targetYear) {
    annualQC = history.annual.find(qc => {
      const qcYear = new Date(qc.date).getFullYear();
      return qcYear === targetYear;
    });
  }
  
  // Return any found QC data
  const foundQC = dailyQC || weeklyQC || monthlyQC || quarterlyQC || annualQC;
  
  if (foundQC) {
    const response = {};
    if (dailyQC) response.daily = dailyQC;
    if (weeklyQC) response.weekly = weeklyQC;
    if (monthlyQC) response.monthly = monthlyQC;
    if (quarterlyQC) response.quarterly = quarterlyQC;
    if (annualQC) response.annual = annualQC;
    
    res.json(response);
  } else {
    res.status(404).json({ error: `QC data not found for date/period: ${date}` });
  }
});

// Get QC tasks due today or this month (deprecated - use POST version)
router.get('/due-tasks', async (req, res) => {
  try {
    // Return empty structure for now - frontend should use POST /due-tasks-from-worksheets
    const dueTasks = {
      dailyOverdue: [],
      dailyDueToday: [],
      weeklyOverdue: [],
      weeklyDueToday: [],
      monthlyOverdue: [],
      monthlyDueThisMonth: [],
      quarterlyOverdue: [],
      quarterlyDueThisQuarter: [],
      annualOverdue: [],
      annualDueThisYear: []
    };
    
    console.log('GET /due-tasks called - this endpoint is deprecated. Use POST /due-tasks-from-worksheets instead.');
    res.json(dueTasks);
  } catch (error) {
    console.error('Error in due-tasks endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch due tasks' });
  }
});

// Get QC tasks due today or this month based on worksheet assignments
router.post('/due-tasks-from-worksheets', async (req, res) => {
  try {
    const { worksheets } = req.body;
    
    if (!worksheets || !Array.isArray(worksheets)) {
      return res.status(400).json({ error: 'Invalid worksheet data' });
    }
    
    const today = new Date();
    
    // Initialize due tasks structure
    const dueTasks = {
      dailyOverdue: [],
      dailyDueToday: [],
      weeklyOverdue: [],
      weeklyDueToday: [],
      monthlyOverdue: [],
      monthlyDueThisMonth: [],
      quarterlyOverdue: [],
      quarterlyDueThisQuarter: [],
      annualOverdue: [],
      annualDueThisYear: []
    };
    
    // Import machine data
    const machinesModule = require('./machines');
    const allMachines = machinesModule.getAllMachines ? machinesModule.getAllMachines() : [];
    
    // Create machine lookup for names and locations
    const machineMap = {};
    allMachines.forEach(machine => {
      machineMap[machine.machineId] = {
        name: machine.name,
        type: machine.type,
        location: `${machine.location.building}, Floor ${machine.location.floor}, ${machine.location.room}`
      };
    });
    
    // Process worksheets to create assignments
    const worksheetAssignments = [];
    
    worksheets.forEach(worksheet => {
      if (worksheet.isWorksheet && worksheet.assignedMachines && worksheet.assignedMachines.length > 0) {
        worksheet.assignedMachines.forEach(machineId => {
          const machine = machineMap[machineId];
          if (machine) {
            worksheetAssignments.push({
              machineId: machineId,
              machineName: machine.name,
              type: machine.type,
              location: machine.location,
              frequency: worksheet.frequency,
              startDate: worksheet.startDate,
              worksheetId: worksheet.id,
              worksheetTitle: worksheet.title
            });
          }
        });
      }
    });

    // Process each worksheet assignment to determine due tasks
    for (const assignment of worksheetAssignments) {
      // Create date objects in local timezone to avoid UTC/timezone issues
      const startDate = new Date(assignment.startDate + 'T12:00:00');
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      // Get completion history for this specific worksheet
      const completedDates = getWorksheetCompletionHistory(assignment.machineId, assignment.frequency, assignment.worksheetId);
      
      // Generate all due dates from start to today
      const allDueDates = generateQCDueDates(assignment.frequency, assignment.startDate);
      
      // Find overdue and due dates
      for (const dueDate of allDueDates) {
        // Create date objects in local timezone to avoid UTC/timezone issues
        const dueDateObj = new Date(dueDate + 'T12:00:00');
        dueDateObj.setHours(0, 0, 0, 0);
        
        // Skip future dates
        if (dueDateObj > todayDate) continue;
        
        // Skip if already completed
        if (completedDates.includes(dueDate)) continue;
        
        // Calculate days overdue
        const timeDiff = todayDate.getTime() - dueDateObj.getTime();
        const daysOverdue = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Determine priority
        const priority = getQCPriority(daysOverdue, assignment.frequency);
        
        const task = {
          machineId: assignment.machineId,
          machineName: assignment.machineName,
          type: assignment.type,
          location: assignment.location,
          frequency: assignment.frequency,
          worksheetId: assignment.worksheetId,
          worksheetTitle: assignment.worksheetTitle,
          dueDate: dueDate,
          daysOverdue: daysOverdue,
          priority: priority,
          nextDue: dueDate,
          lastQC: completedDates.length > 0 ? completedDates[completedDates.length - 1] : null
        };
        
        // Categorize the task
        if (assignment.frequency === 'daily') {
          if (daysOverdue === 0) {
            dueTasks.dailyDueToday.push(task);
          } else if (daysOverdue > 0) {
            dueTasks.dailyOverdue.push(task);
          }
        } else if (assignment.frequency === 'weekly') {
          if (daysOverdue === 0) {
            dueTasks.weeklyDueToday.push(task);
          } else if (daysOverdue > 0) {
            dueTasks.weeklyOverdue.push(task);
          }
        } else if (assignment.frequency === 'monthly') {
          if (isThisMonth(dueDate)) {
            dueTasks.monthlyDueThisMonth.push(task);
          } else if (daysOverdue > 0) {
            dueTasks.monthlyOverdue.push(task);
          }
        } else if (assignment.frequency === 'quarterly') {
          if (isThisQuarter(dueDate)) {
            dueTasks.quarterlyDueThisQuarter.push(task);
          } else if (daysOverdue > 0) {
            dueTasks.quarterlyOverdue.push(task);
          }
        } else if (assignment.frequency === 'annual') {
          if (isThisYear(dueDate)) {
            dueTasks.annualDueThisYear.push(task);
          } else if (daysOverdue > 0) {
            dueTasks.annualOverdue.push(task);
          }
        }
      }
    }

    console.log('Due tasks found:', {
      dailyOverdue: dueTasks.dailyOverdue.length,
      dailyDueToday: dueTasks.dailyDueToday.length,
      weeklyOverdue: dueTasks.weeklyOverdue.length,
      weeklyDueToday: dueTasks.weeklyDueToday.length,
      monthlyOverdue: dueTasks.monthlyOverdue.length,
      monthlyDueThisMonth: dueTasks.monthlyDueThisMonth.length,
      quarterlyOverdue: dueTasks.quarterlyOverdue.length,
      quarterlyDueThisQuarter: dueTasks.quarterlyDueThisQuarter.length,
      annualOverdue: dueTasks.annualOverdue.length,
      annualDueThisYear: dueTasks.annualDueThisYear.length
    });

    res.json(dueTasks);
  } catch (error) {
    console.error('Error getting due tasks:', error);
    res.status(500).json({ error: 'Failed to get due tasks' });
  }
});

// Helper functions for date checking
function isThisMonth(dateStr) {
  // Create date objects in local timezone to avoid UTC/timezone issues
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function isThisQuarter(dateStr) {
  // Create date objects in local timezone to avoid UTC/timezone issues
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const dateQuarter = Math.floor(date.getMonth() / 3);
  const todayQuarter = Math.floor(today.getMonth() / 3);
  return dateQuarter === todayQuarter && date.getFullYear() === today.getFullYear();
}

function isThisYear(dateStr) {
  // Create date objects in local timezone to avoid UTC/timezone issues
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  return date.getFullYear() === today.getFullYear();
}

// Simulate QC history based on worksheet assignment
function getWorksheetCompletionHistory(machineId, frequency, worksheetId) {
  const completedDates = [];
  
  try {
    // Read real completion data from qcCompletions.json
    const fs = require('fs');
    const path = require('path');
    const completionsPath = path.join(__dirname, '../data/qcCompletions.json');
    
    if (fs.existsSync(completionsPath)) {
      const completionsData = fs.readFileSync(completionsPath, 'utf8');
      const completions = JSON.parse(completionsData);
      
      // Filter completions for this specific worksheet
      const worksheetCompletions = completions.filter(qc => 
        qc.machineId === machineId && 
        qc.frequency === frequency &&
        qc.worksheetId === worksheetId
      );
      
      // Extract completion dates
      worksheetCompletions.forEach(qc => {
        if (qc.date) {
          completedDates.push(qc.date);
        }
      });
    }
  } catch (error) {
    console.error('Error reading QC completions:', error);
  }
  
  return completedDates.sort();
}

// Get test templates for QC forms
router.get('/test-templates/:machineType/:frequency', (req, res) => {
  const { machineType, frequency } = req.params;
  const templates = qcTestTemplates[machineType];
  
  if (!templates || !templates[frequency]) {
    return res.status(404).json({ error: 'Test templates not found' });
  }

  const tests = templates[frequency].map(testName => {
    let test = { testName };
    
    // Add specific details for each test
    if (testName === 'Table Positioning') {
      test.tolerance = '±5 mm';
      test.description = 'Verify accuracy and reproducibility of patient table positioning';
      test.placeholder = 'e.g., -2.5 mm';
    } else if (testName === 'Setup and Scanning') {
      test.description = 'Ensure scanner performs patient data entry and prescan operations correctly';
      test.placeholder = 'Successful / Failed';
    } else if (testName === 'Center (Central) Frequency') {
      test.tolerance = '±3 ppm';
      test.description = 'Confirm the scanner is on-resonance';
      test.placeholder = 'e.g., 63.86 MHz';
    } else if (testName === 'Transmitter Gain or Attenuation') {
      test.tolerance = '±5%';
      test.description = 'Check RF chain consistency';
      test.placeholder = 'e.g., +2.3% from baseline';
    } else if (testName === 'Geometric Accuracy') {
      test.tolerance = '±2 mm';
      test.description = 'Ensure dimensions on images match known phantom dimensions';
      test.placeholder = 'e.g., +1.2 mm error';
    } else if (testName === 'High Contrast (Spatial) Resolution') {
      test.description = 'Assess the scanner\'s ability to resolve small objects';
      test.placeholder = 'All spokes visible / Some obscured';
    } else if (testName === 'Low Contrast Resolution (Detectability)') {
      test.tolerance = '≥37 objects';
      test.description = 'Evaluate detectability of low-contrast objects';
      test.placeholder = 'e.g., 39 objects';
    } else if (testName === 'Artifact Analysis') {
      test.description = 'Identify new or worsening artifacts';
      test.placeholder = 'None / Minimal ghosting / etc.';
    } else if (testName === 'Film (Hardcopy Image) QC') {
      test.description = 'Ensure printed films are consistent with console images';
      test.placeholder = 'Matches console / Contrast mismatch';
    } else if (testName === 'Visual Checklist') {
      test.description = 'Verify safety and system integrity';
      test.placeholder = 'All operational / RF door light out';
    }

    return test;
  });

  res.json(tests);
});

// Get open failures
router.get('/open-failures', async (req, res) => {
  try {
    // CONSISTENT DATA: Only show failures for machines that actually have worksheets assigned
    // In real implementation, failures would only exist for machines with active QC programs
    // For demo: Only SOMATOM Force CT has worksheets, so only show general maintenance issues (not QC failures)
    const openFailures = [
      // No QC-related failures since most machines don't have QC worksheets assigned
      // Only general equipment issues that don't require QC worksheets to identify
    ];

    res.json(openFailures);
  } catch (error) {
    console.error('Error getting open failures:', error);
    res.status(500).json({ error: 'Failed to get open failures' });
  }
});


// Submit QC data
router.post('/submit', (req, res) => {
  try {
    const qcData = req.body;
    
    console.log('QC Data submitted:', qcData);
    
    // Validate required fields
    if (!qcData.machineId || !qcData.frequency || !qcData.date || !qcData.worksheetId) {
      return res.status(400).json({ 
        error: 'Missing required fields: machineId, frequency, date, worksheetId' 
      });
    }
    
    // Add QC completion to persistent storage
    const completedQC = addQCCompletion(qcData);
    
    if (!completedQC) {
      return res.status(500).json({ 
        error: 'Failed to save QC completion data' 
      });
    }
    
    // Also add to in-memory storage for backward compatibility with existing mock data generation
    if (!global.completedQCs) {
      global.completedQCs = [];
    }
    
    // Remove any existing in-memory entry for same machine/frequency/date
    global.completedQCs = global.completedQCs.filter(qc => 
      !(qc.machineId === completedQC.machineId && 
        qc.frequency === completedQC.frequency && 
        qc.date === completedQC.date)
    );
    
    global.completedQCs.push(completedQC);
    
    res.json({ 
      success: true, 
      message: 'QC data submitted and stored successfully',
      id: completedQC.id,
      completedQC: completedQC
    });
    
  } catch (error) {
    console.error('Error submitting QC data:', error);
    res.status(500).json({ error: 'Failed to submit QC data' });
  }
});

// Get system overdue status
router.get('/overdue', (req, res) => {
  try {
    // Get all QC completions from persistent storage
    const allCompletions = getAllQCCompletions();
    
    // Calculate overdue status
    const overdueStatus = getSystemOverdueStatus(allCompletions);
    
    res.json(overdueStatus);
  } catch (error) {
    console.error('Error getting overdue status:', error);
    res.status(500).json({ error: 'Failed to get overdue status' });
  }
});

// Get QC completions
router.get('/completions', (req, res) => {
  try {
    const { machineId, worksheetId } = req.query;
    
    let completions;
    if (machineId && worksheetId) {
      // Get completion dates for specific machine/worksheet combination
      const dates = getCompletionDates(machineId, worksheetId);
      completions = { completionDates: dates };
    } else if (machineId) {
      completions = getQCCompletionsByMachine(machineId);
    } else if (worksheetId) {
      completions = getQCCompletionsByWorksheet(worksheetId);
    } else {
      completions = getAllQCCompletions();
    }
    
    res.json(completions);
  } catch (error) {
    console.error('Error getting QC completions:', error);
    res.status(500).json({ error: 'Failed to get QC completions' });
  }
});

// Get QC schedule and status for a specific worksheet
router.get('/worksheet/:worksheetId/schedule', (req, res) => {
  try {
    const { worksheetId } = req.params;
    
    // In a real implementation, this would fetch worksheet data from database
    // For demo, we'll simulate getting worksheet information
    console.log('Getting QC schedule for worksheet:', worksheetId);
    
    // Mock worksheet data - in production this would come from database
    const mockWorksheet = {
      id: worksheetId,
      machineId: 'CT-GON-001',
      frequency: 'daily',
      startDate: '2024-01-15',
      title: 'ACR CT Daily QC Protocol'
    };
    
    // Get completed QCs for this worksheet (from localStorage would be passed via request)
    const completedDates = req.query.completedDates ? 
      JSON.parse(req.query.completedDates) : [];
    
    // Generate complete QC schedule and status
    const qcStatus = getWorksheetQCStatus(
      mockWorksheet.machineId,
      mockWorksheet.frequency,
      mockWorksheet.startDate,
      completedDates
    );
    
    res.json({
      worksheet: mockWorksheet,
      schedule: qcStatus,
      message: `Generated ${qcStatus.dueDates.length} QC due dates from ${mockWorksheet.startDate} to today`
    });
    
  } catch (error) {
    console.error('Error generating QC schedule:', error);
    res.status(500).json({ error: 'Failed to generate QC schedule' });
  }
});

// Generate QC due dates for a specific frequency and date range
router.get('/schedule/generate', (req, res) => {
  try {
    const { frequency, startDate, endDate, completedDates } = req.query;
    
    if (!frequency || !startDate) {
      return res.status(400).json({ error: 'frequency and startDate are required' });
    }
    
    const dueDates = generateQCDueDates(frequency, startDate, endDate);
    
    // Return just the array of due dates for frontend compatibility
    res.json(dueDates);
    
  } catch (error) {
    console.error('Error generating QC due dates:', error);
    res.status(500).json({ error: 'Failed to generate QC due dates' });
  }
});

module.exports = router;