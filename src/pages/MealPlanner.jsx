import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, ChefHat, Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import DietSelector from '@/components/meals/DietSelector';
import CustomizationForm from '@/components/meals/CustomizationForm';
import MealPlanCard from '@/components/meals/MealPlanCard';
import SearchBar from '@/components/meals/SearchBar';
import MealPlanStats from '@/components/meals/MealPlanStats';
import GroceryList from '@/components/meals/GroceryList';

// Default meal plans data
const defaultMealPlans = {
  'liver-centric': [
    { day: 'Monday', breakfast: { name: 'Beef liver with scrambled eggs', calories: '450-500 kcal', nutrients: 'High in iron, vitamin A, and B-vitamins for liver regeneration', prepTip: 'Soak liver in milk for 30 mins before cooking to reduce strong taste' }, lunch: { name: 'Chicken liver pate with vegetables', calories: '350-400 kcal', nutrients: 'Rich in folate and choline for liver detox', prepTip: 'Blend cooked liver with herbs and garlic for smooth pate' }, dinner: { name: 'Grilled salmon with liver-friendly greens', calories: '500-550 kcal', nutrients: 'Omega-3 fatty acids support liver health and reduce inflammation', prepTip: 'Grill salmon 4-6 mins per side, serve with steamed broccoli and spinach' } },
    { day: 'Tuesday', breakfast: { name: 'Liver and onions with toast', calories: '400-450 kcal', nutrients: 'High protein and vitamin B12 for energy metabolism', prepTip: 'Cook onions until caramelized, add liver for 3-4 mins per side' }, lunch: { name: 'Grilled chicken with detox vegetables', calories: '380-430 kcal', nutrients: 'Lean protein with fiber for liver cleansing', prepTip: 'Season with turmeric and ginger for added liver benefits' }, dinner: { name: 'Turkey meatballs with Brussels sprouts', calories: '450-500 kcal', nutrients: 'Lean protein with fiber for liver support', prepTip: 'Bake meatballs at 400°F for 20 mins' } },
    { day: 'Wednesday', breakfast: { name: 'Chicken liver omelet with herbs', calories: '380-420 kcal', nutrients: 'Complete amino acids and liver-supporting nutrients', prepTip: 'Sauté diced liver first, then add beaten eggs and fold' }, lunch: { name: 'Quinoa bowl with roasted vegetables', calories: '400-450 kcal', nutrients: 'Complete protein and fiber for liver support', prepTip: 'Roast vegetables at 425°F for 25 mins' }, dinner: { name: 'Baked cod with artichokes', calories: '350-400 kcal', nutrients: 'Low fat protein with liver-cleansing artichokes', prepTip: 'Bake cod at 375°F for 12-15 mins' } },
    { day: 'Thursday', breakfast: { name: 'Liver pate on whole grain bread', calories: '320-370 kcal', nutrients: 'Complex carbs with liver nutrients', prepTip: 'Spread homemade pate on toasted bread, garnish with herbs' }, lunch: { name: 'Grilled chicken with mixed greens', calories: '400-450 kcal', nutrients: 'Lean protein with antioxidants', prepTip: 'Marinate chicken with herbs, grill 6-8 mins per side' }, dinner: { name: 'Herb-crusted lamb with asparagus', calories: '520-570 kcal', nutrients: 'Iron and B-vitamins with detoxifying asparagus', prepTip: 'Coat lamb with herb crust, roast at 400°F for 15-20 mins' } },
    { day: 'Friday', breakfast: { name: 'Liver and mushroom scramble', calories: '420-470 kcal', nutrients: 'Selenium from mushrooms supports liver detox enzymes', prepTip: 'Sauté mushrooms first, add diced liver and scrambled eggs' }, lunch: { name: 'Liver curry with brown rice', calories: '450-500 kcal', nutrients: 'Turmeric and spices enhance liver function', prepTip: 'Simmer liver in coconut milk with curry spices for 20 mins' }, dinner: { name: 'Grilled mackerel with steamed broccoli', calories: '480-530 kcal', nutrients: 'Omega-3s and sulforaphane for liver protection', prepTip: 'Grill mackerel 3-4 mins per side' } },
    { day: 'Saturday', breakfast: { name: 'Beef liver hash with vegetables', calories: '460-510 kcal', nutrients: 'High protein breakfast for sustained energy', prepTip: 'Dice liver and potatoes, fry together until crispy' }, lunch: { name: 'Chicken liver salad with greens', calories: '350-400 kcal', nutrients: 'Fresh greens with concentrated nutrients', prepTip: 'Pan-fry liver quickly, serve warm over mixed greens' }, dinner: { name: 'Baked salmon with quinoa', calories: '500-550 kcal', nutrients: 'Omega-3s and complete proteins for liver repair', prepTip: 'Bake salmon at 400°F, serve with herbed quinoa' } },
    { day: 'Sunday', breakfast: { name: 'Liver pancakes with berries', calories: '390-440 kcal', nutrients: 'Antioxidants from berries with liver nutrients', prepTip: 'Blend cooked liver into pancake batter, cook until golden' }, lunch: { name: 'Liver soup with vegetables', calories: '320-370 kcal', nutrients: 'Easy-to-digest nutrients in warming broth', prepTip: 'Simmer liver with vegetables in bone broth for 30 mins' }, dinner: { name: 'Grilled trout with roasted vegetables', calories: '450-500 kcal', nutrients: 'Omega-3s and complete proteins', prepTip: 'Grill trout 4-5 mins per side' } }
  ],
  'low-sugar': [
    { day: 'Monday', breakfast: { name: 'Greek yogurt with nuts and seeds', calories: '280-320 kcal', nutrients: 'High protein and healthy fats to stabilize blood sugar', prepTip: 'Choose plain Greek yogurt, add almonds or walnuts for crunch' }, lunch: { name: 'Grilled chicken salad with olive oil', calories: '350-400 kcal', nutrients: 'Lean protein with fiber-rich vegetables', prepTip: 'Season chicken with herbs, serve over mixed greens' }, dinner: { name: 'Baked salmon with steamed vegetables', calories: '450-500 kcal', nutrients: 'Omega-3s and low-glycemic vegetables', prepTip: 'Bake salmon at 400°F for 12-15 mins' } },
    { day: 'Tuesday', breakfast: { name: 'Scrambled eggs with spinach and avocado', calories: '320-370 kcal', nutrients: 'Complete protein with healthy fats', prepTip: 'Scramble eggs in olive oil, wilt fresh spinach' }, lunch: { name: 'Turkey and avocado lettuce wraps', calories: '380-430 kcal', nutrients: 'Healthy fats and protein for sustained energy', prepTip: 'Use large lettuce leaves as wraps' }, dinner: { name: 'Lean beef stir-fry with broccoli', calories: '420-470 kcal', nutrients: 'Iron and fiber with minimal carbohydrates', prepTip: 'Stir-fry beef quickly over high heat' } },
    { day: 'Wednesday', breakfast: { name: 'Cottage cheese with cucumber and herbs', calories: '200-250 kcal', nutrients: 'Casein protein for slow digestion', prepTip: 'Add herbs and pepper for flavor' }, lunch: { name: 'Tuna salad with mixed greens', calories: '320-370 kcal', nutrients: 'Omega-3s and protein with low carb vegetables', prepTip: 'Use olive oil instead of mayo' }, dinner: { name: 'Grilled pork chops with asparagus', calories: '450-500 kcal', nutrients: 'Lean protein with fiber', prepTip: 'Grill pork 5-6 mins per side' } },
    { day: 'Thursday', breakfast: { name: 'Omelet with cheese and vegetables', calories: '350-400 kcal', nutrients: 'Protein and healthy fats', prepTip: 'Use bell peppers, onions, and mushrooms' }, lunch: { name: 'Grilled shrimp with zucchini noodles', calories: '300-350 kcal', nutrients: 'Low carb with lean protein', prepTip: 'Spiralize zucchini for noodles' }, dinner: { name: 'Baked chicken thighs with cauliflower', calories: '480-530 kcal', nutrients: 'Protein with low-glycemic vegetables', prepTip: 'Roast cauliflower at 400°F' } },
    { day: 'Friday', breakfast: { name: 'Smoked salmon with cream cheese', calories: '300-350 kcal', nutrients: 'Omega-3s and protein', prepTip: 'Serve on cucumber slices' }, lunch: { name: 'Chicken caesar salad (no croutons)', calories: '380-430 kcal', nutrients: 'Protein-rich with healthy fats', prepTip: 'Use homemade dressing' }, dinner: { name: 'Grilled lamb chops with green beans', calories: '500-550 kcal', nutrients: 'Iron and B-vitamins', prepTip: 'Grill lamb 4-5 mins per side' } },
    { day: 'Saturday', breakfast: { name: 'Bacon and eggs with avocado', calories: '450-500 kcal', nutrients: 'High protein and healthy fats', prepTip: 'Use nitrate-free bacon' }, lunch: { name: 'Stuffed bell peppers with ground turkey', calories: '400-450 kcal', nutrients: 'Lean protein with vegetables', prepTip: 'Bake at 375°F for 25 mins' }, dinner: { name: 'Grilled steak with mushrooms', calories: '520-570 kcal', nutrients: 'Iron and selenium', prepTip: 'Grill to desired doneness' } },
    { day: 'Sunday', breakfast: { name: 'Protein smoothie with almond milk', calories: '280-330 kcal', nutrients: 'Protein with healthy fats', prepTip: 'Add spinach and nut butter' }, lunch: { name: 'Cobb salad with grilled chicken', calories: '420-470 kcal', nutrients: 'Complete nutrition in one meal', prepTip: 'Include eggs, bacon, and avocado' }, dinner: { name: 'Baked cod with roasted vegetables', calories: '380-430 kcal', nutrients: 'Lean protein with fiber', prepTip: 'Bake at 400°F for 15 mins' } }
  ],
  'vegetarian': [
    { day: 'Monday', breakfast: { name: 'Overnight oats with berries and nuts', calories: '350-400 kcal', nutrients: 'Complex carbs and antioxidants', prepTip: 'Prepare the night before with almond milk' }, lunch: { name: 'Quinoa Buddha bowl with tahini', calories: '450-500 kcal', nutrients: 'Complete plant protein', prepTip: 'Roast chickpeas for extra crunch' }, dinner: { name: 'Lentil curry with brown rice', calories: '480-530 kcal', nutrients: 'High fiber and plant protein', prepTip: 'Simmer lentils with coconut milk and spices' } },
    { day: 'Tuesday', breakfast: { name: 'Avocado toast with poached eggs', calories: '380-430 kcal', nutrients: 'Healthy fats and protein', prepTip: 'Use whole grain bread, add chili flakes' }, lunch: { name: 'Greek salad with feta and olives', calories: '320-370 kcal', nutrients: 'Mediterranean nutrition with healthy fats', prepTip: 'Use extra virgin olive oil dressing' }, dinner: { name: 'Vegetable stir-fry with tofu', calories: '400-450 kcal', nutrients: 'Plant protein with fiber', prepTip: 'Press tofu before cooking for better texture' } },
    { day: 'Wednesday', breakfast: { name: 'Smoothie bowl with granola', calories: '400-450 kcal', nutrients: 'Vitamins and fiber', prepTip: 'Blend frozen fruits with plant milk' }, lunch: { name: 'Caprese sandwich with pesto', calories: '420-470 kcal', nutrients: 'Calcium and healthy fats', prepTip: 'Use fresh mozzarella and basil' }, dinner: { name: 'Black bean tacos with guacamole', calories: '480-530 kcal', nutrients: 'Fiber and healthy fats', prepTip: 'Season beans with cumin and lime' } },
    { day: 'Thursday', breakfast: { name: 'Chia pudding with mango', calories: '300-350 kcal', nutrients: 'Omega-3s and fiber', prepTip: 'Prepare overnight with coconut milk' }, lunch: { name: 'Hummus wrap with roasted vegetables', calories: '400-450 kcal', nutrients: 'Plant protein and fiber', prepTip: 'Roast peppers and zucchini' }, dinner: { name: 'Mushroom risotto with parmesan', calories: '500-550 kcal', nutrients: 'Complex carbs and umami flavor', prepTip: 'Use vegetable broth and stir frequently' } },
    { day: 'Friday', breakfast: { name: 'Banana pancakes with maple syrup', calories: '420-470 kcal', nutrients: 'Energy from natural sugars', prepTip: 'Mash bananas into the batter' }, lunch: { name: 'Mediterranean mezze platter', calories: '450-500 kcal', nutrients: 'Variety of nutrients from multiple sources', prepTip: 'Include falafel, hummus, and tabbouleh' }, dinner: { name: 'Eggplant parmesan with salad', calories: '480-530 kcal', nutrients: 'Fiber and calcium', prepTip: 'Bake instead of fry for healthier version' } },
    { day: 'Saturday', breakfast: { name: 'Shakshuka with crusty bread', calories: '400-450 kcal', nutrients: 'Protein and lycopene', prepTip: 'Simmer eggs in spiced tomato sauce' }, lunch: { name: 'Grilled halloumi salad', calories: '380-430 kcal', nutrients: 'Protein and calcium', prepTip: 'Grill halloumi until golden' }, dinner: { name: 'Vegetable pad thai with peanuts', calories: '500-550 kcal', nutrients: 'Complex carbs and protein', prepTip: 'Use rice noodles and tamarind sauce' } },
    { day: 'Sunday', breakfast: { name: 'French toast with fresh fruit', calories: '450-500 kcal', nutrients: 'Protein and vitamins', prepTip: 'Use thick bread and cinnamon' }, lunch: { name: 'Spinach and ricotta stuffed shells', calories: '480-530 kcal', nutrients: 'Calcium and iron', prepTip: 'Bake with marinara sauce' }, dinner: { name: 'Chickpea coconut curry', calories: '450-500 kcal', nutrients: 'Plant protein and healthy fats', prepTip: 'Serve with basmati rice' } }
  ]
};

