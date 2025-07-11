const express = require('express');
const router = express.Router();

// QC worksheet templates by machine type and frequency
const worksheetTemplates = {
  MRI: {
    daily: [
      { name: 'Center Frequency Check', tolerance: '±0.1 MHz', units: 'MHz' },
      { name: 'Signal-to-Noise Ratio (SNR)', tolerance: '>100', units: 'ratio' },
      { name: 'Geometric Accuracy', tolerance: '±2mm', units: 'mm' },
      { name: 'Image Uniformity', tolerance: '<5% variation', units: '%' },
      { name: 'Artifact Assessment', tolerance: 'Visual inspection', units: 'pass/fail' },
      { name: 'RF Coil Check', tolerance: 'Visual inspection', units: 'pass/fail' }
    ],
    weekly: [
      { name: 'Table Positioning', tolerance: '±1mm', units: 'mm' },
      { name: 'Setup and Scanning', tolerance: 'Visual inspection', units: 'pass/fail' },
      { name: 'Center (Central) Frequency', tolerance: '±0.1 MHz', units: 'MHz' },
      { name: 'Transmitter Gain or Attenuation', tolerance: '±10%', units: '%' },
      { name: 'Geometric Accuracy', tolerance: '±2mm', units: 'mm' },
      { name: 'High Contrast (Spatial) Resolution', tolerance: '>0.7 lp/mm', units: 'lp/mm' },
      { name: 'Low Contrast Resolution (Detectability)', tolerance: 'Visual assessment', units: 'pass/fail' },
      { name: 'Artifact Analysis', tolerance: 'Visual inspection', units: 'pass/fail' },
      { name: 'Film (Hardcopy Image) QC', tolerance: 'Visual inspection', units: 'pass/fail' },
      { name: 'Visual Checklist', tolerance: 'Complete checklist', units: 'pass/fail' }
    ],
    monthly: [
      { name: 'Slice Position Accuracy', tolerance: '±5mm or ±10% slice thickness', units: 'mm' },
      { name: 'Slice Thickness Accuracy', tolerance: '±30% of nominal thickness', units: 'mm' },
      { name: 'Field Homogeneity', tolerance: '<10 ppm over 40cm sphere', units: 'ppm' },
      { name: 'Gradient Calibration', tolerance: '±5%', units: '%' },
      { name: 'Transmit Gain Calibration', tolerance: '±10%', units: '%' },
      { name: 'Magnetic Field Drift', tolerance: '<0.1 ppm/hour', units: 'ppm/hr' },
      { name: 'Helium Level Check', tolerance: 'Above minimum level', units: 'level' },
      { name: 'Cold Head Temperature', tolerance: 'Per manufacturer spec', units: '°C' }
    ],
    quarterly: [
      { name: 'Comprehensive System Check', tolerance: 'All parameters within spec', units: 'pass/fail' },
      { name: 'Safety System Verification', tolerance: 'All systems functional', units: 'pass/fail' },
      { name: 'Preventive Maintenance Review', tolerance: 'Current with schedule', units: 'pass/fail' }
    ],
    annual: [
      { name: 'Full System Calibration', tolerance: 'Factory specifications', units: 'pass/fail' },
      { name: 'Magnet Shimming Verification', tolerance: 'Optimized field uniformity', units: 'pass/fail' },
      { name: 'Safety System Certification', tolerance: 'All safety systems certified', units: 'pass/fail' },
      { name: 'Electrical Safety Testing', tolerance: 'Pass electrical safety tests', units: 'pass/fail' },
      { name: 'Fire Safety System Check', tolerance: 'Fire suppression operational', units: 'pass/fail' }
    ]
  },
  CT: {
    daily: [
      { name: 'Warm-up Procedure', tolerance: '15-30 minutes', units: 'minutes' },
      { name: 'CT Number Accuracy (Water)', tolerance: '0 ± 5 HU', units: 'HU' },
      { name: 'Image Noise Assessment', tolerance: '<0.5% coefficient of variation', units: '%' },
      { name: 'Artifact Check', tolerance: 'Visual inspection', units: 'pass/fail' },
      { name: 'Table Movement Accuracy', tolerance: '±1mm', units: 'mm' },
      { name: 'Laser Alignment', tolerance: '±2mm', units: 'mm' }
    ],
    weekly: [
      { name: 'Extended Warm-up Check', tolerance: 'Complete warm-up cycle', units: 'pass/fail' },
      { name: 'Multiple kVp CT Number Check', tolerance: '±10 HU variation', units: 'HU' },
      { name: 'Detector Uniformity', tolerance: '<5% variation', units: '%' },
      { name: 'Beam Hardening Assessment', tolerance: 'Visual inspection', units: 'pass/fail' },
      { name: 'Gantry Positioning Accuracy', tolerance: '±1°', units: 'degrees' }
    ],
    monthly: [
      { name: 'CT Number Linearity', tolerance: '±10 HU for each material', units: 'HU' },
      { name: 'Spatial Resolution (MTF)', tolerance: '>0.7 lp/mm', units: 'lp/mm' },
      { name: 'Low Contrast Detectability', tolerance: 'System dependent', units: 'contrast' },
      { name: 'Slice Thickness Verification', tolerance: '±1mm or ±50% nominal', units: 'mm' },
      { name: 'Patient Dose Verification', tolerance: '±20% of baseline', units: 'mGy' },
      { name: 'kVp Accuracy', tolerance: '±5 kVp', units: 'kVp' },
      { name: 'mA Linearity', tolerance: '±10%', units: '%' },
      { name: 'Timer Accuracy', tolerance: '±10%', units: '%' }
    ],
    quarterly: [
      { name: 'Comprehensive Performance Test', tolerance: 'All parameters within spec', units: 'pass/fail' },
      { name: 'Radiation Safety Survey', tolerance: 'Below regulatory limits', units: 'pass/fail' },
      { name: 'Emergency Procedures Review', tolerance: 'Staff trained and current', units: 'pass/fail' }
    ],
    annual: [
      { name: 'Complete System Calibration', tolerance: 'Factory specifications', units: 'pass/fail' },
      { name: 'Radiation Safety Certification', tolerance: 'Pass radiation safety tests', units: 'pass/fail' },
      { name: 'Electrical Safety Testing', tolerance: 'Pass electrical safety tests', units: 'pass/fail' },
      { name: 'Mechanical Safety Verification', tolerance: 'All mechanical systems safe', units: 'pass/fail' }
    ]
  },
  PET: {
    daily: [
      { name: 'Daily Normalization', tolerance: '10-30 minutes', units: 'minutes' },
      { name: 'Coincidence Timing Resolution', tolerance: '<600 ps FWHM', units: 'ps' },
      { name: 'Energy Resolution Check', tolerance: '<15% FWHM at 511 keV', units: '%' },
      { name: 'Detector Efficiency', tolerance: '<5% variation', units: '%' },
      { name: 'CT Warm-up', tolerance: '15-30 minutes', units: 'minutes' },
      { name: 'PET/CT Alignment Check', tolerance: '<3mm', units: 'mm' }
    ],
    weekly: [
      { name: 'Extended Normalization', tolerance: 'Complete normalization', units: 'pass/fail' },
      { name: 'Detector Block Assessment', tolerance: 'All blocks functional', units: 'pass/fail' },
      { name: 'Attenuation Correction Check', tolerance: '<5% error', units: '%' },
      { name: 'Scatter Correction Verification', tolerance: 'Within manufacturer spec', units: 'pass/fail' }
    ],
    monthly: [
      { name: 'Sensitivity Measurement', tolerance: '±10% of baseline', units: '%' },
      { name: 'Spatial Resolution Test', tolerance: '<8mm FWHM', units: 'mm' },
      { name: 'Count Rate Performance', tolerance: '<10% at clinical rates', units: '%' },
      { name: 'Image Quality Phantom', tolerance: 'NEMA specifications', units: 'pass/fail' },
      { name: 'Attenuation Correction Accuracy', tolerance: '<10% error in activity', units: '%' },
      { name: 'SUV Calibration', tolerance: '±10% of true value', units: '%' },
      { name: 'Cross-calibration with Dose Calibrator', tolerance: '±10% agreement', units: '%' }
    ],
    quarterly: [
      { name: 'Comprehensive PET Performance', tolerance: 'All NEMA tests pass', units: 'pass/fail' },
      { name: 'Radiation Safety Survey', tolerance: 'Below regulatory limits', units: 'pass/fail' },
      { name: 'Emergency Procedures Review', tolerance: 'Staff trained and current', units: 'pass/fail' }
    ],
    annual: [
      { name: 'Complete System Calibration', tolerance: 'Factory specifications', units: 'pass/fail' },
      { name: 'Radiation Safety Certification', tolerance: 'Pass radiation safety tests', units: 'pass/fail' },
      { name: 'Electrical Safety Testing', tolerance: 'Pass electrical safety tests', units: 'pass/fail' },
      { name: 'NEMA Acceptance Testing', tolerance: 'All NEMA tests pass', units: 'pass/fail' }
    ]
  },
  'PET-CT': {
    daily: [
      { name: 'PET Daily Normalization', tolerance: '10-30 minutes', units: 'minutes' },
      { name: 'CT Warm-up Procedure', tolerance: '15-30 minutes', units: 'minutes' },
      { name: 'PET/CT Alignment Check', tolerance: '<3mm', units: 'mm' },
      { name: 'CT Number Accuracy (Water)', tolerance: '0 ± 5 HU', units: 'HU' },
      { name: 'PET Detector Efficiency', tolerance: '<5% variation', units: '%' },
      { name: 'System Integration Check', tolerance: 'All systems synchronized', units: 'pass/fail' }
    ],
    weekly: [
      { name: 'Extended PET Normalization', tolerance: 'Complete normalization', units: 'pass/fail' },
      { name: 'CT Extended Warm-up', tolerance: 'Complete warm-up cycle', units: 'pass/fail' },
      { name: 'Multi-modality Registration', tolerance: '<2mm misregistration', units: 'mm' },
      { name: 'Attenuation Correction Accuracy', tolerance: '<5% error', units: '%' }
    ],
    monthly: [
      { name: 'PET Sensitivity Measurement', tolerance: '±10% of baseline', units: '%' },
      { name: 'CT Spatial Resolution', tolerance: '>0.7 lp/mm', units: 'lp/mm' },
      { name: 'PET/CT Image Quality', tolerance: 'NEMA specifications', units: 'pass/fail' },
      { name: 'SUV Calibration', tolerance: '±10% of true value', units: '%' },
      { name: 'Cross-calibration Check', tolerance: '±10% agreement', units: '%' }
    ],
    quarterly: [
      { name: 'Comprehensive System Performance', tolerance: 'All parameters within spec', units: 'pass/fail' },
      { name: 'Radiation Safety Survey', tolerance: 'Below regulatory limits', units: 'pass/fail' },
      { name: 'Emergency Procedures Review', tolerance: 'Staff trained and current', units: 'pass/fail' }
    ],
    annual: [
      { name: 'Complete System Calibration', tolerance: 'Factory specifications', units: 'pass/fail' },
      { name: 'Radiation Safety Certification', tolerance: 'Pass radiation safety tests', units: 'pass/fail' },
      { name: 'Electrical Safety Testing', tolerance: 'Pass electrical safety tests', units: 'pass/fail' },
      { name: 'NEMA Acceptance Testing', tolerance: 'All NEMA tests pass', units: 'pass/fail' }
    ]
  },
  'X-Ray': {
    daily: [
      { name: 'Visual Inspection', tolerance: 'No visible damage', units: 'pass/fail' },
      { name: 'Collimator Light Alignment', tolerance: '±2mm', units: 'mm' },
      { name: 'Exposure Indicator Check', tolerance: 'Within manufacturer spec', units: 'pass/fail' },
      { name: 'Image Receptor Function', tolerance: 'No artifacts', units: 'pass/fail' }
    ],
    weekly: [
      { name: 'kVp Accuracy Check', tolerance: '±5 kVp', units: 'kVp' },
      { name: 'Beam Alignment', tolerance: '±2mm', units: 'mm' },
      { name: 'Filtration Check', tolerance: 'Proper filtration in place', units: 'pass/fail' },
      { name: 'Exposure Time Accuracy', tolerance: '±10%', units: '%' }
    ],
    monthly: [
      { name: 'Half-Value Layer (HVL)', tolerance: 'Per regulatory requirements', units: 'mm Al' },
      { name: 'Beam Quality Assessment', tolerance: 'Within specifications', units: 'pass/fail' },
      { name: 'Automatic Exposure Control', tolerance: '±20% consistency', units: '%' },
      { name: 'Image Quality Assessment', tolerance: 'Acceptable image quality', units: 'pass/fail' }
    ],
    quarterly: [
      { name: 'Radiation Output Constancy', tolerance: '±10% of baseline', units: '%' },
      { name: 'Radiation Safety Survey', tolerance: 'Below regulatory limits', units: 'pass/fail' },
      { name: 'Emergency Procedures Review', tolerance: 'Staff trained and current', units: 'pass/fail' }
    ],
    annual: [
      { name: 'Complete System Calibration', tolerance: 'Factory specifications', units: 'pass/fail' },
      { name: 'Radiation Safety Certification', tolerance: 'Pass radiation safety tests', units: 'pass/fail' },
      { name: 'Electrical Safety Testing', tolerance: 'Pass electrical safety tests', units: 'pass/fail' },
      { name: 'Mechanical Safety Verification', tolerance: 'All mechanical systems safe', units: 'pass/fail' }
    ]
  },
  Ultrasound: {
    daily: [
      { name: 'Visual Inspection', tolerance: 'No visible damage', units: 'pass/fail' },
      { name: 'Transducer Check', tolerance: 'All transducers functional', units: 'pass/fail' },
      { name: 'System Boot-up', tolerance: 'Normal startup sequence', units: 'pass/fail' },
      { name: 'Image Display Check', tolerance: 'Proper image display', units: 'pass/fail' }
    ],
    weekly: [
      { name: 'Image Uniformity', tolerance: '<5% variation', units: '%' },
      { name: 'Depth Calibration', tolerance: '±2mm', units: 'mm' },
      { name: 'Transducer Sensitivity', tolerance: 'Within manufacturer spec', units: 'pass/fail' },
      { name: 'Doppler Function Check', tolerance: 'All Doppler modes functional', units: 'pass/fail' }
    ],
    monthly: [
      { name: 'Comprehensive Phantom Test', tolerance: 'All phantom tests pass', units: 'pass/fail' },
      { name: 'Measurement Accuracy', tolerance: '±5% or ±2mm', units: 'mm' },
      { name: 'Transducer Frequency Response', tolerance: 'Within specifications', units: 'pass/fail' },
      { name: 'System Performance Review', tolerance: 'All functions operational', units: 'pass/fail' }
    ],
    quarterly: [
      { name: 'Comprehensive System Check', tolerance: 'All parameters within spec', units: 'pass/fail' },
      { name: 'Transducer Inspection', tolerance: 'No damage or wear', units: 'pass/fail' },
      { name: 'Safety System Verification', tolerance: 'All safety systems functional', units: 'pass/fail' }
    ],
    annual: [
      { name: 'Complete System Calibration', tolerance: 'Factory specifications', units: 'pass/fail' },
      { name: 'Electrical Safety Testing', tolerance: 'Pass electrical safety tests', units: 'pass/fail' },
      { name: 'Mechanical Safety Verification', tolerance: 'All mechanical systems safe', units: 'pass/fail' },
      { name: 'Preventive Maintenance Review', tolerance: 'Current with schedule', units: 'pass/fail' }
    ]
  },
  Mammography: {
    daily: [
      { name: 'Visual Inspection', tolerance: 'No visible damage', units: 'pass/fail' },
      { name: 'Phantom Image Check', tolerance: 'All test objects visible', units: 'pass/fail' },
      { name: 'Compression Force Test', tolerance: '111-200 N (25-45 lbf)', units: 'N' },
      { name: 'Automatic Exposure Control', tolerance: '±30% consistency', units: '%' },
      { name: 'Collimation Assessment', tolerance: 'Proper field limitation', units: 'pass/fail' }
    ],
    weekly: [
      { name: 'Phantom Image Quality', tolerance: 'All fibers/masses visible', units: 'pass/fail' },
      { name: 'Artifact Evaluation', tolerance: 'No artifacts present', units: 'pass/fail' },
      { name: 'Compression Paddle Check', tolerance: 'Proper alignment', units: 'pass/fail' },
      { name: 'Density Control Check', tolerance: 'Within ±0.30 OD', units: 'OD' }
    ],
    monthly: [
      { name: 'Phantom Image Analysis', tolerance: 'ACR standards met', units: 'pass/fail' },
      { name: 'Compression Force Accuracy', tolerance: '±22 N (±5 lbf)', units: 'N' },
      { name: 'Compression Paddle Deflection', tolerance: '<1.0 cm at 150 N', units: 'cm' },
      { name: 'kVp Accuracy', tolerance: '±2 kVp', units: 'kVp' },
      { name: 'Beam Quality Assessment', tolerance: 'HVL within spec', units: 'mm Al' },
      { name: 'Automatic Exposure Control', tolerance: 'Within ±30% variation', units: '%' },
      { name: 'Uniformity of Screen Speed', tolerance: '±30% variation', units: '%' },
      { name: 'Breast Entrance Exposure', tolerance: '<3.0 mGy (300 mrad)', units: 'mGy' }
    ],
    quarterly: [
      { name: 'Repeat Analysis', tolerance: '<5% overall repeat rate', units: '%' },
      { name: 'Analysis of Fixer Retention', tolerance: '<5.0 μg/cm²', units: 'μg/cm²' },
      { name: 'Darkroom Fog', tolerance: '<0.05 OD', units: 'OD' }
    ],
    annual: [
      { name: 'Complete System Calibration', tolerance: 'Factory specifications', units: 'pass/fail' },
      { name: 'Radiation Safety Survey', tolerance: 'Below regulatory limits', units: 'pass/fail' },
      { name: 'Mechanical Safety Testing', tolerance: 'All safety systems functional', units: 'pass/fail' },
      { name: 'Electrical Safety Testing', tolerance: 'Pass electrical safety tests', units: 'pass/fail' },
      { name: 'Compression System Evaluation', tolerance: 'All components functional', units: 'pass/fail' }
    ]
  }
};

