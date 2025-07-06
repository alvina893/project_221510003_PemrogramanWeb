import React, { useState } from "react";
import parse, { domToReact } from 'html-react-parser';

// Helper to extract all <img> tags from HTML string
function extractImagesFromHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const imgs = Array.from(div.querySelectorAll('img')).map(img => img.src);
  return imgs;
}

// Helper to render instructions as React elements with tooltips for stitches
function renderInstructionsWithTooltipReact(html, onStitchHover, onStitchLeave, pattern) {
  return parse(html, {
    replace: domNode => {
      if (domNode.name === 'span' && domNode.attribs && domNode.attribs.class && domNode.attribs.class.includes('stitch-ref')) {
        const stitchId = domNode.attribs['data-stitch-id'];
        const stitchName = domToReact(domNode.children);
        return (
          <span
            className="bg-yellow-100 border-yellow-400 text-yellow-800 font-bold px-1 rounded shadow inline-block stitch-ref"
            data-stitch-id={stitchId}
            onMouseEnter={e => onStitchHover(e, stitchId, stitchName)}
            onMouseLeave={onStitchLeave}
          >
            {stitchName}
          </span>
        );
      }
    }
  });
}

// Helper to render materials as a numbered list
function renderMaterials(materials) {
  if (!materials) return null;
  const lines = materials.split('\n').map(line => line.trim()).filter(line => line && line !== '.' && line !== '1.' && line !== '2.' && line !== '3.');
  if (lines.length === 0) return null;
  return (
    <ol className="list-decimal ml-6 text-primary/80 mb-4">
      {lines.map((line, idx) => (
        <li key={idx}>{line.replace(/^\d+\.\s*/, "")}</li>
      ))}
    </ol>
  );
}

export const PatternDetailModal = ({ pattern, onClose }) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, name: '', description: '' });
  if (!pattern) return null;
  // Project images
  const projectImages = pattern.images || [];
  // Images in instructions
  const instructionImages = pattern.instructions ? extractImagesFromHTML(pattern.instructions) : [];
  // Remove duplicates
  const allImages = Array.from(new Set([...projectImages, ...instructionImages]));

  // Handler to close modal when clicking the overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handler for stitch hover
  const handleStitchHover = (e, stitchId, stitchName) => {
    let description = '';
    if (pattern.stitches && Array.isArray(pattern.stitches)) {
      const found = pattern.stitches.find(s => String(s.id) === String(stitchId));
      if (found) description = found.description;
    }
    setTooltip({
      visible: true,
      x: e.clientX + 10,
      y: e.clientY + 10,
      name: stitchName,
      description: description || '',
    });
  };
  const handleStitchLeave = () => setTooltip({ ...tooltip, visible: false });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleOverlayClick}>
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
        <button className="absolute top-4 right-4 text-2xl text-secondary hover:text-primary" onClick={onClose}>&times;</button>
        <h2 className="text-3xl font-bold text-primary mb-2">{pattern.title}</h2>
        <div className="mb-2 text-base text-primary font-semibold">Category: {pattern.category}</div>
        {pattern.materials && (
          <div className="mb-4 text-base">
            <span className="font-semibold text-primary">Materials:</span>
            {renderMaterials(pattern.materials)}
          </div>
        )}
        {allImages.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4">
            {allImages.map((img, idx) => (
              <img key={idx} src={img} alt="Pattern" className="w-32 h-32 object-cover rounded shadow" />
            ))}
          </div>
        )}
        <div className="mb-2 text-lg font-semibold text-primary">Instructions:</div>
        <div className="pattern-instructions-view prose max-w-none">
          {pattern.instructions ? renderInstructionsWithTooltipReact(pattern.instructions, handleStitchHover, handleStitchLeave, pattern) : <span className="text-secondary">No instructions provided.</span>}
        </div>
        {tooltip.visible && (
          <div
            className="fixed z-50 bg-white border border-primary rounded shadow-lg p-3 w-64 text-left"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="font-bold text-primary mb-1">{tooltip.name}</div>
            <div className="text-primary/80 mb-2">{tooltip.description || 'No description available.'}</div>
          </div>
        )}
      </div>
    </div>
  );
}; 