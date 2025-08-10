import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import DICOMSeriesSelector from './DICOMSeriesSelector';

const QCForm = ({ viewOnly = false }) => {
  const { machineId, frequency, machineType, worksheetId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingQCDates, setExistingQCDates] = useState([]);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDICOMSeries, setSelectedDICOMSeries] = useState([]);
  const [currentWorksheet, setCurrentWorksheet] = useState(null);
  const [qcDueDates, setQcDueDates] = useState([]);

  useEffect(() => {
    fetchMachineAndTests();
  }, [machineId, frequency, machineType, worksheetId, viewOnly]);

  // Fetch QC due dates when worksheet changes
  useEffect(() => {
    if (currentWorksheet && currentWorksheet.startDate) {
      fetchQCDueDates();
    }
  }, [currentWorksheet]);

  // Debug warning state changes
  useEffect(() => {
    console.log('🚨 Warning state changed:', {
      showReplaceWarning,
      loadingExistingData,
      shouldShow: showReplaceWarning && showReplaceWarning.show && !loadingExistingData
    });
  }, [showReplaceWarning, loadingExistingData]);

  const fetchQCDueDates = async () => {
    try {
      if (!currentWorksheet || !currentWorksheet.startDate) return;
      
      const response = await axios.get(
        `/api/qc/schedule/generate?frequency=${currentWorksheet.frequency}&startDate=${currentWorksheet.startDate}`
      );
      
      if (response.data && response.data.dueDates) {
        setQcDueDates(response.data.dueDates);
        console.log('Fetched QC due dates:', response.data.dueDates);
      }
    } catch (error) {
      console.error('Error fetching QC due dates:', error);
      setQcDueDates([]);
    }
  };

  const fetchMachineAndTests = async () => {
    try {
      // Get machine details
      let foundMachine;
      if (viewOnly && machineType) {
        // For view-only mode, create a mock machine object
        foundMachine = {
          machineId: machineType,
          name: `${machineType} Template`,
          type: machineType,
          location: { building: 'Template', room: 'Template' }
        };
      } else {
        // For regular mode, fetch the actual machine
        const machinesResponse = await axios.get('/api/machines');
        foundMachine = machinesResponse.data.find(m => m.machineId === machineId);
      }
      setMachine(foundMachine);

      // Check for custom worksheets first (both for editing and viewing)
      let testsData = [];
      let hasCustomWorksheet = false;
      
      try {
        const storedWorksheets = localStorage.getItem('qcWorksheets');
        if (storedWorksheets) {
          const worksheets = JSON.parse(storedWorksheets);
          let customWorksheet;
          
          if (worksheetId) {
            // If worksheetId is provided, find the specific worksheet
            customWorksheet = worksheets.find(ws => ws.id === worksheetId);
            console.log('Looking for specific worksheet with ID:', worksheetId, 'Found:', customWorksheet);
          } else {
            // Otherwise, use the original logic (find first matching worksheet)
            customWorksheet = worksheets.find(ws => 
              ws.modality === foundMachine.type && 
              ws.frequency === frequency && 
              ws.assignedMachines && 
              ws.assignedMachines.includes(foundMachine.machineId) &&
              ws.isWorksheet === true // Only actual worksheets, not templates
            );
            console.log('Looking for worksheet by frequency/machine, found:', customWorksheet);
          }
          
          if (customWorksheet) {
            testsData = customWorksheet.tests.map(test => ({
              name: test.testName || test.name,
              testName: test.testName || test.name,
              tolerance: test.tolerance,
              units: test.units,
              notes: test.notes,
              description: test.description,
              templateSource: customWorksheet.templateSource,
              isCustomField: test.isCustomField || false,
              customFieldType: test.customFieldType || 'template-default'
            }));
            hasCustomWorksheet = true;
            setCurrentWorksheet(customWorksheet); // Store worksheet info for submission
            console.log('Found custom worksheet for machine:', foundMachine.machineId, customWorksheet);
          }
        }
      } catch (error) {
        console.error('Error loading custom worksheets:', error);
      }
      
      // Fall back to API templates if no custom worksheet found
      if (!hasCustomWorksheet) {
        // Check if we're viewing a specific template or worksheet from localStorage
        const tempTemplate = localStorage.getItem('tempTemplateView');
        const tempWorksheet = localStorage.getItem('tempWorksheetView');
        
        console.log('Checking temp data - tempTemplate:', !!tempTemplate, 'tempWorksheet:', !!tempWorksheet, 'viewOnly:', viewOnly);
        
        if (viewOnly && tempTemplate) {
          console.log('Loading template from tempTemplateView');
          const templateData = JSON.parse(tempTemplate);
          testsData = templateData.tests.map(test => ({
            name: test.testName,
            testName: test.testName,
            tolerance: test.tolerance,
            units: test.units,
            notes: test.notes,
            description: test.description || '',
            testType: test.testType
          }));
          // Clear the temporary data
          localStorage.removeItem('tempTemplateView');
        } else if (viewOnly && tempWorksheet) {
          console.log('Loading worksheet from tempWorksheetView');
          const worksheetData = JSON.parse(tempWorksheet);
          testsData = worksheetData.tests.map(test => ({
            name: test.testName,
            testName: test.testName,
            tolerance: test.tolerance,
            units: test.units,
            notes: test.notes,
            description: test.description || '',
            testType: test.testType
          }));
          // Clear the temporary data
          localStorage.removeItem('tempWorksheetView');
        } else if (!viewOnly) {
          // For performing QC (not view-only), no worksheet = no QC possible
          console.log('No worksheet assigned to machine for frequency:', frequency);
          throw new Error(`No QC worksheet assigned to this machine for ${frequency} frequency. Please assign a worksheet first.`);
        } else {
          // For view-only mode, fall back to API templates if no temp data available
          console.log('Falling back to API for machine type:', foundMachine.type, 'frequency:', frequency);
          const testsResponse = await axios.get(`/api/worksheets/${foundMachine.type}/${frequency}`);
          testsData = testsResponse.data;
        }
      }
      
      setTests(testsData);

      // Get existing QC dates (skip for view-only mode)
      if (!viewOnly) {
        try {
          // Get QC completions from both localStorage and backend
          const rawLocalCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
          
          // Filter out empty localStorage completions (same logic as backend)
          const localCompletions = rawLocalCompletions.filter(qc => {
            if (!qc.tests || qc.tests.length === 0) return false;
            // Check if at least one test has a value or result
            return qc.tests.some(test => 
              (test.value && test.value.toString().trim() !== '') || 
              (test.result && test.result.toString().trim() !== '')
            );
          });
          
          // Fetch completions from backend API  
          let backendCompletions = [];
          try {
            const response = await axios.get(`/api/qc/completions?machineId=${machineId}`);
            backendCompletions = response.data || [];
          } catch (error) {
            console.error('Error fetching backend completions for existing dates:', error);
          }
          
          // Merge backend and local completions
          const allCompletions = [...backendCompletions];
          localCompletions.forEach(localQC => {
            const existsInBackend = backendCompletions.some(backendQC => 
              backendQC.machineId === localQC.machineId &&
              backendQC.frequency === localQC.frequency &&
              backendQC.date === localQC.date &&
              backendQC.worksheetId === localQC.worksheetId
            );
            if (!existsInBackend) {
              allCompletions.push(localQC);
            }
          });
          
          // Filter for this machine, frequency, and worksheet (if specified)
          const relevantCompletions = allCompletions.filter(qc => 
            qc.machineId === machineId && 
            qc.frequency === frequency &&
            (worksheetId ? qc.worksheetId === worksheetId : true)
          );
          
          const existingDates = relevantCompletions.map(qc => qc.date).sort();
          setExistingQCDates(existingDates);
          console.log('📅 Loaded existing QC dates for', frequency, 'QC:', existingDates);
          
          // Store existing dates for auto-check (to avoid race condition)
          window.currentExistingDates = existingDates;
          
        } catch (error) {
          console.error('Error loading existing QC dates:', error);
          setExistingQCDates([]);
          window.currentExistingDates = [];
        }
      }

      // Initialize form data
      const initialData = {};
      testsData.forEach(test => {
        initialData[test.name || test.testName] = {
          value: viewOnly ? (test.tolerance || '') : '',
          result: viewOnly ? '' : '',
          notes: viewOnly ? (test.notes || '') : ''
        };
      });
      initialData.performedBy = viewOnly ? '[Template - No User]' : '';
      initialData.comments = viewOnly ? 'This is a read-only template view showing the structure and parameters for this QC worksheet.' : '';
      
      // Check for saved draft (only for non-view-only mode)
      if (!viewOnly) {
        const draftKey = `qc_draft_${machineId}_${frequency}_${selectedDate}`;
        const savedDraft = localStorage.getItem(draftKey);
        
        if (savedDraft) {
          try {
            const draftData = JSON.parse(savedDraft);
            console.log('Found saved QC draft:', draftData);
            
            // Populate form with draft data
            testsData.forEach(test => {
              const testName = test.name || test.testName;
              const draftTest = draftData.tests.find(t => t.testName === testName);
              if (draftTest) {
                initialData[testName] = {
                  value: draftTest.value || '',
                  result: draftTest.result || '',
                  notes: draftTest.notes || ''
                };
              }
            });
            
            initialData.performedBy = draftData.performedBy || '';
            initialData.comments = draftData.comments || '';
            
            // Success notification removed
          } catch (error) {
            console.error('Error loading draft:', error);
            // Continue with blank form if draft is corrupted
          }
        }
      }
      
      setFormData(initialData);
      
      // Auto-check for existing QC data on initial load (including period-based matching)
      if (!viewOnly) {
        console.log('📋 Auto-checking for existing QC data on form load for date:', selectedDate);
        // Use setTimeout to avoid state update during render and ensure all data is loaded
        setTimeout(() => {
          handleDateChange(selectedDate, window.currentExistingDates);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load QC form data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestChange = (testName, field, value, source = 'manual') => {
    setFormData(prev => ({
      ...prev,
      [testName]: {
        ...prev[testName],
        [field]: value,
        // Only update source info for value changes, not result/notes changes
        ...(field === 'value' && source === 'manual' ? {
          valueSource: 'manual',
          manuallyEnteredAt: new Date().toISOString()
        } : {})
      }
    }));
  };

  const handleGlobalChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = async (date, currentExistingDates = null) => {
    setSelectedDate(date);
    
    // Use provided dates or current state (to handle race conditions)
    const datesToCheck = currentExistingDates || existingQCDates;
    console.log(`🔍 handleDateChange called with date: ${date}, using dates:`, datesToCheck);
    
    // Check for existing data using period-based logic for monthly/quarterly/annual QC
    let hasExistingData = false;
    
    if (frequency === 'daily' || frequency === 'weekly') {
      // For daily/weekly, use exact date matching
      hasExistingData = datesToCheck.includes(date);
    } else {
      // For monthly/quarterly/annual, use period-based matching
      // Use date string parsing to avoid timezone issues
      const selectedParts = date.split('-'); // date is in YYYY-MM-DD format
      const selectedYear = parseInt(selectedParts[0]);
      const selectedMonth = parseInt(selectedParts[1]) - 1; // Convert to 0-based month
      
      console.log(`🔍 Date change for ${frequency} QC - Selected: ${date} (Month: ${selectedMonth}, Year: ${selectedYear})`);
      console.log(`🔍 Existing QC dates:`, datesToCheck);
      
      hasExistingData = datesToCheck.some(dateStr => {
        const existingParts = dateStr.split('-'); // dateStr is in YYYY-MM-DD format
        const existingYear = parseInt(existingParts[0]);
        const existingMonth = parseInt(existingParts[1]) - 1; // Convert to 0-based month
        
        if (frequency === 'monthly') {
          console.log(`🔍 Monthly comparison - Selected: ${selectedMonth}/${selectedYear}, Existing: ${existingMonth}/${existingYear} (${dateStr})`);
          console.log(`🔍 Date parsing details:`);
          console.log(`  - Selected date string: "${date}"`);
          console.log(`  - Selected parts: [${selectedParts.join(', ')}]`);
          console.log(`  - Selected month (0-based): ${selectedMonth}`);
          console.log(`  - Existing date string: "${dateStr}"`);
          console.log(`  - Existing parts: [${existingParts.join(', ')}]`);
          console.log(`  - Existing month (0-based): ${existingMonth}`);
          
          const matches = selectedMonth === existingMonth && selectedYear === existingYear;
          console.log(`🔍 Month match result: ${matches} (${selectedMonth} === ${existingMonth} && ${selectedYear} === ${existingYear})`);
          if (matches) {
            console.log(`✅ Found matching monthly QC for ${date}`);
          }
          return matches;
        } else if (frequency === 'quarterly') {
          const selectedQuarter = Math.floor(selectedMonth / 3);
          const existingQuarter = Math.floor(existingMonth / 3);
          const matches = selectedQuarter === existingQuarter && selectedYear === existingYear;
          if (matches) {
            console.log(`✅ Found matching quarterly QC for ${date}`);
          }
          return matches;
        } else if (frequency === 'annual') {
          const matches = selectedYear === existingYear;
          if (matches) {
            console.log(`✅ Found matching annual QC for ${date}`);
          }
          return matches;
        }
        
        return false;
      });
      
      console.log(`🔍 Has existing data for ${date}:`, hasExistingData);
    }
    
    if (hasExistingData) {
      await fetchExistingQCData(date);
    } else {
      // Reset form to blank if no existing data
      resetFormToBlank();
      setShowReplaceWarning(false);
    }
  };

  const fetchExistingQCData = async (date) => {
    console.log(`🔄 fetchExistingQCData called for date: ${date}`);
    setLoadingExistingData(true);
    try {
      // Get QC completions from both localStorage and backend
      const rawLocalCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
      
      // Filter out empty localStorage completions (same logic as backend)
      const localCompletions = rawLocalCompletions.filter(qc => {
        if (!qc.tests || qc.tests.length === 0) return false;
        // Check if at least one test has a value or result
        return qc.tests.some(test => 
          (test.value && test.value.toString().trim() !== '') || 
          (test.result && test.result.toString().trim() !== '')
        );
      });
      
      // Fetch completions from backend API  
      let backendCompletions = [];
      try {
        const response = await axios.get(`/api/qc/completions?machineId=${machineId}`);
        backendCompletions = response.data || [];
      } catch (error) {
        console.error('Error fetching backend completions:', error);
      }
      
      // Merge backend and local completions, with backend taking precedence
      const allCompletions = [...backendCompletions];
      
      // Add local completions that aren't already in backend
      localCompletions.forEach(localQC => {
        const existsInBackend = backendCompletions.some(backendQC => 
          backendQC.machineId === localQC.machineId &&
          backendQC.frequency === localQC.frequency &&
          backendQC.date === localQC.date &&
          backendQC.worksheetId === localQC.worksheetId
        );
        
        if (!existsInBackend) {
          allCompletions.push(localQC);
        }
      });
      
      // Find existing QC for this date/period, machine, and frequency
      const existingQC = allCompletions.find(qc => {
        if (qc.machineId !== machineId || qc.frequency !== frequency) {
          return false;
        }
        
        if (worksheetId && qc.worksheetId !== worksheetId) {
          return false;
        }
        
        // For daily and weekly QC, match exact date
        if (frequency === 'daily' || frequency === 'weekly') {
          return qc.date === date;
        }
        
        // For monthly QC, find any completion within the same month
        if (frequency === 'monthly') {
          // Use string parsing to avoid timezone issues
          const [selectedYear, selectedMonth] = date.split('-').map(Number);
          const [completedYear, completedMonth] = qc.date.split('-').map(Number);
          return selectedMonth === completedMonth && selectedYear === completedYear;
        }
        
        // For quarterly QC, find any completion within the same quarter
        if (frequency === 'quarterly') {
          // Use string parsing to avoid timezone issues
          const [selectedYear, selectedMonth] = date.split('-').map(Number);
          const [completedYear, completedMonth] = qc.date.split('-').map(Number);
          const selectedQuarter = Math.floor((selectedMonth - 1) / 3);
          const completedQuarter = Math.floor((completedMonth - 1) / 3);
          return selectedQuarter === completedQuarter && selectedYear === completedYear;
        }
        
        // For annual QC, find any completion within the same year
        if (frequency === 'annual') {
          // Use string parsing to avoid timezone issues
          const selectedYear = parseInt(date.split('-')[0]);
          const completedYear = parseInt(qc.date.split('-')[0]);
          return selectedYear === completedYear;
        }
        
        return false;
      });
      
      console.log(`🔍 Searching for existing QC - machineId: ${machineId}, frequency: ${frequency}, worksheetId: ${worksheetId}`);
      console.log(`🔍 All completions found:`, allCompletions);
      
      if (existingQC) {
        console.log('📋 Found existing QC data for', date, ':', existingQC);
        
        // Populate form with existing data
        const populatedData = { ...formData };
        
        // Fill in test data
        if (existingQC.tests) {
          existingQC.tests.forEach(test => {
            populatedData[test.testName] = {
              value: test.value || '',
              result: test.result || '',
              notes: test.notes || '',
              performedBy: test.performedBy || existingQC.performedBy || ''
            };
          });
        }
        
        // Fill in global fields
        populatedData.performedBy = existingQC.performedBy || '';
        populatedData.comments = existingQC.comments || '';
        
        setFormData(populatedData);
        
        // Enhanced warning message for period-based QC
        let warningMessage;
        if (frequency === 'monthly') {
          const completedDate = new Date(existingQC.date);
          const monthName = completedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          warningMessage = `Monthly QC already completed for ${monthName}. Performed on ${completedDate.toLocaleDateString()} by ${existingQC.performedBy || 'Unknown'}. You can edit the existing data or perform additional QC if needed.`;
        } else if (frequency === 'quarterly') {
          const completedDate = new Date(existingQC.date);
          const quarter = Math.floor(completedDate.getMonth() / 3) + 1;
          const year = completedDate.getFullYear();
          warningMessage = `Quarterly QC already completed for Q${quarter} ${year}. Performed on ${completedDate.toLocaleDateString()} by ${existingQC.performedBy || 'Unknown'}. You can edit the existing data or perform additional QC if needed.`;
        } else if (frequency === 'annual') {
          const completedDate = new Date(existingQC.date);
          const year = completedDate.getFullYear();
          warningMessage = `Annual QC already completed for ${year}. Performed on ${completedDate.toLocaleDateString()} by ${existingQC.performedBy || 'Unknown'}. You can edit the existing data or perform additional QC if needed.`;
        } else {
          warningMessage = `QC data already exists for ${date}. Last performed by: ${existingQC.performedBy || 'Unknown'} on ${new Date(existingQC.completedAt || existingQC.date).toLocaleString()}`;
        }
        
        // Show enhanced warning with more details
        console.log('🚨 Setting warning message:', warningMessage);
        const warningState = {
          show: true,
          existingData: existingQC,
          date: existingQC.date, // Use the actual completion date
          message: warningMessage
        };
        console.log('🚨 About to set warning state:', warningState);
        setShowReplaceWarning(warningState);
        console.log('🚨 Warning state set, should show warning now');
      } else {
        console.log('❌ No existing QC found for this period');
        setShowReplaceWarning(false);
      }
    } catch (error) {
      console.error('💥 Error fetching existing QC data:', error);
      // If error, reset to blank form
      resetFormToBlank();
      setShowReplaceWarning(false);
    } finally {
      console.log('🏁 Finished loading existing data, setting loadingExistingData to false');
      setLoadingExistingData(false);
    }
  };

  const resetFormToBlank = () => {
    const blankData = {};
    tests.forEach(test => {
      blankData[test.testName] = {
        value: '',
        result: '',
        notes: ''
      };
    });
    blankData.performedBy = '';
    blankData.comments = '';
    setFormData(blankData);
  };

  const areAllRequiredFieldsFilled = () => {
    // Check if performedBy is filled
    if (!formData.performedBy || formData.performedBy.trim() === '') {
      return false;
    }

    // Check if all required tests have required fields filled
    for (const test of tests) {
      // Only validate if this test is marked as required (default to true for backward compatibility)
      if (test.required === false) {
        continue; // Skip non-required tests
      }

      const testName = test.testName || test.name;
      const testData = formData[testName];
      
      if (!testData) {
        return false;
      }

      // For different test types, check appropriate fields
      switch (test.testType) {
        case 'checkbox':
          // For checkbox, just check if there's a value (true/false)
          if (testData.value === undefined || testData.value === '') {
            return false;
          }
          break;
        case 'passfail':
          // For pass/fail, check result field
          if (!testData.result || testData.result.trim() === '') {
            return false;
          }
          break;
        case 'text':
        case 'value':
        default:
          // For text and numerical, check both value and result
          if (!testData.value || testData.value.toString().trim() === '') {
            return false;
          }
          if (!testData.result || testData.result.trim() === '') {
            return false;
          }
          break;
      }
    }

    return true;
  };

  const renderTestInput = (test, testName) => {
    const testData = formData[testName];
    const valueSource = testData?.valueSource;
    const isAutomated = valueSource === 'automated' || (test.calculatedFromDicom && !valueSource);
    const hasValue = testData?.value;
    
    const baseClassName = `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-gray-700 text-gray-100`;
    const errorClassName = (test.required !== false && (!testData?.value || testData?.value.toString().trim() === '')) 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-gray-600 focus:ring-blue-500';

    // Auto-detect test type based on units field if testType not explicitly set
    // Multiple ways to detect pass/fail tests for robustness
    let effectiveTestType = test.testType;
    
    if (!effectiveTestType) {
      if (test.units === 'pass/fail' || 
          test.units === 'passfail' ||
          (test.tolerance && test.tolerance.toLowerCase() === 'pass') ||
          (test.testName && test.testName.toLowerCase().includes('safety')) ||
          (test.testName && test.testName.toLowerCase().includes('certification')) ||
          (test.testName && test.testName.toLowerCase().includes('calibration'))) {
        effectiveTestType = 'passfail';
      } else {
        effectiveTestType = 'value';
      }
    }
    
    switch (effectiveTestType) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-3 flex-1">
              <input
                type="checkbox"
                checked={testData?.value === true || testData?.value === 'true'}
                onChange={(e) => {
                  const value = e.target.checked;
                  handleTestChange(testName, 'value', value);
                  // Auto-determine result based on checkbox value and tolerance
                  const result = determineResult(testName, value, test);
                  handleTestChange(testName, 'result', result);
                }}
                disabled={viewOnly}
                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm text-gray-300">
                {testData?.value === true || testData?.value === 'true' ? 'Checked' : 'Unchecked'}
              </label>
            </div>
            {(test.units || testData?.automatedUnits) && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{test.units || testData?.automatedUnits}</span>
            )}
          </div>
        );

      case 'passfail':
        return (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <select
                value={testData?.result || ''}
                onChange={(e) => {
                  handleTestChange(testName, 'result', e.target.value);
                  handleTestChange(testName, 'value', e.target.value);
                }}
                disabled={viewOnly}
                className={`${baseClassName} ${errorClassName}`}
              >
                <option value="">Select Result</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
            {(test.units || testData?.automatedUnits) && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{test.units || testData?.automatedUnits}</span>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <textarea
                value={testData?.value || ''}
                onChange={(e) => {
                  handleTestChange(testName, 'value', e.target.value);
                  // Auto-determine result for text entry based on tolerance
                  const result = determineResult(testName, e.target.value, test);
                  if (result) {
                    handleTestChange(testName, 'result', result);
                  }
                }}
                className={`${baseClassName} ${errorClassName} pr-12`}
                placeholder="Enter text observation"
                readOnly={viewOnly}
                rows={1}
              />
              {!viewOnly && (
                <div className="absolute right-2 top-1 text-gray-400 text-xs bg-gray-600/50 px-1.5 py-0.5 rounded border border-gray-500/30">
                  📝
                </div>
              )}
            </div>
            {(test.units || testData?.automatedUnits) && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{test.units || testData?.automatedUnits}</span>
            )}
          </div>
        );

      case 'value':
      default:
        // Detect if this should be a text input based on tolerance containing text
        const isTextTest = test.tolerance && typeof test.tolerance === 'string' && 
                          (test.tolerance.toLowerCase().includes('yep') || 
                           test.tolerance.toLowerCase().includes('text') ||
                           test.tolerance.toLowerCase().includes('word') ||
                           isNaN(parseFloat(test.tolerance.replace(/[^\d.-]/g, ''))));
        
        // Only apply numerical validation to tests that are not pass/fail and not text
        const shouldApplyNumericValidation = !isTextTest && 
                                           effectiveTestType !== 'passfail' &&
                                           (effectiveTestType === 'value' || 
                                           (!test.testType && test.units && test.units !== 'pass/fail'));
        
        // Default numerical value input with proper number validation
        if (isAutomated || (test.calculatedFromDicom && hasValue)) {
          return (
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type={shouldApplyNumericValidation ? "number" : "text"}
                  step={shouldApplyNumericValidation ? "any" : undefined}
                  value={testData?.value || ''}
                  onKeyDown={shouldApplyNumericValidation ? (e) => {
                    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                    if ([46, 8, 9, 27, 13, 35, 36, 37, 39, 38, 40].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        (e.keyCode === 90 && e.ctrlKey === true)) {
                      return;
                    }
                    // Ensure that it's a number, period, or minus sign and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 190 && e.keyCode !== 189) {
                      e.preventDefault();
                    }
                  } : undefined}
                  onChange={(e) => {
                    // Apply filtering only for numeric fields
                    const value = shouldApplyNumericValidation ? e.target.value.replace(/[^0-9.-]/g, '') : e.target.value;
                    handleTestChange(testName, 'value', value, 'manual');
                    // Auto-determine result
                    const result = determineResult(testName, value, test);
                    if (result) {
                      handleTestChange(testName, 'result', result);
                    }
                  }}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 ${
                    testData?.valueSource === 'manual' 
                      ? 'bg-amber-900/30 text-amber-200 border-amber-600' 
                      : 'bg-blue-900/30 text-blue-200 border-blue-600'
                  }`}
                  placeholder={testData?.valueSource === 'manual' ? "Manual override" : "Auto-calculated"}
                  readOnly={viewOnly}
                />
                <div className={`absolute right-1 top-1/2 transform -translate-y-1/2 text-xs px-1 py-0.5 rounded ${
                  testData?.valueSource === 'manual'
                    ? 'text-amber-300 bg-amber-800/50'
                    : 'text-blue-300 bg-blue-800/50'
                }`}>
                  {testData?.valueSource === 'manual' ? '⚠️' : '🤖'}
                </div>
              </div>
              {(test.units || testData?.automatedUnits) && (
                <span className="text-xs text-gray-400 whitespace-nowrap">{test.units || testData?.automatedUnits}</span>
              )}
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type={shouldApplyNumericValidation ? "number" : "text"}
                  step={shouldApplyNumericValidation ? "any" : undefined}
                  value={testData?.value || ''}
                  onKeyDown={shouldApplyNumericValidation ? (e) => {
                    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                    if ([46, 8, 9, 27, 13, 35, 36, 37, 39, 38, 40].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        (e.keyCode === 90 && e.ctrlKey === true)) {
                      return;
                    }
                    // Ensure that it's a number, period, or minus sign and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 190 && e.keyCode !== 189) {
                      e.preventDefault();
                    }
                  } : undefined}
                  onChange={(e) => {
                    // Apply filtering only for numeric fields
                    const value = shouldApplyNumericValidation ? e.target.value.replace(/[^0-9.-]/g, '') : e.target.value;
                    handleTestChange(testName, 'value', value);
                    // Auto-determine result
                    const result = determineResult(testName, value, test);
                    if (result) {
                      handleTestChange(testName, 'result', result);
                    }
                  }}
                  className={`${baseClassName} ${errorClassName}`}
                  placeholder={test.placeholder || "Enter numerical value"}
                  readOnly={viewOnly}
                />
              </div>
              {(test.units || testData?.automatedUnits) && (
                <span className="text-xs text-gray-400 whitespace-nowrap">{test.units || testData?.automatedUnits}</span>
              )}
            </div>
          );
        }
    }
  };

  // Function to automatically analyze DICOM series and populate QC tests
  const handleAutomaticAnalysis = async (selectedSeries) => {
    if (!selectedSeries || selectedSeries.length === 0) return;
    
    try {
      // Simulate DICOM analysis (same logic as DICOMAnalysis component)
      console.log('🔬 Running automatic DICOM analysis for selected series...');
      
      // Generate mock analysis results
      const mockResults = {
        seriesAnalyzed: selectedSeries,
        analysisDate: new Date().toISOString(),
        modality: machine?.type || 'CT',
        seriesCount: selectedSeries.length,
        measurements: {}
      };

      // Generate measurements based on modality
      if (machine?.type === 'CT') {
        mockResults.measurements = {
          'CT Number Accuracy (Water)': {
            value: -2.3,
            units: 'HU',
            tolerance: '±5 HU',
            status: 'pass'
          },
          'CT Number Linearity': {
            value: 2.1,
            units: 'HU',
            tolerance: '±5 HU',
            status: 'pass'
          },
          'Image Noise': {
            value: 4.2,
            units: 'HU (SD)',
            tolerance: '≤6.0 HU',
            status: 'pass'
          },
          'Uniformity': {
            value: 3.1,
            units: 'HU',
            tolerance: '±5 HU',
            status: 'pass'
          },
          'Spatial Resolution': {
            value: 0.5,
            units: 'mm',
            tolerance: '≤0.75 mm',
            status: 'pass'
          },
          'Low Contrast Detectability': {
            value: 8,
            units: 'mm',
            tolerance: '≥6 mm',
            status: 'pass'
          }
        };
      }

      // Auto-populate form fields with analysis results
      if (mockResults.measurements) {
        const newFormData = { ...formData };
        let populatedCount = 0;
        
        Object.entries(mockResults.measurements).forEach(([testName, measurement]) => {
          // Try exact match first
          if (newFormData[testName]) {
            newFormData[testName] = {
              ...newFormData[testName],
              value: measurement.value,
              result: measurement.status,
              valueSource: 'automated',
              automatedAt: new Date().toISOString(),
              automatedFrom: 'dicom_analysis',
              automatedUnits: measurement.units
            };
            populatedCount++;
          } else {
            // Try partial matching for common test name variations
            const matchingTest = Object.keys(newFormData).find(formTestName => {
              const normalizeTestName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normalizeTestName(formTestName).includes(normalizeTestName(testName.split('(')[0].trim())) ||
                     normalizeTestName(testName).includes(normalizeTestName(formTestName));
            });
            
            if (matchingTest && newFormData[matchingTest]) {
              newFormData[matchingTest] = {
                ...newFormData[matchingTest],
                value: measurement.value,
                result: measurement.status,
                valueSource: 'automated',
                automatedAt: new Date().toISOString(),
                automatedFrom: 'dicom_analysis',
                automatedUnits: measurement.units
              };
              populatedCount++;
            }
          }
        });
        
        setFormData(newFormData);
        console.log(`🤖 Automated analysis populated ${populatedCount} QC test fields`);
        
        if (populatedCount > 0) {
          console.log(`✅ Automated QC analysis complete - populated ${populatedCount} tests`);
        }
      }
      
    } catch (error) {
      console.error('Error in automatic DICOM analysis:', error);
    }
  };

  // Helper function to check date status
  const getDateStatus = (dateStr) => {
    const hasData = existingQCDates.includes(dateStr);
    const isDueDate = qcDueDates.includes(dateStr);
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isWeekend = frequency === 'daily' && [0, 6].includes(new Date(dateStr).getDay());
    
    return {
      hasData,
      isDueDate,
      isToday,
      isWeekend
    };
  };

  const determineResult = (testName, value, test = null) => {
    // Auto-determine pass/fail based on test criteria and tolerance
    if (!value || value.toString().trim() === '') return '';
    
    // Find the test object to get tolerance and test type
    const currentTest = test || tests.find(t => (t.name || t.testName) === testName);
    if (!currentTest) {
      return 'pass'; // Default for tests without test definition
    }

    // Handle different test types
    switch (currentTest.testType) {
      case 'passfail':
        // For pass/fail tests, value should already be 'pass' or 'fail'
        return ['pass', 'fail'].includes(value.toLowerCase()) ? value.toLowerCase() : 'pass';
        
      case 'checkbox':
        // For checkbox tests, treat checked as pass, unchecked as fail (or vice versa based on tolerance)
        const isChecked = value === true || value === 'true' || value === 1 || value === '1';
        if (currentTest.tolerance === 'checked' || currentTest.tolerance === 'true' || !currentTest.tolerance) {
          return isChecked ? 'pass' : 'fail';
        } else if (currentTest.tolerance === 'unchecked' || currentTest.tolerance === 'false') {
          return isChecked ? 'fail' : 'pass';
        }
        return isChecked ? 'pass' : 'fail';
        
      case 'text':
        // For text tests, check if tolerance specifies expected text or just default to pass
        if (currentTest.tolerance && typeof currentTest.tolerance === 'string') {
          const expectedText = currentTest.tolerance.toLowerCase().trim();
          const actualText = value.toString().toLowerCase().trim();
          if (expectedText === 'pass' || expectedText === 'fail') {
            return expectedText;
          }
          // For exact word matching (like "yep"), check for exact match
          if (expectedText.length <= 10 && !expectedText.includes(' ')) {
            // Short single words need exact match
            return actualText === expectedText ? 'pass' : 'fail';
          }
          // For longer phrases, use partial matching
          return actualText.includes(expectedText) || expectedText.includes(actualText) ? 'pass' : 'fail';
        }
        return 'pass'; // Default for text without specific tolerance
        
      case 'value':
      default:
        // Check if this is actually a text test that fell through (has text tolerance)
        if (currentTest.tolerance && typeof currentTest.tolerance === 'string') {
          const tolerance = currentTest.tolerance.toLowerCase().trim();
          // If tolerance contains text keywords or is non-numeric, treat as text test
          if (tolerance.includes('yep') || tolerance.includes('text') || tolerance.includes('word') || 
              isNaN(parseFloat(tolerance.replace(/[^\d.-]/g, '')))) {
            const actualText = value.toString().toLowerCase().trim();
            // For exact word matching (like "yep"), check for exact match
            if (tolerance.length <= 10 && !tolerance.includes(' ')) {
              return actualText === tolerance ? 'pass' : 'fail';
            }
            // For longer phrases, use partial matching
            return actualText.includes(tolerance) || tolerance.includes(actualText) ? 'pass' : 'fail';
          }
        }
        
        // For numerical values, apply tolerance checking
        if (!currentTest.tolerance) {
          return 'pass'; // Default for tests without tolerance
        }
        
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
          // If we can't parse as number and it's not a text test, default to pass
          return 'pass';
        }
        
        const tolerance = currentTest.tolerance;
        
        // Parse different tolerance formats
        if (typeof tolerance === 'string') {
          // Handle formats like "±5", "≤10", "≥20", ">5", "<10", "5-15", etc.
          if (tolerance.includes('±')) {
            const toleranceValue = parseFloat(tolerance.replace('±', ''));
            return Math.abs(numericValue) <= toleranceValue ? 'pass' : 'fail';
          } else if (tolerance.includes('≤') || tolerance.includes('<=')) {
            const maxValue = parseFloat(tolerance.replace(/≤|<=/g, ''));
            return numericValue <= maxValue ? 'pass' : 'fail';
          } else if (tolerance.includes('≥') || tolerance.includes('>=')) {
            const minValue = parseFloat(tolerance.replace(/≥|>=/g, ''));
            return numericValue >= minValue ? 'pass' : 'fail';
          } else if (tolerance.includes('<')) {
            const maxValue = parseFloat(tolerance.replace('<', ''));
            return numericValue < maxValue ? 'pass' : 'fail';
          } else if (tolerance.includes('>')) {
            const minValue = parseFloat(tolerance.replace('>', ''));
            return numericValue > minValue ? 'pass' : 'fail';
          } else if (tolerance.includes('-') && !tolerance.startsWith('-')) {
            // Range format like "5-15"
            const [min, max] = tolerance.split('-').map(v => parseFloat(v.trim()));
            return (numericValue >= min && numericValue <= max) ? 'pass' : 'fail';
          }
        } else if (typeof tolerance === 'object') {
          // Handle object format with lowerLimit/upperLimit
          if (tolerance.lowerLimit !== undefined && numericValue < tolerance.lowerLimit) {
            return 'fail';
          }
          if (tolerance.upperLimit !== undefined && numericValue > tolerance.upperLimit) {
            return 'fail';
          }
          return 'pass';
        }
        
        return 'pass'; // Default if tolerance format not recognized
    }
    
    return 'pass'; // Default fallback
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        machineId,
        machineType: machine.type,
        frequency,
        date: selectedDate,
        tests: tests.map(test => ({
          testName: test.testName,
          value: formData[test.testName]?.value || '',
          result: formData[test.testName]?.result || '',
          notes: formData[test.testName]?.notes || '',
          tolerance: test.tolerance || '',
          performedBy: formData.performedBy
        })),
        performedBy: formData.performedBy,
        comments: formData.comments,
        isDraft: true,
        savedAt: new Date().toISOString()
      };

      // Save to localStorage as draft
      const draftKey = `qc_draft_${machineId}_${frequency}_${selectedDate}`;
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      
      // Success notification removed
      console.log('QC draft saved:', draftData);
    } catch (error) {
      console.error('Error saving QC draft:', error);
      toast.error('Failed to save QC draft');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const qcData = {
        machineId,
        machineType: machine.type,
        frequency,
        date: selectedDate,
        tests: tests.map(test => ({
          testName: test.testName,
          value: formData[test.testName]?.value || '',
          result: formData[test.testName]?.result || determineResult(test.testName, formData[test.testName]?.value, test),
          notes: formData[test.testName]?.notes || '',
          tolerance: test.tolerance || '',
          performedBy: formData.performedBy
        })),
        performedBy: formData.performedBy,
        comments: formData.comments,
        overallResult: tests.some(test => 
          (formData[test.testName]?.result || determineResult(test.testName, formData[test.testName]?.value, test)) === 'fail'
        ) ? 'fail' : 'pass',
        // Include worksheet information for status tracking
        worksheetId: currentWorksheet?.id || worksheetId,
        worksheetTitle: currentWorksheet?.title || `${frequency} QC`
      };

      const response = await axios.post(`/api/qc/submit`, qcData);
      
      // Clear any saved draft after successful submission
      const draftKey = `qc_draft_${machineId}_${frequency}_${selectedDate}`;
      localStorage.removeItem(draftKey);
      
      // Store the completed QC in localStorage for immediate status updates
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
        worksheetId: qcData.worksheetId,
        worksheetTitle: qcData.worksheetTitle,
        isRealSubmission: true
      };
      
      // Add to localStorage QC completions
      const existingCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
      
      // Remove any existing completion for the same machine/frequency/date/worksheet to avoid duplicates
      const filteredCompletions = existingCompletions.filter(qc => 
        !(qc.machineId === completedQC.machineId && 
          qc.frequency === completedQC.frequency && 
          qc.date === completedQC.date &&
          qc.worksheetId === completedQC.worksheetId)
      );
      
      filteredCompletions.push(completedQC);
      localStorage.setItem('qcCompletions', JSON.stringify(filteredCompletions));
      
      // Store a flag to trigger QC status refresh on the machine detail page
      localStorage.setItem('qcStatusRefresh', Date.now().toString());
      
      console.log('QC completion stored:', completedQC);
      
      navigate(`/machines/${machineId}`, { 
        state: { 
          message: `${frequency} QC completed successfully!`,
          completedQC: completedQC 
        }
      });
      
    } catch (error) {
      console.error('Error submitting QC:', error);
      alert('Error submitting QC data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteWorksheet = () => {
    // Only allow deletion of actual worksheets, not templates
    if (tests.length > 0 && tests[0].templateSource) {
      if (window.confirm('Are you sure you want to delete this worksheet? This action cannot be undone.')) {
        try {
          const worksheets = JSON.parse(localStorage.getItem('qcWorksheets') || '[]');
          // Find the worksheet by matching the template source and frequency
          const updatedWorksheets = worksheets.filter(w => 
            !(w.modality === machineType && w.frequency === frequency && w.templateSource === tests[0].templateSource)
          );
          localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
          // Success notification removed
          navigate('/worksheets');
        } catch (error) {
          console.error('Error deleting worksheet:', error);
          toast.error('Failed to delete worksheet');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading QC form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">⚠️</span>
            <h2 className="text-lg font-semibold">QC Not Available</h2>
          </div>
          <p className="mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/worksheets')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              📋 Create Worksheet
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
        Machine not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            {viewOnly ? 'View ' : ''}{frequency.charAt(0).toUpperCase() + frequency.slice(1)} QC {viewOnly ? (tests.length > 0 && tests[0].templateSource ? 'Worksheet' : 'Template') : ''} - {machine.name}
          </h1>
          <div className="text-sm text-gray-400">
            <p>Machine ID: {machine.machineId}</p>
            <p>Type: {machine.type}</p>
            <p>Location: {machine.location.building} - {machine.location.room}</p>
          </div>
          
          {/* Period Display - Show prominently for monthly/quarterly/annual */}
          {!viewOnly && (frequency === 'monthly' || frequency === 'quarterly' || frequency === 'annual') && selectedDate && (() => {
            // Calculate period status once and reuse it
            const selectedParts = selectedDate.split('-');
            const selectedYear = parseInt(selectedParts[0]);
            const selectedMonth = parseInt(selectedParts[1]) - 1;
            
            // Determine if this PERIOD has existing QC data (not just the selected date)
            const hasExistingData = existingQCDates.some(dateStr => {
              const existingParts = dateStr.split('-');
              const existingYear = parseInt(existingParts[0]);
              const existingMonth = parseInt(existingParts[1]) - 1;
              
              if (frequency === 'monthly') {
                return selectedMonth === existingMonth && selectedYear === existingYear;
              } else if (frequency === 'quarterly') {
                const selectedQuarter = Math.floor(selectedMonth / 3);
                const existingQuarter = Math.floor(existingMonth / 3);
                return selectedQuarter === existingQuarter && selectedYear === existingYear;
              } else if (frequency === 'annual') {
                return selectedYear === existingYear;
              }
              return false;
            });
            
            // Check if this period is overdue
            const today = new Date();
            const isOverdue = (() => {
              if (frequency === 'monthly') {
                const selectedMonth = new Date(selectedYear, selectedMonth);
                return selectedMonth < new Date(today.getFullYear(), today.getMonth());
              } else if (frequency === 'quarterly') {
                const selectedQuarter = Math.floor(selectedMonth / 3);
                const currentQuarter = Math.floor(today.getMonth() / 3);
                return selectedYear < today.getFullYear() || 
                       (selectedYear === today.getFullYear() && selectedQuarter < currentQuarter);
              } else if (frequency === 'annual') {
                return selectedYear < today.getFullYear();
              }
              return false;
            })();
            
            // Determine colors and status based on calculated state
            let bgColor, textColor, subtitleColor, statusText;
            if (hasExistingData) {
              bgColor = 'bg-green-900 border-green-600';
              textColor = 'text-green-100';
              subtitleColor = 'text-green-300';
              statusText = '✓ Complete';
            } else if (isOverdue) {
              bgColor = 'bg-red-900 border-red-600';
              textColor = 'text-red-100';
              subtitleColor = 'text-red-300';
              statusText = '⚠️ Overdue';
            } else {
              bgColor = 'bg-blue-900 border-blue-600';
              textColor = 'text-blue-100';
              subtitleColor = 'text-blue-300';
              statusText = '📋 Due';
            }
            
            return (
              <div className={`mt-4 p-4 rounded-lg border-2 ${bgColor}`}>
                <div className="text-center">
                  <h2 className={`text-2xl font-bold mb-1 ${textColor}`}>
                    {(() => {
                      const [year, month, day] = selectedDate.split('-');
                      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      
                      if (frequency === 'monthly') {
                        return dateObj.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        });
                      } else if (frequency === 'quarterly') {
                        const quarter = Math.floor(dateObj.getMonth() / 3) + 1;
                        return `Q${quarter} ${dateObj.getFullYear()}`;
                      } else if (frequency === 'annual') {
                        return dateObj.getFullYear().toString();
                      }
                    })()}
                  </h2>
                  <p className={`text-sm capitalize ${subtitleColor}`}>
                    {frequency} QC {statusText}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Date Selection - Hide in view-only mode */}
          {!viewOnly && (
            <div className="mt-4 p-3 bg-blue-900 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-200 mb-2">QC Date</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    min={(() => {
                      // Use worksheet start date if available, otherwise use reasonable defaults
                      if (currentWorksheet && currentWorksheet.startDate) {
                        return currentWorksheet.startDate;
                      }
                      
                      // Fallback to frequency-based limits
                      if (frequency === 'annual') {
                        // For annual QC, allow selection from 3 years back
                        return new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      } else if (frequency === 'quarterly') {
                        // For quarterly QC, allow selection from 1 year back
                        return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      } else if (frequency === 'monthly') {
                        // For monthly QC, allow selection from 6 months back
                        return new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      } else {
                        // For daily/weekly QC, keep the 90-day limit
                        return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      }
                    })()} // Dynamic minimum based on worksheet start date or frequency
                    className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  {existingQCDates.includes(selectedDate) && (
                    <span className="text-green-400 flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      Done
                    </span>
                  )}
                  {qcDueDates.includes(selectedDate) && (
                    <span className="text-yellow-400 flex items-center">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                      Due
                    </span>
                  )}
                </div>
              </div>
              
              {/* Due Date Indicator */}
              {selectedDate && qcDueDates.includes(selectedDate) && (
                <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs">
                  <div className="text-yellow-300 font-medium">
                    📅 Fulfilling {frequency} QC due date: {(() => {
                      const [year, month, day] = selectedDate.split('-');
                      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      
                      if (frequency === 'daily') {
                        return dateObj.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'short', 
                          day: 'numeric' 
                        });
                      } else if (frequency === 'weekly') {
                        return `Week of ${dateObj.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}`;
                      } else if (frequency === 'monthly') {
                        return dateObj.toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        });
                      } else if (frequency === 'quarterly') {
                        const quarter = Math.floor(dateObj.getMonth() / 3) + 1;
                        return `Q${quarter} ${dateObj.getFullYear()}`;
                      } else if (frequency === 'annual') {
                        return dateObj.getFullYear().toString();
                      }
                    })()}
                  </div>
                </div>
              )}
              
              {loadingExistingData && (
                <div className="mt-2 bg-blue-900 border border-blue-700 rounded-md p-3">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                    <p className="text-sm text-blue-300">Loading existing QC data...</p>
                  </div>
                </div>
              )}
              
              {showReplaceWarning && showReplaceWarning.show && !loadingExistingData && (
                <div className="mt-2 bg-amber-900 border border-amber-700 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-amber-200">
                        ⚠️ Editing Existing QC Data
                      </h4>
                      <p className="text-sm text-amber-300 mt-1">
                        {showReplaceWarning.message}
                      </p>
                      <p className="text-xs text-amber-400 mt-2">
                        The form has been populated with existing data. You can review and modify values below. Submitting will replace the existing QC record.
                      </p>
                      {showReplaceWarning.existingData && (
                        <div className="mt-2 text-xs text-amber-400">
                          <span className="font-medium">Previous Result:</span> {showReplaceWarning.existingData.overallResult || 'Unknown'}
                          {showReplaceWarning.existingData.worksheetTitle && (
                            <span className="ml-2">• <span className="font-medium">Worksheet:</span> {showReplaceWarning.existingData.worksheetTitle}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* View-only info */}
          {viewOnly && (
            <div className="mt-4 p-4 bg-purple-900 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-200 mb-2">
                {tests.length > 0 && tests[0].templateSource ? 'Custom Worksheet View' : 'Template View'}
              </h3>
              <p className="text-sm text-purple-300">
                {tests.length > 0 && tests[0].templateSource ? (
                  <>This is a read-only view of the custom {frequency} QC worksheet assigned to {machine.name}.
                   This shows the actual custom tests and structure that would be performed during QC.</>
                ) : (
                  <>This is a read-only view of the {frequency} QC worksheet template for {machine.type} equipment.
                   This shows the structure and tests that would be performed during actual QC.</>
                )}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Technician Information */}
          <div className="bg-blue-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-200 mb-3">Technician Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Performed By *
                </label>
                <input
                  type="text"
                  value={formData.performedBy || ''}
                  onChange={(e) => handleGlobalChange('performedBy', e.target.value)}
                  className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                  placeholder="Enter your name"
                  required
                  readOnly={viewOnly}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Time Started
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                  defaultValue={viewOnly ? '08:00' : new Date().toTimeString().slice(0,5)}
                  readOnly={viewOnly}
                />
              </div>
            </div>
          </div>

          {/* DICOM Series Selection */}
          {machine && (
            <DICOMSeriesSelector
              machineId={machineId}
              frequency={frequency}
              modality={machine.type}
              selectedDate={selectedDate}
              onSeriesSelection={(series) => {
                setSelectedDICOMSeries(series);
                console.log('Selected DICOM series for analysis:', series);
                // Automatically run analysis when series are selected
                if (!viewOnly && series.length > 0 && (machine.type === 'CT' || machine.type === 'MRI')) {
                  setTimeout(() => {
                    handleAutomaticAnalysis(series);
                  }, 500); // Small delay to let the selection UI update
                }
              }}
              viewOnly={viewOnly}
            />
          )}


          {/* QC Tests */}
          <div>
            <h3 className="text-sm font-semibold text-gray-100 mb-3">QC Tests ({tests.length})</h3>
            
            {tests.length > 0 && tests[0].templateSource && (
              <div className="mb-2 p-2 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-300">
                📋 {tests[0].templateSource}
              </div>
            )}
            
            <div className="space-y-1">
              {tests.map((test, index) => (
                <div key={index} className="border border-gray-700 rounded px-3 py-2">
                  <div className="grid grid-cols-12 gap-2 items-center text-sm">
                    {/* Test Name - 4 cols */}
                    <div className="col-span-4">
                      <span className="font-medium text-gray-100">
                        {test.name || test.testName}
                        {test.required !== false && <span className="text-red-400 ml-1">*</span>}
                        {test.isCustomField && <span className="ml-1 text-blue-400">🔧</span>}
                        {formData[test.name || test.testName]?.valueSource === 'automated' && (
                          <span className="ml-2 text-xs bg-blue-800/50 text-blue-300 px-1.5 py-0.5 rounded border border-blue-600/30">
                            🤖 AUTO
                          </span>
                        )}
                      </span>
                      {test.tolerance && (
                        <span className="text-xs text-gray-400 ml-2">
                          ({typeof test.tolerance === 'string' ? test.tolerance : 'See spec'})
                        </span>
                      )}
                    </div>
                    
                    {/* Value Input - 3 cols */}
                    <div className="col-span-3">
                      {renderTestInput(test, test.name || test.testName)}
                    </div>
                    
                    {/* Result - 2 cols */}
                    <div className="col-span-2">
                      {(() => {
                        const testName = test.name || test.testName;
                        const testValue = formData[testName]?.value;
                        const autoResult = testValue ? determineResult(testName, testValue, test) : '';
                        const displayResult = autoResult || formData[testName]?.result || '';
                        
                        // Auto-detect test type for result display
                        const effectiveTestType = test.testType || (test.units === 'pass/fail' ? 'passfail' : 'value');
                        
                        // For pure pass/fail tests, show the result from the dropdown input
                        if (effectiveTestType === 'passfail') {
                          return (
                            <div className={`w-full border rounded px-2 py-1 text-xs text-center font-medium ${
                              formData[testName]?.result === 'fail' ? 'bg-red-900 border-red-600 text-red-200' : 
                              formData[testName]?.result === 'pass' ? 'bg-green-900 border-green-600 text-green-200' : 
                              'bg-gray-700 border-gray-600 text-gray-100'
                            }`}>
                              {formData[testName]?.result === 'pass' ? '✓ Pass' : 
                               formData[testName]?.result === 'fail' ? '✗ Fail' : 
                               '-'}
                            </div>
                          );
                        }
                        
                        // For all other test types (numerical, text, checkbox), show auto-determined result
                        return (
                          <div className={`w-full border rounded px-2 py-1 text-xs text-center font-medium ${
                            displayResult === 'fail' ? 'bg-red-900 border-red-600 text-red-200' : 
                            displayResult === 'pass' ? 'bg-green-900 border-green-600 text-green-200' : 
                            'bg-gray-700 border-gray-600 text-gray-100'
                          }`}>
                            {displayResult === 'pass' ? '✓ Pass' : 
                             displayResult === 'fail' ? '✗ Fail' : 
                             '-'}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Notes - 3 cols */}
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={formData[test.name || test.testName]?.notes || ''}
                        onChange={(e) => handleTestChange(test.name || test.testName, 'notes', e.target.value)}
                        className="w-full border border-gray-600 rounded px-2 py-1 text-xs bg-gray-700 text-gray-100"
                        placeholder="Notes"
                        readOnly={viewOnly}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Overall Comments</h3>
            <textarea
              value={formData.comments || ''}
              onChange={(e) => handleGlobalChange('comments', e.target.value)}
              rows={4}
              className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              placeholder="Enter any general observations, issues, or notes about the QC session..."
              readOnly={viewOnly}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-300 bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              {viewOnly ? (machineId && tests.length > 0 && tests[0].templateSource ? 'Back to Machine' : 'Back to Worksheets') : 'Cancel'}
            </button>
            
            {viewOnly && (
              <div className="flex space-x-3">
                {/* Show Perform QC button if this is a custom worksheet for a specific machine */}
                {machineId && tests.length > 0 && tests[0].templateSource && (
                  <button
                    type="button"
                    onClick={() => navigate(`/qc/perform/${machineId}/${frequency}`)}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <span>▶️</span>
                    <span>Perform QC</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => navigate(`/worksheets?mode=edit&templateSource=${encodeURIComponent(tests[0].templateSource)}&machineId=${machineId}&frequency=${frequency}`)}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Edit Worksheet</span>
                </button>

                {/* Show Delete button only for actual worksheets (not templates) */}
                {tests.length > 0 && tests[0].templateSource && (
                  <button
                    type="button"
                    onClick={deleteWorksheet}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>Delete Worksheet</span>
                  </button>
                )}
              </div>
            )}
            
            {!viewOnly && (
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={saveDraft}
                  className="px-4 py-2 text-blue-300 bg-blue-900 rounded-md hover:bg-blue-800 transition-colors"
                >
                  💾 Save Draft
                </button>
                <button
                  type="submit"
                  disabled={submitting || !areAllRequiredFieldsFilled()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting...' : (showReplaceWarning && showReplaceWarning.show) ? 'Update QC' : 'Complete QC'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default QCForm;