// Get worksheet template for specific machine type and frequency
router.get('/:machineType/:frequency', (req, res) => {
  const { machineType, frequency } = req.params;
  
  try {
    const template = worksheetTemplates[machineType];
    if (!template) {
      return res.status(404).json({ error: 'Machine type not found' });
    }
    
    const tests = template[frequency];
    if (!tests) {
      return res.status(404).json({ error: 'Frequency not found for this machine type' });
    }
    
    res.json(tests);
  } catch (error) {
    console.error('Error retrieving worksheet template:', error);
    res.status(500).json({ error: 'Failed to retrieve worksheet template' });
  }
});

// Get all available frequencies for a machine type
router.get('/:machineType/frequencies', (req, res) => {
  const { machineType } = req.params;
  
  try {
    const template = worksheetTemplates[machineType];
    if (!template) {
      return res.status(404).json({ error: 'Machine type not found' });
    }
    
    const frequencies = Object.keys(template);
    res.json(frequencies);
  } catch (error) {
    console.error('Error retrieving frequencies:', error);
    res.status(500).json({ error: 'Failed to retrieve frequencies' });
  }
});

// Get all available machine types
router.get('/', (req, res) => {
  try {
    const machineTypes = Object.keys(worksheetTemplates);
    res.json(machineTypes);
  } catch (error) {
    console.error('Error retrieving machine types:', error);
    res.status(500).json({ error: 'Failed to retrieve machine types' });
  }
});

module.exports = router;