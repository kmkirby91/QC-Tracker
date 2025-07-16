// ACR-Standard QC Templates
// This creates ACR-compliant QC templates for CT and MR modalities

export const clearAllQCData = () => {
  // Clear all existing QC data
  localStorage.removeItem('qcWorksheets');
  localStorage.removeItem('qcModalityTemplates');
  localStorage.removeItem('qcCustomTemplates');
  
  console.log('✅ All QC worksheets and templates cleared');
  console.log('✅ All machine assignments removed');
  
  return {
    cleared: true,
    worksheetsRemoved: true,
    templatesRemoved: true,
    assignmentsRemoved: true
  };
};

export const createACRTemplates = () => {
  // Clear existing data first
  clearAllQCData();
  
  const templates = [];
  
  // ================== DAILY CT QC TEMPLATE (ACR Standard) ==================
  const ctDailyTemplate = {
    id: Date.now() + 1,
    title: 'ACR CT Daily QC Protocol',
    modality: 'CT',
    frequency: 'daily',
    description: 'Daily quality control tests for CT scanners following ACR Technical Standard for Diagnostic Medical Physics Performance Monitoring',
    tests: [
      {
        id: 1,
        testName: 'CT Number Accuracy (Water)',
        testType: 'value',
        tolerance: '±5 HU',
        units: 'HU',
        notes: 'Use water-equivalent phantom. Measure ROI in center of water section. Report mean CT number.',
        description: 'Verify CT number accuracy for water-equivalent material (ACR requirement: 0 ± 5 HU)'
      },
      {
        id: 2,
        testName: 'Image Noise',
        testType: 'value',
        tolerance: '≤6.0 HU',
        units: 'HU (SD)',
        notes: 'Standard deviation in uniform water region. ROI should be >200 pixels, avoid edges.',
        description: 'Measure image noise in water phantom (ACR requirement: ≤6.0 HU standard deviation)'
      },
      {
        id: 3,
        testName: 'Uniformity',
        testType: 'value',
        tolerance: '±5 HU',
        units: 'HU',
        notes: 'Measure 4 peripheral ROIs and center ROI. Report max difference from center.',
        description: 'Check image uniformity across phantom (ACR requirement: ±5 HU from center)'
      },
      {
        id: 4,
        testName: 'Artifact Evaluation',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Visual inspection for streaks, rings, shading, or other artifacts. Document any observed.',
        description: 'Visual assessment for image artifacts that could affect diagnostic quality'
      },
      {
        id: 5,
        testName: 'Patient Positioning Laser Accuracy',
        testType: 'value',
        tolerance: '±2 mm',
        units: 'mm',
        notes: 'Check sagittal and coronal laser alignment with phantom markers.',
        description: 'Verify positioning laser accuracy (ACR requirement: ±2 mm)'
      },
      {
        id: 6,
        testName: 'Table Movement Accuracy',
        testType: 'value',
        tolerance: '±1 mm',
        units: 'mm',
        notes: 'Test table incremental movements at multiple positions.',
        description: 'Verify table positioning accuracy for patient setup'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ================== DAILY MR QC TEMPLATE (ACR Standard) ==================
  const mrDailyTemplate = {
    id: Date.now() + 2,
    title: 'ACR MR Daily QC Protocol',
    modality: 'MRI',
    frequency: 'daily',
    description: 'Daily quality control tests for MR scanners following ACR Guidance Document on MR Safe Practices',
    tests: [
      {
        id: 1,
        testName: 'Center Frequency',
        testType: 'value',
        tolerance: '±3 Hz',
        units: 'Hz',
        notes: 'Automated system measurement. Document center frequency drift from baseline.',
        description: 'Monitor RF center frequency stability (ACR recommendation: ±3 Hz from baseline)'
      },
      {
        id: 2,
        testName: 'Transmitter Gain/Attenuation',
        testType: 'value',
        tolerance: '±1 dB',
        units: 'dB',
        notes: 'Automated system check of RF transmitter calibration.',
        description: 'Verify RF transmitter gain stability'
      },
      {
        id: 3,
        testName: 'System SNR Check',
        testType: 'value',
        tolerance: '±10%',
        units: '%',
        notes: 'Use standard phantom. Compare to baseline established during acceptance testing.',
        description: 'Monitor overall system signal-to-noise ratio performance'
      },
      {
        id: 4,
        testName: 'Image Quality Visual Assessment',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Visual inspection for artifacts, ghosting, or distortion using ACR phantom.',
        description: 'Visual assessment of image quality using standardized phantom'
      },
      {
        id: 5,
        testName: 'Patient Positioning Laser Accuracy',
        testType: 'value',
        tolerance: '±2 mm',
        units: 'mm',
        notes: 'Check laser alignment with phantom grid markers.',
        description: 'Verify positioning laser accuracy for patient setup'
      },
      {
        id: 6,
        testName: 'Emergency Systems Check',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Test emergency stop, patient communication, and monitoring systems.',
        description: 'Verify all emergency and safety systems are functional'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ================== ANNUAL CT QC TEMPLATE (ACR Standard) ==================
  const ctAnnualTemplate = {
    id: Date.now() + 3,
    title: 'ACR CT Annual QC Protocol',
    modality: 'CT',
    frequency: 'annual',
    description: 'Annual quality control tests for CT scanners following ACR Technical Standard for Diagnostic Medical Physics Performance Monitoring',
    tests: [
      {
        id: 1,
        testName: 'Spatial Resolution (High Contrast)',
        testType: 'value',
        tolerance: '≥12 lp/cm',
        units: 'lp/cm',
        notes: 'Use ACR phantom or equivalent. Measure limiting spatial resolution.',
        description: 'Assess high contrast spatial resolution capability'
      },
      {
        id: 2,
        testName: 'Low Contrast Resolution',
        testType: 'value',
        tolerance: '≥6 mm at 0.5%',
        units: 'mm',
        notes: 'Use ACR phantom. Document smallest visible object at 0.5% contrast.',
        description: 'Evaluate low contrast detectability performance'
      },
      {
        id: 3,
        testName: 'Slice Thickness Accuracy',
        testType: 'value',
        tolerance: '±1 mm',
        units: 'mm',
        notes: 'Measure actual slice thickness using ramp phantom or equivalent.',
        description: 'Verify slice thickness accuracy across range of selections'
      },
      {
        id: 4,
        testName: 'CT Number Linearity',
        testType: 'value',
        tolerance: '±5 HU',
        units: 'HU',
        notes: 'Measure multiple materials (air, water, bone-equivalent). Check linearity.',
        description: 'Verify CT number accuracy across range of tissue densities'
      },
      {
        id: 5,
        testName: 'Dose Profile (CTDI)',
        testType: 'value',
        tolerance: '±20%',
        units: 'mGy',
        notes: 'Measure CTDI using standard phantoms. Compare to baseline and DRLs.',
        description: 'Monitor radiation dose output and profile'
      },
      {
        id: 6,
        testName: 'Patient Dose Assessment',
        testType: 'value',
        tolerance: 'Document',
        units: 'mGy·cm',
        notes: 'Review DLP values for common protocols. Compare to diagnostic reference levels.',
        description: 'Annual review of patient dose metrics and optimization'
      },
      {
        id: 7,
        testName: 'Image Quality Index',
        testType: 'value',
        tolerance: 'Document',
        units: '',
        notes: 'Comprehensive image quality assessment including noise, uniformity, artifacts.',
        description: 'Overall system performance evaluation'
      },
      {
        id: 8,
        testName: 'Safety Systems Check',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Test all safety interlocks, emergency stops, and warning systems.',
        description: 'Comprehensive safety systems verification'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ================== ANNUAL MR QC TEMPLATE (ACR Standard) ==================
  const mrAnnualTemplate = {
    id: Date.now() + 4,
    title: 'ACR MR Annual QC Protocol',
    modality: 'MRI',
    frequency: 'annual',
    description: 'Annual quality control tests for MR scanners following ACR Guidance Document on MR Safe Practices and Technical Standards',
    tests: [
      {
        id: 1,
        testName: 'Geometric Accuracy',
        testType: 'value',
        tolerance: '±2 mm',
        units: 'mm',
        notes: 'Use ACR phantom. Measure geometric distortion in multiple planes.',
        description: 'Assess geometric accuracy and distortion (ACR requirement: ±2 mm)'
      },
      {
        id: 2,
        testName: 'Spatial Resolution',
        testType: 'value',
        tolerance: '≥1 mm',
        units: 'mm',
        notes: 'Measure limiting spatial resolution using ACR phantom or equivalent.',
        description: 'Evaluate spatial resolution performance'
      },
      {
        id: 3,
        testName: 'Slice Thickness Accuracy',
        testType: 'value',
        tolerance: '±1 mm',
        units: 'mm',
        notes: 'Verify slice thickness accuracy across range of selections.',
        description: 'Confirm slice selection and thickness accuracy'
      },
      {
        id: 4,
        testName: 'Signal-to-Noise Ratio',
        testType: 'value',
        tolerance: '±20%',
        units: '',
        notes: 'Measure SNR using ACR phantom. Compare to baseline from acceptance.',
        description: 'Monitor system SNR performance over time'
      },
      {
        id: 5,
        testName: 'Image Uniformity',
        testType: 'value',
        tolerance: '≥87.5%',
        units: '%',
        notes: 'Measure signal uniformity across image using ACR phantom.',
        description: 'Assess image uniformity (ACR requirement: ≥87.5%)'
      },
      {
        id: 6,
        testName: 'Ghosting/Aliasing',
        testType: 'value',
        tolerance: '≤2.5%',
        units: '%',
        notes: 'Measure ghosting artifacts using ACR phantom methodology.',
        description: 'Evaluate ghosting and aliasing artifacts'
      },
      {
        id: 7,
        testName: 'Low Contrast Object Detectability',
        testType: 'value',
        tolerance: '≥9 objects',
        units: 'objects',
        notes: 'Count visible objects in ACR phantom low contrast section.',
        description: 'Assess low contrast resolution capability'
      },
      {
        id: 8,
        testName: 'Safety Systems Annual Check',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Comprehensive test of all MR safety systems, zones, and emergency procedures.',
        description: 'Annual verification of all MR safety systems and protocols'
      },
      {
        id: 9,
        testName: 'RF Safety (SAR) Assessment',
        testType: 'value',
        tolerance: 'Within limits',
        units: 'W/kg',
        notes: 'Review SAR calculations and verify safety limits are maintained.',
        description: 'Annual review of RF safety and SAR compliance'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ================== QUARTERLY DOSE CALIBRATOR QC TEMPLATE ==================
  const doseCalQuarterlyTemplate = {
    id: Date.now() + 5,
    title: 'Dose Calibrator Quarterly QC Protocol',
    modality: 'Dose Calibrator',
    frequency: 'quarterly',
    description: 'Quarterly quality control tests for dose calibrators following NRC and FDA requirements',
    tests: [
      {
        id: 1,
        testName: 'Linearity Test',
        testType: 'value',
        tolerance: '±5%',
        units: '%',
        notes: 'Use decay series or shielded sources. Test from 10 μCi to highest setting. Plot activity vs time.',
        description: 'Verify linearity of response across full range of activities'
      },
      {
        id: 2,
        testName: 'Accuracy Test',
        testType: 'value',
        tolerance: '±5%',
        units: '%',
        notes: 'Use NIST-traceable reference sources. Test multiple isotopes (Tc-99m, I-131, F-18).',
        description: 'Verify accuracy against known reference standards'
      },
      {
        id: 3,
        testName: 'Precision Test',
        testType: 'value',
        tolerance: 'CV ≤5%',
        units: '%',
        notes: 'Perform 10 repeated measurements. Calculate coefficient of variation.',
        description: 'Assess measurement precision and repeatability'
      },
      {
        id: 4,
        testName: 'Geometry Test',
        testType: 'value',
        tolerance: '±5%',
        units: '%',
        notes: 'Test various sample volumes and geometries. Document correction factors.',
        description: 'Verify consistent response for different sample configurations'
      },
      {
        id: 5,
        testName: 'Background Radiation Check',
        testType: 'value',
        tolerance: 'Document',
        units: 'μCi',
        notes: 'Measure background with empty chamber. Should be <5 μCi or <1% of measurement.',
        description: 'Monitor background radiation levels'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ================== ANNUAL DOSE CALIBRATOR QC TEMPLATE ==================
  const doseCalAnnualTemplate = {
    id: Date.now() + 6,
    title: 'Dose Calibrator Annual QC Protocol',
    modality: 'Dose Calibrator',
    frequency: 'annual',
    description: 'Annual quality control tests for dose calibrators following NRC regulatory requirements',
    tests: [
      {
        id: 1,
        testName: 'Comprehensive Linearity Test',
        testType: 'value',
        tolerance: '±5%',
        units: '%',
        notes: 'Extended linearity test covering full range. Use multiple isotopes and decay series.',
        description: 'Comprehensive linearity verification across all operating ranges'
      },
      {
        id: 2,
        testName: 'Accuracy Verification',
        testType: 'value',
        tolerance: '±5%',
        units: '%',
        notes: 'Use multiple NIST-traceable sources. Test all commonly used isotopes.',
        description: 'Annual verification of measurement accuracy'
      },
      {
        id: 3,
        testName: 'Constancy Check',
        testType: 'value',
        tolerance: '±5%',
        units: '%',
        notes: 'Long-term stability assessment. Compare with historical data.',
        description: 'Evaluate long-term measurement stability'
      },
      {
        id: 4,
        testName: 'Voltage Stability Test',
        testType: 'value',
        tolerance: '±2%',
        units: '%',
        notes: 'Test operating voltage variations. Verify stable operation across range.',
        description: 'Assess voltage stability and regulation'
      },
      {
        id: 5,
        testName: 'Environmental Conditions',
        testType: 'value',
        tolerance: 'Document',
        units: '°C, %RH',
        notes: 'Document temperature and humidity during testing. Verify within specifications.',
        description: 'Record environmental conditions during QC testing'
      },
      {
        id: 6,
        testName: 'Calibration Verification',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Verify calibration settings for all isotopes. Update if necessary.',
        description: 'Annual verification of all isotope calibration factors'
      },
      {
        id: 7,
        testName: 'Safety Systems Check',
        testType: 'passfail',
        tolerance: 'Pass',
        units: '',
        notes: 'Test all safety interlocks, alarms, and emergency procedures.',
        description: 'Comprehensive safety systems verification'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ================== DAILY MAMMOGRAPHY QC TEMPLATE (ACR Standard) ==================
  const mammographyDailyTemplate = {
    id: Date.now() + 7,
    title: 'ACR Mammography Daily QC Protocol',
    modality: 'Mammography',
    frequency: 'daily',
    description: 'Daily quality control tests for mammography systems following ACR Mammography Quality Control Manual',
    tests: [
      {
        id: 1,
        testName: 'Phantom Image Quality Assessment',
        testType: 'visual',
        tolerance: 'Pass',
        units: '',
        notes: 'Use ACR mammography phantom. Evaluate image quality including fibers, specks, and masses. All structures should be visible.',
        description: 'Visual assessment of ACR mammography phantom image quality'
      },
      {
        id: 2,
        testName: 'Automatic Exposure Control (AEC) Function',
        testType: 'value',
        tolerance: '±15%',
        units: 'mAs',
        notes: 'Test AEC reproducibility with different breast thicknesses. Use tissue-equivalent phantoms.',
        description: 'Verify AEC system provides consistent exposure across different breast thicknesses'
      },
      {
        id: 3,
        testName: 'Breast Thickness Compensation',
        testType: 'value',
        tolerance: '±1 cm',
        units: 'cm',
        notes: 'Verify compression paddle position indicator accuracy. Check with various phantom thicknesses.',
        description: 'Ensure compression paddle position indicator accurately reflects breast thickness'
      },
      {
        id: 4,
        testName: 'kVp Accuracy and Reproducibility',
        testType: 'value',
        tolerance: '±2 kVp',
        units: 'kVp',
        notes: 'Measure kVp for all clinical techniques. Use calibrated kVp meter.',
        description: 'Verify X-ray tube voltage accuracy for all clinical kVp settings'
      },
      {
        id: 5,
        testName: 'Compression Force Check',
        testType: 'value',
        tolerance: '111-200 N',
        units: 'N',
        notes: 'Check compression force with calibrated force gauge. Verify power and manual compression modes.',
        description: 'Ensure compression force is within acceptable range for patient safety and image quality'
      },
      {
        id: 6,
        testName: 'Beam Quality (Half Value Layer)',
        testType: 'value',
        tolerance: '±10%',
        units: 'mm Al',
        notes: 'Measure HVL for all clinical kVp/filter combinations. Use precision aluminum filters.',
        description: 'Verify beam quality consistency and filtration effectiveness'
      }
    ],
    isWorksheet: false, // This is a template, not a worksheet
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add all templates to array
  templates.push(ctDailyTemplate, mrDailyTemplate, ctAnnualTemplate, mrAnnualTemplate, doseCalQuarterlyTemplate, doseCalAnnualTemplate, mammographyDailyTemplate);
  
  // Save templates to localStorage
  localStorage.setItem('qcModalityTemplates', JSON.stringify(templates));
  
  console.log('✅ ACR-Standard QC Templates Created:');
  console.log('   📅 Daily CT QC (6 tests)');
  console.log('   📅 Daily MR QC (6 tests)');
  console.log('   📅 Daily Mammography QC (6 tests)');
  console.log('   📊 Annual CT QC (8 tests)');
  console.log('   📊 Annual MR QC (9 tests)');
  console.log('   📊 Quarterly Dose Calibrator QC (5 tests)');
  console.log('   📊 Annual Dose Calibrator QC (7 tests)');
  console.log('📋 All templates follow ACR and NRC standards');
  console.log('🏥 No worksheets assigned - templates ready for use');
  
  return {
    templatesCreated: 7,
    worksheetsCreated: 0,
    machinesWithWorksheets: [],
    templates: [
      'ACR CT Daily QC Protocol',
      'ACR MR Daily QC Protocol', 
      'ACR Mammography Daily QC Protocol',
      'ACR CT Annual QC Protocol',
      'ACR MR Annual QC Protocol',
      'Dose Calibrator Quarterly QC Protocol',
      'Dose Calibrator Annual QC Protocol'
    ]
  };
};

// Function to check if ACR templates exist
export const checkAndInitializeACRTemplates = () => {
  const existingTemplates = localStorage.getItem('qcModalityTemplates');
  
  let needsInitialization = true;
  
  if (existingTemplates) {
    try {
      const templates = JSON.parse(existingTemplates);
      const hasACRTemplates = templates.some(t => t.title.includes('ACR'));
      
      if (hasACRTemplates && templates.length >= 4) {
        needsInitialization = false;
        console.log('ACR templates already exist');
      }
    } catch (error) {
      console.error('Error checking existing templates:', error);
    }
  }
  
  if (needsInitialization) {
    console.log('Initializing ACR-standard QC templates...');
    return createACRTemplates();
  }
  
  return null; // Templates already exist
};

// Force initialization for debugging
export const forceInitializeACRTemplates = () => {
  console.log('🔄 Forcing ACR template initialization...');
  return createACRTemplates();
};

// Legacy compatibility functions (updated to use ACR templates)
export const initializeSampleWorksheets = () => {
  return createACRTemplates();
};

export const checkAndInitializeSampleData = () => {
  return checkAndInitializeACRTemplates();
};

export const forceInitializeSampleData = () => {
  return forceInitializeACRTemplates();
};