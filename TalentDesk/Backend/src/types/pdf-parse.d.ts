declare module "pdf-parse" {
  interface PdfInfo {
    [key: string]: unknown;
  }

  interface PdfResult {
    numpages: number;
    numrender: number;
    info: PdfInfo;
    metadata: unknown;
    text: string;
    version: string;
  }

  function pdfParse(data: Buffer): Promise<PdfResult>;
  export = pdfParse;
}
