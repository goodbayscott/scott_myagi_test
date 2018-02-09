import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import { resolve } from 'react-router-named-routes';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import { Panel } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import { Card } from 'components/common/cards';
import { TickCircle } from 'components/common/tick-circle';
import { ListItem } from 'components/common/list-items';
import { Explanation } from 'components/leaderboards/common';
import { TrainingPlanCard } from 'components/training/plans/plan-card';
import { ScrollableDataTable } from 'components/common/table';
import { SecondaryButton } from 'components/common/buttons';
import {
  IntegrationCards,
  PIM_INTEGRATION,
  FEEDBACK_DB,
  STORE_ANALYTICS,
  WEB_ANALYTICS
} from '../integrations';

const NO_CONTENT = 'no_content';

const styles = {
  pageContainer: {
    backgroundColor: Style.vars.colors.get('xLightGrey'),
    padding: 20,
    minHeight: 'calc(100vh - 80px)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    display: 'flex'
  },
  pageHeading: {
    textAlign: 'center',
    marginBottom: 10
  },
  panelContainer: {
    // width: 'calc(50% - 10px)',
    flexGrow: 1,
    minWidth: 600,
    flexDirection: 'column'
  },
  item: {
    width: '100%',
    padding: 20,
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`,
    display: 'flex',
    flexDirection: 'row',
    margin: 0,
    marginBottom: 0,
    borderRadius: 0
  },
  selectedItem: {
    transform: 'scale(1.008)',
    boxShadow: '#ddd 2px 2px 30px',
    backgroundColor: Style.vars.colors.get('xLightGrey')
  },
  detailsCol: {},
  missingContentLabel: {
    padding: 10,
    backgroundColor: Style.vars.colors.get('errorRed'),
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 3,
    opacity: 0.8
  },
  itemHeading: {
    fontWeight: 'normal',
    marginTop: 10,
    marginBottom: 10
  },

  actionBtnCol: {
    alignSelf: 'center',
    marginLeft: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  actionBtnImg: {
    width: 30,
    height: 30,
    opacity: 0.4
  },
  detailsContainer: {
    backgroundColor: 'white',
    marginLeft: 20,
    padding: 20,
    border: '1px solid #DEDEDE'
  },
  factorName: {
    paddingBottom: 20,
    fontWeight: 'normal',
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  sectionHeading: {
    marginTop: 40,
    fontWeight: 'normal',
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 18
  },
  eventContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  eventTxt: {
    marginTop: 20,
    marginBottom: 20
  },
  arrow: {
    color: Style.vars.colors.get('darkGrey'),
    width: '10%',
    marginRight: 0
  },
  noContent: {
    color: Style.vars.colors.get('errorRed')
  },
  plansContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  rectifyButtons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 5
  },
  rectifyBtn: {
    padding: 10,
    color: 'white',
    backgroundColor: Style.vars.colors.get('xDarkGrey'),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: 3,
    marginRight: 10,
    marginLeft: 0
  }
};

class DetailsPanel {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  renderIntegrations() {
    if (!this.props.factor.get('integrations')) return null;
    return (
      <div>
        <h4 style={styles.sectionHeading}>Related integrations</h4>
        <IntegrationCards integrations={this.props.factor.get('integrations')} />
      </div>
    );
  }
  renderEventsTable() {
    if (!this.props.factor.get('events')) return null;
    return (
      <div>
        <h4 style={styles.sectionHeading}>Active Events</h4>
        <ScrollableDataTable
          sortDisabled
          bodyHeight={null}
          headers={Im.List(['Event', 'Outcome'])}
          rows={this.props.factor.get('events').map(e =>
            Im.List([
              <div style={styles.eventTxt} dangerouslySetInnerHTML={{ __html: e.get('desc') }} />,
              e.get('outcome') === NO_CONTENT ? (
                <div style={{ ...styles.eventTxt, ...styles.noContent }}>
                  There is no content matching this event.
                  <div style={styles.rectifyButtons}>
                    <SecondaryButton
                      style={styles.rectifyBtn}
                      onClick={() => {
                        this.context.router.push(resolve('demo-brief-creation-tab'));
                      }}
                    >
                      Create Brief
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() => {
                        this.context.router.push(resolve('channel-discovery'));
                      }}
                      style={styles.rectifyBtn}
                    >
                      Find Content
                    </SecondaryButton>
                  </div>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: e.get('outcome') }} />
              )
            ]))}
        />
      </div>
    );
  }
  renderPlans() {
    return (
      <div>
        <h4 style={styles.sectionHeading}>Plans</h4>
        {!this.props.factor.get('plans').count() ? (
          <Explanation>This prioritization factor affects all plans</Explanation>
        ) : (
          <div style={styles.plansContainer}>
            {this.props.factor
              .get('plans')
              .map(e => (
                <TrainingPlanCard
                  currentUser={this.props.currentUser}
                  trainingPlan={Im.Map(JSON.parse(e))}
                  sizeMultiplier={1.0}
                  openTrainingPlanModal={() => {}}
                />
              ))}
          </div>
        )}
      </div>
    );
  }
  render() {
    return (
      <div style={{ ...styles.panelContainer, ...styles.detailsContainer }}>
        <h2 style={styles.factorName}>{this.props.factor.get('name')}</h2>
        <Explanation>{this.props.factor.get('desc')}</Explanation>
        {this.renderEventsTable()}
        {this.renderIntegrations()}
        {/* {this.renderPlans()} */}
      </div>
    );
  }
}

class FactorsPanel {
  render() {
    return (
      <div style={styles.panelContainer}>
        {/* <h2 style={styles.factorName}>Prioritization factors</h2> */}
        {this.props.factors
          .map(i => (
            <ListItem
              style={Style.funcs.mergeIf(
                i.get('name') === this.props.selectedFactorName,
                styles.item,
                styles.selectedItem
              )}
              onClick={() => this.props.selectFactor(i)}
            >
              <div style={styles.detailsCol}>
                <h3 style={styles.itemHeading}>{i.get('name')}</h3>
              </div>
              <div style={styles.actionBtnCol}>
                {i.get('hasMissingContent') && (
                  <div style={styles.missingContentLabel}>Missing Content</div>
                )}
                <img style={styles.actionBtnImg} src={require('img/right.png')} />
              </div>
            </ListItem>
          ))
          .toJS()}
      </div>
    );
  }
}

class Page extends React.Component {
  constructor(props) {
    super();
    this.state = {
      selected: props.factors.first()
    };
  }
  selectFactor = f => {
    this.setState({
      selected: f
    });
  };
  render() {
    return (
      <Panel innerStyle={styles.pageContainer}>
        <FactorsPanel
          factors={this.props.factors}
          selectFactor={this.selectFactor}
          selectedFactorName={this.state.selected.get('name')}
          currentUser={this.props.currentUser}
        />
        <DetailsPanel factor={this.state.selected} currentUser={this.props.currentUser} />
      </Panel>
    );
  }
}

export default Marty.createContainer(Page, {
  fetch: {
    factors() {
      return Im.fromJS([
        {
          name: 'In-Store Analytics',
          desc:
            'Plans are ranked according to issues identified by in-store analytics and customer feedback. This ranking mechanism affects all users depending on the results of both individual assessment and group based data points.',
          integrations: [FEEDBACK_DB, STORE_ANALYTICS],
          events: [
            {
              desc:
                'The <b>San Rafael #657</b>, <b>Colma Ii #639</b> and <b>San Leandro #625</b> teams have low average units per transaction.',
              outcome: 'The <b>Upselling</b> plan has been prioritized for these teams.'
            },
            {
              desc:
                'Shopper yield for <b>San Rafael #657</b> and <b>Daly City #1092</b> has decreased by 9%.',
              outcome:
                'The <b>Store Metrics</b> and <b>Customer Service Basics</b> plans have been prioritized for these stores.'
            },
            {
              desc: 'Review of <b>Amy Miller</b> indicates low understanding of fashion products.',
              outcome:
                "Plans from the <b>Men's Fashion'</b> channel have been prioritized for <b>Amy Miller</b>."
            }
          ],
          plans: []
        },
        {
          name: 'Training Effectiveness',
          desc:
            'Information about plan effectiveness is determined by analyzing data from relevant integrations. Plans which are deemed more effective will be prioritized over those which are not.',
          integrations: [FEEDBACK_DB, STORE_ANALYTICS],
          events: [
            {
              desc: 'The <b>Running</b> plan is highly relevant according to 545 users.',
              outcome: 'This plan has been prioritized for all users in the <b>Running</b> group.'
            },
            {
              desc: 'The <b>Fashion</b> plan is highly relevant according to 671 users.',
              outcome:
                'This plan has been prioritized for all users in the <b>Fashion Department</b> group.'
            }
          ],
          plans: [
            '{"num_enrolled_users_in_own_company":701,"user_is_enrolled":true,"num_enrolled_users":704,"modules":[{"url":"http://localhost:8000/api/v1/modules/20325/","id":20325,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/17878/","id":17878,"successfully_completed_by_current_user":true},{"url":"http://localhost:8000/api/v1/modules/17876/","id":17876,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/17877/","id":17877,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/20303/","id":20303,"successfully_completed_by_current_user":false}],"training_units":["http://localhost:8000/api/v1/training_units/4746/"],"name":"Kitchen","url":"http://localhost:8000/api/v1/training_plans/8006/","badges":[],"owner":{"url":"http://localhost:8000/api/v1/companies/7516/","company_logo":"https://myagi-production.s3.amazonaws.com/companies/logo-aecb4f1e-0509-40ad-86b6-99f40767b087.png","company_name":"Home Depot"},"is_published":true,"id":8006,"next_due_date_for_user":"2017-08-25T01:28:48.220935Z","thumbnail_url":"https://myagi-production.s3.amazonaws.com/training/training_plans/custom_thumbnail-4f7fa29f-3485-4023-a163-a3f9eb27a038.jpg","description":"","custom_thumbnail":"https://myagi-production.s3.amazonaws.com/training/training_plans/custom_thumbnail-4f7fa29f-3485-4023-a163-a3f9eb27a038.jpg"}'
          ]
        },
        {
          name: 'Product Popularity',
          hasMissingContent: true,
          desc:
            'This factor uses information about how popular different products are to rank plans. If a product is popular than any related content will be ranked more highly.',
          integrations: [PIM_INTEGRATION, WEB_ANALYTICS],
          events: [
            {
              desc: 'Increased search volume for the <b>Air Jordan 1</b>',
              outcome: NO_CONTENT
            },
            {
              desc: 'Increased sales across all stores for <b>Tech Fleece</b> products',
              outcome: NO_CONTENT
            },
            {
              desc: 'Increased sales across all stores for the <b>Nike Vapor Energy</b>.',
              outcome:
                'The <b>Nike Vapor Energy</b> plan has been prioritized for all stores which carry this product.'
            }
          ],
          plans: [
            '{"num_enrolled_users_in_own_company":701,"user_is_enrolled":true,"num_enrolled_users":706,"modules":[{"url":"http://localhost:8000/api/v1/modules/9135/","id":9135,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/9136/","id":9136,"successfully_completed_by_current_user":false}],"training_units":["http://localhost:8000/api/v1/training_units/1605/"],"name":"RYOBI Power Tools","url":"http://localhost:8000/api/v1/training_plans/4497/","badges":[{"id":61,"badge_image":"https://myagi-production.s3.amazonaws.com/badges/badge578030bd-1233-41cf-9b24-732d50d5470c.png","name":"Brand Ambassador"}],"owner":{"url":"http://localhost:8000/api/v1/companies/854/","company_logo":"https://myagi-production.s3.amazonaws.com/companies/logo-8116b42a-425c-45cd-8b5b-571e63b4c3ea.png","company_name":"Ryobi"},"is_published":true,"id":4497,"next_due_date_for_user":"2017-08-25T01:28:48.220935Z","thumbnail_url":"https://img.youtube.com/vi/rr7aDGkYhSU/0.jpg","description":"RYOBI Power Tools","custom_thumbnail":null}',
            '{"num_enrolled_users_in_own_company":701,"user_is_enrolled":true,"num_enrolled_users":796,"modules":[{"url":"http://localhost:8000/api/v1/modules/18495/","id":18495,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/18493/","id":18493,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/18494/","id":18494,"successfully_completed_by_current_user":false}],"training_units":["http://localhost:8000/api/v1/training_units/5622/"],"name":"Blending, Extraction and Fusion","url":"http://localhost:8000/api/v1/training_plans/8209/","badges":[],"owner":{"url":"http://localhost:8000/api/v1/companies/8356/","company_logo":"https://myagi-production.s3.amazonaws.com/companies/logo-daca2b87-79c7-438b-8fdd-51cc921df0a9.tmpIe0y23","company_name":"Ninja"},"is_published":true,"id":8209,"next_due_date_for_user":"2017-08-25T01:28:48.220935Z","thumbnail_url":"https://myagi-production.s3.amazonaws.com/training/training_plans/custom_thumbnail-8d1c38be-ec7a-41bc-ae53-c3e2d2f70785.jpg","description":"","custom_thumbnail":"https://myagi-production.s3.amazonaws.com/training/training_plans/custom_thumbnail-8d1c38be-ec7a-41bc-ae53-c3e2d2f70785.jpg"}',
            '{"num_enrolled_users_in_own_company":701,"user_is_enrolled":true,"num_enrolled_users":796,"modules":[{"url":"http://localhost:8000/api/v1/modules/18491/","id":18491,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/18492/","id":18492,"successfully_completed_by_current_user":false},{"url":"http://localhost:8000/api/v1/modules/18489/","id":18489,"successfully_completed_by_current_user":false}],"training_units":["http://localhost:8000/api/v1/training_units/5622/"],"name":"Brewing","url":"http://localhost:8000/api/v1/training_plans/8208/","badges":[],"owner":{"url":"http://localhost:8000/api/v1/companies/8356/","company_logo":"https://myagi-production.s3.amazonaws.com/companies/logo-daca2b87-79c7-438b-8fdd-51cc921df0a9.tmpIe0y23","company_name":"Ninja"},"is_published":true,"id":8208,"next_due_date_for_user":"2017-08-25T01:28:48.220935Z","thumbnail_url":"https://myagi-production.s3.amazonaws.com/training/training_plans/custom_thumbnail-9203bae0-6f22-40e1-ac74-df0aefe599a9.jpg","description":"","custom_thumbnail":"https://myagi-production.s3.amazonaws.com/training/training_plans/custom_thumbnail-9203bae0-6f22-40e1-ac74-df0aefe599a9.jpg"}'
          ]
        },
        {
          name: 'Weather',
          desc:
            'Plans which are associated with certain weather conditions will be ranked more highly when those conditions affect certain stores.',
          events: [
            {
              desc: 'Rain forecasted for next Monday near the <b>Clearwater #6357</b> team.',
              outcome: 'The <b>Waterproof Tents Plan</b> has been prioritized for this store.'
            },
            {
              desc:
                'Heavy snow forecasted for next Wednesday near the <b>Kimball & Addison #1980</b> team.',
              outcome: 'The <b>Snow & Ice Equipment</b> plan has been prioritized for this store.'
            },
            {
              desc:
                'Hot weather forecasted for all of next week near the <b>Bronx Terminal #6891</b> team.',
              outcome: 'The <b>Outdoor Furniture</b> plan has been prioritized for this store.'
            },
            {
              desc: 'Heavy snow forecasted for next Friday near the <b>Carrollwood #245</b> team.',
              outcome: 'The <b>Snow & Ice Equipment</b> plan has been prioritized for this store.'
            },
            {
              desc: 'Rain forecasted for next Tuesday near the <b>Emeryville #627</b> team.',
              outcome: 'The <b>Waterproof Tents Plan</b> has been prioritized for this store.'
            }
          ],
          plans: []
        },
        {
          name: 'Time of Year',
          desc:
            'Tag plans with seasonal information to have them ranked more highly when those those seasons roll around.',
          events: [
            {
              desc: 'It is almost spring in North America.',
              outcome: 'The <b>Lawn and Garden</b> plan has been prioritized for all users.'
            }
          ],
          plans: []
        },
        {
          name: 'Due Date',
          desc:
            'If they exist, plan due dates affect how highly a plan is ranked for a given user. This factor will only drastically influence the ranking of a given plan in the couple of days leading up to the due date.',
          events: [
            {
              desc: '<b>Home Cleaning</b> due soon for <b>Aaron Woolford</b>.',
              outcome: 'Plan prioritized for user.'
            },
            {
              desc: '<b>Power Tools</b> due soon for <b>Amberly Irwin</b>.',
              outcome: 'Plan prioritized for user.'
            },
            {
              desc: '<b>Sparkling Water Makers</b> due soon for <b>Cynthia Dougherty</b>.',
              outcome: 'Plan prioritized for user.'
            },
            {
              desc: '<b>Hair Care</b> due soon for <b>Jeffery Boyles</b>.',
              outcome: 'Plan prioritized for user.'
            },
            {
              desc: '<b>Cleaning and Laundry</b> due soon for <b>Raul Smith</b>.',
              outcome: 'Plan prioritized for user.'
            }
          ],
          plans: []
        }
        // {
        //   name: 'Content Order',
        //   desc:
        //     'This is the underlying factor which determines prioritization when no other factors have high relevance.',
        //   events: [
        //     {
        //       desc: 'The <b>Kitchen Cabinet Refacing</b> plan has been ranked as highly relevant.',
        //       outcome:
        //         'This plan has been prioritized for all users in the <b>Furniture</b> group.',
        //     },
        //   ],
        //   plans: [],
        // },
      ]);
    }
  },

  pending() {
    return containerUtils.defaultPending(this, Page);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Page, errors);
  }
});
