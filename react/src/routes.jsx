import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import MatchEntry from "./pages/MatchEntry";
import SlipMaster from "./pages/SlipMaster";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <MatchEntry /> },
      { path: "slips/master", element: <SlipMaster /> },
      { path: "matches", element: <MatchEntry /> },
    //   { path: "slips", element: <SlipList /> },
      
    ],
  },
]);

export default router;
