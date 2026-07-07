import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SandboxGui from './SandboxGui';
import SandboxPreview from './SandboxPreview';
import {
  CSS_KEY_MAP, EMPTY_GUI_STATE,
  parseSelectorBlock, guiStateFromProps, writeRuleToCss, cssValueFromGui,
} from '../../utils/sandboxCss';
import './InteractiveSandbox.css';

const INITIAL_GUI_STATE = {
  ...EMPTY_GUI_STATE,
  strDisplay: 'flex', strJustifyContent: 'center', strAlignItems: 'center',
  numGap: 20, numPadding: 40, numBorderRadius: 24, numBorderWidth: 1,
  strBorderStyle: 'solid', strGridTemplateColumns: 'repeat(2, 1fr)',
};

export const InteractiveSandbox = ({ htmlContent, initialCss }) => {
  const [strCssCodeState, setStrCssCodeState] = useState(initialCss || '');
  const [strTargetSelState] = useState('.sandbox-container');
  const [strViewportState, setStrViewportState] = useState('desktop');
  const [objGuiStateState, setObjGuiStateState] = useState(INITIAL_GUI_STATE);

  useEffect(() => {
    const objProps = parseSelectorBlock(strCssCodeState, strTargetSelState);
    setObjGuiStateState(objProps ? guiStateFromProps(objProps) : EMPTY_GUI_STATE);
  }, [strTargetSelState, strCssCodeState]);

  const handleGuiChange = (strKey, val) => {
    setObjGuiStateState((prev) => ({ ...prev, [strKey]: val }));
    const strCssKey = CSS_KEY_MAP[strKey];
    const strCssValue = cssValueFromGui(strKey, val);
    setStrCssCodeState((prev) => writeRuleToCss(prev, strTargetSelState, strCssKey, strCssValue));
  };

  return (
    <div className="sandbox-panel">
      <div className="sandbox-control-station">
        <div className="sandbox-controls-wrapper">
          <SandboxGui objGuiState={objGuiStateState} onChange={handleGuiChange} />
        </div>
      </div>
      <SandboxPreview
        strHtmlContent={htmlContent}
        strCssCode={strCssCodeState}
        strViewport={strViewportState}
        onViewportChange={setStrViewportState}
      />
    </div>
  );
};

InteractiveSandbox.propTypes = {
  htmlContent: PropTypes.string,
  initialCss: PropTypes.string,
};
