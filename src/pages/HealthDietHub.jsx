import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Loader2, Heart, Users, Calendar, ShoppingCart, Save, Flame, Salad } from 'lucide-react';
import { toast } from 'sonner';

const healthGoals = [
  { value: 'liver_health', label: 'Liver Health', icon: Heart, color: 'rose' },
  { value: 'weight_loss', label: 'Weight Loss', icon: Flame, color: 'orange' },
  { value: 'blood_sugar_control', label: 'Blood Sugar Control', icon: Salad, color: 'emerald' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: Flame, color: 'blue' },
  { value: 'heart_health', label: 'Heart Health', icon: Heart, color: 'red' },
  { value: 'kidney_health', label: 'Kidney Health', icon: Heart, color: 'teal' },
  { value: 'digestive_health', label: 'Digestive Health', icon: Salad, color: 'green' },
  { value: 'energy_boost', label: 'Energy Boost', icon: Sparkles, color: 'yellow' },
  { value: 'immune_support', label: 'Immune Support', icon: Sparkles, color: 'indigo' },
  { value: 'anti_inflammatory', label: 'Anti-Inflammatory', icon: Heart, color: 'pink' },
  { value: 'bone_health', label: 'Bone Health', icon: Salad, color: 'amber' },
  { value: 'general_wellness', label: 'General Wellness', icon: Sparkles, color: 'purple' },
];

const groceryCategories = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alternatives', 'Other'];

