"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { uploadFile } from "@/lib/data";
import ImageWithLoader from "@/components/ImageWithLoader";

const initialFormData = {
  title: "",
  description: "",
  thumbnail: "",
  isPrivate: false,
};

export default function CreatePageModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState(initialFormData);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // When the modal is opened, reset the form data and uploading status
    if (isOpen) {
      setFormData(initialFormData);
      setUploading(false);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    // Reset form and close modal is handled by the parent component now
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // This will use our mock function for now
      const file_url = await uploadFile(file, "page-thumbnails"); // Added path
      setFormData((prev) => ({ ...prev, thumbnail: file_url }));
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. See console for details.");
    }
    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-neumorphic-bg rounded-2xl shadow-neumorphic p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-neumorphic">Create New Page</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg btn-neumorphic shadow-neumorphic hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
          >
            <X className="w-5 h-5 text-neumorphic-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neumorphic mb-2">
              Page Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl bg-neumorphic-bg shadow-neumorphic-inset text-neumorphic-text placeholder-neumorphic-text focus:outline-none"
              placeholder="Enter page title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neumorphic mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-neumorphic-bg shadow-neumorphic-inset text-neumorphic-text placeholder-neumorphic-text focus:outline-none resize-none"
              placeholder="Enter page description"
              rows="3"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isPrivateCheckbox"
              checked={formData.isPrivate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isPrivate: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded bg-neumorphic-bg shadow-neumorphic-inset appearance-none checked:bg-blue-500 cursor-pointer"
            />
            <label
              htmlFor="isPrivateCheckbox"
              className="text-sm font-medium text-neumorphic cursor-pointer"
            >
              Make this page private
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-neumorphic mb-2">
              Thumbnail Image
            </label>
            <div className="flex items-center gap-4">
              {formData.thumbnail ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden shadow-neumorphic-inset">
                  <ImageWithLoader
                    src={formData.thumbnail}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-neumorphic-bg shadow-neumorphic-inset flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-neumorphic-text" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg btn-neumorphic shadow-neumorphic text-sm text-neumorphic-text cursor-pointer hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!formData.title.trim() || uploading}
            >
              Create Page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
