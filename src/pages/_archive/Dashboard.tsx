import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col gap-stack-sm">
        <h2 className="font-headline-lg text-headline-lg text-on-background">Executive Overview</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Real-time estimations and cost tracking for active sites.</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface border border-outline-variant border-l-4 border-l-outline rounded-lg p-stack-md flex flex-col justify-between gap-stack-lg min-h-[120px]">
          <div className="flex justify-between items-start w-full">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Total Projects</span>
            <span className="material-symbols-outlined text-outline">architecture</span>
          </div>
          <div className="flex justify-between items-end w-full">
            <span className="font-display-metrics text-display-metrics text-on-surface">142</span>
            <span className="font-label-caps text-label-caps text-on-primary-container bg-surface-container-high px-2 py-1 rounded">+3 This Month</span>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant border-l-4 border-l-primary rounded-lg p-stack-md flex flex-col justify-between gap-stack-lg min-h-[120px]">
          <div className="flex justify-between items-start w-full">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Active Estimates</span>
            <span className="material-symbols-outlined text-primary">analytics</span>
          </div>
          <div className="flex justify-between items-end w-full">
            <span className="font-display-metrics text-display-metrics text-primary">28</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">In Progress</span>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant border-l-4 border-l-outline rounded-lg p-stack-md flex flex-col justify-between gap-stack-lg min-h-[120px]">
          <div className="flex justify-between items-start w-full">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Pending Quotations</span>
            <span className="material-symbols-outlined text-outline">inventory_2</span>
          </div>
          <div className="flex justify-between items-end w-full">
            <span className="font-display-metrics text-display-metrics text-on-surface">$4.2M</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-2 py-1 rounded">Under Review</span>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant border-l-4 border-l-outline rounded-lg p-stack-md flex flex-col justify-between gap-stack-lg min-h-[120px]">
          <div className="flex justify-between items-start w-full">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Budget Variance</span>
            <span className="material-symbols-outlined text-outline">payments</span>
          </div>
          <div className="flex justify-between items-end w-full">
            <span className="font-display-metrics text-display-metrics text-on-surface">-1.4%</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">Avg across sites</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-stack-md mt-stack-md mb-[80px] md:mb-0">
        <h3 className="font-headline-md text-headline-md text-on-surface">Recently Opened Projects</h3>
        <div className="bg-surface border border-outline-variant rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface border-b border-outline-variant">
              <tr>
                <th className="p-stack-md font-label-caps text-label-caps text-on-surface-variant">Project ID</th>
                <th className="p-stack-md font-label-caps text-label-caps text-on-surface-variant">Client Name</th>
                <th className="p-stack-md font-label-caps text-label-caps text-on-surface-variant">Phase</th>
                <th className="p-stack-md font-label-caps text-label-caps text-on-surface-variant">Last Updated</th>
                <th className="p-stack-md font-label-caps text-label-caps text-on-surface-variant text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-table-data text-table-data text-on-surface">
              <tr className="border-b border-outline-variant bg-surface hover:bg-surface-container-lowest transition-colors">
                <td className="p-stack-md">CE-2024-89</td>
                <td className="p-stack-md">Apex Development Group</td>
                <td className="p-stack-md"><span className="bg-secondary-container text-on-secondary-container font-label-caps text-label-caps px-3 py-1 rounded-full">Costing</span></td>
                <td className="p-stack-md text-on-surface-variant">2 hours ago</td>
                <td className="p-stack-md text-right"><button onClick={() => navigate('/measurement')} className="text-primary hover:text-on-primary-container font-label-caps text-label-caps">View</button></td>
              </tr>
              <tr className="border-b border-outline-variant bg-surface hover:bg-surface-container-lowest transition-colors">
                <td className="p-stack-md">CE-2024-91</td>
                <td className="p-stack-md">Metropolis Infrastructure</td>
                <td className="p-stack-md"><span className="bg-surface-container-highest text-on-surface font-label-caps text-label-caps px-3 py-1 rounded-full">Draft</span></td>
                <td className="p-stack-md text-on-surface-variant">Yesterday</td>
                <td className="p-stack-md text-right"><button onClick={() => navigate('/measurement')} className="text-primary hover:text-on-primary-container font-label-caps text-label-caps">View</button></td>
              </tr>
              <tr className="border-b border-outline-variant bg-surface hover:bg-surface-container-lowest transition-colors">
                <td className="p-stack-md">CE-2024-76</td>
                <td className="p-stack-md">Summit Logistics</td>
                <td className="p-stack-md"><span className="bg-error-container text-on-error-container font-label-caps text-label-caps px-3 py-1 rounded-full">Review Required</span></td>
                <td className="p-stack-md text-on-surface-variant">Oct 24, 2024</td>
                <td className="p-stack-md text-right"><button onClick={() => navigate('/measurement')} className="text-primary hover:text-on-primary-container font-label-caps text-label-caps">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <button onClick={() => navigate('/create-project')} className="fixed bottom-[calc(48px+16px+24px)] md:bottom-stack-lg right-margin-mobile md:right-stack-lg z-[60] bg-secondary text-on-secondary h-touch-target-min px-stack-lg rounded-full flex items-center justify-center gap-base shadow-[0px_4px_12px_rgba(0,0,0,0.08)] hover:bg-[#3b39c6] active:scale-95 transition-all duration-200">
        <span className="material-symbols-outlined fill">add</span>
        <span className="font-label-caps text-label-caps tracking-wide">New Estimate</span>
      </button>
    </>
  );
}
