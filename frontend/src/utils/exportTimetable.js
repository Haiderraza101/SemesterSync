function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function renderCanvas(element) {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
}

export async function exportTimetable(element, { format, orientation, fileName }) {
  const canvas = await renderCanvas(element);

  if (format === "png") {
    downloadDataUrl(canvas.toDataURL("image/png"), `${fileName}.png`);
    return;
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const margin = 10;
  const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const width = canvas.width * ratio;
  const height = canvas.height * ratio;

  pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin + (pageWidth - width) / 2, margin, width, height);
  pdf.save(`${fileName}.pdf`);
}
