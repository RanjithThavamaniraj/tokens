import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { parseMarkdownBlocks } from "./markdownBlocks";
import type { ExportDocument } from "./types";
import { exportToMarkdown, type MarkdownExportOptions } from "./MarkdownExporter";

const HEADING_LEVELS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
} as const;

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    },
    width: { size: 2000, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20 })],
      }),
    ],
  });
}

/**
 * Client-side DOCX generation from the shared Markdown representation.
 * Preserves headings, paragraphs, lists, code blocks, tables, and quotes.
 */
export async function exportToDocx(
  document: ExportDocument,
  options: MarkdownExportOptions = {},
): Promise<Blob> {
  const markdown = exportToMarkdown(document, options);
  const blocks = parseMarkdownBlocks(markdown);
  const children: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        children.push(
          new Paragraph({
            text: block.text,
            heading: HEADING_LEVELS[block.level],
            spacing: { before: 240, after: 120 },
          }),
        );
        break;
      case "paragraph":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: block.text, size: 22 })],
            spacing: { after: 120 },
          }),
        );
        break;
      case "bullet":
        block.items.forEach((item) => {
          children.push(
            new Paragraph({
              text: item,
              bullet: { level: 0 },
              spacing: { after: 60 },
            }),
          );
        });
        break;
      case "numbered":
        block.items.forEach((item, index) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. ${item}`, size: 22 }),
              ],
              spacing: { after: 60 },
            }),
          );
        });
        break;
      case "code":
        block.code.split("\n").forEach((line) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line || " ",
                  font: "Courier New",
                  size: 18,
                }),
              ],
              spacing: { after: 0 },
            }),
          );
        });
        children.push(new Paragraph({ text: "" }));
        break;
      case "blockquote":
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: block.text, italics: true, size: 22 }),
            ],
            indent: { left: 360 },
            spacing: { after: 120 },
          }),
        );
        break;
      case "table":
        children.push(
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: block.headers.map((header) => cell(header, true)),
              }),
              ...block.rows.map(
                (row) =>
                  new TableRow({
                    children: row.map((value) => cell(value)),
                  }),
              ),
            ],
          }),
        );
        children.push(new Paragraph({ text: "" }));
        break;
      case "hr":
        children.push(
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: "CCCCCC",
                space: 1,
              },
            },
            spacing: { before: 120, after: 120 },
          }),
        );
        break;
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children:
          children.length > 0
            ? children
            : [
                new Paragraph({
                  children: [new TextRun({ text: document.title })],
                  alignment: AlignmentType.LEFT,
                }),
              ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
