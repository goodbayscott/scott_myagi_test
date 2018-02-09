import { RETAILER, HOSPO_COMPANY, OTHER } from 'core/constants';

// NOTE: For the time being, we will put Hospo Companies and Others
// in the same category as Retailers, while Content Sellers will be considered
// a brand. Currently, the only difference between company type views are
// prompts to visit the discovery page to find more content.
export function isFromRetailerOrHospo(currentUser) {
  const type = currentUser.get('learner').company.company_type;
  return type === RETAILER || type === HOSPO_COMPANY || type === OTHER;
}

export function getUserCompanyType(currentUser) {
  return currentUser.get('learner').company.company_type;
}
