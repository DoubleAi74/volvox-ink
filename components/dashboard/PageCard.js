"use client";

import React from "react";
import Link from "next/link";
import { FileText, Calendar, Trash2, Edit3 } from "lucide-react"; // 1. Import Edit3 icon
import { format } from "date-fns";

export default function PageCard({
  page,
  onDelete,
  onEdit,
  isOwner,
  editModeOn,
  username,
}) {
  // Accept new props
  return (
    <div className="group relative">
      <Link href={`/${username}/${page.slug}`}>
        {/* ... (The inner content of the link is unchanged) ... */}
        <div className="p-2 rounded-lg bg-[#f7f3ed] shadow-md hover:shadow-neumorphic-soft transition-all duration-300 cursor-pointer">
          {page.thumbnail ? (
            <div className="w-full aspect-[4/3] mb-4 rounded-md overflow-hidden ">
              <img
                src={page.thumbnail}
                alt={page.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] shadow-md mb-4 rounded-md bg-neumorphic-bg flex items-center justify-center">
              <FileText className="w-8 h-8 text-neumorphic-text" />
            </div>
          )}
          <h3 className=" px-2 font-semibold text-[#5c5c5b] text-lg mb-2 truncate">
            {page.title}
          </h3>
          {page.description && (
            <p className=" px-2 text-sm text-neumorphic-text mb-3 line-clamp-2">
              {page.description}
            </p>
          )}
        </div>
      </Link>

      {/* 3. Add the edit button next to the delete button */}
      {isOwner && editModeOn && (
        <div className="absolute top-4 right-4 flex gap-1 opacity-70 group-hover:opacity-100 transition-all duration-200">
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
