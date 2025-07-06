import { useEffect, useState } from "react";
import { PatternDetailModal } from "./PatternDetailModal";
import { database } from '../firebase';
import { ref, set, get, update } from 'firebase/database';

export const Card = ({ title, image, category, onEdit, onDelete, pattern, creatorUsername, allowUnlike, onUnlike, showToast }) => {
  const [count, setCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Helper to sync likedPatterns to Firebase
  const syncLikedPatternsToFirebase = (liked) => {
    const user = JSON.parse(localStorage.getItem('mockUser') || '{}');
    if (user && user.uid) {
      set(ref(database, `users/${user.uid}/likedPatterns`), liked);
    }
  };

  // Check if this pattern is liked on mount
  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem('likedPatterns') || '[]');
    setHasLiked(liked.includes(pattern.id));
  }, [pattern.id]);

  // Update localStorage and Firebase when like toggled
  const handleLike = (e) => {
    e.stopPropagation();
    setHasLiked((prev) => {
      const liked = JSON.parse(localStorage.getItem('likedPatterns') || '[]');
      let updated;
      let likedNow;
      if (prev) {
        updated = liked.filter(id => id !== pattern.id);
        likedNow = false;
      } else {
        updated = [...liked, pattern.id];
        likedNow = true;
      }
      localStorage.setItem('likedPatterns', JSON.stringify(updated));
      syncLikedPatternsToFirebase(updated);
      if (allowUnlike && onUnlike) onUnlike();
      if (showToast) {
        if (likedNow) {
          showToast('Pattern added to Liked Patterns!');
        } else {
          showToast('Pattern removed from Liked Patterns.');
        }
      }
      return !prev;
    });
  };

  const handleCardClick = (e) => {
    // Prevent opening modal if clicking on a button
    if (e.target.tagName === 'BUTTON') return;
    setShowDetail(true);
  };

  return (
    <>
      <div className="card" onClick={handleCardClick}>
        <img
          src={image || "/img/crochet-img.jpg"}
          alt={title || "Pattern image"}
          className="w-full h-56 object-cover rounded-lg"
        />
        <br />
        <div className="flex items-center justify-between w-full">
          <h3>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              className="ml-4 text-2xl focus:outline-none"
              onClick={handleLike}
              aria-label={hasLiked ? "Unlike pattern" : "Like pattern"}
            >
              {hasLiked ? "🩵" : "🤍"}
            </button>
          </div>
        </div>
        {category && (
          <div className="inline-block bg-primary/80 text-white text-base font-medium mb-2 mt-1 py-1 rounded-full">
            {category}
          </div>
        )}
        {creatorUsername && (
          <div className="text-secondary">by {creatorUsername}</div>
        )}
        <div className="flex gap-2 mt-2">
          {onEdit && (
            <button className="btn-light px-2 py-1 text-sm" onClick={e => { e.stopPropagation(); onEdit(pattern); }}>Edit</button>
          )}
          {onDelete && (
            <button className="btn-dark px-2 py-1 text-sm" onClick={e => { e.stopPropagation(); onDelete(pattern); }}>Delete</button>
          )}
        </div>
      </div>
      {showDetail && (
        <PatternDetailModal pattern={pattern} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
};
