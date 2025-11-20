import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



// ============================================
// MAIN APPLICATION CLASS
// ============================================




class TubeJointVisualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.orbitControls = null;
        
        this.tubes = [];
        this.selectedTube = null;
        this.joints = [];
        this.jointMarkers = [];
        this.axisHelpers = [];
        this.boundingBoxHelper = null; // Store bounding box for selected tube
        
        // Custom drag system
        this.isDragging = false;
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.dragOffset = new THREE.Vector3();
        this.dragIntersection = new THREE.Vector3();
        
        this.viewMode = 'solid';
        this.history = new History();
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        console.log('Initializing 3D scene...');
        
        // Create Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        console.log('  ✓ Scene created');

        // Create Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(400, 400, 400);
        this.camera.lookAt(0, 0, 0);
        console.log('  ✓ Camera created at position:', this.camera.position);

        // create Renderer
        const container = document.getElementById('canvas-container');
        if (!container) {
            throw new Error('Canvas container not found!');
        }
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.innerHTML = ''; // Clear loading message
        container.appendChild(this.renderer.domElement);
        console.log('  ✓ Renderer created and attached');

        // add Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 100);
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-100, -100, -100);
        this.scene.add(directionalLight2);
        console.log('  ✓ Lights added');

        // add Grid Helper - Enhanced for better visibility
        const gridHelper = new THREE.GridHelper(2000, 40, 0x888888, 0x444444);
        this.scene.add(gridHelper);
        
        // Add a subtle floor plane for depth perception
        const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
        const floorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x1a1a1a, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        this.scene.add(floor);

        // add Axes Helper
        const axesHelper = new THREE.AxesHelper(150);
        this.scene.add(axesHelper);
        console.log('  ✓ Grid and axes added');

        // setup Orbit Controls (camera rotation/zoom)
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        console.log('  ✓ OrbitControls initialized');

        // raycaster for mouse picking and dragging
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        console.log('  ✓ Raycaster initialized');

        // handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('3D scene initialization complete!');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // tube type change
        document.querySelectorAll('input[name="tubeType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const heightGroup = document.getElementById('heightGroup');
                if (e.target.value === 'square') {
                    heightGroup.style.display = 'none';
                    document.getElementById('height').value = document.getElementById('width').value;
                } else {
                    heightGroup.style.display = 'flex';
                }
            });
        });

        // width change for square mode
        document.getElementById('width').addEventListener('input', (e) => {
            const tubeType = document.querySelector('input[name="tubeType"]:checked').value;
            if (tubeType === 'square') {
                document.getElementById('height').value = e.target.value;
            }
        });

        // add Tube button
        document.getElementById('addTube').addEventListener('click', () => {
            console.log('Add Tube button clicked');
            this.addTube();
        });

        // delete Tube button
        document.getElementById('deleteTube').addEventListener('click', () => {
            console.log('Delete Tube button clicked');
            this.deleteTube();
        });

        // view mode change
        document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                console.log('View mode changed to:', e.target.value);
                this.viewMode = e.target.value;
                this.updateViewMode();
            });
        });

        // Undo/Redo
        document.getElementById('undo').addEventListener('click', () => {
            console.log('↶ Undo clicked');
            this.undo();
        });
        document.getElementById('redo').addEventListener('click', () => {
            console.log('↷ Redo clicked');
            this.redo();
        });

        // mouse events for drag
        this.renderer.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('mouseup', (event) => this.onMouseUp(event));

        // keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                this.deleteTube();
                return;
            }
            
            if (!this.selectedTube) return;
            
            const moveSpeed = event.shiftKey ? 10 : 1; // 10 units if Shift, 1 unit otherwise
            let moved = false;
            
            switch(event.key) {
                case 'ArrowUp':
                    this.selectedTube.mesh.position.z -= moveSpeed;
                    moved = true;
                    console.log(`⬆️ Moved tube forward ${moveSpeed} units`);
                    break;
                case 'ArrowDown':
                    this.selectedTube.mesh.position.z += moveSpeed;
                    moved = true;
                    console.log(`⬇️ Moved tube backward ${moveSpeed} units`);
                    break;
                case 'ArrowLeft':
                    this.selectedTube.mesh.position.x -= moveSpeed;
                    moved = true;
                    console.log(`⬅️ Moved tube left ${moveSpeed} units`);
                    break;
                case 'ArrowRight':
                    this.selectedTube.mesh.position.x += moveSpeed;
                    moved = true;
                    console.log(`➡️ Moved tube right ${moveSpeed} units`);
                    break;
                case 'PageUp':
                case '+':
                case '=':
                    this.selectedTube.mesh.position.y += moveSpeed;
                    moved = true;
                    console.log(`⬆️ Moved tube up ${moveSpeed} units`);
                    break;
                case 'PageDown':
                case '-':
                case '_':
                    this.selectedTube.mesh.position.y -= moveSpeed;
                    moved = true;
                    console.log(`⬇️ Moved tube down ${moveSpeed} units`);
                    break;
                case 'r':
                case 'R':
                    // Rotate around Y axis
                    const rotateSpeed = event.shiftKey ? (Math.PI / 6) : (Math.PI / 12); // 30° or 15°
                    this.selectedTube.mesh.rotation.y += rotateSpeed;
                    moved = true;
                    const degrees = (rotateSpeed * 180 / Math.PI).toFixed(0);
                    console.log(`🔄 Rotated tube ${degrees}° around Y axis`);
                    break;
                case 'e':
                case 'E':
                    // Rotate around Y axis (opposite direction)
                    const rotateSpeedE = event.shiftKey ? (Math.PI / 6) : (Math.PI / 12);
                    this.selectedTube.mesh.rotation.y -= rotateSpeedE;
                    moved = true;
                    const degreesE = (rotateSpeedE * 180 / Math.PI).toFixed(0);
                    console.log(`🔄 Rotated tube -${degreesE}° around Y axis`);
                    break;
                case 'q':
                case 'Q':
                    // Rotate around X axis
                    const rotateSpeedQ = event.shiftKey ? (Math.PI / 6) : (Math.PI / 12);
                    this.selectedTube.mesh.rotation.x += rotateSpeedQ;
                    moved = true;
                    const degreesQ = (rotateSpeedQ * 180 / Math.PI).toFixed(0);
                    console.log(`🔄 Rotated tube ${degreesQ}° around X axis`);
                    break;
                case 'w':
                case 'W':
                    // Rotate around X axis (opposite)
                    const rotateSpeedW = event.shiftKey ? (Math.PI / 6) : (Math.PI / 12);
                    this.selectedTube.mesh.rotation.x -= rotateSpeedW;
                    moved = true;
                    const degreesW = (rotateSpeedW * 180 / Math.PI).toFixed(0);
                    console.log(`🔄 Rotated tube -${degreesW}° around X axis`);
                    break;
            }
            
            if (moved) {
                event.preventDefault();
                this.detectJoints();
                this.saveState();
            }
        });
        
        console.log('  ✓ Event listeners setup complete');
    }

    addTube() {
        const width = parseFloat(document.getElementById('width').value);
        const height = parseFloat(document.getElementById('height').value);
        const thickness = parseFloat(document.getElementById('thickness').value);
        const length = parseFloat(document.getElementById('length').value);

        const tube = new Tube(width, height, thickness, length, this.viewMode);
        
        // Position new tubes offset from origin
        const offset = this.tubes.length * 80;
        tube.mesh.position.set(offset, 0, offset);
        
        this.tubes.push(tube);
        this.scene.add(tube.mesh);
        
        // Add axis arrows to the tube
        this.addAxisArrows(tube);
        
        this.updateUI();
        this.saveState();
        
        console.log(`✅ Tube added: ${width}x${height}x${thickness}mm, length: ${length}mm`);
    }

    deleteTube() {
        if (this.selectedTube) {
            const index = this.tubes.indexOf(this.selectedTube);
            if (index > -1) {
                this.scene.remove(this.selectedTube.mesh);
                this.tubes.splice(index, 1);
                
                // Remove axis arrows for this tube
                this.removeAxisArrows(this.selectedTube);
                
                this.selectedTube = null;
                this.updateUI();
                this.saveState();
                console.log('✅ Tube deleted');
            }
        }
    }

    addAxisArrows(tube) {
        const arrowLength = 100; // Longer arrows for better visibility
        const arrowColor = {
            x: 0xff0000, // Red for X-axis
            y: 0x00ff00, // Green for Y-axis
            z: 0x0000ff  // Blue for Z-axis
        };
        
        // Create arrow helpers
        const xArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0), // Direction
            new THREE.Vector3(0, 0, 0), // Origin
            arrowLength,
            arrowColor.x,
            25, // Head length
            12  // Head width
        );
        xArrow.name = 'xAxisArrow';
        xArrow.visible = false; // Hidden by default
        
        const yArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            arrowLength,
            arrowColor.y,
            25,
            12
        );
        yArrow.name = 'yAxisArrow';
        yArrow.visible = false; // Hidden by default
        
        const zArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            arrowLength,
            arrowColor.z,
            25,
            12
        );
        zArrow.name = 'zAxisArrow';
        zArrow.visible = false; // Hidden by default
        
        // Add arrows to tube mesh (they'll follow the tube's transformations)
        tube.mesh.add(xArrow);
        tube.mesh.add(yArrow);
        tube.mesh.add(zArrow);
        
        // Store reference
        this.axisHelpers.push({
            tube: tube,
            arrows: [xArrow, yArrow, zArrow]
        });
    }

    removeAxisArrows(tube) {
        const index = this.axisHelpers.findIndex(h => h.tube === tube);
        if (index > -1) {
            const helper = this.axisHelpers[index];
            helper.arrows.forEach(arrow => {
                tube.mesh.remove(arrow);
                arrow.dispose();
            });
            this.axisHelpers.splice(index, 1);
        }
    }

    showAxisArrows(tube) {
        const helper = this.axisHelpers.find(h => h.tube === tube);
        if (helper) {
            helper.arrows.forEach(arrow => {
                arrow.visible = true;
            });
        }
    }

    hideAxisArrows(tube) {
        const helper = this.axisHelpers.find(h => h.tube === tube);
        if (helper) {
            helper.arrows.forEach(arrow => {
                arrow.visible = false;
            });
        }
    }

    onMouseDown(event) {
        event.preventDefault();
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Get all meshes from all tube groups
        const allMeshes = [];
        this.tubes.forEach(tube => {
            tube.mesh.traverse((child) => {
                if (child.isMesh) {
                    allMeshes.push(child);
                }
            });
        });
        
        const intersects = this.raycaster.intersectObjects(allMeshes);

        if (intersects.length > 0) {
            // Find which tube this mesh belongs to
            const clickedMesh = intersects[0].object;
            const tube = this.tubes.find(t => t.mesh === clickedMesh.parent || clickedMesh.parent === t.mesh);
            
            if (tube) {
                this.selectTube(tube.mesh);
                
                // Start dragging
                this.isDragging = true;
                this.orbitControls.enabled = false;
                
                // Setup drag plane at tube's Y position
                this.dragPlane.constant = -tube.mesh.position.y;
                
                // Calculate offset from tube center to click point
                this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset);
                this.dragOffset.sub(tube.mesh.position);
                
                console.log('🎯 Started dragging tube');
            }
        } else {
            this.deselectTube();
        }
    }

    onMouseMove(event) {
        if (!this.isDragging || !this.selectedTube) return;
        
        event.preventDefault();
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
            this.selectedTube.mesh.position.copy(this.dragIntersection).sub(this.dragOffset);
            this.detectJoints();
        }
    }

    onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.orbitControls.enabled = true;
            this.saveState();
            console.log('✅ Finished dragging - state saved');
        }
    }

    selectTube(mesh) {
        this.deselectTube();
        
        const tube = this.tubes.find(t => t.mesh === mesh);
        if (tube) {
            this.selectedTube = tube;
            tube.setSelected(true);
            this.showAxisArrows(tube);
            this.showBoundingBox(tube);
            console.log('✅ Tube selected - RGB arrows + bounding box visible');
            this.updateUI();
        }
    }

    deselectTube() {
        if (this.selectedTube) {
            this.selectedTube.setSelected(false);
            this.hideAxisArrows(this.selectedTube);
            this.hideBoundingBox();
            this.selectedTube = null;
            this.updateUI();
        }
    }

    showBoundingBox(tube) {
        this.hideBoundingBox(); // Remove old box if exists
        
        // Create a box helper that shows the tube's bounding box
        this.boundingBoxHelper = new THREE.BoxHelper(tube.mesh, 0xffff00); // Yellow box
        this.boundingBoxHelper.material.linewidth = 2;
        this.boundingBoxHelper.material.transparent = true;
        this.boundingBoxHelper.material.opacity = 0.5;
        this.scene.add(this.boundingBoxHelper);
    }

    hideBoundingBox() {
        if (this.boundingBoxHelper) {
            this.scene.remove(this.boundingBoxHelper);
            this.boundingBoxHelper.dispose();
            this.boundingBoxHelper = null;
        }
    }

    updateViewMode() {
        this.tubes.forEach(tube => tube.setViewMode(this.viewMode));
    }

    detectJoints() {
        this.clearJointMarkers();
        this.joints = [];
        
        for (let i = 0; i < this.tubes.length; i++) {
            for (let j = i + 1; j < this.tubes.length; j++) {
                const joint = this.checkJoint(this.tubes[i], this.tubes[j]);
                if (joint) {
                    this.joints.push(joint);
                    this.visualizeJoint(joint);
                }
            }
        }
        
        this.updateUI();
    }

    checkJoint(tube1, tube2) {
        const distance = tube1.mesh.position.distanceTo(tube2.mesh.position);
        const threshold = 100;
        
        if (distance < threshold) {
            const dir1 = new THREE.Vector3(0, 1, 0);
            dir1.applyQuaternion(tube1.mesh.quaternion);
            
            const dir2 = new THREE.Vector3(0, 1, 0);
            dir2.applyQuaternion(tube2.mesh.quaternion);
            
            let angle = THREE.MathUtils.radToDeg(dir1.angleTo(dir2));
            angle = this.snapAngle(angle);
            
            return {
                tube1: tube1,
                tube2: tube2,
                angle: angle,
                distance: distance
            };
        }
        
        return null;
    }

    snapAngle(angle) {
        const snapPoints = [0, 45, 90, 135, 180];
        const threshold = 10;
        
        for (const snap of snapPoints) {
            if (Math.abs(angle - snap) < threshold) {
                return snap;
            }
        }
        
        return angle;
    }

    visualizeJoint(joint) {
        // Create larger, more visible sphere
        const sphereGeometry = new THREE.SphereGeometry(12, 16, 16); // Larger radius
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8, // More opaque
            depthTest: false
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        const midpoint = new THREE.Vector3()
            .addVectors(joint.tube1.mesh.position, joint.tube2.mesh.position)
            .multiplyScalar(0.5);
        sphere.position.copy(midpoint);
        sphere.renderOrder = 999;
        
        // Create thicker, more visible line
        const points = [
            joint.tube1.mesh.position.clone(),
            joint.tube2.mesh.position.clone()
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff00ff, // Magenta
            linewidth: 3, // Thicker line
            depthTest: false,
            transparent: true,
            opacity: 0.9
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.renderOrder = 998;
        
        this.scene.add(sphere);
        this.scene.add(line);
        this.jointMarkers.push({ 
            sphere, 
            line, 
            geometry: sphereGeometry, 
            lineGeometry,
            joint: joint // Store joint reference to update positions
        });
    }

    clearJointMarkers() {
        this.jointMarkers.forEach(marker => {
            this.scene.remove(marker.sphere);
            this.scene.remove(marker.line);
            marker.geometry.dispose();
            marker.sphere.material.dispose();
            marker.lineGeometry.dispose();
            marker.line.material.dispose();
        });
        this.jointMarkers = [];
    }

    updateUI() {
        document.getElementById('tubeCount').textContent = `Tubes: ${this.tubes.length}`;
        
        if (this.joints.length > 0) {
            const angles = this.joints.map(j => `${j.angle}°`).join(', ');
            document.getElementById('jointInfo').textContent = `Joints: ${this.joints.length} [${angles}]`;
        } else {
            document.getElementById('jointInfo').textContent = 'Joints: 0';
        }
        
        if (this.selectedTube) {
            const pos = this.selectedTube.mesh.position;
            const rot = this.selectedTube.mesh.rotation;
            
            const infoText = `Selected: ${this.selectedTube.width}×${this.selectedTube.height}×${this.selectedTube.thickness}mm
Length: ${this.selectedTube.length}mm
Position: (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)})
Rotation: (${(rot.x * 180 / Math.PI).toFixed(0)}°, ${(rot.y * 180 / Math.PI).toFixed(0)}°, ${(rot.z * 180 / Math.PI).toFixed(0)}°)`;
            
            document.getElementById('selectedInfo').innerHTML = infoText.replace(/\n/g, '<br>');
        } else {
            document.getElementById('selectedInfo').innerHTML = 'Selected: None';
        }
    }

    saveState() {
        const state = this.tubes.map(tube => ({
            width: tube.width,
            height: tube.height,
            thickness: tube.thickness,
            length: tube.length,
            position: tube.mesh.position.clone(),
            rotation: tube.mesh.rotation.clone()
        }));
        this.history.saveState(state);
    }

    undo() {
        const state = this.history.undo();
        if (state) {
            this.restoreState(state);
        }
    }

    redo() {
        const state = this.history.redo();
        if (state) {
            this.restoreState(state);
        }
    }

    restoreState(state) {
        // clear existing tubes
        this.tubes.forEach(tube => this.scene.remove(tube.mesh));
        this.tubes = [];
        this.deselectTube();
        
        // restore tubes from state
        state.forEach(tubeData => {
            const tube = new Tube(
                tubeData.width,
                tubeData.height,
                tubeData.thickness,
                tubeData.length,
                this.viewMode
            );
            tube.mesh.position.copy(tubeData.position);
            tube.mesh.rotation.copy(tubeData.rotation);
            this.tubes.push(tube);
            this.scene.add(tube.mesh);
        });
        
        this.updateUI();
    }

    onWindowResize() {
        const container = document.getElementById('canvas-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.orbitControls.update();
        this.detectJoints();
        
        this.renderer.render(this.scene, this.camera);
    }
}




// ============================================ 
// TUBE CLASS 
// ============================================




class Tube {
    constructor(width, height, thickness, length, viewMode = 'solid') {
        this.width = width;
        this.height = height;
        this.thickness = thickness;
        this.length = length;
        this.viewMode = viewMode;
        
        this.mesh = this.createMesh();
    }

    createMesh() {
        // Create hollow rectangular tube using box geometries
        const group = new THREE.Group();
        group.name = 'TubeGroup';
        
        const w = this.width;
        const h = this.height;
        const l = this.length;
        const t = this.thickness;
        
        // cration of 4 walls of the tube
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a9eff,
            metalness: 0.5,
            roughness: 0.5
        });
        
        // top wall
        const topWall = new THREE.Mesh(
            new THREE.BoxGeometry(w, t, l),
            wallMaterial
        );
        topWall.position.y = (h - t) / 2;
        group.add(topWall);
        
        // bottom wall
        const bottomWall = new THREE.Mesh(
            new THREE.BoxGeometry(w, t, l),
            wallMaterial
        );
        bottomWall.position.y = -(h - t) / 2;
        group.add(bottomWall);
        
        // left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(t, h - 2 * t, l),
            wallMaterial
        );
        leftWall.position.x = -(w - t) / 2;
        group.add(leftWall);
        
        // right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(t, h - 2 * t, l),
            wallMaterial
        );
        rightWall.position.x = (w - t) / 2;
        group.add(rightWall);
        
        // Add an invisible box for easier selection and TransformControls attachment
        const boundingBox = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, l),
            new THREE.MeshBasicMaterial({ 
                transparent: true, 
                opacity: 0,
                visible: false
            })
        );
        boundingBox.name = 'boundingBox';
        group.add(boundingBox);
        
        // wireframe helper
        const wireframe = new THREE.BoxHelper(group, 0x00ff00);
        wireframe.visible = false;
        wireframe.name = 'wireframe';
        group.add(wireframe);
        
        return group;
    }

    setViewMode(mode) {
        this.viewMode = mode;
        const wireframe = this.mesh.getObjectByName('wireframe');
        
        this.mesh.children.forEach(child => {
            if (child.type === 'Mesh') {
                if (mode === 'wireframe') {
                    child.material.wireframe = true;
                } else {
                    child.material.wireframe = false;
                }
            }
        });
        
        if (wireframe) {
            wireframe.visible = mode === 'wireframe';
        }
    }

    setSelected(selected) {
        const color = selected ? 0xffff00 : 0x4a9eff;
        this.mesh.children.forEach(child => {
            if (child.type === 'Mesh') {
                child.material.color.setHex(color);
            }
        });
    }
}




