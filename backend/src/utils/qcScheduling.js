// QC Scheduling and Due Date Calculation Utilities
// Provides consistent due date logic for QC tracker system

/**
 * Generate all QC due dates from start date to today based on frequency
 * @param {string} frequency - 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
 * @param {string} startDate - ISO date string when QC started (YYYY-MM-DD)
 * @param {string} [endDate] - ISO date string to generate dates until (defaults to today)
 * @returns {array} - Array of due date strings ['YYYY-MM-DD', ...]
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
        dueDates.push(currentDue.toISOString().split('T')[0]);
        currentDue.setMonth(currentDue.getMonth() + 1);
        break;
        
      case 'quarterly':
        dueDates.push(currentDue.toISOString().split('T')[0]);
        currentDue.setMonth(currentDue.getMonth() + 3);
        break;
        
      case 'annual':
        dueDates.push(currentDue.toISOString().split('T')[0]);
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
 * Calculate the next due date for a QC worksheet based on frequency and start date
 * @param {string} frequency - 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
 * @param {string} startDate - ISO date string when QC started (YYYY-MM-DD)
 * @param {string} [lastCompletedDate] - ISO date string of last completed QC (optional)
 * @returns {object} - { nextDue: 'YYYY-MM-DD', isOverdue: boolean, daysOverdue: number }
 */
const calculateNextDueDate = (frequency, startDate, lastCompletedDate = null) => {
  const today = new Date();
  const start = new Date(startDate);
  let nextDue = new Date(startDate);
  
  // If we have a last completed date, calculate from that instead
  if (lastCompletedDate) {
    nextDue = new Date(lastCompletedDate);
  }
  
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
      break;
      
    case 'weekly':
      if (lastCompletedDate) {
        nextDue.setDate(nextDue.getDate() + 7);
      }
      break;
      
    case 'monthly':
      if (lastCompletedDate) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else {
        // For monthly QC, if start date is in current month, it's due this month
        const currentMonth = today.getMonth();
        const startMonth = start.getMonth();
        if (startMonth === currentMonth) {
          nextDue = new Date(today.getFullYear(), today.getMonth(), start.getDate());
        }
      }
      break;
      
    case 'quarterly':
      if (lastCompletedDate) {
        nextDue.setMonth(nextDue.getMonth() + 3);
      } else {
        // Find which quarter we're in and set due date
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const startQuarter = Math.floor(start.getMonth() / 3);
        if (startQuarter === currentQuarter) {
          nextDue = new Date(today.getFullYear(), currentQuarter * 3, start.getDate());
        }
      }
      break;
      
    case 'annual':
      if (lastCompletedDate) {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      } else {
        // For annual QC, if start year is current year, it's due this year
        if (start.getFullYear() === today.getFullYear()) {
          nextDue = new Date(today.getFullYear(), start.getMonth(), start.getDate());
        }
      }
      break;
  }
  
  // Calculate if overdue and by how many days
  const timeDiff = today.getTime() - nextDue.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  const isOverdue = daysDiff > 0;
  const daysOverdue = isOverdue ? daysDiff : 0;
  
  return {
    nextDue: nextDue.toISOString().split('T')[0],
    isOverdue,
    daysOverdue,
    isDueToday: daysDiff === 0
  };
};

/**
 * Get all due dates for a worksheet between start date and current date
 * @param {string} frequency 
 * @param {string} startDate 
 * @param {Array} completedDates - Array of completed QC dates
 * @returns {Array} Array of missed dates
 */
