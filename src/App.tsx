import { useState } from 'react';
import type { Recipe, Screen } from './types';
import type { AddGroup } from './ingredients';
import { COLORS } from './theme';
import { useFavorites } from './hooks/useFavorites';
import { useRecipes, type RecipeInput } from './hooks/useRecipes';
import { useMealPlan } from './hooks/useMealPlan';
import { useShopping } from './hooks/useShopping';
import HomeScreen from './components/HomeScreen';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import ShoppingList from './components/ShoppingList';
import WeekPlan from './components/WeekPlan';
import TabBar, { type TabScreen } from './components/TabBar';

export default function App() {
  const [screenStack, setScreenStack] = useState<Screen[]>(['home']);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  // Wenn ein Rezept direkt aus der Wochenplanung heraus angelegt wird, merken wir uns
  // den Tag (und einen vorgeschlagenen Namen), um es nach dem Speichern dort einzuplanen.
  const [pendingPlanDate, setPendingPlanDate] = useState<string | null>(null);
  const [pendingPlanPosition, setPendingPlanPosition] = useState(0);
  const [initialRecipeName, setInitialRecipeName] = useState('');

  const { favorites, toggleFavorite, removeFavorite } = useFavorites();
  const { recipes, loading, createRecipe, saveRecipe, removeRecipe } = useRecipes();
  const mealPlan = useMealPlan();
  const shopping = useShopping();

  // --- Navigation ---
  const currentScreen = screenStack[screenStack.length - 1];
  // Die drei Tabs (Rezepte/Wochenplan/Einkaufsliste) bilden immer die Basis des Stacks;
  // Detail/Form werden darüber geschoben und blenden die Tab-Leiste dabei aus.
  const activeTab = screenStack[0] as TabScreen;
  const showTabBar = screenStack.length === 1;

  const pushScreen = (screen: Screen) => setScreenStack((prev) => [...prev, screen]);
  const goBack = () => setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const switchTab = (tab: TabScreen) => setScreenStack([tab]);

  const openRecipe = (id: string) => {
    setSelectedRecipeId(id);
    pushScreen('detail');
  };

  const openForm = (recipe: Recipe | null) => {
    setEditingRecipe(recipe);
    pushScreen('form');
  };

  // --- Einkaufsliste: nach dem Hinzufügen zur Liste wechseln ---
  const handleAddToShoppingList = (lines: string[], source?: string) => {
    shopping.addGroups([{ source, lines }]);
    switchTab('shopping');
  };

  const handleAddWeekToShoppingList = (groups: AddGroup[]) => {
    shopping.addGroups(groups);
    switchTab('shopping');
  };

  // --- Rezept-Formular ---
  const resetPendingPlan = () => {
    setPendingPlanDate(null);
    setPendingPlanPosition(0);
    setInitialRecipeName('');
  };

  const handleSaveRecipe = async (data: RecipeInput) => {
    if (editingRecipe) {
      await saveRecipe(editingRecipe.id, data);
    } else {
      const created = await createRecipe(data);
      // Aus der Wochenplanung heraus angelegt: direkt an dem Tag einplanen
      if (pendingPlanDate) mealPlan.assign(pendingPlanDate, created.id, pendingPlanPosition);
    }
    resetPendingPlan();
    goBack();
  };

  const handleCancelForm = () => {
    resetPendingPlan();
    goBack();
  };

  const handleDeleteRecipe = async () => {
    if (!editingRecipe) return;
    await removeRecipe(editingRecipe.id);
    removeFavorite(editingRecipe.id);
    setScreenStack(['home']);
    setEditingRecipe(null);
    setSelectedRecipeId(null);
  };

  const planHint = pendingPlanDate
    ? new Date(`${pendingPlanDate}T00:00:00`).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
      }) + (pendingPlanPosition > 0 ? ' (als Extra)' : '')
    : null;

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;

  return (
    <div className="max-w-lg mx-auto min-h-screen relative" style={{ backgroundColor: COLORS.bg }}>
      {currentScreen === 'home' && (
        <HomeScreen
          recipes={recipes}
          favorites={favorites}
          loading={loading}
          onSelectRecipe={openRecipe}
          onEditRecipe={openForm}
          onAddRecipe={() => {
            resetPendingPlan();
            openForm(null);
          }}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {currentScreen === 'detail' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          isFavorite={favorites.includes(selectedRecipe.id)}
          onBack={goBack}
          onEdit={() => openForm(selectedRecipe)}
          onToggleFavorite={() => toggleFavorite(selectedRecipe.id)}
          onAddToShoppingList={(lines) => handleAddToShoppingList(lines, `recipe:${selectedRecipe.id}`)}
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
          items={shopping.items}
          excluded={shopping.excluded}
          pantry={shopping.pantry}
          onRestoreExcluded={shopping.restoreExcluded}
          onMarkAsBasic={shopping.markAsBasic}
          onAddPantry={shopping.addPantry}
          onRemovePantry={shopping.removePantry}
          onToggle={shopping.toggleItem}
          onRemove={shopping.removeItem}
          onAdd={shopping.addManualItem}
          onCheckAll={shopping.checkAll}
          onClear={shopping.clearList}
        />
      )}

      {currentScreen === 'weekplan' && (
        <WeekPlan
          recipes={recipes}
          entries={mealPlan.entries}
          loading={mealPlan.loading}
          onAssign={mealPlan.assign}
          onClear={mealPlan.clear}
          onAddWeekToShoppingList={handleAddWeekToShoppingList}
          onCreateRecipe={(planDate, position, suggestedName) => {
            setPendingPlanDate(planDate);
            setPendingPlanPosition(position);
            setInitialRecipeName(suggestedName);
            openForm(null);
          }}
          onSelectRecipe={openRecipe}
        />
      )}

      {showTabBar && <TabBar active={activeTab} onChange={switchTab} />}
    </div>
  );
}
