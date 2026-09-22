import { useRef, useState } from 'react';
import type { Recipe } from '../types';
import { CATEGORIES, FOOD_EMOJIS } from '../types';
import { extractRecipeFromUrl } from '../extractRecipe';
import { uploadRecipeImage } from '../uploadImage';
import { COLORS } from '../theme';

interface Props {
  editingRecipe: Recipe | null;
  onBack: () => void;
  onSave: (data: Omit<Recipe, 'id' | 'created_at'>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function RecipeForm({ editingRecipe, onBack, onSave, onDelete }: Props) {
  const [name, setName] = useState(editingRecipe?.name ?? '');
  const [category, setCategory] = useState(editingRecipe?.category ?? CATEGORIES[0]);
  const [timeMinutes, setTimeMinutes] = useState(editingRecipe?.time_minutes ?? 20);
  const [emoji, setEmoji] = useState(editingRecipe?.emoji ?? '🍽️');
  const [imageUrl, setImageUrl] = useState<string | null>(editingRecipe?.image_url ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ingredients, setIngredients] = useState(editingRecipe?.ingredients ?? '');
  const [instructions, setInstructions] = useState(editingRecipe?.instructions ?? '');
  const [macroVeggies, setMacroVeggies] = useState(editingRecipe?.macro_veggies ?? 50);
  const [macroCarbs, setMacroCarbs] = useState(editingRecipe?.macro_carbs ?? 25);
  const [macroProtein, setMacroProtein] = useState(editingRecipe?.macro_protein ?? 25);
  const [tip, setTip] = useState(editingRecipe?.tip ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [linkUrl, setLinkUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [importedFromLink, setImportedFromLink] = useState(false);

  const validate = () => {
    const e: string[] = [];
    if (!name.trim()) e.push('Bitte gib einen Rezeptnamen ein.');
    if (!ingredients.trim()) e.push('Bitte gib die Zutaten ein.');
    if (!instructions.trim()) e.push('Bitte gib die Zubereitung ein.');
    if (macroVeggies + macroCarbs + macroProtein !== 100) {
      e.push('Die Makro-Werte müssen zusammen 100% ergeben.');
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (e.length) { setErrors(e); return; }
    setErrors([]);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        time_minutes: timeMinutes,
        emoji,
        image_url: imageUrl,
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        macro_veggies: macroVeggies,
        macro_carbs: macroCarbs,
        macro_protein: macroProtein,
        tip: tip.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExtractFromLink = async () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      setExtractError('Bitte einen Link einfügen.');
      return;
    }
    setExtracting(true);
    setExtractError(null);
    try {
      const extracted = await extractRecipeFromUrl(trimmed);
      setName(extracted.name);
      setCategory(extracted.category);
      setTimeMinutes(extracted.time_minutes);
      setEmoji(extracted.emoji);
      setIngredients(extracted.ingredients);
      setInstructions(extracted.instructions);
      setTip(extracted.tip ?? '');
      setImageUrl(extracted.image_url ?? null);
      setImportedFromLink(true);
    } catch (err) {
      setImportedFromLink(false);
      setExtractError(
        err instanceof Error ? err.message : 'Rezept konnte nicht übernommen werden.'
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImageError(null);
    setUploadingImage(true);
    const previousUrl = imageUrl;
    const localPreview = URL.createObjectURL(file);
    setImageUrl(localPreview);
    try {
      const uploadedUrl = await uploadRecipeImage(file);
      setImageUrl(uploadedUrl);
    } catch (err) {
      setImageUrl(previousUrl);
      setImageError(err instanceof Error ? err.message : 'Foto konnte nicht hochgeladen werden.');
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-5 pt-12 pb-4"
        style={{ backgroundColor: COLORS.bg }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
          aria-label="Zurück"
        >
          ←
        </button>
        <h1
          className="text-xl font-bold"
          style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {editingRecipe ? 'Rezept bearbeiten' : 'Neues Rezept'}
        </h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.dangerLight, border: `1px solid ${COLORS.dangerBorder}` }}>
            {errors.map((e, i) => (
              <p key={i} className="text-sm" style={{ color: COLORS.danger }}>• {e}</p>
            ))}
          </div>
        )}

        {/* Link-Import (nur beim Neuanlegen) */}
        {!editingRecipe && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.08)' }}
          >
            <label className="block text-sm font-semibold" style={{ color: COLORS.ink }}>
              🔗 Rezept von einer Website übernehmen
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 px-4 py-3 rounded-2xl text-sm border-0 outline-none"
                style={{ backgroundColor: COLORS.bg, color: COLORS.ink }}
              />
              <button
                onClick={handleExtractFromLink}
                disabled={extracting}
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-98 disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                {extracting ? '…' : 'Übernehmen'}
              </button>
            </div>
            {extractError && (
              <p className="text-sm" style={{ color: COLORS.danger }}>{extractError}</p>
            )}
            {importedFromLink && !extractError && (
              <p className="text-sm" style={{ color: COLORS.primary }}>
                ✓ Übernommen – bitte unten prüfen und bei Bedarf anpassen (Makros bitte selbst setzen).
              </p>
            )}
            <p className="text-xs" style={{ color: COLORS.muted }}>
              Oder einfach unten manuell ausfüllen.
            </p>
          </div>
        )}

        {/* Foto */}
        <FormSection title="Foto">
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
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-medium">
                    Wird hochgeladen…
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: '0 1px 3px rgba(35,40,58,0.08)' }}
                >
                  Foto ändern
                </button>
                <button
                  onClick={() => setImageUrl(null)}
                  disabled={uploadingImage}
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
              disabled={uploadingImage}
              className="w-full py-4 rounded-2xl text-sm font-medium transition-all active:scale-98 disabled:opacity-60"
              style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: '0 1px 4px rgba(35,40,58,0.08)' }}
            >
              {uploadingImage ? 'Wird hochgeladen…' : '📷 Foto hochladen'}
            </button>
          )}
          {imageError && (
            <p className="text-sm mt-2" style={{ color: COLORS.danger }}>{imageError}</p>
          )}
          <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
            Kein Foto? Dann wird ersatzweise das Emoji unten angezeigt.
          </p>
        </FormSection>

        {/* Emoji picker */}
        <FormSection title="Emoji">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-2 transition-transform active:scale-95"
            style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
          >
            {emoji}
          </button>
          {showEmojiPicker && (
            <div
              className="rounded-2xl p-3 grid gap-1"
              style={{
                backgroundColor: COLORS.surface,
                gridTemplateColumns: 'repeat(8, 1fr)',
                boxShadow: '0 4px 16px rgba(35,40,58,0.12)',
              }}
            >
              {FOOD_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-xl transition-all hover:bg-gray-100 active:scale-90"
                  style={{ backgroundColor: e === emoji ? COLORS.primaryLight : undefined }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </FormSection>

        {/* Name */}
        <FormSection title="Rezeptname *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Beeren-Hafer-Bowl"
            className="w-full px-4 py-3 rounded-2xl text-sm border-0 outline-none"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              boxShadow: '0 1px 4px rgba(35,40,58,0.08)',
            }}
          />
        </FormSection>

        {/* Category */}
        <FormSection title="Kategorie">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: category === cat ? COLORS.primary : COLORS.surface,
                  color: category === cat ? '#fff' : COLORS.ink,
                  boxShadow: category === cat
                    ? '0 2px 8px rgba(38,70,83,0.3)'
                    : '0 1px 3px rgba(35,40,58,0.08)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Cooking time */}
        <FormSection title="Kochzeit (Minuten)">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTimeMinutes((t) => Math.max(5, t - 5))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: COLORS.surface, color: COLORS.primary, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
            >
              −
            </button>
            <span className="text-2xl font-bold w-16 text-center" style={{ color: COLORS.ink }}>
              {timeMinutes}
            </span>
            <button
              onClick={() => setTimeMinutes((t) => t + 5)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: COLORS.primary, color: '#fff', boxShadow: '0 2px 8px rgba(38,70,83,0.3)' }}
            >
              +
            </button>
          </div>
        </FormSection>

        {/* Ingredients */}
        <FormSection title="Zutaten * (eine pro Zeile)">
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={'200g Haferflocken\n1 Handvoll Beeren\n…'}
            rows={6}
            className="w-full px-4 py-3 rounded-2xl text-sm border-0 outline-none resize-none"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              boxShadow: '0 1px 4px rgba(35,40,58,0.08)',
              fontFamily: 'inherit',
            }}
          />
        </FormSection>

        {/* Instructions */}
        <FormSection title="Zubereitung * (ein Schritt pro Zeile)">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={'Ofen auf 200°C vorheizen.\nZutaten vermengen.\n…'}
            rows={6}
            className="w-full px-4 py-3 rounded-2xl text-sm border-0 outline-none resize-none"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              boxShadow: '0 1px 4px rgba(35,40,58,0.08)',
              fontFamily: 'inherit',
            }}
          />
        </FormSection>

        {/* Macros */}
        <FormSection title="Makros (müssen 100% ergeben)">
          <div className="grid grid-cols-3 gap-3">
            <MacroInput
              icon="🥦"
              label="Gemüse %"
              value={macroVeggies}
              onChange={setMacroVeggies}
              bg={COLORS.veggieBg}
              color={COLORS.veggieText}
            />
            <MacroInput
              icon="🌾"
              label="Carbs %"
              value={macroCarbs}
              onChange={setMacroCarbs}
              bg={COLORS.carbsBg}
              color={COLORS.carbsText}
            />
            <MacroInput
              icon="🫘"
              label="Protein %"
              value={macroProtein}
              onChange={setMacroProtein}
              bg={COLORS.proteinBg}
              color={COLORS.proteinText}
            />
          </div>
          <p
            className="text-xs mt-2 text-right"
            style={{ color: macroVeggies + macroCarbs + macroProtein === 100 ? COLORS.primary : COLORS.danger }}
          >
            Gesamt: {macroVeggies + macroCarbs + macroProtein}%
          </p>
        </FormSection>

        {/* Tip */}
        <FormSection title="Tipp (optional)">
          <textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="Ein hilfreicher Tipp zum Rezept…"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl text-sm border-0 outline-none resize-none"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              boxShadow: '0 1px 4px rgba(35,40,58,0.08)',
              fontFamily: 'inherit',
            }}
          />
        </FormSection>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all active:scale-98 disabled:opacity-60"
          style={{
            backgroundColor: COLORS.primary,
            boxShadow: '0 4px 16px rgba(38,70,83,0.35)',
          }}
        >
          {saving ? 'Wird gespeichert…' : editingRecipe ? '✓ Änderungen speichern' : '✓ Rezept erstellen'}
        </button>

        {/* Delete button */}
        {editingRecipe && (
          <div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-98"
                style={{ backgroundColor: COLORS.dangerLight, color: COLORS.danger }}
              >
                🗑 Rezept löschen
              </button>
            ) : (
              <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.dangerLight }}>
                <p className="text-sm font-medium mb-3 text-center" style={{ color: COLORS.danger }}>
                  Rezept wirklich löschen?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: COLORS.surface, color: COLORS.ink }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                    style={{ backgroundColor: COLORS.danger }}
                  >
                    {deleting ? 'Löschen…' : 'Ja, löschen'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.ink }}>
        {title}
      </label>
      {children}
    </div>
  );
}

function MacroInput({
  icon,
  label,
  value,
  onChange,
  bg,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  bg: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl p-3 flex flex-col items-center gap-1" style={{ backgroundColor: bg }}>
      <span className="text-2xl">{icon}</span>
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
