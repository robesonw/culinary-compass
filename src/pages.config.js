import MealPlanner from './pages/MealPlanner';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "MealPlanner": MealPlanner,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "MealPlanner",
    Pages: PAGES,
    Layout: __Layout,
};