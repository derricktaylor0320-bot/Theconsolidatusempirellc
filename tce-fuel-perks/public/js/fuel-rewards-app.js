let programConfig = null;
let activeSection = 'overview';

const TIER_COLORS = {
  member: { badge: 'background:#94a3b8;color:#0f172a', border: '#94a3b8' },
  starter: { badge: 'background:#34d399;color:#064e3b', border: '#34d399' },
  pro: { badge: 'background:#38bdf8;color:#0c4a6e', border: '#38bdf8' },
  elite: { badge: 'background:#ffd700;color:#001f3f', border: '#ffd700' },
};

async function loadConfig() {
  const res = await fetch('api/config');
  programConfig = await res.json();
  renderPage();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

function setSection(section) {
  activeSection = section;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
  document.getElementById('overviewSection').classList.toggle('hidden', section !== 'overview');
  document.getElementById('marketingSection').classList.toggle('hidden', section !== 'marketing');
}

function openGuide(guideId) {
  const guide = programConfig.featureGuides.find((g) => g.id === guideId);
  if (!guide) return;

  document.getElementById('modalTitle').textContent = guide.title;
  document.getElementById('modalSubtitle').textContent = guide.subtitle;
  document.getElementById('modalSteps').innerHTML = guide.steps
    .map(
      (step, i) => `
      <li>
        <span class="step-num">${i + 1}</span>
        <span>${esc(step)}</span>
      </li>`,
    )
    .join('');

  const proTip = document.getElementById('modalProTip');
  if (guide.proTip) {
    proTip.innerHTML = `<strong>Pro Tip</strong>${esc(guide.proTip)}`;
    proTip.classList.remove('hidden');
  } else {
    proTip.classList.add('hidden');
  }

  const links = document.getElementById('modalLinks');
  links.innerHTML = '';
  if (guide.marketingMaterialId) {
    const btn = document.createElement('a');
    btn.href = `marketing.html#${guide.marketingMaterialId}`;
    btn.className = 'btn';
    btn.textContent = 'Open in Marketing Back Office';
    links.appendChild(btn);
  }
  guide.externalLinks?.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'link-pill';
    a.textContent = `${link.label} →`;
    links.appendChild(a);
  });

  document.getElementById('guideModal').classList.add('open');
}

function closeGuide() {
  document.getElementById('guideModal').classList.remove('open');
}

function openSignupModal(tierId, tierName, monthlyFee) {
  if (tierId === 'member') {
    alert('Member Access is included free with active The FR2P Club membership. Choose a paid tier or join FR2P Club first.');
    return;
  }
  const email = prompt(`Enter your email to join ${tierName} ($${monthlyFee.toFixed(2)}/mo):`);
  if (!email) return;
  const name = prompt('Enter your full name:');

  fetch('api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, tierId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert(`Welcome to ${data.data.tier}!\nYour Member ID is: ${data.data.memberId}\nRedirecting to your back office...`);
        window.location.href = `dashboard.html?id=${data.data.memberId}`;
      } else {
        alert('Error: ' + data.error);
      }
    })
    .catch((err) => console.error(err));
}

function renderFeatureCards() {
  const cards = [
    { id: 'qr-marketing', title: 'QR Code Marketing', desc: 'Place your QR at gas pumps so drivers scan while they wait' },
    { id: 'car-magnets', title: 'Car Magnets', desc: 'Turn your vehicle into a rolling ad with your referral QR' },
    { id: 'station-partnerships', title: 'Station Partnerships', desc: 'Partner with gas station managers to display your sign' },
    { id: 'recurring-commissions', title: 'Potential Recurring Income', desc: 'Potential recurring commissions on active referrals — funded from subscription revenue' },
  ];
  return cards
    .map(
      (c) => `
    <button type="button" class="feature-card" onclick="openGuide('${c.id}')">
      <strong>${esc(c.title)}</strong>
      <span>${esc(c.desc)}</span>
      <em>Tap to see how it works →</em>
    </button>`,
    )
    .join('');
}

