const express = require('express');
const router = express.Router();

// QC test templates by machine type
const qcTestTemplates = {
  MRI: {
    daily: [
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
    quarterly: [
      'Comprehensive Phantom Testing',
      'Safety System Verification',
      'RF Safety Assessment',
      'Quench System Test',
      'Environmental Monitoring'
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
    quarterly: [
      'Radiation Dose Optimization',
      'Advanced Imaging Protocol Review',
      'Contrast Injector Calibration',
      'Emergency Procedure Training'
    ],
    annual: [
      'Full Dosimetry Calibration',
      'X-ray Tube Performance Assessment',
      'Radiation Safety Survey',
      'Regulatory Compliance Review',
      'Preventive Maintenance Audit'
    ]
  },
  'PET-CT': {
    daily: [
      'Daily Normalization',
      'Coincidence Timing Resolution',
      'Energy Resolution Check',
      'Detector Efficiency',
      'CT Warm-up',
      'PET/CT Alignment Check'
    ],
    monthly: [
      'Sensitivity Measurement',
      'Spatial Resolution Test',
      'Count Rate Performance',
      'Image Quality Phantom',
      'Attenuation Correction Accuracy',
      'SUV Calibration',
      'Cross-calibration with Dose Calibrator'
    ],
    quarterly: [
      'Well Counter Cross-Calibration',
      'Partial Volume Correction QC',
      'Advanced Reconstruction QC',
      'Radiation Safety Assessment'
    ],
    annual: [
      'Full System Performance Evaluation',
      'Detector Block Replacement Assessment',
      'Radiation Safety Certification',
      'Nuclear Medicine License Review',
      'Comprehensive System Validation'
    ]
  }
};

// Generate mock QC history
const generateQCHistory = (machineType, machineId) => {
  const tests = qcTestTemplates[machineType] || qcTestTemplates['CT'];
  const history = {
    daily: [],
    monthly: [],
    quarterly: [],
    annual: []
  };

  // Generate daily QC for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Skip weekends for daily QC
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Skip today's QC for MRI-001 to simulate missing daily QC
    if (i === 0 && machineId === 'MRI-001') continue;
    
    // Skip today's QC for CT-001 to simulate missing daily QC
    if (i === 0 && machineId === 'CT-001') continue;
    
    // Skip yesterday's QC for CT-002 to simulate overdue daily QC
    if (i === 1 && machineId === 'CT-002') continue;
    
    // Skip yesterday's QC for PET-001 to simulate overdue daily QC
    if (i === 1 && machineId === 'PET-001') continue;
    
    // Skip June 28th QC for MRI-001 to simulate a missed QC date in the past
    if (i === 4 && machineId === 'MRI-001') continue;
    
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
      date: date.toISOString().split('T')[0],
      overallResult: dailyTests.some(t => t.result === 'fail') ? 'fail' : 'pass',
      tests: dailyTests,
      performedBy: todaysTechnician,
      comments: comments,
      completedAt: new Date(date.setHours(7 + Math.random() * 2)).toISOString()
    });
  }

  // Generate monthly QC for last 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Skip last month's QC for PET-001 to simulate overdue monthly QC
    if (i === 1 && machineId === 'PET-001') continue;
    
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
      date: date.toISOString().split('T')[0],
      overallResult: monthlyTests.some(t => t.result === 'fail') ? 'fail' : 
                     monthlyTests.some(t => t.result === 'conditional') ? 'conditional' : 'pass',
      tests: monthlyTests,
      performedBy: monthlyTechnician,
      comments: monthlyComments,
      completedAt: new Date(date.setHours(10 + Math.random() * 4)).toISOString(),
      reportUrl: `http://192.168.1.182:5000/reports/monthly-qc-${machineId}-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}.pdf`
    });
  }

  // Generate quarterly QC for last 8 quarters (2 years)
  if (tests.quarterly) {
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      const currentQuarter = Math.floor(date.getMonth() / 3);
      const quarterStart = new Date(date.getFullYear(), currentQuarter * 3 - (i * 3), 1);
      
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
        date: quarterStart.toISOString().split('T')[0],
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

  // Generate annual QC for last 3 years
  if (tests.annual) {
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      const year = date.getFullYear() - i;
      const yearStart = new Date(year, 0, 1);
      
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
        date: yearStart.toISOString().split('T')[0],
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
    // Get all machines
    const machines = [
      {
        machineId: 'MRI-001',
        name: 'Siemens MAGNETOM Vida',
        type: 'MRI',
        location: 'Main Hospital - MRI Suite 1',
        nextQCDue: '2024-01-09',
        lastQC: { date: '2024-01-02' }
      },
      {
        machineId: 'CT-001',
        name: 'GE Revolution CT',
        type: 'CT',
        location: 'Main Hospital - CT Room 1',
        nextQCDue: '2024-01-10',
        lastQC: { date: '2024-01-03' }
      },
      {
        machineId: 'PET-001',
        name: 'Philips Vereos PET-CT',
        type: 'PET-CT',
        location: 'Nuclear Medicine - PET Suite A',
        nextQCDue: '2024-01-08',
        lastQC: { date: '2024-01-01' }
      },
      {
        machineId: 'MRI-002',
        name: 'Philips Ingenia 1.5T',
        type: 'MRI',
        location: 'Outpatient Center - MRI Room 2',
        nextQCDue: '2024-01-09',
        lastQC: { date: '2024-01-02' }
      },
      {
        machineId: 'CT-002',
        name: 'Siemens SOMATOM Force',
        type: 'CT',
        location: 'Emergency Department - Trauma CT',
        nextQCDue: '2024-01-04',
        lastQC: { date: '2024-01-03' }
      }
    ];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const dueTasks = {
      dailyOverdue: [],
      dailyDueToday: [],
      monthlyOverdue: [],
      monthlyDueThisMonth: [],
      quarterlyOverdue: [],
      quarterlyDueThisQuarter: [],
      annualOverdue: [],
      annualDueThisYear: []
    };

    // Check each machine for due tasks
    for (const machine of machines) {
      // Get QC history for this machine
      const qcHistory = generateQCHistory(machine.type, machine.machineId);
      
      // Check daily QC status
      const todayQC = qcHistory.daily.find(qc => qc.date === todayStr);
      const dayOfWeek = today.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // For demo purposes, always check daily QC regardless of weekend
      if (!todayQC) {
        // Check if overdue (should have been done on previous working days)
        let daysOverdue = 0;
        let checkDate = new Date(today);
        
        while (daysOverdue < 5) { // Check last 5 days
          checkDate.setDate(checkDate.getDate() - 1);
          const checkDayOfWeek = checkDate.getDay();
          
          if (checkDayOfWeek !== 0 && checkDayOfWeek !== 6) { // Skip weekends
            const checkDateStr = checkDate.toISOString().split('T')[0];
            const qcExists = qcHistory.daily.find(qc => qc.date === checkDateStr);
            
            if (!qcExists) {
              daysOverdue++;
            } else {
              break; // Found the last QC, stop counting
            }
          }
        }

        const taskData = {
          machineId: machine.machineId,
          machineName: machine.name,
          type: machine.type,
          location: machine.location,
          daysOverdue: daysOverdue,
          nextDue: todayStr,
          lastQC: machine.lastQC?.date,
          priority: daysOverdue >= 3 ? 'critical' : daysOverdue >= 1 ? 'high' : 'medium'
        };

        if (daysOverdue > 0) {
          dueTasks.dailyOverdue.push(taskData);
        } else {
          dueTasks.dailyDueToday.push(taskData);
        }
      }

      // Check monthly QC status
      const currentMonthQC = qcHistory.monthly.find(qc => {
        const qcDate = new Date(qc.date);
        return qcDate.getMonth() === currentMonth && qcDate.getFullYear() === currentYear;
      });

      if (!currentMonthQC) {
        // Check if overdue (past months)
        let monthsOverdue = 0;
        let checkDate = new Date(currentYear, currentMonth - 1, 1);
        
        for (let i = 1; i <= 6; i++) { // Check last 6 months
          const qcExists = qcHistory.monthly.find(qc => {
            const qcDate = new Date(qc.date);
            return qcDate.getMonth() === checkDate.getMonth() && 
                   qcDate.getFullYear() === checkDate.getFullYear();
          });
          
          if (!qcExists) {
            monthsOverdue++;
          } else {
            break;
          }
          
          checkDate.setMonth(checkDate.getMonth() - 1);
        }

        const taskData = {
          machineId: machine.machineId,
          machineName: machine.name,
          type: machine.type,
          location: machine.location,
          daysOverdue: monthsOverdue * 30, // Approximate for display
          nextDue: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          lastQC: machine.lastQC?.date,
          priority: monthsOverdue >= 2 ? 'critical' : monthsOverdue >= 1 ? 'high' : 'medium'
        };

        if (monthsOverdue > 0) {
          dueTasks.monthlyOverdue.push(taskData);
        } else {
          dueTasks.monthlyDueThisMonth.push(taskData);
        }
      }

      // Check quarterly QC status
      const currentQuarter = Math.floor(currentMonth / 3);
      const currentQuarterQC = qcHistory.quarterly?.find(qc => {
        const qcDate = new Date(qc.date);
        const qcQuarter = Math.floor(qcDate.getMonth() / 3);
        return qcQuarter === currentQuarter && qcDate.getFullYear() === currentYear;
      });

      if (!currentQuarterQC && qcHistory.quarterly) {
        // Check if overdue (past quarters)
        let quartersOverdue = 0;
        let checkYear = currentYear;
        let checkQuarter = currentQuarter - 1;
        
        for (let i = 1; i <= 4; i++) { // Check last 4 quarters
          if (checkQuarter < 0) {
            checkQuarter = 3;
            checkYear--;
          }
          
          const qcExists = qcHistory.quarterly.find(qc => {
            const qcDate = new Date(qc.date);
            const qcQuarter = Math.floor(qcDate.getMonth() / 3);
            return qcQuarter === checkQuarter && qcDate.getFullYear() === checkYear;
          });
          
          if (!qcExists) {
            quartersOverdue++;
          } else {
            break;
          }
          
          checkQuarter--;
        }

        const taskData = {
          machineId: machine.machineId,
          machineName: machine.name,
          type: machine.type,
          location: machine.location,
          daysOverdue: quartersOverdue * 90, // Approximate for display
          nextDue: new Date(currentYear, currentQuarter * 3, 1).toISOString().split('T')[0],
          lastQC: machine.lastQC?.date,
          priority: quartersOverdue >= 2 ? 'critical' : quartersOverdue >= 1 ? 'high' : 'medium'
        };

        if (quartersOverdue > 0) {
          dueTasks.quarterlyOverdue.push(taskData);
        } else {
          dueTasks.quarterlyDueThisQuarter.push(taskData);
        }
      }

      // Check annual QC status
      const currentYearQC = qcHistory.annual?.find(qc => {
        const qcDate = new Date(qc.date);
        return qcDate.getFullYear() === currentYear;
      });

      if (!currentYearQC && qcHistory.annual) {
        // Check if overdue (past years)
        let yearsOverdue = 0;
        
        for (let i = 1; i <= 3; i++) { // Check last 3 years
          const checkYear = currentYear - i;
          const qcExists = qcHistory.annual.find(qc => {
            const qcDate = new Date(qc.date);
            return qcDate.getFullYear() === checkYear;
          });
          
          if (!qcExists) {
            yearsOverdue++;
          } else {
            break;
          }
        }

        const taskData = {
          machineId: machine.machineId,
          machineName: machine.name,
          type: machine.type,
          location: machine.location,
          daysOverdue: yearsOverdue * 365, // Approximate for display
          nextDue: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          lastQC: machine.lastQC?.date,
          priority: yearsOverdue >= 2 ? 'critical' : yearsOverdue >= 1 ? 'high' : 'medium'
        };

        if (yearsOverdue > 0) {
          dueTasks.annualOverdue.push(taskData);
        } else {
          dueTasks.annualDueThisYear.push(taskData);
        }
      }
    }

    res.json(dueTasks);
  } catch (error) {
    console.error('Error getting due tasks:', error);
    res.status(500).json({ error: 'Failed to get due tasks' });
  }
});

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

// Submit QC data
router.post('/submit', (req, res) => {
  try {
    const qcData = req.body;
    
    // In a real implementation, this would save to database
    console.log('QC Data submitted:', qcData);
    
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'QC data submitted successfully',
      id: Date.now().toString()
    });
    
  } catch (error) {
    console.error('Error submitting QC data:', error);
    res.status(500).json({ error: 'Failed to submit QC data' });
  }
});

module.exports = router;