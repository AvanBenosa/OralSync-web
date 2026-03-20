import { FunctionComponent, JSX } from 'react';
import { Box, Pagination, PaginationItem, Typography } from '@mui/material';

type RoundedPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onChange: (page: number) => void;
  label?: string;
};

const RoundedPagination: FunctionComponent<RoundedPaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onChange,
  label,
}: RoundedPaginationProps): JSX.Element | null => {
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)));

  if (totalItems <= 0) {
    return null;
  }

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <Box
      sx={{
        mt: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        flexWrap: 'wrap',
      }}
    >
      <Typography sx={{ color: '#6e859a', fontSize: 13, fontWeight: 700 }}>
        {label || `Showing ${startItem}-${endItem} of ${totalItems}`}
      </Typography>
      <Pagination
        page={safePage}
        count={totalPages}
        onChange={(_, nextPage) => {
          onChange(nextPage);
        }}
        shape="rounded"
        siblingCount={1}
        boundaryCount={1}
        renderItem={(item) => (
          <PaginationItem
            {...item}
            sx={{
              minWidth: 36,
              height: 36,
              borderRadius: '12px',
              fontWeight: 700,
              color: '#355b80',
              border: '1px solid rgba(184, 205, 223, 0.9)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(241,246,250,0.98))',
              '&.Mui-selected': {
                color: '#ffffff',
                borderColor: '#2e67ab',
                background: 'linear-gradient(180deg, #3b75ac 0%, #2c69a1 100%)',
                boxShadow: '0 10px 18px rgba(46, 108, 166, 0.2)',
              },
            }}
          />
        )}
      />
    </Box>
  );
};

export default RoundedPagination;
