// QC Analysis Code Registry
// This defines all available automated QC analysis codes that can be assigned to tests

export const QC_ANALYSIS_CODES = {
  // CT Analysis Codes
  'uniformity5ROI': {
    id: 'uniformity5ROI',
    name: 'Uniformity (5 ROI Analysis)',
    description: 'Automated 5-point ROI analysis for CT uniformity testing',
    modalities: ['CT'],
    phantomTypes: ['ACR CT', 'Catphan', 'Generic CT'],
    requiredDicom: true,
    outputMetrics: [
      'Center HU',
      'Center Standard Deviation',
      '12:00 HU', 
      '12:00 Standard Deviation',
      '3:00 HU',
      '3:00 Standard Deviation', 
      '6:00 HU',
      '6:00 Standard Deviation',
      '9:00 HU',
      '9:00 Standard Deviation',
      'Uniformity Index',
      'Maximum Deviation'
    ],
    parameters: {
      roiSize: { default: 20, unit: 'pixels', description: 'ROI diameter in pixels' },
      centerOffset: { default: 0, unit: 'mm', description: 'Center ROI offset from image center' },
      peripheralDistance: { default: 100, unit: 'pixels', description: 'Distance from center to peripheral ROIs' }
    }
  },
  
  'noise_analysis': {
    id: 'noise_analysis',
    name: 'Noise Analysis',
    description: 'Automated image noise calculation using multiple ROI measurements',
    modalities: ['CT', 'MRI'],
    phantomTypes: ['ACR CT', 'ACR MRI', 'Catphan', 'Generic'],
    requiredDicom: true,
    outputMetrics: [
      'Mean Noise (SD)',
      'SNR',
      'CNR (if applicable)',
      'Noise Power Spectrum'
    ],
    parameters: {
      roiSize: { default: 50, unit: 'pixels', description: 'ROI diameter for noise measurement' },
      numROIs: { default: 5, unit: 'count', description: 'Number of ROIs for noise averaging' },
      backgroundROI: { default: true, unit: 'boolean', description: 'Include background ROI for CNR calculation' }
    }
  },

  'spatial_resolution': {
    id: 'spatial_resolution',
    name: 'Spatial Resolution (MTF)',
    description: 'Automated MTF calculation using edge or wire phantom',
    modalities: ['CT', 'MRI', 'Mammography'],
    phantomTypes: ['ACR CT', 'ACR MRI', 'ACR Mammography', 'Edge Phantom'],
    requiredDicom: true,
    outputMetrics: [
      'MTF at 10%',
      'MTF at 50%', 
      'MTF at 2%',
      'Limiting Resolution',
      'Edge Spread Function Width'
    ],
    parameters: {
      edgeAngle: { default: 5, unit: 'degrees', description: 'Expected edge angle from vertical' },
      oversamplingFactor: { default: 4, unit: 'factor', description: 'Oversampling factor for MTF calculation' },
      roiWidth: { default: 100, unit: 'pixels', description: 'ROI width for edge analysis' }
    }
  },

  'contrast_detectability': {
    id: 'contrast_detectability',
    name: 'Low Contrast Detectability',
    description: 'Automated low contrast object detection and measurement',
    modalities: ['CT', 'MRI'],
    phantomTypes: ['ACR CT', 'ACR MRI', 'Catphan'],
    requiredDicom: true,
    outputMetrics: [
      'Smallest Visible Contrast (%)',
      'Contrast-to-Noise Ratio',
      'Visibility Index',
      'Threshold Contrast'
    ],
    parameters: {
      contrastLevels: { default: [1, 0.5, 0.3], unit: 'percent', description: 'Contrast levels to analyze' },
      objectSize: { default: 6, unit: 'mm', description: 'Size of contrast objects' },
      backgroundROI: { default: 100, unit: 'pixels', description: 'Background ROI size' }
    }
  },

  // MRI Analysis Codes
  'snr_analysis_mri': {
    id: 'snr_analysis_mri',
    name: 'MRI SNR Analysis',
    description: 'Signal-to-noise ratio calculation for MRI using dual acquisition or background method',
    modalities: ['MRI'],
    phantomTypes: ['ACR MRI', 'Generic MRI'],
    requiredDicom: true,
    outputMetrics: [
      'Signal-to-Noise Ratio',
      'Mean Signal Intensity',
      'Background Noise',
      'Noise Standard Deviation'
    ],
    parameters: {
      method: { default: 'background', unit: 'string', description: 'SNR calculation method: background or subtraction' },
      signalROI: { default: 50, unit: 'pixels', description: 'Signal ROI diameter' },
      noiseROI: { default: 50, unit: 'pixels', description: 'Background noise ROI diameter' }
    }
  },

  'geometric_accuracy': {
    id: 'geometric_accuracy',
    name: 'Geometric Accuracy',
    description: 'Automated geometric distortion and accuracy measurement',
    modalities: ['MRI', 'CT'],
    phantomTypes: ['ACR MRI', 'ACR CT', 'Geometric Phantom'],
    requiredDicom: true,
    outputMetrics: [
      'Horizontal Distance Error (mm)',
      'Vertical Distance Error (mm)', 
      'Diagonal Distance Error (mm)',
      'Maximum Distortion (%)',
      'RMS Geometric Error'
    ],
    parameters: {
      expectedDistance: { default: 190, unit: 'mm', description: 'Expected phantom dimension' },
      tolerancePercent: { default: 2, unit: 'percent', description: 'Geometric tolerance percentage' },
      measurementPoints: { default: 4, unit: 'count', description: 'Number of measurement points' }
    }
  },

  // Mammography Analysis Codes
  'mammography_snr': {
    id: 'mammography_snr',
    name: 'Mammography SNR/CNR',
    description: 'Signal-to-noise and contrast-to-noise ratio for mammography',
    modalities: ['Mammography'],
    phantomTypes: ['ACR Mammography', 'CDMAM'],
    requiredDicom: true,
    outputMetrics: [
      'Signal-to-Noise Ratio',
      'Contrast-to-Noise Ratio',
      'Glandular Dose Estimate',
      'Image Quality Factor'
    ],
    parameters: {
      exposureFactors: { default: 'auto', unit: 'string', description: 'Exposure factor detection method' },
      tissueEquivalence: { default: 'acrylic', unit: 'string', description: 'Tissue equivalent material' },
      roiSize: { default: 30, unit: 'pixels', description: 'ROI size for measurements' }
    }
  },

  // Generic Analysis Codes
  'custom_roi_analysis': {
    id: 'custom_roi_analysis',
    name: 'Custom ROI Analysis',
    description: 'User-defined ROI analysis with configurable parameters',
    modalities: ['CT', 'MRI', 'Mammography', 'X-Ray'],
    phantomTypes: ['Any'],
    requiredDicom: true,
    outputMetrics: [
      'ROI Mean Value',
      'ROI Standard Deviation',
      'ROI Min/Max',
      'ROI Area',
      'Custom Calculated Metrics'
    ],
    parameters: {
      roiShape: { default: 'circular', unit: 'string', description: 'ROI shape: circular, rectangular, or freeform' },
      roiSize: { default: 50, unit: 'pixels', description: 'ROI size' },
      numROIs: { default: 1, unit: 'count', description: 'Number of ROIs' },
      customCalculation: { default: '', unit: 'formula', description: 'Custom calculation formula' }
    }
  }
};

// Helper functions
export const getAnalysisCodesByModality = (modality) => {
  return Object.values(QC_ANALYSIS_CODES).filter(code => 
    code.modalities.includes(modality)
  );
};

export const getAnalysisCodeById = (id) => {
  return QC_ANALYSIS_CODES[id] || null;
};

export const getAnalysisCodeOptions = (modality = null) => {
  const codes = modality 
    ? getAnalysisCodesByModality(modality)
    : Object.values(QC_ANALYSIS_CODES);
    
  return [
    { value: '', label: 'No automated analysis' },
    ...codes.map(code => ({
      value: code.id,
      label: code.name,
      description: code.description,
      requiresDicom: code.requiredDicom
    }))
  ];
};

export const isValidAnalysisCode = (codeId, modality = null) => {
  const code = getAnalysisCodeById(codeId);
  if (!code) return false;
  
  if (modality && !code.modalities.includes(modality)) {
    return false;
  }
  
  return true;
};