<script lang="ts">
  import { router } from '../router.svelte';
</script>

<div class="max-w-3xl mx-auto px-6 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6">
    <button
      class="text-[0.85rem] text-[#6b6455] bg-transparent border-none cursor-pointer hover:text-navy transition-colors p-0"
      onclick={() => router.navigate('/')}
    >← Back to Home</button>
  </div>

  <h1 class="text-[1.8rem] font-bold text-navy mb-2">Privacy Policy</h1>
  <p class="text-[0.85rem] text-[#b4b2a7] mb-8">Last updated: March 20, 2026 · Policy version 1.0</p>

  <div class="prose-legal">
    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">1. Overview</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed mb-3">
        Klavier ("we," "our," or "the app") is a free, browser-based piano learning application. We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights regarding that data.
      </p>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Klavier operates entirely within your web browser. We do not operate servers that collect, store, or process your personal data. No data is transmitted from your device to us or any third party.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">2. Data We Store</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed mb-3">
        Klavier uses your browser's localStorage to save your learning progress locally on your device. With your consent, we store the following data:
      </p>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-5 mb-3">
        <p class="text-[0.9rem] text-navy font-medium mb-2">Progress Data (stored locally in your browser):</p>
        <ul class="text-[0.9rem] text-[#6b6455] leading-relaxed" style="list-style: disc; padding-left: 1.5rem;">
          <li class="mb-1">Completed lesson IDs</li>
          <li class="mb-1">Quiz scores (score, total, best time, date)</li>
          <li class="mb-1">Current and longest practice streak</li>
          <li class="mb-1">Last active date</li>
          <li class="mb-1">Total practice minutes</li>
        </ul>
      </div>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
        <p class="text-[0.9rem] text-navy font-medium mb-2">Consent Preference (always stored):</p>
        <ul class="text-[0.9rem] text-[#6b6455] leading-relaxed" style="list-style: disc; padding-left: 1.5rem;">
          <li class="mb-1">Your consent choice (accepted/declined)</li>
          <li class="mb-1">Date of consent decision</li>
          <li class="mb-1">Policy version at time of consent</li>
        </ul>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">3. Data We Do NOT Collect</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        We do not collect, store, or process: personal identifying information (name, email, address), IP addresses or device identifiers, usage analytics or behavioral tracking data, cookies (Klavier uses no cookies), financial or payment information, or any data from third-party services. No data ever leaves your device.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">4. Legal Basis for Data Storage</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed mb-3">
        Under the EU ePrivacy Directive (Article 5(3)) and GDPR (Article 6(1)(a)), we request your explicit consent before storing progress data in localStorage. Your consent preference itself is stored under the "strictly necessary" exemption, as it is required to remember your choice.
      </p>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        If you decline consent, Klavier remains fully functional — you can use all lessons, quizzes, and the virtual keyboard — but your progress will not be saved between sessions.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">5. Your Rights</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed mb-3">Under GDPR and applicable privacy laws, you have the right to:</p>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
        <ul class="text-[0.9rem] text-[#6b6455] leading-relaxed" style="list-style: disc; padding-left: 1.5rem;">
          <li class="mb-2"><span class="font-medium text-navy">Access your data</span> — Export all stored data as a JSON file from the <button class="text-purple underline bg-transparent border-none cursor-pointer p-0 text-[0.9rem]" onclick={() => router.navigate('/settings')}>Settings page</button>.</li>
          <li class="mb-2"><span class="font-medium text-navy">Delete your data</span> — Permanently erase all stored data from the <button class="text-purple underline bg-transparent border-none cursor-pointer p-0 text-[0.9rem]" onclick={() => router.navigate('/settings')}>Settings page</button>.</li>
          <li class="mb-2"><span class="font-medium text-navy">Withdraw consent</span> — Revoke your consent at any time from Settings. This will delete all stored data.</li>
          <li class="mb-2"><span class="font-medium text-navy">Object to processing</span> — Decline localStorage when first prompted, or revoke consent later.</li>
          <li><span class="font-medium text-navy">Data portability</span> — Export your data in machine-readable JSON format.</li>
        </ul>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">6. Third-Party Services</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed mb-3">Klavier loads the following external resources:</p>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
        <ul class="text-[0.9rem] text-[#6b6455] leading-relaxed" style="list-style: disc; padding-left: 1.5rem;">
          <li class="mb-1"><span class="font-medium text-navy">Google Fonts</span> — Inter, Space Grotesk, and Noto Music typefaces are loaded from Google's CDN. Google may collect standard web request data (IP address, browser type) as described in <span class="text-[#b4b2a7]">Google's Privacy Policy</span>.</li>
        </ul>
      </div>
      <p class="text-[0.9rem] text-[#b4b2a7] mt-2">
        We do not use any analytics services, advertising networks, or social media tracking pixels.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">7. Children's Privacy</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Klavier does not knowingly collect personal data from children under 16. Since no personal data is collected or transmitted, and all data remains local to the device, Klavier is suitable for users of all ages. Parents and guardians may clear stored data at any time from the Settings page.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">8. Data Security</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        All data is stored locally in your browser's localStorage. It is not encrypted, but it never leaves your device and is only accessible to pages loaded from the same origin (domain). Clearing your browser data or using your browser's privacy/incognito mode will remove all stored data.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">9. Changes to This Policy</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        If we update this privacy policy in a way that affects how your data is handled, we will update the policy version number and request your consent again. The "last updated" date at the top of this page reflects the most recent revision.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">10. Contact</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        If you have questions about this privacy policy or your data, please contact us at:
      </p>
      <p class="text-[0.95rem] text-navy font-medium mt-2">klavier@example.com</p>
    </section>
  </div>
</div>