// ============================================
// HISTORY CLASS (Undo/Redo)
// ============================================




class History {
    constructor() {
        this.states = [];
        this.currentIndex = -1;
        this.maxStates = 50;
    }

    saveState(state) {
        // remove any states after current index
        this.states = this.states.slice(0, this.currentIndex + 1);
        
        // new state
        this.states.push(JSON.parse(JSON.stringify(state, this.replacer)));
        
        // Limit history size
        if (this.states.length > this.maxStates) {
            this.states.shift();
        } else {
            this.currentIndex++;
        }
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return JSON.parse(JSON.stringify(this.states[this.currentIndex], this.reviver));
        }
        return null;
    }

    redo() {
        if (this.currentIndex < this.states.length - 1) {
            this.currentIndex++;
            return JSON.parse(JSON.stringify(this.states[this.currentIndex], this.reviver));
        }
        return null;
    }

    replacer(key, value) {
        // Custom serialization 
        if (value instanceof THREE.Vector3 || value instanceof THREE.Euler) {
            return { x: value.x, y: value.y, z: value.z, _type: value.constructor.name };
        }
        return value;
    }

    reviver(key, value) {
        // Custom deserialization 
        if (value && value._type === 'Vector3') {
            return new THREE.Vector3(value.x, value.y, value.z);
        }
        if (value && value._type === 'Euler') {
            return new THREE.Euler(value.x, value.y, value.z);
        }
        return value;
    }
}



// ============================================
// START APPLICATION
// ============================================




console.log('app-main.js loaded');

// initialize immediately 
console.log('Initializing Tube Joint Visualizer...');
try {
    const app = new TubeJointVisualizer();
    console.log('Tube Joint Visualizer initialized successfully!');
    window.app = app; //  for debugging
} catch (error) {
    console.error('Failed to initialize app:', error);
    throw error; // Re-throw so the loader can catch it
}

