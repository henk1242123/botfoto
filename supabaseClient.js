import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://<jouw-project>.supabase.co',
  'public-anon-key-of-service-role-key-hier'
);
