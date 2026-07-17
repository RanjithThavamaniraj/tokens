import { jsPDF } from "jspdf";
import { parseMarkdownBlocks } from "./markdownBlocks";
import type { ExportDocument } from "./types";
import { exportToMarkdown } from "./MarkdownExporter";

const MARGIN = 48;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;

function wrapText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/**
 * Client-side PDF generation. Typography stays simple and professional:
 * headings, body text, lists, code (monospaced), tables, and quotes.
 */
export async function exportToPdf(document: ExportDocument): Promise<Blob> {
  const markdown = exportToMarkdown(document);
  const blocks = parseMarkdownBlocks(markdown);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed <= PAGE_HEIGHT - MARGIN) return;
    doc.addPage();
    y = MARGIN;
  };

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const size = block.level === 1 ? 18 : block.level === 2 ? 15 : 13;
        ensureSpace(size + 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        const lines = wrapText(doc, block.text, CONTENT_WIDTH, size);
        doc.text(lines, MARGIN, y);
        y += lines.length * (size + 2) + 8;
        break;
      }
      case "paragraph": {
        doc.setFont("helvetica", "normal");
        const lines = wrapText(doc, block.text, CONTENT_WIDTH, 11);
        ensureSpace(lines.length * LINE_HEIGHT + 6);
        doc.setFontSize(11);
        doc.text(lines, MARGIN, y);
        y += lines.length * LINE_HEIGHT + 8;
        break;
      }
      case "bullet":
      case "numbered": {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        block.items.forEach((item, index) => {
          const prefix = block.type === "bullet" ? "• " : `${index + 1}. `;
          const lines = wrapText(
            doc,
            `${prefix}${item}`,
            CONTENT_WIDTH - 12,
            11,
          );
          ensureSpace(lines.length * LINE_HEIGHT + 2);
          doc.text(lines, MARGIN + 12, y);
          y += lines.length * LINE_HEIGHT + 2;
        });
        y += 6;
        break;
      }
      case "code": {
        const lines = block.code.split("\n");
        const boxHeight = lines.length * 12 + 16;
        ensureSpace(boxHeight + 8);
        doc.setFillColor(245, 245, 245);
        doc.rect(MARGIN, y - 10, CONTENT_WIDTH, boxHeight, "F");
        doc.setFont("courier", "normal");
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        lines.forEach((line, index) => {
          doc.text(line.slice(0, 95), MARGIN + 8, y + index * 12);
        });
        doc.setTextColor(0, 0, 0);
        y += boxHeight + 8;
        break;
      }
      case "blockquote": {
        doc.setFont("helvetica", "italic");
        const lines = wrapText(doc, block.text, CONTENT_WIDTH - 16, 11);
        ensureSpace(lines.length * LINE_HEIGHT + 10);
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(2);
        doc.line(MARGIN, y - 8, MARGIN, y + lines.length * LINE_HEIGHT);
        doc.setFontSize(11);
        doc.text(lines, MARGIN + 12, y);
        y += lines.length * LINE_HEIGHT + 10;
        break;
      }
      case "table": {
        const colCount = Math.max(block.headers.length, 1);
        const colWidth = CONTENT_WIDTH / colCount;
        const drawRow = (cells: string[], bold: boolean) => {
          doc.setFont("helvetica", bold ? "bold" : "normal");
          doc.setFontSize(10);
          const wrapped = cells.map((cell) =>
            wrapText(doc, cell || " ", colWidth - 8, 10),
          );
          const rowHeight =
            Math.max(...wrapped.map((lines) => lines.length), 1) * 12 + 8;
          ensureSpace(rowHeight);
          wrapped.forEach((lines, col) => {
            doc.text(lines, MARGIN + col * colWidth + 4, y);
          });
          y += rowHeight;
        };
        drawRow(block.headers, true);
        block.rows.forEach((row) => drawRow(row, false));
        y += 6;
        break;
      }
      case "hr": {
        ensureSpace(16);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 16;
        break;
      }
    }
  }

  return doc.output("blob");
}
