import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, AxesHelper, Stats } from '@react-three/drei';
import { getMissionResults, getFileUrl } from '../api';

function ThreeDViewer({ missionId, missionStatus }) {
  const [stlFiles, setStlFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!missionId || missionStatus?.status !== 'complete') {
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await getMissionResults(missionId);
        setStlFiles(results.files || []);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setError('Failed to load 3D files');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [missionId, missionStatus]);

  const GridHelper = () => (
    <group>
      <Grid args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#00d4ff" sectionSize={5} sectionThickness={1} sectionColor="#7b2cbf" fadeDistance={30} fadeStrength={1} followCamera={false} infiniteGrid />
      <AxesHelper args={[2]} />
    </group>
  );

  return (
    <div className="panel-card" style={{ flex: 1 }}>
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">🎨</span>
          3D Model Viewer
        </span>
        {stlFiles.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--accent-success)' }}>
            {stlFiles.length} FILE{stlFiles.length !== 1 ? 'S' : ''} LOADED
          </span>
        )}
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="viewer-container">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <color attach="background" args={['#0a0a0f']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />

            <GridHelper />

            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={2}
              maxDistance={20}
            />

            {stlFiles.length > 0 && (
              <>
                {stlFiles.map((file, index) => (
                  <mesh key={index} position={[0, 1, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial
                      color="#00d4ff"
                      metalness={0.8}
                      roughness={0.2}
                      emissive="#00d4ff"
                      emissiveIntensity={0.1}
                    />
                  </mesh>
                ))}
              </>
            )}

            {missionStatus?.status !== 'complete' && !loading && !error && (
              <mesh position={[0, 1, 0]}>
                <boxGeometry args={[2, 0.5, 2]} />
                <meshStandardMaterial
                  color="#7b2cbf"
                  metalness={0.8}
                  roughness={0.2}
                  emissive="#7b2cbf"
                  emissiveIntensity={0.1}
                  wireframe
                />
              </mesh>
            )}
          </Canvas>

          {!missionId && (
            <div className="viewer-placeholder">
              <div className="viewer-placeholder-icon">🎨</div>
              <div>Submit a mission to view 3D models</div>
            </div>
          )}

          {loading && (
            <div className="viewer-placeholder">
              <div className="spinner"></div>
              <div style={{ marginTop: '16px' }}>Loading 3D files...</div>
            </div>
          )}

          {error && (
            <div className="viewer-placeholder">
              <div style={{ fontSize: '48px', color: 'var(--accent-error)', marginBottom: '16px' }}>⚠️</div>
              <div>{error}</div>
            </div>
          )}

          {missionStatus?.status === 'complete' && stlFiles.length === 0 && !loading && (
            <div className="viewer-placeholder">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <div>No 3D files generated</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThreeDViewer;
