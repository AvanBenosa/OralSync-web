import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FunctionComponent, JSX, useMemo, useRef, useState } from 'react';

import { buildPatientFormPdfFileName } from '../api/template-content';
import { PatientFormStateProps } from '../api/types';
import { PatientFormReportPreview } from '../index-content/patient-form-report-preview';

const printPreviewDocument = (element: HTMLDivElement | null, title: string): void => {
  if (!element) {
    return;
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
  if (!printWindow) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: auto;
            margin: 16mm;
          }

          body {
            margin: 0;
            padding: 24px;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
          }

          img {
            max-width: 100%;
          }
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

const downloadPreviewAsPdf = async (
  element: HTMLDivElement | null,
  fileName: string
): Promise<void> => {
  if (!element) {
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const renderWidth = pageWidth - margin * 2;
  const renderHeight = (canvas.height * renderWidth) / canvas.width;
  const usablePageHeight = pageHeight - margin * 2;

  let heightLeft = renderHeight;
  let position = margin;

  pdf.addImage(imageData, 'PNG', margin, position, renderWidth, renderHeight, undefined, 'FAST');
  heightLeft -= usablePageHeight;

  while (heightLeft > 0) {
    position = margin - (renderHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', margin, position, renderWidth, renderHeight, undefined, 'FAST');
    heightLeft -= usablePageHeight;
  }

  pdf.save(fileName);
};

const PatientFormsViewModal: FunctionComponent<PatientFormStateProps> = (
  props: PatientFormStateProps
): JSX.Element => {
  const { state, setState, patientProfile } = props;
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const formTitle = useMemo(
    () => state.selectedItem?.formType?.trim() || 'Patient Form Preview',
    [state.selectedItem]
  );
  const pdfFileName = useMemo(
    () =>
      state.selectedItem
        ? buildPatientFormPdfFileName(state.selectedItem, patientProfile)
        : 'Patient Form.pdf',
    [patientProfile, state.selectedItem]
  );

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{formTitle}</DialogTitle>
      <DialogContent dividers sx={{ background: '#f4f7fb' }}>
        {state.selectedItem ? (
          <PatientFormReportPreview
            item={state.selectedItem}
            patientProfile={patientProfile}
            reportRef={reportRef}
          />
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          color="inherit"
          onClick={() =>
            setState((prev: typeof state) => ({
              ...prev,
              openModal: false,
              isView: false,
            }))
          }
        >
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfRoundedIcon />}
          disabled={isDownloadingPdf || !state.selectedItem}
          onClick={async () => {
            setIsDownloadingPdf(true);

            try {
              await downloadPreviewAsPdf(reportRef.current, pdfFileName);
            } finally {
              setIsDownloadingPdf(false);
            }
          }}
        >
          {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintRoundedIcon />}
          onClick={() => printPreviewDocument(reportRef.current, formTitle)}
        >
          Print
        </Button>
      </DialogActions>
    </>
  );
};

export default PatientFormsViewModal;
