import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CrtStartup
 *
 * Plays a one-shot CRT monitor power-on animation on mount, then unmounts.
 *
 * Sequence (total ≈ 1.6 s):
 *   0.00 s  – white phosphor flash (2 px horizontal line, centre)
 *   0.10 s  – flash transitions to phosphor green, holds as hairline
 *   0.45 s  – content begins unfolding: top mask slides up, bottom slides down
 *   1.10 s  – content fully revealed, slit fades out
 *   1.35 s  – component unmounts
 */
export const CrtStartup: React.FC = () => {
  const [visible, setVisible] = useState(true);

  // Common spring for the mask panels
  const maskTransition = {
    delay: 0.45,
    duration: 0.7,
    ease: [0.16, 1, 0.3, 1] as const, // spring-like cubic-bezier
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="crt-startup"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
          // Fade the whole overlay out after the masks have slid away
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2, delay: 0 } }}
          onAnimationComplete={() => {
            // Give the mask panels time to finish, then trigger unmount
            setTimeout(() => setVisible(false), 1250);
          }}
        >
          {/* ── Top black mask — slides up to reveal content ── */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: '50%',
              background: '#000',
              transformOrigin: 'top',
            }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={maskTransition}
          />

          {/* ── Bottom black mask — slides down to reveal content ── */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              bottom: 0,
              background: '#000',
              transformOrigin: 'bottom',
            }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={maskTransition}
          />

          {/* ── Phosphor slit — flash → green hairline → fades ── */}
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              translateY: '-50%',
              borderRadius: 1,
            }}
            initial={{
              height: 2,
              opacity: 1,
              backgroundColor: '#ffffff',
              boxShadow: '0 0 24px 10px rgba(255,255,255,0.95)',
            }}
            animate={[
              // Step 1: white flash holds briefly
              {
                height: 2,
                opacity: 1,
                backgroundColor: '#ccffcc',
                boxShadow: '0 0 24px 10px rgba(200,255,200,0.85)',
                transition: { duration: 0.1 },
              },
              // Step 2: thin to green hairline
              {
                height: 1,
                opacity: 1,
                backgroundColor: '#00FF41',
                boxShadow: '0 0 14px 6px rgba(0,255,65,0.9)',
                transition: { duration: 0.2 },
              },
              // Step 3: hold hairline while masks slide away
              {
                height: 1,
                opacity: 1,
                backgroundColor: '#00FF41',
                boxShadow: '0 0 14px 6px rgba(0,255,65,0.9)',
                transition: { duration: 0.35 },
              },
              // Step 4: slit widens slightly (acts as glowing edge of unfolding content)
              {
                height: 4,
                opacity: 0.6,
                backgroundColor: '#00FF41',
                boxShadow: '0 0 20px 8px rgba(0,255,65,0.6)',
                transition: { duration: 0.3 },
              },
              // Step 5: dissolve
              {
                height: 4,
                opacity: 0,
                backgroundColor: '#00FF41',
                boxShadow: '0 0 0px 0px rgba(0,255,65,0)',
                transition: { duration: 0.25 },
              },
            ]}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
