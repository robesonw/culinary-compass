import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Calendar as CalendarIcon, Plus, Flame, Activity, Award, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';

export default function NutritionTracking() {
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('week'); // 'week' or 'month'
  const [editingGoal, setEditingGoal] = useState(null);
  
  const [goalForm, setGoalForm] = useState({
    goal_type: 'daily',
    target_calories: 2000,
    target_protein: 150,
    target_carbs: 200,
    target_fat: 65
  });

  const [logForm, setLogForm] = useState({
    recipe_name: '',
    meal_type: 'lunch',
    log_date: format(new Date(), 'yyyy-MM-dd'),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servings: 1
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['nutritionGoals', user?.email],
    queryFn: () => base44.entities.NutritionGoal.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['nutritionLogs', user?.email],
    queryFn: () => base44.entities.NutritionLog.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: favoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals'],
    queryFn: () => base44.entities.FavoriteMeal.list(),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.NutritionGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionGoals'] });
      toast.success('Goal saved!');
      setGoalDialogOpen(false);
      setEditingGoal(null);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NutritionGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionGoals'] });
      toast.success('Goal updated!');
      setGoalDialogOpen(false);
      setEditingGoal(null);
    },
  });

  const createLogMutation = useMutation({
    mutationFn: (data) => base44.entities.NutritionLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionLogs'] });
      toast.success('Meal logged!');
      setLogDialogOpen(false);
      setLogForm({
        recipe_name: '',
        meal_type: 'lunch',
        log_date: format(new Date(), 'yyyy-MM-dd'),
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servings: 1
      });
    },
  });

  const activeGoal = goals.find(g => g.is_active && g.goal_type === 'daily');

  const handleSaveGoal = () => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: goalForm });
    } else {
      // Deactivate other goals of same type
      const otherGoals = goals.filter(g => g.goal_type === goalForm.goal_type && g.is_active);
      otherGoals.forEach(g => {
        base44.entities.NutritionGoal.update(g.id, { is_active: false });
      });
      createGoalMutation.mutate({ ...goalForm, is_active: true });
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      goal_type: goal.goal_type,
      target_calories: goal.target_calories,
      target_protein: goal.target_protein,
      target_carbs: goal.target_carbs,
      target_fat: goal.target_fat
    });
    setGoalDialogOpen(true);
  };

  const handleSelectMeal = (mealId) => {
    const meal = favoriteMeals.find(m => m.id === mealId);
    if (meal) {
      const caloriesMatch = meal.calories?.match(/(\d+)/);
      setLogForm({
        ...logForm,
        recipe_name: meal.name,
        calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        meal_type: meal.meal_type
      });
    }
  };

  // Calculate today's totals
  const todayTotals = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = logs.filter(l => l.log_date === today);
    return {
      calories: todayLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0),
      protein: todayLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0),
      carbs: todayLogs.reduce((sum, l) => sum + (l.carbs * (l.servings || 1)), 0),
      fat: todayLogs.reduce((sum, l) => sum + (l.fat * (l.servings || 1)), 0),
      meals: todayLogs.length
    };
  }, [logs]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const days = timeRange === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.log_date === date);
      
      data.push({
        date: format(subDays(new Date(), i), 'MMM d'),
        calories: dayLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0),
        protein: dayLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0),
        carbs: dayLogs.reduce((sum, l) => sum + (l.carbs * (l.servings || 1)), 0),
        fat: dayLogs.reduce((sum, l) => sum + (l.fat * (l.servings || 1)), 0),
        target: activeGoal?.target_calories || 0
      });
    }
    
    return data;
  }, [logs, timeRange, activeGoal]);

  const getProgressPercentage = (current, target) => {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage < 80) return 'bg-amber-500';
    if (percentage > 110) return 'bg-rose-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nutrition Tracking</h1>
          <p className="text-slate-600 mt-1">Monitor your nutrition and track progress toward your goals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGoalDialogOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            Set Goals
          </Button>
          <Button onClick={() => setLogDialogOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Log Meal
          </Button>
        </div>
      </div>

      {/* Today's Progress */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{Math.round(todayTotals.calories)}</div>
              <div className="text-sm text-slate-600">
                {activeGoal ? `/ ${activeGoal.target_calories} kcal` : 'Calories'}
              </div>
              {activeGoal && (
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.calories, activeGoal.target_calories))}`}
                    style={{ width: `${getProgressPercentage(todayTotals.calories, activeGoal.target_calories)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">{Math.round(todayTotals.protein)}g</div>
              <div className="text-sm text-slate-600">
                {activeGoal ? `/ ${activeGoal.target_protein}g` : 'Protein'}
              </div>
              {activeGoal && (
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.protein, activeGoal.target_protein))}`}
                    style={{ width: `${getProgressPercentage(todayTotals.protein, activeGoal.target_protein)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-700">{Math.round(todayTotals.carbs)}g</div>
              <div className="text-sm text-slate-600">
                {activeGoal ? `/ ${activeGoal.target_carbs}g` : 'Carbs'}
              </div>
              {activeGoal && (
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.carbs, activeGoal.target_carbs))}`}
                    style={{ width: `${getProgressPercentage(todayTotals.carbs, activeGoal.target_carbs)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-700">{Math.round(todayTotals.fat)}g</div>
              <div className="text-sm text-slate-600">
                {activeGoal ? `/ ${activeGoal.target_fat}g` : 'Fat'}
              </div>
              {activeGoal && (
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.fat, activeGoal.target_fat))}`}
                    style={{ width: `${getProgressPercentage(todayTotals.fat, activeGoal.target_fat)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="text-center text-sm text-slate-600">
            {todayTotals.meals} meals logged today
          </div>
        </CardContent>
      </Card>

      {/* Historical Data */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Nutrition History
            </CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calories" className="space-y-4">
            <TabsList>
              <TabsTrigger value="calories">Calories</TabsTrigger>
              <TabsTrigger value="macros">Macros</TabsTrigger>
            </TabsList>

            <TabsContent value="calories">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#6366f1" strokeWidth={2} name="Calories" />
                  {activeGoal && (
                    <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" name="Goal" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="macros">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="protein" fill="#3b82f6" name="Protein (g)" />
                  <Bar dataKey="carbs" fill="#f59e0b" name="Carbs (g)" />
                  <Bar dataKey="fat" fill="#ef4444" name="Fat (g)" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Goals */}
      {activeGoal && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Award className="w-5 h-5" />
                Active Daily Goal
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleEditGoal(activeGoal)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-900">{activeGoal.target_calories}</div>
                <div className="text-xs text-emerald-700">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-900">{activeGoal.target_protein}g</div>
                <div className="text-xs text-emerald-700">Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-900">{activeGoal.target_carbs}g</div>
                <div className="text-xs text-emerald-700">Carbs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-900">{activeGoal.target_fat}g</div>
                <div className="text-xs text-emerald-700">Fat</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Set Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Set Nutrition Goals'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal Type</Label>
              <Select value={goalForm.goal_type} onValueChange={(v) => setGoalForm({ ...goalForm, goal_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Goal</SelectItem>
                  <SelectItem value="weekly">Weekly Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={goalForm.target_calories}
                  onChange={(e) => setGoalForm({ ...goalForm, target_calories: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={goalForm.target_protein}
                  onChange={(e) => setGoalForm({ ...goalForm, target_protein: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={goalForm.target_carbs}
                  onChange={(e) => setGoalForm({ ...goalForm, target_carbs: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  value={goalForm.target_fat}
                  onChange={(e) => setGoalForm({ ...goalForm, target_fat: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <Button onClick={handleSaveGoal} className="w-full" disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {editingGoal ? 'Update Goal' : 'Save Goal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Meal Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select from Favorites (Optional)</Label>
              <Select onValueChange={handleSelectMeal}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved meal..." />
                </SelectTrigger>
                <SelectContent>
                  {favoriteMeals.map(meal => (
                    <SelectItem key={meal.id} value={meal.id}>{meal.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipe/Meal Name *</Label>
              <Input
                placeholder="e.g., Chicken Salad"
                value={logForm.recipe_name}
                onChange={(e) => setLogForm({ ...logForm, recipe_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Meal Type</Label>
                <Select value={logForm.meal_type} onValueChange={(v) => setLogForm({ ...logForm, meal_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={logForm.log_date}
                  onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calories *</Label>
                <Input
                  type="number"
                  value={logForm.calories}
                  onChange={(e) => setLogForm({ ...logForm, calories: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Servings</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={logForm.servings}
                  onChange={(e) => setLogForm({ ...logForm, servings: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={logForm.protein}
                  onChange={(e) => setLogForm({ ...logForm, protein: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={logForm.carbs}
                  onChange={(e) => setLogForm({ ...logForm, carbs: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  value={logForm.fat}
                  onChange={(e) => setLogForm({ ...logForm, fat: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <Button
              onClick={() => createLogMutation.mutate(logForm)}
              className="w-full"
              disabled={!logForm.recipe_name || !logForm.calories || createLogMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}