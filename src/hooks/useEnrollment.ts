import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Enrollment {
  registrationId: string;
  regCode: string;
  courseId: number;
  courseTitle: string;
  courseIcon: string;
  courseColor: string;
  batchTime: string;
}

interface Result {
  loading: boolean;
  enrollment: Enrollment | null;  // null = not enrolled
}

export function useEnrollment(): Result {
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    if (!user || user.role === 'admin') { setLoading(false); return; }

    supabase
      .from('registrations')
      .select('id, registration_id, courses(id, title, icon, color), batches(time_slot)')
      .eq('user_id', user.id)
      .eq('access_granted', true)
      .limit(1)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data) {
          setEnrollment({
            registrationId: data.id,
            regCode:        data.registration_id,
            courseId:       data.courses?.id    ?? 0,
            courseTitle:    data.courses?.title ?? '',
            courseIcon:     data.courses?.icon  ?? '🎓',
            courseColor:    data.courses?.color ?? 'var(--forest)',
            batchTime:      data.batches?.time_slot ?? '',
          });
        }
        setLoading(false);
      });
  }, [user]);

  return { loading, enrollment };
}
