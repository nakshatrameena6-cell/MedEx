import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Cpu, RotateCw } from 'lucide-react';

interface FederationGlobe3DProps {
  className?: string;
  isTraining?: boolean;
  roundNumber?: number;
  globalAccuracy?: string;
}

export const FederationGlobe3D: React.FC<FederationGlobe3DProps> = ({
  className = '',
  isTraining = false,
  roundNumber = 7,
  globalAccuracy = '85.1',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x0f2427, 2);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0x10b981, 3, 40);
    light1.position.set(10, 10, 10);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x38bdf8, 2, 40);
    light2.position.set(-10, -10, -10);
    scene.add(light2);

    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);

    // Central Global Model Core
    const coreGeo = new THREE.OctahedronGeometry(3.5, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      wireframe: true,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    clusterGroup.add(coreMesh);

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(2.4, 20, 20);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x064e3b,
      transparent: true,
      opacity: 0.8,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    clusterGroup.add(innerMesh);

    // Outer Ring
    const ringGeo = new THREE.RingGeometry(8.5, 8.58, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 2.2;
    clusterGroup.add(orbitalRing);

    // State Nodes (TN, BR, MH)
    const stateNodes = [
      { name: 'TN (Tamil Nadu)', color: 0x2dd4bf, radius: 9, angle: 0, samples: '1.2M' },
      { name: 'BR (Bihar Sparse)', color: 0xf59e0b, radius: 9, angle: (2 * Math.PI) / 3, samples: '142K' },
      { name: 'MH (Maharashtra)', color: 0x38bdf8, radius: 9, angle: (4 * Math.PI) / 3, samples: '890K' },
    ];

    const nodeMeshes: { mesh: THREE.Mesh; angle: number; radius: number }[] = [];
    const tensorTethers: THREE.Line[] = [];

    stateNodes.forEach((s) => {
      const nodeGeo = new THREE.SphereGeometry(0.85, 20, 20);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: s.color,
        emissive: s.color,
        emissiveIntensity: 0.6,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      clusterGroup.add(nodeMesh);

      nodeMeshes.push({ mesh: nodeMesh, angle: s.angle, radius: s.radius });

      // Connecting Tensor Line to Core
      const tetherGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(s.angle) * s.radius,
          Math.sin(s.angle * 2) * 1.5,
          Math.sin(s.angle) * s.radius
        ),
      ]);
      const tetherMat = new THREE.LineDashedMaterial({
        color: s.color,
        dashSize: 0.5,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.5,
      });
      const tetherLine = new THREE.Line(tetherGeo, tetherMat);
      clusterGroup.add(tetherLine);
      tensorTethers.push(tetherLine);
    });

    // Particle Starfield
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(150 * 3);
    for (let p = 0; p < 150 * 3; p += 3) {
      particlePositions[p] = (Math.random() - 0.5) * 50;
      particlePositions[p + 1] = (Math.random() - 0.5) * 35;
      particlePositions[p + 2] = (Math.random() - 0.5) * 35;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.15, color: 0x10b981, transparent: true, opacity: 0.4 });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (isRotating) {
        clusterGroup.rotation.y = time * 0.15;
      }

      coreMesh.rotation.x = time * 0.3;
      coreMesh.rotation.y = time * 0.4;

      // Pulse Core scale
      const pulse = 1 + Math.sin(time * 2) * (isTraining ? 0.12 : 0.04);
      innerMesh.scale.set(pulse, pulse, pulse);

      // Move State Nodes along orbital path
      nodeMeshes.forEach((n, idx) => {
        const currentAngle = n.angle + (isRotating ? time * 0.1 : 0);
        const x = Math.cos(currentAngle) * n.radius;
        const y = Math.sin(currentAngle * 2) * 1.5;
        const z = Math.sin(currentAngle) * n.radius;
        n.mesh.position.set(x, y, z);

        // Update tether position
        const tether = tensorTethers[idx];
        if (tether) {
          const positions = (tether.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          positions[3] = x;
          positions[4] = y;
          positions[5] = z;
          tether.geometry.attributes.position.needsUpdate = true;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 600;
      const newHeight = container.clientHeight || 340;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [isRotating, isTraining]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070d12]/90 backdrop-blur-xl shadow-2xl ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[320px] cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none font-mono">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
            FEDERATED TENSOR AGGREGATION CORE
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-3">
          <span>MODEL: fed-v7</span>
          <span>ROUND: #{roundNumber}</span>
          <span className="text-emerald-400 font-bold">ACCURACY: {globalAccuracy}%</span>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-[#0c131a]/80 backdrop-blur-md font-mono text-[10px] text-slate-300">
          <Cpu className="w-3 h-3 text-emerald-400" />
          <span>DIFFERENTIAL PRIVACY: EPSILON=0.5</span>
        </div>

        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          className={`p-2 rounded-lg border transition-all ${
            isRotating
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-white/[0.08] bg-[#0c131a]/80 text-slate-400 hover:text-white'
          }`}
          title="Toggle rotation"
          aria-label="Toggle 3D Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>
      </div>

      {/* Bottom Node Legend */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between font-mono text-[10px] text-slate-400 border-t border-white/[0.06] pt-2 pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-teal-300">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            TN (Tamil Nadu) 1.2M samples
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            BR (Bihar Sparse) +17.1% gain
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            MH (Maharashtra) 890K samples
          </span>
        </div>
      </div>
    </div>
  );
};

export default FederationGlobe3D;
