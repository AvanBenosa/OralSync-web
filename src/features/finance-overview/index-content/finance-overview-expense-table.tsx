import { FunctionComponent, JSX } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';

import styles from '../style.scss.module.scss';

const FinanceOverviewExpenseTable: FunctionComponent = (): JSX.Element => {
  return (
    <Paper className={styles.tableSurface} elevation={0}>
      <Box className={styles.expensePlaceholder}>
        <Box className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <ReceiptLongOutlinedIcon className={styles.emptyStateGlyph} />
          </div>
          <Typography className={styles.emptyStateTitle}>No expense records yet</Typography>
          <Typography className={styles.emptyStateText}>
            The expenses tab is now part of the finance module. Wire an expense backend contract
            next and this view is ready for its own list, form, and delete flow.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default FinanceOverviewExpenseTable;
