// Simple test to verify modules load
console.log('=== APP.JS STARTING ===');

try {
    console.log('Attempting to import Three.js...');
    
    import('../../node_modules/three/build/three.module.js')
        .then((THREE) => {
            console.log('Three.js loaded successfully!', THREE);
            
            // Test creating a scene
            const scene = new THREE.Scene();
            console.log('Scene created:', scene);
            
            // Now load the full app
            import('./app-main.js').catch(err => {
                console.error('Failed to load app-main.js:', err);
            });
        })
        .catch((error) => {
            console.error('Failed to load Three.js:', error);
        });
} catch (error) {
    console.error('Critical error in app.js:', error);
}

console.log('=== APP.JS FILE PARSED ===');
