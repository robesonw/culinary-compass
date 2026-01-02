import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, Clock, ChefHat, Wrench, ThumbsUp, MessageCircle, Send, Heart, Utensils, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import ReviewSection from '../reviews/ReviewSection';

export default function SharedRecipeDetailDialog({ recipe, open, onOpenChange, comments: allComments = [] }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.RecipeComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipeComments'] });
      setNewComment('');
      toast.success('Comment added!');
      
      // Notify recipe author
      if (recipe.created_by && recipe.created_by !== user?.email) {
        base44.entities.Notification.create({
          recipient_email: recipe.created_by,
          type: 'recipe_comment',
          title: 'New Comment',
          message: `${user?.full_name || 'Someone'} commented on your recipe "${recipe.name}"`,
          actor_name: user?.full_name || 'Anonymous',
        });
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => base44.entities.UserInteraction.create({
      target_id: recipe.id,
      target_type: 'shared_recipe',
      interaction_type: 'like',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
      toast.success('Liked!');
      
      // Notify recipe author
      if (recipe.created_by && recipe.created_by !== user?.email) {
        base44.entities.Notification.create({
          recipient_email: recipe.created_by,
          type: 'recipe_like',
          title: 'Recipe Liked',
          message: `${user?.full_name || 'Someone'} liked your recipe "${recipe.name}"`,
          actor_name: user?.full_name || 'Anonymous',
        });
      }
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      recipe_id: recipe.id,
      comment: newComment,
      author_name: user?.full_name || 'Anonymous',
    });
  };

  if (!recipe) return null;

  const recipeComments = allComments.filter(c => c.recipe_id === recipe.id);
  const meal = recipe.meal_data || {};
  const isFromFavorites = recipe.source === 'favorite';
  
  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snacks: '🍎'
  };

  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Hard: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mealIcons[recipe.meal_type]}</span>
            <div>
              <DialogTitle className="text-xl">{recipe.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {recipe.meal_type}
                </Badge>
                {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
                {meal.difficulty && (
                  <Badge className={difficultyColors[meal.difficulty] || ''}>
                    {meal.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preparation">Preparation</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="comments">Comments ({recipeComments.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Source Reference */}
            {isFromFavorites && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2">
                <Heart className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-medium text-indigo-900">From Your Favorites</p>
                  {recipe.source_type && (
                    <p className="text-xs text-indigo-700">
                      {recipe.source_type === 'meal_plan' && 'Saved from Meal Plan'}
                      {recipe.source_type === 'ai_recipe' && 'AI Generated Recipe'}
                      {recipe.source_type === 'shared_recipe' && 'Community Recipe'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isFromFavorites && recipe.author_name && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-xs font-medium text-slate-700">Shared by</p>
                  <p className="text-sm text-slate-900">{recipe.author_name}</p>
                </div>
              </div>
            )}

            {/* Image */}
            {(recipe.image_url || meal.imageUrl) && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={recipe.image_url || meal.imageUrl}
                  alt={recipe.name}
                  className="w-full h-64 object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg">
              {(recipe.prepTime || meal.prepTime) && (
                <div className="text-center">
                  <Clock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{recipe.prepTime || meal.prepTime}</div>
                  <div className="text-xs text-slate-600">Prep Time</div>
                </div>
              )}
              {(recipe.cooking_time || meal.cooking_time) && (
                <div className="text-center">
                  <Utensils className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{recipe.cooking_time || meal.cooking_time}</div>
                  <div className="text-xs text-slate-600">Cook Time</div>
                </div>
              )}
              {(recipe.difficulty || meal.difficulty) && (
                <div className="text-center">
                  <ChefHat className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{recipe.difficulty || meal.difficulty}</div>
                  <div className="text-xs text-slate-600">Difficulty</div>
                </div>
              )}
              {recipe.calories && (
                <div className="text-center">
                  <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{recipe.calories}</div>
                  <div className="text-xs text-slate-600">Calories</div>
                </div>
              )}
            </div>

            {/* Health Benefits */}
            {(meal.healthBenefit || recipe.healthBenefit) && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Health Benefits
                </h3>
                <p className="text-sm text-emerald-700">{meal.healthBenefit || recipe.healthBenefit}</p>
              </div>
            )}

            {/* Prep Tip */}
            {(meal.prepTip || recipe.description) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-2">Chef's Tips</h3>
                <p className="text-sm text-amber-700 whitespace-pre-line">{meal.prepTip || recipe.description}</p>
              </div>
            )}

            {/* Nutrients */}
            {(meal.nutrients || recipe.nutrients) && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">🌟 Key Nutrients</p>
                <p className="text-sm text-blue-800">{meal.nutrients || recipe.nutrients}</p>
              </div>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">🏷️ Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isFromFavorites && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Like ({recipe.likes_count || 0})
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparation" className="space-y-4">
            {/* Ingredients */}
            {(meal.ingredients || recipe.ingredients) && (meal.ingredients?.length > 0 || recipe.ingredients?.length > 0) && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {(meal.ingredients || recipe.ingredients).map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(meal.prepSteps || recipe.prepSteps) && (meal.prepSteps?.length > 0 || recipe.prepSteps?.length > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Preparation Steps</h3>
                  <ol className="space-y-3">
                    {(meal.prepSteps || recipe.prepSteps).map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700 flex-1 pt-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            {(meal.equipment || recipe.equipment) && (meal.equipment?.length > 0 || recipe.equipment?.length > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(meal.equipment || recipe.equipment).map((item, idx) => (
                      <Badge key={idx} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            {(recipe.calories || recipe.protein || recipe.carbs || recipe.fat) ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recipe.calories && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                      <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900">{recipe.calories}</div>
                      <div className="text-xs text-slate-600">Calories</div>
                    </div>
                  )}
                  {recipe.protein && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-700">{recipe.protein}g</div>
                      <div className="text-xs text-slate-600">Protein</div>
                    </div>
                  )}
                  {recipe.carbs && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-700">{recipe.carbs}g</div>
                      <div className="text-xs text-slate-600">Carbs</div>
                    </div>
                  )}
                  {recipe.fat && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-rose-700">{recipe.fat}g</div>
                      <div className="text-xs text-slate-600">Fat</div>
                    </div>
                  )}
                </div>

                {(meal.nutrients || recipe.nutrients) && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h3 className="font-semibold text-emerald-900 mb-2">Additional Nutrients</h3>
                    <p className="text-sm text-emerald-700">{meal.nutrients || recipe.nutrients}</p>
                  </div>
                )}

                {(meal.healthBenefit || recipe.healthBenefit) && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Health Benefits
                    </h3>
                    <p className="text-sm text-purple-700">{meal.healthBenefit || recipe.healthBenefit}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Flame className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No nutrition information available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            <h4 className="font-semibold text-slate-900">Comments</h4>
            
            {/* Add Comment */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {recipeComments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                recipeComments.map((comment) => (
                  <Card key={comment.id} className="border-slate-200">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm text-slate-900">{comment.author_name}</span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.comment}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            <ReviewSection targetId={recipe.id} targetType={isFromFavorites ? "favorite_meal" : "shared_recipe"} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}