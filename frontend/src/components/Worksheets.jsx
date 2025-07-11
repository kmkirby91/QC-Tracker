import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const assignedFrequencies = [];
    if (machine && machine.qcSchedule) {
      if (machine.qcSchedule.daily) assignedFrequencies.push('daily');
      if (machine.qcSchedule.weekly) assignedFrequencies.push('weekly');
      if (machine.qcSchedule.monthly) assignedFrequencies.push('monthly');
      if (machine.qcSchedule.quarterly) assignedFrequencies.push('quarterly');
      if (machine.qcSchedule.annual) assignedFrequencies.push('annual');
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

    // Save the custom worksheet
    const savedWorksheet = saveCustomWorksheet({
      machineId: selectedMachineData.machineId,
      machineName: selectedMachineData.name,
      machineType: selectedMachineData.type,
      frequency: customWorksheetInfo.frequency,
      title: customWorksheetInfo.title,
      description: customWorksheetInfo.description,
      tests: customTests.filter(test => test.testName.trim() !== ''),
      templateSource: selectedTemplate ? selectedTemplate.title : null,
      templateId: selectedTemplate ? selectedTemplate.id : null,
      baseTemplate: baseTemplate,
      modifications: modifications
    });

    setWorksheetData(customWorksheetData);
    setViewMode('templates');
    toast.success(`Custom worksheet saved for ${selectedMachineData.name}!`);
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

  const saveCustomWorksheet = (worksheetData) => {
    const customWorksheets = getCustomWorksheets();
    const newWorksheet = {
      id: Date.now(),
      machineId: worksheetData.machineId,
      machineName: worksheetData.machineName,
      machineType: worksheetData.machineType,
      frequency: worksheetData.frequency,
      title: worksheetData.title,
      description: worksheetData.description,
      tests: worksheetData.tests,
      templateSource: worksheetData.templateSource || null, // Which template this was created from
      templateId: worksheetData.templateId || null, // Template ID for comparison
      baseTemplate: worksheetData.baseTemplate || null, // Original template data for comparison
      modifications: worksheetData.modifications || [], // List of what was changed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Check if worksheet already exists for this machine/frequency combination
    const existingIndex = customWorksheets.findIndex(w => 
      w.machineId === worksheetData.machineId && w.frequency === worksheetData.frequency
    );
    
    if (existingIndex !== -1) {
      // Update existing worksheet
      customWorksheets[existingIndex] = { ...newWorksheet, id: customWorksheets[existingIndex].id, createdAt: customWorksheets[existingIndex].createdAt };
    } else {
      // Add new worksheet
      customWorksheets.push(newWorksheet);
    }
    
    localStorage.setItem('qcCustomWorksheets', JSON.stringify(customWorksheets));
    return newWorksheet;
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
                    <h3 className="text-lg font-semibold text-gray-100">{machine.name}</h3>
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
                                <span className={isAssigned ? 'text-green-300' : 'text-gray-400'}>
                                  {getFrequencyIcon(freq)} {getFrequencyLabel(freq)}
                                </span>
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
                                ({getAssignedFrequencies(machine).map(freq => getFrequencyLabel(freq)).join(', ')})
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

          
          {/* Worksheet Display */}
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
                      onClick={() => {
                        // Save current worksheet as template
                        const templateData = {
                          title: worksheetData.title || `${worksheetData.machine.type} ${getFrequencyLabel(worksheetData.frequency)} Template`,
                          modality: worksheetData.machine.type,
                          frequency: worksheetData.frequency,
                          description: worksheetData.description || '',
                          tests: worksheetData.tests.map(test => ({
                            testName: test.name,
                            testType: test.type || 'value',
                            tolerance: test.tolerance,
                            units: test.units || '',
                            notes: test.notes || ''
                          }))
                        };
                        
                        setModalityTemplateInfo({
                          title: templateData.title,
                          modality: templateData.modality,
                          frequency: templateData.frequency,
                          description: templateData.description
                        });
                        
                        setCustomTests(templateData.tests.map(test => ({
                          ...test,
                          id: Date.now() + Math.random()
                        })));
                        
                        setWorksheetData(null);
                        setTemplateMode('create');
                        toast.success('Worksheet loaded for template creation');
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                    >
                      <span>💾</span>
                      <span>Save as Template</span>
                    </button>
                  )}
                </div>
              )}
              
              {viewMode === 'view-only' && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-300">
                      This is a view-only template for {worksheetData.machine.type} {getFrequencyLabel(worksheetData.frequency)} worksheets.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setViewMode('worksheets')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                      >
                        <span>◀️</span>
                        <span>Back to Worksheets</span>
                      </button>
                      <button
                        onClick={printWorksheet}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <span>🖨️</span>
                        <span>Print Template</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* View-only mode */}
      {viewMode === 'view-only' && worksheetData && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Worksheet Template</h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-300">
                  This is a view-only template for {worksheetData.machine.type} {getFrequencyLabel(worksheetData.frequency)} worksheets.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setViewMode('worksheets')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <span>◀️</span>
                    <span>Back to Worksheets</span>
                  </button>
                  <button
                    onClick={printWorksheet}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🖨️</span>
                    <span>Print Template</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Worksheets Mode - List all available worksheets */}
      {viewMode === 'worksheets' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Existing QC Worksheets</h2>
            <p className="text-gray-400 mb-6">All QC worksheets organized by modality, then frequency. Shows custom worksheets that have been created and machines using default templates.</p>
            
            {/* Worksheet listing organized by modality, then frequency */}
            <div className="space-y-8">
              {Object.keys(
                machines.reduce((acc, machine) => {
                  acc[machine.type] = acc[machine.type] || [];
                  acc[machine.type].push(machine);
                  return acc;
                }, {})
              ).map(machineType => {
                // Get all custom worksheets for this modality
                const customWorksheetsForModality = getCustomWorksheets().filter(w => w.machineType === machineType);
                
                // Get all machines of this type that have QC frequencies assigned
                const machinesOfType = machines.filter(m => m.type === machineType && getAssignedFrequencies(m).length > 0);
                
                // Only show modality section if there are worksheets or assigned machines
                if (customWorksheetsForModality.length === 0 && machinesOfType.length === 0) {
                  return null;
                }
                
                return (
                  <div key={machineType} className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center space-x-2">
                      <span>{modalities.find(m => m.value === machineType)?.icon || '📱'}</span>
                      <span>{machineType} Worksheets</span>
                      <span className="text-sm text-gray-400">
                        ({customWorksheetsForModality.length} custom worksheet{customWorksheetsForModality.length !== 1 ? 's' : ''}, {machinesOfType.length} machine{machinesOfType.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                    
                    {/* Group by frequency within this modality */}
                    <div className="space-y-6">
                      {getAllFrequencies().map(frequency => {
                        // Get custom worksheets for this modality and frequency
                        const customWorksheets = customWorksheetsForModality.filter(w => w.frequency === frequency);
                        
                        // Get machines of this type assigned to this frequency
                        const machinesWithFreq = machinesOfType.filter(m => getAssignedFrequencies(m).includes(frequency));
                        
                        // Group custom worksheets by machine to count multiple worksheets per machine
                        const worksheetsByMachine = customWorksheets.reduce((acc, worksheet) => {
                          const key = worksheet.machineId;
                          if (!acc[key]) {
                            acc[key] = [];
                          }
                          acc[key].push(worksheet);
                          return acc;
                        }, {});
                        
                        // Only show frequency section if there are worksheets or assigned machines
                        if (customWorksheets.length === 0 && machinesWithFreq.length === 0) {
                          return null;
                        }
                        
                        return (
                          <div key={frequency} className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-gray-100 mb-4 flex items-center space-x-2">
                              <span>{getFrequencyIcon(frequency)}</span>
                              <span>{getFrequencyLabel(frequency)}</span>
                              <span className="text-sm text-gray-400">
                                ({Object.keys(worksheetsByMachine).length + machinesWithFreq.filter(m => !worksheetsByMachine[m.machineId]).length} machine{(Object.keys(worksheetsByMachine).length + machinesWithFreq.filter(m => !worksheetsByMachine[m.machineId]).length) !== 1 ? 's' : ''}, {customWorksheets.length} total worksheet{customWorksheets.length !== 1 ? 's' : ''})
                              </span>
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Group custom worksheets by machine and show count */}
                              {Object.entries(worksheetsByMachine).map(([machineId, machineWorksheets]) => {
                                const machine = machines.find(m => m.machineId === machineId);
                                if (!machine) return null;
                                
                                return (
                                  <div key={machineId} className="bg-gray-900 rounded-lg p-4 border-l-4 border-purple-500">
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium text-gray-100 text-sm">
                                        {machine.name}
                                      </h5>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                                          Custom
                                        </span>
                                        {machineWorksheets.length > 1 && (
                                          <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full">
                                            {machineWorksheets.length} QCs
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Show list of worksheets for this machine */}
                                    <div className="space-y-3 mb-4">
                                      {machineWorksheets.map((worksheet, index) => (
                                        <div key={worksheet.id} className="bg-gray-800 rounded-lg p-3">
                                          {/* Template Source Header */}
                                          {worksheet.templateSource && (
                                            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-2 mb-2">
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
                                          
                                          <div className="space-y-1">
                                            <div className="text-xs text-gray-300">
                                              <strong>#{index + 1}:</strong> {worksheet.title}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                              <strong>Tests:</strong> {worksheet.tests.length}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Created: {new Date(worksheet.createdAt).toLocaleDateString()}
                                            </div>
                                          </div>
                                          
                                          <div className="flex space-x-2 mt-2">
                                            <button
                                              onClick={() => navigate(`/qc/view/${worksheet.machineType}/${worksheet.frequency}`)}
                                              className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                              📋 View
                                            </button>
                                            
                                            <button
                                              onClick={() => performQC(worksheet.machineId, worksheet.frequency)}
                                              className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                            >
                                              📝 QC
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
                                        <strong>Machine:</strong> {machine.location.building} - {machine.location.room}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* Machines using default worksheets for this frequency */}
                              {machinesWithFreq.map(machine => {
                                // Check if this machine already has a custom worksheet for this frequency
                                const hasCustom = customWorksheets.some(w => w.machineId === machine.machineId);
                                if (hasCustom) return null; // Don't show default if custom exists
                                
                                return (
                                  <div key={machine.machineId} className="bg-gray-900 rounded-lg p-4 border-l-4 border-blue-500">
                                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-2 mb-3">
                                      <div className="text-xs text-gray-300 font-medium">
                                        ⚙️ Using Default Template
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        No custom worksheet created yet
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium text-gray-100 text-sm">
                                        {machine.name}
                                      </h5>
                                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                        Default
                                      </span>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                      <div className="text-xs text-gray-300">
                                        <strong>Location:</strong> {machine.location.building} - {machine.location.room}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        <strong>Status:</strong> {machine.status}
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <button
                                        onClick={() => navigate(`/qc/view/${machine.type}/${frequency}`)}
                                        className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                      >
                                        📋 View Default Template
                                      </button>
                                      
                                      <button
                                        onClick={() => performQC(machine.machineId, frequency)}
                                        className="w-full px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                      >
                                        📝 Perform QC
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {/* Show message if no worksheets exist */}
              {getCustomWorksheets().length === 0 && machines.every(m => getAssignedFrequencies(m).length === 0) && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">No QC Worksheets Found</div>
                  <div className="text-gray-500 text-sm">
                    Create custom worksheets or assign QC frequencies to machines to see them here.
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

      {/* Generated Worksheet */}
      {worksheetData && (
        <div className="bg-white text-black rounded-lg p-8 print:shadow-none print:p-6" id="worksheet">
          <div className="mb-6 border-b-2 border-gray-300 pb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {worksheetData.isCustom ? worksheetData.title : 'QC Worksheet'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {getFrequencyIcon(worksheetData.frequency)} {getFrequencyLabel(worksheetData.frequency)}
                  {worksheetData.isCustom && worksheetData.description && 
                    <span className="ml-2">- {worksheetData.description}</span>
                  }
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Generated: {new Date().toLocaleDateString()}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Machine Information</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium py-1">Machine ID:</td>
                      <td className="py-1">{worksheetData.machine.machineId}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Name:</td>
                      <td className="py-1">{worksheetData.machine.name}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Type:</td>
                      <td className="py-1">{worksheetData.machine.type}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Manufacturer:</td>
                      <td className="py-1">{worksheetData.machine.manufacturer}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Model:</td>
                      <td className="py-1">{worksheetData.machine.model}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Location:</td>
                      <td className="py-1">{worksheetData.machine.location.building} - {worksheetData.machine.location.room}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">QC Information</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium py-1">QC Date:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Start Time:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">End Time:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Performed By:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Reviewed By:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* QC Tests Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">QC Tests</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-4 py-2 text-left font-semibold">Test Name</th>
                    {!worksheetData.viewOnly && (
                      <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Measured Value</th>
                    )}
                    <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Tolerance</th>
                    {!worksheetData.viewOnly && (
                      <>
                        <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Pass/Fail</th>
                        <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Notes</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {worksheetData.tests.map((test, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 px-4 py-3 font-medium">
                        {test.name}
                        {test.notes && worksheetData.isCustom && (
                          <div className="text-xs text-gray-500 mt-1 italic">{test.notes}</div>
                        )}
                      </td>
                      {!worksheetData.viewOnly && (
                        <td className="border border-gray-400 px-4 py-3 text-center">
                          {worksheetData.isCustom ? (
                            <>
                              {test.type === 'value' && (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="border-b border-gray-400 h-8 w-20"></div>
                                  {test.units && <span className="text-sm text-gray-600">{test.units}</span>}
                                </div>
                              )}
                              {test.type === 'text' && (
                                <div className="border-b border-gray-400 h-8 w-full"></div>
                              )}
                              {test.type === 'passfail' && (
                                <div className="flex justify-center space-x-4">
                                  <label className="flex items-center">
                                    <input type="radio" name={`test-${index}`} className="mr-1" />
                                    <span className="text-sm">Pass</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input type="radio" name={`test-${index}`} className="mr-1" />
                                    <span className="text-sm">Fail</span>
                                  </label>
                                </div>
                              )}
                              {test.type === 'checkbox' && (
                                <div className="flex justify-center">
                                  <input type="checkbox" className="scale-125" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="border-b border-gray-400 h-8 w-full"></div>
                          )}
                        </td>
                      )}
                      <td className="border border-gray-400 px-4 py-3 text-center text-sm">
                        {test.tolerance || 'See Protocol'}
                      </td>
                      {!worksheetData.viewOnly && (
                        <>
                          <td className="border border-gray-400 px-4 py-3 text-center">
                            {!worksheetData.isCustom || test.type === 'value' || test.type === 'text' ? (
                              <div className="flex justify-center space-x-4">
                                <label className="flex items-center">
                                  <input type="checkbox" className="mr-1" />
                                  <span className="text-sm">Pass</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" className="mr-1" />
                                  <span className="text-sm">Fail</span>
                                </label>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">N/A</div>
                            )}
                          </td>
                          <td className="border border-gray-400 px-4 py-3">
                            <div className="border-b border-gray-400 h-8 w-full"></div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      )}
    </div>
  );
};

export default Worksheets;