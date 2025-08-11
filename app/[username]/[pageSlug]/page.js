"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Plus, ArrowLeft } from "lucide-react";
import {
  getUserByUsername,
  getPageBySlug,
  getPostsForPage,
  createPost,
  updatePost,
  deletePost,
} from "@/lib/data";
import PostCard from "@/components/page/PostCard";
import CreatePostModal from "@/components/page/CreatePostModal";
import EditPostModal from "@/components/page/EditPostModal";

export default function PageSlugView({ params }) {
  const { username, pageSlug } = params;
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const refreshPosts = useCallback(async (pageId) => {
    if (!pageId) return;
    const postData = await getPostsForPage(pageId);
    setPosts(postData);
  }, []);

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      const profileUser = await getUserByUsername(username);
      if (profileUser) {
        const pageData = await getPageBySlug(profileUser.uid, pageSlug);
        setPage(pageData);
        if (pageData) {
          await refreshPosts(pageData.id);
          setIsOwner(currentUser && currentUser.uid === profileUser.uid);
        }
      }
      setLoading(false);
    };
    loadPageData();
  }, [username, pageSlug, currentUser, refreshPosts]);

  const handleCreatePost = async (postData) => {
    if (!isOwner || !page) return;
    try {
      const maxOrder =
        posts.length > 0
          ? Math.max(...posts.map((p) => p.order_index || 0))
          : 0;
      await createPost({
        ...postData,
        page_id: page.id,
        order_index: maxOrder + 1,
      });
      await refreshPosts(page.id);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleEditPost = async (postData) => {
    if (!isOwner || !editingPost) return;
    try {
      await updatePost(editingPost.id, postData, posts);
      await refreshPosts(page.id);
      setEditingPost(null);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!isOwner || !page) return; // Added !page guard
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(postId, posts);
        // Ensure we pass page.id to refreshPosts AFTER deletion
        await refreshPosts(page.id);
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Error deleting post.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-neumorphic-bg shadow-neumorphic-inset animate-pulse"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-16 text-center text-xl text-neumorphic">
        Page not found.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* THIS ENTIRE HEADER SECTION HAS BEEN RESTORED */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Link href={`/${username}`}>
            <button className="p-3 w-full md:w-auto rounded-xl btn-neumorphic shadow-neumorphic hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed">
              <ArrowLeft className="w-5 h-5 text-neumorphic-text mx-auto md:mx-0" />
            </button>
          </Link>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-neumorphic">{page.title}</h1>
            {page.description && (
              <p className="text-neumorphic-text mt-1">{page.description}</p>
            )}
          </div>
          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
            >
              <Plus className="w-5 h-5" />
              New Post
            </button>
          )}
        </div>

        {posts.length === 0 ? (
          // THIS DETAILED EMPTY STATE HAS BEEN RESTORED
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-neumorphic-bg shadow-neumorphic-inset flex items-center justify-center">
              <Plus className="w-12 h-12 text-neumorphic-text" />
            </div>
            <h3 className="text-xl font-semibold text-neumorphic mb-2">
              This page is empty
            </h3>
            {isOwner && (
              <>
                <p className="text-neumorphic-text mb-6">
                  Create your first post to get started.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
                >
                  Create First Post
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isOwner={isOwner}
                // ADD THESE TWO LINES BACK
                username={params.username}
                pageSlug={params.pageSlug}
                //
                onEdit={() => setEditingPost(post)}
                onDelete={() => handleDeletePost(post.id)}
              />
            ))}
          </div>
        )}

        {isOwner && (
          <>
            <CreatePostModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreatePost}
            />
            <EditPostModal
              isOpen={!!editingPost}
              post={editingPost}
              onClose={() => setEditingPost(null)}
              onSubmit={handleEditPost}
            />
          </>
        )}
      </div>
    </div>
  );
}
