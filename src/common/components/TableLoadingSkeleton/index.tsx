import { Fragment, FunctionComponent, JSX } from 'react';
import { Box, Skeleton, TableCell, TableRow } from '@mui/material';

type CellAlign = 'left' | 'center' | 'right' | 'inherit' | 'justify';

type SkeletonPrimitiveCell = {
  kind?: 'text' | 'rounded';
  width: number | string;
  height?: number;
  align?: CellAlign;
};

type SkeletonActionsCell = {
  kind: 'actions';
  align?: CellAlign;
  itemCount?: number;
  itemSize?: number;
  gap?: number;
};

export type TableLoadingSkeletonDesktopCell = SkeletonPrimitiveCell | SkeletonActionsCell;

export type TableLoadingSkeletonMobileConfig = {
  primaryWidth: number | string;
  primaryHeight?: number;
  secondaryWidth?: number | string;
  secondaryHeight?: number;
  badgeWidth?: number | string;
  badgeHeight?: number;
  actionCount?: number;
  actionSize?: number;
  actionGap?: number;
};

export type TableLoadingSkeletonProps = {
  rowCount?: number;
  isMobile?: boolean;
  cellClassName?: string;
  rowClassName?: string;
  desktopCells: TableLoadingSkeletonDesktopCell[];
  mobileConfig?: TableLoadingSkeletonMobileConfig;
};

const renderPrimitiveSkeleton = (
  cell: SkeletonPrimitiveCell,
  key: string
): JSX.Element => {
  const variant = cell.kind === 'rounded' ? 'rounded' : 'text';
  const height = cell.height ?? (variant === 'text' ? 24 : 24);

  return (
    <Skeleton
      key={key}
      variant={variant}
      animation="wave"
      width={cell.width}
      height={height}
      sx={variant === 'text' ? { transform: 'none' } : undefined}
    />
  );
};

const renderActionsSkeleton = (
  itemCount: number,
  itemSize: number,
  gap: number
): JSX.Element => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: `${gap}px`, width: '100%' }}>
    {Array.from({ length: itemCount }, (_, index) => (
      <Skeleton
        key={`action-skeleton-${index}`}
        variant="rounded"
        animation="wave"
        width={itemSize}
        height={itemSize}
      />
    ))}
  </Box>
);

const TableLoadingSkeleton: FunctionComponent<TableLoadingSkeletonProps> = (
  props: TableLoadingSkeletonProps
): JSX.Element => {
  const {
    rowCount = 5,
    isMobile = false,
    cellClassName,
    rowClassName,
    desktopCells,
    mobileConfig,
  } = props;

  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <TableRow key={`table-loading-row-${rowIndex}`} className={rowClassName}>
          {isMobile ? (
            <TableCell className={cellClassName}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.25 }}>
                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {renderPrimitiveSkeleton(
                    {
                      width: mobileConfig?.primaryWidth ?? '70%',
                      height: mobileConfig?.primaryHeight ?? 28,
                    },
                    `mobile-primary-${rowIndex}`
                  )}
                  {mobileConfig?.secondaryWidth || mobileConfig?.badgeWidth ? (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {mobileConfig?.secondaryWidth
                        ? renderPrimitiveSkeleton(
                            {
                              width: mobileConfig.secondaryWidth,
                              height: mobileConfig.secondaryHeight ?? 18,
                            },
                            `mobile-secondary-${rowIndex}`
                          )
                        : null}
                      {mobileConfig?.badgeWidth
                        ? renderPrimitiveSkeleton(
                            {
                              kind: 'rounded',
                              width: mobileConfig.badgeWidth,
                              height: mobileConfig.badgeHeight ?? 24,
                            },
                            `mobile-badge-${rowIndex}`
                          )
                        : null}
                    </Box>
                  ) : null}
                </Box>
                {mobileConfig?.actionCount ? (
                  <Box sx={{ flex: '0 0 auto' }}>
                    {renderActionsSkeleton(
                      mobileConfig.actionCount,
                      mobileConfig.actionSize ?? 34,
                      mobileConfig.actionGap ?? 8
                    )}
                  </Box>
                ) : null}
              </Box>
            </TableCell>
          ) : (
            desktopCells.map((cell, cellIndex) => (
              <TableCell
                key={`desktop-skeleton-cell-${rowIndex}-${cellIndex}`}
                className={cellClassName}
                align={cell.align}
              >
                {cell.kind === 'actions'
                  ? renderActionsSkeleton(
                      cell.itemCount ?? 2,
                      cell.itemSize ?? 36,
                      cell.gap ?? 8
                    )
                  : renderPrimitiveSkeleton(cell, `desktop-${rowIndex}-${cellIndex}`)}
              </TableCell>
            ))
          )}
        </TableRow>
      ))}
    </>
  );
};

export default TableLoadingSkeleton;
