import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Plus, Check, Copy, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function GroceryLists() {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [checkedItems, setCheckedItems] = useState(new Set());

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date'),
  });

  const selectedPlan = mealPlans.find(p => p.id === selectedPlanId);

  const groceryItems = useMemo(() => {
    if (!selectedPlan?.days) return {};

    const items = {
      proteins: new Set(),
      vegetables: new Set(),
      grains: new Set(),
      dairy: new Set(),
      fruits: new Set(),
      other: new Set()
    };

    const proteinKeywords = ['chicken', 'beef', 'salmon', 'fish', 'liver', 'turkey', 'pork', 'lamb', 'egg', 'tofu', 'cod', 'trout', 'mackerel', 'tuna', 'shrimp'];
    const vegetableKeywords = ['spinach', 'broccoli', 'carrot', 'asparagus', 'onion', 'garlic', 'pepper', 'tomato', 'lettuce', 'kale', 'cabbage', 'zucchini', 'mushroom', 'artichoke', 'brussels'];
    const grainKeywords = ['rice', 'quinoa', 'oat', 'bread', 'pasta', 'tortilla', 'barley'];
    const dairyKeywords = ['yogurt', 'cheese', 'milk', 'cream', 'butter'];
    const fruitKeywords = ['berry', 'berries', 'apple', 'banana', 'orange', 'lemon', 'avocado'];

    const categorizeWord = (word) => {
      const lowerWord = word.toLowerCase();
      if (proteinKeywords.some(k => lowerWord.includes(k))) return 'proteins';
      if (vegetableKeywords.some(k => lowerWord.includes(k))) return 'vegetables';
      if (grainKeywords.some(k => lowerWord.includes(k))) return 'grains';
      if (dairyKeywords.some(k => lowerWord.includes(k))) return 'dairy';
      if (fruitKeywords.some(k => lowerWord.includes(k))) return 'fruits';
      return null;
    };

    selectedPlan.days.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const meal = day[mealType];
        if (meal?.name) {
          const words = meal.name.split(/[\s,]+/);
          words.forEach(word => {
            const category = categorizeWord(word);
            if (category) {
              items[category].add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
            }
          });
        }
      });
    });

    return Object.fromEntries(
      Object.entries(items).map(([key, value]) => [key, Array.from(value).sort()])
    );
  }, [selectedPlan]);

  const categoryColors = {
    proteins: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-500' },
    vegetables: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-500' },
    grains: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-500' },
    dairy: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-500' },
    fruits: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-500' },
    other: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-500' }
  };

  const totalItems = Object.values(groceryItems).flat().length;
  const checkedCount = checkedItems.size;

  const toggleItem = (item) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  const copyToClipboard = () => {
    const allItems = Object.entries(groceryItems)
      .map(([category, items]) => 
        items.length > 0 
          ? `${category.charAt(0).toUpperCase() + category.slice(1)}:\n${items.map(i => `  □ ${i}`).join('\n')}`
          : ''
      )
      .filter(Boolean)
      .join('\n\n');
    
    navigator.clipboard.writeText(allItems);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Grocery Lists</h1>
          <p className="text-slate-600 mt-1">
            Auto-generate shopping lists from your meal plans
          </p>
        </div>
      </div>

      {/* Plan Selector */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Select Meal Plan
              </label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose a meal plan..." />
                </SelectTrigger>
                <SelectContent>
                  {mealPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grocery List */}
      {selectedPlan ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Shopping Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Items</span>
                <Badge variant="secondary" className="text-lg">
                  {totalItems}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Checked</span>
                <Badge className="bg-emerald-500 text-lg">
                  {checkedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Remaining</span>
                <Badge variant="outline" className="text-lg">
                  {totalItems - checkedCount}
                </Badge>
              </div>
              <div className="pt-2">
                <div className="text-sm text-slate-600 mb-2">Progress</div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1 text-right">
                  {totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0}% Complete
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(groceryItems).map(([category, items]) => {
              if (items.length === 0) return null;
              const colors = categoryColors[category];
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`border ${colors.border}`}>
                    <CardHeader className={`${colors.bg} border-b ${colors.border}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className={`${colors.text} capitalize flex items-center gap-2`}>
                          <div className={`w-2 h-2 rounded-full ${colors.badge}`} />
                          {category}
                        </CardTitle>
                        <Badge variant="secondary">
                          {items.filter(item => checkedItems.has(item)).length} / {items.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid sm:grid-cols-2 gap-2">
                        {items.map((item) => (
                          <div
                            key={item}
                            onClick={() => toggleItem(item)}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                              ${checkedItems.has(item) 
                                ? `${colors.bg} ${colors.text}` 
                                : 'hover:bg-slate-50'
                              }
                            `}
                          >
                            <Checkbox 
                              checked={checkedItems.has(item)}
                              className="pointer-events-none"
                            />
                            <span className={`text-sm font-medium ${
                              checkedItems.has(item) ? 'line-through opacity-60' : ''
                            }`}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Meal Plan Selected
            </h3>
            <p className="text-slate-600">
              Choose a meal plan above to generate your grocery list
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}