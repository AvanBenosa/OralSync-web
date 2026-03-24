import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
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

const InvoiceGeneratorModal: FunctionComponent<InvoiceGeneratorModalProps> = (
  props: InvoiceGeneratorModalProps
): JSX.Element => {
  const { onClose, clinicId, patientName, patientNumber, filterDate, items, summary } = props;
  const authUser = useAuthStore((store) => store.user);
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileModel | null>(null);
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

  const resolvedClinicName =
    clinicProfile?.clinicName?.trim() || authUser?.clinicName?.trim() || 'Clinic Name';
  const resolvedClinicAddress = clinicProfile?.address?.trim() || 'Address';
  const resolvedClinicContact =
    [clinicProfile?.emailAddress?.trim(), clinicProfile?.contactNumber?.trim()]
      .filter(Boolean)
      .join(' | ') || 'Email | contact';
  const qrCodeValue =
    clinicProfile?.qrCodeValue?.trim() || clinicId?.trim() || authUser?.clinicId?.trim() || '';
  const registrationLink = useMemo(() => {
    if (!qrCodeValue || typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}/register-appointment?clinicId=${encodeURIComponent(
      qrCodeValue
    )}`;
  }, [qrCodeValue]);
  const pdfFileName = useMemo(() => {
    const resolvedPatientName = createSafeFileSegment(patientName?.trim() || 'Patient');
    const resolvedDate = createSafeFileSegment(
      toValidDateDisplay(filterDate, 'YYYY-MM-DD', 'Invoice')
    );

    return `${resolvedPatientName} - Receipt - ${resolvedDate}.pdf`;
  }, [filterDate, patientName]);

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>Print Preview</DialogTitle>
      <DialogContent
        dividers
        sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, bgcolor: '#f4f7fb' }}
      >
        <Box
          ref={receiptRef}
          sx={{
            width: '100%',
            maxWidth: 860,
            mx: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(203, 214, 226, 0.9)',
            borderRadius: '16px',
            boxShadow: '0 18px 40px rgba(29, 51, 74, 0.08)',
            p: { xs: 2, sm: 3.5 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 5,
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography sx={{ color: '#1e2d3d', fontSize: 12, fontWeight: 600 }}>
                Payment Receipt
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  color: '#101010',
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1.05,
                }}
              >
                {resolvedClinicName}
              </Typography>
              <Typography sx={{ mt: 0.5, color: '#1d2f42', fontSize: 14, fontWeight: 600 }}>
                {resolvedClinicAddress}
              </Typography>
              <Typography sx={{ color: '#1d2f42', fontSize: 14, fontWeight: 600 }}>
                {resolvedClinicContact}
              </Typography>
            </Box>

            <Box sx={{ justifySelf: { xs: 'start', sm: 'end' }, textAlign: 'center' }}>
              {registrationLink ? (
                <QRCodeSVG value={registrationLink} size={74} includeMargin />
              ) : (
                <Box
                  sx={{
                    width: 74,
                    height: 74,
                    border: '1px dashed rgba(45, 78, 112, 0.45)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#6d8196',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  QR
                </Box>
              )}
              <Typography
                sx={{ mt: 0.75, maxWidth: 90, color: '#23384f', fontSize: 11, mx: 'auto' }}
              >
                Scan to book an appointment
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 5,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 220px' },
              gap: 3,
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography sx={{ color: '#1f3449', fontSize: 13, fontWeight: 700 }}>
                Patient
              </Typography>
              <Typography
                sx={{
                  mt: 1.25,
                  color: '#0d1520',
                  fontSize: { xs: 15, sm: 18 },
                  fontWeight: 600,
                  lineHeight: 1.1,
                }}
              >
                {patientName || '--'}
              </Typography>
              {patientNumber?.trim() ? (
                <Typography sx={{ mt: 0.75, color: '#526679', fontSize: 13 }}>
                  Patient No.: {patientNumber}
                </Typography>
              ) : null}
            </Box>

            <Box>
              <Typography sx={{ color: '#1f3449', fontSize: 13, fontWeight: 700 }}>Date</Typography>
              <Typography sx={{ mt: 1.25, color: '#22364b', fontSize: 14, fontWeight: 500 }}>
                {toValidDateDisplay(filterDate, 'ddd, MMM D, YYYY', '--')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 4, overflowX: 'auto' }}>
            <Table size="small" aria-label="Receipt preview table" sx={{ minWidth: 620 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      px: { xs: 1, sm: 2 },
                      py: 1,
                      color: '#1f4c7b',
                      fontSize: 13,
                      fontStyle: 'italic',
                      fontWeight: 500,
                      borderBottom: '1px solid rgba(206, 216, 225, 0.95)',
                    }}
                  >
                    Procedure
                  </TableCell>
                  {['Cost', 'Discount', 'Paid', 'Balance'].map((label) => (
                    <TableCell
                      key={label}
                      align="right"
                      sx={{
                        px: { xs: 1, sm: 2 },
                        py: 1,
                        color: '#1f4c7b',
                        fontSize: 13,
                        fontStyle: 'italic',
                        fontWeight: 500,
                        borderBottom: '1px solid rgba(206, 216, 225, 0.95)',
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
                          px: { xs: 1, sm: 2 },
                          py: 0.75,
                          color: '#1d3550',
                          fontSize: 14,
                          borderBottom: '1px solid rgba(219, 226, 233, 0.92)',
                        }}
                      >
                        {item.procedure || '--'}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          px: { xs: 1, sm: 2 },
                          py: 0.75,
                          color: '#10263e',
                          fontSize: 14,
                          borderBottom: '1px solid rgba(219, 226, 233, 0.92)',
                        }}
                      >
                        {formatReceiptCurrency(item.totalAmount)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          px: { xs: 1, sm: 2 },
                          py: 0.75,
                          color: '#10263e',
                          fontSize: 14,
                          borderBottom: '1px solid rgba(219, 226, 233, 0.92)',
                        }}
                      >
                        {formatReceiptCurrency(0)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          px: { xs: 1, sm: 2 },
                          py: 0.75,
                          color: '#10263e',
                          fontSize: 14,
                          borderBottom: '1px solid rgba(219, 226, 233, 0.92)',
                        }}
                      >
                        {formatReceiptCurrency(item.amountPaid)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          px: { xs: 1, sm: 2 },
                          py: 0.75,
                          color: '#10263e',
                          fontSize: 14,
                          borderBottom: '1px solid rgba(219, 226, 233, 0.92)',
                        }}
                      >
                        {formatReceiptCurrency(resolveItemBalance(item))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{
                        px: 2,
                        py: 2.5,
                        color: '#6a7c8d',
                        fontSize: 14,
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(219, 226, 233, 0.92)',
                      }}
                    >
                      No invoice items available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Box
            sx={{
              width: { xs: '100%', sm: '46%' },
              ml: 'auto',
              mt: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 2,
                py: 0.5,
              }}
            >
              <Typography sx={{ color: '#1f4c7b', fontSize: 14, fontStyle: 'italic' }}>
                TOTAL AMOUNT PAID
              </Typography>
              <Typography sx={{ color: '#062a55', fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
                {formatReceiptCurrency(summary.amountPaid)}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 2,
                py: 0.5,
              }}
            >
              <Typography sx={{ color: '#1f4c7b', fontSize: 14, fontStyle: 'italic' }}>
                Total Remaining Balance
              </Typography>
              <Typography sx={{ color: '#17385f', fontSize: 18, fontWeight: 500 }}>
                {formatReceiptCurrency(summary.balance)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1.5, borderBottom: '1px solid rgba(202, 212, 223, 0.92)' }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: { xs: 6, sm: 8 },
              mt: { xs: 10, sm: 12 },
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ width: '72%', mx: 'auto', borderTop: '1px solid #274c74' }} />
              <Typography sx={{ mt: 0.5, color: '#0d1520', fontSize: 16, fontWeight: 900 }}>
                Dentist Signature
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ width: '72%', mx: 'auto', borderTop: '1px solid #274c74' }} />
              <Typography sx={{ mt: 0.5, color: '#1f4c7b', fontSize: 15 }}>
                Patient&apos;s Signature
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
