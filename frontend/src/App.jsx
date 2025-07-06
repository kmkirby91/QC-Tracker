import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import MachineCard from './components/MachineCard'
import StatusSummary from './components/StatusSummary'
import FilterBar from './components/FilterBar'
import MachineDetail from './components/MachineDetail'
import QCTestDetail from './components/QCTestDetail'
import DueToday from './components/DueToday'
import DueTasksWidget from './components/DueTasksWidget'
import QCForm from './components/QCForm'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Toaster position="top-right" />
          <header className="bg-gray-800 shadow-lg border-b border-gray-700">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-100">QC Tracker - Medical Imaging</h1>
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
          </header>
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/due-today" element={<DueToday />} />
              <Route path="/machines/:machineId" element={<MachineDetail />} />
              <Route path="/machines/:machineId/qc/:date" element={<QCTestDetail />} />
              <Route path="/qc/perform/:machineId/:frequency" element={<QCForm />} />
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

export default App