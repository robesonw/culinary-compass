import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { ChefHat, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Clean minimal header */}
      {currentPageName !== 'MealPlanner' && (
        <header className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link 
                to={createPageUrl('MealPlanner')} 
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <ChefHat className="w-6 h-6" />
                <span className="font-semibold">Meal Planner</span>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}