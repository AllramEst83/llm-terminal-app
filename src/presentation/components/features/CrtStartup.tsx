import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Draws one frame of CRT static noise onto the canvas.
 * @param ctx   - 2D rendering context
 * @param w / h - canvas logical dimensions
 * @param alpha - noise opacity 0→1
 */
function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  // Work at 1/3 resolution then scale up for a chunky pixel look
  const scale = 3;
  const sw = Math.ceil(w / scale);
  const sh = Math.ceil(h / scale);

  const imageData = ctx.createImageData(sw, sh);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Random grey value with slight green tint (phosphor feel)
    const lum = Math.random() * 255;
    data[i]     = lum * 0.6;   // R — dimmed
    data[i + 1] = lum;         // G — full (green phosphor bias)
    data[i + 2] = lum * 0.6;   // B — dimmed
    data[i + 3] = alpha * 255; // A
  }

  // Draw small then scale up for that chunky CRT grain
  const offscreen = document.createElement('canvas');
  offscreen.width  = sw;
  offscreen.height = sh;
  const offCtx = offscreen.getContext('2d')!;
  offCtx.putImageData(imageData, 0, 0);

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(offscreen, 0, 0, w, h);
}

/**
 * CrtStartup
 *
 * Plays a one-shot CRT monitor power-on animation on mount, then unmounts.
 *
 * Sequence (total ≈ 1.6 s):
 *   0.00 s  – white phosphor flash + heavy static noise
 *   0.10 s  – green hairline slit, noise still heavy
 *   0.45 s  – masks open, noise fades as content reveals
 *   1.10 s  – content fully shown, noise gone
 *   1.35 s  – component unmounts
 */
export const CrtStartup: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const startRef  = useRef<number | null>(null);

  // Canvas noise loop — runs for TOTAL_DURATION_MS then stops
  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Throttle to ~30 fps so we get that flickery vintage look
    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 30;

    const loop = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;

      // Noise envelope:
      //   0 – 450 ms  → full noise (alpha 0.35)
      //   450 – 1150 ms → fade out with content
      //   >1150 ms    → silent
      let alpha: number;
      if (elapsed < 450) {
        alpha = 0.35;
      } else if (elapsed < 1150) {
        alpha = 0.35 * (1 - (elapsed - 450) / 700);
      } else {
        // Stop the loop — nothing left to draw
        return;
      }

      // Throttle frames
      if (ts - lastFrame >= FRAME_INTERVAL) {
        lastFrame = ts;
        const w = canvas.offsetWidth  || window.innerWidth;
        const h = canvas.offsetHeight || window.innerHeight;
        if (canvas.width !== w)  canvas.width  = w;
        if (canvas.height !== h) canvas.height = h;
        drawNoise(ctx, w, h, alpha);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  // Common spring for the mask panels
  const maskTransition = {
    delay: 0.45,
    duration: 0.7,
    ease: [0.16, 1, 0.3, 1] as const,
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
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          onAnimationComplete={() => {
            setTimeout(() => setVisible(false), 1250);
          }}
        >
          {/* ── Static noise canvas ── */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              mixBlendMode: 'screen',   // blends nicely over the dark masks
            }}
          />

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
              {
                height: 2,
                opacity: 1,
                backgroundColor: '#ccffcc',
                boxShadow: '0 0 24px 10px rgba(200,255,200,0.85)',
                transition: { duration: 0.1 },
              },
              {
                height: 1,
                opacity: 1,
                backgroundColor: '#00FF41',
                boxShadow: '0 0 14px 6px rgba(0,255,65,0.9)',
                transition: { duration: 0.2 },
              },
              {
                height: 1,
                opacity: 1,
                backgroundColor: '#00FF41',
                boxShadow: '0 0 14px 6px rgba(0,255,65,0.9)',
                transition: { duration: 0.35 },
              },
              {
                height: 4,
                opacity: 0.6,
                backgroundColor: '#00FF41',
                boxShadow: '0 0 20px 8px rgba(0,255,65,0.6)',
                transition: { duration: 0.3 },
              },
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
