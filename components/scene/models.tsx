"use client";

import { Float, Octahedron, Sphere, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  pulseBlackMaterial,
  pulseDeepGlassMaterial,
  pulsePurpleMaterial,
  pulseWhiteMaterial,
} from "./materials";

export function HeroModel() {
  const groupRef = useRef<THREE.Group>(null);
  const areaRef = useRef<THREE.Mesh>(null);

  // Smooth upward trending curve points (like Trendle chart)
  const chartPoints = useMemo(() => {
    const points = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 4 - 2;
      // Smooth wave with upward trend
      const baseHeight = i * 0.08;
      const wave =
        Math.sin(i * 0.5) * 0.15 +
        Math.sin(i * 0.8 + 1) * 0.1 +
        Math.cos(i * 0.3) * 0.08;
      const y = baseHeight + wave + 0.2;
      points.push(new THREE.Vector3(x, y, 0));
    }
    return points;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.08;
    }

    // Subtle breathing animation
    if (areaRef.current) {
      const pulse = 1 + Math.sin(t * 0.8) * 0.02;
      areaRef.current.scale.y = pulse;
    }
  });

  // Create smooth curve for the line
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(chartPoints),
    [chartPoints],
  );
  const lineGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 100, 0.02, 8, false),
    [curve],
  );

  // Create area fill shape
  const areaShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-2, 0);
    for (const point of chartPoints) {
      shape.lineTo(point.x, point.y);
    }
    shape.lineTo(2, 0);
    shape.lineTo(-2, 0);
    return shape;
  }, [chartPoints]);

  return (
    <Float
      speed={0.8}
      rotationIntensity={0.05}
      floatIntensity={0.15}
      floatingRange={[-0.05, 0.05]}
    >
      <group ref={groupRef} scale={1.4} position={[0, 0.2, 0]}>
        {/* Chart area fill - gradient effect */}
        <mesh ref={areaRef}>
          <shapeGeometry args={[areaShape]} />
          <meshPhysicalMaterial
            color="#d4e810"
            transparent
            opacity={0.4}
            metalness={0.1}
            roughness={0.2}
            clearcoat={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Chart line - smooth curve */}
        <mesh geometry={lineGeometry}>
          <meshPhysicalMaterial
            color="#bfd108"
            emissive="#a3b503"
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
            clearcoat={1.0}
          />
        </mesh>

        {/* End point indicator */}
        <mesh position={[2, chartPoints[chartPoints.length - 1].y, 0]}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshPhysicalMaterial
            color="#bfd108"
            emissive="#7d8c06"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Base grid lines - subtle */}
        {[0, 0.5, 1, 1.5].map((y) => (
          <mesh key={`grid-${y}`} position={[0, y, -0.1]}>
            <boxGeometry args={[4, 0.01, 0.01]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
          </mesh>
        ))}

        {/* Floating stat card - Attention Score (top right) */}
        <group position={[2.5, 2, 0.3]}>
          {/* Card shadow/depth */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[1.22, 0.62, 0.05]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.1} />
          </mesh>
          {/* Main card */}
          <mesh>
            <boxGeometry args={[1.2, 0.6, 0.12]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.85}
              metalness={0.05}
              roughness={0.15}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
              transmission={0.1}
              thickness={0.5}
            />
          </mesh>
          {/* Inner glow */}
          <mesh scale={0.95}>
            <boxGeometry args={[1.2, 0.6, 0.11]} />
            <meshBasicMaterial color="#bfd108" transparent opacity={0.05} />
          </mesh>
          {/* Green up indicator */}
          <mesh position={[0.35, 0.12, 0.07]}>
            <coneGeometry args={[0.1, 0.18, 3]} />
            <meshPhysicalMaterial
              color="#bfd108"
              emissive="#a3b503"
              emissiveIntensity={0.4}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Floating stat card - Volume (top left) */}
        <group position={[-2.5, 1.5, 0.3]}>
          {/* Card shadow */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[1.02, 0.52, 0.05]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.1} />
          </mesh>
          {/* Main card */}
          <mesh>
            <boxGeometry args={[1.0, 0.5, 0.12]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.85}
              metalness={0.05}
              roughness={0.15}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
              transmission={0.1}
              thickness={0.5}
            />
          </mesh>
          {/* Accent dot */}
          <mesh position={[-0.3, 0, 0.07]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#bfd108" transparent opacity={0.6} />
          </mesh>
        </group>

        {/* UP indicator button (bottom right) */}
        <group position={[1.8, -0.8, 0.2]}>
          {/* Button shadow */}
          <mesh position={[0, -0.02, -0.02]}>
            <boxGeometry args={[0.82, 0.37, 0.05]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.15} />
          </mesh>
          {/* Main button */}
          <mesh>
            <boxGeometry args={[0.8, 0.35, 0.1]} />
            <meshPhysicalMaterial
              color="#bfd108"
              emissive="#a3b503"
              emissiveIntensity={0.3}
              metalness={0.4}
              roughness={0.3}
              clearcoat={0.8}
            />
          </mesh>
          {/* Highlight edge */}
          <mesh position={[0, 0.15, 0.05]}>
            <boxGeometry args={[0.6, 0.02, 0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
        </group>

        {/* DOWN indicator button (bottom left) */}
        <group position={[-1.8, -0.8, 0.2]}>
          {/* Button shadow */}
          <mesh position={[0, -0.02, -0.02]}>
            <boxGeometry args={[0.82, 0.37, 0.05]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.15} />
          </mesh>
          {/* Main button */}
          <mesh>
            <boxGeometry args={[0.8, 0.35, 0.1]} />
            <meshPhysicalMaterial
              color="#f5f5f5"
              transparent
              opacity={0.9}
              metalness={0.1}
              roughness={0.3}
              clearcoat={0.8}
            />
          </mesh>
          {/* Highlight edge */}
          <mesh position={[0, 0.15, 0.05]}>
            <boxGeometry args={[0.6, 0.02, 0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

export function ChannelModel() {
  const group = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.3) * 0.15;
      group.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.3;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 0.4;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
      <group ref={group} scale={0.7}>
        {/* Outer ring - Yellow Network state channel */}
        <Torus
          ref={outerRingRef}
          args={[2.2, 0.35, 64, 100]}
          material={pulseDeepGlassMaterial}
        />

        {/* Inner ring - counter-rotating */}
        <Torus
          ref={innerRingRef}
          args={[1.4, 0.25, 64, 100]}
          material={pulsePurpleMaterial}
        />

        {/* Central circle - connection point */}
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <primitive object={pulseDeepGlassMaterial} />
        </mesh>

        {/* Orbital circles - representing peer nodes */}
        <mesh position={[2.2, 0, 0]}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <primitive object={pulsePurpleMaterial} />
        </mesh>
        <mesh position={[-2.2, 0, 0]}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <primitive object={pulsePurpleMaterial} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <primitive object={pulseWhiteMaterial} />
        </mesh>
      </group>
    </Float>
  );
}

function HexPlate({ index, total }: { index: number; total: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const yOffset = (index - total / 2) * 0.4;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.2 + index * 0.2;
    const breath = Math.sin(t * 1) * 0.05 * (index - total / 2);
    meshRef.current.position.y = yOffset + breath;
  });

  const isMetal = index % 2 === 0;

  return (
    <mesh ref={meshRef} position={[0, yOffset, 0]}>
      <cylinderGeometry args={[1, 1, 0.15, 6]} />
      <primitive
        object={isMetal ? pulseBlackMaterial : pulseDeepGlassMaterial}
      />
      <mesh scale={[1.01, 0.8, 1.01]}>
        <cylinderGeometry args={[1, 1, 0.15, 6]} />
        <meshBasicMaterial
          wireframe
          color={isMetal ? "#333" : "#bfd108"}
          transparent
          opacity={0.3}
        />
      </mesh>
    </mesh>
  );
}

export function SettlementModel() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.2}>
      <group scale={0.75} position={[0, 1.5, 0]} rotation={[0.4, 0, 0.2]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <HexPlate key={i} index={i} total={6} />
        ))}
      </group>
    </Float>
  );
}

