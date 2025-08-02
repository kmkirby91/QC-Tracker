import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DICOMSeriesSelector = ({ 
  machineId, 
  frequency, 
  modality, 
  selectedDate,
  onSeriesSelection,
  viewOnly = false,
  templateMode = false,
  templateData = null
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
      
      // Automatically select all series when they load
      const allSeriesUIDs = mockSeries.series.map(series => series.seriesInstanceUID);
      setSelectedSeries(allSeriesUIDs);
      
      // Notify parent component of automatic selection
      if (onSeriesSelection) {
        onSeriesSelection(mockSeries.series);
      }
      
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
            recommended: false,
            analysisType: 'optional'
          }
        ];
        break;

      case 'Mammography':
        series = [
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 1),
            seriesNumber: 1,
            seriesDescription: 'ACR Mammography Phantom CC',
            imageCount: 1,
            sliceThickness: 0.0,
            kvp: 28,
            mas: 'AEC',
            compression: '15 daN',
            recommended: true,
            analysisType: 'primary'
          },
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 2),
            seriesNumber: 2,
            seriesDescription: 'ACR Mammography Phantom MLO',
            imageCount: 1,
            sliceThickness: 0.0,
            kvp: 28,
            mas: 'AEC',
            compression: '15 daN',
            recommended: true,
            analysisType: 'primary'
          },
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 3),
            seriesNumber: 3,
            seriesDescription: 'Uniformity Test Images',
            imageCount: 4,
            sliceThickness: 0.0,
            kvp: 28,
            mas: 'AEC',
            compression: '15 daN',
            recommended: false,
            analysisType: 'secondary'
          }
        ];
        break;

      case 'PET':
      case 'PET-CT':
        series = [
          {
            seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.971.' + (Date.now() + 1),
            seriesNumber: 1,
            seriesDescription: `${modality} QC Phantom`,
            imageCount: 50,
            sliceThickness: 3.0,
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

  const handlePreviewSeries = (series) => {
    console.log('Opening DICOM viewer for series:', series.seriesDescription);
    
    try {
      // Open DICOM viewer in a new popup window with improved settings
      const windowFeatures = [
        'width=1400',
        'height=900', 
        'left=100',
        'top=100',
        'scrollbars=yes',
        'resizable=yes',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=no',
        'directories=no',
        'copyhistory=no'
      ].join(',');
      
      const viewerWindow = window.open(
        'about:blank', 
        `dicomViewer_${Date.now()}`, // Unique window name to allow multiple viewers
        windowFeatures
      );
      
      if (viewerWindow && !viewerWindow.closed) {
        // Create the HTML content for the viewer window
        const viewerHTML = createViewerHTML(series);
        viewerWindow.document.write(viewerHTML);
        viewerWindow.document.close();
        
        // Focus the new window
        viewerWindow.focus();
        
        console.log('DICOM viewer opened successfully in popup window');
        toast.success(`DICOM viewer opened for ${series.seriesDescription}`);
      } else {
        // Popup was blocked
        console.warn('Popup blocked or failed to open');
        toast.error('Popup blocked! Please allow popups for this site and try again.', {
          duration: 5000,
          icon: '🚫'
        });
        
        // Provide instructions
        setTimeout(() => {
          toast('💡 Tip: Look for popup blocker icon in address bar and click "Always allow"', {
            duration: 8000,
            icon: '💡'
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error opening DICOM viewer:', error);
      toast.error('Failed to open DICOM viewer. Please try again.');
    }
  };

  const handlePreviewSeriesNewTab = (series) => {
    console.log('Opening DICOM viewer in new tab for series:', series.seriesDescription);
    
    try {
      // Create a blob URL with the HTML content
      const viewerHTML = createViewerHTML(series);
      const blob = new Blob([viewerHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      const newTab = window.open(url, '_blank');
      
      if (newTab) {
        console.log('DICOM viewer opened successfully in new tab');
        toast.success(`DICOM viewer opened in new tab for ${series.seriesDescription}`);
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else {
        toast.error('Failed to open new tab. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error opening DICOM viewer in new tab:', error);
      toast.error('Failed to open DICOM viewer. Please try again.');
    }
  };

  const createViewerHTML = (series) => {
    // Serialize the series data to pass to the new window
    const seriesData = JSON.stringify(series);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DICOM Viewer - ${series.seriesDescription}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Prevent unintentional navigation */
        html, body {
            overflow-x: hidden;
        }
        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #374151;
        }
        ::-webkit-scrollbar-thumb {
            background: #6b7280;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }
    </style>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background: #111827; 
            color: white; 
            font-family: system-ui, -apple-system, sans-serif;
            overflow: hidden;
        }
        .viewer-container { 
            height: 100vh; 
            display: flex; 
            flex-direction: column; 
        }
        .main-content {
            flex: 1;
            display: flex;
            min-height: 0; /* Important for flex child to shrink */
        }
        .canvas-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: black;
            position: relative;
            overflow: hidden;
        }
        .controls-panel {
            width: 300px;
            background: #1f2937;
            border-left: 1px solid #374151;
            padding: 1rem;
            overflow-y: auto;
            flex-shrink: 0; /* Prevent panel from shrinking */
        }
        .overlay-info {
            position: absolute;
            top: 1rem;
            left: 1rem;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-family: monospace;
        }
        canvas {
            max-width: 100%;
            max-height: 100%;
            cursor: crosshair;
        }
        .control-group {
            margin-bottom: 1rem;
        }
        .control-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #d1d5db;
            margin-bottom: 0.5rem;
        }
        .slider {
            width: 100%;
            margin-bottom: 0.5rem;
        }
        .preset-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
        }
        .preset-btn, .control-btn {
            padding: 0.25rem 0.5rem;
            background: #374151;
            color: white;
            border: none;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .preset-btn:hover, .control-btn:hover {
            background: #4b5563;
        }
        .reset-btn {
            width: 100%;
            padding: 0.5rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .reset-btn:hover {
            background: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="viewer-container">
        <!-- Header -->
        <div style="background: #1f2937; padding: 1rem; border-bottom: 1px solid #374151; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 1.125rem; font-weight: 600; margin: 0;">DICOM Viewer</h1>
                <p style="font-size: 0.875rem; color: #9ca3af; margin: 0;">${series.seriesDescription} - Series ${series.seriesNumber}</p>
            </div>
            <button onclick="window.close()" class="control-btn">✕ Close</button>
        </div>
        
        <!-- Usage Info Banner -->
        <div style="background: #1e40af; padding: 0.75rem; border-bottom: 1px solid #3b82f6; text-align: center;">
            <p style="margin: 0; font-size: 0.875rem; color: #dbeafe;">
                💡 Use this viewer to examine DICOM images while performing QC. Draw ROIs to measure values. This window stays open while you continue QC.
            </p>
        </div>
        
        <!-- Main content -->
        <div class="main-content">
            <!-- Image viewer -->
            <div class="canvas-container" id="canvasContainer">
                <canvas id="dicomCanvas"></canvas>
                <div class="overlay-info" id="imageInfo">
                    Loading...
                </div>
            </div>
            
            <!-- Controls -->
            <div class="controls-panel">
                <h3 style="font-weight: 600; margin-bottom: 1rem;">Viewer Controls</h3>
                
                <!-- Image navigation -->
                <div class="control-group">
                    <label class="control-label">Image Navigation</label>
                    <input type="range" id="imageSlider" class="slider" min="0" max="29" value="0">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #9ca3af;">
                        <span>1</span>
                        <span id="totalImages">30</span>
                    </div>
                </div>
                
                <!-- Window/Level controls -->
                <div class="control-group">
                    <label class="control-label">Window Width: <span id="windowWidthValue">400</span></label>
                    <input type="range" id="windowWidthSlider" class="slider" min="1" max="4000" value="400">
                </div>
                
                <div class="control-group">
                    <label class="control-label">Window Center: <span id="windowCenterValue">40</span></label>
                    <input type="range" id="windowCenterSlider" class="slider" min="-1000" max="3000" value="40">
                </div>
                
                <!-- Presets -->
                <div class="control-group">
                    <label class="control-label">Presets</label>
                    <div class="preset-grid">
                        <button class="preset-btn" onclick="setPreset(400, 40)">Soft Tissue</button>
                        <button class="preset-btn" onclick="setPreset(1500, 400)">Bone</button>
                        <button class="preset-btn" onclick="setPreset(1600, -600)">Lung</button>
                        <button class="preset-btn" onclick="setPreset(80, 40)">Brain</button>
                    </div>
                </div>
                
                <!-- Zoom controls -->
                <div class="control-group">
                    <label class="control-label">Zoom: <span id="zoomValue">100</span>%</label>
                    <input type="range" id="zoomSlider" class="slider" min="0.1" max="5" step="0.1" value="1">
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button class="preset-btn" onclick="setZoom(0.5)">50%</button>
                        <button class="preset-btn" onclick="setZoom(1)">100%</button>
                        <button class="preset-btn" onclick="setZoom(2)">200%</button>
                    </div>
                </div>
                
                <!-- ROI Tools -->
                <div class="control-group">
                    <label class="control-label">ROI Tools</label>
                    <button id="roiBtn" class="preset-btn" onclick="toggleROITool()">🎯 Draw Circular ROI</button>
                    <button class="preset-btn" onclick="clearAllROIs()">🗑️ Clear All ROIs</button>
                </div>
                
                <!-- ROI Statistics -->
                <div id="roiStats" class="control-group" style="display: none;">
                    <label class="control-label">ROI Statistics</label>
                    <div style="background: #374151; border-radius: 0.375rem; padding: 0.75rem; font-size: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span>Mean:</span>
                            <span id="roiMean">-</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span>Min:</span>
                            <span id="roiMin">-</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span>Max:</span>
                            <span id="roiMax">-</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span>Std Dev:</span>
                            <span id="roiStdDev">-</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Area:</span>
                            <span id="roiArea">- px²</span>
                        </div>
                    </div>
                </div>

                <!-- Reset button -->
                <button class="reset-btn" onclick="resetView()">Reset View</button>
                
                <!-- Series info -->
                <div style="border-top: 1px solid #374151; padding-top: 1rem; margin-top: 1rem;">
                    <h4 style="font-size: 0.875rem; font-weight: 500; color: #d1d5db; margin-bottom: 0.5rem;">Series Information</h4>
                    <div style="font-size: 0.75rem; color: #9ca3af;">
                        <div><strong>Description:</strong> ${series.seriesDescription}</div>
                        <div><strong>Series Number:</strong> ${series.seriesNumber}</div>
                        <div><strong>Images:</strong> ${series.imageCount}</div>
                        ${series.sliceThickness ? `<div><strong>Slice Thickness:</strong> ${series.sliceThickness}mm</div>` : ''}
                        ${series.kvp ? `<div><strong>kVp:</strong> ${series.kvp}</div>` : ''}
                        ${series.mas ? `<div><strong>mAs:</strong> ${series.mas}</div>` : ''}
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="border-top: 1px solid #374151; padding-top: 1rem; margin-top: 1rem;">
                    <h4 style="font-size: 0.875rem; font-weight: 500; color: #d1d5db; margin-bottom: 0.5rem;">Instructions</h4>
                    <div style="font-size: 0.75rem; color: #9ca3af;">
                        <div>• Mouse wheel: Navigate images</div>
                        <div>• Ctrl + wheel: Zoom</div>
                        <div>• Drag: Pan image</div>
                        <div>• Shift + drag: Window/Level</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // DICOM Viewer Implementation
        const series = ${seriesData};
        let images = [];
        let currentImage = 0;
        let windowWidth = 400;
        let windowCenter = 40;
        let zoom = 1;
        let pan = { x: 0, y: 0 };
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let dragMode = 'pan';
        let roiMode = false;
        let rois = [];
        let isDrawingROI = false;
        let currentROI = null;
        
        const canvas = document.getElementById('dicomCanvas');
        const ctx = canvas.getContext('2d');
        const imageInfo = document.getElementById('imageInfo');
        
        // Initialize viewer
        function init() {
            generateMockImages();
            setupEventListeners();
            renderImage();
            updateUI();
        }
        
        function generateMockImages() {
            const imageCount = series.imageCount || 30;
            images = [];
            
            for (let i = 0; i < imageCount; i++) {
                const imageData = generateMockImageData(i);
                images.push({
                    instanceNumber: i + 1,
                    imageData: imageData,
                    acquisitionTime: \`\${String(8 + Math.floor(i / 10)).padStart(2, '0')}:\${String(30 + (i % 60)).padStart(2, '0')}:\${String(i % 60).padStart(2, '0')}\`
                });
            }
            
            document.getElementById('totalImages').textContent = imageCount;
            document.getElementById('imageSlider').max = imageCount - 1;
        }
        
        function generateMockImageData(imageIndex) {
            const width = 512;
            const height = 512;
            const data = new Uint16Array(width * height);
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = y * width + x;
                    let value = 0;
                    
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    
                    if (distFromCenter < 200) {
                        value = 1000; // Water phantom base
                        
                        // Add test objects
                        for (let i = 0; i < 6; i++) {
                            const objAngle = (i * Math.PI / 3) + (imageIndex * 0.1);
                            const objX = centerX + 80 * Math.cos(objAngle);
                            const objY = centerY + 80 * Math.sin(objAngle);
                            const objDist = Math.sqrt((x - objX) ** 2 + (y - objY) ** 2);
                            
                            if (objDist < 15) {
                                value = 1200 + (i * 100);
                            }
                        }
                        
                        value += (Math.random() - 0.5) * 50;
                    }
                    
                    data[index] = Math.max(0, Math.min(4095, value));
                }
            }
            
            return { data, width, height };
        }
        
        function renderImage() {
            if (!images[currentImage]) return;
            
            const image = images[currentImage];
            const { data, width, height } = image.imageData;
            
            canvas.width = width;
            canvas.height = height;
            
            const imageData = ctx.createImageData(width, height);
            const pixels = imageData.data;
            
            // Apply window/level
            for (let i = 0; i < data.length; i++) {
                const pixelValue = data[i];
                const minValue = windowCenter - windowWidth / 2;
                const maxValue = windowCenter + windowWidth / 2;
                let normalizedValue = (pixelValue - minValue) / (maxValue - minValue);
                normalizedValue = Math.max(0, Math.min(1, normalizedValue));
                
                const intensity = Math.floor(normalizedValue * 255);
                const pixelIndex = i * 4;
                pixels[pixelIndex] = intensity;
                pixels[pixelIndex + 1] = intensity;
                pixels[pixelIndex + 2] = intensity;
                pixels[pixelIndex + 3] = 255;
            }
            
            ctx.clearRect(0, 0, width, height);
            ctx.putImageData(imageData, 0, 0);
            
            // Draw ROIs on the image
            drawROIs();
            
            // Apply zoom and pan
            canvas.style.transform = \`scale(\${zoom}) translate(\${pan.x}px, \${pan.y}px)\`;
            
            updateImageInfo();
        }
        
        function updateImageInfo() {
            const info = \`
Image: \${currentImage + 1} / \${images.length}
Instance: \${images[currentImage].instanceNumber}
W/L: \${Math.round(windowWidth)} / \${Math.round(windowCenter)}
Zoom: \${(zoom * 100).toFixed(0)}%
\${images[currentImage].acquisitionTime ? 'Time: ' + images[currentImage].acquisitionTime : ''}
            \`.trim();
            imageInfo.innerHTML = info.replace(/\\n/g, '<br>');
        }
        
        function updateUI() {
            document.getElementById('imageSlider').value = currentImage;
            document.getElementById('windowWidthSlider').value = windowWidth;
            document.getElementById('windowCenterSlider').value = windowCenter;
            document.getElementById('zoomSlider').value = zoom;
            document.getElementById('windowWidthValue').textContent = Math.round(windowWidth);
            document.getElementById('windowCenterValue').textContent = Math.round(windowCenter);
            document.getElementById('zoomValue').textContent = (zoom * 100).toFixed(0);
        }
        
        function setupEventListeners() {
            // Image slider
            document.getElementById('imageSlider').addEventListener('input', (e) => {
                currentImage = parseInt(e.target.value);
                renderImage();
            });
            
            // Window/Level sliders
            document.getElementById('windowWidthSlider').addEventListener('input', (e) => {
                windowWidth = parseInt(e.target.value);
                renderImage();
                updateUI();
            });
            
            document.getElementById('windowCenterSlider').addEventListener('input', (e) => {
                windowCenter = parseInt(e.target.value);
                renderImage();
                updateUI();
            });
            
            // Zoom slider
            document.getElementById('zoomSlider').addEventListener('input', (e) => {
                zoom = parseFloat(e.target.value);
                renderImage();
                updateUI();
            });
            
            // Mouse events
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('mouseleave', handleMouseUp);
            canvas.addEventListener('wheel', handleWheel);
            
            // Prevent context menu
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        }
        
        function handleMouseDown(e) {
            const rect = canvas.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left) / zoom - pan.x;
            const canvasY = (e.clientY - rect.top) / zoom - pan.y;
            
            if (roiMode) {
                isDrawingROI = true;
                currentROI = {
                    centerX: canvasX,
                    centerY: canvasY,
                    radius: 0,
                    imageIndex: currentImage
                };
                canvas.style.cursor = 'crosshair';
                return;
            }
            
            isDragging = true;
            dragMode = e.shiftKey ? 'windowing' : 'pan';
            dragStart = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = dragMode === 'windowing' ? 'ns-resize' : 'move';
        }
        
        function handleMouseMove(e) {
            if (isDrawingROI && currentROI) {
                const rect = canvas.getBoundingClientRect();
                const canvasX = (e.clientX - rect.left) / zoom - pan.x;
                const canvasY = (e.clientY - rect.top) / zoom - pan.y;
                
                const dx = canvasX - currentROI.centerX;
                const dy = canvasY - currentROI.centerY;
                currentROI.radius = Math.sqrt(dx * dx + dy * dy);
                
                renderImage();
                return;
            }
            
            if (!isDragging) return;
            
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            
            if (dragMode === 'windowing') {
                windowWidth = Math.max(1, windowWidth + deltaX);
                windowCenter = windowCenter - deltaY;
                renderImage();
                updateUI();
            } else if (dragMode === 'pan') {
                pan.x += deltaX / zoom;
                pan.y += deltaY / zoom;
                renderImage();
            }
            
            dragStart = { x: e.clientX, y: e.clientY };
        }
        
        function handleMouseUp() {
            if (isDrawingROI && currentROI && currentROI.radius > 5) {
                rois.push({...currentROI});
                calculateROIStatistics(currentROI);
                isDrawingROI = false;
                currentROI = null;
                roiMode = false;
                updateROIModeButton();
                renderImage();
                return;
            }
            
            if (isDrawingROI) {
                isDrawingROI = false;
                currentROI = null;
                renderImage();
            }
            
            isDragging = false;
            canvas.style.cursor = roiMode ? 'crosshair' : 'default';
        }
        
        function handleWheel(e) {
            e.preventDefault();
            
            if (e.ctrlKey) {
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                zoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
                renderImage();
                updateUI();
            } else {
                const delta = e.deltaY > 0 ? 1 : -1;
                currentImage = Math.max(0, Math.min(images.length - 1, currentImage + delta));
                renderImage();
                updateUI();
            }
        }
        
        function setPreset(width, center) {
            windowWidth = width;
            windowCenter = center;
            renderImage();
            updateUI();
        }
        
        function setZoom(newZoom) {
            zoom = newZoom;
            renderImage();
            updateUI();
        }
        
        function resetView() {
            zoom = 1;
            pan = { x: 0, y: 0 };
            windowWidth = 400;
            windowCenter = 40;
            renderImage();
            updateUI();
        }
        
        // ROI Functions
        function toggleROITool() {
            roiMode = !roiMode;
            updateROIModeButton();
            canvas.style.cursor = roiMode ? 'crosshair' : 'default';
        }
        
        function updateROIModeButton() {
            const btn = document.getElementById('roiBtn');
            if (roiMode) {
                btn.textContent = '❌ Cancel ROI';
                btn.style.background = '#dc2626';
            } else {
                btn.textContent = '🎯 Draw Circular ROI';
                btn.style.background = '#4f46e5';
            }
        }
        
        function clearAllROIs() {
            rois = [];
            document.getElementById('roiStats').style.display = 'none';
            renderImage();
        }
        
        function calculateROIStatistics(roi) {
            if (!images[roi.imageIndex]) return;
            
            const imageData = images[roi.imageIndex].imageData;
            const { data, width, height } = imageData;
            
            let values = [];
            const centerX = Math.round(roi.centerX);
            const centerY = Math.round(roi.centerY);
            const radius = Math.round(roi.radius);
            
            // Get all pixels within the circular ROI
            for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y++) {
                for (let x = Math.max(0, centerX - radius); x <= Math.min(width - 1, centerX + radius); x++) {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= radius) {
                        const index = y * width + x;
                        if (index >= 0 && index < data.length) {
                            values.push(data[index]);
                        }
                    }
                }
            }
            
            if (values.length === 0) return;
            
            // Calculate statistics
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            const area = values.length;
            
            // Update UI
            document.getElementById('roiMean').textContent = mean.toFixed(1) + ' HU';
            document.getElementById('roiMin').textContent = min.toFixed(0) + ' HU';
            document.getElementById('roiMax').textContent = max.toFixed(0) + ' HU';
            document.getElementById('roiStdDev').textContent = stdDev.toFixed(1) + ' HU';
            document.getElementById('roiArea').textContent = area + ' px²';
            document.getElementById('roiStats').style.display = 'block';
        }
        
        function drawROIs() {
            // Draw existing ROIs
            rois.forEach((roi, index) => {
                if (roi.imageIndex === currentImage) {
                    drawROICircle(roi, '#00ff00', 2);
                }
            });
            
            // Draw current ROI being drawn
            if (isDrawingROI && currentROI && currentROI.radius > 0) {
                drawROICircle(currentROI, '#ffff00', 2);
            }
        }
        
        function drawROICircle(roi, color, lineWidth) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash([]);
            
            ctx.beginPath();
            ctx.arc(roi.centerX, roi.centerY, roi.radius, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Draw center point
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(roi.centerX, roi.centerY, 2, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Initialize when page loads
        window.addEventListener('load', init);
    </script>
</body>
</html>`;
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

  if (viewOnly && !templateMode) {
    // Show template's DICOM configuration if available
    const allDicomConfig = templateData?.dicomSeriesConfig || [];
    const dicomConfig = allDicomConfig.filter(config => config.enabled !== false);
    const disabledCount = allDicomConfig.length - dicomConfig.length;
    
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
          🖼️ DICOM Images Configuration
        </h3>
        
        {dicomConfig.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                This template is configured with {dicomConfig.length} enabled DICOM series for automated image selection during QC performance.
                {disabledCount > 0 && (
                  <span className="block mt-1 text-yellow-300">
                    ⚠️ {disabledCount} additional series configuration(s) are disabled and won't be used.
                  </span>
                )}
              </p>
            </div>
            
            {dicomConfig.map((series, index) => (
              <div key={series.id || index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-100">
                    {series.name || `Series Configuration ${index + 1}`}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    series.priority === 'required' ? 'bg-red-900 text-red-200' :
                    series.priority === 'recommended' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {series.priority || 'optional'}
                  </span>
                </div>
                
                {series.description && (
                  <p className="text-gray-300 text-sm mb-3">{series.description}</p>
                )}
                
                
                {series.dicomCriteria && series.dicomCriteria.customTags && series.dicomCriteria.customTags.filter(tag => tag.enabled !== false).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Active DICOM Identification Criteria:</h5>
                    <div className="space-y-2">
                      {series.dicomCriteria.customTags.filter(tag => tag.enabled !== false).map((tag, tagIndex) => (
                        <div key={tagIndex} className="bg-gray-600 rounded p-2 text-sm">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-blue-300 font-medium">
                              {tag.tag === 'other' ? tag.customTag : tag.tag}
                            </span>
                            <span className="text-gray-400">
                              {tag.matchType === 'exact' ? '=' :
                               tag.matchType === 'contains' ? 'contains' :
                               tag.matchType === 'begins_with' ? 'starts with' :
                               tag.matchType === 'ends_with' ? 'ends with' :
                               tag.matchType === 'regex' ? 'matches regex' :
                               tag.matchType === 'not_equal' ? '≠' :
                               tag.matchType === 'greater_than' ? '>' :
                               tag.matchType === 'less_than' ? '<' :
                               '='}
                            </span>
                            <span className="text-yellow-300 font-medium">"{tag.value}"</span>
                          </div>
                          {tag.description && (
                            <p className="text-gray-400 text-xs mt-1">{tag.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {(() => {
                      const disabledCriteria = series.dicomCriteria.customTags.filter(tag => tag.enabled === false);
                      return disabledCriteria.length > 0 ? (
                        <div className="mt-2 text-xs text-yellow-300">
                          ⚠️ {disabledCriteria.length} additional criteria disabled
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                
                {(!series.dicomCriteria || !series.dicomCriteria.customTags || series.dicomCriteria.customTags.filter(tag => tag.enabled !== false).length === 0) && (
                  <div className="text-gray-400 text-sm italic">
                    {series.dicomCriteria?.customTags?.length > 0 
                      ? 'All DICOM identification criteria are disabled'
                      : 'No specific DICOM identification criteria configured'
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-300 text-sm">
              This template does not have DICOM series configuration. 
              In actual QC performance, users would manually select DICOM series for automated analysis.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={templateMode ? "" : "bg-gray-800 rounded-lg p-6 mb-6"}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center">
          {templateMode ? "📋 Available DICOM Series" : "🖼️ DICOM Images"}
        </h3>
        <div className="flex items-center space-x-2">
          {!templateMode && (
            <>
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
            </>
          )}
          {templateMode && (
            <div className="text-sm text-gray-400">
              {availableSeries.length} series types available for {modality}
            </div>
          )}
        </div>
      </div>

      {templateMode && (
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-4">
          <div className="flex items-center text-green-300 text-sm">
            <span className="mr-2">✨</span>
            <span>
              These DICOM series will be available for selection when technologists perform QC using this template. 
              Each series enables automated calculation of specific QC measurements.
            </span>
          </div>
        </div>
      )}

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
                            {series.imageCount} images
                            {series.sliceThickness > 0 && <> • {series.sliceThickness}mm slice thickness</>}
                            {modality === 'CT' && (
                              <> • {series.kvp}kVp • {series.mas}mAs • {series.reconstructionKernel}</>
                            )}
                            {modality === 'MRI' && series.tr && (
                              <> • TR:{series.tr}ms • TE:{series.te}ms • FA:{series.flipAngle}°</>
                            )}
                            {modality === 'Mammography' && (
                              <> • {series.kvp}kVp • {series.mas} • {series.compression}</>
                            )}
                          </div>
                          
                        </div>
                      </div>
                      
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handlePreviewSeries(series)}
                          className="px-3 py-1 bg-gray-600 text-gray-200 text-xs rounded hover:bg-gray-500 transition-colors"
                          title="Preview Series in Popup Window"
                        >
                          👁️ Preview
                        </button>
                        <button
                          onClick={() => handlePreviewSeriesNewTab(series)}
                          className="px-2 py-1 bg-blue-600 text-blue-200 text-xs rounded hover:bg-blue-500 transition-colors"
                          title="Open in New Tab (if popups blocked)"
                        >
                          🗗
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
                <h4 className="text-green-300 font-medium mb-2">Selected for Analysis</h4>
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

      {/* DICOM Viewer Instructions */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
        <h4 className="text-blue-200 font-medium mb-2">🖼️ DICOM Viewer Instructions</h4>
        <div className="text-sm text-blue-100 space-y-2">
          <p>
            <strong>👁️ Preview:</strong> Opens DICOM viewer in popup window (stays open while you continue QC)
          </p>
          <p>
            <strong>🗗 New Tab:</strong> Opens in new tab if popups are blocked
          </p>
          <p className="text-blue-300 text-xs">
            💡 If popups are blocked, look for the popup blocker icon in your address bar and click "Always allow"
          </p>
        </div>
      </div>

      {/* Future Enhancement Notice */}
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-gray-100 font-medium mb-2">
          {templateMode ? "🚧 Template Integration Features" : "🚧 Planned Enhancements"}
        </h4>
        <ul className="text-sm text-gray-300 space-y-1">
          {templateMode ? (
            <>
              <li>• Template-based DICOM series pre-selection for consistent workflows</li>
              <li>• Automatic test-to-series mapping based on QC requirements</li>
              <li>• Series validation rules to ensure quality phantom compatibility</li>
              <li>• Integration with QC test definitions for automated value calculation</li>
              <li>• Template inheritance for institutional standardization</li>
            </>
          ) : (
            <>
              <li>• Real-time DICOM image preview and ROI visualization</li>
              <li>• Automatic series recommendation based on QC protocol</li>
              <li>• Multi-vendor DICOM format support</li>
              <li>• Series quality validation before analysis</li>
              <li>• Integration with PACS worklist and study routing</li>
            </>
          )}
        </ul>
      </div>
    </div>
    );
};

export default DICOMSeriesSelector;