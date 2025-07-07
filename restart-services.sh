#!/bin/bash

echo "🔄 Restarting QC Tracker services for reverse proxy configuration..."

# Kill existing node processes (but not code-server)
echo "🛑 Stopping existing services..."
pkill -f "node src/server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Start backend
echo "🚀 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🚀 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Services started!"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 Application URLs:"
echo "   Local Frontend:  http://192.168.1.182:3000"
echo "   Local Backend:   http://192.168.1.182:5000"
echo "   Public URL:      https://qctracker.a-naviq.com"
echo ""
echo "📋 To check status:"
echo "   ps aux | grep node"
echo ""
echo "📋 To stop services:"
echo "   pkill -f 'node src/server.js'"
echo "   pkill -f 'vite'"