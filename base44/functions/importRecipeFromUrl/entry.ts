import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return Response.json({ error: 'url is required' }, { status: 400 });
    }

    // Fetch page content
    let pageContent = '';
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VitaPlate Recipe Importer)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
      pageContent = await res.text();
      // Strip most HTML tags, keep text
      pageContent = pageContent
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .slice(0, 12000); // limit to avoid token overflow
    } catch (fetchErr) {
      console.error('Fetch error:', fetchErr);
      // If we can't fetch (e.g. TikTok/Instagram), rely on AI with context from URL
      pageContent = `URL: ${url}. Could not fetch content directly.`;
    }

    // Use AI to extract recipe
    const recipe = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extract a complete recipe from the following web page content. If the page is from TikTok, Instagram, or YouTube, infer the recipe from the URL and any metadata available. Return null values if truly not available.

URL: ${url}
Page content:
${pageContent}

Extract all recipe details.`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          meal_type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snacks"] },
          cuisine: { type: "string" },
          difficulty: { type: "string" },
          prep_time: { type: "string" },
          cooking_time: { type: "string" },
          servings: { type: "number" },
          ingredients: { type: "array", items: { type: "string" } },
          prep_steps: { type: "array", items: { type: "string" } },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          health_benefit: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    });

    if (!recipe?.name) {
      return Response.json({ error: 'Could not extract a recipe from this URL' }, { status: 422 });
    }

    return Response.json({ recipe });
  } catch (error) {
    console.error('Recipe import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});