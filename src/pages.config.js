import Dashboard from './pages/Dashboard';
import Forum from './pages/Forum';
import GroceryLists from './pages/GroceryLists';
import HealthDietHub from './pages/HealthDietHub';
import LabResults from './pages/LabResults';
import MealPlans from './pages/MealPlans';
import NutritionTracking from './pages/NutritionTracking';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SharedMealPlans from './pages/SharedMealPlans';
import SharedRecipes from './pages/SharedRecipes';
import Community from './pages/Community';
import Analytics from './pages/Analytics';
import AIRecipeGenerator from './pages/AIRecipeGenerator';
import landing from './pages/_Landing';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Forum": Forum,
    "GroceryLists": GroceryLists,
    "HealthDietHub": HealthDietHub,
    "LabResults": LabResults,
    "MealPlans": MealPlans,
    "NutritionTracking": NutritionTracking,
    "Profile": Profile,
    "Settings": Settings,
    "SharedMealPlans": SharedMealPlans,
    "SharedRecipes": SharedRecipes,
    "Community": Community,
    "Analytics": Analytics,
    "AIRecipeGenerator": AIRecipeGenerator,
    "_Landing": landing,
}

export const pagesConfig = {
    mainPage: "AIRecipeGenerator",
    Pages: PAGES,
    Layout: __Layout,
};