import { renderXpLineChart, renderDonutChart } from '../lib/charts.js';
import { transactionAmount } from '../services/profile.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function renderBasicSection(els, data) {
  const me = data.me;
  els.basicInfo.innerHTML = '';
  const rows = [
    ['Login', me?.login != null ? me.login : '—'],
    ['User id', me?.id != null ? String(me.id) : String(data.userId)],
    [
      'Object',
      data.objects?.[0]
        ? `${data.objects[0].name || '—'} (${data.objects[0].type || '—'})`
        : '—',
    ],
    ['Progress', String(data.progressRows?.length ?? 0)],
  ];
  rows.forEach(([dt, dd]) => {
    const dTerm = document.createElement('dt');
    dTerm.textContent = dt;
    const dDesc = document.createElement('dd');
    dDesc.textContent = dd;
    els.basicInfo.appendChild(dTerm);
    els.basicInfo.appendChild(dDesc);
  });
}

export function renderXpSection(els, data) {
  const total = data.xpSum != null ? Math.round(data.xpSum) : 0;
  els.xpTotal.textContent = String(total);
}

export function renderGradesSection(els, data) {
  const results = data.results || [];
  let pass = 0;
  let fail = 0;
  let other = 0;
  results.forEach((r) => {
    const g = r.grade;
    if (g === 1 || g === true) pass++;
    else if (g === 0 || g === false) fail++;
    else other++;
  });

  els.gradeStats.innerHTML = '';
  [
    { label: 'Passed', value: pass, cls: 'stat-pass' },
    { label: 'Failed', value: fail, cls: 'stat-fail' },
    { label: 'Other', value: other, cls: 'stat-other' },
  ].forEach((s) => {
    const li = document.createElement('li');
    li.className = `stats-item ${s.cls}`;
    const label = document.createElement('span');
    label.className = 'stats-label';
    label.textContent = s.label;
    const value = document.createElement('span');
    value.className = 'stats-value';
    value.textContent = String(s.value);
    li.append(label, value);
    els.gradeStats.appendChild(li);
  });

  els.recentProjects.innerHTML = '';
  const head = document.createElement('h3');
  head.className = 'recent-title';
  head.textContent = 'Recent projects';
  els.recentProjects.appendChild(head);

  const list = document.createElement('ul');
  list.className = 'project-ul';
  const slice = results.slice(-8).reverse();
  if (!slice.length) {
    const li = document.createElement('li');
    li.className = 'project-li muted';
    li.textContent = 'No results.';
    list.appendChild(li);
  } else {
    slice.forEach((r) => {
      const li = document.createElement('li');
      li.className = 'project-li';
      const name =
        (r.object && (r.object.name || r.object.type)) || `Result #${r.id}`;
      const gLabel =
        r.grade === 1 ? 'PASS' : r.grade === 0 ? 'FAIL' : `grade ${r.grade}`;
      const nameEl = document.createElement('span');
      nameEl.className = 'p-name';
      nameEl.textContent = name;
      const gradeEl = document.createElement('span');
      gradeEl.className = `p-grade ${r.grade === 1 ? 'pass' : r.grade === 0 ? 'fail' : ''}`;
      gradeEl.textContent = gLabel;
      li.append(nameEl, gradeEl);
      list.appendChild(li);
    });
  }
  els.recentProjects.appendChild(list);
}

export function renderCharts(els, data) {
  const series = (data.txRows || []).map((r) => ({
    label: formatDate(r.createdAt),
    value: transactionAmount(r),
  }));
  renderXpLineChart(els.chartLine, series);

  const results = data.results || [];
  let pass = 0;
  let fail = 0;
  results.forEach((r) => {
    const g = r.grade;
    if (g === 1 || g === true) pass++;
    else if (g === 0 || g === false) fail++;
  });
  renderDonutChart(els.chartPie, [
    { label: 'Passed', value: pass, color: 'var(--pass)' },
    { label: 'Failed', value: fail, color: 'var(--fail)' },
  ]);
}

export function renderProfile(els, data) {
  renderBasicSection(els, data);
  renderXpSection(els, data);
  renderGradesSection(els, data);
  renderCharts(els, data);
}
