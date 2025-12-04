import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import type { LightboxProps } from '../../../types/ui/components';

export const ImageLightbox: React.FC<LightboxProps> = ({ 
  slides, 
  initialIndex = 0, 
  onClose, 
  theme 
}) => {
  const accentColor = theme?.accent || '#00A800';
  const textColor = theme?.text || '#00FF41';

  return (
    <Lightbox
      open={true}
      close={onClose}
      index={initialIndex}
      slides={slides}
      plugins={[Zoom]}
      render={{
        buttonPrev: slides.length > 1 ? undefined : () => null,
        buttonNext: slides.length > 1 ? undefined : () => null,
      }}
      styles={{
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
        },
        button: {
          backgroundColor: `${accentColor}40`,
          color: textColor,
          border: `2px solid ${accentColor}`,
        },
      }}
      controller={{ 
        closeOnBackdropClick: true,
        closeOnPullDown: true,
        closeOnPullUp: true,
      }}
    />
  );
};
