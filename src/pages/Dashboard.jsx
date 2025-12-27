import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Flame,
  Target,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date', 10),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Calculate statistics
  const stats = {
    activePlans: mealPlans.filter(p => p.diet_type).length,
    totalMeals: mealPlans.reduce((sum, p) => sum + (p.days?.length || 0) * 3, 0),
    weekStreak: 3,
    avgCalories: 1850,
  };

  const statCards = [
    { 
      title: 'Active Plans', 
      value: stats.activePlans, 
      change: '+12%', 
      trend: 'up',
      icon: Calendar,
      color: 'indigo'
    },
    { 
      title: 'Meals Planned', 
      value: stats.totalMeals, 
      change: '+8%', 
      trend: 'up',
      icon: Target,
      color: 'emerald'
    },
    { 
      title: 'Avg Calories/Day', 
      value: `${stats.avgCalories}`, 
      change: '-3%', 
      trend: 'down',
      icon: Flame,
      color: 'orange'
    },
    { 
      title: 'Week Streak', 
      value: stats.weekStreak, 
      change: 'On track', 
      trend: 'neutral',
      icon: TrendingUp,
      color: 'purple'
    },
  ];

  const recentActivity = [
    { action: 'Created meal plan', plan: 'Low-Sugar Plan', time: '2 hours ago' },
    { action: 'Updated preferences', plan: 'Vegetarian Plan', time: '1 day ago' },
    { action: 'Generated grocery list', plan: 'Liver-Centric Plan', time: '2 days ago' },
  ];

  const quickActions = [
    { title: 'Create AI Meal Plan', description: 'Generate personalized plan', icon: Sparkles, href: 'MealPlans' },
    { title: 'View Analytics', description: 'Track your nutrition', icon: TrendingUp, href: 'Analytics' },
    { title: 'Grocery Shopping', description: 'Manage your lists', icon: Calendar, href: 'GroceryLists' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-slate-600 mt-1">
          Here's your nutrition overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            indigo: 'bg-indigo-500',
            emerald: 'bg-emerald-500',
            orange: 'bg-orange-500',
            purple: 'bg-purple-500',
          };
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                        {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-600" />}
                        <span className={`text-sm font-medium ${
                          stat.trend === 'up' ? 'text-emerald-600' : 
                          stat.trend === 'down' ? 'text-rose-600' : 
                          'text-slate-600'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-slate-500 ml-1">vs last week</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[stat.color]} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Today's Nutrition Goals</CardTitle>
              <CardDescription>Track your daily intake targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Calories</span>
                  <span className="text-sm font-semibold text-slate-900">1,250 / 2,000 kcal</span>
                </div>
                <Progress value={62.5} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Protein</span>
                  <span className="text-sm font-semibold text-slate-900">85 / 120g</span>
                </div>
                <Progress value={70.8} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Carbs</span>
                  <span className="text-sm font-semibold text-slate-900">180 / 250g</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Fats</span>
                  <span className="text-sm font-semibold text-slate-900">45 / 65g</span>
                </div>
                <Progress value={69.2} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-sm text-slate-600">{activity.plan}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={createPageUrl(action.href)}>
                <Card className="border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                          <Icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
                        <p className="text-sm text-slate-600">{action.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Meal Plans */}
      {mealPlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Meal Plans</h2>
            <Link to={createPageUrl('MealPlans')}>
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealPlans.slice(0, 3).map((plan) => (
              <Card key={plan.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.days?.length || 0} days planned
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {plan.diet_type?.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={createPageUrl('MealPlans')}>
                      View Plan <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}