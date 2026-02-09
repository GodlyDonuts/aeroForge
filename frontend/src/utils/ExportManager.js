import JSZip from 'jszip';

/**
 * Handles exporting mission data and generated 3D models as a ZIP package.
 */
export const ExportManager = {
    /**
     * Bundles mission telemetry and a generated STL file into a ZIP.
     * @param {Object} missionData - The full mission data object (telemetry, status, etc.)
     * @param {string} filename - Base filename for the ZIP (e.g., 'mission-123')
     */
    async downloadBundle(missionData, filename = 'mission-export') {
        const zip = new JSZip();

        // 1. Add Mission Data JSON
        const jsonContent = JSON.stringify(missionData, null, 2);
        zip.file('mission_telemetry.json', jsonContent);

        // 2. Generate Simulated STL File
        // In a real app, this would be the actual mesh data.
        // Here we generate a simple placeholder STL to demonstrate the file structure.
        const stlContent = this.generatePlaceholderSTL();
        zip.file('drone_model.stl', stlContent);

        // 3. Add Readme
        zip.file('README.txt', `aeroForge Mission Export\n\nMission ID: ${missionData.missionId || 'Unknown'}\nTimestamp: ${new Date().toISOString()}\n\nContains:\n- mission_telemetry.json: Full flight logs and metrics\n- drone_model.stl: 3D model of the final drone configuration`);

        // 4. Generate and Download ZIP
        const blob = await zip.generateAsync({ type: 'blob' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.zip`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Generates a minimal valid ASCII STL string for demonstration.
     */
    generatePlaceholderSTL() {
        return `solid drone_model
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 1 0
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 1 0
      vertex 0 1 0
    endloop
  endfacet
endsolid drone_model`;
    }
};
