import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";

type NotifRow = { id: string; title: string; body: string; read: boolean; createdAt: string };

export default function Notifications() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.fetch<{ notifications: NotifRow[] }>("/api/notifications"),
    enabled: isAuthenticated,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api.fetch(`/api/notifications/${id}/read`, { method: "PATCH", body: "{}" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const rows = data?.notifications ?? [];
      for (const n of rows) {
        if (!n.read) {
          await api.fetch(`/api/notifications/${n.id}/read`, { method: "PATCH", body: "{}" });
        }
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="flex flex-col gap-stack-lg max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center border-b border-outline-variant pb-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">AI Insights & Alerts</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
            Smart warnings and recommendations for active estimates.
          </p>
        </div>
        <button
          type="button"
          className="text-secondary hover:underline font-label-caps text-label-caps disabled:opacity-50"
          disabled={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Mark All as Read
        </button>
      </div>

      {isLoading && (
        <p className="text-text-secondary">Loading notifications...</p>
      )}

      {isError && (
        <p className="text-error text-sm">
          Could not load notifications. {String((error as Error)?.message ?? "")}
        </p>
      )}

      <div className="flex flex-col gap-stack-md">
        {(data?.notifications ?? []).map((n) => (
          <div
            key={n.id}
            className={`bg-surface border border-outline-variant rounded-xl p-stack-lg flex gap-4 border-l-4 ${
              n.read ? "border-l-outline" : "border-l-primary"
            }`}
          >
            <span className="material-symbols-outlined text-primary text-[28px] mt-1">notifications</span>
            <div className="flex flex-col flex-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                {n.read ? "Read" : "Unread"}
              </span>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{n.title}</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">{n.body}</p>
              {!n.read && (
                <button
                  type="button"
                  className="mt-4 font-table-data text-secondary hover:underline text-left"
                  onClick={() => markRead.mutate(n.id)}
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg flex gap-4 border-l-4 border-l-error">
          <span className="material-symbols-outlined text-error text-[28px] mt-1">warning</span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-error mb-1">High Quantity Discrepancy</span>
            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">
              Unusually High Rebar Quantity Detected
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              In Project <strong>Downtown Core Plaza</strong>, the ratio of Reinforcement Steel (45 tonnes) to
              Concrete (320 m³) exceeds typical thresholds (approx 140 kg/m³ vs normal 100 kg/m³). Please review
              structural specifications.
            </p>
            <div className="mt-4 flex gap-4">
              <button onClick={() => navigate("/boq")} className="font-table-data text-secondary hover:underline">
                Review BOQ
              </button>
              <button type="button" className="font-table-data text-on-surface-variant hover:text-on-surface">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg flex gap-4 border-l-4 border-l-secondary">
          <span className="material-symbols-outlined text-secondary text-[28px] mt-1">tips_and_updates</span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-secondary mb-1">Omission Detection</span>
            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Missing Curing Compound</h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              You have estimated 320 m³ of Concrete in <strong>Bridge Expansion Ph 2</strong>, but no Curing
              Compound or Water curing labour has been allocated. Cost might be underestimated.
            </p>
            <div className="mt-4 flex gap-4">
              <button type="button" className="font-table-data text-secondary hover:underline">
                Add Curing Item
              </button>
              <button type="button" className="font-table-data text-on-surface-variant hover:text-on-surface">
                Ignore for this project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
