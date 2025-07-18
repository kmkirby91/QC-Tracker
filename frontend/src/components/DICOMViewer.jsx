import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const DICOMViewer = ({ series, isOpen, onClose }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(400);
  const [windowCenter, setWindowCenter] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && series) {
      loadDICOMSeries();
    }
  }, [isOpen, series]);

  useEffect(() => {
    if (images.length > 0) {
      renderImage();
    }
  }, [currentImage, images, windowWidth, windowCenter, zoom, pan]);

  const loadDICOMSeries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual DICOM loading from PACS/VNA
      // const response = await fetch(`/api/dicom/series/${series.seriesInstanceUID}/images`);
      // const imageData = await response.json();
      
      // For now, generate mock DICOM image data
      const mockImages = generateMockDICOMImages(series);
      setImages(mockImages);
      setCurrentImage(0);
      
      // Reset viewer state
      setZoom(1);
      setPan({ x: 0, y: 0 });
      
      console.log('Loaded DICOM series:', series.seriesDescription, mockImages.length, 'images');
    } catch (err) {
      console.error('Error loading DICOM series:', err);
      setError('Failed to load DICOM images');
      toast.error('Failed to load DICOM images');
    } finally {
      setLoading(false);
    }
  };

  const generateMockDICOMImages = (series) => {
    const imageCount = series.imageCount || 30;
    const images = [];
    
    for (let i = 0; i < imageCount; i++) {
      // Generate mock image data based on modality
      const imageData = generateMockImageData(series, i);
      images.push({
        instanceNumber: i + 1,
        imageData: imageData,
        windowWidth: series.modality === 'CT' ? 400 : 1000,
        windowCenter: series.modality === 'CT' ? 40 : 500,
        pixelSpacing: [0.5, 0.5],
        sliceThickness: series.sliceThickness || 5.0,
        imagePosition: [0, 0, i * (series.sliceThickness || 5.0)],
        acquisitionTime: `${String(8 + Math.floor(i / 10)).padStart(2, '0')}:${String(30 + (i % 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`
      });
    }
    
    return images;
  };

  const generateMockImageData = (series, imageIndex) => {
    const width = 512;
    const height = 512;
    const data = new Uint16Array(width * height);
    
    // Generate different patterns based on modality
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        let value = 0;
        
        if (series.modality === 'CT') {
          // Generate CT-like image with phantom structures
          const centerX = width / 2;
          const centerY = height / 2;
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter < 200) {
            // Water phantom base
            value = 1000; // Water HU + 1024 offset
            
            // Add some test objects
            const angle = Math.atan2(y - centerY, x - centerX);
            const radius = distFromCenter;
            
            // Create circular test objects at different positions
            for (let i = 0; i < 6; i++) {
              const objAngle = (i * Math.PI / 3) + (imageIndex * 0.1);
              const objX = centerX + 80 * Math.cos(objAngle);
              const objY = centerY + 80 * Math.sin(objAngle);
              const objDist = Math.sqrt((x - objX) ** 2 + (y - objY) ** 2);
              
              if (objDist < 15) {
                value = 1200 + (i * 100); // Different densities
              }
            }
            
            // Add some noise
            value += (Math.random() - 0.5) * 50;
          } else {
            value = 0; // Air
          }
        } else if (series.modality === 'MRI') {
          // Generate MRI-like image
          const centerX = width / 2;
          const centerY = height / 2;
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter < 180) {
            // Brain-like structure
            value = 500 + Math.sin(distFromCenter * 0.02) * 200;
            value += Math.sin(x * 0.01) * Math.cos(y * 0.01) * 100;
            value += (Math.random() - 0.5) * 30;
          }
        } else {
          // Default pattern
          value = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 1000 + 1000;
          value += (Math.random() - 0.5) * 100;
        }
        
        data[index] = Math.max(0, Math.min(4095, value));
      }
    }
    
    return { data, width, height };
  };

  const renderImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !images[currentImage]) return;
    
    const ctx = canvas.getContext('2d');
    const image = images[currentImage];
    const { data, width, height } = image.imageData;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Create ImageData for rendering
    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;
    
    // Apply window/level and convert to RGB
    for (let i = 0; i < data.length; i++) {
      const pixelValue = data[i];
      
      // Apply window/level
      const minValue = windowCenter - windowWidth / 2;
      const maxValue = windowCenter + windowWidth / 2;
      let normalizedValue = (pixelValue - minValue) / (maxValue - minValue);
      normalizedValue = Math.max(0, Math.min(1, normalizedValue));
      
      const intensity = Math.floor(normalizedValue * 255);
      
      // Set RGB values (grayscale)
      const pixelIndex = i * 4;
      pixels[pixelIndex] = intensity;     // R
      pixels[pixelIndex + 1] = intensity; // G
      pixels[pixelIndex + 2] = intensity; // B
      pixels[pixelIndex + 3] = 255;       // A
    }
    
    // Clear canvas and draw image
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
  };

  const handleMouseDown = (e) => {
    if (e.shiftKey) {
      // Window/Level adjustment
      setIsDragging('windowing');
    } else {
      // Pan
      setIsDragging('pan');
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (isDragging === 'windowing') {
      // Adjust window/level
      setWindowWidth(prev => Math.max(1, prev + deltaX));
      setWindowCenter(prev => prev - deltaY);
    } else if (isDragging === 'pan') {
      // Pan image
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    
    if (e.ctrlKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
    } else {
      // Scroll through images
      const delta = e.deltaY > 0 ? 1 : -1;
      setCurrentImage(prev => Math.max(0, Math.min(images.length - 1, prev + delta)));
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (images[currentImage]) {
      setWindowWidth(images[currentImage].windowWidth);
      setWindowCenter(images[currentImage].windowCenter);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-6xl max-h-screen w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">DICOM Viewer</h3>
            <p className="text-sm text-gray-400">
              {series?.seriesDescription} - Series {series?.seriesNumber}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowControls(!showControls)}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              {showControls ? 'Hide Controls' : 'Show Controls'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Main viewer area */}
        <div className="flex-1 flex">
          {/* Image viewer */}
          <div 
            ref={containerRef}
            className="flex-1 relative bg-black overflow-hidden"
            style={{ minHeight: '400px' }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-lg">Loading DICOM images...</div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-400 text-lg">{error}</div>
              </div>
            )}
            
            {images.length > 0 && (
              <div 
                className="w-full h-full flex items-center justify-center cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                />
              </div>
            )}
            
            {/* Image info overlay */}
            {images[currentImage] && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
                <div>Image: {currentImage + 1} / {images.length}</div>
                <div>Instance: {images[currentImage].instanceNumber}</div>
                <div>W/L: {Math.round(windowWidth)} / {Math.round(windowCenter)}</div>
                <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
                {images[currentImage].acquisitionTime && (
                  <div>Time: {images[currentImage].acquisitionTime}</div>
                )}
              </div>
            )}
          </div>

          {/* Controls panel */}
          {showControls && (
            <div className="w-80 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
              <h4 className="text-white font-semibold mb-4">Viewer Controls</h4>
              
              {/* Image navigation */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image Navigation
                </label>
                <input
                  type="range"
                  min="0"
                  max={images.length - 1}
                  value={currentImage}
                  onChange={(e) => setCurrentImage(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>{images.length}</span>
                </div>
              </div>

              {/* Window/Level controls */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Window Width: {Math.round(windowWidth)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4000"
                  value={windowWidth}
                  onChange={(e) => setWindowWidth(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Window Center: {Math.round(windowCenter)}
                </label>
                <input
                  type="range"
                  min="-1000"
                  max="3000"
                  value={windowCenter}
                  onChange={(e) => setWindowCenter(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Preset window/level buttons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setWindowWidth(400); setWindowCenter(40); }}
                    className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                  >
                    Soft Tissue
                  </button>
                  <button
                    onClick={() => { setWindowWidth(1500); setWindowCenter(400); }}
                    className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                  >
                    Bone
                  </button>
                  <button
                    onClick={() => { setWindowWidth(1600); setWindowCenter(-600); }}
                    className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                  >
                    Lung
                  </button>
                  <button
                    onClick={() => { setWindowWidth(80); setWindowCenter(40); }}
                    className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                  >
                    Brain
                  </button>
                </div>
              </div>

              {/* Zoom controls */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Zoom: {(zoom * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => setZoom(0.5)}
                    className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                  >
                    100%
                  </button>
                  <button
                    onClick={() => setZoom(2)}
                    className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                  >
                    200%
                  </button>
                </div>
              </div>

              {/* Reset button */}
              <button
                onClick={resetView}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mb-4"
              >
                Reset View
              </button>

              {/* Series information */}
              {series && (
                <div className="border-t border-gray-700 pt-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Series Information</h5>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div><strong>Description:</strong> {series.seriesDescription}</div>
                    <div><strong>Series Number:</strong> {series.seriesNumber}</div>
                    <div><strong>Images:</strong> {series.imageCount}</div>
                    {series.sliceThickness && (
                      <div><strong>Slice Thickness:</strong> {series.sliceThickness}mm</div>
                    )}
                    {series.kvp && (
                      <div><strong>kVp:</strong> {series.kvp}</div>
                    )}
                    {series.mas && (
                      <div><strong>mAs:</strong> {series.mas}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Instructions</h5>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>• Mouse wheel: Navigate images</div>
                  <div>• Ctrl + wheel: Zoom</div>
                  <div>• Drag: Pan image</div>
                  <div>• Shift + drag: Window/Level</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DICOMViewer;