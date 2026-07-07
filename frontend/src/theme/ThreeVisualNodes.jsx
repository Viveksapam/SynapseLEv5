import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { computeLightOpacity, generateStarfieldData, createCircleTexture } from './threeVisualHelpers';

const NUM_STARS = 2000;

export const FlyingLightNode = ({ data }) => {
  const meshRef = useRef();
  const innerMatRef = useRef();
  const outerMatRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    const numTime = state.clock.getElapsedTime();
    let numZ = data.initialZ + numTime * data.speedZ * 10;
    numZ = ((numZ - -35) % 40) + -35;

    const numAngle = numTime * data.spiralSpeed + data.phase;
    let numX = Math.sin(numAngle) * data.radius + Math.sin(numTime * data.wobbleSpeedX) * data.wobbleAmp;
    let numY = Math.cos(numAngle) * data.radius + Math.cos(numTime * data.wobbleSpeedY) * data.wobbleAmp;

    const numOpacity = computeLightOpacity(numZ);

    if (meshRef.current) {
      meshRef.current.position.set(numX, numY, numZ);
      const numPulse = 1 + Math.sin(numTime * 3.5 + data.id) * 0.15;
      meshRef.current.scale.set(numPulse, numPulse, numPulse);
    }
    if (innerMatRef.current) innerMatRef.current.opacity = numOpacity;
    if (outerMatRef.current) outerMatRef.current.opacity = numOpacity * 0.25;
    if (lightRef.current) lightRef.current.intensity = numOpacity * 5.0;
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial ref={innerMatRef} color={data.color} transparent opacity={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial ref={outerMatRef} color={data.color} transparent opacity={0.25} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight ref={lightRef} distance={3.0} intensity={5.0} color={data.color} />
    </group>
  );
};

FlyingLightNode.propTypes = { data: PropTypes.object.isRequired };

export const Starfield = () => {
  const pointsRef = useRef();
  const objTexture = React.useMemo(() => createCircleTexture(), []);
  const { positions, colors, speeds } = React.useMemo(() => generateStarfieldData(NUM_STARS), []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const objAttr = pointsRef.current.geometry.getAttribute('position');
    const arr = objAttr.array;
    for (let i = 0; i < NUM_STARS; i++) {
      const numIdx = i * 3;
      arr[numIdx + 2] += speeds[i];
      if (arr[numIdx + 2] > 5) {
        arr[numIdx + 2] = -35 - Math.random() * 5;
        arr[numIdx] = (Math.random() - 0.5) * 18;
        arr[numIdx + 1] = (Math.random() - 0.5) * 18;
      }
    }
    objAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        transparent vertexColors size={0.12} sizeAttenuation depthWrite={false}
        blending={THREE.AdditiveBlending} map={objTexture}
      />
    </points>
  );
};

export const AbstractCore = () => {
  const meshRef = useRef();
  useFrame((state) => {
    const numTime = state.clock.getElapsedTime();
    if (!meshRef.current) return;
    meshRef.current.rotation.x = numTime * 0.1;
    meshRef.current.rotation.y = numTime * 0.15;
    const numScale = 1 + Math.sin(numTime * 2) * 0.05;
    meshRef.current.scale.set(numScale, numScale, numScale);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <icosahedronGeometry args={[2.5, 1]} />
      <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.15} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

export const MouseCameraRig = ({ children, disableMouse }) => {
  const rigRef = useRef();
  const [objMouse, setObjMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (disableMouse) return;
    const handle = (e) => {
      const numX = (e.clientX / window.innerWidth) * 2 - 1;
      const numY = -(e.clientY / window.innerHeight) * 2 + 1;
      setObjMouse({ x: numX, y: numY });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [disableMouse]);

  useFrame((state) => {
    const numTime = state.clock.getElapsedTime();
    if (!rigRef.current) return;
    const numDriftX = Math.sin(numTime * 0.25) * 0.4;
    const numDriftY = Math.cos(numTime * 0.2) * 0.3;
    const numMouseX = disableMouse ? 0 : objMouse.x;
    const numMouseY = disableMouse ? 0 : objMouse.y;
    rigRef.current.position.x = THREE.MathUtils.lerp(rigRef.current.position.x, numDriftX + numMouseX * 0.8, 0.05);
    rigRef.current.position.y = THREE.MathUtils.lerp(rigRef.current.position.y, numDriftY + numMouseY * 0.6, 0.05);
    rigRef.current.rotation.y = THREE.MathUtils.lerp(rigRef.current.rotation.y, numMouseX * 0.1, 0.05);
    rigRef.current.rotation.x = THREE.MathUtils.lerp(rigRef.current.rotation.x, -numMouseY * 0.08, 0.05);
  });

  return <group ref={rigRef}>{children}</group>;
};

MouseCameraRig.propTypes = { children: PropTypes.node, disableMouse: PropTypes.bool };
