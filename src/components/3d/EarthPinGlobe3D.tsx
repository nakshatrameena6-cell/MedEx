import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MapPin, RotateCw } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────
   EarthPinGlobe3D — Dribbble "3D Earth with Map Pins" recreation
   Deep-blue polished ocean sphere, soft continent landmasses,
   3D orange/red map pins, atmospheric rim glow, subtle clouds.
   ────────────────────────────────────────────────────────────── */

interface PinLocation {
  name: string;
  lat: number;
  lon: number;
  status: 'critical' | 'warning' | 'healthy';
}

interface EarthPinGlobe3DProps {
  className?: string;
  height?: string | number;
  interactive?: boolean;
  showHUD?: boolean;
  activeNodeName?: string;
  pins?: PinLocation[];
}

// ── Default facility pin locations ──
const DEFAULT_PINS: PinLocation[] = [
  { name: 'Chennai Hub (TN)', lat: 13.08, lon: 80.27, status: 'healthy' },
  { name: 'Mumbai Terminal (MH)', lat: 19.08, lon: 72.88, status: 'healthy' },
  { name: 'Patna Depot (BR)', lat: 25.59, lon: 85.14, status: 'critical' },
  { name: 'Delhi Core (DL)', lat: 28.70, lon: 77.10, status: 'warning' },
  { name: 'Kolkata Node (WB)', lat: 22.57, lon: 88.36, status: 'healthy' },
  { name: 'Hyderabad (TS)', lat: 17.39, lon: 78.49, status: 'healthy' },
  { name: 'Bangalore (KA)', lat: 12.97, lon: 77.59, status: 'healthy' },
  { name: 'London Node', lat: 51.51, lon: -0.13, status: 'healthy' },
  { name: 'Singapore Hub', lat: 1.35, lon: 103.82, status: 'healthy' },
  { name: 'Tokyo Terminal', lat: 35.68, lon: 139.65, status: 'healthy' },
  { name: 'New York', lat: 40.71, lon: -74.01, status: 'warning' },
  { name: 'São Paulo', lat: -23.55, lon: -46.63, status: 'healthy' },
  { name: 'Nairobi', lat: -1.29, lon: 36.82, status: 'healthy' },
  { name: 'Sydney', lat: -33.87, lon: 151.21, status: 'healthy' },
];

// ── Palette: Coffee Bean, Porcelain, Beige, Lime Cream & Tiger Flame ──
const PALETTE = {
  oceanDeep: 0x1E1610,
  oceanMid: 0x261C15,
  oceanBright: 0x33261D,
  oceanHighlight: 0x4A382A,
  landDark: 0x5C4A3A,
  landMid: 0x8C7862,
  landBright: 0xE4E6C3,
  pinOrange: 0xF05D23,
  pinRed: 0xD94C15,
  pinHead: 0xF05D23,
  pinShadow: 0x1E1610,
  atmosphere: 0xC5D86D,
  bgDark: 0x261C15,
};

// ── Status → Pin Colors ──
const STATUS_COLORS: Record<string, { head: number; body: number }> = {
  critical: { head: 0xF05D23, body: 0xD94C15 }, // Tiger Flame
  warning: { head: 0xF59E0B, body: 0xD97706 },  // Amber
  healthy: { head: 0xC5D86D, body: 0xAEC257 },  // Lime Cream
};

