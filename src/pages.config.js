import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import GroceryLists from './pages/GroceryLists';
import MealPlanner from './pages/MealPlanner';
import Settings from './pages/Settings';
import LabResults from './pages/LabResults';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Dashboard": Dashboard,
    "GroceryLists": GroceryLists,
    "MealPlanner": MealPlanner,
    "Settings": Settings,
    "LabResults": LabResults,
}

export const pagesConfig = {
    mainPage: "MealPlanner",
    Pages: PAGES,
    Layout: __Layout,
};