/* Início: painel da síndica e página do condômino, mais o mural de avisos. */
'use strict';

(function (CO) {
  const { esc, Store, F, K } = CO;
  const icon = (n, c) => CO.icon(n, c);
  const ui = (CO.ui = CO.ui || {});

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  };

  const firstName = (n) => n.split(' ')[0];

  const dateChip = (iso) => {
    const d = CO.parse(iso);
    return `<span class="date-chip"><b>${d.getDate()}</b><span>${CO.MONTHS[d.getMonth()]}</span></span>`;
  };

  /* ---------- Avisos ---------- */

  const noticeWhen = (n) => {
    if (!n.startsAt) return '';
    const day = CO.weekdayLong(n.startsAt);
    const span = n.endsAt ? `das ${CO.time(n.startsAt)} às ${CO.time(n.endsAt)}` : `às ${CO.time(n.startsAt)}`;
    const rel = CO.daysFromToday(n.startsAt);
    const relTxt = rel >= 0 && rel <= 7 ? ` (${CO.relDay(n.startsAt)})` : '';
    return `${day}, ${span}${n.place ? `, ${n.place}` : ''}${relTxt}`;
  };

  CO.noticeCard = (n) => {
    const kind = K.NOTICE_KINDS[n.kind];
    const sind = Store.isSindico();
    const units = Store.s.condo.units;
    const acked = n.readBy.includes(Store.me().unit);
    const when = noticeWhen(n);
    const meta = sind
      ? `<span>${icon('eye')}${n.readBy.length} de ${units} unidades confirmaram leitura</span>`
      : acked
        ? `<span class="notice-ack">${icon('check-circle')}Você confirmou a leitura</span>`
        : `<button class="btn btn-secondary btn-sm" type="button" data-action="ack-notice" data-id="${n.id}">${icon('check')}Estou ciente</button>`;
    return `
      <article class="notice kind-${n.kind}">
        <span class="ico-tile tone-${kind.tone}">${icon(kind.icon)}</span>
        <div class="notice-body">
          <h3>${esc(n.title)}</h3>
          ${when ? `<p class="notice-when">${icon('calendar-blank', 'icon-sm')}<strong>${esc(when)}</strong></p>` : ''}
          <p>${esc(n.body)}</p>
          <div class="notice-meta"><span>${esc(kind.label)}, publicado ${CO.ago(n.createdAt)}</span>${meta}</div>
        </div>
      </article>`;
  };

  const sortedNotices = () => {
    const unit = Store.me().unit;
    return [...Store.s.notices].sort((a, b) => {
      const ua = a.readBy.includes(unit) ? 1 : 0;
      const ub = b.readBy.includes(unit) ? 1 : 0;
      if (!Store.isSindico() && ua !== ub) return ua - ub;
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  };

  CO.actions['ack-notice'] = (el) => {
    Store.ackNotice(el.dataset.id);
    CO.toast('Leitura confirmada. A síndica vê quantas unidades já leram.');
  };

  CO.openNoticeForm = (prefill = {}) => {
    const spec = {
      title: 'Novo aviso aos moradores',
      body: () => `
        <form class="form" id="notice-form" data-form="notice" novalidate>
          ${F.seg({ name: 'kind', label: 'Tipo de aviso', value: prefill.kind || 'geral', options: Object.entries(K.NOTICE_KINDS).map(([value, k]) => ({ value, label: k.label })) })}
          ${F.text({ name: 'title', id: 'f-n-title', label: 'Título', value: prefill.title, required: 'Escreva um título curto, como "Água desligada na quinta".', maxlength: 90 })}
          ${F.textarea({ name: 'body', id: 'f-n-body', label: 'Mensagem', value: prefill.body, rows: 4, required: 'Explique o que acontece e o que o morador precisa fazer.', hint: 'Diga o que muda para o morador e o que ele precisa fazer.' })}
          <div class="field-row">
            ${F.datetime({ name: 'startsAt', id: 'f-n-start', label: 'Começa em', optional: true, value: prefill.startsAt })}
            ${F.datetime({ name: 'endsAt', id: 'f-n-end', label: 'Termina em', optional: true, value: prefill.endsAt })}
          </div>
          ${F.text({ name: 'place', id: 'f-n-place', label: 'Local', optional: true, value: prefill.place, placeholder: 'Ex.: Salão de festas' })}
          ${F.toggle({ name: 'pinned', id: 'f-n-pinned', label: 'Fixar no topo do mural', hint: 'Use para interrupções e prazos.', checked: prefill.kind === 'interrupcao' })}
          <input type="hidden" name="planId" value="${esc(prefill.planId || '')}">
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-back">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="notice-form">${icon('megaphone')}Publicar aviso</button>`,
    };
    if (CO.Sheet.isOpen()) CO.Sheet.push(spec);
    else CO.Sheet.open(spec);
  };

  CO.actions['new-notice'] = () => CO.openNoticeForm();

  CO.forms.notice = (form, d) => {
    if (d.endsAt && d.startsAt && d.endsAt < d.startsAt) {
      const el = form.querySelector('#f-n-end');
      el.setAttribute('aria-invalid', 'true');
      const err = form.querySelector('#f-n-end-err');
      err.hidden = false;
      err.innerHTML = `${icon('warning-circle')}O fim precisa ser depois do começo.`;
      el.focus();
      return;
    }
    Store.addNotice({ kind: d.kind || 'geral', title: d.title, body: d.body, startsAt: d.startsAt || null, endsAt: d.endsAt || null, place: d.place, pinned: d.pinned, planId: d.planId || null });
    CO.Sheet.close();
    CO.done(`Aviso publicado para as ${Store.s.condo.units} unidades.`);
  };

  /* ---------- Painel da síndica ---------- */

  const attentionPanel = () => {
    const items = Store.attention();
    const showAll = ui.attnAll;
    const list = showAll ? items : items.slice(0, 5);
    const rows = list
      .map(
        (it) => `
        <li><div class="attn">
          <span class="ico-tile tone-${it.tone}">${icon(it.icon)}</span>
          <span class="row-main">
            <span class="row-title">${esc(it.title)}</span>
            <span class="row-meta"><span class="tone-${it.tone}-text">${esc(it.meta)}</span></span>
          </span>
          <button class="btn btn-secondary btn-sm attn-action" type="button" data-action="${it.act}" data-id="${esc(it.id)}">${esc(it.cta)}</button>
        </div></li>`
      )
      .join('');
    return `
      <section class="panel" aria-labelledby="attn-title">
        <div class="panel-head">
          <h2 class="panel-title" id="attn-title">Precisa de atenção <span class="count">${items.length}</span></h2>
        </div>
        ${items.length ? `<ul class="list">${rows}</ul>` : CO.empty({ title: 'Nada pendente', text: 'Manutenções, documentos e chamados estão em dia.' })}
        ${items.length > 5 ? `<div class="panel-foot"><button class="link-btn" type="button" data-action="attn-toggle">${showAll ? 'Mostrar menos' : `Ver todos os ${items.length} itens`}${icon(showAll ? 'caret-up' : 'caret-down', 'icon-sm')}</button></div>` : ''}
      </section>`;
  };

  CO.actions['attn-toggle'] = () => {
    ui.attnAll = !ui.attnAll;
    CO.App.render();
  };

  const agendaPanel = () => {
    const horizon = 30;
    const rows = [];
    for (const p of Store.s.plans) {
      const when = p.scheduledAt || p.nextDue;
      const d = CO.daysFromToday(when);
      if (d < 0 || d > horizon) continue;
      rows.push({ date: when.slice(0, 10), title: p.title, meta: `${Store.supplierName(p.supplierId)}${p.scheduledAt ? `, às ${CO.time(p.scheduledAt)}` : ''}`, act: 'open-plan', id: p.id, ic: p.affectsResidents ? 'users-three' : null });
    }
    for (const n of Store.s.notices) {
      if (n.kind !== 'assembleia' || !n.startsAt) continue;
      const d = CO.daysFromToday(n.startsAt);
      if (d < 0 || d > horizon) continue;
      rows.push({ date: n.startsAt.slice(0, 10), title: n.title, meta: `${CO.time(n.startsAt)}${n.place ? `, ${n.place}` : ''}`, act: null, id: n.id, ic: 'users-three' });
    }
    for (const s of Store.s.suppliers) {
      if (!s.contract) continue;
      const d = CO.daysFromToday(s.contract.end);
      if (d < 0 || d > horizon) continue;
      rows.push({ date: s.contract.end, title: `Fim do contrato: ${s.name}`, meta: 'Decidir se renova', act: 'open-supplier', id: s.id, ic: 'handshake' });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    const more = rows.length - 6;
    const body = rows
      .slice(0, 6)
      .map(
        (r) => `
        <li>${r.act ? `<button class="row-btn" type="button" data-action="${r.act}" data-id="${esc(r.id)}">` : '<div class="row-btn">'}
          ${dateChip(r.date)}
          <span class="row-main"><span class="row-title">${esc(r.title)}</span><span class="row-meta"><span>${CO.weekdayShort(r.date)}, ${CO.relDay(r.date)}</span><span>${esc(r.meta)}</span></span></span>
        ${r.act ? '</button>' : '</div>'}</li>`
      )
      .join('');
    return `
      <section class="panel" aria-labelledby="agenda-title">
        <div class="panel-head"><h2 class="panel-title" id="agenda-title">Próximos 30 dias</h2><a class="link-btn" href="#manutencoes" data-go="manutencoes">Plano completo</a></div>
        ${rows.length ? `<ul class="list">${body}</ul>` : CO.empty({ ic: 'calendar-blank', tone: 'accent', title: 'Agenda livre', text: 'Nenhuma manutenção prevista para o próximo mês.' })}
        ${more > 0 ? `<div class="panel-foot"><a class="link-btn" href="#manutencoes" data-go="manutencoes">Mais ${CO.plural(more, 'compromisso', 'compromissos')} no plano${icon('arrow-right', 'icon-sm')}</a></div>` : ''}
      </section>`;
  };

  const renderSindico = () => {
    const s = Store.s;
    const me = Store.me();
    const c = Store.counts();
    const month = Store.monthTotals(1)[0];
    const budget = s.condo.budgetMonthly;
    const ratio = month.total / budget;
    const total = s.plans.length;
    const onTime = total - c.latePlans;
    const docsSoon = c.docsAction - c.docsExpired;
    const monthName = CO.MONTHS_LONG[CO.today().getMonth()];
    const recent = s.tickets.filter((t) => Store.isOpen(t)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
    const notices = sortedNotices().slice(0, 3);
    return `
      <header class="page-head">
        <div class="titles">
          <p class="eyebrow">${esc(CO.weekdayLong(CO.iso(CO.today())))}</p>
          <h1 class="page-title" tabindex="-1">${greeting()}, ${esc(firstName(me.name))}</h1>
          <p class="page-sub">${esc(s.condo.name)}, ${s.condo.units} unidades em ${s.condo.blocks.length} blocos.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" type="button" data-action="new-notice">${icon('megaphone')}Novo aviso</button>
          <button class="btn btn-primary" type="button" data-action="new-ticket">${icon('plus')}Registrar chamado</button>
        </div>
      </header>

      <div class="stats">
        <a class="stat stat-link" href="#chamados" data-go="chamados">
          <span class="stat-label">${icon('chat-circle-text', 'icon-sm')}Chamados abertos</span>
          <span class="stat-value">${c.openTickets}</span>
          <span class="stat-sub ${c.urgentTickets ? 'tone-crit' : 'tone-ok'}">${icon(c.urgentTickets ? 'warning' : 'check-circle')}${c.urgentTickets ? `${CO.plural(c.urgentTickets, 'urgente', 'urgentes')}` : 'Nenhum urgente'}</span>
        </a>
        <a class="stat stat-link" href="#manutencoes" data-go="manutencoes">
          <span class="stat-label">${icon('wrench', 'icon-sm')}Preventivas em dia</span>
          <span class="stat-value">${onTime}<small> de ${total}</small></span>
          <span class="meter ${c.latePlans ? 'tone-warn' : ''}" aria-hidden="true"><span style="width:${(onTime / total) * 100}%"></span></span>
          <span class="stat-sub ${c.latePlans ? 'tone-crit' : 'tone-ok'}">${icon(c.latePlans ? 'warning' : 'check-circle')}${c.latePlans ? `${CO.plural(c.latePlans, 'atrasada', 'atrasadas')}` : 'Nenhuma atrasada'}</span>
        </a>
        <a class="stat stat-link" href="#custos" data-go="custos">
          <span class="stat-label">${icon('chart-bar', 'icon-sm')}Gasto em ${monthName}</span>
          <span class="stat-value">${CO.money0(month.total)}</span>
          <span class="meter ${ratio > 1 ? 'tone-crit' : ratio > 0.9 ? 'tone-warn' : ''}" aria-hidden="true"><span style="width:${Math.min(100, ratio * 100)}%"></span></span>
          <span class="stat-sub">${CO.pct(ratio)} do orçamento de ${CO.money0(budget)}</span>
        </a>
        <a class="stat stat-link" href="#documentos" data-go="documentos">
          <span class="stat-label">${icon('folder', 'icon-sm')}Documentos a resolver</span>
          <span class="stat-value">${c.docsAction}</span>
          <span class="stat-sub ${c.docsExpired ? 'tone-crit' : c.docsAction ? 'tone-warn' : 'tone-ok'}">${icon(c.docsExpired ? 'warning' : 'clock')}${c.docsExpired ? `${c.docsExpired} vencido, ` : ''}${docsSoon} vencem em 60 dias</span>
        </a>
      </div>

      <div class="grid-main">
        ${attentionPanel()}
        ${agendaPanel()}
      </div>

      <div class="grid-2 mt-16">
        <section class="panel" aria-labelledby="recent-title">
          <div class="panel-head"><h2 class="panel-title" id="recent-title">Chamados recentes</h2><a class="link-btn" href="#chamados" data-go="chamados">Ver todos</a></div>
          ${recent.length ? `<ul class="list">${recent.map((t) => `<li>${CO.ticketRow(t, { compact: true })}</li>`).join('')}</ul>` : CO.empty({ title: 'Nenhum chamado aberto', text: 'Quando um morador relatar um problema, ele aparece aqui.' })}
        </section>
        <section class="panel" aria-labelledby="mural-title">
          <div class="panel-head"><h2 class="panel-title" id="mural-title">Mural de avisos</h2><button class="link-btn" type="button" data-action="new-notice">${icon('plus', 'icon-sm')}Novo aviso</button></div>
          <div class="panel-body stack">${notices.map(CO.noticeCard).join('')}</div>
        </section>
      </div>`;
  };

  /* ---------- Página do condômino ---------- */

  const myTicketCard = (t) => {
    const last = Store.lastPublicUpdate(t);
    const mine = t.createdBy === Store.me().id;
    return `
      <li><button class="row-btn" type="button" data-action="open-ticket" data-id="${t.id}" style="flex-direction:column;align-items:stretch;gap:10px">
        <span style="display:flex;gap:12px;align-items:flex-start">
          <span class="ico-tile">${icon(CO.catIcon(t.category))}</span>
          <span class="row-main">
            <span class="row-title">${esc(t.title)}</span>
            <span class="row-meta"><span class="mono">${t.id}</span><span>${mine ? 'Aberto por você' : 'Você apoiou'}</span></span>
          </span>
        </span>
        ${CO.stepper(t)}
        ${last && last.kind !== 'created' ? `<span class="text-sm" style="color:var(--ink-2)"><strong>Última atualização, ${CO.ago(last.at)}:</strong> ${esc(last.text)}</span>` : ''}
      </button></li>`;
  };

  const moneyPanel = () => {
    const months = Store.monthTotals(2);
    const prev = months[0];
    const units = Store.s.condo.units;
    const byCat = {};
    for (const e of prev.list) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const max = cats.length ? cats[0][1] : 1;
    const name = CO.MONTHS_LONG[CO.parse(prev.key + '-01').getMonth()];
    return `
      <section class="panel" aria-labelledby="money-title">
        <div class="panel-head"><h2 class="panel-title" id="money-title">Para onde foi o dinheiro em ${name}</h2></div>
        <div class="panel-body stack">
          <div class="kv">
            <div class="fact"><span class="k">Total gasto</span><span class="v stat-value" style="font-size:24px">${CO.money0(prev.total)}</span></div>
            <div class="fact"><span class="k">Por unidade</span><span class="v stat-value" style="font-size:24px">${CO.money0(prev.total / units)}</span></div>
          </div>
          <div class="hbars">
            ${cats.map(([k, v]) => `<div class="hbar"><div class="hbar-top"><span class="k">${esc(K.EXPENSE_CATS[k].label)}</span><span class="v">${CO.money0(v)}</span></div><div class="hbar-track"><div class="hbar-fill" style="width:${(v / max) * 100}%"></div></div></div>`).join('')}
          </div>
          <a class="link-btn" href="#custos" data-go="custos">Ver todos os gastos${icon('arrow-right', 'icon-sm')}</a>
        </div>
      </section>`;
  };

  const residentAgenda = () => {
    const rows = [];
    for (const p of Store.s.plans) {
      if (!p.affectsResidents) continue;
      const when = p.scheduledAt || p.nextDue;
      const d = CO.daysFromToday(when);
      if (d < 0 || d > 45) continue;
      rows.push({ date: when.slice(0, 10), title: p.title, meta: p.impact || '' });
    }
    for (const n of Store.s.notices) {
      if (n.kind !== 'assembleia' || !n.startsAt || CO.daysFromToday(n.startsAt) < 0) continue;
      rows.push({ date: n.startsAt.slice(0, 10), title: n.title, meta: `${CO.time(n.startsAt)}${n.place ? `, ${n.place}` : ''}` });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return `
      <section class="panel" aria-labelledby="ragenda-title">
        <div class="panel-head"><h2 class="panel-title" id="ragenda-title">Agenda do prédio</h2></div>
        ${rows.length ? `<ul class="list">${rows.map((r) => `<li><div class="row-btn">${dateChip(r.date)}<span class="row-main"><span class="row-title">${esc(r.title)}</span><span class="row-meta"><span>${CO.weekdayShort(r.date)}, ${CO.relDay(r.date)}</span></span>${r.meta ? `<span class="text-sm" style="color:var(--ink-2)">${esc(r.meta)}</span>` : ''}</span></div></li>`).join('')}</ul>` : CO.empty({ ic: 'calendar-blank', tone: 'accent', title: 'Nada programado', text: 'Manutenções que afetam os moradores aparecem aqui com antecedência.' })}
      </section>`;
  };

  const renderMorador = () => {
    const me = Store.me();
    const mine = Store.myTickets().sort((a, b) => {
      const ra = a.status === 'resolvido' ? 1 : 0;
      const rb = b.status === 'resolvido' ? 1 : 0;
      return ra - rb || b.createdAt.localeCompare(a.createdAt);
    });
    const recentResolved = (t) => t.status !== 'resolvido' || -CO.daysFromToday(t.resolvedAt) <= 30;
    const shown = mine.filter(recentResolved).slice(0, 4);
    const pending = mine.filter((t) => t.status === 'resolvido' && t.createdBy === me.id && !t.feedback);
    const feedback = pending
      .map(
        (t) => `
        <div class="callout tone-accent" role="region" aria-label="Confirmação do chamado ${t.id}">
          ${icon('seal-check')}
          <div>
            <strong>O chamado ${t.id} foi marcado como resolvido.</strong>
            <div>${esc(t.title)}. O problema foi resolvido mesmo?</div>
            <div class="callout-actions">
              <button class="btn btn-primary btn-sm" type="button" data-action="ticket-feedback" data-id="${t.id}" data-ok="1">${icon('check')}Sim, resolvido</button>
              <button class="btn btn-secondary btn-sm" type="button" data-action="ticket-feedback" data-id="${t.id}" data-ok="0">Ainda não</button>
            </div>
          </div>
        </div>`
      )
      .join('');
    return `
      <header class="page-head">
        <div class="titles">
          <p class="eyebrow">Apto ${esc(me.unit.replace('-', ', Bloco '))}</p>
          <h1 class="page-title" tabindex="-1">Olá, ${esc(firstName(me.name))}</h1>
          <p class="page-sub">${esc(Store.s.condo.name)}</p>
        </div>
      </header>

      <section class="hero-card" aria-labelledby="hero-title">
        <span class="hero-windows" aria-hidden="true">${'<i></i>'.repeat(12)}</span>
        <div class="hero-text">
          <h2 id="hero-title">Viu algo com problema no prédio?</h2>
          <p>Relate em menos de um minuto, com foto. A síndica recebe na hora e você acompanha cada etapa por aqui.</p>
        </div>
        <button class="btn btn-on-hero" type="button" data-action="new-ticket">${icon('plus')}Relatar problema</button>
      </section>

      ${feedback ? `<div class="stack" style="margin-bottom:20px">${feedback}</div>` : ''}

      <div class="grid-main">
        <div class="stack-lg">
          <section aria-labelledby="avisos-title">
            <h2 class="section-title" id="avisos-title">Avisos</h2>
            <div class="stack">${sortedNotices().slice(0, 4).map(CO.noticeCard).join('')}</div>
          </section>
          <section class="panel" aria-labelledby="meus-title">
            <div class="panel-head"><h2 class="panel-title" id="meus-title">Meus chamados</h2><a class="link-btn" href="#chamados" data-go="chamados">Ver todos</a></div>
            ${shown.length ? `<ul class="list">${shown.map(myTicketCard).join('')}</ul>` : CO.empty({ ic: 'chat-circle-text', tone: 'accent', title: 'Você não tem chamados', text: 'Quando relatar um problema, acompanhe aqui cada etapa até a solução.', action: `<button class="btn btn-primary" type="button" data-action="new-ticket">${icon('plus')}Relatar problema</button>` })}
          </section>
        </div>
        <div class="stack-lg">
          ${residentAgenda()}
          ${moneyPanel()}
        </div>
      </div>`;
  };

  CO.views.inicio = {
    title: () => 'Início',
    render: () => (Store.isSindico() ? renderSindico() : renderMorador()),
  };
})(window.CO);
