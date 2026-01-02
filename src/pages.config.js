import AIRecipeGenerator from './pages/AIRecipeGenerator';
import Analytics from './pages/Analytics';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import Forum from './pages/Forum';
import GroceryLists from './pages/GroceryLists';
import HealthDietHub from './pages/HealthDietHub';
import Index from './pages/Index';
import LabResults from './pages/LabResults';
import MealPlanner from './pages/MealPlanner';
import MealPlans from './pages/MealPlans';
import NutritionTracking from './pages/NutritionTracking';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SharedMealPlans from './pages/SharedMealPlans';
import SharedRecipes from './pages/SharedRecipes';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIRecipeGenerator": AIRecipeGenerator,
    "Analytics": Analytics,
    "Community": Community,
    "Dashboard": Dashboard,
    "Forum": Forum,
    "GroceryLists": GroceryLists,
    "HealthDietHub": HealthDietHub,
    "Index": Index,
    "LabResults": LabResults,
    "MealPlanner": MealPlanner,
    "MealPlans": MealPlans,
    "NutritionTracking": NutritionTracking,
    "Profile": Profile,
    "Settings": Settings,
    "SharedMealPlans": SharedMealPlans,
    "SharedRecipes": SharedRecipes,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "MealPlanner",
    Pages: PAGES,
    Layout: __Layout,
};