import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, ChefHat, Clock, Utensils, Flame, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const cuisineTypes = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'Mediterranean',
  'French', 'American', 'Korean', 'Vietnamese', 'Middle Eastern', 'Greek', 'Spanish'
];

const dietaryPreferences = [
  'None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 
  'Paleo', 'Low-Carb', 'High-Protein', 'Pescatarian', 'Halal', 'Kosher'
];

const difficultyLevels = ['Easy', 'Medium', 'Hard'];

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

export default function AIRecipeGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [savingImage, setSavingImage] = useState(false);
  
  const [form, setForm] = useState({
    mealType: 'Dinner',
    cuisine: 'Italian',
    dietary: 'None',
    difficulty: 'Medium',
    ingredients: '',
    servings: 4,
    cookTime: 30,
    additionalNotes: ''
  });

  const handleGenerate = async () => {
    if (!form.ingredients.trim()) {
      toast.error('Please enter some available ingredients');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate a detailed ${form.difficulty.toLowerCase()} difficulty ${form.cuisine} ${form.mealType.toLowerCase()} recipe.

Dietary Preference: ${form.dietary}
Available Ingredients: ${form.ingredients}
Servings: ${form.servings}
Target Cook Time: ~${form.cookTime} minutes
${form.additionalNotes ? `Additional Notes: ${form.additionalNotes}` : ''}

Provide:
1. Recipe name
2. Complete ingredient list with quantities
3. Step-by-step instructions
4. Nutritional information per serving (calories, protein, carbs, fat)
5. Prep time and cook time
6. Chef's tips or variations
7. Health benefits`;

      const recipe = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  quantity: { type: "string" }
                }
              }
            },
            instructions: {
              type: "array",
              items: { type: "string" }
            },
            nutrition: {
              type: "object",
              properties: {
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" }
              }
            },
            prepTime: { type: "string" },
            cookTime: { type: "string" },
            difficulty: { type: "string" },
            tips: { type: "string" },
            healthBenefits: { type: "string" }
          }
        }
      });

      setGeneratedRecipe({
        ...recipe,
        cuisine: form.cuisine,
        mealType: form.mealType,
        dietary: form.dietary,
        servings: form.servings
      });
      
      toast.success('Recipe generated!');
    } catch (error) {
      toast.error('Failed to generate recipe');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const generateRecipeImage = async () => {
    if (!generatedRecipe) return;
    
    setSavingImage(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional food photography of ${generatedRecipe.name}, ${form.cuisine} cuisine, appetizing presentation, natural lighting, high quality, restaurant style plating`
      });
      
      if (result?.url) {
        setGeneratedRecipe({ ...generatedRecipe, imageUrl: result.url });
        toast.success('Image generated!');
      }
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setSavingImage(false);
    }
  };

  const saveToFavorites = async () => {
    if (!generatedRecipe) return;
    
    try {
      await base44.entities.FavoriteMeal.create({
        name: generatedRecipe.name,
        meal_type: form.mealType.toLowerCase(),
        calories: `${generatedRecipe.nutrition?.calories || 0} kcal`,
        protein: generatedRecipe.nutrition?.protein || 0,
        carbs: generatedRecipe.nutrition?.carbs || 0,
        fat: generatedRecipe.nutrition?.fat || 0,
        prepTip: generatedRecipe.tips,
        cuisine: form.cuisine,
        cooking_time: generatedRecipe.cookTime,
        tags: [form.cuisine, form.dietary, form.difficulty]
      });
      
      toast.success('Saved to favorites!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const shareRecipe = async () => {
    if (!generatedRecipe) return;
    
    try {
      await base44.entities.SharedRecipe.create({
        name: generatedRecipe.name,
        meal_type: form.mealType.toLowerCase(),
        description: generatedRecipe.description,
        meal_data: generatedRecipe,
        calories: `${generatedRecipe.nutrition?.calories || 0} kcal`,
        protein: generatedRecipe.nutrition?.protein || 0,
        carbs: generatedRecipe.nutrition?.carbs || 0,
        fat: generatedRecipe.nutrition?.fat || 0,
        image_url: generatedRecipe.imageUrl,
        tags: [form.cuisine, form.dietary, form.difficulty]
      });
      
      toast.success('Shared with community!');
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Hard: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Recipe Generator</h1>
        <p className="text-slate-600 mt-1">
          Create custom recipes based on your preferences and available ingredients
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Recipe Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meal Type</Label>
                <Select value={form.mealType} onValueChange={(v) => setForm({ ...form, mealType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cuisine Type</Label>
                <Select value={form.cuisine} onValueChange={(v) => setForm({ ...form, cuisine: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map(cuisine => (
                      <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dietary Preference</Label>
                <Select value={form.dietary} onValueChange={(v) => setForm({ ...form, dietary: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dietaryPreferences.map(diet => (
                      <SelectItem key={diet} value={diet}>{diet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Difficulty Level</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Available Ingredients *</Label>
                <Textarea
                  placeholder="e.g., chicken breast, tomatoes, garlic, olive oil..."
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Servings</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={form.servings}
                    onChange={(e) => setForm({ ...form, servings: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Cook Time (min)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="240"
                    value={form.cookTime}
                    onChange={(e) => setForm({ ...form, cookTime: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any specific requirements or preferences..."
                  value={form.additionalNotes}
                  onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Recipe...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Recipe
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Recipe */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!generatedRecipe ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-slate-200 border-dashed">
                  <CardContent className="p-12 text-center">
                    <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Ready to Create?
                    </h3>
                    <p className="text-slate-600">
                      Fill in your preferences and click "Generate Recipe" to get started
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="recipe"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="border-slate-200">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{generatedRecipe.name}</CardTitle>
                        <p className="text-slate-600">{generatedRecipe.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className={difficultyColors[form.difficulty]}>
                        {form.difficulty}
                      </Badge>
                      <Badge variant="outline">{form.cuisine}</Badge>
                      <Badge variant="outline">{form.mealType}</Badge>
                      {form.dietary !== 'None' && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {form.dietary}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-4 h-4" />
                        Prep: {generatedRecipe.prepTime}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Utensils className="w-4 h-4" />
                        Cook: {generatedRecipe.cookTime}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <ChefHat className="w-4 h-4" />
                        {form.servings} servings
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={generateRecipeImage} disabled={savingImage}>
                        {savingImage ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Image
                      </Button>
                      <Button variant="outline" size="sm" onClick={saveToFavorites}>
                        <Heart className="w-4 h-4 mr-2" />
                        Save to Favorites
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareRecipe}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardHeader>

                  {generatedRecipe.imageUrl && (
                    <div className="px-6">
                      <img
                        src={generatedRecipe.imageUrl}
                        alt={generatedRecipe.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <CardContent className="space-y-6 pt-6">
                    {/* Nutrition */}
                    {generatedRecipe.nutrition && (
                      <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                        <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                          <Flame className="w-4 h-4" />
                          Nutrition per Serving
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">
                              {generatedRecipe.nutrition.calories}
                            </div>
                            <div className="text-xs text-slate-600">Calories</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700">
                              {generatedRecipe.nutrition.protein}g
                            </div>
                            <div className="text-xs text-slate-600">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-700">
                              {generatedRecipe.nutrition.carbs}g
                            </div>
                            <div className="text-xs text-slate-600">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-rose-700">
                              {generatedRecipe.nutrition.fat}g
                            </div>
                            <div className="text-xs text-slate-600">Fat</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Health Benefits */}
                    {generatedRecipe.healthBenefits && (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                        <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Health Benefits
                        </h3>
                        <p className="text-sm text-emerald-700">{generatedRecipe.healthBenefits}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Ingredients */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Ingredients</h3>
                      <ul className="space-y-2">
                        {generatedRecipe.ingredients?.map((ing, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700">
                              <span className="font-medium">{ing.quantity}</span> {ing.item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* Instructions */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Instructions</h3>
                      <ol className="space-y-3">
                        {generatedRecipe.instructions?.map((step, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-medium">
                              {idx + 1}
                            </span>
                            <p className="text-slate-700 flex-1 pt-0.5">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    {generatedRecipe.tips && (
                      <>
                        <Separator />
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                          <h3 className="font-semibold text-amber-900 mb-2">Chef's Tips</h3>
                          <p className="text-sm text-amber-700">{generatedRecipe.tips}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}