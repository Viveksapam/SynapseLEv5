import React from 'react';
import PropTypes from 'prop-types';
import { NumberStepper, ColorSelector } from './SandboxControls';

const SandboxGui = ({ objGuiState, onChange }) => (
  <div className="sandbox-gui-controls">
    <div className="gui-section-title">Layout & Display</div>
    <div className="gui-row">
      <label>Display</label>
      <select value={objGuiState.strDisplay} onChange={(e) => onChange('strDisplay', e.target.value)} className="gui-select">
        <option value="block">block</option>
        <option value="flex">flex</option>
        <option value="grid">grid</option>
        <option value="inline-block">inline-block</option>
        <option value="none">none</option>
      </select>
    </div>

    {(objGuiState.strDisplay === 'flex' || objGuiState.strDisplay === 'grid') && (
      <>
        {objGuiState.strDisplay === 'flex' && (
          <div className="gui-row">
            <label>Flex Direction</label>
            <select value={objGuiState.strFlexDirection} onChange={(e) => onChange('strFlexDirection', e.target.value)} className="gui-select">
              <option value="row">row</option>
              <option value="column">column</option>
              <option value="row-reverse">row-reverse</option>
              <option value="column-reverse">column-reverse</option>
            </select>
          </div>
        )}
        {objGuiState.strDisplay === 'grid' && (
          <div className="gui-row">
            <label>Grid Columns</label>
            <select value={objGuiState.strGridTemplateColumns} onChange={(e) => onChange('strGridTemplateColumns', e.target.value)} className="gui-select">
              <option value="none">none</option>
              <option value="1fr">1 column (1fr)</option>
              <option value="1fr 1fr">2 columns (1fr 1fr)</option>
              <option value="1fr 1fr 1fr">3 columns (1fr 1fr 1fr)</option>
              <option value="repeat(2, 1fr)">repeat(2, 1fr)</option>
              <option value="repeat(auto-fit, minmax(100px, 1fr))">auto-fit (100px min)</option>
            </select>
          </div>
        )}

        <div className="gui-row">
          <label>Justify Content</label>
          <select value={objGuiState.strJustifyContent} onChange={(e) => onChange('strJustifyContent', e.target.value)} className="gui-select">
            <option value="flex-start">flex-start</option>
            <option value="center">center</option>
            <option value="flex-end">flex-end</option>
            <option value="space-between">space-between</option>
            <option value="space-around">space-around</option>
            <option value="space-evenly">space-evenly</option>
          </select>
        </div>

        <div className="gui-row">
          <label>Align Items</label>
          <select value={objGuiState.strAlignItems} onChange={(e) => onChange('strAlignItems', e.target.value)} className="gui-select">
            <option value="stretch">stretch</option>
            <option value="center">center</option>
            <option value="flex-start">flex-start</option>
            <option value="flex-end">flex-end</option>
            <option value="baseline">baseline</option>
          </select>
        </div>

        <div className="gui-row">
          <NumberStepper numValue={objGuiState.numGap} onChange={(v) => onChange('numGap', v)} numMin={0} numMax={100} numStep={2} strLabel="Gap (px)" />
        </div>
      </>
    )}

    <div className="gui-section-title">Spacing & Styling</div>
    <div className="gui-row">
      <NumberStepper numValue={objGuiState.numPadding} onChange={(v) => onChange('numPadding', v)} numMin={0} numMax={100} numStep={4} strLabel="Padding (px)" />
    </div>
    <div className="gui-row">
      <NumberStepper numValue={objGuiState.numBorderRadius} onChange={(v) => onChange('numBorderRadius', v)} numMin={0} numMax={100} numStep={2} strLabel="Radius (px)" />
    </div>
    <div className="gui-row">
      <ColorSelector strValue={objGuiState.strBackground} onChange={(v) => onChange('strBackground', v)} strLabel="Background Color" />
    </div>
    <div className="gui-row">
      <ColorSelector strValue={objGuiState.strColor} onChange={(v) => onChange('strColor', v)} strLabel="Text Color" />
    </div>
  </div>
);

SandboxGui.propTypes = {
  objGuiState: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SandboxGui;
