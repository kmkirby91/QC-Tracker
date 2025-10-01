import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const QCStatusDashboard = ({ machine, qcHistory, customWorksheets = [] }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Get assigned worksheets from props (same data source as "Assigned QC Worksheets" section)
  const assignedWorksheets = customWorksheets.filter(worksheet => 
    worksheet.isWorksheet === true &&
    worksheet.assignedMachines && 
    worksheet.assignedMachines.includes(machine.machineId) &&
    worksheet.modality === machine.type
  );

  console.log(`🔍 QCStatusDashboard for ${machine.machineId}:`, {
    totalCustomWorksheets: customWorksheets.length,
    machineWorksheets: assignedWorksheets.length,
    worksheetDetails: assignedWorksheets.map(w => ({
      id: w.id,
      title: w.title,
      frequency: w.frequency,
      startDate: w.startDate
    }))
  });


  // Get QC completion status for a specific frequency
  const getQCStatus = (frequency) => {
    // Find worksheets for this frequency
    const frequencyWorksheets = assignedWorksheets.filter(w => w.frequency === frequency);
    
    if (frequencyWorksheets.length === 0) {
      return { hasWorksheets: false, completed: [], missing: [] };
    }

    // Check completion status from localStorage
    const completions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
    const todayCompletions = completions.filter(qc => 
      qc.machineId === machine.machineId && 
      qc.frequency === frequency && 
      qc.date === todayStr
    );

    // For simplicity, check if ANY QC was done today for this frequency
    const hasCompletionToday = todayCompletions.length > 0;

    // Determine if QC is due today based on frequency
    const isDueToday = (() => {
      switch (frequency) {
        case 'daily':
          // Daily is due every weekday
          const dayOfWeek = today.getDay();
          return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday
          
        case 'weekly':
          // Weekly is due once per week (let's say Mondays)
          return today.getDay() === 1;
          
        case 'monthly':
          // Monthly is due on the first weekday of the month
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const firstWeekday = new Date(firstDayOfMonth);
          while (firstWeekday.getDay() === 0 || firstWeekday.getDay() === 6) {
            firstWeekday.setDate(firstWeekday.getDate() + 1);
          }
          return today.toDateString() === firstWeekday.toDateString();
          
        case 'quarterly':
          // Quarterly is due on the first weekday of Jan, Apr, Jul, Oct
          const month = today.getMonth();
          const isQuarterMonth = [0, 3, 6, 9].includes(month); // Jan, Apr, Jul, Oct
          if (!isQuarterMonth) return false;
          
          const firstDayOfQuarter = new Date(today.getFullYear(), month, 1);
          const firstWeekdayOfQuarter = new Date(firstDayOfQuarter);
          while (firstWeekdayOfQuarter.getDay() === 0 || firstWeekdayOfQuarter.getDay() === 6) {
            firstWeekdayOfQuarter.setDate(firstWeekdayOfQuarter.getDate() + 1);
          }
          return today.toDateString() === firstWeekdayOfQuarter.toDateString();
          
        case 'annual':
          // Annual is due on January 2nd (first business day of year)
          return today.getMonth() === 0 && today.getDate() === 2;
          
        default:
          return false;
      }
    })();

    if (!isDueToday) {
      return { hasWorksheets: true, isDueToday: false, completed: [], missing: [] };
    }

    // If due today, check completion status
    if (hasCompletionToday) {
      return { 
        hasWorksheets: true, 
        isDueToday: true, 
        completed: frequencyWorksheets, 
        missing: [] 
      };
    } else {
      return { 
        hasWorksheets: true, 
        isDueToday: true, 
        completed: [], 
        missing: frequencyWorksheets 
      };
    }
  };

  // QC Widget Component
  const QCWidget = ({ frequency, title }) => {
    const status = getQCStatus(frequency);
    const { hasWorksheets, isDueToday, completed, missing } = status;

    if (!hasWorksheets) {
      return (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-300">{title}</h4>
            </div>
            <div className="text-xs text-gray-400">No worksheets assigned</div>
          </div>
        </div>
      );
    }

    if (!isDueToday) {
      return (
        <div className="bg-gray-700 rounded-lg p-3 border border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-300">{title}</h4>
            </div>
            <div className="text-xs text-gray-400">Not due today</div>
          </div>
        </div>
      );
    }

    // Due today - check completion status
    const allComplete = missing.length === 0 && completed.length > 0;
    const hasIncomplete = missing.length > 0;

    return (
      <div className={`rounded-lg p-3 border ${
        allComplete 
          ? 'bg-green-800 border-green-600' 
          : hasIncomplete 
            ? 'bg-red-800 border-red-600'
            : 'bg-gray-800 border-gray-600'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className={`text-sm font-medium ${
              allComplete 
                ? 'text-green-200' 
                : hasIncomplete 
                  ? 'text-red-200'
                  : 'text-gray-300'
            }`}>
              {title}
            </h4>
            <p className={`text-xs ${
              allComplete 
                ? 'text-green-300' 
                : hasIncomplete 
                  ? 'text-red-300'
                  : 'text-gray-400'
            }`}>
              Due today
            </p>
          </div>
          <div className={`text-xs ${
            allComplete 
              ? 'text-green-300' 
              : hasIncomplete 
                ? 'text-red-300'
                : 'text-gray-400'
          }`}>
            {completed.length}/{completed.length + missing.length} complete
          </div>
        </div>

        {hasIncomplete && (
          <div className="space-y-1">
            {missing.map((worksheet) => (
              <Link
                key={worksheet.id}
                to={`/qc/perform/${machine.machineId}/${frequency}/${worksheet.id}`}
                className="block text-red-300 hover:text-red-200 text-xs hover:underline transition-colors"
              >
                ▶️ {worksheet.title}
              </Link>
            ))}
          </div>
        )}

        {allComplete && (
          <div className="space-y-1">
            {completed.map((worksheet) => (
              <div key={worksheet.id} className="text-xs text-green-300">
                ✓ {worksheet.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Today's QC Dashboard</h2>
      
      {assignedWorksheets.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No QC worksheets assigned</h3>
          <p className="text-gray-400 mb-4">Assign worksheets to this machine to enable QC tracking.</p>
          <Link
            to="/worksheets"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Manage Worksheets
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QCWidget frequency="daily" title="Daily QC" />
          <QCWidget frequency="weekly" title="Weekly QC" />
          <QCWidget frequency="monthly" title="Monthly QC" />
          <QCWidget frequency="quarterly" title="Quarterly QC" />
          <QCWidget frequency="annual" title="Annual QC" />
        </div>
      )}
    </div>
  );
};

export default QCStatusDashboard;