import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import { SortablePage } from './generic-page';
import { AddButton } from './add-button';
import { SortableContainer, ReorderButton } from 'components/common/ordering';
import { LoadingContainer } from 'components/common/loading';
import ModuleCreationState from 'state/module-creation';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  noContentContainer: {
    color: '#999',
    fontSize: '1.4rem',
    fontWeight: 200,
    margin: '50px 50px',
    textAlign: 'center'
  },
  lineBreak: {
    margin: 10,
    width: '100%',
    borderBottom: '1px solid #e5e5e5'
  },
  reorderButtonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 13
  }
};

@SortableContainer
@Radium
class SortablePages extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollable: false,
      startingPoint: 0
    };
  }

  // Allow page scroll when dragging page item up or down while reordering
  mouseMove = e => {
    const center = window.innerHeight / 2;
    if (e.clientY < center - 75 && e.pageY < this.state.startingPoint) {
      window.scrollBy(0, -20);
    } else if (e.clientY > center + 100 && e.pageY > this.state.startingPoint) {
      window.scrollBy(0, 20);
    }
    this.setState({ startingPoint: e.pageY });
  };

  handleMouseDown = e => {
    if (this.props.reorderEnabled && !this.state.scrollable) {
      this.setState({ scrollable: true }, () => {
        window.addEventListener('mousemove', this.mouseMove);
      });
    }
  };

  handleMouseUp = e => {
    if (this.props.reorderEnabled && this.state.scrollable) {
      this.setState({ scrollable: false, startingPoint: 0 }, () => {
        window.removeEventListener('mousemove', this.mouseMove);
      });
    }
  };
  render() {
    return (
      <div
        style={styles.container}
        onMouseDown={e => this.handleMouseDown(e)}
        onMouseUp={e => this.handleMouseUp(e)}
      >
        {this.props.pages.map((p, i) => (
          <SortablePage
            key={p.get('id')}
            page={p}
            index={i}
            disabled={!this.props.reorderEnabled}
            highlight={this.props.reorderEnabled}
          />
        ))}
        {this.props.pages.count() == 0 && (
          <div style={styles.noContentContainer}>{t('there_isnt_anything_in_this_lesson')}</div>
        )}
      </div>
    );
  }
}

@Radium
export class Pages extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reorderEnabled: false
    };
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    ModuleCreationState.ActionCreators.movePage(oldIndex, newIndex);
  };

  render() {
    return (
      <div style={styles.container}>
        {this.props.lesson.get('pages').count() > 1 && (
          <div style={styles.reorderButtonContainer}>
            <ReorderButton
              reorderEnabled={this.state.reorderEnabled}
              toggleReorder={() =>
                this.setState({
                  ...this.state,
                  reorderEnabled: !this.state.reorderEnabled
                })
              }
              entity="lessons"
            />
          </div>
        )}

        <LoadingContainer
          loadingProps={[this.props.lesson]}
          createComponent={props => (
            <SortablePages
              pages={this.props.lesson.get('pages').filter(p => !p.get('deactivated'))}
              reorderEnabled={this.state.reorderEnabled}
              onSortEnd={this.onSortEnd}
            />
          )}
        />
        <div style={styles.lineBreak} />
        <AddButton lesson={this.props.lesson} />
      </div>
    );
  }
}
