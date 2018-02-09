import React from 'react';
import { Route, Redirect, IndexRedirect, IndexRoute, browserHistory } from 'react-router';

import { ProfilePage } from 'components/profile';
import { Page as StaffPage } from '../components/staff-menu/page';
import { Page as CompanyManagementPage } from '../components/staff-menu/company-management/page';
import { Page as UserManagementPage } from '../components/staff-menu/user-management/page';
import { Page as ChannelManagementPage } from '../components/staff-menu/channel-management/page';
import { Page as StandardsReviewPage } from '../components/staff-menu/standards-review/page';
import CreateMicrodeckPage from '../components/staff-menu/create-microdeck';

import { Page as SearchResultsPage } from 'components/search-results/page';
import { Page as LessonsSearchTabContent } from 'components/search-results/lessons/page';
import { Page as PlansSearchTabContent } from 'components/search-results/plans/page';
import { Page as ChannelsSearchTabContent } from 'components/search-results/channels/page';
import { Page as TeamsSearchTabContent } from 'components/search-results/teams/page';
import { Page as UsersSearchTabContent } from 'components/search-results/users/page';

import { Page as AnalyticsPage } from 'components/analytics/page';
import { Page as TrainingDirectoryPage } from 'components/training/page';
import { Page as ChannelsPage } from '../components/content-management/channels-tab/page';
import { Page as ChannelPage } from '../components/content-management/channels-tab/channel/page';
import { Page as NotFoundPage } from '../components/not-found/page.jsx';
import { Page as ContentUnavailablePage } from '../components/not-found/content-not-available.jsx';
import { Page as ModuleAttemptPage } from '../components/module-attempt/page';
import { Page as ModuleAttemptSummaryPage } from '../components/module-attempt/attempt-summary/page';
import { Page as EnrollmentsPage } from '../components/enrollments/page';
import { Page as UserEnrollmentsPage } from '../components/enrollments/user-enrollments/page';
import { Page as TrainingPlanEnrollmentsPage } from '../components/enrollments/training-plan-enrollments/page';
import { Page as SettingsPage } from '../components/settings/page';
import { Page as CuratedChannelDiscoveryPage } from '../components/channel-discovery/curated-channels/page';
import { Page as ChannelDiscoveryDirectoryPage } from '../components/channel-discovery/channel-directory/page';
import { Page as TagCompanyPage } from '../components/tag-company/page';
import { Page as JoinOrCreateCompanyPage } from '../components/join-or-create-company/page';
import { Page as CompanySelectionPage } from '../components/company-select/page';
import { Page as SearchPage } from 'components/search/page';
import { Page as LoginPage } from 'components/accounts/login/page';
import { Page as PasswordResetPage } from 'components/accounts/password/page';
import { Page as UserSignupPage } from 'components/accounts/signup/user/page';
import { Page as CustomSignupPage } from 'components/accounts/signup/custom/page';
import { Page as CompanySignupPage } from 'components/accounts/signup/company/page';
import { Page as ShareLinkPage } from 'components/sharelink/page';
import { Page as UnavailableSharelinkPage } from 'components/sharelink/unavailable/page';
import { Page as LeaderboardPage } from 'components/leaderboards/page';
import { Page as SharedReportPage } from 'components/analytics/shared-report-page';
import { Page as CreditCardPaymentPage } from 'components/payments/page';
import { Page as TeamsWithinAreaCollection } from 'components/leaderboards/areas/teams';
import { Page as ChannelContentPage } from 'components/training/channels/page';
import { Page as SalesReadinessCalcPage } from 'components/sales-readiness-calculator/page';
import { Page as ContentManagementPage } from 'components/content-management/page';
import { Page as PlanManagementPage } from 'components/content-management/plans-tab/plan/page';
import CompanyConnectionsPage from 'components/company-connections';

import { Page as PeoplePage } from '../components/people/page';
import { Page as PeopleTeamsPage } from 'components/people/teams/page';
import { Page as PeopleUsersPage } from 'components/people/users/page';
import { Page as PeopleInvitiationsPage } from 'components/people/invitations/page';
import { Page as PeopleAreasPage } from 'components/people/areas/page';
import { Page as PeopleGroupsPage } from 'components/people/enrollment-groups/page';
import { Page as TeamPage } from '../components/people/teams/team/page';
import { Page as AreaPage } from '../components/people/areas/area/page';
import { Page as EnrollmentGroupPage } from '../components/people/enrollment-groups/enrollment-group/page';

import { Page as LeaderboardUsersPage } from 'components/leaderboards/users';
import { Page as LeaderboardTeamsPage } from 'components/leaderboards/teams';
import { Page as LeaderboardAreasPage } from 'components/leaderboards/areas';
import { Page as LeaderboardGroupsPage } from 'components/leaderboards/enrollment-groups';

