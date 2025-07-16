import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DICOMTemplateConfig = ({ 
  modality, 
  frequency, 
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
          customTags: [...config.dicomCriteria.customTags, { tag: '', value: '', description: '' }]
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
        return ['Quality Control Analysis'];
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Standard DICOM Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Series Description
                </label>
                <input
                  type="text"
                  value={config.dicomCriteria.seriesDescription}
                  onChange={(e) => updateDicomCriteria(config.id, 'seriesDescription', e.target.value)}
                  placeholder="e.g., QC Phantom Axial"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Station Name
                </label>
                <input
                  type="text"
                  value={config.dicomCriteria.stationName}
                  onChange={(e) => updateDicomCriteria(config.id, 'stationName', e.target.value)}
                  placeholder="e.g., CT01, MRI_SCANNER_1"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Protocol Name
                </label>
                <input
                  type="text"
                  value={config.dicomCriteria.protocolName}
                  onChange={(e) => updateDicomCriteria(config.id, 'protocolName', e.target.value)}
                  placeholder="e.g., QC_DAILY, Phantom_Protocol"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Body Part Examined
                </label>
                <input
                  type="text"
                  value={config.dicomCriteria.bodyPartExamined}
                  onChange={(e) => updateDicomCriteria(config.id, 'bodyPartExamined', e.target.value)}
                  placeholder="e.g., PHANTOM, BREAST, HEAD"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modality-Specific Fields */}
              {getModalitySpecificFields().map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={config.dicomCriteria[field]}
                    onChange={(e) => updateDicomCriteria(config.id, field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Custom DICOM Tags */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Custom DICOM Tags
                </label>
                <button
                  onClick={() => addCustomTag(config.id)}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                >
                  + Add Tag
                </button>
              </div>
              
              {config.dicomCriteria.customTags.map((tag, tagIndex) => (
                <div key={tagIndex} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    value={tag.tag}
                    onChange={(e) => updateCustomTag(config.id, tagIndex, 'tag', e.target.value)}
                    placeholder="DICOM Tag (e.g., 0018,0050)"
                    className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={tag.value}
                    onChange={(e) => updateCustomTag(config.id, tagIndex, 'value', e.target.value)}
                    placeholder="Expected Value"
                    className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tag.description}
                      onChange={(e) => updateCustomTag(config.id, tagIndex, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeCustomTag(config.id, tagIndex)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">📋 Configuration Summary</h4>
        <div className="text-sm text-blue-200">
          <p>This template defines {seriesConfigs.length} DICOM series configuration(s) for {modality} {frequency} QC.</p>
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