/**
 * Uzay Enkazı Takip Sistemi - 3D Dünya Simülasyonu
 * Three.js ile 3D görselleştirme, satellite.js ile gerçek zamanlı pozisyon hesaplama
 */

// ==================== GLOBAL DEĞİŞKENLER ====================
let scene, camera, renderer, controls;
let earthMesh, atmosphereMesh, cloudsMesh, starField;
let activeSatPoints, debrisSatPoints;
let orbitLine = null;
let orbitGlowLine = null;
let orbitLines = [];
let selectedSatellite = null;
let raycaster, mouse;
let satelliteTexture = null;
let useSpriteMode = true;

let allSatellites = { active: [], debris: [] };
let activeFilter = 'all';

let collisionAnalysisActive = false;
let collisionHighlightPoints = null;

const EARTH_RADIUS = 5;
const SCALE_FACTOR = EARTH_RADIUS / 6371.0;

// ==================== BAŞLATMA ====================
document.addEventListener('DOMContentLoaded', () => {
    createSatelliteSprite();
    initThreeJS();
    initControls();
    initRaycaster();
    loadSatelliteData();
    animate();
    setupFilterButtons();
    setupInfoPanel();
    setupViewToggle();
    setupCollisionButton();
    setupSearch();
});

// ==================== UYDU SPRITE TEXTURE ====================
function createSatelliteSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.15, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.4, 'rgba(200,220,255,0.4)');
    gradient.addColorStop(1, 'rgba(100,150,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(28, 26, 8, 12);
    ctx.fillStyle = 'rgba(100,160,255,0.85)';
    ctx.fillRect(10, 28, 16, 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(10, 28, 16, 8);
    ctx.beginPath();
    ctx.moveTo(18, 28); ctx.lineTo(18, 36);
    ctx.moveTo(14, 28); ctx.lineTo(14, 36);
    ctx.moveTo(22, 28); ctx.lineTo(22, 36);
    ctx.stroke();

    ctx.fillStyle = 'rgba(100,160,255,0.85)';
    ctx.fillRect(38, 28, 16, 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(38, 28, 16, 8);
    ctx.beginPath();
    ctx.moveTo(42, 28); ctx.lineTo(42, 36);
    ctx.moveTo(46, 28); ctx.lineTo(46, 36);
    ctx.moveTo(50, 28); ctx.lineTo(50, 36);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 26); ctx.lineTo(32, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32, 17, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();

    satelliteTexture = new THREE.CanvasTexture(canvas);
}

// ==================== THREE.JS KURULUM ====================
function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 20);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('globe-canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(15, 5, 10);
    scene.add(sunLight);
    const backLight = new THREE.DirectionalLight(0x4466aa, 0.3);
    backLight.position.set(-10, -5, -10);
    scene.add(backLight);

    createEarth();
    createAtmosphere();
    createStars();
    window.addEventListener('resize', onResize);
}

// ==================== GERÇEKÇİ DÜNYA ====================
function createEarth() {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128);
    const textureLoader = new THREE.TextureLoader();

    // NASA Blue Marble texture (yüksek çözünürlüklü)
    const earthTexUrl = 'https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg';
    const bumpUrl = 'https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png';
    const specUrl = 'https://unpkg.com/three-globe@2.41.12/example/img/earth-water.png';
    const nightUrl = 'https://unpkg.com/three-globe@2.41.12/example/img/earth-night.jpg';

    const earthTex = textureLoader.load(earthTexUrl, (tex) => {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        if (earthMesh) earthMesh.material.needsUpdate = true;
    });
    const bumpTex = textureLoader.load(bumpUrl);
    const specTex = textureLoader.load(specUrl);
    const nightTex = textureLoader.load(nightUrl);

    const material = new THREE.MeshPhongMaterial({
        map: earthTex,
        bumpMap: bumpTex,
        bumpScale: 0.08,
        specularMap: specTex,
        specular: new THREE.Color(0x666688),
        shininess: 25,
        emissiveMap: nightTex,
        emissive: new THREE.Color(0xffedd5),
        emissiveIntensity: 0.12,
    });

    earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);

    // Bulut katmanı
    const cloudGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.005, 96, 96);
    const cloudTexUrl = 'https://unpkg.com/three-globe/example/img/earth-clouds.png';
    const cloudTex = textureLoader.load(cloudTexUrl);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
    });
    cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudsMesh);

    // Fallback: texture yüklenemezse canvas-based texture kullan
    earthTex.onerror = () => createFallbackEarthTexture(material);
}

function createFallbackEarthTexture(material) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#0c2d48'); oceanGrad.addColorStop(0.3, '#0a3d62');
    oceanGrad.addColorStop(0.5, '#0e4d6e'); oceanGrad.addColorStop(0.7, '#0a3d62');
    oceanGrad.addColorStop(1, '#0c2d48');
    ctx.fillStyle = oceanGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a5c2a'; drawContinents(ctx, canvas.width, canvas.height);
    ctx.fillStyle = '#c8d8e4';
    ctx.fillRect(0, 0, canvas.width, 60); ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    ctx.globalAlpha = 0.08; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 300; i++) {
        ctx.beginPath(); ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*40+10, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    material.map = new THREE.CanvasTexture(canvas);
    material.needsUpdate = true;
}

