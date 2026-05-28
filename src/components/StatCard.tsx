export default function StatCard({
  label,
  value,
  tone = "light",
  compact = false
}: {
  label: string;
  value: string | number;
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  return (
    <div
      className={
        tone === "dark"
          ? `rounded-lg bg-rough/90 text-white shadow-sm ${compact ? "p-2 sm:p-3" : "p-3"}`
          : `rounded-lg border border-emerald-900/10 bg-white/80 shadow-sm ${compact ? "p-2 sm:p-3" : "p-3"}`
      }
    >
      <p className="text-[0.65rem] font-semibold uppercase leading-none tracking-wide opacity-70 sm:text-xs">
        {label}
      </p>
      <p className={`${compact ? "mt-0.5 text-base sm:mt-1 sm:text-xl" : "mt-1 text-xl"} font-black`}>
        {value}
      </p>
    </div>
  );
}
