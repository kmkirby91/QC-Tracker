// Sample worksheets for demonstration
// This creates sample data showing SOMATOM Force CT with only daily QC worksheet assigned

export const initializeSampleWorksheets = () => {
  // Clear any existing data to start fresh
  localStorage.removeItem('qcWorksheets');
  localStorage.removeItem('qcModalityTemplates');

  // Create CT Daily QC Template
  const ctDailyTemplate = {
    id: Date.now(),
    title: 'CT Daily QC Standard Protocol',
    modality: 'CT',
    frequency: 'daily',
    description: 'Standard daily QC tests for CT scanners following ACR guidelines',
    tests: [
      {
        id: 1,
        testName: 'CT Number Accuracy (Water)',
        testType: 'value',
        tolerance: '±5 HU',
        units: 'HU',
        notes: 'Water phantom should measure 0 ± 5 HU',
        description: 'Verify CT number accuracy using water phantom'
      },
      {
        id: 2,
        testName: 'Image Noise Assessment',
        testType: 'value',
        tolerance: '≤6.0 HU',
        units: 'HU (SD)',
        notes: 'Standard deviation in uniform water region',
        description: 'Measure noise in uniform phantom region'
      },
      {
        id: 3,
        testName: 'Uniformity Check',
        testType: 'value',
        tolerance: '±5 HU',
        units: 'HU',
        notes: 'Difference between center and peripheral ROIs',
        description: 'Check image uniformity across phantom'
      },
      {
        id: 4,
        testName: 'Artifact Assessment',
        testType: 'text',
        tolerance: 'None visible',
        units: '',
        notes: 'Look for streaks, rings, or other artifacts',
        description: 'Visual inspection for image artifacts'
      },
      {
        id: 5,
        testName: 'Table Movement Accuracy',
        testType: 'value',
        tolerance: '±1 mm',
        units: 'mm',
        notes: 'Verify table positioning accuracy',
        description: 'Test table movement precision'
      },
      {
        id: 6,
        testName: 'Laser Alignment',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Check positioning laser accuracy',
        description: 'Verify laser alignment with isocenter'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save the template
  localStorage.setItem('qcModalityTemplates', JSON.stringify([ctDailyTemplate]));

  // Create a worksheet from the template for SOMATOM Force CT
  const somatumForceWorksheet = {
    id: Date.now() + 1,
    title: 'CT Daily QC Standard Protocol',
    description: 'Standard daily QC tests for CT scanners following ACR guidelines',
    modality: 'CT',
    frequency: 'daily',
    tests: ctDailyTemplate.tests.map(test => ({
      ...test,
      templateSource: ctDailyTemplate.title,
      isCustomField: false,
      customFieldType: 'template-default'
    })),
    sourceTemplateId: ctDailyTemplate.id,
    sourceTemplateName: ctDailyTemplate.title,
    isWorksheet: true, // Mark as worksheet, not template
    assignedMachines: ['CT-GON-001'], // Assign to SOMATOM Force CT only
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Legacy properties for backward compatibility
    templateSource: ctDailyTemplate.title,
    templateId: ctDailyTemplate.id
  };

  // Save the worksheet
  localStorage.setItem('qcWorksheets', JSON.stringify([somatumForceWorksheet]));

  console.log('Sample worksheets initialized:');
  console.log('- CT Daily QC Template created');
  console.log('- CT Daily QC Worksheet assigned to SOMATOM Force CT (CT-GON-001)');
  console.log('- No other QC types assigned to any machines');
  
  return {
    templatesCreated: 1,
    worksheetsCreated: 1,
    machinesWithWorksheets: ['CT-GON-001']
  };
};

// Function to check if sample data needs to be initialized
export const checkAndInitializeSampleData = () => {
  const existingWorksheets = localStorage.getItem('qcWorksheets');
  const existingTemplates = localStorage.getItem('qcModalityTemplates');
  
  // Check if SOMATOM Force specifically has a worksheet assigned
  let needsInitialization = true;
  
  if (existingWorksheets) {
    try {
      const worksheets = JSON.parse(existingWorksheets);
      const somatumWorksheet = worksheets.find(w => 
        w.modality === 'CT' && 
        w.frequency === 'daily' && 
        w.assignedMachines && 
        w.assignedMachines.includes('CT-GON-001') &&
        w.isWorksheet === true
      );
      
      if (somatumWorksheet) {
        needsInitialization = false;
        console.log('SOMATOM Force already has CT daily worksheet assigned');
      }
    } catch (error) {
      console.error('Error checking existing worksheets:', error);
    }
  }
  
  if (needsInitialization) {
    console.log('Initializing sample data for SOMATOM Force CT...');
    return initializeSampleWorksheets();
  }
  
  return null; // Data already exists
};

// Force initialization for debugging
export const forceInitializeSampleData = () => {
  console.log('Forcing sample data initialization...');
  return initializeSampleWorksheets();
};