function drawContinents(ctx, w, h) {
    const toX = (lon) => ((lon + 180) / 360) * w;
    const toY = (lat) => ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(toX(-130), toY(55)); ctx.lineTo(toX(-125), toY(50)); ctx.lineTo(toX(-125), toY(40));
    ctx.lineTo(toX(-115), toY(32)); ctx.lineTo(toX(-105), toY(30)); ctx.lineTo(toX(-100), toY(26));
    ctx.lineTo(toX(-97), toY(20)); ctx.lineTo(toX(-90), toY(18)); ctx.lineTo(toX(-85), toY(12));
    ctx.lineTo(toX(-80), toY(8)); ctx.lineTo(toX(-78), toY(10)); ctx.lineTo(toX(-82), toY(25));
    ctx.lineTo(toX(-80), toY(32)); ctx.lineTo(toX(-75), toY(36)); ctx.lineTo(toX(-70), toY(42));
    ctx.lineTo(toX(-65), toY(45)); ctx.lineTo(toX(-60), toY(47)); ctx.lineTo(toX(-55), toY(50));
    ctx.lineTo(toX(-60), toY(55)); ctx.lineTo(toX(-65), toY(60)); ctx.lineTo(toX(-75), toY(62));
    ctx.lineTo(toX(-80), toY(65)); ctx.lineTo(toX(-90), toY(70)); ctx.lineTo(toX(-100), toY(72));
    ctx.lineTo(toX(-120), toY(72)); ctx.lineTo(toX(-140), toY(68)); ctx.lineTo(toX(-165), toY(62));
    ctx.lineTo(toX(-168), toY(55)); ctx.lineTo(toX(-160), toY(58)); ctx.lineTo(toX(-145), toY(62));
    ctx.lineTo(toX(-135), toY(58)); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(toX(-80), toY(10)); ctx.lineTo(toX(-78), toY(5)); ctx.lineTo(toX(-75), toY(0));
    ctx.lineTo(toX(-70), toY(-5)); ctx.lineTo(toX(-65), toY(-10)); ctx.lineTo(toX(-60), toY(-15));
    ctx.lineTo(toX(-55), toY(-20)); ctx.lineTo(toX(-50), toY(-25)); ctx.lineTo(toX(-48), toY(-28));
    ctx.lineTo(toX(-50), toY(-30)); ctx.lineTo(toX(-55), toY(-35)); ctx.lineTo(toX(-60), toY(-40));
    ctx.lineTo(toX(-65), toY(-45)); ctx.lineTo(toX(-70), toY(-50)); ctx.lineTo(toX(-75), toY(-52));
    ctx.lineTo(toX(-72), toY(-45)); ctx.lineTo(toX(-70), toY(-35)); ctx.lineTo(toX(-72), toY(-25));
    ctx.lineTo(toX(-80), toY(-5)); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(toX(-10), toY(36)); ctx.lineTo(toX(0), toY(38)); ctx.lineTo(toX(5), toY(44));
    ctx.lineTo(toX(10), toY(48)); ctx.lineTo(toX(15), toY(55)); ctx.lineTo(toX(20), toY(58));
    ctx.lineTo(toX(30), toY(60)); ctx.lineTo(toX(40), toY(62)); ctx.lineTo(toX(50), toY(58));
    ctx.lineTo(toX(60), toY(55)); ctx.lineTo(toX(70), toY(52)); ctx.lineTo(toX(80), toY(50));
    ctx.lineTo(toX(90), toY(45)); ctx.lineTo(toX(100), toY(42)); ctx.lineTo(toX(110), toY(35));
    ctx.lineTo(toX(120), toY(32)); ctx.lineTo(toX(130), toY(35)); ctx.lineTo(toX(140), toY(40));
    ctx.lineTo(toX(145), toY(45)); ctx.lineTo(toX(150), toY(50)); ctx.lineTo(toX(155), toY(55));
    ctx.lineTo(toX(160), toY(60)); ctx.lineTo(toX(170), toY(65)); ctx.lineTo(toX(180), toY(68));
    ctx.lineTo(toX(180), toY(72)); ctx.lineTo(toX(100), toY(75)); ctx.lineTo(toX(50), toY(72));
    ctx.lineTo(toX(30), toY(70)); ctx.lineTo(toX(25), toY(65)); ctx.lineTo(toX(10), toY(60));
    ctx.lineTo(toX(-5), toY(58)); ctx.lineTo(toX(-10), toY(52)); ctx.lineTo(toX(-10), toY(44));
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(toX(-18), toY(15)); ctx.lineTo(toX(-15), toY(12)); ctx.lineTo(toX(-5), toY(5));
    ctx.lineTo(toX(10), toY(4)); ctx.lineTo(toX(20), toY(5)); ctx.lineTo(toX(30), toY(10));
    ctx.lineTo(toX(35), toY(12)); ctx.lineTo(toX(42), toY(12)); ctx.lineTo(toX(50), toY(8));
    ctx.lineTo(toX(52), toY(12)); ctx.lineTo(toX(48), toY(0)); ctx.lineTo(toX(42), toY(-8));
    ctx.lineTo(toX(38), toY(-15)); ctx.lineTo(toX(35), toY(-25)); ctx.lineTo(toX(28), toY(-32));
    ctx.lineTo(toX(20), toY(-35)); ctx.lineTo(toX(15), toY(-30)); ctx.lineTo(toX(12), toY(-18));
    ctx.lineTo(toX(8), toY(-5)); ctx.lineTo(toX(5), toY(2)); ctx.lineTo(toX(0), toY(5));
    ctx.lineTo(toX(-8), toY(5)); ctx.lineTo(toX(-15), toY(10)); ctx.lineTo(toX(-17), toY(14));
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(toX(115), toY(-12)); ctx.lineTo(toX(130), toY(-12)); ctx.lineTo(toX(140), toY(-15));
    ctx.lineTo(toX(148), toY(-18)); ctx.lineTo(toX(152), toY(-25)); ctx.lineTo(toX(153), toY(-30));
    ctx.lineTo(toX(150), toY(-35)); ctx.lineTo(toX(145), toY(-38)); ctx.lineTo(toX(138), toY(-36));
    ctx.lineTo(toX(130), toY(-32)); ctx.lineTo(toX(120), toY(-35)); ctx.lineTo(toX(115), toY(-34));
    ctx.lineTo(toX(114), toY(-26)); ctx.lineTo(toX(115), toY(-20)); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(toX(-55), toY(60)); ctx.lineTo(toX(-45), toY(60)); ctx.lineTo(toX(-20), toY(65));
    ctx.lineTo(toX(-18), toY(72)); ctx.lineTo(toX(-20), toY(78)); ctx.lineTo(toX(-30), toY(82));
    ctx.lineTo(toX(-45), toY(82)); ctx.lineTo(toX(-55), toY(78)); ctx.lineTo(toX(-58), toY(72));
    ctx.closePath(); ctx.fill();
}

