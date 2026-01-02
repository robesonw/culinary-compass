import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar, Flame, Pill, ChefHat, Download, Share2, ShoppingCart, DollarSign, Plus, Loader2, ArrowLeftRight, TrendingUp, Heart, RefreshCw, Sparkles, Clock, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MealCard from '../meals/MealCard';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎'
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
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'detailed'
  const [localDays, setLocalDays] = useState(null);
  const [regeneratingMeal, setRegeneratingMeal] = useState(null);
  const [regeneratingDay, setRegeneratingDay] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (plan?.days) {
      setLocalDays(plan.days);
    }
  }, [plan]);

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

      // Group items by category and deduplicate
      const itemsByCategory = {};
      items.forEach(item => {
        const lowerItem = item.toLowerCase();
        let targetCategory = 'Other';
        
        if (proteinKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Proteins';
        else if (vegKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Vegetables';
        else if (fruitKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Fruits';
        else if (grainKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Grains';
        else if (dairyKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Dairy/Alternatives';
        
        if (!itemsByCategory[targetCategory]) {
          itemsByCategory[targetCategory] = {};
        }
        
        // Deduplicate by item name
        if (itemsByCategory[targetCategory][item]) {
          itemsByCategory[targetCategory][item].quantity += 1;
        } else {
          itemsByCategory[targetCategory][item] = { name: item, price: null, quantity: 1 };
        }
      });

      // Convert to array format
      Object.keys(categorized).forEach(category => {
        if (itemsByCategory[category]) {
          categorized[category] = Object.values(itemsByCategory[category]);
        }
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

  const handleDragEnd = (result) => {
    if (!result.destination || !localDays) return;

    const { source, destination } = result;
    
    // Parse the droppableId format: "day-{dayIndex}-{mealType}"
    const sourceDay = parseInt(source.droppableId.split('-')[1]);
    const sourceMeal = source.droppableId.split('-')[2];
    const destDay = parseInt(destination.droppableId.split('-')[1]);
    const destMeal = destination.droppableId.split('-')[2];

    const newDays = [...localDays];
    const sourceMealData = { ...newDays[sourceDay][sourceMeal] };
    const destMealData = { ...newDays[destDay][destMeal] };

    // Swap meals
    newDays[sourceDay][sourceMeal] = destMealData;
    newDays[destDay][destMeal] = sourceMealData;

    setLocalDays(newDays);
    
    // Save to backend
    updatePlanMutation.mutate({ days: newDays });
    toast.success('Meals swapped successfully');
  };

  const calculateTotalNutrition = () => {
    if (!localDays) return null;
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let mealCount = 0;

    localDays.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const meal = day[mealType];
        if (meal) {
          // Parse calories from string like "400 kcal"
          const caloriesMatch = meal.calories?.match(/(\d+)/);
          if (caloriesMatch) {
            totalCalories += parseInt(caloriesMatch[1]);
            mealCount++;
          }
          if (meal.protein) totalProtein += meal.protein;
          if (meal.carbs) totalCarbs += meal.carbs;
          if (meal.fat) totalFat += meal.fat;
        }
      });
    });

    return {
      totalCalories,
      avgCalories: mealCount > 0 ? Math.round(totalCalories / localDays.length) : 0,
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      avgProtein: localDays.length > 0 ? Math.round(totalProtein / localDays.length) : 0,
      avgCarbs: localDays.length > 0 ? Math.round(totalCarbs / localDays.length) : 0,
      avgFat: localDays.length > 0 ? Math.round(totalFat / localDays.length) : 0,
    };
  };

  const nutritionStats = calculateTotalNutrition();

  const saveMealToFavorites = async (meal, mealType) => {
    try {
      await base44.entities.FavoriteMeal.create({
        name: meal.name,
        meal_type: mealType,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        nutrients: meal.nutrients,
        prepTip: meal.prepTip,
      });
      toast.success('Meal saved to favorites!');
    } catch (error) {
      toast.error('Failed to save meal');
    }
  };

  const regenerateMeal = async (dayIndex, mealType) => {
    setRegeneratingMeal(`${dayIndex}-${mealType}`);
    try {
      const currentMeal = localDays[dayIndex][mealType];
      const prompt = `Generate a single ${mealType} meal that is different from "${currentMeal?.name}". 
      It should be healthy, nutritious, and include calorie count, macros (protein, carbs, fat in grams), 
      health benefits, and preparation tips. Make it suitable for the same diet type.`;

      const newMeal = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            calories: { type: "string" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            nutrients: { type: "string" },
            prepTip: { type: "string" }
          }
        }
      });

      const newDays = [...localDays];
      newDays[dayIndex][mealType] = newMeal;
      setLocalDays(newDays);
      updatePlanMutation.mutate({ days: newDays });
      toast.success('Meal regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate meal');
    } finally {
      setRegeneratingMeal(null);
    }
  };

  const regenerateDay = async (dayIndex) => {
    setRegeneratingDay(dayIndex);
    try {
      const prompt = `Generate a full day of meals (breakfast, lunch, dinner, snacks) that are healthy and nutritious. 
      Each meal should include: name, calories (as string like "400 kcal"), protein/carbs/fat in grams, 
      health benefits (nutrients field), and preparation tips (prepTip field).`;

      const newDay = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            breakfast: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            },
            lunch: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            },
            dinner: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            },
            snacks: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            }
          }
        }
      });

      const newDays = [...localDays];
      newDays[dayIndex] = {
        day: newDays[dayIndex].day,
        ...newDay
      };
      setLocalDays(newDays);
      updatePlanMutation.mutate({ days: newDays });
      toast.success('Day regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate day');
    } finally {
      setRegeneratingDay(null);
    }
  };

  if (!plan) return null;

  const dietColors = {
    'liver-centric': 'bg-rose-100 text-rose-700 border-rose-200',
    'low-sugar': 'bg-amber-100 text-amber-700 border-amber-200',
    'vegetarian': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'custom': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const culturalEmojis = {
    mediterranean: '🫒',
    asian: '🍜',
    indian: '🍛',
    latin_american: '🌮',
    african: '🥘',
    middle_eastern: '🧆',
    european: '🥖',
    fusion: '✨',
    none: '🌍'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{plan.name}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={`${dietColors[plan.diet_type]} border capitalize`}>
                  {plan.diet_type?.replace(/-/g, ' ')}
                </Badge>
                {plan.cultural_style && plan.cultural_style !== 'none' && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200 capitalize">
                    {culturalEmojis[plan.cultural_style]} {plan.cultural_style?.replace(/_/g, ' ')}
                  </Badge>
                )}
                {plan.life_stage && plan.life_stage !== 'general' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 capitalize">
                    {plan.life_stage}
                  </Badge>
                )}
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
            {/* Nutrition Summary */}
            {nutritionStats && (
              <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Plan Nutrition Overview</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-600 mb-1">Total Calories</div>
                      <div className="text-xl font-bold text-slate-900">{nutritionStats.totalCalories}</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgCalories}/day</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-blue-600 mb-1">Protein</div>
                      <div className="text-xl font-bold text-blue-700">{nutritionStats.totalProtein}g</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgProtein}g/day</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-amber-600 mb-1">Carbs</div>
                      <div className="text-xl font-bold text-amber-700">{nutritionStats.totalCarbs}g</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgCarbs}g/day</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-rose-600 mb-1">Fat</div>
                      <div className="text-xl font-bold text-rose-700">{nutritionStats.totalFat}g</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgFat}g/day</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* View Mode Toggle */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar View
                </Button>
                <Button
                  variant={viewMode === 'detailed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('detailed')}
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Detailed View
                </Button>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                Drag to swap meals
              </Badge>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              {viewMode === 'calendar' ? (
                /* Calendar/Weekly Overview */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localDays?.map((day, dayIndex) => (
                    <Card key={dayIndex} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{day.day}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {['breakfast', 'lunch', 'dinner', 'snacks'].reduce((total, mealType) => {
                                const meal = day[mealType];
                                const match = meal?.calories?.match(/(\d+)/);
                                return total + (match ? parseInt(match[1]) : 0);
                              }, 0)} kcal
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => regenerateDay(dayIndex)}
                              disabled={regeneratingDay === dayIndex}
                            >
                              {regeneratingDay === dayIndex ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                          const meal = day[mealType];
                          if (!meal) return null;

                          return (
                            <Droppable key={`${dayIndex}-${mealType}`} droppableId={`day-${dayIndex}-${mealType}`}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`rounded-lg transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-indigo-50 border-2 border-indigo-300' : ''
                                  }`}
                                >
                                  <Draggable draggableId={`meal-${dayIndex}-${mealType}`} index={0}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`p-2 rounded-lg border bg-white cursor-move hover:shadow-md transition-all ${
                                          snapshot.isDragging ? 'shadow-lg border-indigo-400 bg-indigo-50' : 'border-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">
                                              {mealIcons[mealType]} {mealType}
                                            </div>
                                            <div className="text-xs font-medium text-slate-800 truncate">
                                              {meal.name}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                saveMealToFavorites(meal, mealType);
                                              }}
                                            >
                                              <Heart className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                regenerateMeal(dayIndex, mealType);
                                              }}
                                              disabled={regeneratingMeal === `${dayIndex}-${mealType}`}
                                            >
                                              {regeneratingMeal === `${dayIndex}-${mealType}` ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <RefreshCw className="w-3 h-3" />
                                              )}
                                            </Button>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">
                                              {meal.calories}
                                            </Badge>
                                          </div>
                                        </div>
                                        {(meal.protein || meal.carbs || meal.fat) && (
                                          <div className="flex gap-2 mt-1.5 text-[10px]">
                                            {meal.protein && <span className="text-blue-600">P:{meal.protein}g</span>}
                                            {meal.carbs && <span className="text-amber-600">C:{meal.carbs}g</span>}
                                            {meal.fat && <span className="text-rose-600">F:{meal.fat}g</span>}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Detailed View */
                <>
                  {/* Day Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {localDays?.map((day, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <button
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => regenerateDay(index)}
                          disabled={regeneratingDay === index}
                        >
                          {regeneratingDay === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Selected Day Details */}
                  {localDays?.[selectedDay] && (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                const meal = localDays[selectedDay][mealType];
                if (!meal) return null;

                return (
                  <Droppable key={`${selectedDay}-${mealType}`} droppableId={`day-${selectedDay}-${mealType}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <Draggable draggableId={`meal-${selectedDay}-${mealType}`} index={0}>
                          {(provided, snapshot) => (
                            <Card 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border-slate-200 transition-all ${
                                snapshot.isDragging ? 'shadow-2xl border-indigo-400 bg-indigo-50' : ''
                              }`}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="text-3xl cursor-move hover:scale-110 transition-transform"
                                  >
                                    {mealIcons[mealType]}
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="font-semibold text-lg text-slate-900 capitalize">
                                        {mealType}
                                      </h3>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => saveMealToFavorites(meal, mealType)}
                                        >
                                          <Heart className="w-4 h-4 mr-1" />
                                          Favorite
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => regenerateMeal(selectedDay, mealType)}
                                          disabled={regeneratingMeal === `${selectedDay}-${mealType}`}
                                        >
                                          {regeneratingMeal === `${selectedDay}-${mealType}` ? (
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-4 h-4 mr-1" />
                                          )}
                                          Regenerate
                                        </Button>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Flame className="w-3 h-3 text-orange-500" />
                                          {meal.calories}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                                          Drag
                                        </Badge>
                                      </div>
                                    </div>
                          
                          <h4 className="text-slate-800 font-medium mb-3">
                                            {meal.name}
                                          </h4>

                                          {/* Macro Display */}
                                          {(meal.protein || meal.carbs || meal.fat) && (
                                            <div className="flex gap-2 mb-4 flex-wrap">
                                              {meal.protein && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                                  Protein: {meal.protein}g
                                                </Badge>
                                              )}
                                              {meal.carbs && (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                  Carbs: {meal.carbs}g
                                                </Badge>
                                              )}
                                              {meal.fat && (
                                                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                                                  Fat: {meal.fat}g
                                                </Badge>
                                              )}
                                            </div>
                                          )}

                                          <div className="space-y-4">
                                            {/* Health Benefit */}
                                            {meal.healthBenefit && (
                                              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                                <div className="flex items-start gap-2">
                                                  <Heart className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                                  <div>
                                                    <p className="text-xs font-medium text-emerald-900 mb-0.5">Why This Helps</p>
                                                    <p className="text-sm text-emerald-700">{meal.healthBenefit}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* Prep Info */}
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                              {meal.prepTime && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                  <Clock className="w-3 h-3" />
                                                  {meal.prepTime}
                                                </div>
                                              )}
                                              {meal.difficulty && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                  <ChefHat className="w-3 h-3" />
                                                  {meal.difficulty}
                                                </div>
                                              )}
                                              {meal.equipment?.length > 0 && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                  <Wrench className="w-3 h-3" />
                                                  {meal.equipment.length} tools
                                                </div>
                                              )}
                                            </div>

                                            {/* Prep Steps */}
                                            {meal.prepSteps?.length > 0 && (
                                              <div>
                                                <p className="text-xs font-medium text-slate-700 mb-2">Preparation Steps</p>
                                                <ol className="space-y-1.5 text-sm text-slate-600">
                                                  {meal.prepSteps.map((step, idx) => (
                                                    <li key={idx} className="flex gap-2">
                                                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-medium">
                                                        {idx + 1}
                                                      </span>
                                                      <span className="flex-1">{step}</span>
                                                    </li>
                                                  ))}
                                                </ol>
                                              </div>
                                            )}

                                            {/* Equipment */}
                                            {meal.equipment?.length > 0 && (
                                              <div>
                                                <p className="text-xs font-medium text-slate-700 mb-1">Equipment Needed</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {meal.equipment.map((item, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                      {item}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                              {provided.placeholder}
                            </div>
                          )}
                          </Droppable>
                          );
                          })}
                          </motion.div>
                          )}
                          </>
                          )}
                          </DragDropContext>

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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const items = Object.entries(groceryList || {})
                          .map(([cat, items]) => {
                            const itemsList = items.map(i => {
                              const qty = i.quantity && i.quantity !== 1 ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : '';
                              const price = i.price ? ` - $${(i.price * (i.quantity || 1)).toFixed(2)}` : '';
                              const notes = i.notes ? ` [${i.notes}]` : '';
                              return `  • ${i.name}${qty}${price}${notes}`;
                            }).join('\n');
                            return `${cat}:\n${itemsList}`;
                          })
                          .join('\n\n');
                        const total = Object.values(groceryList || {}).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                        navigator.clipboard.writeText(`${items}\n\n--- Total: $${total.toFixed(2)} ---`);
                        toast.success('Copied to clipboard');
                      }}
                    >
                      Copy List
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const content = Object.entries(groceryList || {})
                          .map(([cat, items]) => `${cat}:\n${items.map(i => `  • ${i.name}`).join('\n')}`)
                          .join('\n\n');
                        const subject = encodeURIComponent(`Grocery List - ${plan.name}`);
                        const body = encodeURIComponent(content);
                        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
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