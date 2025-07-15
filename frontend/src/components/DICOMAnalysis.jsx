import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DICOMAnalysis = ({ machineId, frequency, worksheetData, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [availableStudies, setAvailableStudies] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'disconnected', 'connecting'

  useEffect(() => {
    // Check DICOM database connection on component mount
    checkDICOMConnection();
  }, []);

  const checkDICOMConnection = async () => {
    setConnectionStatus('connecting');
    try {
      // TODO: Implement actual DICOM database connection check
      // const response = await axios.get('/api/dicom/connection-status');
      
      // Placeholder for DICOM connection
      setTimeout(() => {
        setConnectionStatus('disconnected'); // Will be 'connected' when implemented
        console.log('DICOM database connection check - placeholder');
      }, 1000);
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('DICOM connection error:', error);
    }
  };

  const fetchAvailableStudies = async () => {
    try {
      // TODO: Implement DICOM study query
      // const response = await axios.get(`/api/dicom/studies/${machineId}?modality=${worksheetData?.modality}&date=today`);
      
      // Placeholder studies
      const mockStudies = [
        {
          id: 'STUDY001',
          patientId: 'QC_PHANTOM_001',
          studyDate: new Date().toISOString().split('T')[0],
          studyTime: '08:30:00',
          modality: worksheetData?.modality || 'CT',
          description: 'Daily QC Phantom Study',
          seriesCount: 3
        },
        {
          id: 'STUDY002', 
          patientId: 'QC_PHANTOM_001',
          studyDate: new Date().toISOString().split('T')[0],
          studyTime: '14:15:00',
          modality: worksheetData?.modality || 'CT',
          description: 'QC Uniformity Test',
          seriesCount: 1
        }
      ];
      
      setAvailableStudies(mockStudies);
      console.log('Fetched DICOM studies - placeholder data');
    } catch (error) {
      console.error('Error fetching DICOM studies:', error);
      toast.error('Failed to fetch DICOM studies');
    }
  };

  const analyzeSelectedStudy = async () => {
    if (!selectedStudy) {
      toast.error('Please select a study to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      // TODO: Implement actual DICOM analysis
      // const response = await axios.post('/api/dicom/analyze', {
      //   studyId: selectedStudy,
      //   machineId: machineId,
      //   analysisType: frequency,
      //   tests: worksheetData?.tests || []
      // });

      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock analysis results based on modality
      const mockResults = generateMockAnalysisResults(worksheetData?.modality || 'CT');
      
      setAnalysisResults(mockResults);
      
      // Notify parent component of analysis completion
      if (onAnalysisComplete) {
        onAnalysisComplete(mockResults);
      }
      
      toast.success('DICOM analysis completed');
      console.log('DICOM analysis completed - placeholder results');
      
    } catch (error) {
      console.error('DICOM analysis error:', error);
      toast.error('DICOM analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMockAnalysisResults = (modality) => {
    const baseResults = {
      studyId: selectedStudy,
      analysisDate: new Date().toISOString(),
      modality: modality
    };

    switch (modality) {
      case 'CT':
        return {
          ...baseResults,
          measurements: {
            'CT Number Accuracy (Water)': {
              value: -2.3,
              units: 'HU',
              tolerance: '±5 HU',
              status: 'pass',
              roi: { x: 256, y: 256, size: 50 }
            },
            'Image Noise': {
              value: 4.2,
              units: 'HU (SD)',
              tolerance: '≤6.0 HU',
              status: 'pass',
              roi: { x: 256, y: 256, size: 100 }
            },
            'Uniformity': {
              value: 3.1,
              units: 'HU',
              tolerance: '±5 HU',
              status: 'pass',
              measurements: {
                center: -2.3,
                top: 0.8,
                bottom: -0.5,
                left: 1.2,
                right: -1.8
              }
            }
          }
        };
        
      case 'MRI':
        return {
          ...baseResults,
          measurements: {
            'System SNR Check': {
              value: 95.2,
              units: '%',
              tolerance: '±10%',
              status: 'pass',
              baseline: 98.1
            },
            'Center Frequency': {
              value: 1.2,
              units: 'Hz',
              tolerance: '±3 Hz',
              status: 'pass',
              baseline: 0.0
            },
            'Image Quality Visual Assessment': {
              value: 'pass',
              units: '',
              tolerance: 'Pass',
              status: 'pass',
              artifacts: 'none detected'
            }
          }
        };
        
      default:
        return {
          ...baseResults,
          measurements: {
            'Automated Analysis': {
              value: 'pass',
              units: '',
              tolerance: 'Pass',
              status: 'pass'
            }
          }
        };
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center">
          🏥 DICOM Analysis
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          connectionStatus === 'connected' ? 'bg-green-900 text-green-200' :
          connectionStatus === 'connecting' ? 'bg-yellow-900 text-yellow-200' :
          'bg-red-900 text-red-200'
        }`}>
          {connectionStatus === 'connected' ? '🟢 Connected' :
           connectionStatus === 'connecting' ? '🟡 Connecting...' :
           '🔴 Disconnected'}
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <span className="text-red-400 text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="text-red-400 font-medium">DICOM Database Not Connected</h4>
              <p className="text-red-300 text-sm mt-1">
                This feature requires connection to a DICOM database for automatic QC value calculation.
                Contact your IT administrator to configure DICOM connectivity.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={checkDICOMConnection}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              🔄 Retry Connection
            </button>
          </div>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Available QC Studies
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedStudy}
                  onChange={(e) => setSelectedStudy(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a study...</option>
                  {availableStudies.map(study => (
                    <option key={study.id} value={study.id}>
                      {study.description} - {study.studyDate} {study.studyTime}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchAvailableStudies}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Refresh Studies"
                >
                  🔄
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedStudy && (
                  <span>Selected: {availableStudies.find(s => s.id === selectedStudy)?.description}</span>
                )}
              </div>
              <button
                onClick={analyzeSelectedStudy}
                disabled={!selectedStudy || isAnalyzing}
                className={`px-6 py-2 rounded font-medium transition-colors ${
                  !selectedStudy || isAnalyzing
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⚙️</span>
                    Analyzing DICOM...
                  </span>
                ) : (
                  '🔬 Analyze QC Values'
                )}
              </button>
            </div>
          </div>

          {analysisResults && (
            <div className="mt-6 bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-100 mb-3">Analysis Results</h4>
              <div className="space-y-3">
                {Object.entries(analysisResults.measurements).map(([testName, result]) => (
                  <div key={testName} className="flex items-center justify-between bg-gray-800 rounded p-3">
                    <div>
                      <span className="font-medium text-gray-100">{testName}</span>
                      <div className="text-sm text-gray-400">
                        Tolerance: {result.tolerance}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        result.status === 'pass' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.value} {result.units}
                      </div>
                      <div className={`text-sm ${
                        result.status === 'pass' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {result.status === 'pass' ? '✅ Pass' : '❌ Fail'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded">
                <div className="flex items-center text-blue-400 text-sm">
                  <span className="mr-2">💡</span>
                  <span>
                    These values have been automatically calculated from DICOM images. 
                    Review and accept to populate your QC worksheet.
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-gray-100 font-medium mb-2">🚧 Future Capabilities</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Automatic ROI placement and measurement</li>
          <li>• CT number accuracy calculation from water phantom</li>
          <li>• Noise and uniformity analysis</li>
          <li>• MRI SNR and frequency drift detection</li>
          <li>• Spatial resolution measurements</li>
          <li>• Integration with PACS/VNA systems</li>
          <li>• Historical trending and baseline comparison</li>
        </ul>
      </div>
    </div>
  );
};

export default DICOMAnalysis;