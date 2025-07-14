import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const QCCalendar = ({ qcHistory, type, showOverview = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  const { machineId } = useParams();

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getQCStatus = (date) => {
    if (!qcHistory || qcHistory.length === 0) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const qc = qcHistory.find(q => q.date === dateStr);
    return qc ? qc.overallResult : null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500 border-green-600';
      case 'fail':
        return 'bg-red-500 border-red-600';
      case 'conditional':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  if (showOverview) {
    return (
      <QCOverviewCalendar navigate={navigate} />
    );
  }

  if (type === 'daily') {
    return (
      <DailyCalendar 
        currentDate={currentDate}
        qcHistory={qcHistory}
        navigateMonth={navigateMonth}
        navigateToToday={navigateToToday}
        getDaysInMonth={getDaysInMonth}
        getFirstDayOfMonth={getFirstDayOfMonth}
        getQCStatus={getQCStatus}
        getStatusColor={getStatusColor}
        isToday={isToday}
        isWeekend={isWeekend}
        navigate={navigate}
        machineId={machineId}
      />
    );
  }

  return (
    <MonthlyCalendar 
      currentDate={currentDate}
      qcHistory={qcHistory}
      navigateMonth={navigateMonth}
      navigateToToday={navigateToToday}
      getQCStatus={getQCStatus}
      getStatusColor={getStatusColor}
    />
  );
};

const DailyCalendar = ({ 
  currentDate, qcHistory, navigateMonth, navigateToToday,
  getDaysInMonth, getFirstDayOfMonth, getQCStatus, getStatusColor,
  isToday, isWeekend, navigate, machineId 
}) => {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const status = getQCStatus(date);
    
    // Only navigate if there's QC data for this day
    if (status) {
      const dateStr = date.toISOString().split('T')[0];
      navigate(`/machines/${machineId}/qc/${dateStr}`);
    }
  };

  const renderDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const status = getQCStatus(date);
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);
    const hasQC = status !== null;
    
    return (
      <div
        key={day}
        onClick={() => handleDayClick(day)}
        className={`
          relative h-12 border border-gray-700 flex items-center justify-center text-sm
          ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
          ${isWeekendDay ? 'bg-gray-900' : 'bg-gray-800'}
          ${hasQC ? 'cursor-pointer hover:bg-blue-900 transition-colors' : ''}
        `}
      >
        <span className={`${isCurrentDay ? 'font-bold text-blue-400' : 'text-gray-300'}`}>
          {day}
        </span>
        {status && (
          <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border ${getStatusColor(status)}`} />
        )}
        {!status && !isWeekendDay && (
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gray-700 border border-gray-600" />
        )}
        {hasQC && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-blue-400 text-gray-100 text-xs px-1 py-0.5 rounded shadow">
              View QC
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Daily QC Calendar</h3>
        <button
          onClick={navigateToToday}
          className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
        >
          Today
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-xl font-medium text-gray-100">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
      </div>

      <div className="mt-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" />
          <span>Passed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
          <span>Failed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600" />
          <span>Conditional</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600" />
          <span>Not Performed</span>
        </div>
      </div>
    </div>
  );
};

const MonthlyCalendar = ({ 
  currentDate, qcHistory, navigateMonth, navigateToToday,
  getQCStatus, getStatusColor 
}) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getMonthStatus = (month, year) => {
    if (!qcHistory || qcHistory.length === 0) return null;
    
    // Find QC for this month
    const qc = qcHistory.find(q => {
      const qcDate = new Date(q.date);
      return qcDate.getMonth() === month && qcDate.getFullYear() === year;
    });
    
    return qc ? qc.overallResult : null;
  };

  const renderMonth = (month) => {
    const status = getMonthStatus(month, selectedYear);
    const isCurrentMonth = month === new Date().getMonth() && selectedYear === new Date().getFullYear();
    
    return (
      <div
        key={month}
        className={`
          relative h-20 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${status ? getStatusColor(status) : 'bg-gray-900 border-gray-600'}
          ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <span className={`text-sm font-medium ${status ? 'text-white' : 'text-gray-400'}`}>
          {monthNames[month]}
        </span>
        <span className={`text-xs ${status ? 'text-white' : 'text-gray-400'}`}>
          {selectedYear}
        </span>
        {status && (
          <div className="absolute top-1 right-1">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Monthly QC Calendar</h3>
        <button
          onClick={navigateToToday}
          className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
        >
          Current Year
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setSelectedYear(selectedYear - 1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-xl font-medium text-gray-100">{selectedYear}</h4>
        
        <button
          onClick={() => setSelectedYear(selectedYear + 1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>

      <div className="mt-6 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-green-500 border border-green-600" />
          <span>Passed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-red-500 border border-red-600" />
          <span>Failed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-600" />
          <span>Conditional</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-gray-900 border border-gray-600" />
          <span>Not Performed</span>
        </div>
      </div>
    </div>
  );
};

const QCOverviewCalendar = ({ navigate }) => {
  const [machines, setMachines] = useState([]);
  const [customWorksheets, setCustomWorksheets] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'daily', 'monthly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'preventative-maintenance',
    date: '',
    machineId: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchMachines();
    loadCustomWorksheets();
    loadCalendarEvents();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axios.get('/api/machines');
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomWorksheets = () => {
    try {
      const stored = localStorage.getItem('qcWorksheets');
      if (stored) {
        setCustomWorksheets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading worksheets:', error);
    }
  };

  const loadCalendarEvents = () => {
    try {
      const stored = localStorage.getItem('qcCalendarEvents');
      if (stored) {
        setCalendarEvents(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  const saveCalendarEvents = (events) => {
    try {
      localStorage.setItem('qcCalendarEvents', JSON.stringify(events));
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
  };

  const addCalendarEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Please fill in required fields (Title and Date)');
      return;
    }

    const event = {
      id: Date.now() + Math.random(),
      ...newEvent,
      createdAt: new Date().toISOString()
    };

    const updatedEvents = [...calendarEvents, event];
    saveCalendarEvents(updatedEvents);

    // Reset form
    setNewEvent({
      title: '',
      type: 'preventative-maintenance',
      date: '',
      machineId: '',
      description: '',
      priority: 'medium'
    });
    setShowAddEventModal(false);
  };

  const deleteCalendarEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = calendarEvents.filter(event => event.id !== eventId);
      saveCalendarEvents(updatedEvents);
    }
  };

  const getAssignedFrequencies = (machine) => {
    const assignedFrequencies = [];
    if (machine && customWorksheets.length > 0) {
      ['daily', 'weekly', 'monthly', 'quarterly', 'annual'].forEach(frequency => {
        const hasWorksheet = customWorksheets.some(ws => 
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
    return assignedFrequencies;
  };

  const calculateDaysUntilDue = (machine, frequency) => {
    const today = new Date();
    const lastQCDate = machine.lastQCDate ? new Date(machine.lastQCDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const frequencyDays = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      annual: 365
    };

    const daysSinceLastQC = Math.floor((today - lastQCDate) / (1000 * 60 * 60 * 24));
    const intervalDays = frequencyDays[frequency];
    const daysUntilDue = intervalDays - daysSinceLastQC;
    
    return daysUntilDue;
  };

  const getMachineQCTasks = () => {
    const tasks = [];
    
    machines.forEach(machine => {
      const assignedFrequencies = getAssignedFrequencies(machine);
      
      assignedFrequencies.forEach(frequency => {
        const daysUntilDue = calculateDaysUntilDue(machine, frequency);
        
        tasks.push({
          machine,
          frequency,
          daysUntilDue,
          machineId: machine.machineId,
          machineName: machine.name,
          machineType: machine.type,
          status: machine.status
        });
      });
    });
    
    return tasks;
  };

  const groupTasksByDueDate = () => {
    const tasks = getMachineQCTasks();
    
    // Add calendar events to tasks
    const today = new Date();
    calendarEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const daysUntilDue = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      
      const machine = machines.find(m => m.machineId === event.machineId);
      
      tasks.push({
        isCalendarEvent: true,
        event,
        daysUntilDue,
        machineId: event.machineId,
        machineName: machine ? machine.name : 'General',
        machineType: machine ? machine.type : 'N/A',
        status: machine ? machine.status : 'N/A',
        eventType: event.type,
        title: event.title,
        description: event.description,
        priority: event.priority
      });
    });
    
    const groups = {
      overdue: [],
      dueToday: [],
      dueThisWeek: [],
      dueThisMonth: [],
      future: []
    };
    
    tasks.forEach(task => {
      if (task.daysUntilDue < 0) {
        groups.overdue.push(task);
      } else if (task.daysUntilDue === 0) {
        groups.dueToday.push(task);
      } else if (task.daysUntilDue <= 7) {
        groups.dueThisWeek.push(task);
      } else if (task.daysUntilDue <= 30) {
        groups.dueThisMonth.push(task);
      } else {
        groups.future.push(task);
      }
    });
    
    // Sort each group by days until due (ascending)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    });
    
    return groups;
  };

  const getFrequencyColor = (frequency) => {
    const colors = {
      daily: 'bg-blue-500',
      weekly: 'bg-green-500',
      monthly: 'bg-purple-500',
      quarterly: 'bg-yellow-500',
      annual: 'bg-red-500'
    };
    return colors[frequency] || 'bg-gray-500';
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual'
    };
    return labels[frequency] || frequency;
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      'preventative-maintenance': 'bg-orange-500',
      'scheduled-downtime': 'bg-red-500',
      'decommission': 'bg-gray-500',
      'other': 'bg-indigo-500'
    };
    return colors[eventType] || 'bg-gray-500';
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'preventative-maintenance': 'Preventative Maintenance',
      'scheduled-downtime': 'Scheduled Downtime',
      'decommission': 'Decommission',
      'other': 'Other'
    };
    return labels[eventType] || eventType;
  };

  const getEventTypeIcon = (eventType) => {
    const icons = {
      'preventative-maintenance': '🔧',
      'scheduled-downtime': '⏸️',
      'decommission': '🚫',
      'other': '📝'
    };
    return icons[eventType] || '📅';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const getAllQCDataForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const qcData = [];
    
    machines.forEach(machine => {
      const assignedFrequencies = getAssignedFrequencies(machine);
      
      assignedFrequencies.forEach(frequency => {
        let shouldHaveQC = false;
        
        // Determine if this machine should have QC on this date
        if (frequency === 'daily' && date.getDay() !== 0 && date.getDay() !== 6) {
          shouldHaveQC = true;
        } else if (frequency === 'weekly' && date.getDay() === 1) { // Mondays
          shouldHaveQC = true;
        } else if (frequency === 'monthly' && date.getDate() === 1) {
          shouldHaveQC = true;
        } else if (frequency === 'quarterly' && date.getDate() === 1 && [0, 3, 6, 9].includes(date.getMonth())) {
          shouldHaveQC = true;
        } else if (frequency === 'annual' && date.getDate() === 1 && date.getMonth() === 0) {
          shouldHaveQC = true;
        }
        
        if (shouldHaveQC) {
          // Generate random QC data for demo
          const hasQC = Math.random() < 0.8; // 80% chance of having QC done
          const results = ['pass', 'fail', 'conditional'];
          
          qcData.push({
            machineId: machine.machineId,
            machineName: machine.name,
            machineType: machine.type,
            frequency,
            date: dateStr,
            hasQC,
            result: hasQC ? results[Math.floor(Math.random() * results.length)] : null,
            isMissing: !hasQC
          });
        }
      });
    });
    
    // Add calendar events for this date
    const dayEvents = calendarEvents.filter(event => event.date === dateStr);
    dayEvents.forEach(event => {
      const machine = machines.find(m => m.machineId === event.machineId);
      qcData.push({
        isCalendarEvent: true,
        event,
        machineName: machine ? machine.name : 'General',
        machineType: machine ? machine.type : 'Facility',
        date: dateStr
      });
    });
    
    return qcData;
  };

  const getMonthQCData = (month, year) => {
    const monthData = [];
    const assignedMachines = machines.filter(machine => getAssignedFrequencies(machine).includes('monthly'));
    
    assignedMachines.forEach(machine => {
      // Check if monthly QC was done (first day of month)
      const firstDay = new Date(year, month, 1);
      const hasQC = Math.random() < 0.8;
      const results = ['pass', 'fail', 'conditional'];
      
      monthData.push({
        machineId: machine.machineId,
        machineName: machine.name,
        machineType: machine.type,
        frequency: 'monthly',
        hasQC,
        result: hasQC ? results[Math.floor(Math.random() * results.length)] : null,
        isMissing: !hasQC
      });
    });
    
    return monthData;
  };

  const formatDaysText = (days) => {
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return '1 day remaining';
    } else {
      return `${days} days remaining`;
    }
  };

  const renderTaskGroup = (title, tasks, bgColor, textColor, icon) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className={`rounded-lg p-4 ${bgColor}`}>
        <h3 className={`text-lg font-semibold ${textColor} mb-3 flex items-center`}>
          <span className="mr-2">{icon}</span>
          {title} ({tasks.length})
        </h3>
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div key={task.isCalendarEvent ? `event-${task.event.id}` : `${task.machineId}-${task.frequency}`} 
                 className="flex items-center justify-between p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-3">
                {task.isCalendarEvent ? (
                  <>
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getEventTypeColor(task.eventType)}`}>
                      {getEventTypeIcon(task.eventType)} {getEventTypeLabel(task.eventType)}
                    </span>
                    <div>
                      <div className="font-medium text-gray-100">{task.title}</div>
                      <div className="text-sm text-gray-400">
                        {task.machineName} {task.machineType !== 'N/A' && `• ${task.machineType}`}
                        {task.description && ` • ${task.description}`}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getFrequencyColor(task.frequency)}`}>
                      {getFrequencyLabel(task.frequency)}
                    </span>
                    <div>
                      <div className="font-medium text-gray-100">{task.machineName}</div>
                      <div className="text-sm text-gray-400">{task.machineType} • {task.machineId}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`text-sm font-medium ${textColor}`}>
                  {formatDaysText(task.daysUntilDue)}
                </div>
                {task.isCalendarEvent ? (
                  <button
                    onClick={() => deleteCalendarEvent(task.event.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="Delete Event"
                  >
                    🗑️
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/qc/perform/${task.machineId}/${task.frequency}`)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Perform QC
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnhancedDailyCalendar = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const renderDay = (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dayQCData = getAllQCDataForDate(date);
      
      const qcCounts = {
        total: dayQCData.filter(qc => !qc.isCalendarEvent).length,
        pass: dayQCData.filter(qc => !qc.isCalendarEvent && qc.result === 'pass').length,
        fail: dayQCData.filter(qc => !qc.isCalendarEvent && qc.result === 'fail').length,
        conditional: dayQCData.filter(qc => !qc.isCalendarEvent && qc.result === 'conditional').length,
        missing: dayQCData.filter(qc => !qc.isCalendarEvent && qc.isMissing).length,
        events: dayQCData.filter(qc => qc.isCalendarEvent).length
      };
      
      return (
        <div
          key={day}
          className={`
            relative min-h-24 border border-gray-700 p-1 text-xs
            ${isToday ? 'ring-2 ring-blue-500 bg-blue-900/20' : ''}
            ${isWeekend ? 'bg-gray-900' : 'bg-gray-800'}
          `}
        >
          <div className={`font-semibold mb-1 ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
            {day}
          </div>
          
          {/* QC Status Indicators */}
          {qcCounts.total > 0 && (
            <div className="space-y-0.5">
              {qcCounts.pass > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-green-400">{qcCounts.pass} Pass</span>
                </div>
              )}
              {qcCounts.fail > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-red-400">{qcCounts.fail} Fail</span>
                </div>
              )}
              {qcCounts.conditional > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-yellow-400">{qcCounts.conditional} Cond</span>
                </div>
              )}
              {qcCounts.missing > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <span className="text-red-300">{qcCounts.missing} Missing</span>
                </div>
              )}
            </div>
          )}
          
          {/* Calendar Events */}
          {qcCounts.events > 0 && (
            <div className="mt-1">
              {dayQCData.filter(qc => qc.isCalendarEvent).slice(0, 2).map(eventData => (
                <div key={eventData.event.id} className="text-xs text-orange-400 truncate">
                  {getEventTypeIcon(eventData.event.type)} {eventData.event.title}
                </div>
              ))}
              {qcCounts.events > 2 && (
                <div className="text-xs text-gray-400">+{qcCounts.events - 2} more</div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">QC Calendar - All Machines</h3>
          <button
            onClick={navigateToToday}
            className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
          >
            Today
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h4 className="text-xl font-medium text-gray-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-24" />
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
        </div>

        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Passed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Failed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Conditional</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Missing</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-orange-400">🔧</span>
            <span>Events</span>
          </div>
        </div>
      </div>
    );
  };

  const renderEnhancedMonthlyCalendar = () => {
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const renderMonth = (month) => {
      const monthQCData = getMonthQCData(month, selectedYear);
      const isCurrentMonth = month === new Date().getMonth() && selectedYear === new Date().getFullYear();
      
      const qcCounts = {
        pass: monthQCData.filter(qc => qc.result === 'pass').length,
        fail: monthQCData.filter(qc => qc.result === 'fail').length,
        conditional: monthQCData.filter(qc => qc.result === 'conditional').length,
        missing: monthQCData.filter(qc => qc.isMissing).length
      };
      
      const totalQCs = qcCounts.pass + qcCounts.fail + qcCounts.conditional + qcCounts.missing;
      
      return (
        <div
          key={month}
          className={`
            relative h-24 border-2 rounded-lg flex flex-col items-center justify-center p-2
            transition-all duration-200 hover:shadow-md
            ${totalQCs > 0 ? 'bg-gray-700 border-gray-600' : 'bg-gray-900 border-gray-600'}
            ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
          `}
        >
          <span className="text-sm font-medium text-gray-300 mb-1">
            {monthNames[month]} {selectedYear}
          </span>
          
          {totalQCs > 0 && (
            <div className="text-xs space-y-0.5 w-full">
              {qcCounts.pass > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-400">Pass:</span>
                  <span className="text-green-400">{qcCounts.pass}</span>
                </div>
              )}
              {qcCounts.fail > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-400">Fail:</span>
                  <span className="text-red-400">{qcCounts.fail}</span>
                </div>
              )}
              {qcCounts.conditional > 0 && (
                <div className="flex justify-between">
                  <span className="text-yellow-400">Cond:</span>
                  <span className="text-yellow-400">{qcCounts.conditional}</span>
                </div>
              )}
              {qcCounts.missing > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-300">Miss:</span>
                  <span className="text-red-300">{qcCounts.missing}</span>
                </div>
              )}
            </div>
          )}
          
          {totalQCs === 0 && (
            <span className="text-xs text-gray-500">No Monthly QCs</span>
          )}
        </div>
      );
    };

    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">Monthly QC Summary - All Machines</h3>
          <button
            onClick={() => setSelectedYear(new Date().getFullYear())}
            className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
          >
            Current Year
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h4 className="text-xl font-medium text-gray-100">{selectedYear}</h4>
          
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
        </div>

        <div className="mt-6 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Passed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Failed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span>Conditional</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-red-300"></div>
            <span>Missing</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading QC data...</div>
      </div>
    );
  }

  const taskGroups = groupTasksByDueDate();

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">QC Calendar & Schedule</h2>
            <p className="text-gray-400 mt-1">Manage QC tasks and calendar events</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'daily' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                📅 Daily
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                📆 Monthly
              </button>
            </div>

            <button
              onClick={() => setShowAddEventModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Conditional Content Based on View Mode */}
        {viewMode === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderTaskGroup(
                  'Overdue', 
                  taskGroups.overdue, 
                  'bg-red-900', 
                  'text-red-200', 
                  '🚨'
                )}
                
                {renderTaskGroup(
                  'Due Today', 
                  taskGroups.dueToday, 
                  'bg-orange-900', 
                  'text-orange-200', 
                  '⏰'
                )}
              </div>
              
              <div className="space-y-4">
                {renderTaskGroup(
                  'Due This Week', 
                  taskGroups.dueThisWeek, 
                  'bg-yellow-900', 
                  'text-yellow-200', 
                  '📅'
                )}
                
                {renderTaskGroup(
                  'Due This Month', 
                  taskGroups.dueThisMonth, 
                  'bg-blue-900', 
                  'text-blue-200', 
                  '📊'
                )}
              </div>
            </div>
            
            {(taskGroups.overdue.length === 0 && taskGroups.dueToday.length === 0 && 
              taskGroups.dueThisWeek.length === 0 && taskGroups.dueThisMonth.length === 0) && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">All Caught Up!</h3>
                <p className="text-gray-400">No QC tasks are due in the immediate future.</p>
              </div>
            )}
            
            {taskGroups.future.length > 0 && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-md font-semibold text-gray-200 mb-2">
                  📋 Future QC Tasks ({taskGroups.future.length})
                </h4>
                <div className="text-sm text-gray-400">
                  {taskGroups.future.length} QC tasks scheduled for more than 30 days out.
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced Daily Calendar View - All Machines */}
        {viewMode === 'daily' && renderEnhancedDailyCalendar()}

        {/* Enhanced Monthly Calendar View - All Machines */}
        {viewMode === 'monthly' && renderEnhancedMonthlyCalendar()}
      </div>

      {/* Add Calendar Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Add Calendar Event</h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="e.g., MRI Room 1 Maintenance"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type *
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="preventative-maintenance">Preventative Maintenance</option>
                  <option value="scheduled-downtime">Scheduled Downtime</option>
                  <option value="decommission">Decommission</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Machine (Optional)
                </label>
                <select
                  value={newEvent.machineId}
                  onChange={(e) => setNewEvent({...newEvent, machineId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General (No specific machine)</option>
                  {machines.map(machine => (
                    <option key={machine.machineId} value={machine.machineId}>
                      {machine.name} ({machine.machineId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Additional details about the event..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newEvent.priority}
                  onChange={(e) => setNewEvent({...newEvent, priority: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={addCalendarEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Event
              </button>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCCalendar;