#!/bin/bash

# Start both backend and frontend dev servers
# Usage: ./dev.sh

# Kill any leftover processes from a previous run
kill_port() {
    local pids
    pids=$(lsof -i :"$1" -t 2>/dev/null | grep -v "$$")
    if [ -n "$pids" ]; then
        echo "Killing leftover processes on port $1..."
        echo "$pids" | xargs kill 2>/dev/null
        sleep 1
        # Force-kill anything still alive
        pids=$(lsof -i :"$1" -t 2>/dev/null | grep -v "$$")
        if [ -n "$pids" ]; then
            echo "$pids" | xargs kill -9 2>/dev/null
        fi
    fi
}

kill_port 8080
kill_port 3000

echo "Starting Job Tracker development servers..."

# Start backend (Spring Boot) in background
echo "Starting backend on http://localhost:8080..."
(cd backend && ./mvnw spring-boot:run) &
BACKEND_PID=$!

# Start frontend (Next.js) in background
echo "Starting frontend on http://localhost:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# When Ctrl+C is pressed, gracefully stop both process trees
cleanup() {
    echo ""
    echo "Stopping servers..."

    # Send SIGTERM to process groups for graceful shutdown
    kill -- -$BACKEND_PID 2>/dev/null
    kill -- -$FRONTEND_PID 2>/dev/null

    # Wait briefly for graceful shutdown
    sleep 2

    # Force-kill anything still on the ports
    lsof -i :8080 -t 2>/dev/null | xargs kill -9 2>/dev/null
    lsof -i :3000 -t 2>/dev/null | xargs kill -9 2>/dev/null

    echo "Servers stopped."
}
trap cleanup EXIT INT TERM

echo ""
echo "Both servers starting. Press Ctrl+C to stop both."
echo ""

wait
