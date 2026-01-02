import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar, Flame, Pill, ChefHat, Download, Share2, ShoppingCart, DollarSign, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙'
};

const groceryCategories = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alternatives', 'Other'];

export default function PlanDetailsView({ plan, open, onOpenChange }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [groceryList, setGroceryList] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [addingItem, setAddingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (plan?.grocery_list) {
      setGroceryList(plan.grocery_list);
    } else if (plan?.days) {
      // Generate from meals if not saved
      const items = new Set();
      plan.days.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
          if (day[meal]?.name) {
            const words = day[meal].name.split(/[\s,]+/);
            words.forEach(word => {
              const cleaned = word.toLowerCase();
              if (cleaned.length > 3 && !['with', 'and', 'the'].includes(cleaned)) {
                items.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
              }
            });
          }
        });
      });

      const categorized = {};
      groceryCategories.forEach(cat => categorized[cat] = []);
      
      const proteinKeywords = ['chicken', 'beef', 'salmon', 'fish', 'liver', 'turkey', 'pork', 'lamb', 'egg', 'tofu', 'cod', 'trout', 'mackerel', 'tuna', 'shrimp'];
      const vegKeywords = ['spinach', 'broccoli', 'carrot', 'asparagus', 'onion', 'garlic', 'pepper', 'tomato', 'lettuce', 'kale', 'cabbage', 'zucchini', 'mushroom', 'artichoke', 'brussels'];
      const grainKeywords = ['rice', 'quinoa', 'oat', 'bread', 'pasta', 'tortilla', 'barley'];
      const dairyKeywords = ['yogurt', 'cheese', 'milk', 'cream', 'butter'];
      const fruitKeywords = ['berry', 'berries', 'apple', 'banana', 'orange', 'lemon', 'avocado'];

      items.forEach(item => {
        const lowerItem = item.toLowerCase();
        const itemWithPrice = { name: item, price: null, quantity: 1 };
        
        if (proteinKeywords.some(k => lowerItem.includes(k))) categorized['Proteins'].push(itemWithPrice);
        else if (vegKeywords.some(k => lowerItem.includes(k))) categorized['Vegetables'].push(itemWithPrice);
        else if (fruitKeywords.some(k => lowerItem.includes(k))) categorized['Fruits'].push(itemWithPrice);
        else if (grainKeywords.some(k => lowerItem.includes(k))) categorized['Grains'].push(itemWithPrice);
        else if (dairyKeywords.some(k => lowerItem.includes(k))) categorized['Dairy/Alternatives'].push(itemWithPrice);
        else categorized['Other'].push(itemWithPrice);
      });

      setGroceryList(categorized);
    }
  }, [plan]);

  const updatePlanMutation = useMutation({
    mutationFn: (data) => base44.entities.MealPlan.update(plan.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Grocery list updated');
    },
  });

  const saveGroceryList = () => {
    if (!groceryList) return;
    
    const currentTotal = Object.values(groceryList)
      .flat()
      .reduce((sum, item) => sum + (item.price || 0), 0);

    updatePlanMutation.mutate({
      grocery_list: groceryList,
      current_total_cost: currentTotal
    });
  };

  const fetchItemPrice = async (itemName, category) => {
    setIsFetchingPrice(true);
    try {
      const priceData = await base44.integrations.Core.InvokeLLM({
        prompt: `Get current average grocery price in USD for: ${itemName}. Return approximate cost per typical package/unit from major US grocery stores.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            price: { type: "number" },
            unit: { type: "string" }
          }
        }
      });

      if (priceData?.price) {
        setGroceryList(prev => ({
          ...prev,
          [category]: prev[category].map(item => 
            item.name === itemName 
              ? { ...item, price: priceData.price, unit: priceData.unit }
              : item
          )
        }));
        saveGroceryList();
      }
    } catch (error) {
      toast.error('Failed to fetch price');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const addCustomItem = (category) => {
    if (!newItemName.trim()) return;
    
    setGroceryList(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), { name: newItemName, price: null, unit: '' }]
    }));
    setNewItemName('');
    setAddingItem(null);
    saveGroceryList();
  };

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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <CardTitle>Grocery List</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const items = Object.entries(groceryList || {})
                        .map(([cat, items]) => `${cat}:\n${items.map(i => `  • ${i.name}${i.price ? ` - $${i.price.toFixed(2)}` : ''}`).join('\n')}`)
                        .join('\n\n');
                      navigator.clipboard.writeText(items);
                      toast.success('Copied to clipboard');
                    }}
                  >
                    Copy List
                  </Button>
                </div>

                {/* Cost Summary */}
                {(plan?.estimated_cost || plan?.current_total_cost) && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 space-y-2">
                    {plan.estimated_cost && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Initial Estimate:</span>
                        <span className="font-semibold">${plan.estimated_cost.toFixed(2)}</span>
                      </div>
                    )}
                    {groceryList && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Current Total:</span>
                        <span className="font-bold text-indigo-600">
                          ${Object.values(groceryList).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {plan.estimated_cost && groceryList && (
                      <div className="flex justify-between text-xs text-slate-500 pt-1 border-t">
                        <span>Difference:</span>
                        <span className={
                          Object.values(groceryList).flat().reduce((sum, item) => sum + (item.price || 0), 0) <= plan.estimated_cost
                            ? 'text-emerald-600' : 'text-amber-600'
                        }>
                          ${(Object.values(groceryList).flat().reduce((sum, item) => sum + (item.price || 0), 0) - plan.estimated_cost).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {groceryList && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {groceryCategories.map(category => {
                      const items = groceryList[category] || [];

                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{category}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddingItem(category)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {items.map((item, idx) => {
                              const itemName = typeof item === 'string' ? item : item.name;
                              const itemPrice = typeof item === 'object' ? item.price : null;
                              const itemUnit = typeof item === 'object' ? item.unit : null;
                              const itemQuantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                              const totalPrice = (itemPrice || 0) * itemQuantity;

                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={checkedItems.has(itemName)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(checkedItems);
                                      if (checked) newSet.add(itemName);
                                      else newSet.delete(itemName);
                                      setCheckedItems(newSet);
                                    }}
                                  />
                                  <span className={`text-sm flex-1 ${checkedItems.has(itemName) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {itemName}
                                  </span>

                                  {/* Quantity Input */}
                                  <Input
                                    type="number"
                                    step="0.5"
                                    min="0.1"
                                    value={itemQuantity}
                                    onChange={(e) => {
                                      const newQty = parseFloat(e.target.value);
                                      if (!isNaN(newQty) && newQty > 0) {
                                        setGroceryList(prev => ({
                                          ...prev,
                                          [category]: prev[category].map((it, i) => 
                                            i === idx ? { ...it, quantity: newQty } : it
                                          )
                                        }));
                                        saveGroceryList();
                                      }
                                    }}
                                    className="w-14 h-7 text-xs text-center"
                                  />

                                  {editingPrice === `${category}-${idx}` ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      defaultValue={itemPrice || ''}
                                      placeholder="$"
                                      className="w-20 h-7 text-xs"
                                      onBlur={(e) => {
                                        const newPrice = parseFloat(e.target.value);
                                        if (!isNaN(newPrice)) {
                                          setGroceryList(prev => ({
                                            ...prev,
                                            [category]: prev[category].map((it, i) => 
                                              i === idx ? { ...it, price: newPrice } : it
                                            )
                                          }));
                                          saveGroceryList();
                                        }
                                        setEditingPrice(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.target.blur();
                                      }}
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      onClick={() => setEditingPrice(`${category}-${idx}`)}
                                      className="text-xs text-slate-500 hover:text-indigo-600 min-w-[90px] text-right"
                                    >
                                      {itemPrice ? (
                                        <div className="flex flex-col items-end">
                                          <span className="text-[10px] text-slate-400">
                                            ${itemPrice.toFixed(2)}{itemUnit ? `/${itemUnit}` : ''}
                                          </span>
                                          <span className="font-semibold text-slate-700">
                                            ${totalPrice.toFixed(2)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            fetchItemPrice(itemName, category);
                                          }}
                                          className="text-indigo-600 hover:underline"
                                        >
                                          Get price
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {addingItem === category && (
                              <div className="flex gap-2 mt-2">
                                <Input
                                  placeholder="Item name..."
                                  value={newItemName}
                                  onChange={(e) => setNewItemName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') addCustomItem(category);
                                    if (e.key === 'Escape') setAddingItem(null);
                                  }}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => addCustomItem(category)}>
                                  Add
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {checkedItems.size} of {groceryList ? Object.values(groceryList).flat().length : 0} items checked
                  </span>
                  {isFetchingPrice && (
                    <span className="flex items-center gap-2 text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching price...
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}