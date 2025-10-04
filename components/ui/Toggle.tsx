import React from 'react';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  id?: string;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, label, id }) => {
  const toggleId = id || label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex items-center">
      <label htmlFor={toggleId} className="sr-only">
        {label}
      </label>
      <button
        type="button"
        id={toggleId}
        className={`${
          enabled ? 'bg-cyan-500' : 'bg-slate-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};

export default Toggle;