# 🔍 Refinement Notes - Based on Testing

## Issues Found:

1. **RGB Arrows on Every Tube** - Too cluttered
   - Should only appear on SELECTED tube
   - Clean up visual clutter

2. **Joint Markers (Magenta Lines)** - Not updating correctly
   - Should update when tubes rotate
   - Need to recalculate when rotation changes

3. **Professional Appearance**
   - Less visual noise
   - Clear focus on selected tube
   - Clean joint visualization

## Proposed Changes:

### 1. Show RGB Arrows ONLY on Selected Tube
- Hide arrows by default
- Show only when tube is selected (yellow)
- Remove when deselected

### 2. Fix Joint Marker Updates
- Recalculate joint positions when rotating
- Update line endpoints correctly
- Clear and redraw on every frame

### 3. Professional Polish:
- Larger joint spheres (more visible)
- Thicker magenta lines
- Better contrast
- Clean up unnecessary elements

## Implementation Plan:
1. Modify addAxisArrows to hide arrows by default
2. Show/hide arrows in selectTube/deselectTube
3. Fix joint marker positioning
4. Test rotation with joint updates
