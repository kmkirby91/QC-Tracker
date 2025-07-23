const express = require('express');
const router = express.Router();
const { calculateNextDueDate, getMissedQCDates, getQCPriority, generateSampleWorksheetAssignments, generateQCDueDates, getWorksheetQCStatus } = require('../utils/qcScheduling');

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

  // Add completed QCs from global storage (real submissions)
  if (global.completedQCs) {
    const machineCompletedQCs = global.completedQCs.filter(qc => qc.machineId === machineId);
    
    machineCompletedQCs.forEach(qc => {
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
  }

  // IMPORTANT: Only generate history for machines that actually have worksheets assigned
  // Check against our consistent sample worksheet assignments
  const hasWorksheetAssigned = (machine, frequency) => {
    const assignments = generateSampleWorksheetAssignments();
    return assignments.some(assignment => 
      assignment.machineId === machine && 
      assignment.frequency === frequency
    );
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
  
  // Find the specific date in daily or monthly
  const dailyQC = history.daily.find(qc => qc.date === date);
  const monthlyQC = history.monthly.find(qc => qc.date.startsWith(date.slice(0,7)));
  
  if (dailyQC || monthlyQC) {
    res.json({ daily: dailyQC, monthly: monthlyQC });
  } else {
    res.status(404).json({ error: 'QC data not found for this date' });
  }
});

// Get QC tasks due today or this month
router.get('/due-tasks', async (req, res) => {
  try {
    const today = new Date();
    
    // Get all active worksheet assignments
    const assignments = generateSampleWorksheetAssignments();
    
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
    
    // Process each worksheet assignment
    for (const assignment of assignments) {
      const machine = allMachines.find(m => m.machineId === assignment.machineId);
      if (!machine) continue;
      
      // For demo purposes, simulate some QC history
      const completedDates = getSimulatedQCHistory(assignment.machineId, assignment.frequency, assignment.startDate);
      
      // Calculate next due date
      const lastCompletedDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : null;
      const dueInfo = calculateNextDueDate(assignment.frequency, assignment.startDate, lastCompletedDate);
      
      // Get missed QC dates
      const missedDates = getMissedQCDates(assignment.frequency, assignment.startDate, completedDates);
      
      // Create task object
      const task = {
        machineId: assignment.machineId,
        machineName: machine.name,
        type: machine.type,
        location: `${machine.location.building} - ${machine.location.room}`,
        frequency: assignment.frequency,
        worksheetTitle: assignment.title,
        startDate: assignment.startDate,
        nextDue: dueInfo.nextDue,
        lastQC: lastCompletedDate,
        daysOverdue: dueInfo.daysOverdue,
        priority: getQCPriority(dueInfo.daysOverdue, assignment.frequency),
        missedCount: missedDates.length
      };
      
      // Categorize the task
      if (dueInfo.isDueToday) {
        dueTasks[`${assignment.frequency}DueToday`].push(task);
      } else if (dueInfo.isOverdue) {
        dueTasks[`${assignment.frequency}Overdue`].push(task);
      } else if (assignment.frequency === 'monthly' && isThisMonth(dueInfo.nextDue)) {
        dueTasks.monthlyDueThisMonth.push(task);
      } else if (assignment.frequency === 'quarterly' && isThisQuarter(dueInfo.nextDue)) {
        dueTasks.quarterlyDueThisQuarter.push(task);
      } else if (assignment.frequency === 'annual' && isThisYear(dueInfo.nextDue)) {
        dueTasks.annualDueThisYear.push(task);
      }
    }
    
    // Sort tasks by priority and days overdue
    const sortTasks = (tasks) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return tasks.sort((a, b) => {
        if (a.priority !== b.priority) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.daysOverdue - a.daysOverdue;
      });
    };
    
    Object.keys(dueTasks).forEach(key => {
      dueTasks[key] = sortTasks(dueTasks[key]);
    });

    res.json(dueTasks);
  } catch (error) {
    console.error('Error getting due tasks:', error);
    res.status(500).json({ error: 'Failed to get due tasks' });
  }
});

