import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AffiliateOrderButtons({ groceryItems = [], estimatedTotal = 0, groceryListId = null }) {
  const [isLoading, setIsLoading] = useState(false);

  // Filter unchecked items
  const uncheckedItems = groceryItems.filter(item => !item.checked);

  if (uncheckedItems.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <p className="text-sm text-slate-600">✓ All items checked off! Create a new list to order.</p>
        </CardContent>
      </Card>
    );
  }

  const handleInstacartClick = async () => {
    setIsLoading(true);
    try {
      // Format items for Instacart
      const itemsList = uncheckedItems
        .map(item => encodeURIComponent(item.name))
        .join(',');

      // Track the click
      await base44.entities.AffiliateClick.create({
        affiliate_type: 'instacart',
        item_count: uncheckedItems.length,
        estimated_value: estimatedTotal,
        grocery_list_id: groceryListId,
        items_data: {
          items: uncheckedItems.map(i => ({ name: i.name, category: i.category }))
        }
      });

      // Open Instacart with affiliate link
      // Replace AFFILIATE_CODE with actual Instacart affiliate code
      const instacartUrl = `https://www.instacart.com/store/checkout_ingredients?ingredients=${itemsList}&affiliate_code=VITAPLATE2024`;
      window.open(instacartUrl, '_blank');
      
      toast.success('Opening Instacart with your items!');
    } catch (error) {
      console.error('Instacart order error:', error);
      toast.error('Failed to process order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmazonFreshClick = async () => {
    setIsLoading(true);
    try {
      // Track the click
      await base44.entities.AffiliateClick.create({
        affiliate_type: 'amazon_fresh',
        item_count: uncheckedItems.length,
        estimated_value: estimatedTotal,
        grocery_list_id: groceryListId,
        items_data: {
          items: uncheckedItems.map(i => ({ name: i.name, category: i.category }))
        }
      });

      // Open Amazon Fresh with affiliate link
      // Amazon Fresh doesn't have native deep-linking, so redirect to search with items
      const searchQuery = uncheckedItems.slice(0, 5).map(i => i.name).join(' ');
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}+fresh&tag=VITAPLATE-20`;
      window.open(amazonUrl, '_blank');
      
      toast.success('Opening Amazon Fresh! Add items from your list.');
    } catch (error) {
      console.error('Amazon Fresh order error:', error);
      toast.error('Failed to process order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Estimated Total */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 mb-1">Estimated Order Total</p>
              <p className="text-2xl font-bold text-emerald-900">
                ${estimatedTotal.toFixed(2)}
              </p>
              <p className="text-xs text-emerald-700 mt-1">{uncheckedItems.length} items</p>
            </div>
            <div className="text-right text-xs text-emerald-700">
              <p>Based on typical</p>
              <p>grocery prices</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Button
          onClick={handleInstacartClick}
          disabled={isLoading || uncheckedItems.length === 0}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Order on Instacart
            </>
          )}
        </Button>

        <Button
          onClick={handleAmazonFreshClick}
          disabled={isLoading || uncheckedItems.length === 0}
          variant="outline"
          className="h-12 border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Order on Amazon Fresh
            </>
          )}
        </Button>
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Transparency:</strong> VitaPlate may earn a small affiliate commission on purchases through these links. This helps keep our app free and helps us continue developing personalized nutrition features for you.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tip */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3">
          <p className="text-xs text-blue-800">
            💡 <strong>Pro tip:</strong> Check off items as you shop to update your pantry inventory automatically. This helps VitaPlate refine your meal recommendations!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}