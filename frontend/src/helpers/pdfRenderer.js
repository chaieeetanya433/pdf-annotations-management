import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();


/**
 * Load a PDF file object (from <input type="file">)
 * Returns a pdf document object
 */
export const loadPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    return pdf;
};

/**
 * Render a specific page into a canvas element.
 * Returns { width, height } of the rendered page (viewport dimensions)
 */
export const renderPage = async (pdf, pageNumber, canvas, scale = 1) => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Resize canvas to match viewport
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;

    return { width: viewport.width, height: viewport.height };
};
