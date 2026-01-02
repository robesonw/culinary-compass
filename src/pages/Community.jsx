import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, MessageSquare, Heart, Share2, Calendar } from 'lucide-react';

export default function Community() {
  const { data: sharedPlans = [] } = useQuery({
    queryKey: ['sharedPlans'],
    queryFn: () => base44.entities.SharedMealPlan.list('-created_date', 6),
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => base44.entities.ForumPost.list('-created_date', 6),
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Community Hub</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Connect with others, share your meal plans, and discover new recipes
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-indigo-900 mb-1">10K+</div>
            <div className="text-sm text-indigo-700">Active Members</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6 text-center">
            <Share2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-emerald-900 mb-1">50K+</div>
            <div className="text-sm text-emerald-700">Shared Recipes</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-purple-900 mb-1">25K+</div>
            <div className="text-sm text-purple-700">Forum Posts</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              Shared Meal Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Discover and save meal plans from the community</p>
            <Button asChild className="w-full">
              <Link to={createPageUrl('SharedMealPlans')}>Browse Plans</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600" />
              Recipe Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Explore thousands of healthy recipes</p>
            <Button asChild className="w-full">
              <Link to={createPageUrl('SharedRecipes')}>View Recipes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Discussion Forum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Join conversations about nutrition and health</p>
            <Button asChild className="w-full">
              <Link to={createPageUrl('Forum')}>Visit Forum</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {sharedPlans.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Recently Shared Plans</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {sharedPlans.slice(0, 3).map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{plan.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{plan.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {plan.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {plan.plan_data?.days?.length || 0} days
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}