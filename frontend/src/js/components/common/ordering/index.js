import React from 'react';

import { SecondaryButton } from 'components/common/buttons';

import { Info } from 'components/common/info';

export { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';

const styles = {
  infoBtn: {
    marginTop: 10,
    marginRight: -2,
    marginLeft: 2,
    color: '#666'
  },
  tooltip: { tooltip: { left: -50, width: 200 } }
};

export function ReorderButton(props) {
  return (
    <div style={props.containerStyle}>
      <SecondaryButton onClick={props.toggleReorder}>
        {props.reorderEnabled ? 'Finish Reorder' : 'Reorder'}
        <Info
          content={`Press this then drag and drop ${
            props.entity
          } to re-order them. This will change the order in which they appear to users.`}
          style={styles.infoBtn}
          tooltipStyle={styles.tooltip}
        />
      </SecondaryButton>
    </div>
  );
}

export const orderingStyles = {
  highlight: {
    boxShadow: 'rgba(0, 0, 0, 0.3) 0px 10px 25px',
    cursor: 'move',
    borderRadius: 6,
    transform: 'scale(1.03)'
  },
  moveable: {
    cursor: 'move'
  }
};
