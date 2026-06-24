import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type Cell = string | number;

export function exportToXlsx(filenameBase: string, headers: string[], rows: Cell[][]): void {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  XLSX.writeFile(workbook, `${filenameBase}.xlsx`);
}

export function exportToPdf(title: string, filenameBase: string, headers: string[], rows: Cell[][]): void {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 18);
  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map(String)),
    startY: 24,
    headStyles: { fillColor: [135, 36, 29] }, // vinotinto institucional
  });
  doc.save(`${filenameBase}.pdf`);
}
