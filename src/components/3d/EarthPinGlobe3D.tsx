import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pause, Play, RotateCcw, Plus, Minus, Loader2 } from 'lucide-react';

export interface PinLocation {
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
  onPinSelect?: (name: string) => void;
  isDemo?: boolean;
}

const COLORS = { critical: '#ff807b', warning: '#edc47d', healthy: '#80d7ba' };
const EMPTY_PINS: PinLocation[] = [];
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
  }
`;
const earthFragment = `
  uniform sampler2D dayMap, nightMap, normalMap, oceanMap, cloudMap;
  uniform vec3 sunDirection;
  uniform float cloudOffset;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 tangent = normalize(vec3(-n.z, 0.0, n.x));
    vec3 bitangent = normalize(cross(n, tangent));
    vec3 terrain = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    vec3 surfaceNormal = normalize(n + .22 * (terrain.x * tangent + terrain.y * bitangent));
    float light = dot(surfaceNormal, sunDirection);
    float day = smoothstep(-.18, .28, light);
    vec3 color = texture2D(dayMap, vUv).rgb;
    float cloud = texture2D(cloudMap, vUv + vec2(cloudOffset + .0018, .001)).a;
    color *= 1.0 - cloud * .19;
    vec3 surface = color * (.09 + .95 * max(light, 0.0));
    vec3 night = texture2D(nightMap, vUv).rgb;
    surface += night * vec3(1.0, .78, .48) * (1.0 - day) * 1.5;
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 halfway = normalize(sunDirection + viewDirection);
    float ocean = texture2D(oceanMap, vUv).r;
    float specular = pow(max(dot(surfaceNormal, halfway), 0.0), 65.0) * ocean * day;
    surface += vec3(.56, .73, 1.0) * specular * .6;
    float rim = pow(1.0 - max(dot(n, viewDirection), 0.0), 3.4);
    surface += vec3(.14, .36, .7) * rim * day * .48;
    gl_FragColor = vec4(surface, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const atmosphereFragment = `
  uniform vec3 sunDirection;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float rim = pow(max(0.0, 1.0 - abs(dot(normalize(vNormal), viewDirection))), 4.5);
    float sun = smoothstep(-.5, 1.0, dot(normalize(vNormal), sunDirection));
    gl_FragColor = vec4(vec3(.22, .48, 1.0), rim * (.12 + sun * .6));
  }
`;

function positionAt(lat: number, lon: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(theta),
  );
}

