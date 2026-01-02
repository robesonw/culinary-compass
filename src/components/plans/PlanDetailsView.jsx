import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Flame, Pill, ChefHat, Download, Share2, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙'
};

const groceryCategories = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alternatives', 'Other'];

export default function PlanDetailsView({ plan, open, onOpenChange }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [checkedItems, setCheckedItems] = useState(new Set());

  const groceryList = useMemo(() => {
    if (!plan?.days) return {};
    
    const items = new Set();
    plan.days.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
        if (day[meal]?.name) {
          const words = day[meal].name.toLowerCase().split(/[\s,&]+/);
          words.forEach(word => {
            if (word.length > 3 && !['with', 'and', 'the'].includes(word)) {
              items.add(word);
            }
          });
        }
      });
    });

    const categorized = {};
    groceryCategories.forEach(cat => categorized[cat] = []);
    
    const proteinKeywords = ['chicken', 'beef', 'salmon', 'fish', 'turkey', 'pork', 'eggs', 'tofu', 'shrimp', 'tuna'];
    const vegKeywords = ['broccoli', 'spinach', 'kale', 'lettuce', 'carrots', 'peppers', 'tomatoes', 'onions', 'garlic'];
    const fruitKeywords = ['apple', 'banana', 'berries', 'orange', 'lemon', 'avocado', 'mango'];
    const grainKeywords = ['rice', 'quinoa', 'bread', 'oats', 'pasta', 'tortilla'];
    const dairyKeywords = ['milk', 'cheese', 'yogurt', 'butter'];

    items.forEach(item => {
      if (proteinKeywords.some(k => item.includes(k))) categorized['Proteins'].push(item);
      else if (vegKeywords.some(k => item.includes(k))) categorized['Vegetables'].push(item);
      else if (fruitKeywords.some(k => item.includes(k))) categorized['Fruits'].push(item);
      else if (grainKeywords.some(k => item.includes(k))) categorized['Grains'].push(item);
      else if (dairyKeywords.some(k => item.includes(k))) categorized['Dairy/Alternatives'].push(item);
      else categorized['Other'].push(item);
    });

    return categorized;
  }, [plan]);

  if (!plan) return null;

  const dietColors = {
    'liver-centric': 'bg-rose-100 text-rose-700 border-rose-200',
    'low-sugar': 'bg-amber-100 text-amber-700 border-amber-200',
    'vegetarian': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'custom': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{plan.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`${dietColors[plan.diet_type]} border capitalize`}>
                  {plan.diet_type?.replace(/-/g, ' ')}
                </Badge>
                <span className="text-sm text-slate-500">
                  {plan.days?.length || 0} days
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="meals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meals">Meal Plan</TabsTrigger>
            <TabsTrigger value="grocery">Grocery List</TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="space-y-6">
            {/* Day Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
            {plan.days?.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                  ${selectedDay === index 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }
                `}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Selected Day Details */}
          {plan.days?.[selectedDay] && (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const meal = plan.days[selectedDay][mealType];
                if (!meal) return null;

                return (
                  <Card key={mealType} className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{mealIcons[mealType]}</div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg text-slate-900 capitalize">
                              {mealType}
                            </h3>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              {meal.calories}
                            </Badge>
                          </div>
                          
                          <h4 className="text-slate-800 font-medium mb-4">
                            {meal.name}
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <Pill className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                  Nutrients
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {meal.nutrients}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                                <ChefHat className="w-4 h-4 text-violet-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                  Prep Tip
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {meal.prepTip}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          )}

          {/* Preferences (if custom plan) */}
          {plan.diet_type === 'custom' && plan.preferences && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Preferences</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {plan.preferences.foodsLiked && (
                    <div>
                      <p className="font-medium text-slate-700 mb-1">Foods Liked</p>
                      <p className="text-slate-600">{plan.preferences.foodsLiked}</p>
                    </div>
                  )}
                  {plan.preferences.foodsAvoided && (
                    <div>
                      <p className="font-medium text-slate-700 mb-1">Foods Avoided</p>
                      <p className="text-slate-600">{plan.preferences.foodsAvoided}</p>
                    </div>
                  )}
                  {plan.preferences.dietaryNotes && (
                    <div className="md:col-span-2">
                      <p className="font-medium text-slate-700 mb-1">Notes</p>
                      <p className="text-slate-600">{plan.preferences.dietaryNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          </TabsContent>

          <TabsContent value="grocery">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <CardTitle>Grocery List</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const items = Object.values(groceryList).flat();
                  const text = items.map(item => `• ${item}`).join('\n');
                  navigator.clipboard.writeText(text);
                  toast.success('Copied to clipboard');
                }}
              >
                Copy List
              </Button>
              </CardHeader>
              <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {groceryCategories.map(category => {
                  const items = groceryList[category] || [];
                  if (items.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="font-semibold text-slate-900 mb-3">{category}</h4>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Checkbox
                              checked={checkedItems.has(item)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(checkedItems);
                                if (checked) newSet.add(item);
                                else newSet.delete(item);
                                setCheckedItems(newSet);
                              }}
                            />
                            <span className={`text-sm capitalize ${checkedItems.has(item) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="text-sm text-slate-600">
                {checkedItems.size} of {Object.values(groceryList).flat().length} items checked
              </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}