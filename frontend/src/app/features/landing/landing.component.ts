import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  template: `
    <div class="landing">
      <!-- Hero -->
      <section class="hero">
        <span class="petal p1" aria-hidden="true">🌹</span>
        <span class="petal p2" aria-hidden="true">🌸</span>
        <span class="petal p3" aria-hidden="true">🌷</span>
        <span class="petal p4" aria-hidden="true">🌻</span>
        <span class="petal p5" aria-hidden="true">🌺</span>
        <span class="petal p6" aria-hidden="true">🌼</span>
        <span class="petal p7" aria-hidden="true">🌸</span>
        <span class="petal p8" aria-hidden="true">🌷</span>

        <div class="hero-content">
          <div class="brand-row">
            <span class="brand-emoji">🌿</span>
            <h1 class="app-title">EzStem</h1>
          </div>
          <p class="tagline">Your floral business, beautifully organized</p>
          <p class="description">
            Track inventory, price arrangements, plan events — everything
            a florist needs in one elegant workspace.
          </p>
          <button class="cta-btn" (click)="signIn()">
            Get started &nbsp;→
          </button>
          <p class="social-note">Sign in with Microsoft, Google, or Facebook</p>
        </div>
      </section>

      <!-- Wave divider -->
      <div class="wave-wrap">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#faf7f5"/>
        </svg>
      </div>

      <!-- Features -->
      <section class="features-section">
        <h2 class="features-heading">
          <span aria-hidden="true">🌸</span> Everything you need to bloom
        </h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🌺</div>
            <h3>Item Library</h3>
            <p>Manage your full flower inventory with costs, vendors, and seasonal availability.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌷</div>
            <h3>Recipe Builder</h3>
            <p>Create and price arrangement recipes. Know your true cost before you quote.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌻</div>
            <h3>Event Planning</h3>
            <p>Plan events, manage orders, and track what you need to order and when.</p>
          </div>
        </div>
      </section>

      <!-- Footer CTA -->
      <footer class="footer">
        <p class="footer-text">Ready to grow your business? 🌱</p>
        <button class="cta-btn cta-btn--outline" (click)="signIn()">
          Sign in to get started
        </button>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .landing {
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* ── Hero ── */
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(150deg, #fff9f4 0%, #fde8f0 42%, #edf7ed 100%);
      overflow: hidden;
      padding: 80px 24px 48px;
      text-align: center;
    }

    /* Floating petals */
    .petal {
      position: absolute;
      pointer-events: none;
      user-select: none;
      opacity: 0.6;
      animation: float var(--dur, 7s) ease-in-out infinite;
      animation-delay: var(--delay, 0s);
      font-size: var(--size, 2.5rem);
    }

    .p1 { --size: 3.5rem; --dur: 8s;  --delay: 0s;    top: 8%;    left: 6%;   }
    .p2 { --size: 2rem;   --dur: 6s;  --delay: 1.2s;  top: 14%;   right: 8%;  }
    .p3 { --size: 2.5rem; --dur: 9s;  --delay: 0.5s;  top: 58%;   left: 4%;   }
    .p4 { --size: 3rem;   --dur: 7s;  --delay: 2s;    top: 18%;   left: 24%;  }
    .p5 { --size: 2.5rem; --dur: 8s;  --delay: 1.5s;  bottom: 18%; right: 6%; }
    .p6 { --size: 2rem;   --dur: 6s;  --delay: 0.8s;  top: 38%;   right: 18%; }
    .p7 { --size: 1.8rem; --dur: 7.5s;--delay: 2.5s;  bottom: 28%; left: 16%; }
    .p8 { --size: 2.2rem; --dur: 9s;  --delay: 1s;    bottom: 14%; right: 24%; }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      33%       { transform: translateY(-18px) rotate(8deg); }
      66%       { transform: translateY(-8px) rotate(-5deg); }
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
      justify-content: center;
    }

    .brand-emoji {
      font-size: 3.5rem;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15));
    }

    .app-title {
      font-size: 4.2rem;
      font-weight: 800;
      color: #2d4a2d;
      margin: 0;
      letter-spacing: -2px;
      line-height: 1;
    }

    .tagline {
      font-size: 1.35rem;
      color: #b5445a;
      margin: 0;
      font-weight: 600;
      letter-spacing: -0.3px;
    }

    .description {
      font-size: 1.05rem;
      color: #5a5a5a;
      line-height: 1.75;
      margin: 0;
      max-width: 480px;
    }

    /* CTA button */
    .cta-btn {
      display: inline-flex;
      align-items: center;
      padding: 14px 40px;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      background: linear-gradient(135deg, #b5445a 0%, #8b2345 100%);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(181, 68, 90, 0.38);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      font-family: inherit;
    }

    .cta-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(181, 68, 90, 0.5);
    }

    .cta-btn:active {
      transform: translateY(-1px);
    }

    .cta-btn--outline {
      background: transparent;
      color: #fff;
      border: 2px solid rgba(255,255,255,0.7);
      box-shadow: none;
    }

    .cta-btn--outline:hover {
      background: rgba(255, 255, 255, 0.1);
      box-shadow: none;
    }

    .social-note {
      font-size: 0.85rem;
      color: #888;
      margin: 0;
    }

    /* ── Wave divider ── */
    .wave-wrap {
      background: linear-gradient(150deg, #fff9f4 0%, #fde8f0 42%, #edf7ed 100%);
      margin-bottom: -2px;
    }

    .wave-wrap svg {
      display: block;
      width: 100%;
      height: 80px;
    }

    /* ── Features ── */
    .features-section {
      background: #faf7f5;
      padding: 80px 24px 100px;
    }

    .features-heading {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      color: #2d4a2d;
      margin: 0 0 56px;
      letter-spacing: -0.5px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 28px;
      max-width: 1040px;
      margin: 0 auto;
    }

    .feature-card {
      background: white;
      border-radius: 20px;
      padding: 40px 28px;
      text-align: center;
      border: 1px solid rgba(181, 68, 90, 0.08);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .feature-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 40px rgba(181, 68, 90, 0.12);
    }

    .feature-icon {
      font-size: 2.8rem;
      background: linear-gradient(135deg, #fde8f0 0%, #fce4ec 100%);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .feature-card h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #2d4a2d;
      margin: 0;
    }

    .feature-card p {
      font-size: 0.95rem;
      color: #6b6b6b;
      line-height: 1.7;
      margin: 0;
    }

    /* ── Footer ── */
    .footer {
      background: #2d4a2d;
      padding: 72px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
    }

    .footer-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e8f5e9;
      margin: 0;
    }

    /* ── Mobile ── */
    @media (max-width: 640px) {
      .app-title  { font-size: 3rem; letter-spacing: -1px; }
      .brand-emoji { font-size: 2.5rem; }
      .tagline    { font-size: 1.1rem; }
      .petal      { opacity: 0.35; }
      .features-section { padding: 60px 16px 80px; }
      .features-heading  { font-size: 1.5rem; }
      .feature-card { padding: 28px 20px; }
    }
  `]
})
export class LandingComponent {
  private authService = inject(AuthService);

  signIn() {
    this.authService.signIn();
  }
}
