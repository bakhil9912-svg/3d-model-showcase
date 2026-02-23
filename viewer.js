// Three.js Viewer Setup
function initializeScene() {
    const container = document.getElementById('canvasContainer');
    if (!container) return;

    // Scene setup
    app.scene = new THREE.Scene();
    app.scene.background = new THREE.Color(app.settings.backgroundColor);

    // Camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    app.camera = new THREE.PerspectiveCamera(app.settings.cameraFOV, width / height, 0.1, 10000);
    app.camera.position.set(0, 0, 50);

    // Renderer
    app.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true 
    });
    app.renderer.setSize(width, height);
    app.renderer.setPixelRatio(window.devicePixelRatio * app.settings.resolutionScale);
    app.renderer.shadowMap.enabled = app.settings.shadows;
    container.appendChild(app.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, app.settings.lighting);
    app.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = app.settings.shadows;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    app.scene.add(directionalLight);

    // Controls
    app.controls = new THREE.OrbitControls(app.camera, app.renderer.domElement);
    app.controls.autoRotate = app.settings.autoRotate;
    app.controls.autoRotateSpeed = app.settings.rotationSpeed;

    // Grid
    const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x888888);
    gridHelper.name = 'grid';
    app.scene.add(gridHelper);

    // Axes
    const axesHelper = new THREE.AxesHelper(30);
    axesHelper.name = 'axes';
    app.scene.add(axesHelper);

    // Animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Setup viewer controls event listeners
    setupViewerControls();
}

function setupViewerControls() {
    // Background color
    document.getElementById('bgColorPicker').addEventListener('change', (e) => {
        app.settings.backgroundColor = e.target.value;
        app.scene.background = new THREE.Color(e.target.value);
    });

    // Light intensity
    document.getElementById('lightIntensity').addEventListener('input', (e) => {
        app.settings.lighting = parseFloat(e.target.value);
        const light = app.scene.children.find(obj => obj instanceof THREE.AmbientLight);
        if (light) light.intensity = app.settings.lighting;
        document.getElementById('lightValue').textContent = Math.round(e.target.value * 100) + '%';
    });

    // Rotation speed
    document.getElementById('rotationSpeed').addEventListener('input', (e) => {
        app.settings.rotationSpeed = parseFloat(e.target.value);
        if (app.controls) app.controls.autoRotateSpeed = app.settings.rotationSpeed;
    });

    // Scale control
    document.getElementById('scaleControl').addEventListener('input', (e) => {
        app.settings.scale = parseFloat(e.target.value);
        if (app.currentModel && app.currentModel.object) {
            app.currentModel.object.scale.set(app.settings.scale, app.settings.scale, app.settings.scale);
        }
        document.getElementById('scaleValue').textContent = e.target.value + 'x';
    });

    // Wireframe toggle
    document.getElementById('wireframeToggle').addEventListener('change', updateMaterialWireframe);

    // Auto rotate
    document.getElementById('autoRotateToggle').addEventListener('change', (e) => {
        app.settings.autoRotate = e.target.checked;
        if (app.controls) app.controls.autoRotate = e.target.checked;
    });

    // Reset view
    document.getElementById('resetViewBtn').addEventListener('click', () => {
        if (app.controls) app.controls.reset();
        showNotification('View reset', 'success');
    });

    // Screenshot
    document.getElementById('screenshotBtn').addEventListener('click', takeScreenshot);

    // Download
    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (app.currentModel) downloadModel(app.currentModel.id);
    });
}

function updateMaterialWireframe() {
    app.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.wireframe = app.settings.wireframe;
                });
            } else {
                child.material.wireframe = app.settings.wireframe;
            }
        }
    });
}

function updateGridVisibility() {
    const grid = app.scene.getObjectByName('grid');
    if (grid) grid.visible = app.settings.showGrid;
}

function updateAxesVisibility() {
    const axes = app.scene.getObjectByName('axes');
    if (axes) axes.visible = app.settings.showAxes;
}

function loadModelToScene(url) {
    const loader = new THREE.GLTFLoader();
    
    loader.load(url, (gltf) => {
        // Remove old model
        if (app.currentModel && app.currentModel.object) {
            app.scene.remove(app.currentModel.object);
        }

        const model = gltf.scene;
        model.scale.set(app.settings.scale, app.settings.scale, app.settings.scale);
        
        // Center and fit model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = app.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 1.5;
        
        model.position.sub(center);
        app.scene.add(model);
        
        app.camera.position.z = cameraZ;
        app.camera.lookAt(model.position);
        app.controls.target.copy(model.position);
        app.controls.update();

        if (app.currentModel) {
            app.currentModel.object = model;
        }

        // Handle animations
        if (gltf.animations.length > 0) {
            showAnimations(gltf.animations, model);
        }

        showNotification('Model loaded successfully', 'success');
    }, 
    (xhr) => {
        // Loading progress
        const progress = (xhr.loaded / xhr.total) * 100;
        console.log(progress + '% loaded');
    },
    (error) => {
        console.error('Error loading model:', error);
        showNotification('Error loading model', 'error');
    });
}

function showAnimations(animations, model) {
    const panel = document.getElementById('animationPanel');
    const list = document.getElementById('animationsList');
    
    if (animations.length > 0) {
        panel.style.display = 'block';
        list.innerHTML = '';
        
        animations.forEach((clip, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = clip.name || `Animation ${index + 1}`;
            btn.addEventListener('click', () => {
                // Play animation
                showNotification(`Playing: ${clip.name}`, 'success');
            });
            list.appendChild(btn);
        });
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (app.controls) {
        app.controls.update();
    }

    if (app.scene && app.camera && app.renderer) {
        app.renderer.render(app.scene, app.camera);
    }
}

function onWindowResize() {
    const container = document.getElementById('canvasContainer');
    if (!container || !app.camera || !app.renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    app.camera.aspect = width / height;
    app.camera.updateProjectionMatrix();
    app.renderer.setSize(width, height);
}