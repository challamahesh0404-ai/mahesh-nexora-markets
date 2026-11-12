/**
 * AuraTrade - Main Application Controller
 * Handles view logic, order book simulation, trade execution, portfolio visualizations,
 * beginner wizards, academy interactive cards, and tooltips.
 */

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = '⚡';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <span class="text-lg">${icon}</span>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal helper
function openModal(title, content) {
  const modal = document.getElementById('info-modal');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');

  if (modal && titleEl && bodyEl) {
    titleEl.textContent = title;
    bodyEl.innerHTML = content;
    modal.classList.add('active');
  }
}

function closeModal() {
  const modal = document.getElementById('info-modal');
  if (modal) modal.classList.remove('active');
}

// Exchange API Connectivity Modal
function openApiModal() {
  const modal = document.getElementById('api-modal');
  if (modal) {
    modal.classList.add('active');
    if (window.appController) window.appController.populateApiModal();
  }
}

function closeApiModal() {
  const modal = document.getElementById('api-modal');
  if (modal) modal.classList.remove('active');
}

// Strategy Backtester Modal
function openBacktestModal() {
  const modal = document.getElementById('backtest-modal');
  if (modal) {
    modal.classList.add('active');
    setTimeout(() => {
      if (window.strategyBacktester) {
        window.strategyBacktester.runBacktest({
          strategyKey: document.getElementById('bt-strategy-select')?.value || 'supertrend',
          symbol: window.tradeState?.activeAsset || 'BTC/USD',
          timeframe: '5M'
        });
      }
    }, 150);
  }
}

function closeBacktestModal() {
  const modal = document.getElementById('backtest-modal');
  if (modal) modal.classList.remove('active');
}

// News & Macro Calendar Modal
function openNewsCalendarModal() {
  const modal = document.getElementById('news-calendar-modal');
  if (modal) {
    modal.classList.add('active');
    if (window.appController) window.appController.renderNewsAndCalendar();
  }
}

function closeNewsCalendarModal() {
  const modal = document.getElementById('news-calendar-modal');
  if (modal) modal.classList.remove('active');
}

// Educational Dictionary for Beginner Tooltips
const TRADING_TERMS = {
  leverage: {
    title: 'What is Leverage?',
    content: `
      <p class="mb-3 text-slate-300"><b>Leverage</b> lets you control a much larger trade size with a small amount of money (margin).</p>
      <div class="bg-amber-400/10 border border-amber-400/30 p-3 rounded-lg mb-3">
        <p class="text-amber-300 text-sm"><b>Real-World Analogy:</b> Buying a $500,000 house with a $50,000 down payment (10x leverage). If the home goes up 10%, you doubled your money! But if it drops 10%, your down payment is wiped out.</p>
      </div>
      <p class="text-xs text-rose-400">⚠️ <b>Golden Rule for Beginners:</b> Stick to 1x (no leverage) or 2x max until you consistently make profits.</p>
    `
  },
  stopLoss: {
    title: 'Why is a Stop-Loss Essential?',
    content: `
      <p class="mb-3 text-slate-300">A <b>Stop-Loss (SL)</b> is an automatic safety parachute. If the market moves against you to a specific price, your trade closes automatically to prevent huge losses.</p>
      <div class="bg-emerald-400/10 border border-emerald-400/30 p-3 rounded-lg mb-3">
        <p class="text-emerald-300 text-sm"><b>Example:</b> You buy Bitcoin at $90,000. You set your Stop-Loss at $88,000. No matter how low Bitcoin crashes while you sleep, your maximum loss is strictly capped at $2,000!</p>
      </div>
    `
  },
  takeProfit: {
    title: 'What is Take-Profit (TP)?',
    content: `
      <p class="mb-3 text-slate-300">A <b>Take-Profit (TP)</b> order automatically locks in your gains when your target price is reached, so you never regret watching winning profits disappear.</p>
    `
  },
  longVsShort: {
    title: 'Long vs Short (Bull vs Bear)',
    content: `
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-lg">
          <h5 class="text-emerald-400 font-bold mb-1">📈 Long (Buy)</h5>
          <p class="text-xs text-slate-300">You profit when the price goes <b>UP</b>. Bulls push prices higher.</p>
        </div>
        <div class="bg-rose-500/15 border border-rose-500/30 p-3 rounded-lg">
          <h5 class="text-rose-400 font-bold mb-1">📉 Short (Sell)</h5>
          <p class="text-xs text-slate-300">You profit when the price goes <b>DOWN</b>. Bears pull prices lower.</p>
        </div>
      </div>
    `
  },
  orderBook: {
    title: 'Understanding the Order Book (DOM)',
    content: `
      <p class="mb-3 text-slate-300">The <b>Order Book</b> shows all open buy orders (Bids in Green) and sell orders (Asks in Red) waiting in the market.</p>
      <p class="text-xs text-slate-400">The gap between the highest buyer and lowest seller is called the <b>Spread</b>.</p>
    `
  },
  greeks: {
    title: 'Options Greeks Decoded Simply',
    content: `
      <ul class="space-y-2 text-xs text-slate-300">
        <li><b class="text-sky-400">Delta (Δ):</b> How much the option price moves for every $1 move in the stock.</li>
        <li><b class="text-amber-400">Theta (Θ):</b> Time decay! How much value the option loses each day as expiration approaches.</li>
        <li><b class="text-purple-400">Gamma (Γ):</b> The acceleration of Delta.</li>
        <li><b class="text-emerald-400">Vega (ν):</b> How sensitive the option is to changes in market volatility.</li>
      </ul>
    `
  }
};

class AppController {
  constructor() {
    this.initSidebar();
    this.initNavbar();
    this.initBeginnerWizard();
    this.initProTerminal();
    this.initPortfolio();
    this.initAcademy();
    this.initNotebookCalculator();
    this.initModalsAndTools();
    this.initOrderBookSimulation();
    this.updateHeaderTicker();

    // Subscribe to State Events
    if (window.tradeState) {
      window.tradeState.subscribe((event, data) => {
        this.handleStateUpdate(event, data);
      });
    }
  }

  initSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const isExpanded = localStorage.getItem('auratrade_sidebar_expanded') === 'true';

