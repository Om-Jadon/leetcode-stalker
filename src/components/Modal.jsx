// Modal.jsx
import React, { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity modal-backdrop cursor-pointer"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 md:p-4">
        <div className="relative w-full max-w-sm md:max-w-2xl max-h-[95vh] md:max-h-[90vh] transform overflow-hidden rounded-xl glass-morphism shadow-glow-lg transition-all modal-content">
          {/* Header */}
          <div className="flex items-center justify-between p-3 md:p-4 lg:p-6 border-b border-neutral-700/50">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-white truncate pr-4">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors btn-hover-scale focus-ring touch-target shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-3 md:p-4 lg:p-6 max-h-[70vh] md:max-h-[60vh] overflow-y-auto mobile-padding">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
