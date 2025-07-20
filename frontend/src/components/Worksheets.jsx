import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkAndInitializeSampleData } from '../utils/sampleWorksheets';
import DICOMSeriesSelector from './DICOMSeriesSelector';
import DICOMTemplateConfig from './DICOMTemplateConfig';
import api from '../config/api';

const Worksheets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const [viewMode, setViewMode] = useState('worksheets'); // 'worksheets', 'custom', 'templates', 'view-only', 'dicom-config'
  const [customTests, setCustomTests] = useState([
    { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '', calculatedFromDicom: false, dicomSeriesSource: '' }
  ]);
  const [customWorksheetInfo, setCustomWorksheetInfo] = useState({
    title: '',
    frequency: 'daily',
    machineId: '',
    modality: '',
    description: '',
    startDate: '',
    hasEndDate: false,
    endDate: ''
  });
  const [templateMode, setTemplateMode] = useState('manage');
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
  const [deleteConfirmation, setDeleteConfirmation] = useState({});
  const [realTimeModifications, setRealTimeModifications] = useState([]);
  const [hasRealTimeModifications, setHasRealTimeModifications] = useState(false);
  const [matchedToTemplate, setMatchedToTemplate] = useState(false);
  const [dicomSeriesConfig, setDicomSeriesConfig] = useState([]);
  const [dicomConfigEnabled, setDicomConfigEnabled] = useState(true);
  const [originalDicomConfigForCancel, setOriginalDicomConfigForCancel] = useState([]);
  const [otherModalitySpecification, setOtherModalitySpecification] = useState('');
  const [isCreatingFromCopy, setIsCreatingFromCopy] = useState(false);
  const [templateJustLoadedFlag, setTemplateJustLoadedFlag] = useState(false);
  const [isViewingWorksheet, setIsViewingWorksheet] = useState(false);

  // Machine-specific DICOM configuration storage
  const getMachineSpecificDicomConfig = (machineId, modality, frequency) => {
    try {
      const stored = localStorage.getItem('machineDicomConfigs');
      if (stored) {
        const configs = JSON.parse(stored);
        const key = `${machineId}_${modality}_${frequency}`;
        return configs[key] || [];
      }
    } catch (error) {
      console.error('Error loading machine-specific DICOM config:', error);
    }
    return [];
  };

  const saveMachineSpecificDicomConfig = (machineId, modality, frequency, config) => {
    try {
      const stored = localStorage.getItem('machineDicomConfigs');
      const configs = stored ? JSON.parse(stored) : {};
      const key = `${machineId}_${modality}_${frequency}`;
      configs[key] = config;
      localStorage.setItem('machineDicomConfigs', JSON.stringify(configs));
      return true;
    } catch (error) {
      console.error('Error saving machine-specific DICOM config:', error);
      return false;
    }
  };

  // Helper functions for comprehensive worksheet management
  const getAllFrequencies = () => {
    return ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
  };

  // Helper function to detect if a worksheet is actually modified from its template
  const isWorksheetModifiedFromTemplate = (worksheet) => {
    // If no template source, not a template-based worksheet
    if (!worksheet.templateSource && !worksheet.sourceTemplateName) {
      return false;
    }
    
    // Find the original template
    const templates = getModalityTemplates();
    const originalTemplate = templates.find(t => 
      t.title === worksheet.templateSource || 
      t.title === worksheet.sourceTemplateName ||
      t.id === worksheet.templateId ||
      t.id === worksheet.sourceTemplateId
    );
    
    if (!originalTemplate) {
      // Template not found, assume modified
      console.log('Template not found for worksheet, assuming modified:', worksheet.templateSource);
      return true;
    }
    
    // Compare test count
    if (worksheet.tests.length !== originalTemplate.tests.length) {
      console.log('Worksheet modified: test count differs', worksheet.tests.length, 'vs', originalTemplate.tests.length);
      return true;
    }
    
    // Compare individual tests
    for (let i = 0; i < worksheet.tests.length; i++) {
      const worksheetTest = worksheet.tests[i];
      const templateTest = originalTemplate.tests[i];
      
      if (!templateTest) {
        return true;
      }
      
      // Compare key test properties
      if (worksheetTest.testName !== templateTest.testName ||
          worksheetTest.testType !== templateTest.testType ||
          worksheetTest.tolerance !== templateTest.tolerance ||
          worksheetTest.units !== templateTest.units ||
          worksheetTest.notes !== templateTest.notes ||
          worksheetTest.calculatedFromDicom !== templateTest.calculatedFromDicom ||
          worksheetTest.dicomSeriesSource !== templateTest.dicomSeriesSource) {
        console.log('Worksheet modified: test differs', worksheetTest.testName);
        return true;
      }
    }
    
    // Compare worksheet properties (excluding machine-specific ones)
    if (worksheet.frequency !== originalTemplate.frequency ||
        worksheet.modality !== originalTemplate.modality ||
        worksheet.description !== originalTemplate.description) {
      console.log('Worksheet modified: properties differ');
      return true;
    }
    
    // Compare DICOM configuration
    const worksheetDicom = worksheet.dicomSeriesConfig || [];
    const templateDicom = originalTemplate.dicomSeriesConfig || [];
    if (JSON.stringify(worksheetDicom) !== JSON.stringify(templateDicom)) {
      console.log('Worksheet modified: DICOM config differs');
      return true;
    }
    
    return false;
  };

  // Function to identify which tests are custom or modified from template
  const getTestCustomizationStatus = (worksheet, test, testIndex) => {
    // If no template source, all tests are custom
    if (!worksheet.templateSource && !worksheet.sourceTemplateName) {
      return 'custom';
    }
    
    // Find the original template
    const templates = getModalityTemplates();
    const originalTemplate = templates.find(t => 
      t.title === worksheet.templateSource || 
      t.title === worksheet.sourceTemplateName ||
      t.id === worksheet.templateId ||
      t.id === worksheet.sourceTemplateId
    );
    
    if (!originalTemplate || !originalTemplate.tests) {
      return 'custom';
    }
    
    // If test index is beyond original template, it's a new custom test
    if (testIndex >= originalTemplate.tests.length) {
      return 'custom';
    }
    
    const templateTest = originalTemplate.tests[testIndex];
    if (!templateTest) {
      return 'custom';
    }
    
    // Compare test properties to see if modified
    if (test.testName !== templateTest.testName ||
        test.testType !== templateTest.testType ||
        test.tolerance !== templateTest.tolerance ||
        test.units !== templateTest.units ||
        test.notes !== templateTest.notes ||
        test.calculatedFromDicom !== templateTest.calculatedFromDicom ||
        test.dicomSeriesSource !== templateTest.dicomSeriesSource) {
      return 'modified';
    }
    
    return 'original';
  };

  // Function to identify which specific fields were modified
  const getFieldModifications = (worksheet, test, testIndex) => {
    const modifications = {
      testName: false,
      testType: false,
      tolerance: false,
      units: false,
      notes: false,
      calculatedFromDicom: false,
      dicomSeriesSource: false
    };

    // If no template source, all fields are custom
    if (!worksheet.templateSource && !worksheet.sourceTemplateName) {
      return {
        testName: true,
        testType: true,
        tolerance: true,
        units: true,
        notes: true,
        calculatedFromDicom: true,
        dicomSeriesSource: true,
        isCustomTest: true
      };
    }
    
    // Find the original template
    const templates = getModalityTemplates();
    const originalTemplate = templates.find(t => 
      t.title === worksheet.templateSource || 
      t.title === worksheet.sourceTemplateName ||
      t.id === worksheet.templateId ||
      t.id === worksheet.sourceTemplateId
    );
    
    if (!originalTemplate || !originalTemplate.tests) {
      return {
        testName: true,
        testType: true,
        tolerance: true,
        units: true,
        notes: true,
        calculatedFromDicom: true,
        dicomSeriesSource: true,
        isCustomTest: true
      };
    }
    
    // Find matching template test by name instead of index to handle deletions correctly
    const templateTest = originalTemplate.tests.find(t => 
      t.testName === test.testName || t.name === test.testName
    );
    
    if (!templateTest) {
      // Test doesn't exist in original template, it's a new custom test
      return {
        testName: true,
        testType: true,
        tolerance: true,
        units: true,
        notes: true,
        calculatedFromDicom: true,
        dicomSeriesSource: true,
        isCustomTest: true
      };
    }
    
    // Compare each field individually, handling undefined template values
    const fieldMods = {
      testName: test.testName !== (templateTest.testName || templateTest.name),
      testType: test.testType !== templateTest.testType,
      tolerance: test.tolerance !== templateTest.tolerance,
      units: test.units !== templateTest.units,
      notes: test.notes !== templateTest.notes,
      calculatedFromDicom: (test.calculatedFromDicom || false) !== (templateTest.calculatedFromDicom || false),
      dicomSeriesSource: test.dicomSeriesSource !== templateTest.dicomSeriesSource,
      isCustomTest: false
    };
    
    // Debug logging for calculatedFromDicom changes
    if (fieldMods.calculatedFromDicom) {
      console.log(`Field modification detected for test "${test.testName}":`, {
        testCalculatedFromDicom: test.calculatedFromDicom,
        templateCalculatedFromDicom: templateTest.calculatedFromDicom,
        fieldMods
      });
    }
    
    return fieldMods;
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

  const clearAllWorksheets = () => {
    try {
      const confirmDelete = window.confirm(
        'Are you sure you want to delete ALL worksheets? This will keep templates but remove all worksheet assignments. This action cannot be undone.'
      );
      
      if (confirmDelete) {
        const worksheets = getWorksheets();
        console.log(`Deleting ${worksheets.length} worksheets...`);
        
        localStorage.setItem('qcWorksheets', JSON.stringify([]));
        setRefreshKey(prev => prev + 1);
        window.dispatchEvent(new Event('storage'));
        
        toast.success(`Successfully deleted ${worksheets.length} worksheets. Templates preserved.`);
        console.log('All worksheets deleted. Templates preserved.');
      }
    } catch (error) {
      console.error('Error clearing worksheets:', error);
      toast.error('Failed to clear worksheets');
    }
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
      
      // Force refresh
      setRefreshKey(prev => prev + 1);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const assignWorksheetToMachine = (worksheetId, machineId) => {
    console.log('DEBUG: assignWorksheetToMachine called with:', { worksheetId, machineId });
    
    try {
      const worksheets = getWorksheets();
      const worksheetIndex = worksheets.findIndex(w => w.id === worksheetId);
      
      if (worksheetIndex === -1) {
        toast.error('Worksheet not found');
        return false;
      }
      
      const worksheet = worksheets[worksheetIndex];
      
      if (!Array.isArray(worksheet.assignedMachines)) {
        worksheet.assignedMachines = [];
      }
      
      if (worksheet.assignedMachines.includes(machineId)) {
        toast.info('This machine is already assigned to this worksheet');
        return false;
      }
      
      worksheet.assignedMachines.push(machineId);
      worksheet.updatedAt = new Date().toISOString();
      
      localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
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
      setRefreshKey(prev => prev + 1);
      return true;
    }
    return false;
  };

  const editCustomWorksheet = (worksheet) => {
    console.log('editCustomWorksheet called with worksheet:', worksheet);
    console.log('Worksheet templateSource:', worksheet.templateSource);
    
    // Load worksheet data into the custom worksheet form for editing
    setCustomWorksheetInfo({
      title: worksheet.title,
      frequency: worksheet.frequency,
      machineId: worksheet.assignedMachines && worksheet.assignedMachines.length > 0 ? worksheet.assignedMachines[0] : '',
      modality: worksheet.modality,
      description: worksheet.description || '',
      startDate: worksheet.startDate || '',
      hasEndDate: worksheet.hasEndDate || false,
      endDate: worksheet.endDate || ''
    });
    
    // Restore other modality specification if it exists
    setOtherModalitySpecification(worksheet.otherModalitySpecification || '');
    
    // Load the tests from the worksheet
    setCustomTests(worksheet.tests || []);
    
    // Load DICOM series configuration if it exists
    if (worksheet.dicomSeriesConfig && worksheet.dicomSeriesConfig.length > 0) {
      setDicomSeriesConfig(worksheet.dicomSeriesConfig);
      setDicomConfigEnabled(true);
    } else {
      setDicomSeriesConfig([]);
      setDicomConfigEnabled(false);
    }
    
    // Set the worksheet data for editing (NOT template)
    // Ensure templateSource is included for proper edit mode detection
    const worksheetForEditing = {
      ...worksheet,
      templateSource: worksheet.templateSource,
      isEditing: true // Additional flag to ensure edit mode is detected
    };
    
    console.log('Setting worksheetData for editing:', worksheetForEditing);
    setWorksheetDataSafe(worksheetForEditing);
    
    // If worksheet came from a template, restore template information for proper tracking
    if (worksheet.templateSource || worksheet.sourceTemplateName) {
      const templates = getModalityTemplates();
      const originalTemplate = templates.find(t => 
        t.title === worksheet.templateSource || 
        t.title === worksheet.sourceTemplateName ||
        t.id === worksheet.templateId ||
        t.id === worksheet.sourceTemplateId
      );
      
      if (originalTemplate) {
        setSelectedTemplate(originalTemplate);
        setMatchedToTemplate(true); // Enable tracking for worksheets that came from templates
        setTemplateJustLoadedFlag(false); // Allow modification detection since this is editing
        console.log('Restored template for editing:', originalTemplate);
      } else {
        setSelectedTemplate(null);
        setMatchedToTemplate(false);
      }
    } else {
      // Clear template selection for worksheets not created from templates
      setSelectedTemplate(null);
      setMatchedToTemplate(false);
    }
    
    // Set to custom mode for editing
    setIsViewingWorksheet(false);  // Set edit mode (not read-only)
    setViewMode('custom');
    
    toast.success(`Editing worksheet: ${worksheet.title}`);
  };

  const viewCustomWorksheetReadOnly = (worksheet, machineId = null) => {
    console.log('viewCustomWorksheetReadOnly called with worksheet:', worksheet, 'machineId:', machineId);
    
    // Load worksheet for viewing in read-only edit mode (same as edit but read-only)
    setWorksheetDataSafe(worksheet);
    setViewMode('custom');  // Use same mode as edit
    
    // Set state to match the worksheet
    setSelectedTemplate(null);
    setMatchedToTemplate(false);
    setTemplateJustLoadedFlag(false);
    setCustomWorksheetInfo({
      title: worksheet.title || '',
      frequency: worksheet.frequency || 'daily',
      machineId: worksheet.machineId || '',
      modality: worksheet.modality || '',
      description: worksheet.description || '',
      startDate: worksheet.startDate || '',
      hasEndDate: worksheet.hasEndDate || false,
      endDate: worksheet.endDate || ''
    });
    setCustomTests(worksheet.tests || []);
    setDicomSeriesConfig(worksheet.dicomSeriesConfig || []);
    setOtherModalitySpecification(worksheet.otherModalitySpecification || '');
    setIsViewingWorksheet(true);  // Set read-only mode
    
    toast.success(`Viewing worksheet: ${worksheet.title}`);
  };

  const frequencies = [
    { value: 'daily', label: 'Daily QC', icon: '📅' },
    { value: 'weekly', label: 'Weekly QC', icon: '📆' },
    { value: 'monthly', label: 'Monthly QC', icon: '📊' },
    { value: 'annual', label: 'Annual QC', icon: '🗓️' }
  ];

  const modalities = [
    { value: 'CT', label: 'CT', icon: '🏥' },
    { value: 'PET', label: 'PET', icon: '🔬' },
    { value: 'MRI', label: 'MRI', icon: '🧲' },
    { value: 'Ultrasound', label: 'Ultrasound', icon: '🔊' },
    { value: 'Mammography', label: 'Mammography', icon: '🎗️' },
    { value: 'Other', label: 'Other', icon: '⚙️' }
  ];

  const otherModalityOptions = [
    { value: 'Dose Calibrator', label: 'Dose Calibrator', icon: '☢️' },
    { value: 'Apron', label: 'Apron', icon: '🦺' },
    { value: 'General', label: 'General', icon: '🔧' }
  ];

  // Initialize sample data on mount
  useEffect(() => {
    const initializeSampleData = async () => {
      try {
        await checkAndInitializeSampleData();
        console.log('Sample data initialized successfully');
      } catch (error) {
        console.error('Error initializing sample data:', error);
      }
    };
    
    initializeSampleData();
    
    // Prevent automatic printing by storing original function
    const originalPrint = window.print;
    let autoPrintPrevented = false;
    
    window.print = function() {
      if (!autoPrintPrevented) {
        console.log('Automatic print call intercepted and prevented');
        autoPrintPrevented = true;
        return;
      }
      // Allow manual print calls after first automatic one is blocked
      originalPrint.call(window);
    };
    
    return () => {
      // Restore original print function on cleanup
      window.print = originalPrint;
    };
  }, []);

  // Load machines on mount
  useEffect(() => {
    console.log('Worksheets: Loading machines...');
    const loadMachines = async () => {
      try {
        setError(null);
        const response = await api.get('/machines');
        console.log('Machines loaded:', response.data.length);
        setMachines(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load machines:', error);
        
        // Try fallback endpoints if the primary fails
        try {
          console.log('Trying fallback API endpoint...');
          let fallbackResponse;
          
          if (window.location.hostname === 'qctracker.a-naviq.com') {
            // Try direct API call if on public domain
            fallbackResponse = await fetch('https://qctracker.a-naviq.com/api/machines');
          } else {
            // Try direct backend if local
            fallbackResponse = await fetch('http://192.168.1.182:5000/api/machines');
          }
          
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log('Fallback successful:', data.length);
            setMachines(data);
            setLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
        
        setError(error.message || 'Failed to load machines');
        setLoading(false);
        toast.error('Failed to load machines');
      }
    };

    loadMachines();
  }, []);

  // Handle URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    const machineId = searchParams.get('machineId');
    const frequency = searchParams.get('frequency');
    const templateId = searchParams.get('templateId');
    const templateSource = searchParams.get('templateSource');
    const viewOnly = searchParams.get('viewOnly');

    if (mode === 'template' && templateId) {
      setViewMode('templates');
      loadTemplateForView(templateId);
    } else if (mode === 'view-only' && machineId && frequency) {
      setViewMode('view-only');
      loadWorksheetForViewing(machineId, frequency);
    } else if (mode === 'worksheet' && machineId && frequency) {
      setViewMode('worksheets');
      setSelectedMachine(machineId);
      setSelectedFrequency(frequency);
      generateWorksheet(machineId, frequency);
    } else if (mode === 'edit' && templateSource) {
      loadWorksheetForEditing(templateSource, machineId, frequency);
    } else if (mode) {
      setViewMode(mode);
    }
  }, [searchParams, machines]);

  const loadTemplateForView = async (templateId) => {
    try {
      const response = await api.get(`/worksheet-templates/${templateId}`);
      const template = response.data;
      
      setWorksheetDataSafe({
        ...template,
        viewOnly: true,
        fromTemplate: true
      });
      setSelectedTemplate(template);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };

  const loadWorksheetForViewing = async (machineId, frequency) => {
    try {
      const response = await api.get(`/worksheet-templates/generate/${machineId}/${frequency}`);
      const worksheet = response.data;
      
      setWorksheetDataSafe({
        ...worksheet,
        viewOnly: true,
        machineId: machineId
      });
    } catch (error) {
      console.error('Error loading worksheet for viewing:', error);
      toast.error('Failed to load worksheet');
    }
  };

  const loadWorksheetForEditing = (templateSource, machineId, frequency) => {
    try {
      // Find the specific worksheet by templateSource
      const worksheets = getWorksheets();
      const worksheet = worksheets.find(w => w.templateSource === templateSource);
      
      if (!worksheet) {
        toast.error('Worksheet not found');
        setViewMode('worksheets');
        return;
      }
      
      console.log('Loading worksheet for editing:', worksheet);
      
      // Load worksheet data into editing form
      setCustomWorksheetInfo({
        title: worksheet.title,
        frequency: worksheet.frequency,
        machineId: worksheet.assignedMachines && worksheet.assignedMachines.length > 0 ? worksheet.assignedMachines[0] : '',
        modality: worksheet.modality,
        description: worksheet.description || ''
      });
      
      // Load the tests from the worksheet
      setCustomTests(worksheet.tests || []);
      
      // Load DICOM series configuration if it exists
      if (worksheet.dicomSeriesConfig && worksheet.dicomSeriesConfig.length > 0) {
        setDicomSeriesConfig(worksheet.dicomSeriesConfig);
        setDicomConfigEnabled(true);
      } else {
        setDicomSeriesConfig([]);
        setDicomConfigEnabled(false);
      }
      
      // Set the worksheet data for editing (NOT template)
      setWorksheetDataSafe({
        ...worksheet,
        isEditing: true // Additional flag to ensure edit mode is detected
      });
      
      // Clear template selection since we're editing a worksheet, not a template
      setSelectedTemplate(null);
      
      // Set to custom mode for editing
      setViewMode('custom');
      
      toast.success(`Loaded worksheet "${worksheet.title}" for editing`);
      
    } catch (error) {
      console.error('Error loading worksheet for editing:', error);
      toast.error('Failed to load worksheet for editing');
      setViewMode('worksheets');
    }
  };

  const generateWorksheet = async (machineId, frequency) => {
    if (!machineId || !frequency) return;

    setLoadingWorksheet(true);
    try {
      const response = await api.get(`/worksheet-templates/generate/${machineId}/${frequency}`);
      const worksheet = response.data;
      
      setWorksheetDataSafe({
        ...worksheet,
        machineId: machineId,
        viewOnly: false
      });
    } catch (error) {
      console.error('Error generating worksheet:', error);
      toast.error('Failed to generate worksheet');
    } finally {
      setLoadingWorksheet(false);
    }
  };

  // Template management functions
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
    
    // Convert to array format for rendering
    return Object.keys(grouped).map(modality => ({
      modality,
      templates: grouped[modality]
    }));
  };

  const saveAsTemplate = () => {
    if (!customWorksheetInfo.title.trim()) {
      toast.error('Please enter a template title');
      return;
    }

    if (!customWorksheetInfo.modality) {
      toast.error('Please select a modality');
      return;
    }

    if (customTests.length === 0 || !customTests.some(test => test.testName.trim())) {
      toast.error('Please add at least one test');
      return;
    }

    // Validate DICOM series selection for calculated tests
    const calculatedTestsWithoutSource = customTests.filter(test => 
      test.calculatedFromDicom && !test.dicomSeriesSource
    );
    if (calculatedTestsWithoutSource.length > 0) {
      toast.error('Please select a DICOM series source for all calculated tests');
      return;
    }

    const savedTemplates = getModalityTemplates();
    
    const templateData = {
      id: selectedTemplate ? selectedTemplate.id : Date.now(),
      title: customWorksheetInfo.title,
      modality: customWorksheetInfo.modality,
      frequency: customWorksheetInfo.frequency,
      description: customWorksheetInfo.description,
      tests: customTests.filter(test => test.testName.trim()),
      dicomSeriesConfig: dicomSeriesConfig || [],
      otherModalitySpecification: otherModalitySpecification,
      createdAt: selectedTemplate ? selectedTemplate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (selectedTemplate && !isCreatingFromCopy) {
      // Update existing template
      const index = savedTemplates.findIndex(t => t.id === selectedTemplate.id);
      if (index !== -1) {
        savedTemplates[index] = templateData;
      } else {
        savedTemplates.push(templateData);
      }
    } else {
      // Add new template (either from scratch or from copy)
      savedTemplates.push(templateData);
    }

    localStorage.setItem('qcModalityTemplates', JSON.stringify(savedTemplates));
    
    toast.success(selectedTemplate && !isCreatingFromCopy ? 
      `Template updated successfully with ${dicomSeriesConfig.length} DICOM series configuration(s)!` : 
      `Template saved successfully with ${dicomSeriesConfig.length} DICOM series configuration(s)!`);
    setIsCreatingTemplate(false);
    setSelectedTemplate(null);
    setTemplateMode('manage');
    resetTemplateForm();
  };

  const loadTemplateForEditing = (template) => {
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
    setIsCreatingTemplate(true);
    setOtherModalitySpecification(template.otherModalitySpecification || '');
    
    // Load DICOM series configuration if it exists
    if (template.dicomSeriesConfig && template.dicomSeriesConfig.length > 0) {
      setDicomSeriesConfig(template.dicomSeriesConfig);
      setDicomConfigEnabled(true);
      toast.success(`Template loaded with ${template.dicomSeriesConfig.length} DICOM series configuration(s)!`);
    } else {
      setDicomSeriesConfig([]);
      setDicomConfigEnabled(false);
      toast.success('Template loaded for editing!');
    }
  };

  const deleteModalityTemplate = (templateId) => {
    const savedTemplates = getModalityTemplates();
    const templateToDelete = savedTemplates.find(t => t.id === templateId);
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
    
    localStorage.setItem('qcModalityTemplates', JSON.stringify(updatedTemplates));
    
    // Force refresh to update the UI
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new Event('storage'));
    
    toast.success(`Template "${templateToDelete?.title || 'Unknown'}" deleted successfully!`);
  };

  const createWorksheetFromTemplate = (template) => {
    console.log('Creating worksheet from template:', template.title);
    
    // Load template data into custom worksheet form
    setCustomWorksheetInfo({
      title: template.title,
      frequency: template.frequency,
      machineId: '',
      modality: template.modality || '',
      description: template.description || '',
      startDate: '',
      hasEndDate: false,
      endDate: ''
    });
    setCustomTests(template.tests.map(test => ({
      ...test,
      id: test.id || Date.now() + Math.random()
    })));
    setSelectedTemplate(template);
    setTemplateJustLoaded(true);
    
    // Load DICOM series configuration if it exists
    if (template.dicomSeriesConfig && template.dicomSeriesConfig.length > 0) {
      setDicomSeriesConfig(template.dicomSeriesConfig);
      setDicomConfigEnabled(true);
    } else {
      setDicomSeriesConfig([]);
      setDicomConfigEnabled(false);
    }
    
    // Switch to custom worksheet tab with template loaded
    setViewMode('custom');
    toast.success(`Template loaded! ${template.dicomSeriesConfig?.length || 0} DICOM series configuration(s) included.`);
  };

  const resetTemplateForm = () => {
    setCustomWorksheetInfo({
      title: '',
      frequency: 'daily',
      machineId: '',
      modality: '',
      description: '',
      startDate: '',
      hasEndDate: false,
      endDate: ''
    });
    setCustomTests([
      { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '' }
    ]);
    setSelectedTemplate(null);
    setSelectedTemplateForGeneration('');
    setIsCreatingTemplate(false);
    setTemplateJustLoaded(false);
    setMatchedToTemplate(false);
    setDicomSeriesConfig([]);
    setDicomConfigEnabled(false);
    setOtherModalitySpecification('');
    setIsCreatingFromCopy(false);
    setTemplateJustLoadedFlag(false);
  };

  const saveWorksheet = (worksheetData) => {
    try {
      const worksheets = getWorksheets();
      const existingIndex = worksheets.findIndex(w => w.id === worksheetData.id);
      
      if (existingIndex !== -1) {
        // Update existing worksheet
        worksheets[existingIndex] = {
          ...worksheetData,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new worksheet
        worksheets.push({
          ...worksheetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
      return worksheetData;
    } catch (error) {
      console.error('Error saving worksheet:', error);
      return null;
    }
  };

  const createWorksheet = () => {
    if (!customWorksheetInfo.title) {
      toast.error('Please provide a worksheet title');
      return;
    }

    if (!customWorksheetInfo.machineId) {
      toast.error('Please select a machine');
      return;
    }

    if (!customWorksheetInfo.startDate) {
      toast.error('Please specify a QC start date');
      return;
    }

    if (customWorksheetInfo.hasEndDate && !customWorksheetInfo.endDate) {
      toast.error('Please specify a QC end date or uncheck the end date option');
      return;
    }

    if (customWorksheetInfo.hasEndDate && customWorksheetInfo.endDate && customWorksheetInfo.startDate && customWorksheetInfo.endDate <= customWorksheetInfo.startDate) {
      toast.error('QC end date must be after the start date');
      return;
    }

    if (customTests.some(test => !test.testName.trim())) {
      toast.error('Please provide names for all tests');
      return;
    }

    // Check for duplicate template assignments to the same machine
    if (selectedTemplate && matchedToTemplate && !worksheetData?.isEditing) {
      const existingWorksheets = getWorksheets();
      const conflictingWorksheet = existingWorksheets.find(ws => 
        ws.assignedMachines && 
        ws.assignedMachines.includes(customWorksheetInfo.machineId) &&
        ws.frequency === customWorksheetInfo.frequency &&
        (ws.templateSource === selectedTemplate.title || 
         ws.sourceTemplateName === selectedTemplate.title ||
         ws.templateId === selectedTemplate.id ||
         ws.sourceTemplateId === selectedTemplate.id) &&
        ws.id !== worksheetData?.id // Don't conflict with itself when editing
      );

      if (conflictingWorksheet) {
        const machine = machines.find(m => m.machineId === customWorksheetInfo.machineId);
        const confirmed = window.confirm(
          `⚠️ Template Conflict Warning\n\n` +
          `The machine "${machine?.name || customWorksheetInfo.machineId}" already has a ${customWorksheetInfo.frequency} QC worksheet based on the "${selectedTemplate.title}" template.\n\n` +
          `Existing worksheet: "${conflictingWorksheet.title}"\n` +
          `New worksheet: "${customWorksheetInfo.title}"\n\n` +
          `Having multiple worksheets from the same template on one machine can cause confusion and duplicate QC requirements.\n\n` +
          `Do you want to proceed anyway?`
        );
        
        if (!confirmed) {
          return;
        }
      }
    }

    // Check for modality mismatch between template and machine
    if (selectedTemplate && matchedToTemplate) {
      const machine = machines.find(m => m.machineId === customWorksheetInfo.machineId);
      const templateModality = selectedTemplate.modality;
      const machineModality = machine?.type;
      
      if (templateModality && machineModality && templateModality !== machineModality) {
        const confirmed = window.confirm(
          `⚠️ Modality Mismatch Warning\n\n` +
          `You are assigning a "${templateModality}" template to a "${machineModality}" machine.\n\n` +
          `Template: "${selectedTemplate.title}" (${templateModality})\n` +
          `Machine: "${machine?.name || customWorksheetInfo.machineId}" (${machineModality})\n\n` +
          `This may result in inappropriate QC tests being assigned to this machine. QC tests designed for ${templateModality} equipment may not be suitable for ${machineModality} equipment.\n\n` +
          `Are you sure you want to proceed with this modality mismatch?`
        );
        
        if (!confirmed) {
          return;
        }
      }
    }

    const machine = machines.find(m => m.machineId === customWorksheetInfo.machineId);
    
    // Function to properly detect if worksheet is modified from template
    const detectActualModifications = () => {
      if (!selectedTemplate || !matchedToTemplate) {
        return false; // No template to compare against
      }
      
      // Compare test count
      if (customTests.length !== selectedTemplate.tests.length) {
        console.log('Modification detected: test count differs', customTests.length, 'vs', selectedTemplate.tests.length);
        return true;
      }
      
      // Compare individual tests
      for (let i = 0; i < customTests.length; i++) {
        const currentTest = customTests[i];
        const templateTest = selectedTemplate.tests[i];
        
        if (!templateTest) {
          console.log('Modification detected: template test missing at index', i);
          return true;
        }
        
        // Compare key test properties
        if (currentTest.testName !== templateTest.testName ||
            currentTest.testType !== templateTest.testType ||
            currentTest.tolerance !== templateTest.tolerance ||
            currentTest.units !== templateTest.units ||
            currentTest.notes !== templateTest.notes ||
            currentTest.calculatedFromDicom !== templateTest.calculatedFromDicom ||
            currentTest.dicomSeriesSource !== templateTest.dicomSeriesSource) {
          console.log('Modification detected: test differs', currentTest.testName, 'vs', templateTest.testName);
          return true;
        }
      }
      
      // Compare worksheet info (excluding machine-specific fields)
      if (customWorksheetInfo.frequency !== selectedTemplate.frequency ||
          customWorksheetInfo.modality !== selectedTemplate.modality ||
          customWorksheetInfo.description !== selectedTemplate.description) {
        console.log('Modification detected: worksheet info differs');
        return true;
      }
      
      // Compare DICOM configuration
      if (JSON.stringify(dicomSeriesConfig) !== JSON.stringify(selectedTemplate.dicomSeriesConfig || [])) {
        console.log('Modification detected: DICOM config differs');
        return true;
      }
      
      return false;
    };
    
    const isActuallyModified = detectActualModifications();
    
    // Check if we're updating an existing worksheet
    const isEditingExistingWorksheet = worksheetData && (worksheetData.templateSource || worksheetData.isEditing);
    
    let worksheetToSave;
    
    if (isEditingExistingWorksheet) {
      // Update existing worksheet - preserve original ID and creation date
      worksheetToSave = {
        ...worksheetData, // Start with original worksheet data
        ...customWorksheetInfo, // Update with new form data
        tests: [...customTests],
        updatedAt: new Date().toISOString(),
        isModified: isActuallyModified,
        sourceTemplateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : worksheetData.sourceTemplateId,
        sourceTemplateName: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : worksheetData.sourceTemplateName,
        templateSource: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : worksheetData.templateSource,
        templateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : worksheetData.templateId,
        dicomSeriesConfig: dicomSeriesConfig,
        otherModalitySpecification: otherModalitySpecification,
        startDate: customWorksheetInfo.startDate,
        hasEndDate: customWorksheetInfo.hasEndDate,
        endDate: customWorksheetInfo.hasEndDate ? customWorksheetInfo.endDate : null
      };
      console.log('Updating existing worksheet:', worksheetToSave);
    } else {
      // Create new worksheet for this specific machine
      worksheetToSave = {
        ...customWorksheetInfo,
        title: customWorksheetInfo.title, // Keep original title unchanged
        tests: [...customTests],
        id: `worksheet_${Date.now()}_${customWorksheetInfo.machineId}_${Math.random().toString(36).substr(2, 9)}`, // Unique internal ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isModified: isActuallyModified,
        sourceTemplateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null,
        sourceTemplateName: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
        templateSource: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
        templateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null,
        isWorksheet: true,
        assignedMachines: [customWorksheetInfo.machineId],
        specificMachine: customWorksheetInfo.machineId,
        dicomSeriesConfig: dicomSeriesConfig,
        otherModalitySpecification: otherModalitySpecification,
        startDate: customWorksheetInfo.startDate,
        hasEndDate: customWorksheetInfo.hasEndDate,
        endDate: customWorksheetInfo.hasEndDate ? customWorksheetInfo.endDate : null
      };
      console.log('Creating new worksheet:', worksheetToSave);
    }

    console.log('Template info being saved:', {
      templateSource: worksheetToSave.templateSource,
      sourceTemplateName: worksheetToSave.sourceTemplateName,
      templateId: worksheetToSave.templateId,
      sourceTemplateId: worksheetToSave.sourceTemplateId,
      selectedTemplate: selectedTemplate ? selectedTemplate.title : 'none'
    });

    const savedWorksheet = saveWorksheet(worksheetToSave);
    
    if (savedWorksheet) {
      setRefreshKey(prev => prev + 1);
      window.dispatchEvent(new Event('storage'));
      
      toast.success(`${isEditingExistingWorksheet ? 'Worksheet updated' : 'New worksheet created and assigned to ' + (machine?.name || 'machine')} successfully!`);
      
      // Switch to worksheets view to see the result
      setTimeout(() => {
        setViewMode('worksheets');
        // Clear worksheet editing state to prevent showing the form at the bottom
        setWorksheetDataSafe(null);
        setIsViewingWorksheet(false);
        setCustomWorksheetInfo({
          title: '',
          frequency: 'daily',
          machineId: '',
          modality: '',
          description: '',
          startDate: '',
          hasEndDate: false,
          endDate: ''
        });
        setCustomTests([
          { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '', calculatedFromDicom: false, dicomSeriesSource: '' }
        ]);
        setSelectedTemplate(null);
        setMatchedToTemplate(false);
        setTemplateJustLoadedFlag(false);
        setDicomSeriesConfig([]);
        setOtherModalitySpecification('');
      }, 500);
    } else {
      toast.error('Failed to create worksheet');
    }
  };

  const deleteCurrentWorksheet = () => {
    console.log('deleteCurrentWorksheet called');
    console.log('worksheetData:', worksheetData);
    console.log('customWorksheetInfo:', customWorksheetInfo);
    
    // Try to get the worksheet info from multiple sources
    const worksheetToDelete = worksheetData || customWorksheetInfo;
    const worksheetId = worksheetToDelete?.id;
    const machineId = worksheetToDelete?.machineId || worksheetToDelete?.specificMachine || 
                     (worksheetToDelete?.assignedMachines && worksheetToDelete.assignedMachines[0]);
    const worksheetTitle = worksheetToDelete?.title;
    
    console.log('worksheetToDelete:', worksheetToDelete);
    console.log('worksheetId:', worksheetId);
    console.log('machineId:', machineId);
    console.log('worksheetTitle:', worksheetTitle);
    
    if (!worksheetToDelete || !worksheetTitle) {
      toast.error('Unable to delete worksheet - worksheet data not found');
      return;
    }

    if (!worksheetId) {
      toast.error('Unable to delete worksheet - worksheet ID not found');
      return;
    }

    try {
      const worksheets = getWorksheets();
      const worksheet = worksheets.find(w => w.id === worksheetId);
      
      if (!worksheet) {
        toast.error('Worksheet not found in storage');
        return;
      }
      
      // Check if this worksheet is assigned to multiple machines
      const assignedMachines = worksheet.assignedMachines || [];
      
      if (assignedMachines.length > 1 && machineId) {
        // If assigned to multiple machines, just unassign from this machine
        const success = unassignWorksheetFromMachine(worksheetId, machineId);
        if (success) {
          toast.success(`Worksheet "${worksheetTitle}" removed from this machine`);
        } else {
          toast.error('Failed to remove worksheet from machine');
          return;
        }
      } else {
        // If only assigned to one machine (or no specific machine), delete the entire worksheet
        const updatedWorksheets = worksheets.filter(w => w.id !== worksheetId);
        localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
        toast.success(`Worksheet "${worksheetTitle}" deleted successfully`);
      }
      
      // Clear the current editing state
      setWorksheetDataSafe(null);
      setCustomWorksheetInfo({
        title: '',
        frequency: 'daily',
        machineId: '',
        modality: '',
        description: ''
      });
      setCustomTests([
        { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '', calculatedFromDicom: false, dicomSeriesSource: '' }
      ]);
      setDicomSeriesConfig([]);
      setDicomConfigEnabled(false);
      setSelectedTemplate(null);
      
      // Navigate back to worksheets view
      setViewMode('worksheets');
      setRefreshKey(prev => prev + 1); // Force refresh of worksheets list
      
    } catch (error) {
      console.error('Error deleting worksheet:', error);
      toast.error('Failed to delete worksheet');
    }
  };

  const addCustomTest = () => {
    const newTest = {
      id: Date.now() + Math.random(),
      testName: '',
      testType: 'value',
      tolerance: '',
      units: '',
      notes: '',
      calculatedFromDicom: false,
      dicomSeriesSource: ''
    };
    setCustomTests([...customTests, newTest]);
  };

  const removeCustomTest = (id) => {
    if (customTests.length > 1) {
      setCustomTests(customTests.filter(test => test.id !== id));
    }
  };

  const updateCustomTest = (id, field, value) => {
    setCustomTests(customTests.map(test => 
      test.id === id ? { ...test, [field]: value } : test
    ));
    // Clear the "just loaded" flag when user makes modifications
    setTemplateJustLoadedFlag(false);
  };

  const updateCustomWorksheetInfo = (field, value) => {
    setCustomWorksheetInfo(prev => ({ ...prev, [field]: value }));
    // Clear the "just loaded" flag when user makes modifications
    setTemplateJustLoadedFlag(false);
  };

  const getModalityIcon = (modality) => {
    const mod = modalities.find(m => m.value === modality);
    return mod ? mod.icon : '🔧';
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setWorksheetData(null);
    setSelectedTemplate(null);
    setSelectedMachine('');
    setSelectedFrequency('');
    setMatchedToTemplate(false);
    setRealTimeModifications([]);
    setHasRealTimeModifications(false);
    setOtherModalitySpecification('');
    setIsCreatingFromCopy(false);
    setTemplateJustLoadedFlag(false);
    setIsViewingWorksheet(false);
    
    // Clear URL params when switching modes
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('mode');
    newSearchParams.delete('machineId');
    newSearchParams.delete('frequency');
    newSearchParams.delete('templateId');
    newSearchParams.delete('viewOnly');
    navigate({ search: newSearchParams.toString() }, { replace: true });
  };


  const renderWorksheets = () => {
    return (
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
            
            {/* Admin Actions */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {getWorksheets().length} worksheet{getWorksheets().length !== 1 ? 's' : ''} total
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearAllWorksheets}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                  title="Delete all worksheets (keeps templates)"
                >
                  🗑️ Clear All Worksheets
                </button>
              </div>
            </div>
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
                
                // Skip this modality if no worksheets after filtering
                if (modalityWorksheets.length === 0) {
                  return null;
                }
                
                return (
                  <div key={modality.value} className="bg-gray-900/50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{modality.icon}</span>
                      <h3 className="text-xl font-semibold text-gray-100">{modality.label}</h3>
                      <span className="ml-auto text-sm text-gray-400">
                        {modalityWorksheets.length} worksheet{modalityWorksheets.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
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
                      
                      console.log(`${modality.value} ${frequency} worksheets:`, frequencyWorksheets.length);
                      
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
                          
                          <div className="space-y-2">
                            {frequencyWorksheets.map((worksheet) => (
                              <div key={worksheet.id} className={`bg-gray-900 rounded-md p-3 border-l-2 ${worksheet.hasEndDate && worksheet.endDate ? 'border-red-500' : 'border-blue-500'} hover:bg-gray-800 transition-colors`}>
                                <div className="flex items-center justify-between">
                                  {/* Left side - Main info */}
                                  <div className="flex-1 min-w-0">
                                    {/* Worksheet title on its own line */}
                                    <div className="mb-1">
                                      <h5 className="font-medium text-gray-100 text-sm flex items-center space-x-2">
                                        <span>{worksheet.title}</span>
                                        {worksheet.hasEndDate && worksheet.endDate && (
                                          <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded-full">
                                            Decommissioning
                                          </span>
                                        )}
                                      </h5>
                                    </div>
                                    
                                    {/* Machine, protocol, and modification status */}
                                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                                      {/* Machine assignment */}
                                      {worksheet.assignedMachines && worksheet.assignedMachines.length > 0 && (
                                        <span className="text-blue-300">
                                          📍 {worksheet.assignedMachines.map(machineId => {
                                            const machine = machines.find(m => m.machineId === machineId);
                                            return machine ? machine.name : machineId;
                                          }).join(', ')}
                                        </span>
                                      )}
                                      
                                      {/* Start Date */}
                                      {worksheet.startDate && (
                                        <span className="text-green-300">
                                          📅 Start: {new Date(worksheet.startDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      
                                      {/* End Date */}
                                      {worksheet.hasEndDate && worksheet.endDate && (
                                        <span className="text-red-300">
                                          🔚 End: {new Date(worksheet.endDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      
                                      {/* Protocol/Template source */}
                                      {(worksheet.templateSource || worksheet.sourceTemplateName) && (
                                        <span className="text-blue-300">
                                          📋 {worksheet.sourceTemplateName || worksheet.templateSource}
                                        </span>
                                      )}
                                      
                                      {/* Modified indicator */}
                                      {(() => {
                                        // Use comprehensive modification detection
                                        const isModified = isWorksheetModifiedFromTemplate(worksheet);
                                        
                                        if (isModified) {
                                          return (
                                            <span className="text-amber-300">
                                              🔧 Modified
                                            </span>
                                          );
                                        } else if (worksheet.templateSource || worksheet.sourceTemplateName) {
                                          return (
                                            <span className="text-green-300">
                                              ✓ Unmodified
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                  
                                  {/* Right side - Actions */}
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={() => editCustomWorksheet(worksheet)}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                    >
                                      ✏️ Edit
                                    </button>
                                    
                                    {/* View button */}
                                    {!worksheet.assignedMachines || worksheet.assignedMachines.length === 0 ? (
                                      <button
                                        onClick={() => viewCustomWorksheetReadOnly(worksheet)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                      >
                                        👁️ View
                                      </button>
                                    ) : worksheet.assignedMachines.length === 1 ? (
                                      <button
                                        onClick={() => viewCustomWorksheetReadOnly(worksheet, worksheet.assignedMachines[0])}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                      >
                                        👁️ View
                                      </button>
                                    ) : (
                                      <div className="relative group">
                                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                                          👁️ View ▼
                                        </button>
                                        <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 min-w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                          {worksheet.assignedMachines.map(machineId => {
                                            const machine = machines.find(m => m.machineId === machineId);
                                            return machine ? (
                                              <button
                                                key={machineId}
                                                onClick={() => viewCustomWorksheetReadOnly(worksheet, machineId)}
                                                className="block w-full text-left px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                                              >
                                                {machine.name}
                                              </button>
                                            ) : null;
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
          
          {/* No worksheets message */}
          {(() => {
            const allWorksheets = getWorksheets();
            const assignedWorksheets = allWorksheets.filter(w => w.assignedMachines && w.assignedMachines.length > 0);
            
            if (assignedWorksheets.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-medium text-gray-300 mb-2">No Worksheets Assigned</h3>
                  <p className="text-gray-400 mb-6">
                    Create templates and assign them to machines to see worksheets here.
                  </p>
                  <button
                    onClick={() => setViewMode('templates')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Manage Templates
                  </button>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {worksheetData && renderWorksheetContent()}
      </div>
    );
  };

  const renderWorksheetContent = () => {
    if (!worksheetData) return null;

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {worksheetData.title || 'QC Worksheet'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Force manual print by creating a new print call
                const printWindow = window.open('', '_blank');
                printWindow.document.write(document.documentElement.outerHTML);
                printWindow.document.close();
                printWindow.print();
                printWindow.close();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Print
            </button>
            {viewMode !== 'view-only' && (
              <button
                onClick={() => {
                  const machineId = worksheetData.machineId || (worksheetData.assignedMachines && worksheetData.assignedMachines[0]) || '';
                  
                  let dicomConfig = [];
                  if (machineId) {
                    dicomConfig = getMachineSpecificDicomConfig(machineId, worksheetData.modality, worksheetData.frequency);
                  }
                  
                  if (dicomConfig.length === 0) {
                    dicomConfig = worksheetData.dicomSeriesConfig || [];
                  }
                  
                  setDicomSeriesConfig(dicomConfig);
                  // Store original config for cancel functionality
                  setOriginalDicomConfigForCancel([...dicomConfig]);
                  setCustomWorksheetInfo({
                    title: worksheetData.title,
                    frequency: worksheetData.frequency,
                    machineId: machineId,
                    modality: worksheetData.modality,
                    description: worksheetData.description || ''
                  });
                  setViewMode('dicom-config');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit DICOM Config
              </button>
            )}
          </div>
        </div>

        {/* DICOM Series Selection */}
        {worksheetData && worksheetData.modality && (
          <DICOMSeriesSelector
            machineId={worksheetData.machine?.machineId || "WORKSHEET_VIEW"}
            frequency={worksheetData.frequency}
            modality={worksheetData.modality}
            selectedDate={new Date().toISOString().split('T')[0]}
            onSeriesSelection={(series) => {
              console.log('Worksheet view DICOM series selection:', series);
            }}
            viewOnly={worksheetData.viewOnly || false}
            templateData={(() => {
              const machineId = worksheetData.machineId || (worksheetData.assignedMachines && worksheetData.assignedMachines[0]);
              let dicomConfig = [];
              
              if (machineId) {
                dicomConfig = getMachineSpecificDicomConfig(machineId, worksheetData.modality, worksheetData.frequency);
              }
              
              if (dicomConfig.length === 0) {
                dicomConfig = worksheetData.dicomSeriesConfig || [];
              }
              
              return {
                ...worksheetData,
                dicomSeriesConfig: dicomConfig
              };
            })()}
          />
        )}

        {/* Worksheet Content */}
        <div className="bg-white rounded-lg p-6 text-black">
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
                {worksheetData.tests && worksheetData.tests.map((test, index) => {
                  const fieldMods = getFieldModifications(worksheetData, test, index);
                  
                  // Debug logging for view mode
                  if (index === 0) {
                    console.log('View mode debug:', {
                      worksheetData: worksheetData,
                      hasTemplateSource: !!(worksheetData.templateSource || worksheetData.sourceTemplateName),
                      firstTestMods: fieldMods
                    });
                  }
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-4 py-3 font-medium">
                        <div className="flex items-center space-x-1">
                          <span>
                            {test.testName}
                            {fieldMods.testName && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 ml-1 text-xs font-bold rounded border shadow-sm ${
                                fieldMods.isCustomTest 
                                  ? 'text-blue-700 bg-blue-100 border-blue-300' 
                                  : 'text-orange-700 bg-orange-100 border-orange-300'
                              }`} 
                                    title={fieldMods.isCustomTest ? "Custom test name" : "Modified test name"}>
                                🔧
                              </span>
                            )}
                          </span>
                          {test.units && (
                            <span className="text-sm text-gray-500 ml-1">
                              ({test.units}
                              {fieldMods.units && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 ml-1 text-xs font-bold rounded border ${
                                  fieldMods.isCustomTest 
                                    ? 'text-blue-700 bg-blue-100 border-blue-300' 
                                    : 'text-orange-700 bg-orange-100 border-orange-300'
                                }`} 
                                      title={fieldMods.isCustomTest ? "Custom units" : "Modified units"}>
                                  🔧
                                </span>
                              )}
                              )
                            </span>
                          )}
                        </div>
                      </td>
                    <td className="border border-gray-400 px-4 py-3">
                      {test.calculatedFromDicom ? (
                        <div>
                          <div className="flex items-center">
                            <span className="text-sm text-blue-600">📊 Calculated from DICOM</span>
                            {fieldMods.calculatedFromDicom && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 ml-1 text-xs font-bold rounded border ${
                                fieldMods.isCustomTest 
                                  ? 'text-blue-700 bg-blue-100 border-blue-300' 
                                  : 'text-orange-700 bg-orange-100 border-orange-300'
                              }`} 
                                    title={fieldMods.isCustomTest ? "Custom DICOM automation" : "Modified DICOM automation"}>
                                🔧
                              </span>
                            )}
                          </div>
                          {test.dicomSeriesSource && (
                            <div className="text-xs text-blue-500 mt-1 flex items-center">
                              <span>Source: {test.dicomSeriesSourceName || test.dicomSeriesSource}</span>
                              {fieldMods.dicomSeriesSource && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 ml-1 text-xs font-bold rounded border ${
                                  fieldMods.isCustomTest 
                                    ? 'text-blue-700 bg-blue-100 border-blue-300' 
                                    : 'text-orange-700 bg-orange-100 border-orange-300'
                                }`} 
                                      title={fieldMods.isCustomTest ? "Custom DICOM source" : "Modified DICOM source"}>
                                  🔧
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : test.testType === 'visual' ? (
                        <span className="text-sm text-gray-600">Visual Check</span>
                      ) : test.testType === 'passfail' ? (
                        <span className="text-sm text-gray-600">Pass/Fail Check</span>
                      ) : (
                        <div>
                          {test.tolerance && (
                            <div className="text-sm text-gray-600 flex items-center">
                              <span>Tolerance: ±{test.tolerance}{test.units && ` ${test.units}`}</span>
                              {fieldMods.tolerance && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 ml-1 text-xs font-bold rounded border ${
                                  fieldMods.isCustomTest 
                                    ? 'text-blue-700 bg-blue-100 border-blue-300' 
                                    : 'text-orange-700 bg-orange-100 border-orange-300'
                                }`} 
                                      title={fieldMods.isCustomTest ? "Custom tolerance" : "Modified tolerance"}>
                                  🔧
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-400 px-4 py-3">
                      <div className="border-b border-gray-400 h-8 w-full"></div>
                    </td>
                    <td className="border border-gray-400 px-4 py-3">
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
                    </td>
                    <td className="border border-gray-400 px-4 py-3">
                      <div className="border-b border-gray-400 h-8 w-full"></div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Overall Results */}
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

          {/* Comments and Actions */}
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

          {/* Signatures */}
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
        </div>
      </div>
    );
  };

  const renderCustomWorksheet = () => {
    // Check if we're editing an existing worksheet
    const isEditingExistingWorksheet = worksheetData && (worksheetData.templateSource || worksheetData.isEditing);
    
    console.log('renderCustomWorksheet - worksheetData:', worksheetData);
    console.log('renderCustomWorksheet - isEditingExistingWorksheet:', isEditingExistingWorksheet);
    
    return (
      <div key={`custom-${refreshKey}`} className="space-y-6">
        {/* Edit Mode Header */}
        {isEditingExistingWorksheet && (
          <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-orange-400 text-xl">✏️</span>
              <div>
                <h2 className="text-xl font-semibold text-orange-200">Editing Worksheet</h2>
                <p className="text-sm text-orange-300">
                  Modifying "{worksheetData.title}"
                  {worksheetData.templateSource && ` - based on ${worksheetData.templateSource}`}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Load Template Section - Hide when editing existing worksheet */}
        {!isEditingExistingWorksheet && getModalityTemplates().length > 0 && (
          <div className="bg-blue-900/20 border-2 border-blue-600 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-600 rounded-full p-2">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-200">Load from Template</h2>
                <p className="text-sm text-blue-300">Optional: Start with an existing template as a foundation</p>
              </div>
            </div>
            
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
                      
                      // Load DICOM configuration from template (separate from QC tests)
                      setDicomSeriesConfig(template.dicomSeriesConfig || []);
                      setDicomConfigEnabled(template.dicomSeriesConfig && template.dicomSeriesConfig.length > 0);
                      
                      // IMPORTANT: Set selectedTemplate for proper template tracking
                      setSelectedTemplate(template);
                      setTemplateJustLoaded(true); // Flag that template was just loaded
                      setMatchedToTemplate(true); // Auto-check the "matched to template" checkbox
                      setTemplateJustLoadedFlag(true); // Flag to prevent showing modifications initially
                      
                      // Clear real-time modifications since template was just loaded
                      setRealTimeModifications([]);
                      setHasRealTimeModifications(false);
                      
                      console.log('DEBUG: Template loaded via dropdown, selectedTemplate set:', template);
                      console.log('DEBUG: DICOM configuration loaded:', template.dicomSeriesConfig);
                      
                      const dicomCount = template.dicomSeriesConfig?.length || 0;
                      toast.success(`Template loaded with ${dicomCount} DICOM series configuration(s)!`);
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

        {/* Template Loaded Indication */}
        {selectedTemplate && (
          <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <h3 className="text-lg font-semibold text-green-200">Template Loaded</h3>
                  <p className="text-sm text-green-300">"{selectedTemplate.title}"</p>
                </div>
              </div>
              <div className="text-right text-sm text-green-300">
                <div>{selectedTemplate.modality} • {getFrequencyLabel(selectedTemplate.frequency)}</div>
                <div>{selectedTemplate.tests.length} tests loaded</div>
              </div>
            </div>
            
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
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <label htmlFor="matchedToTemplate" className="text-sm font-medium text-green-300">
                Track modifications from this template
              </label>
            </div>
          </div>
        )}

        {/* Visual Separator */}
        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-600"></div>
          <div className="px-4 text-gray-400 text-sm font-medium">
            {selectedTemplate ? 'Continue customizing your worksheet' : 'Create your worksheet'}
          </div>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

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
                disabled={isViewingWorksheet}
                className={`w-full px-3 py-2 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                  isViewingWorksheet ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Machine *
              </label>
              <select
                value={customWorksheetInfo.machineId}
                onChange={(e) => {
                  const machineId = e.target.value;
                  updateCustomWorksheetInfo('machineId', machineId);
                  
                  // Also set modality based on selected machine
                  if (machineId) {
                    const selectedMachine = machines.find(m => m.machineId === machineId);
                    if (selectedMachine) {
                      updateCustomWorksheetInfo('modality', selectedMachine.type);
                    }
                  } else {
                    updateCustomWorksheetInfo('modality', '');
                  }
                  
                  // Reset modifications when changing machines - this is creating a new worksheet
                  if (selectedTemplate && matchedToTemplate) {
                    setHasRealTimeModifications(false);
                    setRealTimeModifications([]);
                  }
                }}
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
            
            {/* Start Date Field */}
            {customWorksheetInfo.machineId && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  QC Start Date *
                </label>
                <input
                  type="date"
                  value={customWorksheetInfo.startDate}
                  onChange={(e) => updateCustomWorksheetInfo('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Specify when QC requirements start being due for this machine
                </p>
              </div>
            )}
            
            {/* End Date Field */}
            {customWorksheetInfo.machineId && (
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <input
                    type="checkbox"
                    id="hasEndDate"
                    checked={customWorksheetInfo.hasEndDate}
                    onChange={(e) => {
                      updateCustomWorksheetInfo('hasEndDate', e.target.checked);
                      if (!e.target.checked) {
                        updateCustomWorksheetInfo('endDate', '');
                      }
                    }}
                    className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <label htmlFor="hasEndDate" className="text-sm font-medium text-gray-300">
                    Set QC End Date (for machine decommissioning)
                  </label>
                </div>
                
                {customWorksheetInfo.hasEndDate && (
                  <div>
                    <input
                      type="date"
                      value={customWorksheetInfo.endDate}
                      onChange={(e) => updateCustomWorksheetInfo('endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500"
                      min={customWorksheetInfo.startDate}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      QC requirements will stop being due after this date (machine decommissioned)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Frequency Category
              </label>
              <select
                value={customWorksheetInfo.frequency}
                onChange={(e) => updateCustomWorksheetInfo('frequency', e.target.value)}
                disabled={isViewingWorksheet}
                className={`w-full px-3 py-2 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                  isViewingWorksheet ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700'
                }`}
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

        {/* DICOM Configuration for Worksheets */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-100">DICOM Configuration</h2>
            <div className="flex space-x-2">
              {selectedTemplate && selectedTemplate.dicomSeriesConfig && selectedTemplate.dicomSeriesConfig.length > 0 && (
                <button
                  onClick={() => {
                    setDicomSeriesConfig(selectedTemplate.dicomSeriesConfig);
                    toast.success('DICOM configuration reset to template defaults');
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  🔄 Reset to Template
                </button>
              )}
              <button
                onClick={() => setViewMode('dicom-config')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                🔧 Configure DICOM
              </button>
            </div>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-4">
            <h4 className="text-blue-300 font-medium mb-2 flex items-center">
              <span className="mr-2">ℹ️</span>
              Separate DICOM Configuration
            </h4>
            <p className="text-blue-200 text-sm">
              DICOM configuration is tracked separately from QC tests and can be customized per machine. 
              {selectedTemplate && selectedTemplate.dicomSeriesConfig && selectedTemplate.dicomSeriesConfig.length > 0 ? (
                <>Template DICOM settings have been loaded as a starting point, but you can edit them independently.</>
              ) : (
                <>Configure DICOM series identification to enable automated image selection during QC performance.</>
              )}
            </p>
          </div>
          
          {dicomSeriesConfig.length > 0 ? (
            <div className="space-y-3">
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-300 text-sm">
                    <span className="mr-2">✅</span>
                    <span>
                      {dicomSeriesConfig.length} DICOM series configured for automated identification
                    </span>
                  </div>
                  {selectedTemplate && selectedTemplate.dicomSeriesConfig && selectedTemplate.dicomSeriesConfig.length > 0 && (
                    <div className="flex items-center text-blue-300 text-xs">
                      <span className="mr-1">📋</span>
                      <span>From Template</span>
                    </div>
                  )}
                </div>
              </div>
              
              {dicomSeriesConfig.map((series, index) => (
                <div key={series.id || index} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-gray-100 font-medium">
                        {series.name || `Series Configuration ${index + 1}`}
                      </span>
                      <span className="ml-2 text-gray-400 text-xs">
                        (Customizable per machine)
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      series.priority === 'required' ? 'bg-red-900 text-red-200' :
                      series.priority === 'recommended' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {series.priority || 'optional'}
                    </span>
                  </div>
                  
                  
                  {series.dicomCriteria && series.dicomCriteria.customTags && series.dicomCriteria.customTags.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {series.dicomCriteria.customTags.length} identification criteria configured
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🔧</div>
              <h3 className="text-lg font-medium text-gray-100 mb-2">No DICOM Configuration</h3>
              <p className="text-gray-300 text-sm mb-4">
                Configure DICOM series identification to enable automated image selection during QC performance.
              </p>
              <button
                onClick={() => setViewMode('dicom-config')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                🔧 Configure DICOM Series
              </button>
            </div>
          )}
        </div>

        {/* QC Tests Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-100">QC Tests</h2>
            {!isViewingWorksheet && (
              <button
                onClick={addCustomTest}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add Test</span>
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {customTests.map(test => {
              const testIndex = customTests.indexOf(test);
              const fieldMods = worksheetData 
                ? getFieldModifications(worksheetData, test, testIndex)
                : templateJustLoadedFlag
                  ? {
                      // When template is just loaded, show no modifications
                      testName: false, testType: false, tolerance: false, units: false, notes: false, 
                      calculatedFromDicom: false, dicomSeriesSource: false, isCustomTest: false
                    }
                  : selectedTemplate && matchedToTemplate
                    ? getFieldModifications({ 
                        templateSource: selectedTemplate.title,
                        sourceTemplateName: selectedTemplate.title,
                        templateId: selectedTemplate.id,
                        sourceTemplateId: selectedTemplate.id,
                        tests: selectedTemplate.tests // Compare against original template tests, not current customTests
                      }, test, testIndex)
                    : selectedTemplate && !matchedToTemplate
                      ? {
                          // When template is selected but tracking is disabled, show no modifications
                          testName: false, testType: false, tolerance: false, units: false, notes: false, 
                          calculatedFromDicom: false, dicomSeriesSource: false, isCustomTest: false
                        }
                      : {
                          // Only for completely custom worksheets with no template base
                          testName: true, testType: true, tolerance: true, units: true, notes: true, 
                          calculatedFromDicom: true, dicomSeriesSource: true, isCustomTest: true
                        };
              return (
                <div key={test.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 font-medium">Test {testIndex + 1}</span>
                  {customTests.length > 1 && !isViewingWorksheet && (
                    <button
                      onClick={() => removeCustomTest(test.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <span>Test Name *</span>
                      {fieldMods.testName && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 ml-2 text-xs font-bold rounded border ${
                          fieldMods.isCustomTest 
                            ? 'text-blue-700 bg-blue-100 border-blue-300' 
                            : 'text-orange-700 bg-orange-100 border-orange-300'
                        }`} 
                              title={fieldMods.isCustomTest ? "Custom test name" : "Modified test name"}>
                          🔧
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={test.testName}
                      onChange={(e) => updateCustomTest(test.id, 'testName', e.target.value)}
                      placeholder="e.g., Signal-to-Noise Ratio"
                      disabled={isViewingWorksheet}
                      className={`w-full px-3 py-2 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                        isViewingWorksheet ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-600'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <span>Test Type</span>
                      {fieldMods.testType && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 ml-2 text-xs font-bold rounded border ${
                          fieldMods.isCustomTest 
                            ? 'text-blue-700 bg-blue-100 border-blue-300' 
                            : 'text-orange-700 bg-orange-100 border-orange-300'
                        }`} 
                              title={fieldMods.isCustomTest ? "Custom test type" : "Modified test type"}>
                          🔧
                        </span>
                      )}
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
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <span>Tolerance/Range</span>
                      {fieldMods.tolerance && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 ml-2 text-xs font-bold rounded border ${
                          fieldMods.isCustomTest 
                            ? 'text-blue-700 bg-blue-100 border-blue-300' 
                            : 'text-orange-700 bg-orange-100 border-orange-300'
                        }`} 
                              title={fieldMods.isCustomTest ? "Custom tolerance" : "Modified tolerance"}>
                          🔧
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={test.tolerance}
                      onChange={(e) => updateCustomTest(test.id, 'tolerance', e.target.value)}
                      placeholder="e.g., ±5%, >100, 0-10"
                      disabled={isViewingWorksheet}
                      className={`w-full px-3 py-2 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                        isViewingWorksheet ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-600'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <span>Units</span>
                      {fieldMods.units && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 ml-2 text-xs font-bold rounded border ${
                          fieldMods.isCustomTest 
                            ? 'text-blue-700 bg-blue-100 border-blue-300' 
                            : 'text-orange-700 bg-orange-100 border-orange-300'
                        }`} 
                              title={fieldMods.isCustomTest ? "Custom units" : "Modified units"}>
                          🔧
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={test.units}
                      onChange={(e) => updateCustomTest(test.id, 'units', e.target.value)}
                      placeholder="e.g., mm, %, dB, HU"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <span>Notes/Instructions</span>
                      {fieldMods.notes && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 ml-2 text-xs font-bold rounded border ${
                          fieldMods.isCustomTest 
                            ? 'text-blue-700 bg-blue-100 border-blue-300' 
                            : 'text-orange-700 bg-orange-100 border-orange-300'
                        }`} 
                              title={fieldMods.isCustomTest ? "Custom notes" : "Modified notes"}>
                          🔧
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={test.notes}
                      onChange={(e) => updateCustomTest(test.id, 'notes', e.target.value)}
                      placeholder="Optional test instructions or notes"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <span>Automation</span>
                      {fieldMods.calculatedFromDicom && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 ml-2 text-xs font-bold rounded border ${
                          fieldMods.isCustomTest 
                            ? 'text-blue-700 bg-blue-100 border-blue-300' 
                            : 'text-orange-700 bg-orange-100 border-orange-300'
                        }`} 
                              title={fieldMods.isCustomTest ? "Custom automation" : "Modified automation"}>
                          🔧
                        </span>
                      )}
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`calculated-${test.id}`}
                          checked={test.calculatedFromDicom || false}
                          onChange={(e) => updateCustomTest(test.id, 'calculatedFromDicom', e.target.checked)}
                          disabled={isViewingWorksheet}
                          className={`w-4 h-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2 ${
                            isViewingWorksheet ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-600'
                          }`}
                        />
                        <label htmlFor={`calculated-${test.id}`} className="text-sm text-blue-300">
                          📊 Calculate from DICOM data
                        </label>
                      </div>
                      
                      {test.calculatedFromDicom && (
                        <div className="ml-6 space-y-2">
                          <label className="block text-xs font-medium text-gray-400 flex items-center">
                            <span>Source DICOM Series *</span>
                            {fieldMods.dicomSeriesSource && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 ml-2 text-xs font-bold rounded border ${
                                fieldMods.isCustomTest 
                                  ? 'text-blue-700 bg-blue-100 border-blue-300' 
                                  : 'text-orange-700 bg-orange-100 border-orange-300'
                              }`} 
                                    title={fieldMods.isCustomTest ? "Custom DICOM source" : "Modified DICOM source"}>
                                🔧
                              </span>
                            )}
                          </label>
                          <select
                            value={test.dicomSeriesSource || ''}
                            onChange={(e) => updateCustomTest(test.id, 'dicomSeriesSource', e.target.value)}
                            className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-gray-100 focus:ring-2 text-sm ${
                              test.calculatedFromDicom && !test.dicomSeriesSource 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-500 focus:ring-blue-500'
                            }`}
                          >
                            <option value="">
                              {dicomSeriesConfig.filter(config => config.enabled !== false).length > 0 
                                ? 'Select DICOM series...' 
                                : 'No DICOM series configured'}
                            </option>
                            {dicomSeriesConfig.filter(config => config.enabled !== false).map((series, index) => (
                              <option key={series.id || index} value={series.id || `series-${index}`}>
                                {series.name || `Series Configuration ${index + 1}`}
                              </option>
                            ))}
                          </select>
                          <p className={`text-xs mt-1 ${
                            test.calculatedFromDicom && !test.dicomSeriesSource 
                              ? 'text-red-400' 
                              : 'text-gray-500'
                          }`}>
                            {test.calculatedFromDicom && !test.dicomSeriesSource 
                              ? '⚠️ Required: Select which DICOM series will be used to calculate this test value'
                              : 'Select which DICOM series will be used to calculate this test value'
                            }
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400">
                        When checked, this test value will be automatically calculated from DICOM images
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Delete Section - Only show when editing existing worksheet */}
          {isEditingExistingWorksheet && (
            <div className="mt-6 mb-4">
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-red-400 text-xl">⚠️</span>
                  <div>
                    <h3 className="text-red-200 font-medium">Danger Zone</h3>
                    <p className="text-red-300 text-sm">
                      Deleting this worksheet will remove it from all assigned machines. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${worksheetData.title}"? This will remove the worksheet from the assigned machine(s). This action cannot be undone.`)) {
                      deleteCurrentWorksheet();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Delete Worksheet</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="mt-6 flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (!isViewingWorksheet) {
                    const hasChanges = customWorksheetInfo.title || customWorksheetInfo.description || 
                                     customTests.some(test => test.testName) || 
                                     dicomSeriesConfig.length > 0;
                    
                    if (hasChanges && !window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                      return;
                    }
                  }
                  
                  setViewMode('worksheets');
                  setWorksheetDataSafe(null);
                  resetTemplateForm();
                }}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-500 transition-colors flex items-center space-x-2"
              >
                <span>←</span>
                <span>{isViewingWorksheet ? 'Back' : 'Cancel'}</span>
              </button>
              
              {!isViewingWorksheet && (
                <button
                  onClick={saveAsTemplate}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>Save as Template</span>
                </button>
              )}
            </div>
            
            {!isViewingWorksheet && (
              <button
                onClick={createWorksheet}
                disabled={!customWorksheetInfo.title || !customWorksheetInfo.machineId || !customWorksheetInfo.startDate || (customWorksheetInfo.hasEndDate && !customWorksheetInfo.endDate) || customTests.some(test => !test.testName || (test.calculatedFromDicom && !test.dicomSeriesSource))}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>📝</span>
                <span>{isEditingExistingWorksheet ? 'Update Worksheet' : 'Assign Worksheet to Machine'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDicomConfig = () => {
    const handleSaveDicomConfig = () => {
      const machineId = customWorksheetInfo.machineId;
      const modality = customWorksheetInfo.modality;
      const frequency = customWorksheetInfo.frequency;
      
      if (machineId && modality && frequency) {
        const success = saveMachineSpecificDicomConfig(machineId, modality, frequency, dicomSeriesConfig);
        if (success) {
          toast.success('DICOM configuration saved successfully');
          setViewMode('custom'); // Return to worksheet editing
          // Update the original config since we saved successfully
          setOriginalDicomConfigForCancel([...dicomSeriesConfig]);
        } else {
          toast.error('Failed to save DICOM configuration');
        }
      } else {
        toast.error('Missing machine, modality, or frequency information');
      }
    };
    
    const handleCancelDicomConfig = () => {
      // Restore original config
      setDicomSeriesConfig([...originalDicomConfigForCancel]);
      setViewMode('custom'); // Return to worksheet editing
      toast.info('DICOM configuration changes cancelled');
    };
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">DICOM Configuration</h2>
              <p className="text-sm text-gray-400 mt-1">
                Configure DICOM series identification for {customWorksheetInfo.machineId} - {customWorksheetInfo.modality} {customWorksheetInfo.frequency}
              </p>
            </div>
          </div>

          <DICOMTemplateConfig
            modality={customWorksheetInfo.modality}
            frequency={customWorksheetInfo.frequency}
            onSeriesConfigChange={(config) => {
              setDicomSeriesConfig(config);
            }}
            initialConfig={dicomSeriesConfig}
          />
          
          {/* Action buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleCancelDicomConfig}
              className="px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-500 transition-colors flex items-center space-x-2"
            >
              <span>←</span>
              <span>Cancel Changes</span>
            </button>
            
            <button
              onClick={handleSaveDicomConfig}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>💾</span>
              <span>Save DICOM Configuration</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-lg text-red-400 mb-4">Error loading machines</div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
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

      {/* Render content based on view mode */}
      {viewMode === 'worksheets' && renderWorksheets()}
      {viewMode === 'custom' && renderCustomWorksheet()}
      {viewMode === 'view-only' && renderWorksheetContent()}
      {viewMode === 'dicom-config' && renderDicomConfig()}
      {viewMode === 'templates' && (
        <div className="space-y-6">
          
          {/* Generate New Template Widget */}
          {!worksheetData && !isCreatingTemplate && (
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Generate New Template</h2>
              
              {/* Create new template from scratch */}
              <div className="pb-2">
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
              
              {/* Create from existing template */}
              <div className="pt-2 border-t border-gray-600">
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
                            description: template.description || '',
                            startDate: '',
                            hasEndDate: false,
                            endDate: ''
                          });
                          setCustomTests(template.tests.map(test => ({ ...test, id: Date.now() + Math.random() })));
                          setDicomSeriesConfig(template.dicomSeriesConfig || []); // Load DICOM configuration
                          setDicomConfigEnabled(template.dicomSeriesConfig && template.dicomSeriesConfig.length > 0);
                          setIsCreatingTemplate(true);
                          setIsCreatingFromCopy(true);
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
                      <div className="space-y-2">
                        {group.templates.map(template => (
                          <div key={template.id} className="bg-gray-700 rounded-md p-3 border-l-2 border-green-500 hover:bg-gray-600 transition-colors">
                            <div className="flex items-center justify-between">
                              {/* Left side - Main info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3">
                                  <h5 className="font-medium text-gray-100 text-sm truncate">
                                    {template.title}
                                  </h5>
                                  
                                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 bg-green-900/50 text-green-300">
                                    📋 Template
                                  </span>
                                </div>
                                
                                {/* Template metadata */}
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                                  <span>{template.modality}</span>
                                  <span>•</span>
                                  <span>{getFrequencyLabel(template.frequency)}</span>
                                  <span>•</span>
                                  <span>{template.tests.length} tests</span>
                                  <span>•</span>
                                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              {/* Right side - Actions */}
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => createWorksheetFromTemplate(template)}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                >
                                  📋 Assign
                                </button>
                                <button
                                  onClick={() => loadTemplateForEditing(template)}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${template.title}"?`)) {
                                      deleteModalityTemplate(template.id);
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
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

          {/* Template Creator/Editor */}
          {!worksheetData && isCreatingTemplate && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-100">
                  {selectedTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button
                  onClick={() => {
                    const hasChanges = customWorksheetInfo.title || customWorksheetInfo.description || 
                                     customTests.some(test => test.testName) || 
                                     dicomSeriesConfig.length > 0;
                    
                    if (hasChanges && !window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                      return;
                    }
                    
                    setIsCreatingTemplate(false);
                    setSelectedTemplate(null);
                    resetTemplateForm();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                >
                  ← Cancel
                </button>
              </div>

              <div className="space-y-6">
                {/* Template Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Template Title</label>
                    <input
                      type="text"
                      value={customWorksheetInfo.title}
                      onChange={(e) => updateCustomWorksheetInfo('title', e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                      placeholder="Enter template title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Modality</label>
                    <select
                      value={customWorksheetInfo.modality}
                      onChange={(e) => updateCustomWorksheetInfo('modality', e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="">Select modality</option>
                      {modalities.map(mod => (
                        <option key={mod.value} value={mod.value}>
                          {mod.icon} {mod.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {customWorksheetInfo.modality === 'Other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Other Modality Type</label>
                      <select
                        value={otherModalitySpecification}
                        onChange={(e) => setOtherModalitySpecification(e.target.value)}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                      >
                        <option value="">Select type</option>
                        {otherModalityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                    <select
                      value={customWorksheetInfo.frequency}
                      onChange={(e) => updateCustomWorksheetInfo('frequency', e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      {frequencies.map(freq => (
                        <option key={freq.value} value={freq.value}>
                          {freq.icon} {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <input
                      type="text"
                      value={customWorksheetInfo.description}
                      onChange={(e) => updateCustomWorksheetInfo('description', e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                      placeholder="Template description"
                    />
                  </div>
                </div>

                {/* DICOM Configuration */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="enable-dicom-config"
                      checked={dicomConfigEnabled}
                      onChange={(e) => {
                        setDicomConfigEnabled(e.target.checked);
                        if (!e.target.checked) {
                          setDicomSeriesConfig([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="enable-dicom-config" className="text-lg font-semibold text-gray-100">
                      DICOM Configuration
                    </label>
                  </div>
                  
                  {dicomConfigEnabled ? (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <DICOMTemplateConfig
                        modality={customWorksheetInfo.modality}
                        frequency={customWorksheetInfo.frequency}
                        onSeriesConfigChange={(config) => {
                          setDicomSeriesConfig(config);
                        }}
                        initialConfig={dicomSeriesConfig}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">
                        Enable DICOM configuration to automatically identify and analyze DICOM images during QC performance.
                      </p>
                    </div>
                  )}
                </div>

                {/* Tests Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-100">QC Tests</h3>
                    <button
                      onClick={addCustomTest}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      ➕ Add Test
                    </button>
                  </div>

                  <div className="space-y-4">
                    {customTests.map((test, index) => (
                      <div key={test.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-200">Test {index + 1}</h4>
                          {customTests.length > 1 && (
                            <button
                              onClick={() => removeCustomTest(test.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Test Name</label>
                            <input
                              type="text"
                              value={test.testName}
                              onChange={(e) => updateCustomTest(test.id, 'testName', e.target.value)}
                              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                              placeholder="Enter test name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Test Type</label>
                            <select
                              value={test.testType}
                              onChange={(e) => updateCustomTest(test.id, 'testType', e.target.value)}
                              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                            >
                              <option value="value">Value</option>
                              <option value="passfail">Pass/Fail</option>
                              <option value="visual">Visual Check</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tolerance</label>
                            <input
                              type="text"
                              value={test.tolerance}
                              onChange={(e) => updateCustomTest(test.id, 'tolerance', e.target.value)}
                              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                              placeholder="e.g. ±5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Units</label>
                            <input
                              type="text"
                              value={test.units}
                              onChange={(e) => updateCustomTest(test.id, 'units', e.target.value)}
                              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                              placeholder="e.g. HU, mm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                            <input
                              type="text"
                              value={test.notes}
                              onChange={(e) => updateCustomTest(test.id, 'notes', e.target.value)}
                              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                              placeholder="Additional notes or instructions"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Automation</label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`template-calculated-${test.id}`}
                                  checked={test.calculatedFromDicom || false}
                                  onChange={(e) => updateCustomTest(test.id, 'calculatedFromDicom', e.target.checked)}
                                  className="w-3 h-3 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor={`template-calculated-${test.id}`} className="text-xs text-blue-300">
                                  📊 Calculate from DICOM
                                </label>
                              </div>
                              
                              {test.calculatedFromDicom && (
                                <div className="ml-5">
                                  <select
                                    value={test.dicomSeriesSource || ''}
                                    onChange={(e) => updateCustomTest(test.id, 'dicomSeriesSource', e.target.value)}
                                    className={`w-full p-1 bg-gray-600 border rounded text-white text-xs ${
                                      test.calculatedFromDicom && !test.dicomSeriesSource 
                                        ? 'border-red-500' 
                                        : 'border-gray-500'
                                    }`}
                                  >
                                    <option value="">
                                      {dicomSeriesConfig.filter(config => config.enabled !== false).length > 0 
                                        ? 'Select DICOM series...' 
                                        : 'No DICOM series configured'}
                                    </option>
                                    {dicomSeriesConfig.filter(config => config.enabled !== false).map((series, index) => (
                                      <option key={series.id || index} value={series.id || `series-${index}`}>
                                        {series.name || `Series ${index + 1}`}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Template */}
                <div className="flex space-x-4">
                  <button
                    onClick={saveAsTemplate}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    💾 {selectedTemplate && !isCreatingFromCopy ? 'Update Template' : 'Save Template'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingTemplate(false);
                      setSelectedTemplate(null);
                      resetTemplateForm();
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Worksheets;