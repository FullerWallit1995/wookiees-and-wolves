import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL');

    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY');

    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      throw new Error(
        'Missing Supabase environment variables'
      );
    }

    const authHeader =
      req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    /*
     * Create a normal client using the caller's
     * Authorization header.
     *
     * We use this only to determine which authenticated
     * user is actually making the request.
     */
    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid authentication',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const userId = user.id;

    /*
     * Privileged server-side client.
     *
     * This key never goes into the mobile app.
     */
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
     * 1. Delete avatar files.
     *
     * We currently use:
     * {user_id}/avatar.jpg
     *
     * Listing the folder first also makes this safer
     * if we add additional avatar files later.
     */
    const {
      data: avatarFiles,
      error: avatarListError,
    } = await adminClient.storage
      .from('avatars')
      .list(userId);

    if (avatarListError) {
      throw new Error(
        `Could not inspect avatar data: ${avatarListError.message}`
      );
    }

    if (
      avatarFiles &&
      avatarFiles.length > 0
    ) {
      const avatarPaths = avatarFiles.map(
        (file) => `${userId}/${file.name}`
      );

      const { error: avatarDeleteError } =
        await adminClient.storage
          .from('avatars')
          .remove(avatarPaths);

      if (avatarDeleteError) {
        throw new Error(
          `Could not delete avatar data: ${avatarDeleteError.message}`
        );
      }
    }

    /*
     * 2. Delete poll votes.
     */
    const { error: pollVotesError } =
      await adminClient
        .from('poll_votes')
        .delete()
        .eq('user_id', userId);

    if (pollVotesError) {
      throw new Error(
        `Could not delete poll votes: ${pollVotesError.message}`
      );
    }

    /*
     * 3. Delete post likes.
     */
    const { error: postLikesError } =
      await adminClient
        .from('post_likes')
        .delete()
        .eq('user_id', userId);

    if (postLikesError) {
      throw new Error(
        `Could not delete post likes: ${postLikesError.message}`
      );
    }

    /*
     * 4. Delete Predictor data.
     */
    const { error: predictionsError } =
      await adminClient
        .from('predictor_predictions')
        .delete()
        .eq('user_id', userId);

    if (predictionsError) {
      throw new Error(
        `Could not delete Predictor data: ${predictionsError.message}`
      );
    }
    /*
 * 5. Delete Archives rankings.
 */
const { error: archivesError } =
  await adminClient
    .from('archive_rankings')
    .delete()
    .eq('user_id', userId);

if (archivesError) {
  throw new Error(
    `Could not delete Archives data: ${archivesError.message}`
  );
}

/*
 * 6. Delete notification preferences.
 */
const { error: notificationPreferencesError } =
  await adminClient
    .from('notification_preferences')
    .delete()
    .eq('user_id', userId);

if (notificationPreferencesError) {
  throw new Error(
    `Could not delete notification preferences: ${notificationPreferencesError.message}`
  );
}

/*
 * 7. Delete push tokens.
 */
const { error: pushTokensError } =
  await adminClient
    .from('push_tokens')
    .delete()
    .eq('user_id', userId);

if (pushTokensError) {
  throw new Error(
    `Could not delete push tokens: ${pushTokensError.message}`
  );
}
/*
 * 5. Delete Archives rankings.
 */
const { error: archivesError } =
  await adminClient
    .from('archive_rankings')
    .delete()
    .eq('user_id', userId);

if (archivesError) {
  throw new Error(
    `Could not delete Archives data: ${archivesError.message}`
  );
}

/*
 * 6. Delete notification preferences.
 */
const { error: notificationPreferencesError } =
  await adminClient
    .from('notification_preferences')
    .delete()
    .eq('user_id', userId);

if (notificationPreferencesError) {
  throw new Error(
    `Could not delete notification preferences: ${notificationPreferencesError.message}`
  );
}

/*
 * 7. Delete push tokens.
 */
const { error: pushTokensError } =
  await adminClient
    .from('push_tokens')
    .delete()
    .eq('user_id', userId);

if (pushTokensError) {
  throw new Error(
    `Could not delete push tokens: ${pushTokensError.message}`
  );
}
    /*
     * 8. Delete profile.
     */
    const { error: profileError } =
      await adminClient
        .from('profiles')
        .delete()
        .eq('user_id', userId);

    if (profileError) {
      throw new Error(
        `Could not delete profile: ${profileError.message}`
      );
    }

    /*
     * 9. Delete the Auth user LAST.
     *
     * No user ID is supplied by the mobile app.
     * We only delete the authenticated caller.
     */
    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(
        userId
      );

    if (authDeleteError) {
      throw new Error(
        `Could not delete authentication account: ${authDeleteError.message}`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
} catch (error) {
  console.error(
    'Delete account error:',
    error
  );

  return new Response(
    JSON.stringify({
      error: 'Account deletion failed',
    }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
});