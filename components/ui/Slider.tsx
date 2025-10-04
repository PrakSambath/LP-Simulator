import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // No extra props needed for now, but can be extended.
}

const Slider: React.FC<SliderProps> = ({ className = '', ...props }) => {
  return (
    <input
      type="range"
      className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-4
        [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:bg-cyan-400
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:cursor-pointer
        [&::-webkit-slider-thumb]:transition-colors
        [&::-webkit-slider-thumb]:hover:bg-cyan-300
        
        [&::-moz-range-thumb]:w-4
        [&::-moz-range-thumb]:h-4
        [&::-moz-range-thumb]:bg-cyan-400
        [&::-moz-range-thumb]:rounded-full
        [&::-moz-range-thumb]:cursor-pointer
        [&::-moz-range-thumb]:border-none
        [&::-moz-range-thumb]:transition-colors
        [&::-moz-range-thumb]:hover:bg-cyan-300
        
        ${className}`}
      {...props}
    />
  );
};

export default Slider;
