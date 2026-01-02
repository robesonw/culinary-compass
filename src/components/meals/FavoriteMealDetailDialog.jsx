import React from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Clock, ChefHat, TrendingUp, Flame, ShoppingCart, ExternalLink, Calendar, Utensils, DollarSign, Heart, Wrench } from 'lucide-react';
import { createPageUrl } from '../../utils';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mealIcons[meal.meal_type]}</span>
            <div>
              <DialogTitle className="text-xl">{meal.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {meal.meal_type}
                </Badge>
                {meal.cuisine && <Badge variant="secondary">{meal.cuisine}</Badge>}
                {meal.difficulty && (
                  <Badge className={difficultyColors[meal.difficulty] || ''}>
                    {meal.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preparation">Preparation</TabsTrigger>
            <TabsTrigger value="grocery">Grocery List</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                  <Button size="sm" variant="ghost" className="h-7" asChild>
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg">
              {meal.prepTime && (
                <div className="text-center">
                  <Clock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{meal.prepTime}</div>
                  <div className="text-xs text-slate-600">Prep Time</div>
                </div>
              )}
              {meal.cooking_time && (
                <div className="text-center">
                  <Utensils className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{meal.cooking_time}</div>
                  <div className="text-xs text-slate-600">Cook Time</div>
                </div>
              )}
              {meal.difficulty && (
                <div className="text-center">
                  <ChefHat className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{meal.difficulty}</div>
                  <div className="text-xs text-slate-600">Difficulty</div>
                </div>
              )}
              {meal.estimated_cost && (
                <div className="text-center">
                  <DollarSign className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">${meal.estimated_cost.toFixed(2)}</div>
                  <div className="text-xs text-slate-600">Est. Cost</div>
                </div>
              )}
            </div>

            {/* Health Benefits */}
            {meal.healthBenefit && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Health Benefits
                </h3>
                <p className="text-sm text-emerald-700">{meal.healthBenefit}</p>
              </div>
            )}

            {/* Prep Tip */}
            {meal.prepTip && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-2">Chef's Tips</h3>
                <p className="text-sm text-amber-700 whitespace-pre-line">{meal.prepTip}</p>
              </div>
            )}

            {/* Nutrients */}
            {meal.nutrients && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">🌟 Key Nutrients</p>
                <p className="text-sm text-blue-800">{meal.nutrients}</p>
              </div>
            )}

            {/* Tags */}
            {meal.tags && meal.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">🏷️ Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {meal.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparation" className="space-y-4">
            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {meal.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {meal.prepSteps && meal.prepSteps.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Preparation Steps</h3>
                  <ol className="space-y-3">
                    {meal.prepSteps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700 flex-1 pt-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            {meal.equipment && meal.equipment.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {meal.equipment.map((item, idx) => (
                      <Badge key={idx} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="grocery" className="space-y-4">
            {meal.grocery_list && Object.keys(meal.grocery_list).length > 0 ? (
              <>
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Grocery List</h3>
                  </div>
                  {meal.estimated_cost && (
                    <div className="text-right">
                      <div className="text-xs text-indigo-600">Estimated Total</div>
                      <div className="text-xl font-bold text-indigo-700">
                        ${meal.estimated_cost.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(meal.grocery_list).map(([category, items]) => (
                    items && items.length > 0 && (
                      <div key={category} className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">
                          {category}
                        </h4>
                        <ul className="space-y-2">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">
                                {item.quantity && item.quantity !== 1 ? `${item.quantity}x ` : ''}
                                {item.name}
                              </span>
                              {item.price && (
                                <span className="text-xs font-medium text-slate-600">
                                  ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>

                <p className="text-xs text-slate-500 text-center">
                  *Prices may vary by location and season
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500">No detailed grocery list available</p>
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="mt-4 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium text-slate-700 mb-2">Ingredients needed:</p>
                    <ul className="space-y-1">
                      {meal.ingredients.map((ing, idx) => (
                        <li key={idx} className="text-sm text-slate-600">• {ing}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            {(meal.calories || meal.protein || meal.carbs || meal.fat) ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {meal.calories && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                      <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900">{meal.calories}</div>
                      <div className="text-xs text-slate-600">Calories</div>
                    </div>
                  )}
                  {meal.protein && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-700">{meal.protein}g</div>
                      <div className="text-xs text-slate-600">Protein</div>
                    </div>
                  )}
                  {meal.carbs && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-700">{meal.carbs}g</div>
                      <div className="text-xs text-slate-600">Carbs</div>
                    </div>
                  )}
                  {meal.fat && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-rose-700">{meal.fat}g</div>
                      <div className="text-xs text-slate-600">Fat</div>
                    </div>
                  )}
                </div>

                {meal.nutrients && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h3 className="font-semibold text-emerald-900 mb-2">Additional Nutrients</h3>
                    <p className="text-sm text-emerald-700">{meal.nutrients}</p>
                  </div>
                )}

                {meal.healthBenefit && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Health Benefits
                    </h3>
                    <p className="text-sm text-purple-700">{meal.healthBenefit}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Flame className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No nutrition information available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}