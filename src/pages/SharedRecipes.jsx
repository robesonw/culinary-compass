import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChefHat, Heart, Eye, Users, TrendingUp, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SharedRecipeDetailDialog from '../components/community/SharedRecipeDetailDialog';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎'
};

export default function SharedRecipes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMealType, setFilterMealType] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allRecipes = [], isLoading } = useQuery({
    queryKey: ['sharedRecipes'],
    queryFn: () => base44.entities.SharedRecipe.list('-created_date'),
  });

  const { data: recipeComments = [] } = useQuery({
    queryKey: ['recipeComments'],
    queryFn: () => base44.entities.RecipeComment.list('-created_date'),
  });

  // Separate user's recipes from community recipes
  const myRecipes = allRecipes.filter(r => r.created_by === user?.email);
  const sharedRecipes = allRecipes.filter(r => r.created_by !== user?.email);

  const interactionMutation = useMutation({
    mutationFn: (data) => base44.entities.UserInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
    },
  });

  const handleLike = (recipeId, authorEmail) => {
    interactionMutation.mutate({
      target_id: recipeId,
      target_type: 'shared_recipe',
      interaction_type: 'like',
    });
    
    if (authorEmail && authorEmail !== user?.email) {
      base44.entities.Notification.create({
        recipient_email: authorEmail,
        type: 'recipe_like',
        title: 'Recipe Liked',
        message: `${user?.full_name || 'Someone'} liked your recipe`,
        actor_name: user?.full_name || 'Anonymous',
      });
    }
    
    toast.success('Liked!');
  };

  const handleSave = (recipe) => {
    base44.entities.FavoriteMeal.create({
      name: recipe.name,
      meal_type: recipe.meal_type,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      prepTip: recipe.meal_data?.tips || recipe.description,
      prepSteps: recipe.meal_data?.instructions || [],
      difficulty: recipe.meal_data?.difficulty,
      equipment: recipe.meal_data?.equipment || [],
      healthBenefit: recipe.meal_data?.health_benefits,
      imageUrl: recipe.image_url,
      source_type: 'shared_recipe',
      source_recipe_id: recipe.id,
      ingredients: recipe.meal_data?.ingredients || [],
      estimated_cost: recipe.meal_data?.estimated_cost,
    });
    
    interactionMutation.mutate({
      target_id: recipe.id,
      target_type: 'shared_recipe',
      interaction_type: 'save',
    });
    
    toast.success('Saved to favorites!');
  };

  const filteredRecipes = allRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMealType === 'all' || recipe.meal_type === filterMealType;
    return matchesSearch && matchesFilter;
  });

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
        <h1 className="text-3xl font-bold text-slate-900">My Recipes</h1>
        <p className="text-slate-600 mt-1">Your saved and community-shared recipes</p>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMealType} onValueChange={setFilterMealType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="my" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my">My Recipes ({myRecipes.length})</TabsTrigger>
          <TabsTrigger value="community">Community ({sharedRecipes.length})</TabsTrigger>
          <TabsTrigger value="all">All Recipes</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-6">
          {myRecipes.length === 0 ? (
            <Card className="border-slate-200 border-dashed">
              <CardContent className="p-12 text-center">
                <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Recipes Yet
                </h3>
                <p className="text-slate-600">
                  Create your first recipe using the AI Recipe Generator
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRecipes.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  index={index}
                  onLike={handleLike}
                  onSave={handleSave}
                  setSelectedRecipe={setSelectedRecipe}
                  setDetailDialogOpen={setDetailDialogOpen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          {sharedRecipes.length === 0 ? (
            <Card className="border-slate-200 border-dashed">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Community Recipes
                </h3>
                <p className="text-slate-600">
                  Be the first to share a recipe with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedRecipes.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  index={index}
                  onLike={handleLike}
                  onSave={handleSave}
                  setSelectedRecipe={setSelectedRecipe}
                  setDetailDialogOpen={setDetailDialogOpen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {filteredRecipes.length === 0 ? (
            <Card className="border-slate-200 border-dashed">
              <CardContent className="p-12 text-center">
                <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No recipes found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  index={index}
                  onLike={handleLike}
                  onSave={handleSave}
                  setSelectedRecipe={setSelectedRecipe}
                  setDetailDialogOpen={setDetailDialogOpen}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SharedRecipeDetailDialog
        recipe={selectedRecipe}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        comments={recipeComments}
      />
    </div>
  );
}

function RecipeCard({ recipe, index, onLike, onSave, setSelectedRecipe, setDetailDialogOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden border-slate-200 hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => {
          setSelectedRecipe(recipe);
          setDetailDialogOpen(true);
        }}
      >
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {recipe.image_url ? (
            <img 
              src={recipe.image_url} 
              alt={recipe.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-slate-300" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 capitalize">
              {mealIcons[recipe.meal_type]} {recipe.meal_type}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">🔥 {recipe.calories}</Badge>
            {recipe.protein > 0 && (
              <Badge variant="outline" className="text-blue-600">
                P: {recipe.protein}g
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {recipe.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {recipe.views_count || 0}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              by {recipe.author_name}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}