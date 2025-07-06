import React, { useEffect, useState, useRef } from "react";
import { DisplayCards } from "./DisplayCards";
import { PatternEditor } from "./PatternEditor";
import { database } from '../firebase';
import { ref, get, remove } from 'firebase/database';

export const MyPatternsPage = ({ showToast, selectedCategory = "", searchTerm = "" }) => {
  const [patterns, setPatterns] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [patternToEdit, setPatternToEdit] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("mockUser"));
    setCurrentUser(user);
    async function fetchPatterns() {
      if (user?.uid) {
        try {
          const snap = await get(ref(database, `userPatterns/${user.uid}`));
          let patterns = [];
          if (snap.exists()) {
            patterns = Object.values(snap.val());
          }
          setPatterns(patterns);
        } catch (err) {
          setPatterns([]);
        }
      } else {
        setPatterns([]);
      }
      setLoading(false);
    }
    fetchPatterns();
  }, []);

  // Refresh patterns after closing editor
  const handleEditorClose = () => {
    setShowEditor(false);
    const saved = JSON.parse(localStorage.getItem("userPatterns") || "[]");
    setPatterns(saved);
  };

  const handleEditPattern = (pattern) => {
    setPatternToEdit(pattern);
    setShowEditor(true);
  };

  const handleDeletePattern = async (pattern) => {
    if (window.confirm(`Are you sure you want to delete the pattern "${pattern.title}"?`)) {
      const updated = patterns.filter(p => p.id !== pattern.id);
      setPatterns(updated);
      // Remove from Firebase
      try {
        if (currentUser?.uid && pattern.id) {
          await remove(ref(database, `userPatterns/${currentUser.uid}/${pattern.id}`));
        }
        showToast && showToast('Pattern deleted!');
      } catch (err) {
        alert("Failed to delete from server: " + err.message);
      }
    }
  };

  if (loading) return <div className="text-white text-center mt-10">Loading your patterns...</div>;

  // Filter patterns by search term
  const filterPatternsBySearch = (patterns) => {
    if (!searchTerm) return patterns;
    return patterns.filter(pattern => pattern.title && pattern.title.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  // Filter patterns by category
  const filterPatternsByCategory = (patterns) => {
    if (!selectedCategory) return patterns;
    return patterns.filter(pattern => pattern.category === selectedCategory);
  };

  // Apply search filter first, then category filter
  const filteredPatterns = filterPatternsByCategory(filterPatternsBySearch(patterns));

  return (
    <div className={`wrapper min-h-screen mt-0 ${selectedCategory && filteredPatterns.length === 0 ? 'bg-primary' : 'bg-primary'}`}>
      <h1 className="text-3xl font-bold text-white mt-4">
        {selectedCategory ? `${selectedCategory} - My Patterns` : "My Crochet Patterns"}
      </h1>
      {filteredPatterns.length === 0 ? (
        <div className={
          `text-center mt-8 ${selectedCategory ? 'bg-secondary text-primary te rounded-2xl p-8 shadow-lg max-w-xl mx-auto' : 'text-white'}`
        }>
          {selectedCategory 
            ? `You haven't created any ${selectedCategory.toLowerCase()} patterns yet.` 
            : "You haven't created any patterns yet."
          }
        </div>
      ) : (
        <DisplayCards
          recentPatterns={filteredPatterns}
          publicPatterns={[]}
          onEdit={handleEditPattern}
          onDelete={handleDeletePattern}
          showToast={showToast}
          recentSectionTitle=""
          allowUnlike={true}
          selectedCategory={selectedCategory}
        />
      )}
      {showEditor && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
          onClick={() => setShowEditor(false)}
        >
          <div
            className="relative w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg"
            onClick={e => e.stopPropagation()}
            style={{ boxSizing: 'border-box' }}
          >
            <PatternEditor pattern={patternToEdit} onClose={handleEditorClose} />
          </div>
        </div>
      )}
    </div>
  );
}; 