function createAtmosphere() {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.02, 64, 64);
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                vec3 color1 = vec3(0.12, 0.42, 0.9);
                vec3 color2 = vec3(0.35, 0.65, 1.0);
                vec3 atmosphereColor = mix(color1, color2, intensity);
                gl_FragColor = vec4(atmosphereColor, intensity * 0.55);
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false
    });
    atmosphereMesh = new THREE.Mesh(geometry, material);
    scene.add(atmosphereMesh);
}

function createStars() {
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const r = 200 + Math.random() * 400;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        const c = Math.random();
        if (c < 0.6) { colors[i*3]=0.95; colors[i*3+1]=0.95; colors[i*3+2]=1; }
        else if (c < 0.8) { colors[i*3]=1; colors[i*3+1]=0.88; colors[i*3+2]=0.7; }
        else { colors[i*3]=0.7; colors[i*3+1]=0.78; colors[i*3+2]=1; }
        sizes[i] = 0.3 + Math.random() * 1.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.8, vertexColors: true, transparent: true, opacity: 0.9,
        sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    starField = new THREE.Points(geometry, material);
    scene.add(starField);
}

// ==================== KONTROLLER ====================
function initControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 7;
    controls.maxDistance = 60;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.15;
}

// ==================== RAYCASTER ====================
function initRaycaster() {
    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.25;
    mouse = new THREE.Vector2();
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
}

function onMouseClick(event) {
    if (event.target !== renderer.domElement) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const pointClouds = [];
    if (activeSatPoints && activeSatPoints.visible) pointClouds.push(activeSatPoints);
    if (debrisSatPoints && debrisSatPoints.visible) pointClouds.push(debrisSatPoints);

    const intersects = raycaster.intersectObjects(pointClouds);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        const idx = intersect.index;
        const obj = intersect.object;
        let sat;
        if (obj === activeSatPoints) {
            sat = allSatellites.active[idx];
            if (sat) sat.category = 'active';
        } else if (obj === debrisSatPoints) {
            sat = allSatellites.debris[idx];
            if (sat) sat.category = 'debris';
        }
        if (sat) selectSatellite(sat);
    } else {
        deselectSatellite();
    }
}

let hoveredTooltip = null;
function onMouseMove(event) {
    if (!hoveredTooltip) hoveredTooltip = document.getElementById('hover-tooltip');
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const pointClouds = [];
    if (activeSatPoints && activeSatPoints.visible) pointClouds.push(activeSatPoints);
    if (debrisSatPoints && debrisSatPoints.visible) pointClouds.push(debrisSatPoints);

    const intersects = raycaster.intersectObjects(pointClouds);
    if (intersects.length > 0 && hoveredTooltip) {
        const idx = intersects[0].index;
        const obj = intersects[0].object;
        let sat;
        if (obj === activeSatPoints) sat = allSatellites.active[idx];
        else if (obj === debrisSatPoints) sat = allSatellites.debris[idx];

        if (sat) {
            hoveredTooltip.innerHTML = `
                <div class="tooltip-name">${sat.name}</div>
                <div class="tooltip-info">NORAD: ${sat.norad_id} | Yükseklik: ~${sat.approx_altitude?.toFixed(0) || '?'} km</div>
            `;
            hoveredTooltip.style.left = (event.clientX + 15) + 'px';
            hoveredTooltip.style.top = (event.clientY - 10) + 'px';
            hoveredTooltip.classList.add('visible');
            renderer.domElement.style.cursor = 'pointer';
        }
    } else {
        if (hoveredTooltip) hoveredTooltip.classList.remove('visible');
        renderer.domElement.style.cursor = 'grab';
    }
}

// ==================== VERİ YÜKLEME ====================
async function loadSatelliteData() {
    updateLoadingProgress(10, 'Uydu verileri yükleniyor...');
    try {
        const response = await fetch('/api/satellites');
        updateLoadingProgress(50, 'Uydu verileri işleniyor...');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allSatellites.active = data.active || [];
        allSatellites.debris = data.debris || [];

        updateLoadingProgress(70, 'Pozisyonlar hesaplanıyor...');
        calculateAndCreatePoints();
        updateLoadingProgress(90, '3D sahne oluşturuluyor...');
        updateStats();
        updateLoadingProgress(100, 'Hazır!');
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 500);
        setInterval(updateSatellitePositions, 30000);
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        updateLoadingProgress(100, 'Hata!');
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            alert('Uydu verileri yüklenemedi. Sunucunun çalıştığından emin olun.');
        }, 1000);
    }
}

