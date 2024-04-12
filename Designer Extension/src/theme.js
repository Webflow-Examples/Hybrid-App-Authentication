import { createTheme } from "@mui/material";
import { Button, TextField, AppBar, Toolbar, Typography } from "@mui/material"

const theme = createTheme({
  typography: {
    fontSize: 9,
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
  },
});

export default theme;
