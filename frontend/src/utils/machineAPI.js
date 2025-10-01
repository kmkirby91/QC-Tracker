// Utility functions for fetching machine data with worksheet awareness
import axios from 'axios';

/**
 * Fetch all machines with worksheet assignments applied
 * @returns {Promise<Array>} Array of machine objects with QC data based on worksheet assignments
 */
export const fetchMachinesWithWorksheets = async () => {
  try {
    // Get worksheet assignments from localStorage
    const worksheetsData = localStorage.getItem('qcWorksheets');
    let worksheets = [];
    
    try {
      worksheets = worksheetsData ? JSON.parse(worksheetsData) : [];
      console.log('📋 machineAPI: Loaded', worksheets.length, 'worksheets from localStorage');
    } catch (parseError) {
      console.warn('Corrupt worksheet data found, clearing localStorage:', parseError);
      localStorage.removeItem('qcWorksheets');
      worksheets = [];
    }
    
    // Validate worksheet data structure
    if (worksheets.length > 0) {
      const validWorksheets = worksheets.filter(w => {
        const isValid = w && typeof w === 'object' && w.id && w.modality;
        if (!isValid) {
          console.warn('🚨 Invalid worksheet found:', w);
        }
        return isValid;
      });
      
      if (validWorksheets.length !== worksheets.length) {
        console.warn(`🚨 Filtered out ${worksheets.length - validWorksheets.length} invalid worksheets`);
        localStorage.setItem('qcWorksheets', JSON.stringify(validWorksheets));
        worksheets = validWorksheets;
      }
    }
    
    if (worksheets.length > 0) {
      try {
        console.log('📡 machineAPI: Sending', worksheets.length, 'worksheets to backend');
        // Send worksheets to backend to get updated machine data
        const response = await axios.post('/api/machines/update-from-worksheets', {
          worksheets: worksheets
        });
        console.log('✅ machineAPI: Successfully received', response.data.length, 'machines from backend');
        return response.data;
      } catch (worksheetError) {
        console.warn('Error with worksheet data, falling back to basic machines:', worksheetError);
        console.warn('Failed request data:', { worksheetsCount: worksheets.length });
        
        // Don't clear worksheets on network errors, only on data corruption
        if (worksheetError.response && worksheetError.response.status === 400) {
          console.warn('Backend rejected worksheet data - clearing localStorage');
          localStorage.removeItem('qcWorksheets');
        }
        
        const response = await axios.get('/api/machines');
        return response.data;
      }
    } else {
      // No worksheets assigned - get base machine data (no QC due dates)
      console.log('📋 machineAPI: No worksheets found, getting base machine data');
      const response = await axios.get('/api/machines');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching machines with worksheets:', error);
    // Try one more fallback to basic machines
    try {
      console.log('🔄 machineAPI: Attempting final fallback to basic machines');
      const response = await axios.get('/api/machines');
      return response.data;
    } catch (fallbackError) {
      console.error('Complete failure to load machines:', fallbackError);
      throw new Error('Failed to load machines: ' + (error.message || 'Unknown error'));
    }
  }
};

/**
 * Fetch a specific machine by ID with worksheet assignments applied
 * @param {string} machineId - The machine ID to fetch
 * @returns {Promise<Object>} Machine object with QC data based on worksheet assignments
 */
export const fetchMachineWithWorksheets = async (machineId) => {
  try {
    // Get worksheet assignments from localStorage
    const worksheetsData = localStorage.getItem('qcWorksheets');
    let worksheets = [];
    
    try {
      worksheets = worksheetsData ? JSON.parse(worksheetsData) : [];
      console.log(`📋 machineAPI: Loaded ${worksheets.length} worksheets for machine ${machineId}`);
    } catch (parseError) {
      console.warn('Corrupt worksheet data found, clearing localStorage:', parseError);
      localStorage.removeItem('qcWorksheets');
      worksheets = [];
    }
    
    // Validate worksheet data structure
    if (worksheets.length > 0) {
      const validWorksheets = worksheets.filter(w => {
        const isValid = w && typeof w === 'object' && w.id && w.modality;
        if (!isValid) {
          console.warn('🚨 Invalid worksheet found:', w);
        }
        return isValid;
      });
      
      if (validWorksheets.length !== worksheets.length) {
        console.warn(`🚨 Filtered out ${worksheets.length - validWorksheets.length} invalid worksheets`);
        localStorage.setItem('qcWorksheets', JSON.stringify(validWorksheets));
        worksheets = validWorksheets;
      }
    }
    
    if (worksheets.length > 0) {
      try {
        console.log(`📡 machineAPI: Sending ${worksheets.length} worksheets to backend for machine ${machineId}`);
        // Send worksheets to backend to get updated machine data
        const allMachinesRes = await axios.post('/api/machines/update-from-worksheets', {
          worksheets: worksheets
        });
        // Find our specific machine in the response
        const machineData = allMachinesRes.data.find(m => m.machineId === machineId);
        if (!machineData) {
          throw new Error(`Machine ${machineId} not found in response`);
        }
        console.log(`✅ machineAPI: Successfully got machine ${machineId} data`);
        return machineData;
      } catch (worksheetError) {
        console.warn('Error with worksheet data, falling back to basic machine:', worksheetError);
        console.warn('Failed request data:', { machineId, worksheetsCount: worksheets.length });
        
        // Don't clear worksheets on network errors, only on data corruption
        if (worksheetError.response && worksheetError.response.status === 400) {
          console.warn('Backend rejected worksheet data - clearing localStorage');
          localStorage.removeItem('qcWorksheets');
        }
        
        const response = await axios.get(`/api/machines/${machineId}`);
        return response.data;
      }
    } else {
      // No worksheets - get base machine data
      console.log(`📋 machineAPI: No worksheets found, getting base machine ${machineId} data`);
      const response = await axios.get(`/api/machines/${machineId}`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching machine ${machineId} with worksheets:`, error);
    // Try one more fallback to basic machine
    try {
      console.log(`🔄 machineAPI: Attempting final fallback for machine ${machineId}`);
      const response = await axios.get(`/api/machines/${machineId}`);
      return response.data;
    } catch (fallbackError) {
      console.error(`Complete failure to load machine ${machineId}:`, fallbackError);
      throw new Error(`Failed to load machine ${machineId}: ` + (error.message || 'Unknown error'));
    }
  }
};

/**
 * Check if a machine has any worksheets assigned
 * @param {string} machineId - The machine ID to check
 * @returns {boolean} True if machine has worksheets assigned
 */
export const machineHasWorksheets = (machineId) => {
  try {
    const worksheetsData = localStorage.getItem('qcWorksheets');
    const worksheets = worksheetsData ? JSON.parse(worksheetsData) : [];
    
    return worksheets.some(worksheet => 
      worksheet.isWorksheet && 
      worksheet.assignedMachines && 
      worksheet.assignedMachines.includes(machineId)
    );
  } catch (error) {
    console.error('Error checking machine worksheets:', error);
    return false;
  }
};

/**
 * Get all worksheets assigned to a specific machine
 * @param {string} machineId - The machine ID
 * @returns {Array} Array of worksheets assigned to the machine
 */
export const getMachineWorksheets = (machineId) => {
  try {
    const worksheetsData = localStorage.getItem('qcWorksheets');
    const worksheets = worksheetsData ? JSON.parse(worksheetsData) : [];
    
    return worksheets.filter(worksheet => 
      worksheet.isWorksheet && 
      worksheet.assignedMachines && 
      worksheet.assignedMachines.includes(machineId)
    );
  } catch (error) {
    console.error('Error getting machine worksheets:', error);
    return [];
  }
};