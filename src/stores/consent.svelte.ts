// Consent store — manages user's localStorage/data consent for GDPR ePrivacy compliance
// Consent state is stored in localStorage itself (the one exception — storing consent preference
// is considered "strictly necessary" under ePrivacy Directive Article 5(3))

const CONSENT_KEY = 'klavier-consent';

export type ConsentStatus = 'pending' | 'accepted' | 'declined';

export interface ConsentData {
  status: ConsentStatus;
  date: string; // ISO date of consent action
  version: string; // policy version at time of consent
}

const CURRENT_POLICY_VERSION = '1.0';

function loadConsent(): ConsentData {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return { status: 'pending', date: '', version: '' };
    const parsed = JSON.parse(raw) as ConsentData;
    // If policy version changed, re-ask for consent
    if (parsed.version !== CURRENT_POLICY_VERSION && parsed.status === 'accepted') {
      return { status: 'pending', date: '', version: '' };
    }
    return parsed;
  } catch {
    return { status: 'pending', date: '', version: '' };
  }
}

function saveConsent(data: ConsentData): void {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
}

class ConsentStore {
  data = $state<ConsentData>(loadConsent());

  get hasConsented(): boolean {
    return this.data.status === 'accepted';
  }

  get hasDeclined(): boolean {
    return this.data.status === 'declined';
  }

  get isPending(): boolean {
    return this.data.status === 'pending';
  }

  get policyVersion(): string {
    return CURRENT_POLICY_VERSION;
  }

  accept() {
    this.data = {
      status: 'accepted',
      date: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    };
    saveConsent(this.data);
  }

  decline() {
    this.data = {
      status: 'declined',
      date: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    };
    saveConsent(this.data);
    // Clear any previously stored progress data
    localStorage.removeItem('klavier-progress');
  }

  revoke() {
    this.data = { status: 'pending', date: '', version: '' };
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem('klavier-progress');
  }
}

export const consent = new ConsentStore();
