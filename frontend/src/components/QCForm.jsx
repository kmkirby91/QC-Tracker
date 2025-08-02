import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import DICOMAnalysis from './DICOMAnalysis';
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
  const [showDICOMAnalysis, setShowDICOMAnalysis] = useState(false);
  const [dicomAnalysisResults, setDicomAnalysisResults] = useState(null);
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
        const qcHistoryResponse = await axios.get(`/api/qc/machines/${machineId}/qc-history?type=${foundMachine.type}`);
        const existingDates = qcHistoryResponse.data[frequency]?.map(qc => qc.date) || [];
        setExistingQCDates(existingDates);
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

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    const hasExistingData = existingQCDates.includes(date);
    setShowReplaceWarning(hasExistingData);
    
    if (hasExistingData) {
      await fetchExistingQCData(date);
    } else {
      // Reset form to blank if no existing data
      resetFormToBlank();
    }
  };

  const fetchExistingQCData = async (date) => {
    setLoadingExistingData(true);
    try {
      const response = await axios.get(`/api/qc/machines/${machineId}/qc-history/${date}?type=${machine.type}`);
      const existingQC = response.data[frequency];
      
      if (existingQC) {
        // Populate form with existing data
        const populatedData = { ...formData };
        
        // Fill in test data
        existingQC.tests.forEach(test => {
          populatedData[test.testName] = {
            value: test.value || '',
            result: test.result || '',
            notes: test.notes || ''
          };
        });
        
        // Fill in global fields
        populatedData.performedBy = existingQC.performedBy || '';
        populatedData.comments = existingQC.comments || '';
        
        setFormData(populatedData);
      }
    } catch (error) {
      console.error('Error fetching existing QC data:', error);
      // If error, reset to blank form
      resetFormToBlank();
    } finally {
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

    switch (test.testType) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={testData?.value === true || testData?.value === 'true'}
              onChange={(e) => {
                const value = e.target.checked;
                handleTestChange(testName, 'value', value);
                // Auto-set result based on checkbox
                handleTestChange(testName, 'result', value ? 'pass' : 'fail');
              }}
              disabled={viewOnly}
              className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label className="text-sm text-gray-300">
              {testData?.value === true || testData?.value === 'true' ? 'Checked' : 'Unchecked'}
            </label>
          </div>
        );

      case 'passfail':
        return (
          <select
            value={testData?.result || ''}
            onChange={(e) => {
              handleTestChange(testName, 'result', e.target.value);
              handleTestChange(testName, 'value', e.target.value);
            }}
            disabled={viewOnly}
            className={`${baseClassName} ${errorClassName}`}
          >
            <option value="">Select</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        );

      case 'text':
        return (
          <div className="relative">
            <textarea
              value={testData?.value || ''}
              onChange={(e) => {
                handleTestChange(testName, 'value', e.target.value);
                // Auto-set result for text entry (if provided)
                const result = determineResult(testName, e.target.value);
                if (result) {
                  handleTestChange(testName, 'result', result);
                }
              }}
              className={`${baseClassName} ${errorClassName} pr-12`}
              placeholder="Enter text observation"
              readOnly={viewOnly}
              rows={2}
            />
            {!viewOnly && (
              <div className="absolute right-2 top-2 text-gray-400 text-xs bg-gray-600/50 px-1.5 py-0.5 rounded border border-gray-500/30">
                📝 TEXT
              </div>
            )}
          </div>
        );

      case 'value':
      default:
        // Default numerical value input (existing logic)
        if (isAutomated || (test.calculatedFromDicom && hasValue)) {
          return (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={testData?.value || ''}
                  onChange={(e) => {
                    handleTestChange(testName, 'value', e.target.value, 'manual');
                    // Auto-determine result
                    const result = determineResult(testName, e.target.value);
                    if (result) {
                      handleTestChange(testName, 'result', result);
                    }
                  }}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    testData?.valueSource === 'manual' 
                      ? 'bg-amber-900/30 text-amber-200 border-amber-600' 
                      : 'bg-blue-900/30 text-blue-200 border-blue-600'
                  }`}
                  placeholder={testData?.valueSource === 'manual' ? "Manual override value" : "Will be calculated from DICOM"}
                  readOnly={viewOnly}
                />
                <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs px-1.5 py-0.5 rounded border ${
                  testData?.valueSource === 'manual'
                    ? 'text-amber-300 bg-amber-800/50 border-amber-400/30'
                    : 'text-blue-300 bg-blue-800/50 border-blue-400/30'
                }`}>
                  {testData?.valueSource === 'manual' ? '⚠️ OVERRIDE' : '🤖 AUTO'}
                </div>
              </div>
              {!viewOnly && testData?.valueSource === 'manual' && (
                <div className="flex items-center justify-between bg-amber-900/20 border border-amber-700/50 rounded px-2 py-1">
                  <span className="text-xs text-amber-300">
                    ⚠️ Manual override active
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleTestChange(testName, 'value', '');
                      setFormData(prev => ({
                        ...prev,
                        [testName]: {
                          ...prev[testName],
                          valueSource: undefined,
                          manuallyEnteredAt: undefined
                        }
                      }));
                    }}
                    className="text-xs text-amber-300 hover:text-amber-200 underline"
                  >
                    Reset to Auto
                  </button>
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div className="relative">
              <input
                type="number"
                step="any"
                value={testData?.value || ''}
                onChange={(e) => {
                  handleTestChange(testName, 'value', e.target.value);
                  // Auto-determine result
                  const result = determineResult(testName, e.target.value);
                  if (result) {
                    handleTestChange(testName, 'result', result);
                  }
                }}
                className={`${baseClassName} ${errorClassName} pr-12`}
                placeholder={test.placeholder || "Enter numerical value"}
                readOnly={viewOnly}
              />
              {!viewOnly && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs bg-gray-600/50 px-1.5 py-0.5 rounded border border-gray-500/30">
                  🔢 NUMBER
                </div>
              )}
            </div>
          );
        }
    }
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    // Generate dates for the past 30 days up to today (no future dates)
    for (let i = -30; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for daily QC
      if (frequency === 'daily' && (date.getDay() === 0 || date.getDay() === 6)) {
        continue;
      }
      
      const dateStr = date.toISOString().split('T')[0];
      const hasData = existingQCDates.includes(dateStr);
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isDueDate = qcDueDates.includes(dateStr);
      
      let label = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
      
      if (isToday) label += ' (Today)';
      if (hasData) label += ' ✓';
      if (isDueDate && !hasData) label += ' 📅';
      
      options.push({
        value: dateStr,
        label: label,
        hasData: hasData,
        isToday: isToday,
        isDueDate: isDueDate
      });
    }
    
    return options.reverse(); // Most recent dates first
  };

  const determineResult = (testName, value) => {
    // Auto-determine pass/fail based on test criteria
    if (!value) return '';
    
    if (testName === 'Table Positioning') {
      const deviation = parseFloat(value);
      return Math.abs(deviation) <= 5 ? 'pass' : 'fail';
    } else if (testName === 'Center (Central) Frequency') {
      const freq = parseFloat(value);
      const expectedFreq = 63.86; // MHz at 1.5T
      const ppmDrift = Math.abs((freq - expectedFreq) / expectedFreq * 1e6);
      return ppmDrift <= 3 ? 'pass' : 'fail';
    } else if (testName === 'Transmitter Gain or Attenuation') {
      const change = parseFloat(value);
      return Math.abs(change) <= 5 ? 'pass' : 'fail';
    } else if (testName === 'Geometric Accuracy') {
      const error = parseFloat(value);
      return Math.abs(error) <= 2 ? 'pass' : 'fail';
    } else if (testName === 'Low Contrast Resolution (Detectability)') {
      const objects = parseInt(value);
      return objects >= 37 ? 'pass' : 'fail';
    }
    
    return 'pass'; // Default for qualitative tests
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
          result: formData[test.testName]?.result || determineResult(test.testName, formData[test.testName]?.value),
          notes: formData[test.testName]?.notes || '',
          tolerance: test.tolerance || '',
          performedBy: formData.performedBy
        })),
        performedBy: formData.performedBy,
        comments: formData.comments,
        overallResult: tests.some(test => 
          (formData[test.testName]?.result || determineResult(test.testName, formData[test.testName]?.value)) === 'fail'
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
      
      // Remove any existing completion for the same machine/frequency/date to avoid duplicates
      const filteredCompletions = existingCompletions.filter(qc => 
        !(qc.machineId === completedQC.machineId && 
          qc.frequency === completedQC.frequency && 
          qc.date === completedQC.date)
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
          
          {/* Date Selection - Hide in view-only mode */}
          {!viewOnly && (
            <div className="mt-4 p-4 bg-blue-900 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-200 mb-2">QC Date Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Select Date for QC *
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                    required
                  >
                    {generateDateOptions().map(option => (
                      <option 
                        key={option.value} 
                        value={option.value}
                        style={{
                          backgroundColor: option.hasData ? '#374151' : 
                                         option.isDueDate ? '#92400e' : '#064e3b',
                          color: option.hasData ? '#d1d5db' : 
                                option.isDueDate ? '#fbbf24' : '#86efac'
                        }}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-400">
                    <span className="inline-block w-3 h-3 bg-green-900 border border-green-600 rounded mr-1"></span>
                    Available dates
                    <span className="inline-block w-3 h-3 bg-yellow-900 border border-yellow-600 rounded mr-1 ml-3"></span>
                    Scheduled QC due 📅
                    <span className="inline-block w-3 h-3 bg-gray-900 border border-gray-600 rounded mr-1 ml-3"></span>
                    Data exists ✓
                  </div>
                </div>
                {loadingExistingData && (
                  <div className="bg-blue-900 border border-blue-700 rounded-md p-3">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                      <p className="text-sm text-blue-300">Loading existing QC data...</p>
                    </div>
                  </div>
                )}
                
                {showReplaceWarning && !loadingExistingData && (
                  <div className="bg-amber-900 border border-amber-700 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-amber-200">
                          Editing Existing Data
                        </h4>
                        <p className="text-sm text-amber-300 mt-1">
                          Form has been populated with existing QC data for this date. You can review and modify the values below. Submitting will replace the existing data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
              }}
              viewOnly={viewOnly}
            />
          )}

          {/* DICOM Analysis Integration - shown when series are selected */}
          {!viewOnly && machine && selectedDICOMSeries.length > 0 && (machine.type === 'CT' || machine.type === 'MRI') && (
            <DICOMAnalysis 
              machineId={machineId}
              frequency={frequency}
              worksheetData={{ modality: machine.type, tests }}
              selectedSeries={selectedDICOMSeries}
              onAnalysisComplete={(results) => {
                setDicomAnalysisResults(results);
                // Auto-populate form fields with DICOM analysis results
                if (results && results.measurements) {
                  const newFormData = { ...formData };
                  Object.entries(results.measurements).forEach(([testName, measurement]) => {
                    if (newFormData[testName]) {
                      newFormData[testName] = {
                        ...newFormData[testName],
                        value: measurement.value,
                        result: measurement.status,
                        valueSource: 'automated',
                        automatedAt: new Date().toISOString(),
                        automatedFrom: 'dicom_analysis'
                      };
                    }
                  });
                  setFormData(newFormData);
                  // Success notification removed
                }
              }}
            />
          )}

          {/* QC Tests */}
          <div>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">{machine.type} {frequency} QC Tests</h3>
            
            {/* Template Source Information */}
            {tests.length > 0 && tests[0].templateSource && (
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                <div className="text-sm text-blue-300 font-medium">
                  📋 Worksheet based on: {tests[0].templateSource}
                </div>
                <div className="text-xs text-blue-200 mt-1">
                  Custom fields and modifications are marked with 🔧
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-100 mb-1">
                        {test.name || test.testName}
                        {test.required !== false && (
                          <span className="text-red-400 ml-1">*</span>
                        )}
                        {test.isCustomField && (
                          <span className="ml-2 text-xs text-blue-400 font-bold">🔧 Custom</span>
                        )}
{(() => {
                          const testName = test.name || test.testName;
                          const valueSource = formData[testName]?.valueSource;
                          const isAutomated = valueSource === 'automated' || (test.calculatedFromDicom && !valueSource);
                          
                          if (valueSource === 'manual' && test.calculatedFromDicom) {
                            return (
                              <span className="ml-2 text-xs text-amber-400 font-bold bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/50">
                                ⚠️ Overridden
                              </span>
                            );
                          } else if (isAutomated) {
                            return (
                              <span className="ml-2 text-xs text-blue-400 font-bold bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/50">
                                🤖 Automated
                              </span>
                            );
                          } else {
                            return (
                              <span className="ml-2 text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded border border-gray-600/50">
                                ✋ Manual Entry
                              </span>
                            );
                          }
                        })()}
                      </label>
                      {test.tolerance && (
                        <p className="text-xs text-gray-400">
                          Tolerance: {
                            typeof test.tolerance === 'string' ? test.tolerance :
                            test.tolerance?.lowerLimit && test.tolerance?.upperLimit ? 
                              `${test.tolerance.lowerLimit} - ${test.tolerance.upperLimit}` :
                            test.tolerance?.lowerLimit ? 
                              `Min: ${test.tolerance.lowerLimit}` :
                            test.tolerance?.upperLimit ?
                              `Max: ${test.tolerance.upperLimit}` :
                            'N/A'
                          }
                        </p>
                      )}
                      {test.units && (
                        <p className="text-xs text-gray-400">Units: {test.units}</p>
                      )}
                      {test.calculatedFromDicom && (
                        <div className="text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded mt-1 border border-blue-600/30">
                          <div className="flex items-center">
                            <span className="mr-1">🤖</span>
                            <span className="font-medium">Automated Analysis</span>
                          </div>
                          <p className="text-blue-200 mt-0.5">
                            Value will be calculated from DICOM images
                          </p>
                          {test.dicomSeriesSource && (
                            <div className="text-xs text-blue-200 mt-1 flex items-center">
                              <span className="mr-1">📊</span>
                              <span>Source: {test.dicomSeriesSourceName || test.dicomSeriesSource}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {test.description && (
                        <p className="text-xs text-gray-400 mt-1">{test.description}</p>
                      )}
                    </div>
                    
                    <div>
                      {(() => {
                        const testName = test.name || test.testName;
                        const testData = formData[testName];
                        const valueSource = testData?.valueSource;
                        const isAutomated = valueSource === 'automated' || (test.calculatedFromDicom && !valueSource);
                        const hasValue = testData?.value;
                        
                        // For pass/fail tests, don't show the value label since they use buttons
                        if (test.testType === 'passfail') {
                          return renderTestInput(test, testName);
                        }
                        
                        return (
                          <>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              {test.testType === 'checkbox' ? 'Check if applicable' :
                               test.testType === 'text' ? 'Observation' :
                               testData?.valueSource === 'manual' ? 'Override Value' : 
                               isAutomated || (test.calculatedFromDicom && hasValue) ? 'Calculated Value' : 'Measured Value'}
                            </label>
                            {renderTestInput(test, testName)}
                          </>
                        );
                      })()}
                    </div>
                    
                    {test.testType !== 'passfail' && test.testType !== 'checkbox' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Result{test.required !== false && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </label>
                        <select
                          value={formData[test.name || test.testName]?.result || ''}
                          onChange={(e) => handleTestChange(test.name || test.testName, 'result', e.target.value)}
                          className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 text-gray-100 ${
                            (test.required !== false && (!formData[test.name || test.testName]?.result || formData[test.name || test.testName]?.result.trim() === '')) 
                              ? 'border-red-500 focus:ring-red-500 bg-gray-700' 
                              : formData[test.name || test.testName]?.result === 'fail' ? 'bg-red-900 border-gray-600 focus:ring-blue-500' : 
                                formData[test.name || test.testName]?.result === 'pass' ? 'bg-green-900 border-gray-600 focus:ring-blue-500' : 
                                'bg-gray-700 border-gray-600 focus:ring-blue-500'
                          }`}
                          disabled={viewOnly}
                        >
                          <option value="">Select</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="conditional">Conditional</option>
                        </select>
                      </div>
                    )}
                    
                    {(test.testType === 'passfail' || test.testType === 'checkbox') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Result
                        </label>
                        <div className={`w-full border rounded-md px-3 py-2 text-sm text-center font-medium ${
                          formData[test.name || test.testName]?.result === 'fail' ? 'bg-red-900 text-red-200 border-red-600' : 
                          formData[test.name || test.testName]?.result === 'pass' ? 'bg-green-900 text-green-200 border-green-600' : 
                          'bg-gray-700 text-gray-400 border-gray-600'
                        }`}>
                          {formData[test.name || test.testName]?.result ? 
                            (formData[test.name || test.testName]?.result === 'pass' ? '✓ Pass' : '✗ Fail') : 
                            'Not set'}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={formData[test.name || test.testName]?.notes || ''}
                        onChange={(e) => handleTestChange(test.name || test.testName, 'notes', e.target.value)}
                        className="w-full border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                        placeholder="Optional notes"
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
                  {submitting ? 'Submitting...' : showReplaceWarning ? 'Update QC Data' : 'Complete QC'}
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