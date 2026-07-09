import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { CURRENCIES, UNIT_SYSTEMS, IS_STANDARDS_OPTIONS } from "@/config/signInSetup";
import { showToast } from "@/components/ToastProvider";

export default function Settings() {
  const { isAuthenticated, organization } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: () => api.getOrganization(),
    enabled: isAuthenticated,
  });

  const org = data?.organization ?? organization;

  const [companyName, setCompanyName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxRate, setTaxRate] = useState(18);
  const [currency, setCurrency] = useState("INR");
  const [unitSystem, setUnitSystem] = useState("metric");
  const [precision, setPrecision] = useState(2);
  const [isStandardsDefault, setIsStandardsDefault] = useState("IS 456:2000");

  useEffect(() => {
    if (!org) return;
    setCompanyName(org.name);
    setRegistrationId(org.registrationId ?? "");
    setContactEmail(org.contactEmail ?? "");
    setPhone(org.phone ?? "");
    setTaxRate(org.taxRate);
    setCurrency(org.currency);
    setUnitSystem(org.unitSystem);
    setPrecision(org.precision);
    setIsStandardsDefault(org.isStandardsDefault ?? "IS 456:2000");
  }, [org]);

  const saveCompany = useMutation({
    mutationFn: () =>
      api.updateOrganization({
        orgName: companyName,
        registrationId: registrationId || undefined,
        contactEmail,
        orgPhone: phone || undefined,
        taxRate,
        currency,
        unitSystem,
        precision,
        isStandardsDefault,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["organization"] });
      void qc.invalidateQueries({ queryKey: ["auth", "session"] });
      showToast("Company settings saved", "success");
    },
    onError: (e) => showToast(String(e), "error"),
  });

  if (isLoading && !org) {
    return <p className="text-on-surface-variant">Loading settings...</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">

        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">domain</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Company Profile</h2>
            </div>

            <div className="flex flex-col gap-stack-md">
                <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Registration / GST ID</label>
                    <input
                      type="text"
                      value={registrationId}
                      onChange={(e) => setRegistrationId(e.target.value)}
                      className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Primary Contact</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all"
                    />
                </div>

                <button
                  type="button"
                  disabled={saveCompany.isPending}
                  onClick={() => saveCompany.mutate()}
                  className="h-touch-target-min w-full bg-secondary text-on-secondary font-table-data text-table-data rounded hover:bg-on-secondary-fixed-variant transition-colors active:scale-[0.98] disabled:opacity-50"
                >
                    {saveCompany.isPending ? "Saving..." : "Save Company Details"}
                </button>
            </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">account_balance</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Financial Preferences</h2>
            </div>

            <div className="flex flex-col gap-stack-md">
                <div className="flex items-center justify-between border-b border-outline-variant pb-stack-md">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Default Tax Rate (GST/VAT)</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Applied automatically to new estimates</span>
                    </div>
                    <div className="relative w-32">
                        <input
                          type="number"
                          step="0.1"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="w-full h-touch-target-min pl-gutter pr-8 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none text-right transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body-md text-body-md text-on-surface-variant">%</span>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b border-outline-variant pb-stack-md">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Currency</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Display preference for reports</span>
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all"
                    >
                        {CURRENCIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <button
                  type="button"
                  disabled={saveCompany.isPending}
                  onClick={() => saveCompany.mutate()}
                  className="h-touch-target-min w-full border border-outline text-on-surface font-table-data rounded hover:bg-surface-container-lowest disabled:opacity-50"
                >
                  Save Financial Preferences
                </button>
            </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">straighten</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Unit Preferences</h2>
            </div>

            <div className="flex flex-col gap-stack-md">
                <div className="flex items-center justify-between p-stack-sm rounded hover:bg-surface-container-lowest transition-colors">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">System of Measurement</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Affects volume, length, and weight inputs</span>
                    </div>
                    <select
                      value={unitSystem}
                      onChange={(e) => setUnitSystem(e.target.value)}
                      className="h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest"
                    >
                      {UNIT_SYSTEMS.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                </div>

                <div className="flex items-center justify-between p-stack-sm rounded hover:bg-surface-container-lowest transition-colors">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Precision Level</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Decimal places for calculations</span>
                    </div>
                    <select
                      value={precision}
                      onChange={(e) => setPrecision(Number(e.target.value))}
                      className="h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest"
                    >
                        <option value={1}>0.0 (1 decimal)</option>
                        <option value={2}>0.00 (2 decimals)</option>
                        <option value={3}>0.000 (3 decimals)</option>
                    </select>
                </div>

                <div className="flex items-center justify-between p-stack-sm rounded">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Default IS Standard</span>
                    </div>
                    <select
                      value={isStandardsDefault}
                      onChange={(e) => setIsStandardsDefault(e.target.value)}
                      className="h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest max-w-[200px]"
                    >
                      {IS_STANDARDS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                </div>
            </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">tune</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">System Options</h2>
            </div>

            <div className="flex flex-col gap-stack-md">
                <p className="font-body-md text-on-surface-variant">
                  Organization setup {org?.setupComplete ? "completed" : "pending"}. Edit company and financial preferences above.
                </p>
            </div>
        </section>
      </div>
    </>
  );
}
