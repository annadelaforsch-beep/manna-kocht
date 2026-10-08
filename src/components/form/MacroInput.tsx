import type { LucideIcon } from 'lucide-react';

/** Eingabe eines Makro-Anteils (0–100 %) in der Farbe der jeweiligen Gruppe. */
export default function MacroInput({
  icon: Icon,
  label,
  value,
  onChange,
  bg,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  onChange: (v: number) => void;
  bg: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl p-3 flex flex-col items-center gap-1" style={{ backgroundColor: bg }}>
      <Icon size={22} strokeWidth={1.75} color={color} />
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value))))}
        className="w-full text-center text-lg font-bold rounded-xl py-1 border-0 outline-none bg-white/50"
        style={{ color }}
      />
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}
