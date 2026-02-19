import type { Tier } from "@/lib/tiers";

/**
 * Octagonal gem SVG that takes tier colors dynamically.
 * Faceted design with highlight and shadow to give depth.
 */
export function TierGem({
  tier,
  size = 16,
  className,
}: {
  tier: Tier;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Octagon outline */}
      <path
        d="M8 1.5 L16 1.5 L22.5 8 L22.5 16 L16 22.5 L8 22.5 L1.5 16 L1.5 8 Z"
        fill={tier.gemFill}
        stroke={tier.gemShadow}
        strokeWidth="1"
      />
      {/* Top-left highlight facet */}
      <path
        d="M8 1.5 L12 12 L1.5 8 Z"
        fill={tier.gemHighlight}
        opacity="0.7"
      />
      {/* Top-right highlight facet */}
      <path
        d="M16 1.5 L12 12 L22.5 8 Z"
        fill={tier.gemHighlight}
        opacity="0.45"
      />
      {/* Top center facet */}
      <path
        d="M8 1.5 L16 1.5 L12 12 Z"
        fill={tier.gemHighlight}
        opacity="0.6"
      />
      {/* Bottom-left shadow facet */}
      <path
        d="M1.5 16 L12 12 L8 22.5 Z"
        fill={tier.gemShadow}
        opacity="0.5"
      />
      {/* Bottom-right shadow facet */}
      <path
        d="M22.5 16 L12 12 L16 22.5 Z"
        fill={tier.gemShadow}
        opacity="0.6"
      />
      {/* Bottom center facet */}
      <path
        d="M8 22.5 L16 22.5 L12 12 Z"
        fill={tier.gemShadow}
        opacity="0.4"
      />
      {/* Sparkle on top-left */}
      <circle cx="7" cy="6" r="1" fill="white" opacity="0.5" />
    </svg>
  );
}
