
import { supabase } from '@/lib/supabase';

export type ProfileCompletionResult =
  | { status: 'complete' }
  | { status: 'incomplete' }
  | { status: 'error'; message: string };

export async function checkProfileCompletion(
  userId: string
): Promise<ProfileCompletionResult> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }

  if (
    !data?.display_name?.trim() ||
    !data?.username?.trim()
  ) {
    return { status: 'incomplete' };
  }

  return { status: 'complete' };
}
