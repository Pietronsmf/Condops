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
    // O aviso lido sai da lista de novos e vai para "Avisos anteriores"
    CO.animateOut(el.closest('.notice'), () => {
      Store.ackNotice(el.dataset.id);
      CO.toast('Leitura confirmada. A síndica vê quantas unidades já leram.');
    });
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

  /* ---------- Início da síndica: o que resolver hoje ---------- */

  /** Ação de um toque para cada tipo de pendência. */
  const taskAction = (it) => {
    if (it.act === 'open-plan') {
      const st = Store.planStatus(Store.plan(it.id));
      return st.sched ? { act: 'open-plan', label: 'Ver agenda' } : { act: 'plan-done', label: 'Feito hoje', ic: 'check', primary: true };
    }
    if (it.act === 'open-doc') return { act: 'renew-doc', label: 'Renovar', ic: 'arrow-clockwise', primary: it.tone === 'crit' };
    if (it.act === 'open-ticket') return { act: 'ticket-reply', label: it.tone === 'crit' ? 'Atualizar' : 'Responder', ic: 'chat-circle-text', primary: it.tone === 'crit' };
    return { act: it.act, label: 'Ver' };
  };

  const taskRow = (it) => {
    const a = taskAction(it);
    return `
      <li class="task">
        <span class="task-mark tone-${it.tone}" aria-hidden="true">${icon(it.icon)}</span>
        <button class="task-main" type="button" data-action="${it.act}" data-id="${esc(it.id)}">
          <span class="row-title">${esc(it.title)}</span>
          <span class="task-why tone-${it.tone}-text">${esc(it.meta)}</span>
        </button>
        <button class="btn btn-sm ${a.primary ? 'btn-primary' : 'btn-secondary'} task-cta" type="button" data-action="${a.act}" data-id="${esc(it.id)}">${a.ic ? icon(a.ic) : ''}${esc(a.label)}</button>
      </li>`;
  };

  const tasksPanel = (items) => {
    const now = items.filter((i) => i.tone === 'crit');
    const soon = items.filter((i) => i.tone !== 'crit');
    const shownSoon = ui.soonAll ? soon : soon.slice(0, 4);
    if (!items.length) {
      return `<section class="panel">${CO.empty({ title: 'Tudo em dia', text: 'Nenhuma manutenção atrasada, documento vencendo ou chamado sem resposta.' })}</section>`;
    }
    return `
      <section class="panel tasks" aria-labelledby="tasks-title">
        <div class="panel-head"><h2 class="panel-title" id="tasks-title">Para resolver</h2></div>
        ${now.length ? `<h3 class="task-group">Agora <span class="count">${now.length}</span></h3><ul class="task-list">${now.map(taskRow).join('')}</ul>` : ''}
        ${soon.length ? `<h3 class="task-group">Nas próximas semanas <span class="count">${soon.length}</span></h3><ul class="task-list">${shownSoon.map(taskRow).join('')}</ul>` : ''}
        ${soon.length > 4 ? `<div class="panel-foot"><button class="link-btn" type="button" data-action="soon-toggle">${ui.soonAll ? 'Mostrar menos' : `Mostrar mais ${soon.length - 4}`}${icon(ui.soonAll ? 'caret-up' : 'caret-down', 'icon-sm')}</button></div>` : ''}
      </section>`;
  };

  CO.actions['soon-toggle'] = () => {
    ui.soonAll = !ui.soonAll;
    CO.App.render();
  };

  const weekRows = (horizon) => {
    const rows = [];
    for (const p of Store.s.plans) {
      const when = p.scheduledAt || p.nextDue;
      const d = CO.daysFromToday(when);
      if (d < 0 || d > horizon) continue;
      rows.push({ date: when.slice(0, 10), title: p.title, meta: `${Store.supplierName(p.supplierId)}${p.scheduledAt ? `, às ${CO.time(p.scheduledAt)}` : ''}`, act: 'open-plan', id: p.id });
    }
    for (const n of Store.s.notices) {
      if (n.kind !== 'assembleia' || !n.startsAt) continue;
      const d = CO.daysFromToday(n.startsAt);
      if (d < 0 || d > horizon) continue;
      rows.push({ date: n.startsAt.slice(0, 10), title: n.title, meta: `${CO.time(n.startsAt)}${n.place ? `, ${n.place}` : ''}`, act: null, id: n.id });
    }
    if (Store.isSindico()) {
      for (const s of Store.s.suppliers) {
        if (!s.contract) continue;
        const d = CO.daysFromToday(s.contract.end);
        if (d < 0 || d > horizon) continue;
        rows.push({ date: s.contract.end, title: `Fim do contrato: ${s.name}`, meta: 'Decidir se renova', act: 'open-supplier', id: s.id });
      }
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date));
  };

  const agendaRow = (r) => `
    <li>${r.act ? `<button class="row-btn" type="button" data-action="${r.act}" data-id="${esc(r.id)}">` : '<div class="row-btn">'}
      ${dateChip(r.date)}
      <span class="row-main"><span class="row-title">${esc(r.title)}</span><span class="row-meta"><span>${CO.weekdayShort(r.date)}, ${CO.relDay(r.date)}</span>${r.meta ? `<span>${esc(r.meta)}</span>` : ''}</span></span>
    ${r.act ? '</button>' : '</div>'}</li>`;

  const weekPanel = () => {
    const rows = weekRows(7);
    const later = weekRows(30).length - rows.length;
    return `
      <section class="panel" aria-labelledby="week-title">
        <div class="panel-head"><h2 class="panel-title" id="week-title">Esta semana</h2></div>
        ${rows.length ? `<ul class="list">${rows.map(agendaRow).join('')}</ul>` : `<p class="panel-body text-sm muted">Nenhuma manutenção ou compromisso nos próximos 7 dias.</p>`}
        <div class="panel-foot"><a class="link-btn" href="#manutencoes" data-go="manutencoes">${later > 0 ? `Mais ${CO.plural(later, 'compromisso', 'compromissos')} este mês` : 'Ver plano de manutenção'}${icon('arrow-right', 'icon-sm')}</a></div>
      </section>`;
  };

  const muralPanel = () => {
    const units = Store.s.condo.units;
    const items = sortedNotices().slice(0, 3);
    return `
      <section class="panel" aria-labelledby="mural-title">
        <div class="panel-head"><h2 class="panel-title" id="mural-title">Mural</h2><button class="link-btn" type="button" data-action="new-notice">${icon('plus', 'icon-sm')}Novo aviso</button></div>
        <ul class="list">
          ${items.map((n) => {
            const kind = K.NOTICE_KINDS[n.kind];
            const pct = n.readBy.length / units;
            return `<li><div class="row-btn">
              <span class="ico-tile tone-${kind.tone}">${icon(kind.icon)}</span>
              <span class="row-main">
                <span class="row-title">${esc(n.title)}</span>
                <span class="read-meter" role="img" aria-label="${n.readBy.length} de ${units} unidades confirmaram leitura"><span class="meter"><span style="width:${pct * 100}%"></span></span><span class="text-sm muted num">${n.readBy.length}/${units} leram</span></span>
              </span>
            </div></li>`;
          }).join('')}
        </ul>
      </section>`;
  };

  const summarySentence = (items) => {
    const now = items.filter((i) => i.tone === 'crit').length;
    const soon = items.length - now;
    if (now) return `<strong>${CO.plural(now, 'item precisa', 'itens precisam')} de você agora.</strong> ${soon ? `${CO.plural(soon, 'outro vence', 'outros vencem')} nas próximas semanas.` : 'O resto está em dia.'}`;
    if (soon) return `<strong>Nada urgente hoje.</strong> ${CO.plural(soon, 'item pede', 'itens pedem')} atenção nas próximas semanas.`;
    return '<strong>Tudo em dia.</strong> Nada precisa de você agora.';
  };

  const renderSindico = () => {
    const s = Store.s;
    const me = Store.me();
    const c = Store.counts();
    const items = Store.attention();
    const month = Store.monthTotals(1)[0];
    const budget = s.condo.budgetMonthly;
    const ratio = month.total / budget;
    const total = s.plans.length;
    const onTime = total - c.latePlans;
    const docsSoon = c.docsAction - c.docsExpired;
    const monthName = CO.MONTHS_LONG[CO.today().getMonth()];
    return `
      <header class="page-head">
        <div class="titles">
          <p class="eyebrow">${esc(CO.weekdayLong(CO.iso(CO.today())))}</p>
          <h1 class="page-title" tabindex="-1">${greeting()}, ${esc(firstName(me.name))}</h1>
          <p class="page-lede">${summarySentence(items)}</p>
        </div>
      </header>

      <section class="vitals" aria-label="Situação do prédio">
        <a class="vital" href="#chamados" data-go="chamados">
          <span class="vital-k">Chamados abertos</span>
          <span class="vital-v">${c.openTickets}</span>
          <span class="vital-s ${c.urgentTickets ? 'tone-crit-text' : 'tone-ok-text'}">${c.urgentTickets ? CO.plural(c.urgentTickets, 'urgente', 'urgentes') : 'Nenhum urgente'}</span>
        </a>
        <a class="vital" href="#manutencoes" data-go="manutencoes">
          <span class="vital-k">Preventivas em dia</span>
          <span class="vital-v">${onTime}<small>/${total}</small></span>
          <span class="vital-s ${c.latePlans ? 'tone-crit-text' : 'tone-ok-text'}">${c.latePlans ? CO.plural(c.latePlans, 'atrasada', 'atrasadas') : 'Nenhuma atrasada'}</span>
        </a>
        <a class="vital" href="#custos" data-go="custos">
          <span class="vital-k">Gasto em ${monthName}</span>
          <span class="vital-v">${CO.moneyShort(month.total)}</span>
          <span class="vital-s ${ratio > 1 ? 'tone-crit-text' : ''}">${CO.pct(ratio)} do orçamento</span>
        </a>
        <a class="vital" href="#documentos" data-go="documentos">
          <span class="vital-k">Documentos</span>
          <span class="vital-v">${c.docsExpired ? `${c.docsExpired}<small> vencido</small>` : `${c.docsAction}<small> a renovar</small>`}</span>
          <span class="vital-s ${c.docsExpired ? 'tone-crit-text' : docsSoon ? 'tone-warn-text' : 'tone-ok-text'}">${docsSoon ? `${docsSoon} vencem em 60 dias` : 'Nenhum vencendo'}</span>
        </a>
      </section>

      <div class="grid-main">
        ${tasksPanel(items)}
        <div class="stack">
          ${weekPanel()}
          ${muralPanel()}
        </div>
      </div>`;
  };

  /* ---------- Início do condômino ---------- */

  const myTicketCard = (t) => {
    const last = Store.lastPublicUpdate(t);
    const mine = t.createdBy === Store.me().id;
    return `
      <li><button class="row-btn ticket-card" type="button" data-action="open-ticket" data-id="${t.id}">
        <span class="ticket-card-top">
          <span class="ico-tile">${icon(CO.catIcon(t.category))}</span>
          <span class="row-main">
            <span class="row-title">${esc(t.title)}</span>
            <span class="row-meta"><span>${mine ? 'Aberto por você' : 'Você apoiou'}, ${CO.ago(t.createdAt)}</span></span>
          </span>
        </span>
        ${CO.stepper(t)}
        ${last && last.kind !== 'created' ? `<span class="last-update">${icon('chat-circle-text', 'icon-sm')}<span><strong>${CO.ago(last.at)}:</strong> ${esc(last.text)}</span></span>` : ''}
      </button></li>`;
  };

  const moneyPanel = () => {
    const prev = Store.monthTotals(2)[0];
    const units = Store.s.condo.units;
    const budget = Store.s.condo.budgetMonthly;
    const byCat = {};
    for (const e of prev.list) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const max = cats.length ? cats[0][1] : 1;
    const name = CO.MONTHS_LONG[CO.parse(prev.key + '-01').getMonth()];
    const diff = prev.total - budget;
    return `
      <section class="panel" aria-labelledby="money-title">
        <div class="panel-head"><h2 class="panel-title" id="money-title">Dinheiro do condomínio</h2></div>
        <div class="panel-body stack">
          <p class="money-sentence">Em ${name}, o condomínio gastou <strong>${CO.money0(prev.total)}</strong>, ou <strong>${CO.money0(prev.total / units)} por apartamento</strong>. Ficou ${diff > 0 ? `<span class="tone-crit-text">${CO.money0(diff)} acima</span>` : `<span class="tone-ok-text">${CO.money0(-diff)} abaixo</span>`} do orçamento.</p>
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
      rows.push({ date: when.slice(0, 10), title: p.title, meta: p.impact || '', act: null, id: p.id });
    }
    for (const n of Store.s.notices) {
      if (n.kind !== 'assembleia' || !n.startsAt || CO.daysFromToday(n.startsAt) < 0) continue;
      rows.push({ date: n.startsAt.slice(0, 10), title: n.title, meta: `${CO.time(n.startsAt)}${n.place ? `, ${n.place}` : ''}`, act: null, id: n.id });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return `
      <section class="panel" aria-labelledby="ragenda-title">
        <div class="panel-head"><h2 class="panel-title" id="ragenda-title">Agenda do prédio</h2></div>
        ${rows.length ? `<ul class="list">${rows.slice(0, 4).map(agendaRow).join('')}</ul>` : `<p class="panel-body text-sm muted">Nada programado. Manutenções que afetam os moradores aparecem aqui com antecedência.</p>`}
      </section>`;
  };

  const renderMorador = () => {
    const me = Store.me();
    const unit = me.unit;
    const mine = Store.myTickets().sort((a, b) => {
      const ra = a.status === 'resolvido' ? 1 : 0;
      const rb = b.status === 'resolvido' ? 1 : 0;
      return ra - rb || b.createdAt.localeCompare(a.createdAt);
    });
    const shown = mine.filter((t) => t.status !== 'resolvido' || -CO.daysFromToday(t.resolvedAt) <= 30).slice(0, 3);
    const pending = mine.filter((t) => t.status === 'resolvido' && t.createdBy === me.id && !t.feedback);
    const notices = sortedNotices();
    const unread = notices.filter((n) => !n.readBy.includes(unit));
    const read = notices.filter((n) => n.readBy.includes(unit));
    const feedback = pending
      .map(
        (t) => `
        <div class="callout tone-accent" role="region" aria-label="Confirmação do chamado ${t.id}">
          ${icon('seal-check')}
          <div>
            <strong>A síndica resolveu: ${esc(t.title)}.</strong>
            <div>O problema foi resolvido mesmo?</div>
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
          <p class="eyebrow">Apto ${esc(unit.replace('-', ', Bloco '))}</p>
          <h1 class="page-title" tabindex="-1">Olá, ${esc(firstName(me.name))}</h1>
          <p class="page-lede">${unread.length ? `<strong>${CO.plural(unread.length, 'aviso novo', 'avisos novos')}</strong> do condomínio para você.` : '<strong>Você está em dia</strong> com os avisos do condomínio.'}</p>
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
          ${unread.length ? `
            <section aria-labelledby="avisos-title">
              <h2 class="section-title" id="avisos-title">Avisos novos</h2>
              <div class="stack">${unread.map(CO.noticeCard).join('')}</div>
            </section>` : ''}
          <section class="panel" aria-labelledby="meus-title">
            <div class="panel-head"><h2 class="panel-title" id="meus-title">Meus chamados</h2>${mine.length ? '<a class="link-btn" href="#chamados" data-go="chamados">Ver todos</a>' : ''}</div>
            ${shown.length ? `<ul class="list">${shown.map(myTicketCard).join('')}</ul>` : CO.empty({ ic: 'chat-circle-text', tone: 'accent', title: 'Nenhum chamado em andamento', text: 'Quando relatar um problema, você acompanha aqui cada etapa até a solução.' })}
          </section>
          ${read.length ? `
            <details class="disclosure">
              <summary>${icon('caret-right', 'disclosure-caret')}Avisos anteriores <span class="count">${read.length}</span></summary>
              <div class="stack">${read.map(CO.noticeCard).join('')}</div>
            </details>` : ''}
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
