import React, { useState, useEffect, useRef } from "react";
import { database } from '../firebase';
import { ref, set, get, push } from 'firebase/database';

export const StitchManager = ({ onClose, hideReturnHome }) => {
  const [stitches, setStitches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingStitchId, setEditingStitchId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const stitchesPerPage = 2;
  const [stitchSearch, setStitchSearch] = useState("");
  
  // Load draft from localStorage if present
  const DRAFT_DATA_KEY = 'stitchManagerDraftData';
  let draftInit = { name: '', description: '', image: '', selectedFileName: '' };
  try {
    const draft = localStorage.getItem(DRAFT_DATA_KEY);
    if (draft) {
      draftInit = { ...draftInit, ...JSON.parse(draft) };
    }
  } catch {}

  const [name, setName] = useState(draftInit.name);
  const [description, setDescription] = useState(draftInit.description);
  const [image, setImage] = useState(draftInit.image);
  const [selectedFileName, setSelectedFileName] = useState(draftInit.selectedFileName);
  const fileInputRef = useRef();
  const descriptionRef = useRef();

  // Draft persistence keys
  const DRAFT_FLAG_KEY = 'stitchManagerDraftOpen';

  // Persist draft data and flag
  useEffect(() => {
    if (name.trim() || description.trim() || image) {
      localStorage.setItem(DRAFT_FLAG_KEY, 'true');
      localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify({ name, description, image, selectedFileName }));
    } else {
      localStorage.removeItem(DRAFT_FLAG_KEY);
      localStorage.removeItem(DRAFT_DATA_KEY);
    }
  }, [name, description, image, selectedFileName]);

  // Load stitches from Firebase and localStorage
  useEffect(() => {
    const loadStitches = async () => {
      setIsLoading(true);
      setError("");
      
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
        if (saved) {
          setStitches(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error loading stitches:', err);
        setError('Failed to load stitches. Using local data.');
        
        // Fallback to localStorage
        const saved = localStorage.getItem("userStitches");
        if (saved) {
          setStitches(JSON.parse(saved));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadStitches();
  }, []);

  // Save stitches to localStorage (as backup)
  useEffect(() => {
    localStorage.setItem("userStitches", JSON.stringify(stitches));
  }, [stitches]);

  // Auto-resize description textarea
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px';
    }
  }, [description]);

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

  const handleAddStitch = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const newStitch = {
        name: name.trim(),
        description: description.trim(),
        image,
        id: editingStitchId || Date.now(),
        createdAt: editingStitchId ? stitches.find(s => s.id === editingStitchId)?.createdAt || new Date().toISOString() : new Date().toISOString()
      };
      // Check if user is logged in
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const user = JSON.parse(localStorage.getItem('mockUser') || '{}');
      if (isLoggedIn && user.uid) {
        // Save to Firebase
        await set(ref(database, `userStitches/${user.uid}/${newStitch.id}`), newStitch);
      }
      // Update local state: replace if editing, else add
      setStitches(prev => {
        const filtered = prev.filter(s => s.id !== newStitch.id);
        return [...filtered, newStitch];
      });
      // Clear form
      setName("");
      setDescription("");
      setImage("");
      setSelectedFileName("");
      setEditingStitchId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error('Error saving stitch:', err);
      setError('Failed to save stitch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      try {
        const imgbbUrl = await uploadToImgBB(file);
        setImage(imgbbUrl);
      } catch (err) {
        alert('Failed to upload image to ImgBB.');
      }
    }
  };

  // For navigation
  const handleGoHome = () => {
    window.location.href = '/';
  };

  // On close, always clear draft flag and data
  const handleClose = () => {
    localStorage.removeItem(DRAFT_FLAG_KEY);
    localStorage.removeItem(DRAFT_DATA_KEY);
    if (typeof onClose === 'function') onClose();
  };

  // Add edit/delete handlers
  const handleEditStitch = (stitch) => {
    setName(stitch.name);
    setDescription(stitch.description);
    setImage(stitch.image || "");
    setSelectedFileName("");
    setEditingStitchId(stitch.id);
  };

  const handleDeleteStitch = async (stitch) => {
    if (!window.confirm(`Delete stitch '${stitch.name}'?`)) return;
    setStitches(prev => prev.filter(s => s.id !== stitch.id));
    // Remove from Firebase if logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = JSON.parse(localStorage.getItem('mockUser') || '{}');
    if (isLoggedIn && user.uid) {
      try {
        await set(ref(database, `userStitches/${user.uid}/${stitch.id}`), null);
      } catch {}
    }
  };

  // Filter stitches by name (case-insensitive)
  const filteredStitches = stitches.filter(s =>
    s.name.toLowerCase().includes(stitchSearch.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStitches.length / stitchesPerPage);
  const paginatedStitches = filteredStitches.slice(
    (currentPage - 1) * stitchesPerPage,
    currentPage * stitchesPerPage
  );

  // Reset to page 1 if search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [stitchSearch]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded shadow-lg p-6 relative">
      <div className="text-center">
        <h1 className={`${hideReturnHome ? 'text-2xl' : 'text-3xl'} font-bold text-primary mt-5`}>Stitch Library</h1>
        {!hideReturnHome && (
          <p className="text-primary/80 text-lg">Define and save your favorite or custom crochet stitches for easy reference and reuse.</p>
        )}
      </div>
      {/* Home icon (top left) */}
      {!hideReturnHome && (
        <button
          className="absolute top-4 left-4 text-primary hover:text-pink-600 text-2xl font-bold flex items-center gap-1"
          onClick={() => { localStorage.removeItem(DRAFT_FLAG_KEY); localStorage.removeItem(DRAFT_DATA_KEY); handleGoHome(); }}
          title="Return to Home"
          style={{ zIndex: 10 }}
        >
          <span role="img" aria-label="Home">🏠</span>
          <h6 className="text-base font-semibold">Return to Home</h6>
        </button>
      )}
      <h2 className="text-xl font-bold text-primary mb-4 mt-5">Define Your Crochet Stitches</h2>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleAddStitch} className="flex flex-col gap-3 mb-8 w-full max-w-3xl min-w-[350px] mx-auto">
        <input
          className="border border-primary rounded px-3 py-2"
          type="text"
          placeholder="Stitch name (e.g. Slip Stitch)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSaving}
        />
        <textarea
          ref={descriptionRef}
          className="border border-primary rounded px-3 py-2 min-h-[60px] resize-none"
          placeholder="Description (e.g. Yarn over, pull through 3 loops, repeat twice.)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isSaving}
        />
        <label className={`btn-light cursor-pointer text-center mt-1 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {selectedFileName ? selectedFileName : "Add Image/Diagram (optional)"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            disabled={isSaving}
          />
        </label>
        {image && (
          <div className="flex flex-col items-center">
            <img src={image} alt="Stitch diagram" className="max-h-32 my-2 mx-auto rounded shadow" />
            <button
              type="button"
              className="mt-2 px-3 py-1 rounded bg-red-100 text-red-700 font-semibold border border-red-300 hover:bg-red-200"
              onClick={() => { setImage(""); setSelectedFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            >
              Clear Image
            </button>
          </div>
        )}
        <button
          className={`mt-2 px-4 py-2 rounded font-semibold transition-colors duration-150 
            ${name.trim() && description.trim() && !isSaving
              ? 'bg-primary text-white hover:bg-pink-700' 
              : 'bg-primary text-white opacity-50 cursor-not-allowed'}`}
          type="submit"
          disabled={!name.trim() || !description.trim() || isSaving}
        >
          {isSaving ? (editingStitchId ? 'Updating...' : 'Saving...') : (editingStitchId ? 'Update Stitch' : 'Add Stitch')}
        </button>
      </form>
      
      <h3 className="text-xl font-semibold text-primary mb-2">Your Stitches</h3>
      <input
        type="text"
        className="w-full border border-primary rounded px-3 py-2 mb-4"
        placeholder="Search stitches by name..."
        value={stitchSearch}
        onChange={e => setStitchSearch(e.target.value)}
      />
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-primary">Loading your stitches...</div>
        </div>
      ) : filteredStitches.length === 0 ? (
        <p className="text-primary">No stitches defined yet.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {paginatedStitches.map((stitch) => (
              <li key={stitch.id} className="border border-primary rounded p-3 bg-pink-50">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-primary">{stitch.name}</div>
                    <div className="text-sm text-primary/80">{stitch.description}</div>
                    {stitch.createdAt && (
                      <div className="text-xs text-primary/60 mt-1">
                        Created: {new Date(stitch.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {stitch.image && (
                    <img src={stitch.image} alt="diagram" className="max-h-20 rounded shadow ml-2" />
                  )}
                  <div className="flex flex-row gap-2 items-center ml-2 mt-2 md:mt-0">
                    <button
                      className="text-primary hover:text-blue-600 text-xl"
                      title="Edit stitch"
                      onClick={() => handleEditStitch(stitch)}
                    >
                      ✏️
                    </button>
                    <button
                      className="text-primary hover:text-red-600 text-xl"
                      title="Delete stitch"
                      onClick={() => handleDeleteStitch(stitch)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              className="px-4 py-2 rounded bg-pink-200 text-primary font-semibold disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-primary font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-4 py-2 rounded bg-pink-200 text-primary font-semibold disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
      
      <button
        className="absolute top-2 right-2 text-primary hover:text-red-500 text-2xl font-bold"
        onClick={handleClose}
        title="Close editor"
      >
        ×
      </button>
    </div>
  );
}; 