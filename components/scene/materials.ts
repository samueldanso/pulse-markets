import { MeshPhysicalMaterial } from "three";

export const pulseLimeMaterial = new MeshPhysicalMaterial({
  color: "#bfd108",
  emissive: "#7d8c06",
  emissiveIntensity: 0.4,
  metalness: 0.9,
  roughness: 0.15,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  reflectivity: 1.0,
  ior: 2.5,
});

export const pulseBlackMaterial = new MeshPhysicalMaterial({
  color: "#09090b",
  metalness: 0.4,
  roughness: 0.3,
  clearcoat: 0.4,
});

export const pulseWhiteMaterial = new MeshPhysicalMaterial({
  color: "#FFFFFF",
  metalness: 0.1,
  roughness: 0.4,
  clearcoat: 0.5,
  clearcoatRoughness: 0.2,
  ior: 1.5,
});

export const pulseGlassMaterial = new MeshPhysicalMaterial({
  color: "#f9ffe5",
  metalness: 0.2,
  roughness: 0.15,
  transmission: 0.95,
  thickness: 2.5,
  clearcoat: 1.0,
  ior: 1.7,
});

export const pulseDeepGlassMaterial = new MeshPhysicalMaterial({
  color: "#d4e810",
  emissive: "#a3b503",
  emissiveIntensity: 0.2,
  metalness: 0.1,
  roughness: 0.2,
  transmission: 0.8,
  thickness: 3.0,
  clearcoat: 1.0,
  ior: 2.0,
});

export const pulsePurpleMaterial = pulseLimeMaterial;
