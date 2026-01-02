import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Heart, Bookmark, Eye, Search, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SharedRecipeDetailDialog from '../components/community/SharedRecipeDetailDialog';

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

  const { data: sharedRecipes = [] } = useQuery({
    queryKey: ['sharedRecipes'],
    queryFn: () => base44.entities.SharedRecipe.list('-created_date'),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list(),
  });

  const { data: recipeComments = [] } = useQuery({
    queryKey: ['recipeComments'],
    queryFn: () => base44.entities.RecipeComment.list('-created_date'),
  });

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
    
    // Create notification for author
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
    });
    
    interactionMutation.mutate({
      target_id: recipe.id,
      target_type: 'shared_recipe',
      interaction_type: 'save',
    });
    
    toast.success('Saved to favorites!');
  };

  const filteredRecipes = sharedRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMealType === 'all' || recipe.meal_type === filterMealType;
    return matchesSearch && matchesFilter;
  });

  const getRecipeRating = (recipeId) => {
    const recipeReviews = reviews.filter(r => r.target_id === recipeId);
    if (recipeReviews.length === 0) return null;
    const avg = recipeReviews.reduce((sum, r) => sum + r.rating, 0) / recipeReviews.length;
    return { average: avg, count: recipeReviews.length };
  };

  const mealTypeColors = {
    breakfast: 'bg-orange-100 text-orange-700',
    lunch: 'bg-blue-100 text-blue-700',
    dinner: 'bg-purple-100 text-purple-700',
    snacks: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Community Recipes</h1>
        <p className="text-slate-600 mt-1">Discover delicious recipes shared by the community</p>
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe, index) => {
          const rating = getRecipeRating(recipe.id);
          return (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="border-slate-200 hover:shadow-lg transition-all overflow-hidden cursor-pointer"
                onClick={() => {
                  setSelectedRecipe(recipe);
                  setDetailDialogOpen(true);
                }}
              >
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className={`${mealTypeColors[recipe.meal_type]} capitalize`}>
                      {recipe.meal_type}
                    </Badge>
                    {rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{rating.average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{recipe.name}</CardTitle>
                  {recipe.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">{recipe.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 text-xs">
                    {recipe.protein && <Badge variant="outline">P: {recipe.protein}g</Badge>}
                    {recipe.carbs && <Badge variant="outline">C: {recipe.carbs}g</Badge>}
                    {recipe.fat && <Badge variant="outline">F: {recipe.fat}g</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {recipe.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {recipe.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3" />
                      {recipe.saves_count || 0}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    by {recipe.author_name}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(recipe.id, recipe.created_by);
                      }}
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      Like
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(recipe);
                      }}
                    >
                      <Bookmark className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No recipes found</p>
          </CardContent>
        </Card>
      )}

      <SharedRecipeDetailDialog
        recipe={selectedRecipe}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        comments={recipeComments}
      />
    </div>
  );
}