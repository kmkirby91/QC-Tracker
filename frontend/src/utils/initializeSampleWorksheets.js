// Initialize sample worksheets to test the QC status dashboard
// This creates worksheets that match the backend's sample assignments

export const initializeSampleWorksheets = () => {
  try {
    // Version check to force updates when worksheet assignments change
    const WORKSHEET_VERSION = '1.2'; // Increment this to force re-initialization
    const storedVersion = localStorage.getItem('qcWorksheetsVersion');
    
    if (storedVersion !== WORKSHEET_VERSION) {
      console.log(`🔄 Worksheet version mismatch (stored: ${storedVersion}, current: ${WORKSHEET_VERSION}). Re-initializing...`);
      localStorage.removeItem('qcWorksheets');
      localStorage.setItem('qcWorksheetsVersion', WORKSHEET_VERSION);
    }
    
    const existingWorksheets = localStorage.getItem('qcWorksheets');
    
    // Check if we need to update existing worksheets for new MRI assignments
    if (existingWorksheets) {
      const worksheets = JSON.parse(existingWorksheets);
      const mriDailyWorksheet = worksheets.find(w => w.id === 'sample-mri-daily-001');
      
      // If MRI daily worksheet exists but doesn't have all MRI machines assigned, update it
      if (mriDailyWorksheet && mriDailyWorksheet.assignedMachines) {
        const hasAllMRIMachines = ['MRI-GON-001', 'MRI-ESS-001', 'MRI-WOM-001'].every(
          machineId => mriDailyWorksheet.assignedMachines.includes(machineId)
        );
        
        if (!hasAllMRIMachines) {
          console.log('🔄 Updating MRI daily worksheet assignments...');
          console.log('Current assigned machines:', mriDailyWorksheet.assignedMachines);
          console.log('Expected machines:', ['MRI-GON-001', 'MRI-ESS-001', 'MRI-WOM-001']);
          // Force re-initialization to pick up new assignments
          localStorage.removeItem('qcWorksheets');
        } else if (worksheets.length > 0) {
          console.log('Sample worksheets already exist and up to date');
          return worksheets;
        }
      } else if (worksheets.length > 0) {
        console.log('Sample worksheets already exist, skipping initialization');
        return worksheets;
      }
    }

    const sampleWorksheets = [
      // CT Daily QC - Matches backend assignment for CT-GON-001
      {
        id: 'sample-ct-daily-001',
        title: 'ACR CT Daily QC Protocol',
        modality: 'CT',
        frequency: 'daily',
        description: 'Daily quality control tests for CT scanners following ACR standards',
        assignedMachines: ['CT-GON-001'], // Siemens SOMATOM Force
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'CT Number Accuracy (Water)',
            testType: 'value',
            tolerance: '±5 HU',
            units: 'HU',
            notes: 'Use water-equivalent phantom. Measure ROI in center of water section.',
            description: 'Verify CT number accuracy for water-equivalent material'
          },
          {
            id: 2,
            testName: 'Image Noise',
            testType: 'value',
            tolerance: '≤6.0 HU',
            units: 'HU (SD)',
            notes: 'Standard deviation in uniform water region. ROI should be >200 pixels.',
            description: 'Measure image noise in water phantom'
          },
          {
            id: 3,
            testName: 'Uniformity',
            testType: 'value',
            tolerance: '±5 HU',
            units: 'HU',
            notes: 'Measure 4 peripheral ROIs and center ROI. Report max difference from center.',
            description: 'Check image uniformity across phantom'
          },
          {
            id: 4,
            testName: 'Artifact Evaluation',
            testType: 'passfail',
            tolerance: 'Pass',
            units: '',
            notes: 'Visual inspection for streaks, rings, shading, or other artifacts.',
            description: 'Visual assessment for image artifacts'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // CT Daily QC #2 - Second daily worksheet for CT-GON-001 to test multiple worksheet completion
      {
        id: 'sample-ct-daily-002',
        title: 'CT Safety & Calibration Daily QC',
        modality: 'CT',
        frequency: 'daily',
        description: 'Additional daily safety and calibration checks for CT scanners',
        assignedMachines: ['CT-GON-001'], // Siemens SOMATOM Force
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'Radiation Safety Check',
            testType: 'passfail',
            tolerance: 'Pass',
            units: '',
            notes: 'Verify all radiation safety systems are functional',
            description: 'Check radiation safety interlocks and warning systems'
          },
          {
            id: 2,
            testName: 'Laser Alignment Check',
            testType: 'value',
            tolerance: '±2 mm',
            units: 'mm',
            notes: 'Check patient positioning laser alignment accuracy',
            description: 'Verify laser positioning system accuracy'
          },
          {
            id: 3,
            testName: 'Table Movement Check',
            testType: 'passfail',
            tolerance: 'Pass',
            units: '',
            notes: 'Test patient table movement in all directions',
            description: 'Verify patient table mechanical operation'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // MRI Daily QC - Matches backend assignment for MRI-GON-001
      {
        id: 'sample-mri-daily-001',
        title: 'ACR MR Daily QC Protocol',
        modality: 'MRI',
        frequency: 'daily',
        description: 'Daily quality control tests for MR scanners following ACR standards',
        assignedMachines: ['MRI-GON-001', 'MRI-ESS-001', 'MRI-WOM-001'], // All MRI machines
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'Table Positioning',
            testType: 'value',
            tolerance: '±2 mm',
            units: 'mm',
            notes: 'Verify accuracy and reproducibility of patient table positioning',
            description: 'Check patient positioning system accuracy'
          },
          {
            id: 2,
            testName: 'Center Frequency',
            testType: 'value',
            tolerance: '±3 ppm',
            units: 'MHz',
            notes: 'Confirm the scanner is on-resonance for optimal signal',
            description: 'Verify RF center frequency calibration'
          },
          {
            id: 3,
            testName: 'Transmitter Gain',
            testType: 'value',
            tolerance: '±5%',
            units: '%',
            notes: 'Check RF chain consistency and calibration',
            description: 'Assess RF transmitter performance'
          },
          {
            id: 4,
            testName: 'Image Uniformity',
            testType: 'value',
            tolerance: '±10%',
            units: '%',
            notes: 'Measure signal uniformity across phantom image',
            description: 'Check for coil or B0 uniformity issues'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Mammography Daily QC - Matches backend assignment for MAMMO-GON-001
      {
        id: 'sample-mammo-daily-001',
        title: 'ACR Mammography Daily QC Protocol',
        modality: 'Mammography',
        frequency: 'daily',
        description: 'Daily quality control tests for mammography units following ACR standards',
        assignedMachines: ['MAMMO-WOM-001'], // Hologic Selenia Dimensions
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'Phantom Image Quality',
            testType: 'passfail',
            tolerance: 'Pass',
            units: '',
            notes: 'Use ACR mammography phantom. Check for artifacts and image quality.',
            description: 'Assess overall image quality using standardized phantom'
          },
          {
            id: 2,
            testName: 'Automatic Exposure Control',
            testType: 'value',
            tolerance: '±10%',
            units: 'mAs',
            notes: 'Verify AEC reproducibility and accuracy',
            description: 'Check automatic exposure control function'
          },
          {
            id: 3,
            testName: 'kVp Accuracy',
            testType: 'value',
            tolerance: '±2%',
            units: 'kVp',
            notes: 'Measure actual kVp against set values',
            description: 'Verify X-ray tube voltage accuracy'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // CT Monthly QC - Matches backend assignment for CT-GON-001
      {
        id: 'sample-ct-monthly-001',
        title: 'ACR CT Monthly QC Protocol',
        modality: 'CT',
        frequency: 'monthly',
        description: 'Monthly quality control tests for CT scanners following ACR standards',
        assignedMachines: ['CT-GON-001'], // Siemens SOMATOM Force
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'CT Number Linearity',
            testType: 'value',
            tolerance: '±5 HU',
            units: 'HU',
            notes: 'Use multi-material phantom. Verify linearity across materials.',
            description: 'Check CT number linearity across different materials'
          },
          {
            id: 2,
            testName: 'Spatial Resolution',
            testType: 'value',
            tolerance: '≤0.75 mm',
            units: 'mm',
            notes: 'Use high-contrast resolution phantom',
            description: 'Measure high-contrast spatial resolution'
          },
          {
            id: 3,
            testName: 'Low Contrast Detectability',
            testType: 'value',
            tolerance: '≥6 mm',
            units: 'mm',
            notes: 'Use low-contrast phantom. Report smallest visible contrast detail.',
            description: 'Assess low-contrast detection capability'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // PET Weekly QC - Matches backend assignment for PET-WOM-001
      {
        id: 'sample-pet-weekly-001',
        title: 'PET Weekly QC Protocol',
        modality: 'PET',
        frequency: 'weekly',
        description: 'Weekly quality control tests for PET scanners',
        assignedMachines: ['PET-WOM-001'], // GE Discovery IQ
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'Daily Normalization',
            testType: 'passfail',
            tolerance: 'Pass',
            units: '',
            notes: 'Verify detector normalization and uniformity',
            description: 'Check PET detector normalization'
          },
          {
            id: 2,
            testName: 'Coincidence Timing',
            testType: 'value',
            tolerance: '≤3 ns',
            units: 'ns',
            notes: 'Measure timing resolution between detectors',
            description: 'Assess coincidence timing accuracy'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // MRI Quarterly QC
      {
        id: 'sample-mri-quarterly-001',
        title: 'MRI Quarterly QC Protocol',
        modality: 'MRI',
        frequency: 'quarterly',
        description: 'Quarterly quality control tests for MR scanners',
        assignedMachines: ['MRI-GON-001', 'MRI-ESS-001', 'MRI-WOM-001'], // All MRI machines
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'B0 Field Homogeneity',
            testType: 'value',
            tolerance: '≤5 ppm',
            units: 'ppm',
            notes: 'Measure field homogeneity across imaging volume',
            description: 'Check magnetic field homogeneity'
          },
          {
            id: 2,
            testName: 'Gradient Performance',
            testType: 'value',
            tolerance: '±2%',
            units: '%',
            notes: 'Verify gradient linearity and accuracy',
            description: 'Assess gradient system performance'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // CT Annual QC
      {
        id: 'sample-ct-annual-001',
        title: 'ACR CT Annual QC Protocol',
        modality: 'CT',
        frequency: 'annual',
        description: 'Annual quality control tests for CT scanners following ACR standards',
        assignedMachines: ['CT-GON-001'], // Siemens SOMATOM Force
        isWorksheet: true,
        startDate: '2025-07-31',
        tests: [
          {
            id: 1,
            testName: 'Full Dosimetry Calibration',
            testType: 'value',
            tolerance: '±10%',
            units: 'mGy',
            notes: 'Complete dose calibration using ion chamber',
            description: 'Comprehensive dose output verification'
          },
          {
            id: 2,
            testName: 'Radiation Safety Survey',
            testType: 'passfail',
            tolerance: 'Pass',
            units: '',
            notes: 'Survey radiation levels around scanner',
            description: 'Annual radiation safety assessment'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // CT-WOM-001 Daily QC - Canon Aquilion ONE with 7/19 start date
      {
        id: 'custom-ct-wom-daily-001',
        title: 'Canon CT Daily QC Protocol',
        modality: 'CT',
        frequency: 'daily',
        description: 'Daily quality control tests for Canon CT scanners',
        assignedMachines: ['CT-WOM-001'], // Canon Aquilion ONE
        isWorksheet: true,
        startDate: '2025-07-19', // Earlier start date to test overdue functionality
        tests: [
          {
            id: 1,
            testName: 'CT Number Accuracy (Water)',
            testType: 'value',
            tolerance: '±5 HU',
            units: 'HU',
            notes: 'Use water-equivalent phantom. Measure ROI in center of water section.',
            description: 'Verify CT number accuracy for water-equivalent material'
          },
          {
            id: 2,
            testName: 'Image Noise',
            testType: 'value',
            tolerance: '≤4.5 HU',
            units: 'HU (SD)',
            notes: 'Standard deviation in uniform water region. ROI should be >200 pixels.',
            description: 'Measure image noise in water phantom'
          },
          {
            id: 3,
            testName: 'Uniformity',
            testType: 'value',
            tolerance: '±4 HU',
            units: 'HU',
            notes: 'Measure 4 peripheral ROIs and center ROI. Report max difference from center.',
            description: 'Check image uniformity across phantom'
          },
          {
            id: 4,
            testName: 'Artifact Evaluation',
            testType: 'passfail',
            tolerance: 'Pass',
            units: '',
            notes: 'Visual inspection for streaks, rings, shading, or other artifacts.',
            description: 'Visual assessment for image artifacts'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // CT Annual QC for Houma CT
      {
        id: 'houma-ct-annual-001',
        title: 'Houma CT Annual QC Protocol',
        modality: 'CT',
        frequency: 'annual',
        description: 'Annual quality control tests for Houma CT scanner',
        assignedMachines: ['CT-HOU-001'], // Canon Aquilion Prime
        isWorksheet: true,
        startDate: '2025-08-07',
        tests: [
          {
            id: 1,
            testName: 'Complete System Calibration',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'Factory specifications must be met',
            description: 'Full system calibration verification'
          },
          {
            id: 2,
            testName: 'Radiation Safety Certification',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'Pass radiation safety tests',
            description: 'Radiation safety compliance check'
          },
          {
            id: 3,
            testName: 'Electrical Safety Testing',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'Pass electrical safety tests',
            description: 'Electrical safety verification'
          },
          {
            id: 4,
            testName: 'Mechanical Safety Verification',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'All mechanical systems safe',
            description: 'Mechanical safety system check'
          },
          {
            id: 5,
            testName: 'Safety Systems Check',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'All safety systems must be functional',
            description: 'Comprehensive safety system verification'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Save to localStorage
    localStorage.setItem('qcWorksheets', JSON.stringify(sampleWorksheets));
    
    console.log('✅ Sample worksheets initialized:', sampleWorksheets.length, 'worksheets created');
    
    return sampleWorksheets;
  } catch (error) {
    console.error('Error initializing sample worksheets:', error);
    return [];
  }
};

// Call this function to initialize sample worksheets
export const ensureSampleWorksheets = () => {
  try {
    let worksheets = initializeSampleWorksheets();
    
    // If worksheets already existed, check if Houma CT worksheet is missing and add it
    const existingWorksheets = JSON.parse(localStorage.getItem('qcWorksheets') || '[]');
    const hasHoumaWorksheet = existingWorksheets.some(ws => 
      ws.id === 'houma-ct-annual-001' || 
      (ws.assignedMachines && ws.assignedMachines.includes('CT-HOU-001') && ws.frequency === 'annual')
    );
    
    if (!hasHoumaWorksheet) {
      console.log('🔧 Adding missing Houma CT annual worksheet...');
      const houmaWorksheet = {
        id: 'houma-ct-annual-001',
        title: 'Houma CT Annual QC Protocol',
        modality: 'CT',
        frequency: 'annual',
        description: 'Annual quality control tests for Houma CT scanner',
        assignedMachines: ['CT-HOU-001'],
        isWorksheet: true,
        startDate: '2025-08-07',
        tests: [
          {
            id: 1,
            testName: 'Complete System Calibration',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'Factory specifications must be met',
            description: 'Full system calibration verification'
          },
          {
            id: 2,
            testName: 'Radiation Safety Certification', 
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'Pass radiation safety tests',
            description: 'Radiation safety compliance check'
          },
          {
            id: 3,
            testName: 'Electrical Safety Testing',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'Pass electrical safety tests',
            description: 'Electrical safety verification'
          },
          {
            id: 4,
            testName: 'Mechanical Safety Verification',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'All mechanical systems safe',
            description: 'Mechanical safety system check'
          },
          {
            id: 5,
            testName: 'Safety Systems Check',
            testType: 'passfail',
            tolerance: 'Pass',
            units: 'pass/fail',
            notes: 'All safety systems must be functional',
            description: 'Comprehensive safety system verification'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedWorksheets = [...existingWorksheets, houmaWorksheet];
      localStorage.setItem('qcWorksheets', JSON.stringify(updatedWorksheets));
      console.log('✅ Houma CT annual worksheet added successfully');
      worksheets = updatedWorksheets;
    }
    
    return worksheets;
  } catch (error) {
    console.error('Error ensuring sample worksheets:', error);
    return [];
  }
};

// Force reinitialize worksheets (useful for testing multiple worksheet scenarios)
export const reinitializeSampleWorksheets = () => {
  try {
    localStorage.removeItem('qcWorksheets');
    localStorage.removeItem('qcCompletions'); // Also clear any existing completions
    console.log('🔄 Clearing existing worksheets and completions...');
    
    const worksheets = initializeSampleWorksheets();
    console.log('✅ Sample worksheets reinitialized with multiple daily QCs for CT-GON-001');
    return worksheets;
  } catch (error) {
    console.error('Error reinitializing sample worksheets:', error);
    return [];
  }
};