function updateLoadingProgress(percent, text) {
    const bar = document.querySelector('.loading-progress-bar');
    const sub = document.querySelector('.loading-sub');
    if (bar) bar.style.width = percent + '%';
    if (sub) sub.textContent = text;
}

// ==================== POZİSYON HESAPLAMA ====================
function latLonAltToVector3(lat, lon, alt) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const r = EARTH_RADIUS + alt * SCALE_FACTOR;
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
}

function calculateSatellitePosition(sat) {
    if (typeof satellite !== 'undefined' && sat.tle_line1 && sat.tle_line2) {
        try {
            const satrec = satellite.twoline2satrec(sat.tle_line1, sat.tle_line2);
            const now = new Date();
            const pv = satellite.propagate(satrec, now);
            if (pv.position) {
                const gmst = satellite.gstime(now);
                const geo = satellite.eciToGeodetic(pv.position, gmst);
                return {
                    lat: satellite.degreesLat(geo.latitude),
                    lon: satellite.degreesLong(geo.longitude),
                    alt: geo.height
                };
            }
        } catch (e) { /* fallback */ }
    }
    const alt = sat.approx_altitude || 400;
    const mm = sat.mean_motion || 15;
    const inc = sat.inclination || 51;
    const ra = sat.ra_of_asc_node || 0;
    const ma = sat.mean_anomaly || 0;
    const now = Date.now();
    const elapsed = (now / 1000) % (86400 / mm);
    const t = elapsed / (86400 / mm) * 2 * Math.PI + (ma * Math.PI / 180);
    const lat = inc * Math.sin(t) * (Math.PI / 180) * (180 / Math.PI);
    const lon = ((ra + t * (180 / Math.PI) * (mm / 15)) % 360) - 180;
    return { lat, lon, alt };
}

function calculateAndCreatePoints() {
    createSatellitePoints(allSatellites.active, 'active');
    createSatellitePoints(allSatellites.debris, 'debris');
}

