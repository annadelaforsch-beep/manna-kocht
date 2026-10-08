import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { COLORS, SHADOWS } from '../../theme';

const BASE = 'px-4 py-3 rounded-2xl text-sm border-0 outline-none';

/** Einheitliches Texteingabefeld (weiße Fläche mit leichtem Schatten). */
export function Input({ className = '', style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${BASE} ${className}`}
      style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: SHADOWS.card, ...style }}
      {...props}
    />
  );
}

/** Mehrzeiliges Feld im selben Stil (nicht in der Größe veränderbar). */
export function Textarea({ className = '', style, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${BASE} resize-none ${className}`}
      style={{
        backgroundColor: COLORS.surface,
        color: COLORS.ink,
        boxShadow: SHADOWS.card,
        fontFamily: 'inherit',
        ...style,
      }}
      {...props}
    />
  );
}
