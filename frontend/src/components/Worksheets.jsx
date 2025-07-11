import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Worksheets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [loading, setLoading] = useState(true);
  const [worksheetData, setWorksheetData] = useState(null);
  const [loadingWorksheet, setLoadingWorksheet] = useState(false);
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
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [expandedMachines, setExpandedMachines] = useState(new Set());
  const [modalityTemplateInfo, setModalityTemplateInfo] = useState({
    title: '',
    frequency: 'daily',
    machineId: '',
    modality: '',
    description: ''
  });

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
    { value: 'Mammography', label: 'Mammography', icon: '🎯' }
  ];

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    // Handle URL parameters for editing
    const editMachineType = searchParams.get('edit');
    const editFrequency = searchParams.get('frequency');
    
    if (editMachineType && editFrequency) {
      // Load the modality template for editing
      loadModalityTemplateForEdit(editMachineType, editFrequency);
    }
  }, [searchParams]);

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
      'Mammography': ['daily', 'weekly', 'monthly', 'quarterly', 'annual']
    };
    return typeFrequencies[machineType] || [];
  };

  const getAssignedFrequencies = (machine) => {
    // Only return frequencies where the machine has actual worksheets assigned
    const assignedFrequencies = [];
    const worksheets = getWorksheets();
    
    if (machine) {
      getAllFrequencies().forEach(frequency => {
        const hasWorksheet = worksheets.some(ws => 
          ws.modality === machine.type && 
          ws.frequency === frequency && 
          ws.assignedMachines && 
          ws.assignedMachines.includes(machine.machineId)
        );
        if (hasWorksheet) {
          assignedFrequencies.push(frequency);
        }
      });
    }
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

    // Calculate modifications if created from template
    const baseTemplate = selectedTemplate;
    const modifications = baseTemplate ? calculateModifications(baseTemplate, customTests.filter(test => test.testName.trim() !== '')) : [];

    // Prepare tests with custom field tracking
    const processedTests = customTests.filter(test => test.testName.trim() !== '').map(test => {
      const isCustomField = selectedTemplate ? 
        !selectedTemplate.tests.some(templateTest => templateTest.testName === test.testName) : 
        true;
      
      return {
        ...test,
        templateSource: selectedTemplate ? selectedTemplate.title : null,
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
      templateSource: selectedTemplate ? selectedTemplate.title : null,
      templateId: selectedTemplate ? selectedTemplate.id : null,
      baseTemplate: baseTemplate,
      modifications: modifications
    });

    // Auto-assign to the selected machine
    if (savedWorksheet) {
      assignWorksheetToMachine(savedWorksheet.id, selectedMachineData.machineId);
    }

    setWorksheetData(customWorksheetData);
    setViewMode('templates');
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

  const loadCustomTemplate = (template) => {
    setCustomWorksheetInfo({
      title: template.title,
      frequency: template.frequency,
      machineId: '',
      description: template.description || ''
    });
    setCustomTests(template.tests.map(test => ({
      ...test,
      id: test.id || Date.now() + Math.random()
    })));
    toast.success('Template loaded successfully!');
  };

  const getSavedTemplates = () => {
    return JSON.parse(localStorage.getItem('qcCustomTemplates') || '[]');
  };

  const getModalityTemplates = () => {
    return JSON.parse(localStorage.getItem('qcModalityTemplates') || '[]');
  };

  const getCustomWorksheets = () => {
    return JSON.parse(localStorage.getItem('qcCustomWorksheets') || '[]');
  };

  const calculateModifications = (baseTemplate, customTests) => {
    const modifications = [];
    
    if (!baseTemplate || !baseTemplate.tests) {
      return modifications;
    }
    
    // Check for added tests
    const baseTestNames = baseTemplate.tests.map(t => t.testName);
    const customTestNames = customTests.map(t => t.testName);
    
    const addedTests = customTests.filter(t => !baseTestNames.includes(t.testName));
    const removedTests = baseTemplate.tests.filter(t => !customTestNames.includes(t.testName));
    
    if (addedTests.length > 0) {
      modifications.push(`Added ${addedTests.length} test(s): ${addedTests.map(t => t.testName).join(', ')}`);
    }
    
    if (removedTests.length > 0) {
      modifications.push(`Removed ${removedTests.length} test(s): ${removedTests.map(t => t.testName).join(', ')}`);
    }
    
    // Check for modified tests
    const modifiedTests = [];
    customTests.forEach(customTest => {
      const baseTest = baseTemplate.tests.find(t => t.testName === customTest.testName);
      if (baseTest) {
        const changes = [];
        if (baseTest.tolerance !== customTest.tolerance) changes.push('tolerance');
        if (baseTest.units !== customTest.units) changes.push('units');
        if (baseTest.notes !== customTest.notes) changes.push('notes');
        
        if (changes.length > 0) {
          modifiedTests.push(`${customTest.testName} (${changes.join(', ')})`);
        }
      }
    });
    
    if (modifiedTests.length > 0) {
      modifications.push(`Modified tests: ${modifiedTests.join(', ')}`);
    }
    
    return modifications;
  };

  const saveWorksheet = (worksheetData) => {
    const worksheets = getWorksheets();
    const newWorksheet = {
      id: Date.now(),
      title: worksheetData.title,
      description: worksheetData.description,
      modality: worksheetData.modality,
      frequency: worksheetData.frequency,
      tests: worksheetData.tests,
      templateSource: worksheetData.templateSource || null, // Which template this was created from
      templateId: worksheetData.templateId || null, // Template ID for comparison
      baseTemplate: worksheetData.baseTemplate || null, // Original template data for comparison
      modifications: worksheetData.modifications || [], // List of what was changed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedMachines: [] // Array of machine IDs this worksheet is assigned to
    };
    
    // Always add new worksheet
    worksheets.push(newWorksheet);
    
    localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
    return newWorksheet;
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

  const deleteWorksheet = (worksheetId) => {
    if (window.confirm('Are you sure you want to delete this worksheet? This action cannot be undone.')) {
      const worksheets = getWorksheets();
      const updatedWorksheets = worksheets.filter(w => w.id !== worksheetId);
      localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
      toast.success('Worksheet deleted successfully');
      
      // Force a re-render by updating the component state
      window.location.reload();
    }
  };

  const assignWorksheetToMachine = (worksheetId, machineId) => {
    const worksheets = getWorksheets();
    const worksheetIndex = worksheets.findIndex(w => w.id === worksheetId);
    
    if (worksheetIndex !== -1) {
      const worksheet = worksheets[worksheetIndex];
      if (!worksheet.assignedMachines.includes(machineId)) {
        worksheet.assignedMachines.push(machineId);
        worksheet.updatedAt = new Date().toISOString();
        localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
        toast.success('Worksheet assigned to machine successfully');
        return true;
      }
    }
    return false;
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

  const generateWorksheetFromTemplate = (templateId, templateType = 'custom') => {
    let template;
    
    if (templateType === 'custom') {
      template = getSavedTemplates().find(t => t.id === templateId);
    } else if (templateType === 'modality') {
      template = getModalityTemplates().find(t => t.id === templateId);
    }
    
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
      title: `${template.title} - Worksheet`,
      description: template.description,
      modality: template.modality,
      frequency: template.frequency,
      tests: testsWithTracking,
      templateSource: template.title,
      templateId: template.id,
      baseTemplate: template,
      modifications: []
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
    setIsCreatingTemplate(false);
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
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🏥 All Machines Overview
          </button>
          <button
            onClick={() => setViewMode('worksheets')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'worksheets' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📄 Existing Worksheets
          </button>
          <button
            onClick={() => setViewMode('custom')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'custom' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ✏️ Custom Worksheet
          </button>
          <button
            onClick={() => setViewMode('templates')}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {machines.map(machine => (
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
                            <span className="text-red-400">No QC worksheets assigned</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getAssignedFrequencies(machine).length > 0 ? (
                      <>
                        <button
                          onClick={() => performQC(machine.machineId, getAssignedFrequencies(machine)[0])}
                          className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>📝</span>
                          <span>Add QC</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-400 mb-2">No QC worksheets assigned</p>
                        <p className="text-xs text-gray-500">Configure QC worksheets for this machine to add QC records</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates Mode - Template Management & Generation */}
      {viewMode === 'templates' && (
        <div className="space-y-6">
          {/* Template Mode Selection */}
          {!worksheetData && !isCreatingTemplate && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Template Management</h2>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => {
                    resetTemplateForm();
                    setIsCreatingTemplate(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Create New Template</span>
                </button>
                <button
                  onClick={() => setTemplateMode('manage')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium transition-colors"
                >
                  <span>🗂️</span>
                  <span>Manage Templates</span>
                </button>
                <button
                  onClick={() => setTemplateMode('generate')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium transition-colors"
                >
                  <span>📋</span>
                  <span>Generate Worksheets</span>
                </button>
              </div>
            </div>
          )}

          {/* Template Management Content */}
          {!worksheetData && !isCreatingTemplate && templateMode === 'manage' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Manage Templates</h3>
              {getModalityTemplates().length === 0 ? (
                <p className="text-gray-400 text-center py-8">No templates saved yet. Create your first template!</p>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Edit Template
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          const template = getModalityTemplates().find(t => t.id.toString() === e.target.value);
                          if (template) {
                            loadTemplateForEditing(template);
                          }
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Select template to edit...</option>
                      {getModalityTemplates().map(template => (
                        <option key={template.id} value={template.id}>
                          {template.title} ({template.modality} • {getFrequencyLabel(template.frequency)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Use Template in Custom Worksheet
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          const template = getModalityTemplates().find(t => t.id.toString() === e.target.value);
                          if (template) {
                            createWorksheetFromTemplate(template);
                          }
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Select template to use...</option>
                      {getModalityTemplates().map(template => (
                        <option key={template.id} value={template.id}>
                          {template.title} ({template.modality} • {getFrequencyLabel(template.frequency)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Delete Template
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.value && window.confirm('Are you sure you want to delete this template?')) {
                          deleteModalityTemplate(parseInt(e.target.value));
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Select template to delete...</option>
                      {getModalityTemplates().map(template => (
                        <option key={template.id} value={template.id}>
                          {template.title} ({template.modality} • {getFrequencyLabel(template.frequency)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Create Another Template Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      resetTemplateForm();
                      setIsCreatingTemplate(true);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <span>➕</span>
                    <span>Create Another Template</span>
                  </button>
                </div>
                </>
              )}
              
              {/* Template List for Reference */}
              {getModalityTemplates().length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-200 mb-3">Saved Templates ({getModalityTemplates().length})</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="space-y-2">
                      {getModalityTemplates().map(template => (
                        <div key={template.id} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded">
                          <div>
                            <span className="text-gray-100 font-medium">{template.title}</span>
                            <span className="text-gray-400 text-sm ml-2">
                              📱 {template.modality} • {getFrequencyIcon(template.frequency)} {getFrequencyLabel(template.frequency)} • {template.tests.length} tests
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          )}

          {/* Generate Worksheets from Templates */}
          {!worksheetData && !isCreatingTemplate && templateMode === 'generate' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Generate Worksheets from Templates</h3>
              <p className="text-gray-400 mb-6">Create worksheets from existing templates. Worksheets can then be assigned to machines.</p>
              
              {getModalityTemplates().length === 0 ? (
                <p className="text-gray-400 text-center py-8">No templates available. Create templates first to generate worksheets.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getModalityTemplates().map(template => (
                    <div key={template.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-100 text-sm">
                          {template.title}
                        </h4>
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
                      
                      <button
                        onClick={() => {
                          const newWorksheet = generateWorksheetFromTemplate(template.id, 'modality');
                          if (newWorksheet) {
                            toast.success(`Worksheet "${newWorksheet.title}" created successfully!`);
                          }
                        }}
                        className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                      >
                        📋 Generate Worksheet
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Creator - Uses same interface as Custom Worksheet */}
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
              
              {/* Template Information - Same as Custom Worksheet */}
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
                  <p className="text-xs text-gray-500 mt-1">
                    The template will be created for {customWorksheetInfo.modality || 'selected'} equipment
                  </p>
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

              {/* Test Builder - Same as Custom Worksheet */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-100">QC Tests</h4>
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
                    <div key={test.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-md font-medium text-gray-100">Test #{index + 1}</h5>
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
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={saveAsTemplate}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>{selectedTemplate ? 'Update Template' : 'Save Template'}</span>
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
          )}

        </div>
      )}

      {/* Existing Worksheets Mode - List all available worksheets */}
      {viewMode === 'worksheets' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Existing QC Worksheets</h2>
            <p className="text-gray-400 mb-6">All QC worksheets organized by modality, then frequency. Shows worksheets and their machine assignments.</p>
            
            {/* Worksheet listing organized by modality, then frequency */}
            <div className="space-y-8">
              {modalities.map(modality => {
                // Get all worksheets for this modality
                const modalityWorksheets = getWorksheets().filter(w => w.modality === modality.value);
                
                // Only show modality section if there are worksheets
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
                        // Get worksheets for this modality and frequency
                        const frequencyWorksheets = modalityWorksheets.filter(w => w.frequency === frequency);
                        
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
                                  {/* Template Source Header */}
                                  {worksheet.templateSource && (
                                    <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-2 mb-3">
                                      <div className="text-xs text-blue-300 font-medium mb-1">
                                        📋 Based on: {worksheet.templateSource}
                                      </div>
                                      {worksheet.modifications && worksheet.modifications.length > 0 ? (
                                        <div className="text-xs text-amber-300">
                                          <div className="font-medium mb-1">🔧 Modified:</div>
                                          <ul className="list-disc list-inside space-y-1">
                                            {worksheet.modifications.slice(0, 2).map((mod, modIndex) => (
                                              <li key={modIndex} className="text-amber-200">{mod}</li>
                                            ))}
                                            {worksheet.modifications.length > 2 && (
                                              <li className="text-amber-300">... and {worksheet.modifications.length - 2} more</li>
                                            )}
                                          </ul>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-green-300">
                                          ✓ Unmodified from template
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-gray-100 text-sm">
                                      {worksheet.title}
                                    </h5>
                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                      Worksheet
                                    </span>
                                  </div>
                                  
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
                                            <div key={machineId} className="flex items-center justify-between text-xs">
                                              <span className="text-gray-300">{machine.name}</span>
                                              <button
                                                onClick={() => unassignWorksheetFromMachine(worksheet.id, machineId)}
                                                className="text-red-400 hover:text-red-300"
                                                title="Unassign from machine"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2">
                                    {/* View Button - Shows options based on machine assignments */}
                                    {worksheet.assignedMachines.length === 0 ? (
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => navigate(`/qc/view/${worksheet.modality}/${worksheet.frequency}`)}
                                          className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                          📋 View Template
                                        </button>
                                        <button
                                          onClick={() => deleteWorksheet(worksheet.id)}
                                          className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                          title="Delete this worksheet"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    ) : worksheet.assignedMachines.length === 1 ? (
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => navigate(`/qc/view-worksheet/${worksheet.assignedMachines[0]}/${worksheet.frequency}`)}
                                          className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                          📋 View Worksheet
                                        </button>
                                        <button
                                          onClick={() => deleteWorksheet(worksheet.id)}
                                          className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                          title="Delete this worksheet"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="text-xs text-gray-400">View for machine:</div>
                                        <div className="space-y-1">
                                          {worksheet.assignedMachines.slice(0, 2).map(machineId => {
                                            const machine = machines.find(m => m.machineId === machineId);
                                            return machine ? (
                                              <button
                                                key={machineId}
                                                onClick={() => navigate(`/qc/view-worksheet/${machineId}/${worksheet.frequency}`)}
                                                className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors text-left"
                                              >
                                                📋 {machine.name}
                                              </button>
                                            ) : null;
                                          })}
                                          {worksheet.assignedMachines.length > 2 && (
                                            <div className="text-xs text-gray-500 text-center">
                                              ... and {worksheet.assignedMachines.length - 2} more
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => deleteWorksheet(worksheet.id)}
                                          className="w-full px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                          title="Delete this worksheet"
                                        >
                                          🗑️ Delete
                                        </button>
                                      </div>
                                    )}

                                    {/* Machine Assignment Dropdown */}
                                    <div className="flex space-x-1">
                                      <select
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            assignWorksheetToMachine(worksheet.id, e.target.value);
                                            e.target.value = '';
                                          }
                                        }}
                                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-100"
                                      >
                                        <option value="">Assign to machine...</option>
                                        {machines
                                          .filter(m => m.type === worksheet.modality && !worksheet.assignedMachines.includes(m.machineId))
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
              })}
              
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
          </div>
        </div>
      )}

      {/* Custom Worksheet Builder */}
      {viewMode === 'custom' && (
        <div className="space-y-6">
          {/* Load Template Dropdown */}
          {(getSavedTemplates().length > 0 || getModalityTemplates().length > 0) && (
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
                      
                      const [type, id] = e.target.value.split('|');
                      let template;
                      
                      if (type === 'modality') {
                        template = getModalityTemplates().find(t => t.id.toString() === id);
                        if (template) {
                          setCustomWorksheetInfo({
                            title: template.title,
                            frequency: template.frequency,
                            machineId: '',
                            description: template.description || ''
                          });
                          setCustomTests(template.tests.map(test => ({
                            ...test,
                            id: test.id || Date.now() + Math.random()
                          })));
                          toast.success('Modality template loaded!');
                        }
                      } else if (type === 'custom') {
                        template = getSavedTemplates().find(t => t.id.toString() === id);
                        if (template) {
                          loadCustomTemplate(template);
                        }
                      }
                      
                      // Reset dropdown
                      e.target.value = '';
                    }}
                  >
                    <option value="">Choose a template to load...</option>
                    
                    {getModalityTemplates().length > 0 && (
                      <optgroup label="Modality Templates">
                        {getModalityTemplates().map(template => (
                          <option key={template.id} value={`modality|${template.id}`}>
                            {template.title} ({template.modality} • {getFrequencyLabel(template.frequency)} • {template.tests.length} tests)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {getSavedTemplates().length > 0 && (
                      <optgroup label="Custom Worksheet Templates">
                        {getSavedTemplates().map(template => (
                          <option key={template.id} value={`custom|${template.id}`}>
                            {template.title} ({getFrequencyLabel(template.frequency)} • {template.tests.length} tests)
                          </option>
                        ))}
                      </optgroup>
                    )}
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
                    {getSavedTemplates().length > 0 && (
                      <select
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.value && window.confirm('Are you sure you want to delete this template?')) {
                            deleteTemplate(parseInt(e.target.value));
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Delete template...</option>
                        {getSavedTemplates().map(template => (
                          <option key={template.id} value={template.id}>
                            {template.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Worksheet Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Custom Worksheet Information</h2>
            
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

            <div className="mt-6 flex justify-center space-x-4">
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
              <button
                onClick={generateCustomWorksheet}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Generate Custom Worksheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worksheet Display - Shared across all modes */}
      {worksheetData && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            {viewMode === 'view-only' ? 'Worksheet Template' : 'Generated Worksheet'}
          </h3>
          
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

          {/* Worksheet Content */}
          <div className="bg-white rounded-lg p-6 text-black print:shadow-none">
            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">QC Worksheet</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Machine:</strong> {worksheetData.machine.name} ({worksheetData.machine.machineId})
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
