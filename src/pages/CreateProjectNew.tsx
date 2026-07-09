import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useProject } from "../context/ProjectContext";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { projectPath } from "@/features/project/projectRoutes";
import { showToast } from "@/components/ToastProvider";

export default function CreateProjectNew() {
  const navigate = useNavigate();
  const { setMeasureRows } = useProject();
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await api.fetch<{ project: { id: string } }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          clientName: clientName.trim() || undefined,
          location: location.trim() || undefined,
          structureType: category || undefined,
        }),
      });
      showToast("Project created successfully", "success");
      setActiveProjectId(res.project.id);
      setMeasureRows([{ id: "1", desc: "", no: "", l: "", w: "", h: "", ded: "", unit: "m³" }]);
      navigate(projectPath(res.project.id, "measurement"));
    } catch (err) {
      showToast(String(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-h1 text-h1 text-text-primary">Create New Project</h1>
        <p className="font-body text-body text-text-secondary mt-1">
          Enter project details to generate an estimation baseline
        </p>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-default">
          <span className="material-symbols-outlined text-accent-primary text-[24px]">domain</span>
          <h2 className="font-h2 text-h2 text-text-primary">Project Fundamentals</h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-label text-text-secondary">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Core Plaza"
              required
              className="w-full h-9 px-3 bg-bg-input border border-border-default rounded-lg text-text-primary font-body text-body focus:border-accent-primary focus:ring-0 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label text-label text-text-secondary">Client Organization</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Corp"
                className="w-full h-9 px-3 bg-bg-input border border-border-default rounded-lg text-text-primary font-body text-body focus:border-accent-primary focus:ring-0 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label text-label text-text-secondary">Project Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 bg-bg-input border border-border-default rounded-lg text-text-primary font-body text-body focus:border-accent-primary focus:ring-0 outline-none transition-all"
              >
                <option value="">Select Category</option>
                <option value="commercial">Commercial Building</option>
                <option value="residential">Residential Complex</option>
                <option value="infrastructure">Public Infrastructure</option>
                <option value="industrial">Industrial Facility</option>
                <option value="road">Road & Highway</option>
                <option value="bridge">Bridge & Culvert</option>
                <option value="irrigation">Irrigation</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label text-label text-text-secondary">Site Location</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">location_on</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sector 4, Metropolitan Area"
                className="w-full h-9 px-3 pl-10 bg-bg-input border border-border-default rounded-lg text-text-primary font-body text-body focus:border-accent-primary focus:ring-0 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default mt-2">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="h-9 px-4 border border-border-default text-text-primary font-table text-table rounded-lg hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 bg-accent-primary text-white font-table text-table rounded-lg hover:bg-accent-primary-dim transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
              {loading ? "Creating..." : "Next: Measurement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
