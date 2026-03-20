import { FunctionComponent, JSX, ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

export type DeleteConfirmModalContentProps = {
  title?: string;
  message?: ReactNode;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmModalContent: FunctionComponent<DeleteConfirmModalContentProps> = (
  props: DeleteConfirmModalContentProps
): JSX.Element => {
  const {
    title = 'Delete Record',
    message,
    itemName,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    isSubmitting = false,
    errorMessage = '',
    onCancel,
    onConfirm,
  } = props;

  return (
    <>
      <DialogTitle sx={{ pb: 1, pt: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fee2e2',
              color: '#b4232f',
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#1f2937' }}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}
        {message ? (
          <Typography sx={{ color: '#415c74' }}>{message}</Typography>
        ) : (
          <Typography sx={{ color: '#415c74' }}>
            Are you sure you want to delete <strong>{itemName || 'this item'}</strong>? This action
            cannot be undone.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          color="inherit"
          variant="text"
          sx={{ borderRadius: '10px', px: 2 }}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: '10px',
            px: 2,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { boxShadow: 'none' },
          }}
          disabled={isSubmitting}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </>
  );
};

export default DeleteConfirmModalContent;
