export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="ng" x1="0" y1="8" x2="64" y2="56">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M8 8h18L38 34V8h18v48H38L26 30v26H8V8z"
        fill="url(#ng)"
      />
    </svg>
  );
}
