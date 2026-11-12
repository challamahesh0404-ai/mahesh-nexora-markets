/**
 * AuraTrade - Options Matrix & Strategy Payoff Visualizer
 * Comprehensive Options Chain (Greeks, IV, Strikes) + Interactive Payoff Visualizer for both beginners & pros.
 */

class OptionsEngine {
  constructor() {
    this.selectedExpiry = 14; // days to expiry
    this.selectedStrategy = 'longCall';
    this.simulatedPrice = null;
    this.payoffCanvas = document.getElementById('optionsPayoffChart');
    this.ctx = this.payoffCanvas ? this.payoffCanvas.getContext('2d') : null;

    // Strategies Configuration
    this.strategies = {
      longCall: {
        name: 'Long Call',
        badge: 'Bullish • Defined Risk',
        desc: 'You buy a Call option expecting the asset to rally sharply. Your maximum loss is limited to the premium paid, while potential upside profit is theoretically unlimited.',
        legs: [{ type: 'Call', strikeOffset: 0, premiumOffset: 0.035, qty: 1 }]
      },
      longPut: {
        name: 'Long Put',
        badge: 'Bearish • Defined Risk',
        desc: 'You buy a Put option to profit from a price plunge or insure existing assets. Profit increases as the price drops towards zero. Risk is limited to the premium paid.',
        legs: [{ type: 'Put', strikeOffset: 0, premiumOffset: 0.035, qty: 1 }]
      },
      bullCallSpread: {
        name: 'Bull Call Spread',
        badge: 'Moderate Bullish • High Win Rate',
        desc: 'Buy an At-The-Money Call and Sell an Out-of-The-Money Call to reduce entry cost. Caps maximum profit in exchange for cheaper trade cost.',
        legs: [
          { type: 'Call', strikeOffset: 0, premiumOffset: 0.035, qty: 1 },
          { type: 'Call', strikeOffset: 0.05, premiumOffset: 0.015, qty: -1 }
        ]
      },
      bearPutSpread: {
        name: 'Bear Put Spread',
        badge: 'Moderate Bearish • Cost Efficient',
        desc: 'Buy an ATM Put and Sell an OTM Put. Generates solid returns on downward moves with strictly limited maximum loss.',
        legs: [
          { type: 'Put', strikeOffset: 0, premiumOffset: 0.035, qty: 1 },
          { type: 'Put', strikeOffset: -0.05, premiumOffset: 0.015, qty: -1 }
        ]
      },
      longStraddle: {
        name: 'Long Straddle',
        badge: 'High Volatility • Any Direction',
        desc: 'Buy both a Call and Put at the exact same strike. You profit massively if the market breaks out violently in EITHER direction (e.g. before earnings or Fed rate cuts).',
        legs: [
          { type: 'Call', strikeOffset: 0, premiumOffset: 0.035, qty: 1 },
          { type: 'Put', strikeOffset: 0, premiumOffset: 0.035, qty: 1 }
        ]
      },
      ironCondor: {
        name: 'Iron Condor',
        badge: 'Range-Bound • Income Generation',
        desc: 'A favorite pro strategy! Sell an OTM Put Spread and Sell an OTM Call Spread. You collect full profits if the price remains calm within the target channel until expiry.',
        legs: [
          { type: 'Put', strikeOffset: -0.06, premiumOffset: 0.01, qty: 1 },
          { type: 'Put', strikeOffset: -0.03, premiumOffset: 0.025, qty: -1 },
          { type: 'Call', strikeOffset: 0.03, premiumOffset: 0.025, qty: -1 },
          { type: 'Call', strikeOffset: 0.06, premiumOffset: 0.01, qty: 1 }
        ]
      }
    };

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resizePayoffCanvas());

    if (this.payoffCanvas) {
      this.payoffCanvas.addEventListener('mousemove', (e) => {
        const rect = this.payoffCanvas.getBoundingClientRect();
        this.crosshairX = e.clientX - rect.left;
        this.renderPayoff();
      });

      this.payoffCanvas.addEventListener('mouseleave', () => {
        this.crosshairX = null;
        this.renderPayoff();
      });
    }

