import React, { useRef, useState, useEffect } from "react";
import { StitchManager } from "./StitchManager";
import CustomDropdown from "./CustomDropdown";
import { database } from '../firebase';
import { ref, set } from 'firebase/database';
import './PatternEditor.css';

export const PatternEditor = ({ onClose, pattern }) => {
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0, visible: false });
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [toolbarMouseDown, setToolbarMouseDown] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [showStitchModal, setShowStitchModal] = useState(false);
  const [stitches, setStitches] = useState([]);
  const [hoveredStitch, setHoveredStitch] = useState(null);
  const [editorTooltip, setEditorTooltip] = useState({ visible: false, x: 0, y: 0, stitch: null });
  const lastRangeRef = useRef(null);
  const [stitchSearch, setStitchSearch] = useState("");
  const [showStitchManager, setShowStitchManager] = useState(false);
  const [patternTitle, setPatternTitle] = useState("");
  const [projectImages, setProjectImages] = useState([]);
  const [patternCategory, setPatternCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [materials, setMaterials] = useState("");
  const [instructionsFocused, setInstructionsFocused] = useState(false);

  // Draft persistence keys
  const DRAFT_KEY = 'patternEditorDraft';

  // Load stitches from localStorage and Firebase
  useEffect(() => {
    const loadStitches = async () => {
      try {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const user = JSON.parse(localStorage.getItem('mockUser') || '{}');
        
        if (isLoggedIn && user.uid) {
          // Try to load from Firebase first
          const snap = await get(ref(database, `userStitches/${user.uid}`));
          if (snap.exists()) {
            const firebaseStitches = Object.values(snap.val());
            setStitches(firebaseStitches);
            // Update localStorage with Firebase data
            localStorage.setItem("userStitches", JSON.stringify(firebaseStitches));
            return;
          }
        }
        
        // Fallback to localStorage
        const saved = localStorage.getItem("userStitches");
        if (saved) setStitches(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading stitches:', err);
        // Fallback to localStorage
    const saved = localStorage.getItem("userStitches");
    if (saved) setStitches(JSON.parse(saved));
      }
    };

    loadStitches();
  }, []);

  // Show toolbar near caret only if instructions area is focused
  const handleSelection = (e) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      setToolbarPos((pos) => ({ ...pos, visible: false }));
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (
      rect &&
      editorRef.current &&
      editorRef.current.contains(selection.anchorNode) &&
      instructionsFocused
    ) {
      setToolbarPos({
        top: rect.top + window.scrollY - 48, // 48px above caret
        left: rect.left + window.scrollX,
        visible: true,
      });
    } else {
      setToolbarPos((pos) => ({ ...pos, visible: false }));
    }
  };

  // Save selection whenever it changes
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      lastRangeRef.current = selection.getRangeAt(0);
    }
  };

  // Insert image at caret
  const insertImage = (url) => {
    editorRef.current.focus();
    let range;
    const selection = window.getSelection();
    if (lastRangeRef.current) {
      range = lastRangeRef.current;
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (selection.rangeCount) {
      range = selection.getRangeAt(0);
    } else {
      return;
    }
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Pattern step";
    img.className = "inline-block max-w-xs my-2 rounded shadow";
    range.collapse(false);
    range.insertNode(img);
    // Move caret after image
    range.setStartAfter(img);
    range.setEndAfter(img);
    selection.removeAllRanges();
    selection.addRange(range);
    setShowImageInput(false);
    setImageUrl("");
    setSelectedFileName("");
    editorRef.current.focus();
    saveSelection();
  };

  // Insert stitch name at caret as a styled span
  const insertStitch = (stitchName, stitchId) => {
    editorRef.current.focus();
    let range;
    const selection = window.getSelection();
    if (lastRangeRef.current) {
      range = lastRangeRef.current;
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (selection.rangeCount) {
      range = selection.getRangeAt(0);
    } else {
      return;
    }
    const span = document.createElement("span");
    span.textContent = stitchName;
    span.className = "stitch-ref px-1 py-0.5 rounded bg-pink-100 text-primary font-semibold cursor-pointer border border-primary/40 hover:bg-pink-200 transition-colors";
    span.setAttribute("data-stitch-id", stitchId);
    span.contentEditable = "false";
    range.insertNode(span);
    // Insert a space after the span for natural typing
    const space = document.createTextNode(" ");
    range.setStartAfter(span);
    range.setEndAfter(span);
    range.insertNode(space);
    range.setStartAfter(space);
    range.setEndAfter(space);
    selection.removeAllRanges();
    selection.addRange(range);
    setShowStitchModal(false);
    saveSelection();
  };

  // Tooltip logic for stitch refs
  const handleEditorMouseOver = (e) => {
    const target = e.target;
    if (target.classList.contains("stitch-ref")) {
      const id = target.getAttribute("data-stitch-id");
      const stitch = stitches.find((s) => String(s.id) === id);
      if (stitch) {
        const rect = target.getBoundingClientRect();
        setEditorTooltip({
          visible: true,
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY + 4,
          stitch,
        });
      }
    }
  };
  const handleEditorMouseOut = (e) => {
    if (e.target.classList.contains("stitch-ref")) {
      setEditorTooltip({ visible: false, x: 0, y: 0, stitch: null });
    }
  };

  // Add at the top, after imports
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); // Only the base64 part
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadToImgBB(file) {
    const apiKey = '9052b9743737d564067bbd84e98e61fd'; // ImgBB API key
    const base64 = await fileToBase64(file);
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64);
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('ImgBB upload failed');
    }
  }

  // Replace handleProjectImagesChange
  const handleProjectImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (projectImages.length + files.length > 9) {
      alert('You can upload a maximum of 9 images for each crochet pattern.');
      return;
    }
    try {
      const imgbbLinks = await Promise.all(files.map(file => uploadToImgBB(file)));
      setProjectImages(prev => [...prev, ...imgbbLinks].slice(0, 9));
    } catch (err) {
      alert('Failed to upload image(s) to ImgBB.');
    }
  };

  // Replace handleFileChange
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      try {
        const imgbbUrl = await uploadToImgBB(file);
        insertImage(imgbbUrl);
      } catch (err) {
        alert('Failed to upload image to ImgBB.');
      }
    }
  };

  // Hide toolbar only if blur is not caused by clicking the toolbar
  const handleBlur = (e) => {
    setTimeout(() => {
      if (!toolbarMouseDown) {
        setToolbarPos((pos) => ({ ...pos, visible: false }));
        setInstructionsFocused(false);
      }
      setToolbarMouseDown(false);
    }, 0);
  };

  // Handle clicks outside the instructions area to hide toolbar
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (editorRef.current && !editorRef.current.contains(e.target) && 
          toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setToolbarPos((pos) => ({ ...pos, visible: false }));
        setInstructionsFocused(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Filtered stitches for modal
  const filteredStitches = stitches.filter(stitch =>
    stitch.name.toLowerCase().includes(stitchSearch.toLowerCase()) ||
    (stitch.description && stitch.description.toLowerCase().includes(stitchSearch.toLowerCase()))
  );

  // Handle editor key events (allow default behavior)
  const handleEditorKeyDown = (e) => {
    // Allow default Enter behavior for new lines
  };

  // On mount, restore draft if present
  useEffect(() => {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    if (editorRef.current && draft && draft.html) {
      editorRef.current.innerHTML = draft.html;
      // Place caret at end
      const range = document.createRange();
      const sel = window.getSelection();
      if (editorRef.current.lastChild) {
        range.selectNodeContents(editorRef.current.lastChild);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, []);

  // When editing a pattern, load its instructions HTML (including images)
  useEffect(() => {
    if (pattern && pattern.instructions && editorRef.current) {
      editorRef.current.innerHTML = pattern.instructions;
    }
  }, [pattern]);

  // Save draft on input
  const handleEditorInput = (e) => {
    // Save draft
    if (editorRef.current) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ html: editorRef.current.innerHTML }));
    }
  };

  // Handle paste: strip formatting and insert as plain text
  const handleEditorPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    // Insert as plain text at caret
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
        range.setStart(range.endContainer, range.endOffset);
        range.setEnd(range.endContainer, range.endOffset);
    selection.removeAllRanges();
    selection.addRange(range);
    saveSelection();
    handleSelection();
  };

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  // For navigation
  const handleGoHome = () => {
    window.location.href = '/';
  };

  // Save pattern logic
  const handleSavePattern = async () => {
    if (!patternTitle.trim()) {
      alert('Please enter a pattern title.');
      return;
    }
    if (!patternCategory) {
      alert('Please select a category.');
      return;
    }
    // Save to localStorage
    const user = JSON.parse(localStorage.getItem('mockUser') || '{}');
    const patternObj = {
      ...pattern, // preserve id and any other fields if editing
      title: patternTitle.trim(),
      category: patternCategory,
      images: projectImages,
      public: isPublic,
      materials,
      instructions: editorRef.current ? editorRef.current.innerHTML : "",
      stitches,
      creatorUid: user?.uid,
      creatorUsername: user?.username,
    };
    const existing = JSON.parse(localStorage.getItem('userPatterns') || '[]');
    let updatedPatterns;
    if (pattern && pattern.id) {
      // Editing: replace existing pattern
      updatedPatterns = existing.map(p => p.id === pattern.id ? patternObj : p);
    } else {
      // Creating new: add to start
      patternObj.id = Date.now();
      updatedPatterns = [patternObj, ...existing];
    }
    localStorage.setItem('userPatterns', JSON.stringify(updatedPatterns));
    // Save to Firebase
    try {
      const user = JSON.parse(localStorage.getItem('mockUser'));
      if (user && user.uid) {
        await set(ref(database, `userPatterns/${user.uid}/${patternObj.id}`), patternObj);
      }
    } catch (err) {
      alert('Error saving pattern to cloud: ' + err.message);
    }
    alert('Pattern saved!');
    onClose();
  };

  const handleReturn = () => {
    localStorage.removeItem(DRAFT_KEY);
    handleGoHome();
  };

  // Refresh stitches when StitchManager modal is closed
  const handleStitchManagerClose = async () => {
    setShowStitchManager(false);
    // Reload stitches to get any newly added ones
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const user = JSON.parse(localStorage.getItem('mockUser') || '{}');
      
      if (isLoggedIn && user.uid) {
        const snap = await get(ref(database, `userStitches/${user.uid}`));
        if (snap.exists()) {
          const firebaseStitches = Object.values(snap.val());
          setStitches(firebaseStitches);
          localStorage.setItem("userStitches", JSON.stringify(firebaseStitches));
        }
      } else {
        const saved = localStorage.getItem("userStitches");
        if (saved) setStitches(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error refreshing stitches:', err);
      const saved = localStorage.getItem("userStitches");
      if (saved) setStitches(JSON.parse(saved));
    }
  };

  // Remove a project image
  const removeProjectImage = (idx) => {
    setProjectImages(images => images.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (pattern) {
      setPatternTitle(pattern.title || "");
      setPatternCategory(pattern.category || "");
      setProjectImages(pattern.images || []);
      setIsPublic(!!pattern.public);
      setMaterials(pattern.materials || "");
      // TODO: If you have pattern steps/content, prefill that too
    }
  }, [pattern]);

  // Initialize materials with '1. ' if empty on mount
  useEffect(() => {
    if (!pattern && materials.trim() === "") {
      setMaterials("1. ");
    }
  }, []);

  // Auto-resize materials textarea
  const materialsRef = useRef(null);
  useEffect(() => {
    if (materialsRef.current) {
      materialsRef.current.style.height = 'auto';
      materialsRef.current.style.height = materialsRef.current.scrollHeight + 'px';
    }
  }, [materials]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded shadow-lg p-6 relative my-15">
      {/* Home icon (top left) */}
      {isLoggedIn && (
        <button
          className="absolute top-4 left-4 text-primary hover:text-pink-600 text-2xl font-bold flex items-center gap-1"
          onClick={handleReturn}
          title="Return to Home"
          style={{ zIndex: 10 }}
        >
          <span role="img" aria-label="Home">🏠</span>
          <h6 className="text-base font-semibold">Return to Home</h6>
        </button>
      )}
      <div className="mt-12 mb-6 text-center">
        <h1 className="text-3xl font-bold text-primary">{pattern ? 'Edit Crochet Pattern' : 'New Crochet Pattern'}</h1>
        <p className="text-primary/80 text-lg">Write your pattern instructions and add images or diagrams as you go.</p>
      </div>
      {/* Pattern title input */}
      <div className="mb-4">
        <label className="block text-primary font-semibold mb-1" htmlFor="pattern-title">Pattern Title</label>
        <input
          id="pattern-title"
          type="text"
          className="w-full border border-primary rounded px-3 py-2 text-lg"
          placeholder="e.g. Cozy Granny Square Blanket"
          value={patternTitle}
          onChange={e => setPatternTitle(e.target.value)}
          required
        />
      </div>
      {/* Pattern category dropdown */}
      <div className="mb-4">
        <label className="block text-primary font-semibold mb-1" htmlFor="pattern-category">Category</label>
        <CustomDropdown
          options={[
            { value: "Wearables", label: "Wearables" },
            { value: "Functional Items", label: "Functional Items" },
            { value: "Toys & Gifts", label: "Toys & Gifts" },
          ]}
          value={patternCategory}
          onChange={setPatternCategory}
          placeholder="Select a category..."
          required
        />
      </div>
      {/* Project images input */}
      <div className="mb-6">
        <label className="block text-primary font-semibold mb-1">Crochet Project Images (How the Crochet Project will Look Like) <span className='text-xs text-primary/60'>(max 9)</span></label>
        <label
          className={`btn-light inline-block mt-1 ${projectImages.length >= 9 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={projectImages.length >= 9 ? { pointerEvents: 'none' } : {}}
        >
          {projectImages.length > 0 ? `${projectImages.length} image${projectImages.length > 1 ? 's' : ''} selected` : 'Add Images'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleProjectImagesChange}
            className="hidden"
            disabled={projectImages.length >= 9}
          />
        </label>
        {projectImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {projectImages.map((img, idx) => (
              <div key={idx} className="relative inline-block">
                <img src={img} alt={`Project ${idx + 1}`} className="h-20 w-20 object-cover rounded shadow border border-primary" />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-white text-primary border border-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-100"
                  onClick={() => removeProjectImage(idx)}
                  title="Remove image"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Materials Section */}
      <div className="mb-4">
        <label className="block text-primary font-semibold mb-1" htmlFor="pattern-materials">Materials</label>
        <textarea
          id="pattern-materials"
          ref={materialsRef}
          className="w-full border border-primary rounded px-3 py-2 text-lg bg-pink-50 min-h-[80px]"
          placeholder="e.g. 1. 4mm crochet hook\n2. Worsted weight yarn\n3. Tapestry needle"
          value={materials}
          onChange={e => setMaterials(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const lines = materials.split('\n');
              const lastLine = lines[lines.length - 1];
              let nextNumber = 1;
              const match = lastLine.match(/^(\d+)\./);
              if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
              } else if (lines.length > 1) {
                // Try previous line if last is empty
                const prevLine = lines[lines.length - 2];
                const prevMatch = prevLine.match(/^(\d+)\./);
                if (prevMatch) nextNumber = parseInt(prevMatch[1], 10) + 1;
              }
              setMaterials(materials + '\n' + nextNumber + '. ');
            }
          }}
        />
      </div>
      {/* Instructions Section */}
      <div className="mb-4">
        <label className="block text-primary font-semibold mb-1" htmlFor="pattern-instructions">Instructions</label>
      <div
          id="pattern-instructions"
        ref={editorRef}
        className="w-full min-h-[200px] border border-primary rounded p-4 focus:outline-none text-lg bg-pink-50"
        contentEditable
        spellCheck={true}
        onPaste={handleEditorPaste}
        onKeyDown={handleEditorKeyDown}
        onInput={handleEditorInput}
        onKeyUp={(e) => { handleSelection(e); saveSelection(); }}
        onMouseUp={(e) => { handleSelection(e); saveSelection(); }}
        onSelect={saveSelection}
          onBlur={() => {
            setTimeout(() => {
              if (!toolbarMouseDown) {
                setInstructionsFocused(false);
                setToolbarPos((pos) => ({ ...pos, visible: false }));
              }
              setToolbarMouseDown(false);
            }, 0);
          }}
          onFocus={() => { setInstructionsFocused(true); handleSelection(); }}
        suppressContentEditableWarning
        placeholder="Start typing your crochet pattern..."
        style={{ outline: "none" }}
        onMouseOver={handleEditorMouseOver}
        onMouseOut={handleEditorMouseOut}
      ></div>
      {toolbarPos.visible && (
        <div
          ref={toolbarRef}
          className="absolute z-50 bg-white border border-primary rounded shadow flex items-center gap-2 px-3 py-2"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          onMouseDown={() => setToolbarMouseDown(true)}
        >
          <span className="text-primary font-bold">➕</span>
          <button
            className="text-primary hover:text-pink-600 font-semibold"
            title="Bold"
            onMouseDown={e => { e.preventDefault(); document.execCommand('bold'); }}
            type="button"
          >
            <b>B</b>
          </button>
          <button
            className="text-primary hover:text-pink-600 font-semibold italic"
            title="Italic"
            onMouseDown={e => { e.preventDefault(); document.execCommand('italic'); }}
            type="button"
          >
            <i>I</i>
          </button>
          <button
            className="text-primary hover:text-pink-600 font-semibold underline"
            title="Underline"
            onMouseDown={e => { e.preventDefault(); document.execCommand('underline'); }}
            type="button"
          >
            <u>U</u>
          </button>
          <button
            className="text-primary hover:text-pink-600 font-semibold"
            title="Numbered List"
            onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList'); }}
            type="button"
          >
            1.
          </button>
          <button
            className="text-primary hover:text-pink-600 font-semibold"
            title="Bulleted List"
            onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList'); }}
            type="button"
          >
            •
          </button>
          <button
            className="text-primary hover:text-pink-600 font-semibold"
            title="Insert image"
              onClick={() => setShowImageInput(true)}
          >
            🖼️
          </button>
          <button
            className="text-primary hover:text-pink-600 font-semibold"
              title="Insert stitch"
              onClick={() => setShowStitchModal(true)}
          >
            🧶
          </button>
        </div>
      )}
      </div>
      {/* Make Public checkbox */}
      <div className="mb-4 flex items-center gap-3">
        <input
          id="make-public"
          type="checkbox"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          className="w-5 h-5 accent-primary"
        />
        <label htmlFor="make-public" className="text-primary font-medium select-none cursor-pointer">
          Make Public (optional)
        </label>
      </div>
      <button
        className="absolute top-4 right-4 text-primary hover:text-red-500 text-2xl font-bold"
        onClick={() => {
          localStorage.removeItem(DRAFT_KEY);
          onClose();
        }}
        title="Close editor"
      >
        ×
      </button>
      {showImageInput && (
        <div
          className="absolute z-50 bg-white border border-primary rounded shadow p-4 flex flex-col gap-2 min-w-[300px]"
          style={{ top: (toolbarPos.top || 0) + 40, left: toolbarPos.left || 0 }}
        >
          <label className="block text-primary font-semibold mb-1">Insert image by URL:</label>
          <input
            type="text"
            className="border border-primary rounded px-2 py-1 mb-2"
            placeholder="Paste image URL..."
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
          />
          <button
            className="pattern-insert-btn mb-2"
            onClick={() => {
              if (imageUrl) insertImage(imageUrl);
            }}
            disabled={!imageUrl}
          >
            Insert
          </button>
          <span className="text-center text-primary/70 mb-2">or</span>
          <label className="btn-light cursor-pointer mb-2 text-center">
            Choose Image...
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          <button className="btn-light" onClick={() => setShowImageInput(false)}>Cancel</button>
        </div>
      )}
      {showStitchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setShowStitchModal(false)}
        >
          <div
            className="bg-white border border-primary rounded shadow-lg p-4 w-full max-w-xs mx-auto relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-primary hover:text-red-500 text-xl font-bold"
              onClick={() => setShowStitchModal(false)}
              type="button"
            >
              ×
            </button>
            <input
              type="text"
              className="w-full border border-primary rounded px-2 py-1 mb-3 text-primary"
              placeholder="Search stitches..."
              value={stitchSearch}
              onChange={e => setStitchSearch(e.target.value)}
              autoFocus
            />
            {filteredStitches.length === 0 ? (
              <div className="p-3 text-primary text-center">No stitches found.</div>
            ) : (
              <ul>
                {filteredStitches.map((stitch) => (
                  <li
                    key={stitch.id}
                    className="px-4 py-2 hover:bg-pink-50 cursor-pointer relative rounded"
                    onClick={() => insertStitch(stitch.name, stitch.id)}
                    onMouseEnter={() => setHoveredStitch(stitch)}
                    onMouseLeave={() => setHoveredStitch(null)}
                  >
                    {stitch.name}
                    {hoveredStitch && hoveredStitch.id === stitch.id && (
                      <div className="absolute left-full top-0 bg-white border border-primary rounded shadow-lg p-3 w-64 z-50 text-left ml-2">
                        <div className="font-bold text-primary mb-1">{hoveredStitch.name}</div>
                        <div className="text-primary/80 mb-2">{hoveredStitch.description}</div>
                        {hoveredStitch.image && (
                          <img src={hoveredStitch.image} alt="diagram" className="max-h-20 rounded shadow" />
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {editorTooltip.visible && editorTooltip.stitch && (
        <div
          className="fixed z-50 bg-white border border-primary rounded shadow-lg p-3 w-64 text-left"
          style={{ left: editorTooltip.x, top: editorTooltip.y }}
        >
          <div className="font-bold text-primary mb-1">{editorTooltip.stitch.name}</div>
          <div className="text-primary/80 mb-2">{editorTooltip.stitch.description}</div>
          {editorTooltip.stitch.image && (
            <img src={editorTooltip.stitch.image} alt="diagram" className="max-h-20 rounded shadow" />
          )}
        </div>
      )}
      {/* Save button below the form */}
      <div className="flex justify-between items-center mt-8 gap-4">
        <button
          className="bg-pink-50 text-primary border border-primary px-4 py-2 rounded font-semibold shadow hover:bg-primary hover:text-white transition-colors"
          onClick={() => setShowStitchManager(true)}
          style={{ zIndex: 10 }}
        >
          🧶 Define Crochet Stitch
        </button>
        <button
          className="bg-primary text-white px-6 py-2 rounded font-semibold shadow hover:bg-pink-700 transition-colors"
          onClick={handleSavePattern}
        >
          Save Pattern
        </button>
      </div>
      {showStitchManager && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20"
          onClick={handleStitchManagerClose}
        >
          <div
            className="bg-white border border-primary rounded shadow-lg p-4 w-full max-w-md mx-auto relative z-[101] max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <StitchManager onClose={handleStitchManagerClose} hideReturnHome={true} />
          </div>
        </div>
      )}
    </div>
  );
}; 