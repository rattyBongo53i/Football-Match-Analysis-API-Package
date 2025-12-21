import React from "react";
import { StepIconContainer } from "./styledComponents";

const CustomStepIcon = (props) => {
  const { active, completed, icon } = props;

  

  const icons = {
    1: "⚽",
    2: "📊",
    3: "🔄",
    4: "💰",
    5: "👁️",
  };

  return (
    <StepIconContainer active={active} completed={completed}>
      {icons[icon] || icon}
    </StepIconContainer>
  );
};

export default CustomStepIcon;