export const EarthPinGlobe3D: React.FC<EarthPinGlobe3DProps> = ({
  className = '',
  height = '460px',
  interactive = true,
  showHUD = true,
  activeNodeName = 'GLOBAL SUPPLY NETWORK',
  pins = DEFAULT_PINS,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  const hoveredPinRef = useRef<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ═══════════════════ SCENE ═══════════════════
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE.bgDark);

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.6, 8.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ═══════════════════ GLOBE GROUP ═══════════════════
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroup.rotation.x = THREE.MathUtils.degToRad(12);
    globeGroup.rotation.z = THREE.MathUtils.degToRad(-5);

    const GLOBE_RADIUS = 2.65;

    // ── Helper: Lat/Lon → 3D ──
    const latLonToVec3 = (lat: number, lon: number, r: number): THREE.Vector3 => {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon + 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    // ═══════════════════ 1. OCEAN SPHERE (Deep Blue Gradient) ═══════════════════
    const oceanGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);

    // Custom shader for rich blue gradient ocean
    const oceanVertShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const oceanFragShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
        
        // Deep ocean base gradient (latitude-based)
        vec3 deepBlue = vec3(0.016, 0.145, 0.361);    // #04255C
        vec3 midBlue = vec3(0.035, 0.310, 0.639);     // #094FA3
        vec3 brightBlue = vec3(0.020, 0.322, 0.769);   // #0552C4
        vec3 highlightBlue = vec3(0.078, 0.549, 0.953); // #148CF3
        
        // Mix based on UV latitude and fresnel
        float latFactor = vUv.y;
        vec3 baseColor = mix(deepBlue, midBlue, smoothstep(0.2, 0.5, latFactor));
        baseColor = mix(baseColor, brightBlue, smoothstep(0.4, 0.7, latFactor));
        
        // Fresnel rim highlight — brighter at edges
        baseColor = mix(baseColor, highlightBlue, fresnel * 0.65);
        
        // Subtle specular highlight from light direction
        vec3 lightDir = normalize(vec3(4.0, 3.0, 5.0));
        float specular = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 32.0);
        baseColor += vec3(0.3, 0.6, 1.0) * specular * 0.45;
        
        // Soft diffuse lighting
        float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.4 + 0.6;
        baseColor *= diffuse;
        
        gl_FragColor = vec4(baseColor, 1.0);
      }
    `;

    const oceanMat = new THREE.ShaderMaterial({
      vertexShader: oceanVertShader,
      fragmentShader: oceanFragShader,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    globeGroup.add(oceanMesh);

    // ═══════════════════ 2. CONTINENT LANDMASSES ═══════════════════
    // Dense point cloud to create filled-in landmass shapes
    // Each region is a bounding box with coastal shaping via noise approximation

    interface LandRegion {
      name: string;
      minLat: number; maxLat: number;
      minLon: number; maxLon: number;
      density: number;
      subRegions?: { minLat: number; maxLat: number; minLon: number; maxLon: number; density: number }[];
    }

    const landRegions: LandRegion[] = [
      // Asia
      { name: 'India', minLat: 8, maxLat: 35, minLon: 68, maxLon: 90, density: 1400 },
      { name: 'SE Asia', minLat: -8, maxLat: 28, minLon: 92, maxLon: 120, density: 900 },
      { name: 'China/Korea/Japan', minLat: 20, maxLat: 50, minLon: 100, maxLon: 145, density: 1200 },
      { name: 'Central Asia', minLat: 35, maxLat: 55, minLon: 50, maxLon: 90, density: 600 },
      { name: 'Middle East', minLat: 15, maxLat: 40, minLon: 35, maxLon: 60, density: 550 },
      { name: 'Russia', minLat: 50, maxLat: 72, minLon: 30, maxLon: 180, density: 1000 },
      // Europe
      { name: 'Europe', minLat: 36, maxLat: 62, minLon: -10, maxLon: 35, density: 900 },
      { name: 'Scandinavia', minLat: 55, maxLat: 71, minLon: 5, maxLon: 30, density: 350 },
      { name: 'UK/Ireland', minLat: 50, maxLat: 59, minLon: -10, maxLon: 2, density: 250 },
      // Africa
      { name: 'North Africa', minLat: 15, maxLat: 37, minLon: -17, maxLon: 40, density: 800 },
      { name: 'Sub-Saharan Africa', minLat: -35, maxLat: 15, minLon: -18, maxLon: 52, density: 1000 },
      // Americas
      { name: 'North America', minLat: 25, maxLat: 55, minLon: -130, maxLon: -60, density: 1100 },
      { name: 'Canada/Alaska', minLat: 50, maxLat: 72, minLon: -170, maxLon: -55, density: 700 },
      { name: 'Central America', minLat: 7, maxLat: 30, minLon: -115, maxLon: -75, density: 400 },
      { name: 'South America', minLat: -55, maxLat: 12, minLon: -82, maxLon: -34, density: 900 },
      // Oceania
      { name: 'Australia', minLat: -40, maxLat: -12, minLon: 113, maxLon: 154, density: 600 },
      { name: 'New Zealand', minLat: -47, maxLat: -34, minLon: 166, maxLon: 179, density: 150 },
      { name: 'Indonesia/Philippines', minLat: -8, maxLat: 18, minLon: 95, maxLon: 140, density: 500 },
    ];

    // Simple pseudo-random for reproducible coastline noise
    const seededRandom = (x: number, y: number) => {
      const dot = x * 12.9898 + y * 78.233;
      return (Math.sin(dot) * 43758.5453) % 1;
    };

    const landPositions: number[] = [];
    const landColors: number[] = [];

    const landColorLight = new THREE.Color(0x60A5FA); // Bright blue continents
    const landColorMid = new THREE.Color(0x3B82F6);   // Mid blue
    const landColorDark = new THREE.Color(0x2563EB);   // Darker blue edges

    landRegions.forEach((region) => {
      for (let i = 0; i < region.density; i++) {
        const lat = region.minLat + Math.random() * (region.maxLat - region.minLat);
        const lon = region.minLon + Math.random() * (region.maxLon - region.minLon);

        // Add subtle coastline erosion via noise
        const noiseVal = seededRandom(lat * 0.1, lon * 0.1);
        const edgeDistLat = Math.min(lat - region.minLat, region.maxLat - lat) / (region.maxLat - region.minLat);
        const edgeDistLon = Math.min(lon - region.minLon, region.maxLon - lon) / (region.maxLon - region.minLon);
        const edgeDist = Math.min(edgeDistLat, edgeDistLon);

        // Skip points near edges based on noise — creates organic coastline feel
        if (edgeDist < 0.15 && noiseVal > 0.45) continue;

        const r = GLOBE_RADIUS + 0.008 + Math.random() * 0.012;
        const pos = latLonToVec3(lat, lon, r);
        landPositions.push(pos.x, pos.y, pos.z);

        // Color variation — lighter toward center, darker at edges
        const colorMix = Math.random();
        const c = new THREE.Color();
        if (colorMix > 0.7) {
          c.copy(landColorLight);
        } else if (colorMix > 0.3) {
          c.copy(landColorMid);
        } else {
          c.copy(landColorDark);
        }
        // Brighten points that are more "inland"
        if (edgeDist > 0.3) {
          c.lerp(new THREE.Color(0x93C5FD), 0.15);
        }
        landColors.push(c.r, c.g, c.b);
      }
    });

    // Create particle texture for soft round points
    const createDotTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
        g.addColorStop(0.7, 'rgba(255,255,255,0.25)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const dotTex = createDotTexture();

    const landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute('position', new THREE.Float32BufferAttribute(landPositions, 3));
    landGeo.setAttribute('color', new THREE.Float32BufferAttribute(landColors, 3));

    const landMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      map: dotTex,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const landPoints = new THREE.Points(landGeo, landMat);
    globeGroup.add(landPoints);

    // ═══════════════════ 3. SUBTLE LATITUDE/LONGITUDE GRID ═══════════════════
    const gridGeo = new THREE.WireframeGeometry(
      new THREE.SphereGeometry(GLOBE_RADIUS * 0.998, 24, 12)
    );
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x1E40AF,
      transparent: true,
      opacity: 0.06,
    });
    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    globeGroup.add(gridLines);

    // ═══════════════════ 4. ATMOSPHERIC GLOW RIM ═══════════════════
    const atmosVertShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Outer glow — soft blue atmosphere
    const outerAtmosFragShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(0.62 - dot(vNormal, viewDir), 3.0);
        vec3 glowColor = vec3(0.30, 0.66, 1.0); // Soft blue
        gl_FragColor = vec4(glowColor * intensity * 2.2, intensity * 0.7);
      }
    `;

    const outerAtmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.18, 64, 64);
    const outerAtmosMat = new THREE.ShaderMaterial({
      vertexShader: atmosVertShader,
      fragmentShader: outerAtmosFragShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const outerAtmos = new THREE.Mesh(outerAtmosGeo, outerAtmosMat);
    scene.add(outerAtmos);

    // Inner rim — tighter fresnel edge
    const innerRimFragShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.8);
        vec3 rimColor = vec3(0.20, 0.50, 0.95);
        gl_FragColor = vec4(rimColor * rim, rim * 0.55);
      }
    `;

    const innerRimGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.01, 64, 64);
    const innerRimMat = new THREE.ShaderMaterial({
      vertexShader: atmosVertShader,
      fragmentShader: innerRimFragShader,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    });
    const innerRim = new THREE.Mesh(innerRimGeo, innerRimMat);
    globeGroup.add(innerRim);

    // ═══════════════════ 5. 3D MAP PINS ═══════════════════
    const pinMeshes: THREE.Group[] = [];
    const pinLabelData: { group: THREE.Group; name: string; screenPos: THREE.Vector2 }[] = [];

    const createMapPin = (
      location: PinLocation,
      globeRadius: number
    ): THREE.Group => {
      const pinGroup = new THREE.Group();
      const colors = STATUS_COLORS[location.status] || STATUS_COLORS.healthy;

      const surfacePos = latLonToVec3(location.lat, location.lon, globeRadius);
      const normal = surfacePos.clone().normalize();

      // Pin stem (thin cylinder)
      const stemHeight = 0.32;
      const stemGeo = new THREE.CylinderGeometry(0.012, 0.018, stemHeight, 8);
      const stemMat = new THREE.MeshPhysicalMaterial({
        color: colors.body,
        roughness: 0.25,
        metalness: 0.6,
        clearcoat: 0.4,
      });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(0, stemHeight / 2, 0);
      pinGroup.add(stem);

      // Pin head (sphere on top)
      const headRadius = 0.06;
      const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
      const headMat = new THREE.MeshPhysicalMaterial({
        color: colors.head,
        roughness: 0.15,
        metalness: 0.3,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        emissive: new THREE.Color(colors.head),
        emissiveIntensity: 0.3,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, stemHeight + headRadius * 0.5, 0);
      pinGroup.add(head);

      // Glow ring at base
      const ringGeo = new THREE.RingGeometry(0.02, 0.06, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colors.head,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.005, 0);
      pinGroup.add(ring);

      // Shadow disc at base
      const shadowGeo = new THREE.CircleGeometry(0.045, 16);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, 0.002, 0);
      pinGroup.add(shadow);

      // Position the pin on the globe surface
      pinGroup.position.copy(surfacePos);

      // Orient pin to point outward from globe center
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
      pinGroup.quaternion.copy(quaternion);

      pinGroup.userData = { name: location.name, status: location.status };

      return pinGroup;
    };

    pins.forEach((pin) => {
      const pinMesh = createMapPin(pin, GLOBE_RADIUS * 1.005);
      globeGroup.add(pinMesh);
      pinMeshes.push(pinMesh);
      pinLabelData.push({
        group: pinMesh,
        name: pin.name,
        screenPos: new THREE.Vector2(),
      });
    });

    // ═══════════════════ 6. SUBTLE CLOUD LAYER ═══════════════════
    // Very transparent, wispy cloud points
    const cloudCount = 500;
    const cloudPositions: number[] = [];
    for (let i = 0; i < cloudCount; i++) {
      const lat = -60 + Math.random() * 120;
      const lon = -180 + Math.random() * 360;
      const r = GLOBE_RADIUS * 1.025 + Math.random() * 0.015;
      const pos = latLonToVec3(lat, lon, r);
      cloudPositions.push(pos.x, pos.y, pos.z);
    }
    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.Float32BufferAttribute(cloudPositions, 3));
    const cloudMat = new THREE.PointsMaterial({
      size: 0.09,
      color: 0xBFDBFE,
      transparent: true,
      opacity: 0.12,
      map: dotTex,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const clouds = new THREE.Points(cloudGeo, cloudMat);
    globeGroup.add(clouds);

    // ═══════════════════ 7. BACKGROUND STARS ═══════════════════
    const starCount = 250;
    const starPos: number[] = [];
    for (let i = 0; i < starCount; i++) {
      const r = 12 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x94A3B8,
      transparent: true,
      opacity: 0.35,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ═══════════════════ 8. LIGHTING ═══════════════════
    // Key light — warm white from upper right
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.8);
    keyLight.position.set(5, 4, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill light — cooler blue from left
    const fillLight = new THREE.DirectionalLight(0x4DA8FF, 1.2);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    // Rim light — back/bottom for depth
    const rimLight = new THREE.DirectionalLight(0x1E40AF, 0.8);
    rimLight.position.set(-2, -4, -5);
    scene.add(rimLight);

    // Ambient — very subtle base fill
    const ambientLight = new THREE.AmbientLight(0x0A1628, 1.8);
    scene.add(ambientLight);

    // ═══════════════════ 9. INTERACTION ═══════════════════
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let targetRotY = globeGroup.rotation.y;
    let targetRotX = globeGroup.rotation.x;

    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;

      const rect = container.getBoundingClientRect();

      // Parallax camera
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.4;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3;
      camera.position.x = normX;
      camera.position.y = 0.6 - normY;
      camera.lookAt(0, 0, 0);

      // Drag rotation
      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        targetRotY += dx * 0.005;
        targetRotX += dy * 0.003;
        targetRotX = Math.max(
          THREE.MathUtils.degToRad(-30),
          Math.min(THREE.MathUtils.degToRad(40), targetRotX)
        );
        prevMouse = { x: e.clientX, y: e.clientY };
      }

      // Raycast for pin hover
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseNDC, camera);

      let foundHover: string | null = null;
      pinMeshes.forEach((pin) => {
        const intersects = raycaster.intersectObjects(pin.children, true);
        if (intersects.length > 0) {
          foundHover = pin.userData.name;
        }
      });

      if (foundHover !== hoveredPinRef.current) {
        hoveredPinRef.current = foundHover;
        setHoveredPin(foundHover);
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // ═══════════════════ 10. ANIMATION LOOP ═══════════════════
    let animFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Auto-rotation
      if (isRotatingRef.current && !isDragging && !prefersReduced) {
        targetRotY += 0.0014;
      }

      // Smooth interpolation
      globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.06;
      globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.06;

      // Cloud layer slow rotation
      clouds.rotation.y = elapsed * 0.008;

      // Animate pin heads — gentle float
      pinMeshes.forEach((pin, i) => {
        const headMesh = pin.children[1] as THREE.Mesh;
        if (headMesh) {
          const baseY = 0.32 + 0.06 * 0.5;
          headMesh.position.y = baseY + Math.sin(elapsed * 2.5 + i * 0.8) * 0.015;
        }

        // Pulse ring at base
        const ringMesh = pin.children[2] as THREE.Mesh;
        if (ringMesh) {
          const pulse = (Math.sin(elapsed * 3.0 + i * 1.1) + 1) * 0.5;
          ringMesh.scale.setScalar(0.8 + pulse * 0.6);
          (ringMesh.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.5;
        }
      });

      // Subtle star twinkle
      stars.rotation.y = elapsed * 0.001;

      renderer.render(scene, camera);
    };

    animate();

    // ═══════════════════ RESIZE ═══════════════════
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // ═══════════════════ CLEANUP ═══════════════════
    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      oceanGeo.dispose();
      oceanMat.dispose();
      landGeo.dispose();
      landMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      outerAtmosGeo.dispose();
      outerAtmosMat.dispose();
      innerRimGeo.dispose();
      innerRimMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      dotTex.dispose();
    };
  }, [interactive, pins]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#020818] shadow-2xl select-none font-sans ${className}`}
      style={{ height }}
    >
      {/* WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ── Top HUD Bar ── */}
      {showHUD && (
        <div className="absolute top-4 left-5 right-5 flex flex-wrap items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/25 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
              <MapPin className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-bold tracking-tight text-white/95 font-mono">
                  SUPPLY CHAIN · EARTH OVERVIEW
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 font-bold uppercase tracking-widest animate-pulse">
                  ● LIVE
                </span>
              </div>
              <p className="text-[11px] text-blue-200/60 font-mono flex items-center gap-2 mt-0.5">
                <span>NODES: <strong className="text-blue-300/90">{pins.length}</strong></span>
                <span className="text-white/20">·</span>
                <span>ACTIVE: <strong className="text-emerald-300/90">{activeNodeName}</strong></span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsRotating(!isRotating)}
              aria-label={isRotating ? 'Pause rotation' : 'Resume rotation'}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all flex items-center gap-1.5 backdrop-blur-sm ${
                isRotating
                  ? 'bg-blue-500/15 border-blue-400/30 text-blue-300 shadow-lg shadow-blue-500/10'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              <span>ORBIT</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Pin Hover Tooltip ── */}
      {hoveredPin && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] z-30 pointer-events-none">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/95 border border-blue-400/25 backdrop-blur-md shadow-xl shadow-black/40 flex items-center gap-2.5">
            <MapPin className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.2} />
            <span className="text-[12px] text-white font-mono font-medium tracking-tight">
              {hoveredPin}
            </span>
          </div>
        </div>
      )}

      {/* ── Pin Legend ── */}
      {showHUD && (
        <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center justify-between text-[10px] font-mono pointer-events-none z-20 border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-4 text-slate-300/70">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/40" />
              Healthy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/40" />
              Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/40" />
              Critical
            </span>
          </div>

          <div className="flex items-center gap-3 text-blue-300/50">
            <span className="hidden sm:inline">INTERACTIVE 3D EARTH</span>
            <span className="text-white/20">·</span>
            <span>DRAG TO ORBIT</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarthPinGlobe3D;
