#!/bin/bash

echo "=== Verifying Changes Were Applied ==="
echo ""

echo "1. Checking for jointMarkers array..."
if grep -q "this.jointMarkers = \[\]" src/renderer/app-main.js; then
    echo "✅ jointMarkers array found"
else
    echo "❌ jointMarkers array NOT found"
fi

echo ""
echo "2. Checking for visualizeJoint method..."
if grep -q "visualizeJoint(joint)" src/renderer/app-main.js; then
    echo "✅ visualizeJoint method found"
else
    echo "❌ visualizeJoint method NOT found"
fi

echo ""
echo "3. Checking for clearJointMarkers method..."
if grep -q "clearJointMarkers()" src/renderer/app-main.js; then
    echo "✅ clearJointMarkers method found"
else
    echo "❌ clearJointMarkers method NOT found"
fi

echo ""
echo "4. Checking for TransformControls.attach..."
if grep -q "this.transformControls.attach(tube.mesh)" src/renderer/app-main.js; then
    echo "✅ TransformControls attach found in selectTube"
else
    echo "❌ TransformControls attach NOT found"
fi

echo ""
echo "5. Checking for rotation mode (R key)..."
if grep -q "setMode('rotate')" src/renderer/app-main.js; then
    echo "✅ Rotation mode found"
else
    echo "❌ Rotation mode NOT found"
fi

echo ""
echo "6. Checking for angle display in UI..."
if grep -q "this.joints.map(j => \`\${j.angle}°\`)" src/renderer/app-main.js; then
    echo "✅ Angle display in UI found"
else
    echo "❌ Angle display NOT found"
fi

echo ""
echo "7. File modification time:"
ls -lh src/renderer/app-main.js | awk '{print $6, $7, $8, $9}'

echo ""
echo "8. File size:"
wc -l src/renderer/app-main.js

echo ""
echo "=== Summary ==="
echo "If all items above show ✅, the changes are in the file."
echo "If you don't see them in the app, you need to:"
echo "  1. Close the app completely (Ctrl+C or close window)"
echo "  2. Run: npm start"
echo "  3. Open DevTools (F12) and check console"