function createSatellitePoints(satellites, type) {
    const count = satellites.length;
    if (count === 0) return;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = type === 'active' ? new THREE.Color(0x22c55e) : new THREE.Color(0xef4444);

    for (let i = 0; i < count; i++) {
        const pos = calculateSatellitePosition(satellites[i]);
        const vec = latLonAltToVector3(pos.lat, pos.lon, pos.alt);
        positions[i * 3] = vec.x;
        positions[i * 3 + 1] = vec.y;
        positions[i * 3 + 2] = vec.z;
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        satellites[i]._position = pos;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    let material;
    if (useSpriteMode && satelliteTexture) {
        material = new THREE.PointsMaterial({
            size: type === 'active' ? 0.45 : 0.30,
            map: satelliteTexture, vertexColors: true, transparent: true,
            opacity: 0.95, sizeAttenuation: true,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
    } else {
        material = new THREE.PointsMaterial({
            size: type === 'active' ? 0.18 : 0.14,
            vertexColors: true, transparent: true, opacity: 0.9,
            sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
    }

    const points = new THREE.Points(geometry, material);
    if (type === 'active') {
        if (activeSatPoints) scene.remove(activeSatPoints);
        activeSatPoints = points;
    } else {
        if (debrisSatPoints) scene.remove(debrisSatPoints);
        debrisSatPoints = points;
    }
    scene.add(points);
}

function updateSatellitePositions() {
    updatePointPositions(allSatellites.active, activeSatPoints);
    updatePointPositions(allSatellites.debris, debrisSatPoints);
}

function updatePointPositions(satellites, pointCloud) {
    if (!pointCloud || !satellites.length) return;
    const positions = pointCloud.geometry.attributes.position.array;
    for (let i = 0; i < satellites.length; i++) {
        const pos = calculateSatellitePosition(satellites[i]);
        const vec = latLonAltToVector3(pos.lat, pos.lon, pos.alt);
        positions[i * 3] = vec.x;
        positions[i * 3 + 1] = vec.y;
        positions[i * 3 + 2] = vec.z;
        satellites[i]._position = pos;
    }
    pointCloud.geometry.attributes.position.needsUpdate = true;
}

// ==================== GÖRÜNÜM DEĞİŞTİRME ====================
function setupViewToggle() {
    const btn = document.getElementById('view-toggle-btn');
    if (!btn) return;
    btn.addEventListener('click', toggleViewMode);
}

function toggleViewMode() {
    useSpriteMode = !useSpriteMode;
    const btn = document.getElementById('view-toggle-btn');
    if (btn) {
        btn.textContent = useSpriteMode ? '⚫ Nokta Görünümü' : '🛰️ Uydu Görünümü';
    }
    calculateAndCreatePoints();
    setFilter(activeFilter);
}

// ==================== FİLTRE SİSTEMİ ====================
function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
}

function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    if (activeSatPoints) activeSatPoints.visible = (filter === 'all' || filter === 'active');
    if (debrisSatPoints) debrisSatPoints.visible = (filter === 'all' || filter === 'debris');
}

// ==================== UYDU SEÇİMİ ====================
function selectSatellite(sat) {
    selectedSatellite = sat;
    controls.autoRotate = false;
    showInfoPanel(sat);
    showOrbitPrediction(sat);
}

function deselectSatellite() {
    selectedSatellite = null;
    controls.autoRotate = true;
    hideInfoPanel();
    removeOrbitLine();
}

// ==================== BİLGİ PANELİ ====================
function setupInfoPanel() {
    document.getElementById('info-close-btn')?.addEventListener('click', deselectSatellite);
}

function showInfoPanel(sat) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;

    document.getElementById('info-sat-name').textContent = sat.name || 'Bilinmeyen';
    const badge = document.getElementById('info-type-badge');
    if (sat.category === 'active') {
        badge.textContent = 'UYDU'; badge.className = 'info-type-badge active';
    } else {
        badge.textContent = 'ENKAZ'; badge.className = 'info-type-badge debris';
    }

    document.getElementById('info-norad').textContent = sat.norad_id || '-';
    document.getElementById('info-country').textContent = sat.country || '-';
    document.getElementById('info-launch').textContent = sat.launch_date || '-';
    document.getElementById('info-altitude').textContent = (sat.approx_altitude?.toFixed(1) || '-') + ' km';
    document.getElementById('info-period').textContent = (sat.period?.toFixed(1) || '-') + ' dk';
    document.getElementById('info-inclination').textContent = (sat.inclination?.toFixed(2) || '-') + '°';
    document.getElementById('info-eccentricity').textContent = sat.eccentricity?.toFixed(6) || '-';

    let speedStr = '-';
    if (typeof satellite !== 'undefined' && sat.tle_line1 && sat.tle_line2) {
        try {
            const satrec = satellite.twoline2satrec(sat.tle_line1, sat.tle_line2);
            const pv = satellite.propagate(satrec, new Date());
            if (pv.velocity) {
                const speed = Math.sqrt(pv.velocity.x**2 + pv.velocity.y**2 + pv.velocity.z**2);
                speedStr = speed.toFixed(2) + ' km/s';
            }
        } catch(e) {}
    } 
    if (speedStr === '-' && sat.mean_motion > 0) {
        const mu = 398600.4418;
        const R = 6371.0;
        const a = R + (sat.approx_altitude || 400);
        const speed = Math.sqrt(mu / a);
        speedStr = speed.toFixed(2) + ' km/s';
    }
    const speedEl = document.getElementById('info-speed');
    if (speedEl) speedEl.textContent = speedStr;

    loadCollisionData(sat.norad_id);
    panel.classList.add('visible');
}

function hideInfoPanel() {
    const panel = document.getElementById('info-panel');
    if (panel) panel.classList.remove('visible');
}

// ==================== YÖRÜNGE TAHMİNİ (TAM ÇALIŞAN) ====================
async function showOrbitPrediction(sat) {
    removeOrbitLine();
    if (!sat) return;

    let points = [];

    // Yöntem 1: satellite.js ile frontend hesaplama
    if (typeof window.satellite !== 'undefined' && sat.tle_line1 && sat.tle_line2) {
        try {
            const satrec = window.satellite.twoline2satrec(sat.tle_line1, sat.tle_line2);
            const now = new Date();
            for (let m = 0; m <= 240; m += 1) {
                const future = new Date(now.getTime() + m * 60000);
                const pv = window.satellite.propagate(satrec, future);
                if (pv.position) {
                    const gmst = window.satellite.gstime(future);
                    const geo = window.satellite.eciToGeodetic(pv.position, gmst);
                    const lat = window.satellite.degreesLat(geo.latitude);
                    const lon = window.satellite.degreesLong(geo.longitude);
                    const alt = geo.height;
                    points.push(latLonAltToVector3(lat, lon, alt));
                }
            }
            if (points.length >= 2) {
                drawOrbitLine(points, sat.category);
                console.log(`Yörünge çizildi: ${points.length} nokta (satellite.js)`);
                return;
            }
        } catch (e) {
            console.warn('satellite.js hatası, Keplerian fallback kullanılacak:', e);
        }
    }

    // Yöntem 2: Backend API
    if (sat.norad_id) {
        try {
            const response = await fetch(`/api/predict/${sat.norad_id}?hours=4&step=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.prediction && data.prediction.length > 0) {
                    points = data.prediction.map(p => latLonAltToVector3(p.lat, p.lon, p.alt));
                    if (points.length >= 2) {
                        drawOrbitLine(points, sat.category);
                        console.log(`Yörünge çizildi: ${points.length} nokta (API)`);
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('API hatası, Keplerian fallback kullanılacak:', e);
        }
    }

    // Yöntem 3: Keplerian yörünge hesaplama (her zaman çalışır)
    points = calculateKeplerianOrbit(sat);
    if (points.length >= 2) {
        drawOrbitLine(points, sat.category);
        console.log(`Yörünge çizildi: ${points.length} nokta (Keplerian)`);
    }
}

function calculateKeplerianOrbit(sat) {
    const points = [];
    const alt = sat.approx_altitude || 400;
    const inc = (sat.inclination || 51.6) * Math.PI / 180;
    const raan = (sat.ra_of_asc_node || 0) * Math.PI / 180;
    const ecc = sat.eccentricity || 0.001;
    const argp = (sat.arg_of_pericenter || 0) * Math.PI / 180;
    const mm = sat.mean_motion || 15;

    const mu = 398600.4418;
    const R = 6371.0;
    const a = R + alt;
    const period = (2 * Math.PI * Math.sqrt(a * a * a / mu));
    const n = 2 * Math.PI / period;
    const earthRotRate = 7.2921159e-5;
    const now = Date.now() / 1000;
    const ma0 = (sat.mean_anomaly || 0) * Math.PI / 180;

    // 4 saat = 14400 saniye, 30 saniye adımlarla
    const totalTime = 14400;
    const step = 30;

    for (let t = 0; t <= totalTime; t += step) {
        const M = ma0 + n * t;
        // Kepler denklemi:  E - e*sin(E) = M  (Newton-Raphson)
        let E = M;
        for (let iter = 0; iter < 10; iter++) {
            E = E - (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
        }
        // True anomaly
        const cosV = (Math.cos(E) - ecc) / (1 - ecc * Math.cos(E));
        const sinV = (Math.sqrt(1 - ecc * ecc) * Math.sin(E)) / (1 - ecc * Math.cos(E));
        const v = Math.atan2(sinV, cosV);
        // Mesafe
        const r = a * (1 - ecc * Math.cos(E));
        // Yörünge düzlemi
        const xOrb = r * Math.cos(v);
        const yOrb = r * Math.sin(v);
        // Yörünge düzleminden ECI
        const u = v + argp;
        const cosU = Math.cos(u); const sinU = Math.sin(u);
        const cosR = Math.cos(raan); const sinR = Math.sin(raan);
        const cosI = Math.cos(inc); const sinI = Math.sin(inc);
        const xECI = r * (cosR * cosU - sinR * sinU * cosI);
        const yECI = r * (sinR * cosU + cosR * sinU * cosI);
        const zECI = r * (sinU * sinI);
        // ECI -> ECEF (dünya dönüşü)
        const gmst = earthRotRate * (now + t);
        const cosG = Math.cos(gmst); const sinG = Math.sin(gmst);
        const xECEF = xECI * cosG + yECI * sinG;
        const yECEF = -xECI * sinG + yECI * cosG;
        const zECEF = zECI;
        // ECEF -> Lat/Lon/Alt
        const rr = Math.sqrt(xECEF*xECEF + yECEF*yECEF + zECEF*zECEF);
        const lat = Math.asin(zECEF / rr) * 180 / Math.PI;
        const lon = Math.atan2(yECEF, xECEF) * 180 / Math.PI;
        const altCalc = rr - R;

        points.push(latLonAltToVector3(lat, lon, altCalc));
    }
    return points;
}

function drawOrbitLine(points, category) {
    removeOrbitLine();
    if (points.length < 2) return;

    const color = category === 'active' ? 0x22c55e : 0xef4444;
    const glowColor = category === 'active' ? 0x44ff88 : 0xff6666;

    // CatmullRomCurve3 ile pürüzsüz eğri oluştur
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const tubeSegments = Math.min(points.length * 4, 1000);

    // Ana çizgi - TubeGeometry ile kalın ve görünür
    const tubeGeometry = new THREE.TubeGeometry(curve, tubeSegments, 0.025, 8, false);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
    });
    orbitLine = new THREE.Mesh(tubeGeometry, material);
    scene.add(orbitLine);

    // Glow çizgi (daha kalın, daha soluk) - görünürlüğü artırır
    const glowTubeGeometry = new THREE.TubeGeometry(curve, tubeSegments, 0.06, 8, false);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    orbitGlowLine = new THREE.Mesh(glowTubeGeometry, glowMaterial);
    scene.add(orbitGlowLine);
}

function removeOrbitLine() {
    if (orbitLine) {
        scene.remove(orbitLine);
        orbitLine.geometry.dispose();
        orbitLine.material.dispose();
        orbitLine = null;
    }
    if (orbitGlowLine) {
        scene.remove(orbitGlowLine);
        orbitGlowLine.geometry.dispose();
        orbitGlowLine.material.dispose();
        orbitGlowLine = null;
    }
}

// ==================== TEKİL ÇARPIŞMA ANALİZİ ====================
async function loadCollisionData(noradId) {
    const container = document.getElementById('collision-results');
    if (!container) return;
    container.innerHTML = `
        <div class="panel-loading">
            <div class="panel-loading-spinner"></div>
            Çarpışma riski analiz ediliyor...
        </div>
    `;

    try {
        const response = await fetch(`/api/collision/${noradId}?hours=24`);
        if (!response.ok) throw new Error('API hatası');
        const data = await response.json();

        if (!data.close_approaches || data.close_approaches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 0.82rem;">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">✅</div>
                    24 saat içinde yakın geçiş tespit edilmedi.
                    <br><small>${data.analyzed_satellites || 0} uydu analiz edildi.</small>
                </div>
            `;
            return;
        }

        let html = `<table class="collision-table"><thead><tr>
            <th>Uydu</th><th>Min. Mesafe</th><th>Risk</th>
        </tr></thead><tbody>`;

        for (const a of data.close_approaches) {
            let rc = 'risk-minimal';
            if (a.risk_level === 'YÜKSEK') rc = 'risk-high';
            else if (a.risk_level === 'ORTA') rc = 'risk-medium';
            else if (a.risk_level === 'DÜŞÜK') rc = 'risk-low';
            html += `<tr>
                <td>
                    <div style="font-weight:500;color:var(--text-primary);font-size:0.75rem;">${a.name}</div>
                    <div style="font-size:0.65rem;color:var(--text-muted);">${a.norad_id}</div>
                </td>
                <td><span class="info-field-value">${a.min_distance.toFixed(2)} km</span></td>
                <td><span class="risk-badge ${rc}">${a.risk_level}</span></td>
            </tr>`;
        }
        html += `</tbody></table>
            <div style="text-align:center;padding:8px 0 0;font-size:0.68rem;color:var(--text-muted);">
                ${data.analyzed_satellites} uydu analiz edildi • ${data.analysis_hours} saatlik tahmin
            </div>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `
            <div style="text-align:center;padding:16px;color:var(--accent-red);font-size:0.82rem;">
                Çarpışma analizi yüklenemedi.
            </div>
        `;
    }
}

// ==================== GLOBAL ÇARPIŞMA ANALİZİ (ARTIRILMIŞ) ====================
function setupCollisionButton() {
    const btn = document.getElementById('collision-analysis-btn');
    if (!btn) return;
    btn.addEventListener('click', toggleGlobalCollisionAnalysis);
}

async function toggleGlobalCollisionAnalysis() {
    const btn = document.getElementById('collision-analysis-btn');
    const resultsPanel = document.getElementById('global-collision-panel');

    if (collisionAnalysisActive) {
        collisionAnalysisActive = false;
        btn.textContent = '⚠️ Çarpışma Analizi';
        btn.classList.remove('active');
        clearCollisionHighlights();
        if (resultsPanel) resultsPanel.classList.remove('visible');
        setFilter(activeFilter);
        return;
    }

    collisionAnalysisActive = true;
    btn.textContent = '⏳ Analiz Ediliyor...';
    btn.classList.add('active');
    if (resultsPanel) {
        resultsPanel.classList.add('visible');
        resultsPanel.querySelector('.global-collision-content').innerHTML = `
            <div class="panel-loading">
                <div class="panel-loading-spinner"></div>
                Tüm uydular analiz ediliyor... Bu biraz zaman alabilir.
            </div>
        `;
    }

    try {
        const allSats = [...allSatellites.active, ...allSatellites.debris];
        // 500 uydu analiz et (güçlendirilmiş tarama)
        const sampleSize = Math.min(500, allSats.length);
        const sampleIndices = [];
        while (sampleIndices.length < sampleSize) {
            const idx = Math.floor(Math.random() * allSats.length);
            if (!sampleIndices.includes(idx)) sampleIndices.push(idx);
        }

        const riskyPairs = [];
        let analyzed = 0;

        for (const idx of sampleIndices) {
            const sat = allSats[idx];
            if (!sat.norad_id) continue;

            try {
                const resp = await fetch(`/api/collision/${sat.norad_id}?hours=24`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.close_approaches && data.close_approaches.length > 0) {
                        for (const approach of data.close_approaches) {
                            riskyPairs.push({
                                sat1_name: sat.name,
                                sat1_id: sat.norad_id,
                                sat1_category: sat.category || 'unknown',
                                sat2_name: approach.name,
                                sat2_id: approach.norad_id,
                                min_distance: approach.min_distance,
                                risk_level: approach.risk_level,
                                min_time: approach.min_time
                            });
                        }
                    }
                }
            } catch (e) { /* skip */ }

            analyzed++;
            if (resultsPanel && collisionAnalysisActive) {
                const pct = Math.round((analyzed / sampleSize) * 100);
                const contentEl = resultsPanel.querySelector('.global-collision-content');
                if (contentEl) {
                    contentEl.innerHTML = `
                        <div class="panel-loading">
                            <div class="panel-loading-spinner"></div>
                            Analiz ediliyor... ${pct}% (${analyzed}/${sampleSize})
                            ${riskyPairs.length > 0 ? `<br><span style="color:var(--accent-yellow);">${riskyPairs.length} risk tespit edildi</span>` : ''}
                        </div>
                    `;
                }
            }
            if (!collisionAnalysisActive) return;
        }

        if (!collisionAnalysisActive) return;

        btn.textContent = '❌ Analizi Kapat';
        showGlobalCollisionResults(riskyPairs, analyzed);
        highlightRiskyPairs(riskyPairs);
    } catch (error) {
        console.error('Global çarpışma analizi hatası:', error);
        btn.textContent = '⚠️ Çarpışma Analizi';
        btn.classList.remove('active');
        collisionAnalysisActive = false;
    }
}

function showGlobalCollisionResults(pairs, analyzedCount) {
    const resultsPanel = document.getElementById('global-collision-panel');
    if (!resultsPanel) return;
    const content = resultsPanel.querySelector('.global-collision-content');
    if (!content) return;

    if (pairs.length === 0) {
        content.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.82rem;">
                <div style="font-size:2rem;margin-bottom:10px;">✅</div>
                ${analyzedCount} uydu analiz edildi.<br>Çarpışma riski tespit edilmedi!
            </div>
        `;
        return;
    }

    const uniquePairs = [];
    const seen = new Set();
    for (const p of pairs) {
        const key = [p.sat1_id, p.sat2_id].sort().join('-');
        if (!seen.has(key)) { seen.add(key); uniquePairs.push(p); }
    }

    const riskOrder = { 'YÜKSEK': 0, 'ORTA': 1, 'DÜŞÜK': 2, 'MİNİMAL': 3 };
    uniquePairs.sort((a, b) => (riskOrder[a.risk_level] || 4) - (riskOrder[b.risk_level] || 4));

    let html = `<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;text-align:center;">
        ${analyzedCount} uydu analiz edildi • ${uniquePairs.length} riskli çift bulundu
    </div>`;
    html += `<table class="collision-table"><thead><tr>
        <th>Uydu 1</th><th>Uydu 2</th><th>Mesafe</th><th>Risk</th>
    </tr></thead><tbody>`;

    for (const p of uniquePairs.slice(0, 30)) {
        let rc = 'risk-minimal';
        if (p.risk_level === 'YÜKSEK') rc = 'risk-high';
        else if (p.risk_level === 'ORTA') rc = 'risk-medium';
        else if (p.risk_level === 'DÜŞÜK') rc = 'risk-low';
        html += `<tr>
            <td><div style="font-size:0.7rem;font-weight:500;color:var(--text-primary);">${p.sat1_name}</div></td>
            <td><div style="font-size:0.7rem;font-weight:500;color:var(--text-primary);">${p.sat2_name}</div></td>
            <td><span class="info-field-value" style="font-size:0.72rem;">${p.min_distance.toFixed(1)} km</span></td>
            <td><span class="risk-badge ${rc}">${p.risk_level}</span></td>
        </tr>`;
    }
    html += `</tbody></table>`;
    content.innerHTML = html;
}

function highlightRiskyPairs(pairs) {
    clearCollisionHighlights();
    const riskyIds = new Set();
    for (const p of pairs) { riskyIds.add(String(p.sat1_id)); riskyIds.add(String(p.sat2_id)); }
    if (riskyIds.size === 0) return;

    const positions = [];
    const colors = [];
    function checkAndAdd(satellites) {
        for (const sat of satellites) {
            if (riskyIds.has(String(sat.norad_id))) {
                const pos = sat._position || calculateSatellitePosition(sat);
                const vec = latLonAltToVector3(pos.lat, pos.lon, pos.alt);
                positions.push(vec.x, vec.y, vec.z);
                colors.push(1.0, 0.6, 0.1);
            }
        }
    }
    checkAndAdd(allSatellites.active);
    checkAndAdd(allSatellites.debris);

    if (positions.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.35, vertexColors: true, transparent: true, opacity: 1.0,
        sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
        map: satelliteTexture || null
    });

    collisionHighlightPoints = new THREE.Points(geometry, material);
    scene.add(collisionHighlightPoints);
    if (activeSatPoints) activeSatPoints.material.opacity = 0.15;
    if (debrisSatPoints) debrisSatPoints.material.opacity = 0.15;
}

function clearCollisionHighlights() {
    if (collisionHighlightPoints) {
        scene.remove(collisionHighlightPoints);
        collisionHighlightPoints.geometry.dispose();
        collisionHighlightPoints.material.dispose();
        collisionHighlightPoints = null;
    }
    if (activeSatPoints) activeSatPoints.material.opacity = 0.9;
    if (debrisSatPoints) debrisSatPoints.material.opacity = 0.9;
}

// ==================== İSTATİSTİKLER ====================
function updateStats() {
    const ac = allSatellites.active.length;
    const dc = allSatellites.debris.length;
    const tc = ac + dc;
    const f = (n) => n.toLocaleString('tr-TR');
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('stat-active', f(ac)); el('stat-debris', f(dc)); el('stat-total', f(tc));
    el('count-all', tc); el('count-active', ac); el('count-debris', dc);
    el('bottom-active', ac); el('bottom-debris', dc);
}

// ==================== ANİMASYON DÖNGÜSÜ ====================
function animate() {
    requestAnimationFrame(animate);
    if (cloudsMesh) cloudsMesh.rotation.y += 0.0001; // Sadece bulutlar yavaşça dönsün, dünya sabit kalsın
    if (controls) controls.update();
    renderer.render(scene, camera);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==================== ARAMA SİSTEMİ ====================
function setupSearch() {
    const searchInput = document.getElementById('satellite-search');
    const searchResults = document.getElementById('search-results');
    const searchClear = document.getElementById('search-clear');
    
    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length > 0) {
            searchClear.classList.remove('hidden');
        } else {
            searchClear.classList.add('hidden');
        }

        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        const allSats = [...allSatellites.active, ...allSatellites.debris];
        // İsimde veya NORAD ID'de eşleşenleri bul
        const results = allSats.filter(sat => 
            (sat.name && sat.name.toLowerCase().includes(query)) || 
            (sat.norad_id && sat.norad_id.toString().includes(query))
        ).slice(0, 50);

        renderSearchResults(results, query);
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchResults.classList.add('hidden');
        searchClear.classList.add('hidden');
        searchInput.focus();
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            searchResults.classList.remove('hidden');
        }
    });
}

function renderSearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">Sonuç bulunamadı</div>';
        searchResults.classList.remove('hidden');
        return;
    }

    let html = '';
    results.forEach(sat => {
        const isDebris = sat.category === 'debris';
        const icon = isDebris ? '🔴' : '🟢';
        
        html += `
            <div class="search-result-item" data-id="${sat.norad_id}">
                <div>
                    <div class="search-result-name">${icon} ${sat.name || 'Bilinmeyen'}</div>
                    <div class="search-result-norad">NORAD: ${sat.norad_id}</div>
                </div>
            </div>
        `;
    });

    searchResults.innerHTML = html;
    searchResults.classList.remove('hidden');

    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const noradId = item.getAttribute('data-id');
            const allSats = [...allSatellites.active, ...allSatellites.debris];
            const sat = allSats.find(s => s.norad_id.toString() === noradId);
            
            if (sat) {
                if (activeFilter !== 'all' && activeFilter !== sat.category) {
                    setFilter('all');
                }
                selectSatellite(sat);
                document.getElementById('satellite-search').value = sat.name;
                searchResults.classList.add('hidden');
            }
        });
    });
}
