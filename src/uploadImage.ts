import { supabase } from './supabase';

const BUCKET = 'recipe-images';
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Verkleinert/komprimiert ein Bild im Browser, bevor es hochgeladen wird –
 * spart Speicherplatz und Ladezeit, ohne dass man es merkt.
 */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Bild konnte nicht verarbeitet werden.');
  ctx.drawImage(bitmap, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht verarbeitet werden.'))),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/**
 * Lädt ein vom Nutzer ausgewähltes Foto hoch (nach Verkleinerung) und gibt
 * die öffentliche URL zurück.
 */
export async function uploadRecipeImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Bitte eine Bilddatei auswählen.');
  }

  const blob = await resizeImage(file);
  const path = `${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) {
    throw new Error(error.message ?? 'Foto-Upload fehlgeschlagen.');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
