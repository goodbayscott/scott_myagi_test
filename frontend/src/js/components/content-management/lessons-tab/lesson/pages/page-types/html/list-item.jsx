import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import { IMAGE_WIDTH, IMAGE_HEIGHT, DeleteButton } from '../common';
import { DetailsModal } from './details-modal';
import { t } from 'i18n';

const styles = {
  containerOuter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    transition: 'all .2s ease',
    ':hover': {
      transform: 'scale(1.02)'
    }
  },
  iconBackground: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccc',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    borderRadius: 2,
    marginRight: 10,
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
    flexShrink: 0
  },
  iconContainer: {
    width: 0
  },
  icon: {
    position: 'relative',
    left: 36,
    fontSize: '60px',
    lineHeight: '60px',
    color: '#f8f8f8',
    zIndex: 10,
    margin: '0'
  },
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 1
  },
  htmlPreviewContainer: {
    height: 80,
    width: 143,
    marginRight: 10,
    overflow: 'hidden',
    border: '1px solid gray',
    padding: 5,
    borderRadius: 2
  },
  htmlPreview: {
    overflow: 'hidden'
  }
};

@Radium
export class HTMLListItem extends React.Component {
  createMarkup = () => {
    // show a scaled preview snippet of the document.
    const htmlContainerStyle = 'width: 1900px; transform-origin: left top; transform: scale(.5)';
    return {
      __html: `<div style='${htmlContainerStyle}'>${this.props.page.get('html')}</div>`
    };
  };

  render() {
    const htmlContent = this.props.page.get('html');
    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={() => this.details.show()}>
          <div style={styles.htmlPreviewContainer}>
            {htmlContent ? (
              <div style={styles.htmlPreview} dangerouslySetInnerHTML={this.createMarkup()} />
            ) : (
              <div>
                <div style={styles.iconContainer}>
                  <i style={styles.icon} className="file text outline icon" />
                </div>
                <div style={styles.iconBackground} />
              </div>
            )}
          </div>

          <div style={styles.textSection}>
            <div>{t('document')}</div>
          </div>
        </div>
        <DeleteButton page={this.props.page} />

        <DetailsModal ref={details => (this.details = details)} page={Im.Map(this.props.page)} />
      </div>
    );
  }
}
