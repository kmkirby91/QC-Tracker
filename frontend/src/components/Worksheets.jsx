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

  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'worksheets', 'custom', 'templates', 'view-only', 'dicom-config'
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
  const [overviewFilterLocation, setOverviewFilterLocation] = useState('');
  const [overviewFilterModality, setOverviewFilterModality] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({});
  const [realTimeModifications, setRealTimeModifications] = useState([]);
  const [hasRealTimeModifications, setHasRealTimeModifications] = useState(false);
  const [matchedToTemplate, setMatchedToTemplate] = useState(false);
  const [dicomSeriesConfig, setDicomSeriesConfig] = useState([]);

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

  const getWorksheets = () => {
    try {
      const stored = localStorage.getItem('qcWorksheets');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading worksheets:', error);
      return [];
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

  const frequencies = [
    { value: 'daily', label: 'Daily QC', icon: '📅' },
    { value: 'weekly', label: 'Weekly QC', icon: '📆' },
    { value: 'monthly', label: 'Monthly QC', icon: '📊' },
    { value: 'annual', label: 'Annual QC', icon: '🗓️' }
  ];

  const modalities = [
    { value: 'CT', label: 'CT', icon: '🏥' },
    { value: 'MRI', label: 'MRI', icon: '🧲' },
    { value: 'X-Ray', label: 'X-Ray', icon: '📸' },
    { value: 'Ultrasound', label: 'Ultrasound', icon: '🔊' },
    { value: 'Nuclear Medicine', label: 'Nuclear Medicine', icon: '☢️' },
    { value: 'Mammography', label: 'Mammography', icon: '🎗️' },
    { value: 'PET-CT', label: 'PET-CT', icon: '🔬' }
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

    const savedTemplates = getModalityTemplates();
    
    const templateData = {
      id: selectedTemplate ? selectedTemplate.id : Date.now(),
      title: customWorksheetInfo.title,
      modality: customWorksheetInfo.modality,
      frequency: customWorksheetInfo.frequency,
      description: customWorksheetInfo.description,
      tests: customTests.filter(test => test.testName.trim()),
      dicomSeriesConfig: dicomSeriesConfig || [],
      createdAt: selectedTemplate ? selectedTemplate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (selectedTemplate) {
      // Update existing template
      const index = savedTemplates.findIndex(t => t.id === selectedTemplate.id);
      if (index !== -1) {
        savedTemplates[index] = templateData;
      } else {
        savedTemplates.push(templateData);
      }
    } else {
      // Add new template
      savedTemplates.push(templateData);
    }

    localStorage.setItem('qcModalityTemplates', JSON.stringify(savedTemplates));
    
    toast.success(selectedTemplate ? 
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
    
    // Load DICOM series configuration if it exists
    if (template.dicomSeriesConfig && template.dicomSeriesConfig.length > 0) {
      setDicomSeriesConfig(template.dicomSeriesConfig);
      toast.success(`Template loaded with ${template.dicomSeriesConfig.length} DICOM series configuration(s)!`);
    } else {
      setDicomSeriesConfig([]);
      toast.success('Template loaded for editing!');
    }
  };

  const deleteModalityTemplate = (templateId) => {
    const savedTemplates = getModalityTemplates();
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
    localStorage.setItem('qcModalityTemplates', JSON.stringify(updatedTemplates));
    toast.success('Template deleted successfully!');
  };

  const createWorksheetFromTemplate = (template) => {
    console.log('Creating worksheet from template:', template.title);
    
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
    setTemplateJustLoaded(true);
    
    // Load DICOM series configuration if it exists
    if (template.dicomSeriesConfig && template.dicomSeriesConfig.length > 0) {
      setDicomSeriesConfig(template.dicomSeriesConfig);
    } else {
      setDicomSeriesConfig([]);
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
      description: ''
    });
    setCustomTests([
      { id: 1, testName: '', testType: 'value', tolerance: '', units: '', notes: '' }
    ]);
    setSelectedTemplate(null);
    setSelectedTemplateForGeneration('');
    setIsCreatingTemplate(false);
    setTemplateJustLoaded(false);
    setDicomSeriesConfig([]);
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

    if (customTests.some(test => !test.testName.trim())) {
      toast.error('Please provide names for all tests');
      return;
    }

    const machine = machines.find(m => m.machineId === customWorksheetInfo.machineId);
    
    // Create unique worksheet for this specific machine
    const uniqueWorksheetData = {
      ...customWorksheetInfo,
      title: `${customWorksheetInfo.title} - ${machine?.name || customWorksheetInfo.machineId}`,
      tests: [...customTests],
      id: `${Date.now()}-${customWorksheetInfo.machineId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isModified: (selectedTemplate && matchedToTemplate) ? true : false,
      sourceTemplateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null,
      sourceTemplateName: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
      templateSource: (selectedTemplate && matchedToTemplate) ? selectedTemplate.title : null,
      templateId: (selectedTemplate && matchedToTemplate) ? selectedTemplate.id : null,
      isWorksheet: true,
      assignedMachines: [customWorksheetInfo.machineId],
      specificMachine: customWorksheetInfo.machineId,
      dicomSeriesConfig: dicomSeriesConfig
    };

    console.log('Creating worksheet:', uniqueWorksheetData);

    const savedWorksheet = saveWorksheet(uniqueWorksheetData);
    
    if (savedWorksheet) {
      setRefreshKey(prev => prev + 1);
      window.dispatchEvent(new Event('storage'));
      
      toast.success(`New worksheet created and assigned to ${machine?.name || 'machine'} successfully!`);
      
      // Switch to worksheets view to see the result
      setTimeout(() => {
        setViewMode('worksheets');
      }, 500);
    } else {
      toast.error('Failed to create worksheet');
    }
  };

  const addCustomTest = () => {
    const newTest = {
      id: Date.now() + Math.random(),
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
      setCustomTests(customTests.filter(test => test.id !== id));
    }
  };

  const updateCustomTest = (id, field, value) => {
    setCustomTests(customTests.map(test => 
      test.id === id ? { ...test, [field]: value } : test
    ));
  };

  const updateCustomWorksheetInfo = (field, value) => {
    setCustomWorksheetInfo(prev => ({ ...prev, [field]: value }));
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
    
    // Clear URL params when switching modes
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('mode');
    newSearchParams.delete('machineId');
    newSearchParams.delete('frequency');
    newSearchParams.delete('templateId');
    newSearchParams.delete('viewOnly');
    navigate({ search: newSearchParams.toString() }, { replace: true });
  };

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Available Worksheets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frequencies.map(freq => (
              <div key={freq.value} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{freq.icon}</span>
                  <h3 className="text-lg font-medium text-white">{freq.label}</h3>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  {freq.value === 'daily' ? 'Daily quality control tests' :
                   freq.value === 'weekly' ? 'Weekly quality control tests' :
                   freq.value === 'monthly' ? 'Monthly quality control tests' :
                   'Annual quality control tests'}
                </p>
                <button
                  onClick={() => {
                    setViewMode('worksheets');
                    setSelectedFrequency(freq.value);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Generate Worksheet
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
                        <div key={frequency} className="mb-6 bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <span className="text-lg mr-2">{getFrequencyIcon(frequency)}</span>
                            <h4 className="text-lg font-medium text-gray-200">{getFrequencyLabel(frequency)}</h4>
                            <span className="ml-auto text-xs text-gray-400">
                              {frequencyWorksheets.length} worksheet{frequencyWorksheets.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {frequencyWorksheets.map(worksheet => {
                              const assignedMachineNames = worksheet.assignedMachines
                                ?.map(machineId => machines.find(m => m.machineId === machineId)?.name || machineId)
                                .join(', ') || 'No machines assigned';
                              
                              return (
                                <div key={worksheet.id} className="bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <h5 className="text-gray-100 font-medium">{worksheet.title}</h5>
                                        
                                        {/* Template tracking indicator */}
                                        {worksheet.sourceTemplateName && (
                                          <div className="flex items-center text-blue-300 text-xs">
                                            <span className="mr-1">📋</span>
                                            <span>{worksheet.sourceTemplateName}</span>
                                            {worksheet.isModified && (
                                              <span className="ml-1 text-yellow-300">*</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="text-sm text-gray-400 space-y-1">
                                        <div>Assigned to: {assignedMachineNames}</div>
                                        <div>Tests: {worksheet.tests?.length || 0}</div>
                                        {worksheet.description && (
                                          <div>Description: {worksheet.description}</div>
                                        )}
                                        <div className="text-xs text-gray-500">
                                          Created: {new Date(worksheet.createdAt || Date.now()).toLocaleDateString()}
                                          {worksheet.updatedAt && worksheet.updatedAt !== worksheet.createdAt && (
                                            <span> • Updated: {new Date(worksheet.updatedAt).toLocaleDateString()}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 ml-4">
                                      <button
                                        onClick={() => {
                                          const machineId = worksheet.assignedMachines?.[0];
                                          if (machineId) {
                                            setWorksheetDataSafe({
                                              ...worksheet,
                                              viewOnly: true,
                                              machine: machines.find(m => m.machineId === machineId)
                                            });
                                          }
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                      >
                                        👁️ View
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          const machineId = worksheet.assignedMachines?.[0];
                                          if (machineId) {
                                            generateWorksheet(machineId, worksheet.frequency);
                                          }
                                        }}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                      >
                                        📝 Generate
                                      </button>
                                      
                                      <button
                                        onClick={() => deleteWorksheet(worksheet.id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
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
              onClick={() => window.print()}
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
            templateData={worksheetData.viewOnly ? (() => {
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
            })() : null}
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
                {worksheetData.tests && worksheetData.tests.map((test, index) => (
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
                ))}
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
    return (
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
                      
                      // Load DICOM configuration from template (separate from QC tests)
                      setDicomSeriesConfig(template.dicomSeriesConfig || []);
                      
                      // IMPORTANT: Set selectedTemplate for proper template tracking
                      setSelectedTemplate(template);
                      setTemplateJustLoaded(true); // Flag that template was just loaded
                      setMatchedToTemplate(true); // Auto-check the "matched to template" checkbox
                      
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
                  
                  {series.requiredFor && series.requiredFor.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {series.requiredFor.map((test, testIndex) => (
                        <span
                          key={testIndex}
                          className="px-2 py-1 text-xs bg-green-900/30 border border-green-600 text-green-200 rounded"
                        >
                          {test}
                        </span>
                      ))}
                    </div>
                  )}
                  
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
            <button
              onClick={addCustomTest}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Add Test</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {customTests.map(test => (
              <div key={test.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 font-medium">Test {customTests.indexOf(test) + 1}</span>
                  {customTests.length > 1 && (
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
              <span>Save as Template</span>
            </button>
            <button
              onClick={createWorksheet}
              disabled={!customWorksheetInfo.title || !customWorksheetInfo.machineId || customTests.some(test => !test.testName)}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>📝</span>
              <span>Create Worksheet</span>
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
    );
  };

  const renderDicomConfig = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">DICOM Configuration</h2>
            <button
              onClick={() => setViewMode('worksheets')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Worksheets
            </button>
          </div>

          <DICOMTemplateConfig
            templateData={{
              ...customWorksheetInfo,
              dicomSeriesConfig: dicomSeriesConfig
            }}
            onConfigChange={(config) => {
              setDicomSeriesConfig(config);
            }}
            onSave={(updatedTemplate) => {
              const machineId = customWorksheetInfo.machineId;
              const modality = customWorksheetInfo.modality;
              const frequency = customWorksheetInfo.frequency;
              
              if (machineId && modality && frequency) {
                const success = saveMachineSpecificDicomConfig(machineId, modality, frequency, updatedTemplate.dicomSeriesConfig);
                if (success) {
                  toast.success('DICOM configuration saved successfully');
                  setViewMode('worksheets');
                } else {
                  toast.error('Failed to save DICOM configuration');
                }
              }
            }}
          />
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
            onClick={() => handleViewModeChange('overview')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Overview
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

      {/* Render content based on view mode */}
      {viewMode === 'overview' && renderOverview()}
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
                        setDicomSeriesConfig(template.dicomSeriesConfig || []); // Load DICOM configuration
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
                              <h5 className="font-medium text-gray-100 text-sm">
                                {template.title}
                              </h5>
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
                                className="px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                              >
                                📝 Create Worksheet
                              </button>
                              <button
                                onClick={() => loadTemplateForEditing(template)}
                                className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${template.title}"?`)) {
                                    deleteModalityTemplate(template.id);
                                  }
                                }}
                                className="px-3 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                              >
                                🗑️ Delete
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

          {/* Template Creator/Editor */}
          {!worksheetData && isCreatingTemplate && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-100">
                  {selectedTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreatingTemplate(false);
                    setSelectedTemplate(null);
                    resetTemplateForm();
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕ Cancel
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
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">DICOM Configuration</h3>
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
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                            <input
                              type="text"
                              value={test.notes}
                              onChange={(e) => updateCustomTest(test.id, 'notes', e.target.value)}
                              className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                              placeholder="Additional notes or instructions"
                            />
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
                    💾 {selectedTemplate ? 'Update Template' : 'Save Template'}
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