import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import PlanDetailsView from '../components/plans/PlanDetailsView';

export default function MealPlans() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: mealPlans = [], isLoading } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date'),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId) => base44.entities.MealPlan.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan deleted');
    },
  });

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setViewDialogOpen(true);
  };

  const dietColors = {
    'liver-centric': 'bg-rose-100 text-rose-700 border-rose-200',
    'low-sugar': 'bg-amber-100 text-amber-700 border-amber-200',
    'vegetarian': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'custom': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Saved Meal Plans</h1>
        <p className="text-slate-600 mt-1">
          View and manage your personalized meal plans
        </p>
      </div>

      {mealPlans.length === 0 ? (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Meal Plans Yet
            </h3>
            <p className="text-slate-600">
              Create your first meal plan in the Health Diet Hub
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mealPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`${dietColors[plan.diet_type]} border capitalize`}>
                          {plan.diet_type?.replace(/-/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {plan.days?.length || 0} days
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-slate-500 mb-4">
                    Created {new Date(plan.created_date).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewPlan(plan)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlanMutation.mutate(plan.id)}
                      disabled={deletePlanMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <PlanDetailsView
        plan={selectedPlan}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  );
}