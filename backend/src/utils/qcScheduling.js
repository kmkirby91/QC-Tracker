// QC Scheduling and Due Date Calculation Utilities
// Provides consistent due date logic for QC tracker system

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
 */
const generateSampleWorksheetAssignments = () => {
  const today = new Date();
  const assignments = [];
  
  // Sample assignments with proper start dates
  assignments.push({
    id: 'ws-ct-daily-001',
    machineId: 'CT-GON-001',
    frequency: 'daily',
    modality: 'CT',
    title: 'ACR CT Daily QC Protocol',
    startDate: '2024-01-15', // Started in January - should have lots of QC history
    endDate: null,
    hasEndDate: false
  });
  
  assignments.push({
    id: 'ws-mri-daily-001', 
    machineId: 'MRI-GON-001',
    frequency: 'daily',
    modality: 'MRI',
    title: 'ACR MR Daily QC Protocol',
    startDate: '2024-02-01', // Started in February
    endDate: null,
    hasEndDate: false
  });
  
  assignments.push({
    id: 'ws-ct-monthly-001',
    machineId: 'CT-GON-001',
    frequency: 'monthly',
    modality: 'CT', 
    title: 'ACR CT Monthly QC Protocol',
    startDate: '2024-01-01', // Started at beginning of year
    endDate: null,
    hasEndDate: false
  });
  
  assignments.push({
    id: 'ws-mammo-daily-001',
    machineId: 'MAMMO-GON-001',
    frequency: 'daily',
    modality: 'Mammography',
    title: 'ACR Mammography Daily QC Protocol', 
    startDate: '2025-01-15', // Started recently - should have some missing QC
    endDate: null,
    hasEndDate: false
  });
  
  assignments.push({
    id: 'ws-pet-weekly-001',
    machineId: 'PET-WOM-001',
    frequency: 'weekly', 
    modality: 'PET',
    title: 'PET Weekly QC Protocol',
    startDate: '2024-12-01', // Started in December
    endDate: null,
    hasEndDate: false
  });
  
  return assignments;
};

module.exports = {
  calculateNextDueDate,
  getMissedQCDates,
  checkWorksheetAssignment,
  getQCPriority,
  generateSampleWorksheetAssignments
};