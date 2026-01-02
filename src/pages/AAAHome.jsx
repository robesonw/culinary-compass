import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

export default function AAAHome() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Recipe Generator',
      description: 'Create custom recipes instantly with AI',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Nutrition Tracking',
      description: 'Monitor your daily nutrition intake',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Smart Meal Plans',
      description: 'Personalized 7-day meal plans',
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              ✨ AI-Powered Health & Nutrition Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Your Personal Health
              <br />
              <span className="text-yellow-200">& Nutrition Hub</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
              Transform your eating habits with AI-powered meal planning, smart nutrition tracking, 
              and a supportive community—all in one beautiful platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl text-lg px-8 py-6">
                <Link to={createPageUrl('HealthDietHub')}>
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-6">
                <Link to={createPageUrl('Dashboard')}>
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Recipes Shared', value: '50K+' },
              { label: 'Meal Plans', value: '25K+' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 text-center border border-white/20">
                <div className="text-2xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to make healthy eating simple and sustainable
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg overflow-hidden h-full">
                <div className={`h-3 bg-gradient-to-r ${feature.color}`} />
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of people achieving their health goals with our platform
          </p>
          <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl text-lg px-10 py-6">
            <Link to={createPageUrl('HealthDietHub')}>
              Start Your Journey Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}