"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function Envelope({
  position,
  speed,
  rotationSpeed,
}: {
  position: [number, number, number];
  speed: number;
  rotationSpeed: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  const startY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = startY + Math.sin(t * speed) * 0.5;
    ref.current.rotation.y += rotationSpeed * 0.01;
    ref.current.rotation.x = Math.sin(t * speed * 0.5) * 0.1;
  });

  return (
    <group ref={ref} position={position}>
      {/* Envelope body */}
      <mesh>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial
          color="#06b6d4"
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Envelope flap */}
      <mesh position={[0, 0.25, 0]} rotation={[0.5, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={3}
            array={new Float32Array([-0.4, 0, 0.025, 0.4, 0, 0.025, 0, 0.3, 0.025])}
            itemSize={3}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color="#0891b2"
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Particles() {
  const count = 600;
  const ref = useRef<THREE.Points>(null!);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#06b6d4"),
      new THREE.Color("#8b5cf6"),
      new THREE.Color("#3b82f6"),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.003;
      if (positions[i * 3 + 1] > 10) {
        positions[i * 3 + 1] = -10;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function WireframeShapes() {
  const icosaRef = useRef<THREE.Mesh>(null!);
  const torusRef = useRef<THREE.Mesh>(null!);
  const octaRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (icosaRef.current) {
      icosaRef.current.rotation.x = t * 0.1;
      icosaRef.current.rotation.y = t * 0.15;
    }
    if (torusRef.current) {
      torusRef.current.rotation.x = t * 0.08;
      torusRef.current.rotation.z = t * 0.12;
    }
    if (octaRef.current) {
      octaRef.current.rotation.y = t * 0.1;
      octaRef.current.rotation.z = t * 0.08;
    }
  });

  return (
    <>
      <mesh ref={icosaRef} position={[-4, 2, -3]}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#06b6d4"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh ref={torusRef} position={[4, -1, -4]}>
        <torusGeometry args={[1, 0.3, 8, 16]} />
        <meshStandardMaterial
          color="#8b5cf6"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
      <mesh ref={octaRef} position={[3, 3, -2]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color="#3b82f6"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (typeof window === "undefined") return;
    camera.position.x += (mouse.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  if (typeof window !== "undefined") {
    window.addEventListener("mousemove", (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  return null;
}

export default function EmailScene() {
  const envelopes = useMemo(
    () => [
      { position: [-2, 1, -1] as [number, number, number], speed: 0.8, rotationSpeed: 0.5 },
      { position: [2.5, -0.5, -2] as [number, number, number], speed: 0.6, rotationSpeed: -0.3 },
      { position: [-1, -1.5, -1.5] as [number, number, number], speed: 1.0, rotationSpeed: 0.4 },
      { position: [1, 2, -3] as [number, number, number], speed: 0.7, rotationSpeed: -0.6 },
      { position: [-3, 0, -2] as [number, number, number], speed: 0.9, rotationSpeed: 0.3 },
      { position: [3, 1.5, -1] as [number, number, number], speed: 0.5, rotationSpeed: -0.4 },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#06b6d4" />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color="#8b5cf6" />
      <pointLight position={[3, -2, 1]} intensity={0.3} color="#3b82f6" />

      {envelopes.map((props, i) => (
        <Envelope key={i} {...props} />
      ))}
      <Particles />
      <WireframeShapes />
      <CameraRig />
    </>
  );
}