    if (isExpanded) {
      document.body.classList.add('sidebar-is-expanded');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentlyExpanded = document.body.classList.toggle('sidebar-is-expanded');
        localStorage.setItem('auratrade_sidebar_expanded', currentlyExpanded ? 'true' : 'false');
        if (window.tradeState) window.tradeState.playSound('click');

        // Smoothly resize charts after sidebar transition
        setTimeout(() => {
          if (window.candleChart) window.candleChart.resize();
          if (window.aiAnalyst) window.aiAnalyst.resizeChart();
          if (window.renderOptionsPayoff) window.renderOptionsPayoff();
          if (window.renderPortfolioDonut) window.renderPortfolioDonut();
        }, 220);

        setTimeout(() => {
          if (window.candleChart) window.candleChart.resize();
          if (window.aiAnalyst) window.aiAnalyst.resizeChart();
        }, 440);
      });
    }

    // Sidebar navigation items
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = btn.getAttribute('data-target');
        if (window.pageTransitions) {
          window.pageTransitions.navigateTo(targetPage);
        }
      });
    });

    // Indian Regional Languages Quick Switcher in Sidebar (Hindi, Telugu, Tamil)
    document.querySelectorAll('.indian-lang-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const lang = pill.getAttribute('data-lang');
        document.querySelectorAll('.indian-lang-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        // Sync with AI Analyst language selector
        const select = document.getElementById('ai-language-select');
        if (select) select.value = lang;
        if (window.aiAnalyst) {
          window.aiAnalyst.setLanguage(lang);
        }
        showToast(`Language set to ${pill.textContent}`, 'info');
      });
    });
  }

  handleStateUpdate(event, data) {
    if (event === 'tick') {
      this.updateHeaderTicker();
      this.updateBeginnerSummary();
      this.updatePositionsTable();
      this.updateProOrderSummary();
    } else if (event === 'assetChange') {
      this.updateHeaderTicker();
      this.updateBeginnerSummary();
      this.updateProOrderSummary();
      this.renderOrderBook();
    } else if (event === 'positionOpened') {
      showToast(`Position opened: ${data.position.type} ${data.position.symbol} for $${data.position.amount}`, 'success');
      this.updatePositionsTable();
      this.updateBalancePill();
    } else if (event === 'positionClosed') {
      const pnl = data.position.pnl;
      const msg = `Position closed (${data.position.reason}): ${pnl >= 0 ? '+' : ''}$${pnl}`;
      showToast(msg, pnl >= 0 ? 'success' : 'warning');
      this.updatePositionsTable();
      this.updateBalancePill();
      if (window.renderTradeHistory) window.renderTradeHistory();
      if (window.renderPortfolioDonut) window.renderPortfolioDonut();
    } else if (event === 'accountReset') {
      showToast('Practice account reset to $100,000 cash balance', 'info');
      this.updateBalancePill();
      this.updatePositionsTable();
      if (window.renderTradeHistory) window.renderTradeHistory();
      if (window.renderPortfolioDonut) window.renderPortfolioDonut();
    } else if (event === 'liveFeedStatus') {
      const btn = document.getElementById('live-feed-toggle-btn');
      const text = document.getElementById('live-feed-text');
      const lat = document.getElementById('live-feed-latency');
      if (btn && text && lat) {
        if (data.status === 'connected') {
          btn.className = 'live-feed-pill';
          text.textContent = 'LIVE BINANCE';
          lat.textContent = `${data.latency || 24}ms`;
        } else if (data.status === 'connecting' || data.status === 'reconnecting') {
          btn.className = 'live-feed-pill';
          text.textContent = 'CONNECTING...';
          lat.textContent = '...';
        } else {
          btn.className = 'live-feed-pill simulated';
          text.textContent = 'SIMULATION';
          lat.textContent = 'LOCAL';
        }
      }
    }
  }

  initNavbar() {
    // Live Market Data API Feed Toggle
    const liveFeedBtn = document.getElementById('live-feed-toggle-btn');
    if (liveFeedBtn) {
      liveFeedBtn.addEventListener('click', () => {
        const isLive = window.tradeState.toggleLiveFeed();
        showToast(isLive ? '🟢 Connecting to Live Binance WebSocket...' : '⚡ Switched to High-Precision Simulation', 'info');
      });
    }
    // Navigation link click listeners
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = btn.getAttribute('data-target');
        if (window.pageTransitions) {
          window.pageTransitions.navigateTo(targetPage);
        }
      });
    });

    // Sound toggle button
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        window.tradeState.soundEnabled = !window.tradeState.soundEnabled;
        soundBtn.innerHTML = window.tradeState.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        soundBtn.classList.toggle('text-amber-400', window.tradeState.soundEnabled);
        soundBtn.classList.toggle('text-slate-500', !window.tradeState.soundEnabled);
        window.tradeState.savePortfolio();
      });
    }

    // Yellow Fade Style Selector
    const fadeSelect = document.getElementById('fade-style-select');
    if (fadeSelect) {
      fadeSelect.addEventListener('change', (e) => {
        if (window.pageTransitions) {
          window.pageTransitions.setFadeStyle(e.target.value);
        }
      });
    }

    // Preview Fade Button
    const previewBtn = document.getElementById('preview-fade-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        if (window.pageTransitions) {
          window.pageTransitions.previewTransition();
        }
      });
    }

    // Modal close button
    const modalClose = document.getElementById('modal-close-btn');
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    // Modal background click
    const modal = document.getElementById('info-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Help pill click handler
    document.addEventListener('click', (e) => {
      const helpPill = e.target.closest('.help-pill');
      if (helpPill) {
        const term = helpPill.getAttribute('data-term');
        if (TRADING_TERMS[term]) {
          openModal(TRADING_TERMS[term].title, TRADING_TERMS[term].content);
        }
      }
    });

    this.updateBalancePill();
  }

  updateBalancePill() {
    const pill = document.getElementById('nav-balance-pill');
    if (!pill || !window.tradeState) return;

    const metrics = window.tradeState.getPortfolioMetrics();
    pill.textContent = `$${Math.round(metrics.totalEquity).toLocaleString()}`;
  }

  updateHeaderTicker() {
    const track = document.getElementById('header-ticker-track');
    if (!track || !window.tradeState) return;

    const assets = window.tradeState.assets;
    let html = '';

    Object.keys(assets).forEach(symbol => {
      const a = assets[symbol];
      const isUp = a.price >= a.open24h;
      const change = ((a.price - a.open24h) / a.open24h) * 100;
      const color = isUp ? 'text-[#00d4d4]' : 'text-[#FFA500]';
      const arrow = isUp ? '▲' : '▼';

      html += `
        <div class="inline-flex items-center gap-2 cursor-pointer hover:bg-slate-800/80 px-2.5 py-1 rounded transition" onclick="tradeState.setAsset('${symbol}')">
          <span class="font-bold text-[#FDFDFD] text-xs">${symbol}</span>
          <span class="text-xs font-mono text-slate-300">$${a.price.toFixed(a.decimals)}</span>
          <span class="text-[11px] font-mono ${color}">${arrow} ${change.toFixed(2)}%</span>
        </div>
      `;
    });

    // Duplicate track for seamless infinite scroll
    track.innerHTML = html + html;
  }

  /* ==========================================================================
     PAGE 1: BEGINNER HUB
     ========================================================================== */
  initBeginnerWizard() {
    this.beginnerDirection = 'BUY'; // 'BUY' or 'SELL'
    this.beginnerAmount = 500;

    // Asset selection cards
    const assetBtns = document.querySelectorAll('.beginner-asset-pill');
    assetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const symbol = btn.dataset.symbol;
        window.tradeState.setAsset(symbol);
        assetBtns.forEach(b => b.classList.remove('ring-2', 'ring-[#008080]', 'bg-[#008080]/15'));
        btn.classList.add('ring-2', 'ring-[#008080]', 'bg-[#008080]/15');
      });
    });

    // Direction buttons (Long vs Short)
    const longBtn = document.getElementById('wizard-long-btn');
    const shortBtn = document.getElementById('wizard-short-btn');
    if (longBtn && shortBtn) {
      longBtn.addEventListener('click', () => {
        this.beginnerDirection = 'BUY';
        longBtn.classList.add('bg-[#008080]', 'text-[#FDFDFD]', 'ring-2', 'ring-[#00a8a8]');
        longBtn.classList.remove('bg-slate-800', 'text-slate-400');
        shortBtn.classList.remove('bg-[#FFA500]', 'text-[#0a0d10]', 'ring-2', 'ring-[#FFA500]');
        shortBtn.classList.add('bg-slate-800', 'text-slate-400');
        this.updateBeginnerSummary();
      });

      shortBtn.addEventListener('click', () => {
        this.beginnerDirection = 'SELL';
        shortBtn.classList.add('bg-[#FFA500]', 'text-[#0a0d10]', 'ring-2', 'ring-[#FFA500]');
        shortBtn.classList.remove('bg-slate-800', 'text-slate-400');
        longBtn.classList.remove('bg-[#008080]', 'text-[#FDFDFD]', 'ring-2', 'ring-[#00a8a8]');
        longBtn.classList.add('bg-slate-800', 'text-slate-400');
        this.updateBeginnerSummary();
      });
    }

    // Quick amount pills
    document.querySelectorAll('.amount-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.amount-pill').forEach(p => p.classList.remove('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold'));
        pill.classList.add('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold');
        this.beginnerAmount = Number(pill.dataset.amount);
        const customInput = document.getElementById('beginner-custom-amount');
        if (customInput) customInput.value = this.beginnerAmount;
        this.updateBeginnerSummary();
      });
    });

    const customInput = document.getElementById('beginner-custom-amount');
    if (customInput) {
      customInput.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        if (val > 0) {
          this.beginnerAmount = val;
          this.updateBeginnerSummary();
        }
      });
    }

    // Risk Sliders
    const tpSlider = document.getElementById('beginner-tp-slider');
    const slSlider = document.getElementById('beginner-sl-slider');
    if (tpSlider) tpSlider.addEventListener('input', () => this.updateBeginnerSummary());
    if (slSlider) slSlider.addEventListener('input', () => this.updateBeginnerSummary());

    // Execute Practice Trade button
    const execBtn = document.getElementById('beginner-exec-trade-btn');
    if (execBtn) {
      execBtn.addEventListener('click', () => {
        const asset = window.tradeState.getAsset();
        const currentPrice = asset.price;
        const tpPct = Number(document.getElementById('beginner-tp-slider')?.value || 5);
        const slPct = Number(document.getElementById('beginner-sl-slider')?.value || 3);

        const tpPrice = this.beginnerDirection === 'BUY'
          ? currentPrice * (1 + tpPct / 100)
          : currentPrice * (1 - tpPct / 100);

        const slPrice = this.beginnerDirection === 'BUY'
          ? currentPrice * (1 - slPct / 100)
          : currentPrice * (1 + slPct / 100);

        const res = window.tradeState.executeTrade({
          symbol: asset.name,
          type: this.beginnerDirection,
          amount: this.beginnerAmount,
          leverage: 1,
          tp: tpPrice,
          sl: slPrice,
          orderMode: 'Beginner Safe Trade'
        });

        if (res.success) {
          // Switch to pro or show congratulations
          this.updateBeginnerSummary();
        } else {
          showToast(res.message, 'error');
        }
      });
    }

    this.updateBeginnerSummary();
  }

  updateBeginnerSummary() {
    const asset = window.tradeState.getAsset();
    if (!asset) return;

    const currentPrice = asset.price;
    const isLong = this.beginnerDirection === 'BUY';
    const amount = this.beginnerAmount;

    const tpPct = Number(document.getElementById('beginner-tp-slider')?.value || 5);
    const slPct = Number(document.getElementById('beginner-sl-slider')?.value || 3);

    // Calculate dollar profit & loss
    const profitDollar = amount * (tpPct / 100);
    const lossDollar = amount * (slPct / 100);

    const tpPrice = isLong ? currentPrice * (1 + tpPct / 100) : currentPrice * (1 - tpPct / 100);
    const slPrice = isLong ? currentPrice * (1 - slPct / 100) : currentPrice * (1 + slPct / 100);

    // Update labels
    const profitEl = document.getElementById('beginner-target-profit');
    const lossEl = document.getElementById('beginner-max-loss');
    const tpPriceEl = document.getElementById('beginner-tp-price');
    const slPriceEl = document.getElementById('beginner-sl-price');
    const livePriceEl = document.getElementById('beginner-live-price');

    if (profitEl) profitEl.textContent = `+$${profitDollar.toFixed(2)} (+${tpPct}%)`;
    if (lossEl) lossEl.textContent = `-$${lossDollar.toFixed(2)} (-${slPct}%)`;
    if (tpPriceEl) tpPriceEl.textContent = `$${tpPrice.toFixed(asset.decimals)}`;
    if (slPriceEl) slPriceEl.textContent = `$${slPrice.toFixed(asset.decimals)}`;
    if (livePriceEl) livePriceEl.textContent = `$${currentPrice.toFixed(asset.decimals)}`;

    // Update Asset Card
    const nameEl = document.getElementById('beginner-asset-name');
    if (nameEl) nameEl.textContent = `${asset.name} (${window.tradeState.activeAsset})`;
  }

  /* ==========================================================================
     PAGE 2: PRO TERMINAL
     ========================================================================== */
  initProTerminal() {
    this.proOrderType = 'Market';
    this.proLeverage = 1;
    this.proAmount = 1000;

    // Order Type Tabs (Market, Limit, Stop, Trailing, OCO)
    document.querySelectorAll('.pro-order-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.pro-order-tab').forEach(t => t.classList.remove('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold'));
        tab.classList.add('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold');
        this.proOrderType = tab.dataset.type;

        const limitGroup = document.getElementById('pro-limit-price-group');
        const trailingGroup = document.getElementById('pro-trailing-distance-group');
        const ocoNotice = document.getElementById('pro-oco-notice');

        if (limitGroup) {
          limitGroup.style.display = (this.proOrderType === 'Limit' || this.proOrderType === 'Stop') ? 'block' : 'none';
        }
        if (trailingGroup) {
          trailingGroup.style.display = this.proOrderType === 'Trailing' ? 'block' : 'none';
        }
        if (ocoNotice) {
          ocoNotice.style.display = this.proOrderType === 'OCO' ? 'block' : 'none';
        }
      });
    });

    // Drawing Tools Buttons (Trendline, Horizontal Ray, Zone Box)
    document.querySelectorAll('.draw-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (window.candleChart) {
          window.candleChart.setDrawingTool(tool);
        }
      });
    });

    // Leverage slider
    const levSlider = document.getElementById('pro-leverage-slider');
    const levLabel = document.getElementById('pro-leverage-val');
    if (levSlider && levLabel) {
      levSlider.addEventListener('input', (e) => {
        this.proLeverage = Number(e.target.value);
        levLabel.textContent = `${this.proLeverage}x`;
        this.updateProOrderSummary();
      });
    }

    // Leverage quick buttons
    document.querySelectorAll('.lev-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.proLeverage = Number(btn.dataset.lev);
        if (levSlider) levSlider.value = this.proLeverage;
        if (levLabel) levLabel.textContent = `${this.proLeverage}x`;
        this.updateProOrderSummary();
      });
    });

    // Pro Order Execution Buttons
    const buyBtn = document.getElementById('pro-buy-btn');
    const sellBtn = document.getElementById('pro-sell-btn');

    if (buyBtn) {
      buyBtn.addEventListener('click', () => this.executeProOrder('BUY'));
    }
    if (sellBtn) {
      sellBtn.addEventListener('click', () => this.executeProOrder('SELL'));
    }

    // Timeframe Buttons
    document.querySelectorAll('.tf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.candleChart) {
          window.candleChart.setTimeframe(btn.dataset.tf);
        }
      });
    });

    // Indicator Checkbox Toggles
    const ema20Check = document.getElementById('toggle-ema20');
    const ema50Check = document.getElementById('toggle-ema50');
    const bBandsCheck = document.getElementById('toggle-bollinger');
    const stCheck = document.getElementById('toggle-supertrend');
    const fibCheck = document.getElementById('toggle-fibonacci');

    if (ema20Check) ema20Check.addEventListener('change', () => window.candleChart?.toggleIndicator('ema20'));
    if (ema50Check) ema50Check.addEventListener('change', () => window.candleChart?.toggleIndicator('ema50'));
    if (bBandsCheck) bBandsCheck.addEventListener('change', () => window.candleChart?.toggleIndicator('bollinger'));
    if (stCheck) stCheck.addEventListener('change', () => window.candleChart?.toggleIndicator('supertrend'));
    if (fibCheck) fibCheck.addEventListener('change', () => window.candleChart?.toggleIndicator('fibonacci'));

    // Oscillator mode toggles (RSI vs MACD)
    const rsiTab = document.getElementById('osc-tab-rsi');
    const macdTab = document.getElementById('osc-tab-macd');
    if (rsiTab && macdTab) {
      rsiTab.addEventListener('click', () => {
        window.candleChart?.setOscillatorMode('rsi');
        rsiTab.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-[#008080] text-white transition hover:brightness-110';
        macdTab.className = 'px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white bg-slate-800 transition';
      });
      macdTab.addEventListener('click', () => {
        window.candleChart?.setOscillatorMode('macd');
        macdTab.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-[#87CEEB] text-[#0a0d10] transition hover:brightness-110';
        rsiTab.className = 'px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white bg-slate-800 transition';
      });
    }
  }

  executeProOrder(type) {
    const asset = window.tradeState.getAsset();
    const amountInput = document.getElementById('pro-order-amount');
    const amount = Number(amountInput?.value || 1000);

    const tpInput = document.getElementById('pro-tp-price');
    const slInput = document.getElementById('pro-sl-price');
    const tp = tpInput && tpInput.value ? Number(tpInput.value) : null;
    const sl = slInput && slInput.value ? Number(slInput.value) : null;

    let trailingSl = false;
    let trailingDistance = null;

    if (this.proOrderType === 'Trailing') {
      trailingSl = true;
      const trailDistInput = document.getElementById('pro-trailing-distance');
      trailingDistance = Number(trailDistInput?.value || 500);
    } else if (this.proOrderType === 'OCO') {
      if (!tp || !sl) {
        showToast('OCO Bracket requires both Take-Profit and Stop-Loss prices.', 'warning');
        return;
      }
    }

    const res = window.tradeState.executeTrade({
      symbol: window.tradeState.activeAsset,
      type,
      amount,
      leverage: this.proLeverage,
      tp,
      sl,
      trailingSl,
      trailingDistance,
      orderMode: `${this.proOrderType} Order (${this.proLeverage}x)`
    });

    if (!res.success) {
      showToast(res.message, 'error');
    } else {
      showToast(`${type === 'BUY' ? 'LONG' : 'SHORT'} position opened with ${this.proOrderType}!`, 'success');
    }
  }

  updateProOrderSummary() {
    const asset = window.tradeState.getAsset();
    if (!asset) return;

    const amountInput = document.getElementById('pro-order-amount');
    const amount = Number(amountInput?.value || 1000);
    const leverage = this.proLeverage;
    const totalPositionSize = amount * leverage;

    const sizeEl = document.getElementById('pro-pos-size-val');
    const marginEl = document.getElementById('pro-margin-req-val');
    const liqPriceEl = document.getElementById('pro-liq-price-val');

    if (sizeEl) sizeEl.textContent = `$${totalPositionSize.toLocaleString()}`;
    if (marginEl) marginEl.textContent = `$${amount.toLocaleString()}`;

    if (liqPriceEl) {
      const liqBuffer = (1 / leverage) * 0.9;
      const liqLong = asset.price * (1 - liqBuffer);
      liqPriceEl.textContent = `$${liqLong.toFixed(asset.decimals)}`;
    }
  }

  // Order Book DOM simulation
  initOrderBookSimulation() {
    setInterval(() => {
      this.renderOrderBook();
      this.renderRecentTrades();
    }, 1400);
  }

  renderOrderBook() {
    const asksContainer = document.getElementById('orderbook-asks');
    const bidsContainer = document.getElementById('orderbook-bids');
    const spreadContainer = document.getElementById('orderbook-spread');
    if (!asksContainer || !bidsContainer || !window.tradeState) return;

    const asset = window.tradeState.getAsset();
    const mid = asset.price;
    const count = 6;
    const step = mid * 0.0004;

    // Asks (Sellers - descending from top)
    let asksHtml = '';
    for (let i = count; i >= 1; i--) {
      const p = mid + i * step;
      const size = (Math.random() * 1.5 + 0.2).toFixed(3);
      const depth = Math.min(100, Math.round((i / count) * 85 + Math.random() * 15));
      asksHtml += `
        <div class="orderbook-row text-rose-400">
          <div class="orderbook-bar ask" style="width: ${depth}%"></div>
          <span>${p.toFixed(asset.decimals)}</span>
          <span class="text-right text-slate-300">${size}</span>
          <span class="text-right text-slate-500">${(p * size).toFixed(0)}</span>
        </div>
      `;
    }
    asksContainer.innerHTML = asksHtml;

    // Spread counter
    if (spreadContainer) {
      const spread = (step * 2).toFixed(asset.decimals);
      const spreadPct = ((step * 2 / mid) * 100).toFixed(3);
      spreadContainer.innerHTML = `
        <span class="text-slate-400">Spread:</span>
        <span class="text-amber-300 font-bold">$${spread}</span>
        <span class="text-slate-500">(${spreadPct}%)</span>
      `;
    }

    // Bids (Buyers - ascending)
    let bidsHtml = '';
    for (let i = 1; i <= count; i++) {
      const p = mid - i * step;
      const size = (Math.random() * 1.8 + 0.3).toFixed(3);
      const depth = Math.min(100, Math.round(((count - i + 1) / count) * 85 + Math.random() * 15));
      bidsHtml += `
        <div class="orderbook-row text-emerald-400">
          <div class="orderbook-bar bid" style="width: ${depth}%"></div>
          <span>${p.toFixed(asset.decimals)}</span>
          <span class="text-right text-slate-300">${size}</span>
          <span class="text-right text-slate-500">${(p * size).toFixed(0)}</span>
        </div>
      `;
    }
    bidsContainer.innerHTML = bidsHtml;
  }

  renderRecentTrades() {
    const tape = document.getElementById('trades-tape-list');
    if (!tape || !window.tradeState) return;

    const asset = window.tradeState.getAsset();
    const isBuy = Math.random() > 0.48;
    const price = (asset.price * (1 + (Math.random() - 0.49) * 0.001)).toFixed(asset.decimals);
    const size = (Math.random() * 2.2 + 0.1).toFixed(3);
    const time = new Date().toLocaleTimeString([], { hour12: false });

    const row = document.createElement('div');
    row.className = `flex items-center justify-between font-mono text-[11px] py-1 border-b border-white/5 ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`;
    row.innerHTML = `
      <span>${price}</span>
      <span class="text-slate-300">${size}</span>
      <span class="text-slate-500">${time}</span>
    `;

    tape.prepend(row);
    if (tape.children.length > 8) {
      tape.lastChild.remove();
    }
  }

  updatePositionsTable() {
    const tbody = document.getElementById('positions-tbody');
    const badgeCount = document.getElementById('open-positions-count');
    if (!tbody || !window.tradeState) return;

    const positions = window.tradeState.positions;
    if (badgeCount) badgeCount.textContent = positions.length;

    if (positions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-8 text-slate-500">
            No open positions. Use the order panel above to open a practice position!
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    positions.forEach(pos => {
      const isLong = pos.type === 'BUY';
      const typeBadge = isLong
        ? '<span class="teal-badge px-2 py-0.5 rounded text-xs font-bold">LONG</span>'
        : '<span class="orange-badge px-2 py-0.5 rounded text-xs font-bold">SHORT</span>';

      const pnlColor = pos.pnl >= 0 ? 'text-[#00d4d4]' : 'text-[#FFA500]';
      const sign = pos.pnl >= 0 ? '+' : '';

      html += `
        <tr class="hover:bg-slate-800/40 border-b border-white/5 transition font-mono text-xs">
          <td class="py-3 pl-3 font-bold text-[#FDFDFD]">${pos.symbol}</td>
          <td>${typeBadge} <span class="text-[#87CEEB] text-[10px] ml-1">${pos.leverage}x</span></td>
          <td class="text-slate-300">$${pos.amount.toLocaleString()}</td>
          <td class="text-slate-400">$${pos.entryPrice.toLocaleString()}</td>
          <td class="text-[#FDFDFD] font-bold">$${pos.currentPrice.toLocaleString()}</td>
          <td class="font-bold ${pnlColor}">
            ${sign}$${pos.pnl.toLocaleString()} (${sign}${pos.pnlPercent}%)
          </td>
          <td class="text-slate-400">
            ${pos.tp ? 'TP: $' + pos.tp.toFixed(0) : '—'} / ${pos.sl ? 'SL: $' + pos.sl.toFixed(0) : '—'}
          </td>
          <td class="text-right pr-3">
            <button onclick="tradeState.closePosition('${pos.id}')" class="px-2.5 py-1 rounded bg-[#FFA500]/20 hover:bg-[#FFA500] text-[#FFA500] hover:text-[#0a0d10] transition text-xs font-bold">
              Close
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  /* ==========================================================================
     PAGE 4: PORTFOLIO & RISK
     ========================================================================== */
  initPortfolio() {
    window.renderPortfolioDonut = () => this.renderPortfolioDonut();
    window.renderTradeHistory = () => this.renderTradeHistory();

    const resetBtn = document.getElementById('reset-account-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your practice balance back to $100,000 cash?')) {
          window.tradeState.resetAccount();
        }
      });
    }
  }

  renderPortfolioDonut() {
    const canvas = document.getElementById('portfolioDonutChart');
    if (!canvas || !window.tradeState) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 240;
    const h = 240;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const metrics = window.tradeState.getPortfolioMetrics();
    const cash = metrics.cash;
    const margin = metrics.usedMargin;
    const total = Math.max(1, cash + margin);

    const cashAngle = (cash / total) * Math.PI * 2;
    const marginAngle = (margin / total) * Math.PI * 2;

    const cx = w / 2;
    const cy = h / 2;
    const radius = 90;
    const innerRadius = 60;

    ctx.clearRect(0, 0, w, h);

    // Segment 1: Cash (Teal #008080)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, cashAngle);
    ctx.arc(cx, cy, innerRadius, cashAngle, 0, true);
    ctx.closePath();
    ctx.fillStyle = '#008080';
    ctx.fill();

    // Segment 2: Invested / Margin (Orange #FFA500)
    if (margin > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, cashAngle, cashAngle + marginAngle);
      ctx.arc(cx, cy, innerRadius, cashAngle + marginAngle, cashAngle, true);
      ctx.closePath();
      ctx.fillStyle = '#FFA500';
      ctx.fill();
    }

    // Center text (Soft White #FDFDFD)
    ctx.fillStyle = '#FDFDFD';
    ctx.font = 'bold 15px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${Math.round(metrics.totalEquity).toLocaleString()}`, cx, cy + 5);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('Total Value', cx, cy - 15);

    // Update stats cards
    const equityLabel = document.getElementById('port-equity-val');
    const cashLabel = document.getElementById('port-cash-val');
    const winRateLabel = document.getElementById('port-winrate-val');
    const profitFactorLabel = document.getElementById('port-pf-val');
    const totalTradesLabel = document.getElementById('port-trades-val');

    if (equityLabel) equityLabel.textContent = `$${Math.round(metrics.totalEquity).toLocaleString()}`;
    if (cashLabel) cashLabel.textContent = `$${Math.round(metrics.cash).toLocaleString()}`;
    if (winRateLabel) winRateLabel.textContent = `${metrics.winRate}%`;
    if (profitFactorLabel) profitFactorLabel.textContent = metrics.profitFactor;
    if (totalTradesLabel) totalTradesLabel.textContent = metrics.totalTrades;
  }

  renderTradeHistory() {
    const tbody = document.getElementById('trade-history-tbody');
    if (!tbody || !window.tradeState) return;

    const history = window.tradeState.tradeHistory;
    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-500">
            No closed trades yet. Open and close positions to see your performance log here!
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    history.forEach(t => {
      const isProfit = t.pnl >= 0;
      const pnlColor = isProfit ? 'text-emerald-400' : 'text-rose-400';
      const sign = isProfit ? '+' : '';
      const closeDate = new Date(t.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <tr class="hover:bg-slate-800/40 border-b border-white/5 transition font-mono text-xs">
          <td class="py-2.5 pl-3 text-slate-400">${closeDate}</td>
          <td class="font-bold text-white">${t.symbol}</td>
          <td>${t.type === 'BUY' ? '<span class="text-emerald-400">LONG</span>' : '<span class="text-rose-400">SHORT</span>'}</td>
          <td class="text-slate-300">$${t.entryPrice.toLocaleString()}</td>
          <td class="text-slate-300">$${t.closePrice.toLocaleString()}</td>
          <td class="font-bold ${pnlColor}">${sign}$${t.pnl.toLocaleString()} (${sign}${t.pnlPercent}%)</td>
          <td class="text-slate-400 text-right pr-3">${t.reason || 'Closed'}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  /* ==========================================================================
     PAGE 5: TRADING ACADEMY & CHEAT SHEETS
     ========================================================================== */
  initAcademy() {
    // Risk Calculator
    const calcBtn = document.getElementById('calc-risk-btn');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        const capital = Number(document.getElementById('risk-calc-capital')?.value || 100000);
        const riskPct = Number(document.getElementById('risk-calc-pct')?.value || 1);
        const entryPrice = Number(document.getElementById('risk-calc-entry')?.value || 89000);
        const stopPrice = Number(document.getElementById('risk-calc-stop')?.value || 87000);

        const riskDollar = capital * (riskPct / 100);
        const distancePerUnit = Math.abs(entryPrice - stopPrice);

        if (distancePerUnit <= 0) {
          alert('Entry price and Stop-loss price must be different.');
          return;
        }

        const unitsToBuy = (riskDollar / distancePerUnit).toFixed(4);
        const totalTradeValue = (unitsToBuy * entryPrice).toFixed(2);

        const outUnits = document.getElementById('risk-calc-units');
        const outDollar = document.getElementById('risk-calc-dollar');
        const outTotal = document.getElementById('risk-calc-total');

        if (outUnits) outUnits.textContent = unitsToBuy;
        if (outDollar) outDollar.textContent = `$${riskDollar.toLocaleString()}`;
        if (outTotal) outTotal.textContent = `$${Number(totalTradeValue).toLocaleString()}`;
      });
    }
  }

  /* ==========================================================================
     PAGE 7: MAHESH NEXORA NOTEBOOK & MATHEMATICAL SCRATCHPAD
     ========================================================================== */
  initNotebookCalculator() {
    const capitalInput = document.getElementById('nb-calc-capital');
    const riskPctInput = document.getElementById('nb-calc-risk-pct');
    const entryInput = document.getElementById('nb-calc-entry');
    const slInput = document.getElementById('nb-calc-sl');
    const tpInput = document.getElementById('nb-calc-tp');
    const levInput = document.getElementById('nb-calc-lev');
    const levLabel = document.getElementById('nb-calc-lev-label');

    const outRiskDollar = document.getElementById('nb-out-risk-dollar');
    const outUnits = document.getElementById('nb-out-units');
    const outTotalValue = document.getElementById('nb-out-total-value');
    const outMargin = document.getElementById('nb-out-margin');
    const outRewardDollar = document.getElementById('nb-out-reward-dollar');
    const outRR = document.getElementById('nb-out-rr');
    const outLiq = document.getElementById('nb-out-liq');
    const verdictText = document.getElementById('nb-verdict-text');

    if (!capitalInput || !entryInput || !slInput) return;

    const computeMath = () => {
      const capital = Math.max(0, parseFloat(capitalInput.value) || 0);
      const riskPct = Math.max(0.01, parseFloat(riskPctInput?.value || 1));
      const entry = Math.max(0.0001, parseFloat(entryInput.value) || 1);
      const sl = Math.max(0.0001, parseFloat(slInput.value) || 1);
      const tp = Math.max(0.0001, parseFloat(tpInput?.value || 1));
      const leverage = Math.max(1, parseInt(levInput?.value || 1, 10));

      if (levLabel) levLabel.textContent = `${leverage}x`;

      const riskDollar = capital * (riskPct / 100);
      const slDistance = Math.abs(entry - sl);
      const tpDistance = Math.abs(tp - entry);

      let units = 0;
      if (slDistance > 0) {
        units = riskDollar / slDistance;
      }

      const totalValue = units * entry;
      const marginReq = totalValue / leverage;
      const rewardDollar = units * tpDistance;
      const rrRatio = riskDollar > 0 ? (rewardDollar / riskDollar) : 0;

      // Estimated liquidation price
      // For Long (entry > sl): entry * (1 - (0.90 / leverage))
      // For Short (entry < sl): entry * (1 + (0.90 / leverage))
      const isLong = entry >= sl;
      let estLiq = 0;
      if (isLong) {
        estLiq = Math.max(0, entry * (1 - (0.90 / leverage)));
      } else {
        estLiq = entry * (1 + (0.90 / leverage));
      }

      if (outRiskDollar) outRiskDollar.textContent = `$${riskDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (outUnits) outUnits.textContent = units >= 100 ? units.toFixed(2) : units.toFixed(4);
      if (outTotalValue) outTotalValue.textContent = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (outMargin) outMargin.textContent = `$${marginReq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (outRewardDollar) {
        const sign = tp >= entry ? '+' : '-';
        outRewardDollar.textContent = `${sign}$${rewardDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (outRR) {
        outRR.textContent = `1 : ${rrRatio.toFixed(2)}`;
        if (rrRatio >= 2.0) {
          outRR.className = 'text-sm font-bold text-emerald-400';
        } else if (rrRatio >= 1.0) {
          outRR.className = 'text-sm font-bold text-[#FFA500]';
        } else {
          outRR.className = 'text-sm font-bold text-rose-400';
        }
      }
      if (outLiq) {
        outLiq.textContent = `$${estLiq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      if (verdictText) {
        if (marginReq > capital) {
          verdictText.innerHTML = `<span class="text-rose-400 font-bold">⚠️ Margin required ($${marginReq.toFixed(0)}) exceeds account balance ($${capital.toFixed(0)}). Reduce position size or increase leverage cautiously!</span>`;
        } else if (rrRatio < 1.0) {
          verdictText.innerHTML = `<span class="text-rose-400 font-bold">⚠️ Sub-optimal R:R (1:${rrRatio.toFixed(2)}). Risking more than reward leads to negative expectancy over time.</span>`;
        } else if (rrRatio < 1.5) {
          verdictText.innerHTML = `<span class="text-amber-400 font-bold">⚡ Moderate Setup: 1:${rrRatio.toFixed(2)} R:R requires >50% win rate to stay profitable.</span>`;
        } else {
          verdictText.innerHTML = `<span class="text-[#00d4d4] font-bold">✅ Institutional Grade: 1:${rrRatio.toFixed(2)} R:R with strictly capped ${(riskPct).toFixed(1)}% risk ($${riskDollar.toFixed(0)}).</span>`;
        }
      }
    };

    [capitalInput, riskPctInput, entryInput, slInput, tpInput].forEach(inp => {
      if (inp) inp.addEventListener('input', computeMath);
    });

    if (levInput) {
      levInput.addEventListener('input', computeMath);
    }

    // Initial computation
    computeMath();
  }

  /* ==========================================================================
     ADVANCED FULL-FLEDGED MODALS: EXCHANGE API, BACKTESTER, NEWS & MACRO
     ========================================================================== */
  initModalsAndTools() {
    this.updateHeaderApiStatus();

    // Exchange API Modal Save / Test
    const apiSaveBtn = document.getElementById('api-save-btn');
    if (apiSaveBtn) {
      apiSaveBtn.addEventListener('click', async () => {
        const broker = document.getElementById('api-broker-select')?.value || 'binance';
        const apiKey = document.getElementById('api-key-input')?.value || '';
        const secretKey = document.getElementById('api-secret-input')?.value || '';
        const resultEl = document.getElementById('api-test-result');

        if (resultEl) {
          resultEl.className = 'p-3 rounded-lg bg-slate-900/90 border border-[#87CEEB]/40 font-mono text-[11px] block';
          resultEl.innerHTML = `<span class="text-[#87CEEB]">Testing low-latency handshake to ${broker.toUpperCase()} gateway...</span>`;
        }

        const res = await window.tradeState.testBrokerConnection({
          broker,
          apiKey,
          secretKey,
          mode: this.apiActiveMode || 'simulated'
        });

        if (res.success) {
          if (resultEl) {
            resultEl.className = 'p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 font-mono text-[11px] text-emerald-300 block';
            resultEl.innerHTML = `
              <div class="font-bold mb-1">✅ ${res.message}</div>
              <div>• Latency: <b>${res.latency}ms</b></div>
              <div>• Verified Permissions: ${res.permissions.join(', ')}</div>
            `;
          }
          this.updateHeaderApiStatus();
          showToast(`Connected to ${broker.toUpperCase()} API!`, 'success');
        } else {
          if (resultEl) {
            resultEl.className = 'p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 font-mono text-[11px] text-rose-300 block';
            resultEl.innerHTML = `❌ ${res.message}`;
          }
          showToast(res.message, 'error');
        }
      });
    }

    // Exchange API Disconnect
    const apiDiscBtn = document.getElementById('api-disconnect-btn');
    if (apiDiscBtn) {
      apiDiscBtn.addEventListener('click', () => {
        window.tradeState.saveApiConfig({ apiKey: '', secretKey: '', status: 'simulated', mode: 'simulated' });
        const keyInp = document.getElementById('api-key-input');
        const secInp = document.getElementById('api-secret-input');
        if (keyInp) keyInp.value = '';
        if (secInp) secInp.value = '';
        const resultEl = document.getElementById('api-test-result');
        if (resultEl) resultEl.className = 'hidden';
        this.updateHeaderApiStatus();
        showToast('API credentials reset to default Paper Trading mode.', 'info');
      });
    }

    // Exchange API Mode Switchers (Simulated vs Live)
    const modeSimBtn = document.getElementById('api-mode-sim-btn');
    const modeLiveBtn = document.getElementById('api-mode-live-btn');
    const modeDesc = document.getElementById('api-mode-desc');

    this.apiActiveMode = window.tradeState?.apiConfig?.mode || 'simulated';

    if (modeSimBtn && modeLiveBtn) {
      modeSimBtn.addEventListener('click', () => {
        this.apiActiveMode = 'simulated';
        modeSimBtn.className = 'px-3 py-1 rounded bg-[#008080] text-white font-bold transition';
        modeLiveBtn.className = 'px-3 py-1 rounded text-slate-400 hover:text-white transition';
        if (modeDesc) modeDesc.textContent = 'Currently in Paper Simulation ($100k risk-free)';
        window.tradeState.saveApiConfig({ mode: 'simulated' });
        this.updateHeaderApiStatus();
      });

      modeLiveBtn.addEventListener('click', () => {
        this.apiActiveMode = 'live';
        modeLiveBtn.className = 'px-3 py-1 rounded bg-[#FFA500] text-[#0a0d10] font-bold transition';
        modeSimBtn.className = 'px-3 py-1 rounded text-slate-400 hover:text-white transition';
        if (modeDesc) modeDesc.textContent = '⚡ Live Exchange API execution activated!';
        window.tradeState.saveApiConfig({ mode: 'live' });
        this.updateHeaderApiStatus();
      });
    }

    // Strategy Backtester Run Button
    const btRunBtn = document.getElementById('bt-run-btn');
    if (btRunBtn) {
      btRunBtn.addEventListener('click', () => {
        const strategyKey = document.getElementById('bt-strategy-select')?.value || 'supertrend';
        const symbol = document.getElementById('bt-asset-select')?.value || window.tradeState?.activeAsset || 'BTC/USD';
        const timeframe = document.getElementById('bt-tf-select')?.value || '5M';

        if (window.strategyBacktester) {
          const res = window.strategyBacktester.runBacktest({ strategyKey, symbol, timeframe });
          if (res) {
            const retEl = document.getElementById('bt-out-return');
            const winEl = document.getElementById('bt-out-winrate');
            const trdEl = document.getElementById('bt-out-trades');
            const pfEl = document.getElementById('bt-out-pf');
            const ddEl = document.getElementById('bt-out-dd');
            const endEl = document.getElementById('bt-out-end-capital');

            if (retEl) {
              retEl.textContent = `${res.netReturnPct >= 0 ? '+' : ''}${res.netReturnPct}%`;
              retEl.className = res.netReturnPct >= 0 ? 'text-base font-bold text-[#00d4d4]' : 'text-base font-bold text-rose-400';
            }
            if (winEl) winEl.textContent = `${res.winRatePct}%`;
            if (trdEl) trdEl.textContent = res.totalTrades;
            if (pfEl) pfEl.textContent = res.profitFactor;
            if (ddEl) ddEl.textContent = `-${res.maxDrawdownPct}%`;
            if (endEl) endEl.textContent = `Final: $${res.endingCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            showToast(`Backtest completed: ${res.totalTrades} trades simulated!`, 'success');
          }
        }
      });
    }

    // News & Macro Calendar Tab Switching
    const tabNews = document.getElementById('tab-news-wire');
    const tabCal = document.getElementById('tab-macro-cal');
    const newsContainer = document.getElementById('news-wire-container');
    const calContainer = document.getElementById('macro-cal-container');

    if (tabNews && tabCal && newsContainer && calContainer) {
      tabNews.addEventListener('click', () => {
        tabNews.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#008080] text-white transition';
        tabCal.className = 'px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-900 transition';
        newsContainer.classList.remove('hidden');
        calContainer.classList.add('hidden');
      });

      tabCal.addEventListener('click', () => {
        tabCal.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#008080] text-white transition';
        tabNews.className = 'px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-900 transition';
        calContainer.classList.remove('hidden');
        newsContainer.classList.add('hidden');
      });
    }
  }

  updateHeaderApiStatus() {
    const pill = document.getElementById('header-api-status-pill');
    if (!pill || !window.tradeState) return;

    const config = window.tradeState.apiConfig;
    if (config.mode === 'live' && config.status === 'connected') {
      pill.textContent = `LIVE: ${config.broker.toUpperCase()}`;
      pill.className = 'text-[#FFA500] font-mono text-[11px] font-bold';
    } else {
      pill.textContent = 'PAPER API ($100K)';
      pill.className = 'text-[#00d4d4] font-mono text-[11px]';
    }
  }

  populateApiModal() {
    if (!window.tradeState) return;
    const config = window.tradeState.apiConfig;
    const brokerSel = document.getElementById('api-broker-select');
    const keyInp = document.getElementById('api-key-input');
    const secInp = document.getElementById('api-secret-input');
    if (brokerSel) brokerSel.value = config.broker || 'binance';
    if (keyInp) keyInp.value = config.apiKey || '';
    if (secInp) secInp.value = config.secretKey || '';
  }

  renderNewsAndCalendar() {
    if (!window.tradeState) return;
    const newsContainer = document.getElementById('news-wire-container');
    const calContainer = document.getElementById('macro-cal-container');

    if (newsContainer) {
      newsContainer.innerHTML = window.tradeState.financialNews.map(item => `
        <div class="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${item.category === 'Crypto' ? 'bg-[#008080]/20 text-[#00d4d4]' : 'bg-[#FFA500]/20 text-[#FFA500]'} font-mono">${item.category}</span>
            <span class="text-[10px] text-slate-500 font-mono">${item.time}</span>
          </div>
          <p class="text-xs text-slate-200 font-medium leading-relaxed">${item.title}</p>
        </div>
      `).join('');
    }

    if (calContainer) {
      calContainer.innerHTML = window.tradeState.macroCalendar.map(evt => `
        <div class="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${evt.impact === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300'} font-mono">${evt.impact} IMPACT</span>
              <span class="text-xs font-bold text-white">${evt.title}</span>
            </div>
            <span class="text-[10px] text-[#87CEEB] font-mono">${evt.date}</span>
          </div>
          <div class="grid grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/50 p-2 rounded-lg border border-white/5">
            <div><span class="text-slate-500">Currency:</span> <b class="text-white">${evt.currency}</b></div>
            <div><span class="text-slate-500">Forecast:</span> <b class="text-[#00d4d4]">${evt.forecast}</b></div>
            <div><span class="text-slate-500">Previous:</span> <b class="text-slate-300">${evt.previous}</b></div>
            <div><span class="text-slate-500">Consensus:</span> <b class="text-emerald-400">${evt.sentiment}</b></div>
          </div>
        </div>
      `).join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
  window.renderOrderBook = () => window.appController.renderOrderBook();
  window.renderPositionsTable = () => window.appController.updatePositionsTable();
});
