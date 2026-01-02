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
import { Sparkles, Loader2, Heart, Users, Calendar, ShoppingCart, Save, Flame, Salad, DollarSign, AlertTriangle, RefreshCw, Utensils } from 'lucide-react';
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

const culturalStyles = [
  { value: 'none', label: 'Any / Mixed', emoji: '🌍' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'asian', label: 'Asian', emoji: '🍜' },
  { value: 'indian', label: 'Indian', emoji: '🍛' },
  { value: 'latin_american', label: 'Latin American', emoji: '🌮' },
  { value: 'african', label: 'African', emoji: '🥘' },
  { value: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆' },
  { value: 'european', label: 'European', emoji: '🥖' },
  { value: 'fusion', label: 'Fusion', emoji: '✨' },
];

const lifeStages = [
  { value: 'general', label: 'General Adult' },
  { value: 'children', label: 'Children (Nutrient-Dense)' },
  { value: 'pregnancy', label: 'Pregnancy (Folate/Iron Focus)' },
  { value: 'seniors', label: 'Seniors (Easy Prep, Bone Health)' },
];

const groceryCategories = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alternatives', 'Other'];

const commonAllergens = [
  { value: 'nuts', label: 'Nuts' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'soy', label: 'Soy' },
  { value: 'fish', label: 'Fish' },
  { value: 'sesame', label: 'Sesame' },
];

const cuisineOptions = [
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'asian', label: 'Asian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'italian', label: 'Italian' },
  { value: 'american', label: 'American' },
  { value: 'indian', label: 'Indian' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'greek', label: 'Greek' },
];

export default function HealthDietHub() {
  const [healthGoal, setHealthGoal] = useState('liver_health');
  const [foodsLiked, setFoodsLiked] = useState('');
  const [foodsAvoided, setFoodsAvoided] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [duration, setDuration] = useState('week');
  const [numPeople, setNumPeople] = useState(1);
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [maxBudget, setMaxBudget] = useState(500);
  const [allergens, setAllergens] = useState([]);
  const [cuisinePreferences, setCuisinePreferences] = useState([]);
  const [cookingTime, setCookingTime] = useState('any');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [culturalStyle, setCulturalStyle] = useState('none');
  const [customCulturalStyle, setCustomCulturalStyle] = useState('');
  const [lifeStage, setLifeStage] = useState('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [planName, setPlanName] = useState('');
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [regeneratingImage, setRegeneratingImage] = useState(null);

  const queryClient = useQueryClient();

  const fetchGroceryPrices = async (plan) => {
    if (!plan?.days) return;
    
    setIsFetchingPrices(true);
    
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

    const itemsList = Array.from(items).join(', ');
    
    try {
      const priceData = await base44.integrations.Core.InvokeLLM({
        prompt: `Get current average grocery prices in USD for these items (scaled for ${numPeople} people for a week): ${itemsList}. 
        Return prices as approximate cost per typical package/unit from major US grocery stores. 
        For items serving ${numPeople} people for a week, estimate quantities needed.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number", description: "Price in USD" },
                  unit: { type: "string", description: "e.g. per lb, per dozen, per bag" }
                }
              }
            }
          }
        }
      });

      if (priceData?.items) {
        const priceMap = {};
        priceData.items.forEach(item => {
          // Create multiple keys for better matching
          const itemName = item.name.toLowerCase();
          const basePrice = {
            name: item.name,
            price: item.price,
            unit: item.unit
          };
          
          // Add full name
          priceMap[itemName] = basePrice;
          
          // Add individual words (e.g., "chicken breast" -> "chicken", "breast")
          itemName.split(/[\s,]+/).forEach(word => {
            if (word.length > 3) {
              priceMap[word] = basePrice;
            }
          });
        });
        
        setGeneratedPlan(prev => ({
          ...prev,
          grocery_prices: priceMap
        }));
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      toast.error('Could not fetch current prices');
    } finally {
      setIsFetchingPrices(false);
    }
  };

  const { data: userPrefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
    select: (data) => data?.[0] || null,
  });

  // Auto-populate form from saved preferences
  React.useEffect(() => {
    if (userPrefs) {
      if (userPrefs.health_goal) setHealthGoal(userPrefs.health_goal);
      if (userPrefs.foods_liked) setFoodsLiked(userPrefs.foods_liked);
      if (userPrefs.foods_avoided) setFoodsAvoided(userPrefs.foods_avoided);
      if (userPrefs.allergens) setAllergens(userPrefs.allergens);
      if (userPrefs.cuisine_preferences) setCuisinePreferences(userPrefs.cuisine_preferences);
      if (userPrefs.cooking_time) setCookingTime(userPrefs.cooking_time);
      if (userPrefs.skill_level) setSkillLevel(userPrefs.skill_level);
      if (userPrefs.num_people) setNumPeople(userPrefs.num_people);
      if (userPrefs.weekly_budget) setWeeklyBudget(userPrefs.weekly_budget);
      if (userPrefs.dietary_restrictions) setCustomRequirements(userPrefs.dietary_restrictions);
      toast.success('Loaded your profile preferences!', { duration: 2000 });
    }
  }, [userPrefs]);

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
    
    const allergenText = allergens.length > 0 ? `- STRICT ALLERGEN RESTRICTIONS (NEVER include): ${allergens.join(', ')}` : '';
    const cuisineText = cuisinePreferences.length > 0 ? `- Preferred Cuisines: ${cuisinePreferences.join(', ')}` : '';
    const timeText = cookingTime !== 'any' ? `- Cooking Time Preference: ${cookingTime}` : '';
    const skillText = `- Cooking Skill Level: ${skillLevel}`;
    const effectiveCulturalStyle = customCulturalStyle.trim() || (culturalStyle !== 'none' ? culturalStyle : '');
    const culturalText = effectiveCulturalStyle ? `- CULTURAL STYLE: ${effectiveCulturalStyle.toUpperCase()} - All meals must be authentic to this cuisine with traditional ingredients, spices, and cooking methods` : '';
    const lifeStageText = lifeStage !== 'general' ? `- LIFE STAGE: ${lifeStage.toUpperCase()} - Adjust portions, textures, and nutrients accordingly` : '';

    const prompt = `You are a professional nutritionist specializing in culturally authentic, health-focused meal planning. Create a ${daysCount}-day personalized meal plan.

HEALTH PROFILE:
- Primary Goal: ${goalDescription}
- ${healthContext}
- Number of people: ${numPeople}
- Plan Budget Target: $${weeklyBudget}
${culturalText}
${lifeStageText}
${allergenText}
${cuisineText}
${timeText}
${skillText}
${customRequirements ? `- Custom Requirements: ${customRequirements}` : ''}
${foodsLiked ? `- Foods they enjoy: ${foodsLiked}` : ''}
${foodsAvoided ? `- Foods to avoid: ${foodsAvoided}` : ''}
${userPrefs?.dietary_restrictions ? `- Dietary restrictions: ${userPrefs.dietary_restrictions}` : ''}

IMPORTANT REQUIREMENTS:
- Scale ALL portions and ingredients for ${numPeople} ${numPeople === 1 ? 'person' : 'people'}
- Keep TOTAL cost around $${weeklyBudget} (for all ${numPeople} ${numPeople === 1 ? 'person' : 'people'}) by using affordable, seasonal ingredients
- Each meal must clearly show "Serves ${numPeople}" and calories PER PERSON
- If muscle gain/athletic goal: prioritize high protein (1.6-2g/kg), show macro breakdown
- NEVER include allergens: ${allergens.join(', ') || 'none specified'}
${effectiveCulturalStyle ? `- ALL meals must be ${effectiveCulturalStyle} style with authentic spices, techniques, and presentation` : ''}
${lifeStage === 'children' ? '- Make meals fun, colorful, nutrient-dense, easy to eat' : ''}
${lifeStage === 'pregnancy' ? '- Focus on folate, iron, calcium, omega-3; avoid raw/undercooked foods' : ''}
${lifeStage === 'seniors' ? '- Easy to chew/digest, bone health focus, simple preparation' : ''}

For each day, provide:
- Breakfast, Lunch, Dinner, and Snacks
- Each meal MUST include: 
  * name (culturally appropriate)
  * description
  * calories PER PERSON (as string like "400 kcal")
  * protein, carbs, fat (in grams, as numbers)
  * prepSteps (array of 3-5 clear cooking steps)
  * prepTime (e.g., "15 minutes")
  * difficulty (Easy/Medium/Hard)
  * equipment (array, e.g., ["skillet", "cutting board"])
  * healthBenefit (specific health benefit for the goal, e.g., "Turmeric supports liver detoxification")

Return a JSON object with the meal plan, health notes, estimated weekly cost, and average daily macros.`;

    try {
      // Generate meal plan
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            health_notes: {
              type: "string",
              description: "2-3 sentences about how this plan supports their health goals"
            },
            estimated_weekly_cost: {
              type: "number",
              description: "Estimated total cost for the plan duration in dollars"
            },
            average_daily_macros: {
              type: "object",
              properties: {
                protein: { type: "number", description: "Grams per person per day" },
                carbs: { type: "number", description: "Grams per person per day" },
                fat: { type: "number", description: "Grams per person per day" }
              }
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
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      health_benefit: { type: "string" }
                    }
                  },
                  lunch: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "string" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      health_benefit: { type: "string" }
                    }
                  },
                  dinner: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "string" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      health_benefit: { type: "string" }
                    }
                  },
                  snacks: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "string" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
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

      const effectiveCulturalLabel = customCulturalStyle.trim() || (culturalStyle !== 'none' ? culturalStyles.find(s => s.value === culturalStyle)?.label : '');
      const culturalLabel = effectiveCulturalLabel ? ` ${effectiveCulturalLabel}` : '';
      const budgetText = weeklyBudget ? ` ($${weeklyBudget})` : '';
      const peopleText = numPeople > 1 ? ` for ${numPeople}` : '';
      setPlanName(`${goalDescription}${culturalLabel} Plan${peopleText}${budgetText} - ${new Date().toLocaleDateString()}`);

      // Fetch real grocery prices
      fetchGroceryPrices(response);

      // Generate images for meals in background
      generateMealImages(response);
    } catch (error) {
      toast.error('Failed to generate meal plan');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMealImages = async (plan) => {
    if (!plan?.days) return;
    
    setGeneratingImages(true);
    const updatedDays = [...plan.days];
    
    try {
      // Generate images for all days
      const imagesToGenerate = [];
      for (let i = 0; i < plan.days.length; i++) {
        const day = plan.days[i];
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          if (day[mealType]?.name) {
            imagesToGenerate.push({ dayIndex: i, mealType, mealName: day[mealType].name });
          }
        });
      }

      // Generate images (breakfast & lunch for each day to start)
      for (const { dayIndex, mealType, mealName } of imagesToGenerate.slice(0, Math.min(10, imagesToGenerate.length))) {
        try {
          const effectiveCulturalStyle = customCulturalStyle.trim() || (culturalStyle !== 'none' ? culturalStyle : '');
          const culturalContext = effectiveCulturalStyle ? `${effectiveCulturalStyle} style ` : '';
          const result = await base44.integrations.Core.GenerateImage({
            prompt: `Professional food photography of ${culturalContext}${mealName}, appetizing presentation, natural lighting, high quality, restaurant style plating`
          });
          
          if (result?.url) {
            updatedDays[dayIndex][mealType].imageUrl = result.url;
            setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
          }
        } catch (err) {
          console.log('Image generation skipped for', mealName);
          // Set error flag so we show placeholder
          updatedDays[dayIndex][mealType].imageError = true;
          setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
        }
      }
    } catch (error) {
      console.log('Image generation completed with some skips');
    } finally {
      setGeneratingImages(false);
    }
  };

  const regenerateMealImage = async (dayIndex, mealType) => {
    const meal = generatedPlan.days[dayIndex][mealType];
    if (!meal?.name) return;
    
    setRegeneratingImage(`${dayIndex}-${mealType}`);
    
    try {
      const effectiveCulturalStyle = customCulturalStyle.trim() || (culturalStyle !== 'none' ? culturalStyle : '');
      const culturalContext = effectiveCulturalStyle ? `${effectiveCulturalStyle} style ` : '';
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional food photography of ${culturalContext}${meal.name}, appetizing presentation, natural lighting, high quality, restaurant style plating`
      });
      
      if (result?.url) {
        const updatedDays = [...generatedPlan.days];
        updatedDays[dayIndex][mealType].imageUrl = result.url;
        updatedDays[dayIndex][mealType].imageError = false;
        setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
        toast.success('Image regenerated');
      }
    } catch (error) {
      toast.error('Failed to generate image');
      const updatedDays = [...generatedPlan.days];
      updatedDays[dayIndex][mealType].imageError = true;
      setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
    } finally {
      setRegeneratingImage(null);
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

    const currentTotalCost = generatedPlan.grocery_prices 
      ? Object.values(generatedPlan.grocery_prices).reduce((sum, item) => sum + (item.price || 0), 0)
      : null;
    
    savePlanMutation.mutate({
    name: planName,
    diet_type: 'custom',
    estimated_cost: generatedPlan.estimated_weekly_cost || null,
    current_total_cost: currentTotalCost,
    grocery_list: groceryList,
    macros: generatedPlan.average_daily_macros || null,
    cultural_style: customCulturalStyle.trim() || culturalStyle,
    life_stage: lifeStage,
      days: generatedPlan.days.map(day => ({
        day: day.day || 'Day',
        breakfast: {
          name: day.breakfast?.name || 'Breakfast',
          calories: day.breakfast?.calories || '400 kcal',
          protein: day.breakfast?.protein,
          carbs: day.breakfast?.carbs,
          fat: day.breakfast?.fat,
          nutrients: day.breakfast?.healthBenefit || '',
          prepTip: day.breakfast?.description || '',
          prepSteps: day.breakfast?.prepSteps || [],
          prepTime: day.breakfast?.prepTime || '',
          difficulty: day.breakfast?.difficulty || '',
          equipment: day.breakfast?.equipment || [],
          healthBenefit: day.breakfast?.healthBenefit || '',
          imageUrl: day.breakfast?.imageUrl || ''
        },
        lunch: {
          name: day.lunch?.name || 'Lunch',
          calories: day.lunch?.calories || '500 kcal',
          protein: day.lunch?.protein,
          carbs: day.lunch?.carbs,
          fat: day.lunch?.fat,
          nutrients: day.lunch?.healthBenefit || '',
          prepTip: day.lunch?.description || '',
          prepSteps: day.lunch?.prepSteps || [],
          prepTime: day.lunch?.prepTime || '',
          difficulty: day.lunch?.difficulty || '',
          equipment: day.lunch?.equipment || [],
          healthBenefit: day.lunch?.healthBenefit || '',
          imageUrl: day.lunch?.imageUrl || ''
        },
        dinner: {
          name: day.dinner?.name || 'Dinner',
          calories: day.dinner?.calories || '600 kcal',
          protein: day.dinner?.protein,
          carbs: day.dinner?.carbs,
          fat: day.dinner?.fat,
          nutrients: day.dinner?.health_benefit || '',
          prepTip: day.dinner?.description || '',
          prepSteps: day.dinner?.prepSteps || [],
          prepTime: day.dinner?.prepTime || '',
          difficulty: day.dinner?.difficulty || '',
          equipment: day.dinner?.equipment || [],
          healthBenefit: day.dinner?.healthBenefit || '',
          imageUrl: day.dinner?.imageUrl || ''
        },
        snacks: {
          name: day.snacks?.name || 'Mixed nuts',
          calories: day.snacks?.calories || '150-200 kcal',
          protein: day.snacks?.protein,
          carbs: day.snacks?.carbs,
          fat: day.snacks?.fat,
          nutrients: day.snacks?.healthBenefit || 'Healthy fats',
          prepTip: day.snacks?.description || 'Portion control',
          prepSteps: day.snacks?.prepSteps || [],
          prepTime: day.snacks?.prepTime || '',
          difficulty: day.snacks?.difficulty || '',
          equipment: day.snacks?.equipment || [],
          healthBenefit: day.snacks?.healthBenefit || '',
          imageUrl: day.snacks?.imageUrl || ''
        }
      })),
      preferences: {
        health_goal: healthGoal,
        foods_liked: foodsLiked,
        foods_avoided: foodsAvoided,
        num_people: numPeople,
        weekly_budget: weeklyBudget,
        allergens: allergens
      }
    });
  };

  const generateGroceryList = () => {
    if (!generatedPlan?.days) return {};
    
    const items = new Set();
    generatedPlan.days.forEach(day => {
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
      const itemWithPrice = generatedPlan.grocery_prices?.[lowerItem] || { name: item, price: null };
      
      if (proteinKeywords.some(k => lowerItem.includes(k))) categorized['Proteins'].push(itemWithPrice);
      else if (vegKeywords.some(k => lowerItem.includes(k))) categorized['Vegetables'].push(itemWithPrice);
      else if (fruitKeywords.some(k => lowerItem.includes(k))) categorized['Fruits'].push(itemWithPrice);
      else if (grainKeywords.some(k => lowerItem.includes(k))) categorized['Grains'].push(itemWithPrice);
      else if (dairyKeywords.some(k => lowerItem.includes(k))) categorized['Dairy/Alternatives'].push(itemWithPrice);
      else categorized['Other'].push(itemWithPrice);
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

          {/* Cultural Style */}
          <div>
            <Label className="mb-3 block flex items-center gap-2">
              <span className="text-lg">🌍</span>
              Cultural Cuisine Style
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {culturalStyles.map(style => (
                <button
                  key={style.value}
                  onClick={() => setCulturalStyle(style.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    culturalStyle === style.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{style.emoji}</div>
                  <div className="text-sm font-medium">{style.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              AI will adapt recipes to your selected cultural style while preserving health goals
            </p>
            
            {/* Custom Cultural Style Input */}
            <div className="mt-3">
              <Input
                placeholder="Or specify any other cuisine (e.g., Ethiopian, Vietnamese, Peruvian...)"
                value={customCulturalStyle}
                onChange={(e) => setCustomCulturalStyle(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Life Stage */}
          <div>
            <Label className="mb-2 block">Life Stage / Age Group</Label>
            <Select value={lifeStage} onValueChange={setLifeStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lifeStages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Cuisine Preferences */}
          <div>
            <Label className="mb-3 block">Cuisine Preferences (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {cuisineOptions.map(cuisine => (
                <div key={cuisine.value} className="flex items-center gap-2">
                  <Checkbox
                    id={cuisine.value}
                    checked={cuisinePreferences.includes(cuisine.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCuisinePreferences([...cuisinePreferences, cuisine.value]);
                      } else {
                        setCuisinePreferences(cuisinePreferences.filter(c => c !== cuisine.value));
                      }
                    }}
                  />
                  <Label htmlFor={cuisine.value} className="cursor-pointer text-sm">
                    {cuisine.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Cooking Time & Skill Level */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Max Cooking Time per Meal</Label>
              <Select value={cookingTime} onValueChange={setCookingTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Duration</SelectItem>
                  <SelectItem value="under_15">Under 15 minutes</SelectItem>
                  <SelectItem value="15_30">15-30 minutes</SelectItem>
                  <SelectItem value="30_60">30-60 minutes</SelectItem>
                  <SelectItem value="over_60">Over 60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Cooking Skill Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - Simple recipes</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Moderate complexity</SelectItem>
                  <SelectItem value="advanced">Advanced - Complex techniques</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Additional Requirements (Optional)</Label>
            <Textarea
              placeholder="Describe any specific dietary needs, health conditions, preferences, or goals in your own words... e.g., 'I need low-sodium meals because of high blood pressure' or 'I want high-protein meals for muscle building'"
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-4">
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
                </SelectContent>
              </Select>
            </div>

            {/* Plan Budget */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Budget for Plan Duration (for all {numPeople} {numPeople === 1 ? 'person' : 'people'}): ${weeklyBudget}
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="range"
                  min="30"
                  max={maxBudget}
                  step="10"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                  className="cursor-pointer flex-1"
                />
                <Input
                  type="number"
                  min="100"
                  max="2000"
                  step="50"
                  value={maxBudget}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    setMaxBudget(newMax);
                    if (weeklyBudget > newMax) setWeeklyBudget(newMax);
                  }}
                  className="w-20 h-8 text-sm"
                  placeholder="Max"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>$30</span>
                <span>${maxBudget}</span>
              </div>
            </div>
          </div>

          {/* Allergens */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Strict Allergen Restrictions
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonAllergens.map(allergen => (
                <div key={allergen.value} className="flex items-center gap-2">
                  <Checkbox
                    id={allergen.value}
                    checked={allergens.includes(allergen.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAllergens([...allergens, allergen.value]);
                      } else {
                        setAllergens(allergens.filter(a => a !== allergen.value));
                      }
                    }}
                  />
                  <Label htmlFor={allergen.value} className="cursor-pointer text-sm">
                    {allergen.label}
                  </Label>
                </div>
              ))}
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
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Health Notes */}
              <Card className="border-emerald-200 bg-emerald-50 md:col-span-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Health Benefits
                  </h3>
                  <p className="text-sm text-emerald-700">{generatedPlan.health_notes}</p>
                </CardContent>
              </Card>

              {/* Budget Summary */}
              {generatedPlan.estimated_weekly_cost && (
                <Card className={`border-2 ${
                  generatedPlan.estimated_weekly_cost <= weeklyBudget 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-amber-500 bg-amber-50'
                }`}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget
                    </h3>
                    <div className="text-2xl font-bold mb-1">
                      ${generatedPlan.estimated_weekly_cost}
                    </div>
                    <p className="text-xs">
                      {generatedPlan.estimated_weekly_cost <= weeklyBudget 
                        ? `✓ Under your $${weeklyBudget} goal` 
                        : `${Math.round(((generatedPlan.estimated_weekly_cost - weeklyBudget) / weeklyBudget) * 100)}% over budget`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Macros Summary */}
            {generatedPlan.average_daily_macros && (
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Average Daily Macros (per person)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-700">
                        {generatedPlan.average_daily_macros.protein}g
                      </div>
                      <div className="text-xs text-slate-600">Protein</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-50">
                      <div className="text-2xl font-bold text-amber-700">
                        {generatedPlan.average_daily_macros.carbs}g
                      </div>
                      <div className="text-xs text-slate-600">Carbs</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-rose-50">
                      <div className="text-2xl font-bold text-rose-700">
                        {generatedPlan.average_daily_macros.fat}g
                      </div>
                      <div className="text-xs text-slate-600">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => document.getElementById('grocery-list-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
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
                                {/* Meal Image */}
                                {(meal.imageUrl || meal.imageError !== undefined) && (
                                  <div className="relative mb-3 rounded-lg overflow-hidden bg-slate-100 group">
                                    {meal.imageUrl && !meal.imageError ? (
                                      <>
                                        <img
                                          src={meal.imageUrl}
                                          alt={meal.name}
                                          loading="lazy"
                                          className="w-full h-48 object-cover"
                                          onError={(e) => {
                                            const updatedDays = [...generatedPlan.days];
                                            updatedDays[index][mealType].imageError = true;
                                            setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
                                          }}
                                        />
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => regenerateMealImage(index, mealType)}
                                          disabled={regeneratingImage === `${index}-${mealType}`}
                                        >
                                          {regeneratingImage === `${index}-${mealType}` ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </>
                                    ) : (
                                      <div className="w-full h-48 flex flex-col items-center justify-center">
                                        <Utensils className="w-12 h-12 text-slate-300 mb-2" />
                                        <p className="text-xs text-slate-400 mb-2">Image unavailable</p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => regenerateMealImage(index, mealType)}
                                          disabled={regeneratingImage === `${index}-${mealType}`}
                                        >
                                          {regeneratingImage === `${index}-${mealType}` ? (
                                            <>
                                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="w-3 h-3 mr-1" />
                                              Generate Image
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl">{mealIcons[mealType]}</div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-slate-900 capitalize">{mealType}</h4>
                                      <div className="flex gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Flame className="w-3 h-3 text-orange-500" />
                                          {meal.calories}
                                        </Badge>
                                        {numPeople > 1 && (
                                          <Badge variant="outline" className="text-xs">
                                            Serves {numPeople}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <p className="font-medium text-slate-800 mb-1">{meal.name}</p>
                                    <p className="text-sm text-slate-600 mb-2">{meal.description}</p>

                                    {/* Macros if available */}
                                    {(meal.protein || meal.carbs || meal.fat) && (
                                      <div className="flex gap-3 mb-2 text-xs">
                                        {meal.protein && (
                                          <span className="text-blue-700">P: {meal.protein}g</span>
                                        )}
                                        {meal.carbs && (
                                          <span className="text-amber-700">C: {meal.carbs}g</span>
                                        )}
                                        {meal.fat && (
                                          <span className="text-rose-700">F: {meal.fat}g</span>
                                        )}
                                      </div>
                                    )}

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
            <Card id="grocery-list-section" className="border-slate-200">
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Grocery List
                      {isFetchingPrices && (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      )}
                      {numPeople > 1 && (
                        <Badge variant="outline" className="ml-2">
                          Scaled for {numPeople} people
                        </Badge>
                      )}
                    </CardTitle>
                    {!isFetchingPrices && generatedPlan?.grocery_prices && (
                      <p className="text-xs text-slate-500 mt-1">
                        Prices are estimates from major US grocery stores. Click any item to adjust.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                  {!isFetchingPrices && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchGroceryPrices(generatedPlan)}
                      disabled={isFetchingPrices}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Refresh Prices
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const items = Object.entries(groceryList)
                        .filter(([_, items]) => items.length > 0)
                        .map(([category, items]) => `${category}:\n${items.map(item => {
                          const itemName = typeof item === 'string' ? item : item.name;
                          const itemPrice = typeof item === 'object' && item.price ? ` - $${item.price.toFixed(2)}` : '';
                          return `  • ${itemName}${itemPrice}`;
                        }).join('\n')}`)
                        .join('\n\n');
                      navigator.clipboard.writeText(items);
                      toast.success('Copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                  </div>
                </div>
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
                          {items.map((item, idx) => {
                            const itemName = typeof item === 'string' ? item : item.name;
                            const itemPrice = typeof item === 'object' ? item.price : null;
                            const itemUnit = typeof item === 'object' ? item.unit : null;

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
                                <span className={`text-sm capitalize flex-1 ${checkedItems.has(itemName) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                  {itemName}
                                </span>
                                {editingPrice === itemName ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    defaultValue={itemPrice || ''}
                                    placeholder="$"
                                    className="w-20 h-7 text-xs"
                                    onBlur={(e) => {
                                      const newPrice = parseFloat(e.target.value);
                                      if (!isNaN(newPrice)) {
                                        setGeneratedPlan(prev => ({
                                          ...prev,
                                          grocery_prices: {
                                            ...prev.grocery_prices,
                                            [itemName]: { name: itemName, price: newPrice, unit: itemUnit || '' }
                                          }
                                        }));
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
                                    onClick={() => setEditingPrice(itemName)}
                                    className="text-xs text-slate-500 hover:text-indigo-600 min-w-[60px] text-right"
                                  >
                                    {itemPrice ? `$${itemPrice.toFixed(2)}${itemUnit ? `/${itemUnit}` : ''}` : isFetchingPrices ? '...' : 'Add price'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {checkedItems.size} of {Object.values(groceryList).flat().length} items checked
                  </span>
                  {generatedPlan?.grocery_prices && (
                    <span className="font-semibold text-slate-900">
                      Estimated Total: ${Object.values(generatedPlan.grocery_prices)
                        .reduce((sum, item) => sum + (item.price || 0), 0)
                        .toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}