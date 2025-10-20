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
  editModeOn,
  username,
  pageSlug,
}) {
  const ContentIcon = contentTypeIcons[post.content_type] || FileText;

  if (pageSlug === "meditations") {
    console.log(
      post.slug,
      "rando",
      post.thumbnail,
      typeof post.thumbnail === "string"
    );
  } else {
    if (post.thumbnail) {
      console.log(post.slug, "thumb");
    } else {
      console.log(post.slug, "no thumb");
    }
  }

  return (
    <div className="group relative">
      <PostContentWrapper post={post} username={username} pageSlug={pageSlug}>
        <div className="p-2 rounded-lg bg-[#f7f3ed]  shadow-md hover:shadow-neumorphic-soft transition-all duration-300 cursor-pointer h-full flex flex-col">
          {pageSlug === "meditations" &&
          !(typeof post.thumbnail === "string") ? (
            <div className="w-full aspect-[16/9] mb-2 rounded-md overflow-hidden">
              <RandomizedImage
                imageSrc="/logo-lotus4.png"
                params={post.thumbnail}
                width={800}
                imgProps={{ className: "rounded-md shadow-md" }}
              />
            </div>
          ) : post.thumbnail ? (
            <div className="w-full aspect-[16/9] mb-2 rounded-md overflow-hidden">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/9] mb-2 rounded-md shadow-md bg-neumorphic-bg flex items-center justify-center flex items-center justify-center">
              <ContentIcon className="w-8 h-8 text-neumorphic-text" />
            </div>
          )}

          <div className="px-4 pb-2 pt-1">
            <div className="flex-grow">
              <h3 className="font-semibold text-[#71716f] text-lg lg:text-lg text-left xl:text-sm mb-2 truncate">
                {post.title}
              </h3>
              {post.description && (
                <div className="flex items-center">
                  <p className="text-sm text-neumorphic-text  w-2/3 line-clamp-1">
                    {post.description}
                  </p>
                  <span className="w-1/3  text-xs text-neumorphic-text text-right translate-y-[1px] line-clamp-1">
                    {format(new Date(post.created_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </PostContentWrapper>

      {isOwner && editModeOn && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-70 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
            className="p-2 rounded-lg bg-[#f0efee] shadow-md hover:shadow-neumorphic-pressed"
          >
            <Edit3 className="w-4 h-4 text-neumorphic-text" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="p-2 rounded-lg bg-[#f0efee] shadow-md hover:shadow-neumorphic-pressed"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}
