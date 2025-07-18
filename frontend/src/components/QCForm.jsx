import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import DICOMAnalysis from './DICOMAnalysis';
import DICOMSeriesSelector from './DICOMSeriesSelector';

const QCForm = ({ viewOnly = false }) => {
  const { machineId, frequency, machineType } = useParams();
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

  useEffect(() => {
    fetchMachineAndTests();
  }, [machineId, frequency, machineType, viewOnly]);

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
          const customWorksheet = worksheets.find(ws => 
            ws.modality === foundMachine.type && 
            ws.frequency === frequency && 
            ws.assignedMachines && 
            ws.assignedMachines.includes(foundMachine.machineId) &&
            ws.isWorksheet === true // Only actual worksheets, not templates
          );
          
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
            
            toast.success(`Loaded saved draft from ${new Date(draftData.savedAt).toLocaleString()}`);
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

  const handleTestChange = (testName, field, value) => {
    setFormData(prev => ({
      ...prev,
      [testName]: {
        ...prev[testName],
        [field]: value
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
      
      let label = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
      
      if (isToday) label += ' (Today)';
      if (hasData) label += ' ✓';
      
      options.push({
        value: dateStr,
        label: label,
        hasData: hasData,
        isToday: isToday
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
      
      toast.success('QC draft saved successfully!');
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
        ) ? 'fail' : 'pass'
      };

      await axios.post(`/api/qc/submit`, qcData);
      
      // Clear any saved draft after successful submission
      const draftKey = `qc_draft_${machineId}_${frequency}_${selectedDate}`;
      localStorage.removeItem(draftKey);
      
      navigate(`/machines/${machineId}`, { 
        state: { message: `${frequency} QC completed successfully!` }
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
          toast.success('Worksheet deleted successfully');
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
                          backgroundColor: option.hasData ? '#374151' : '#064e3b',
                          color: option.hasData ? '#d1d5db' : '#86efac'
                        }}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-400">
                    <span className="inline-block w-3 h-3 bg-green-900 border border-green-600 rounded mr-1"></span>
                    Available dates
                    <span className="inline-block w-3 h-3 bg-gray-900 border border-gray-600 rounded mr-1 ml-3"></span>
                    Data exists
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
                        result: measurement.status
                      };
                    }
                  });
                  setFormData(newFormData);
                  toast.success('QC values populated from DICOM analysis');
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
                        {test.isCustomField && (
                          <span className="ml-2 text-xs text-blue-400 font-bold">🔧 Custom</span>
                        )}
                        {test.calculatedFromDicom && (
                          <span className="ml-2 text-xs text-blue-400 font-bold">📊 Auto-Calc</span>
                        )}
                      </label>
                      {test.tolerance && (
                        <p className="text-xs text-gray-400">Tolerance: {test.tolerance}</p>
                      )}
                      {test.units && (
                        <p className="text-xs text-gray-400">Units: {test.units}</p>
                      )}
                      {test.calculatedFromDicom && (
                        <p className="text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded mt-1">
                          📊 Automatically calculated from DICOM data
                          {test.dicomSeriesSource && (
                            <span className="block text-xs text-blue-200 mt-1">
                              Source: {test.dicomSeriesSourceName || test.dicomSeriesSource}
                            </span>
                          )}
                        </p>
                      )}
                      {test.description && (
                        <p className="text-xs text-gray-400 mt-1">{test.description}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        {test.calculatedFromDicom ? 'Calculated Value' : 'Measured Value'}
                      </label>
                      {test.calculatedFromDicom ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={formData[test.name || test.testName]?.value || ''}
                            className="w-full border border-gray-600 rounded-md px-3 py-2 text-sm bg-blue-900/30 text-blue-200 border-blue-600"
                            placeholder="Will be calculated from DICOM"
                            readOnly
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 text-xs">
                            📊 Auto
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData[test.name || test.testName]?.value || ''}
                          onChange={(e) => {
                            const testName = test.name || test.testName;
                            handleTestChange(testName, 'value', e.target.value);
                            // Auto-determine result
                            const result = determineResult(testName, e.target.value);
                            if (result) {
                              handleTestChange(testName, 'result', result);
                            }
                          }}
                          className="w-full border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                          placeholder={test.placeholder || "Enter value"}
                          readOnly={viewOnly}
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Result
                      </label>
                      <select
                        value={formData[test.name || test.testName]?.result || ''}
                        onChange={(e) => handleTestChange(test.name || test.testName, 'result', e.target.value)}
                        className={`w-full border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 ${
                          formData[test.name || test.testName]?.result === 'fail' ? 'bg-red-900' : 
                          formData[test.name || test.testName]?.result === 'pass' ? 'bg-green-900' : ''
                        }`}
                        disabled={viewOnly}
                      >
                        <option value="">Select</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                        <option value="conditional">Conditional</option>
                      </select>
                    </div>
                    
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
                  disabled={submitting || !formData.performedBy}
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