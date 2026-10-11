declare module 'pdfjs-dist/build/pdf.mjs' {
  export const GlobalWorkerOptions: { workerSrc: string };
  export interface PdfJsPage {
    getTextContent(): Promise<{ items: Array<{ str?: string; transform?: number[] }> }>;
    getViewport(options: { scale: number }): { width: number; height: number };
    render(options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }): { promise: Promise<void> };
  }
  export interface PdfJsDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfJsPage>;
    destroy(): Promise<void>;
  }
  export function getDocument(options: { data: Uint8Array }): {
    promise: Promise<PdfJsDocument>;
  };
}
