#!/bin/bash

echo "======================================"
echo "Testing Tube Joint Visualizer Build"
echo "======================================"
echo ""

cd "$(dirname "$0")/dist"

echo "Launching AppImage..."
echo "(Press Ctrl+C after verifying the app works)"
echo ""

./"Tube Joint Visualizer-1.0.0.AppImage" --no-sandbox

echo ""
echo "Test complete!"
