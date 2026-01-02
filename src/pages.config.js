import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import GroceryLists from './pages/GroceryLists';
import HealthDietHub from './pages/HealthDietHub';
import LabResults from './pages/LabResults';
import MealPlanner from './pages/MealPlanner';
import MealPlans from './pages/MealPlans';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Dashboard": Dashboard,
    "GroceryLists": GroceryLists,
    "HealthDietHub": HealthDietHub,
    "LabResults": LabResults,
    "MealPlanner": MealPlanner,
    "MealPlans": MealPlans,
    "Settings": Settings,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "MealPlanner",
    Pages: PAGES,
    Layout: __Layout,
};