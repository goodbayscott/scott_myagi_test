import React from 'react';

import { Box, BoxContent } from 'components/common/box';

const styles = {
  container: {
    textAlign: 'center',
    paddingTop: 60,
    paddingBottom: 60
  }
};

export class Page extends React.Component {
  render() {
    return (
      <Box style={styles.container}>
        <BoxContent>
          <img height="239" width="177" src="/static/public/images/chop-error.png" />
          <h1>Sorry, this page is no longer available</h1>
          <h3>The lesson you are trying to access may have been archived or unpublished</h3>
        </BoxContent>
      </Box>
    );
  }
}
