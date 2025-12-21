import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import MatchEntry from "./pages/MatchEntry/index";
import SlipMaster from "./pages/SlipMaster";
import MatchesList from "./pages/MatchesList";
import MatchDetails from  "./pages/MatchDetails";
import MatchResults from "./pages/MatchResults";
import GeneratedSlips from "./pages/Slips/GeneratedSlips" 
import SlipsPage from "./pages/SlipsPage";
import SlipDetailPage from './pages/SlipDetailPage'; // You might want to create this too
import NotFound from "./pages/NotFound";
// import SlipMaster from "./pages/SlipMaster";


const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <MatchEntry /> },
      { path: "slips/master", element: <SlipMaster /> },
      { path: "matches", element: <MatchesList /> },
      { path: "matches/:id", element: <MatchDetails /> },
      { path: "matches/:id/results", element: <MatchResults /> },
      { path: "generatedslips/:masterSlipId/slips", element: <GeneratedSlips /> },
      { path: "slips", element: <SlipsPage /> },
      { path: "slip/:id", element: <SlipDetailPage /> },
      { path: "*", element: <NotFound /> },
      // { path: "slips/master", element: <SlipMaster /> },


    ],
  },
]);

export default router;
