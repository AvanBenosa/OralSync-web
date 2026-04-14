import { createTheme } from '@mui/material/styles';
import { palettes } from './palletes';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palettes.$primaryColor },
    secondary: { main: palettes.$secondaryColor },
    background: { default: palettes.$backgroundColor },
    text: {
      primary: palettes.$primaryTextColor,
      secondary: palettes.$secondaryTextColor,
      disabled: palettes.$placeholderTextColor,
    },
    success: { main: palettes.$success },
    warning: { main: palettes.$warning },
    error: { main: palettes.$danger },
    info: { main: palettes.$info },
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },

  //** OVERRIDES
  components: {
    MuiCheckbox: {
      defaultProps: {
        color: 'secondary',
      },
    },
    MuiRadio: {
      defaultProps: {
        color: 'secondary',
      },
    },
  },
});
