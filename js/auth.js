// ==========================================================================
// auth.js - Grace Weekly Authentication Module
// ==========================================================================

const GraceAuth = {
  /**
   * Initiate Google OAuth Sign-in
   */
  async signInWithGoogle() {
    const client = GraceClient.client;
    if (!client) {
      alert('인증 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin.html'
      }
    });

    if (error) {
      console.error('Google Sign-in error:', error);
      alert('구글 로그인에 실패했습니다: ' + error.message);
    }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const client = GraceClient.client;
    if (client) {
      await client.auth.signOut();
      window.location.reload();
    }
  },

  /**
   * Get current authenticated user session and role profile
   */
  async getCurrentUser() {
    const client = GraceClient.client;
    if (!client) return null;

    const { data: { session } } = await client.auth.getSession();
    if (!session || !session.user) return null;

    const user = session.user;

    // Fetch user profile from database
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile:', error);
    }

    return {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url,
      role: profile?.role || 'pending'
    };
  }
};

window.GraceAuth = GraceAuth;
