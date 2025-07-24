import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import { checkAndInitializeSampleData } from './utils/sampleWorksheets'
import { checkSomatumForceStatus, quickFixSomatumForce } from './utils/diagnostics'
import MachineCard from './components/MachineCard'
import StatusSummary from './components/StatusSummary'
import FilterBar from './components/FilterBar'
import MachineDetail from './components/MachineDetail'
import QCTestDetail from './components/QCTestDetail'
import DueToday from './components/DueToday'
import DueTasksWidget from './components/DueTasksWidget'
import QCForm from './components/QCForm'
import OpenFailures from './components/OpenFailures'
import AddMachine from './components/AddMachine'
import Worksheets from './components/Worksheets'
import Locations from './components/Locations'
import TechDashboard from './components/TechDashboard'
import QCCalendar from './components/QCCalendar'
import Admin from './components/Admin'
import Research from './components/Research'
import './App.css'

const queryClient = new QueryClient()

function NavigationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navigationItems = [
    { label: 'Dashboard', path: '/', icon: '🏠' },
    { label: 'Tech Dashboard', path: '/tech-dashboard', icon: '⚙️' },
    { label: 'Machines', path: '/locations', icon: '🏥' },
    { label: 'Calendar', path: '/calendar', icon: '📅' },
    { label: 'Worksheets', path: '/worksheets', icon: '📋' },
    { label: 'Admin', path: '/admin', icon: '🔧' },
    { label: 'Research', path: '/research', icon: '🔬' },
    { label: 'Reporting', path: '/reporting', icon: '📊' }
  ]


  const handleNavigation = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  const getCurrentPageLabel = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname)
    return currentItem ? currentItem.label : 'Navigation'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
      >
        <span>{getCurrentPageLabel()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-50">
          <div className="py-1">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                  location.pathname === item.path 
                    ? 'bg-gray-700 text-blue-400' 
                    : 'text-gray-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Toaster position="top-right" />
          <header className="bg-gray-800 shadow-lg border-b border-gray-700">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-gray-100 hover:text-blue-400 transition-colors">
                  QC Tracker - Medical Imaging
                </Link>
                <div className="flex items-center space-x-4">
                  <NavigationDropdown />
                  <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tech-dashboard" element={<TechDashboard />} />
              <Route path="/machines/add" element={<AddMachine />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/worksheets" element={<Worksheets />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/research" element={<Research />} />
              <Route path="/reporting" element={<Reporting />} />
              <Route path="/calendar" element={<QCCalendar showOverview={true} />} />
              <Route path="/due-today" element={<DueToday />} />
              <Route path="/open-failures" element={<OpenFailures />} />
              <Route path="/machines/:machineId" element={<MachineDetail />} />
              <Route path="/machines/:machineId/qc/:date" element={<QCTestDetail />} />
              <Route path="/qc/perform/:machineId/:frequency" element={<QCForm />} />
              <Route path="/qc/perform/:machineId/:frequency/:worksheetId" element={<QCForm />} />
              <Route path="/qc/view/:machineType/:frequency" element={<QCForm viewOnly={true} />} />
              <Route path="/qc/view-worksheet/:machineId/:frequency" element={<QCForm viewOnly={true} />} />
              <Route path="/qc/view-worksheet/:machineId/:frequency/:worksheetId" element={<QCForm viewOnly={true} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

function Dashboard() {
  const [machines, setMachines] = useState([])
  const [filteredMachines, setFilteredMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    location: '',
    sortBy: 'nextQCDue'
  })

  useEffect(() => {
    fetchMachines()
    // Initialize sample worksheets on app load
    checkAndInitializeSampleData()
    
    // Add diagnostic functions to global scope for debugging
    window.checkSomatumForceStatus = checkSomatumForceStatus
    window.quickFixSomatumForce = quickFixSomatumForce
  }, [])

  useEffect(() => {
    applyFilters()
  }, [machines, filters])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/machines')
      setMachines(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load machines: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...machines]

    if (filters.type) {
      filtered = filtered.filter(m => m.type === filters.type)
    }

    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status)
    }

    if (filters.location) {
      filtered = filtered.filter(m => m.location.building === filters.location)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'nextQCDue':
          return new Date(a.nextQCDue) - new Date(b.nextQCDue)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    setFilteredMachines(filtered)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machines...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div>
      <StatusSummary machines={machines} />
      
      {/* Collapsible Due Tasks Widget */}
      <DueTasksWidget />
      
      <FilterBar filters={filters} onFilterChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMachines.map(machine => (
          <MachineCard key={machine.machineId} machine={machine} />
        ))}
      </div>

      {filteredMachines.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No machines found matching the selected filters.
        </div>
      )}
    </div>
  )
}

