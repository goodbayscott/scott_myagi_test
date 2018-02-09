import React from 'react';
import Radium from 'radium';
import reactMixin from 'react-mixin';
import { t } from 'i18n';

import { remoteSearchMixinFactory } from 'components/common/search';
import { ConnectionsSection } from './connections';
import { SharelinkSection } from './sharelinks';

const PORTRAIT_LAYOUT = '@media screen and (max-width: 950px)';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: -20,
    paddingBottom: 10,
    paddingTop: 50,
    [PORTRAIT_LAYOUT]: {
      flexDirection: 'column-reverse',
      alignItems: 'center'
    }
  },
  section: {
    padding: '0 3px',
    width: '100%',
    maxWidth: 470
  },
  connectionsSection: {
    [PORTRAIT_LAYOUT]: {
      marginTop: 40
    }
  },
  title: {
    fontSize: '2rem',
    fontWeight: '200',
    marginBottom: 15
  }
};

@Radium
export class Page extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.section, ...styles.connectionsSection }}>
          <div style={styles.title}>{t('company_connections')}</div>
          <ConnectionsSection />
        </div>
        <div style={styles.section}>
          <div style={styles.title}>{t('sharelinks')}</div>
          <SharelinkSection />
        </div>
      </div>
    );
  }
}
