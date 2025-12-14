import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet /> {/* <-- Where pages load */}
      </div>
    </div>
  );
}
