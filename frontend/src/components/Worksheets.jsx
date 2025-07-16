import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { checkAndInitializeSampleData } from '../utils/sampleWorksheets';
import DICOMSeriesSelector from './DICOMSeriesSelector';

const Worksheets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [loading, setLoading] = useState(true);
  const [worksheetData, setWorksheetData] = useState(null);
  const [loadingWorksheet, setLoadingWorksheet] = useState(false);
  
  // Wrapper to add debugging to setWorksheetData
  const setWorksheetDataSafe = (data) => {
    console.log('Setting worksheetData:', data);
    if (data && !data.machine && data.machineId) {
      // Try to find machine data if machineId is provided
      const machine = machines.find(m => m.machineId === data.machineId);
      if (machine) {
        data.machine = machine;
        console.log('Added machine data to worksheet:', machine);
      }
    }
    setWorksheetData(data);
  };
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'worksheets', 'custom', 'templates', or 'view-only'
  const [customTests, setCustomTests] = useState([
    { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '' }
  ]);
  const [customWorksheetInfo, setCustomWorksheetInfo] = useState({
    title: '',
    frequency: 'daily',
    machineId: '',
    modality: '',
    description: ''
  });
  const [templateMode, setTemplateMode] = useState('manage'); // 'manage'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateForGeneration, setSelectedTemplateForGeneration] = useState('');
  const [templateJustLoaded, setTemplateJustLoaded] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [expandedMachines, setExpandedMachines] = useState(new Set());
  const [modalityTemplateInfo, setModalityTemplateInfo] = useState({
    title: '',
    frequency: 'daily',
    machineId: '',
    modality: '',
    description: ''
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterMachine, setFilterMachine] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  const [filterModality, setFilterModality] = useState('');
  // Overview page filters
  const [overviewFilterLocation, setOverviewFilterLocation] = useState('');
  const [overviewFilterModality, setOverviewFilterModality] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({});
  const [realTimeModifications, setRealTimeModifications] = useState([]);
  const [hasRealTimeModifications, setHasRealTimeModifications] = useState(false);
  const [matchedToTemplate, setMatchedToTemplate] = useState(false);

  const frequencies = [
    { value: 'daily', label: 'Daily QC', icon: '📅' },
    { value: 'weekly', label: 'Weekly QC', icon: '📆' },
    { value: 'monthly', label: 'Monthly QC', icon: '📊' },
    { value: 'quarterly', label: 'Quarterly QC', icon: '🗓️' },
    { value: 'annual', label: 'Annual QC', icon: '📋' }
  ];

  const modalities = [
    { value: 'MRI', label: 'MRI', icon: '🧲' },
    { value: 'CT', label: 'CT', icon: '💽' },
    { value: 'PET', label: 'PET', icon: '☢️' },
    { value: 'PET-CT', label: 'PET-CT', icon: '🔬' },
    { value: 'X-Ray', label: 'X-Ray', icon: '📱' },
    { value: 'Ultrasound', label: 'Ultrasound', icon: '🔊' },
    { value: 'Mammography', label: 'Mammography', icon: '🎯' },
    { value: 'Dose Calibrator', label: 'Dose Calibrator', icon: '⚗️' }
  ];

  // Template copying functionality - each machine gets its own worksheet copy

  useEffect(() => {
    fetchMachines();
    // Initialize sample data if needed (SOMATOM Force CT with daily QC only)
    const sampleDataResult = checkAndInitializeSampleData();
    if (sampleDataResult) {
      toast.success('Sample QC worksheets loaded for demonstration');
    }
    initializeSampleTemplates();
  }, []);

  // Real-time modification detection
  useEffect(() => {
    console.log('DEBUG: Real-time detection useEffect triggered', {
      hasSelectedTemplate: !!selectedTemplate,
      templateJustLoaded: templateJustLoaded,
      matchedToTemplate: matchedToTemplate,
      customTestsLength: customTests.length,
      templateTestsLength: selectedTemplate?.tests?.length || 0,
      customTitle: customWorksheetInfo.title,
      templateTitle: selectedTemplate?.title,
      customDescription: customWorksheetInfo.description,
      templateDescription: selectedTemplate?.description
    });

    if (selectedTemplate && matchedToTemplate) {
      // Calculate modifications based on current form state
      const titleChanged = customWorksheetInfo.title !== selectedTemplate.title;
      const descriptionChanged = (customWorksheetInfo.description || '').trim() !== (selectedTemplate.description || '').trim();
      const modifications = calculateModifications(selectedTemplate, customTests.filter(test => test.testName.trim() !== ''));
      
      // Add title and description changes to modifications
      const allModifications = [...modifications];
      if (titleChanged) {
        allModifications.unshift(`Title changed from "${selectedTemplate.title}" to "${customWorksheetInfo.title}"`);
      }
      if (descriptionChanged) {
        allModifications.unshift('Description modified');
      }
      
      // If there are any modifications and template was just loaded, clear the just loaded flag
      if (allModifications.length > 0 && templateJustLoaded) {
        console.log('DEBUG: User made changes, clearing templateJustLoaded flag');
        setTemplateJustLoaded(false);
      }
      
      // Only show modifications if template wasn't just loaded OR if user has made changes
      if (!templateJustLoaded || allModifications.length > 0) {
        setRealTimeModifications(allModifications);
        setHasRealTimeModifications(allModifications.length > 0);
        console.log('DEBUG: Setting real-time modifications:', allModifications);
      } else {
        setRealTimeModifications([]);
        setHasRealTimeModifications(false);
        console.log('DEBUG: Template just loaded, not showing modifications yet');
      }
    } else {
      // Clear modifications if no template selected
      setRealTimeModifications([]);
      setHasRealTimeModifications(false);
      console.log('DEBUG: No template selected or not matched to template, clearing modifications');
    }
  }, [selectedTemplate, templateJustLoaded, matchedToTemplate, customWorksheetInfo.title, customWorksheetInfo.description, customTests]);

  useEffect(() => {
    // Handle URL parameters for editing
    const editMachineType = searchParams.get('edit');
    const editFrequency = searchParams.get('frequency');
    
    if (editMachineType && editFrequency) {
      // Load the modality template for editing
      loadModalityTemplateForEdit(editMachineType, editFrequency);
    }
  }, [searchParams]);

  const initializeSampleTemplates = () => {
    const existingTemplates = getModalityTemplates();
    if (existingTemplates.length === 0) {
      // Create sample templates for testing
      const sampleTemplates = [
        {
          id: Date.now() + 1,
          title: 'MRI Daily QC Template',
          modality: 'MRI',
          frequency: 'daily',
          description: 'Standard daily QC tests for MRI equipment',
          tests: [
            { id: 1, testName: 'Signal-to-Noise Ratio', testType: 'value', tolerance: '>100', units: 'SNR', notes: 'Check phantom signal uniformity' },
            { id: 2, testName: 'Center Frequency', testType: 'value', tolerance: '±50', units: 'Hz', notes: 'Verify scanner frequency calibration' },
            { id: 3, testName: 'Transmit Gain', testType: 'value', tolerance: '±10%', units: 'dB', notes: 'Check RF power output' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: Date.now() + 2,
          title: 'CT Daily QC Template',
          modality: 'CT',
          frequency: 'daily',
          description: 'Standard daily QC tests for CT equipment',
          tests: [
            { id: 1, testName: 'Water CT Number', testType: 'value', tolerance: '0 ± 5', units: 'HU', notes: 'Check water phantom calibration' },
            { id: 2, testName: 'Noise Level', testType: 'value', tolerance: '<10', units: 'HU', notes: 'Measure image noise in water phantom' },
            { id: 3, testName: 'Uniformity', testType: 'value', tolerance: '±5', units: 'HU', notes: 'Check peripheral vs center ROI' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: Date.now() + 3,
          title: 'X-Ray Weekly QC Template',
          modality: 'X-Ray',
          frequency: 'weekly',
          description: 'Weekly QC tests for X-Ray equipment',
          tests: [
            { id: 1, testName: 'Exposure Reproducibility', testType: 'value', tolerance: '±5%', units: '%', notes: 'Test multiple exposures at same settings' },
            { id: 2, testName: 'kVp Accuracy', testType: 'value', tolerance: '±5%', units: 'kVp', notes: 'Verify kilovoltage peak accuracy' },
            { id: 3, testName: 'Half Value Layer', testType: 'value', tolerance: '±0.1', units: 'mm Al', notes: 'Beam quality assessment' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: Date.now() + 4,
          title: 'PET-CT Daily PET QC Template',
          modality: 'PET-CT',
          frequency: 'daily',
          description: 'Daily PET component QC tests for PET-CT equipment',
          tests: [
            { id: 1, testName: 'Detector Normalization', testType: 'value', tolerance: '±5%', units: '%', notes: 'Check PET detector uniformity' },
            { id: 2, testName: 'Coincidence Timing', testType: 'value', tolerance: '±2', units: 'ns', notes: 'Verify timing window calibration' },
            { id: 3, testName: 'Energy Resolution', testType: 'value', tolerance: '±10%', units: '%', notes: 'Check energy peak resolution' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: Date.now() + 5,
          title: 'PET-CT Daily CT QC Template',
          modality: 'PET-CT',
          frequency: 'daily',
          description: 'Daily CT component QC tests for PET-CT equipment',
          tests: [
            { id: 1, testName: 'Water CT Number', testType: 'value', tolerance: '0 ± 5', units: 'HU', notes: 'Check CT water phantom calibration' },
            { id: 2, testName: 'CT Noise Level', testType: 'value', tolerance: '<8', units: 'HU', notes: 'Measure CT image noise' },
            { id: 3, testName: 'CT Uniformity', testType: 'value', tolerance: '±5', units: 'HU', notes: 'Check CT uniformity across field' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('qcModalityTemplates', JSON.stringify(sampleTemplates));
      console.log('Sample templates created for testing read-only functionality');
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axios.get('/api/machines');
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  const handleMachineChange = (e) => {
    setSelectedMachine(e.target.value);
    setSelectedFrequency('');
    setWorksheetData(null);
  };

  const handleFrequencyChange = (e) => {
    setSelectedFrequency(e.target.value);
  };

  const generateWorksheet = async (machineId = selectedMachine, frequency = selectedFrequency, viewOnly = false) => {
    if (!machineId || !frequency) {
      toast.error('Please select both a machine and QC frequency');
      return;
    }

    setLoadingWorksheet(true);
    try {
      const machine = machines.find(m => m.machineId === machineId);
      const response = await axios.get(`/api/worksheets/${machine.type}/${frequency}`);
      setWorksheetData({
        machine,
        frequency: frequency,
        tests: response.data,
        viewOnly: viewOnly
      });
      setViewMode(viewOnly ? 'view-only' : 'templates');
    } catch (error) {
      console.error('Error generating worksheet:', error);
      toast.error('Failed to generate worksheet');
    } finally {
      setLoadingWorksheet(false);
    }
  };

  const generateQuickWorksheet = async (machine, frequency) => {
    setSelectedMachine(machine.machineId);
    setSelectedFrequency(frequency);
    await generateWorksheet(machine.machineId, frequency);
  };

  const printWorksheet = () => {
    window.print();
  };

  const performQC = (machineId = selectedMachine, frequency = selectedFrequency) => {
    navigate(`/qc/perform/${machineId}/${frequency}`);
  };

  const getFrequencyIcon = (freq) => {
    const frequency = frequencies.find(f => f.value === freq);
    return frequency ? frequency.icon : '📋';
  };

  const getFrequencyLabel = (freq) => {
    const frequency = frequencies.find(f => f.value === freq);
    return frequency ? frequency.label : freq;
  };

  const getFrequencyColor = (freq) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-800 border-blue-200',
      weekly: 'bg-green-100 text-green-800 border-green-200',
      monthly: 'bg-purple-100 text-purple-800 border-purple-200',
      quarterly: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      annual: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[freq] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getAvailableFrequencies = (machineType) => {
    const typeFrequencies = {
      'MRI': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
      'CT': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
      'PET': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
      'PET-CT': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
      'X-Ray': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
      'Ultrasound': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
      'Mammography': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
      'Dose Calibrator': ['quarterly', 'annual']
    };
    return typeFrequencies[machineType] || [];
  };

  const getAssignedFrequencies = (machine) => {
    // Only return frequencies where the machine has actual worksheets assigned
    const assignedFrequencies = [];
    const worksheets = getWorksheets();
    
    console.log('DEBUG getAssignedFrequencies for machine:', machine?.machineId, machine?.name);
    console.log('DEBUG Total worksheets:', worksheets.length);
    console.log('DEBUG Worksheets:', worksheets.map(w => ({
      id: w.id,
      title: w.title, 
      modality: w.modality, 
      frequency: w.frequency,
      assignedMachines: w.assignedMachines
    })));
    
    if (machine) {
      getAllFrequencies().forEach(frequency => {
        const matchingWorksheets = worksheets.filter(ws => 
          ws.modality === machine.type && 
          ws.frequency === frequency
        );
        console.log(`DEBUG Checking frequency ${frequency} for machine type ${machine.type}:`, matchingWorksheets.length, 'matching worksheets');
        
        const hasWorksheet = worksheets.some(ws => 
          ws.modality === machine.type && 
          ws.frequency === frequency && 
          ws.assignedMachines && 
          ws.assignedMachines.includes(machine.machineId)
        );
        
        if (hasWorksheet) {
          console.log(`DEBUG Found assigned worksheet for ${frequency}`);
          assignedFrequencies.push(frequency);
        }
      });
    }
    
    console.log('DEBUG Final assigned frequencies:', assignedFrequencies);
    return assignedFrequencies;
  };

  // Custom worksheet functions
  const addCustomTest = () => {
    const newTest = {
      id: Math.max(...customTests.map(t => t.id)) + 1,
      testName: '',
      testType: 'value',
      tolerance: '',
      units: '',
      notes: ''
    };
    setCustomTests([...customTests, newTest]);
  };

  const removeCustomTest = (id) => {
    if (customTests.length > 1) {
      console.log('DEBUG: Removing test with id:', id, 'from', customTests.length, 'tests');
      const newTests = customTests.filter(test => test.id !== id);
      setCustomTests(newTests);
      console.log('DEBUG: Tests after removal:', newTests.length);
    }
  };

  const updateCustomTest = (id, field, value) => {
    console.log('DEBUG: Updating test', id, 'field', field, 'to value:', value);
    const newTests = customTests.map(test => 
      test.id === id ? { ...test, [field]: value } : test
    );
    setCustomTests(newTests);
  };

  const updateCustomWorksheetInfo = (field, value) => {
    console.log('DEBUG: Updating worksheet info', field, 'to:', value);
    setCustomWorksheetInfo(prev => ({ ...prev, [field]: value }));
  };

  const generateCustomWorksheet = () => {
    if (!customWorksheetInfo.title || !customWorksheetInfo.machineId) {
      toast.error('Please provide worksheet title and select a machine');
      return;
    }

    const selectedMachineData = machines.find(m => m.machineId === customWorksheetInfo.machineId);
    if (!selectedMachineData) {
      toast.error('Selected machine not found');
      return;
    }

    const customWorksheetData = {
      machine: selectedMachineData,
      frequency: customWorksheetInfo.frequency,
      title: customWorksheetInfo.title,
      description: customWorksheetInfo.description,
      tests: customTests.filter(test => test.testName.trim() !== '').map(test => ({
        name: test.testName,
        type: test.testType,
        tolerance: test.tolerance,
        units: test.units,
        notes: test.notes
      })),
      isCustom: true
    };

    // Calculate modifications if created from template AND matched to template
    const baseTemplate = selectedTemplate && matchedToTemplate ? selectedTemplate : null;
    const modifications = baseTemplate ? calculateModifications(baseTemplate, customTests.filter(test => test.testName.trim() !== '')) : [];

    // Prepare tests with custom field tracking (only if matched to template)
    const processedTests = customTests.filter(test => test.testName.trim() !== '').map(test => {
      const isCustomField = (selectedTemplate && matchedToTemplate) ? 
        !selectedTemplate.tests.some(templateTest => templateTest.testName === test.testName) : 
        true;
      
      return {
        ...test,
        templateSource: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
        isCustomField: isCustomField,
        customFieldType: isCustomField ? 'user-added' : 'template-default'
      };
    });

    // Save the custom worksheet using the new saveWorksheet function
    const savedWorksheet = saveWorksheet({
      title: customWorksheetInfo.title,
      description: customWorksheetInfo.description,
      modality: selectedMachineData.type,
      frequency: customWorksheetInfo.frequency,
      tests: processedTests,
      templateSource: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
      templateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null,
      baseTemplate: baseTemplate,
      modifications: modifications
    });

    // Auto-assign to the selected machine
    if (savedWorksheet) {
      const assignmentSuccess = assignWorksheetToMachine(savedWorksheet.id, selectedMachineData.machineId);
      if (assignmentSuccess) {
        // Force refresh to show updated assignments
        setRefreshKey(prev => prev + 1);
        // Trigger storage event for other components
        window.dispatchEvent(new Event('storage'));
      }
    }

    setWorksheetData(customWorksheetData);
    setViewMode('overview'); // Switch to overview to see the newly assigned worksheet
    toast.success(`Custom worksheet saved and assigned to ${selectedMachineData.name}!`);
  };

  const saveCustomTemplate = () => {
    if (!customWorksheetInfo.title) {
      toast.error('Please provide a template name');
      return;
    }

    const template = {
      id: Date.now(),
      title: customWorksheetInfo.title,
      frequency: customWorksheetInfo.frequency,
      description: customWorksheetInfo.description,
      tests: customTests.filter(test => test.testName.trim() !== ''),
      createdAt: new Date().toISOString()
    };

    const savedTemplates = JSON.parse(localStorage.getItem('qcCustomTemplates') || '[]');
    savedTemplates.push(template);
    localStorage.setItem('qcCustomTemplates', JSON.stringify(savedTemplates));
    
    toast.success('Template saved successfully!');
  };

  // Consolidated template system - using only modality templates

  const getModalityTemplates = () => {
    return JSON.parse(localStorage.getItem('qcModalityTemplates') || '[]');
  };

  const getGroupedModalityTemplates = () => {
    const templates = getModalityTemplates();
    const frequencyOrder = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
    
    // Group by modality
    const grouped = templates.reduce((acc, template) => {
      if (!acc[template.modality]) {
        acc[template.modality] = [];
      }
      acc[template.modality].push(template);
      return acc;
    }, {});
    
    // Sort each modality group by frequency
    Object.keys(grouped).forEach(modality => {
      grouped[modality].sort((a, b) => {
        const aIndex = frequencyOrder.indexOf(a.frequency);
        const bIndex = frequencyOrder.indexOf(b.frequency);
        return aIndex - bIndex;
      });
    });
    
    // Sort modalities alphabetically and return as array of groups
    return Object.keys(grouped)
      .sort()
      .map(modality => ({
        modality,
        templates: grouped[modality]
      }));
  };

  const getCustomWorksheets = () => {
    return JSON.parse(localStorage.getItem('qcCustomWorksheets') || '[]');
  };

  const isWorksheetActuallyCustomized = (baseTemplate, customTests, customWorksheetInfo) => {
    if (!baseTemplate || !baseTemplate.tests) {
      // If no base template, it's considered custom
      return true;
    }

    // Check if title was changed from default
    const defaultTitle = `${customWorksheetInfo.modality} ${customWorksheetInfo.frequency} QC`;
    if (customWorksheetInfo.title !== defaultTitle && 
        customWorksheetInfo.title !== `${customWorksheetInfo.modality} ${customWorksheetInfo.frequency}`) {
      return true;
    }

    // Check if description was added
    if (customWorksheetInfo.description && customWorksheetInfo.description.trim() !== '') {
      return true;
    }

    // Check if tests were modified
    const modifications = calculateModifications(baseTemplate, customTests);
    return modifications.length > 0;
  };

  const calculateModifications = (baseTemplate, customTests) => {
    const modifications = [];
    
    if (!baseTemplate || !baseTemplate.tests) {
      return modifications;
    }
    
    const baseTests = baseTemplate.tests;
    const filteredCustomTests = customTests.filter(test => test.testName.trim() !== '');
    
    // Normalize strings for comparison
    const normalizeString = (str) => (str || '').trim();
    
    // Create a map to track which base tests have been matched
    const baseTestMatched = new Array(baseTests.length).fill(false);
    const customTestMatched = new Array(filteredCustomTests.length).fill(false);
    
    // First pass: Try to match tests by name (exact matches)
    for (let i = 0; i < filteredCustomTests.length; i++) {
      const customTest = filteredCustomTests[i];
      const customTestName = normalizeString(customTest.testName);
      
      if (customTestName) {
        // Look for exact name match in base tests
        const baseIndex = baseTests.findIndex((baseTest, idx) => 
          !baseTestMatched[idx] && 
          normalizeString(baseTest.testName) === customTestName
        );
        
        if (baseIndex !== -1) {
          // Found exact match - check for field modifications
          const baseTest = baseTests[baseIndex];
          const changes = [];
          
          // Check each field for changes (name already matches)
          if (normalizeString(baseTest.testType) !== normalizeString(customTest.testType)) {
            changes.push(`type: "${baseTest.testType}" → "${customTest.testType}"`);
          }
          if (normalizeString(baseTest.tolerance) !== normalizeString(customTest.tolerance)) {
            changes.push(`tolerance: "${baseTest.tolerance}" → "${customTest.tolerance}"`);
          }
          if (normalizeString(baseTest.units) !== normalizeString(customTest.units)) {
            changes.push(`units: "${baseTest.units}" → "${customTest.units}"`);
          }
          if (normalizeString(baseTest.notes) !== normalizeString(customTest.notes)) {
            changes.push(`notes: "${baseTest.notes}" → "${customTest.notes}"`);
          }
          if (normalizeString(baseTest.description) !== normalizeString(customTest.description)) {
            changes.push(`description: "${baseTest.description}" → "${customTest.description}"`);
          }
          
          if (changes.length > 0) {
            if (changes.length <= 2) {
              modifications.push(`Test "${baseTest.testName}": ${changes.join(', ')}`);
            } else {
              modifications.push(`Test "${baseTest.testName}": ${changes.length} fields changed`);
            }
          }
          
          // Mark both as matched
          baseTestMatched[baseIndex] = true;
          customTestMatched[i] = true;
        }
      }
    }
    
    // Second pass: Try to match remaining tests by position
    let customIndex = 0;
    let baseIndex = 0;
    
    while (customIndex < filteredCustomTests.length && baseIndex < baseTests.length) {
      // Skip already matched tests
      while (customIndex < filteredCustomTests.length && customTestMatched[customIndex]) {
        customIndex++;
      }
      while (baseIndex < baseTests.length && baseTestMatched[baseIndex]) {
        baseIndex++;
      }
      
      if (customIndex < filteredCustomTests.length && baseIndex < baseTests.length) {
        const customTest = filteredCustomTests[customIndex];
        const baseTest = baseTests[baseIndex];
        
        // Check if this looks like a name change (other fields similar)
        const customTestName = normalizeString(customTest.testName);
        const baseTestName = normalizeString(baseTest.testName);
        
        if (customTestName && baseTestName && customTestName !== baseTestName) {
          // Check if other fields are similar (likely a name change)
          const typeMatch = normalizeString(baseTest.testType) === normalizeString(customTest.testType);
          const toleranceMatch = normalizeString(baseTest.tolerance) === normalizeString(customTest.tolerance);
          const unitsMatch = normalizeString(baseTest.units) === normalizeString(customTest.units);
          
          const similarityCount = [typeMatch, toleranceMatch, unitsMatch].filter(Boolean).length;
          
          if (similarityCount >= 2) {
            // Likely a name change - check for all modifications
            const changes = [];
            
            changes.push(`name: "${baseTest.testName}" → "${customTest.testName}"`);
            
            if (!typeMatch) {
              changes.push(`type: "${baseTest.testType}" → "${customTest.testType}"`);
            }
            if (!toleranceMatch) {
              changes.push(`tolerance: "${baseTest.tolerance}" → "${customTest.tolerance}"`);
            }
            if (!unitsMatch) {
              changes.push(`units: "${baseTest.units}" → "${customTest.units}"`);
            }
            if (normalizeString(baseTest.notes) !== normalizeString(customTest.notes)) {
              changes.push(`notes: "${baseTest.notes}" → "${customTest.notes}"`);
            }
            if (normalizeString(baseTest.description) !== normalizeString(customTest.description)) {
              changes.push(`description: "${baseTest.description}" → "${customTest.description}"`);
            }
            
            if (changes.length <= 2) {
              modifications.push(`Test "${baseTest.testName}": ${changes.join(', ')}`);
            } else {
              modifications.push(`Test "${baseTest.testName}": ${changes.length} fields changed`);
            }
            
            baseTestMatched[baseIndex] = true;
            customTestMatched[customIndex] = true;
          }
        }
        
        customIndex++;
        baseIndex++;
      }
    }
    
    // Third pass: Identify removed tests
    const removedTests = [];
    for (let i = 0; i < baseTests.length; i++) {
      if (!baseTestMatched[i]) {
        removedTests.push(baseTests[i].testName || `Test ${i + 1}`);
      }
    }
    
    if (removedTests.length > 0) {
      if (removedTests.length === 1) {
        modifications.push(`Removed test: ${removedTests[0]}`);
      } else {
        modifications.push(`Removed ${removedTests.length} tests: ${removedTests.join(', ')}`);
      }
    }
    
    // Fourth pass: Identify added tests
    const addedTests = [];
    for (let i = 0; i < filteredCustomTests.length; i++) {
      if (!customTestMatched[i]) {
        const testName = filteredCustomTests[i].testName || `Test ${i + 1}`;
        addedTests.push(testName);
      }
    }
    
    if (addedTests.length > 0) {
      if (addedTests.length === 1) {
        modifications.push(`Added test: ${addedTests[0]}`);
      } else {
        modifications.push(`Added ${addedTests.length} tests: ${addedTests.join(', ')}`);
      }
    }
    
    return modifications;
  };

  const saveWorksheet = (worksheetData) => {
    const worksheets = getWorksheets();
    
    console.log('DEBUG: saveWorksheet called with:', {
      worksheetData: worksheetData,
      selectedTemplate: selectedTemplate,
      hasSelectedTemplate: !!selectedTemplate,
      sourceTemplateId: worksheetData.sourceTemplateId
    });
    
    // If created from template AND user wants template tracking, detect and track modifications
    let modifications = [];
    let isModified = false;
    
    if (selectedTemplate && matchedToTemplate) {
      console.log('DEBUG: Processing template modification detection', {
        templateJustLoaded: templateJustLoaded,
        hasRealTimeModifications: hasRealTimeModifications,
        realTimeModifications: realTimeModifications
      });
      
      // If template was just loaded and hasn't been modified, don't flag as modified
      if (templateJustLoaded) {
        console.log('DEBUG: Template just loaded, skipping modification detection');
        modifications = [];
        isModified = false;
        // Clear the flag so future saves will detect modifications
        setTemplateJustLoaded(false);
      } else if (hasRealTimeModifications && realTimeModifications.length > 0) {
        // Use real-time modifications if available (they're more accurate)
        console.log('DEBUG: Using real-time modifications');
        modifications = realTimeModifications;
        isModified = true;
      } else {
        // Fallback to calculating modifications
        console.log('DEBUG: Calculating modifications as fallback');
        const originalTemplate = selectedTemplate;
        
        // Create worksheet data for comparison that matches the template structure
        const cleanWorksheetData = {
          title: worksheetData.title,
          description: worksheetData.description,
          modality: worksheetData.modality,
          frequency: worksheetData.frequency,
          tests: worksheetData.tests || []
        };
        
        const modificationResult = detectTemplateModifications(cleanWorksheetData, originalTemplate);
        modifications = modificationResult.modifications;
        isModified = modificationResult.isModified;
      }
      
      console.log('DEBUG: Final modification status:', { isModified, modifications });
      
      // Only set template tracking metadata if user wants template tracking
      worksheetData.sourceTemplateId = selectedTemplate.id;
      worksheetData.sourceTemplateName = selectedTemplate.title;
    } else {
      console.log('DEBUG: No template tracking requested', {
        hasSelectedTemplate: !!selectedTemplate,
        matchedToTemplate: matchedToTemplate,
        hasSourceTemplateId: !!worksheetData.sourceTemplateId
      });
      
      // Ensure template tracking is cleared if not wanted
      worksheetData.sourceTemplateId = null;
      worksheetData.sourceTemplateName = null;
      worksheetData.templateSource = null;
      worksheetData.templateId = null;
    }
    
    const newWorksheet = {
      id: worksheetData.id || Date.now(),
      title: worksheetData.title,
      description: worksheetData.description,
      modality: worksheetData.modality,
      frequency: worksheetData.frequency,
      tests: worksheetData.tests,
      isWorksheet: worksheetData.isWorksheet || true, // Mark as worksheet (not template)
      sourceTemplateId: worksheetData.sourceTemplateId || null, // ID of template used to create this
      sourceTemplateName: worksheetData.sourceTemplateName || null, // Name of template used
      // Legacy properties for backward compatibility
      templateSource: worksheetData.templateSource || worksheetData.sourceTemplateName || null,
      templateId: worksheetData.templateId || worksheetData.sourceTemplateId || null,
      baseTemplate: worksheetData.baseTemplate || null,
      modifications: modifications,
      isModified: isModified,
      createdAt: worksheetData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedMachines: worksheetData.assignedMachines || [], // Array of machine IDs this worksheet is assigned to
      specificMachine: worksheetData.specificMachine || null // Track specific machine assignment
    };
    
    // Always add new worksheet
    worksheets.push(newWorksheet);
    
    localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
    return newWorksheet;
  };

  // Shared function to detect modifications between worksheet and template
  const detectTemplateModifications = (worksheetData, originalTemplate) => {
    const detectedChanges = [];
    
    console.log('DEBUG: Comparing worksheet with template:', {
      originalTitle: originalTemplate.title,
      currentTitle: worksheetData.title,
      originalDescription: originalTemplate.description,
      currentDescription: worksheetData.description,
      templateJustLoaded: templateJustLoaded
    });
    
    // If template was just loaded, don't detect any modifications
    if (templateJustLoaded) {
      console.log('DEBUG: Template just loaded flag is true, returning no modifications');
      return {
        modifications: [],
        isModified: false
      };
    }
    
    // Normalize strings for comparison (trim and handle null/undefined)
    const normalizeString = (str) => (str || '').trim();
    
    // Check title changes - only flag if user actually changed the title
    // Templates loaded should keep same title unless user explicitly modifies it
    const originalTitle = normalizeString(originalTemplate.title);
    const currentTitle = normalizeString(worksheetData.title);
    
    // Only consider it changed if titles are meaningfully different
    // (not just whitespace or empty vs null differences)
    if (originalTitle && currentTitle && originalTitle !== currentTitle) {
      // Remove machine name suffix pattern to compare base title
      const baseCurrentTitle = currentTitle.replace(/ - [^-]+$/, '').trim();
      if (baseCurrentTitle !== originalTitle) {
        detectedChanges.push(`Title changed from "${originalTitle}" to "${baseCurrentTitle}"`);
      }
    }
    
    // Check description changes - only if meaningfully different
    const originalDesc = normalizeString(originalTemplate.description);
    const currentDesc = normalizeString(worksheetData.description);
    
    // Only flag if there's actual content difference (not empty to empty)
    if (originalDesc !== currentDesc && (originalDesc || currentDesc)) {
      detectedChanges.push(`Description modified`);
    }
    
    // Check test count changes
    const originalTests = originalTemplate.tests || [];
    const currentTests = worksheetData.tests || [];
    
    if (currentTests.length !== originalTests.length) {
      if (currentTests.length > originalTests.length) {
        detectedChanges.push(`Added ${currentTests.length - originalTests.length} test(s)`);
      } else {
        detectedChanges.push(`Removed ${originalTests.length - currentTests.length} test(s)`);
      }
    }
    
    // Comprehensive test content comparison - only for meaningful changes
    const testModifications = [];
    
    // Compare tests by position (only if same count to avoid false positives)
    if (originalTests.length === currentTests.length) {
      originalTests.forEach((originalTest, index) => {
        const currentTest = currentTests[index];
        if (currentTest && originalTest) {
          const changes = [];
          
          // Compare all significant test properties with normalization
          if (normalizeString(currentTest.testName) !== normalizeString(originalTest.testName)) {
            changes.push('name');
          }
          if (normalizeString(currentTest.testType) !== normalizeString(originalTest.testType)) {
            changes.push('type');
          }
          if (normalizeString(currentTest.tolerance) !== normalizeString(originalTest.tolerance)) {
            changes.push('tolerance');
          }
          if (normalizeString(currentTest.units) !== normalizeString(originalTest.units)) {
            changes.push('units');
          }
          if (normalizeString(currentTest.notes) !== normalizeString(originalTest.notes)) {
            changes.push('notes');
          }
          if (normalizeString(currentTest.description) !== normalizeString(originalTest.description)) {
            changes.push('description');
          }
          
          if (changes.length > 0) {
            testModifications.push(`Test ${index + 1} (${originalTest.testName || 'Unnamed'}): ${changes.join(', ')} modified`);
          }
        }
      });
    }
    
    // Add test modification details
    if (testModifications.length > 0) {
      if (testModifications.length <= 3) {
        // Show all modifications if 3 or fewer
        detectedChanges.push(...testModifications);
      } else {
        // Summarize if more than 3
        detectedChanges.push(`${testModifications.length} test(s) modified`);
      }
    }
    
    // Check for new tests beyond original count
    if (currentTests.length > originalTests.length) {
      const newTests = currentTests.slice(originalTests.length);
      newTests.forEach((test, index) => {
        const testName = normalizeString(test.testName);
        if (testName) { // Only add if test has actual content
          detectedChanges.push(`Added new test: ${testName}`);
        }
      });
    }
    
    console.log('DEBUG: Detected changes after filtering:', detectedChanges);
    
    return {
      modifications: detectedChanges,
      isModified: detectedChanges.length > 0
    };
  };

  const updateWorksheet = (worksheetData) => {
    const worksheets = getWorksheets();
    const existingIndex = worksheets.findIndex(w => w.id === worksheetData.id);
    
    if (existingIndex === -1) {
      console.error('Worksheet not found for update:', worksheetData.id);
      return null;
    }
    
    // Preserve original template tracking and creation date
    const existingWorksheet = worksheets[existingIndex];
    
    // If this worksheet was created from a template, re-detect modifications
    let modifications = existingWorksheet.modifications || [];
    let isModified = existingWorksheet.isModified || false;
    
    if (existingWorksheet.sourceTemplateId) {
      // Try to find the original template to compare against
      const templates = getModalityTemplates();
      const originalTemplate = templates.find(t => t.id === existingWorksheet.sourceTemplateId);
      
      if (originalTemplate) {
        console.log('DEBUG: Re-detecting modifications for updated worksheet');
        const modificationResult = detectTemplateModifications(worksheetData, originalTemplate);
        modifications = modificationResult.modifications;
        isModified = modificationResult.isModified;
      } else {
        console.log('DEBUG: Original template not found, keeping existing modification status');
        // Template not found, assume modified if any edits were made
        isModified = true;
        if (modifications.length === 0) {
          modifications = ['Template source no longer available - worksheet has been edited'];
        }
      }
    }
    
    // Update the worksheet with new data while preserving key metadata
    const updatedWorksheet = {
      ...existingWorksheet, // Preserve original data
      title: worksheetData.title,
      description: worksheetData.description,
      modality: worksheetData.modality,
      frequency: worksheetData.frequency,
      tests: worksheetData.tests,
      assignedMachines: worksheetData.assignedMachines || existingWorksheet.assignedMachines || [],
      specificMachine: worksheetData.specificMachine || existingWorksheet.specificMachine,
      updatedAt: new Date().toISOString(),
      // Keep original template tracking
      sourceTemplateId: existingWorksheet.sourceTemplateId,
      sourceTemplateName: existingWorksheet.sourceTemplateName,
      templateSource: existingWorksheet.templateSource,
      templateId: existingWorksheet.templateId,
      // Update modification tracking
      isModified: isModified,
      modifications: modifications
    };
    
    // Replace the worksheet in the array
    worksheets[existingIndex] = updatedWorksheet;
    
    localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
    return updatedWorksheet;
  };

  const getWorksheets = () => {
    try {
      const stored = localStorage.getItem('qcWorksheets');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading worksheets:', error);
      return [];
    }
  };

  // Function to retroactively match worksheets to templates
  const clearAllModificationFlags = () => {
    const worksheets = getWorksheets();
    console.log('DEBUG: Clearing modification flags for all worksheets');
    
    const updatedWorksheets = worksheets.map(worksheet => ({
      ...worksheet,
      isModified: false,
      modifications: []
    }));
    
    localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
    console.log('DEBUG: Cleared modification flags for', updatedWorksheets.length, 'worksheets');
    toast.success('Cleared all modification flags');
    setRefreshKey(prev => prev + 1);
  };

  const fixWorksheetTemplateTracking = () => {
    const worksheets = getWorksheets();
    const templates = getModalityTemplates();
    let updatedCount = 0;

    console.log('DEBUG: Fixing worksheet template tracking...');
    console.log('DEBUG: Found worksheets:', worksheets.length);
    console.log('DEBUG: Found templates:', templates.length);

    const updatedWorksheets = worksheets.map(worksheet => {
      // Skip if already has template tracking
      if (worksheet.sourceTemplateId || worksheet.sourceTemplateName) {
        console.log(`DEBUG: Worksheet "${worksheet.title}" already has template tracking`);
        return worksheet;
      }

      // Try to match worksheet to a template based on modality and frequency
      const matchingTemplate = templates.find(template => 
        template.modality === worksheet.modality && 
        template.frequency === worksheet.frequency
      );

      if (matchingTemplate) {
        console.log(`DEBUG: Found matching template for "${worksheet.title}":`, matchingTemplate.title);
        updatedCount++;
        
        return {
          ...worksheet,
          sourceTemplateId: matchingTemplate.id,
          sourceTemplateName: matchingTemplate.title,
          templateSource: matchingTemplate.title, // Legacy support
          templateId: matchingTemplate.id, // Legacy support
          isModified: false, // Assume unmodified unless we detect changes
          modifications: []
        };
      } else {
        console.log(`DEBUG: No matching template found for "${worksheet.title}" (${worksheet.modality} ${worksheet.frequency})`);
        return worksheet;
      }
    });

    if (updatedCount > 0) {
      localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
      console.log(`DEBUG: Updated ${updatedCount} worksheets with template tracking`);
      toast.success(`Fixed template tracking for ${updatedCount} worksheet(s)`);
      setRefreshKey(prev => prev + 1);
      window.dispatchEvent(new Event('storage'));
    } else {
      console.log('DEBUG: No worksheets needed template tracking updates');
      toast.info('All worksheets already have proper template tracking');
    }

    return updatedCount;
  };

  const deleteWorksheet = (worksheetId) => {
    console.log('DEBUG: deleteWorksheet called with ID:', worksheetId);
    
    if (window.confirm('Are you sure you want to delete this worksheet? This action cannot be undone.')) {
      const worksheets = getWorksheets();
      console.log('DEBUG: Worksheets before deletion:', worksheets.length);
      console.log('DEBUG: Worksheet to delete:', worksheets.find(w => w.id === worksheetId)?.title);
      
      const updatedWorksheets = worksheets.filter(w => w.id !== worksheetId);
      console.log('DEBUG: Worksheets after deletion:', updatedWorksheets.length);
      
      localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
      console.log('DEBUG: Updated localStorage with', updatedWorksheets.length, 'worksheets');
      
      toast.success('Worksheet deleted successfully');
      
      // Force multiple refresh mechanisms like other functions
      setRefreshKey(prev => prev + 1);
      window.dispatchEvent(new Event('storage'));
      
      // Force view mode refresh
      const currentMode = viewMode;
      setViewMode('overview');
      setTimeout(() => {
        setViewMode(currentMode);
        setRefreshKey(prev => prev + 1);
      }, 200);
    }
  };

  const assignWorksheetToMachine = (worksheetId, machineId) => {
    console.log('DEBUG: assignWorksheetToMachine called with:', { worksheetId, machineId });
    
    try {
      const worksheets = getWorksheets();
      console.log('DEBUG: Total worksheets found:', worksheets.length);
      
      const worksheetIndex = worksheets.findIndex(w => w.id === worksheetId);
      console.log('DEBUG: Found worksheet index:', worksheetIndex);
      
      if (worksheetIndex === -1) {
        console.log('DEBUG: Worksheet not found');
        toast.error('Worksheet not found');
        return false;
      }
      
      const worksheet = worksheets[worksheetIndex];
      console.log('DEBUG: Worksheet found:', worksheet.title);
      
      // Ensure assignedMachines is an array
      if (!Array.isArray(worksheet.assignedMachines)) {
        worksheet.assignedMachines = [];
        console.log('DEBUG: Initialized assignedMachines array');
      }
      
      if (worksheet.assignedMachines.includes(machineId)) {
        console.log('DEBUG: Machine already assigned');
        toast.info('This machine is already assigned to this worksheet');
        return false;
      }
      
      // Add the machine
      worksheet.assignedMachines.push(machineId);
      worksheet.updatedAt = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
      console.log('DEBUG: Successfully saved to localStorage');
      console.log('DEBUG: Updated worksheet:', worksheet);
      console.log('DEBUG: All worksheets after save:', getWorksheets());
      
      // Force component refresh by updating the refreshKey
      setRefreshKey(prev => prev + 1);
      
      toast.success('Worksheet assigned successfully');
      return true;
      
    } catch (error) {
      console.error('DEBUG: Assignment error:', error);
      toast.error('Failed to assign worksheet');
      return false;
    }
  };

  const unassignWorksheetFromMachine = (worksheetId, machineId) => {
    const worksheets = getWorksheets();
    const worksheetIndex = worksheets.findIndex(w => w.id === worksheetId);
    
    if (worksheetIndex !== -1) {
      const worksheet = worksheets[worksheetIndex];
      worksheet.assignedMachines = worksheet.assignedMachines.filter(id => id !== machineId);
      worksheet.updatedAt = new Date().toISOString();
      localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
      toast.success('Worksheet unassigned from machine');
      return true;
    }
    return false;
  };

  const generateWorksheetFromTemplate = (templateId) => {
    const template = getModalityTemplates().find(t => t.id === templateId);
    
    if (!template) {
      toast.error('Template not found');
      return null;
    }

    // Add template source tracking to each test
    const testsWithTracking = template.tests.map(test => ({
      ...test,
      templateSource: template.title,
      isCustomField: false,
      customFieldType: 'template-default'
    }));

    const worksheetData = {
      title: template.title, // Keep original title, don't add "- Worksheet"
      description: template.description,
      modality: template.modality,
      frequency: template.frequency,
      tests: testsWithTracking,
      sourceTemplateId: template.id,
      sourceTemplateName: template.title,
      isWorksheet: true, // Mark as worksheet, not template
      assignedMachines: [], // Start with no machines assigned
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return saveWorksheet(worksheetData);
  };

  const saveAsTemplate = () => {
    if (!customWorksheetInfo.title) {
      toast.error('Please provide a template name');
      return;
    }

    if (!customWorksheetInfo.modality) {
      toast.error('Please select a modality');
      return;
    }

    const template = {
      id: selectedTemplate ? selectedTemplate.id : Date.now(),
      title: customWorksheetInfo.title,
      modality: customWorksheetInfo.modality,
      frequency: customWorksheetInfo.frequency,
      description: customWorksheetInfo.description,
      tests: customTests.filter(test => test.testName.trim() !== ''),
      createdAt: selectedTemplate ? selectedTemplate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedTemplates = getModalityTemplates();
    if (selectedTemplate) {
      // Update existing template
      const index = savedTemplates.findIndex(t => t.id === selectedTemplate.id);
      if (index !== -1) {
        savedTemplates[index] = template;
      } else {
        savedTemplates.push(template);
      }
    } else {
      // Add new template
      savedTemplates.push(template);
    }
    localStorage.setItem('qcModalityTemplates', JSON.stringify(savedTemplates));
    
    toast.success(selectedTemplate ? 'Template updated successfully!' : 'Template saved successfully!');
    setIsCreatingTemplate(false);
    setSelectedTemplate(null);
    setTemplateMode('manage');
    resetTemplateForm();
  };

  const loadTemplateForEditing = (template) => {
    setCustomWorksheetInfo({
      title: template.title,
      frequency: template.frequency,
      machineId: '', // Will be set when creating worksheet from template
      modality: template.modality || '',
      description: template.description || ''
    });
    setCustomTests(template.tests.map(test => ({
      ...test,
      id: test.id || Date.now() + Math.random()
    })));
    setSelectedTemplate(template);
    setIsCreatingTemplate(true);
    toast.success('Template loaded for editing!');
  };

  const viewTemplateReadOnly = (template) => {
    console.log('viewTemplateReadOnly called with template:', template);
    
    // Store template data temporarily for QCForm to use
    localStorage.setItem('tempTemplateView', JSON.stringify(template));
    
    // Navigate to QCForm in view-only mode for templates
    navigate(`/qc/view/${template.modality}/${template.frequency}`);
    toast.success(`Viewing template: ${template.title}`);
  };

  const viewCustomWorksheetReadOnly = (worksheet, machineId = null) => {
    console.log('viewCustomWorksheetReadOnly called with worksheet:', worksheet, 'machineId:', machineId);
    
    // Store worksheet data temporarily for QCForm to use
    localStorage.setItem('tempWorksheetView', JSON.stringify(worksheet));
    
    // Navigate to QCForm in view-only mode for custom worksheets
    if (machineId) {
      navigate(`/qc/view-worksheet/${machineId}/${worksheet.frequency}`);
    } else {
      // For unassigned worksheets, use the modality route
      navigate(`/qc/view/${worksheet.modality}/${worksheet.frequency}`);
    }
    toast.success(`Viewing worksheet: ${worksheet.title}`);
  };

  const editCustomWorksheet = (worksheet) => {
    console.log('editCustomWorksheet called with worksheet:', worksheet);
    
    // Load worksheet data into the custom worksheet form for editing
    setCustomWorksheetInfo({
      title: worksheet.title,
      frequency: worksheet.frequency,
      machineId: worksheet.assignedMachines && worksheet.assignedMachines.length > 0 ? worksheet.assignedMachines[0] : '',
      modality: worksheet.modality,
      description: worksheet.description || ''
    });
    
    // Load the tests from the worksheet
    setCustomTests(worksheet.tests || []);
    
    // Set the worksheet data for editing (NOT template)
    setWorksheetData(worksheet);
    
    // Clear template selection since we're editing a worksheet, not a template
    setSelectedTemplate(null);
    
    // Set to custom mode for editing
    setViewMode('custom');
    
    toast.success(`Editing worksheet: ${worksheet.title}`);
  };

  const deleteModalityTemplate = (templateId) => {
    const savedTemplates = getModalityTemplates();
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
    localStorage.setItem('qcModalityTemplates', JSON.stringify(updatedTemplates));
    toast.success('Template deleted successfully!');
  };

  const loadModalityTemplateForEdit = async (machineType, frequency) => {
    try {
      // First, try to find if there's a custom template for this modality and frequency
      const savedTemplates = getModalityTemplates();
      const existingTemplate = savedTemplates.find(t => t.modality === machineType && t.frequency === frequency);
      
      if (existingTemplate) {
        // Load existing custom template
        loadTemplateForEditing(existingTemplate);
        setViewMode('templates');
        toast.success('Loading existing template for editing!');
      } else {
        // Create new template from default worksheet data
        const response = await axios.get(`/api/worksheets/${machineType}/${frequency}`);
        const tests = response.data.map(test => ({
          id: Date.now() + Math.random(),
          testName: test.name,
          testType: 'value',
          tolerance: test.tolerance || '',
          units: test.units || '',
          notes: ''
        }));
        
        setCustomWorksheetInfo({
          title: `${machineType} ${frequency} QC Template`,
          frequency: frequency,
          machineId: '',
          modality: machineType,
          description: `Default ${frequency} QC template for ${machineType} equipment`
        });
        setCustomTests(tests);
        setSelectedTemplate(null);
        setIsCreatingTemplate(true);
        setViewMode('templates');
        toast.success('Creating new template from default worksheet!');
      }
    } catch (error) {
      console.error('Error loading template for editing:', error);
      toast.error('Failed to load template for editing');
    }
  };

  const createWorksheetFromTemplate = (template) => {
    console.log('DEBUG: createWorksheetFromTemplate called with:', template.title);
    
    // Load template data into custom worksheet form
    setCustomWorksheetInfo({
      title: template.title,
      frequency: template.frequency,
      machineId: '',
      modality: template.modality || '',
      description: template.description || ''
    });
    setCustomTests(template.tests.map(test => ({
      ...test,
      id: test.id || Date.now() + Math.random()
    })));
    setSelectedTemplate(template);
    setTemplateJustLoaded(true); // Flag that template was just loaded
    
    // Clear real-time modifications since template was just loaded
    setRealTimeModifications([]);
    setHasRealTimeModifications(false);
    
    console.log('DEBUG: Set templateJustLoaded to true, selectedTemplate:', template.title);
    
    // Switch to custom worksheet tab with template loaded
    setViewMode('custom');
    toast.success('Template loaded! Select a machine and generate worksheet.');
  };

  const resetTemplateForm = () => {
    setCustomWorksheetInfo({
      title: '',
      frequency: 'daily',
      machineId: '',
      modality: '',
      description: ''
    });
    setCustomTests([
      { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '' }
    ]);
    setSelectedTemplate(null);
    setSelectedTemplateForGeneration('');
    setIsCreatingTemplate(false);
    setTemplateJustLoaded(false);
    
    // Clear real-time modifications
    setRealTimeModifications([]);
    setHasRealTimeModifications(false);
  };

  const deleteTemplate = (templateId) => {
    const savedTemplates = getSavedTemplates();
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
    localStorage.setItem('qcCustomTemplates', JSON.stringify(updatedTemplates));
    toast.success('Template deleted successfully!');
  };

  const toggleMachineExpansion = (machineId) => {
    const newExpanded = new Set(expandedMachines);
    if (newExpanded.has(machineId)) {
      newExpanded.delete(machineId);
    } else {
      newExpanded.add(machineId);
    }
    setExpandedMachines(newExpanded);
  };

  const refreshCurrentView = () => {
    // Force a re-render by updating a timestamp or triggering a refresh
    // This will cause components to re-read localStorage and refresh their data
    console.log(`Refreshing ${viewMode} view`);
    
    // Clear any cached state that might prevent refresh
    setWorksheetData(null);
    setSelectedTemplate(null);
    setMatchedToTemplate(false);
    setIsCreatingTemplate(false);
    
    // Reset all internal tab states to defaults
    setTemplateMode('manage'); // Reset templates to default "manage" view
    setExpandedMachines(new Set()); // Reset expanded machines
    
    // Reset custom worksheet form to default state
    setCustomWorksheetInfo({
      title: '',
      frequency: 'daily',
      machineId: '',
      modality: '',
      description: ''
    });
    setCustomTests([
      { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '' }
    ]);
    
    // Force re-fetch of machines data
    fetchMachines();
    
    // Increment refresh key to force re-render
    setRefreshKey(prev => prev + 1);
  };

  const handleViewModeChange = (newMode) => {
    if (newMode !== viewMode) {
      setViewMode(newMode);
      refreshCurrentView();
    }
  };

  const getAllFrequencies = () => {
    return ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machines...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">QC Worksheets</h1>
        <p className="text-gray-400 mt-2">Generate and access QC worksheets for different machine types and frequencies</p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => handleViewModeChange('overview')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🏥 All Machines Overview
          </button>
          <button
            onClick={() => handleViewModeChange('worksheets')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'worksheets' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📄 Existing Worksheets
          </button>
          <button
            onClick={() => handleViewModeChange('custom')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'custom' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ✏️ Add Worksheet
          </button>
          <button
            onClick={() => handleViewModeChange('templates')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'templates' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📋 Templates
          </button>
        </div>
      </div>

      {/* Overview Mode - All Machines */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">All Machines & QC Sheets</h2>
            
            {/* Debug Controls */}
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-300">DEBUG: Assignment Issues</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const worksheets = getWorksheets();
                      console.log('DEBUG: Current localStorage worksheets:', worksheets);
                      console.log('DEBUG: Total worksheets:', worksheets.length);
                      worksheets.forEach(w => {
                        console.log(`Worksheet: ${w.title} (${w.modality}, ${w.frequency}) -> Assigned to:`, w.assignedMachines, 'SpecificMachine:', w.specificMachine);
                      });
                      setRefreshKey(prev => prev + 1);
                      toast.info('Check console for worksheet data');
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Debug Worksheets
                  </button>
                  <button
                    onClick={() => {
                      const worksheets = getWorksheets();
                      console.log('DEBUG: Template tracking analysis');
                      console.log('DEBUG: Total worksheets:', worksheets.length);
                      worksheets.forEach(w => {
                        console.log(`Template: ${w.title}`);
                        console.log(`  - Template ID: ${w.templateId || 'MISSING'}`);
                        console.log(`  - Template Source: ${w.templateSource || 'MISSING'}`);
                        console.log(`  - Is Template: ${w.isTemplate || false}`);
                        console.log(`  - Created From: ${w.createdFromTemplate || 'N/A'}`);
                        console.log(`  - Modality: ${w.modality}, Frequency: ${w.frequency}`);
                      });
                      toast.info('Check console for template tracking data');
                    }}
                    className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                  >
                    Debug Templates
                  </button>
                  <button
                    onClick={() => {
                      fixWorksheetTemplateTracking();
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Fix Template Tracking
                  </button>
                  <button
                    onClick={() => {
                      clearAllModificationFlags();
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Clear Modification Flags
                  </button>
                </div>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-200 mb-3">Filter Machines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Location</label>
                  <select
                    value={overviewFilterLocation}
                    onChange={(e) => setOverviewFilterLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Locations</option>
                    {[...new Set(machines.map(m => m.location.building))].sort().map(building => (
                      <option key={building} value={building}>
                        {building}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Modality</label>
                  <select
                    value={overviewFilterModality}
                    onChange={(e) => setOverviewFilterModality(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Modalities</option>
                    {modalities.map(modality => (
                      <option key={modality.value} value={modality.value}>
                        {modality.icon} {modality.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {(overviewFilterLocation || overviewFilterModality) && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setOverviewFilterLocation('');
                      setOverviewFilterModality('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-500 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // Filter machines based on selected filters
                let filteredMachines = machines;
                
                if (overviewFilterLocation) {
                  filteredMachines = filteredMachines.filter(machine => 
                    machine.location.building === overviewFilterLocation
                  );
                }
                
                if (overviewFilterModality) {
                  filteredMachines = filteredMachines.filter(machine => 
                    machine.type === overviewFilterModality
                  );
                }
                
                // Sort by modality, then by name
                filteredMachines.sort((a, b) => {
                  if (a.type !== b.type) {
                    return a.type.localeCompare(b.type);
                  }
                  return a.name.localeCompare(b.name);
                });
                
                return filteredMachines.map(machine => (
                <div key={machine.machineId} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                  <div className="mb-4">
                    <Link 
                      to={`/machines/${machine.machineId}`}
                      className="text-lg font-semibold text-gray-100 hover:text-blue-400 transition-colors"
                    >
                      {machine.name}
                    </Link>
                    <p className="text-sm text-gray-400">{machine.machineId}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                        {machine.type}
                      </span>
                      <span className="text-sm text-gray-400">
                        {machine.location.building} - {machine.location.room}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-300">QC Worksheets:</h4>
                      <button
                        onClick={() => toggleMachineExpansion(machine.machineId)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                      >
                        <span>{expandedMachines.has(machine.machineId) ? 'Hide' : 'Show'} Details</span>
                        <svg
                          className={`w-3 h-3 transition-transform ${expandedMachines.has(machine.machineId) ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      {expandedMachines.has(machine.machineId) ? (
                        // Expanded view - show all frequencies
                        getAllFrequencies().map(freq => {
                          const isAssigned = getAssignedFrequencies(machine).includes(freq);
                          return (
                            <div
                              key={freq}
                              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                                isAssigned 
                                  ? 'bg-green-900/30 border border-green-700/50' 
                                  : 'bg-gray-900/30 border border-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-xs">
                                  {isAssigned ? '✅' : '❌'}
                                </span>
                                {isAssigned ? (
                                  <Link
                                    to={`/qc/view-worksheet/${machine.machineId}/${freq}`}
                                    className="text-green-300 hover:text-green-200 transition-colors hover:underline"
                                  >
                                    {getFrequencyIcon(freq)} {getFrequencyLabel(freq)}
                                  </Link>
                                ) : (
                                  <span className="text-gray-400">
                                    {getFrequencyIcon(freq)} {getFrequencyLabel(freq)}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isAssigned 
                                  ? 'bg-green-800 text-green-200' 
                                  : 'bg-gray-800 text-gray-400'
                              }`}>
                                {isAssigned ? 'Assigned' : 'Not assigned'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        // Collapsed view - show summary
                        <div className="text-sm text-gray-400">
                          {getAssignedFrequencies(machine).length > 0 ? (
                            <span>
                              {getAssignedFrequencies(machine).length} QC worksheet{getAssignedFrequencies(machine).length !== 1 ? 's' : ''} assigned
                              <span className="ml-2 text-xs">
                                ({getAssignedFrequencies(machine).map((freq, index) => (
                                  <span key={freq}>
                                    <Link
                                      to={`/qc/view-worksheet/${machine.machineId}/${freq}`}
                                      className="text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                                    >
                                      {getFrequencyLabel(freq)}
                                    </Link>
                                    {index < getAssignedFrequencies(machine).length - 1 && ', '}
                                  </span>
                                ))})
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">See below to add worksheets</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Status Information */}
                    <div className="text-center py-2">
                      {getAssignedFrequencies(machine).length > 0 ? (
                        <p className="text-sm text-green-400">✅ QC worksheets assigned</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-400 mb-1">No QC worksheets assigned</p>
                          <p className="text-xs text-gray-500">Configure QC worksheets for this machine to add QC records</p>
                        </>
                      )}
                    </div>
                    
                    {/* Consistent Add Worksheet Button */}
                    <button
                      onClick={() => setViewMode('custom')}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>➕</span>
                      <span>Add Worksheet</span>
                    </button>
                  </div>
                </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Templates Mode - Simplified */}
      {viewMode === 'templates' && (
        <div key={`templates-${refreshKey}`} className="space-y-6">
          
          {/* Generate New Template Widget */}
          {!worksheetData && !isCreatingTemplate && (
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Generate New Template</h2>
              
              {/* Create from existing template */}
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplateForGeneration}
                    onChange={(e) => setSelectedTemplateForGeneration(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a template...</option>
                    {getModalityTemplates().map(template => (
                      <option key={template.id} value={template.id}>
                        {template.title} ({template.modality} • {getFrequencyLabel(template.frequency)} • {template.tests.length} tests)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (selectedTemplateForGeneration) {
                      const template = getModalityTemplates().find(t => t.id.toString() === selectedTemplateForGeneration);
                      if (template) {
                        // Load template for editing as a new template
                        setSelectedTemplate({ ...template, id: Date.now() }); // Give it a new ID
                        setCustomWorksheetInfo({
                          title: `Copy of ${template.title}`,
                          frequency: template.frequency,
                          machineId: '',
                          modality: template.modality,
                          description: template.description || ''
                        });
                        setCustomTests(template.tests.map(test => ({ ...test, id: Date.now() + Math.random() })));
                        setIsCreatingTemplate(true);
                        toast.success(`Template "${template.title}" loaded for editing as new template`);
                      }
                    } else {
                      toast.error('Please select a template first');
                    }
                  }}
                  disabled={!selectedTemplateForGeneration}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                    selectedTemplateForGeneration 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>📋</span>
                  <span>Create From Selected</span>
                </button>
              </div>
              
              {/* Create new template from scratch */}
              <div className="pt-2 border-t border-gray-600">
                <button
                  onClick={() => {
                    resetTemplateForm();
                    setIsCreatingTemplate(true);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>➕</span>
                  <span>Create New Template from Scratch</span>
                </button>
              </div>
            </div>
          )}

          {/* Templates List */}
          {!worksheetData && !isCreatingTemplate && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">All Templates</h2>
              {getModalityTemplates().length === 0 ? (
                <p className="text-gray-400 text-center py-8">No templates saved yet. Create your first template!</p>
              ) : (
                <div className="space-y-6">
                  {getGroupedModalityTemplates().map(group => (
                    <div key={group.modality}>
                      <h4 className="text-lg font-semibold text-blue-300 mb-3 border-b border-gray-600 pb-2">
                        📱 {group.modality} Templates ({group.templates.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.templates.map(template => (
                          <div key={template.id} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => viewTemplateReadOnly(template)}
                                className="font-medium text-gray-100 text-sm hover:text-blue-400 hover:underline transition-colors cursor-pointer text-left"
                                title="Click to view template in read-only mode"
                              >
                                {template.title}
                              </button>
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                Template
                              </span>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="text-xs text-gray-300">
                                <strong>Modality:</strong> {template.modality}
                              </div>
                              <div className="text-xs text-gray-400">
                                <strong>Frequency:</strong> {getFrequencyLabel(template.frequency)}
                              </div>
                              <div className="text-xs text-gray-400">
                                <strong>Tests:</strong> {template.tests.length}
                              </div>
                              <div className="text-xs text-gray-500">
                                Created: {new Date(template.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => createWorksheetFromTemplate(template)}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                              >
                                📝 Create Worksheet
                              </button>
                              <button
                                onClick={() => loadTemplateForEditing(template)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                              >
                                ✏️ Edit Template
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Creator */}
          {!worksheetData && isCreatingTemplate && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-100">
                  {selectedTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreatingTemplate(false);
                    setSelectedTemplate(null);
                    resetTemplateForm();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              {/* Template Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template Title *
                  </label>
                  <input
                    type="text"
                    value={customWorksheetInfo.title}
                    onChange={(e) => updateCustomWorksheetInfo('title', e.target.value)}
                    placeholder="e.g., MRI Weekly QC Template"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Modality *
                  </label>
                  <select
                    value={customWorksheetInfo.modality}
                    onChange={(e) => updateCustomWorksheetInfo('modality', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a modality...</option>
                    {modalities.map(modality => (
                      <option key={modality.value} value={modality.value}>
                        {modality.icon} {modality.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frequency Category
                  </label>
                  <select
                    value={customWorksheetInfo.frequency}
                    onChange={(e) => updateCustomWorksheetInfo('frequency', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {frequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.icon} {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={customWorksheetInfo.description}
                    onChange={(e) => updateCustomWorksheetInfo('description', e.target.value)}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* DICOM Series Selection for Templates */}
              {customWorksheetInfo.modality && (
                <DICOMSeriesSelector
                  machineId="TEMPLATE_PLACEHOLDER"
                  frequency={customWorksheetInfo.frequency}
                  modality={customWorksheetInfo.modality}
                  selectedDate={new Date().toISOString().split('T')[0]}
                  onSeriesSelection={(series) => {
                    console.log('Template DICOM series selection:', series);
                    // Store series selection in template data for future use
                  }}
                  viewOnly={false}
                />
              )}

              {/* Test Builder */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-100">QC Tests</h2>
                  <button
                    onClick={addCustomTest}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Add Test</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {customTests.map((test, index) => (
                    <div key={test.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-100">Test #{index + 1}</h3>
                        {customTests.length > 1 && (
                          <button
                            onClick={() => removeCustomTest(test.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Test Name *
                          </label>
                          <input
                            type="text"
                            value={test.testName}
                            onChange={(e) => updateCustomTest(test.id, 'testName', e.target.value)}
                            placeholder="e.g., Signal-to-Noise Ratio"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Test Type
                          </label>
                          <select
                            value={test.testType}
                            onChange={(e) => updateCustomTest(test.id, 'testType', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="value">Numerical Value</option>
                            <option value="text">Text Entry</option>
                            <option value="passfail">Pass/Fail</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Tolerance/Range
                          </label>
                          <input
                            type="text"
                            value={test.tolerance}
                            onChange={(e) => updateCustomTest(test.id, 'tolerance', e.target.value)}
                            placeholder="e.g., ±5%, >100, 0-10"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Units
                          </label>
                          <input
                            type="text"
                            value={test.units}
                            onChange={(e) => updateCustomTest(test.id, 'units', e.target.value)}
                            placeholder="e.g., mm, %, dB, HU"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Notes/Instructions
                          </label>
                          <input
                            type="text"
                            value={test.notes}
                            onChange={(e) => updateCustomTest(test.id, 'notes', e.target.value)}
                            placeholder="Optional test instructions or notes"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={saveAsTemplate}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>💾</span>
                    <span>Save Template</span>
                  </button>
                  <button
                    onClick={resetTemplateForm}
                    className="px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Existing Worksheets Mode - List all available worksheets */}
      {viewMode === 'worksheets' && (
        <div key={`worksheets-${refreshKey}`} className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Existing QC Worksheets</h2>
            <p className="text-gray-400 mb-6">QC worksheets that have been assigned to machines, organized by modality and frequency.</p>
            
            {/* Filter Controls */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-200 mb-3">Filter Worksheets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Machine</label>
                  <select
                    value={filterMachine}
                    onChange={(e) => setFilterMachine(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Machines</option>
                    {machines.map(machine => (
                      <option key={machine.machineId} value={machine.machineId}>
                        {machine.name} ({machine.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Frequency</label>
                  <select
                    value={filterFrequency}
                    onChange={(e) => setFilterFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Frequencies</option>
                    {frequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.icon} {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Modality</label>
                  <select
                    value={filterModality}
                    onChange={(e) => setFilterModality(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Modalities</option>
                    {modalities.map(modality => (
                      <option key={modality.value} value={modality.value}>
                        {modality.icon} {modality.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {(filterMachine || filterFrequency || filterModality) && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setFilterMachine('');
                      setFilterFrequency('');
                      setFilterModality('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-500 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Worksheet listing organized by modality, then frequency */}
            <div className="space-y-8">
              {(() => {
                console.log('Rendering worksheets, refreshKey:', refreshKey);
                const allWorksheets = getWorksheets();
                console.log('All worksheets:', allWorksheets.length);
                return modalities.map(modality => {
                  // Skip this modality if it doesn't match the filter
                  if (filterModality && modality.value !== filterModality) {
                    return null;
                  }
                  
                  // Get all worksheets for this modality that are assigned to machines
                  let modalityWorksheets = allWorksheets.filter(w => 
                    w.modality === modality.value && 
                    w.assignedMachines && 
                    w.assignedMachines.length > 0
                  );
                  
                  console.log(`${modality.value} assigned worksheets:`, modalityWorksheets.length);
                
                // Apply frequency filter if set
                if (filterFrequency) {
                  modalityWorksheets = modalityWorksheets.filter(w => w.frequency === filterFrequency);
                }
                
                // Apply machine filter if set
                if (filterMachine) {
                  modalityWorksheets = modalityWorksheets.filter(w => 
                    w.assignedMachines && w.assignedMachines.includes(filterMachine)
                  );
                }
                
                // Only show modality section if there are worksheets after filtering
                if (modalityWorksheets.length === 0) {
                  return null;
                }
                
                return (
                  <div key={modality.value} className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center space-x-2">
                      <span>{modality.icon}</span>
                      <span>{modality.value} Worksheets</span>
                      <span className="text-sm text-gray-400">
                        ({modalityWorksheets.length} worksheet{modalityWorksheets.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                    
                    {/* Group by frequency within this modality */}
                    <div className="space-y-6">
                      {getAllFrequencies().map(frequency => {
                        // Skip this frequency if it doesn't match the filter
                        if (filterFrequency && frequency !== filterFrequency) {
                          return null;
                        }
                        
                        // Get worksheets for this modality and frequency (already filtered for assigned machines)
                        let frequencyWorksheets = modalityWorksheets.filter(w => w.frequency === frequency);
                        
                        // Apply machine filter to frequency worksheets if not already applied
                        if (filterMachine && !filterFrequency) {
                          frequencyWorksheets = frequencyWorksheets.filter(w => 
                            w.assignedMachines && w.assignedMachines.includes(filterMachine)
                          );
                        }
                        
                        // Only show frequency section if there are worksheets
                        if (frequencyWorksheets.length === 0) {
                          return null;
                        }
                        
                        return (
                          <div key={frequency} className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-gray-100 mb-4 flex items-center space-x-2">
                              <span>{getFrequencyIcon(frequency)}</span>
                              <span>{getFrequencyLabel(frequency)}</span>
                              <span className="text-sm text-gray-400">
                                ({frequencyWorksheets.length} worksheet{frequencyWorksheets.length !== 1 ? 's' : ''})
                              </span>
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Show individual worksheets */}
                              {frequencyWorksheets.map((worksheet) => (
                                <div key={worksheet.id} className="bg-gray-900 rounded-lg p-4 border-l-4 border-blue-500">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-gray-100 text-sm">
                                      {worksheet.title}
                                    </h5>
                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                      Worksheet
                                    </span>
                                  </div>
                                  
                                  {/* Template Source Info - Moved below title */}
                                  {(worksheet.templateSource || worksheet.sourceTemplateName) && (
                                    <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-2 mb-3">
                                      <div className="text-xs text-blue-300 font-medium mb-1">
                                        📋 Based on: {worksheet.sourceTemplateName || worksheet.templateSource}
                                      </div>
                                      {(() => {
                                        // Check if worksheet has been modified from template
                                        const isModified = worksheet.isModified || 
                                                         (worksheet.modifications && worksheet.modifications.length > 0) ||
                                                         (worksheet.customizations && worksheet.customizations.length > 0);
                                        
                                        if (isModified) {
                                          const modifications = worksheet.modifications || worksheet.customizations || [];
                                          return (
                                            <div className="text-xs text-amber-300">
                                              <div className="font-medium mb-1 flex items-center">
                                                <span className="mr-1">🔧</span>
                                                <span>Modified from template</span>
                                                <span className="ml-1 px-1 py-0.5 bg-amber-800/50 rounded text-amber-200">
                                                  {modifications.length > 0 ? `${modifications.length} changes` : 'customized'}
                                                </span>
                                              </div>
                                              {modifications.length > 0 && (
                                                <ul className="list-disc list-inside space-y-1 mt-1">
                                                  {modifications.slice(0, 2).map((mod, modIndex) => (
                                                    <li key={modIndex} className="text-amber-200">{mod}</li>
                                                  ))}
                                                  {modifications.length > 2 && (
                                                    <li className="text-amber-300">... and {modifications.length - 2} more changes</li>
                                                  )}
                                                </ul>
                                              )}
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div className="text-xs text-green-300 flex items-center">
                                              <span className="mr-1">✓</span>
                                              <span>Unmodified from template</span>
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="text-xs text-gray-300">
                                      <strong>Tests:</strong> {worksheet.tests.length}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      <strong>Assigned to:</strong> {worksheet.assignedMachines.length} machine{worksheet.assignedMachines.length !== 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Created: {new Date(worksheet.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>

                                  {/* Assigned Machines List */}
                                  {worksheet.assignedMachines.length > 0 && (
                                    <div className="mb-4 p-2 bg-gray-800 rounded">
                                      <div className="text-xs text-gray-300 font-medium mb-2">Assigned Machines:</div>
                                      <div className="space-y-1">
                                        {worksheet.assignedMachines.map(machineId => {
                                          const machine = machines.find(m => m.machineId === machineId);
                                          return machine ? (
                                            <div key={machineId} className="text-xs text-gray-300">
                                              {machine.name}
                                            </div>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2">
                                    {/* View and Edit Buttons */}
                                    <div className="space-y-2">
                                      {/* Edit Button - Always available */}
                                      <button
                                        onClick={() => editCustomWorksheet(worksheet)}
                                        className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                      >
                                        ✏️ Edit Worksheet
                                      </button>
                                      
                                      {/* View Buttons - Based on machine assignments */}
                                      {worksheet.assignedMachines.length === 0 ? (
                                        <button
                                          onClick={() => viewCustomWorksheetReadOnly(worksheet)}
                                          className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                          👁️ View Template
                                        </button>
                                      ) : worksheet.assignedMachines.length === 1 ? (
                                        <button
                                          onClick={() => viewCustomWorksheetReadOnly(worksheet, worksheet.assignedMachines[0])}
                                          className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                          👁️ View for {machines.find(m => m.machineId === worksheet.assignedMachines[0])?.name || 'Machine'}
                                        </button>
                                      ) : (
                                        <div className="space-y-1">
                                          <div className="text-xs text-gray-400">View for machine:</div>
                                          {worksheet.assignedMachines.slice(0, 2).map(machineId => {
                                            const machine = machines.find(m => m.machineId === machineId);
                                            return machine ? (
                                              <button
                                                key={machineId}
                                                onClick={() => viewCustomWorksheetReadOnly(worksheet, machineId)}
                                                className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors text-left"
                                              >
                                                👁️ {machine.name}
                                              </button>
                                            ) : null;
                                          })}
                                          {worksheet.assignedMachines.length > 2 && (
                                            <div className="text-xs text-gray-500 text-center">
                                              ... and {worksheet.assignedMachines.length - 2} more
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Machine Assignment Dropdown */}
                                    <div className="flex space-x-1">
                                      <select
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            console.log('Assignment dropdown triggered');
                                            
                                            // Check if machine is already assigned to another worksheet of same type
                                            const machineId = e.target.value;
                                            const machine = machines.find(m => m.machineId === machineId);
                                            const existingWorksheets = getWorksheets();
                                            const conflictingWorksheet = existingWorksheets.find(w => 
                                              w.id !== worksheet.id &&
                                              w.modality === worksheet.modality && 
                                              w.frequency === worksheet.frequency &&
                                              w.assignedMachines && 
                                              w.assignedMachines.includes(machineId)
                                            );
                                            
                                            if (conflictingWorksheet) {
                                              if (window.confirm(`${machine?.name} is already assigned to another ${worksheet.frequency} ${worksheet.modality} worksheet. Do you want to move it to this worksheet instead?`)) {
                                                // Remove from old worksheet
                                                const success1 = unassignWorksheetFromMachine(conflictingWorksheet.id, machineId);
                                                // Add to new worksheet
                                                const success2 = assignWorksheetToMachine(worksheet.id, machineId);
                                                if (success1 && success2) {
                                                  console.log('Machine moved between worksheets successfully');
                                                  setRefreshKey(prev => prev + 1);
                                                  window.dispatchEvent(new Event('storage'));
                                                  toast.success(`${machine?.name} moved to this worksheet`);
                                                }
                                              }
                                            } else {
                                              const success = assignWorksheetToMachine(worksheet.id, e.target.value);
                                              if (success) {
                                                console.log('Assignment successful, forcing refresh...');
                                                // Multiple refresh mechanisms
                                                setRefreshKey(prev => prev + 1);
                                                // Force re-evaluation of all data
                                                window.dispatchEvent(new Event('storage'));
                                                // Force view mode changes to trigger re-render
                                                const currentMode = viewMode;
                                                setViewMode('overview');
                                                setTimeout(() => {
                                                  setViewMode(currentMode);
                                                  setRefreshKey(prev => prev + 1);
                                                }, 200);
                                              }
                                            }
                                            e.target.value = '';
                                          }
                                        }}
                                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-100"
                                      >
                                        <option value="">Assign to machine...</option>
                                        {machines
                                          .filter(m => m.type === worksheet.modality && !(worksheet.assignedMachines || []).includes(m.machineId))
                                          .map(machine => (
                                            <option key={machine.machineId} value={machine.machineId}>
                                              {machine.name}
                                            </option>
                                          ))
                                        }
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
                });
              })()}
              
              {/* Show message if no worksheets exist */}
              {getWorksheets().length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">No QC Worksheets Found</div>
                  <div className="text-gray-500 text-sm">
                    Create worksheets from templates to see them here. Worksheets can then be assigned to machines.
                  </div>
                </div>
              )}
            </div>
            
            {/* Unassigned Worksheets Section */}
            <div className="bg-gray-800 rounded-lg p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">📋 Unassigned Worksheets</h2>
              <p className="text-gray-400 mb-6">Worksheets that have been created but are not currently assigned to any machines.</p>
              
              {(() => {
                // Get all worksheets that are NOT assigned to machines
                const unassignedWorksheets = getWorksheets().filter(w => 
                  !w.assignedMachines || w.assignedMachines.length === 0
                );
                
                // Apply filters to unassigned worksheets
                let filteredUnassigned = unassignedWorksheets;
                
                if (filterModality) {
                  filteredUnassigned = filteredUnassigned.filter(w => w.modality === filterModality);
                }
                
                if (filterFrequency) {
                  filteredUnassigned = filteredUnassigned.filter(w => w.frequency === filterFrequency);
                }
                
                if (filteredUnassigned.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {unassignedWorksheets.length === 0 
                          ? "No unassigned worksheets found." 
                          : "No unassigned worksheets match the current filters."
                        }
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUnassigned.map(worksheet => {
                      const modality = modalities.find(m => m.value === worksheet.modality);
                      const frequency = frequencies.find(f => f.value === worksheet.frequency);
                      
                      return (
                        <div key={worksheet.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-100 text-sm">{worksheet.title}</h4>
                            <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">
                              Unassigned
                            </span>
                          </div>
                          
                          {/* Template Source Info - Moved below title */}
                          {(worksheet.templateSource || worksheet.sourceTemplateName) && (
                            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2 mb-3">
                              <div className="text-xs text-blue-300 font-medium mb-1">
                                📋 Based on: {worksheet.sourceTemplateName || worksheet.templateSource}
                              </div>
                              {(() => {
                                // Check if worksheet has been modified from template
                                const isModified = worksheet.isModified || 
                                                 (worksheet.modifications && worksheet.modifications.length > 0) ||
                                                 (worksheet.customizations && worksheet.customizations.length > 0);
                                
                                if (isModified) {
                                  const modifications = worksheet.modifications || worksheet.customizations || [];
                                  return (
                                    <div className="text-xs text-amber-300">
                                      <div className="font-medium flex items-center">
                                        <span className="mr-1">🔧</span>
                                        <span>Modified from template</span>
                                        {modifications.length > 0 && (
                                          <span className="ml-1 px-1 py-0.5 bg-amber-800/50 rounded text-amber-200">
                                            {modifications.length} changes
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="text-xs text-green-300 flex items-center">
                                      <span className="mr-1">✓</span>
                                      <span>Unmodified from template</span>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}
                          
                          <div className="space-y-2 mb-4">
                            <div className="text-xs text-gray-300">
                              <strong>Modality:</strong> {modality?.icon} {worksheet.modality}
                            </div>
                            <div className="text-xs text-gray-400">
                              <strong>Frequency:</strong> {frequency?.icon} {frequency?.label || worksheet.frequency}
                            </div>
                            <div className="text-xs text-gray-400">
                              <strong>Tests:</strong> {worksheet.tests?.length || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created: {new Date(worksheet.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {/* Machine Assignment Dropdown */}
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  console.log('Dropdown selected:', e.target.value, 'for worksheet:', worksheet.id);
                                  
                                  // Check if machine is already assigned to another worksheet of same type
                                  const machineId = e.target.value;
                                  const machine = machines.find(m => m.machineId === machineId);
                                  const existingWorksheets = getWorksheets();
                                  const conflictingWorksheet = existingWorksheets.find(w => 
                                    w.id !== worksheet.id &&
                                    w.modality === worksheet.modality && 
                                    w.frequency === worksheet.frequency &&
                                    w.assignedMachines && 
                                    w.assignedMachines.includes(machineId)
                                  );
                                  
                                  if (conflictingWorksheet) {
                                    if (window.confirm(`${machine?.name} is already assigned to another ${worksheet.frequency} ${worksheet.modality} worksheet. Do you want to move it to this worksheet instead?`)) {
                                      // Remove from old worksheet
                                      const success1 = unassignWorksheetFromMachine(conflictingWorksheet.id, machineId);
                                      // Add to new worksheet
                                      const success2 = assignWorksheetToMachine(worksheet.id, machineId);
                                      if (success1 && success2) {
                                        console.log('Machine moved between worksheets successfully');
                                        setRefreshKey(prev => prev + 1);
                                        window.dispatchEvent(new Event('storage'));
                                        toast.success(`${machine?.name} moved to this worksheet`);
                                      }
                                    }
                                  } else {
                                    const success = assignWorksheetToMachine(worksheet.id, e.target.value);
                                    if (success) {
                                      console.log('Assignment successful, forcing refresh...');
                                      // Multiple refresh mechanisms
                                      setRefreshKey(prev => prev + 1);
                                      // Force re-evaluation of all data
                                      window.dispatchEvent(new Event('storage'));
                                      // Force view mode changes to trigger re-render
                                      const currentMode = viewMode;
                                      setViewMode('overview');
                                      setTimeout(() => {
                                        setViewMode(currentMode);
                                        setRefreshKey(prev => prev + 1);
                                      }, 200);
                                    }
                                  }
                                  e.target.value = '';
                                }
                              }}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Assign to machine...</option>
                              {(() => {
                                const filteredMachines = machines.filter(m => m.type === worksheet.modality);
                                console.log('Available machines for', worksheet.modality, ':', filteredMachines.map(m => m.name));
                                return filteredMachines.map(machine => (
                                  <option key={machine.machineId} value={machine.machineId}>
                                    {machine.name}
                                  </option>
                                ));
                              })()}
                            </select>
                            
                            {/* Edit/Delete Actions */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => editCustomWorksheet(worksheet)}
                                className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  console.log('DEBUG: Delete button clicked for worksheet:', worksheet.id);
                                  deleteWorksheet(worksheet.id);
                                }}
                                className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Custom Worksheet Builder */}
      {viewMode === 'custom' && (
        <div key={`custom-${refreshKey}`} className="space-y-6">
          {/* Load Template Dropdown */}
          {getModalityTemplates().length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Load from Template</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Template
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      
                      const templateId = parseInt(e.target.value);
                      const template = getModalityTemplates().find(t => t.id === templateId);
                      
                      if (template) {
                        setCustomWorksheetInfo({
                          title: template.title,
                          frequency: template.frequency,
                          machineId: '',
                          modality: template.modality,
                          description: template.description || ''
                        });
                        setCustomTests(template.tests.map(test => ({
                          ...test,
                          id: test.id || Date.now() + Math.random()
                        })));
                        
                        // IMPORTANT: Set selectedTemplate for proper template tracking
                        setSelectedTemplate(template);
                        setTemplateJustLoaded(true); // Flag that template was just loaded
                        setMatchedToTemplate(true); // Auto-check the "matched to template" checkbox
                        
                        // Clear real-time modifications since template was just loaded
                        setRealTimeModifications([]);
                        setHasRealTimeModifications(false);
                        
                        console.log('DEBUG: Template loaded via dropdown, selectedTemplate set:', template);
                        
                        toast.success('Template loaded!');
                      }
                      
                      // Reset dropdown
                      e.target.value = '';
                    }}
                  >
                    <option value="">Choose a template to load...</option>
                    
                    {getModalityTemplates().map(template => (
                      <option key={template.id} value={template.id}>
                        {template.title} ({template.modality} • {getFrequencyLabel(template.frequency)} • {template.tests.length} tests)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manage Templates
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('templates')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <span>🗂️</span>
                      <span>Manage Templates</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Matching Control */}
          {selectedTemplate && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="matchedToTemplate"
                  checked={matchedToTemplate}
                  onChange={(e) => {
                    setMatchedToTemplate(e.target.checked);
                    // Clear modifications when unchecked
                    if (!e.target.checked) {
                      setRealTimeModifications([]);
                      setHasRealTimeModifications(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="matchedToTemplate" className="text-sm font-medium text-gray-300">
                  📋 Matched to template: "{selectedTemplate.title}"
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-7">
                When checked, modifications from the template will be tracked. Uncheck this if you want to treat this worksheet as created from scratch.
              </p>
            </div>
          )}

          {/* Worksheet Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Worksheet Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Worksheet Title *
                </label>
                <input
                  type="text"
                  value={customWorksheetInfo.title}
                  onChange={(e) => updateCustomWorksheetInfo('title', e.target.value)}
                  placeholder="e.g., MRI Weekly QC Protocol"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Machine *
                </label>
                <select
                  value={customWorksheetInfo.machineId}
                  onChange={(e) => updateCustomWorksheetInfo('machineId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a machine...</option>
                  {machines.map(machine => (
                    <option key={machine.machineId} value={machine.machineId}>
                      {machine.name} ({machine.type}) - {machine.location.building}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequency Category
                </label>
                <select
                  value={customWorksheetInfo.frequency}
                  onChange={(e) => updateCustomWorksheetInfo('frequency', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.icon} {freq.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={customWorksheetInfo.description}
                  onChange={(e) => updateCustomWorksheetInfo('description', e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* DICOM Series Selection for Worksheets */}
          {customWorksheetInfo.modality && customWorksheetInfo.machineId && (
            <DICOMSeriesSelector
              machineId={customWorksheetInfo.machineId}
              frequency={customWorksheetInfo.frequency}
              modality={customWorksheetInfo.modality}
              selectedDate={new Date().toISOString().split('T')[0]}
              onSeriesSelection={(series) => {
                console.log('Worksheet DICOM series selection:', series);
                // Store series selection in worksheet data for future use
              }}
              viewOnly={false}
            />
          )}

          {/* Test Builder */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-100">QC Tests</h2>
              <button
                onClick={addCustomTest}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Test</span>
              </button>
            </div>

            <div className="space-y-4">
              {customTests.map((test, index) => (
                <div key={test.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-100">Test #{index + 1}</h3>
                    {customTests.length > 1 && (
                      <button
                        onClick={() => removeCustomTest(test.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Test Name *
                      </label>
                      <input
                        type="text"
                        value={test.testName}
                        onChange={(e) => updateCustomTest(test.id, 'testName', e.target.value)}
                        placeholder="e.g., Signal-to-Noise Ratio"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Test Type
                      </label>
                      <select
                        value={test.testType}
                        onChange={(e) => updateCustomTest(test.id, 'testType', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="value">Numerical Value</option>
                        <option value="text">Text Entry</option>
                        <option value="passfail">Pass/Fail</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tolerance/Range
                      </label>
                      <input
                        type="text"
                        value={test.tolerance}
                        onChange={(e) => updateCustomTest(test.id, 'tolerance', e.target.value)}
                        placeholder="e.g., ±5%, >100, 0-10"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Units
                      </label>
                      <input
                        type="text"
                        value={test.units}
                        onChange={(e) => updateCustomTest(test.id, 'units', e.target.value)}
                        placeholder="e.g., mm, %, dB, HU"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Notes/Instructions
                      </label>
                      <input
                        type="text"
                        value={test.notes}
                        onChange={(e) => updateCustomTest(test.id, 'notes', e.target.value)}
                        placeholder="Optional test instructions or notes"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              
              {/* Save as Template Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-300 mb-3 text-center">📁 Save as Template</h4>
                <p className="text-sm text-gray-400 mb-4 text-center">
                  Save this configuration as a reusable template for future worksheets
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={saveCustomTemplate}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <span>💾</span>
                    <span>Save as Custom Template</span>
                  </button>
                  <button
                    onClick={saveAsTemplate}
                    className="px-6 py-3 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🏷️</span>
                    <span>Save as Modality Template</span>
                  </button>
                </div>
              </div>

              {/* Save to Machine Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-purple-300 mb-3 text-center">🖥️ Save to Machine</h4>
                <p className="text-sm text-gray-400 mb-4 text-center">
                  Generate a worksheet and assign it to a specific machine for immediate use
                </p>
                
                {/* Check for deviations from template - Real-time detection */}
                {selectedTemplate && !templateJustLoaded && hasRealTimeModifications && (
                  <div className="mb-4 p-3 bg-yellow-800 bg-opacity-50 rounded-md border border-yellow-600">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-yellow-400">⚠️</span>
                      <span className="text-sm font-medium text-yellow-200">Template Modifications Detected</span>
                    </div>
                    <p className="text-xs text-yellow-300">
                      This worksheet contains changes from the original template "{selectedTemplate.title}". 
                      The assigned worksheet will include your custom modifications.
                    </p>
                    {realTimeModifications.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-yellow-200 font-medium">Changes:</p>
                        <ul className="text-xs text-yellow-300 list-disc list-inside">
                          {realTimeModifications.slice(0, 3).map((mod, index) => (
                            <li key={index}>{mod}</li>
                          ))}
                          {realTimeModifications.length > 3 && (
                            <li>... and {realTimeModifications.length - 3} more changes</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      console.log('DEBUG: Assign to Machine clicked');
                      console.log('DEBUG: worksheetData (edit mode):', worksheetData);
                      console.log('DEBUG: customWorksheetInfo:', customWorksheetInfo);
                      
                      if (!customWorksheetInfo.machineId) {
                        toast.error('Please select a machine first');
                        return;
                      }
                      
                      const machine = machines.find(m => m.machineId === customWorksheetInfo.machineId);
                      
                      if (worksheetData) {
                        // EDITING EXISTING WORKSHEET
                        console.log('DEBUG: Updating existing worksheet');
                        
                        const updatedWorksheetData = {
                          ...worksheetData, // Preserve original worksheet data
                          title: customWorksheetInfo.title,
                          description: customWorksheetInfo.description,
                          modality: customWorksheetInfo.modality,
                          frequency: customWorksheetInfo.frequency,
                          tests: [...customTests], // Updated tests
                          assignedMachines: [customWorksheetInfo.machineId], // Update machine assignment
                          specificMachine: customWorksheetInfo.machineId,
                          // Update template tracking based on current "matched to template" state
                          isModified: (selectedTemplate && matchedToTemplate) ? true : false,
                          sourceTemplateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null,
                          sourceTemplateName: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
                          templateSource: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null, // Legacy support
                          templateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null // Legacy support
                        };
                        
                        console.log('DEBUG: Updating worksheet with data:', {
                          updatedWorksheetData: updatedWorksheetData,
                          templateInfo: {
                            hasSelectedTemplate: !!selectedTemplate,
                            matchedToTemplate: matchedToTemplate,
                            originalSourceTemplateId: worksheetData.sourceTemplateId,
                            newSourceTemplateId: updatedWorksheetData.sourceTemplateId,
                            willShowTemplateDialog: !!(updatedWorksheetData.sourceTemplateId || updatedWorksheetData.sourceTemplateName)
                          }
                        });
                        
                        // Update the existing worksheet
                        const updatedWorksheet = updateWorksheet(updatedWorksheetData);
                        console.log('DEBUG: Updated worksheet:', updatedWorksheet);
                        
                        if (updatedWorksheet) {
                          // Force UI refresh
                          setRefreshKey(prev => prev + 1);
                          window.dispatchEvent(new Event('storage'));
                          
                          toast.success(`Worksheet "${updatedWorksheet.title}" updated successfully!`);
                          
                          // Switch to worksheets view to see the result
                          setTimeout(() => {
                            setViewMode('worksheets');
                          }, 500);
                        } else {
                          toast.error('Failed to update worksheet');
                        }
                      } else {
                        // CREATING NEW WORKSHEET
                        console.log('DEBUG: Creating new worksheet copy for machine');
                        console.log('DEBUG: Current customTests:', customTests);
                        console.log('DEBUG: selectedTemplate at time of creation:', selectedTemplate);
                        
                        // Create unique worksheet for this specific machine
                        const uniqueWorksheetData = {
                          ...customWorksheetInfo,
                          // Create unique title that includes machine name
                          title: `${customWorksheetInfo.title} - ${machine?.name || customWorksheetInfo.machineId}`,
                          tests: [...customTests], // Deep copy of tests
                          id: `${Date.now()}-${customWorksheetInfo.machineId}`, // Unique ID with machine
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          // Only include template tracking if "matched to template" is checked
                          isModified: (selectedTemplate && matchedToTemplate) ? true : false,
                          sourceTemplateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null,
                          sourceTemplateName: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
                          templateSource: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null, // Legacy support
                          templateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null, // Legacy support
                          isWorksheet: true,
                          assignedMachines: [customWorksheetInfo.machineId], // Only this machine
                          specificMachine: customWorksheetInfo.machineId // Track which machine this is for
                        };
                        
                        console.log('DEBUG: Creating unique worksheet for machine with template tracking:', {
                          uniqueWorksheetData: uniqueWorksheetData,
                          templateInfo: {
                            hasSelectedTemplate: !!selectedTemplate,
                            matchedToTemplate: matchedToTemplate,
                            templateId: selectedTemplate?.id,
                            templateTitle: selectedTemplate?.title,
                            sourceTemplateId: uniqueWorksheetData.sourceTemplateId,
                            sourceTemplateName: uniqueWorksheetData.sourceTemplateName,
                            willShowTemplateDialog: !!(uniqueWorksheetData.sourceTemplateId || uniqueWorksheetData.sourceTemplateName)
                          }
                        });
                        
                        // Save the worksheet to localStorage
                        const savedWorksheet = saveWorksheet(uniqueWorksheetData);
                        console.log('DEBUG: Saved worksheet:', savedWorksheet);
                        
                        if (savedWorksheet) {
                          // Force UI refresh
                          setRefreshKey(prev => prev + 1);
                          window.dispatchEvent(new Event('storage'));
                          
                          toast.success(`New worksheet created and assigned to ${machine?.name || 'machine'} successfully!`);
                          
                          // Switch to worksheets view to see the result
                          setTimeout(() => {
                            setViewMode('worksheets');
                          }, 500);
                        } else {
                          toast.error('Failed to save worksheet');
                        }
                      }
                    }}
                    className="px-8 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🖥️</span>
                    <span>{worksheetData ? 'Update Worksheet' : 'Assign to Machine'}</span>
                  </button>
                </div>
              </div>

              {/* Delete Worksheet Section - Only show when editing existing worksheet */}
              {worksheetData && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-red-400 mb-3">🗑️ Delete Worksheet</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Delete this worksheet permanently. This action cannot be undone.
                  </p>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="delete-worksheet-confirm"
                      checked={deleteConfirmation['worksheet'] || false}
                      onChange={(e) => setDeleteConfirmation(prev => ({
                        ...prev,
                        worksheet: e.target.checked
                      }))}
                      className="w-4 h-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500"
                    />
                    <label 
                      htmlFor="delete-worksheet-confirm"
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      I understand this action cannot be undone
                    </label>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        if (deleteConfirmation['worksheet']) {
                          console.log('DEBUG: Deleting worksheet:', worksheetData);
                          
                          // Delete the worksheet using the same logic as in the worksheets view
                          try {
                            const existingWorksheets = JSON.parse(localStorage.getItem('qcWorksheets') || '[]');
                            const updatedWorksheets = existingWorksheets.filter(ws => ws.id !== worksheetData.id);
                            localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
                            
                            // Clear the worksheet data and reset form
                            setWorksheetData(null);
                            setDeleteConfirmation(prev => ({
                              ...prev,
                              worksheet: false
                            }));
                            
                            // Reset custom form
                            setCustomWorksheetInfo({
                              title: '',
                              frequency: 'daily',
                              machineId: '',
                              modality: '',
                              description: ''
                            });
                            setCustomTests([
                              { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '' }
                            ]);
                            
                            // Force UI refresh
                            setRefreshKey(prev => prev + 1);
                            window.dispatchEvent(new Event('storage'));
                            
                            toast.success(`Worksheet "${worksheetData.title}" deleted successfully!`);
                            
                            // Switch to worksheets view
                            setTimeout(() => {
                              setViewMode('worksheets');
                            }, 500);
                          } catch (error) {
                            console.error('Error deleting worksheet:', error);
                            toast.error('Failed to delete worksheet');
                          }
                        } else {
                          toast.error('Please confirm that you understand this action cannot be undone');
                        }
                      }}
                      disabled={!deleteConfirmation['worksheet']}
                      className={`px-6 py-3 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                        deleteConfirmation['worksheet']
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>🗑️</span>
                      <span>Delete Worksheet Permanently</span>
                    </button>
                  </div>
                </div>
              )}
              
            </div>
            
            {/* Delete Template Section - Only show when editing existing template in Templates tab */}
            {selectedTemplate && viewMode === 'templates' && isCreatingTemplate && (
              <div className="mt-8 pt-6 border-t border-gray-600">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-red-400 mb-3">Danger Zone</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Once you delete a template, there is no going back. Please be certain.
                  </p>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="delete-template-confirm"
                      checked={deleteConfirmation['current'] || false}
                      onChange={(e) => setDeleteConfirmation(prev => ({
                        ...prev,
                        current: e.target.checked
                      }))}
                      className="w-4 h-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500"
                    />
                    <label 
                      htmlFor="delete-template-confirm"
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      I understand this action cannot be undone
                    </label>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (deleteConfirmation['current']) {
                        deleteModalityTemplate(selectedTemplate.id);
                        setDeleteConfirmation(prev => ({
                          ...prev,
                          current: false
                        }));
                        setIsCreatingTemplate(false);
                        setSelectedTemplate(null);
                        resetTemplateForm();
                        toast.success('Template deleted successfully!');
                      } else {
                        toast.error('Please confirm that you understand this action cannot be undone');
                      }
                    }}
                    disabled={!deleteConfirmation['current']}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      deleteConfirmation['current']
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    🗑️ Delete Template Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Worksheet Display - Shared across all modes */}
      {worksheetData && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              {worksheetData.isTemplate ? 'Template View (Read-Only)' : 
               viewMode === 'view-only' ? 'Worksheet Template' : 'Generated Worksheet'}
            </h3>
            <button
              onClick={() => setWorksheetData(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          </div>
          
          {!worksheetData.viewOnly && (
            <div className="flex space-x-4 mb-4">
              <button
                onClick={printWorksheet}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>🖨️</span>
                <span>Print Worksheet</span>
              </button>
              <button
                onClick={performQC}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <span>📝</span>
                <span>Perform QC</span>
              </button>
              {!worksheetData.fromTemplate && (
                <button
                  onClick={saveAsTemplate}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>Save as Template</span>
                </button>
              )}
            </div>
          )}

          {/* DICOM Series Selection for Worksheet View */}
          {worksheetData && worksheetData.modality && (
            <DICOMSeriesSelector
              machineId={worksheetData.machine?.machineId || "WORKSHEET_VIEW"}
              frequency={worksheetData.frequency}
              modality={worksheetData.modality}
              selectedDate={new Date().toISOString().split('T')[0]}
              onSeriesSelection={(series) => {
                console.log('Worksheet view DICOM series selection:', series);
                // Store series selection for worksheet context
              }}
              viewOnly={worksheetData.viewOnly || false}
            />
          )}

          {/* Worksheet Content */}
          <div className="bg-white rounded-lg p-6 text-black print:shadow-none">
            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">QC Worksheet</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Machine:</strong> {worksheetData.machine ? `${worksheetData.machine.name} (${worksheetData.machine.machineId})` : 'Not assigned to specific machine'}
                </div>
                <div>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <strong>Frequency:</strong> {getFrequencyLabel(worksheetData.frequency)}
                </div>
              </div>
            </div>

            {/* QC Tests Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">QC Test Results</h3>
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Test</th>
                    <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Expected/Tolerance</th>
                    <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Result</th>
                    <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Status</th>
                    <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {worksheetData.tests.map((test, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-4 py-3 font-medium">
                        {test.testName}
                        {test.units && <span className="text-sm text-gray-500 ml-1">({test.units})</span>}
                      </td>
                      <td className="border border-gray-400 px-4 py-3">
                        {test.testType === 'visual' ? (
                          <span className="text-sm text-gray-600">Visual Check</span>
                        ) : (
                          <div>
                            {test.tolerance && (
                              <div className="text-sm text-gray-600">
                                Tolerance: ±{test.tolerance}{test.units && ` ${test.units}`}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-3">
                        {!worksheetData.viewOnly && (
                          <div className="border-b border-gray-400 h-8 w-full"></div>
                        )}
                        {worksheetData.viewOnly && test.testType === 'visual' && (
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-1" />
                              <span className="text-sm">Pass</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-1" />
                              <span className="text-sm">Fail</span>
                            </label>
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-3">
                        {!worksheetData.viewOnly ? (
                          <div className="flex space-x-2">
                            <label className="flex items-center text-green-600">
                              <input type="checkbox" className="mr-1" />
                              <span className="text-xs">✓</span>
                            </label>
                            <label className="flex items-center text-red-600">
                              <input type="checkbox" className="mr-1" />
                              <span className="text-xs">✗</span>
                            </label>
                          </div>
                        ) : (
                          <div className="border-b border-gray-400 h-8 w-full"></div>
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-3">
                        <div className="border-b border-gray-400 h-8 w-full"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Overall Results */}
            {!worksheetData.viewOnly && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall QC Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-400 p-4 rounded">
                    <label className="flex items-center text-green-700">
                      <input type="checkbox" className="mr-2 scale-125" />
                      <span className="font-semibold">PASS</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">All tests within tolerance</p>
                  </div>
                  <div className="border border-gray-400 p-4 rounded">
                    <label className="flex items-center text-yellow-700">
                      <input type="checkbox" className="mr-2 scale-125" />
                      <span className="font-semibold">CONDITIONAL</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">Minor deviations noted</p>
                  </div>
                  <div className="border border-gray-400 p-4 rounded">
                    <label className="flex items-center text-red-700">
                      <input type="checkbox" className="mr-2 scale-125" />
                      <span className="font-semibold">FAIL</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">Tests outside tolerance</p>
                  </div>
                </div>
              </div>
            )}

            {/* Comments and Actions */}
            {!worksheetData.viewOnly && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments and Actions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">General Comments:</label>
                    <div className="border border-gray-400 h-24 w-full"></div>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">Corrective Actions Taken:</label>
                    <div className="border border-gray-400 h-24 w-full"></div>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">Follow-up Required:</label>
                    <div className="border border-gray-400 h-16 w-full"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Signatures */}
            {!worksheetData.viewOnly && (
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Technologist Signature:</p>
                    <div className="border-b border-gray-400 h-12 w-full mb-2"></div>
                    <p className="text-sm text-gray-600">Date: _______________</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Physicist Review:</p>
                    <div className="border-b border-gray-400 h-12 w-full mb-2"></div>
                    <p className="text-sm text-gray-600">Date: _______________</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Worksheets;
