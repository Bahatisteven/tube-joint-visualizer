// App loader with error handling
console.log('🚀 Tube Joint Visualizer Starting...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('📋 DOM Content Loaded');
    
    // Add loading indicator
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('❌ Canvas container not found!');
        return;
    }
    
    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Loading 3D Engine...</div>';
    
    // Import and start the app
    import('./app-main.js')
        .then(() => {
            console.log('✅ Application loaded successfully!');
        })
        .catch((error) => {
            console.error('❌ Failed to load application:', error);
            container.innerHTML = `
                <div style="color: #ff4444; padding: 20px;">
                    <h2>Error Loading Application</h2>
                    <pre>${error.message}
${error.stack}</pre>
                </div>
            `;
        });
}
