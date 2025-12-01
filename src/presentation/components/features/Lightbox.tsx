import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { LightboxProps } from '../../../types/ui/components';

export const ImageLightbox: React.FC<LightboxProps> = ({ imageUrl, alt, onClose, theme }) => {
  const accentColor = theme?.accent || '#00A800';
  const textColor = theme?.text || '#00FF41';

  return (
    <Lightbox
      open={true}
      close={onClose}
      slides={[{ src: imageUrl, alt }]}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
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
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        pinchZoomDistanceRatio: 0.1,
        scrollToZoom: false,
      }}
    />
  );
};
