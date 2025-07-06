import React, { useEffect, useState, useCallback } from "react";
import { DisplayCards } from "./DisplayCards";
import { database } from '../firebase';
import { ref, get } from 'firebase/database';

export const LikedPatternsPage = ({ showToast, selectedCategory = "", searchTerm = "" }) => {
  const [likedPatterns, setLikedPatterns] = useState([]);

  // Helper to fetch all public patterns from Firebase and update localStorage
  const fetchAndStorePublicPatterns = async () => {
    try {
      const allUsersSnap = await get(ref(database, 'userPatterns'));
      const usersSnap = await get(ref(database, 'users'));
      let allPublicPatterns = [];
      let userMap = {};
      if (usersSnap.exists()) {
        userMap = usersSnap.val();
      }
      if (allUsersSnap.exists()) {
        const allUsers = allUsersSnap.val();
        Object.entries(allUsers).forEach(([uid, userPatterns]) => {
          Object.values(userPatterns).forEach(pattern => {
            if (pattern.public) {
              allPublicPatterns.push({
                ...pattern,
                creatorUid: uid,
                creatorUsername: userMap[uid]?.username || "Unknown user"
              });
            }
          });
        });
      }
      localStorage.setItem("publicPatterns", JSON.stringify(allPublicPatterns));
      return allPublicPatterns;
    } catch (err) {
      return [];
    }
  };

  // Function to fetch liked patterns, fetching public patterns from Firebase if needed
  const fetchLikedPatterns = useCallback(async () => {
    const likedIds = JSON.parse(localStorage.getItem('likedPatterns') || '[]');
    const userPatterns = JSON.parse(localStorage.getItem('userPatterns') || '[]');
    let publicPatterns = JSON.parse(localStorage.getItem('publicPatterns') || '[]');
    // If any liked ID is missing from both, fetch public patterns from Firebase
    const allPatterns = [...userPatterns, ...publicPatterns];
    const missingIds = likedIds.filter(id => !allPatterns.some(p => p.id === id));
    if (missingIds.length > 0) {
      publicPatterns = await fetchAndStorePublicPatterns();
    }
    const combined = [...userPatterns, ...publicPatterns];
    const uniquePatterns = combined.filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx);
    setLikedPatterns(uniquePatterns.filter(p => likedIds.includes(p.id)));
  }, []);

  useEffect(() => {
    fetchLikedPatterns();
    // Listen for storage changes (other tabs/windows)
    const onStorage = (e) => {
      if (e.key === 'likedPatterns' || e.key === 'userPatterns' || e.key === 'publicPatterns') {
        fetchLikedPatterns();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fetchLikedPatterns]);

  const handleUnlike = () => {
    fetchLikedPatterns();
  };

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
  const filteredLikedPatterns = filterPatternsByCategory(filterPatternsBySearch(likedPatterns));

  return (
    <div className={`wrapper mt-0 min-h-screen ${selectedCategory && filteredLikedPatterns.length === 0 ? 'bg-primary' : 'bg-primary'}`}>
      <div className="w-full flex flex-col items-center mt-12 mb-10">
        <h1 className="text-3xl font-bold text-secondary">
          {selectedCategory ? `${selectedCategory} - Liked Patterns` : "Liked Patterns"}
        </h1>
        <div className="w-full max-w-6xl">
          {filteredLikedPatterns.length > 0 ? (
            <DisplayCards 
              recentPatterns={filteredLikedPatterns} 
              publicPatterns={[]} 
              allowUnlike={true} 
              onUnlike={handleUnlike} 
              showToast={showToast} 
              recentSectionTitle="" 
              selectedCategory={selectedCategory}
            />
          ) : (
            <div className={`text-center mt-8 ${selectedCategory ? 'bg-secondary text-primary rounded-2xl p-8 shadow-lg max-w-xl mx-auto' : 'text-primary bg-white rounded-2xl p-8 shadow-lg'}`}>
              {selectedCategory 
                ? `You haven't liked any ${selectedCategory.toLowerCase()} patterns yet.` 
                : "You haven't liked any patterns yet."
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 