    if (window.tradeState) {
      window.tradeState.subscribe((event) => {
        if (event === 'tick' || event === 'assetChange') {
          this.renderOptionsChain();
          this.renderPayoff();
        }
      });
    }
  }

  selectStrategy(key) {
    if (this.strategies[key]) {
      this.selectedStrategy = key;
      this.renderPayoff();

      // Update button active styles
      document.querySelectorAll('.strategy-pill').forEach(btn => {
        if (btn.dataset.strategy === key) {
          btn.classList.add('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold', 'shadow-md');
          btn.classList.remove('text-slate-300', 'bg-slate-800');
        } else {
          btn.classList.remove('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold', 'shadow-md');
          btn.classList.add('text-slate-300', 'bg-slate-800');
        }
      });

      // Update Strategy Details card
      const st = this.strategies[key];
      const descBox = document.getElementById('strategy-desc-box');
      if (descBox) {
        descBox.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-[#87CEEB] font-bold text-lg">${st.name}</h4>
            <span class="teal-badge text-xs px-2.5 py-1 rounded-full">${st.badge}</span>
          </div>
          <p class="text-slate-300 text-sm leading-relaxed">${st.desc}</p>
        `;
      }
    }
  }

  setExpiry(days) {
    this.selectedExpiry = Number(days);
    this.renderOptionsChain();
    this.renderPayoff();
  }

  // Generate strikes based on current price
  getOptionsChainData() {
    const asset = window.tradeState.getAsset();
    const currentPrice = asset.price;
    const strikes = [];
    const count = 9; // 9 strikes: 4 OTM, 1 ATM, 4 ITM

    // Step size based on price
    let step = 1;
    if (currentPrice > 10000) step = 1000;
    else if (currentPrice > 1000) step = 50;
    else if (currentPrice > 200) step = 5;
    else if (currentPrice > 50) step = 2.5;

    const atmStrike = Math.round(currentPrice / step) * step;

    for (let i = -4; i <= 4; i++) {
      const strike = atmStrike + i * step;
      const isCallITM = currentPrice >= strike;
      const isPutITM = currentPrice <= strike;

      // Distance from strike
      const distPct = (currentPrice - strike) / currentPrice;

      // Approximate Black-Scholes Greeks and Premiums
      const baseIV = (asset.volatility * Math.sqrt(365) * 100).toFixed(1);
      const callDelta = Math.min(0.99, Math.max(0.01, 0.5 + distPct * 2.5)).toFixed(2);
      const putDelta = -(1 - callDelta).toFixed(2);
      const theta = (-((asset.price * 0.0006) / Math.sqrt(this.selectedExpiry))).toFixed(2);
      const gamma = (0.005 / (Math.abs(distPct) + 0.1)).toFixed(3);

      // Theoretical Call & Put prices
      const intrinsicCall = Math.max(0, currentPrice - strike);
      const timeVal = Math.max(0.5, currentPrice * 0.025 * Math.sqrt(this.selectedExpiry / 30));
      const callMid = Math.max(0.1, intrinsicCall + timeVal * (1 - Math.abs(distPct) * 1.5));
      const callBid = (callMid * 0.98).toFixed(2);
      const callAsk = (callMid * 1.02).toFixed(2);

      const intrinsicPut = Math.max(0, strike - currentPrice);
      const putMid = Math.max(0.1, intrinsicPut + timeVal * (1 - Math.abs(distPct) * 1.5));
      const putBid = (putMid * 0.98).toFixed(2);
      const putAsk = (putMid * 1.02).toFixed(2);

      strikes.push({
        strike,
        isCallITM,
        isPutITM,
        call: {
          bid: callBid,
          ask: callAsk,
          delta: callDelta,
          gamma,
          theta,
          iv: `${baseIV}%`,
          vol: Math.floor(Math.random() * 400 + 50),
          oi: Math.floor(Math.random() * 2000 + 400)
        },
        put: {
          bid: putBid,
          ask: putAsk,
          delta: putDelta,
          gamma,
          theta,
          iv: `${baseIV}%`,
          vol: Math.floor(Math.random() * 350 + 40),
          oi: Math.floor(Math.random() * 1800 + 350)
        }
      });
    }

    return { strikes, currentPrice, asset };
  }

  renderOptionsChain() {
    const tableBody = document.getElementById('options-chain-tbody');
    if (!tableBody) return;

    const data = this.getOptionsChainData();
    let html = '';

    data.strikes.forEach(s => {
      const isATM = Math.abs(s.strike - data.currentPrice) < (data.currentPrice * 0.008);
      const atmHighlight = isATM ? 'ring-1 ring-[#87CEEB] bg-[#87CEEB]/10' : '';

      html += `
        <tr class="hover:bg-slate-800/60 transition ${atmHighlight}">
          <!-- CALLS (LEFT - TEAL) -->
          <td class="text-xs text-slate-400 text-left pl-3">${s.call.oi}</td>
          <td class="text-xs text-slate-400">${s.call.vol}</td>
          <td class="text-xs text-purple-400">${s.call.iv}</td>
          <td class="text-xs text-[#87CEEB]">${s.call.delta}</td>
          <td class="text-xs text-[#00d4d4] font-mono">${s.call.bid}</td>
          <td class="text-xs text-[#00d4d4] font-mono font-bold pr-2">
            <button onclick="tradeState.executeTrade({ symbol: '${data.asset.name}', type: 'BUY', amount: ${Math.round(s.call.ask * 100)}, orderMode: 'Call Option Strike ${s.strike}' })" class="hover:underline bg-[#008080]/25 text-[#00d4d4] px-2 py-0.5 rounded transition hover:bg-[#008080]/45">
              ${s.call.ask}
            </button>
          </td>

          <!-- STRIKE (CENTER - SKYLINE BLUE) -->
          <td class="options-strike-cell text-sm font-bold px-3 ${isATM ? 'text-[#87CEEB]' : 'text-[#FDFDFD]'}">
            $${s.strike.toLocaleString()}
            ${isATM ? '<span class="text-[9px] block text-[#87CEEB] uppercase">ATM</span>' : ''}
          </td>

          <!-- PUTS (RIGHT - ORANGE) -->
          <td class="text-xs text-[#FFA500] font-mono font-bold pl-2">
            <button onclick="tradeState.executeTrade({ symbol: '${data.asset.name}', type: 'SELL', amount: ${Math.round(s.put.ask * 100)}, orderMode: 'Put Option Strike ${s.strike}' })" class="hover:underline bg-[#FFA500]/25 text-[#FFA500] px-2 py-0.5 rounded transition hover:bg-[#FFA500]/45">
              ${s.put.ask}
            </button>
          </td>
          <td class="text-xs text-[#FFA500] font-mono">${s.put.bid}</td>
          <td class="text-xs text-[#87CEEB]">${s.put.delta}</td>
          <td class="text-xs text-purple-400">${s.put.iv}</td>
          <td class="text-xs text-slate-400">${s.put.vol}</td>
          <td class="text-xs text-slate-400 text-right pr-3">${s.put.oi}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  resizePayoffCanvas() {
    if (!this.payoffCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.payoffCanvas.parentElement.getBoundingClientRect();
    this.payoffW = rect.width;
    this.payoffH = 260;

    this.payoffCanvas.width = this.payoffW * dpr;
    this.payoffCanvas.height = this.payoffH * dpr;
    this.payoffCanvas.style.width = `${this.payoffW}px`;
    this.payoffCanvas.style.height = `${this.payoffH}px`;
    this.ctx.scale(dpr, dpr);

    this.renderPayoff();
  }

  // Draw the strategy payoff curve
  renderPayoff() {
    if (!this.payoffCanvas || !this.ctx || !window.tradeState) return;

    const ctx = this.ctx;
    const w = this.payoffW;
    const h = this.payoffH;
    const asset = window.tradeState.getAsset();
    const currentPrice = asset.price;
    const strategy = this.strategies[this.selectedStrategy];
    if (!strategy) return;

    // Clear canvas
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 50;
    const padRight = 50;
    const padY = 30;
    const chartW = w - padLeft - padRight;
    const chartH = h - padY * 2;

    // Price simulation range: -15% to +15%
    const minP = currentPrice * 0.85;
    const maxP = currentPrice * 1.15;
    const priceRange = maxP - minP;

    // Calculate PnL curve points
    const points = [];
    const sampleCount = 60;
    let minPnl = Infinity;
    let maxPnl = -Infinity;

    for (let i = 0; i <= sampleCount; i++) {
      const p = minP + (priceRange / sampleCount) * i;
      let totalPnl = 0;

      strategy.legs.forEach(leg => {
        const strike = currentPrice * (1 + leg.strikeOffset);
        const premium = currentPrice * leg.premiumOffset;

        let payoffAtExpiry = 0;
        if (leg.type === 'Call') {
          payoffAtExpiry = Math.max(0, p - strike);
        } else {
          payoffAtExpiry = Math.max(0, strike - p);
        }

        const legPnl = (payoffAtExpiry - premium) * leg.qty * 10; // 10 contracts
        totalPnl += legPnl;
      });

      if (totalPnl < minPnl) minPnl = totalPnl;
      if (totalPnl > maxPnl) maxPnl = totalPnl;
      points.push({ price: p, pnl: totalPnl });
    }

    // Dynamic scale around zero
    const maxAbsPnl = Math.max(Math.abs(minPnl), Math.abs(maxPnl), 500) * 1.15;
    const getY = (pnl) => padY + chartH / 2 - (pnl / maxAbsPnl) * (chartH / 2);
    const getX = (price) => padLeft + ((price - minP) / priceRange) * chartW;

    // Zero PnL Reference Line (Breakeven Axis)
    const zeroY = getY(0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(w - padRight, zeroY);
    ctx.stroke();

    // Zero label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('$0', padLeft - 8, zeroY + 3.5);

    // Current Price Vertical Line (Skyline Blue)
    const currentPriceX = getX(currentPrice);
    ctx.strokeStyle = 'rgba(135, 206, 235, 0.75)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(currentPriceX, padY);
    ctx.lineTo(currentPriceX, h - padY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current Price Tag (Skyline Blue)
    ctx.fillStyle = '#87CEEB';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Current: $${currentPrice.toFixed(asset.decimals)}`, currentPriceX, padY - 10);

    // Fill Profit / Loss Shading
    // Profit zone (Teal #008080)
    ctx.fillStyle = 'rgba(0, 128, 128, 0.25)';
    ctx.beginPath();
    ctx.moveTo(getX(points[0].price), zeroY);
    points.forEach(pt => {
      const y = Math.min(zeroY, getY(pt.pnl));
      ctx.lineTo(getX(pt.price), y);
    });
    ctx.lineTo(getX(points[points.length - 1].price), zeroY);
    ctx.closePath();
    ctx.fill();

    // Loss zone (Orange #FFA500)
    ctx.fillStyle = 'rgba(255, 165, 0, 0.22)';
    ctx.beginPath();
    ctx.moveTo(getX(points[0].price), zeroY);
    points.forEach(pt => {
      const y = Math.max(zeroY, getY(pt.pnl));
      ctx.lineTo(getX(pt.price), y);
    });
    ctx.lineTo(getX(points[points.length - 1].price), zeroY);
    ctx.closePath();
    ctx.fill();

    // Draw Payoff Curve Line (Skyline Blue)
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = getX(pt.price);
      const y = getY(pt.pnl);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Update Max Profit / Loss HUD stats
    const maxPnlLabel = document.getElementById('payoff-max-profit');
    const maxLossLabel = document.getElementById('payoff-max-loss');
    const breakevenLabel = document.getElementById('payoff-breakeven');

    if (maxPnlLabel) {
      maxPnlLabel.textContent = maxPnl > 50000 ? 'Unlimited' : `+$${Math.round(maxPnl).toLocaleString()}`;
    }
    if (maxLossLabel) {
      maxLossLabel.textContent = `-$${Math.abs(Math.round(minPnl)).toLocaleString()}`;
    }
    if (breakevenLabel) {
      // Find breakeven where sign flips
      const bePoints = [];
      for (let i = 1; i < points.length; i++) {
        if ((points[i].pnl >= 0 && points[i - 1].pnl < 0) || (points[i].pnl <= 0 && points[i - 1].pnl > 0)) {
          bePoints.push(points[i].price.toFixed(asset.decimals));
        }
      }
      breakevenLabel.textContent = bePoints.length > 0 ? bePoints.map(p => `$${p}`).join(' / ') : '$' + currentPrice.toFixed(asset.decimals);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.optionsEngine = new OptionsEngine();
  window.renderOptionsPayoff = () => window.optionsEngine.resizePayoffCanvas();
  window.renderOptionsChain = () => window.optionsEngine.renderOptionsChain();
  window.optionsEngine.renderOptionsChain();
  window.optionsEngine.resizePayoffCanvas();
});
