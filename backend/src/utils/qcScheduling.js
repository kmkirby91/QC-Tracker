// QC Scheduling and Due Date Calculation Utilities
// Provides consistent due date logic for QC tracker system

/**
 * Generate all QC due periods from start date to today based on frequency
 * For monthly/quarterly/annual, returns periods rather than exact dates
 * @param {string} frequency - 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
 * @param {string} startDate - ISO date string when QC started (YYYY-MM-DD)
 * @param {string} [endDate] - ISO date string to generate dates until (defaults to today)
 * @returns {array} - Array of due periods. For daily/weekly: dates ['YYYY-MM-DD']. For monthly+: periods ['YYYY-MM' or 'YYYY-Q1']
 */
const generateQCDueDates = (frequency, startDate, endDate = null) => {
  const dueDates = [];
  const start = new Date(startDate);
  // If no end date specified, generate up to 30 days in the future to include today and upcoming QC
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  let currentDue = new Date(start);
  
  while (currentDue <= end) {
    switch (frequency) {
      case 'daily':
        // Daily QC is due on weekdays only (skip weekends)
        // Use UTC to avoid timezone issues
        const dateStr = currentDue.toISOString().split('T')[0];
        const utcDate = new Date(dateStr + 'T12:00:00.000Z'); // Force noon UTC to avoid timezone edge cases
        const dayOfWeek = utcDate.getUTCDay();
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dueDates.push(dateStr);
        }
        currentDue.setDate(currentDue.getDate() + 1);
        break;
        
      case 'weekly':
        dueDates.push(currentDue.toISOString().split('T')[0]);
        currentDue.setDate(currentDue.getDate() + 7);
        break;
        
      case 'monthly':
        // For monthly QC, use YYYY-MM format to represent the month
        const monthStr = currentDue.toISOString().slice(0, 7); // 'YYYY-MM'
        if (!dueDates.includes(monthStr)) {
          dueDates.push(monthStr);
        }
        currentDue.setMonth(currentDue.getMonth() + 1);
        break;
        
      case 'quarterly':
        // For quarterly QC, use YYYY-Q# format to represent the quarter
        const year = currentDue.getFullYear();
        const quarter = Math.floor(currentDue.getMonth() / 3) + 1;
        const quarterStr = `${year}-Q${quarter}`;
        if (!dueDates.includes(quarterStr)) {
          dueDates.push(quarterStr);
        }
        currentDue.setMonth(currentDue.getMonth() + 3);
        break;
        
      case 'annual':
        // For annual QC, use YYYY format to represent the year
        const yearStr = currentDue.getFullYear().toString();
        if (!dueDates.includes(yearStr)) {
          dueDates.push(yearStr);
        }
        currentDue.setFullYear(currentDue.getFullYear() + 1);
        break;
        
      default:
        // Safety break for unknown frequencies
        break;
    }
    
    // Safety break to prevent infinite loops
    if (dueDates.length > 1000) {
      console.warn(`QC due date generation stopped at 1000 dates for frequency ${frequency}`);
      break;
    }
  }
  
  return dueDates;
};

/**
 * Calculate the next due period for a QC worksheet based on frequency and start date
 * Returns different formats based on frequency: dates for daily/weekly, periods for monthly+
 * @param {string} frequency - 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
 * @param {string} startDate - ISO date string when QC started (YYYY-MM-DD)
 * @param {string} [lastCompletedDate] - ISO date string of last completed QC (optional)
 * @returns {object} - { nextDue: string, isOverdue: boolean, daysOverdue: number, isDueThisPeriod: boolean }
 */
