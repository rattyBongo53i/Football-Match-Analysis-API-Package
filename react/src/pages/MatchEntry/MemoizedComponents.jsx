import React, { memo } from "react";
import { TextField, Select, MenuItem, Card, IconButton } from "@mui/material";

const MemoizedTextField = memo(TextField);

const MemoizedSelect = memo(({ children, ...props }) => (
  <Select {...props}>{children}</Select>
));

const MemoizedMenuItem = memo(MenuItem);

const MemoizedCard = memo(Card);

const MemoizedIconButton = memo(IconButton);

export {
  MemoizedTextField,
  MemoizedSelect,
  MemoizedMenuItem,
  MemoizedCard,
  MemoizedIconButton,
};