function renderPaidTierDiffs() {
  return programConfig.paidTiers
    .map((tier, i) => {
      const badgeStyle = TIER_COLORS[tier.id]?.badge ?? '';
      return `
      <div class="paid-tier-card">
        <span class="tier-badge" style="${badgeStyle}">Tier ${i + 1} · ${esc(tier.priceDisplay)}/mo</span>
        <p style="color:white;font-weight:700;margin:0.25rem 0">${esc(tier.name)}</p>
        <p style="color:#ffd700;font-size:0.8rem;font-weight:600;margin:0 0 0.5rem">${esc(tier.potentialCommissionLabel)}</p>
        <p style="font-size:0.7rem;color:rgba(255,255,255,0.5);margin-bottom:0.75rem">${esc(tier.potentialCommissionDetail)}</p>
        ${tier.vsTierBelow ? `<p style="font-size:0.7rem;color:#34d399;margin:0 0 0.35rem"><strong>↑ vs Tier Below:</strong> ${esc(tier.vsTierBelow)}</p>` : ''}
        ${tier.vsTierAbove ? `<p style="font-size:0.7rem;color:#7dd3fc;margin:0"><strong>↓ vs Tier Above:</strong> ${esc(tier.vsTierAbove)}</p>` : ''}
        ${!tier.vsTierAbove ? '<p style="font-size:0.7rem;color:#ffd700;font-weight:600;margin:0">Highest tier — maximum potential recurring commission share on the platform.</p>' : ''}
      </div>`;
    })
    .join('');
}

function renderTierCards() {
  return programConfig.tiers
    .map((tier) => {
      const colors = TIER_COLORS[tier.id];
      const isIncluded = !tier.isPaidTier;
      const monthlyFee = tier.monthlyFee ?? 0;
      return `
      <article class="tier-card${tier.featured ? ' featured' : ''}" style="border-color:${colors.border}">
        ${tier.featured ? '<span class="tier-badge" style="background:#ffd700;color:#001f3f;display:block;text-align:center;margin-bottom:0.5rem">TOP TIER</span>' : ''}
        <span class="tier-badge" style="${colors.badge}">${esc(tier.tag)}</span>
        <h4>${esc(tier.name)}</h4>
        <div class="tier-price">${esc(tier.price)}${!isIncluded ? '<small>/month</small>' : ''}</div>
        ${!isIncluded ? `<p style="font-size:0.75rem;color:rgba(255,255,255,0.5)">Annual: <strong style="color:white">${esc(tier.annualCost)}</strong>/year</p><p style="font-size:0.65rem;color:rgba(255,255,255,0.4)">${esc(tier.billingNote)}</p>` : `<p style="font-size:0.75rem;color:rgba(255,255,255,0.5)">${esc(tier.billingNote)}</p>`}
        <p style="font-size:0.8rem;color:rgba(255,255,255,0.6)">${esc(tier.description)}</p>
        <div class="commission-box">
          <strong>Potential Recurring Commissions</strong>
          <p style="color:white;font-weight:600">${esc(tier.potentialCommissionLabel)}</p>
          <p>${esc(tier.potentialCommissionDetail)}</p>
        </div>
        <div class="includes-box">
          <h5>What You Get Every Month</h5>
          <ul>${tier.monthlyIncludes.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
        </div>
        <div class="includes-box annual">
          <h5>What You Get Over 12 Months</h5>
          <ul>${tier.annualIncludes.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
        </div>
        <p style="font-size:0.75rem;color:rgba(255,255,255,0.65)"><strong style="color:#ffd700">How Potential Recurring Earnings Work:</strong> ${esc(tier.earnDescription)}</p>
        ${tier.hasMarketingBackOffice ? '<p style="font-size:0.7rem;color:#7dd3fc;background:rgba(14,165,233,0.1);padding:0.5rem;border-radius:0.35rem">✓ Includes Marketing Back Office</p>' : ''}
        <button class="btn full" onclick="openSignupModal('${tier.id}', '${esc(tier.name)}', ${monthlyFee})">
          ${isIncluded ? 'Included With FR2P Membership' : `Subscribe — ${esc(tier.priceDisplay)}/mo`}
        </button>
      </article>`;
    })
    .join('');
}

