import React, { useEffect } from "react";

export const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-secondary text-primary px-6 py-3 rounded-lg shadow-lg text-lg font-semibold animate-fade-in">
      {message}
    </div>
  );
}; 