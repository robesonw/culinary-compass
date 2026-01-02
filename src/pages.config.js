import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import GroceryLists from './pages/GroceryLists';
import HealthDietHub from './pages/HealthDietHub';
import LabResults from './pages/LabResults';
import MealPlanner from './pages/MealPlanner';
import MealPlans from './pages/MealPlans';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Community from './pages/Community';
import SharedMealPlans from './pages/SharedMealPlans';
import Forum from './pages/Forum';
import SharedRecipes from './pages/SharedRecipes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Dashboard": Dashboard,
    "GroceryLists": GroceryLists,
    "HealthDietHub": HealthDietHub,
    "LabResults": LabResults,
    "MealPlanner": MealPlanner,
    "MealPlans": MealPlans,
    "Profile": Profile,
    "Settings": Settings,
    "Community": Community,
    "SharedMealPlans": SharedMealPlans,
    "Forum": Forum,
    "SharedRecipes": SharedRecipes,
}

export const pagesConfig = {
    mainPage: "MealPlanner",
    Pages: PAGES,
    Layout: __Layout,
};