import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DICOMSeriesSelector = ({ 
  machineId, 
  frequency, 
  modality, 
  selectedDate,
  onSeriesSelection,
  viewOnly = false 
}) => {
  const [availableSeries, setAvailableSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studyInfo, setStudyInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    if (machineId && selectedDate && !viewOnly) {
      fetchAvailableSeries();
    }
  }, [machineId, selectedDate, modality, viewOnly]);

  const fetchAvailableSeries = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual DICOM query
      // const response = await axios.get(`/api/dicom/series/${machineId}`, {
      //   params: {
      //     studyDate: selectedDate,
      //     modality: modality,
      //     patientId: 'QC_PHANTOM'
      //   }
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock DICOM series data based on modality
      const mockSeries = generateMockSeries(modality, selectedDate);
      
      setAvailableSeries(mockSeries.series);
      setStudyInfo(mockSeries.study);
      setConnectionStatus('connected'); // Would be based on actual connection
      setLastRefresh(new Date().toLocaleTimeString());
      
      console.log('Fetched DICOM series - placeholder data');
    } catch (error) {
      console.error('Error fetching DICOM series:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to fetch DICOM series');
    } finally {
      setLoading(false);
    }
  };

  const generateMockSeries = (modality, date) => {
    const baseStudy = {
      studyInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + Date.now(),
      studyDate: date,
      studyTime: '083000',
      patientId: 'QC_PHANTOM_001',
      patientName: 'QC^PHANTOM^DAILY',
      studyDescription: `${modality} Daily QC Study`,
      institutionName: 'Medical Center'
    };

    let series = [];

    switch (modality) {
      case 'CT':
        series = [
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 1),
            seriesNumber: 1,
            seriesDescription: 'QC Phantom Axial 5mm',
            imageCount: 50,
            sliceThickness: 5.0,
            kvp: 120,
            mas: 200,
            reconstructionKernel: 'STANDARD',
            requiredFor: ['CT Number Accuracy (Water)', 'Image Noise', 'Uniformity'],
            recommended: true,
            analysisType: 'primary'
          },
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 2),
            seriesNumber: 2,
            seriesDescription: 'QC Phantom Axial 1mm',
            imageCount: 200,
            sliceThickness: 1.0,
            kvp: 120,
            mas: 300,
            reconstructionKernel: 'SHARP',
            requiredFor: ['Spatial Resolution', 'Slice Thickness'],
            recommended: false,
            analysisType: 'secondary'
          },
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 3),
            seriesNumber: 3,
            seriesDescription: 'Low Contrast Phantom',
            imageCount: 25,
            sliceThickness: 5.0,
            kvp: 120,
            mas: 400,
            reconstructionKernel: 'STANDARD',
            requiredFor: ['Low Contrast Resolution'],
            recommended: false,
            analysisType: 'optional'
          }
        ];
        break;

      case 'MRI':
        series = [
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 1),
            seriesNumber: 1,
            seriesDescription: 'T1 SE Axial QC Phantom',
            imageCount: 30,
            sliceThickness: 5.0,
            tr: 500,
            te: 15,
            flipAngle: 90,
            requiredFor: ['SNR Measurement', 'Uniformity', 'Geometric Accuracy'],
            recommended: true,
            analysisType: 'primary'
          },
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 2),
            seriesNumber: 2,
            seriesDescription: 'T2 FSE Axial QC Phantom',
            imageCount: 30,
            sliceThickness: 5.0,
            tr: 4000,
            te: 100,
            flipAngle: 90,
            requiredFor: ['Image Quality Assessment', 'Ghosting Analysis'],
            recommended: true,
            analysisType: 'primary'
          },
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 3),
            seriesNumber: 3,
            seriesDescription: 'Gradient Echo Axial',
            imageCount: 30,
            sliceThickness: 5.0,
            tr: 100,
            te: 5,
            flipAngle: 30,
            requiredFor: ['Frequency Stability'],
            recommended: false,
            analysisType: 'optional'
          }
        ];
        break;

      case 'MRI':
      case 'PET':
      case 'PET-CT':
        series = [
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 1),
            seriesNumber: 1,
            seriesDescription: `${modality} QC Phantom`,
            imageCount: 50,
            sliceThickness: 3.0,
            requiredFor: ['Daily QC Analysis'],
            recommended: true,
            analysisType: 'primary'
          }
        ];
        break;

      default:
        series = [
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 1),
            seriesNumber: 1,
            seriesDescription: 'QC Phantom Study',
            imageCount: 1,
            requiredFor: ['Quality Control'],
            recommended: true,
            analysisType: 'primary'
          }
        ];
    }

    return { study: baseStudy, series };
  };

  const handleSeriesToggle = (seriesUID) => {
    const newSelected = selectedSeries.includes(seriesUID)
      ? selectedSeries.filter(id => id !== seriesUID)
      : [...selectedSeries, seriesUID];
    
    setSelectedSeries(newSelected);
    
    // Notify parent component of selection changes
    if (onSeriesSelection) {
      const selectedSeriesData = availableSeries.filter(series => 
        newSelected.includes(series.seriesInstanceUID)
      );
      onSeriesSelection(selectedSeriesData);
    }
  };

  const getSeriesTypeColor = (analysisType) => {
    switch (analysisType) {
      case 'primary': return 'bg-green-900/30 border-green-600 text-green-200';
      case 'secondary': return 'bg-blue-900/30 border-blue-600 text-blue-200';
      case 'optional': return 'bg-gray-900/30 border-gray-600 text-gray-300';
      default: return 'bg-gray-900/30 border-gray-600 text-gray-300';
    }
  };

  const getSeriesTypeIcon = (analysisType) => {
    switch (analysisType) {
      case 'primary': return '🎯';
      case 'secondary': return '📊';
      case 'optional': return '🔍';
      default: return '📋';
    }
  };

  if (viewOnly) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
          🖼️ DICOM Images (View Only)
        </h3>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-300 text-sm">
            In actual QC performance, users would select DICOM series from this section for automated analysis.
            The selected series would be used to automatically calculate QC measurements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center">
          🖼️ DICOM Images
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            connectionStatus === 'connected' ? 'bg-green-900 text-green-200' :
            'bg-red-900 text-red-200'
          }`}>
            {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Last: {lastRefresh}
            </span>
          )}
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <span className="text-red-400 text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="text-red-400 font-medium">DICOM Connection Required</h4>
              <p className="text-red-300 text-sm mt-1">
                This feature requires DICOM connectivity to fetch QC phantom images for automated analysis.
                Contact your IT administrator to configure DICOM services.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={fetchAvailableSeries}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 Checking...' : '🔄 Retry Connection'}
            </button>
          </div>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <>
          {/* Study Information */}
          {studyInfo && (
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-4">
              <h4 className="text-blue-300 font-medium mb-2">📋 Study Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-blue-400">Patient ID:</span>
                  <div className="text-blue-200">{studyInfo.patientId}</div>
                </div>
                <div>
                  <span className="text-blue-400">Study Date:</span>
                  <div className="text-blue-200">{studyInfo.studyDate}</div>
                </div>
                <div>
                  <span className="text-blue-400">Study Time:</span>
                  <div className="text-blue-200">{studyInfo.studyTime}</div>
                </div>
                <div>
                  <span className="text-blue-400">Description:</span>
                  <div className="text-blue-200">{studyInfo.studyDescription}</div>
                </div>
              </div>
            </div>
          )}

          {/* Series Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-gray-200 font-medium">Available Series for Analysis</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchAvailableSeries}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '🔄 Loading...' : '🔄 Refresh'}
                </button>
                <span className="text-xs text-gray-400">
                  {availableSeries.length} series found
                </span>
              </div>
            </div>

            {loading ? (
              <div className="bg-gray-700 rounded-lg p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
                  <span className="text-gray-300">Querying DICOM database...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {availableSeries.map((series) => (
                  <div
                    key={series.seriesInstanceUID}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedSeries.includes(series.seriesInstanceUID)
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            id={series.seriesInstanceUID}
                            checked={selectedSeries.includes(series.seriesInstanceUID)}
                            onChange={() => handleSeriesToggle(series.seriesInstanceUID)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getSeriesTypeIcon(series.analysisType)}</span>
                            <span className="font-medium text-gray-200">
                              Series {series.seriesNumber}: {series.seriesDescription}
                            </span>
                            {series.recommended && (
                              <span className="px-2 py-1 bg-green-900 text-green-200 text-xs rounded-full">
                                Recommended
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full ${getSeriesTypeColor(series.analysisType)}`}>
                              {series.analysisType}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-400 mb-2">
                            {series.imageCount} images • {series.sliceThickness}mm slice thickness
                            {modality === 'CT' && (
                              <> • {series.kvp}kVp • {series.mas}mAs • {series.reconstructionKernel}</>
                            )}
                            {modality === 'MRI' && series.tr && (
                              <> • TR:{series.tr}ms • TE:{series.te}ms • FA:{series.flipAngle}°</>
                            )}
                          </div>
                          
                          {series.requiredFor && series.requiredFor.length > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-400">Required for:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {series.requiredFor.map((test, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-purple-900/30 border border-purple-600 text-purple-200 text-xs rounded"
                                  >
                                    {test}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <button
                          className="px-3 py-1 bg-gray-600 text-gray-200 text-xs rounded hover:bg-gray-500 transition-colors"
                          title="Preview Series"
                        >
                          👁️ Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {availableSeries.length === 0 && (
                  <div className="bg-gray-700 rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">📂</div>
                    <h4 className="text-gray-200 font-medium mb-2">No DICOM Series Found</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      No QC phantom studies found for {modality} on {selectedDate}.
                      Please verify that QC images have been acquired and sent to PACS.
                    </p>
                    <button
                      onClick={fetchAvailableSeries}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      🔄 Refresh Search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Selection Summary */}
            {selectedSeries.length > 0 && (
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mt-4">
                <h4 className="text-green-300 font-medium mb-2">✅ Selected for Analysis</h4>
                <div className="text-sm text-green-200">
                  {selectedSeries.length} series selected for automated QC analysis.
                  These images will be processed to automatically calculate measurement values.
                </div>
                <div className="mt-2 text-xs text-green-300">
                  Selected Series: {availableSeries
                    .filter(s => selectedSeries.includes(s.seriesInstanceUID))
                    .map(s => `Series ${s.seriesNumber}`)
                    .join(', ')}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Future Enhancement Notice */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-gray-100 font-medium mb-2">🚧 Planned Enhancements</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Real-time DICOM image preview and ROI visualization</li>
          <li>• Automatic series recommendation based on QC protocol</li>
          <li>• Multi-vendor DICOM format support</li>
          <li>• Series quality validation before analysis</li>
          <li>• Integration with PACS worklist and study routing</li>
        </ul>
      </div>
    </div>
    );
};

export default DICOMSeriesSelector;