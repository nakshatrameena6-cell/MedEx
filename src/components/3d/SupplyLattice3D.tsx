import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Activity, Compass } from 'lucide-react';

interface SupplyLattice3DProps {
  className?: string;
  activeNodeCount?: number;
  transferCount?: number;
  highlightedNode?: string;
}

export const SupplyLattice3D: React.FC<SupplyLattice3DProps> = ({
  className = '',
  activeNodeCount = 48,
  transferCount = 14,
  highlightedNode: _highlightedNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [fps, setFps] = useState(60);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const pulseRingsRef = useRef<THREE.Mesh[]>([]);
  const transferArcsRef = useRef<THREE.Line[]>([]);
  const packetMeshesRef = useRef<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 360;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 26);
    camera.lookAt(0, 0, 0);

    // 3. Renderer with antialiasing and alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f2427, 2.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x2dd4bf, 3, 50);
    pointLight1.position.set(12, 15, 15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0ea5e9, 2, 50);
    pointLight2.position.set(-15, -10, -10);
    scene.add(pointLight2);

    // 5. Main Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeRef.current = globeGroup;

    // Core Globe Geometry (Icosahedron wireframe lattice)
    const globeGeo = new THREE.IcosahedronGeometry(7.5, 3);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x0e2b30,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      roughness: 0.4,
      metalness: 0.8,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Inner Glowing Core Sphere
    const coreGeo = new THREE.SphereGeometry(6.8, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x091b22,
      transparent: true,
      opacity: 0.6,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Equatorial and Orbital Holographic Rings
    const ringGeo = new THREE.RingGeometry(8.2, 8.28, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 2;
    globeGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeo, ringMat.clone());
    ringMesh2.rotation.x = Math.PI / 4;
    ringMesh2.rotation.y = Math.PI / 6;
    globeGroup.add(ringMesh2);

    // 6. Network Nodes (Facilities)
    const nodeCoords: THREE.Vector3[] = [];
    const facilityNames = [
      'TN-PHC-014 (Central Depot)',
      'TN-CHC-003 (Regional Hub)',
      'TN-PHC-021 (Sub-District)',
      'TN-PHC-042 (High Altitude)',
      'TN-DH-001 (District Hospital)',
      'TN-PHC-088 (Coastal Node)',
      'BR-PHC-005 (Sparse Node)',
      'BR-CHC-012 (Outreach)',
      'MH-DH-004 (Tier-1 Apex)',
      'TN-PHC-102 (Mobile Unit)',
    ];

    const nodeColors = [0x2dd4bf, 0x38bdf8, 0x10b981, 0xf59e0b, 0xf43f5e];

    for (let i = 0; i < activeNodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / activeNodeCount);
      const theta = Math.sqrt(activeNodeCount * Math.PI) * phi;
      const radius = 7.6 + (Math.random() * 0.3 - 0.15);

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      const pos = new THREE.Vector3(x, y, z);
      nodeCoords.push(pos);

      // Node marker sphere
      const isHub = i < 4;
      const nodeGeo = new THREE.SphereGeometry(isHub ? 0.35 : 0.18, 16, 16);
      const color = isHub ? nodeColors[0] : (i % 7 === 0 ? nodeColors[3] : (i % 11 === 0 ? nodeColors[4] : nodeColors[1]));

      const nodeMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMesh.userData = {
        id: `node-${i}`,
        name: facilityNames[i % facilityNames.length],
        isHub,
        status: i % 7 === 0 ? 'AMBER' : (i % 11 === 0 ? 'CRITICAL' : 'OPTIMAL'),
      };
      globeGroup.add(nodeMesh);

      // Pulse Ring for Hub Nodes
      if (isHub) {
        const pRingGeo = new THREE.RingGeometry(0.4, 0.46, 32);
        const pRingMat = new THREE.MeshBasicMaterial({
          color: 0x2dd4bf,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const pRing = new THREE.Mesh(pRingGeo, pRingMat);
        pRing.position.copy(pos);
        pRing.lookAt(0, 0, 0);
        globeGroup.add(pRing);
        pulseRingsRef.current.push(pRing);
      }
    }

    // 7. Active Medicine Transfer Arcs (Bezier curves)
    const packets: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[] = [];

    for (let t = 0; t < Math.min(transferCount, nodeCoords.length - 1); t++) {
      const startIdx = t % nodeCoords.length;
      const endIdx = (t * 3 + 5) % nodeCoords.length;
      const start = nodeCoords[startIdx];
      const end = nodeCoords[endIdx];

      // Midpoint elevated above sphere to create graceful sub-orbital arc
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const midLength = mid.length();
      mid.normalize().multiplyScalar(midLength + 2.5 + Math.random() * 1.5);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);

      const arcMat = new THREE.LineBasicMaterial({
        color: t % 2 === 0 ? 0x2dd4bf : 0x38bdf8,
        transparent: true,
        opacity: 0.35,
      });

      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);
      transferArcsRef.current.push(arcLine);

      // Flowing Pulse Packet Mesh traveling along arc
      const packetGeo = new THREE.SphereGeometry(0.16, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      globeGroup.add(packetMesh);

      packets.push({
        mesh: packetMesh,
        curve,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
      });
    }

    packetMeshesRef.current = packets;

    // 8. Ambient Telemetry Dust / Particle Starfield
    const particlesCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particlesCount * 3);

    for (let p = 0; p < particlesCount * 3; p += 3) {
      particlePositions[p] = (Math.random() - 0.5) * 60;
      particlePositions[p + 1] = (Math.random() - 0.5) * 50;
      particlePositions[p + 2] = (Math.random() - 0.5) * 40;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x2dd4bf,
      size: 0.15,
      transparent: true,
      opacity: 0.45,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 9. Mouse Pointer Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.8;
      mouseRef.current.targetY = y * 0.5;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 10. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // FPS tracking
      frameCount++;
      const delta = time - lastTime;
      lastTime = time;
      fpsTimer += delta;
      if (fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      // Smooth mouse dampening
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      if (globeGroup) {
        if (isRotating) {
          globeGroup.rotation.y += 0.0025;
        }
        globeGroup.rotation.x = mouseRef.current.y * 0.4;
        globeGroup.rotation.z = -mouseRef.current.x * 0.3;
      }

      // Pulse ring expansion
      pulseRingsRef.current.forEach((ring, idx) => {
        const scale = 1 + (Math.sin(time * 0.003 + idx) + 1) * 0.4;
        ring.scale.set(scale, scale, 1);
      });

      // Advance medicine packets along transfer arcs
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const pos = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pos);
      });

      // Slowly drift starfield
      particleSystem.rotation.y += 0.0004;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 11. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    };
  }, [activeNodeCount, transferCount, isRotating]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-theme-border bg-[#070b10]/90 backdrop-blur-xl shadow-2xl ${className}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full min-h-[360px] cursor-grab active:cursor-grabbing" />

      {/* Cybernetic HUD Overlay: Top-Left Telemetry */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="font-mono text-[11px] font-bold tracking-widest text-theme-primary uppercase">
            ORBITAL SUPPLY LATTICE V4.2
          </span>
        </div>
        <div className="font-mono text-[10px] text-theme-muted flex items-center gap-3">
          <span>LAT/LON: 13.0827°N 80.2707°E</span>
          <span>NODES: {activeNodeCount}</span>
          <span className="text-theme-healthy-text">SYNC: 99.8%</span>
        </div>
      </div>

      {/* Top-Right Tactical HUD Metrics */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-theme-border bg-[#0c131a]/80 backdrop-blur-md font-mono text-[10px] text-theme-text">
          <Activity className="w-3 h-3 text-theme-primary animate-pulse" />
          <span>FPS: {fps}</span>
          <span className="text-white/20">|</span>
          <span className="text-theme-primary">{transferCount} ACTIVE TRANSFERS</span>
        </div>

        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          className={`p-2 rounded-lg border transition-all ${
            isRotating
              ? 'border-cyan-500/40 bg-cyan-500/10 text-theme-primary'
              : 'border-theme-border bg-[#0c131a]/80 text-theme-muted hover:text-white'
          }`}
          title={isRotating ? 'Pause rotation' : 'Resume auto-rotation'}
          aria-label="Toggle 3D Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>
      </div>

      {/* Bottom Telemetry Ticker Ribbon */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between font-mono text-[10px] text-theme-muted border-t border-white/[0.06] pt-2 pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-theme-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            PRIMARY DEPOTS
          </span>
          <span className="flex items-center gap-1.5 text-theme-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            CHC SPOKES
          </span>
          <span className="flex items-center gap-1.5 text-theme-warning-text">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            AT RISK ({transferCount > 0 ? 3 : 0})
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-theme-muted">
          <Compass className="w-3 h-3 text-theme-muted" />
          <span>INTERACTIVE PERSPECTIVE: DRAG TO ROTATE · SCROLL TO ZOOM</span>
        </div>
      </div>

      {/* Cybernetic Corner Reticles */}
      <div className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/60" />
      <div className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/60" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/60" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/60" />
    </div>
  );
};

export default SupplyLattice3D;
