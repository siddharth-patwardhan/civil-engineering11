/** Sign-in and onboarding configuration — shared field metadata and defaults. */

export const ORG_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "ESTIMATOR", label: "Estimator" },
  { value: "SITE_ENGINEER", label: "Site Engineer" },
  { value: "VIEWER", label: "Viewer" },
] as const;

export const CURRENCIES = [
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "AUD", label: "AUD ($)", symbol: "$" },
] as const;

export const UNIT_SYSTEMS = [
  { value: "metric", label: "Metric (m, m², m³, kg)" },
  { value: "imperial", label: "Imperial (ft, sf, cf, lb)" },
] as const;

export const IS_STANDARDS_OPTIONS = [
  "IS 456:2000",
  "IS 800:2007",
  "IS 1893:2016",
  "IS 3370:2009",
  "CPWD DSR",
] as const;

export const COUNTRIES = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "AE", label: "UAE" },
] as const;

export const signInSetupConfig = {
  /** First-time setup wizard steps */
  steps: [
    { id: "user", title: "Your Profile", icon: "person" },
    { id: "organization", title: "Company", icon: "domain" },
    { id: "preferences", title: "Preferences", icon: "tune" },
  ] as const,

  user: {
    defaults: {
      jobTitle: "Civil Engineer",
      name: "",
      phone: "",
    },
    fields: [
      { key: "name", label: "Full Name", type: "text", required: true, placeholder: "Rajesh Kumar" },
      { key: "jobTitle", label: "Job Title", type: "text", required: true, placeholder: "Senior Estimator" },
      { key: "phone", label: "Phone", type: "tel", required: false, placeholder: "+91 98765 43210" },
    ],
  },

  organization: {
    defaults: {
      name: "",
      registrationId: "",
      contactEmail: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "IN",
    },
    fields: [
      { key: "name", label: "Company Name", type: "text", required: true, placeholder: "Apex Civil Engineering Pvt Ltd" },
      { key: "registrationId", label: "Registration / GST ID", type: "text", required: false, placeholder: "GSTIN or Company Reg No." },
      { key: "contactEmail", label: "Primary Contact Email", type: "email", required: true, placeholder: "admin@company.com" },
      { key: "phone", label: "Company Phone", type: "tel", required: false, placeholder: "+91 11 2345 6789" },
      { key: "address", label: "Address", type: "text", required: false, placeholder: "Plot 12, Industrial Area" },
      { key: "city", label: "City", type: "text", required: false, placeholder: "Mumbai" },
      { key: "state", label: "State", type: "text", required: false, placeholder: "Maharashtra" },
    ],
  },

  preferences: {
    defaults: {
      currency: "INR",
      taxRate: 18,
      unitSystem: "metric" as const,
      precision: 2,
      isStandardsDefault: "IS 456:2000",
      orgRole: "SUPER_ADMIN" as const,
    },
    fields: [
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
      { key: "taxRate", label: "Default Tax Rate (%)", type: "number", min: 0, max: 100, step: 0.1 },
      { key: "unitSystem", label: "Unit System", type: "select", options: UNIT_SYSTEMS },
      { key: "precision", label: "Decimal Precision", type: "select", options: [
        { value: 1, label: "0.0 (1 decimal)" },
        { value: 2, label: "0.00 (2 decimals)" },
        { value: 3, label: "0.000 (3 decimals)" },
      ]},
      { key: "isStandardsDefault", label: "Default IS Standard", type: "select", options: IS_STANDARDS_OPTIONS.map((s) => ({ value: s, label: s })) },
      { key: "orgRole", label: "Your Role", type: "select", options: ORG_ROLES },
    ],
  },

  signIn: {
    devModeLabel: "Dev session (API + DB)",
    passwordRequired: false,
  },
} as const;

export type SignInSetupStep = (typeof signInSetupConfig.steps)[number]["id"];

export type SignInSetupForm = {
  email: string;
  name: string;
  jobTitle: string;
  phone: string;
  orgName: string;
  registrationId: string;
  contactEmail: string;
  orgPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  taxRate: number;
  unitSystem: string;
  precision: number;
  isStandardsDefault: string;
  orgRole: string;
};

export function emptySignInSetupForm(email = ""): SignInSetupForm {
  const { user, organization, preferences } = signInSetupConfig;
  return {
    email,
    name: user.defaults.name,
    jobTitle: user.defaults.jobTitle,
    phone: user.defaults.phone,
    orgName: organization.defaults.name,
    registrationId: organization.defaults.registrationId,
    contactEmail: organization.defaults.contactEmail || email,
    orgPhone: organization.defaults.phone,
    address: organization.defaults.address,
    city: organization.defaults.city,
    state: organization.defaults.state,
    country: organization.defaults.country,
    currency: preferences.defaults.currency,
    taxRate: preferences.defaults.taxRate,
    unitSystem: preferences.defaults.unitSystem,
    precision: preferences.defaults.precision,
    isStandardsDefault: preferences.defaults.isStandardsDefault,
    orgRole: preferences.defaults.orgRole,
  };
}