const getMissedQCDates = (frequency, startDate, completedDates = []) => {
  const today = new Date();
  const start = new Date(startDate);
  const completed = completedDates.map(date => date.split('T')[0]); // Normalize to YYYY-MM-DD
  const missed = [];
  
  let currentDue = new Date(start);
  
  while (currentDue <= today) {
    const dueDateStr = currentDue.toISOString().split('T')[0];
    
    // Check if this due date was completed
    const wasCompleted = completed.includes(dueDateStr);
    
    // If not completed and the date has passed, it's missed
    if (!wasCompleted && currentDue < today) {
      const daysOverdue = Math.ceil((today.getTime() - currentDue.getTime()) / (1000 * 3600 * 24));
      missed.push({
        dueDate: dueDateStr,
        daysOverdue,
        frequency
      });
    }
    
    // Calculate next due date
    switch (frequency) {
      case 'daily':
        currentDue.setDate(currentDue.getDate() + 1);
        // Skip weekends
        while (currentDue.getDay() === 0 || currentDue.getDay() === 6) {
          currentDue.setDate(currentDue.getDate() + 1);
        }
        break;
      case 'weekly':
        currentDue.setDate(currentDue.getDate() + 7);
        break;
      case 'monthly':
        currentDue.setMonth(currentDue.getMonth() + 1);
        break;
      case 'quarterly':
        currentDue.setMonth(currentDue.getMonth() + 3);
        break;
      case 'annual':
        currentDue.setFullYear(currentDue.getFullYear() + 1);
        break;
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
 * Get QC priority level based on overdue status
 * @param {number} daysOverdue 
 * @param {string} frequency 
 * @returns {string} - 'critical', 'high', 'medium', 'low'
 */
const getQCPriority = (daysOverdue, frequency) => {
  if (daysOverdue === 0) return 'medium'; // Due today
  
  switch (frequency) {
    case 'daily':
      if (daysOverdue >= 5) return 'critical';
      if (daysOverdue >= 3) return 'high';
      if (daysOverdue >= 1) return 'medium';
      return 'low';
      
    case 'weekly':
      if (daysOverdue >= 14) return 'critical';
      if (daysOverdue >= 7) return 'high';
      if (daysOverdue >= 3) return 'medium';
      return 'low';
      
    case 'monthly':
      if (daysOverdue >= 60) return 'critical';
      if (daysOverdue >= 30) return 'high';
      if (daysOverdue >= 14) return 'medium';
      return 'low';
      
    case 'quarterly':
      if (daysOverdue >= 180) return 'critical';
      if (daysOverdue >= 90) return 'high';
      if (daysOverdue >= 30) return 'medium';
      return 'low';
      
    case 'annual':
      if (daysOverdue >= 730) return 'critical';
      if (daysOverdue >= 365) return 'high';
      if (daysOverdue >= 90) return 'medium';
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
 * Get QC status for a worksheet including all due dates and completion status
 * @param {string} machineId - Machine ID
 * @param {string} frequency - QC frequency
 * @param {string} startDate - Worksheet start date (YYYY-MM-DD)
 * @param {array} completedDates - Array of completed QC dates ['YYYY-MM-DD', ...]
 * @returns {object} - { dueDates: [], missedDates: [], completedDates: [], nextDue: string, overdueCount: number }
 */
const getWorksheetQCStatus = (machineId, frequency, startDate, completedDates = []) => {
  const allDueDates = generateQCDueDates(frequency, startDate);
  const missedDates = [];
  const today = new Date().toISOString().split('T')[0];
  
  // Find missed QC dates (due dates that are before today and not completed)
  allDueDates.forEach(dueDate => {
    if (dueDate <= today && !completedDates.includes(dueDate)) {
      missedDates.push(dueDate);
    }
  });
  
  // Calculate next due date
  const nextDue = calculateNextDueDate(frequency, startDate, 
    completedDates.length > 0 ? completedDates[completedDates.length - 1] : null);
  
  return {
    dueDates: allDueDates,
    missedDates: missedDates,
    completedDates: completedDates,
    nextDue: nextDue.nextDue,
    isOverdue: nextDue.isOverdue,
    daysOverdue: nextDue.daysOverdue,
    overdueCount: missedDates.length,
    totalDueToDate: allDueDates.filter(date => date <= today).length,
    completionRate: allDueDates.filter(date => date <= today).length > 0 ? 
      (completedDates.length / allDueDates.filter(date => date <= today).length * 100).toFixed(1) : 0
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