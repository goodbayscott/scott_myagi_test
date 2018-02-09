import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import { VideoSearch } from '../../videos';

const styles = {
  container: {
    margin: 20
  },
  specData: {
    padding: 10
  },
  specTable: {
    display: 'block',
    maxHeight: 300,
    overflowY: 'scroll',
    marginTop: 10
  },
  videoContainer: {
    marginTop: 20
  }
};

export class ProductDetails extends React.Component {
  static propTypes = {
    product: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  renderSpecs() {
    const { product } = this.props;
    const specs = product.get('specs');
    if (!specs) return null;

    return (
      <div>
        <b>Specs:</b>
        <table style={styles.specTable}>
          {_.map(product.get('specs'), (val, key) => {
            key = key.replace(/_/g, ' ');
            key = _.capitalize(key);
            return (
              <tr>
                <td style={styles.specData}>{key}</td>
                <td style={styles.specData}>{val}</td>
              </tr>
            );
          })}
        </table>
      </div>
    );
  }

  render() {
    const { product } = this.props;
    return (
      <div style={styles.container}>
        <b>Description:</b>
        <p>{product.get('text')}</p>
        <b>URL: </b>
        <a href={product.get('pageUrl')} target="_blank">
          {product.get('pageUrl')}
        </a>
        {/* { this.renderSpecs() } */}
        <div style={styles.videoContainer}>
          <b>Related Videos:</b>
          <VideoSearch
            query={product.get('title')}
            maxToDisplay={4}
            currentUser={this.props.currentUser}
            onModCreate={this.props.onModCreate}
          />
        </div>
      </div>
    );
  }
}
