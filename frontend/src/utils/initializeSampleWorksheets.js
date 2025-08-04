// Initialize sample worksheets to test the QC status dashboard
// This creates worksheets that match the backend's sample assignments

export const initializeSampleWorksheets = () => {
  try {
    const existingWorksheets = localStorage.getItem('qcWorksheets');
    
    // Only initialize if no worksheets exist
    if (existingWorksheets) {
      const worksheets = JSON.parse(existingWorksheets);
      if (worksheets.length > 0) {
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
        assignedMachines: ['MRI-GON-001'], // GE SIGNA Premier
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
        assignedMachines: ['MRI-GON-001'], // GE SIGNA Premier
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
  const worksheets = initializeSampleWorksheets();
  return worksheets;
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