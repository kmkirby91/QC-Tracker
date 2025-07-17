import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DICOMTemplateConfig = ({ 
  modality = '', 
  frequency = '', 
  onSeriesConfigChange,
  initialConfig = []
}) => {
  const [seriesConfigs, setSeriesConfigs] = useState(initialConfig.length > 0 ? initialConfig : [
    {
      id: Date.now(),
      name: '',
      description: '',
      requiredFor: [],
      priority: 'required',
      dicomCriteria: {
        seriesDescription: '',
        stationName: '',
        protocolName: '',
        modality: modality,
        bodyPartExamined: '',
        scanningSequence: '',
        sequenceVariant: '',
        acquisitionType: '',
        sliceThickness: '',
        repetitionTime: '',
        echoTime: '',
        flipAngle: '',
        kvp: '',
        exposureTime: '',
        xRayTubeCurrent: '',
        filterType: '',
        compressionForce: '',
        viewPosition: '',
        customTags: []
      }
    }
  ]);

  const addSeriesConfig = () => {
    const newConfig = {
      id: Date.now(),
      name: '',
      description: '',
      requiredFor: [],
      priority: 'optional',
      dicomCriteria: {
        seriesDescription: '',
        stationName: '',
        protocolName: '',
        modality: modality,
        bodyPartExamined: '',
        scanningSequence: '',
        sequenceVariant: '',
        acquisitionType: '',
        sliceThickness: '',
        repetitionTime: '',
        echoTime: '',
        flipAngle: '',
        kvp: '',
        exposureTime: '',
        xRayTubeCurrent: '',
        filterType: '',
        compressionForce: '',
        viewPosition: '',
        customTags: []
      }
    };
    
    const updated = [...seriesConfigs, newConfig];
    setSeriesConfigs(updated);
    onSeriesConfigChange(updated);
  };

  const removeSeriesConfig = (id) => {
    if (seriesConfigs.length <= 1) {
      toast.error('Template must have at least one DICOM series configuration');
      return;
    }
    
    const updated = seriesConfigs.filter(config => config.id !== id);
    setSeriesConfigs(updated);
    onSeriesConfigChange(updated);
  };

  const updateSeriesConfig = (id, field, value) => {
    const updated = seriesConfigs.map(config => 
      config.id === id ? { ...config, [field]: value } : config
    );
    setSeriesConfigs(updated);
    onSeriesConfigChange(updated);
  };

  const updateDicomCriteria = (id, field, value) => {
    const updated = seriesConfigs.map(config => 
      config.id === id ? { 
        ...config, 
        dicomCriteria: { ...config.dicomCriteria, [field]: value }
      } : config
    );
    setSeriesConfigs(updated);
    onSeriesConfigChange(updated);
  };

  const addCustomTag = (id) => {
    const updated = seriesConfigs.map(config => 
      config.id === id ? {
        ...config,
        dicomCriteria: {
          ...config.dicomCriteria,
          customTags: [...config.dicomCriteria.customTags, { 
            tag: '', 
            customTag: '', 
            value: '', 
            matchType: 'exact',
            description: '' 
          }]
        }
      } : config
    );
    setSeriesConfigs(updated);
    onSeriesConfigChange(updated);
  };

  const updateCustomTag = (seriesId, tagIndex, field, value) => {
    const updated = seriesConfigs.map(config => 
      config.id === seriesId ? {
        ...config,
        dicomCriteria: {
          ...config.dicomCriteria,
          customTags: config.dicomCriteria.customTags.map((tag, index) =>
            index === tagIndex ? { ...tag, [field]: value } : tag
          )
        }
      } : config
    );
    setSeriesConfigs(updated);
    onSeriesConfigChange(updated);
  };

  // Common DICOM tags organized by category
  const getCommonDicomTags = () => {
    return [
      // Study Information
      { value: '0008,0020', label: 'Study Date (0008,0020)', category: 'Study Information' },
      { value: '0008,0030', label: 'Study Time (0008,0030)', category: 'Study Information' },
      { value: '0008,0050', label: 'Accession Number (0008,0050)', category: 'Study Information' },
      { value: '0008,1030', label: 'Study Description (0008,1030)', category: 'Study Information' },
      { value: '0020,000D', label: 'Study Instance UID (0020,000D)', category: 'Study Information' },
      { value: '0020,0010', label: 'Study ID (0020,0010)', category: 'Study Information' },
      
      // Series Information
      { value: '0008,103E', label: 'Series Description (0008,103E)', category: 'Series Information' },
      { value: '0020,000E', label: 'Series Instance UID (0020,000E)', category: 'Series Information' },
      { value: '0020,0011', label: 'Series Number (0020,0011)', category: 'Series Information' },
      { value: '0020,0012', label: 'Acquisition Number (0020,0012)', category: 'Series Information' },
      { value: '0020,0013', label: 'Instance Number (0020,0013)', category: 'Series Information' },
      
      // Equipment Information
      { value: '0008,0060', label: 'Modality (0008,0060)', category: 'Equipment Information' },
      { value: '0008,0070', label: 'Manufacturer (0008,0070)', category: 'Equipment Information' },
      { value: '0008,0080', label: 'Institution Name (0008,0080)', category: 'Equipment Information' },
      { value: '0008,1010', label: 'Station Name (0008,1010)', category: 'Equipment Information' },
      { value: '0008,1090', label: 'Manufacturer Model Name (0008,1090)', category: 'Equipment Information' },
      { value: '0018,1000', label: 'Device Serial Number (0018,1000)', category: 'Equipment Information' },
      { value: '0018,1020', label: 'Software Version (0018,1020)', category: 'Equipment Information' },
      
      // Patient Information
      { value: '0010,0010', label: 'Patient Name (0010,0010)', category: 'Patient Information' },
      { value: '0010,0020', label: 'Patient ID (0010,0020)', category: 'Patient Information' },
      { value: '0010,0030', label: 'Patient Birth Date (0010,0030)', category: 'Patient Information' },
      { value: '0010,0040', label: 'Patient Sex (0010,0040)', category: 'Patient Information' },
      { value: '0018,5100', label: 'Patient Position (0018,5100)', category: 'Patient Information' },
      
      // Acquisition Parameters
      { value: '0018,0015', label: 'Body Part Examined (0018,0015)', category: 'Acquisition Parameters' },
      { value: '0018,0050', label: 'Slice Thickness (0018,0050)', category: 'Acquisition Parameters' },
      { value: '0018,1030', label: 'Protocol Name (0018,1030)', category: 'Acquisition Parameters' },
      { value: '0018,0088', label: 'Spacing Between Slices (0018,0088)', category: 'Acquisition Parameters' },
      
      // CT Parameters
      { value: '0018,0060', label: 'kVp (0018,0060)', category: 'CT Parameters' },
      { value: '0018,1150', label: 'Exposure Time (0018,1150)', category: 'CT Parameters' },
      { value: '0018,1151', label: 'X-ray Tube Current (0018,1151)', category: 'CT Parameters' },
      { value: '0018,1152', label: 'Exposure (0018,1152)', category: 'CT Parameters' },
      { value: '0018,1160', label: 'Filter Type (0018,1160)', category: 'CT Parameters' },
      { value: '0018,1190', label: 'Focal Spot Size (0018,1190)', category: 'CT Parameters' },
      { value: '0018,1200', label: 'Date of Last Calibration (0018,1200)', category: 'CT Parameters' },
      { value: '0018,1210', label: 'Convolution Kernel (0018,1210)', category: 'CT Parameters' },
      { value: '0018,1100', label: 'Reconstruction Diameter (0018,1100)', category: 'CT Parameters' },
      { value: '0018,1120', label: 'Gantry/Detector Tilt (0018,1120)', category: 'CT Parameters' },
      { value: '0018,1140', label: 'Rotation Direction (0018,1140)', category: 'CT Parameters' },
      
      // MR Parameters
      { value: '0018,0080', label: 'Repetition Time (0018,0080)', category: 'MR Parameters' },
      { value: '0018,0081', label: 'Echo Time (0018,0081)', category: 'MR Parameters' },
      { value: '0018,0087', label: 'Magnetic Field Strength (0018,0087)', category: 'MR Parameters' },
      { value: '0018,0091', label: 'Echo Train Length (0018,0091)', category: 'MR Parameters' },
      { value: '0018,1314', label: 'Flip Angle (0018,1314)', category: 'MR Parameters' },
      { value: '0018,1316', label: 'SAR (0018,1316)', category: 'MR Parameters' },
      
      // Image Properties
      { value: '0020,0032', label: 'Image Position Patient (0020,0032)', category: 'Image Properties' },
      { value: '0020,0037', label: 'Image Orientation Patient (0020,0037)', category: 'Image Properties' },
      { value: '0020,1040', label: 'Position Reference Indicator (0020,1040)', category: 'Image Properties' },
      { value: '0028,0010', label: 'Rows (0028,0010)', category: 'Image Properties' },
      { value: '0028,0011', label: 'Columns (0028,0011)', category: 'Image Properties' },
      { value: '0028,0030', label: 'Pixel Spacing (0028,0030)', category: 'Image Properties' },
      { value: '0028,0100', label: 'Bits Allocated (0028,0100)', category: 'Image Properties' },
      { value: '0028,0101', label: 'Bits Stored (0028,0101)', category: 'Image Properties' },
      { value: '0028,0102', label: 'High Bit (0028,0102)', category: 'Image Properties' },
      { value: '0028,0103', label: 'Pixel Representation (0028,0103)', category: 'Image Properties' },
      { value: '0028,1050', label: 'Window Center (0028,1050)', category: 'Image Properties' },
      { value: '0028,1051', label: 'Window Width (0028,1051)', category: 'Image Properties' },
      
      // Other
      { value: '0008,0090', label: 'Referring Physician Name (0008,0090)', category: 'Other' },
      { value: '0018,0090', label: 'Data Collection Diameter (0018,0090)', category: 'Other' },
      { value: 'other', label: 'Other (Enter Custom Tag)', category: 'Custom' }
    ];
  };

  const removeCustomTag = (seriesId, tagIndex) => {
    const updated = seriesConfigs.map(config => 
      config.id === seriesId ? {
        ...config,
        dicomCriteria: {
          ...config.dicomCriteria,
          customTags: config.dicomCriteria.customTags.filter((_, index) => index !== tagIndex)
        }
      } : config
    );
    setSeriesConfigs(updated);
    onSeriesConfigChange(updated);
  };

  const getModalitySpecificFields = () => {
    switch (modality) {
      case 'CT':
        return [
          { field: 'sliceThickness', label: 'Slice Thickness (mm)', placeholder: 'e.g., 5.0' },
          { field: 'kvp', label: 'kVp', placeholder: 'e.g., 120' },
          { field: 'exposureTime', label: 'Exposure Time (ms)', placeholder: 'e.g., 1000' },
          { field: 'xRayTubeCurrent', label: 'X-Ray Tube Current (mA)', placeholder: 'e.g., 200' },
          { field: 'filterType', label: 'Filter Type', placeholder: 'e.g., STANDARD' }
        ];
      case 'MRI':
        return [
          { field: 'scanningSequence', label: 'Scanning Sequence', placeholder: 'e.g., SE, GR, EP' },
          { field: 'sequenceVariant', label: 'Sequence Variant', placeholder: 'e.g., NONE, SK, MTC' },
          { field: 'sliceThickness', label: 'Slice Thickness (mm)', placeholder: 'e.g., 5.0' },
          { field: 'repetitionTime', label: 'Repetition Time (ms)', placeholder: 'e.g., 500' },
          { field: 'echoTime', label: 'Echo Time (ms)', placeholder: 'e.g., 15' },
          { field: 'flipAngle', label: 'Flip Angle (degrees)', placeholder: 'e.g., 90' }
        ];
      case 'Mammography':
        return [
          { field: 'viewPosition', label: 'View Position', placeholder: 'e.g., CC, MLO' },
          { field: 'kvp', label: 'kVp', placeholder: 'e.g., 28' },
          { field: 'compressionForce', label: 'Compression Force (daN)', placeholder: 'e.g., 15' },
          { field: 'exposureTime', label: 'Exposure Time (ms)', placeholder: 'e.g., AEC' },
          { field: 'filterType', label: 'Filter Type', placeholder: 'e.g., Rh/Rh, Mo/Mo' }
        ];
      default:
        return [
          { field: 'sliceThickness', label: 'Slice Thickness (mm)', placeholder: 'e.g., 5.0' },
          { field: 'kvp', label: 'kVp', placeholder: 'e.g., 120' }
        ];
    }
  };

  const getQCTestSuggestions = () => {
    switch (modality) {
      case 'CT':
        return [
          'CT Number Accuracy (Water)',
          'Image Noise',
          'Uniformity',
          'Spatial Resolution',
          'Slice Thickness',
          'Low Contrast Resolution',
          'Artifact Analysis'
        ];
      case 'MRI':
        return [
          'SNR Measurement',
          'Uniformity',
          'Geometric Accuracy',
          'Image Quality Assessment',
          'Ghosting Analysis',
          'Frequency Stability',
          'Slice Position Accuracy'
        ];
      case 'Mammography':
        return [
          'Phantom Image Quality Assessment',
          'Contrast Sensitivity Evaluation',
          'Spatial Resolution Test',
          'Automatic Exposure Control Performance',
          'Beam Quality Assessment',
          'Artifact Analysis'
        ];
      default:
        return [
          'Quality Control Analysis',
          'CT Number Accuracy (Water)',
          'Image Noise',
          'Uniformity',
          'SNR Measurement',
          'Geometric Accuracy',
          'Spatial Resolution',
          'Phantom Image Quality Assessment',
          'Artifact Analysis'
        ];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-200">DICOM Series Configuration</h4>
        <button
          onClick={addSeriesConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Series</span>
        </button>
      </div>

      {seriesConfigs.map((config, index) => (
        <div key={config.id} className="bg-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-lg font-medium text-gray-100">
              Series Configuration #{index + 1}
            </h5>
            {seriesConfigs.length > 1 && (
              <button
                onClick={() => removeSeriesConfig(config.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Remove
              </button>
            )}
          </div>

          {/* Basic Series Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Series Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateSeriesConfig(config.id, 'name', e.target.value)}
                placeholder="e.g., QC Phantom Axial 5mm"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={config.priority}
                onChange={(e) => updateSeriesConfig(config.id, 'priority', e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="required">Required</option>
                <option value="recommended">Recommended</option>
                <option value="optional">Optional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={config.description}
              onChange={(e) => updateSeriesConfig(config.id, 'description', e.target.value)}
              placeholder="Describe the purpose of this series and any special requirements..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* QC Tests This Series Enables */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              QC Tests This Series Enables
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {getQCTestSuggestions().map((test) => (
                <button
                  key={test}
                  onClick={() => {
                    const current = config.requiredFor || [];
                    const updated = current.includes(test) 
                      ? current.filter(t => t !== test)
                      : [...current, test];
                    updateSeriesConfig(config.id, 'requiredFor', updated);
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    config.requiredFor?.includes(test)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {test}
                </button>
              ))}
            </div>
          </div>

          {/* DICOM Identification Criteria */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h6 className="text-md font-medium text-gray-200 mb-3">DICOM Identification Criteria</h6>
            <div className="text-sm text-gray-400 mb-4">
              Specify DICOM tags that will be used to identify this series when querying the database.
            </div>

            {/* DICOM Criteria */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    DICOM Identification Criteria
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Add specific DICOM tags and values to identify this series
                  </p>
                </div>
                <button
                  onClick={() => addCustomTag(config.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  + Add Criteria
                </button>
              </div>
              
              {config.dicomCriteria.customTags.map((tag, tagIndex) => (
                <div key={tagIndex} className="space-y-2 mb-3 p-3 bg-gray-700 rounded">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">DICOM Tag</label>
                      <select
                        value={tag.tag}
                        onChange={(e) => updateCustomTag(config.id, tagIndex, 'tag', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select a DICOM tag...</option>
                        {Object.entries(
                          getCommonDicomTags().reduce((acc, tag) => {
                            if (!acc[tag.category]) acc[tag.category] = [];
                            acc[tag.category].push(tag);
                            return acc;
                          }, {})
                        ).map(([category, tags]) => (
                          <optgroup key={category} label={category}>
                            {tags.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Match Type</label>
                      <select
                        value={tag.matchType || 'exact'}
                        onChange={(e) => updateCustomTag(config.id, tagIndex, 'matchType', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="exact">Exact Match</option>
                        <option value="contains">Contains</option>
                        <option value="begins_with">Begins With</option>
                        <option value="ends_with">Ends With</option>
                        <option value="regex">Regular Expression</option>
                        <option value="not_equal">Not Equal</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Expected Value</label>
                      <input
                        type="text"
                        value={tag.value}
                        onChange={(e) => updateCustomTag(config.id, tagIndex, 'value', e.target.value)}
                        placeholder={
                          tag.matchType === 'exact' ? 'Exact value' :
                          tag.matchType === 'contains' ? 'Text to find' :
                          tag.matchType === 'begins_with' ? 'Starting text' :
                          tag.matchType === 'ends_with' ? 'Ending text' :
                          tag.matchType === 'regex' ? 'Regular expression' :
                          tag.matchType === 'not_equal' ? 'Value to exclude' :
                          tag.matchType === 'greater_than' ? 'Minimum value' :
                          tag.matchType === 'less_than' ? 'Maximum value' :
                          'Value to match'
                        }
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {tag.tag === 'other' && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-300 mb-1">Custom DICOM Tag</label>
                      <input
                        type="text"
                        value={tag.customTag || ''}
                        onChange={(e) => updateCustomTag(config.id, tagIndex, 'customTag', e.target.value)}
                        placeholder="e.g., 0018,0050"
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Enter the DICOM tag in format: group,element (e.g., 0018,0050)
                      </p>
                    </div>
                  )}
                  
                  {tag.matchType === 'regex' && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-300 p-2 bg-blue-900/20 rounded">
                        <strong>Regex examples:</strong> ^QC.*Phantom$ (starts with QC, ends with Phantom), 
                        \d{2,4} (2-4 digits), [ABC]_\w+ (A, B, or C followed by underscore and word chars)
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-2">
                      <label className="block text-xs text-gray-300 mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        value={tag.description}
                        onChange={(e) => updateCustomTag(config.id, tagIndex, 'description', e.target.value)}
                        placeholder="Description of this criteria"
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeCustomTag(config.id, tagIndex)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              {config.dicomCriteria.customTags.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-sm">No DICOM criteria added yet</p>
                  <p className="text-xs mt-1">Click "Add Criteria" to specify how to identify this series</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">📋 Configuration Summary</h4>
        <div className="text-sm text-blue-200">
          <p>This template defines {seriesConfigs.length} DICOM series configuration(s) for {modality ? `${modality} ` : ''}{frequency ? `${frequency} ` : ''}QC.</p>
          <p className="mt-2">
            When this template is used, the system will search for DICOM studies matching these criteria
            and present them to technologists for selection during QC performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DICOMTemplateConfig;