export default function MealPlanner() {
  const [selectedDiet, setSelectedDiet] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGroceryList, setShowGroceryList] = useState(false);
  
  const queryClient = useQueryClient();

  // Load saved meal plans
  const { data: savedPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date'),
  });

  // Save meal plan mutation
  const saveMutation = useMutation({
    mutationFn: (planData) => base44.entities.MealPlan.create(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan saved!');
    },
  });

  // Delete meal plan mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MealPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan deleted');
    },
  });

  // Handle diet selection
  const handleDietSelect = (dietId) => {
    setSelectedDiet(dietId);
    if (dietId !== 'custom' && defaultMealPlans[dietId]) {
      setCurrentPlan({
        diet_type: dietId,
        days: defaultMealPlans[dietId]
      });
    } else if (dietId === 'custom') {
      setCurrentPlan(null);
    }
  };

  // Generate custom meal plan with AI
  const handleGenerateCustomPlan = async (preferences) => {
    setIsGenerating(true);
    
    const daysCount = preferences.duration === 'day' ? 1 : preferences.duration === '3days' ? 3 : 7;
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const prompt = `Create a ${daysCount}-day personalized meal plan with the following requirements:
    
Foods the user likes: ${preferences.foodsLiked || 'No specific preferences'}
Foods to avoid: ${preferences.foodsAvoided || 'None'}
Meal focus: ${preferences.mealFocus}
Additional notes: ${preferences.dietaryNotes || 'None'}

For each day, provide breakfast, lunch, and dinner with:
- Meal name
- Calorie estimate (format: "XXX-XXX kcal")
- Key nutrients and health benefits
- A preparation tip

Return as JSON array with this structure:
[{
  "day": "Monday",
  "breakfast": { "name": "...", "calories": "XXX-XXX kcal", "nutrients": "...", "prepTip": "..." },
  "lunch": { "name": "...", "calories": "XXX-XXX kcal", "nutrients": "...", "prepTip": "..." },
  "dinner": { "name": "...", "calories": "XXX-XXX kcal", "nutrients": "...", "prepTip": "..." }
}]

Generate exactly ${daysCount} days starting from ${dayNames[0]}.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            meal_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  breakfast: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      calories: { type: "string" },
                      nutrients: { type: "string" },
                      prepTip: { type: "string" }
                    }
                  },
                  lunch: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      calories: { type: "string" },
                      nutrients: { type: "string" },
                      prepTip: { type: "string" }
                    }
                  },
                  dinner: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      calories: { type: "string" },
                      nutrients: { type: "string" },
                      prepTip: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (response?.meal_plan) {
        setCurrentPlan({
          diet_type: 'custom',
          days: response.meal_plan,
          preferences
        });
        toast.success('Custom meal plan generated!');
      }
    } catch (error) {
      toast.error('Failed to generate meal plan. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save current plan
  const handleSavePlan = () => {
    if (!currentPlan) return;
    
    const dietLabels = {
      'liver-centric': 'Liver-Centric',
      'low-sugar': 'Low-Sugar',
      'vegetarian': 'Vegetarian',
      'custom': 'Custom AI'
    };
    
    saveMutation.mutate({
      name: `${dietLabels[currentPlan.diet_type]} Plan - ${new Date().toLocaleDateString()}`,
      diet_type: currentPlan.diet_type,
      days: currentPlan.days,
      preferences: currentPlan.preferences || {}
    });
  };

  // Load saved plan
  const handleLoadPlan = (plan) => {
    setSelectedDiet(plan.diet_type);
    setCurrentPlan({
      diet_type: plan.diet_type,
      days: plan.days,
      preferences: plan.preferences
    });
    toast.success('Meal plan loaded');
  };

  // Filter meals by search term
  const filteredPlan = useMemo(() => {
    if (!currentPlan?.days || !searchTerm) return currentPlan;

    const filtered = currentPlan.days.filter(day => {
      const searchLower = searchTerm.toLowerCase();
      return ['breakfast', 'lunch', 'dinner', 'snacks'].some(mealType => 
        day[mealType]?.name?.toLowerCase().includes(searchLower)
      );
    });

    return { ...currentPlan, days: filtered };
  }, [currentPlan, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <ChefHat className="w-5 h-5" />
              <span className="text-sm font-medium">Personal Meal Planner</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Plan Your Perfect Week
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Create personalized 7-day meal plans tailored to your dietary preferences and health goals
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Diet Selector */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Choose Your Diet Type</h2>
          <DietSelector selectedDiet={selectedDiet} onSelect={handleDietSelect} />
        </section>

        {/* Custom AI Form */}
        <AnimatePresence>
          {selectedDiet === 'custom' && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <CustomizationForm onGenerate={handleGenerateCustomPlan} isLoading={isGenerating} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Current Meal Plan */}
        <AnimatePresence>
          {currentPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats */}
              <section className="mb-6">
                <MealPlanStats mealPlan={currentPlan} />
              </section>

              {/* Search and Actions */}
              <section className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <div className="flex-1">
                  <SearchBar 
                    value={searchTerm} 
                    onChange={setSearchTerm}
                    placeholder="Search meals by ingredient..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowGroceryList(!showGroceryList)}
                    className="whitespace-nowrap"
                  >
                    {showGroceryList ? 'Hide Grocery List' : 'Grocery List'}
                  </Button>
                  <Button 
                    onClick={handleSavePlan}
                    disabled={saveMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Plan
                  </Button>
                </div>
              </section>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Meal Plan Cards */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800 mb-2">Your 7-Day Meal Plan</h2>
                  {filteredPlan?.days?.length > 0 ? (
                    filteredPlan.days.map((day, index) => (
                      <MealPlanCard 
                        key={day.day} 
                        dayPlan={day} 
                        searchTerm={searchTerm}
                        defaultExpanded={index === 0}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                      <p className="text-slate-500">No meals found for "{searchTerm}"</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Grocery List */}
                  <AnimatePresence>
                    {showGroceryList && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <GroceryList mealPlan={currentPlan} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Saved Plans */}
                  {savedPlans.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                          <Bookmark className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">Saved Plans</h3>
                          <p className="text-sm text-slate-500">{savedPlans.length} plans</p>
                        </div>
                      </div>
                      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                        {savedPlans.map((plan) => (
                          <div
                            key={plan.id}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                          >
                            <button
                              onClick={() => handleLoadPlan(plan)}
                              className="flex-1 text-left"
                            >
                              <p className="font-medium text-slate-700 text-sm">{plan.name}</p>
                              <p className="text-xs text-slate-400">{plan.days?.length} days</p>
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(plan.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}