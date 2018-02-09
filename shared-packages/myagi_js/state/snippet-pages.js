import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const SnippetPagesState = stateDefaultsGenerator({
  entity: 'snippetPages',
  endpoint: 'snippet_pages'
});

export default SnippetPagesState;