const calculateNextDueDate = (frequency, startDate, lastCompletedDate = null) => {
  const today = new Date();
  const start = new Date(startDate);
  let nextDue = new Date(startDate);
  
  // If we have a last completed date, calculate from that instead
  if (lastCompletedDate) {
    nextDue = new Date(lastCompletedDate);
  }
  
  let nextDueStr = '';
  let isOverdue = false;
  let daysOverdue = 0;
  let isDueThisPeriod = false;
  
  switch (frequency) {
    case 'daily':
      // Daily QC is due on weekdays only
      if (lastCompletedDate) {
        nextDue.setDate(nextDue.getDate() + 1);
      }
      // Skip weekends - if due date falls on weekend, move to Monday
      while (nextDue.getDay() === 0 || nextDue.getDay() === 6) {
        nextDue.setDate(nextDue.getDate() + 1);
      }
      nextDueStr = nextDue.toISOString().split('T')[0];
      
      // Calculate if overdue by days
      const timeDiff = today.getTime() - nextDue.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      isOverdue = daysDiff > 0;
      daysOverdue = isOverdue ? daysDiff : 0;
      isDueThisPeriod = daysDiff === 0; // Due today
      break;
      
    case 'weekly':
      if (lastCompletedDate) {
        nextDue.setDate(nextDue.getDate() + 7);
      }
      nextDueStr = nextDue.toISOString().split('T')[0];
      
      const weekTimeDiff = today.getTime() - nextDue.getTime();
      const weekDaysDiff = Math.ceil(weekTimeDiff / (1000 * 3600 * 24));
      isOverdue = weekDaysDiff > 0;
      daysOverdue = isOverdue ? weekDaysDiff : 0;
      isDueThisPeriod = weekDaysDiff === 0; // Due today
      break;
      
    case 'monthly':
      // For monthly QC, return current month if due this month
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      if (lastCompletedDate) {
        const lastCompleted = new Date(lastCompletedDate);
        nextDue = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth() + 1, 1);
      } else {
        const startMonth = start.getMonth();
        const startYear = start.getFullYear();
        
        // If start month/year is current or past, due this month
        if (startYear < currentYear || (startYear === currentYear && startMonth <= currentMonth)) {
          nextDue = new Date(currentYear, currentMonth, 1);
        } else {
          nextDue = new Date(startYear, startMonth, 1);
        }
      }
      
      nextDueStr = nextDue.toISOString().slice(0, 7); // 'YYYY-MM'
      
      // Check if current month is overdue
      const nextDueMonth = nextDue.getMonth();
      const nextDueYear = nextDue.getFullYear();
      
      isOverdue = currentYear > nextDueYear || (currentYear === nextDueYear && currentMonth > nextDueMonth);
      isDueThisPeriod = currentYear === nextDueYear && currentMonth === nextDueMonth;
      
      if (isOverdue) {
        // Calculate months overdue
        const monthsOverdue = (currentYear - nextDueYear) * 12 + (currentMonth - nextDueMonth);
        daysOverdue = monthsOverdue * 30; // Approximate days for display
      }
      break;
      
    case 'quarterly':
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const currentYearQ = today.getFullYear();
      
      if (lastCompletedDate) {
        const lastCompleted = new Date(lastCompletedDate);
        const lastQuarter = Math.floor(lastCompleted.getMonth() / 3);
        let nextQuarter = lastQuarter + 1;
        let nextQuarterYear = lastCompleted.getFullYear();
        
        if (nextQuarter > 3) {
          nextQuarter = 0;
          nextQuarterYear += 1;
        }
        
        nextDueStr = `${nextQuarterYear}-Q${nextQuarter + 1}`;
      } else {
        const startQuarter = Math.floor(start.getMonth() / 3);
        const startYearQ = start.getFullYear();
        
        if (startYearQ < currentYearQ || (startYearQ === currentYearQ && startQuarter <= currentQuarter)) {
          nextDueStr = `${currentYearQ}-Q${currentQuarter + 1}`;
        } else {
          nextDueStr = `${startYearQ}-Q${startQuarter + 1}`;
        }
      }
      
      // Parse next due quarter for comparison
      const [nextYearStr, nextQuarterStr] = nextDueStr.split('-Q');
      const nextYear = parseInt(nextYearStr);
      const nextQtr = parseInt(nextQuarterStr) - 1;
      
      isOverdue = currentYearQ > nextYear || (currentYearQ === nextYear && currentQuarter > nextQtr);
      isDueThisPeriod = currentYearQ === nextYear && currentQuarter === nextQtr;
      
      if (isOverdue) {
        const quartersOverdue = (currentYearQ - nextYear) * 4 + (currentQuarter - nextQtr);
        daysOverdue = quartersOverdue * 90; // Approximate days for display
      }
      break;
      
    case 'annual':
      const currentYearA = today.getFullYear();
      
      if (lastCompletedDate) {
        const lastCompleted = new Date(lastCompletedDate);
        nextDueStr = (lastCompleted.getFullYear() + 1).toString();
      } else {
        const startYearA = start.getFullYear();
        nextDueStr = startYearA <= currentYearA ? currentYearA.toString() : startYearA.toString();
      }
      
      const nextDueYearA = parseInt(nextDueStr);
      isOverdue = currentYearA > nextDueYearA;
      isDueThisPeriod = currentYearA === nextDueYearA;
      
      if (isOverdue) {
        daysOverdue = (currentYearA - nextDueYearA) * 365; // Approximate days for display
      }
      break;
  }
  
  return {
    nextDue: nextDueStr,
    isOverdue,
    daysOverdue,
    isDueThisPeriod
  };
};

