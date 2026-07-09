import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { api } from "@/services/api";
import {
  signInSetupConfig,
  emptySignInSetupForm,
  type SignInSetupForm,
  type SignInSetupStep,
  COUNTRIES,
  CURRENCIES,
  UNIT_SYSTEMS,
  IS_STANDARDS_OPTIONS,
  ORG_ROLES,
} from "@/config/signInSetup";

export default function SignInSetup() {
  const navigate = useNavigate();
  const { session, refresh, isAuthenticated } = useAuth();
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);

  const [step, setStep] = useState<SignInSetupStep>("user");
  const [form, setForm] = useState<SignInSetupForm>(() =>
    emptySignInSetupForm(session?.user.email ?? ""),
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        email: session.user.email,
        name: session.user.name ?? prev.name,
        jobTitle: session.user.jobTitle ?? prev.jobTitle,
        phone: session.user.phone ?? prev.phone,
        contactEmail: session.organization?.contactEmail ?? session.user.email,
        orgName: session.organization?.name && session.organization.name !== "Demo Organization"
          ? session.organization.name
          : prev.orgName,
        registrationId: session.organization?.registrationId ?? prev.registrationId,
        orgPhone: session.organization?.phone ?? prev.orgPhone,
        address: session.organization?.address ?? prev.address,
        city: session.organization?.city ?? prev.city,
        state: session.organization?.state ?? prev.state,
        country: session.organization?.country ?? prev.country,
        currency: session.organization?.currency ?? prev.currency,
        taxRate: session.organization?.taxRate ?? prev.taxRate,
        unitSystem: session.organization?.unitSystem ?? prev.unitSystem,
        precision: session.organization?.precision ?? prev.precision,
        isStandardsDefault: session.organization?.isStandardsDefault ?? prev.isStandardsDefault,
      }));
    }
  }, [isAuthenticated, session, navigate]);

  const stepIndex = signInSetupConfig.steps.findIndex((s) => s.id === step);
  const isLast = stepIndex === signInSetupConfig.steps.length - 1;

  const patch = (key: keyof SignInSetupForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === "user" && !form.name.trim()) {
      setErr("Full name is required");
      return;
    }
    if (step === "organization" && (!form.orgName.trim() || !form.contactEmail.trim())) {
      setErr("Company name and contact email are required");
      return;
    }
    setErr(null);
    if (!isLast) {
      setStep(signInSetupConfig.steps[stepIndex + 1].id);
      return;
    }
    void handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const result = await api.completeSetup({
        name: form.name,
        jobTitle: form.jobTitle,
        phone: form.phone || undefined,
        orgName: form.orgName,
        registrationId: form.registrationId || undefined,
        contactEmail: form.contactEmail,
        orgPhone: form.orgPhone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country,
        currency: form.currency,
        taxRate: form.taxRate,
        unitSystem: form.unitSystem,
        precision: form.precision,
        isStandardsDefault: form.isStandardsDefault,
        orgRole: form.orgRole,
      });
      await refresh();
      if (result.defaultProjectId) setActiveProjectId(result.defaultProjectId);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center py-stack-lg px-margin-mobile">
      <div className="w-full max-w-2xl">
        <div className="mb-stack-lg text-center">
          <span className="material-symbols-outlined text-primary text-[40px] mb-stack-sm">settings_account_box</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Account Setup</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
            Configure your profile, company, and estimation preferences.
          </p>
        </div>

        <div className="flex gap-base mb-stack-lg justify-center">
          {signInSetupConfig.steps.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                i === stepIndex
                  ? "bg-primary text-on-primary"
                  : i < stepIndex
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              {s.title}
            </div>
          ))}
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm">
          {step === "user" && (
            <div className="flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Your Profile</h2>
              <Field label="Email" value={form.email} readOnly />
              {signInSetupConfig.user.fields.map((f) => (
                <div key={f.key}>
                  <Field
                    label={f.label}
                    value={String(form[f.key as keyof SignInSetupForm] ?? "")}
                    placeholder={f.placeholder}
                    type={f.type}
                    onChange={(v) => patch(f.key as keyof SignInSetupForm, v)}
                  />
                </div>
              ))}
            </div>
          )}

          {step === "organization" && (
            <div className="flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Company Details</h2>
              {signInSetupConfig.organization.fields.map((f) => {
                const key = f.key === "phone" ? "orgPhone" : f.key === "name" ? "orgName" : (f.key as keyof SignInSetupForm);
                return (
                  <div key={f.key}>
                    <Field
                      label={f.label}
                      value={String(form[key] ?? "")}
                      placeholder={f.placeholder}
                      type={f.type}
                      onChange={(v) => patch(key, v)}
                    />
                  </div>
                );
              })}
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => patch("country", e.target.value)}
                  className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === "preferences" && (
            <div className="flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Estimation Preferences</h2>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => patch("currency", e.target.value)}
                  className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <Field
                label="Default Tax Rate (%)"
                type="number"
                value={String(form.taxRate)}
                onChange={(v) => patch("taxRate", Number(v))}
              />
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Unit System</label>
                <select
                  value={form.unitSystem}
                  onChange={(e) => patch("unitSystem", e.target.value)}
                  className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest"
                >
                  {UNIT_SYSTEMS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Decimal Precision</label>
                <select
                  value={form.precision}
                  onChange={(e) => patch("precision", Number(e.target.value))}
                  className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest"
                >
                  <option value={1}>0.0 (1 decimal)</option>
                  <option value={2}>0.00 (2 decimals)</option>
                  <option value={3}>0.000 (3 decimals)</option>
                </select>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Default IS Standard</label>
                <select
                  value={form.isStandardsDefault}
                  onChange={(e) => patch("isStandardsDefault", e.target.value)}
                  className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest"
                >
                  {IS_STANDARDS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Your Role</label>
                <select
                  value={form.orgRole}
                  onChange={(e) => patch("orgRole", e.target.value)}
                  className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest"
                >
                  {ORG_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {err && <p className="text-error text-sm mt-stack-md">{err}</p>}

          <div className="flex justify-between mt-stack-lg pt-stack-md border-t border-outline-variant">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStep(signInSetupConfig.steps[stepIndex - 1].id)}
              className="h-touch-target-min px-4 rounded border border-outline text-on-surface disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleNext()}
              className="h-touch-target-min px-6 rounded bg-primary text-on-primary disabled:opacity-50"
            >
              {loading ? "Saving..." : isLast ? "Complete Setup" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:border-2 focus:outline-none disabled:opacity-70"
      />
    </div>
  );
}
