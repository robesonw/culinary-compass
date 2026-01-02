import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, ChefHat, Heart, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import FavoriteMealDetailDialog from '../components/meals/FavoriteMealDetailDialog';
import SharedRecipeDetailDialog from '../components/community/SharedRecipeDetailDialog';

const cuisineTypes = [
  'All', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 
  'Mediterranean', 'French', 'American', 'Korean', 'Vietnamese', 'Middle Eastern'
];

const dietaryRestrictions = [
  'All', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
  'Keto', 'Paleo', 'Low-Carb', 'High-Protein'
];

const mealTypes = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function RecipeSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState('All');
  const [selectedMealType, setSelectedMealType] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeType, setRecipeType] = useState(null);

  const { data: favoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals'],
    queryFn: () => base44.entities.FavoriteMeal.list('-created_date'),
  });

  const { data: sharedRecipes = [] } = useQuery({
    queryKey: ['sharedRecipes'],
    queryFn: () => base44.entities.SharedRecipe.list('-created_date'),
  });

  const searchResults = useMemo(() => {
    const allRecipes = [
      ...favoriteMeals.map(meal => ({ ...meal, source: 'favorite' })),
      ...sharedRecipes.map(recipe => ({ ...recipe, source: 'shared' }))
    ];

    return allRecipes.filter(recipe => {
      // Text search in name, ingredients, tags
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        recipe.name?.toLowerCase().includes(searchLower) ||
        recipe.ingredients?.some(ing => ing.toLowerCase().includes(searchLower)) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        recipe.cuisine?.toLowerCase().includes(searchLower);

      // Cuisine filter
      const matchesCuisine = selectedCuisine === 'All' || 
        recipe.cuisine?.toLowerCase() === selectedCuisine.toLowerCase();

      // Dietary filter (check tags)
      const matchesDietary = selectedDietary === 'All' ||
        recipe.tags?.some(tag => tag.toLowerCase() === selectedDietary.toLowerCase()) ||
        (selectedDietary === 'Vegetarian' && recipe.tags?.some(tag => /vegetarian/i.test(tag))) ||
        (selectedDietary === 'Vegan' && recipe.tags?.some(tag => /vegan/i.test(tag)));

      // Meal type filter
      const matchesMealType = selectedMealType === 'All' ||
        recipe.meal_type?.toLowerCase() === selectedMealType.toLowerCase();

      return matchesSearch && matchesCuisine && matchesDietary && matchesMealType;
    });
  }, [favoriteMeals, sharedRecipes, searchQuery, selectedCuisine, selectedDietary, selectedMealType]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisine('All');
    setSelectedDietary('All');
    setSelectedMealType('All');
  };

  const hasActiveFilters = searchQuery || selectedCuisine !== 'All' || 
    selectedDietary !== 'All' || selectedMealType !== 'All';

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
    setRecipeType(recipe.source);
  };

  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snacks: '🍎'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Recipe Search</h1>
        <p className="text-slate-600 mt-1">
          Find recipes by ingredients, cuisine, dietary needs, and more
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by recipe name, ingredients, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Cuisine</label>
              <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cuisineTypes.map(cuisine => (
                    <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Dietary</label>
              <Select value={selectedDietary} onValueChange={setSelectedDietary}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dietaryRestrictions.map(diet => (
                    <SelectItem key={diet} value={diet}>{diet}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Meal Type</label>
              <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-slate-600">
                {searchResults.length} recipe{searchResults.length !== 1 ? 's' : ''} found
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {searchResults.length === 0 ? (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {hasActiveFilters ? 'No Recipes Found' : 'Start Searching'}
            </h3>
            <p className="text-slate-600">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms'
                : 'Enter a search term or select filters to find recipes'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((recipe, index) => (
            <motion.div
              key={`${recipe.source}-${recipe.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border-slate-200 hover:shadow-lg transition-all cursor-pointer h-full"
                onClick={() => handleRecipeClick(recipe)}
              >
                {recipe.imageUrl || recipe.image_url ? (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={recipe.imageUrl || recipe.image_url}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                        {recipe.source === 'favorite' ? (
                          <><Heart className="w-3 h-3 mr-1" />My Recipe</>
                        ) : (
                          'Shared'
                        )}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-indigo-300" />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{mealIcons[recipe.meal_type]}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2">{recipe.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    {recipe.calories && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {recipe.calories}
                      </span>
                    )}
                    {recipe.protein && (
                      <span className="text-xs">
                        <span className="font-medium text-blue-700">{recipe.protein}g</span> protein
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {recipe.meal_type && (
                      <Badge variant="outline" className="capitalize text-xs">
                        {recipe.meal_type}
                      </Badge>
                    )}
                    {recipe.cuisine && (
                      <Badge variant="secondary" className="text-xs">
                        {recipe.cuisine}
                      </Badge>
                    )}
                    {recipe.tags?.slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Dialogs */}
      {recipeType === 'favorite' && (
        <FavoriteMealDetailDialog
          meal={selectedRecipe}
          open={!!selectedRecipe}
          onOpenChange={(open) => !open && setSelectedRecipe(null)}
        />
      )}

      {recipeType === 'shared' && (
        <SharedRecipeDetailDialog
          recipe={selectedRecipe}
          open={!!selectedRecipe}
          onOpenChange={(open) => !open && setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}