export default function HealthDietHub() {
  const [healthGoal, setHealthGoal] = useState('liver_health');
  const [foodsLiked, setFoodsLiked] = useState('');
  const [foodsAvoided, setFoodsAvoided] = useState('');
  const [duration, setDuration] = useState('week');
  const [numPeople, setNumPeople] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [planName, setPlanName] = useState('');

  const queryClient = useQueryClient();

  const { data: userPrefs } = useQuery({
    queryKey: ['userPrefs'],
    queryFn: () => base44.entities.UserPreferences.list(),
    select: (data) => data?.[0] || null,
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults'],
    queryFn: () => base44.entities.LabResult.list('-upload_date'),
  });

  const savePlanMutation = useMutation({
    mutationFn: (planData) => base44.entities.MealPlan.create(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan saved successfully!');
    },
  });

  const getHealthContext = () => {
    if (!labResults.length) return '';
    
    const latest = labResults[0];
    const abnormals = [];
    
    if (latest.biomarkers?.ALT?.status === 'high') {
      abnormals.push('elevated ALT (liver enzyme)');
    }
    if (latest.biomarkers?.AST?.status === 'high') {
      abnormals.push('elevated AST (liver enzyme)');
    }
    if (latest.biomarkers?.Glucose?.status === 'high') {
      abnormals.push('high glucose');
    }
    if (latest.biomarkers?.Glucose?.status === 'low') {
      abnormals.push('low glucose');
    }
    
    if (abnormals.length === 0) return 'All biomarkers within normal range.';
    
    return `IMPORTANT HEALTH CONSIDERATIONS: Patient has ${abnormals.join(', ')}. Prioritize anti-inflammatory, liver-friendly, and low-glycemic foods.`;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    const daysCount = duration === 'day' ? 1 : duration === '3days' ? 3 : 7;
    const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    
    const healthContext = getHealthContext();
    const goalDescription = healthGoals.find(g => g.value === healthGoal)?.label || 'General Wellness';
    
    const prompt = `You are a professional nutritionist. Create a ${daysCount}-day personalized meal plan.

HEALTH PROFILE:
- Primary Goal: ${goalDescription}
- ${healthContext}
- Number of people: ${numPeople}
${foodsLiked ? `- Foods they enjoy: ${foodsLiked}` : ''}
${foodsAvoided ? `- Foods to avoid: ${foodsAvoided}` : ''}
${userPrefs?.dietary_restrictions ? `- Dietary restrictions: ${userPrefs.dietary_restrictions}` : ''}

For each day, provide:
- Breakfast, Lunch, Dinner, and Snacks
- Each meal should include: name, brief description (1 sentence), calories (range like "400-450 kcal"), and a health benefit note
- Make meals practical, delicious, and aligned with their health goals
- Scale ingredients for ${numPeople} ${numPeople === 1 ? 'person' : 'people'}

Return a JSON object with the meal plan and health notes.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            health_notes: {
              type: "string",
              description: "2-3 sentences about how this plan supports their health goals"
            },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  breakfast: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "string" },
                      health_benefit: { type: "string" }
                    }
                  },
                  lunch: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "string" },
                      health_benefit: { type: "string" }
                    }
                  },
                  dinner: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "string" },
                      health_benefit: { type: "string" }
                    }
                  },
                  snacks: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "string" },
                      health_benefit: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setGeneratedPlan(response);
      setCheckedItems(new Set());
      setPlanName(`${goalDescription} Plan - ${new Date().toLocaleDateString()}`);
    } catch (error) {
      toast.error('Failed to generate meal plan');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !planName.trim()) {
      toast.error('Please enter a plan name');
      return;
    }
    
    if (!generatedPlan.days || generatedPlan.days.length === 0) {
      toast.error('Invalid meal plan data');
      return;
    }
    
    savePlanMutation.mutate({
      name: planName,
      diet_type: 'custom',
      days: generatedPlan.days.map(day => ({
        day: day.day || 'Day',
        breakfast: {
          name: day.breakfast?.name || 'Breakfast',
          calories: day.breakfast?.calories || '400 kcal',
          nutrients: day.breakfast?.health_benefit || '',
          prepTip: day.breakfast?.description || ''
        },
        lunch: {
          name: day.lunch?.name || 'Lunch',
          calories: day.lunch?.calories || '500 kcal',
          nutrients: day.lunch?.health_benefit || '',
          prepTip: day.lunch?.description || ''
        },
        dinner: {
          name: day.dinner?.name || 'Dinner',
          calories: day.dinner?.calories || '600 kcal',
          nutrients: day.dinner?.health_benefit || '',
          prepTip: day.dinner?.description || ''
        },
        snacks: {
          name: day.snacks?.name || 'Mixed nuts',
          calories: day.snacks?.calories || '150-200 kcal',
          nutrients: day.snacks?.health_benefit || 'Healthy fats',
          prepTip: day.snacks?.description || 'Portion control'
        }
      })),
      preferences: {
        health_goal: healthGoal,
        foods_liked: foodsLiked,
        foods_avoided: foodsAvoided,
        num_people: numPeople
      }
    });
  };

  const generateGroceryList = () => {
    if (!generatedPlan?.days) return {};
    
    const items = new Set();
    generatedPlan.days.forEach(day => {
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
  };

  const groceryList = generatedPlan ? generateGroceryList() : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Health Diet Hub</h1>
        <p className="text-slate-600 mt-1">
          AI-powered meal plans personalized to your health profile
        </p>
      </div>

      {/* Health Alert */}
      {labResults.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Health-Optimized Recommendations</p>
                <p className="text-sm text-amber-700 mt-1">{getHealthContext()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customization Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Customize Your Meal Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Health Goal */}
          <div>
            <Label className="mb-3 block">Primary Health Goal</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {healthGoals.map(goal => {
                const Icon = goal.icon;
                const selected = healthGoal === goal.value;
                return (
                  <button
                    key={goal.value}
                    onClick={() => setHealthGoal(goal.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selected 
                        ? `border-${goal.color}-500 bg-${goal.color}-50` 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 text-${goal.color}-600`} />
                    <p className="text-sm font-medium">{goal.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Plan Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Single Day</SelectItem>
                  <SelectItem value="3days">3 Days</SelectItem>
                  <SelectItem value="week">Full Week (7 Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of People */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                Number of People
              </Label>
              <Select value={String(numPeople)} onValueChange={(val) => setNumPeople(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'person' : 'people'}</SelectItem>
                  ))}
                  <SelectItem value="10+">10+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Foods I Like</Label>
            <Textarea
              placeholder="e.g., chicken, salmon, broccoli, quinoa, berries..."
              value={foodsLiked}
              onChange={(e) => setFoodsLiked(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label>Foods to Avoid</Label>
            <Textarea
              placeholder="e.g., dairy, shellfish, gluten, red meat..."
              value={foodsAvoided}
              onChange={(e) => setFoodsAvoided(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Your Personalized Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Meal Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Plan Display */}
      <AnimatePresence>
        {generatedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Health Notes */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-emerald-900 mb-2">Health Benefits</h3>
                <p className="text-sm text-emerald-700">{generatedPlan.health_notes}</p>
              </CardContent>
            </Card>

            {/* Plan Name */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <Label className="mb-2 block">Plan Name</Label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Enter a name for this meal plan..."
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleSavePlan} 
                className="flex-1"
                disabled={savePlanMutation.isPending || !planName.trim()}
              >
                {savePlanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save This Plan
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Grocery List ({Object.values(groceryList).flat().length} items)
              </Button>
            </div>

            {/* Meal Plan Days */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Your Meal Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {generatedPlan.days?.map((day, index) => (
                    <AccordionItem key={index} value={`day-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <span className="font-semibold">{day.day}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                            const meal = day[mealType];
                            if (!meal) return null;

                            const mealIcons = {
                              breakfast: '🌅',
                              lunch: '☀️',
                              dinner: '🌙',
                              snacks: '🍎'
                            };

                            return (
                              <div key={mealType} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl">{mealIcons[mealType]}</div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-slate-900 capitalize">{mealType}</h4>
                                      <Badge variant="outline" className="flex items-center gap-1">
                                        <Flame className="w-3 h-3 text-orange-500" />
                                        {meal.calories}
                                      </Badge>
                                    </div>
                                    <p className="font-medium text-slate-800 mb-1">{meal.name}</p>
                                    <p className="text-sm text-slate-600 mb-2">{meal.description}</p>
                                    <div className="flex items-start gap-2 text-xs">
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                        💚 {meal.health_benefit}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Grocery List */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Grocery List
                </CardTitle>
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}