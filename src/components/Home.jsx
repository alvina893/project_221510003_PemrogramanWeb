import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { PatternEditor } from "./PatternEditor";
import { StitchManager } from "./StitchManager";
import { Card } from "./Card";
import { database } from '../firebase';
import { ref, get, child, remove, onValue, off } from 'firebase/database';
import { DisplayCards } from "./DisplayCards";

export const Home = ({ showToast, searchTerm = "", selectedCategory, setSelectedCategory }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [showStitchManager, setShowStitchManager] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [patternToEdit, setPatternToEdit] = useState(null);
  const [publicPatterns, setPublicPatterns] = useState([]);
  const hasInitialized = useRef(false);
  const previousLoginState = useRef(false);
  const [currentUser, setCurrentUser] = useState(null);

  // StitchManager draft persistence
  const STITCH_MANAGER_DRAFT_KEY = 'stitchManagerDraftOpen';

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const user = JSON.parse(localStorage.getItem("mockUser"));
    
    setIsLoggedIn(!!loggedIn);
    setUsername(user?.username || "");
    setCurrentUser(user);
    
    // Fetch likedPatterns from Firebase and sync to localStorage
    async function fetchLikedPatternsFromFirebase() {
      if (loggedIn && user?.uid) {
        try {
          const snap = await get(ref(database, `users/${user.uid}/likedPatterns`));
          if (snap.exists()) {
            localStorage.setItem('likedPatterns', JSON.stringify(snap.val()));
          }
        } catch (err) {
          // ignore
        }
      }
    }
    fetchLikedPatternsFromFirebase();
    
    // If user just logged in (wasn't logged in before), clear any draft flags
    if (loggedIn && !previousLoginState.current && !hasInitialized.current) {
      localStorage.removeItem('patternEditorDraft');
      localStorage.removeItem(STITCH_MANAGER_DRAFT_KEY);
      setShowEditor(false);
      setShowStitchManager(false);
      hasInitialized.current = true;
    } else if (loggedIn && previousLoginState.current) {
      // Only restore draft states if user was already logged in
      if (localStorage.getItem('patternEditorDraft')) {
        setShowEditor(true);
      }
      if (localStorage.getItem(STITCH_MANAGER_DRAFT_KEY)) {
        setShowStitchManager(true);
      }
    }
    
    // Update the previous login state
    previousLoginState.current = !!loggedIn;
    
    // Load patterns from Firebase if logged in
    async function fetchPatterns() {
      if (loggedIn && user?.uid) {
        try {
          const snap = await get(ref(database, `userPatterns/${user.uid}`));
          let patterns = [];
          if (snap.exists()) {
            patterns = Object.values(snap.val());
          }
          const deduped = deduplicatePatterns(patterns);
          setPatterns(deduped);
          localStorage.setItem("userPatterns", JSON.stringify(deduped));
        } catch (err) {
          // fallback to localStorage
        }
      }
      // fallback: load from localStorage
      const saved = JSON.parse(localStorage.getItem("userPatterns") || "[]");
      setPatterns(deduplicatePatterns(saved));
    }
    fetchPatterns();

    // If there is a pattern editor draft, keep the editor open after refresh
    if (loggedIn && localStorage.getItem('patternEditorDraft')) {
      setShowEditor(true);
    }
  }, []);

  // Fetch all public patterns from all users except current user with real-time updates
  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener for userPatterns
    const userPatternsRef = ref(database, 'userPatterns');
    const usersRef = ref(database, 'users');
    
    const unsubscribeUserPatterns = onValue(userPatternsRef, async (allUsersSnap) => {
      try {
        const usersSnap = await get(usersRef);
        let allPublicPatterns = [];
        let userMap = {};
        
        if (usersSnap.exists()) {
          userMap = usersSnap.val(); // { uid: { username, email } }
        }
        
        if (allUsersSnap.exists()) {
          const allUsers = allUsersSnap.val();
          Object.entries(allUsers).forEach(([uid, userPatterns]) => {
            if (!currentUser || uid !== currentUser.uid) {
              Object.values(userPatterns).forEach(pattern => {
                if (pattern.public) {
                  allPublicPatterns.push({
                    ...pattern,
                    creatorUid: uid,
                    creatorUsername: userMap[uid]?.username || "Unknown user"
                  });
                }
              });
            }
          });
        }
        
        setPublicPatterns(deduplicatePatterns(allPublicPatterns));
        localStorage.setItem("publicPatterns", JSON.stringify(deduplicatePatterns(allPublicPatterns)));
      } catch (err) {
        console.error('Error fetching public patterns:', err);
        setPublicPatterns([]);
      }
    }, (error) => {
      console.error('Error setting up public patterns listener:', error);
      setPublicPatterns([]);
    });

    // Cleanup function to remove listeners when component unmounts or currentUser changes
    return () => {
      off(userPatternsRef, 'value', unsubscribeUserPatterns);
    };
  }, [currentUser]);

  // Persist StitchManager open state
  useEffect(() => {
    if (showStitchManager) {
      localStorage.setItem(STITCH_MANAGER_DRAFT_KEY, 'true');
    } else {
      localStorage.removeItem(STITCH_MANAGER_DRAFT_KEY);
    }
  }, [showStitchManager]);

  // Refresh patterns after closing editor
  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedCategory(""); // Clear category filter when closing editor
    const saved = JSON.parse(localStorage.getItem("userPatterns") || "[]");
    setPatterns(deduplicatePatterns(saved));
  };

  // Edit pattern handler
  const handleEditPattern = (pattern) => {
    setPatternToEdit(pattern);
    setShowEditor(true);
    setShowStitchManager(false);
  };

  // Delete pattern handler
  const handleDeletePattern = async (pattern) => {
    if (window.confirm(`Are you sure you want to delete the pattern "${pattern.title}"?`)) {
      const updated = patterns.filter(p => p.id !== pattern.id);
      setPatterns(updated);
      localStorage.setItem("userPatterns", JSON.stringify(updated));
      // Remove from Firebase
      try {
        if (currentUser?.uid && pattern.id) {
          await remove(ref(database, `userPatterns/${currentUser.uid}/${pattern.id}`));
        }
      } catch (err) {
        alert("Failed to delete from server: " + err.message);
      }
    }
  };

  const hasPatterns = patterns.length > 0;

  // Utility to deduplicate patterns by ID
  function deduplicatePatterns(patterns) {
    const seen = new Set();
    return patterns.filter(p => {
      if (!p.id) return true; // keep if no id (shouldn't happen)
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }

  // Filter patterns by search term and category
  const filterPatterns = (arr) =>
    arr.filter(p => {
      // Filter by search term
      const matchesSearch = !searchTerm || (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase()));
      // Filter by category
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  
  const filteredPatterns = filterPatterns(patterns);
  const filteredPublicPatterns = filterPatterns(publicPatterns);

  return (
    <div className={(isLoggedIn ? "wrapper mt-0" : "wrapper") + " bg-primary min-h-screen"}>
      {!isLoggedIn && (
        <>
          <img src="https://i.ibb.co/Jw6PFpgK/logo.png" alt="aHook&Yarn" className="mt-20" />
          <h1 className="mt-8">
            Save Your Favorite <span className="text-gradient">Crochet</span>{" "}
            Tutorials Easily!
          </h1>
          <div className="w-full flex justify-center mt-10 mb-4">
            <div className="flex gap-4">
              <Link className="btn-dark" to="/signin">
                <p>Sign In</p>
              </Link>
              <Link className="btn-light" to="/signup">
                <p>Sign Up</p>
              </Link>
            </div>
          </div>
          <div className="relative w-full flex items-center gap-2 my-8 uppercase text-secondary font-bold">
            <hr className="w-1/2 border-secondary" />
            💌
            <hr className="w-1/2 border-secondary" />
          </div>
          <div className="w-full flex justify-center mt-6 mb-8 px-2">
            <div className="w-full max-w-5xl bg-pink-100/90 rounded-2xl p-8 md:p-12 shadow flex flex-col items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">What Can You Do?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">🧵</span>
                  <span className="text-lg md:text-xl font-semibold text-primary text-center">Create your own<br/>patterns</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">💡</span>
                  <span className="text-lg md:text-xl font-semibold text-primary text-center">Define custom<br/>stitches</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">🌟</span>
                  <span className="text-lg md:text-xl font-semibold text-primary text-center">Discover shared<br/>tutorials</span>
                </div>
                {/* <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">🛍️</span>
                  <span className="text-lg md:text-xl font-semibold text-primary text-center">Shop for crochet<br/>tools</span>
                </div> */}
              </div>
            </div>
          </div>
          <div className="relative w-full flex items-center gap-2 my-8 uppercase text-secondary font-bold">
            <hr className="w-1/2 border-secondary" />
            💌
            <hr className="w-1/2 border-secondary" />
          </div>
          {/* How It Works - visually distinct, numbers in circles above text */}
          <h1 className="mt-10">Get Hooked in 3 Easy Steps</h1>
          <div className="w-full flex justify-center mb-20 px-2">
            <div className="w-full max-w-4xl flex flex-col items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10 tracking-tight">How It Works</h2>
              <div className="flex flex-col md:flex-row items-center justify-center w-full gap-10 md:gap-0">
                <div className="flex flex-col items-center flex-1">
                  <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg text-4xl font-extrabold text-primary mb-8">1</span>
                  <span className="text-lg md:text-xl font-semibold text-white text-center">Create a New Account</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg text-4xl font-extrabold text-primary mb-8">2</span>
                  <span className="text-lg md:text-xl font-semibold text-white text-center">Create Your First Pattern</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg text-4xl font-extrabold text-primary mb-8">3</span>
                  <span className="text-lg md:text-xl font-semibold text-white text-center">Share or Keep It Private</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} /> */}
      {/* <h1 className="text-shadow-white text-2xl">{searchTerm}</h1> */}
      {isLoggedIn ? (
        <div className={showEditor ? "w-full" : "authentication-content flex flex-col items-center gap-4 mt-20"}>
          {!showEditor && !showStitchManager && <>
            <p className="text-4xl font-semibold text-white">Welcome back, {username}!</p>
            <p className="text-lg text-white font-light">What do you want to work on today?</p>
            
            {/* Recently Added and Public Patterns Section with Action Buttons in between */}
            <DisplayCards
              recentPatterns={filteredPatterns}
              publicPatterns={filteredPublicPatterns}
              actionButtons={
                <div className="flex justify-center items-center gap-4 mb-8">
                  <button className="btn-light" onClick={() => { setShowStitchManager(true); setShowEditor(false); }}>
                    <p>🧶 Define Your Crochet Stitches</p>
                  </button>
                  <button className="btn-dark" onClick={() => {
                    setPatternToEdit(null);
                    localStorage.removeItem('patternEditorDraft');
                    setShowEditor(true);
                    setShowStitchManager(false);
                  }}>
                    <p>➕ Save New Crochet Pattern</p>
                  </button>
                </div>
              }
              onEdit={handleEditPattern}
              onDelete={handleDeletePattern}
              showToast={showToast}
              selectedCategory={selectedCategory}
            />
          </>}
          {showEditor && <PatternEditor onClose={handleEditorClose} pattern={patternToEdit} />}
          {showStitchManager && <StitchManager onClose={() => setShowStitchManager(false)} />}
        </div>
      ) : null}
    </div>
  );
};
