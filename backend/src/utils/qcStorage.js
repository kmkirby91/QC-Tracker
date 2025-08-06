const fs = require('fs');
const path = require('path');

// File path for storing QC completions
const QC_DATA_FILE = path.join(__dirname, '..', 'data', 'qcCompletions.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(QC_DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load QC completions from file
const loadQCCompletions = () => {
  try {
    ensureDataDirectory();
    if (fs.existsSync(QC_DATA_FILE)) {
      const data = fs.readFileSync(QC_DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading QC completions:', error);
    return [];
  }
};

// Save QC completions to file
const saveQCCompletions = (completions) => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(QC_DATA_FILE, JSON.stringify(completions, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving QC completions:', error);
    return false;
  }
};

// Add a new QC completion
const addQCCompletion = (qcData) => {
  try {
    const completions = loadQCCompletions();
    
    // Remove any existing completion for the same machine/frequency/date to avoid duplicates
    const filteredCompletions = completions.filter(qc => 
      !(qc.machineId === qcData.machineId && 
        qc.frequency === qcData.frequency && 
        qc.date === qcData.date)
    );
    
    // Add the new completion
    const newCompletion = {
      id: qcData.id || Date.now().toString(),
      machineId: qcData.machineId,
      machineType: qcData.machineType,
      frequency: qcData.frequency,
      date: qcData.date,
      tests: qcData.tests,
      performedBy: qcData.performedBy,
      comments: qcData.comments,
      overallResult: qcData.overallResult,
      completedAt: qcData.completedAt || new Date().toISOString(),
      worksheetId: qcData.worksheetId,
      worksheetTitle: qcData.worksheetTitle,
      isRealSubmission: true
    };
    
    filteredCompletions.push(newCompletion);
    
    // Sort by date (newest first)
    filteredCompletions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const success = saveQCCompletions(filteredCompletions);
    return success ? newCompletion : null;
  } catch (error) {
    console.error('Error adding QC completion:', error);
    return null;
  }
};

// Get QC completions for a specific machine
const getQCCompletionsByMachine = (machineId) => {
  const completions = loadQCCompletions();
  // Filter out empty completions and then filter by machine ID
  return completions
    .filter(qc => {
      if (!qc.tests || qc.tests.length === 0) return false;
      // Check if at least one test has a value or result
      return qc.tests.some(test => 
        (test.value && test.value.toString().trim() !== '') || 
        (test.result && test.result.toString().trim() !== '')
      );
    })
    .filter(qc => qc.machineId === machineId);
};

// Get QC completions for a specific machine and frequency
const getQCCompletionsByMachineAndFrequency = (machineId, frequency) => {
  const completions = loadQCCompletions();
  // Filter out empty completions and then filter by machine ID and frequency
  return completions
    .filter(qc => {
      if (!qc.tests || qc.tests.length === 0) return false;
      // Check if at least one test has a value or result
      return qc.tests.some(test => 
        (test.value && test.value.toString().trim() !== '') || 
        (test.result && test.result.toString().trim() !== '')
      );
    })
    .filter(qc => qc.machineId === machineId && qc.frequency === frequency);
};

// Get QC completions for a specific worksheet
const getQCCompletionsByWorksheet = (worksheetId) => {
  const completions = loadQCCompletions();
  // Filter out empty completions and then filter by worksheet ID
  return completions
    .filter(qc => {
      if (!qc.tests || qc.tests.length === 0) return false;
      // Check if at least one test has a value or result
      return qc.tests.some(test => 
        (test.value && test.value.toString().trim() !== '') || 
        (test.result && test.result.toString().trim() !== '')
      );
    })
    .filter(qc => qc.worksheetId === worksheetId);
};

// Get all QC completions
const getAllQCCompletions = () => {
  const completions = loadQCCompletions();
  // Filter out empty completions (records with no actual test values)
  return completions.filter(qc => {
    if (!qc.tests || qc.tests.length === 0) return false;
    // Check if at least one test has a value or result
    return qc.tests.some(test => 
      (test.value && test.value.toString().trim() !== '') || 
      (test.result && test.result.toString().trim() !== '')
    );
  });
};

// Delete QC completion by ID
const deleteQCCompletion = (completionId) => {
  try {
    const completions = loadQCCompletions();
    const filteredCompletions = completions.filter(qc => qc.id !== completionId);
    
    if (filteredCompletions.length === completions.length) {
      return false; // No completion found with that ID
    }
    
    return saveQCCompletions(filteredCompletions);
  } catch (error) {
    console.error('Error deleting QC completion:', error);
    return false;
  }
};

// Update QC completion
const updateQCCompletion = (completionId, updateData) => {
  try {
    const completions = loadQCCompletions();
    const completionIndex = completions.findIndex(qc => qc.id === completionId);
    
    if (completionIndex === -1) {
      return null; // No completion found with that ID
    }
    
    // Update the completion
    completions[completionIndex] = {
      ...completions[completionIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    const success = saveQCCompletions(completions);
    return success ? completions[completionIndex] : null;
  } catch (error) {
    console.error('Error updating QC completion:', error);
    return null;
  }
};

// Get completion dates for a specific machine/worksheet combination
const getCompletionDates = (machineId, worksheetId) => {
  const completions = loadQCCompletions();
  return completions
    .filter(qc => qc.machineId === machineId && qc.worksheetId === worksheetId)
    .map(qc => qc.date)
    .sort();
};

module.exports = {
  loadQCCompletions,
  saveQCCompletions,
  addQCCompletion,
  getQCCompletionsByMachine,
  getQCCompletionsByMachineAndFrequency,
  getQCCompletionsByWorksheet,
  getAllQCCompletions,
  deleteQCCompletion,
  updateQCCompletion,
  getCompletionDates
};