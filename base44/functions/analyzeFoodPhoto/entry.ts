import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageData } = await req.json();

    if (!imageData) {
      return Response.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Call AI with vision capability to analyze food photo
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this food photo. Identify all visible food items and estimate portions.

For each item, provide:
1. Food name (be specific, e.g., "grilled chicken breast" not just "chicken")
2. Estimated portion size (in grams or common measures like "1 cup" or "1 slice")
3. Estimated nutritional content per portion (calories, protein g, carbs g, fat g, fiber g)

Be conservative with portion estimates and realistic about calorie counts.

Return ONLY valid JSON with this exact structure:
{
  "items": [
    {
      "name": "food name",
      "portion": "portion description",
      "base_calories": 150,
      "base_protein": 25,
      "base_carbs": 5,
      "base_fat": 3,
      "base_fiber": 0,
      "confidence": 0.95
    }
  ],
  "confidence": 0.9,
  "notes": "any relevant notes"
}

Do not include any text outside the JSON.`,
      file_urls: [imageData],
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                portion: { type: 'string' },
                base_calories: { type: 'number' },
                base_protein: { type: 'number' },
                base_carbs: { type: 'number' },
                base_fat: { type: 'number' },
                base_fiber: { type: 'number' },
                confidence: { type: 'number' }
              }
            }
          },
          confidence: { type: 'number' },
          notes: { type: 'string' }
        }
      },
      model: 'gemini_3_pro'
    });

    if (!response || !response.items) {
      return Response.json({
        error: 'Could not analyze image',
        items: []
      }, { status: 400 });
    }

    // Initialize portion multiplier and calculate initial nutrition
    const items = response.items.map(item => ({
      ...item,
      portion_multiplier: 1,
      calories: item.base_calories,
      protein: item.base_protein,
      carbs: item.base_carbs,
      fat: item.base_fat,
      fiber: item.base_fiber
    }));

    return Response.json({
      items,
      confidence: response.confidence || 0.8,
      notes: response.notes
    });
  } catch (error) {
    console.error('Food photo analysis error:', error);
    return Response.json({
      error: error.message,
      items: []
    }, { status: 500 });
  }
});