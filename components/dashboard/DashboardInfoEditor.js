// DashboardInfoEditor.jsx
import { useEffect, useState, useRef } from "react";
import {
  fetchUserDashboard,
  listenUserDashboard,
  saveUserDashboard,
} from "@/lib/data.js";

/**
 * Props:
 *   - uid: string (user's uid)
 */
export default function DashboardInfoEditor({ uid }) {
  const [text, setText] = useState("");
  const [serverText, setServerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    let unsub;

    async function init() {
      if (!uid) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 🔹 1. Prefetch data once before live listener
        const initialData = await fetchUserDashboard(uid);
        if (initialData) {
          const info = initialData.infoText ?? "";
          setText(info);
          setServerText(info);
        }

        // 🔹 2. Then subscribe for real-time updates
        unsub = listenUserDashboard(uid, (data) => {
          const remote = data?.infoText ?? "";
          setServerText(remote);
          // only overwrite local edits if no unsaved local change
          setText((prev) => (prev === serverText ? remote : prev));
          setLoading(false);
        });
      } catch (err) {
        console.error("Error fetching dashboard info:", err);
        setError("Failed to load dashboard info.");
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // 🔹 Autosave on text change (debounced)
  useEffect(() => {
    if (!uid) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      handleSave();
    }, 1500);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  async function handleSave() {
    if (!uid || text === serverText) return;
    setSaving(true);
    setError(null);
    try {
      await saveUserDashboard(uid, text, uid);
      setServerText(text);
    } catch (err) {
      console.error(err);
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>Dashboard info</h3>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
            placeholder="Write something for your dashboard..."
          />
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving || text === serverText}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <div style={{ color: error ? "crimson" : "#666" }}>
              {error ?? (text === serverText ? "Saved" : "Unsaved changes")}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
