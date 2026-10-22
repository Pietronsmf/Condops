/* Manutenções: plano preventivo, registro de execuções e histórico. */
'use strict';

(function (CO) {
  const { esc, Store, F, K } = CO;
  const icon = (n, c) => CO.icon(n, c);
  const ui = (CO.ui = CO.ui || {});
  ui.mFilter = ui.mFilter || 'todas';
  ui.mTab = ui.mTab || 'plano';

  const planIcon = (p) => {
    const eq = p.equipmentIds.length ? Store.equipment(p.equipmentIds[0]) : null;
    if (eq) return K.EQUIP_TYPES[eq.type].icon;
    if (/praga|dedetiz/i.test(p.title)) return 'bug';
    if (/jardim|poda/i.test(p.title)) return 'plant';
    if (/gordura/i.test(p.title)) return 'drop';
    if (/cobertura|impermeab/i.test(p.title)) return 'house-line';
    return 'wrench';
  };

  const planRow = (p) => {
    const st = Store.planStatus(p);
    const due = st.sched || p.nextDue;
    return `
      <button class="row-btn" type="button" data-action="open-plan" data-id="${p.id}">
        <span class="ico-tile tone-${st.tone === 'ok' ? 'accent' : st.tone}">${icon(planIcon(p))}</span>
        <span class="row-main">
          <span class="row-title">${esc(p.title)}</span>
          <span class="row-meta">
            <span>${icon('arrows-clockwise')}${esc(Store.freq(p.freq).label)}</span>
            <span>${icon('handshake')}${esc(Store.supplierName(p.supplierId))}</span>
            ${p.affectsResidents ? `<span>${icon('users-three')}Afeta moradores</span>` : ''}
          </span>
        </span>
        <span class="row-trail">
          ${CO.pill(st.tone, st.label, st.icon)}
          <span class="when">${st.sched ? 'Agendada ' : 'Prevista '}${CO.date(due)}</span>
        </span>
      </button>`;
  };

  const groups = () => {
    const plans = Store.plansSorted();
    const late = plans.filter((p) => Store.planStatus(p).key === 'late');
    const next30 = plans.filter((p) => { const st = Store.planStatus(p); return st.key !== 'late' && st.days <= 30; });
    const later = plans.filter((p) => { const st = Store.planStatus(p); return st.key !== 'late' && st.days > 30; });
    return { late, next30, later, all: plans };
  };

  const section = (title, list, note) =>
    list.length
      ? `<section class="panel" aria-label="${esc(title)}">
          <div class="panel-head"><h2 class="panel-title">${esc(title)} <span class="count">${list.length}</span></h2>${note || ''}</div>
          <ul class="list">${list.map((p) => `<li>${planRow(p)}</li>`).join('')}</ul>
        </section>`
      : '';

  const historyHtml = () => {
    const ex = Store.allExecutions();
    if (!ex.length) return `<div class="panel">${CO.empty({ ic: 'clipboard-text', tone: 'accent', title: 'Nenhuma execução registrada', text: 'Ao registrar uma manutenção feita, ela entra aqui com data, responsável e custo.' })}</div>`;
    return `
      <div class="panel"><div class="table-wrap"><table class="table">
        <thead><tr><th>Data</th><th>Manutenção</th><th>Responsável</th><th class="r">Custo</th></tr></thead>
        <tbody>
          ${ex.slice(0, 40).map((x) => `
            <tr>
              <td class="cell-date num">${CO.dateNum(x.date)}</td>
              <td class="desc-cell"><button class="link-btn" type="button" data-action="open-plan" data-id="${x.plan.id}">${esc(x.plan.title)}</button>${x.note ? `<small>${esc(x.note)}</small>` : ''}</td>
              <td class="cell-sup">${esc(Store.supplierName(x.supplierId))}</td>
              <td class="money">${x.cost ? CO.money(x.cost) : '<span class="muted">Sem custo extra</span>'}</td>
            </tr>`).join('')}
        </tbody>
      </table></div></div>`;
  };

  CO.views.manutencoes = {
    title: () => 'Manutenções',
    render() {
      const g = groups();
      const chip = (id, label, n) => `<button class="chip" type="button" data-action="m-filter" data-v="${id}" aria-pressed="${ui.mFilter === id}">${label}<span class="n">${n}</span></button>`;
      const tab = (id, label) => `<button class="tab" type="button" role="tab" data-action="m-tab" data-v="${id}" aria-selected="${ui.mTab === id}">${label}</button>`;
      let body;
      if (ui.mTab === 'historico') body = historyHtml();
      else if (ui.mFilter === 'todas') {
        body = `<div class="stack">
          ${section('Atrasadas', g.late)}
          ${section('Próximos 30 dias', g.next30)}
          ${section('Mais adiante', g.later)}
        </div>`;
      } else {
        const list = { atrasadas: g.late, proximas: g.next30, emdia: g.later }[ui.mFilter];
        body = list.length
          ? `<div class="panel"><ul class="list">${list.map((p) => `<li>${planRow(p)}</li>`).join('')}</ul></div>`
          : `<div class="panel">${CO.empty({ title: ui.mFilter === 'atrasadas' ? 'Nenhuma manutenção atrasada' : 'Nada neste período', text: 'Bom sinal. Confira o plano completo para ver o que vem depois.' })}</div>`;
      }
      return `
        <header class="page-head">
          <div class="titles">
            <h1 class="page-title" tabindex="-1">Manutenções</h1>
            <p class="page-sub">Plano preventivo do prédio, organizado como pede a NBR 5674: o que fazer, a cada quanto tempo, quem faz e o registro de cada execução.</p>
          </div>
          <div class="page-actions"><button class="btn btn-primary" type="button" data-action="new-plan">${icon('plus')}Novo item do plano</button></div>
        </header>
        <div class="tabs" role="tablist" aria-label="Manutenções">${tab('plano', 'Plano preventivo')}${tab('historico', 'Histórico')}</div>
        ${ui.mTab === 'plano' ? `<div class="toolbar"><div class="chips" role="group" aria-label="Filtrar">${chip('todas', 'Todas', g.all.length)}${chip('atrasadas', 'Atrasadas', g.late.length)}${chip('proximas', 'Próximos 30 dias', g.next30.length)}${chip('emdia', 'Mais adiante', g.later.length)}</div></div>` : ''}
        ${body}`;
    },
  };

  CO.actions['m-filter'] = (el) => { ui.mFilter = el.dataset.v; CO.App.render(); };
  CO.actions['m-tab'] = (el) => { ui.mTab = el.dataset.v; CO.App.render(); };

  /* ---------- Detalhe de um item do plano ---------- */

  const planBody = (id) => () => {
    const p = Store.plan(id);
    const st = Store.planStatus(p);
    const last = Store.lastDone(p);
    const eqs = p.equipmentIds.map((e) => Store.equipment(e)).filter(Boolean);
    const banner = st.key === 'late' && !st.sched
      ? `<div class="callout tone-crit">${icon('warning-circle')}<div><strong>Atrasada desde ${CO.dateNum(p.nextDue)}.</strong> Registre a execução assim que for feita. O histórico de manutenções é exigido pela NBR 5674 e pode ser pedido pelo seguro em caso de sinistro.</div></div>`
      : st.sched
        ? `<div class="callout tone-accent">${icon('calendar-check')}<div><strong>Agendada para ${CO.weekdayLong(st.sched)}, às ${CO.time(st.sched)}.</strong> Depois de feita, registre a execução para calcular a próxima data.</div></div>`
        : '';
    return `
      <div class="detail">
        <div class="badges">${CO.pill(st.tone, st.label, st.icon)}${p.affectsResidents ? CO.pill('', 'Afeta moradores', 'users-three') : ''}</div>
        ${banner}
        <dl class="kv">
          <div class="fact"><dt>Frequência</dt><dd>${esc(Store.freq(p.freq).label)}</dd></div>
          <div class="fact"><dt>Próxima data</dt><dd>${CO.dateNum(p.nextDue)} (${CO.relDay(p.nextDue)})</dd></div>
          <div class="fact"><dt>Última execução</dt><dd>${last ? `${CO.dateNum(last)}` : 'Nunca registrada'}</dd></div>
          <div class="fact"><dt>Custo estimado</dt><dd>${p.covered ? 'Incluído no contrato' : p.estCost ? CO.money(p.estCost) : 'Sem custo'}</dd></div>
          <div class="fact"><dt>Responsável</dt><dd>${p.supplierId ? `<button class="link-btn" type="button" data-action="open-supplier" data-id="${p.supplierId}">${esc(Store.supplierName(p.supplierId))}</button>` : 'Equipe interna (zelador)'}</dd></div>
          <div class="fact"><dt>Equipamento</dt><dd>${eqs.length ? eqs.map((e) => `<button class="link-btn" type="button" data-action="open-equip" data-id="${e.id}">${esc(e.name)}</button>`).join('<br>') : 'Áreas comuns'}</dd></div>
        </dl>
        ${p.impact ? `<section class="detail-section"><h3>Impacto para os moradores</h3><p class="desc">${esc(p.impact)}</p></section>` : ''}
        ${p.notes ? `<section class="detail-section"><h3>Observações</h3><p class="desc">${esc(p.notes)}</p></section>` : ''}
        <section class="detail-section">
          <h3>Ações</h3>
          <div class="inline-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-action="schedule-plan" data-id="${p.id}">${icon('calendar-plus')}${p.scheduledAt ? 'Reagendar' : 'Agendar data'}</button>
            ${p.affectsResidents ? `<button class="btn btn-secondary btn-sm" type="button" data-action="plan-notice" data-id="${p.id}">${icon('megaphone')}Avisar moradores</button>` : ''}
          </div>
        </section>
        <section class="detail-section">
          <h3>Histórico</h3>
          ${p.executions.length
            ? `<ol class="timeline">${[...p.executions].sort((a, b) => b.date.localeCompare(a.date)).map((x) => `
                <li class="tl-item"><span class="tl-dot">${icon('check')}</span><div class="tl-body">
                  <div class="tl-head"><strong>${CO.dateNum(x.date)}</strong><span>${esc(Store.supplierName(x.supplierId))}</span>${x.cost ? `<span class="num">${CO.money(x.cost)}</span>` : ''}</div>
                  ${x.note ? `<p class="tl-text">${esc(x.note)}</p>` : ''}
                  ${x.fileName ? `<p class="text-sm muted">${icon('paperclip', 'icon-sm')} ${esc(x.fileName)}</p>` : ''}
                </div></li>`).join('')}</ol>`
            : '<p class="text-sm muted">Nenhuma execução registrada ainda.</p>'}
        </section>
      </div>`;
  };

  CO.openPlan = (id) => {
    const p = Store.plan(id);
    if (!p) return;
    const spec = {
      title: p.title,
      eyebrow: 'Plano de manutenção',
      live: true,
      body: planBody(id),
      foot: () => `<button class="btn btn-primary" type="button" data-action="register-exec" data-id="${id}">${icon('check-circle')}Registrar execução</button>`,
    };
    if (CO.Sheet.isOpen()) CO.Sheet.push(spec);
    else CO.Sheet.open(spec);
  };

  CO.actions['open-plan'] = (el) => CO.openPlan(el.dataset.id);

  const supplierOptions = () => [{ value: '', label: 'Equipe interna (zelador)' }].concat(Store.s.suppliers.map((s) => ({ value: s.id, label: s.name })));

  CO.actions['register-exec'] = (el) => {
    const p = Store.plan(el.dataset.id);
    const today = CO.iso(CO.today());
    const spec = {
      title: 'Registrar execução',
      eyebrow: esc(p.title),
      body: () => `
        <form class="form" id="exec-form" data-form="exec" data-id="${p.id}" novalidate>
          <div class="field-row">
            ${F.date({ name: 'date', id: 'f-ex-date', label: 'Data em que foi feita', value: today, required: 'Informe a data.' })}
            ${F.money({ name: 'cost', id: 'f-ex-cost', label: 'Custo', value: p.covered ? '' : p.estCost || '', hint: p.covered ? 'Coberto pelo contrato. Deixe em branco se não houve extra.' : 'Valor da nota fiscal.' })}
          </div>
          ${F.select({ name: 'supplierId', id: 'f-ex-sup', label: 'Quem fez', value: p.supplierId || '', options: supplierOptions() })}
          ${F.textarea({ name: 'note', id: 'f-ex-note', label: 'O que foi feito', optional: true, rows: 3, placeholder: 'Ex.: Limpeza das 2 caixas e da cisterna. Certificado emitido.' })}
          ${F.file({ name: 'file', id: 'f-ex-file', label: 'Nota fiscal ou laudo', optional: true, accept: 'application/pdf,image/*', text: 'Anexar arquivo' })}
          ${F.toggle({ name: 'toExpense', id: 'f-ex-toexp', label: 'Lançar o custo em Custos', hint: 'Entra como manutenção preventiva, ligado a este item do plano.', checked: true })}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-back">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="exec-form">${icon('check')}Salvar registro</button>`,
    };
    CO.Sheet.push(spec);
  };

  CO.forms.exec = (form, d) => {
    if (d.date > CO.iso(CO.today())) {
      const el = form.querySelector('#f-ex-date');
      el.setAttribute('aria-invalid', 'true');
      const err = form.querySelector('#f-ex-date-err');
      err.hidden = false;
      err.innerHTML = `${icon('warning-circle')}A data não pode ser no futuro. Para marcar uma data, use Agendar.`;
      el.focus();
      return;
    }
    const cost = d.cost ? CO.parseMoney(d.cost) : 0;
    const next = Store.registerExecution(form.dataset.id, { date: d.date, cost, supplierId: d.supplierId, note: d.note, fileName: d.file ? d.file.name : '', toExpense: d.toExpense });
    CO.Sheet.back();
    CO.done(`Execução registrada. Próxima em ${CO.dateNum(next)}.`);
  };

  CO.actions['schedule-plan'] = (el) => {
    const p = Store.plan(el.dataset.id);
    const base = p.scheduledAt || `${CO.daysFromToday(p.nextDue) >= 0 ? p.nextDue : CO.iso(CO.addDays(CO.today(), 1))}T09:00`;
    CO.Sheet.push({
      title: p.scheduledAt ? 'Reagendar manutenção' : 'Agendar manutenção',
      eyebrow: esc(p.title),
      body: () => `
        <form class="form" id="sched-form" data-form="schedule" data-id="${p.id}" novalidate>
          ${F.datetime({ name: 'at', id: 'f-sc-at', label: 'Data e hora', value: base, required: 'Escolha a data e a hora.' })}
          ${p.affectsResidents ? F.toggle({ name: 'notify', id: 'f-sc-notify', label: 'Publicar aviso aos moradores', hint: p.impact, checked: true }) : ''}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-back">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="sched-form">${icon('calendar-check')}Agendar</button>`,
    });
  };

  CO.forms.schedule = (form, d) => {
    const p = Store.plan(form.dataset.id);
    Store.schedulePlan(p.id, d.at);
    CO.Sheet.back();
    if (d.notify) {
      CO.openNoticeForm(noticeFromPlan(p, d.at));
    } else {
      CO.done(`Agendada para ${CO.weekdayLong(d.at)}, às ${CO.time(d.at)}.`);
    }
  };

  const noticeFromPlan = (p, at) => {
    const start = at || p.scheduledAt || `${p.nextDue}T09:00`;
    const water = /reservat|água/i.test(p.title);
    return {
      kind: water ? 'interrupcao' : 'obra',
      title: p.title,
      body: `${p.impact || ''} Responsável: ${Store.supplierName(p.supplierId)}.`.trim(),
      startsAt: start,
      endsAt: '',
      planId: p.id,
    };
  };

  CO.actions['plan-notice'] = (el) => CO.openNoticeForm(noticeFromPlan(Store.plan(el.dataset.id)));

  /* ---------- Novo item do plano ---------- */

  CO.actions['new-plan'] = () => {
    CO.Sheet.open({
      title: 'Novo item do plano',
      eyebrow: 'Manutenção preventiva',
      body: () => `
        <form class="form" id="plan-form" data-form="plan" novalidate>
          ${F.text({ name: 'title', id: 'f-pl-title', label: 'O que precisa ser feito', required: 'Descreva a manutenção.', placeholder: 'Ex.: Limpeza das calhas e ralos da cobertura' })}
          <div class="field-row">
            ${F.select({ name: 'freq', id: 'f-pl-freq', label: 'Frequência', value: '6m', options: K.FREQS.map((f) => ({ value: f.id, label: f.label })) })}
            ${F.date({ name: 'nextDue', id: 'f-pl-next', label: 'Próxima data', value: CO.iso(CO.addDays(CO.today(), 30)), required: 'Informe quando deve ser feita.' })}
          </div>
          ${F.select({ name: 'equipmentId', id: 'f-pl-eq', label: 'Equipamento', placeholder: 'Nenhum, é de área comum', options: Store.s.equipment.map((e) => ({ value: e.id, label: e.name })) })}
          <div class="field-row">
            ${F.select({ name: 'supplierId', id: 'f-pl-sup', label: 'Quem faz', options: supplierOptions() })}
            ${F.money({ name: 'estCost', id: 'f-pl-cost', label: 'Custo estimado', optional: true })}
          </div>
          ${F.toggle({ name: 'affectsResidents', id: 'f-pl-aff', label: 'Afeta a rotina dos moradores', hint: 'Interrompe água, elevador ou fecha alguma área.' })}
          ${F.text({ name: 'impact', id: 'f-pl-impact', label: 'Impacto para os moradores', optional: true, placeholder: 'Ex.: Água desligada por 3 horas.' })}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-close">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="plan-form">${icon('plus')}Adicionar ao plano</button>`,
    });
  };

  CO.forms.plan = (form, d) => {
    Store.addPlan({ title: d.title, freq: d.freq, nextDue: d.nextDue, equipmentId: d.equipmentId, supplierId: d.supplierId, estCost: d.estCost ? CO.parseMoney(d.estCost) : 0, affectsResidents: d.affectsResidents, impact: d.impact });
    CO.Sheet.close();
    CO.done('Item adicionado ao plano de manutenção.');
  };
})(window.CO);
