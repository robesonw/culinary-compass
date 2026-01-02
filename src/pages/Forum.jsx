import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Eye, Heart, Pin, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Forum() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [viewPostOpen, setViewPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [newComment, setNewComment] = useState('');

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => base44.entities.ForumPost.list('-created_date'),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['forumComments'],
    queryFn: () => base44.entities.ForumComment.list('-created_date'),
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
      toast.success('Post created!');
      setCreatePostOpen(false);
      setNewPost({ title: '', content: '', category: 'general', tags: '' });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumComments'] });
      toast.success('Comment added!');
      setNewComment('');
    },
  });

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) {
      toast.error('Please fill in title and content');
      return;
    }

    createPostMutation.mutate({
      ...newPost,
      tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean),
      author_name: user?.full_name || 'Anonymous',
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;

    addCommentMutation.mutate({
      post_id: selectedPost.id,
      content: newComment,
      author_name: user?.full_name || 'Anonymous',
    });
  };

  const openPost = (post) => {
    setSelectedPost(post);
    setViewPostOpen(true);
    // Increment view count
    base44.entities.ForumPost.update(post.id, {
      views_count: (post.views_count || 0) + 1
    });
  };

  const filteredPosts = posts.filter(post => 
    filterCategory === 'all' || post.category === filterCategory
  );

  const postComments = selectedPost ? comments.filter(c => c.post_id === selectedPost.id) : [];

  const categories = [
    { value: 'general', label: 'General', emoji: '💬' },
    { value: 'recipes', label: 'Recipes', emoji: '🍳' },
    { value: 'nutrition', label: 'Nutrition', emoji: '🥗' },
    { value: 'meal_prep', label: 'Meal Prep', emoji: '📦' },
    { value: 'tips', label: 'Tips & Tricks', emoji: '💡' },
    { value: 'questions', label: 'Questions', emoji: '❓' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Community Forum</h1>
          <p className="text-slate-600 mt-1">Share knowledge, ask questions, connect with others</p>
        </div>
        <Button onClick={() => setCreatePostOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Categories */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.value}
                variant={filterCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat.value)}
              >
                <span className="mr-1">{cat.emoji}</span>
                {cat.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => openPost(post)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {post.author_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {post.is_pinned && <Pin className="w-4 h-4 text-indigo-600" />}
                          <h3 className="font-semibold text-slate-900">{post.title}</h3>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{post.author_name}</span>
                          <span>•</span>
                          <span>{new Date(post.created_date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.comments_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likes_count || 0}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize flex-shrink-0">
                        {post.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No posts yet. Start the conversation!</p>
          </CardContent>
        </Card>
      )}

      {/* Create Post Dialog */}
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="What's on your mind?"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={newPost.category} onValueChange={(val) => setNewPost({ ...newPost, category: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea
                placeholder="Share your thoughts, questions, or tips..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={6}
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g., beginner, quick-meals, budget"
                value={newPost.tags}
                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
              />
            </div>
            <Button onClick={handleCreatePost} className="w-full" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={viewPostOpen} onOpenChange={setViewPostOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {selectedPost?.author_name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1">
                <DialogTitle>{selectedPost?.title}</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  by {selectedPost?.author_name} • {selectedPost && new Date(selectedPost.created_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{selectedPost?.content}</p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {selectedPost?.views_count || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {selectedPost?.likes_count || 0} likes
              </span>
            </div>

            {/* Comments */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({postComments.length})
              </h3>
              
              <div className="space-y-4 mb-4">
                {postComments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {comment.author_name?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{comment.author_name}</p>
                        <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(comment.created_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleAddComment} disabled={addCommentMutation.isPending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}