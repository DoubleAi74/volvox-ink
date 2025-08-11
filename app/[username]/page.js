"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus } from "lucide-react";
import PageCard from "@/components/dashboard/PageCard";
import CreatePageModal from "@/components/dashboard/CreatePageModal";
import EditPageModal from "@/components/dashboard/EditPageModal";
import {
  createPage,
  deletePage,
  getPages,
  updatePage,
  getUserByUsername,
} from "@/lib/data";

export default function UserDashboard({ params }) {
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwner =
    currentUser && profileUser && currentUser.uid === profileUser.uid;

  // This function is now only responsible for fetching pages for a given user.
  // The decision of *which* pages to fetch (public vs all) is made in lib/data.js
  const refreshPages = useCallback(
    async (userId) => {
      const userPages = await getPages(userId, isOwner);
      setPages(userPages);
    },
    [isOwner]
  );

  // This single useEffect now handles the entire loading process.
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setProfileUser(null);
      setPages([]);

      const user = await getUserByUsername(params.username);
      setProfileUser(user);

      if (user) {
        // We know the user exists, so we can now check if we are the owner
        const isCurrentUserOwner = currentUser && currentUser.uid === user.uid;
        // Fetch pages, telling the function whether to include private ones
        const userPages = await getPages(user.uid, isCurrentUserOwner);
        setPages(userPages);
      }

      // Only set loading to false after all async operations are complete.
      setLoading(false);
    };

    fetchAllData();
    // We re-run this entire effect if the username param changes OR if the logged-in user changes.
  }, [params.username, currentUser]);

  const handleCreatePage = async (pageData) => {
    if (!isOwner || !profileUser) return;
    try {
      const maxOrder =
        pages.length > 0
          ? Math.max(...pages.map((p) => p.order_index || 0))
          : 0;
      await createPage(
        { ...pageData, order_index: maxOrder + 1 },
        profileUser.uid
      );
      setShowCreateModal(false);
      // Pass the UID to ensure we refresh for the correct user
      await refreshPages(profileUser.uid);
    } catch (error) {
      console.error("Failed to create page:", error);
      alert("Failed to create page.");
    }
  };

  const handleEditPage = async (pageData) => {
    if (!isOwner || !editingPage || !profileUser) return;
    try {
      await updatePage(editingPage.id, pageData, pages);
      setEditingPage(null);
      // Pass the UID to ensure we refresh for the correct user
      await refreshPages(profileUser.uid);
    } catch (error) {
      console.error("Failed to update page:", error);
      alert("Failed to update page.");
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!isOwner || !profileUser) return;
    if (
      confirm(
        "Are you sure you want to delete this page? This cannot be undone."
      )
    ) {
      try {
        await deletePage(pageId, pages);
        // Pass the UID to ensure we refresh for the correct user AFTER deletion is complete
        await refreshPages(profileUser.uid);
      } catch (error) {
        console.error("Failed to delete page:", error);
        alert("Failed to delete page.");
      }
    }
  };

  // This render logic now works correctly.
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-neumorphic-bg shadow-neumorphic-inset animate-pulse"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-16 text-center text-xl text-neumorphic">
        Looking for {params.username + "'s"} page.
      </div>
    );
  }

  // The rest of the component's JSX remains the same.
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neumorphic mb-2">
              {params.username + "'s"} Pages
            </h1>
            {isOwner && (
              <p className="text-neumorphic">
                This is your public dashboard. Welcome!
              </p>
            )}
          </div>
          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
            >
              <Plus className="w-5 h-5" />
              New Page
            </button>
          )}
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-neumorphic">
              No public pages.
            </h3>
            {isOwner && (
              <p className="text-neumorphic-text mt-2">
                Create your first one to get started!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                isOwner={isOwner}
                username={params.username}
                onDelete={() => handleDeletePage(page.id)}
                onEdit={() => setEditingPage(page)}
              />
            ))}
          </div>
        )}

        {isOwner && (
          <>
            <CreatePageModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreatePage}
            />
            <EditPageModal
              isOpen={!!editingPage}
              page={editingPage}
              onClose={() => setEditingPage(null)}
              onSubmit={handleEditPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
