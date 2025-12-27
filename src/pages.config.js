import MealPlanner from './pages/MealPlanner';
import Dashboard from './pages/Dashboard';
import GroceryLists from './pages/GroceryLists';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "MealPlanner": MealPlanner,
    "Dashboard": Dashboard,
    "GroceryLists": GroceryLists,
    "Analytics": Analytics,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "MealPlanner",
    Pages: PAGES,
    Layout: __Layout,
};