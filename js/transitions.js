/**
 * AuraTrade - Skyline Blue Bounce Page Transition Engine
 * Coordinates spring-physics bouncing page switches with radiant Skyline Blue (#87CEEB)
 * bloom overlays, elastic beam effects, sound feedback, and component redraws.
 */

class PageTransitionManager {
  constructor() {
    this.overlay = document.getElementById('skyline-bounce-overlay');
    this.beam = document.getElementById('skyline-beam');
    this.isTransitioning = false;
    this.currentPage = 'beginner';
    this.transitionDuration = 450; // ms

    // Skyline Blue Bounce presets
    this.bounceStyles = {
      springBounce: {
        name: 'Skyline Spring Bounce',
        gradient: 'radial-gradient(circle at 50% 50%, rgba(135, 206, 235, 0.75) 0%, rgba(56, 189, 248, 0.48) 35%, rgba(14, 165, 233, 0.28) 65%, rgba(10, 13, 16, 0.92) 100%)',
        blur: '14px'
      },
      elasticPulse: {
        name: 'Skyline Elastic Ripple',
        gradient: 'radial-gradient(circle at 50% 45%, rgba(186, 230, 253, 0.82) 0%, rgba(135, 206, 235, 0.55) 40%, rgba(2, 132, 199, 0.25) 70%, rgba(10, 13, 16, 0.94) 100%)',
        blur: '16px'
      },
      softBounce: {
        name: 'Skyline Soft Drop',
        gradient: 'radial-gradient(circle at 50% 55%, rgba(135, 206, 235, 0.6) 0%, rgba(56, 189, 248, 0.35) 45%, rgba(15, 23, 42, 0.88) 100%)',
        blur: '10px'
      }
    };

    this.currentStyle = 'springBounce';
    this.init();
  }

  init() {
    // Listen to hash changes for browser history navigation
    window.addEventListener('hashchange', () => {
      const pageId = window.location.hash.replace('#', '') || 'beginner';
      if (pageId !== this.currentPage) {
        this.navigateTo(pageId);
      }
    });

    // Check initial hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(`page-${initialHash}`)) {
      this.currentPage = initialHash;
    }

    this.showPageImmediate(this.currentPage);
    this.applyBounceStyle(this.currentStyle);
  }

  setBounceStyle(styleKey) {
    if (this.bounceStyles[styleKey]) {
      this.currentStyle = styleKey;
      this.applyBounceStyle(styleKey);
      this.previewTransition();
    }
  }

  applyBounceStyle(styleKey) {
    if (!this.overlay) return;
    const style = this.bounceStyles[styleKey];
    this.overlay.style.background = style.gradient;
    this.overlay.style.backdropFilter = `blur(${style.blur})`;
    this.overlay.style.webkitBackdropFilter = `blur(${style.blur})`;
  }

  navigateTo(targetPageId) {
    if (this.isTransitioning) return;
    if (targetPageId === this.currentPage && document.getElementById(`page-${targetPageId}`).classList.contains('active-page')) {
      return;
    }

    const targetEl = document.getElementById(`page-${targetPageId}`);
    if (!targetEl) return;

    this.isTransitioning = true;

    // 1. Play Energetic Skyline Blue Bounce Chime
    if (window.tradeState) {
      window.tradeState.playSound('bounceTransition');
    }

    // 2. Trigger Skyline Blue Bounce Overlay & Elastic Beam
    this.overlay.classList.remove('bounce-out');
    this.overlay.classList.add('bounce-in');
    if (this.beam) {
      this.beam.classList.add('active');
    }

    // Midpoint: Swap content behind the bouncy Skyline Blue curtain
    setTimeout(() => {
      // Deactivate all pages
      document.querySelectorAll('.page-view').forEach(p => {
        p.classList.remove('active-page');
      });

      // Activate target page (triggers CSS keyframe pageSpringBounce)
      targetEl.classList.add('active-page');
      this.currentPage = targetPageId;
      window.location.hash = `#${targetPageId}`;
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Update Navigation Bar Active States
      this.updateNavPills(targetPageId);

      // Trigger redraws of canvas components on the newly revealed page
      this.triggerComponentRefreshes(targetPageId);

      // 3. Elastic Bounce Out of Skyline Blue Overlay
      setTimeout(() => {
        this.overlay.classList.remove('bounce-in');
        this.overlay.classList.add('bounce-out');
        if (this.beam) {
          this.beam.classList.remove('active');
        }

        // Clean up when transition finishes
        setTimeout(() => {
          this.overlay.classList.remove('bounce-out');
          this.isTransitioning = false;
        }, 320);

      }, 150);

    }, 240);
  }

  // Instant display without animation (initial load)
  showPageImmediate(pageId) {
    document.querySelectorAll('.page-view').forEach(p => {
      p.classList.remove('active-page');
    });
    const targetEl = document.getElementById(`page-${pageId}`);
    if (targetEl) {
      targetEl.classList.add('active-page');
    }
    this.updateNavPills(pageId);
    this.triggerComponentRefreshes(pageId);
  }

  updateNavPills(activeId) {
    document.querySelectorAll('.nav-link, .sidebar-nav-item').forEach(btn => {
      const target = btn.getAttribute('data-target');
      if (target === activeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  triggerComponentRefreshes(pageId) {
    if (pageId === 'pro') {
      setTimeout(() => {
        if (window.candleChart) window.candleChart.resize();
        if (window.renderOrderBook) window.renderOrderBook();
      }, 50);
    } else if (pageId === 'options') {
      setTimeout(() => {
        if (window.renderOptionsPayoff) window.renderOptionsPayoff();
        if (window.renderOptionsChain) window.renderOptionsChain();
      }, 50);
    } else if (pageId === 'portfolio') {
      setTimeout(() => {
        if (window.renderPortfolioDonut) window.renderPortfolioDonut();
        if (window.renderTradeHistory) window.renderTradeHistory();
      }, 50);
    } else if (pageId === 'ai') {
      setTimeout(() => {
        if (window.aiAnalyst) {
          window.aiAnalyst.resizeChart();
          window.aiAnalyst.analyze();
          window.aiAnalyst.renderChart();
          window.aiAnalyst.updateRadarTable();
        }
      }, 50);
    }
  }

  // Quick test button for user to appreciate the skyline blue bounce anytime
  previewTransition() {
    this.overlay.classList.remove('bounce-out');
    this.overlay.classList.add('bounce-in');
    if (this.beam) this.beam.classList.add('active');
    if (window.tradeState) window.tradeState.playSound('bounceTransition');

    // Trigger bounce on current active page
    const currentEl = document.getElementById(`page-${this.currentPage}`);
    if (currentEl) {
      currentEl.classList.remove('active-page');
      void currentEl.offsetWidth; // force reflow
      currentEl.classList.add('active-page');
    }

    setTimeout(() => {
      this.overlay.classList.remove('bounce-in');
      this.overlay.classList.add('bounce-out');
      if (this.beam) this.beam.classList.remove('active');
      setTimeout(() => {
        this.overlay.classList.remove('bounce-out');
      }, 320);
    }, 280);
  }
}

// Global Transition Instance
document.addEventListener('DOMContentLoaded', () => {
  window.pageTransitions = new PageTransitionManager();
});
