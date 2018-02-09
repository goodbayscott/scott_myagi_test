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
          <h1>Sorry, we couldn't find the page you're looking for.</h1>
          <h3>
            "Man who catch fly with chopstick, accomplish anything."<br />Mr Miyagi - 1984
          </h3>
        </BoxContent>
      </Box>
    );
  }
}
