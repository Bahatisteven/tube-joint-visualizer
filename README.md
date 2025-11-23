# Tube Joint Visualizer

A 3D desktop application for designing and visualizing rectangular tube joints with real-time angle detection.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Electron](https://img.shields.io/badge/electron-33.2.1-47848F.svg)
![Three.js](https://img.shields.io/badge/three.js-0.181.1-black.svg)

---

## Features

### Core Functionality
- Create rectangular and square hollow tubes with custom dimensions
- Drag tubes directly in 3D space with your mouse
- Use arrow keys for precise positioning (1mm or 10mm steps)
- Rotate tubes on different axes using keyboard shortcuts
- Automatic joint detection when tubes are within 100mm of each other
- Visual joint markers with red spheres and magenta connection lines
- Real-time angle calculation between tubes (0°, 45°, 90°, 135°, 180°)
- Build assemblies with multiple tubes
- Yellow highlighting and bounding box for selected tubes
- Full undo/redo history (up to 50 states)
- Switch between solid and wireframe view modes
- Delete tubes with the Delete key

### Interface
- Dark theme interface
- Real-time info panel showing tube count, joints, and dimensions
- Mouse and keyboard controls that feel natural
- Position and rotation data for selected tubes
- Zoom, pan, and rotate the camera to inspect from any angle

---

## Installation

You'll need Node.js (v16 or higher) installed on your computer.

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd tube-joint-visualizer
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Run the app:
   ```bash
   npm start
   ```

---

## How to Use

### Creating and Moving Tubes

1. Set your tube dimensions in the left panel (width, height, thickness, length)
2. Click "Add Tube" to create it
3. Click on any tube to select it (it turns yellow)
4. Drag the selected tube with your mouse, or use arrow keys to move it precisely
5. Use PageUp/PageDown to move tubes up or down
6. Rotate tubes with Q/W/E/R keys (hold Shift for larger rotations)

### Working with Joints

When you move tubes close together (within 100mm), the app automatically detects potential joints. You'll see:
- A red sphere marking where the joint would be
- A magenta line connecting the two tubes
- The angle between them shown in the info panel

This makes it easy to plan how tubes will connect before actually cutting or welding them.

---

## Controls

### Mouse
| Action | How to do it |
|--------|-------------|
| Select a tube | Click on it |
| Move selected tube | Click and drag it |
| Rotate camera view | Click and drag on empty space |
| Pan camera | Right-click and drag |
| Zoom in/out | Scroll with mouse wheel |

### Keyboard
| Key | What it does |
|-----|-------------|
| Arrow keys | Move tube 1mm in that direction |
| Shift + Arrows | Move tube 10mm (faster) |
| PageUp or + | Move tube up |
| PageDown or - | Move tube down |
| R | Rotate around Y-axis +15° |
| E | Rotate around Y-axis -15° |
| Q | Rotate around X-axis +15° |
| W | Rotate around X-axis -15° |
| Shift + R/E/Q/W | Rotate 30° instead of 15° |
| Delete or Backspace | Remove selected tube |

**Note:** Select a tube first by clicking on it before using keyboard controls.

---

## Building the App

To create a standalone executable that you can share or run without Node.js:

```bash
npm run build
```

This creates an executable in the `dist/` folder:
- **Linux**: `.AppImage` file (107MB)
- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image

You can also build for a specific platform:
```bash
npm run build:win    # Windows
npm run build:mac    # macOS  
npm run build:linux  # Linux
```

---

## Project Structure

```
tube-joint-visualizer/
├── src/
│   ├── main.js              # Electron main process
│   └── renderer/
│       ├── app-main.js      # Main application code
│       ├── app-bundle.js    # Bundled JavaScript (auto-generated)
│       ├── index.html       # Interface layout
│       └── styles.css       # Styling
├── dist/                    # Built executables
├── node_modules/            # Dependencies
├── package.json             # Project configuration
├── PROGRESS.md              # Development notes
└── README.md                # This file
```

---

## Requirements

- **Operating System**: Windows 10+, macOS 10.13+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Graphics**: Any GPU with WebGL support

---

## Technical Details

Built with:
- **Electron** for the desktop app framework
- **Three.js** for 3D graphics rendering
- **esbuild** for bundling JavaScript modules

The joint detection algorithm works by calculating the distance between tube centers and finding the angle using vector mathematics. When tubes are close enough, it snaps angles to standard values (0°, 45°, 90°, etc.) for easier reference.

---

## Troubleshooting

**App won't start?**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

**Build failing?**
```bash
npm install --save-dev electron-builder
npm run build
```

**Graphics look weird?**
- Update your graphics drivers
- Make sure your system supports WebGL
- Try toggling between solid and wireframe modes

---

## License

ISC License - See LICENSE file for details.

---

## Screenshots

*Screenshots will be added here showing the app in action*

---