import { Page as LessonManagementPage } from 'components/content-management/lessons-tab/lesson/page';
import { Page as AllocationManagementPage } from 'components/demo/allocation-management';
import BriefCreationPage from 'components/demo/lesson-brief-creation';
import LessonReviewTabContent from 'components/demo/lesson-approval';
import HomePage from 'components/home';
import SingleActivityPage from 'components/home/feed/single-activity-item';

import { Page as PlansTabContent } from 'components/content-management/plans-tab/page';
import { Page as ChannelsTabContent } from 'components/content-management/channels-tab/page';
import { Page as LessonsTabContent } from 'components/content-management/lessons-tab/page';
import { Page as ChannelSharingPage } from 'components/content-management/connections-tab/page';

import { App } from '../components/app';
import { App as PublicApp } from '../components/public-app';

import { Page as ChannelConnectionsContainerTab } from 'components/content-management/channels-tab/channel/connections/page';
import { TrainingPlansTab as ChannelPlansTab } from 'components/content-management/channels-tab/channel/training-plans';
import { DetailsTab as ChannelDetailsTab } from 'components/content-management/channels-tab/channel/details';
import { LicenceTab as ChannelLicenceTab } from 'components/content-management/channels-tab/channel/licence';

// Use segment to keep track of page changes
browserHistory.listen(() => {
  if (window.analytics) analytics.page();
});

