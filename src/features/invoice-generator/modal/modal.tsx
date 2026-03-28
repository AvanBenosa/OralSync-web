import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

import { formatCurrency } from '../../../common/helpers/formatCurrency';
import { toValidDateDisplay } from '../../../common/helpers/toValidateDateDisplay';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../common/services/api-client';
import { useAuthStore } from '../../../common/store/authStore';
import { downloadElementAsPdf } from '../../../common/utils/downloadElementAsPdf';
import { GetCurrentClinicProfile } from '../../settings/clinic-profile/api/api';
import type { ClinicProfileModel } from '../../settings/clinic-profile/api/types';
import type { InvoiceGeneratorModalProps, InvoiceGeneratorModel } from '../api/types';

const formatReceiptCurrency = (value?: number | string | null): string =>
  formatCurrency(value, {
    fallback: '0',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const resolveItemBalance = (item: InvoiceGeneratorModel): number => {
  if (item.balance === undefined || item.balance === null) {
    return Number(item.totalAmount ?? 0) - Number(item.amountPaid ?? 0);
  }

  const explicitBalance = Number(item.balance);

  if (Number.isFinite(explicitBalance)) {
    return explicitBalance;
  }

  return Number(item.totalAmount ?? 0) - Number(item.amountPaid ?? 0);
};

const createSafeFileSegment = (value?: string): string =>
  (value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const createReferenceSegment = (value?: string): string => {
  const normalized = (value || '').replace(/[^a-zA-Z0-9]+/g, '').toUpperCase();
  return (normalized.slice(-4) || '0001').padStart(4, '0');
};

const buildClinicInitials = (value?: string): string => {
  const initials = (value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('');

  return initials || 'LS';
};

const InvoiceGeneratorModal: FunctionComponent<InvoiceGeneratorModalProps> = (
  props: InvoiceGeneratorModalProps
): JSX.Element => {
  const { onClose, clinicId, patientName, patientNumber, filterDate, items, summary } = props;
  const authUser = useAuthStore((store) => store.user);
  const authBannerImagePath = authUser?.bannerImagePath?.trim() || '';
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileModel | null>(null);
  const [clinicBannerSrc, setClinicBannerSrc] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    void GetCurrentClinicProfile(clinicId)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(response);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, [clinicId]);

  const resolvedBannerPath = clinicProfile?.bannerImagePath?.trim() || authBannerImagePath;

  useEffect(() => {
    let isActive = true;

    if (!resolvedBannerPath) {
      setClinicBannerSrc((previousValue) => {
        if (previousValue?.startsWith('blob:')) {
          URL.revokeObjectURL(previousValue);
        }

        return '';
      });
      return;
    }

    if (!isProtectedStoragePath(resolvedBannerPath)) {
      setClinicBannerSrc((previousValue) => {
        if (previousValue?.startsWith('blob:')) {
          URL.revokeObjectURL(previousValue);
        }

        return resolveApiAssetUrl(resolvedBannerPath);
      });
      return;
    }

    void loadProtectedAssetObjectUrl(resolvedBannerPath)
      .then((objectUrl) => {
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setClinicBannerSrc((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return objectUrl;
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setClinicBannerSrc((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return '';
        });
      });

    return () => {
      isActive = false;
    };
  }, [resolvedBannerPath]);

  useEffect(() => {
    return () => {
      if (clinicBannerSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(clinicBannerSrc);
      }
    };
  }, [clinicBannerSrc]);

  const resolvedClinicName =
    clinicProfile?.clinicName?.trim() || authUser?.clinicName?.trim() || 'Clinic Name';
  const resolvedClinicAddress = clinicProfile?.address?.trim() || 'Clinic address not set';
  const resolvedClinicEmail = clinicProfile?.emailAddress?.trim() || authUser?.email?.trim() || '';
  const resolvedClinicContactNumber =
    clinicProfile?.contactNumber?.trim() || authUser?.contactNumber?.trim() || '';
  const resolvedClinicContactLine = [resolvedClinicEmail, resolvedClinicContactNumber]
    .filter(Boolean)
    .join(' | ');
  const qrCodeValue =
    clinicProfile?.qrCodeValue?.trim() || clinicId?.trim() || authUser?.clinicId?.trim() || '';
  const clinicInitials = useMemo(
    () => buildClinicInitials(resolvedClinicName),
    [resolvedClinicName]
  );
  const registrationLink = useMemo(() => {
    if (!qrCodeValue || typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}/register-appointment?clinicId=${encodeURIComponent(
      qrCodeValue
    )}`;
  }, [qrCodeValue]);
  const receiptDateValue = items[0]?.date ?? filterDate;
  const rawReceiptDateValue =
    typeof receiptDateValue === 'string'
      ? receiptDateValue
      : receiptDateValue instanceof Date
      ? receiptDateValue.toISOString()
      : '';
  const hasReceiptTime = rawReceiptDateValue.includes(':') || rawReceiptDateValue.includes('T');
  const receiptDateLabel = toValidDateDisplay(receiptDateValue, 'MMMM D, YYYY', '--');
  const receiptTimeLabel = hasReceiptTime
    ? toValidDateDisplay(receiptDateValue, 'hh:mm A', '')
    : '';
  const receiptDateTimeLabel = receiptTimeLabel
    ? `${receiptDateLabel} | ${receiptTimeLabel}`
    : receiptDateLabel;
  const referenceSeed =
    String(items[0]?.id ?? '').trim() || patientNumber?.trim() || patientName?.trim() || '0001';
  const referenceSegment = createReferenceSegment(referenceSeed);
  const dateSegment = toValidDateDisplay(receiptDateValue, 'YYYYMMDD', '00000000');
  const receiptNumber = `ORS-${dateSegment}-${referenceSegment}`;
  const invoiceNumber = `INV-${referenceSegment}`;
  const totalAmount = Number(summary.totalAmount ?? 0);
  const amountPaid = Number(summary.amountPaid ?? 0);
  const remainingBalance = Math.max(Number(summary.balance ?? 0), 0);
  const changeAmount = Math.max(amountPaid - totalAmount, 0);
  const pdfFileName = useMemo(() => {
    const resolvedPatientName = createSafeFileSegment(patientName?.trim() || 'Patient');
    const resolvedDate = createSafeFileSegment(
      toValidDateDisplay(filterDate, 'YYYY-MM-DD', 'Invoice')
    );

    return `${resolvedPatientName} - Receipt - ${resolvedDate}.pdf`;
  }, [filterDate, patientName]);

  return (
    <>
      <GlobalStyles
        styles={{
          '@page': {
            size: 'letter landscape',
            margin: '0.15in',
          },
          '@media print': {
            '*': {
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            },
            body: {
              backgroundColor: '#ffffff',
              margin: '0 !important',
              padding: '0 !important',
            },
            '.MuiBackdrop-root': {
              display: 'none !important',
            },
            '.MuiDialog-root': {
              position: 'static !important',
            },
            '.MuiDialog-container': {
              alignItems: 'flex-start !important',
              justifyContent: 'flex-start !important',
            },
            '.MuiDialog-paper': {
              width: '100% !important',
              maxWidth: 'none !important',
              margin: '0 !important',
              boxShadow: 'none !important',
              overflow: 'visible !important',
            },
            '.MuiDialogTitle-root, .MuiDialogActions-root': {
              display: 'none !important',
            },
            '.MuiDialogContent-root': {
              padding: '0 !important',
              display: 'flex !important',
              justifyContent: 'flex-start !important',
              alignItems: 'flex-start !important',
              overflow: 'visible !important',
              border: '0 !important',
              backgroundColor: '#ffffff !important',
            },
          },
        }}
      />
      <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>Print Preview</DialogTitle>
      <DialogContent
        dividers
        sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, bgcolor: '#2e333a' }}
      >
        <Box
          ref={receiptRef}
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 860,
            mx: 'auto',
            overflow: 'hidden',
            backgroundColor: '#fbfcfe',
            backgroundImage: `
              linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,251,254,0.98)),
              radial-gradient(circle at top left, rgba(31,76,123,0.08), transparent 34%),
              radial-gradient(circle at bottom right, rgba(31,76,123,0.05), transparent 28%)
            `,
            border: '1px solid rgba(201, 211, 223, 0.95)',
            borderRadius: '16px',
            boxShadow: '0 24px 52px rgba(10, 24, 39, 0.24)',
            p: { xs: 1.75, sm: 2.5 },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(35, 54, 78, 0.08) 0.55px, transparent 0.55px)',
              backgroundSize: '8px 8px',
              opacity: 0.14,
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 14,
              border: '1px solid rgba(198, 210, 223, 0.9)',
              borderRadius: '14px',
              pointerEvents: 'none',
            },
            '@media print': {
              width: '6in',
              maxWidth: '6in',
              minHeight: '3.25in',
              display: 'block',
              ml: 0,
              mr: 'auto',
              mt: 0,
              borderRadius: '10px',
              boxShadow: 'none',
              p: '0.14in 0.18in',
              '&::after': {
                inset: 6,
              },
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(0, 1.35fr) auto' },
                gap: { xs: 2, md: 2.5 },
                alignItems: 'start',
                '@media print': {
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.18fr) auto',
                  gap: 1.1,
                },
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                  <Box
                    sx={{
                      width: 76,
                      height: 76,
                      borderRadius: '20px',
                      border: '1px solid rgba(199, 210, 222, 0.95)',
                      bgcolor: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 8px 18px rgba(23, 49, 74, 0.08)',
                      flexShrink: 0,
                      '@media print': {
                        width: 54,
                        height: 54,
                        borderRadius: '16px',
                      },
                    }}
                  >
                    {clinicBannerSrc ? (
                      <Box
                        component="img"
                        src={clinicBannerSrc}
                        alt={resolvedClinicName}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.1 }}
                      />
                    ) : (
                      <Typography
                        sx={{
                          color: '#1f4c7b',
                          fontSize: 28,
                          fontWeight: 900,
                          letterSpacing: 0.5,
                          '@media print': {
                            fontSize: 21,
                          },
                        }}
                      >
                        {clinicInitials}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: '#1d3042',
                        fontSize: { xs: 20, sm: 24 },
                        fontWeight: 900,
                        lineHeight: 1,
                        '@media print': {
                          fontSize: 19,
                        },
                      }}
                    >
                      {resolvedClinicName}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.5,
                        color: '#5b6877',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        '@media print': {
                          fontSize: 10,
                          letterSpacing: 1.5,
                        },
                      }}
                    >
                      Dental Clinic
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  sx={{
                    mt: 1.45,
                    color: '#324252',
                    fontSize: 12.5,
                    '@media print': {
                      mt: 0.9,
                      fontSize: 10.5,
                    },
                  }}
                >
                  {resolvedClinicAddress}
                </Typography>
                {resolvedClinicContactLine ? (
                  <Typography
                    sx={{
                      mt: 0.55,
                      color: '#324252',
                      fontSize: 12.5,
                      '@media print': {
                        fontSize: 10.5,
                      },
                    }}
                  >
                    {resolvedClinicContactLine}
                  </Typography>
                ) : null}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: '#222831',
                    fontSize: { xs: 18, sm: 20 },
                    fontWeight: 900,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    '@media print': {
                      fontSize: 17,
                    },
                  }}
                >
                  Payment Receipt
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    pt: 1.1,
                    borderTop: '1px solid rgba(207, 216, 226, 0.95)',
                    display: 'grid',
                    gap: 0.55,
                    '@media print': {
                      mt: 0.75,
                      pt: 0.8,
                      gap: 0.28,
                    },
                  }}
                >
                  {[
                    { label: 'Receipt No:', value: receiptNumber },
                    { label: 'Invoice No:', value: invoiceNumber },
                    { label: 'Date:', value: receiptDateTimeLabel },
                  ].map((item) => (
                    <Typography
                      key={item.label}
                      sx={{
                        color: '#304152',
                        fontSize: 12.5,
                        lineHeight: 1.35,
                        '@media print': {
                          fontSize: 10.5,
                        },
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {item.label}
                      </Box>{' '}
                      {item.value}
                    </Typography>
                  ))}
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center', justifySelf: { xs: 'start', md: 'end' } }}>
                {registrationLink ? (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 0.7,
                      border: '1px solid rgba(200, 211, 223, 0.95)',
                      borderRadius: '10px',
                      bgcolor: '#ffffff',
                      '@media print': {
                        p: 0.45,
                      },
                    }}
                  >
                    <QRCodeSVG value={registrationLink} size={74} includeMargin={false} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 84,
                      height: 84,
                      border: '1px dashed rgba(69, 95, 123, 0.55)',
                      borderRadius: '10px',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#6d8196',
                      fontSize: 12,
                      fontWeight: 700,
                      bgcolor: '#ffffff',
                    }}
                  >
                    QR
                  </Box>
                )}
                <Typography
                  sx={{
                    mt: 0.85,
                    maxWidth: 110,
                    color: '#3a495a',
                    fontSize: 11.5,
                    mx: 'auto',
                    '@media print': {
                      mt: 0.45,
                      fontSize: 9.5,
                      lineHeight: 1.25,
                    },
                  }}
                >
                  Scan to book an appointment
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 2.1,
                borderBottom: '1px solid rgba(207, 216, 226, 0.95)',
                '@media print': {
                  mt: 1.35,
                },
              }}
            />

            <Box sx={{ position: 'relative', mt: 2.2 }}>
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.75fr) 230px' },
                  gap: 2.4,
                  alignItems: 'start',
                  '@media print': {
                    gap: 1,
                    gridTemplateColumns: 'minmax(0, 1fr) 1.85in',
                  },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: '#2a3948',
                      fontSize: 14,
                      fontWeight: 700,
                      '@media print': {
                        fontSize: 11.5,
                      },
                    }}
                  >
                    Patient
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.45,
                      color: '#182737',
                      fontSize: { xs: 18, sm: 20 },
                      fontWeight: 800,
                      lineHeight: 1.1,
                      '@media print': {
                        fontSize: 15.5,
                      },
                    }}
                  >
                    {patientName || '--'}
                  </Typography>
                  {patientNumber?.trim() ? (
                    <Typography
                      sx={{
                        mt: 0.6,
                        color: '#526274',
                        fontSize: 13,
                        '@media print': {
                          mt: 0.35,
                          fontSize: 10.5,
                        },
                      }}
                    >
                      Patient No.: {patientNumber}
                    </Typography>
                  ) : null}

                  <Box
                    sx={{
                      mt: 1.4,
                      border: '1px solid rgba(207, 216, 226, 0.95)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      bgcolor: 'rgba(255, 255, 255, 0.86)',
                      '@media print': {
                        mt: 0.85,
                      },
                    }}
                  >
                    <Table size="small" aria-label="Receipt preview table" sx={{ minWidth: 0 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(242, 246, 251, 0.92)' }}>
                          <TableCell
                            sx={{
                              px: 1.5,
                              py: 0.8,
                              color: '#2b3947',
                              fontSize: 12,
                              fontWeight: 800,
                              borderBottom: '1px solid rgba(207, 216, 226, 0.95)',
                              '@media print': {
                                px: 0.85,
                                py: 0.5,
                                fontSize: 9.5,
                              },
                            }}
                          >
                            Procedure
                          </TableCell>
                          {['Cost', 'Discount', 'Paid', 'Balance'].map((label) => (
                            <TableCell
                              key={label}
                              align="right"
                              sx={{
                                px: 1.5,
                                py: 0.8,
                                color: '#2b3947',
                                fontSize: 12,
                                fontWeight: 800,
                                borderBottom: '1px solid rgba(207, 216, 226, 0.95)',
                                '@media print': {
                                  px: 0.85,
                                  py: 0.5,
                                  fontSize: 9.5,
                                },
                              }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.length > 0 ? (
                          items.map((item, index) => (
                            <TableRow key={item.id ?? `invoice-preview-${index}`}>
                              <TableCell
                                sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  color: '#1d2f40',
                                  fontSize: 12.5,
                                  borderBottom: '1px solid rgba(220, 227, 234, 0.95)',
                                  '@media print': {
                                    px: 0.85,
                                    py: 0.45,
                                    fontSize: 9.5,
                                  },
                                }}
                              >
                                {item.procedure || '--'}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  color: '#1d2f40',
                                  fontSize: 12.5,
                                  borderBottom: '1px solid rgba(220, 227, 234, 0.95)',
                                  '@media print': {
                                    px: 0.85,
                                    py: 0.45,
                                    fontSize: 9.5,
                                  },
                                }}
                              >
                                {formatReceiptCurrency(item.totalAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  color: '#1d2f40',
                                  fontSize: 12.5,
                                  borderBottom: '1px solid rgba(220, 227, 234, 0.95)',
                                  '@media print': {
                                    px: 0.85,
                                    py: 0.45,
                                    fontSize: 9.5,
                                  },
                                }}
                              >
                                {formatReceiptCurrency(0)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  color: '#1d2f40',
                                  fontSize: 12.5,
                                  borderBottom: '1px solid rgba(220, 227, 234, 0.95)',
                                  '@media print': {
                                    px: 0.85,
                                    py: 0.45,
                                    fontSize: 9.5,
                                  },
                                }}
                              >
                                {formatReceiptCurrency(item.amountPaid)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  color: '#1d2f40',
                                  fontSize: 12.5,
                                  borderBottom: '1px solid rgba(220, 227, 234, 0.95)',
                                  '@media print': {
                                    px: 0.85,
                                    py: 0.45,
                                    fontSize: 9.5,
                                  },
                                }}
                              >
                                {formatReceiptCurrency(Math.max(resolveItemBalance(item), 0))}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              sx={{
                                px: 2,
                                py: 2.2,
                                color: '#68798a',
                                fontSize: 13,
                                textAlign: 'center',
                                borderBottom: '1px solid rgba(220, 227, 234, 0.95)',
                              }}
                            >
                              No invoice items available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>

                <Box
                  sx={{
                    border: '1px solid rgba(207, 216, 226, 0.95)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 10px 20px rgba(31, 55, 80, 0.05)',
                    '@media print': {
                      borderRadius: '8px',
                    },
                  }}
                >
                  {[
                    {
                      label: 'TOTAL AMOUNT',
                      value: formatReceiptCurrency(totalAmount),
                      emphasize: true,
                    },
                    {
                      label: 'AMOUNT PAID',
                      value: formatReceiptCurrency(amountPaid),
                    },
                    {
                      label: 'CHANGE',
                      value: formatReceiptCurrency(changeAmount),
                    },
                    {
                      label: 'BALANCE',
                      value: formatReceiptCurrency(remainingBalance),
                    },
                  ].map((item, index, array) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 1.75,
                        px: 1.5,
                        py: 1.05,
                        borderBottom:
                          index === array.length - 1
                            ? 'none'
                            : '1px solid rgba(218, 225, 233, 0.95)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#394857',
                          fontSize: 11.5,
                          fontWeight: 800,
                          letterSpacing: 0.4,
                          textTransform: 'uppercase',
                          '@media print': {
                            fontSize: 9,
                          },
                        }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography
                        sx={{
                          color: '#1d2e40',
                          fontSize: item.emphasize ? 17 : 15,
                          fontWeight: item.emphasize ? 900 : 800,
                          lineHeight: 1.1,
                          '@media print': {
                            fontSize: item.emphasize ? 13.5 : 11.75,
                          },
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 3,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: { xs: 4, md: 7 },
                '@media print': {
                  mt: 1.15,
                  gap: 2,
                },
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: '70%', mx: 'auto', borderTop: '1px solid #607792' }} />
                <Typography
                  sx={{
                    mt: 0.55,
                    color: '#334454',
                    fontSize: 13.5,
                    '@media print': {
                      fontSize: 10.5,
                    },
                  }}
                >
                  Dentist Signature
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: '70%', mx: 'auto', borderTop: '1px solid #607792' }} />
                <Typography
                  sx={{
                    mt: 0.55,
                    color: '#334454',
                    fontSize: 13.5,
                    '@media print': {
                      fontSize: 10.5,
                    },
                  }}
                >
                  Patient Signature
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 2.2,
                pt: 1.6,
                borderTop: '1px solid rgba(207, 216, 226, 0.95)',
                textAlign: 'center',
                '@media print': {
                  mt: 1.1,
                  pt: 0.9,
                },
              }}
            >
              <Typography
                sx={{
                  color: '#223242',
                  fontSize: { xs: 18, sm: 20 },
                  fontWeight: 900,
                  '@media print': {
                    fontSize: 15.5,
                  },
                }}
              >
                Thank you for choosing {resolvedClinicName}!
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: '#3b4b5d',
                  fontSize: 13.5,
                  '@media print': {
                    fontSize: 10.5,
                  },
                }}
              >
                This serves as your official receipt.
              </Typography>
              {resolvedClinicEmail ? (
                <Typography
                  sx={{
                    mt: 0.8,
                    color: '#546576',
                    fontSize: 12,
                    '@media print': {
                      mt: 0.5,
                      fontSize: 9.5,
                    },
                  }}
                >
                  For inquiries: {resolvedClinicEmail}
                </Typography>
              ) : null}
              <Typography
                sx={{
                  mt: 0.35,
                  color: '#7a8794',
                  fontSize: 11.5,
                  '@media print': {
                    fontSize: 9,
                  },
                }}
              >
                This document is not valid without an official receipt number.
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfRoundedIcon />}
          disabled={isDownloadingPdf}
          onClick={async () => {
            setIsDownloadingPdf(true);

            try {
              await downloadElementAsPdf(receiptRef.current, {
                fileName: pdfFileName,
                orientation: 'landscape',
                format: 'letter',
                margin: 4,
                maxRenderWidth: 152.4,
                maxRenderHeight: 82.55,
                positionX: 4,
                positionY: 4,
              });
            } finally {
              setIsDownloadingPdf(false);
            }
          }}
        >
          {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
        </Button>
      </DialogActions>
    </>
  );
};

export default InvoiceGeneratorModal;
