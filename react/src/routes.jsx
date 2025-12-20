import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import MatchEntry from "./pages/MatchEntry/index";
import SlipMaster from "./pages/SlipMaster";
import MatchesList from "./pages/MatchesList";
import MatchDetails from  "./pages/MatchDetails";
import MatchResults from "./pages/MatchResults";
import GeneratedSlips from "./pages/Slips/GeneratedSlips" 

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
      // <Route path="/master-slips/:masterSlipId/slips" element={< />} />
    ],
  },
]);

export default router;