export function DataModel() {
  const group = useRef<THREE.Group>(null);
  const lightMesh = useRef<THREE.InstancedMesh>(null);
  const darkMesh = useRef<THREE.InstancedMesh>(null);

  const PARTICLE_COUNT_LIGHT = 200;
  const PARTICLE_COUNT_DARK = 150;
  const GLOBE_RADIUS = 1.15;

  const [lightMatrices, darkMatrices] = useMemo(() => {
    const generate = (count: number, radiusBase: number) => {
      const matrices: THREE.Matrix4[] = [];
      const dummy = new THREE.Object3D();

      for (let i = 0; i < count; i++) {
        const r = radiusBase * (0.8 + Math.random() * 0.4);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        dummy.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        );

        const s = 0.02 + Math.random() * 0.04;
        dummy.scale.set(s, s, s);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());
      }
      return matrices;
    };

    return [
      generate(PARTICLE_COUNT_LIGHT, GLOBE_RADIUS),
      generate(PARTICLE_COUNT_DARK, GLOBE_RADIUS * 0.9),
    ];
  }, []);

  useLayoutEffect(() => {
    if (lightMesh.current) {
      lightMatrices.forEach((mat, i) => lightMesh.current!.setMatrixAt(i, mat));
      lightMesh.current.instanceMatrix.needsUpdate = true;
    }
    if (darkMesh.current) {
      darkMatrices.forEach((mat, i) => darkMesh.current!.setMatrixAt(i, mat));
      darkMesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [lightMatrices, darkMatrices]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.08;
      group.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
      <group ref={group} scale={0.85}>
        <mesh>
          <sphereGeometry args={[0.55, 64, 64]} />
          <primitive object={pulsePurpleMaterial} />
        </mesh>
        <instancedMesh
          ref={lightMesh}
          args={[undefined, undefined, PARTICLE_COUNT_LIGHT]}
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ebff96" transparent opacity={0.8} />
        </instancedMesh>
        <instancedMesh
          ref={darkMesh}
          args={[undefined, undefined, PARTICLE_COUNT_DARK]}
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#a3b503" transparent opacity={0.6} />
        </instancedMesh>
      </group>
    </Float>
  );
}

export function AgentModel() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mouse = state.pointer;

    if (group.current) {
      group.current.rotation.z = t * 0.05;
      const targetRotX = mouse.y * 0.5 + 0.5;
      const targetRotY = mouse.x * 0.5;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        targetRotX,
        0.1,
      );
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetRotY,
        0.1,
      );
    }
  });

  const petals = [0, 60, 120, 180, 240, 300];

  return (
    <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
      <group ref={group} scale={0.75} rotation={[0.5, 0, 0]}>
        <Sphere args={[0.7, 32, 32]} material={pulsePurpleMaterial} />
        {petals.map((angle, i) => (
          <group key={i} rotation={[0, 0, (angle * Math.PI) / 180]}>
            <mesh position={[0, 1.4, 0]} scale={[1, 1.8, 0.2]}>
              <sphereGeometry args={[0.7, 32, 32]} />
              <primitive object={pulseDeepGlassMaterial} />
            </mesh>
            <mesh position={[0, 1.2, 0.1]} scale={[0.2, 1.2, 0.1]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <primitive object={pulsePurpleMaterial} />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
}
