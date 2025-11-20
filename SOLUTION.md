# 🔧 TransformControls Not Visible - Solution

## The Problem
TransformControls are being attached correctly (logs confirm it), but the gizmo arrows are not visible on screen.

## Root Causes (Most Likely)

### 1. **Renderer Depth/Order Issue**
The gizmo might be rendering behind the tubes or being clipped.

### 2. **Camera Distance**
If camera is too close or too far, gizmo might not scale properly.

### 3. **Group vs Mesh**
TransformControls work with Groups, but might need special handling.

## Solutions Applied

### ✅ Already Done:
1. Increased gizmo size to 1.5
2. Added explicit `visible = true` and `enabled = true`
3. Added `updateMatrixWorld()` in animate loop
4. Moved camera further away (400, 400, 400)
5. Added extensive debug logging
6. Added bounding box to tubes for easier selection

### 🔴 Still Need to Try:

## SOLUTION A: Force Render on Top

Edit `src/renderer/app-main.js`:

```javascript
// In init() method, after creating renderer
this.renderer.autoClear = false;
```

```javascript
// In animate() method
animate() {
    requestAnimationFrame(() => this.animate());
    
    this.orbitControls.update();
    this.detectJoints();
    
    // Render scene first
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    
    // Force controls to render on top
    if (this.transformControls && this.transformControls.visible) {
        this.renderer.clearDepth();
        this.renderer.render(this.transformControls, this.camera);
    }
}
```

## SOLUTION B: Different Control Library

Use a simpler drag system instead of TransformControls:

```javascript
// Add to constructor
this.isDragging = false;
this.dragPlane = new THREE.Plane();
this.dragOffset = new THREE.Vector3();
this.dragIntersection = new THREE.Vector3();

// In onMouseClick, change to onMouseDown
onMouseDown(event) {
    // ... existing raycaster code ...
    if (intersects.length > 0) {
        const tube = this.tubes.find(t => ...);
        if (tube) {
            this.selectTube(tube.mesh);
            this.isDragging = true;
            
            // Setup drag plane at tube height
            this.dragPlane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(0, 1, 0),
                tube.mesh.position
            );
            
            this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset);
            this.dragOffset.sub(tube.mesh.position);
        }
    }
}

onMouseMove(event) {
    if (!this.isDragging || !this.selectedTube) return;
    
    // Update mouse position
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
        this.selectedTube.mesh.position.copy(this.dragIntersection.sub(this.dragOffset));
        this.detectJoints();
    }
}

onMouseUp() {
    if (this.isDragging) {
        this.isDragging = false;
        this.saveState();
    }
}

// Add event listeners
this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
this.renderer.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
```

## SOLUTION C: Use DragControls Instead

```javascript
import { DragControls } from 'three/addons/controls/DragControls.js';

// In init(), replace TransformControls with DragControls
this.dragControls = new DragControls([], this.camera, this.renderer.domElement);
this.dragControls.addEventListener('dragstart', () => {
    this.orbitControls.enabled = false;
});
this.dragControls.addEventListener('dragend', () => {
    this.orbitControls.enabled = true;
    this.saveState();
});
this.dragControls.addEventListener('drag', () => {
    this.detectJoints();
});

// When tubes change, update DragControls
updateDragControls() {
    const objects = this.tubes.map(t => t.mesh);
    this.dragControls.getObjects().length = 0;
    this.dragControls.getObjects().push(...objects);
}

// Call updateDragControls() after addTube() and deleteTube()
```

## Quick Test Command

```bash
# 1. Apply SOLUTION B (simplest, most reliable)
# 2. Restart: npm start
# 3. Add tubes
# 4. Click and drag directly on tubes
```

## Which Solution to Use?

**Recommended: SOLUTION B (Custom Drag)**
- Most control
- Always works
- No external dependencies on problematic TransformControls
- Can add visual feedback easily

**Alternative: SOLUTION C (DragControls)**
- Built-in Three.js
- Simpler than TransformControls
- More reliable
- But doesn't have rotation capability

**Last Resort: SOLUTION A**
- Keep TransformControls
- Try rendering tricks
- Most complex
- Might not work

## What User Should See After Fix

✅ Click on tube → tube turns yellow
✅ Drag tube → tube follows mouse
✅ Release → tube stays in new position
✅ Tubes close together → red sphere + magenta line appear
✅ Info panel shows: "Joints: 1 [90°]"

For rotation:
✅ Click tube → select it
✅ Press R → rotation handles appear (for TransformControls) OR
✅ Use arrow keys to rotate (for custom drag)

