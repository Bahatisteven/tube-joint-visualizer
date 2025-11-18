// Quick validation that the code structure is correct
console.log('Validating application code...\n');

const fs = require('fs');

// Check file exists
const files = [
    'src/main.js',
    'src/renderer/index.html',
    'src/renderer/app.js',
    'src/renderer/app-main.js',
    'src/renderer/styles.css'
];

let allGood = true;

files.forEach(file => {
    if (fs.existsSync(file)) {
        const size = fs.statSync(file).size;
        console.log(`${file} (${size} bytes)`);
    } else {
        console.log(`${file} NOT FOUND`);
        allGood = false;
    }
});

// Check that app-main.js has key classes
const appMainContent = fs.readFileSync('src/renderer/app-main.js', 'utf8');
const requiredClasses = ['TubeJointVisualizer', 'Tube', 'History'];

console.log('\nChecking for required classes:');
requiredClasses.forEach(className => {
    if (appMainContent.includes(`class ${className}`)) {
        console.log(`${className} class found`);
    } else {
        console.log(`${className} class NOT FOUND`);
        allGood = false;
    }
});

// Check for Three.js imports
console.log('\nChecking imports:');
if (appMainContent.includes("import * as THREE from 'three'")) {
    console.log('Three.js import found');
} else {
    console.log('Three.js import NOT FOUND');
    allGood = false;
}

if (appMainContent.includes("import { OrbitControls }")) {
    console.log('OrbitControls import found');
} else {
    console.log('OrbitControls import NOT FOUND');
    allGood = false;
}

console.log('\n' + (allGood ? 'All validation checks passed!' : 'Some checks failed!'));
process.exit(allGood ? 0 : 1);