/**
 * Get all missed QC periods for a worksheet between start date and current date
 * Handles different period formats based on frequency
 * @param {string} frequency 
 * @param {string} startDate 
 * @param {Array} completedDates - Array of completed QC dates/periods
 * @returns {Array} Array of missed periods
 */
const getMissedQCDates = (frequency, startDate, completedDates = []) => {
  const today = new Date();
  const start = new Date(startDate);
  const completed = completedDates.map(date => {
    // Normalize completed dates based on frequency
    if (frequency === 'monthly') {
      return date.slice(0, 7); // YYYY-MM
    } else if (frequency === 'quarterly') {
      const qDate = new Date(date);
      const quarter = Math.floor(qDate.getMonth() / 3) + 1;
      return `${qDate.getFullYear()}-Q${quarter}`;
    } else if (frequency === 'annual') {
      return new Date(date).getFullYear().toString();
    } else {
      return date.split('T')[0]; // YYYY-MM-DD for daily/weekly
    }
  });
  
  const missed = [];
  let currentDue = new Date(start);
  
  while (currentDue <= today) {
    let duePeriodStr = '';
    let shouldCheck = false;
    
    switch (frequency) {
      case 'daily':
        // Skip weekends for daily QC
        if (currentDue.getDay() !== 0 && currentDue.getDay() !== 6) {
          duePeriodStr = currentDue.toISOString().split('T')[0];
          shouldCheck = currentDue < today; // Past due dates only
        }
        currentDue.setDate(currentDue.getDate() + 1);
        break;
        
      case 'weekly':
        duePeriodStr = currentDue.toISOString().split('T')[0];
        shouldCheck = currentDue < today; // Past due dates only
        currentDue.setDate(currentDue.getDate() + 7);
        break;
        
      case 'monthly':
        duePeriodStr = currentDue.toISOString().slice(0, 7); // YYYY-MM
        shouldCheck = currentDue.getMonth() < today.getMonth() || currentDue.getFullYear() < today.getFullYear();
        currentDue.setMonth(currentDue.getMonth() + 1);
        break;
        
      case 'quarterly':
        const quarter = Math.floor(currentDue.getMonth() / 3) + 1;
        duePeriodStr = `${currentDue.getFullYear()}-Q${quarter}`;
        const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
        shouldCheck = currentDue.getFullYear() < today.getFullYear() || 
          (currentDue.getFullYear() === today.getFullYear() && quarter < currentQuarter);
        currentDue.setMonth(currentDue.getMonth() + 3);
        break;
        
      case 'annual':
        duePeriodStr = currentDue.getFullYear().toString();
        shouldCheck = currentDue.getFullYear() < today.getFullYear();
        currentDue.setFullYear(currentDue.getFullYear() + 1);
        break;
    }
    
    // Check if this period was completed and if it's overdue
    if (shouldCheck && duePeriodStr && !completed.includes(duePeriodStr)) {
      let daysOverdue = 0;
      
      // Calculate days overdue based on frequency type
      if (frequency === 'daily' || frequency === 'weekly') {
        const dueDate = new Date(duePeriodStr);
        daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      } else if (frequency === 'monthly') {
        const [year, month] = duePeriodStr.split('-');
        const dueMonthEnd = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
        daysOverdue = Math.ceil((today.getTime() - dueMonthEnd.getTime()) / (1000 * 3600 * 24));
      } else if (frequency === 'quarterly') {
        const [year, quarterStr] = duePeriodStr.split('-Q');
        const quarterNum = parseInt(quarterStr);
        const quarterEndMonth = quarterNum * 3 - 1; // 0-based month index
        const quarterEnd = new Date(parseInt(year), quarterEndMonth + 1, 0); // Last day of quarter
        daysOverdue = Math.ceil((today.getTime() - quarterEnd.getTime()) / (1000 * 3600 * 24));
      } else if (frequency === 'annual') {
        const yearEnd = new Date(parseInt(duePeriodStr), 11, 31); // Dec 31 of the year
        daysOverdue = Math.ceil((today.getTime() - yearEnd.getTime()) / (1000 * 3600 * 24));
      }
      
      if (daysOverdue > 0) {
        missed.push({
          dueDate: duePeriodStr,
          daysOverdue,
          frequency
        });
      }
    }
  }
  
  return missed;
};

