// In your BetslipDrawer component, add better feedback:
import { useState } from "react";
import { Drawer, Snackbar, Alert } from "@mui/material";
import { useBetslip } from "../../contexts/BetslipContext";
import SubmitMasterSlipButton from "./SubmitMasterSlipButton";


const BetslipDrawer = ({ open, onClose }) => {
  const { betslipMatches, removeFromBetslip, clearBetslip } = useBetslip();
  const [removedMatch, setRemovedMatch] = useState(null);

  const handleRemove = (match) => {
    setRemovedMatch(match);
    removeFromBetslip(match.id);
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose}>
        {/* ... existing drawer content ... */}
        <SubmitMasterSlipButton
          betslipMatches={betslipMatches}
          onSuccess={() => console.log("Submitted!")}
        />
      </Drawer>

      <Snackbar
        open={!!removedMatch}
        autoHideDuration={3000}
        onClose={() => setRemovedMatch(null)}
      >
        <Alert severity="success">
          Removed {removedMatch?.home_team} vs {removedMatch?.away_team}
        </Alert>
      </Snackbar>
    </>
  );
};
export default BetslipDrawer;