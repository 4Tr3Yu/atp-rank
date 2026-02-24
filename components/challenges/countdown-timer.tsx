"use client";

import { useState, useEffect } from "react";

export function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now())
  );

  useEffect(() => {
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(ms);
      if (ms <= 0) clearInterval(interval);
    }, 60_000);

    return () => clearInterval(interval);
  }, [expiresAt, remaining]);

  if (remaining <= 0) {
    return <span className="text-xs font-medium text-red-400">Expired</span>;
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  let color = "text-muted-foreground";
  if (hours < 1) color = "text-red-400";
  else if (hours < 4) color = "text-orange-400";

  const label = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;

  return <span className={`text-xs font-medium ${color}`}>{label}</span>;
}