/**
 * Check if a machine has an active worksheet assigned
 * @param {string} machineId 
 * @param {string} frequency 
 * @returns {object} - { hasWorksheet: boolean, worksheet: object | null, startDate: string | null }
 */
const checkWorksheetAssignment = (machineId, frequency) => {
  try {
    // Check localStorage for assigned worksheets
    const storedWorksheets = localStorage.getItem('qcWorksheets');
    if (!storedWorksheets) {
      return { hasWorksheet: false, worksheet: null, startDate: null };
    }
    
    const worksheets = JSON.parse(storedWorksheets);
    const assignedWorksheet = worksheets.find(ws => 
      ws.assignedMachines && 
      ws.assignedMachines.includes(machineId) &&
      ws.frequency === frequency &&
      ws.isWorksheet === true // Only actual worksheets, not templates
    );
    
    if (assignedWorksheet) {
      return {
        hasWorksheet: true,
        worksheet: assignedWorksheet,
        startDate: assignedWorksheet.startDate
      };
    }
    
    return { hasWorksheet: false, worksheet: null, startDate: null };
  } catch (error) {
    console.error('Error checking worksheet assignment:', error);
    return { hasWorksheet: false, worksheet: null, startDate: null };
  }
};

/**
 * Get QC priority level based on overdue status and frequency type
 * Accounts for different urgency levels based on QC frequency
 * @param {number} daysOverdue 
 * @param {string} frequency 
 * @returns {string} - 'critical', 'high', 'medium', 'low'
 */
