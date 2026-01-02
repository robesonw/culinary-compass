import AIRecipeGenerator from './pages/AIRecipeGenerator';
import AdminFeedback from './pages/AdminFeedback';
import Analytics from './pages/Analytics';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import Forum from './pages/Forum';
import GroceryLists from './pages/GroceryLists';
import HealthDietHub from './pages/HealthDietHub';
import Index from './pages/Index';
import LabResults from './pages/LabResults';
import MealPlans from './pages/MealPlans';
import NutritionTracking from './pages/NutritionTracking';
import Profile from './pages/Profile';
import ProgressFeed from './pages/ProgressFeed';
import Settings from './pages/Settings';
import SharedMealPlans from './pages/SharedMealPlans';
import SharedRecipes from './pages/SharedRecipes';
import AdminRecipeModeration from './pages/AdminRecipeModeration';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIRecipeGenerator": AIRecipeGenerator,
    "AdminFeedback": AdminFeedback,
    "Analytics": Analytics,
    "Community": Community,
    "Dashboard": Dashboard,
    "Forum": Forum,
    "GroceryLists": GroceryLists,
    "HealthDietHub": HealthDietHub,
    "Index": Index,
    "LabResults": LabResults,
    "MealPlans": MealPlans,
    "NutritionTracking": NutritionTracking,
    "Profile": Profile,
    "ProgressFeed": ProgressFeed,
    "Settings": Settings,
    "SharedMealPlans": SharedMealPlans,
    "SharedRecipes": SharedRecipes,
    "AdminRecipeModeration": AdminRecipeModeration,
}

export const pagesConfig = {
    mainPage: "Index",
    Pages: PAGES,
    Layout: __Layout,
};