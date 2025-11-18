#!/bin/bash
# Simple HTTP server for testing

echo "🌐 Starting test server on http://localhost:8080"
echo "📱 Open test-browser.html in your browser"
echo "Press Ctrl+C to stop"
echo ""

cd "$(dirname "$0")"

# Try different methods to start a server
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8080
elif command -v php &> /dev/null; then
    php -S localhost:8080
else
    echo "❌ No HTTP server available. Please install python3."
    exit 1
fi
