import React, { useState, useEffect } from "react";
import { Card } from "./Card";

export const DisplayCards = ({ recentPatterns = [], publicPatterns = [], actionButtons, onEdit, onDelete, allowUnlike = false, onUnlike, showToast, recentSectionTitle = "Your Recently Added Patterns", selectedCategory = "" }) => {
  const currentUser = JSON.parse(localStorage.getItem("mockUser") || '{}');
  const showSeparator = publicPatterns.length > 0 && (recentPatterns.length > 0 || actionButtons);
  // Show all patterns if allowUnlike (liked patterns page), else only 3 for recently added
  const patternsToShow = allowUnlike ? recentPatterns : recentPatterns
    .sort((a, b) => (b.id || 0) - (a.id || 0)) // Sort by ID (creation time) descending
    .slice(0, 3);

  // Pagination for public patterns
  const [currentPublicPage, setCurrentPublicPage] = useState(1);
  const publicPatternsPerPage = 6;
  const totalPublicPages = Math.ceil(publicPatterns.length / publicPatternsPerPage);
  const paginatedPublicPatterns = publicPatterns.slice(
    (currentPublicPage - 1) * publicPatternsPerPage,
    currentPublicPage * publicPatternsPerPage
  );
  useEffect(() => {
    setCurrentPublicPage(1);
  }, [publicPatterns]);

  return (
    <div className="flex-col w-full">
      {/* Action Buttons Section */}
      {actionButtons}
      {/* Recently Added Section */}
      {patternsToShow.length > 0 && (
        <div className="mb-10">
          <h2 className="text-l font-light text-white mb-4 text-center">
            {selectedCategory 
              ? `Click on the Wearables, Functional Items or Toys & Gifts on the Navigation Bar to Filter the Crochet Patterns` 
              : recentSectionTitle
            }
          </h2>
          <div className="w-full flex flex-wrap gap-6 justify-center">
            {patternsToShow.map((pattern) => (
              pattern && pattern.title ? (
                <Card
                  key={pattern.id}
                  title={pattern.title}
                  image={pattern.images && pattern.images.length > 0 ? pattern.images[0] : undefined}
                  category={pattern.category}
                  pattern={pattern}
                  creatorUsername={pattern.creatorUsername}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  allowUnlike={allowUnlike}
                  onUnlike={onUnlike}
                  showToast={showToast}
                />
              ) : (
                <div key={pattern.id || Math.random()} className="card flex flex-col items-center justify-center text-center bg-pink-100/80 border-2 border-dashed border-pink-400 text-pink-700 font-semibold">
                  <div className="text-2xl mb-2">Pattern Deleted</div>
                  <div className="mb-2">{pattern.creatorUsername ? `The creator '${pattern.creatorUsername}' has deleted this pattern.` : 'This pattern has been deleted by its creator.'}</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
      {/* Separator between sections, only if both sections exist */}
      {showSeparator && (
        <div className="relative w-full flex items-center gap-2 my-8 uppercase text-secondary font-bold">
          <hr className="w-1/2 border-secondary" />
          💌
          <hr className="w-1/2 border-secondary" />
        </div>
      )}
      {/* Public Patterns Section */}
      {publicPatterns.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-light text-white mb-4 text-center">
            {selectedCategory 
              ? `Public ${selectedCategory} Patterns` 
              : "All Public Patterns"
            }
          </h2>
          <div className="w-full flex flex-wrap gap-6 justify-center">
            {paginatedPublicPatterns.map((pattern) => (
              <Card
                key={pattern.id}
                title={pattern.title}
                image={pattern.images && pattern.images.length > 0 ? pattern.images[0] : undefined}
                category={pattern.category}
                pattern={pattern}
                creatorUsername={pattern.creatorUsername}
                allowUnlike={allowUnlike}
                onUnlike={onUnlike}
                showToast={showToast}
                // No edit/delete for public patterns
              />
            ))}
          </div>
          {/* Pagination Controls for Public Patterns */}
          {totalPublicPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                className="px-4 py-2 rounded bg-pink-200 text-primary font-semibold disabled:opacity-50"
                onClick={() => setCurrentPublicPage((p) => Math.max(1, p - 1))}
                disabled={currentPublicPage === 1}
              >
                Previous
              </button>
              <span className="text-secondary font-medium">
                Page {currentPublicPage} of {totalPublicPages}
              </span>
              <button
                className="px-4 py-2 rounded bg-pink-200 text-primary font-semibold disabled:opacity-50"
                onClick={() => setCurrentPublicPage((p) => Math.min(totalPublicPages, p + 1))}
                disabled={currentPublicPage === totalPublicPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
