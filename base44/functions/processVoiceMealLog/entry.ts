import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript } = await req.json();

    if (!transcript || !transcript.trim()) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    // Call AI to extract food items from voice transcript
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `The user said: "${transcript}"

Extract all food items and quantities mentioned. Handle common phrases like:
- "a cup of" = ~240ml/250g
- "two slices of" = 2 pieces
- "a handful of" = ~40-50g
- "about X ounces" = exact amount
- "a grande latte" = specific item
- "a banana" = 1 medium fruit ~120g

For each food item identified, provide:
1. Food name (be specific)
2. Quantity consumed (e.g., "1 cup", "6 oz", "2 slices")
3. Estimated calories per serving
4. Protein, carbs, fat, fiber in grams

Be conservative with calorie estimates. If uncertain about portions, make reasonable assumptions.

Return ONLY valid JSON with this exact structure:
{
  "items": [
    {
      "name": "food name",
      "quantity": "quantity description",
      "base_calories": 150,
      "base_protein": 25,
      "base_carbs": 5,
      "base_fat": 3,
      "base_fiber": 1,
      "confidence": 0.95
    }
  ],
  "total_confidence": 0.9,
  "notes": "any relevant notes"
}

Do not include any text outside the JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'string' },
                base_calories: { type: 'number' },
                base_protein: { type: 'number' },
                base_carbs: { type: 'number' },
                base_fat: { type: 'number' },
                base_fiber: { type: 'number' },
                confidence: { type: 'number' }
              }
            }
          },
          total_confidence: { type: 'number' },
          notes: { type: 'string' }
        }
      }
    });

    if (!response || !response.items) {
      return Response.json({
        error: 'Could not parse meal log',
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
      total_confidence: response.total_confidence || 0.8,
      notes: response.notes
    });
  } catch (error) {
    console.error('Voice meal log processing error:', error);
    return Response.json({
      error: error.message,
      items: []
    }, { status: 500 });
  }
});