const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateMonthlyQCReport } = require('../services/pdfGenerator');
const router = express.Router();

// Mock machines data (in real app, this would come from database)
const mockMachines = require('./machines').mockMachines || [];

// Generate monthly QC report PDF
router.get('/monthly-qc/:machineId/:year/:month', async (req, res) => {
  try {
    const { machineId, year, month } = req.params;
    
    // Get machine data (in real app, fetch from database)
    const machinesRouter = require('./machines');
    const machineRes = await new Promise((resolve, reject) => {
      const mockReq = { params: { id: machineId } };
      const mockRes = {
        json: (data) => resolve(data),
        status: (code) => ({ json: (data) => reject(new Error(data.error)) })
      };
      // Simulate getting machine by ID from the machines route
      const machines = [
        {
          machineId: 'MRI-001',
          name: 'Siemens MAGNETOM Vida',
          type: 'MRI',
          manufacturer: 'Siemens',
          model: 'MAGNETOM Vida 3T',
          serialNumber: 'SN-MRI-2021-001',
          location: { building: 'Main Hospital', floor: '2', room: 'MRI Suite 1' }
        },
        {
          machineId: 'CT-002',
          name: 'Siemens SOMATOM Force',
          type: 'CT',
          manufacturer: 'Siemens',
          model: 'SOMATOM Force',
          serialNumber: 'SN-CT-2023-002',
          location: { building: 'Emergency Department', floor: '1', room: 'Trauma CT' }
        }
      ];
      const machine = machines.find(m => m.machineId === machineId);
      if (machine) resolve(machine);
      else reject(new Error('Machine not found'));
    });

    // Get QC data for the specific month (mock data)
    const qcData = {
      overallResult: 'pass',
      completedAt: new Date(year, month - 1, 15).toISOString(),
      tests: [
        {
          testName: 'CT Number Linearity',
          result: 'pass',
          value: '±2 HU',
          tolerance: '±5 HU',
          notes: 'Within acceptable limits',
          performedBy: 'Tom Brown'
        },
        {
          testName: 'Spatial Resolution (MTF)',
          result: 'pass',
          value: '0.8 lp/mm',
          tolerance: '>0.7 lp/mm',
          notes: 'Good resolution maintained',
          performedBy: 'Tom Brown'
        },
        {
          testName: 'Low Contrast Detectability',
          result: 'conditional',
          value: '6mm @ 0.3%',
          tolerance: '5mm @ 0.3%',
          notes: 'Slightly above threshold, monitor closely',
          performedBy: 'Tom Brown'
        },
        {
          testName: 'Patient Dose Verification',
          result: 'pass',
          value: '18.2 mGy',
          tolerance: '<20 mGy',
          notes: 'Dose within limits',
          performedBy: 'Tom Brown'
        },
        {
          testName: 'kVp Accuracy',
          result: 'pass',
          value: '119.8 kVp',
          tolerance: '120 ± 2 kVp',
          notes: 'Accurate calibration',
          performedBy: 'Tom Brown'
        }
      ],
      additionalNotes: 'Overall performance satisfactory. Low contrast detectability should be monitored in next monthly QC. No immediate action required.'
    };

    // Generate PDF
    const { filename, filepath } = await generateMonthlyQCReport(machineRes, qcData, parseInt(month), parseInt(year));
    
    res.json({ 
      message: 'Report generated successfully',
      filename,
      downloadUrl: `/reports/${filename}`
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Serve PDF files
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, '../reports', filename);
  
  // Check if file exists
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Report not found' });
  }
  
  // Set headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filepath);
  fileStream.pipe(res);
});

module.exports = router;