const getQCPriority = (daysOverdue, frequency) => {
  if (daysOverdue === 0) return 'medium'; // Due today/this period
  
  switch (frequency) {
    case 'daily':
      // Daily QC is critical for safety - short escalation times
      if (daysOverdue >= 5) return 'critical';  // 1 week+ overdue
      if (daysOverdue >= 3) return 'high';      // 3+ days overdue
      if (daysOverdue >= 1) return 'medium';    // 1+ days overdue
      return 'low';
      
    case 'weekly':
      // Weekly QC - moderate escalation
      if (daysOverdue >= 14) return 'critical'; // 2+ weeks overdue
      if (daysOverdue >= 7) return 'high';      // 1+ weeks overdue
      if (daysOverdue >= 3) return 'medium';    // Few days into next week
      return 'low';
      
    case 'monthly':
      // Monthly QC - due "this month", so overdue means past month end
      // Much more lenient since it's period-based, not date-based
      if (daysOverdue >= 90) return 'critical'; // 3+ months overdue
      if (daysOverdue >= 60) return 'high';     // 2+ months overdue  
      if (daysOverdue >= 30) return 'medium';   // 1+ months overdue
      return 'low';
      
    case 'quarterly':
      // Quarterly QC - due "this quarter"
      if (daysOverdue >= 270) return 'critical'; // 9+ months overdue (3+ quarters)
      if (daysOverdue >= 180) return 'high';     // 6+ months overdue (2+ quarters)
      if (daysOverdue >= 90) return 'medium';    // 3+ months overdue (1+ quarter)
      return 'low';
      
    case 'annual':
      // Annual QC - due "this year"
      if (daysOverdue >= 1095) return 'critical'; // 3+ years overdue
      if (daysOverdue >= 730) return 'high';      // 2+ years overdue
      if (daysOverdue >= 365) return 'medium';    // 1+ years overdue
      return 'low';
      
    default:
      return 'low';
  }
};

/**
 * Generate realistic sample worksheet assignments with proper start dates
 * This creates a consistent set of assigned worksheets for demo purposes
 * UPDATED: Now returns empty by default - assignments should come from actual worksheet data
 */
const generateSampleWorksheetAssignments = () => {
  // Return empty assignments by default
  // Real worksheet assignments should be fetched from the database or localStorage
  console.log('generateSampleWorksheetAssignments: Returning empty assignments - use real worksheet data instead');
  return [];
  
  // Legacy sample assignments (commented out to prevent false due dates)
  /*
  const assignments = [];
  
  assignments.push({
    id: 'ws-ct-daily-001',
    machineId: 'CT-GON-001',
    frequency: 'daily',
    modality: 'CT',
    title: 'ACR CT Daily QC Protocol',
    startDate: '2024-01-15',
    endDate: null,
    hasEndDate: false
  });
  
  // Other sample assignments...
  
  return assignments;
  */
};

/**
 * Get QC status for a worksheet including all due periods and completion status
 * Handles period-based scheduling for different frequencies
 * @param {string} machineId - Machine ID
 * @param {string} frequency - QC frequency
 * @param {string} startDate - Worksheet start date (YYYY-MM-DD)
 * @param {array} completedDates - Array of completed QC dates ['YYYY-MM-DD', ...]
 * @returns {object} - { duePeriods: [], missedPeriods: [], completedDates: [], nextDue: string, overdueCount: number }
 */
const getWorksheetQCStatus = (machineId, frequency, startDate, completedDates = []) => {
  const allDuePeriods = generateQCDueDates(frequency, startDate);
  const missedPeriods = getMissedQCDates(frequency, startDate, completedDates);
  
  // Calculate next due period
  const nextDue = calculateNextDueDate(frequency, startDate, 
    completedDates.length > 0 ? completedDates[completedDates.length - 1] : null);
  
  // Normalize completed dates to match the period format
  const normalizedCompleted = completedDates.map(date => {
    if (frequency === 'monthly') {
      return date.slice(0, 7); // YYYY-MM
    } else if (frequency === 'quarterly') {
      const qDate = new Date(date);
      const quarter = Math.floor(qDate.getMonth() / 3) + 1;
      return `${qDate.getFullYear()}-Q${quarter}`;
    } else if (frequency === 'annual') {
      return new Date(date).getFullYear().toString();
    } else {
      return date.split('T')[0]; // YYYY-MM-DD for daily/weekly
    }
  });
  
  // Calculate completion rate based on periods that have passed
  let totalDuePeriods = 0;
  const today = new Date();
  
  if (frequency === 'daily' || frequency === 'weekly') {
    totalDuePeriods = allDuePeriods.filter(period => new Date(period) <= today).length;
  } else if (frequency === 'monthly') {
    const currentYearMonth = today.toISOString().slice(0, 7);
    totalDuePeriods = allDuePeriods.filter(period => period <= currentYearMonth).length;
  } else if (frequency === 'quarterly') {
    const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
    const currentYearQuarter = `${today.getFullYear()}-Q${currentQuarter}`;
    totalDuePeriods = allDuePeriods.filter(period => period <= currentYearQuarter).length;
  } else if (frequency === 'annual') {
    const currentYear = today.getFullYear().toString();
    totalDuePeriods = allDuePeriods.filter(period => period <= currentYear).length;
  }
  
  const completionRate = totalDuePeriods > 0 ? 
    (normalizedCompleted.length / totalDuePeriods * 100).toFixed(1) : 0;
  
  return {
    duePeriods: allDuePeriods,
    missedPeriods: missedPeriods,
    completedDates: completedDates,
    normalizedCompleted: normalizedCompleted,
    nextDue: nextDue.nextDue,
    isOverdue: nextDue.isOverdue,
    daysOverdue: nextDue.daysOverdue,
    isDueThisPeriod: nextDue.isDueThisPeriod,
    overdueCount: missedPeriods.length,
    totalDueToDate: totalDuePeriods,
    completionRate: completionRate,
    frequency: frequency
  };
};

