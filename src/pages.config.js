import Analytics from './pages/Analytics';
import Community from './pages/Community';
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
import AALandingPage from './pages/AALandingPage';
import Dashboard from './pages/Dashboard';
import AIRecipeGenerator from './pages/AIRecipeGenerator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Community": Community,
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
    "AALandingPage": AALandingPage,
    "Dashboard": Dashboard,
    "AIRecipeGenerator": AIRecipeGenerator,
}

export const pagesConfig = {
    mainPage: "AALandingPage",
    Pages: PAGES,
    Layout: __Layout,
};