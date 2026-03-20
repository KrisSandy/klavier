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

  <h1 class="text-[1.8rem] font-bold text-navy mb-2">Terms of Service</h1>
  <p class="text-[0.85rem] text-[#b4b2a7] mb-8">Last updated: March 20, 2026 · Version 1.0</p>

  <div class="prose-legal">
    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">1. Acceptance of Terms</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        By accessing and using Klavier ("the app," "the service"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use the app. Klavier is a free, browser-based piano learning application available to anyone with a compatible web browser.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">2. Description of Service</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Klavier provides interactive piano lessons, quizzes, a virtual keyboard, and song playback for educational purposes. The app runs entirely in your web browser. No account registration is required, and no software installation is necessary beyond a modern web browser.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">3. Intellectual Property</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed mb-3">
        All content within Klavier — including but not limited to lesson text, course structure, visual design, code, audio synthesis algorithms, and user interface elements — is the intellectual property of Klavier's creators and is protected by applicable copyright laws.
      </p>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Musical compositions included in the app's song library are either in the public domain or used with appropriate permissions. The synthesized audio output generated during your use of the app is not stored and is not subject to any intellectual property claim by us.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">4. Acceptable Use</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed mb-3">You agree to use Klavier only for its intended purpose as an educational tool. You may not:</p>
      <div class="bg-white rounded-lg border border-[#e8e6e0] p-5">
        <ul class="text-[0.9rem] text-[#6b6455] leading-relaxed" style="list-style: disc; padding-left: 1.5rem;">
          <li class="mb-1">Copy, redistribute, or commercially exploit the app's content without permission</li>
          <li class="mb-1">Attempt to reverse-engineer, decompile, or extract the app's source code for commercial purposes</li>
          <li class="mb-1">Use automated tools to scrape or reproduce the app's educational content</li>
          <li>Misrepresent the app or its content as your own creation</li>
        </ul>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">5. Educational Disclaimer</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Klavier is designed as a supplementary educational resource for beginner piano learners. It is not a substitute for professional music instruction. We make no guarantees regarding specific learning outcomes, musical proficiency, or the pace of your progress. Learning outcomes vary by individual.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">6. No Warranty</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Klavier is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the app will be uninterrupted, error-free, or free of harmful components.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">7. Limitation of Liability</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        To the maximum extent permitted by applicable law, Klavier's creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the app. This includes, without limitation, damages for loss of data, loss of profits, or interruption of service, even if we have been advised of the possibility of such damages.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">8. Data and Privacy</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Your use of Klavier is also governed by our <button class="text-purple underline bg-transparent border-none cursor-pointer p-0 text-[0.95rem]" onclick={() => router.navigate('/privacy')}>Privacy Policy</button>, which describes how we handle data stored locally on your device. By using the app, you acknowledge that you have read and understood the Privacy Policy.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">9. Browser Compatibility</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        Klavier requires a modern web browser with JavaScript enabled and Web Audio API support. We recommend the latest versions of Chrome, Firefox, Safari, or Edge. We are not responsible for issues arising from the use of unsupported browsers or browser configurations that block required functionality.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">10. Modifications to the Service</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        We reserve the right to modify, suspend, or discontinue any part of the app at any time without prior notice. We are not liable for any modification, suspension, or discontinuation of the service.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">11. Changes to These Terms</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        We may update these Terms of Service from time to time. Changes will be reflected by updating the "Last updated" date at the top of this page. Continued use of Klavier after any changes constitutes your acceptance of the revised terms.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">12. Governing Law</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        These terms are governed by and construed in accordance with applicable laws. Any disputes arising from the use of this app shall be resolved in accordance with those laws.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-[1.15rem] font-semibold text-navy mb-3">13. Contact</h2>
      <p class="text-[0.95rem] text-[#6b6455] leading-relaxed">
        For questions about these Terms of Service, please contact us at:
      </p>
      <p class="text-[0.95rem] text-navy font-medium mt-2">klavier@example.com</p>
    </section>
  </div>
</div>
