import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const QCCalendar = ({ qcHistory, type, showOverview = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(type || 'daily');
  const [worksheetAssignments, setWorksheetAssignments] = useState([]);
  const [qcCompletions, setQcCompletions] = useState([]);
  const [dueDates, setDueDates] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();
  const { machineId } = useParams();
  
  // Update activeTab when type prop changes (when parent component changes frequency)
  useEffect(() => {
    if (type && type !== activeTab) {
      setActiveTab(type);
    }
  }, [type]);

  useEffect(() => {
    if (machineId) {
      loadWorksheetAssignments();
      loadQCCompletions();
    }
  }, [machineId]);

  useEffect(() => {
    if (worksheetAssignments.length > 0) {
      generateDueDates();
      // Only set default tab if no type prop is provided (standalone mode)
      if (!type) {
        const activeFrequencies = getActiveFrequencies();
        if (activeFrequencies.length > 0 && !activeFrequencies.includes(activeTab)) {
          setActiveTab(activeFrequencies[0]);
        }
      }
    }
  }, [worksheetAssignments, qcCompletions, type]);

  const loadWorksheetAssignments = () => {
    try {
      const stored = localStorage.getItem('qcWorksheets');
      if (stored) {
        const allWorksheets = JSON.parse(stored);
        // Filter worksheets assigned to this machine
        const machineWorksheets = allWorksheets.filter(ws => 
          ws.assignedMachines && 
          ws.assignedMachines.includes(machineId) &&
          ws.isWorksheet === true
        );
        setWorksheetAssignments(machineWorksheets);
      }
    } catch (error) {
      console.error('Error loading worksheets:', error);
    }
  };

  const loadQCCompletions = async () => {
    try {
      const response = await axios.get(`/api/qc/completions?machineId=${machineId}`);
      setQcCompletions(response.data || []);
    } catch (error) {
      console.error('Error loading QC completions:', error);
      setQcCompletions([]);
    }
  };

  const generateDueDates = async () => {
    const newDueDates = {};
    
    for (const worksheet of worksheetAssignments) {
      try {
        const completedDates = qcCompletions
          .filter(qc => qc.frequency === worksheet.frequency)
          .map(qc => qc.date);
        
        const response = await axios.get('/api/qc/schedule/generate', {
          params: {
            frequency: worksheet.frequency,
            startDate: worksheet.startDate,
            completedDates: JSON.stringify(completedDates)
          }
        });
        
        newDueDates[worksheet.frequency] = response.data || [];
      } catch (error) {
        console.error(`Error generating due dates for ${worksheet.frequency}:`, error);
        newDueDates[worksheet.frequency] = [];
      }
    }
    
    setDueDates(newDueDates);
  };

  const getActiveFrequencies = () => {
    return worksheetAssignments.map(ws => ws.frequency).filter((freq, index, arr) => arr.indexOf(freq) === index);
  };

  const getQCStatusForDate = (date, frequency) => {
    const dateStr = date.toISOString().split('T')[0];
    const completion = qcCompletions.find(qc => qc.date === dateStr && qc.frequency === frequency);
    
    if (completion) {
      return {
        status: completion.overallResult || 'pass',
        hasQC: true,
        completion: completion
      };
    }
    
    // Check if this date should have QC based on the due dates
    const shouldHaveQC = dueDates[frequency] && dueDates[frequency].includes(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // For quarterly and annual, also check if this date falls within the completion window
    if (!shouldHaveQC && (frequency === 'quarterly' || frequency === 'annual')) {
      const relevantDueDates = dueDates[frequency] || [];
      
      if (frequency === 'quarterly') {
        // Check if this date is in the same quarter as any due date
        const dateQuarter = Math.floor(date.getMonth() / 3);
        const dateYear = date.getFullYear();
        
        const quarterDueDate = relevantDueDates.find(dueDate => {
          const due = new Date(dueDate);
          const dueQuarter = Math.floor(due.getMonth() / 3);
          return dueQuarter === dateQuarter && due.getFullYear() === dateYear;
        });
        
        if (quarterDueDate) {
          // Check if this quarter was completed
          const wasCompleted = qcCompletions.some(qc => {
            if (qc.frequency !== 'quarterly') return false;
            const compDate = new Date(qc.date);
            const compQuarter = Math.floor(compDate.getMonth() / 3);
            return compQuarter === dateQuarter && compDate.getFullYear() === dateYear;
          });
          
          if (wasCompleted) {
            return {
              status: 'pass',
              hasQC: true,
              completion: qcCompletions.find(qc => {
                const compDate = new Date(qc.date);
                const compQuarter = Math.floor(compDate.getMonth() / 3);
                return compQuarter === dateQuarter && compDate.getFullYear() === dateYear && qc.frequency === 'quarterly';
              })
            };
          } else if (checkDate <= today) {
            return {
              status: 'overdue',
              hasQC: false,
              isOverdue: true,
              daysPastDue: Math.ceil((today - new Date(quarterDueDate)) / (1000 * 60 * 60 * 24))
            };
          }
        }
      } else if (frequency === 'annual') {
        // Check if this date is in the same year as any due date
        const dateYear = date.getFullYear();
        
        const yearDueDate = relevantDueDates.find(dueDate => {
          return new Date(dueDate).getFullYear() === dateYear;
        });
        
        if (yearDueDate) {
          // Check if this year was completed
          const wasCompleted = qcCompletions.some(qc => {
            return qc.frequency === 'annual' && new Date(qc.date).getFullYear() === dateYear;
          });
          
          if (wasCompleted) {
            return {
              status: 'pass',
              hasQC: true,
              completion: qcCompletions.find(qc => 
                qc.frequency === 'annual' && new Date(qc.date).getFullYear() === dateYear
              )
            };
          } else if (checkDate <= today) {
            return {
              status: 'overdue',
              hasQC: false,
              isOverdue: true,
              daysPastDue: Math.ceil((today - new Date(yearDueDate)) / (1000 * 60 * 60 * 24))
            };
          }
        }
      }
    }
    
    if (shouldHaveQC && checkDate <= today) {
      return {
        status: 'overdue',
        hasQC: false,
        isOverdue: true,
        daysPastDue: Math.ceil((today - checkDate) / (1000 * 60 * 60 * 24))
      };
    }
    
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500 border-green-600'; // QC Done
      case 'fail':
        return 'bg-red-500 border-red-600'; // QC Failed
      case 'complete':
        return 'bg-blue-500 border-blue-600'; // QC Complete
      case 'conditional':
        return 'bg-yellow-500 border-yellow-600';
      case 'overdue':
        return 'bg-yellow-600 border-yellow-700';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };

  const getStatusIcon = (status, daysPastDue) => {
    switch (status) {
      case 'pass':
        return <span className="text-white text-xs">✓</span>;
      case 'fail':
        return <span className="text-white text-xs">✗</span>;
      case 'conditional':
        return <span className="text-white text-xs">!</span>;
      case 'overdue':
        return daysPastDue > 3 ? <span className="text-white text-xs">🚨</span> : <span className="text-white text-xs">⚠</span>;
      default:
        return null;
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

  const handleDayClick = (day, frequency) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const qcStatus = getQCStatusForDate(date, frequency);
    
    if (qcStatus && qcStatus.hasQC) {
      const dateStr = date.toISOString().split('T')[0];
      navigate(`/machines/${machineId}/qc/${dateStr}`);
    } else if (qcStatus && qcStatus.isOverdue) {
      // Navigate to perform QC for overdue items
      const worksheet = worksheetAssignments.find(ws => ws.frequency === frequency);
      if (worksheet) {
        navigate(`/qc/perform/${machineId}/${frequency}/${worksheet.id}`);
      }
    }
  };

  const renderDailyCalendar = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const renderDay = (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const qcStatus = getQCStatusForDate(date, 'daily');
      const isCurrentDay = isToday(date);
      const isWeekendDay = isWeekend(date);
      
      return (
        <div
          key={day}
          onClick={() => handleDayClick(day, 'daily')}
          className={`
            relative h-12 border border-gray-700 flex items-center justify-center text-sm
            ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
            ${isWeekendDay ? 'bg-gray-900' : 'bg-gray-800'}
            ${qcStatus ? 'cursor-pointer hover:bg-blue-900 transition-colors' : ''}
          `}
        >
          <span className={`${isCurrentDay ? 'font-bold text-blue-400' : 'text-gray-300'}`}>
            {day}
          </span>
          
          {qcStatus && (
            <div className={`absolute top-1 right-1 w-4 h-4 rounded-full border flex items-center justify-center ${getStatusColor(qcStatus.status)}`}>
              {getStatusIcon(qcStatus.status, qcStatus.daysPastDue)}
            </div>
          )}
          
          {qcStatus && qcStatus.isOverdue && qcStatus.daysPastDue > 0 && (
            <div className="absolute bottom-0 right-0 bg-red-600 text-white text-xs px-1 rounded-tl">
              {qcStatus.daysPastDue}d
            </div>
          )}
          
          {qcStatus && qcStatus.hasQC && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-blue-400 text-gray-100 text-xs px-1 py-0.5 rounded shadow">
                View QC
              </div>
            </div>
          )}
          
          {qcStatus && qcStatus.isOverdue && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-red-500 text-white text-xs px-1 py-0.5 rounded shadow">
                Perform QC
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
      </div>
    );
  };

  const renderWeeklyCalendar = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Generate weeks for the current month
    const generateWeeksForMonth = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const weeks = [];
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Find the start of the first week (Sunday)
      const startOfFirstWeek = new Date(firstDay);
      startOfFirstWeek.setDate(firstDay.getDate() - firstDay.getDay());
      
      // Generate weeks until we cover the entire month
      let currentWeekStart = new Date(startOfFirstWeek);
      let weekNumber = 1;
      
      while (currentWeekStart <= lastDay) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        // Check if this week has any days in the current month
        if (weekEnd >= firstDay && currentWeekStart <= lastDay) {
          weeks.push({
            weekNumber: weekNumber++,
            startDate: new Date(currentWeekStart),
            endDate: new Date(weekEnd),
            label: `Week ${weekNumber - 1}`,
            dateRange: `${currentWeekStart.getDate()}${currentWeekStart.getMonth() !== month ? `/${monthNames[currentWeekStart.getMonth()].substr(0,3)}` : ''} - ${weekEnd.getDate()}${weekEnd.getMonth() !== month ? `/${monthNames[weekEnd.getMonth()].substr(0,3)}` : ''}`
          });
        }
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
      
      return weeks;
    };

    const renderWeek = (week) => {
      // Check each day in the week for QC status
      let weekQCStatus = null;
      const today = new Date();
      
      // Check if any day in this week has weekly QC due
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(week.startDate);
        checkDate.setDate(week.startDate.getDate() + i);
        const qcStatus = getQCStatusForDate(checkDate, 'weekly');
        if (qcStatus) {
          weekQCStatus = qcStatus;
          break;
        }
      }
      
      const isCurrentWeek = (() => {
        const startOfCurrentWeek = new Date(today);
        startOfCurrentWeek.setDate(today.getDate() - today.getDay());
        const endOfCurrentWeek = new Date(startOfCurrentWeek);
        endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6);
        
        return week.startDate <= endOfCurrentWeek && week.endDate >= startOfCurrentWeek;
      })();
      
      return (
        <div
          key={week.weekNumber}
          onClick={() => weekQCStatus && handleDayClick(week.startDate.getDate(), 'weekly')}
          className={`
            relative h-20 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
            transition-all duration-200 hover:shadow-md
            ${weekQCStatus ? getStatusColor(weekQCStatus.status) : 'bg-gray-900 border-gray-600'}
            ${isCurrentWeek ? 'ring-2 ring-blue-500' : ''}
          `}
        >
          <span className={`text-sm font-medium ${weekQCStatus ? 'text-white' : 'text-gray-400'} mb-1`}>
            {week.label}
          </span>
          <div className={`text-xs ${weekQCStatus ? 'text-white' : 'text-gray-400'} text-center`}>
            {week.dateRange}
          </div>
          
          {weekQCStatus && weekQCStatus.hasQC && (
            <div className="absolute top-2 right-2">
              {getStatusIcon(weekQCStatus.status)}
            </div>
          )}
          
          {weekQCStatus && weekQCStatus.isOverdue && weekQCStatus.daysPastDue > 0 && (
            <div className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-1 rounded">
              {weekQCStatus.daysPastDue}d overdue
            </div>
          )}
          
          {!weekQCStatus && (
            <div className="text-xs text-gray-500 mt-1">No QC Due</div>
          )}
        </div>
      );
    };

    const weeks = generateWeeksForMonth();

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h4 className="text-xl font-medium text-gray-100">
            Weekly QC - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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

        <div className="grid grid-cols-1 gap-3">
          {weeks.map(week => renderWeek(week))}
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          Each row represents one week. QC may be due on specific days within the week.
        </div>
      </div>
    );
  };

  const renderMonthlyCalendar = () => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const renderMonth = (month) => {
      const date = new Date(selectedYear, month, 1);
      const qcStatus = getQCStatusForDate(date, 'monthly');
      const isCurrentMonth = month === new Date().getMonth() && selectedYear === new Date().getFullYear();
      
      return (
        <div
          key={month}
          className={`
            relative h-20 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
            transition-all duration-200 hover:shadow-md
            ${qcStatus ? getStatusColor(qcStatus.status) : 'bg-gray-900 border-gray-600'}
            ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
          `}
          onClick={() => qcStatus && qcStatus.isOverdue && handleDayClick(1, 'monthly')}
        >
          <span className={`text-sm font-medium ${qcStatus ? 'text-white' : 'text-gray-400'}`}>
            {monthNames[month]}
          </span>
          <span className={`text-xs ${qcStatus ? 'text-white' : 'text-gray-400'}`}>
            {selectedYear}
          </span>
          
          {qcStatus && qcStatus.hasQC && (
            <div className="absolute top-1 right-1">
              {getStatusIcon(qcStatus.status)}
            </div>
          )}
          
          {qcStatus && qcStatus.isOverdue && qcStatus.daysPastDue > 0 && (
            <div className="absolute bottom-1 right-1 bg-red-600 text-white text-xs px-1 rounded">
              {qcStatus.daysPastDue}d overdue
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
      </div>
    );
  };

  const renderQuarterlyCalendar = () => {
    const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
    const quarterMonths = [
      ['Jan', 'Feb', 'Mar'],
      ['Apr', 'May', 'Jun'],
      ['Jul', 'Aug', 'Sep'],
      ['Oct', 'Nov', 'Dec']
    ];

    const renderQuarter = (quarter) => {
      const isCurrentQuarter = quarter === Math.floor(new Date().getMonth() / 3) && selectedYear === new Date().getFullYear();
      
      // Find specific due dates for this quarter
      const quarterDueDates = dueDates['quarterly'] ? dueDates['quarterly'].filter(dateStr => {
        const dueDate = new Date(dateStr);
        const dueYear = dueDate.getFullYear();
        const dueQuarter = Math.floor(dueDate.getMonth() / 3);
        return dueYear === selectedYear && dueQuarter === quarter;
      }) : [];
      
      // Get QC status for this quarter
      let quarterQCStatus = null;
      if (quarterDueDates.length > 0) {
        const quarterStartDate = new Date(selectedYear, quarter * 3, 15); // Mid-quarter date
        quarterQCStatus = getQCStatusForDate(quarterStartDate, 'quarterly');
      }
      
      // Get the earliest due date for display
      const earliestDueDate = quarterDueDates.length > 0 ? quarterDueDates.sort()[0] : null;
      const dueDateDisplay = earliestDueDate ? new Date(earliestDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
      
      return (
        <div
          key={quarter}
          className={`
            relative h-36 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
            transition-all duration-200 hover:shadow-md
            ${quarterQCStatus ? getStatusColor(quarterQCStatus.status) : 'bg-gray-900 border-gray-600'}
            ${isCurrentQuarter ? 'ring-2 ring-blue-500' : ''}
          `}
          onClick={() => quarterQCStatus && quarterQCStatus.isOverdue && handleDayClick(1, 'quarterly')}
        >
          <span className={`text-xl font-bold ${quarterQCStatus ? 'text-white' : 'text-gray-400'} mb-2`}>
            {quarterNames[quarter]}
          </span>
          <div className={`text-xs ${quarterQCStatus ? 'text-white' : 'text-gray-400'} text-center mb-1`}>
            {quarterMonths[quarter].join(' • ')}
          </div>
          <span className={`text-xs ${quarterQCStatus ? 'text-white' : 'text-gray-400'} mb-1`}>
            {selectedYear}
          </span>
          
          {dueDateDisplay && (
            <div className={`text-xs font-medium ${quarterQCStatus ? 'text-white' : 'text-gray-300'} bg-black bg-opacity-20 px-2 py-1 rounded`}>
              Due: {dueDateDisplay}
            </div>
          )}
          
          {quarterQCStatus && quarterQCStatus.hasQC && (
            <div className="absolute top-2 right-2">
              {getStatusIcon(quarterQCStatus.status)}
            </div>
          )}
          
          {quarterQCStatus && quarterQCStatus.isOverdue && quarterQCStatus.daysPastDue > 0 && (
            <div className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-1 rounded">
              {quarterQCStatus.daysPastDue}d overdue
            </div>
          )}
          
          {!quarterQCStatus && (
            <div className="text-xs text-gray-500 mt-1">No QC Due</div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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

        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }, (_, i) => renderQuarter(i))}
        </div>
      </div>
    );
  };

  const renderAnnualCalendar = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);

    const renderYear = (year) => {
      const isCurrentYear = year === currentYear;
      
      // Find specific due dates for this year
      const yearDueDates = dueDates['annual'] ? dueDates['annual'].filter(dateStr => {
        const dueDate = new Date(dateStr);
        return dueDate.getFullYear() === year;
      }) : [];
      
      // Get QC status for this year
      let yearQCStatus = null;
      if (yearDueDates.length > 0) {
        const yearMidDate = new Date(year, 6, 1); // Mid-year date
        yearQCStatus = getQCStatusForDate(yearMidDate, 'annual');
      }
      
      // Get the earliest due date for display
      const earliestDueDate = yearDueDates.length > 0 ? yearDueDates.sort()[0] : null;
      const dueDateDisplay = earliestDueDate ? new Date(earliestDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : null;
      
      return (
        <div
          key={year}
          className={`
            relative h-40 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
            transition-all duration-200 hover:shadow-md
            ${yearQCStatus ? getStatusColor(yearQCStatus.status) : 'bg-gray-900 border-gray-600'}
            ${year === currentYear ? 'ring-2 ring-blue-500' : ''}
          `}
          onClick={() => yearQCStatus && yearQCStatus.isOverdue && handleDayClick(1, 'annual')}
        >
          <span className={`text-3xl font-bold ${yearQCStatus ? 'text-white' : 'text-gray-400'} mb-2`}>
            {year}
          </span>
          
          {dueDateDisplay && (
            <div className={`text-sm font-medium ${yearQCStatus ? 'text-white' : 'text-gray-300'} bg-black bg-opacity-20 px-3 py-1 rounded`}>
              Due: {dueDateDisplay}
            </div>
          )}
          
          {yearQCStatus && yearQCStatus.hasQC && (
            <div className="absolute top-2 right-2">
              {getStatusIcon(yearQCStatus.status)}
            </div>
          )}
          
          {yearQCStatus && yearQCStatus.isOverdue && yearQCStatus.daysPastDue > 0 && (
            <div className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-1 rounded">
              {yearQCStatus.daysPastDue}d overdue
            </div>
          )}
          
          {!yearQCStatus && (
            <div className="text-xs text-gray-500 mt-2">No QC Due</div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {years.map(year => renderYear(year))}
        </div>
      </div>
    );
  };

  const renderCalendarContent = () => {
    switch (activeTab) {
      case 'daily':
        return renderDailyCalendar();
      case 'weekly':
        return renderWeeklyCalendar();
      case 'monthly':
        return renderMonthlyCalendar();
      case 'quarterly':
        return renderQuarterlyCalendar();
      case 'annual':
        return renderAnnualCalendar();
      default:
        return renderDailyCalendar();
    }
  };

  if (showOverview) {
    // Return the existing overview calendar for the main dashboard
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">QC Overview Calendar</h3>
        <p className="text-gray-400">Overview calendar functionality would be implemented here.</p>
      </div>
    );
  }

  const activeFrequencies = getActiveFrequencies();

  if (activeFrequencies.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">QC Calendar</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-200 mb-2">No QC Schedules Active</h4>
          <p className="text-gray-400">Assign worksheets to this machine to see QC calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100">QC Calendar</h3>
        <button
          onClick={navigateToToday}
          className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
        >
          Today
        </button>
      </div>

      {/* Frequency Tabs - Only show if no type prop (standalone mode) */}
      {!type && (
        <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
          {activeFrequencies.map(frequency => (
            <button
              key={frequency}
              onClick={() => setActiveTab(frequency)}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize
                ${activeTab === frequency 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }
              `}
            >
              {frequency}
            </button>
          ))}
        </div>
      )}

      {/* Calendar Content */}
      {renderCalendarContent()}

      {/* Legend */}
      <div className="mt-6 flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" />
          <span>QC Done</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600" />
          <span>Complete</span>
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
          <div className="w-3 h-3 rounded-full bg-yellow-600 border border-yellow-700" />
          <span>Overdue</span>
        </div>
      </div>
    </div>
  );
};

export default QCCalendar;