function MachineList() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const navigate = useNavigate()

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      const response = await axios.get('/api/machines')
      setMachines(response.data)
    } catch (error) {
      console.error('Error fetching machines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const getSortedMachines = () => {
    return [...machines].sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'type':
          aValue = a.type.toLowerCase()
          bValue = b.type.toLowerCase()
          break
        case 'location':
          aValue = `${a.location.building} ${a.location.room}`.toLowerCase()
          bValue = `${b.location.building} ${b.location.room}`.toLowerCase()
          break
        case 'status':
          aValue = a.status.toLowerCase()
          bValue = b.status.toLowerCase()
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const getAssignedFrequencies = (machine) => {
    // Check for custom worksheets assigned to this machine
    const assignedFrequencies = [];
    try {
      const storedWorksheets = localStorage.getItem('qcWorksheets');
      if (storedWorksheets) {
        const worksheets = JSON.parse(storedWorksheets);
        ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on-demand'].forEach(frequency => {
          const hasWorksheet = worksheets.some(ws => 
            ws.modality === machine.type && 
            ws.frequency === frequency && 
            ws.assignedMachines && 
            ws.assignedMachines.includes(machine.machineId)
          );
          if (hasWorksheet) {
            assignedFrequencies.push(frequency);
          }
        });
      }
    } catch (error) {
      console.error('Error loading worksheets:', error);
    }
    return assignedFrequencies;
  }

  const getAssignedWorksheets = (machine) => {
    // Return actual worksheet objects assigned to this machine
    const assignedWorksheets = [];
    try {
      const storedWorksheets = localStorage.getItem('qcWorksheets');
      if (storedWorksheets) {
        const worksheets = JSON.parse(storedWorksheets);
        worksheets.forEach(worksheet => {
          if (worksheet.modality === machine.type && 
              worksheet.assignedMachines && 
              worksheet.assignedMachines.includes(machine.machineId) &&
              worksheet.isWorksheet === true) {
            assignedWorksheets.push(worksheet);
          }
        });
      }
    } catch (error) {
      console.error('Error loading worksheets:', error);
    }
    return assignedWorksheets;
  }

  const getFrequencyColor = (frequency) => {
    const colors = {
      daily: 'bg-blue-600 hover:bg-blue-700',
      weekly: 'bg-green-600 hover:bg-green-700', 
      monthly: 'bg-purple-600 hover:bg-purple-700',
      quarterly: 'bg-yellow-600 hover:bg-yellow-700',
      annual: 'bg-red-600 hover:bg-red-700',
      'on-demand': 'bg-gray-600 hover:bg-gray-700'
    };
    return colors[frequency] || 'bg-gray-600 hover:bg-gray-700';
  }

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly', 
      quarterly: 'Quarterly',
      annual: 'Annual'
    };
    return labels[frequency] || frequency;
  }

  const SortableHeader = ({ column, children }) => (
    <th 
      className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === column && (
          <span className="text-blue-400">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machines...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100">All Machines</h1>
        <Link
          to="/machines/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Machine</span>
        </Link>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <SortableHeader column="name">Machine</SortableHeader>
                <SortableHeader column="location">Location</SortableHeader>
                <SortableHeader column="type">Type</SortableHeader>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Perform QC</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {getSortedMachines().map((machine) => (
                <tr key={machine.machineId} className="hover:bg-gray-700">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-4 h-4" title={machine.status.toUpperCase()}>
                        {machine.status === 'operational' ? (
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        ) : machine.status === 'maintenance' ? (
                          <span className="text-yellow-500 text-sm font-bold">⚠️</span>
                        ) : machine.status === 'critical' ? (
                          <span className="text-red-500 text-sm font-bold">🚨</span>
                        ) : machine.status === 'offline' ? (
                          <span className="text-gray-500 text-sm font-bold">⭕</span>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        )}
                      </div>
                      <div>
                        <Link 
                          to={`/machines/${machine.machineId}`}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          {machine.name}
                        </Link>
                        <div className="text-xs text-gray-400">{machine.machineId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-300">
                    {machine.location.building}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-300">{machine.type}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-1">
                      {/* Assigned QC Performance Buttons */}
                      {(() => {
                        const assignedWorksheets = getAssignedWorksheets(machine);
                        if (assignedWorksheets.length === 0) {
                          return (
                            <div className="text-xs text-gray-500 italic">
                              No QC assigned
                            </div>
                          );
                        } else {
                          return (
                            <div className="space-y-1">
                              {assignedWorksheets.map(worksheet => (
                                <button
                                  key={worksheet.id}
                                  onClick={() => navigate(`/qc/perform/${machine.machineId}/${worksheet.frequency}/${worksheet.id}`)}
                                  className={`px-2 py-1 text-xs text-white rounded transition-colors flex items-center space-x-1 ${getFrequencyColor(worksheet.frequency)}`}
                                  title={`Perform ${worksheet.title} QC`}
                                >
                                  <span>▶️</span>
                                  <span>{worksheet.title}</span>
                                </button>
                              ))}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Reporting() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportFilters, setReportFilters] = useState({
    locations: [],
    machines: [],
    qcTypes: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0] // today
    }
  })
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      const response = await axios.get('/api/machines')
      setMachines(response.data)
    } catch (error) {
      console.error('Error fetching machines:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUniqueLocations = () => {
    const locations = machines.map(m => `${m.location.building} - ${m.location.room}`)
    return [...new Set(locations)].sort()
  }

  const getUniqueMachineTypes = () => {
    const types = machines.map(m => m.type)
    return [...new Set(types)].sort()
  }

  const getQCTypes = () => {
    return ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on-demand']
  }

  const handleLocationChange = (location, checked) => {
    setReportFilters(prev => ({
      ...prev,
      locations: checked 
        ? [...prev.locations, location]
        : prev.locations.filter(l => l !== location)
    }))
  }

  const handleMachineChange = (machineId, checked) => {
    setReportFilters(prev => ({
      ...prev,
      machines: checked 
        ? [...prev.machines, machineId]
        : prev.machines.filter(m => m !== machineId)
    }))
  }

  const handleQCTypeChange = (qcType, checked) => {
    setReportFilters(prev => ({
      ...prev,
      qcTypes: checked 
        ? [...prev.qcTypes, qcType]
        : prev.qcTypes.filter(t => t !== qcType)
    }))
  }

  const handleSelectAllLocations = () => {
    const allLocations = getUniqueLocations()
    setReportFilters(prev => ({
      ...prev,
      locations: prev.locations.length === allLocations.length ? [] : allLocations
    }))
  }

  const handleSelectAllMachines = () => {
    const allMachines = machines.map(m => m.machineId)
    setReportFilters(prev => ({
      ...prev,
      machines: prev.machines.length === allMachines.length ? [] : allMachines
    }))
  }

  const handleSelectAllQCTypes = () => {
    const allTypes = getQCTypes()
    setReportFilters(prev => ({
      ...prev,
      qcTypes: prev.qcTypes.length === allTypes.length ? [] : allTypes
    }))
  }

  const setQuickDateRange = (type, years = null) => {
    const today = new Date()
    const currentYear = today.getFullYear()
    let startDate, endDate

    switch (type) {
      case 'last30days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = today
        break
      
      case 'last90days':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        endDate = today
        break
      
      case 'ytd':
        startDate = new Date(currentYear, 0, 1) // January 1st of current year
        endDate = today
        break
      
      case 'lastyear':
        startDate = new Date(currentYear - 1, 0, 1) // January 1st of last year
        endDate = new Date(currentYear - 1, 11, 31) // December 31st of last year
        break
      
      case 'lastyears':
        if (years) {
          startDate = new Date(currentYear - years, 0, 1) // January 1st of (current year - years)
          endDate = today
        }
        break
      
      default:
        return
    }

    if (startDate && endDate) {
      setReportFilters(prev => ({
        ...prev,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }))
    }
  }

  const generateQCReport = async () => {
    if (reportFilters.locations.length === 0 || reportFilters.machines.length === 0 || reportFilters.qcTypes.length === 0) {
      alert('Please select at least one location, machine, and QC type.')
      return
    }

    setGenerating(true)
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('QC Report generated successfully! (This is a mock - in production, this would download a PDF/Excel file)')
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading reporting data...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100 mb-6">QC Reports</h1>
      
      {/* QC Report Generator */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Generate QC Report</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Locations Filter */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-100">Locations</h3>
              <button
                onClick={handleSelectAllLocations}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {reportFilters.locations.length === getUniqueLocations().length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getUniqueLocations().map(location => (
                <label key={location} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportFilters.locations.includes(location)}
                    onChange={(e) => handleLocationChange(location, e.target.checked)}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{location}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {reportFilters.locations.length} of {getUniqueLocations().length} selected
            </div>
          </div>

          {/* Machines Filter */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-100">Machines</h3>
              <button
                onClick={handleSelectAllMachines}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {reportFilters.machines.length === machines.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {machines.map(machine => (
                <label key={machine.machineId} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportFilters.machines.includes(machine.machineId)}
                    onChange={(e) => handleMachineChange(machine.machineId, e.target.checked)}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-sm">
                    <div className="text-gray-300">{machine.name}</div>
                    <div className="text-gray-500 text-xs">{machine.type} - {machine.machineId}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {reportFilters.machines.length} of {machines.length} selected
            </div>
          </div>

          {/* QC Types Filter */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-100">QC Types</h3>
              <button
                onClick={handleSelectAllQCTypes}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {reportFilters.qcTypes.length === getQCTypes().length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2">
              {getQCTypes().map(qcType => (
                <label key={qcType} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportFilters.qcTypes.includes(qcType)}
                    onChange={(e) => handleQCTypeChange(qcType, e.target.checked)}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300 capitalize">{qcType} QC</span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {reportFilters.qcTypes.length} of {getQCTypes().length} selected
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="mt-6 bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-100 mb-3">Date Range</h3>
          
          {/* Quick Date Range Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuickDateRange('last30days')}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange('last90days')}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
              >
                Last 90 Days
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange('ytd')}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
              >
                Year to Date
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange('lastyear')}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
              >
                Last Year
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Last</span>
                <select
                  onChange={(e) => setQuickDateRange('lastyears', parseInt(e.target.value))}
                  className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Years</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years</option>
                  <option value={5}>5 Years</option>
                  <option value={10}>10 Years</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={reportFilters.dateRange.start}
                onChange={(e) => setReportFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={reportFilters.dateRange.end}
                onChange={(e) => setReportFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={generateQCReport}
            disabled={generating || reportFilters.locations.length === 0 || reportFilters.machines.length === 0 || reportFilters.qcTypes.length === 0}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {generating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{generating ? 'Generating Report...' : 'Generate QC Report'}</span>
          </button>
        </div>
      </div>

      {/* Quick Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Machine Performance</h3>
          <p className="text-gray-400 mb-4">Analyze QC trends and performance metrics by machine.</p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            View Analytics
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Compliance Status</h3>
          <p className="text-gray-400 mb-4">Review compliance status across all equipment.</p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Check Compliance
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Failed QC Summary</h3>
          <p className="text-gray-400 mb-4">Review all failed QC tests requiring attention.</p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            View Failed QCs
          </button>
        </div>
      </div>
    </div>
  )
}


export default App