import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { url } = payload;

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the webpage content
    let pageContent;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      pageContent = await response.text();
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return Response.json({
        error: 'Could not access this website. Try copying the recipe manually.'
      }, { status: 400 });
    }

    // Extract recipe using AI
    const extractionPrompt = `You are a recipe extraction expert. Extract the recipe from this HTML content and return a JSON object with:
- recipe_name: string (the name of the recipe)
- ingredients: array of {name: string, quantity: string} (e.g., {name: "flour", quantity: "2 cups"})
- instructions: array of strings (step-by-step instructions)
- servings: number (number of servings)
- prep_time: string (e.g., "15 minutes")
- cook_time: string (e.g., "30 minutes")
- difficulty: "Easy" | "Medium" | "Hard"
- cuisine: string (type of cuisine)
- dietary_tags: array of strings (e.g., ["vegan", "gluten-free", "keto"])

If you cannot extract the recipe, return an error field explaining why.

HTML Content:
${pageContent.substring(0, 5000)}`;

    const extractionResponse = await base44.integrations.Core.InvokeLLM({
      prompt: extractionPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recipe_name: { type: 'string' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'string' }
              }
            }
          },
          instructions: {
            type: 'array',
            items: { type: 'string' }
          },
          servings: { type: 'number' },
          prep_time: { type: 'string' },
          cook_time: { type: 'string' },
          difficulty: { type: 'string' },
          cuisine: { type: 'string' },
          dietary_tags: {
            type: 'array',
            items: { type: 'string' }
          },
          error: { type: 'string' }
        }
      }
    });

    if (extractionResponse.data.error) {
      return Response.json({
        error: extractionResponse.data.error
      }, { status: 400 });
    }

    // Calculate nutrition using AI
    const nutritionPrompt = `Based on these ingredients and servings, estimate the nutritional content per serving:
Ingredients: ${extractionResponse.data.ingredients.map(i => `${i.quantity} ${i.name}`).join(', ')}
Servings: ${extractionResponse.data.servings}

Return a JSON object with:
- calories: number (estimated calories per serving)
- protein: number (grams of protein per serving)
- carbs: number (grams of carbohydrates per serving)
- fat: number (grams of fat per serving)
- fiber: number (grams of fiber per serving)

Be realistic with estimates based on typical ingredient nutrition values.`;

    const nutritionResponse = await base44.integrations.Core.InvokeLLM({
      prompt: nutritionPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          fiber: { type: 'number' }
        }
      }
    });

    return Response.json({
      success: true,
      recipe: {
        name: extractionResponse.data.recipe_name,
        ingredients: extractionResponse.data.ingredients,
        instructions: extractionResponse.data.instructions,
        servings: extractionResponse.data.servings,
        prep_time: extractionResponse.data.prep_time,
        cooking_time: extractionResponse.data.cook_time,
        difficulty: extractionResponse.data.difficulty,
        cuisine: extractionResponse.data.cuisine,
        dietary_tags: extractionResponse.data.dietary_tags,
        source_url: url,
        source_type: 'imported',
        calories: Math.round(nutritionResponse.data.calories),
        protein: Math.round(nutritionResponse.data.protein * 10) / 10,
        carbs: Math.round(nutritionResponse.data.carbs * 10) / 10,
        fat: Math.round(nutritionResponse.data.fat * 10) / 10,
        fiber: Math.round(nutritionResponse.data.fiber * 10) / 10
      }
    });
  } catch (error) {
    console.error('Error importing recipe:', error);
    return Response.json({
      error: 'Failed to import recipe. Please try again.'
    }, { status: 500 });
  }
});