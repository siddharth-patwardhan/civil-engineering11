import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AssistantResponse } from "@/domain/assistantSchema";
import type { MeasurementUnit } from "@/domain/schemas";
import type { MeasureRow } from "@/context/ProjectContext";
import { useProject } from "@/context/ProjectContext";
import { useActiveProjectId } from "@/features/project/useActiveProjectId";
import { projectPathOrLegacy } from "@/features/project/projectRoutes";
import { showToast } from "@/components/ToastProvider";
import { api } from "@/services/api";

export default function Assistant() {
  const navigate = useNavigate();
  const activeProjectId = useActiveProjectId();
  const { setMeasureRows } = useProject();
  const [naturalInput, setNaturalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await api.fetch<AssistantResponse>("/api/analyze-structure", {
        method: "POST",
        body: JSON.stringify({ description: naturalInput }),
      });
      setResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const addToMeasurementBook = (data: AssistantResponse) => {
    const elements = data.estimationImpact?.estimatedElements ?? [];
    const rows: MeasureRow[] = elements.map((el, i) => ({
      id: `asst-${Date.now()}-${i}`,
      desc: el,
      no: "1",
      l: "",
      w: "",
      h: "",
      ded: "",
      unit: "m³" as MeasurementUnit,
      templateKey: null,
    }));
    if (rows.length === 0) {
      rows.push({
        id: `asst-${Date.now()}`,
        desc: data.projectInterpretation?.identifiedStructure ?? "Assistant item",
        no: "1",
        l: "",
        w: "",
        h: "",
        ded: "",
        unit: "m³",
        templateKey: null,
      });
    }
    setMeasureRows(rows);
    showToast(`Added ${rows.length} row(s) to measurement book`, "success");
    navigate(projectPathOrLegacy(activeProjectId, "measurement"));
  };

  return (
    <div className="flex flex-col gap-stack-lg max-w-4xl mx-auto w-full pb-20">
      <div className="bg-surface-container border border-outline-variant rounded-xl p-stack-lg flex flex-col gap-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">smart_toy</span>
          IS 456:2000 Engineering Assistant
        </h2>

        <p className="font-body-md text-body-md text-on-surface-variant">
          Describe your structural requirement below. Ensure you include
          relevant details like usage, dimensions, soil type, and location
          (e.g., "10 by 10 bedroom west facing in black cotton soil G+2").
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-stack-sm mt-stack-md"
        >
          <textarea
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            className="w-full bg-surface border border-outline focus:border-primary rounded-lg p-margin-mobile font-body-lg text-body-lg text-on-surface resize-none min-h-[120px]"
            placeholder="E.g., 10 by 10 bedroom west facing in black cotton soil G+2"
          />
          <button
            type="submit"
            disabled={loading || !naturalInput.trim()}
            className="self-end bg-primary text-on-primary hover:bg-primary/90 px-6 py-3 rounded-full font-label-lg text-label-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">
                refresh
              </span>
            ) : (
              <span className="material-symbols-outlined">auto_awesome</span>
            )}
            Analyze Structure
          </button>
        </form>

        {error && (
          <div className="bg-error-container text-on-error-container p-stack-sm rounded-lg border border-error/50 flex items-start gap-2">
            <span className="material-symbols-outlined shrink-0">error</span>
            <span className="font-body-md text-body-md">{error}</span>
          </div>
        )}
      </div>

      {response && (
        <div className="flex flex-col gap-stack-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {response.warnings && response.warnings.length > 0 && (
            <div className="bg-error-container text-on-error-container border border-error/20 rounded-xl p-stack-md">
              <h3 className="font-title-md text-title-md flex items-center gap-2 mb-stack-sm">
                <span className="material-symbols-outlined">warning</span>{" "}
                Critical Warnings & Risks
              </h3>
              <ul className="list-disc pl-5 font-body-md text-body-md flex flex-col gap-1">
                {response.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            {response.projectInterpretation && (
              <div className="bg-surface border border-outline-variant rounded-xl p-stack-md shadow-sm">
                <h3 className="font-title-md text-title-md text-secondary flex items-center gap-2 mb-stack-sm pb-2 border-b border-surface-variant">
                  <span className="material-symbols-outlined">foundation</span>{" "}
                  Interpretation
                </h3>
                <div className="flex flex-col gap-2 font-body-md text-body-md">
                  <p>
                    <strong className="text-on-surface">Structure:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.projectInterpretation.identifiedStructure}
                    </span>
                  </p>
                  <p>
                    <strong className="text-on-surface">Usage:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.projectInterpretation.estimatedUsage}
                    </span>
                  </p>
                  <p>
                    <strong className="text-on-surface">Span Type:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.projectInterpretation.spanType}
                    </span>
                  </p>
                  <p>
                    <strong className="text-on-surface">Risk Level:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.projectInterpretation.structuralRisk}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {response.recommendations && (
              <div className="bg-surface border border-outline-variant rounded-xl p-stack-md shadow-sm">
                <h3 className="font-title-md text-title-md text-secondary flex items-center gap-2 mb-stack-sm pb-2 border-b border-surface-variant">
                  <span className="material-symbols-outlined">verified</span>{" "}
                  Engineering Recommendations
                </h3>
                <div className="flex flex-col gap-2 font-body-md text-body-md">
                  <p>
                    <strong className="text-on-surface">Concrete Grade:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.recommendations.concreteGrade}
                    </span>
                  </p>
                  <p>
                    <strong className="text-on-surface">Steel Grade:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.recommendations.reinforcementGrade}
                    </span>
                  </p>
                  <p>
                    <strong className="text-on-surface">Slab Thickness:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.recommendations.slabThickness}
                    </span>
                  </p>
                  <p>
                    <strong className="text-on-surface">Nominal Cover:</strong>{" "}
                    <span className="text-on-surface-variant">
                      {response.recommendations.nominalCover}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            {response.isClauses && response.isClauses.length > 0 && (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-md shadow-sm">
                <h3 className="font-title-md text-title-md text-primary flex items-center gap-2 mb-stack-sm pb-2 border-b border-surface-variant">
                  <span className="material-symbols-outlined">menu_book</span>{" "}
                  IS 456:2000 References
                </h3>
                <ul className="flex flex-col gap-2 font-body-md text-body-md">
                  {response.isClauses.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-on-surface w-20 shrink-0">
                        Cl {c.clause}
                      </span>
                      <span className="text-on-surface-variant">{c.topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {response.estimationImpact && (
              <div className="bg-tertiary-container text-on-tertiary-container border border-outline-variant rounded-xl p-stack-md shadow-sm">
                <div className="flex justify-between items-start mb-stack-sm pb-2 border-b border-tertiary/20">
                  <h3 className="font-title-md text-title-md flex items-center gap-2">
                    <span className="material-symbols-outlined">calculate</span> BOQ Impact
                  </h3>
                  <button
                    type="button"
                    onClick={() => addToMeasurementBook(response)}
                    className="text-sm px-3 py-1 rounded-full bg-primary text-on-primary hover:opacity-90"
                  >
                    Add to measurement book
                  </button>
                </div>
                <div className="flex flex-col gap-2 font-body-md text-body-md">
                  <p>
                    <strong>Concrete:</strong>{" "}
                    {response.estimationImpact.recommendedMaterials.concrete}
                  </p>
                  <p>
                    <strong>Steel:</strong>{" "}
                    {response.estimationImpact.recommendedMaterials.steel}
                  </p>
                  {response.estimationImpact.estimatedElements &&
                    response.estimationImpact.estimatedElements.length > 0 && (
                      <div className="mt-2">
                        <strong>Elements detected:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {response.estimationImpact.estimatedElements.map(
                            (el, i) => (
                              <span
                                key={i}
                                className="bg-surface/50 px-2 py-1 rounded text-sm"
                              >
                                {el}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {response.recommendations?.durabilityRecommendation && (
            <div className="bg-surface border border-outline-variant rounded-xl p-stack-md shadow-sm">
              <h3 className="font-title-md text-title-md text-secondary flex items-center gap-2 mb-stack-sm pb-2 border-b border-surface-variant">
                <span className="material-symbols-outlined">
                  health_and_safety
                </span>{" "}
                Durability & Exposure
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 whitespace-pre-wrap">
                {response.recommendations.durabilityRecommendation}
              </p>
              {response.recommendations.exposureConditionGuidance && (
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 whitespace-pre-wrap">
                  {response.recommendations.exposureConditionGuidance}
                </p>
              )}
            </div>
          )}

          {response.recommendations?.disclaimer && (
            <div className="bg-surface-variant text-on-surface-variant rounded-xl p-stack-sm text-sm flex gap-2 items-start mt-4">
              <span className="material-symbols-outlined text-outline">
                info
              </span>
              <p className="font-body-md text-body-md max-w-[800px]">
                {response.recommendations.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
