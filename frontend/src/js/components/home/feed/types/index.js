import TrainingActivity from './training';
import CreatePlanActivity from './create-plan';
import CreateModuleActivity from './create-module';
import JoinCompanyActivity from './join-company';
import PlanAttemptActivity from './plan-attempt';
import PostActivity from './post';

export const TYPE_TO_COMPONENT = {
  trainingactivity: TrainingActivity,
  createplanactivity: CreatePlanActivity,
  createmoduleactivity: CreateModuleActivity,
  joincompanyactivity: JoinCompanyActivity,
  planattemptactivity: PlanAttemptActivity,
  postactivity: PostActivity
};