/**
 * Get all overdue QC items across the system
 * @param {array} completions - Array of all QC completions from persistent storage
 * @returns {object} - { total: number, byMachine: {}, byFrequency: {}, critical: [] }
 */
const getSystemOverdueStatus = (completions = []) => {
  const assignments = generateSampleWorksheetAssignments();
  const overdueItems = [];
  const today = new Date().toISOString().split('T')[0];
  
  assignments.forEach(assignment => {
    // Get completions for this specific machine/worksheet combination
    const worksheetCompletions = completions
      .filter(qc => 
        qc.machineId === assignment.machineId && 
        qc.frequency === assignment.frequency
      )
      .map(qc => qc.date)
      .sort();
    
    // Get QC status for this worksheet
    const status = getWorksheetQCStatus(
      assignment.machineId,
      assignment.frequency,
      assignment.startDate,
      worksheetCompletions
    );
    
    // Add overdue items
    if (status.overdueCount > 0) {
      status.missedDates.forEach((missedDate, index) => {
        const daysPastDue = Math.ceil((new Date(today) - new Date(missedDate)) / (1000 * 60 * 60 * 24));
        const priority = getQCPriority(daysPastDue, assignment.frequency);
        
        overdueItems.push({
          machineId: assignment.machineId,
          frequency: assignment.frequency,
          worksheetId: assignment.id,
          worksheetTitle: assignment.title,
          dueDate: missedDate,
          daysPastDue: daysPastDue,
          priority: priority,
          isCritical: priority === 'critical'
        });
      });
    }
  });
  
  // Organize overdue items
  const byMachine = {};
  const byFrequency = {};
  const critical = [];
  
  overdueItems.forEach(item => {
    // By machine
    if (!byMachine[item.machineId]) {
      byMachine[item.machineId] = [];
    }
    byMachine[item.machineId].push(item);
    
    // By frequency
    if (!byFrequency[item.frequency]) {
      byFrequency[item.frequency] = [];
    }
    byFrequency[item.frequency].push(item);
    
    // Critical items
    if (item.isCritical) {
      critical.push(item);
    }
  });
  
  return {
    total: overdueItems.length,
    items: overdueItems.sort((a, b) => b.daysPastDue - a.daysPastDue), // Sort by most overdue first
    byMachine,
    byFrequency,
    critical: critical.sort((a, b) => b.daysPastDue - a.daysPastDue),
    summary: {
      criticalCount: critical.length,
      highCount: overdueItems.filter(item => item.priority === 'high').length,
      mediumCount: overdueItems.filter(item => item.priority === 'medium').length,
      lowCount: overdueItems.filter(item => item.priority === 'low').length
    }
  };
};

module.exports = {
  calculateNextDueDate,
  getMissedQCDates,
  checkWorksheetAssignment,
  getQCPriority,
  generateSampleWorksheetAssignments,
  generateQCDueDates,
  getWorksheetQCStatus,
  getSystemOverdueStatus
};