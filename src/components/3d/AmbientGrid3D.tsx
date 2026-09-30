import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AmbientGrid3DProps {
  className?: string;
  intensity?: number;
}

export const AmbientGrid3D: React.FC<AmbientGrid3DProps> = ({
  className = '',
  intensity = 0.4,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Infinite Horizon Cybernetic Perspective Grid in Lime Cream (#c5d86d) & Coffee Bean (#261c15)
    const gridHelper = new THREE.GridHelper(80, 50, 0xc5d86d, 0x3d2d22);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // Depth Particles in Lime Cream (#c5d86d)
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 80;
      posArray[i + 1] = Math.random() * 30 - 5;
      posArray[i + 2] = (Math.random() - 0.5) * 60;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.22,
      color: 0xc5d86d,
      transparent: true,
      opacity: 0.45 * intensity,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 6;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      camera.position.x = mouseX;
      camera.position.y = 15 - mouseY;
      camera.lookAt(0, 0, 0);

      // Subtle grid drift
      gridHelper.position.z = (elapsedTime * 1.5) % 1.6 - 6;
      particles.rotation.y = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      gridHelper.geometry.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-0 opacity-40 overflow-hidden ${className}`}
    />
  );
};

export default AmbientGrid3D;
