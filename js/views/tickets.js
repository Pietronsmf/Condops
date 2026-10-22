/* Chamados: lista, quadro, detalhe, gestão pela síndica e abertura em 3 passos. */
'use strict';

(function (CO) {
  const { esc, Store, F, K } = CO;
  const icon = (n, c) => CO.icon(n, c);
  const ui = (CO.ui = CO.ui || {});
  ui.tFilter = ui.tFilter || 'abertos';
  ui.tSort = ui.tSort || 'urgencia';
  ui.tLayout = ui.tLayout || 'lista';
  ui.tTab = ui.tTab || 'meus';
  ui.tQuery = ui.tQuery || '';

  const URG_RANK = { alta: 0, media: 1, baixa: 2 };
  const affected = (t) => t.supporters.length + 1;

  CO.ticketRow = (t, { compact } = {}) => {
    const open = Store.isOpen(t);
    return `
      <button class="row-btn${open ? ` stripe u-${t.urgency}` : ''}" type="button" data-action="open-ticket" data-id="${t.id}">
        <span class="ico-tile">${icon(CO.catIcon(t.category))}</span>
        <span class="row-main">
          <span class="row-title">${esc(t.title)}</span>
          <span class="row-meta">
            <span class="mono">${t.id}</span>
            <span>${icon('map-pin')}${esc(CO.locationLabel(t.location))}</span>
            ${compact ? '' : `<span>${icon('clock')}${CO.ago(t.createdAt)}</span>`}
            ${t.supporters.length ? `<span>${icon('users-three')}${affected(t)} afetados</span>` : ''}
            ${!compact && t.supplierId ? `<span>${icon('handshake')}${esc(Store.supplierName(t.supplierId))}</span>` : ''}
          </span>
        </span>
        <span class="row-trail">${CO.ticketPill(t)}${open && t.urgency === 'alta' ? '<span class="when tone-crit-text">Urgente</span>' : ''}</span>
      </button>`;
  };

  const matches = (t) => {
    const q = CO.normalize(ui.tQuery);
    if (!q) return true;
    return CO.normalize(`${t.id} ${t.title} ${t.description} ${CO.locationLabel(t.location)} ${Store.cat(t.category).label}`).includes(q);
  };

  const sorters = {
    urgencia: (a, b) => URG_RANK[a.urgency] - URG_RANK[b.urgency] || b.createdAt.localeCompare(a.createdAt),
    recentes: (a, b) => b.createdAt.localeCompare(a.createdAt),
    apoios: (a, b) => affected(b) - affected(a) || b.createdAt.localeCompare(a.createdAt),
  };

  const filtered = () => {
    let list = Store.s.tickets.filter(matches);
    if (ui.tFilter === 'abertos') list = list.filter((t) => Store.isOpen(t));
    if (ui.tFilter === 'resolvidos') list = list.filter((t) => !Store.isOpen(t));
    return list.sort(sorters[ui.tSort]);
  };

  const boardHtml = (list) => `
    <div class="board">
      ${K.STATUS_ORDER.map((st) => {
        const col = list.filter((t) => t.status === st);
        return `<section class="board-col" aria-label="${K.TICKET_STATUS[st].label}">
          <h3>${CO.pill(K.TICKET_STATUS[st].tone, K.TICKET_STATUS[st].label, K.TICKET_STATUS[st].icon)}<span class="n">${col.length}</span></h3>
          ${col.map((t) => `
            <button class="card-btn" type="button" data-action="open-ticket" data-id="${t.id}">
              <span class="row-meta"><span class="mono">${t.id}</span>${t.urgency === 'alta' ? `<span class="tone-crit-text">${icon('warning')}Urgente</span>` : ''}</span>
              <span class="row-title">${esc(t.title)}</span>
              <span class="row-meta"><span>${icon('map-pin')}${esc(t.location.area)}</span><span>${CO.ago(t.createdAt)}</span></span>
            </button>`).join('') || '<p class="text-sm muted" style="padding:4px">Nenhum chamado.</p>'}
        </section>`;
      }).join('')}
    </div>`;

  const isBoard = () => ui.tLayout === 'quadro' && window.matchMedia('(min-width: 1024px)').matches;

  const resultsSindico = () => {
    const list = filtered();
    if (!list.length && !isBoard()) {
      return `<div class="panel">${CO.empty({ ic: ui.tQuery ? 'magnifying-glass' : 'check-circle', tone: ui.tQuery ? 'accent' : 'ok', title: ui.tQuery ? 'Nenhum chamado encontrado' : 'Nenhum chamado aqui', text: ui.tQuery ? 'Tente outra palavra, como o local ou o número do chamado.' : 'Quando um morador relatar um problema, ele aparece nesta lista.' })}</div>`;
    }
    if (isBoard()) {
      // O quadro mostra todas as etapas; resolvidos só dos últimos 30 dias
      const board = Store.s.tickets.filter(matches).filter((t) => Store.isOpen(t) || -CO.daysFromToday(t.resolvedAt) <= 30).sort(sorters[ui.tSort]);
      return boardHtml(board);
    }
    return `<div class="panel"><ul class="list">${list.map((t) => `<li>${CO.ticketRow(t)}</li>`).join('')}</ul></div>`;
  };

  const renderSindico = () => {
    const all = Store.s.tickets;
    const open = all.filter((t) => Store.isOpen(t));
    const urgent = open.filter((t) => t.urgency === 'alta').length;
    const avg = Store.avgFirstResponse();
    const chip = (id, label, n) => `<button class="chip" type="button" data-action="t-filter" data-v="${id}" aria-pressed="${ui.tFilter === id}">${label}<span class="n">${n}</span></button>`;
    return `
      <header class="page-head">
        <div class="titles">
          <h1 class="page-title" tabindex="-1">Chamados</h1>
          <p class="page-sub">${CO.plural(open.length, 'aberto', 'abertos')}, ${CO.plural(urgent, 'urgente', 'urgentes')}.${avg != null ? ` Primeira resposta aos moradores em ${Math.round(avg)} h, em média.` : ''}</p>
        </div>
        <div class="page-actions"><button class="btn btn-primary" type="button" data-action="new-ticket">${icon('plus')}Registrar chamado</button></div>
      </header>
      <div class="toolbar">
        <label class="search" for="t-search"><span class="sr-only">Buscar chamados</span>${icon('magnifying-glass')}<input class="input" id="t-search" type="search" placeholder="Buscar por local, número ou palavra" value="${esc(ui.tQuery)}" autocomplete="off" enterkeyhint="search"></label>
        <div class="chips" role="group" aria-label="Filtrar por situação"${isBoard() ? ' hidden' : ''}>
          ${chip('abertos', 'Abertos', open.length)}${chip('resolvidos', 'Resolvidos', all.length - open.length)}${chip('todos', 'Todos', all.length)}
        </div>
        <label class="sr-only" for="t-sort">Ordenar</label>
        <select class="select" id="t-sort" data-change="t-sort" style="width:auto;min-height:38px;font-size:14px">
          <option value="urgencia"${ui.tSort === 'urgencia' ? ' selected' : ''}>Mais urgentes primeiro</option>
          <option value="recentes"${ui.tSort === 'recentes' ? ' selected' : ''}>Mais recentes primeiro</option>
          <option value="apoios"${ui.tSort === 'apoios' ? ' selected' : ''}>Mais moradores afetados</option>
        </select>
        <div class="desktop-only" style="margin-left:auto">
          ${F.seg({ name: 't-layout', id: 'f-t-layout', label: 'Visualização', hideLabel: true, value: ui.tLayout, change: 't-layout', options: [{ value: 'lista', label: 'Lista', icon: 'rows' }, { value: 'quadro', label: 'Quadro', icon: 'kanban' }] })}
        </div>
      </div>
      <div id="t-results">${resultsSindico()}</div>`;
  };

  const residentRow = (t) => {
    const me = Store.me().id;
    const mine = t.createdBy === me;
    const supported = t.supporters.includes(me);
    const btn = mine
      ? '<span class="pill pill-outline">Aberto por você</span>'
      : `<button class="btn ${supported ? 'btn-ghost' : 'btn-secondary'} btn-sm" type="button" data-action="ticket-support" data-id="${t.id}" aria-pressed="${supported}">${icon(supported ? 'check' : 'hand-pointing')}${supported ? 'Você apoiou' : 'Também me afeta'}</button>`;
    return `<li class="row-wrap">${CO.ticketRow(t, { compact: true })}<span class="row-side">${btn}</span></li>`;
  };

  const renderMorador = () => {
    const mine = Store.myTickets().filter(matches).sort(sorters.recentes);
    const building = Store.buildingTickets().filter((t) => Store.isOpen(t)).filter(matches).sort(sorters.apoios);
    const avg = Store.avgFirstResponse();
    const tab = (id, label, n) => `<button class="tab" type="button" role="tab" data-action="t-tab" data-v="${id}" aria-selected="${ui.tTab === id}">${label}<span class="n">${n}</span></button>`;
    const list = ui.tTab === 'meus' ? mine : building;
    let body;
    if (!list.length) {
      body = ui.tTab === 'meus'
        ? CO.empty({ ic: 'chat-circle-text', tone: 'accent', title: 'Você ainda não abriu chamados', text: 'Relate um problema e acompanhe cada etapa até a solução.', action: `<button class="btn btn-primary" type="button" data-action="new-ticket">${icon('plus')}Relatar problema</button>` })
        : CO.empty({ title: 'Nenhum problema aberto nas áreas comuns', text: 'Se você notar algo, seja o primeiro a avisar.' });
      body = `<div class="panel">${body}</div>`;
    } else if (ui.tTab === 'meus') {
      body = `<div class="panel"><ul class="list">${list.map((t) => `<li>${CO.ticketRow(t)}</li>`).join('')}</ul></div>`;
    } else {
      body = `
        <p class="callout tone-accent" style="margin-bottom:12px">${icon('info')}<span>Antes de abrir um chamado, veja se o problema já foi relatado. Apoiar um chamado mostra à síndica quantas pessoas são afetadas e você recebe as atualizações.</span></p>
        <div class="panel"><ul class="list">${list.map(residentRow).join('')}</ul></div>`;
    }
    return `
      <header class="page-head">
        <div class="titles">
          <h1 class="page-title" tabindex="-1">Chamados</h1>
          <p class="page-sub">Acompanhe o que você relatou e o que já está sendo resolvido no prédio.${avg != null ? ` A síndica responde em ${Math.round(avg)} h, em média.` : ''}</p>
        </div>
        <div class="page-actions"><button class="btn btn-primary" type="button" data-action="new-ticket">${icon('plus')}Relatar problema</button></div>
      </header>
      <div class="tabs" role="tablist" aria-label="Chamados">${tab('meus', 'Meus chamados', Store.myTickets().length)}${tab('predio', 'No prédio', Store.buildingTickets().filter((t) => Store.isOpen(t)).length)}</div>
      ${body}`;
  };

  CO.views.chamados = {
    title: () => 'Chamados',
    render: () => (Store.isSindico() ? renderSindico() : renderMorador()),
    mount(root) {
      const input = root.querySelector('#t-search');
      if (!input) return;
      input.addEventListener('input', () => {
        ui.tQuery = input.value;
        root.querySelector('#t-results').innerHTML = resultsSindico();
      });
    },
  };

  CO.actions['t-filter'] = (el) => { ui.tFilter = el.dataset.v; CO.App.render(); };
  CO.actions['t-tab'] = (el) => { ui.tTab = el.dataset.v; CO.App.render(); };
  CO.changes['t-sort'] = (el) => { ui.tSort = el.value; CO.App.render(); };
  CO.changes['t-layout'] = (el) => { ui.tLayout = el.value; CO.App.render(); };

  /* ---------- Detalhe do chamado ---------- */

  const timelineItem = (u) => {
    const ic = u.kind === 'created' ? 'paper-plane-tilt' : u.kind === 'status' ? K.TICKET_STATUS[u.status].icon : 'chat-circle-text';
    const who = Store.user(u.by);
    const internal = u.visibility === 'internal';
    return `
      <li class="tl-item${internal ? ' is-internal' : ''}">
        <span class="tl-dot">${icon(ic)}</span>
        <div class="tl-body">
          <div class="tl-head"><strong>${esc(who ? who.name : 'Morador')}</strong><span>${CO.date(u.at)}, ${CO.time(u.at)}</span>${internal ? `<span class="tag-internal">${icon('lock')}Só a síndica vê</span>` : ''}</div>
          <p class="tl-text">${esc(u.text)}</p>
        </div>
      </li>`;
  };

  const quoteBlock = (t) => {
    const items = t.quotes
      .map(
        (q) => `
        <div class="quote${q.status === 'aprovado' ? ' is-chosen' : ''}">
          <div class="q-main">
            <div class="q-value">${CO.money(q.amount)}</div>
            <div class="text-sm"><strong>${esc(Store.supplierName(q.supplierId))}</strong>, prazo de ${CO.plural(q.days, 'dia', 'dias')}</div>
            ${q.note ? `<div class="text-sm muted">${esc(q.note)}</div>` : ''}
          </div>
          ${q.status === 'aprovado' ? CO.pill('ok', 'Aprovado', 'check-circle') : `<button class="btn btn-secondary btn-sm" type="button" data-action="approve-quote" data-id="${t.id}" data-q="${q.id}">Aprovar</button>`}
        </div>`
      )
      .join('');
    const cheapest = t.quotes.length > 1 ? Math.min(...t.quotes.map((q) => q.amount)) : null;
    const form = ui.quoteFor === t.id
      ? `
        <form class="form panel" style="padding:16px" id="quote-form" data-form="quote" data-id="${t.id}" novalidate>
          ${F.select({ name: 'supplierId', id: 'f-q-sup', label: 'Fornecedor', placeholder: 'Escolha o fornecedor', required: 'Escolha quem enviou o orçamento.', options: Store.s.suppliers.map((s) => ({ value: s.id, label: s.name })), value: t.supplierId })}
          <div class="field-row">
            ${F.money({ name: 'amount', id: 'f-q-amount', label: 'Valor', required: 'Informe o valor do orçamento.' })}
            ${F.text({ name: 'days', id: 'f-q-days', label: 'Prazo em dias', inputmode: 'numeric', value: '3' })}
          </div>
          ${F.text({ name: 'note', id: 'f-q-note', label: 'O que inclui', optional: true, placeholder: 'Ex.: troca de 2 m de tubulação e reparo do forro' })}
          <div class="inline-actions"><button class="btn btn-primary btn-sm" type="submit">Adicionar orçamento</button><button class="btn btn-ghost btn-sm" type="button" data-action="quote-toggle" data-id="${t.id}">Cancelar</button></div>
        </form>`
      : `<button class="btn btn-secondary btn-sm" type="button" data-action="quote-toggle" data-id="${t.id}" style="align-self:flex-start">${icon('plus')}Adicionar orçamento</button>`;
    return `
      <section class="detail-section">
        <h3>Orçamentos</h3>
        ${t.quotes.length ? '' : '<p class="text-sm muted">Registre os orçamentos recebidos para comparar e deixar a escolha documentada para a prestação de contas.</p>'}
        ${cheapest != null ? `<p class="text-sm muted">${t.quotes.length} orçamentos. Menor valor: ${CO.money(cheapest)}.</p>` : ''}
        ${items}
        ${form}
      </section>`;
  };

  const ticketBody = (id) => () => {
    const t = Store.ticket(id);
    const sind = Store.isSindico();
    const me = Store.me().id;
    const mine = t.createdBy === me;
    const supported = t.supporters.includes(me);
    const idx = K.STATUS_ORDER.indexOf(t.status);
    const steps = CO.stepper(t);
    const updates = t.updates.filter((u) => sind || u.visibility === 'public');
    const eq = t.equipmentId ? Store.equipment(t.equipmentId) : null;
    const canComment = sind || mine || supported;
    const needsFeedback = !sind && mine && t.status === 'resolvido' && !t.feedback;

    const manage = sind
      ? `
      <section class="detail-section">
        <h3>Gestão</h3>
        ${F.seg({ name: 'tk-status', id: 'f-tk-status', label: 'Situação', value: t.status, change: 'ticket-status', data: ` data-id="${t.id}"`, options: K.STATUS_ORDER.map((st) => ({ value: st, label: K.TICKET_STATUS[st].label })) })}
        ${F.seg({ name: 'tk-urg', id: 'f-tk-urg', label: 'Urgência', value: t.urgency, change: 'ticket-urgency', data: ` data-id="${t.id}"`, options: Object.entries(K.URGENCY).map(([value, u]) => ({ value, label: u.short })) })}
        <div class="field-row">
          ${F.select({ name: 'tk-sup', id: 'f-tk-sup', label: 'Fornecedor responsável', placeholder: 'Nenhum ainda', value: t.supplierId, change: 'ticket-supplier', data: ` data-id="${t.id}"`, options: Store.s.suppliers.map((s) => ({ value: s.id, label: s.name })) })}
          ${F.select({ name: 'tk-eq', id: 'f-tk-eq', label: 'Equipamento', placeholder: 'Nenhum', value: t.equipmentId, change: 'ticket-equipment', data: ` data-id="${t.id}"`, options: Store.s.equipment.map((e) => ({ value: e.id, label: e.name })) })}
        </div>
      </section>
      ${quoteBlock(t)}`
      : '';

    return `
      <div class="detail">
        <div class="badges">${CO.ticketPill(t)}${CO.urgencyPill(t)}${CO.pill('', Store.cat(t.category).label, CO.catIcon(t.category))}</div>
        ${needsFeedback ? `
          <div class="callout tone-accent">${icon('seal-check')}<div><strong>A síndica marcou como resolvido.</strong><div>O problema foi resolvido mesmo?</div>
          <div class="callout-actions"><button class="btn btn-primary btn-sm" type="button" data-action="ticket-feedback" data-id="${t.id}" data-ok="1">${icon('check')}Sim, resolvido</button><button class="btn btn-secondary btn-sm" type="button" data-action="ticket-feedback" data-id="${t.id}" data-ok="0">Ainda não</button></div></div></div>` : ''}
        ${steps}
        <dl class="kv">
          <div class="fact"><dt>Local</dt><dd>${esc(CO.locationLabel(t.location))}</dd></div>
          <div class="fact"><dt>Aberto por</dt><dd>${esc(mine ? 'Você' : Store.userLabel(t.createdBy))}</dd></div>
          <div class="fact"><dt>Aberto em</dt><dd>${CO.dateNum(t.createdAt)}, ${CO.time(t.createdAt)}</dd></div>
          <div class="fact"><dt>Afetados</dt><dd>${CO.plural(affected(t), 'morador', 'moradores')}</dd></div>
          ${t.supplierId && !sind ? `<div class="fact"><dt>Fornecedor</dt><dd>${esc(Store.supplierName(t.supplierId))}</dd></div>` : ''}
          ${eq ? `<div class="fact"><dt>Equipamento</dt><dd>${sind ? `<button class="link-btn" type="button" data-action="open-equip" data-id="${eq.id}">${esc(eq.name)}</button>` : esc(eq.name)}</dd></div>` : ''}
        </dl>
        ${t.photo ? `<div class="photo"><img src="${t.photo}" alt="Foto enviada com o chamado"></div>` : ''}
        <section class="detail-section"><h3>Descrição</h3><p class="desc">${esc(t.description)}</p></section>
        ${!sind && !mine && Store.isOpen(t) ? `<button class="btn ${supported ? 'btn-ghost' : 'btn-secondary'}" type="button" data-action="ticket-support" data-id="${t.id}" aria-pressed="${supported}">${icon(supported ? 'check' : 'hand-pointing')}${supported ? 'Você apoiou este chamado' : 'Também me afeta'}</button>` : ''}
        ${manage}
        <section class="detail-section">
          <h3>Atualizações</h3>
          <ol class="timeline">${updates.map(timelineItem).join('')}</ol>
          ${canComment ? `
            <form class="form" id="upd-form" data-form="ticket-update" data-id="${t.id}" novalidate style="margin-top:8px">
              ${F.textarea({ name: 'text', id: `f-upd-${t.id}`, label: sind ? 'Nova atualização' : 'Adicionar informação', rows: 3, keep: true, required: 'Escreva a atualização antes de publicar.', placeholder: sind ? 'Ex.: O técnico vem amanhã às 14h.' : 'Ex.: Piorou hoje de manhã.' })}
              ${sind ? F.toggle({ name: 'public', id: `f-upd-pub-${t.id}`, label: 'Visível para os moradores', hint: 'Desligue para anotações internas, como valores ou negociação.', checked: true }) : ''}
              <button class="btn btn-secondary" type="submit" style="align-self:flex-start">${icon('paper-plane-tilt')}Publicar</button>
            </form>` : ''}
        </section>
      </div>`;
  };

  CO.openTicket = (id) => {
    const t = Store.ticket(id);
    if (!t) return;
    const spec = {
      title: t.title,
      eyebrow: `<span class="mono">${t.id}</span>`,
      live: true,
      body: ticketBody(id),
      foot: Store.isSindico() && Store.isOpen(t)
        ? () => (Store.isOpen(Store.ticket(id)) ? `<button class="btn btn-primary" type="button" data-action="resolve-ticket" data-id="${id}">${icon('check-circle')}Marcar como resolvido</button>` : '')
        : null,
    };
    if (CO.Sheet.isOpen()) CO.Sheet.push(spec);
    else CO.Sheet.open(spec);
  };

  CO.actions['open-ticket'] = (el) => CO.openTicket(el.dataset.id);

  CO.actions['ticket-support'] = (el) => {
    const on = Store.toggleSupport(el.dataset.id);
    CO.toast(on ? 'Pronto. Você vai receber as atualizações deste chamado.' : 'Você deixou de acompanhar este chamado.');
  };

  CO.actions['ticket-feedback'] = (el) => {
    const ok = el.dataset.ok === '1';
    Store.ticketFeedback(el.dataset.id, ok);
    CO.toast(ok ? 'Obrigado. Chamado encerrado.' : 'Chamado reaberto. A síndica foi avisada.');
  };

  CO.actions['quote-toggle'] = (el) => {
    ui.quoteFor = ui.quoteFor === el.dataset.id ? null : el.dataset.id;
    CO.Sheet.refresh();
    if (ui.quoteFor) setTimeout(() => { const f = document.getElementById('f-q-sup'); if (f) f.focus(); }, 0);
  };

  CO.actions['approve-quote'] = (el) => {
    Store.approveQuote(el.dataset.id, el.dataset.q);
    CO.done('Orçamento aprovado e lançado como previsto em Custos.');
  };

  CO.forms.quote = (form, d) => {
    const id = form.dataset.id;
    ui.quoteFor = null;
    Store.addQuote(id, { supplierId: d.supplierId, amount: CO.parseMoney(d.amount), days: parseInt(d.days, 10) || 1, note: d.note });
    CO.toast('Orçamento adicionado.');
  };

  CO.forms['ticket-update'] = (form, d) => {
    const id = form.dataset.id;
    const ta = form.querySelector('textarea');
    ta.value = '';
    const vis = Store.isSindico() ? (d.public ? 'public' : 'internal') : 'public';
    Store.addTicketUpdate(id, d.text, vis);
    CO.toast(vis === 'public' ? 'Atualização publicada. Quem acompanha o chamado foi avisado.' : 'Anotação interna salva.');
  };

  CO.changes['ticket-status'] = (el) => {
    const id = el.dataset.id;
    if (el.value === 'resolvido') {
      CO.Sheet.refresh();
      CO.actions['resolve-ticket']({ dataset: { id } });
      return;
    }
    Store.setTicketStatus(id, el.value);
    CO.done(`Situação alterada para ${K.TICKET_STATUS[el.value].label.toLowerCase()}. Os moradores foram avisados.`);
  };
  CO.changes['ticket-urgency'] = (el) => { Store.setTicketField(el.dataset.id, 'urgency', el.value); CO.done('Urgência atualizada.'); };
  CO.changes['ticket-supplier'] = (el) => { Store.setTicketField(el.dataset.id, 'supplierId', el.value); CO.done('Fornecedor definido.'); };
  CO.changes['ticket-equipment'] = (el) => { Store.setTicketField(el.dataset.id, 'equipmentId', el.value); CO.done('Equipamento vinculado.'); };

  CO.actions['resolve-ticket'] = (el) => {
    const id = el.dataset.id;
    const t = Store.ticket(id);
    const planned = Store.s.expenses.find((e) => e.source && e.source.type === 'ticket' && e.source.id === id && e.status === 'previsto');
    CO.Sheet.push({
      title: 'Marcar como resolvido',
      eyebrow: `<span class="mono">${t.id}</span>`,
      body: () => `
        <form class="form" id="resolve-form" data-form="resolve" data-id="${id}" novalidate>
          <p class="text-sm muted">Quem abriu e quem apoiou o chamado recebe esta mensagem e confirma se o problema foi resolvido.</p>
          ${F.textarea({ name: 'note', id: 'f-res-note', label: 'O que foi feito', rows: 3, required: 'Conte aos moradores o que foi feito.', placeholder: 'Ex.: Tubulação trocada e forro refeito.' })}
          ${F.money({ name: 'cost', id: 'f-res-cost', label: 'Custo final', optional: true, value: planned ? planned.amount : '', hint: planned ? 'Já existe um valor previsto em Custos. Ele passa para pago com este valor.' : 'Se informar, o valor entra em Custos como manutenção corretiva.' })}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-back">Voltar</button>
        <button class="btn btn-primary" type="submit" form="resolve-form">${icon('check-circle')}Resolver chamado</button>`,
    });
  };

  CO.forms.resolve = (form, d) => {
    const id = form.dataset.id;
    const cost = d.cost ? CO.parseMoney(d.cost) : 0;
    CO.Sheet.back();
    Store.resolveTicket(id, { note: d.note, cost });
    CO.done(cost ? `Chamado resolvido e ${CO.money(cost)} lançado em Custos.` : 'Chamado resolvido. Os moradores foram avisados.');
  };

  /* ---------- Abrir chamado em 3 passos ---------- */

  CO.openNewTicket = (prefill = {}) => {
    const sind = Store.isSindico();
    const me = Store.me();
    const draft = {
      step: prefill.category ? 2 : 1,
      category: prefill.category || null,
      locType: 'common',
      area: prefill.area || null,
      detail: '',
      unit: sind ? '' : me.unit,
      title: '',
      description: '',
      urgency: '',
      photo: null,
      equipmentId: prefill.equipmentId || null,
      createdId: null,
    };

    const stepLabel = (n) => `<p class="steps-label">Passo ${n} de 3</p>`;

    const step1 = () => `
      <div class="stack">
        <div class="callout tone-crit">${icon('siren')}<div><strong>Risco imediato?</strong> Gás, fogo, alguém preso no elevador ou alagamento: ligue antes para a portaria, <strong class="num">${esc(Store.s.condo.porterPhone)}</strong>.</div></div>
        ${stepLabel(1)}
        <div class="cat-grid" role="group" aria-label="Tipo de problema">
          ${K.TICKET_CATS.map((c) => `<button class="cat-tile" type="button" data-wz="cat" data-v="${c.id}" aria-pressed="${draft.category === c.id}">${icon(c.icon)}<span>${esc(c.label)}</span></button>`).join('')}
        </div>
      </div>`;

    const step2 = () => `
      <div class="stack">
        ${stepLabel(2)}
        ${F.seg({ name: 'wz-loc', id: 'f-wz-loc', label: 'O problema está', value: draft.locType, change: 'wz-loc', options: [{ value: 'common', label: 'Numa área comum', icon: 'buildings' }, { value: 'unit', label: sind ? 'Numa unidade' : `No meu apto (${me.unit})`, icon: 'door-open' }] })}
        ${draft.locType === 'common'
          ? `<fieldset class="fieldset-plain">
              <legend class="label">Qual área?</legend>
              <div class="area-chips">${K.AREAS.map((a) => `<button class="chip" type="button" data-wz="area" data-v="${esc(a)}" aria-pressed="${draft.area === a}">${esc(a)}</button>`).join('')}</div>
              <p class="error" id="f-wz-area-err" hidden></p>
            </fieldset>
            ${F.text({ name: 'detail', id: 'f-wz-detail', label: 'Complemento', optional: true, value: draft.detail, placeholder: 'Ex.: 3º andar, perto do elevador' })}`
          : sind
            ? F.select({ name: 'unit', id: 'f-wz-unit', label: 'Unidade', placeholder: 'Escolha a unidade', value: draft.unit, options: K.UNITS.map((u) => ({ value: u, label: u })) }) + '<p class="error" id="f-wz-unit-err" hidden></p>'
            : `<p class="callout">${icon('info')}<span>Problemas dentro do apartamento normalmente são de responsabilidade do morador. A síndica avalia se envolve a estrutura do prédio, como prumadas, fiação comum ou infiltração vinda de outra unidade.</span></p>`}
      </div>`;

    const similarHtml = () => {
      if (draft.locType !== 'common') return '';
      const sims = Store.similarOpen(draft.category, draft.area).slice(0, 2);
      if (!sims.length) return '';
      return sims
        .map((t) => {
          const supported = t.supporters.includes(me.id) || t.createdBy === me.id;
          return `
          <div class="callout tone-warn">${icon('copy')}<div>
            <strong>Já existe um chamado parecido aberto.</strong>
            <div>${esc(t.title)}, ${K.TICKET_STATUS[t.status].label.toLowerCase()}, ${CO.plural(affected(t), 'morador afetado', 'moradores afetados')}.</div>
            <div class="callout-actions">
              ${supported || sind ? '' : `<button class="btn btn-primary btn-sm" type="button" data-wz="support" data-v="${t.id}">${icon('hand-pointing')}Também me afeta</button>`}
              <button class="btn btn-secondary btn-sm" type="button" data-wz="view" data-v="${t.id}">Ver chamado</button>
            </div>
            <div class="text-sm" style="margin-top:8px">${supported && !sind ? 'Você já acompanha este chamado. ' : ''}Se for outro problema, continue abaixo.</div>
          </div></div>`;
        })
        .join('');
    };

    const step3 = () => `
      <form class="form" id="wz-form" novalidate>
        ${stepLabel(3)}
        ${similarHtml()}
        ${F.text({ name: 'title', id: 'f-wz-title', label: 'Resumo do problema', value: draft.title, maxlength: 80, required: 'Escreva uma frase curta sobre o problema.', placeholder: 'Ex.: Lâmpada queimada no corredor do 3º andar' })}
        ${F.textarea({ name: 'description', id: 'f-wz-desc', label: 'Detalhes', value: draft.description, rows: 4, required: 'Conte o que você viu para a síndica entender o problema.', hint: 'O que você viu, desde quando e se piora em algum horário.' })}
        ${F.choices({ name: 'urgency', id: 'f-wz-urg', label: 'Quanto isso atrapalha?', value: draft.urgency, required: 'Escolha a urgência.', options: Object.entries(K.URGENCY).map(([value, u]) => ({ value, label: u.label, hint: u.hint })) })}
        ${draft.photo
          ? `<div class="field"><span class="label">Foto</span><div class="photo-preview"><img src="${draft.photo}" alt="Prévia da foto anexada"><button class="btn-icon" type="button" data-wz="photo-remove" aria-label="Remover foto">${icon('trash')}</button></div></div>`
          : F.file({ name: 'photo', id: 'f-wz-photo', label: 'Foto', optional: true, accept: 'image/*', icon: 'camera', text: 'Tirar ou escolher uma foto', hint: 'Uma foto ajuda o fornecedor a chegar com a peça certa.' })}
      </form>`;

    const success = () => {
      const t = Store.ticket(draft.createdId);
      return `
        <div class="success">
          <span class="big-check">${icon('check')}</span>
          <h3>Chamado enviado</h3>
          <p>O número do seu chamado é <strong class="mono">${t.id}</strong>. ${sind ? 'Ele já aparece na lista de chamados.' : 'A síndica foi avisada e você acompanha cada etapa pela página inicial.'}</p>
        </div>`;
    };

    const titles = { 1: 'O que está acontecendo?', 2: 'Onde é o problema?', 3: 'Conte um pouco mais', 4: 'Pronto' };

    const spec = {
      title: titles[draft.step],
      body: () => ({ 1: step1, 2: step2, 3: step3, 4: success })[draft.step](),
      foot: () => {
        if (draft.step === 1) return '<button class="btn btn-secondary" type="button" data-action="sheet-close">Cancelar</button>';
        if (draft.step === 2) return `<button class="btn btn-secondary" type="button" data-wz="back">Voltar</button><button class="btn btn-primary" type="button" data-wz="next">Continuar${icon('arrow-right')}</button>`;
        if (draft.step === 3) return `<button class="btn btn-secondary" type="button" data-wz="back">Voltar</button><button class="btn btn-primary" type="button" data-wz="submit">${icon('paper-plane-tilt')}Enviar chamado</button>`;
        return `<button class="btn btn-secondary" type="button" data-action="sheet-close">Fechar</button><button class="btn btn-primary" type="button" data-wz="track">Acompanhar chamado</button>`;
      },
      mount: (root) => {
        root.addEventListener('click', onClick);
        root.addEventListener('input', capture);
        root.addEventListener('change', onChange);
        root.addEventListener('submit', () => {
          const btn = root.querySelector('[data-wz="submit"]');
          if (btn) btn.click();
        });
      },
    };

    const go = (step, dir = 'swap') => {
      draft.step = step;
      spec.title = titles[step];
      CO.Sheet.render(dir);
    };

    const capture = (e) => {
      const el = e.target;
      if (el.name === 'title') draft.title = el.value;
      if (el.name === 'description') draft.description = el.value;
      if (el.name === 'detail') draft.detail = el.value;
      if (el.name === 'unit') draft.unit = el.value;
      if (el.name === 'urgency') draft.urgency = el.value;
    };

    const onChange = async (e) => {
      const el = e.target;
      capture(e);
      if (el.name === 'wz-loc') {
        draft.locType = el.value;
        CO.Sheet.render();
      }
      if (el.name === 'photo' && el.files && el.files[0]) {
        try {
          draft.photo = await CO.readPhoto(el.files[0]);
          CO.Sheet.render();
        } catch (err) {
          CO.toast('Não foi possível ler essa imagem. Tente uma foto em JPG ou PNG.', { tone: 'warn' });
        }
      }
    };

    const showErr = (id, msg) => {
      const err = document.getElementById(id);
      if (!err) return;
      err.hidden = false;
      err.innerHTML = `${icon('warning-circle')}${esc(msg)}`;
    };

    const onClick = (e) => {
      const b = e.target.closest('[data-wz]');
      if (!b) return;
      const kind = b.dataset.wz;
      if (kind === 'cat') {
        draft.category = b.dataset.v;
        go(2);
      } else if (kind === 'area') {
        draft.area = b.dataset.v;
        CO.$$('[data-wz="area"]', b.parentElement).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        const err = document.getElementById('f-wz-area-err');
        if (err) err.hidden = true;
      } else if (kind === 'back') {
        go(draft.step - 1, 'swap-back');
      } else if (kind === 'next') {
        if (draft.locType === 'common' && !draft.area) return showErr('f-wz-area-err', 'Escolha a área onde está o problema.');
        if (draft.locType === 'unit' && sind && !draft.unit) return showErr('f-wz-unit-err', 'Escolha a unidade.');
        go(3);
      } else if (kind === 'photo-remove') {
        draft.photo = null;
        CO.Sheet.render();
      } else if (kind === 'support') {
        Store.toggleSupport(b.dataset.v);
        CO.Sheet.close();
        CO.toast('Pronto. Em vez de um chamado repetido, você apoiou o que já existe e vai receber as atualizações.');
      } else if (kind === 'view') {
        CO.openTicket(b.dataset.v);
      } else if (kind === 'submit') {
        const form = document.getElementById('wz-form');
        if (!CO.validate(form)) return;
        const location = draft.locType === 'common'
          ? { type: 'common', area: draft.area, detail: draft.detail }
          : { type: 'unit', area: `Unidade ${draft.unit}`, detail: '' };
        draft.createdId = Store.addTicket({ title: draft.title, description: draft.description, category: draft.category, urgency: draft.urgency, location, photo: draft.photo, equipmentId: draft.equipmentId });
        go(4);
      } else if (kind === 'track') {
        const id = draft.createdId;
        CO.Sheet.close();
        setTimeout(() => CO.openTicket(id), 320);
      }
    };

    if (CO.Sheet.isOpen()) CO.Sheet.push(spec);
    else CO.Sheet.open(spec);
  };

  CO.actions['new-ticket'] = (el) => CO.openNewTicket(el && el.dataset && el.dataset.category ? { category: el.dataset.category, area: el.dataset.area, equipmentId: el.dataset.equip } : {});
})(window.CO);
