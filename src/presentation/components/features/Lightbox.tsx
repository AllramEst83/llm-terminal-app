import React, { useEffect } from 'react';
import type { LightboxProps } from '../../../types/ui/components';

export const Lightbox: React.FC<LightboxProps> = ({ imageUrl, alt, onClose, theme }) => {
  const textColor = theme?.text || '#00FF41';
  const accentColor = theme?.accent || '#00A800';
  const backgroundColor = theme?.background || '#0D0D0D';

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close if clicking the backdrop (not the image)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full transition-opacity hover:opacity-80 active:opacity-70"
        style={{
          backgroundColor: `${accentColor}40`,
          color: textColor,
          border: `2px solid ${accentColor}`,
        }}
        aria-label="Close lightbox"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image container */}
      <div className="relative max-w-[95vw] max-h-[95vh] p-4">
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[95vh] object-contain rounded"
          style={{
            border: `2px solid ${accentColor}60`,
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};
