class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  set(phone, data) {
    this.sessions.set(phone, {
      ...data,
      updatedAt: Date.now()
    });
    console.log(`[SessionStore] Saved session for ${phone}:`, data);
  }

  get(phone) {
    const session = this.sessions.get(phone);
    if (session) {
      console.log(`[SessionStore] Retrieved session for ${phone}`);
      return session;
    }
    console.log(`[SessionStore] No session found for ${phone}`);
    return null;
  }

  delete(phone) {
    const deleted = this.sessions.delete(phone);
    console.log(`[SessionStore] Deleted session for ${phone}: ${deleted}`);
    return deleted;
  }

  update(phone, updates) {
    const existing = this.get(phone);
    if (existing) {
      this.set(phone, { ...existing, ...updates });
      return true;
    }
    return false;
  }

  cleanup(maxAgeMs = 3600000) {
    const now = Date.now();
    let cleaned = 0;
    for (const [phone, session] of this.sessions.entries()) {
      if (now - session.updatedAt > maxAgeMs) {
        this.sessions.delete(phone);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[SessionStore] Cleaned up ${cleaned} expired sessions`);
    }
    return cleaned;
  }
}

module.exports = new SessionStore();
