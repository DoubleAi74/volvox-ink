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
  username,
}) {
  // Accept new props
  return (
    <div className="group relative">
      <Link href={`/${username}/${page.slug}`}>
        {/* ... (The inner content of the link is unchanged) ... */}
        <div className="p-6 rounded-2xl bg-neumorphic-bg shadow-neumorphic hover:shadow-neumorphic-soft transition-all duration-300 cursor-pointer">
          {page.thumbnail ? (
            <div className="w-full h-32 mb-4 rounded-xl overflow-hidden shadow-neumorphic-inset">
              <img
                src={page.thumbnail}
                alt={page.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-32 mb-4 rounded-xl bg-neumorphic-bg shadow-neumorphic-inset flex items-center justify-center">
              <FileText className="w-8 h-8 text-neumorphic-text" />
            </div>
          )}
          <h3 className="font-semibold text-neumorphic text-lg mb-2 truncate">
            {page.title}
          </h3>
          {page.description && (
            <p className="text-sm text-neumorphic-text mb-3 line-clamp-2">
              {page.description}
            </p>
          )}
          <div className="flex items-center text-xs text-neumorphic-text">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(page.created_date), "MMM d, yyyy")}
          </div>
        </div>
      </Link>

      {/* 3. Add the edit button next to the delete button */}
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
