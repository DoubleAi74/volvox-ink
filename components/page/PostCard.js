"use client";

import React from "react";
import Link from "next/link";
import {
  Edit3,
  Trash2,
  FileText,
  ExternalLink,
  Type,
  File,
} from "lucide-react";
import { format } from "date-fns";

import RandomizedImage, {
  generateRandomParams,
} from "@/components/RandomizedImage";

const contentTypeIcons = {
  text: Type,
  file: File,
  url: ExternalLink,
};

const PostContentWrapper = ({ post, children, username, pageSlug }) => {
  if (post.content_type === "text") {
    return (
      <Link href={`/${username}/${pageSlug}/${post.slug}`}>{children}</Link>
    );
  }
  if (post.content_type === "url" || post.content_type === "file") {
    return (
      <a href={post.content} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <div>{children}</div>;
};

export default function PostCard({
  post,
  onEdit,
  onDelete,
  isOwner,
  username,
  pageSlug,
}) {
  const ContentIcon = contentTypeIcons[post.content_type] || FileText;

  return (
    <div className="group relative">
      <PostContentWrapper post={post} username={username} pageSlug={pageSlug}>
        <div className="p-2 rounded-lg bg-[#f7f3ed]  shadow-md hover:shadow-neumorphic-soft transition-all duration-300 cursor-pointer h-full flex flex-col">
          {pageSlug === "meditations" ? (
            <div className="w-full aspect-[16/9] mb-4 rounded-md overflow-hidden">
              <RandomizedImage
                imageSrc="/logo-lotus4.png"
                params={post.thumbnail}
                width={800}
                imgProps={{ className: "rounded-lg shadow-md" }}
              />
            </div>
          ) : post.thumbnail ? (
            <div className="w-full aspect-[16/9] mb-4 rounded-md overflow-hidden">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/9] mb-4 rounded-md shadow-md bg-neumorphic-bg flex items-center justify-center flex items-center justify-center">
              <ContentIcon className="w-8 h-8 text-neumorphic-text" />
            </div>
          )}

          <div className="px-4 pb-4 pt-1">
            <div className="flex-grow">
              <h3 className="font-semibold text-neumorphic text-lg mb-2 truncate">
                {post.title}
              </h3>
              {post.description && (
                <p className="text-sm text-neumorphic-text mb-3 line-clamp-2">
                  {post.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-neumorphic-text mt-2">
              <div className="flex items-center gap-1">
                <ContentIcon className="w-3 h-3" />
                <span className="capitalize">{post.content_type}</span>
              </div>
              <span>{format(new Date(post.created_date), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </PostContentWrapper>

      {isOwner && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
            className="p-2 rounded-lg bg-neumorphic-bg shadow-neumorphic hover:shadow-neumorphic-pressed"
          >
            <Edit3 className="w-4 h-4 text-neumorphic-text" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="p-2 rounded-lg bg-neumorphic-bg shadow-neumorphic hover:shadow-neumorphic-pressed"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}
