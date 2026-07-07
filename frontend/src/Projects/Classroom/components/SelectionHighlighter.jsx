import React, { useState, useEffect } from 'react';

const COLORS = [
  { id: 'green', hex: '#22c55e' },
  { id: 'yellow', hex: '#eab308' },
  { id: 'red', hex: '#ef4444' }
];

export function SelectionHighlighter() {
  const [toolbarStyle, setToolbarStyle] = useState({ display: 'none', top: 0, left: 0 });
  const [currentRange, setCurrentRange] = useState(null);

  useEffect(() => {
    // Only works if CSS.highlights is supported
    if (!CSS || !CSS.highlights) return;

    // Initialize highlight registries
    COLORS.forEach(color => {
      if (!CSS.highlights.has(`user-highlight-${color.id}`)) {
        CSS.highlights.set(`user-highlight-${color.id}`, new Highlight());
      }
    });

    const handleMouseUp = (e) => {
      // Don't process if clicking the toolbar itself
      if (e.target.closest('.highlighter-toolbar')) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setToolbarStyle({ display: 'none' });
        setCurrentRange(null);
        return;
      }

      // Check if selection is within the content section
      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      const element = commonAncestor.nodeType === Node.ELEMENT_NODE ? commonAncestor : commonAncestor.parentElement;
      if (!element || !element.closest('.layout-content')) {
        setToolbarStyle({ display: 'none' });
        setCurrentRange(null);
        return;
      }

      const rect = range.getBoundingClientRect();

      setToolbarStyle({
        display: 'flex',
        top: rect.top - 48 + window.scrollY, // Position above the text
        left: rect.left + (rect.width / 2) + window.scrollX, // Center horizontally
      });
      setCurrentRange(range.cloneRange());
    };

    const handleMouseDown = (e) => {
      // Don't hide if clicking the toolbar itself
      if (e.target.closest('.highlighter-toolbar')) return;
      setToolbarStyle({ display: 'none' });
      setCurrentRange(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const applyHighlight = (colorId) => {
    if (!currentRange || !CSS.highlights) return;
    
    const highlightObj = CSS.highlights.get(`user-highlight-${colorId}`);
    highlightObj.add(currentRange);
    
    // Clear selection and hide toolbar
    window.getSelection().removeAllRanges();
    setToolbarStyle({ display: 'none' });
    setCurrentRange(null);
  };

  return (
    <div 
      className="highlighter-toolbar"
      style={{
        position: 'absolute',
        ...toolbarStyle,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        padding: '6px 12px',
        borderRadius: '24px',
        zIndex: 9999,
        display: toolbarStyle.display,
        gap: '10px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        transform: 'translateX(-50%)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {COLORS.map(color => (
        <button
          key={color.id}
          onClick={() => applyHighlight(color.id)}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: color.hex,
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          title={`Highlight ${color.id}`}
        />
      ))}
    </div>
  );
}

