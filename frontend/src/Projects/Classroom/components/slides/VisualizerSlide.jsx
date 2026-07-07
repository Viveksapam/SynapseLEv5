import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './VisualizerSlide.css';
import { SyntaxHighlighter } from './SyntaxHighlighter';

export function VisualizerSlide({ data }) {
  // Initialize state with default values from data.controls
  const initialState = {};
  if (data.controls) {
    data.controls.forEach(ctrl => {
      initialState[ctrl.property] = ctrl.defaultValue;
    });
  }
  
  const [styles, setStyles] = useState(initialState);

  const handleChange = (property, value) => {
    setStyles(prev => ({ ...prev, [property]: value }));
  };

  // Generate the actual CSS styles object for React
  const boxStyles = { ...data.defaultStyles };
  
  if (data.controls) {
    data.controls.forEach(ctrl => {
      boxStyles[ctrl.property] = `${styles[ctrl.property]}${ctrl.unit || ''}`;
    });
  }

  // Generate CSS string for the code display
  const cssString = Object.entries(boxStyles)
    .map(([key, value]) => `  ${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value};`)
    .join('\n');

  return (
    <div className="visualizer-slide slide-container">
      <h2 className="slide-title cyan-text">{data.title}</h2>
      <p className="slide-paragraph">{data.instruction}</p>
      
      <div className="visualizer-workspace">
        <div className="visualizer-controls">
          <div className="pane-header">GUI CONTROLS</div>
          <div className="controls-container">
            {data.controls && data.controls.map((ctrl, idx) => (
              <div key={idx} className="control-group">
                <div className="control-header">
                  <label>{ctrl.label}</label>
                  <span className="control-value">{styles[ctrl.property]}{ctrl.unit}</span>
                </div>
                {ctrl.type === 'range' || ctrl.type === 'number' ? (
                  <div className="stepper-control">
                    <button 
                      className="stepper-btn" 
                      onClick={() => handleChange(ctrl.property, Math.max(ctrl.min, Number(styles[ctrl.property]) - (ctrl.step || 1)))}
                    >−</button>
                    <input 
                      type="number" 
                      min={ctrl.min} 
                      max={ctrl.max} 
                      step={ctrl.step || 1}
                      value={styles[ctrl.property]} 
                      onChange={(e) => handleChange(ctrl.property, Number(e.target.value))} 
                      className="stepper-input"
                    />
                    <button 
                      className="stepper-btn" 
                      onClick={() => handleChange(ctrl.property, Math.min(ctrl.max, Number(styles[ctrl.property]) + (ctrl.step || 1)))}
                    >+</button>
                  </div>
                ) : ctrl.type === 'color' ? (
                  <input 
                    type="color" 
                    value={styles[ctrl.property]} 
                    onChange={(e) => handleChange(ctrl.property, e.target.value)}
                    className="visualizer-color-picker"
                  />
                ) : ctrl.type === 'segmented' ? (
                  <div className="segmented-control">
                    {ctrl.options.map(opt => (
                      <button
                        key={opt}
                        className={`segmented-btn ${styles[ctrl.property] === opt ? 'active' : ''}`}
                        onClick={() => handleChange(ctrl.property, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : ctrl.type === 'select' ? (
                  <select
                    className="visualizer-select"
                    value={styles[ctrl.property]}
                    onChange={(e) => handleChange(ctrl.property, e.target.value)}
                  >
                    {ctrl.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : null}
              </div>
            ))}
          </div>
          
          <div className="visualizer-code-preview">
            <div className="pane-header" style={{ borderTop: '1px solid #e2e8f0' }}>GENERATED CSS</div>
            <pre className="generated-code">
              <SyntaxHighlighter code={`.box {\n${cssString}\n}`} language="css" />
            </pre>
          </div>
        </div>

        <div className="visualizer-preview">
          <div className="pane-header">LIVE RENDER</div>
          <div className="preview-canvas">
            <div className="preview-box" style={boxStyles}>
              {data.boxText || 'Interactive Box'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

VisualizerSlide.propTypes = {
  data: PropTypes.object.isRequired,
};

