"use client"

import { useLoading } from "@/lib/loading-context"

export function GlobalLoader() {
  const { isLoading } = useLoading()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Tennis Ball */}
        <div className="animate-bounce-ball">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_20px_var(--primary)]"
          >
            {/* Ball base */}
            <circle cx="32" cy="32" r="30" fill="#c8e620" />

            {/* Tennis ball seam - left curve */}
            <path
              d="M 14 20 Q 8 32 14 44"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Tennis ball seam - right curve */}
            <path
              d="M 50 20 Q 56 32 50 44"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Subtle gradient overlay for 3D effect */}
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="url(#ball-gradient)"
            />

            <defs>
              <radialGradient
                id="ball-gradient"
                cx="0.3"
                cy="0.3"
                r="0.7"
              >
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="black" stopOpacity="0.15" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Shadow on ground */}
        <div className="animate-bounce-shadow h-2 w-12 rounded-full bg-black/30 blur-sm" />
      </div>

      <style jsx>{`
        @keyframes bounce-ball {
          0%, 100% {
            transform: translateY(0) scaleX(1) scaleY(1);
          }
          15% {
            transform: translateY(-50px) scaleX(0.95) scaleY(1.05);
          }
          30% {
            transform: translateY(-70px) scaleX(1) scaleY(1);
          }
          45% {
            transform: translateY(-50px) scaleX(0.95) scaleY(1.05);
          }
          60% {
            transform: translateY(0) scaleX(1) scaleY(1);
          }
          65% {
            transform: translateY(0) scaleX(1.15) scaleY(0.85);
          }
          70% {
            transform: translateY(-10px) scaleX(1) scaleY(1);
          }
          80% {
            transform: translateY(0) scaleX(1.05) scaleY(0.95);
          }
          85% {
            transform: translateY(0) scaleX(1) scaleY(1);
          }
        }

        @keyframes bounce-shadow {
          0%, 100% {
            transform: scaleX(1);
            opacity: 0.3;
          }
          15% {
            transform: scaleX(0.7);
            opacity: 0.15;
          }
          30% {
            transform: scaleX(0.5);
            opacity: 0.1;
          }
          45% {
            transform: scaleX(0.7);
            opacity: 0.15;
          }
          60% {
            transform: scaleX(1);
            opacity: 0.3;
          }
          65% {
            transform: scaleX(1.3);
            opacity: 0.4;
          }
          70% {
            transform: scaleX(0.9);
            opacity: 0.25;
          }
          80% {
            transform: scaleX(1.1);
            opacity: 0.35;
          }
          85% {
            transform: scaleX(1);
            opacity: 0.3;
          }
        }

        .animate-bounce-ball {
          animation: bounce-ball 0.8s ease-in-out infinite;
        }

        .animate-bounce-shadow {
          animation: bounce-shadow 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
