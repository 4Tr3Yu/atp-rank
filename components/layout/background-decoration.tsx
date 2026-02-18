import {
  Trophy,
  Star,
  Zap,
  Crown,
  Target,
  Flame,
  Swords,
  CircleDot,
} from "lucide-react";

const decorations = [
  { Icon: Trophy, top: "6%", left: "4%", size: 48, rotate: -15, opacity: 0.04 },
  { Icon: Star, top: "12%", left: "88%", size: 32, rotate: 20, opacity: 0.05 },
  { Icon: Zap, top: "32%", left: "93%", size: 24, rotate: -30, opacity: 0.04 },
  { Icon: Crown, top: "58%", left: "2%", size: 44, rotate: 12, opacity: 0.04 },
  { Icon: Target, top: "78%", left: "90%", size: 36, rotate: -8, opacity: 0.05 },
  { Icon: Flame, top: "44%", left: "7%", size: 28, rotate: 25, opacity: 0.03 },
  { Icon: Swords, top: "18%", left: "52%", size: 40, rotate: -22, opacity: 0.03 },
  { Icon: CircleDot, top: "88%", left: "12%", size: 20, rotate: 45, opacity: 0.05 },
  { Icon: Star, top: "52%", left: "96%", size: 56, rotate: 10, opacity: 0.03 },
  { Icon: Trophy, top: "92%", left: "78%", size: 30, rotate: -25, opacity: 0.04 },
  { Icon: Zap, top: "4%", left: "38%", size: 22, rotate: 35, opacity: 0.04 },
  { Icon: Crown, top: "68%", left: "48%", size: 36, rotate: -12, opacity: 0.03 },
  { Icon: Flame, top: "24%", left: "18%", size: 34, rotate: 18, opacity: 0.04 },
  { Icon: Target, top: "55%", left: "72%", size: 26, rotate: -35, opacity: 0.05 },
  { Icon: Swords, top: "38%", left: "32%", size: 38, rotate: 22, opacity: 0.03 },
  { Icon: Star, top: "82%", left: "58%", size: 42, rotate: -18, opacity: 0.04 },
  { Icon: CircleDot, top: "8%", left: "72%", size: 30, rotate: 40, opacity: 0.03 },
  { Icon: Flame, top: "65%", left: "22%", size: 24, rotate: -28, opacity: 0.05 },
  { Icon: Trophy, top: "48%", left: "60%", size: 20, rotate: 15, opacity: 0.03 },
  { Icon: Zap, top: "75%", left: "35%", size: 32, rotate: -40, opacity: 0.04 },
];

export function BackgroundDecoration() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {decorations.map((item, i) => (
        <item.Icon
          key={i}
          className="absolute text-white"
          style={{
            top: item.top,
            left: item.left,
            width: item.size,
            height: item.size,
            transform: `rotate(${item.rotate}deg)`,
            opacity: item.opacity,
          }}
        />
      ))}
    </div>
  );
}
