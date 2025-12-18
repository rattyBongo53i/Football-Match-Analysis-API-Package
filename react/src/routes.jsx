import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import MatchEntry from "./pages/MatchEntry/index";
import SlipMaster from "./pages/SlipMaster";
import MatchesList from "./pages/MatchesList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <MatchEntry /> },
      { path: "slips/master", element: <SlipMaster /> },
      { path: "matches", element: <MatchesList /> },
    //   { path: "slips", element: <SlipList /> },
      
    ],
  },
]);

export default router;
