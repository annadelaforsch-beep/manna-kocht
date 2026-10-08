import { useRef, useState, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { COLORS, SHADOWS } from '../../theme';
import { uploadRecipeImage } from '../../uploadImage';

interface Props {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}

/** Foto hochladen, ändern oder entfernen. Zeigt sofort eine lokale Vorschau, während hochgeladen wird. */
export default function PhotoField({ imageUrl, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setUploading(true);
    const previousUrl = imageUrl;
    const localPreview = URL.createObjectURL(file);
    onChange(localPreview);
    try {
      onChange(await uploadRecipeImage(file));
    } catch (err) {
      onChange(previousUrl);
      setError(err instanceof Error ? err.message : 'Foto konnte nicht hochgeladen werden.');
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {imageUrl ? (
        <div className="space-y-2">
          <div
            className="relative w-full h-40 rounded-2xl overflow-hidden"
            style={{ backgroundColor: COLORS.mutedLight }}
          >
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-medium">
                Wird hochgeladen…
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: SHADOWS.soft }}
            >
              Foto ändern
            </button>
            <button
              onClick={() => onChange(null)}
              disabled={uploading}
              className="flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: COLORS.dangerLight, color: COLORS.danger }}
            >
              Foto entfernen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-4 rounded-2xl text-sm font-medium transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: SHADOWS.card }}
        >
          {uploading ? (
            'Wird hochgeladen…'
          ) : (
            <>
              <Camera size={18} strokeWidth={2} />
              Foto hochladen
            </>
          )}
        </button>
      )}
      {error && (
        <p className="text-sm mt-2" style={{ color: COLORS.danger }}>{error}</p>
      )}
      <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
        Kein Foto? Dann wird ersatzweise das Icon unten angezeigt.
      </p>
    </>
  );
}
