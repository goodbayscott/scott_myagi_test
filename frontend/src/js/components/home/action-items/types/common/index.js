import React from 'react';
import _ from 'lodash';
import Im from 'immutable';
import Radium from 'radium';
import { t } from 'i18n';
import moment from 'moment-timezone';

import Style from 'style';

import $y from 'utilities/yaler';

import { Title, Description, ListItem, CornerRemoveIcon } from 'components/common/list-items';

const IMG_WIDTH = 120;
const IMG_HEIGHT = 9 / 16 * IMG_WIDTH;

const styles = {
  itemMainHeading: {
    color: Style.vars.colors.get('xDarkGrey')
  },
  itemContainer: {
    width: '100%',
    minHeight: 60,
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    border: 'none',
    boxShadow: 'none'
  },
  itemContentContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderLeft: `3px solid ${Style.vars.colors.get('xDarkGrey')}`,
    alignItems: 'center'
  },
  itemInfoContainer: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    marginLeft: 10
  },
  planHeading: {
    fontWeight: 'normal',
    fontSize: 14
  },
  planSubHeading: {
    fontSize: 10,
    marginTop: -10,
    textTransform: 'uppercase'
  },
  itemMainImage: {
    height: IMG_HEIGHT,
    width: IMG_WIDTH,
    border: 'none'
  },
  itemMainImageContainer: {
    padding: '0 10px',
    paddingRight: 0,
    display: 'flex',
    alignItems: 'center'
  },
  itemClose: {},
  actionBtnContainer: {
    fontSize: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    textAlign: 'right',
    color: Style.vars.colors.get('xDarkGrey')
  },
  actionBtnImg: {
    width: 30,
    height: 30,
    opacity: 0.4
  },

  labelsContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 10
  },
  label: {
    padding: 10,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Style.vars.colors.get('darkGrey'),
    borderRadius: 3,
    marginRight: 5
  },

  highlightedItem: {
    backgroundColor: Style.vars.colors.get('fadedYellow')
  },

  completedDate: {
    color: Style.vars.colors.get('oliveGreen'),
    fontSize: 12,
    marginTop: 10
  }
};

export function Item(props) {
  return (
    <ListItem style={styles.itemContainer} onClick={props.onClick}>
      {props.children}
      {props.item &&
        props.item.get('completed') && (
          <p style={styles.completedDate}>
            {t('completed_on_date', { date: moment(props.item.get('completed')).calendar() })}
          </p>
        )}
    </ListItem>
  );
}

export function ItemMainHeading(props) {
  return <p style={styles.itemMainHeading}>{props.children}</p>;
}

export function ItemMainImage(props) {
  return (
    <div style={styles.itemMainImageContainer}>
      <img src={props.src} style={Style.funcs.merge(styles.itemMainImage, props.style)} />
    </div>
  );
}

export function ItemPara(props) {
  return <p>{props.children}</p>;
}

export function ItemContentContainer(props) {
  return <div style={styles.itemContentContainer}>{props.children}</div>;
}

export function ItemInfoContainer(props) {
  return <div style={styles.itemInfoContainer}>{props.children}</div>;
}

export function ItemAction(props) {
  return (
    <div style={styles.actionBtnContainer}>
      {props.children} <i className="ui icon right angle" />
    </div>
  );
}

export function ItemLabels(props) {
  return (
    <div style={styles.labelsContainer}>
      {props.labels.map(l => <div style={{ ...styles.label, ...(styles[l] || {}) }}>{l}</div>)}
    </div>
  );
}

export function PlanHeading(props) {
  return <h2 style={styles.planHeading}>{props.children}</h2>;
}

export function PlanSubHeading(props) {
  return <p style={styles.planSubHeading}>{props.children}</p>;
}
