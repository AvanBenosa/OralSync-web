import { CircularProgress, Stack, Typography } from '@mui/material';
import { FunctionComponent, JSX, useState } from 'react';

type LoadingProps = {
  message?: string;
  imageSrc?: string;
  size?: number;
  fullPage?: boolean;
  minHeight?: number | string;
};

const DEFAULT_IMAGE_SRC = '/tooth-loading.gif';

const Loading: FunctionComponent<LoadingProps> = ({
  message = 'Loading...',
  imageSrc = DEFAULT_IMAGE_SRC,
  size = 140,
  fullPage = false,
  minHeight = 180,
}): JSX.Element => {
  const [imageFailed, setImageFailed] = useState(false);

  console.log(imageFailed);
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{
        width: '100%',
        minHeight: fullPage ? '100vh' : minHeight,
        px: 2,
        py: 3,
      }}
    >
      {!imageFailed ? (
        <img
          src={imageSrc}
          alt="Loading"
          width={size}
          height={size}
          onError={() => setImageFailed(true)}
          style={{ objectFit: 'contain' }}
        />
      ) : (
        <>
          <CircularProgress
            size={Math.max(32, Math.floor(size * 0.38))}
            thickness={4.2}
            sx={{ color: '#12c2cb' }}
          />
        </>
      )}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: 0.3,
        }}
      >
        {message}
      </Typography>
    </Stack>
  );
};

export default Loading;
