/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function AntigravityInner({
  count = 300,
  magnetRadius = 10,
  ringRadius = 10,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 2,
  lerpSpeed = 0.1,
  color = "#bef264",
  autoAnimate = false,
  particleVariance = 1,
  rotationSpeed = 0,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = "capsule",
  fieldStrength = 10,
}) {
  const meshRef = useRef(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseMoveTime = useRef(0);
  const virtualMouse = useRef({ x: 0, y: 0 });

  const particles = useMemo(() => {
    const width = viewport.width || 100;
    const height = viewport.height || 100;
    return Array.from({ length: count }, () => {
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * 20;
      return {
        t: Math.random() * 100,
        speed: 0.01 + Math.random() / 200,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        randomRadiusOffset: (Math.random() - 0.5) * 2,
      };
    });
  }, [count, viewport.width, viewport.height]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { viewport: currentViewport, pointer } = state;
    const mouseDistance = Math.hypot(pointer.x - lastMousePos.current.x, pointer.y - lastMousePos.current.y);
    if (mouseDistance > 0.001) {
      lastMouseMoveTime.current = Date.now();
      lastMousePos.current = { x: pointer.x, y: pointer.y };
    }

    let destinationX = (pointer.x * currentViewport.width) / 2;
    let destinationY = (pointer.y * currentViewport.height) / 2;
    if (autoAnimate && Date.now() - lastMouseMoveTime.current > 2000) {
      const time = state.clock.getElapsedTime();
      destinationX = Math.sin(time * 0.5) * (currentViewport.width / 4);
      destinationY = Math.cos(time) * (currentViewport.height / 4);
    }

    virtualMouse.current.x += (destinationX - virtualMouse.current.x) * 0.05;
    virtualMouse.current.y += (destinationY - virtualMouse.current.y) * 0.05;
    const targetX = virtualMouse.current.x;
    const targetY = virtualMouse.current.y;
    const globalRotation = state.clock.getElapsedTime() * rotationSpeed;

    particles.forEach((particle, index) => {
      particle.t += particle.speed / 2;
      const projectionFactor = 1 - particle.cz / 50;
      const projectedTargetX = targetX * projectionFactor;
      const projectedTargetY = targetY * projectionFactor;
      const dx = particle.mx - projectedTargetX;
      const dy = particle.my - projectedTargetY;
      const distance = Math.hypot(dx, dy);
      let targetPosition = { x: particle.mx, y: particle.my, z: particle.mz * depthFactor };

      if (distance < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const wave = Math.sin(particle.t * waveSpeed + angle) * (0.5 * waveAmplitude);
        const deviation = particle.randomRadiusOffset * (5 / (fieldStrength + 0.1));
        const currentRadius = ringRadius + wave + deviation;
        targetPosition = {
          x: projectedTargetX + currentRadius * Math.cos(angle),
          y: projectedTargetY + currentRadius * Math.sin(angle),
          z: particle.mz * depthFactor + Math.sin(particle.t) * waveAmplitude * depthFactor,
        };
      }

      particle.cx += (targetPosition.x - particle.cx) * lerpSpeed;
      particle.cy += (targetPosition.y - particle.cy) * lerpSpeed;
      particle.cz += (targetPosition.z - particle.cz) * lerpSpeed;
      dummy.position.set(particle.cx, particle.cy, particle.cz);
      dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz);
      dummy.rotateX(Math.PI / 2);

      const distanceFromRing = Math.abs(
        Math.hypot(particle.cx - projectedTargetX, particle.cy - projectedTargetY) - ringRadius,
      );
      const scaleFactor = Math.max(0, Math.min(1, 1 - distanceFromRing / 10));
      const finalScale =
        scaleFactor * (0.8 + Math.sin(particle.t * pulseSpeed) * 0.2 * particleVariance) * particleSize;
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {particleShape === "capsule" && <capsuleGeometry args={[0.1, 0.4, 4, 8]} />}
      {particleShape === "sphere" && <sphereGeometry args={[0.2, 16, 16]} />}
      {particleShape === "box" && <boxGeometry args={[0.3, 0.3, 0.3]} />}
      {particleShape === "tetrahedron" && <tetrahedronGeometry args={[0.3]} />}
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

export function Antigravity(props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      fallback={<div className="h-full w-full bg-[var(--focus-bg)]" />}
    >
      <AntigravityInner {...props} />
    </Canvas>
  );
}

export default Antigravity;
