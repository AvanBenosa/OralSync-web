import React, { createContext, useMemo, ReactNode } from 'react';
import { createTheme, ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { PaletteMode } from '@mui/material';
import { useThemeStore } from '../../store/themeStore';

interface ThemeContextType {
  toggleColorMode: () => void;
  resetColorMode: () => void;
  mode: PaletteMode;
}

export const ColorModeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  resetColorMode: () => {},
  mode: 'light',
});

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const mode = useThemeStore((state) => state.mode);
  const toggleColorMode = useThemeStore((state) => state.toggleColorMode);
  const resetColorMode = useThemeStore((state) => state.resetColorMode);

  const colorMode = useMemo(
    () => ({
      toggleColorMode,
      resetColorMode,
      mode,
    }),
    [mode, resetColorMode, toggleColorMode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                primary: { main: '#285e83' },
                background: {
                  default: '#FBFBFB',
                  paper: '#f5f5f5',
                },
              }
            : {
                primary: { main: '#1e1e2f' },
                background: {
                  default: '#2a2a3b',
                  paper: '#333344',
                },
              }),
        },
        typography: {
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            'body, html': {
              transition: 'background-color 0.8s ease, color 0.9s ease',
            },
            '*': {
              transition: 'background-color 0.7s ease, color 0.5s ease',
            },
          }}
        />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
