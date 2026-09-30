import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WaveformVisualizer3DProps {
  className?: string;
  isRecording?: boolean;
  isProcessing?: boolean;
}

export const WaveformVisualizer3D: React.FC<WaveformVisualizer3DProps> = ({
  className = '',
  isRecording = false,
  isProcessing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 4, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Array of 3D Wave Bars
    const barCount = 42;
    const bars: THREE.Mesh[] = [];
    const barGroup = new THREE.Group();
    scene.add(barGroup);

    const barGeo = new THREE.BoxGeometry(0.24, 1, 0.24);

    for (let i = 0; i < barCount; i++) {
      const x = (i - barCount / 2) * 0.45;
      const barMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x2dd4bf : 0x0ea5e9,
        transparent: true,
        opacity: 0.85,
      });
      const barMesh = new THREE.Mesh(barGeo, barMat);
      barMesh.position.set(x, 0, 0);
      barGroup.add(barMesh);
      bars.push(barMesh);
    }

    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      bars.forEach((bar, idx) => {
        let targetHeight = 0.5;
        if (isRecording) {
          targetHeight = 0.8 + Math.sin(time * 6 + idx * 0.4) * 2.8 + Math.cos(time * 9 + idx * 0.2) * 1.5;
          targetHeight = Math.max(0.4, Math.abs(targetHeight));
        } else if (isProcessing) {
          targetHeight = 1.2 + Math.sin(time * 12 + idx * 0.8) * 1.8;
          targetHeight = Math.max(0.5, Math.abs(targetHeight));
        } else {
          targetHeight = 0.4 + Math.sin(time * 2 + idx * 0.3) * 0.3;
        }

        bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetHeight, 0.15);
        bar.position.y = bar.scale.y / 2 - 1;
      });

      if (isProcessing) {
        barGroup.rotation.y = time * 0.8;
      } else {
        barGroup.rotation.y = THREE.MathUtils.lerp(barGroup.rotation.y, 0, 0.1);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 500;
      const newHeight = container.clientHeight || 180;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      barGeo.dispose();
    };
  }, [isRecording, isProcessing]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#080d12]/80 border border-white/[0.06] ${className}`}>
      <div ref={containerRef} className="w-full h-[180px]" />
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between font-mono text-[9px] text-slate-500 pointer-events-none">
        <span>3D AUDIO SPECTRUM ANALYZER</span>
        <span className={isRecording ? 'text-red-400 font-bold animate-pulse' : (isProcessing ? 'text-cyan-400 font-bold' : 'text-slate-400')}>
          {isRecording ? 'STREAMING REAL-TIME AUDIO BUFFER' : isProcessing ? 'GEMINI MULTIMODAL INFERENCE' : 'AUDIO ENGINE READY'}
        </span>
      </div>
    </div>
  );
};

export default WaveformVisualizer3D;
