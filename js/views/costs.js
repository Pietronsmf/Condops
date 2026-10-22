/* Custos (síndica) e Transparência (condôminos): gráfico mensal, categorias e lançamentos. */
'use strict';

(function (CO) {
  const { esc, Store, F, K } = CO;
  const icon = (n, c) => CO.icon(n, c);
  const ui = (CO.ui = CO.ui || {});
  ui.cPeriod = ui.cPeriod || 6;
  ui.cCat = ui.cCat || '';
  ui.cAll = ui.cAll || false;

  const PERIODS = [
    { v: 1, label: 'Este mês' },
    { v: 3, label: '3 meses' },
    { v: 6, label: '6 meses' },
    { v: 12, label: '12 meses' },
  ];

  const svgEl = (tag, attrs = {}, text) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text != null) el.textContent = text;
    return el;
  };

  const niceStep = (raw) => {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  };

  const roundedTop = (x, y, w, h, r) => {
    const rr = Math.min(r, h, w / 2);
    return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
  };

  const monthName = (key) => {
    const s = CO.monthLabel(key, true);
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  /** Barras mensais com a linha do orçamento; uma escala, um eixo. */
  const drawMonthly = (host, data, budget) => {
    host.innerHTML = '';
    const W = Math.max(280, host.clientWidth);
    const H = 248;
    const m = { t: 26, r: 6, b: 30, l: 56 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const maxV = Math.max(budget || 0, ...data.map((d) => d.total), 1);
    const step = niceStep(maxV / 4);
    const top = Math.ceil((maxV * 1.04) / step) * step;
    const y = (v) => m.t + ih - (v / top) * ih;
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'group', 'aria-label': 'Gasto por mês' });

    const axis = svgEl('g', { class: 'axis', 'aria-hidden': 'true' });
    for (let v = 0; v <= top + 0.5; v += step) {
      axis.appendChild(svgEl('line', { class: v === 0 ? 'base-line' : 'grid-line', x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }));
      axis.appendChild(svgEl('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, v === 0 ? 'R$ 0' : CO.moneyShort(v)));
    }
    svg.appendChild(axis);

    const band = iw / data.length;
    const bw = Math.min(46, band * 0.62);
    const lastFull = data.length > 1 ? data.length - 2 : data.length - 1;
    data.forEach((d, i) => {
      const cx = m.l + band * i + band / 2;
      const h = Math.max(0, y(0) - y(d.total));
      const over = budget && d.total > budget;
      const pctTxt = budget ? `, ${CO.pct(d.total / budget)} do orçamento` : '';
      const g = svgEl('g', { class: 'bar-col', tabindex: '0', role: 'img', 'aria-label': `${monthName(d.key)}${d.partial ? ' (parcial)' : ''}: ${CO.money0(d.total)}${pctTxt}` });
      g.appendChild(svgEl('rect', { class: 'bar-hit', x: m.l + band * i, y: m.t, width: band, height: ih }));
      if (h > 0) {
        g.appendChild(svgEl('path', { class: `bar${over ? ' is-over' : ''}${d.partial ? ' is-partial' : ''}`, d: roundedTop(cx - bw / 2, y(d.total), bw, h, 4) }));
      }
      svg.appendChild(g);
      const lbl = CO.MONTHS[CO.parse(d.key + '-01').getMonth()];
      svg.appendChild(svgEl('text', { class: 'lbl', x: cx, y: H - 8, 'text-anchor': 'middle', 'aria-hidden': 'true' }, d.partial ? `${lbl}*` : lbl));
      if (i === lastFull && h > 0) {
        // Rótulo direto só no último mês fechado; sobe acima da linha do orçamento se estiver perto dela
        const near = budget && Math.abs(y(d.total) - y(budget)) < 16;
        const ly = near ? Math.min(y(d.total), y(budget)) - 8 : y(d.total) - 7;
        svg.appendChild(svgEl('text', { class: 'val-lbl', x: cx, y: ly, 'text-anchor': 'middle', 'aria-hidden': 'true' }, CO.moneyShort(d.total)));
      }

      const show = () => {
        const r = g.querySelector('.bar-hit').getBoundingClientRect();
        const barTop = h > 0 ? g.querySelector('.bar').getBoundingClientRect().top : r.bottom;
        const diff = budget ? d.total - budget : 0;
        CO.tip.show(
          `<div class="tt-title">${esc(monthName(d.key))}${d.partial ? ' (até hoje)' : ''}</div>
           <div class="tt-value">${CO.money(d.total)}</div>
           ${d.planned ? `<div class="tt-row"><span>Pago</span><span>${CO.money(d.paid)}</span></div><div class="tt-row"><span>Previsto</span><span>${CO.money(d.planned)}</span></div>` : ''}
           ${budget ? `<div class="tt-row"><span>${diff > 0 ? 'Acima do orçamento' : 'Abaixo do orçamento'}</span><span>${CO.money0(Math.abs(diff))}</span></div>` : ''}`,
          r.left + r.width / 2,
          barTop
        );
      };
      g.addEventListener('pointerenter', show);
      g.addEventListener('focus', show);
      g.addEventListener('pointerleave', () => CO.tip.hide());
      g.addEventListener('blur', () => CO.tip.hide());
    });

    if (budget) {
      svg.appendChild(svgEl('line', { class: 'budget', x1: m.l, x2: W - m.r, y1: y(budget), y2: y(budget), 'aria-hidden': 'true' }));
    }
    host.appendChild(svg);
  };

  const periodData = () => {
    const months = Store.monthTotals(ui.cPeriod);
    const { from, to } = Store.periodRange(ui.cPeriod);
    let list = Store.expensesBetween(from, to);
    if (ui.cCat) {
      list = list.filter((e) => e.category === ui.cCat);
      months.forEach((mo) => {
        const l = mo.list.filter((e) => e.category === ui.cCat);
        mo.paid = l.filter((e) => e.status === 'pago').reduce((a, e) => a + e.amount, 0);
        mo.planned = l.filter((e) => e.status !== 'pago').reduce((a, e) => a + e.amount, 0);
        mo.total = mo.paid + mo.planned;
      });
    }
    return { months, list };
  };

  const hbars = (rows, total, act) => {
    if (!rows.length) return '<p class="text-sm muted">Sem gastos no período.</p>';
    const max = rows[0][1];
    return `<div class="hbars">${rows
      .map(([k, v, label, id]) => {
        const name = act && id ? `<button class="link-btn" type="button" data-action="${act}" data-id="${id}">${esc(label)}</button>` : esc(label);
        return `<div class="hbar"><div class="hbar-top"><span class="k">${name}</span><span class="v">${CO.money0(v)}<small>${CO.pct(v / total)}</small></span></div><div class="hbar-track"><div class="hbar-fill" style="width:${(v / max) * 100}%"></div></div></div>`;
      })
      .join('')}</div>`;
  };

  const origin = (e) => {
    if (!e.source) return '';
    const sind = Store.isSindico();
    if (e.source.type === 'plan') {
      const p = Store.plan(e.source.id);
      if (!p) return '';
      return sind ? `<button class="link-btn text-sm" type="button" data-action="open-plan" data-id="${p.id}">Plano de manutenção</button>` : '<small>Plano de manutenção</small>';
    }
    const t = Store.ticket(e.source.id);
    if (!t) return '';
    return Store.canSee(t) ? `<button class="link-btn text-sm" type="button" data-action="open-ticket" data-id="${t.id}">Chamado ${t.id}</button>` : `<small>Chamado ${t.id}</small>`;
  };

  const noSupplier = (e) => (e.category === 'consumo' ? 'Concessionária' : 'Sem fornecedor');

  const table = (list) => {
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);
    const shown = ui.cAll ? sorted : sorted.slice(0, 15);
    const sind = Store.isSindico();
    if (!sorted.length) return CO.empty({ ic: 'receipt', tone: 'accent', title: 'Nenhum lançamento', text: 'Não há gastos nesta categoria no período escolhido.' });
    return `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Situação</th><th class="r">Valor</th></tr></thead>
        <tbody>${shown
          .map(
            (e) => `
          <tr>
            <td class="cell-date num">${CO.dateNum(e.date)}</td>
            <td class="desc-cell">${esc(e.description)}${origin(e) ? `<br>${origin(e)}` : ''}<span class="mobile-meta">${CO.dateNum(e.date)}, ${esc(K.EXPENSE_CATS[e.category].short)}, ${e.supplierId ? esc(Store.supplierName(e.supplierId)) : noSupplier(e)}</span></td>
            <td class="cell-cat">${esc(K.EXPENSE_CATS[e.category].label)}</td>
            <td class="cell-sup">${e.supplierId ? esc(Store.supplierName(e.supplierId)) : `<span class="muted">${noSupplier(e)}</span>`}</td>
            <td class="cell-status">${e.status === 'pago' ? CO.pill('ok', 'Pago', 'check') : `${CO.pill('warn', 'Previsto', 'clock')}${sind ? ` <button class="link-btn text-sm" type="button" data-action="expense-paid" data-id="${e.id}">Marcar como pago</button>` : ''}`}</td>
            <td class="money">${CO.money(e.amount)}</td>
          </tr>`
          )
          .join('')}</tbody>
      </table></div>
      ${sorted.length > 15 ? `<div class="panel-foot" style="border-top:0;padding-inline:0"><button class="link-btn" type="button" data-action="c-all">${ui.cAll ? 'Mostrar menos' : `Mostrar todos os ${sorted.length} lançamentos`}${icon(ui.cAll ? 'caret-up' : 'caret-down', 'icon-sm')}</button></div>` : ''}`;
  };

  /** Para o condômino: o mesmo dado, contado em uma frase. */
  const residentSummary = (months, list, total) => {
    const budget = Store.s.condo.budgetMonthly;
    const units = Store.s.condo.units;
    const closed = months.filter((mo) => !mo.partial);
    const last = closed[closed.length - 1] || months[months.length - 1];
    const name = CO.MONTHS_LONG[CO.parse(last.key + '-01').getMonth()];
    const diff = last.total - budget;
    const byCat = {};
    for (const e of last.list) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    return `
      <section class="summary-card" aria-label="Resumo">
        <p class="summary-big">Em ${name}, o condomínio gastou <strong>${CO.money0(last.total)}</strong>.</p>
        <div class="summary-facts">
          <span><strong>${CO.money0(last.total / units)}</strong> por apartamento</span>
          <span class="${diff > 0 ? 'tone-crit-text' : 'tone-ok-text'}">${icon(diff > 0 ? 'trend-up' : 'check-circle')}<strong>${CO.money0(Math.abs(diff))}</strong> ${diff > 0 ? 'acima' : 'abaixo'} do orçamento</span>
          ${top ? `<span>Maior parte: <strong>${esc(K.EXPENSE_CATS[top[0]].label.toLowerCase())}</strong></span>` : ''}
        </div>
      </section>`;
  };

  CO.views.custos = {
    title: () => (Store.isSindico() ? 'Custos' : 'Transparência'),
    render() {
      const sind = Store.isSindico();
      const budget = Store.s.condo.budgetMonthly;
      const units = Store.s.condo.units;
      const { months, list } = periodData();
      const total = list.reduce((a, e) => a + e.amount, 0);
      const closed = months.filter((mo) => !mo.partial);
      const base = closed.length ? closed : months;
      const avg = base.reduce((a, mo) => a + mo.total, 0) / base.length;
      const over = ui.cCat ? 0 : closed.filter((mo) => mo.total > budget).length;
      const sumCat = (c) => list.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0);
      const prev = sumCat('preventiva');
      const corr = sumCat('corretiva');
      const ratio = prev ? corr / prev : null;
      const byCat = Object.keys(K.EXPENSE_CATS).map((c) => [c, sumCat(c), K.EXPENSE_CATS[c].label]).filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]);
      const bySup = {};
      for (const e of list) if (e.supplierId) bySup[e.supplierId] = (bySup[e.supplierId] || 0) + e.amount;
      const supRows = Object.entries(bySup).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => [id, v, Store.supplierName(id), id]);
      const showBudget = !ui.cCat;
      const periodTxt = PERIODS.find((p) => p.v === ui.cPeriod).label.toLowerCase();

      const chip = (p) => `<button class="chip" type="button" data-action="c-period" data-v="${p.v}" aria-pressed="${ui.cPeriod === p.v}">${p.label}</button>`;
      const head = sind
        ? `<header class="page-head">
            <div class="titles">
              <h1 class="page-title" tabindex="-1">Custos</h1>
              <p class="page-sub">Gastos do condomínio ligados a contratos, manutenções e chamados. Os condôminos veem estes mesmos números na página Transparência.</p>
            </div>
            <div class="page-actions"><button class="btn btn-primary" type="button" data-action="new-expense">${icon('plus')}Novo lançamento</button></div>
          </header>`
        : `<header class="page-head">
            <div class="titles">
              <h1 class="page-title" tabindex="-1">Transparência</h1>
              <p class="page-sub">Tudo o que o condomínio gastou, mês a mês, com o fornecedor e o motivo de cada pagamento.</p>
            </div>
          </header>`;

      return `
        ${head}
        <div class="toolbar">
          <div class="chips" role="group" aria-label="Período">${PERIODS.map(chip).join('')}</div>
          <label class="sr-only" for="c-cat">Categoria</label>
          <select class="select" id="c-cat" data-change="c-cat" style="width:auto;min-height:38px;font-size:14px">
            <option value="">Todas as categorias</option>
            ${Object.entries(K.EXPENSE_CATS).map(([v, c]) => `<option value="${v}"${ui.cCat === v ? ' selected' : ''}>${esc(c.label)}</option>`).join('')}
          </select>
        </div>

        ${sind ? `
        <div class="stats">
          <div class="stat">
            <span class="stat-label">Total, ${periodTxt}</span>
            <span class="stat-value">${CO.money0(total)}</span>
            <span class="stat-sub">${CO.money0(total / units)} por unidade</span>
          </div>
          <div class="stat">
            <span class="stat-label">${closed.length ? 'Média por mês fechado' : 'Gasto do mês até hoje'}</span>
            <span class="stat-value">${CO.money0(avg)}</span>
            <span class="stat-sub ${showBudget ? (avg > budget ? 'tone-crit' : 'tone-ok') : ''}">${showBudget ? `${icon(avg > budget ? 'trend-up' : 'check-circle')}${CO.pct(avg / budget)} do orçamento mensal` : esc(K.EXPENSE_CATS[ui.cCat].label)}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Consertos x prevenção</span>
            <span class="stat-value">${ratio != null ? `${CO.num1(ratio)}x` : 'Sem dados'}</span>
            <span class="stat-sub ${ratio != null && ratio > 1 ? 'tone-warn' : ''}">${ratio != null ? `${CO.money(ratio)} em corretiva para cada R$ 1 em preventiva` : 'Sem preventivas no período'}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Meses acima do orçamento</span>
            <span class="stat-value">${showBudget ? `${over}<small> de ${closed.length}</small>` : 'Não se aplica'}</span>
            <span class="stat-sub">Orçamento de ${CO.money0(budget)} por mês</span>
          </div>
        </div>` : residentSummary(months, list, total)}

        <section class="panel" aria-labelledby="chart-title">
          <div class="panel-head"><h2 class="panel-title" id="chart-title">Gasto por mês${ui.cCat ? `: ${esc(K.EXPENSE_CATS[ui.cCat].short)}` : ''}</h2></div>
          <div class="panel-body">
            <div class="chart" id="chart-monthly"></div>
            <div class="chart-legend">
              <span><span class="key"></span>${showBudget ? 'Dentro do orçamento' : 'Gasto no mês'}</span>
              ${showBudget ? `<span><span class="key over"></span>Acima do orçamento</span><span><span class="key line"></span>Orçamento mensal, ${CO.money0(budget)}</span>` : ''}
              <span>* mês em andamento</span>
            </div>
          </div>
        </section>

        <div class="grid-2 mt-16">
          <section class="panel" aria-labelledby="cat-title">
            <div class="panel-head"><h2 class="panel-title" id="cat-title">Por categoria</h2></div>
            <div class="panel-body">${hbars(byCat, total)}</div>
          </section>
          <section class="panel" aria-labelledby="sup-title">
            <div class="panel-head"><h2 class="panel-title" id="sup-title">Fornecedores que mais receberam</h2></div>
            <div class="panel-body">${hbars(supRows, total, sind ? 'open-supplier' : null)}</div>
          </section>
        </div>

        <section class="panel mt-16" aria-labelledby="tx-title">
          <div class="panel-head"><h2 class="panel-title" id="tx-title">Lançamentos <span class="count">${list.length}</span></h2>${sind ? '' : '<a class="link-btn" href="#documentos" data-go="documentos">Prestações de contas</a>'}</div>
          <div class="panel-body">${table(list)}</div>
        </section>`;
    },
    mount(root) {
      const host = root.querySelector('#chart-monthly');
      const draw = () => drawMonthly(host, periodData().months, ui.cCat ? 0 : Store.s.condo.budgetMonthly);
      draw();
      if (this._ro) this._ro.disconnect();
      let w = host.clientWidth;
      this._ro = new ResizeObserver(() => {
        if (!document.contains(host)) return this._ro.disconnect();
        if (Math.abs(host.clientWidth - w) > 4) {
          w = host.clientWidth;
          draw();
        }
      });
      this._ro.observe(host);
    },
  };

  CO.actions['c-period'] = (el) => { ui.cPeriod = Number(el.dataset.v); ui.cAll = false; CO.App.render(); };
  CO.actions['c-all'] = () => { ui.cAll = !ui.cAll; CO.App.render(); };
  CO.changes['c-cat'] = (el) => { ui.cCat = el.value; ui.cAll = false; CO.App.render(); };

  CO.actions['expense-paid'] = (el) => {
    Store.markExpensePaid(el.dataset.id);
    CO.done('Lançamento marcado como pago.');
  };

  CO.actions['new-expense'] = () => {
    CO.Sheet.open({
      title: 'Novo lançamento',
      body: () => `
        <form class="form" id="expense-form" data-form="expense" novalidate>
          ${F.text({ name: 'description', id: 'f-xp-desc', label: 'Descrição', required: 'Descreva o gasto.', placeholder: 'Ex.: Troca do motor do exaustor da garagem' })}
          <div class="field-row">
            ${F.money({ name: 'amount', id: 'f-xp-amount', label: 'Valor', required: 'Informe o valor.' })}
            ${F.date({ name: 'date', id: 'f-xp-date', label: 'Data', value: CO.iso(CO.today()), required: 'Informe a data.' })}
          </div>
          ${F.select({ name: 'category', id: 'f-xp-cat', label: 'Categoria', value: 'corretiva', options: Object.entries(K.EXPENSE_CATS).map(([value, c]) => ({ value, label: c.label })) })}
          ${F.select({ name: 'supplierId', id: 'f-xp-sup', label: 'Fornecedor', placeholder: 'Nenhum (concessionária ou avulso)', options: Store.s.suppliers.map((s) => ({ value: s.id, label: s.name })) })}
          ${F.seg({ name: 'status', id: 'f-xp-status', label: 'Situação', value: 'pago', options: [{ value: 'pago', label: 'Pago', icon: 'check' }, { value: 'previsto', label: 'Previsto', icon: 'clock' }] })}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-close">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="expense-form">${icon('plus')}Lançar</button>`,
    });
  };

  CO.forms.expense = (form, d) => {
    Store.addExpense({ description: d.description, amount: CO.parseMoney(d.amount), date: d.date, category: d.category, supplierId: d.supplierId || null, status: d.status || 'pago' });
    CO.Sheet.close();
    CO.done(`Lançamento de ${CO.money(CO.parseMoney(d.amount))} registrado.`);
  };
})(window.CO);
