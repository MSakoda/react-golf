export default function StatCard({
  label,
  value,
  tone = "light"
}: {
  label: string;
  value: string | number;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={
        tone === "dark"
          ? "rounded-lg bg-rough/90 p-3 text-white shadow-sm"
          : "rounded-lg border border-emerald-900/10 bg-white/80 p-3 shadow-sm"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
