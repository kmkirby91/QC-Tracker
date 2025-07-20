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

module.exports = router;