function renderComparisonTable() {
  const headers = ['Feature', 'Member', '$19.99/mo', '$29.99/mo', '$39.99/mo'];
  const rows = programConfig.tierComparison
    .map(
      (row) => `
    <tr>
      <td>${esc(row[0])}</td>
      <td>${esc(row[1])}</td>
      <td>${esc(row[2])}</td>
      <td>${esc(row[3])}</td>
      <td style="color:#ffd700;font-weight:600">${esc(row[4])}</td>
    </tr>`,
    )
    .join('');
  return `<table class="compare-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderGuideGrid() {
  return programConfig.featureGuides
    .map(
      (guide) => `
    <button type="button" class="feature-card" onclick="openGuide('${guide.id}')">
      <strong>${esc(guide.title)}</strong>
      <span>${esc(guide.subtitle)}</span>
      <em>See how it works →</em>
    </button>`,
    )
    .join('');
}

function renderMarketingMaterials() {
  return programConfig.marketingMaterials
    .map(
      (m) => `
    <div class="marketing-card" id="${esc(m.id)}">
      <div class="category">${esc(m.category)}</div>
      <h4>${esc(m.title)}</h4>
      <p>${esc(m.description)}</p>
      <p style="font-size:0.8rem;color:rgba(255,255,255,0.55)"><em>${esc(m.printNote)}</em></p>
    </div>`,
    )
    .join('');
}

function renderPage() {
  const { platform, programType, payoutExplainer, incomeSteps, stationPlaybook, links } = programConfig;

  document.getElementById('pageTitle').textContent = platform.platformName;
  document.getElementById('heroTitle').textContent = platform.platformName;
  document.getElementById('heroTagline').textContent = platform.tagline;
  document.getElementById('heroBadge').textContent = platform.badge;

  document.getElementById('featureCards').innerHTML = renderFeatureCards();

  document.getElementById('programType').textContent = programType;

  document.getElementById('moneyFlowSteps').innerHTML = payoutExplainer.howMoneyFlows
    .map(
      (step, i) => `
    <li>
      <span class="step-num">${i + 1}</span>
      <span>${esc(step)}</span>
    </li>`,
    )
    .join('');

  document.getElementById('stripeRole').textContent = payoutExplainer.stripeRole;

  document.getElementById('incomeSteps').innerHTML = incomeSteps
    .map(
      (s) => `
    <div class="income-step">
      <div class="num">${s.step}</div>
      <p style="color:white;font-weight:700;margin:0.5rem 0 0.35rem">${esc(s.title)}</p>
      <p style="font-size:0.8rem;color:rgba(255,255,255,0.6);margin:0">${esc(s.desc)}</p>
    </div>`,
    )
    .join('');

  document.getElementById('stationPlaybook').innerHTML = stationPlaybook
    .map((step) => `<li>${esc(step)}</li>`)
    .join('');

  document.getElementById('paidTierDiffs').innerHTML = renderPaidTierDiffs();
  document.getElementById('tierGrid').innerHTML = renderTierCards();
  document.getElementById('comparisonTable').innerHTML = renderComparisonTable();
  document.getElementById('guideGrid').innerHTML = renderGuideGrid();
  document.getElementById('marketingMaterials').innerHTML = renderMarketingMaterials();

  document.getElementById('hiHelloAppStore').href = links.hiHelloAppStore;
  document.getElementById('hiHelloGooglePlay').href = links.hiHelloGooglePlay;
  document.getElementById('gotPrintLink').href = links.gotPrint;
  document.getElementById('vistaPrintLink').href = links.vistaPrint;
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfig().catch((err) => {
    console.error(err);
    document.getElementById('tierGrid').innerHTML =
      '<p class="text-center">Unable to load program content. Please refresh.</p>';
  });

  document.getElementById('guideModal').addEventListener('click', (e) => {
    if (e.target.id === 'guideModal') closeGuide();
  });

  if (window.location.hash === '#marketing') setSection('marketing');
});
