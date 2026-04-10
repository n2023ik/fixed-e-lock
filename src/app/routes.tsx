import { createBrowserRouter } from "react-router";
import Dashboard from "./components/Dashboard";
import Overview from "./components/tabs/Overview";
import Engineers from "./components/tabs/Engineers";
import Issues from "./components/tabs/Issues";
import Devices from "./components/tabs/Devices";
import Reports from "./components/tabs/Reports";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
    children: [
      { index: true, Component: Overview },
      { path: "engineers", Component: Engineers },
      { path: "issues", Component: Issues },
      { path: "devices", Component: Devices },
      { path: "reports", Component: Reports },
    ],
  },
]);
