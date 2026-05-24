/**
 * Pure SVG charts — no canvas.
 */
const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, children) {
  const node = document.createElementNS(NS, name);
  if (attrs) {
    Object.keys(attrs).forEach((k) => {
      if (attrs[k] !== undefined && attrs[k] !== null)
        node.setAttribute(k, String(attrs[k]));
    });
  }
  (children || []).forEach((c) => {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  });
  return node;
}

/**
 * @param {HTMLElement} container
 * @param {{ label: string, value: number }[]} series
 */
export function renderXpLineChart(container, series) {
  container.innerHTML = '';
  container.setAttribute('role', 'img');
  const W = 420;
  const H = 220;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 40;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (!series?.length) {
    container.appendChild(
      el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, [
        el('text', {
          x: W / 2,
          y: H / 2,
          'text-anchor': 'middle',
          fill: 'var(--muted)',
          'font-size': '14',
        }),
      ])
    );
    container.querySelector('text').textContent = 'No XP transactions to plot';
    container.setAttribute(
      'aria-label',
      'XP over time: no transactions to display'
    );
    return;
  }

  let cumulative = 0;
  const points = series.map((row) => {
    cumulative += row.value;
    return { label: row.label, y: cumulative };
  });

  const maxY = Math.max(...points.map((p) => p.y), 1);
  const minY = 0;
  const n = points.length;
  const xAt = (i) => padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const yAt = (v) => padT + innerH - (innerH * (v - minY)) / (maxY - minY);

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.y)}`)
    .join(' ');

  const dots = points.map((_, i) =>
    el('circle', {
      cx: xAt(i),
      cy: yAt(points[i].y),
      r: 4,
      fill: 'var(--chart-line)',
      stroke: 'var(--surface)',
      'stroke-width': 2,
    })
  );

  const svg = el(
    'svg',
    { width: '100%', height: H, viewBox: `0 0 ${W} ${H}` },
    [
      el('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent' }),
      el('line', {
        x1: padL,
        y1: padT,
        x2: padL,
        y2: padT + innerH,
        stroke: 'var(--border)',
        'stroke-width': 1,
      }),
      el('line', {
        x1: padL,
        y1: padT + innerH,
        x2: padL + innerW,
        y2: padT + innerH,
        stroke: 'var(--border)',
        'stroke-width': 1,
      }),
      el('path', {
        d: pathD,
        fill: 'none',
        stroke: 'var(--chart-line)',
        'stroke-width': 2.5,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      }),
      ...dots,
      el('text', {
        x: 8,
        y: padT + 12,
        fill: 'var(--muted)',
        'font-size': '11',
      }),
    ]
  );
  svg.querySelectorAll('text')[0].textContent = `max ${maxY} XP`;

  const last = points[n - 1];
  const endLabel = el('text', {
    x: xAt(n - 1),
    y: yAt(last.y) - 10,
    'text-anchor': 'middle',
    fill: 'var(--text)',
    'font-size': '11',
  });
  endLabel.textContent = String(last.y);
  svg.appendChild(endLabel);
  container.appendChild(svg);
  container.setAttribute(
    'aria-label',
    `XP over time: cumulative total ${last.y} across ${n} transactions`
  );
}

/**
 * @param {HTMLElement} container
 * @param {{ label: string, value: number, color: string }[]} segments
 */
export function renderDonutChart(container, segments) {
  container.innerHTML = '';
  container.setAttribute('role', 'img');
  const W = 280;
  const H = 240;
  const cx = W / 2;
  const cy = H / 2 - 10;
  const rOuter = 72;
  const rInner = 44;

  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    container.appendChild(
      el('svg', { width: '100%', height: H, viewBox: `0 0 ${W} ${H}` }, [
        el('text', {
          x: cx,
          y: cy,
          'text-anchor': 'middle',
          fill: 'var(--muted)',
          'font-size': '14',
        }),
      ])
    );
    container.querySelector('text').textContent = 'No graded projects yet';
    container.setAttribute(
      'aria-label',
      'Pass versus fail: no graded projects yet'
    );
    return;
  }

  let angle = -Math.PI / 2;
  const arcs = [];
  segments.forEach((seg) => {
    const slice = (seg.value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + slice;
    const x0o = cx + rOuter * Math.cos(a0);
    const y0o = cy + rOuter * Math.sin(a0);
    const x1o = cx + rOuter * Math.cos(a1);
    const y1o = cy + rOuter * Math.sin(a1);
    const x0i = cx + rInner * Math.cos(a0);
    const y0i = cy + rInner * Math.sin(a0);
    const x1i = cx + rInner * Math.cos(a1);
    const y1i = cy + rInner * Math.sin(a1);
    const large = slice > Math.PI ? 1 : 0;
    const d = [
      `M ${x0o} ${y0o}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o}`,
      `L ${x1i} ${y1i}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i}`,
      'Z',
    ].join(' ');
    arcs.push(
      el('path', {
        d,
        fill: seg.color,
        stroke: 'var(--surface)',
        'stroke-width': 2,
      })
    );
    angle = a1;
  });

  const svg = el('svg', { width: '100%', height: H, viewBox: `0 0 ${W} ${H}` }, [
    el('g', {}, arcs),
    el('text', {
      x: cx,
      y: cy + 5,
      'text-anchor': 'middle',
      fill: 'var(--text)',
      'font-size': '18',
      'font-weight': '600',
    }),
  ]);
  svg.querySelectorAll('text')[0].textContent = String(total);

  const legendY0 = H - 36;
  segments.forEach((seg, i) => {
    const ly = legendY0 + i * 18;
    svg.appendChild(
      el('rect', {
        x: 24,
        y: ly - 8,
        width: 12,
        height: 12,
        rx: 2,
        fill: seg.color,
      })
    );
    const label = el('text', {
      x: 44,
      y: ly + 2,
      fill: 'var(--text)',
      'font-size': '12',
    });
    label.textContent = `${seg.label} (${seg.value})`;
    svg.appendChild(label);
  });

  container.appendChild(svg);
  const summary = segments
    .map((s) => `${s.label} ${s.value}`)
    .join(', ');
  container.setAttribute(
    'aria-label',
    `Pass versus fail: ${total} projects total, ${summary}`
  );
}
