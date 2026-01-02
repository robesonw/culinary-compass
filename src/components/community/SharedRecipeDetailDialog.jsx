import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Flame, Clock, ChefHat, Wrench } from 'lucide-react';

export default function SharedRecipeDetailDialog({ recipe, open, onOpenChange }) {
  if (!recipe) return null;

  const meal = recipe.meal_data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">{recipe.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="capitalize">
              {recipe.meal_type}
            </Badge>
            <Badge variant="outline">
              <Flame className="w-3 h-3 mr-1 text-orange-500" />
              {recipe.calories}
            </Badge>
            <span className="text-xs text-slate-500">by {recipe.author_name}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Macros */}
          {(recipe.protein || recipe.carbs || recipe.fat) && (
            <div className="flex gap-2 flex-wrap">
              {recipe.protein && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Protein: {recipe.protein}g
                </Badge>
              )}
              {recipe.carbs && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  Carbs: {recipe.carbs}g
                </Badge>
              )}
              {recipe.fat && (
                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                  Fat: {recipe.fat}g
                </Badge>
              )}
            </div>
          )}

          {/* Health Benefit */}
          {meal?.healthBenefit && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-medium text-emerald-900 mb-1">Health Benefits</p>
              <p className="text-sm text-emerald-700">{meal.healthBenefit}</p>
            </div>
          )}

          {/* Prep Info */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {meal?.prepTime && (
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                {meal.prepTime}
              </div>
            )}
            {meal?.difficulty && (
              <div className="flex items-center gap-1 text-slate-600">
                <ChefHat className="w-3 h-3" />
                {meal.difficulty}
              </div>
            )}
            {meal?.equipment?.length > 0 && (
              <div className="flex items-center gap-1 text-slate-600">
                <Wrench className="w-3 h-3" />
                {meal.equipment.length} tools
              </div>
            )}
          </div>

          {/* Prep Steps */}
          {meal?.prepSteps?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Preparation Steps</p>
              <ol className="space-y-2 text-sm text-slate-600">
                {meal.prepSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Equipment */}
          {meal?.equipment?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Equipment Needed</p>
              <div className="flex flex-wrap gap-1">
                {meal.equipment.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prep Tip */}
          {meal?.prepTip && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-700 mb-1">Chef's Tip</p>
              <p className="text-sm text-slate-600">{meal.prepTip}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}