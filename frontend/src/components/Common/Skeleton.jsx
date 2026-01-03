import React from "react";

export const SkeletonCard = () => (
  <div className="rounded-xl border border-border bg-card p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="skeleton h-6 w-32"></div>
      <div className="skeleton h-8 w-24 rounded-full"></div>
    </div>
    <div className="skeleton h-4 w-full"></div>
    <div className="skeleton h-4 w-3/4"></div>
    <div className="flex items-center gap-4 pt-2">
      <div className="skeleton h-10 w-24"></div>
      <div className="skeleton h-10 w-24"></div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="border-b border-border p-4 flex items-center gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-4 w-24"></div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="border-b border-border p-4 flex items-center gap-4"
      >
        <div className="skeleton h-10 w-10 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-48"></div>
          <div className="skeleton h-3 w-32"></div>
        </div>
        <div className="skeleton h-6 w-20 rounded-full"></div>
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ items = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="rounded-lg border border-border bg-card p-4 flex items-center gap-4"
      >
        <div className="skeleton h-12 w-12 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-40"></div>
          <div className="skeleton h-3 w-24"></div>
        </div>
        <div className="skeleton h-8 w-16 rounded-md"></div>
      </div>
    ))}
  </div>
);

export const SkeletonStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="rounded-xl border border-border bg-card p-6 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-20"></div>
          <div className="skeleton h-6 w-6 rounded-full"></div>
        </div>
        <div className="skeleton h-8 w-16"></div>
      </div>
    ))}
  </div>
);
