import React from "react";

export default function RequestTimeline({ request }) {
  if (!request?.timeline?.length) return null;
  const items = [...request.timeline].sort(
    (a, b) => new Date(a.at) - new Date(b.at)
  );
  const label = (a) =>
    ({
      created: "Created",
      reviewed: "Reviewed",
      scheduled: "Scheduled",
      in_progress: "In progress",
      resolved: "Resolved",
      comment: "Comment",
    }[a] || a);

  return (
    <ol className="relative border-l pl-6">
      {items.map((t, i) => (
        <li key={i} className="mb-4">
          <div className="absolute -left-2.5 mt-1 w-2 h-2 bg-gray-400 rounded-full" />
          <div className="text-sm text-gray-600">
            {new Date(t.at).toLocaleString()}
          </div>
          <div className="font-medium">{label(t.action)}</div>
          {t.note && <div className="text-sm text-gray-700">{t.note}</div>}
        </li>
      ))}
    </ol>
  );
}
