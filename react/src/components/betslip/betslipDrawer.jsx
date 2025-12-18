// In your BetslipDrawer component, add better feedback:
import { useState } from "react";
import { Snackbar, Alert } from "@mui/material";

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