// Helper functions for date checking
function isThisMonth(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function isThisQuarter(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const dateQuarter = Math.floor(date.getMonth() / 3);
  const todayQuarter = Math.floor(today.getMonth() / 3);
  return dateQuarter === todayQuarter && date.getFullYear() === today.getFullYear();
}

function isThisYear(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear();
}

// Simulate QC history based on worksheet assignment
function getSimulatedQCHistory(machineId, frequency, startDate) {
  const completedDates = [];
  const today = new Date();
  const start = new Date(startDate);
  
  // Only generate history for machines that have been running QC for a while
  if (machineId === 'CT-GON-001' && frequency === 'daily') {
    // SOMATOM Force CT - simulate mostly complete daily QC with some recent gaps
    let currentDate = new Date(start);
    while (currentDate < today) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // 85% completion rate, with more gaps in recent days to show overdue items
        const daysSinceStart = Math.floor((currentDate - start) / (1000 * 60 * 60 * 24));
        const recentGapProbability = daysSinceStart > 300 ? 0.3 : 0.15; // More gaps recently
        
        if (Math.random() > recentGapProbability) {
          completedDates.push(currentDate.toISOString().split('T')[0]);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (machineId === 'MRI-GON-001' && frequency === 'daily') {
    // MRI - newer assignment, fewer completed QCs
    let currentDate = new Date(start);
    while (currentDate < today) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        if (Math.random() > 0.4) { // 60% completion rate
          completedDates.push(currentDate.toISOString().split('T')[0]);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (machineId === 'MAMMO-GON-001' && frequency === 'daily') {
    // Mammography - recently assigned, very few completed QCs
    const recentStart = Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)) - 7);
    for (let i = recentStart; i < 3; i++) {
      const qcDate = new Date(start);
      qcDate.setDate(qcDate.getDate() + i);
      if (qcDate.getDay() !== 0 && qcDate.getDay() !== 6) {
        completedDates.push(qcDate.toISOString().split('T')[0]);
      }
    }
  } else if (frequency === 'monthly') {
    // Monthly QC - simulate some completed months
    let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
    while (currentDate < today) {
      if (Math.random() > 0.2) { // 80% completion rate
        completedDates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (frequency === 'weekly') {
    // Weekly QC
    let currentDate = new Date(start);
    while (currentDate < today) {
      if (Math.random() > 0.25) { // 75% completion rate
        completedDates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 7);
    }
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
    
    // In a real implementation, this would save to database
    console.log('QC Data submitted:', qcData);
    
    // For prototype: Store completed QC in a way that can be retrieved by QC history
    // This creates a bridge between submissions and status checking
    const completedQC = {
      id: Date.now().toString(),
      machineId: qcData.machineId,
      machineType: qcData.machineType,
      frequency: qcData.frequency,
      date: qcData.date,
      tests: qcData.tests,
      performedBy: qcData.performedBy,
      comments: qcData.comments,
      overallResult: qcData.overallResult,
      completedAt: new Date().toISOString(),
      worksheetId: qcData.worksheetId, // Include worksheet ID for status matching
      worksheetTitle: qcData.worksheetTitle
    };
    
    // Add to in-memory storage (in production, this would go to database)
    if (!global.completedQCs) {
      global.completedQCs = [];
    }
    global.completedQCs.push(completedQC);
    
    // Also return the completion data for frontend to handle
    res.json({ 
      success: true, 
      message: 'QC data submitted successfully',
      id: completedQC.id,
      completedQC: completedQC
    });
    
  } catch (error) {
    console.error('Error submitting QC data:', error);
    res.status(500).json({ error: 'Failed to submit QC data' });
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
    const { frequency, startDate, endDate } = req.query;
    
    if (!frequency || !startDate) {
      return res.status(400).json({ error: 'frequency and startDate are required' });
    }
    
    const dueDates = generateQCDueDates(frequency, startDate, endDate);
    
    res.json({
      frequency,
      startDate,
      endDate: endDate || 'today',
      dueDates,
      count: dueDates.length,
      message: `Generated ${dueDates.length} ${frequency} QC due dates`
    });
    
  } catch (error) {
    console.error('Error generating QC due dates:', error);
    res.status(500).json({ error: 'Failed to generate QC due dates' });
  }
});

module.exports = router;