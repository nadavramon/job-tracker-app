#!/bin/bash

# Start both backend and frontend dev servers
# Usage: ./dev.sh

echo "🚀 Starting Job Tracker development servers..."

# Start backend (Spring Boot) in background
echo "📦 Starting backend on http://localhost:8080..."
(cd backend && ./mvnw spring-boot:run) &
BACKEND_PID=$!

# Start frontend (Next.js) in background
echo "🌐 Starting frontend on http://localhost:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# When Ctrl+C is pressed, kill both processes
trap "echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo ""
echo "✅ Both servers starting. Press Ctrl+C to stop both."
echo ""

wait
