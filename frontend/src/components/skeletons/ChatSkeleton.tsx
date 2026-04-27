import React from "react";
import { cn } from "@/lib/theme";

function Bone({ className }: { className?: string }) {
  return <div className={cn("bg-gray-200 rounded animate-pulse", className)} />;
}

/** A single skeleton message bubble */
function SkeletonBubble({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && <Bone className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />}
      <div
        className={`flex flex-col gap-1 max-w-[60%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <Bone
          className={`h-10 rounded-2xl ${
            isUser ? "w-48 rounded-tr-sm" : "w-64 rounded-tl-sm"
          }`}
        />
        {!isUser && <Bone className="h-3 w-32 mt-1" />}
      </div>
    </div>
  );
}

/** Full chat page skeleton */
export function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden animate-pulse">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex flex-col w-72 border-r border-gray-200 bg-white p-4 gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <Bone className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Bone className="h-4 w-16" />
            <Bone className="h-3 w-24" />
          </div>
        </div>
        {/* Quick prompts */}
        <div className="space-y-2">
          <Bone className="h-3 w-20 mb-3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        {/* Profile card */}
        <div className="mt-auto">
          <Bone className="h-24 w-full rounded-xl" />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
          <Bone className="w-9 h-9 rounded-full" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-20" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-8 py-6 space-y-5 bg-gray-50">
          <SkeletonBubble isUser={false} />
          <SkeletonBubble isUser={true} />
          <SkeletonBubble isUser={false} />
          <SkeletonBubble isUser={true} />
          <SkeletonBubble isUser={false} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white px-8 py-4">
          <div className="flex items-end gap-3">
            <Bone className="flex-1 h-12 rounded-xl" />
            <Bone className="w-12 h-12 rounded-xl flex-shrink-0" />
          </div>
          <Bone className="h-3 w-48 mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
}
