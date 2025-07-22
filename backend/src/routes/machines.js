const express = require('express');
const router = express.Router();

// Mock data for development
const mockMachines = [
  {
    machineId: 'MRI-ESS-001',
    name: 'Siemens MAGNETOM Vida',
    type: 'MRI',
    manufacturer: 'Siemens',
    model: 'MAGNETOM Vida 3T',
    serialNumber: 'SN-MRI-2021-001',
    location: {
      building: 'Essen',
      floor: '2',
      room: 'MRI Suite 1'
    },
    installationDate: '2021-03-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'John Smith',
      notes: 'All parameters within normal limits'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'CT-ESS-001',
    name: 'GE Revolution CT',
    type: 'CT',
    manufacturer: 'GE Healthcare',
    model: 'Revolution CT 256',
    serialNumber: 'SN-CT-2020-001',
    location: {
      building: 'Essen',
      floor: '1',
      room: 'CT Room 1'
    },
    installationDate: '2020-06-20',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Jane Doe',
      notes: 'Routine QC completed successfully'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'DC-ESS-001',
    name: 'Capintec CRC-15R',
    type: 'Dose Calibrator',
    manufacturer: 'Capintec',
    model: 'CRC-15R',
    serialNumber: 'SN-DC-2020-001',
    location: {
      building: 'Essen',
      floor: '1',
      room: 'Hot Lab'
    },
    installationDate: '2020-08-15',
    status: 'operational',
    lastQC: {
      date: '2023-10-15',
      result: 'pass',
      performedBy: 'Sarah Wilson',
      notes: 'Quarterly linearity and accuracy tests completed'
    },
    nextQCDue: '2024-01-15',
    qcSchedule: {
      daily: false,
      weekly: false,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'PET-WOM-001',
    name: 'Philips Vereos PET/CT',
    type: 'PET',
    manufacturer: 'Philips',
    model: 'Vereos Digital PET/CT',
    serialNumber: 'SN-PET-2022-001',
    location: {
      building: "Woman's",
      floor: '1',
      room: 'Nuclear Medicine Suite'
    },
    installationDate: '2022-01-10',
    status: 'maintenance',
    lastQC: {
      date: '2024-01-01',
      result: 'conditional',
      performedBy: 'Mike Johnson',
      notes: 'Minor calibration needed'
    },
    nextQCDue: '2024-01-08',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'MRI-WOM-001',
    name: 'Philips Ingenia 1.5T',
    type: 'MRI',
    manufacturer: 'Philips',
    model: 'Ingenia 1.5T',
    serialNumber: 'SN-MRI-2019-002',
    location: {
      building: "Woman's",
      floor: '1',
      room: 'MRI Room 2'
    },
    installationDate: '2019-11-05',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Sarah Williams',
      notes: 'All tests passed'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'CT-GON-001',
    name: 'Siemens SOMATOM Force',
    type: 'CT',
    manufacturer: 'Siemens',
    model: 'SOMATOM Force',
    serialNumber: 'SN-CT-2023-002',
    location: {
      building: 'Gonzales',
      floor: '1',
      room: 'Emergency CT'
    },
    installationDate: '2023-02-28',
    status: 'operational',
    lastQC: {
      date: null,
      result: null,
      performedBy: null,
      notes: 'QC worksheet assigned - ready for daily QC'
    },
    nextQCDue: new Date().toISOString().split('T')[0], // Today - QC due
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: false,
      quarterly: false,
      annual: false
    }
  },
  {
    machineId: 'MRI-GON-001',
    name: 'GE SIGNA Premier',
    type: 'MRI',
    manufacturer: 'GE Healthcare',
    model: 'SIGNA Premier 3T',
    serialNumber: 'SN-MRI-2022-003',
    location: {
      building: 'Gonzales',
      floor: '2',
      room: 'MRI Suite A'
    },
    installationDate: '2022-08-10',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'David Chen',
      notes: 'System performing optimally'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'CT-WOM-001',
    name: 'Canon Aquilion ONE',
    type: 'CT',
    manufacturer: 'Canon Medical',
    model: 'Aquilion ONE Genesis',
    serialNumber: 'SN-CT-2021-003',
    location: {
      building: "Woman's",
      floor: '2',
      room: 'CT Suite B'
    },
    installationDate: '2021-05-20',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Emily Rodriguez',
      notes: 'All QC tests within tolerance'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'PET-ESS-001',
    name: 'Siemens Biograph Vision',
    type: 'PET',
    manufacturer: 'Siemens',
    model: 'Biograph Vision 600',
    serialNumber: 'SN-PET-2023-002',
    location: {
      building: 'Essen',
      floor: '3',
      room: 'Nuclear Medicine'
    },
    installationDate: '2023-01-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-01',
      result: 'pass',
      performedBy: 'Robert Martinez',
      notes: 'Excellent image quality'
    },
    nextQCDue: '2024-01-08',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'MAMMO-WOM-001',
    name: 'Hologic Selenia Dimensions',
    type: 'Mammography',
    manufacturer: 'Hologic',
    model: 'Selenia Dimensions 3D',
    serialNumber: 'SN-MAMMO-2023-001',
    location: {
      building: "Woman's",
      floor: '1',
      room: 'Mammography Suite'
    },
    installationDate: '2023-03-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Lisa Johnson',
      notes: 'All phantom images within ACR standards'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'MAM-WOM-001',
    name: 'Hologic Selenia Dimensions',
    type: 'Mammography',
    manufacturer: 'Hologic',
    model: 'Selenia Dimensions 3D',
    serialNumber: 'SN-MAM-2022-001',
    location: {
      building: "Woman's",
      floor: '1',
      room: 'Mammography Suite A'
    },
    installationDate: '2022-08-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Jennifer Park',
      notes: 'All ACR phantom images within specifications. kVp and mAs accuracy verified.'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'CT-MBPBI-001',
    name: 'Philips Brilliance CT',
    type: 'CT',
    manufacturer: 'Philips',
    model: 'Brilliance CT 64',
    serialNumber: 'SN-CT-2019-004',
    location: {
      building: 'MBPBI',
      floor: '1',
      room: 'CT Room A'
    },
    installationDate: '2019-12-10',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Dr. Martinez',
      notes: 'All calibration parameters within tolerance'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'MRI-MBPBI-001',
    name: 'Siemens MAGNETOM Skyra',
    type: 'MRI',
    manufacturer: 'Siemens',
    model: 'MAGNETOM Skyra 3T',
    serialNumber: 'SN-MRI-2020-004',
    location: {
      building: 'MBPBI',
      floor: '2',
      room: 'MRI Suite B'
    },
    installationDate: '2020-09-22',
    status: 'maintenance',
    lastQC: {
      date: '2024-01-01',
      result: 'conditional',
      performedBy: 'Tech Team',
      notes: 'Minor gradient coil adjustment needed'
    },
    nextQCDue: '2024-01-08',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'US-MBPBI-001',
    name: 'GE Logiq E10',
    type: 'Ultrasound',
    manufacturer: 'GE Healthcare',
    model: 'Logiq E10',
    serialNumber: 'SN-US-2021-002',
    location: {
      building: 'MBPBI',
      floor: '1',
      room: 'Ultrasound Room 1'
    },
    installationDate: '2021-06-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Sarah Chen',
      notes: 'All transducers functioning properly'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'PET-MBPBI-001',
    name: 'GE Discovery MI',
    type: 'PET',
    manufacturer: 'GE Healthcare',
    model: 'Discovery MI 4-Ring',
    serialNumber: 'SN-PET-2023-003',
    location: {
      building: 'MBPBI',
      floor: '3',
      room: 'Nuclear Medicine'
    },
    installationDate: '2023-04-12',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Nuclear Medicine Team',
      notes: 'Daily detector checks passed'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  // Houma Location
  {
    machineId: 'CT-HOU-001',
    name: 'Canon Aquilion Prime',
    type: 'CT',
    manufacturer: 'Canon Medical',
    model: 'Aquilion Prime SP',
    serialNumber: 'SN-CT-2022-005',
    location: {
      building: 'Houma',
      floor: '1',
      room: 'CT Suite 1'
    },
    installationDate: '2022-03-18',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Lisa Anderson',
      notes: 'All quality metrics within specifications'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'MRI-HOU-001',
    name: 'GE SIGNA Explorer',
    type: 'MRI',
    manufacturer: 'GE Healthcare',
    model: 'SIGNA Explorer 1.5T',
    serialNumber: 'SN-MRI-2021-005',
    location: {
      building: 'Houma',
      floor: '2',
      room: 'MRI Room 1'
    },
    installationDate: '2021-11-08',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Mark Thompson',
      notes: 'SNR and uniformity tests passed'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'MAMMO-HOU-001',
    name: 'Fujifilm Amulet Innovality',
    type: 'Mammography',
    manufacturer: 'Fujifilm',
    model: 'Amulet Innovality',
    serialNumber: 'SN-MAMMO-2023-002',
    location: {
      building: 'Houma',
      floor: '1',
      room: 'Mammography Suite'
    },
    installationDate: '2023-05-12',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Rachel White',
      notes: 'ACR phantom test results excellent'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  // Natchez Location
  {
    machineId: 'CT-NAT-001',
    name: 'Siemens SOMATOM Go',
    type: 'CT',
    manufacturer: 'Siemens',
    model: 'SOMATOM Go.Top',
    serialNumber: 'SN-CT-2020-006',
    location: {
      building: 'Natchez',
      floor: '1',
      room: 'CT Room B'
    },
    installationDate: '2020-10-14',
    status: 'critical',
    lastQC: {
      date: '2024-01-01',
      result: 'fail',
      performedBy: 'Emergency Tech',
      notes: 'Urgent: Detector calibration out of range - service required'
    },
    nextQCDue: '2024-01-05',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'US-NAT-001',
    name: 'Philips EPIQ 7',
    type: 'Ultrasound',
    manufacturer: 'Philips',
    model: 'EPIQ 7',
    serialNumber: 'SN-US-2019-003',
    location: {
      building: 'Natchez',
      floor: '1',
      room: 'Ultrasound Suite A'
    },
    installationDate: '2019-07-25',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Jennifer Lopez',
      notes: 'All probes functioning within specs'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'DR-NAT-001',
    name: 'Carestream DRX-Revolution',
    type: 'Digital Radiography',
    manufacturer: 'Carestream',
    model: 'DRX-Revolution',
    serialNumber: 'SN-DR-2021-001',
    location: {
      building: 'Natchez',
      floor: '1',
      room: 'X-Ray Room 1'
    },
    installationDate: '2021-04-30',
    status: 'maintenance',
    lastQC: {
      date: '2024-01-02',
      result: 'conditional',
      performedBy: 'Tech Support',
      notes: 'Detector cleaning scheduled - minor artifacts noted'
    },
    nextQCDue: '2024-01-08',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  // Hammond Location
  {
    machineId: 'MRI-HAM-001',
    name: 'Philips Ingenia Ambition',
    type: 'MRI',
    manufacturer: 'Philips',
    model: 'Ingenia Ambition 1.5T',
    serialNumber: 'SN-MRI-2022-006',
    location: {
      building: 'Hammond',
      floor: '2',
      room: 'MRI Suite 1'
    },
    installationDate: '2022-01-20',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Michael Davis',
      notes: 'Excellent image quality and system stability'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'CT-HAM-001',
    name: 'GE Optima CT660',
    type: 'CT',
    manufacturer: 'GE Healthcare',
    model: 'Optima CT660',
    serialNumber: 'SN-CT-2019-007',
    location: {
      building: 'Hammond',
      floor: '1',
      room: 'CT Suite A'
    },
    installationDate: '2019-09-12',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Kevin Brown',
      notes: 'Routine calibration completed successfully'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'PET-HAM-001',
    name: 'Siemens Biograph Horizon',
    type: 'PET',
    manufacturer: 'Siemens',
    model: 'Biograph Horizon',
    serialNumber: 'SN-PET-2023-004',
    location: {
      building: 'Hammond',
      floor: '3',
      room: 'Nuclear Medicine'
    },
    installationDate: '2023-07-08',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Nuclear Med Team',
      notes: 'Daily flood and calibration passed'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  // Covington Location
  {
    machineId: 'CT-COV-001',
    name: 'Philips Incisive CT',
    type: 'CT',
    manufacturer: 'Philips',
    model: 'Incisive CT',
    serialNumber: 'SN-CT-2023-008',
    location: {
      building: 'Covington',
      floor: '1',
      room: 'CT Room 1'
    },
    installationDate: '2023-02-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Amanda Wilson',
      notes: 'Latest generation CT performing excellently'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'MRI-COV-001',
    name: 'Canon Vantage Orian',
    type: 'MRI',
    manufacturer: 'Canon Medical',
    model: 'Vantage Orian 1.5T',
    serialNumber: 'SN-MRI-2020-007',
    location: {
      building: 'Covington',
      floor: '2',
      room: 'MRI Suite B'
    },
    installationDate: '2020-12-03',
    status: 'offline',
    lastQC: {
      date: '2023-12-28',
      result: 'fail',
      performedBy: 'Service Engineer',
      notes: 'System offline for major upgrade - service in progress'
    },
    nextQCDue: '2024-01-15',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'US-COV-001',
    name: 'Samsung RS85',
    type: 'Ultrasound',
    manufacturer: 'Samsung',
    model: 'RS85 Prestige',
    serialNumber: 'SN-US-2022-004',
    location: {
      building: 'Covington',
      floor: '1',
      room: 'Ultrasound Room 1'
    },
    installationDate: '2022-08-22',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Ultrasound Team',
      notes: 'All transducers calibrated and functional'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'MAMMO-COV-001',
    name: 'Siemens Mammomat Inspiration',
    type: 'Mammography',
    manufacturer: 'Siemens',
    model: 'Mammomat Inspiration Prime',
    serialNumber: 'SN-MAMMO-2021-003',
    location: {
      building: 'Covington',
      floor: '1',
      room: 'Women\'s Health Center'
    },
    installationDate: '2021-10-11',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Women\'s Health Tech',
      notes: 'ACR accreditation standards maintained'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  }
];

// Get all machines
router.get('/', (req, res) => {
  res.json(mockMachines);
});

// Get machine by ID
router.get('/:id', (req, res) => {
  const machine = mockMachines.find(m => m.machineId === req.params.id);
  if (machine) {
    res.json(machine);
  } else {
    res.status(404).json({ error: 'Machine not found' });
  }
});

// Get machines by status
router.get('/status/:status', (req, res) => {
  const machines = mockMachines.filter(m => m.status === req.params.status);
  res.json(machines);
});

// Get machines by type
router.get('/type/:type', (req, res) => {
  const machines = mockMachines.filter(m => m.type === req.params.type);
  res.json(machines);
});

// Create new machine
router.post('/', (req, res) => {
  try {
    const newMachine = req.body;
    
    // Check if machine ID already exists
    const existingMachine = mockMachines.find(m => m.machineId === newMachine.machineId);
    if (existingMachine) {
      return res.status(400).json({ error: 'Machine ID already exists' });
    }

    // Add timestamps and initial QC data
    newMachine.createdAt = new Date().toISOString();
    newMachine.updatedAt = new Date().toISOString();
    
    // Set initial lastQC if not provided
    if (!newMachine.lastQC) {
      newMachine.lastQC = {
        date: null,
        result: null,
        performedBy: null,
        notes: 'Initial setup - no QC performed yet'
      };
    }

    // Add to mock data array
    mockMachines.push(newMachine);
    
    res.status(201).json(newMachine);
  } catch (error) {
    console.error('Error creating machine:', error);
    res.status(500).json({ error: 'Failed to create machine' });
  }
});

// Update machine status
router.patch('/:id/status', (req, res) => {
  const machine = mockMachines.find(m => m.machineId === req.params.id);
  if (machine) {
    machine.status = req.body.status;
    res.json(machine);
  } else {
    res.status(404).json({ error: 'Machine not found' });
  }
});

// Export function to get all machines (for internal use)
const getAllMachines = () => mockMachines;

module.exports = router;
module.exports.getAllMachines = getAllMachines;