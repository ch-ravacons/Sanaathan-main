import React, { useEffect } from 'react';
import { X } from 'lucide-react';

import { CreateEventForm } from './CreateEventForm';
import { Button } from '../ui/Button';

interface CreateEventModalProps {
  interestFilter: string | null;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ interestFilter, onClose }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-sand-900/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Create gathering</p>
            <h2 className="mt-1 text-2xl font-semibold text-sand-900">Host a new spiritual event</h2>
            <p className="mt-2 text-sm text-sand-600">
              Share satsangs, retreats, yajnas, or seva opportunities with the community.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6">
          <CreateEventForm interestFilter={interestFilter} onSuccess={() => onClose()} />
        </div>
      </div>
    </div>
  );
};
