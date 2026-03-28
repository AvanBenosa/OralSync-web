import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type DownloadElementAsPdfOptions = {
  fileName: string;
  scale?: number;
  margin?: number;
  backgroundColor?: string;
  orientation?: 'portrait' | 'landscape';
  format?: string | [number, number];
  maxRenderWidth?: number;
  maxRenderHeight?: number;
  positionX?: number | 'center';
  positionY?: number;
};

export const downloadElementAsPdf = async (
  element: HTMLDivElement | null,
  options: DownloadElementAsPdfOptions
): Promise<void> => {
  if (!element) {
    return;
  }

  const {
    fileName,
    scale = 2,
    margin = 8,
    backgroundColor = '#ffffff',
    orientation = 'portrait',
    format = 'a4',
    maxRenderWidth,
    maxRenderHeight,
    positionX,
    positionY,
  } = options;

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
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = Math.min(maxRenderWidth ?? pageWidth - margin * 2, pageWidth - margin * 2);
  const maxHeight = Math.min(maxRenderHeight ?? pageHeight - margin * 2, pageHeight - margin * 2);
  let renderWidth = maxWidth;
  let renderHeight = (canvas.height * renderWidth) / canvas.width;

  if (renderHeight > maxHeight) {
    renderHeight = maxHeight;
    renderWidth = (canvas.width * renderHeight) / canvas.height;
  }

  const usablePageHeight = pageHeight - margin * 2;
  const resolvedX =
    positionX === 'center'
      ? (pageWidth - renderWidth) / 2
      : Math.min(Math.max(positionX ?? margin, 0), pageWidth - renderWidth);
  const resolvedY = Math.min(Math.max(positionY ?? margin, 0), pageHeight - renderHeight);

  let heightLeft = renderHeight;
  let position = resolvedY;

  pdf.addImage(
    imageData,
    'PNG',
    resolvedX,
    position,
    renderWidth,
    renderHeight,
    undefined,
    'FAST'
  );
  heightLeft -= pageHeight - resolvedY - margin;

  while (heightLeft > 0) {
    position = margin - (renderHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(
      imageData,
      'PNG',
      resolvedX,
      position,
      renderWidth,
      renderHeight,
      undefined,
      'FAST'
    );
    heightLeft -= usablePageHeight;
  }

  pdf.save(fileName);
};

export default downloadElementAsPdf;
