import React from 'react';
import PropTypes from 'prop-types';

export const NumberStepper = ({ numValue, onChange, numMin = 0, numMax = 200, numStep = 1, strLabel }) => {
  const handleDecrement = () => onChange(Math.max(numMin, numValue - numStep));
  const handleIncrement = () => onChange(Math.min(numMax, numValue + numStep));

  return (
    <div className="stepper-container">
      {strLabel && <label className="stepper-label">{strLabel}</label>}
      <div className="stepper-controls-wrapper">
        <button onClick={handleDecrement} type="button" className="stepper-btn" aria-label="Decrease">-</button>
        <input
          type="number"
          value={numValue}
          onChange={(e) => onChange(Math.max(numMin, Math.min(numMax, parseInt(e.target.value, 10) || 0)))}
          className="stepper-input"
        />
        <button onClick={handleIncrement} type="button" className="stepper-btn" aria-label="Increase">+</button>
      </div>
    </div>
  );
};

NumberStepper.propTypes = {
  numValue: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  numMin: PropTypes.number,
  numMax: PropTypes.number,
  numStep: PropTypes.number,
  strLabel: PropTypes.string,
};

export const ColorSelector = ({ strValue, onChange, strLabel }) => (
  <div className="color-selector-container">
    <label className="color-selector-label">{strLabel}</label>
    <div className="color-selector-controls">
      <input type="color" value={strValue} onChange={(e) => onChange(e.target.value)} className="color-picker-input" />
      <input
        type="text"
        value={strValue}
        onChange={(e) => {
          const strVal = e.target.value;
          if (strVal.startsWith('#') && (strVal.length === 4 || strVal.length === 7)) onChange(strVal);
        }}
        className="color-hex-input"
        placeholder="#ffffff"
      />
    </div>
  </div>
);

ColorSelector.propTypes = {
  strValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  strLabel: PropTypes.string.isRequired,
};
