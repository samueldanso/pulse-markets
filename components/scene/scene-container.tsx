"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import {
  AgentModel,
  ChannelModel,
  DataModel,
  HeroModel,
  SettlementModel,
} from "./models";

type SceneType = "hero" | "channel" | "settlement" | "data" | "agent";

interface SceneContainerProps {
  type: SceneType;
  className?: string;
}

function getCameraPosition(type: SceneType): [number, number, number] {
  switch (type) {
    case "hero":
      return [0, 0, 9];
    case "channel":
      return [0, 0, 7];
    case "settlement":
      return [4, 4, 4];
    case "data":
      return [0, 0, 6];
    case "agent":
      return [0, 0, 7];
    default:
      return [0, 0, 6];
  }
}

function SceneModel({ type }: { type: SceneType }) {
  switch (type) {
    case "hero":
      return <HeroModel />;
    case "channel":
      return <ChannelModel />;
    case "settlement":
      return <SettlementModel />;
    case "data":
      return <DataModel />;
    case "agent":
      return <AgentModel />;
    default:
      return null;
  }
}

function SceneLighting({ type }: { type: SceneType }) {
  if (type === "hero") {
    return (
      <>
        <ambientLight intensity={0.6} color="#f9ffe5" />
        <spotLight
          position={[8, 10, 8]}
          angle={0.5}
          penumbra={0.5}
          intensity={1.0}
          color="#FFFFFF"
        />
        <pointLight
          position={[0, -5, 2]}
          intensity={4.0}
          color="#bfd108"
          distance={10}
        />
        <pointLight
          position={[-5, 2, -2]}
          intensity={1.5}
          color="#f2ffc8"
          distance={15}
        />
      </>
    );
  }

  if (type === "channel") {
    return (
      <>
        <ambientLight intensity={0.1} color="#FFFFFF" />
        <spotLight
          position={[0, 0, -5]}
          intensity={5.0}
          color="#e2f41e"
          angle={1.0}
          distance={10}
        />
        <spotLight
          position={[5, 5, 2]}
          intensity={3.0}
          color="#d4e810"
          angle={0.5}
        />
        <spotLight
          position={[-5, -5, 2]}
          intensity={2.0}
          color="#ebff96"
          angle={0.5}
        />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#FFFFFF" />
      </>
    );
  }

  if (type === "settlement" || type === "data") {
    return (
      <>
        <ambientLight intensity={1.5} color="#FFFFFF" />
        <spotLight
          position={[10, 10, 5]}
          angle={0.5}
          penumbra={1}
          intensity={2}
          color="#FFFFFF"
        />
        <spotLight
          position={[-10, 5, 5]}
          angle={0.5}
          penumbra={1}
          intensity={1}
          color="#ebff96"
        />
        <pointLight position={[0, -5, 0]} intensity={1} color="#d4e810" />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.8} color="#F3F4F6" />
      <spotLight
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1.2}
        color="#FFFFFF"
      />
      <pointLight position={[-5, 0, 2]} intensity={0.8} color="#d4e810" />
    </>
  );
}

function SceneEnvironment({ type }: { type: SceneType }) {
  const isDark = type === "channel";

  return (
    <Environment resolution={512}>
      <group rotation={[-Math.PI / 3, 0, 1]}>
        <Lightformer
          intensity={isDark ? 0.5 : 2}
          rotation-x={Math.PI / 2}
          position={[0, 5, -9]}
          scale={[10, 10, 1]}
          color={isDark ? "#d4e810" : "#FFFFFF"}
        />
        <Lightformer
          intensity={isDark ? 2 : 2}
          rotation-y={Math.PI / 2}
          position={[-5, 1, -1]}
          scale={[10, 2, 1]}
          color={isDark ? "#e2f41e" : "#f9ffe5"}
        />
        <Lightformer
          intensity={isDark ? 2 : 2}
          rotation-y={Math.PI / 2}
          position={[-5, -1, -1]}
          scale={[10, 2, 1]}
          color={isDark ? "#a3b503" : "#FFFFFF"}
        />
        <Lightformer
          intensity={isDark ? 1 : 2}
          rotation-y={-Math.PI / 2}
          position={[10, 1, 0]}
          scale={[20, 10, 1]}
          color={isDark ? "#626e0a" : "#f2ffc8"}
        />
      </group>
    </Environment>
  );
}

export function SceneContainer({ type, className }: SceneContainerProps) {
  const allowInteraction =
    type === "settlement" ||
    type === "data" ||
    type === "hero" ||
    type === "channel";

  return (
    <div className={`relative size-full ${className ?? ""}`}>
      <Canvas
        camera={{ position: getCameraPosition(type), fov: 45 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneLighting type={type} />
          <SceneEnvironment type={type} />
          <SceneModel type={type} />
          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.4}
            scale={12}
            blur={3.5}
            far={4}
            color={type === "channel" ? "#000000" : "#626e0a"}
          />
          {allowInteraction && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.5}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI - Math.PI / 6}
              autoRotate={type === "settlement"}
              autoRotateSpeed={0.5}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
