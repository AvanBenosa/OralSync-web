import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {
  alpha,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FunctionComponent, JSX, MouseEvent, useState } from 'react';
import { authPalette } from './auth-palette';

type AuthTopNavItem = {
  id: string;
  label: string;
};

type AuthTopNavProps = {
  activeNavId: string;
  navItems: AuthTopNavItem[];
  onSelectNav: (id: string) => void;
};

const navButtonSx = {
  px: 0.75,
  minWidth: 'auto',
  borderRadius: 0,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  fontSize: 15,
  textTransform: 'none',
};

const AuthTopNav: FunctionComponent<AuthTopNavProps> = ({
  activeNavId,
  navItems,
  onSelectNav,
}): JSX.Element => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileAnchorEl, setMobileAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenMobileMenu = (event: MouseEvent<HTMLElement>): void => {
    setMobileAnchorEl(event.currentTarget);
  };

  const handleCloseMobileMenu = (): void => {
    setMobileAnchorEl(null);
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        px: { xs: 2, sm: 3.5, lg: 5 },
        borderBottom: `1px solid ${alpha('#ffffff', 0.08)}`,
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(15, 33, 24, 0.96) 0%, rgba(20, 46, 33, 0.92) 100%)'
            : 'linear-gradient(180deg, #153d2b 0%, #184832 100%)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <Box
        sx={{
          minHeight: 84,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
          <Box
            component="img"
            src="/OralSync.png"
            alt="OralSync logo"
            sx={{
              width: { xs: 42, sm: 48 },
              height: { xs: 42, sm: 48 },
              objectFit: 'contain',
              flexShrink: 0,
              filter: 'drop-shadow(0 10px 18px rgba(8, 15, 12, 0.32))',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: -0.02,
            }}
          >
            Oral
            <Box component="span" sx={{ color: authPalette.mid }}>
              Sync
            </Box>
          </Typography>
        </Stack>

        {isCompact ? (
          <>
            <IconButton
              onClick={handleOpenMobileMenu}
              sx={{
                color: '#ffffff',
                borderRadius: 3,
                border: `1px solid ${alpha('#ffffff', 0.14)}`,
                backgroundColor: alpha('#ffffff', 0.06),
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Menu
              anchorEl={mobileAnchorEl}
              open={Boolean(mobileAnchorEl)}
              onClose={handleCloseMobileMenu}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 230,
                  borderRadius: 3,
                  border: `1px solid ${authPalette.border}`,
                },
              }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.id}
                  selected={activeNavId === item.id}
                  onClick={() => {
                    onSelectNav(item.id);
                    handleCloseMobileMenu();
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : (
          <Stack direction="row" spacing={3} alignItems="center" flex={1} justifyContent="flex-end">
            <Stack direction="row" spacing={2} alignItems="center">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => onSelectNav(item.id)}
                  sx={{
                    ...navButtonSx,
                    ...(activeNavId === item.id
                      ? {
                          color: '#ffffff',
                          borderBottom: `2px solid ${authPalette.mid}`,
                          pb: 0.35,
                        }
                      : null),
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default AuthTopNav;
