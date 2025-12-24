import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import MatchEntry from "./pages/MatchEntry/index";
import MasterSlipAnalysisPage from "./pages/MasterSlipAnalysisPage";
import MatchesList from "./pages/MatchesList";
import MatchDetails from  "./pages/MatchDetails";
import PredictionAnalysisPage from "./pages/MatchResults";
import GeneratedSlips from "./pages/Slips/GeneratedSlips" 
import SlipsPage from "./pages/SlipsPage";
import SlipDetailPage from './pages/SlipDetailPage'; // You might want to create this too
import NotFound from "./pages/NotFound";


const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <MatchEntry /> },
      { path: "slips/master/:id", element: <MasterSlipAnalysisPage /> },
      { path: "matches", element: <MatchesList /> },
      { path: "matches/:id", element: <MatchDetails /> },
      { path: "matches/:id/results", element: <PredictionAnalysisPage /> },
      {
        path: "generatedslips/:masterSlipId/slips",
        element: <GeneratedSlips />,
      },
      { path: "slips", element: <SlipsPage /> },
      { path: "slips/create", element: <SlipsPage /> },
      { path: "slips/:id", element: <SlipDetailPage /> },
      { path: "*", element: <NotFound /> },
      // { path: "slips/master", element: <SlipMaster /> },
    ],
  },
]);

export default router;
