import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// ============================================
// MAIN APPLICATION CLASS
// ============================================
class TubeJointVisualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.orbitControls = null;
        this.transformControls = null;
        
        this.tubes = [];
        this.selectedTube = null;
        this.joints = [];
        
        this.viewMode = 'solid';
        this.history = new History();
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Create Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Create Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(300, 300, 300);
        this.camera.lookAt(0, 0, 0);

        // Create Renderer
        const container = document.getElementById('canvas-container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Add Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 100);
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-100, -100, -100);
        this.scene.add(directionalLight2);

        // Add Grid Helper
        const gridHelper = new THREE.GridHelper(1000, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Add Axes Helper
        const axesHelper = new THREE.AxesHelper(150);
        this.scene.add(axesHelper);

        // Setup Orbit Controls (camera rotation/zoom)
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;

        // Setup Transform Controls (for moving tubes)
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.orbitControls.enabled = !event.value;
        });
        this.transformControls.setMode('translate');
        this.scene.add(this.transformControls);

        // Raycaster for mouse picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupEventListeners() {
        // Tube type change
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

        // Width change for square mode
        document.getElementById('width').addEventListener('input', (e) => {
            const tubeType = document.querySelector('input[name="tubeType"]:checked').value;
            if (tubeType === 'square') {
                document.getElementById('height').value = e.target.value;
            }
        });

        // Add Tube button
        document.getElementById('addTube').addEventListener('click', () => this.addTube());

        // Delete Tube button
        document.getElementById('deleteTube').addEventListener('click', () => this.deleteTube());

        // View mode change
        document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.viewMode = e.target.value;
                this.updateViewMode();
            });
        });

        // Undo/Redo
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('redo').addEventListener('click', () => this.redo());

        // Mouse click for selection
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'g' || event.key === 'G') {
                if (this.selectedTube) {
                    this.transformControls.attach(this.selectedTube.mesh);
                }
            }
            if (event.key === 'Delete' || event.key === 'Backspace') {
                this.deleteTube();
            }
        });
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
        
        this.updateUI();
        this.saveState();
        
        console.log(`Tube added: ${width}x${height}x${thickness}mm, length: ${length}mm`);
    }

    deleteTube() {
        if (this.selectedTube) {
            const index = this.tubes.indexOf(this.selectedTube);
            if (index > -1) {
                this.scene.remove(this.selectedTube.mesh);
                this.tubes.splice(index, 1);
                this.transformControls.detach();
                this.selectedTube = null;
                this.updateUI();
                this.saveState();
            }
        }
    }

    onMouseClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(
            this.tubes.map(t => t.mesh)
        );

        if (intersects.length > 0) {
            this.selectTube(intersects[0].object);
        } else {
            this.deselectTube();
        }
    }

    selectTube(mesh) {
        this.deselectTube();
        
        const tube = this.tubes.find(t => t.mesh === mesh);
        if (tube) {
            this.selectedTube = tube;
            tube.setSelected(true);
            this.updateUI();
        }
    }

    deselectTube() {
        if (this.selectedTube) {
            this.selectedTube.setSelected(false);
            this.transformControls.detach();
            this.selectedTube = null;
            this.updateUI();
        }
    }

    updateViewMode() {
        this.tubes.forEach(tube => tube.setViewMode(this.viewMode));
    }

    detectJoints() {
        this.joints = [];
        
        for (let i = 0; i < this.tubes.length; i++) {
            for (let j = i + 1; j < this.tubes.length; j++) {
                const joint = this.checkJoint(this.tubes[i], this.tubes[j]);
                if (joint) {
                    this.joints.push(joint);
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

    updateUI() {
        document.getElementById('tubeCount').textContent = `Tubes: ${this.tubes.length}`;
        document.getElementById('jointInfo').textContent = `Joints: ${this.joints.length}`;
        
        if (this.selectedTube) {
            document.getElementById('selectedInfo').textContent = 
                `Selected: ${this.selectedTube.width}x${this.selectedTube.height}mm`;
        } else {
            document.getElementById('selectedInfo').textContent = 'Selected: None';
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
        // Clear existing tubes
        this.tubes.forEach(tube => this.scene.remove(tube.mesh));
        this.tubes = [];
        this.deselectTube();
        
        // Restore tubes from state
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
        
        const w = this.width;
        const h = this.height;
        const l = this.length;
        const t = this.thickness;
        
        // Create 4 walls of the tube
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a9eff,
            metalness: 0.5,
            roughness: 0.5
        });
        
        // Top wall
        const topWall = new THREE.Mesh(
            new THREE.BoxGeometry(w, t, l),
            wallMaterial
        );
        topWall.position.y = (h - t) / 2;
        group.add(topWall);
        
        // Bottom wall
        const bottomWall = new THREE.Mesh(
            new THREE.BoxGeometry(w, t, l),
            wallMaterial
        );
        bottomWall.position.y = -(h - t) / 2;
        group.add(bottomWall);
        
        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(t, h - 2 * t, l),
            wallMaterial
        );
        leftWall.position.x = -(w - t) / 2;
        group.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(t, h - 2 * t, l),
            wallMaterial
        );
        rightWall.position.x = (w - t) / 2;
        group.add(rightWall);
        
        // Add wireframe helper
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
        // Remove any states after current index
        this.states = this.states.slice(0, this.currentIndex + 1);
        
        // Add new state
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
        // Custom serialization for Three.js objects
        if (value instanceof THREE.Vector3 || value instanceof THREE.Euler) {
            return { x: value.x, y: value.y, z: value.z, _type: value.constructor.name };
        }
        return value;
    }

    reviver(key, value) {
        // Custom deserialization for Three.js objects
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
window.addEventListener('DOMContentLoaded', () => {
    const app = new TubeJointVisualizer();
    console.log('Tube Joint Visualizer initialized!');
});
