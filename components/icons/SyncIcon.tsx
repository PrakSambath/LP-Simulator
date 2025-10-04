
import React from 'react';

const SyncIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-4.5a.75.75 0 00-.75.75v4.5l1.903-1.903a.75.75 0 00-1.06-1.06l-1.903 1.903a7.5 7.5 0 01-12.548 3.364.75.75 0 00-1.06-1.06l-1.903 1.903a.75.75 0 001.06 1.06l1.903-1.903zm14.495 3.891a.75.75 0 00-1.06-1.06l-1.903 1.903a7.5 7.5 0 01-12.548-3.364l-1.903-1.903h4.5a.75.75 0 00.75-.75v-4.5l-1.903 1.903a.75.75 0 101.06 1.06l1.903-1.903a7.5 7.5 0 0112.548 3.364.75.75 0 001.06 1.06l1.903-1.903a.75.75 0 10-1.06-1.06l-1.903 1.903z"
      clipRule="evenodd"
    />
  </svg>
);

export default SyncIcon;