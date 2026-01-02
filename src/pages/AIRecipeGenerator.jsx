import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

export default function AIRecipeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a recipe request');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed recipe based on this request: ${prompt}. 
        Include: recipe name, ingredients list, step-by-step instructions, prep time, cook time, servings, and nutritional benefits.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            ingredients: { type: "array", items: { type: "string" } },
            instructions: { type: "array", items: { type: "string" } },
            prepTime: { type: "string" },
            cookTime: { type: "string" },
            servings: { type: "number" },
            nutritionalBenefits: { type: "string" }
          }
        }
      });

      setRecipe(result);
      toast.success('Recipe generated!');
    } catch (error) {
      toast.error('Failed to generate recipe');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Recipe Generator</h1>
        <p className="text-slate-600 mt-1">Create custom recipes with AI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What would you like to cook?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Recipe Request</Label>
            <Textarea
              placeholder="e.g., A healthy dinner with chicken and vegetables for 4 people"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Recipe...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Recipe
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recipe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              {recipe.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">Prep Time</div>
                <div className="font-semibold">{recipe.prepTime}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">Cook Time</div>
                <div className="font-semibold">{recipe.cookTime}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">Servings</div>
                <div className="font-semibold">{recipe.servings}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients?.map((ingredient, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions?.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {recipe.nutritionalBenefits && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h3 className="font-semibold text-emerald-900 mb-2">Nutritional Benefits</h3>
                <p className="text-emerald-700 text-sm">{recipe.nutritionalBenefits}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}