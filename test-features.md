# Testing Guide - Nov 20, 2025

## How to Test the New Features

### 1. Start the Application
```bash
npm start
```

### 2. Test Visual Joint Markers

**Steps:**
1. Click "Add Tube" button twice (creates 2 tubes)
2. The tubes should be positioned offset from each other
3. Click on the second tube to select it (should turn yellow)
4. **Expected:** You should see RGB arrows (gizmo) appear on the tube
5. Drag one of the tubes close to the other (within ~100mm)
6. **Expected:** 
   - Red sphere should appear at the midpoint between tubes
   - Magenta line should connect the tubes
   - Info panel should show "Joints: 1 [90°]" (or other angle)

**What to check:**
- [ ] Do you see the RGB gizmo arrows when you click a tube?
- [ ] Can you drag the tube by clicking and dragging the arrows?
- [ ] Does a red sphere appear when tubes are close?
- [ ] Does a magenta line connect the tubes?
- [ ] Does the info panel show the angle?

### 3. Test Rotation Controls

**Steps:**
1. Click on a tube to select it (should turn yellow)
2. Press 'R' key on keyboard
3. **Expected:** Console should log "🔄 Rotation mode activated"
4. **Expected:** Gizmo should change to rotation rings
5. Try dragging the rotation rings
6. Press 'T' key to go back to translation mode
7. **Expected:** Console should log "↔️ Translation mode activated"

**What to check:**
- [ ] Does pressing 'R' show rotation rings?
- [ ] Can you rotate the tube?
- [ ] Does pressing 'T' show translation arrows again?

### 4. Open Developer Console

**To see what's happening:**
- Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- Look for console messages
- Should see:
  - "🎨 Initializing 3D scene..."
  - "✓ Scene created"
  - etc.

**When you click a tube:**
- Should see: "🎯 TransformControls attached to tube"

**When you press R:**
- Should see: "🔄 Rotation mode activated"

### 5. Check for Errors

Look in the console for any **RED error messages**.

Common issues:
- "Cannot read property..." - means something is undefined
- "THREE is not defined" - import issue
- No errors but nothing visible - renderer/camera issue

## What to Report Back

Please tell me:
1. ✅ or ❌ Do you see the gizmo arrows when selecting a tube?
2. ✅ or ❌ Can you drag tubes with the gizmo?
3. ✅ or ❌ Do joint markers (red sphere + magenta line) appear?
4. ✅ or ❌ Does pressing R change to rotation mode?
5. ✅ or ❌ Are there any RED errors in console?
6. What console messages do you see?

## Debugging Commands

If nothing works, try these in the project directory:

```bash
# Check if changes are actually in the file
grep "jointMarkers" src/renderer/app-main.js

# Should output:
#         this.jointMarkers = [];
#         this.clearJointMarkers();
# ... etc

# Check file was modified today
ls -la src/renderer/app-main.js

# Should show today's date

# Restart with clean cache
rm -rf node_modules/.cache
npm start
```
