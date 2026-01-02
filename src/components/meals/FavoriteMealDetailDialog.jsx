import React from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ChefHat, TrendingUp, Flame, ShoppingCart, ExternalLink, Calendar } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function FavoriteMealDetailDialog({ meal, open, onOpenChange }) {
  if (!meal) return null;

  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snacks: '🍎'
  };

  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Hard: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  // Extract ingredients from prepTip or generate basic list
  const extractIngredients = () => {
    if (meal.ingredients) return meal.ingredients;
    
    // Try to extract from prepTip or other fields
    const text = meal.prepTip || '';
    const lines = text.split('\n').filter(l => l.trim());
    
    // If it looks like a list, use it
    if (lines.some(l => l.match(/^[-•*]\s/))) {
      return lines.map(l => l.replace(/^[-•*]\s/, '').trim());
    }
    
    return [];
  };

  const ingredients = extractIngredients();
  const caloriesNum = typeof meal.calories === 'string' ? parseInt(meal.calories.match(/\d+/)?.[0] || 0) : meal.calories || 0;

  // Estimate grocery cost (rough calculation)
  const estimatedCost = ingredients.length > 0 
    ? (ingredients.length * 2.5).toFixed(2) 
    : ((caloriesNum / 100) * 1.5).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mealIcons[meal.meal_type]}</span>
            <div>
              <DialogTitle className="text-xl">{meal.name}</DialogTitle>
              <Badge variant="outline" className="capitalize mt-1">
                {meal.meal_type}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Reference */}
          {meal.source_type && (
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {meal.source_type === 'meal_plan' && <Calendar className="w-4 h-4 text-indigo-600" />}
                {meal.source_type === 'ai_recipe' && <ChefHat className="w-4 h-4 text-indigo-600" />}
                <div>
                  <p className="text-xs font-medium text-indigo-900">
                    {meal.source_type === 'meal_plan' && 'From Meal Plan'}
                    {meal.source_type === 'ai_recipe' && 'From AI Recipe Generator'}
                    {meal.source_type === 'shared_recipe' && 'From Shared Recipe'}
                  </p>
                  {meal.source_meal_plan_name && (
                    <p className="text-xs text-indigo-700">{meal.source_meal_plan_name}</p>
                  )}
                </div>
              </div>
              {meal.source_meal_plan_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  asChild
                >
                  <Link to={createPageUrl('MealPlans')}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Plan
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Image */}
          {meal.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={meal.imageUrl}
                alt={meal.name}
                className="w-full h-64 object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-slate-200">
              <CardContent className="p-3 text-center">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900">{meal.calories || 'N/A'}</p>
                <p className="text-xs text-slate-600">Calories</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-700">{meal.protein || 0}g</p>
                <p className="text-xs text-slate-600">Protein</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-amber-700">{meal.carbs || 0}g</p>
                <p className="text-xs text-slate-600">Carbs</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-rose-700">{meal.fat || 0}g</p>
                <p className="text-xs text-slate-600">Fat</p>
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm">
            {meal.prepTime && (
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{meal.prepTime}</span>
              </div>
            )}
            {meal.difficulty && (
              <Badge className={difficultyColors[meal.difficulty] || ''}>
                {meal.difficulty}
              </Badge>
            )}
            {meal.cuisine && (
              <Badge variant="secondary">{meal.cuisine}</Badge>
            )}
          </div>

          {/* Health Benefits */}
          {meal.healthBenefit && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-900 mb-1">💚 Health Benefits</p>
              <p className="text-sm text-emerald-800">{meal.healthBenefit}</p>
            </div>
          )}

          {/* Nutrients */}
          {meal.nutrients && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">🌟 Key Nutrients</p>
              <p className="text-sm text-blue-800">{meal.nutrients}</p>
            </div>
          )}

          {/* Preparation */}
          {meal.prepTip && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-indigo-600" />
                Preparation Tips
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-line">{meal.prepTip}</p>
            </div>
          )}

          {/* Preparation Steps */}
          {meal.prepSteps && meal.prepSteps.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📋 Step-by-Step</h3>
              <ol className="space-y-2">
                {meal.prepSteps.map((step, index) => (
                  <li key={index} className="text-sm text-slate-700 flex gap-2">
                    <span className="font-semibold text-indigo-600 min-w-[24px]">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Equipment */}
          {meal.equipment && meal.equipment.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">🔧 Equipment Needed</h3>
              <div className="flex flex-wrap gap-2">
                {meal.equipment.map((item, index) => (
                  <Badge key={index} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Grocery List & Cost */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Grocery List & Budget
            </h3>
            {ingredients.length > 0 ? (
              <ul className="space-y-1 mb-3">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm text-purple-800 flex items-start gap-2">
                    <span>•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-purple-800 mb-2">
                Basic ingredients for {meal.name}
              </p>
            )}
            <div className="pt-2 border-t border-purple-300">
              <p className="text-sm font-semibold text-purple-900">
                Estimated Cost: <span className="text-lg">${estimatedCost}</span>
              </p>
              <p className="text-xs text-purple-700 mt-1">
                *Prices may vary by location and season
              </p>
            </div>
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">🏷️ Tags</h3>
              <div className="flex flex-wrap gap-2">
                {meal.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}