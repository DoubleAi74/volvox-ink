"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Plus, LogOut, ArrowLeft, User as UserIcon } from "lucide-react";
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
// <-- ADDED: Meditation timer modal (adjust path if your project stores it elsewhere)
import MeditationTimerModal from "@/components/MeditationTimerModal";

import PageInfoEditor from "@/components/page/PageInfoEditor";

import RandomizedImage, {
  generateRandomParams,
} from "@/components/RandomizedImage";

import Image from "next/image";

export default function PageSlugView({ params }) {
  const { username, pageSlug } = params;
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isPublic, setPublicPage] = useState(false);
  const [editOn, setEditOn] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  // NEW: state for meditation modal
  const [showMeditationModal, setShowMeditationModal] = useState(false);

  const refreshPosts = useCallback(async (pageId) => {
    if (!pageId) return;
    const postData = await getPostsForPage(pageId);
    setPosts(postData);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // open modal if ?meditate=1 or ?meditate=true
    const meditate = searchParams.get("meditate");
    if (meditate === "1" || meditate === "true") {
      setShowMeditationModal(true);

      // remove the param from the URL without adding a new history entry
      // (router.replace with just pathname strips query)
      // Note: router.replace will trigger a navigation within App Router but
      // without reloading data if pathname is the same.
      router.replace(pathname);
    }
    // only run when searchParams changes
  }, [searchParams, pathname, router]);

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);

      const profileUser = await getUserByUsername(params.username);
      setProfileUser(profileUser); // Added this for the PageInfoEditor component

      if (profileUser) {
        const pageData = await getPageBySlug(profileUser.uid, pageSlug);
        //console.log(pageData);
        setPage(pageData);
        if (pageData) {
          await refreshPosts(pageData.id);
          setIsOwner(currentUser && currentUser.uid === profileUser.uid);
          setPublicPage(pageData.isPublic);
        }
      }
      setLoading(false);
    };
    loadPageData();
  }, [username, pageSlug, currentUser, refreshPosts]);

  const handleCreatePost = async (postData) => {
    if (!(isOwner || isPublic) || !page) return;

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
        <div className="w-36 h-36 rounded-full bg-[#f7f3ed] flex items-center justify-center shadow-neumorphic-inset animate-pulse">
          <Image
            src="/logo-lotus.png" // <- file in public/
            alt="Logo"
            width={100}
            height={100}
          />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <>
        <div className="p-16 text-center text-xl text-neumorphic">
          Page not found.
        </div>

        <MeditationTimerModal
          isOpen={true}
          onClose={() => {
            setShowMeditationModal(false);
          }}
          defaultMinutes={15}
          posts={posts}
        />

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <h1 className="text-2xl mb-4">Randomized Image Example</h1>
          <RandomizedImage
            imageSrc="/logo-lotus4.png"
            params={{
              bShift: -19,
              backgroundColor: "#d8e8e5",
              gShift: -11,
              offsetX: 6.208200019107846,
              offsetY: -7.717280578508823,
              rShift: 32,
              rotationAngle: -6.935702624417267,
              scale: 1.230609125506053,
            }}
            width={800}
            imgProps={{ className: "rounded-lg shadow-md" }}
          />
        </div>
      </>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* THIS ENTIRE HEADER SECTION HAS BEEN RESTORED */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Link href={`/${username}`}>
            <button className="p-3 w-full md:w-auto rounded-xl bg-[#f7f3ed] shadow-md hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed">
              <ArrowLeft className="w-5 h-5 text-neumorphic-text mx-auto md:mx-0" />
            </button>
          </Link>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-neumorphic">{page.title}</h1>
            {page.description && (
              <p className="text-neumorphic-text mt-1">{page.description}</p>
            )}
          </div>

          {/* NEW: Buttons area (Create Post + Meditate Now) */}

          <div className="flex items-center gap-3 w-full md:w-auto">
            {username === "the-lotus-seed" && pageSlug === "meditations" && (
              <button
                onClick={() => setShowMeditationModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[#313232] shadow-md bg-[#aad8d3] text-neumorphic-text font-medium   shadow-md border-2 border-[#80a4a0]/30 hover:border-[#58817c] bg-[#aad8d3] text-[#545656] active:shadow-neumorphic-pressed"
                aria-label="Meditate now"
              >
                Meditate now
              </button>
            )}
            {(isOwner || isPublic) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl  shadow-md bg-[#f7f3ed] text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
              >
                <Plus className="w-5 h-5" />
                New Post
              </button>
            )}
          </div>
        </div>

        <div className="w-4/5">
          <PageInfoEditor pid={page?.id} canEdit={isOwner} editOn={editOn} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...posts].reverse().map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isOwner={isOwner}
                editModeOn={editOn}
                username={params.username}
                pageSlug={params.pageSlug}
                //
                onEdit={() => setEditingPost(post)}
                onDelete={() => handleDeletePost(post.id)}
              />
            ))}
          </div>
        )}
        {isOwner ? (
          <>
            <CreatePostModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreatePost}
              lotusThumb={pageSlug === "meditations"}
            />
            <EditPostModal
              isOpen={!!editingPost}
              post={editingPost}
              onClose={() => setEditingPost(null)}
              onSubmit={handleEditPost}
            />
          </>
        ) : isPublic ? (
          (console.log("Public page - show create post modal"),
          (
            <>
              <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreatePost}
                lotusThumb={pageSlug === "meditations"}
              />
            </>
          ))
        ) : (
          <></>
        )}
        {isOwner && (
          <div className="hidden md:flex items-center gap-4 mt-4 fixed bottom-6 right-8 z-[100]">
            {/* Toggle edit mode */}

            {editOn ? (
              <button
                onClick={() => setEditOn(!editOn)}
                className="flex  text-sm items-center gap-2 px-4 py-2 rounded-xl bg-[#0e4f19] shadow-md text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed h-[44px]" // same height across all
              >
                <div className="text-white">Edit: on</div>
              </button>
            ) : (
              <button
                onClick={() => setEditOn(!editOn)}
                className="flex text-sm items-center gap-2 px-4 py-2 rounded-xl bg-[#f7f3ed] shadow-md text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed h-[44px]" // same height across all
              >
                <div>Edit: off</div>
              </button>
            )}

            {/* User Info + Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#f7f3ed] shadow-md text-neumorphic-text h-[44px]">
                <UserIcon className="w-5 h-5" />
                <span className="text-sm">{currentUser.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center px-6 py-2 rounded-xl bg-[#f7f3ed] shadow-md text-neumorphic-text hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed h-[44px]"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {/* NEW: Meditation timer modal. It will close when the modal calls onClose (e.g. X) */}
        <MeditationTimerModal
          isOpen={showMeditationModal}
          onClose={() => {
            setShowMeditationModal(false);
            refreshPosts(page.id);
          }}
          defaultMinutes={15}
          posts={posts}
        />
      </div>
    </div>
  );
}
