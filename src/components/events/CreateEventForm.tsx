import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, queryKeys } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  startAt: z.string().min(1, 'Start time is required'),
  endAt: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.string().optional(),
  capacity: z.string().optional()
});

type EventFormValues = z.infer<typeof eventSchema>;

interface CreateEventFormProps {
  interestFilter: string | null;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({ interestFilter }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EventFormValues>({
    defaultValues: {
      title: '',
      startAt: '',
      endAt: '',
      description: '',
      location: '',
      tags: interestFilter ?? '',
      capacity: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: (values: EventFormValues) => {
      if (!user?.id) {
        return Promise.reject(new Error('Sign in required'));
      }
      const parsed = eventSchema.safeParse(values);
      if (!parsed.success) {
        return Promise.reject(parsed.error);
      }

      const tags = parsed.data.tags
        ? parsed.data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const capacity = parsed.data.capacity ? Number(parsed.data.capacity) : undefined;

      return api.createEvent({
        creatorId: user.id,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || undefined,
        startAt: new Date(parsed.data.startAt).toISOString(),
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt).toISOString() : undefined,
        location: parsed.data.location?.trim() || undefined,
        tags,
        capacity: Number.isFinite(capacity) ? capacity : undefined
      });
    },
    onSuccess: (result) => {
      toast('Event created successfully', 'success');
      reset();
      const filters = {
        interest: interestFilter ?? undefined,
        startAfter: undefined,
        attending: undefined,
        userId: user?.id ?? undefined
      };
      queryClient.invalidateQueries({ queryKey: queryKeys.events(filters) });
    },
    onError: (error: any) => {
      toast(error?.message ?? 'Unable to create event right now.', 'error');
    }
  });

  const onSubmit = handleSubmit((values) => createMutation.mutate(values));

  const disableSubmit = useMemo(() => !user?.id || isSubmitting, [user?.id, isSubmitting]);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Title"
        placeholder="Full Moon Kirtan"
        {...register('title')}
        error={errors.title?.message}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Start"
          type="datetime-local"
          {...register('startAt')}
          error={errors.startAt?.message}
        />
        <Input
          label="End"
          type="datetime-local"
          {...register('endAt')}
          error={errors.endAt?.message}
        />
      </div>
      <Input
        label="Location"
        placeholder="Community Hall, Bengaluru"
        {...register('location')}
        error={errors.location?.message}
      />
      <label className="flex flex-col gap-1 text-sm font-medium text-sand-700">
        Description
        <textarea
          rows={3}
          placeholder="Share key highlights, facilitator, or schedule details"
          {...register('description')}
          className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-sand-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {errors.description?.message && (
          <span className="text-xs text-red-600">{errors.description.message}</span>
        )}
      </label>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <div className="space-y-1">
          <Input
            label="Tags"
            placeholder="bhakti, seva"
            {...register('tags')}
            error={errors.tags?.message}
          />
          <p className="text-xs text-sand-500">Comma separated</p>
        </div>
        <Input
          label="Capacity"
          type="number"
          min={1}
          placeholder="100"
          {...register('capacity')}
          error={errors.capacity?.message}
        />
      </div>
      <Button type="submit" loading={createMutation.isPending} disabled={disableSubmit} className="w-full sm:w-auto">
        Create Event
      </Button>
    </form>
  );
};
