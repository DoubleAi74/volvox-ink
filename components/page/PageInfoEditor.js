// components/dashboard/DashboardInfoEditor.jsx
import React, { useEffect, useState, useRef } from "react";
import { fetchUserPage, listenUserPage, saveUserPage } from "@/lib/data"; // adjust path to match your project

/**
 * Props:
 *  - uid: string | null  -> the target user's uid whose dashboard info we should show
 *  - canEdit: boolean    -> whether to show editor UI (defaults to false)
 */
export default function PageInfoEditor({
  pid,
  canEdit = false,
  editOn = true,
}) {
  const [text, setText] = useState("");
  const [serverText, setServerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const saveTimer = useRef(null);
  //   const [editOn, setEditOn] = useState(false);

  useEffect(() => {
    let unsub;

    async function init() {
      if (!pid) {
        setText("");
        setServerText("");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1) prefetch once for snappy load
        const initialData = await fetchUserPage(pid);
        if (initialData) {
          const info = initialData.infoText ?? "";
          setText(info);
          setServerText(info);
        } else {
          setText("");
          setServerText("");
        }

        // 2) then subscribe for live updates
        unsub = listenUserPage(pid, (data) => {
          const remote = data?.infoText ?? "";
          setServerText(remote);
          // don't clobber local edits: only overwrite if the previous local value matched last-known serverText.
          setText((prev) => (prev === serverText ? remote : prev));
          setLoading(false);
        });
      } catch (err) {
        console.error("Error loading dashboard info:", err);
        setError("Failed to load dashboard info.");
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  // autosave when editable
  useEffect(() => {
    if (!pid || !canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      handleSave();
    }, 1500);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, pid, canEdit]);

  async function handleSave() {
    if (!pid || !canEdit) return;
    if (text === serverText) return;
    setSaving(true);
    setError(null);
    try {
      // we pass editor uid as null here — server rules will enforce auth; if you want to pass editor id,
      // call saveUserDashboard(uid, text, currentUser.uid) from the caller or grab auth here.
      await saveUserPage(pid, text, null);
      setServerText(text);
    } catch (err) {
      console.error("Failed to save dashboard info:", err);
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // Render
  return (
    <section className="mb-6 mt-[-10px] ml-2">
      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : canEdit ? (
        editOn ? ( // Editable UI for owner
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full p-3 border rounded-md resize-none "
              placeholder="Write something for your dashboard..."
            />
            <div className="mt-2 flex items-center gap-3">
              <div
                className={`text-sm ${
                  error ? "text-red-500" : "text-neutral-500"
                }`}
              ></div>
            </div>
            <div className="absolute bottom-5 right-3">
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                {error ?? (text === serverText ? "Saved" : "Unsaved changes")}
              </label>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none relative">
            {serverText ? (
              <div
                className="bg-[#f7efe4] p-3 rounded-md shadow-sm text-[#474747]"
                dangerouslySetInnerHTML={{ __html: serverText }}
              />
            ) : (
              <div className="text-sm text-neutral-500">Welcome</div>
            )}
            {/* Bottom-right checkbox */}
            <div className="absolute top-3 right-3"></div>
          </div>
        )
      ) : (
        // Read-only view for visitors
        <div className="prose max-w-none">
          {serverText ? (
            <div
              className="bg-[#f7efe4] p-3  rounded-md shadow-sm"
              dangerouslySetInnerHTML={{ __html: serverText }}
            />
          ) : (
            <div className="text-sm text-neutral-500">Welcome</div>
          )}
        </div>
      )}
    </section>
  );
}
