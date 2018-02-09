import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const PDFPagesState = stateDefaultsGenerator({
  entity: 'pdfPages',
  endpoint: 'pdf_pages'
});

export default PDFPagesState;
