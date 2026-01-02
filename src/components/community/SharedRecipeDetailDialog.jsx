import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Clock, ChefHat, Wrench, ThumbsUp, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

  const meal = recipe.meal_data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">{recipe.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="capitalize">
              {recipe.meal_type}
            </Badge>
            <Badge variant="outline">
              <Flame className="w-3 h-3 mr-1 text-orange-500" />
              {recipe.calories}
            </Badge>
            <span className="text-xs text-slate-500">by {recipe.author_name}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Macros */}
          {(recipe.protein || recipe.carbs || recipe.fat) && (
            <div className="flex gap-2 flex-wrap">
              {recipe.protein && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Protein: {recipe.protein}g
                </Badge>
              )}
              {recipe.carbs && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  Carbs: {recipe.carbs}g
                </Badge>
              )}
              {recipe.fat && (
                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                  Fat: {recipe.fat}g
                </Badge>
              )}
            </div>
          )}

          {/* Health Benefit */}
          {meal?.healthBenefit && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-medium text-emerald-900 mb-1">Health Benefits</p>
              <p className="text-sm text-emerald-700">{meal.healthBenefit}</p>
            </div>
          )}

          {/* Prep Info */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {meal?.prepTime && (
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                {meal.prepTime}
              </div>
            )}
            {meal?.difficulty && (
              <div className="flex items-center gap-1 text-slate-600">
                <ChefHat className="w-3 h-3" />
                {meal.difficulty}
              </div>
            )}
            {meal?.equipment?.length > 0 && (
              <div className="flex items-center gap-1 text-slate-600">
                <Wrench className="w-3 h-3" />
                {meal.equipment.length} tools
              </div>
            )}
          </div>

          {/* Prep Steps */}
          {meal?.prepSteps?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Preparation Steps</p>
              <ol className="space-y-2 text-sm text-slate-600">
                {meal.prepSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Equipment */}
          {meal?.equipment?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Equipment Needed</p>
              <div className="flex flex-wrap gap-1">
                {meal.equipment.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prep Tip */}
          {meal?.prepTip && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-700 mb-1">Chef's Tip</p>
              <p className="text-sm text-slate-600">{meal.prepTip}</p>
            </div>
          )}

          <Separator className="my-4" />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}>
              <ThumbsUp className="w-4 h-4 mr-2" />
              Like ({recipe.likes_count || 0})
            </Button>
            <Button variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Comments ({recipeComments.length})
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Comments Section */}
          <div className="space-y-4">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}