import { useMemo } from 'react';
import * as THREE from 'three';
import { HORIZON } from './materials';

/** Gradient sky dome with a soft sun glow. */
export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          top: { value: new THREE.Color('#f4d79e') },
          bottom: { value: new THREE.Color(HORIZON) },
          sunDir: { value: new THREE.Vector3(0.55, 0.3, -0.78).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 bottom;
          uniform vec3 sunDir;
          varying vec3 vDir;
          void main() {
            vec3 dir = normalize(vDir);
            vec3 col = mix(bottom, top, clamp(dir.y * 1.8, 0.0, 1.0));
            float s = max(dot(dir, sunDir), 0.0);
            col += vec3(1.0, 0.96, 0.85) * pow(s, 80.0) + vec3(1.0, 0.86, 0.6) * pow(s, 6.0) * 0.3;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh material={material}>
      <sphereGeometry args={[90, 32, 16]} />
    </mesh>
  );
}
