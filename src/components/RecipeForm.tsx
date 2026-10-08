import { useRef, useState } from 'react';
import type { Recipe } from '../types';
import { CATEGORIES } from '../types';
import { extractRecipeFromUrl } from '../extractRecipe';
import { uploadRecipeImage } from '../uploadImage';
import { COLORS, SHADOWS } from '../theme';
import { Input, Textarea } from './ui/Field';
import PrimaryButton from './ui/PrimaryButton';
import { RECIPE_ICONS, getRecipeIcon } from '../icons';
import { Camera, Link2, Check, Trash2, LeafyGreen, Wheat, Nut, ArrowRight, type LucideIcon } from 'lucide-react';

interface Props {
  editingRecipe: Recipe | null;
  initialName?: string;
  /** z.B. "Dienstag, 6.10." – zeigt an, dass das Rezept nach dem Speichern eingeplant wird */
  planHint?: string | null;
  onBack: () => void;
  onSave: (data: Omit<Recipe, 'id' | 'created_at'>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function RecipeForm({ editingRecipe, initialName, planHint, onBack, onSave, onDelete }: Props) {
  const [name, setName] = useState(editingRecipe?.name ?? initialName ?? '');
  const [category, setCategory] = useState(editingRecipe?.category ?? CATEGORIES[0]);
  const [timeMinutes, setTimeMinutes] = useState(editingRecipe?.time_minutes ?? 20);
  const [icon, setIcon] = useState(editingRecipe?.emoji ?? 'utensils');
  const [imageUrl, setImageUrl] = useState<string | null>(editingRecipe?.image_url ?? null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(editingRecipe?.source_url ?? null);
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
  const [showIconPicker, setShowIconPicker] = useState(false);
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
        emoji: icon,
        image_url: imageUrl,
        source_url: sourceUrl,
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
      setIcon(extracted.emoji);
      setIngredients(extracted.ingredients);
      setInstructions(extracted.instructions);
      setTip(extracted.tip ?? '');
      setImageUrl(extracted.image_url ?? null);
      setSourceUrl(trimmed);
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
          style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.raised }}
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

        {planHint && !editingRecipe && (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
          >
            Wird nach dem Speichern für {planHint} eingeplant.
          </div>
        )}

        {/* Link-Import (nur beim Neuanlegen) */}
        {!editingRecipe && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.card }}
          >
            <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLORS.ink }}>
              <Link2 size={16} strokeWidth={2} />
              Rezept von einer Website übernehmen
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1"
                style={{ backgroundColor: COLORS.bg, boxShadow: 'none' }}
              />
              <button
                onClick={handleExtractFromLink}
                disabled={extracting}
                aria-label="Übernehmen"
                title="Übernehmen"
                className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-white transition-all active:scale-98 disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                {extracting ? (
                  <span className="text-sm">…</span>
                ) : (
                  <ArrowRight size={18} strokeWidth={2.5} />
                )}
              </button>
            </div>
            {extractError && (
              <p className="text-sm" style={{ color: COLORS.danger }}>{extractError}</p>
            )}
            {importedFromLink && !extractError && (
              <p className="flex items-start gap-1.5 text-sm" style={{ color: COLORS.primary }}>
                <Check size={16} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                Übernommen – bitte unten prüfen und bei Bedarf anpassen (Makros bitte selbst setzen).
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
                  style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: SHADOWS.soft }}
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
              className="w-full py-4 rounded-2xl text-sm font-medium transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: SHADOWS.card }}
            >
              {uploadingImage ? (
                'Wird hochgeladen…'
              ) : (
                <>
                  <Camera size={18} strokeWidth={2} />
                  Foto hochladen
                </>
              )}
            </button>
          )}
          {imageError && (
            <p className="text-sm mt-2" style={{ color: COLORS.danger }}>{imageError}</p>
          )}
          <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
            Kein Foto? Dann wird ersatzweise das Icon unten angezeigt.
          </p>
        </FormSection>

        {/* Icon picker */}
        <FormSection title="Icon">
          {(() => {
            const SelectedIcon = getRecipeIcon(icon);
            return (
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-transform active:scale-95"
                style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.raised }}
              >
                <SelectedIcon size={28} strokeWidth={1.75} color={COLORS.primary} />
              </button>
            );
          })()}
          {showIconPicker && (
            <div
              className="rounded-2xl p-3 grid gap-1"
              style={{
                backgroundColor: COLORS.surface,
                gridTemplateColumns: 'repeat(6, 1fr)',
                boxShadow: '0 4px 16px rgba(35,40,58,0.12)',
              }}
            >
              {RECIPE_ICONS.map((key) => {
                const ItemIcon = getRecipeIcon(key);
                const isSelected = key === icon;
                return (
                  <button
                    key={key}
                    onClick={() => { setIcon(key); setShowIconPicker(false); }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-gray-100 active:scale-90"
                    style={{ backgroundColor: isSelected ? COLORS.primaryLight : undefined }}
                  >
                    <ItemIcon size={18} strokeWidth={1.75} color={COLORS.ink} />
                  </button>
                );
              })}
            </div>
          )}
        </FormSection>

        {/* Name */}
        <FormSection title="Rezeptname *">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Beeren-Hafer-Bowl"
            className="w-full"
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
                    ? SHADOWS.primarySm
                    : SHADOWS.soft,
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
              style={{ backgroundColor: COLORS.surface, color: COLORS.primary, boxShadow: SHADOWS.raised }}
            >
              −
            </button>
            <span className="text-2xl font-bold w-16 text-center" style={{ color: COLORS.ink }}>
              {timeMinutes}
            </span>
            <button
              onClick={() => setTimeMinutes((t) => t + 5)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: COLORS.primary, color: '#fff', boxShadow: SHADOWS.primarySm }}
            >
              +
            </button>
          </div>
        </FormSection>

        {/* Ingredients */}
        <FormSection
          title="Zutaten * (eine pro Zeile)"
          hint="Abschnitte mit einer Zeile wie „## Teig“ beginnen, z. B. Teig, Sauce, Belag."
        >
          <Textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={'200g Haferflocken\n1 Handvoll Beeren\n…'}
            rows={6}
            className="w-full"
          />
        </FormSection>

        {/* Instructions */}
        <FormSection
          title="Zubereitung * (ein Schritt pro Zeile)"
          hint="Optional dieselben Abschnitte mit „## Teig“ usw. – die Nummerierung läuft durch."
        >
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={'Ofen auf 200°C vorheizen.\nZutaten vermengen.\n…'}
            rows={6}
            className="w-full"
          />
        </FormSection>

        {/* Macros */}
        <FormSection title="Makros (müssen 100% ergeben)">
          <div className="grid grid-cols-3 gap-3">
            <MacroInput
              icon={LeafyGreen}
              label="Gemüse %"
              value={macroVeggies}
              onChange={setMacroVeggies}
              bg={COLORS.veggieBg}
              color={COLORS.veggieText}
            />
            <MacroInput
              icon={Wheat}
              label="Carbs %"
              value={macroCarbs}
              onChange={setMacroCarbs}
              bg={COLORS.carbsBg}
              color={COLORS.carbsText}
            />
            <MacroInput
              icon={Nut}
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
          <Textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="Ein hilfreicher Tipp zum Rezept…"
            rows={3}
            className="w-full"
          />
        </FormSection>

        {/* Save button */}
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? (
            'Wird gespeichert…'
          ) : (
            <>
              <Check size={18} strokeWidth={2.5} />
              {editingRecipe ? 'Änderungen speichern' : planHint ? 'Erstellen & einplanen' : 'Rezept erstellen'}
            </>
          )}
        </PrimaryButton>

        {/* Delete button */}
        {editingRecipe && (
          <div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-98 flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.dangerLight, color: COLORS.danger }}
              >
                <Trash2 size={16} strokeWidth={2} />
                Rezept löschen
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

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.ink }}>
        {title}
      </label>
      {hint && (
        <p className="text-xs -mt-1 mb-2" style={{ color: COLORS.muted }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function MacroInput({
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
