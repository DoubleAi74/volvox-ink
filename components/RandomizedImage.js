import React, { useEffect, useRef, useState } from "react";
import { randomNormal } from "d3-random";

/**
 * RandomizedImage
 *
 * Props:
 * - imageSrc (string) - path/URL to the base image
 * - width (number) - canvas width in px (default 800)
 * - height (number) - canvas height in px (default width * 9/16)
 * - params (object|null) - if provided, uses these transformation/color values
 *    {
 *      rotationAngle: number (degrees),
 *      scale: number,
 *      offsetX: number,
 *      offsetY: number,
 *      rShift: number,
 *      gShift: number,
 *      bShift: number,
 *      backgroundColor: string (css color)
 *    }
 * - onGenerated (function) - callback(dataUrl) called after an image is rendered
 * - imgProps (object) - props forwarded to the <img> that displays the exported PNG
 *
 * Exports a default React component and a helper `generateRandomParams()`.
 */

export function generateRandomParams(overrides = {}) {
  // Create a consistent set of "random" parameters; you can seed this externally if needed.
  const gaussianGen = randomNormal(0, 60); // degrees
  const rotationAngle = gaussianGen();

  const scale = 1.2 + Math.random() * 0.5;
  const offsetX = (Math.random() - 0.5) * 75;
  const offsetY = (Math.random() - 0.5) * 75;

  const intensity = 180;
  const rShift = Math.floor(Math.random() * intensity - intensity / 2);
  const gShift = Math.floor(Math.random() * intensity - intensity / 2);
  const bShift = Math.floor(Math.random() * intensity - intensity / 2);

  const backgroundColor = "#d8e8e5";

  return {
    rotationAngle,
    scale,
    offsetX,
    offsetY,
    rShift,
    gShift,
    bShift,
    backgroundColor,
    ...overrides,
  };
}

export default function RandomizedImage({
  imageSrc = "logo-lotus4.png",
  width = 800,
  height = null,
  params = null,
  onGenerated = null,
  imgProps = {},
}) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState("");

  const finalHeight = height || Math.round((width * 9) / 16);

  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = finalHeight;
    const ctx = canvas.getContext("2d");

    const baseImage = new Image();
    baseImage.crossOrigin = "anonymous";
    baseImage.src = imageSrc;

    baseImage.onload = () => {
      if (!mounted) return;

      // Choose params: either provided or generated now
      const p = params || generateRandomParams();

      // Step 1: Fill background
      ctx.fillStyle = p.backgroundColor || "#d8e8e5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Step 2: Offscreen canvas
      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      const offCtx = offCanvas.getContext("2d");

      // Transform and draw base image centered
      offCtx.save();
      offCtx.translate(offCanvas.width / 2, offCanvas.height / 2);
      offCtx.rotate((p.rotationAngle * Math.PI) / 180);
      offCtx.scale(p.scale, p.scale);
      offCtx.translate(p.offsetX || 0, p.offsetY || 0);

      const imgWidth = baseImage.width;
      const imgHeight = baseImage.height;
      offCtx.drawImage(baseImage, -imgWidth / 2, -imgHeight / 2);
      offCtx.restore();

      // Apply color shift (only where alpha > 0)
      try {
        const imageData = offCtx.getImageData(
          0,
          0,
          offCanvas.width,
          offCanvas.height
        );
        const data = imageData.data;
        const rShift = p.rShift || 0;
        const gShift = p.gShift || 0;
        const bShift = p.bShift || 0;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = clamp(data[i] + rShift);
            data[i + 1] = clamp(data[i + 1] + gShift);
            data[i + 2] = clamp(data[i + 2] + bShift);
          }
        }

        offCtx.putImageData(imageData, 0, 0);
      } catch (e) {
        // getImageData can fail for cross-origin images; we fail gracefully
        // If that happens, skip color shift.
        // console.warn('Color shift skipped (possible CORS):', e);
      }

      // Draw offscreen canvas to main canvas
      ctx.drawImage(offCanvas, 0, 0);

      // Export and callback
      const url = canvas.toDataURL("image/png");
      setDataUrl(url);
      if (typeof onGenerated === "function") onGenerated(url, p);
    };

    baseImage.onerror = (err) => {
      // eslint-disable-next-line no-console
      console.error("Failed to load base image:", err);
    };

    return () => {
      mounted = false;
    };
  }, [imageSrc, width, finalHeight, params, onGenerated]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {/* visible image preview */}
      <img src={dataUrl} {...imgProps} />
    </div>
  );
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}
