import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export default function CreateProject() {
  const navigate = useNavigate();

  const { setMeasureRows } = useProject();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMeasureRows([{ id: '1', desc: '', no: '', l: '', w: '', h: '', unit: 'm³' }]);
    navigate('/measurement');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Create New Project</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Enter initial phase details to generate an estimation baseline.</p>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary">domain</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">Project Fundamentals</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-stack-lg">
          <div className="flex flex-col gap-1">
            <label className="text-on-surface-variant font-label-caps text-label-caps">Project Name</label>
            <input type="text" placeholder="e.g. Downtown Core Plaza" required className="w-full h-touch-target-min px-4 bg-surface-container-lowest border border-outline rounded-lg text-on-surface focus:outline-none focus:border-2 focus:border-primary transition-all duration-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="flex flex-col gap-1">
              <label className="text-on-surface-variant font-label-caps text-label-caps">Client Organization</label>
              <input type="text" placeholder="e.g. Apex Corp" required className="w-full h-touch-target-min px-4 bg-surface-container-lowest border border-outline rounded-lg text-on-surface focus:outline-none focus:border-2 focus:border-primary transition-all duration-200" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-on-surface-variant font-label-caps text-label-caps">Project Category</label>
              <select required defaultValue="" className="w-full h-touch-target-min px-4 bg-surface-container-lowest border border-outline rounded-lg text-on-surface focus:outline-none focus:border-2 focus:border-primary transition-all duration-200">
                <option value="" disabled>Select Category</option>
                <option value="commercial">Commercial Building</option>
                <option value="residential">Residential Complex</option>
                <option value="infrastructure">Public Infrastructure</option>
                <option value="industrial">Industrial Facility</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-on-surface-variant font-label-caps text-label-caps">Site Location</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">location_on</span>
              <input type="text" placeholder="e.g. Sector 4, Metropolitan Area" required className="w-full h-touch-target-min px-4 pl-10 bg-surface-container-lowest border border-outline rounded-lg text-on-surface focus:outline-none focus:border-2 focus:border-primary transition-all duration-200" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-outline-variant mt-8">
            <button type="button" onClick={() => navigate('/projects')} className="h-touch-target-min px-6 border border-outline text-on-surface font-label-caps text-label-caps rounded-lg hover:bg-surface-container-high transition-colors active:scale-95">
              Cancel
            </button>
            <button type="submit" className="h-touch-target-min px-6 bg-secondary text-on-secondary font-label-caps text-label-caps rounded-lg hover:bg-[#3b39c6] transition-colors shadow-md active:scale-95 flex items-center gap-2">
              Next Phase: Measurement
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
