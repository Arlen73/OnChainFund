
import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, id }) => {
  return (
    <label className="relative inline-block w-[44px] h-[24px]">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="opacity-0 w-0 h-0"
      />
      <span
        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-3xl transition-colors duration-400 ${
          checked ? 'bg-emerald-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute content-[''] h-[20px] w-[20px] left-[2px] bottom-[2px] bg-white rounded-full transition-transform duration-400 ${
            checked ? 'transform translate-x-[20px]' : ''
          }`}
        ></span>
      </span>
    </label>
  );
};

export default Switch;
