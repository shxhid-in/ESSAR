import type { ReactNode } from 'react';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface TabPanelProps {
  active: boolean;
  children: ReactNode;
}

export function TabPanel({ active, children }: TabPanelProps) {
  return active ? <div className="py-4">{children}</div> : null;
}