import { useState, useEffect, useCallback } from 'react';
import type { Recipe, ShoppingItem, Screen, MealPlanEntry } from './types';
import { fetchRecipes, insertRecipe, insertRecipes, updateRecipe, deleteRecipe } from './supabase';
import { fetchMealPlan, setMealPlanEntry, clearMealPlanEntry } from './mealPlan';
import { DEFAULT_RECIPES } from './defaults';
import { COLORS } from './theme';
import HomeScreen from './components/HomeScreen';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import ShoppingList from './components/ShoppingList';
import WeekPlan from './components/WeekPlan';
import TabBar, { type TabScreen } from './components/TabBar';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [screenStack, setScreenStack] = useState<Screen[]>(['home']);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  // Wenn ein Rezept direkt aus der Wochenplanung heraus angelegt wird, merken wir uns
  // den Tag (und einen vorgeschlagenen Namen), um es nach dem Speichern dort einzuplanen.
  const [pendingPlanDate, setPendingPlanDate] = useState<string | null>(null);
  const [initialRecipeName, setInitialRecipeName] = useState('');

  const [favorites, setFavorites] = useState<string[]>(() =>
    loadFromStorage<string[]>('mk_favorites', [])
  );
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() =>
    loadFromStorage<ShoppingItem[]>('mk_shopping', [])
  );
  const [mealPlanEntries, setMealPlanEntries] = useState<MealPlanEntry[]>([]);
  const [mealPlanLoading, setMealPlanLoading] = useState(true);

  const currentScreen = screenStack[screenStack.length - 1];
  // Die drei Tabs (Rezepte/Wochenplan/Einkaufsliste) bilden immer die Basis des Stacks;
  // Detail/Form werden darüber geschoben und blenden die Tab-Leiste dabei aus.
  const activeTab = screenStack[0] as TabScreen;
  const showTabBar = screenStack.length === 1;

  const pushScreen = (screen: Screen) => setScreenStack((prev) => [...prev, screen]);
  const goBack = () => setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const switchTab = (tab: TabScreen) => setScreenStack([tab]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('mk_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Persist shopping list
  useEffect(() => {
    localStorage.setItem('mk_shopping', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Load recipes from Supabase on mount
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecipes();
      if (data.length > 0) {
        setRecipes(data);
      } else {
        try {
          const seeded = await insertRecipes(DEFAULT_RECIPES);
          setRecipes(seeded.length > 0 ? seeded : DEFAULT_RECIPES.map((r, i) => ({ ...r, id: `local-${i}` })));
        } catch {
          setRecipes(DEFAULT_RECIPES.map((r, i) => ({ ...r, id: `local-${i}` })));
        }
      }
    } catch {
      setRecipes(DEFAULT_RECIPES.map((r, i) => ({ ...r, id: `local-${i}` })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Wochenplan laden (komplette Historie – pro Tag nur ein kleiner Eintrag)
  const loadMealPlan = useCallback(async () => {
    setMealPlanLoading(true);
    try {
      // Gesamte Historie laden, damit man in alle vergangenen Wochen zurückblättern kann
      const data = await fetchMealPlan('1970-01-01');
      setMealPlanEntries(data);
    } catch {
      setMealPlanEntries([]);
    } finally {
      setMealPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMealPlan();
  }, [loadMealPlan]);

  // --- Favorite handlers ---
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // --- Shopping list handlers ---
  const handleAddToShoppingList = (items: string[]) => {
    const newItems: ShoppingItem[] = items.map((name) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      checked: false,
    }));
    setShoppingList((prev) => {
      const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
      const unique = newItems.filter((i) => !existingNames.has(i.name.toLowerCase()));
      return [...prev, ...unique];
    });
    switchTab('shopping');
  };

  const handleAddShoppingItem = (name: string) => {
    setShoppingList((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, checked: false },
    ]);
  };

  const handleToggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckAllItems = () => {
    setShoppingList((prev) => prev.map((item) => ({ ...item, checked: true })));
  };

  const handleClearShoppingList = () => {
    setShoppingList([]);
  };

  // --- Wochenplan handlers ---
  const handleAssignMealPlan = async (planDate: string, recipeId: string) => {
    const optimistic: MealPlanEntry = { id: `local-${planDate}`, plan_date: planDate, recipe_id: recipeId };
    setMealPlanEntries((prev) => [...prev.filter((e) => e.plan_date !== planDate), optimistic]);
    try {
      const saved = await setMealPlanEntry(planDate, recipeId);
      setMealPlanEntries((prev) => prev.map((e) => (e.plan_date === planDate ? saved : e)));
    } catch {
      // Optimistisches Update bleibt bestehen, auch wenn Supabase nicht erreichbar ist
    }
  };

  const handleClearMealPlan = async (planDate: string) => {
    setMealPlanEntries((prev) => prev.filter((e) => e.plan_date !== planDate));
    try {
      await clearMealPlanEntry(planDate);
    } catch {
      // lokal ist der Eintrag bereits entfernt
    }
  };

  // --- Recipe CRUD ---
  const handleSaveRecipe = async (data: Omit<Recipe, 'id' | 'created_at'>) => {
    if (editingRecipe) {
      try {
        const updated = await updateRecipe(editingRecipe.id, data);
        setRecipes((prev) => prev.map((r) => (r.id === editingRecipe.id ? updated : r)));
      } catch {
        setRecipes((prev) =>
          prev.map((r) => (r.id === editingRecipe.id ? { ...r, ...data } : r))
        );
      }
    } else {
      try {
        const created = await insertRecipe(data);
        setRecipes((prev) => [created, ...prev]);
        if (pendingPlanDate) handleAssignMealPlan(pendingPlanDate, created.id);
      } catch {
        const tempRecipe: Recipe = {
          ...data,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setRecipes((prev) => [tempRecipe, ...prev]);
        if (pendingPlanDate) handleAssignMealPlan(pendingPlanDate, tempRecipe.id);
      }
    }
    setPendingPlanDate(null);
    setInitialRecipeName('');
    goBack();
  };

  const handleCancelForm = () => {
    setPendingPlanDate(null);
    setInitialRecipeName('');
    goBack();
  };

  const planHint = pendingPlanDate
    ? new Date(`${pendingPlanDate}T00:00:00`).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
      })
    : null;

  const handleDeleteRecipe = async () => {
    if (!editingRecipe) return;
    try {
      await deleteRecipe(editingRecipe.id);
    } catch {
      // Continue with local delete even if Supabase fails
    }
    setRecipes((prev) => prev.filter((r) => r.id !== editingRecipe.id));
    setFavorites((prev) => prev.filter((id) => id !== editingRecipe.id));
    setScreenStack(['home']);
    setEditingRecipe(null);
    setSelectedRecipeId(null);
  };

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;

  return (
    <div className="max-w-lg mx-auto min-h-screen relative" style={{ backgroundColor: COLORS.bg }}>
      {currentScreen === 'home' && (
        <HomeScreen
          recipes={recipes}
          favorites={favorites}
          loading={loading}
          onSelectRecipe={(id) => {
            setSelectedRecipeId(id);
            pushScreen('detail');
          }}
          onEditRecipe={(recipe) => {
            setEditingRecipe(recipe);
            pushScreen('form');
          }}
          onAddRecipe={() => {
            setEditingRecipe(null);
            setPendingPlanDate(null);
            setInitialRecipeName('');
            pushScreen('form');
          }}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {currentScreen === 'detail' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          isFavorite={favorites.includes(selectedRecipe.id)}
          onBack={goBack}
          onEdit={() => {
            setEditingRecipe(selectedRecipe);
            pushScreen('form');
          }}
          onToggleFavorite={() => handleToggleFavorite(selectedRecipe.id)}
          onAddToShoppingList={handleAddToShoppingList}
        />
      )}

      {currentScreen === 'form' && (
        <RecipeForm
          editingRecipe={editingRecipe}
          initialName={initialRecipeName}
          planHint={planHint}
          onBack={handleCancelForm}
          onSave={handleSaveRecipe}
          onDelete={handleDeleteRecipe}
        />
      )}

      {currentScreen === 'shopping' && (
        <ShoppingList
          items={shoppingList}
          onToggle={handleToggleShoppingItem}
          onRemove={handleRemoveShoppingItem}
          onAdd={handleAddShoppingItem}
          onCheckAll={handleCheckAllItems}
          onClear={handleClearShoppingList}
        />
      )}

      {currentScreen === 'weekplan' && (
        <WeekPlan
          recipes={recipes}
          entries={mealPlanEntries}
          loading={mealPlanLoading}
          onAssign={handleAssignMealPlan}
          onClear={handleClearMealPlan}
          onAddWeekToShoppingList={handleAddToShoppingList}
          onCreateRecipe={(planDate, suggestedName) => {
            setEditingRecipe(null);
            setPendingPlanDate(planDate);
            setInitialRecipeName(suggestedName);
            pushScreen('form');
          }}
          onSelectRecipe={(id) => {
            setSelectedRecipeId(id);
            pushScreen('detail');
          }}
        />
      )}

      {showTabBar && <TabBar active={activeTab} onChange={switchTab} />}
    </div>
  );
}
