import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Sparkles, 
  Calendar,
  BarChart3,
  FileText,
  Heart,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Recipe Generator',
      description: 'Create custom recipes instantly with AI based on your preferences, ingredients, and dietary needs',
      color: 'from-purple-500 to-pink-500',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80'
    },
    {
      icon: TrendingUp,
      title: 'Nutrition Tracking',
      description: 'Set goals and monitor your daily nutrition intake with detailed analytics and progress tracking',
      color: 'from-blue-500 to-cyan-500',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80'
    },
    {
      icon: Calendar,
      title: 'Smart Meal Plans',
      description: 'Generate personalized 7-day meal plans tailored to your health goals and cultural preferences',
      color: 'from-emerald-500 to-teal-500',
      image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80'
    },
    {
      icon: Users,
      title: 'Community Hub',
      description: 'Share recipes, discover meal plans, and connect with others on their health journey',
      color: 'from-orange-500 to-red-500',
      image: 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=800&q=80'
    },
    {
      icon: ShoppingCart,
      title: 'Smart Grocery Lists',
      description: 'Auto-generated shopping lists with price estimates and organized by category or store aisle',
      color: 'from-indigo-500 to-purple-500',
      image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80'
    },
    {
      icon: FileText,
      title: 'Lab Results Tracking',
      description: 'Upload and track your health biomarkers over time with intelligent trend analysis',
      color: 'from-rose-500 to-pink-500',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80'
    }
  ];

  const benefits = [
    'AI-powered meal planning',
    'Personalized nutrition goals',
    'Community recipe sharing',
    'Automated grocery lists',
    'Health tracking integration',
    'Cultural cuisine options'
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Health Enthusiast',
      content: 'The AI recipe generator has completely transformed how I meal prep. I\'ve discovered so many new recipes!',
      rating: 5
    },
    {
      name: 'Michael T.',
      role: 'Fitness Coach',
      content: 'Nutrition tracking made simple. My clients love how easy it is to stay on track with their macros.',
      rating: 5
    },
    {
      name: 'Emma L.',
      role: 'Busy Parent',
      content: 'The grocery list feature saves me hours every week. Everything is organized perfectly!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1600&q=80')] bg-cover bg-center opacity-20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              ✨ AI-Powered Health & Nutrition Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
              Your Personal Health
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                & Nutrition Hub
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Transform your eating habits with AI-powered meal planning, smart nutrition tracking, 
              and a supportive community—all in one beautiful platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl shadow-black/20 text-lg px-8 py-6"
              >
                <Link to={createPageUrl('HealthDietHub')}>
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-6"
              >
                <Link to={createPageUrl('Dashboard')}>
                  View Dashboard
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Recipes Shared', value: '50K+' },
              { label: 'Meal Plans', value: '25K+' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 text-center border border-white/20"
              >
                <div className="text-2xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-indigo-100 text-indigo-700">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to make healthy eating simple, enjoyable, and sustainable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-60`} />
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-slate-900" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-purple-100 text-purple-700">Why Choose Us</Badge>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Built for Your Success
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We've combined cutting-edge AI technology with nutritional science 
                to create the ultimate health and wellness platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700 font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"
                  alt="Healthy meal preparation"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-50" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-amber-100 text-amber-700">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Loved by Thousands
            </h2>
            <p className="text-xl text-slate-600">
              See what our community has to say
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-6 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-500">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80')] bg-cover bg-center opacity-10" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Health?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of people who are already achieving their health goals with our platform
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl text-lg px-10 py-6"
            >
              <Link to={createPageUrl('HealthDietHub')}>
                Start Your Journey Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}