import React from 'react';
import { Canvas } from '@react-three/fiber';
import { generateFlyingLightsData } from './threeVisualHelpers';
import { FlyingLightNode, Starfield, AbstractCore, MouseCameraRig } from './ThreeVisualNodes';

const NUM_LIGHTS = 12;

const FlyingLights = () => {
  const arrLights = React.useMemo(() => generateFlyingLightsData(NUM_LIGHTS), []);
  return (
    <group>
      {arrLights.map((objData) => <FlyingLightNode key={objData.id} data={objData} />)}
    </group>
  );
};

const ThreeVisual = ({ disableMouse }) => (
  <div className="three-visual-canvas-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
    <Canvas camera={{ position: [0, 0, 5.0], fov: 55 }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.15} />
      <MouseCameraRig disableMouse={disableMouse}>
        <FlyingLights />
        <AbstractCore />
      </MouseCameraRig>
      <Starfield />
    </Canvas>
  </div>
);

export default ThreeVisual;
