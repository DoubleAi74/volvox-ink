"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Plus, Minus } from "lucide-react";

import { createPost, getPostsForPage } from "@/lib/data";
import RandomizedImage, {
  generateRandomParams,
} from "@/components/RandomizedImage";

import dynamic from "next/dynamic";
// Dynamically import the RichTextEditor with SSR disabled
const RichTextEditor = dynamic(() => import("./page/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[150px] rounded-xl bg-neumorphic-bg shadow-neumorphic-inset animate-pulse"></div>
  ),
});

/**
 * MeditationTimerModal
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onFinish?: (summary: { initialMinutes: number; extraMinutesAdded: number; totalElapsedMs: number }) => void
 * - defaultMinutes?: number (default 15)
 */

const testSettings = {
  bShift: -19,
  backgroundColor: "#d8e8e5",
  gShift: -11,
  offsetX: 6.208200019107846,
  offsetY: -7.717280578508823,
  rShift: 32,
  rotationAngle: -6.935702624417267,
  scale: 1.230609125506053,
};

const initialFormData = {
  title: "",
  description: "",
  thumbnail: testSettings,
  content_type: "text",
  content: "",
};

export default function MeditationTimerModal({
  isOpen,
  onClose,
  onFinish,
  defaultMinutes = 15,
  posts,
}) {
  // Core state
  const [formData, setFormData] = useState(initialFormData);
  const [initialMinutes, setInitialMinutes] = useState(defaultMinutes);
  const [remainingMs, setRemainingMs] = useState(defaultMinutes * 60_000);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [extraMinutesAdded, setExtraMinutesAdded] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for drift-free ticking
  const lastTickRef = useRef(null); // number | null
  const rafIdRef = useRef(null); // number | null
  const isRunningRef = useRef(isRunning);

  // Audio ref for bell sound
  const bellSoundRef = useRef(null);
  // Track whether audio is currently playing
  const audioPlayingRef = useRef(false);
  // Keep original volume to restore for future plays
  const originalVolumeRef = useRef(1);
  // Any active fade interval id
  const fadeIntervalRef = useRef(null);

  // Preload the audio once
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setIsSubmitting(false);
    }

    const audio = new Audio("/sounds/bell.mp3");
    audio.preload = "auto";
    // default volume
    audio.volume = 1;
    bellSoundRef.current = audio;
    originalVolumeRef.current = audio.volume ?? 1;

    // listen for play/pause to update audioPlayingRef
    const onPlay = () => (audioPlayingRef.current = true);
    const onPause = () => (audioPlayingRef.current = false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      stopFade();
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
      bellSoundRef.current = null;
    };
  }, []);

  // Keep isRunningRef in sync with state
  useEffect(() => {
    isRunningRef.current = isRunning;
    if (!isRunning) {
      stopLoop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Reset everything whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setInitialMinutes(defaultMinutes);
      setRemainingMs(defaultMinutes * 60_000);
      setIsRunning(false);
      setHasStarted(false);
      setShowEndDialog(false);
      setExtraMinutesAdded(0);
      cancelLoop();
    } else {
      // If modal is closing via external prop change, fade out audio if it's playing
      fadeOutAndStop();
      cancelLoop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultMinutes]);

  // Keep remainingMs in sync with initialMinutes before start
  useEffect(() => {
    if (!hasStarted) {
      setRemainingMs(initialMinutes * 60_000);
    }
  }, [initialMinutes, hasStarted]);

  // Helpers for fade out
  const stopFade = () => {
    if (fadeIntervalRef.current != null) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  //   const refreshPosts = useCallback(async (pageId) => {
  //     if (!pageId) return;
  //     const postData = await getPostsForPage(pageId);
  //     //setPosts(postData); ////////////////////////////////////////////////// might cause a problem
  //   }, []);

  const handleLogMeditation = async (postData) => {
    //if (!(isOwner || isPublic) || !page) return;
    const pageId = "ydjMegPH6bkrrkzjvkHY"; // hardcoded meditation page for now
    try {
      const maxOrder =
        posts.length > 0
          ? Math.max(...posts.map((p) => p.order_index || 0))
          : 0;
      await createPost({
        ...postData,
        page_id: pageId,
        order_index: maxOrder + 1,
      });
      //   await refreshPosts(pageId);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleSubmit = async (e, postData) => {
    console.log("Submitting form");
    // Make this function async
    e.preventDefault();
    console.log("starting submission");
    //if (!formData.title.trim() || !formData.content.trim()) return;

    // Prevent function from running again if it's already submitting
    if (isSubmitting) return;

    setIsSubmitting(true); // Disable the button immediately
    try {
      // The parent component's onSubmit function is now awaited
      console.log(postData);
      await handleLogMeditation(postData);
    } catch (error) {
      console.error("Submission failed:", error);
      // Optionally show an error alert to the user
      alert("Failed to create post. Please try again.");
    } finally {
      // This block runs whether the submission succeeded or failed
      // Re-enable the button for future attempts (e.g., if there was an error)
      setIsSubmitting(false);
      console.log("submitted");
    }
  };

  const finishMeditation = async () => {
    // Fade out any playing bell before finishing
    if (audioPlayingRef.current) {
      await fadeOutAndStop(600);
    }

    const totalElapsed =
      initialMinutes * 60_000 + extraMinutesAdded * 60_000 - remainingMs;
    if (typeof onFinish === "function") {
      onFinish({
        initialMinutes,
        extraMinutesAdded,
        totalElapsedMs: Math.max(totalElapsed, 0),
      });
    }
    setFormData(initialFormData);
    setShowEndDialog(false);
    setIsRunning(false);
    isRunningRef.current = false;
    cancelLoop();
    onClose?.();
  };

  function getTimeOfDay() {
    const now = new Date();
    const hour = now.getHours(); // 0–23

    if (hour >= 5 && hour < 8) {
      return " minutes - early morning";
    } else if (hour >= 8 && hour < 12) {
      return " minutes - morning";
    } else if (hour >= 12 && hour < 17) {
      return " minutes - afternoon";
    } else if (hour >= 17 && hour < 21) {
      return " minutes - evening";
    } else {
      return " minutes - night";
    }
  }

  const logMeditation = async (e) => {
    e.preventDefault();

    const time_meditated =
      initialMinutes + extraMinutesAdded - remainingMs / 60_000;

    // Convert total minutes (float) to total seconds
    const totalSeconds = Math.floor(time_meditated * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Format as "m:ss" (e.g. "5:03")
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    setFormData((prev) => ({
      ...prev,
      description: e.target.value,
    }));

    let postData = { ...formData, title: formattedTime + getTimeOfDay() };
    console.log(generateRandomParams());
    postData = { ...postData, thumbnail: generateRandomParams() };
    console.log(postData, "post data");
    await handleSubmit(e, postData);

    await finishMeditation();
  };

  const fadeOutAndStop = (duration = 800) => {
    // returns a Promise that resolves when fade completes and audio is paused/reset
    const audio = bellSoundRef.current;
    stopFade();
    if (!audio) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const startVol = Math.max(
          0,
          audio.volume ?? originalVolumeRef.current ?? 1
        );
        const steps = Math.max(6, Math.round(duration / 50));
        const stepDelta = startVol / steps;
        let currentStep = 0;

        fadeIntervalRef.current = setInterval(() => {
          currentStep += 1;
          const nextVol = Math.max(0, startVol - stepDelta * currentStep);
          audio.volume = nextVol;
          if (currentStep >= steps) {
            stopFade();
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (e) {
              // ignore
            }
            audio.volume = originalVolumeRef.current ?? 1;
            audioPlayingRef.current = false;
            resolve();
          }
        }, Math.max(10, Math.round(duration / steps)));
      } catch (e) {
        resolve();
      }
    });
  };

  // Ticking logic with requestAnimationFrame — use ref for current running state
  const loop = (now) => {
    if (!isRunningRef.current) return; // safety guard

    if (lastTickRef.current == null) {
      lastTickRef.current = now;
    }

    const delta = now - lastTickRef.current; // ms
    lastTickRef.current = now;

    setRemainingMs((prev) => {
      const next = Math.max(prev - delta, 0);
      if (next === 0) {
        // Stop and show dialog and play bell
        isRunningRef.current = false;
        setIsRunning(false);
        setShowEndDialog(true);
        stopLoop();

        // Try to play bell; if blocked, reset time and try again
        const audio = bellSoundRef.current;
        if (audio) {
          audio
            .play()
            .then(() => {
              audioPlayingRef.current = true;
            })
            .catch((err) => {
              // fallback: reset and try again (non-blocking)
              try {
                audio.currentTime = 0;
                audio.play().then(() => {
                  audioPlayingRef.current = true;
                });
              } catch (e2) {
                console.warn("Bell playback completely blocked:", e2);
              }
            });
        }
      }
      return next;
    });

    // schedule next frame only if still running (check ref)
    if (isRunningRef.current) {
      rafIdRef.current = requestAnimationFrame(loop);
    } else {
      rafIdRef.current = null;
    }
  };

  const startLoop = () => {
    if (rafIdRef.current != null) return; // already running
    lastTickRef.current = null;
    isRunningRef.current = true; // ensure ref is set before starting RAF
    rafIdRef.current = requestAnimationFrame(loop);
  };

  const stopLoop = () => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isRunningRef.current = false;
    lastTickRef.current = null;
  };

  const cancelLoop = () => {
    stopLoop();
    lastTickRef.current = null;
  };

  // Controls
  const handleStart = () => {
    if (remainingMs <= 0) return;
    setHasStarted(true);
    setIsRunning(true);

    // PRIME the audio during this user gesture so later playback is allowed
    const audio = bellSoundRef.current;
    if (audio) {
      // Attempt to play then immediately pause/reset — this usually "unlocks" autoplay permission.
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = originalVolumeRef.current ?? 1;
        })
        .catch((err) => {
          // priming failed — that's okay, we'll still attempt to play at the end and handle errors.
          console.debug("Audio priming failed:", err?.message || err);
        });
    }

    startLoop();
  };

  const handlePause = () => {
    setIsRunning(false);
    stopLoop();
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setShowEndDialog(false);
    setExtraMinutesAdded(0);
    setRemainingMs(initialMinutes * 60_000);
    cancelLoop();
  };

  const addMoreMinutes = (mins) => {
    // If bell is currently playing, fade it out gracefully
    if (audioPlayingRef.current) {
      fadeOutAndStop(600).catch(() => {});
    }

    const addMs = mins * 60_000;
    setRemainingMs((prev) => prev + addMs);
    setExtraMinutesAdded((prev) => prev + mins);
    setShowEndDialog(false);
    setHasStarted(true);
    setIsRunning(true);
    startLoop();
  };

  // Close handler used by X and Close button — ensures audio fades out
  const handleClose = async () => {
    // if bell is playing, fade it out first
    if (audioPlayingRef.current) {
      await fadeOutAndStop(600);
    }

    // also stop the timer loop
    setIsRunning(false);
    isRunningRef.current = false;
    cancelLoop();

    onClose?.();
  };

  // Incrementers (pre-start only)
  const decMinute = () => setInitialMinutes((m) => Math.max(1, m - 1));
  const incMinute = () => setInitialMinutes((m) => Math.min(120, m + 1));

  const formatMs = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Meditation timer"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          // ESC pauses (if running) and closes
          if (isRunning) handlePause();
          handleClose();
        }
        if (!hasStarted) {
          if (e.key === "ArrowLeft") decMinute();
          if (e.key === "ArrowRight") incMinute();
        }
      }}
    >
      <div className="bg-neumorphic-bg rounded-2xl shadow-neumorphic p-6 w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-neumorphic">
            Meditation Timer
          </h2>
          <button
            aria-label="Close"
            onClick={() => {
              if (isRunning) handlePause();
              handleClose();
            }}
            className="p-2 rounded-lg btn-neumorphic shadow-neumorphic hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
          >
            <X className="w-5 h-5 text-neumorphic-text" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Time + Incrementers (pre-start only) */}
          <div className="flex items-center gap-4">
            {!hasStarted && (
              <button
                aria-label="Decrease minutes"
                onClick={decMinute}
                className="p-3 rounded-xl btn-neumorphic shadow-neumorphic hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
              >
                <Minus className="w-4 h-4 text-neumorphic-text" />
              </button>
            )}

            <div className="min-w-[220px] text-center select-none rounded-2xl shadow-neumorphic-inset px-6 py-6 font-mono text-5xl text-neumorphic-text tracking-widest">
              {formatMs(remainingMs)}
            </div>

            {!hasStarted && (
              <button
                aria-label="Increase minutes"
                onClick={incMinute}
                className="p-3 rounded-xl btn-neumorphic shadow-neumorphic hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
              >
                <Plus className="w-4 h-4 text-neumorphic-text" />
              </button>
            )}
          </div>

          <div className="text-sm text-neumorphic-text/70 h-5">
            {isRunning ? "running" : hasStarted ? "paused" : "ready"}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-neumorphic-shadow-dark/20">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasStarted && remainingMs === initialMinutes * 60_000}
            className="flex-1 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text disabled:opacity-50 hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
          >
            Reset
          </button>

          {isRunning ? (
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={remainingMs <= 0}
              className="flex-1 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium disabled:opacity-50 hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
            >
              Start
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isRunning) handlePause();
              setShowEndDialog(true);
              setFormData(initialFormData);
            }}
            className="flex-1 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
          >
            Fin
          </button>
        </div>

        {/* End-of-session popup */}
        {showEndDialog && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative bg-neumorphic-bg rounded-2xl shadow-neumorphic p-6 w-full max-w-sm">
              <h3 className="text-base font-semibold text-neumorphic mb-3">
                Session complete
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => addMoreMinutes(0)}
                  className="w-full py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
                >
                  Continue
                </button>

                <button
                  onClick={() => addMoreMinutes(5)}
                  className="w-full py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
                >
                  +5 minutes
                </button>
                <button
                  onClick={() => addMoreMinutes(10)}
                  className="w-full py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
                >
                  +10 minutes
                </button>

                <form
                  id="log-meditation-form"
                  onSubmit={logMeditation}
                  className=""
                >
                  <input
                    type="text"
                    defaultValue=""
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-neumorphic-bg shadow-neumorphic-inset text-neumorphic-text placeholder-neumorphic-text/70 focus:outline-none"
                    placeholder="First name / nickname"
                  />

                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) =>
                      setFormData((prev) => ({ ...prev, content }))
                    }
                    placeholder="How was your meditation? (click to type)"
                  />
                </form>

                <button
                  type="submit"
                  form="log-meditation-form" // This associates the button with the form
                  className="w-full py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging..." : "Log meditation"}
                </button>

                <button
                  onClick={finishMeditation}
                  className="w-full py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
                >
                  Dont log
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
