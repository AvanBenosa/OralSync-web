import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type DownloadElementAsPdfOptions = {
  fileName: string;
  scale?: number;
  margin?: number;
  backgroundColor?: string;
};

export const downloadElementAsPdf = async (
  element: HTMLDivElement | null,
  options: DownloadElementAsPdfOptions
): Promise<void> => {
  if (!element) {
    return;
  }

  const { fileName, scale = 2, margin = 8, backgroundColor = '#ffffff' } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor,
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

export default downloadElementAsPdf;
