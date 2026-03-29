import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderFeedbackDialog({ affiliateClickId, isOpen, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (arrived) => {
    setIsSubmitting(true);
    try {
      await base44.entities.AffiliateClick.update(affiliateClickId, {
        order_arrived: arrived
      });

      toast.success(
        arrived 
          ? '✅ Great! We\'re glad your order arrived safely.' 
          : '⚠️ We\'re sorry to hear that. We\'ll note this for future improvements.'
      );
      
      onClose();
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error('Failed to save feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-slate-900">📦 Order Arrived?</DialogTitle>
          <DialogDescription className="text-slate-600">
            We'd love to know if your order arrived as expected. Your feedback helps us improve our affiliate partnerships.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3">
          <Button
            onClick={() => handleFeedback(true)}
            disabled={isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Yes, It Arrived!
          </Button>

          <Button
            onClick={() => handleFeedback(false)}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            No Issues
          </Button>
        </div>

        <p className="text-xs text-slate-600 text-center mt-2">
          Thank you for helping us improve VitaPlate!
        </p>
      </DialogContent>
    </Dialog>
  );
}