import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ensureSampleWorksheets } from '../utils/initializeSampleWorksheets';

const MachineDetail = () => {
  const { machineId } = useParams();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachineData();
    ensureSampleWorksheets();
  }, [machineId]);

  const fetchMachineData = async () => {
    try {
      setLoading(true);
      const machineRes = await axios.get(`/api/machines/${machineId}`);
      setMachine(machineRes.data);
    } catch (error) {
      console.error('Error fetching machine data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machine details...</div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Machine not found (ID: {machineId})</p>
        <Link to="/" className="text-blue-400 hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Temporary debug return to test basic rendering
  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">DEBUG: Machine Detail Page</h1>
      <div className="space-y-2">
        <p><strong>Machine ID:</strong> {machineId}</p>
        <p><strong>Machine Name:</strong> {machine?.name || 'Loading...'}</p>
        <p><strong>Machine Type:</strong> {machine?.type || 'Loading...'}</p>
        <p><strong>Status:</strong> {machine?.status || 'Loading...'}</p>
        <p><strong>Location:</strong> {machine?.location?.building} - {machine?.location?.room}</p>
        <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
      </div>
      <div className="mt-6">
        <Link to="/" className="text-blue-400 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default MachineDetail;