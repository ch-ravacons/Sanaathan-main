import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  description,
}) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
            checked
              ? 'bg-orange-600 border-orange-600'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => onChange(!checked)}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
      <div className="flex-1 cursor-pointer" onClick={() => onChange(!checked)}>
        <label className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
};