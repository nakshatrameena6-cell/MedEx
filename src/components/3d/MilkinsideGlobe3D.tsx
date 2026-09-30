import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, RotateCw, Activity } from 'lucide-react';

interface MilkinsideGlobe3DProps {
  className?: string;
  height?: string | number;
  interactive?: boolean;
  showHUD?: boolean;
  activeNodeName?: string;
}

export const MilkinsideGlobe3D: React.FC<MilkinsideGlobe3DProps> = ({
  className = '',
  height = '460px',
  interactive = true,
  showHUD = true,
  activeNodeName = 'INDIA TELEMETRY CORE',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [showArcs, setShowArcs] = useState<boolean>(true);
  const [nodeCount, setNodeCount] = useState<number>(3840);
  const [activeCoords] = useState<{ lat: string; lon: string }>({
    lat: '13.08° N',
    lon: '80.27° E',
  });

  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  const showArcsRef = useRef(showArcs);
  showArcsRef.current = showArcs;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b11, 0.045);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 7.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // --- Master Rotation Group ---
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroup.rotation.x = THREE.MathUtils.degToRad(16);
    globeGroup.rotation.z = THREE.MathUtils.degToRad(-8);

    // Helper: Convert Lat/Long (degrees) to 3D Cartesian coordinates on sphere
    const latLongToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon + 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const GLOBE_RADIUS = 2.45;

    // 1. --- Deep Obsidian / Cosmic Inner Core Sphere ---
    const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.985, 64, 64);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      emissive: 0x020710,
      roughness: 0.22,
      metalness: 0.88,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      reflectivity: 0.95,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2. --- Subtle Grid Wireframe Horizon ---
    const gridGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(GLOBE_RADIUS * 0.995, 36, 18));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.045,
    });
    const gridMesh = new THREE.LineSegments(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // 3. --- Circular Particle Glow Texture (Canvas Generator) ---
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(0, 240, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    };
    const particleTexture = createParticleTexture();

    // 4. --- Milkinside Dot-Matrix Continents & Regional Clusters ---
    const landmassRegions = [
      // India & South Asia (High density telemetry hub)
      { minLat: 6, maxLat: 36, minLon: 68, maxLon: 92, count: 950 },
      // Southeast Asia & East Asia (China, Japan, Korea, SG)
      { minLat: -10, maxLat: 45, minLon: 95, maxLon: 145, count: 850 },
      // Europe & Mediterranean
      { minLat: 35, maxLat: 65, minLon: -10, maxLon: 45, count: 700 },
      // North America (US, Canada, Mexico)
      { minLat: 18, maxLat: 60, minLon: -130, maxLon: -65, count: 750 },
      // South America
      { minLat: -55, maxLat: 12, minLon: -80, maxLon: -35, count: 420 },
      // Africa & Middle East
      { minLat: -35, maxLat: 38, minLon: -18, maxLon: 58, count: 650 },
      // Australia & Oceania
      { minLat: -42, maxLat: -12, minLon: 112, maxLon: 155, count: 280 },
    ];

    const dotPositions: number[] = [];
    const dotColors: number[] = [];

    const baseCyan = new THREE.Color(0x00f2fe);
    const deepBlue = new THREE.Color(0x0284c7);
    const brightWhite = new THREE.Color(0xffffff);

    landmassRegions.forEach((region) => {
      for (let i = 0; i < region.count; i++) {
        const lat = THREE.MathUtils.lerp(region.minLat, region.maxLat, Math.random());
        const lon = THREE.MathUtils.lerp(region.minLon, region.maxLon, Math.random());

        const radius = GLOBE_RADIUS + (Math.random() * 0.035);
        const pos = latLongToVector3(lat, lon, radius);

        dotPositions.push(pos.x, pos.y, pos.z);

        const colorMix = Math.random();
        const pointColor = new THREE.Color();
        if (colorMix > 0.88) {
          pointColor.copy(brightWhite);
        } else if (colorMix > 0.35) {
          pointColor.copy(baseCyan);
        } else {
          pointColor.copy(deepBlue);
        }

        dotColors.push(pointColor.r, pointColor.g, pointColor.b);
      }
    });

    setNodeCount(dotPositions.length / 3);

    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    dotsGeo.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));

    const dotsMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const continentPoints = new THREE.Points(dotsGeo, dotsMat);
    globeGroup.add(continentPoints);

    // 5. --- Milkinside Atmospheric Fresnel Glowing Halo ---
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(0.65 - dot(vNormal, viewDir), 2.8);
        vec3 atmosphere = vec3(0.0, 0.94, 1.0) * intensity * 1.8;
        gl_FragColor = vec4(atmosphere, intensity * 0.85);
      }
    `;

    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 64, 64);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // Inner Fresnel Rim
    const innerRimGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.015, 64, 64);
    const innerRimMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.2);
          gl_FragColor = vec4(vec3(0.0, 0.95, 1.0) * rim, rim * 0.75);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    });
    const innerRimMesh = new THREE.Mesh(innerRimGeo, innerRimMat);
    globeGroup.add(innerRimMesh);

    // 6. --- Telemetry Hubs & Pulsing Radar Terminals ---
    const telemetryHubs = [
      { name: 'Chennai Hub (TN)', lat: 13.0827, lon: 80.2707, color: 0x00f2fe },
      { name: 'Mumbai Terminal (MH)', lat: 19.076, lon: 72.8777, color: 0x38bdf8 },
      { name: 'Patna Depot (BR)', lat: 25.5941, lon: 85.1376, color: 0xf43f5e },
      { name: 'Delhi Core (DL)', lat: 28.7041, lon: 77.1025, color: 0x00f2fe },
      { name: 'London Node', lat: 51.5074, lon: -0.1278, color: 0x38bdf8 },
      { name: 'Tokyo Node', lat: 35.6762, lon: 139.6503, color: 0x00f2fe },
      { name: 'New York Gateway', lat: 40.7128, lon: -74.006, color: 0x38bdf8 },
      { name: 'Singapore Central', lat: 1.3521, lon: 103.8198, color: 0x00f2fe },
    ];

    const ringMeshes: THREE.Mesh[] = [];

    telemetryHubs.forEach((hub) => {
      const pos = latLongToVector3(hub.lat, hub.lon, GLOBE_RADIUS * 1.01);

      // Core beacon pin
      const beaconGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: hub.color,
        transparent: true,
        opacity: 0.95,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pos);
      globeGroup.add(beacon);

      // Pulsing Radar Rings
      const ringGeo = new THREE.RingGeometry(0.03, 0.09, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hub.color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      globeGroup.add(ring);
      ringMeshes.push(ring);
    });

    // 7. --- Luminous Flight Network Arcs & Travelling Photons ---
    const transferRoutes = [
      { from: telemetryHubs[0], to: telemetryHubs[1] }, // Chennai -> Mumbai
      { from: telemetryHubs[0], to: telemetryHubs[2] }, // Chennai -> Patna
      { from: telemetryHubs[1], to: telemetryHubs[3] }, // Mumbai -> Delhi
      { from: telemetryHubs[3], to: telemetryHubs[4] }, // Delhi -> London
      { from: telemetryHubs[0], to: telemetryHubs[7] }, // Chennai -> Singapore
      { from: telemetryHubs[7], to: telemetryHubs[5] }, // Singapore -> Tokyo
      { from: telemetryHubs[4], to: telemetryHubs[6] }, // London -> New York
    ];

    const arcCurves: THREE.QuadraticBezierCurve3[] = [];
    const arcLinesGroup = new THREE.Group();
    globeGroup.add(arcLinesGroup);

    const photonPackets: { mesh: THREE.Mesh; curveIndex: number; progress: number; speed: number }[] = [];

    transferRoutes.forEach((route, idx) => {
      const start = latLongToVector3(route.from.lat, route.from.lon, GLOBE_RADIUS);
      const end = latLongToVector3(route.to.lat, route.to.lon, GLOBE_RADIUS);

      const mid = start.clone().add(end).multiplyScalar(0.5);
      const distance = start.distanceTo(end);
      const elevation = GLOBE_RADIUS + distance * 0.42;
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      arcCurves.push(curve);

      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      arcLinesGroup.add(arcLine);

      const photonGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const photonMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      });
      const photon = new THREE.Mesh(photonGeo, photonMat);
      photon.position.copy(start);
      globeGroup.add(photon);

      photonPackets.push({
        mesh: photon,
        curveIndex: idx,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
      });
    });

    // 8. --- Ambient Cosmic Starfield Particles ---
    const starCount = 380;
    const starPositions: number[] = [];
    for (let i = 0; i < starCount; i++) {
      const r = GLOBE_RADIUS * 1.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.035,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      map: particleTexture,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- Lighting Setup ---
    const ambientLight = new THREE.AmbientLight(0x0a192f, 1.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x00f2fe, 3.2);
    mainLight.position.set(5, 4, 6);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rimLight.position.set(-6, -3, -5);
    scene.add(rimLight);

    // --- Interaction Physics (Drag Rotation & Parallax) ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocity = { x: 0, y: 0 };
    let targetRotationX = globeGroup.rotation.x;
    let targetRotationY = globeGroup.rotation.y;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;

      const rect = container.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;

      camera.position.x = normX * 0.45;
      camera.position.y = 1.2 - normY * 0.35;
      camera.lookAt(0, 0, 0);

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        dragVelocity = { x: deltaX * 0.005, y: deltaY * 0.005 };
        targetRotationY += dragVelocity.x;
        targetRotationX += dragVelocity.y;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (isRotatingRef.current && !isDragging && !prefersReduced) {
        targetRotationY += 0.0018;
      }

      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;

      arcLinesGroup.visible = showArcsRef.current;

      if (showArcsRef.current) {
        photonPackets.forEach((packet) => {
          packet.progress += packet.speed;
          if (packet.progress > 1) packet.progress = 0;
          const curve = arcCurves[packet.curveIndex];
          if (curve) {
            const point = curve.getPoint(packet.progress);
            packet.mesh.position.copy(point);
            packet.mesh.visible = true;
          }
        });
      } else {
        photonPackets.forEach((p) => {
          p.mesh.visible = false;
        });
      }

      ringMeshes.forEach((ring, i) => {
        const wave = (Math.sin(elapsedTime * 3.5 + i * 1.2) + 1) * 0.5;
        ring.scale.setScalar(0.85 + wave * 0.65);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - wave) * 0.75;
      });

      starField.rotation.y -= 0.0003;
      starField.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      dotsGeo.dispose();
      dotsMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, [interactive]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-theme-border/80 dark:border-white/10 bg-[#040810] shadow-2xl select-none font-sans ${className}`}
      style={{ height }}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Cybernetic Milkinside Top Bar HUD */}
      {showHUD && (
        <div className="absolute top-4 left-5 right-5 flex flex-wrap items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Globe className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold tracking-tight text-white font-mono">
                  MILKINSIDE // SPATIAL SUPPLY TWIN
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold uppercase">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono flex items-center gap-2 mt-0.5">
                <span>GEO-POINTS: <strong className="text-cyan-400">{nodeCount.toLocaleString()}</strong></span>
                <span>·</span>
                <span>ACTIVE: <strong className="text-emerald-400">{activeNodeName}</strong></span>
              </p>
            </div>
          </div>

          {/* Interactive Floating Action Dock */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowArcs(!showArcs)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                showArcs
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/15'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Toggle Flight Transfer Arcs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ARCS: {showArcs ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRotating(!isRotating)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                isRotating
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/15'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Toggle Orbit Rotation"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>SPIN</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Ticker */}
      {showHUD && (
        <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-300 pointer-events-none z-20 border-t border-white/10 pt-2.5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LATENCY: 14ms
            </span>
            <span className="hidden sm:inline">RESOLUTION: 4K PHOTONIC</span>
            <span className="hidden md:inline">INCLINATION: 23.4°</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400">
              {activeCoords.lat} · {activeCoords.lon}
            </span>
            <span className="text-[10px] text-slate-400">DRAG TO ORBIT</span>
          </div>
        </div>
      )}
    </div>
  );
};