function disposeGroup(group: THREE.Object3D) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export const EarthPinGlobe3D: React.FC<EarthPinGlobe3DProps> = ({
  className = '', height = 520, interactive = true, showHUD = true,
  activeNodeName, pins = EMPTY_PINS, onPinSelect, isDemo = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ reset: () => void; zoom: (factor: number) => void; wake: () => void }>();
  const markersRef = useRef<THREE.Group>();
  const [isRotating, setIsRotating] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rotatingRef = useRef(isRotating);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [hovered, setHovered] = useState<string | null>(null);
  const selectRef = useRef(onPinSelect);
  selectRef.current = onPinSelect;
  rotatingRef.current = isRotating;
  const pinSignature = JSON.stringify(pins);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setStatus('fallback');
      return;
    }
    let disposed = false;
    let frame = 0;
    let visible = true;
    let lastTime = 0;
    let elapsed = 0;
    let textureFailed = false;
    let contextLost = false;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
    camera.position.copy(positionAt(19, 77, 6.7));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const canvas = renderer.domElement;
    canvas.tabIndex = interactive ? 0 : -1;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Interactive Earth showing facility locations. Drag or use arrow keys to orbit. Use plus and minus to zoom. Space pauses rotation.');
    container.appendChild(canvas);

    const controls = new OrbitControls(camera, canvas);
    controls.enabled = interactive;
    controls.enableDamping = !motionQuery.matches;
    controls.dampingFactor = .055;
    controls.enablePan = false;
    // Wheel remains available for scrolling the dashboard.
    controls.enableZoom = false;
    controls.rotateSpeed = .45;
    controls.autoRotateSpeed = .32;
    controls.minDistance = 4.4;
    controls.maxDistance = 9;
    controls.minPolarAngle = .25;
    controls.maxPolarAngle = Math.PI - .25;
    controls.saveState();

    const sunDirection = new THREE.Vector3(-.65, .65, -.85).normalize();
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => { if (!disposed) { setStatus(textureFailed ? 'fallback' : 'ready'); requestFrame(); } };
    manager.onError = () => { textureFailed = true; if (!disposed) setStatus('fallback'); };
    const loader = new THREE.TextureLoader(manager);
    const textures: THREE.Texture[] = [];
    const texture = (name: string, color = false) => {
      const map = loader.load(`/textures/${name}`, (loaded) => {
        if (disposed) loaded.dispose();
      });
      if (color) map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.push(map);
      return map;
    };
    const cloudsTexture = texture('earth_clouds_1024.png', true);
    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader, fragmentShader: earthFragment,
      uniforms: {
        dayMap: { value: texture('earth_atmos_2048.jpg', true) },
        nightMap: { value: texture('earth_lights_2048.png', true) },
        normalMap: { value: texture('earth_normal_2048.jpg') },
        oceanMap: { value: texture('earth_specular_2048.jpg') },
        cloudMap: { value: cloudsTexture }, cloudOffset: { value: 0 },
        sunDirection: { value: sunDirection },
      },
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1.8, 128, 96), earthMaterial);
    scene.add(earth);
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.814, 96, 64),
      new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true, opacity: .72, depthWrite: false, shininess: 2 }),
    );
    scene.add(clouds);
    const sunlight = new THREE.DirectionalLight('#eef5ff', 2.3);
    sunlight.position.copy(sunDirection.clone().multiplyScalar(10));
    scene.add(sunlight, new THREE.AmbientLight('#9bbcf4', .2));
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.858, 96, 64),
      new THREE.ShaderMaterial({
        vertexShader, fragmentShader: atmosphereFragment,
        uniforms: { sunDirection: { value: sunDirection } },
        transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(atmosphere);

    const starPositions = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i++) {
      const theta = i * 2.399963;
      const y = 1 - (i / 419) * 2;
      const r = Math.sqrt(1 - y * y);
      starPositions.set([Math.cos(theta) * r * 35, y * 35, Math.sin(theta) * r * 35], i * 3);
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: '#afc9e9', size: .045, transparent: true, opacity: .55, sizeAttenuation: true })));
    const markers = new THREE.Group();
    markersRef.current = markers;
    scene.add(markers);

    function requestFrame() {
      if (!disposed && !textureFailed && !contextLost && visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
    }
    function render(time: number) {
      frame = 0;
      if (disposed || textureFailed || contextLost || !visible || document.hidden) return;
      const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
      lastTime = time;
      const running = rotatingRef.current;
      controls.autoRotate = running;
      const changed = controls.update(delta);
      if (running) {
        elapsed += delta;
        clouds.rotation.y = elapsed * .004;
        earthMaterial.uniforms.cloudOffset.value = clouds.rotation.y / (Math.PI * 2);
      }
      markers.children.forEach((marker, index) => {
        const ring = marker.children[1];
        if (ring) ring.scale.setScalar(running ? 1 + Math.sin(elapsed * 1.4 + index) * .12 : 1);
      });
      renderer.render(scene, camera);
      if (running || changed) requestFrame();
    }
    const resize = () => {
      const { width, height: panelHeight } = container.getBoundingClientRect();
      if (width < 1 || panelHeight < 1) return;
      camera.aspect = width / panelHeight;
      camera.fov = width < 500 ? 48 : 38;
      camera.updateProjectionMatrix();
      renderer.setSize(width, panelHeight);
      requestFrame();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      lastTime = 0;
      if (visible) requestFrame();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    visibilityObserver.observe(container);
    const onVisibility = () => {
      lastTime = 0;
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else requestFrame();
    };
    const onMotionChange = () => {
      controls.enableDamping = !motionQuery.matches;
      if (motionQuery.matches) setIsRotating(false);
      requestFrame();
    };
    const zoom = (factor: number) => {
      camera.position.setLength(THREE.MathUtils.clamp(camera.position.length() * factor, 4.4, 9));
      controls.update(); requestFrame();
    };
    const reset = () => { controls.reset(); requestFrame(); };
    apiRef.current = { zoom, reset, wake: requestFrame };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!interactive) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        setIsRotating(false);
        const sphere = new THREE.Spherical().setFromVector3(camera.position);
        if (event.key === 'ArrowLeft') sphere.theta -= .08;
        if (event.key === 'ArrowRight') sphere.theta += .08;
        if (event.key === 'ArrowUp') sphere.phi = Math.max(.25, sphere.phi - .08);
        if (event.key === 'ArrowDown') sphere.phi = Math.min(Math.PI - .25, sphere.phi + .08);
        camera.position.setFromSpherical(sphere);
        controls.update(); requestFrame();
      } else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(.9); }
      else if (event.key === '-') { event.preventDefault(); zoom(1.1); }
      else if (event.code === 'Space') { event.preventDefault(); setIsRotating((value) => !value); }
      else if (event.key === 'Home') { event.preventDefault(); reset(); }
    };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([earth, ...markers.children], true);
      const first = hits[0]?.object;
      return first?.userData.name || first?.parent?.userData.name || null;
    };
    let pointerStart = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => { pointerStart.set(event.clientX, event.clientY); };
    const onPointerMove = (event: PointerEvent) => {
      if (event.buttons) return;
      const name = pick(event);
      setHovered((previous) => previous === name ? previous : name);
      canvas.style.cursor = name ? 'pointer' : 'grab';
    };
    const onPointerUp = (event: PointerEvent) => {
      if (pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) return;
      const name = pick(event);
      if (name) selectRef.current?.(name);
    };
    const onPointerLeave = () => setHovered(null);
    const onContextLost = (event: Event) => {
      event.preventDefault(); contextLost = true; setStatus('fallback');
      cancelAnimationFrame(frame); frame = 0; visible = false;
    };
    controls.addEventListener('change', requestFrame);
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('webglcontextlost', onContextLost);
    if (interactive) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }
    motionQuery.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect(); visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotionChange);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      controls.removeEventListener('change', requestFrame);
      controls.dispose();
      disposeGroup(scene); textures.forEach((map) => map.dispose());
      renderer.dispose(); canvas.remove();
      markersRef.current = undefined; apiRef.current = undefined;
    };
  }, [interactive]);

  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    disposeGroup(group); group.clear();
    const locations: PinLocation[] = JSON.parse(pinSignature);
    locations.filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lon) && Math.abs(pin.lat) <= 90 && Math.abs(pin.lon) <= 180)
      .forEach((pin) => {
        const node = new THREE.Group();
        node.position.copy(positionAt(pin.lat, pin.lon, 1.833));
        node.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), node.position.clone().normalize());
        node.userData.name = pin.name;
        const color = COLORS[pin.status];
        const dot = new THREE.Mesh(new THREE.SphereGeometry(.015, 12, 8), new THREE.MeshBasicMaterial({ color }));
        const ring = new THREE.Mesh(new THREE.RingGeometry(.025, .03, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false }));
        ring.position.z = .004;
        node.add(dot, ring);
        if (pin.name === activeNodeName) node.scale.setScalar(1.65);
        group.add(node);
      });
    apiRef.current?.wake();
  }, [pinSignature, activeNodeName, interactive]);

  useEffect(() => { apiRef.current?.wake(); }, [isRotating]);

  return (
    <div className={`earth-stage ${className}`} style={{ height }} data-globe-status={status}>
      <div ref={mountRef} className="earth-canvas" style={{ visibility: status === 'fallback' ? 'hidden' : 'visible' }} />
      {status === 'fallback' && <div className="earth-fallback" role="img" aria-label="Static Earth visualization" />}
      {status === 'loading' && <div className="earth-loading" role="status"><Loader2 size={20} className="animate-spin mx-auto mb-3" />Preparing Earth imagery</div>}
      {showHUD && <>
        <div className="earth-topline">
          <div><div className="earth-eyebrow">Orbital perspective</div><div className="text-[12px] text-[#b5c9e4] mt-2">Global supply network</div></div>
          <span className="earth-live"><span className="status-dot" />{isDemo ? 'Demo data' : 'Facility locations'}</span>
        </div>
        <div className="earth-legend">
          {Object.entries(COLORS).map(([name, color]) => <span key={name}><i className="status-dot" style={{ color }} />{name === 'warning' ? 'Watch' : name.charAt(0).toUpperCase() + name.slice(1)}</span>)}
        </div>
        {hovered && <div className="earth-tooltip">{hovered}</div>}
        <div className="earth-help">DRAG TO EXPLORE / ARROW KEYS TO ORBIT</div>
        <div className="earth-caption">
          <div className="earth-eyebrow">{pins.length} mapped {pins.length === 1 ? 'facility' : 'facilities'}</div>
          <h2>A world of connected care.</h2>
          <p>{status === 'fallback' ? 'Static view. Interactive rendering is unavailable.' : activeNodeName || 'See the bigger picture. Act where it matters.'}</p>
        </div>
      </>}
      {interactive && status !== 'fallback' && <div className="earth-controls">
        <button type="button" title={isRotating ? 'Pause rotation' : 'Resume rotation'} aria-label={isRotating ? 'Pause rotation' : 'Resume rotation'} aria-pressed={isRotating} onClick={() => setIsRotating((value) => !value)}>{isRotating ? <Pause size={14} /> : <Play size={14} />}</button>
        <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => apiRef.current?.zoom(.88)}><Plus size={15} /></button>
        <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => apiRef.current?.zoom(1.12)}><Minus size={15} /></button>
        <button type="button" title="Reset globe view" aria-label="Reset globe view" onClick={() => apiRef.current?.reset()}><RotateCcw size={14} /></button>
      </div>}
    </div>
  );
};

export default EarthPinGlobe3D;