export const routes = (
  <Route path="/">
    <Route name="sharelinks" path="s/" component={PublicApp}>
      <Route path="unavailable/" component={UnavailableSharelinkPage} />
      <Route path="*" component={ShareLinkPage} />
    </Route>

    <Route name="signup" path="signup/" component={PublicApp}>
      <Route name="custom-signup" path="nike/*" component={CustomSignupPage} />
      <Route name="user-signup" path="user/*" component={UserSignupPage} />
      <Route name="company-signup" path="company/*" component={CompanySignupPage} />
      <Route path="*" component={NotFoundPage} />
    </Route>

    <Route name="accounts" path="accounts/" component={PublicApp}>
      <Route name="login" path="login/" component={LoginPage} />
      <Route name="password-reset" path="password-reset/" component={PasswordResetPage} />
      <Route name="create-password" path="create-password/" component={PasswordResetPage} />
      <Route path="*" component={NotFoundPage} />
    </Route>

    <Route name="public" path="public/" component={PublicApp}>
      <Route name="company-home" path="home/" component={UserSignupPage} />
      <Route name="company-select" path="company-select/" component={CompanySelectionPage} />
      <Route name="sri-calculator" path="sales-readiness/" component={SalesReadinessCalcPage} />
      <Route name="shared-report" path="report/:token/" component={SharedReportPage} />
      <Route name="payments" path="payments/" component={CreditCardPaymentPage} />
      <Route path="*" component={NotFoundPage} />
    </Route>

    <Route name="app" path="views/" component={App}>
      <Route
        name="content-unavailable"
        path="content-unavailable/"
        component={ContentUnavailablePage}
      />
      {/* Search Results */}
      <Route name="search-results" path="search/" component={SearchResultsPage}>
        <IndexRedirect to="lessons/" />
        <Route path="lessons/" component={LessonsSearchTabContent} />
        <Route path="plans/" component={PlansSearchTabContent} />
        <Route path="channels/" component={ChannelsSearchTabContent} />
        <Route path="teams/" component={TeamsSearchTabContent} />
        <Route path="users/" component={UsersSearchTabContent} />
      </Route>
      <IndexRedirect to="training/" />
      <Route name="training" path="training/" component={TrainingDirectoryPage} />

      {/* Content Management */}
      <Route name="plan-management" path="content/plans/:planId/" component={PlanManagementPage} />
      <Route
        name="lesson-management"
        path="content/lessons/:lessonId/"
        component={LessonManagementPage}
      />
      <Route name="content" path="content/" component={ContentManagementPage}>
        <IndexRedirect to="plans/" />
        <Route path="plans/" component={PlansTabContent} />

        {/* Temporary redirects to support old content links */}
        <Redirect from="channels/your-channels/" to="channels/" />
        <Redirect from="channels/connections/" to="connections/" />
        <Redirect from="channels/requests/" to="connections/" />
        <Redirect from="channels/sharelinks/" to="connections/" />
        <Route name="content-channels" path="channels/" component={ChannelsTabContent} />

        <Route
          name="curated"
          path="curated/"
          component={props => <CuratedChannelDiscoveryPage {...props} />}
        />
        <Route path="connections/" component={ChannelSharingPage} />
        <Route
          path="discover/"
          name="channel-directory"
          component={props => <ChannelDiscoveryDirectoryPage {...props} contentManagement={true} />}
        />

        <Route path="lessons/" component={LessonsTabContent} />
        <Route name="leaderboards" path="leaderboards" component={LeaderboardPage} />
        <Route name="demo-brief-creation-tab" path="brief/" component={BriefCreationPage} />
        <Route name="demo-review-tab" path="review/" component={LessonReviewTabContent} />
        <Redirect from="*" to="plans/" />
      </Route>

      {/* People */}
      <Route name="people" path="people/" component={PeoplePage}>
        <IndexRedirect to="teams/" />
        <Route name="teams" path="teams/" component={PeopleTeamsPage} />
        <Route name="users" path="users/" component={PeopleUsersPage} />
        <Route name="invites" path="invites/" component={PeopleInvitiationsPage} />
        <Route name="areas" path="areas/" component={PeopleAreasPage} />
        <Route name="groups" path="groups/" component={PeopleGroupsPage} />
      </Route>
      <Route name="team" path="teams/:teamId/" component={TeamPage} />
      <Route name="area" path="areas/:areaId/" component={AreaPage} />
      <Route
        name="enrollment-groups"
        path="enrollment-groups/:enrollmentGroupId/"
        component={EnrollmentGroupPage}
      />

      {/* Leaderboards */}
      <Route name="leaderboards" path="leaderboards" component={LeaderboardPage}>
        <IndexRedirect to="users/" />
        <Route path="users/" component={LeaderboardUsersPage} />
        <Route path="teams/" component={LeaderboardTeamsPage} />
        <Route path="groups/" component={LeaderboardGroupsPage} />
        <Route path="areas/" component={LeaderboardAreasPage} />
      </Route>
      <Route
        name="area-team-leaderboard"
        path="leaderboards/area/:areaId"
        component={TeamsWithinAreaCollection}
      />
      <Route name="tag-company" path="tag-company/" component={TagCompanyPage} />
      <Route
        name="area-team-leaderboard"
        path="leaderboards/area/:areaId"
        component={TeamsWithinAreaCollection}
      />

      <Route
        name="channel-content"
        path="channel-content/:channelId/"
        component={ChannelContentPage}
      >
        <Route path="*" component={ChannelContentPage} />
      </Route>

      <Route name="channels" path="channels/" component={ChannelsPage} />

      <Route
        name="channel-discovery"
        path="channel-discovery/"
        component={props => <ChannelDiscoveryDirectoryPage {...props} contentManagement={false} />}
      />
      <Route name="channel" path="channels/:channelId/" component={ChannelPage}>
        <IndexRedirect to="plans/" />
        <Route path="plans/" component={ChannelPlansTab} />
        <Route path="connections/" component={ChannelConnectionsContainerTab} />
        <Route path="details/" component={ChannelDetailsTab} />
        <Route path="licences/" component={ChannelLicenceTab} />
      </Route>

      <Route name="profile" path="profile/:userId/" component={ProfilePage} />
      <Route
        name="join-or-create-company"
        path="join-or-create-company/"
        component={JoinOrCreateCompanyPage}
      />

      <Route name="enrollments" path="enrollments/" component={EnrollmentsPage} />
      <Route
        name="user-enrollments"
        path="enrollments/users/:userId/"
        component={UserEnrollmentsPage}
      />
      <Route
        name="training-plan-enrollments"
        path="enrollments/training-plans/:planId/"
        component={TrainingPlanEnrollmentsPage}
      />

      <Route
        name="module-attempt"
        path="modules/:moduleId/attempts/:attemptId/"
        component={ModuleAttemptSummaryPage}
      />
      <Route
        name="new-module-attempt"
        path="training_plans/:trainingPlanId/modules/:moduleId/attempts/new/"
        component={ModuleAttemptPage}
        onLeave={ModuleAttemptPage.willTransitionFrom}
      />

      <Route name="analytics" path="analytics/" component={AnalyticsPage} />

      <Route name="settings" path="settings/" component={SettingsPage} />
      <Route name="search" path="search/" component={SearchPage} />
      <Route
        name="company-connections"
        path="company-connections/"
        component={CompanyConnectionsPage}
      />

      <Route name="myagi-staff" path="myagi-staff/" component={StaffPage} />
      <Route
        name="channel-management"
        path="myagi-staff/channel-management/"
        component={ChannelManagementPage}
      />
      <Route
        name="company-management"
        path="myagi-staff/company-management/"
        component={CompanyManagementPage}
      />
      <Route
        name="user-management"
        path="myagi-staff/user-management/"
        component={UserManagementPage}
      />
      <Route
        name="standards-review"
        path="myagi-staff/standards-review/"
        component={StandardsReviewPage}
      />
      <Route
        name="create-microdeck"
        path="myagi-staff/create-microdeck/"
        component={CreateMicrodeckPage}
      />

      <Route name="demo-brief-creation" path="demo/create-brief/" component={BriefCreationPage} />
      <Route
        name="demo-allocation-management"
        path="demo/allocation-management/"
        component={AllocationManagementPage}
      />
      <Route name="home" path="home/" component={HomePage} />
      <Route
        name="single-activity-item"
        path="home/feed/:activityId/"
        component={SingleActivityPage}
      />
      <Route path="*" component={NotFoundPage} />
    </Route>
  </Route>
);
