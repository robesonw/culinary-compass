import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link2, Loader2, Heart, Clock, ChefHat, Flame, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecipeImport() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const handleImport = async () => {
    if (!url.trim()) { toast.error('Please enter a URL'); return; }
    setLoading(true);
    setRecipe(null);
    setSaved(false);
    try {
      const res = await base44.functions.invoke('importRecipeFromUrl', { url: url.trim() });
      setRecipe(res.data.recipe);
      toast.success('Recipe extracted!');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not extract recipe from this URL');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;
    setSaving(true);
    try {
      await base44.entities.FavoriteMeal.create({
        name: recipe.name,
        meal_type: recipe.meal_type || 'dinner',
        calories: recipe.calories ? `${recipe.calories} kcal` : '',
        protein: recipe.protein || 0,
        carbs: recipe.carbs || 0,
        fat: recipe.fat || 0,
        prepTime: recipe.prep_time || '',
        cooking_time: recipe.cooking_time || '',
        difficulty: recipe.difficulty || 'Medium',
        prepSteps: recipe.prep_steps || [],
        ingredients: recipe.ingredients || [],
        cuisine: recipe.cuisine || '',
        healthBenefit: recipe.health_benefit || '',
        tags: recipe.tags || [],
        source_type: 'ai_recipe',
      });
      queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
      setSaved(true);
      toast.success('Saved to favorites!');
    } catch {
      toast.error('Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Import Recipe from URL</h1>
        <p className="text-slate-600 mt-1">Paste any recipe URL, TikTok, or Instagram link to extract and save the recipe</p>
      </div>

      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9 bg-white h-11"
                placeholder="https://www.allrecipes.com/recipe/... or TikTok/Instagram link"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImport()}
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
              {loading ? 'Extracting...' : 'Import'}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Supports: AllRecipes, Food Network, Serious Eats, NYT Cooking, TikTok, Instagram, and more
          </p>
        </CardContent>
      </Card>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Fetching and analyzing recipe...</p>
                <p className="text-sm text-slate-400 mt-1">This may take a moment</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {recipe && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl mb-2">{recipe.name}</CardTitle>
                    {recipe.description && <p className="text-slate-500 text-sm">{recipe.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {recipe.meal_type && <Badge variant="outline" className="capitalize">{recipe.meal_type}</Badge>}
                      {recipe.cuisine && <Badge variant="outline">{recipe.cuisine}</Badge>}
                      {recipe.difficulty && <Badge className="bg-amber-100 text-amber-700 border-amber-200">{recipe.difficulty}</Badge>}
                    </div>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
                    {saved ? 'Saved!' : 'Save to Favorites'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Time & macros */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {recipe.prep_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Prep: {recipe.prep_time}</span>}
                  {recipe.cooking_time && <span className="flex items-center gap-1"><ChefHat className="w-4 h-4" /> Cook: {recipe.cooking_time}</span>}
                  {recipe.servings && <span className="flex items-center gap-1">🍽 {recipe.servings} servings</span>}
                </div>

                {/* Macros */}
                {(recipe.calories || recipe.protein) && (
                  <div className="grid grid-cols-4 gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    {[
                      { label: 'Calories', value: recipe.calories, unit: 'kcal', color: 'text-slate-800' },
                      { label: 'Protein', value: recipe.protein, unit: 'g', color: 'text-blue-700' },
                      { label: 'Carbs', value: recipe.carbs, unit: 'g', color: 'text-amber-700' },
                      { label: 'Fat', value: recipe.fat, unit: 'g', color: 'text-rose-700' },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <div className={`text-xl font-bold ${m.color}`}>{m.value ?? '—'}{m.value ? m.unit : ''}</div>
                        <div className="text-xs text-slate-500">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Ingredients */}
                {recipe.ingredients?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Ingredients</h3>
                    <ul className="grid sm:grid-cols-2 gap-1.5">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recipe.prep_steps?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Instructions</h3>
                      <ol className="space-y-3">
                        {recipe.prep_steps.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-medium">{i + 1}</span>
                            <p className="text-sm text-slate-700 pt-0.5">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </>
                )}

                {recipe.health_benefit && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                    💚 {recipe.health_benefit}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}