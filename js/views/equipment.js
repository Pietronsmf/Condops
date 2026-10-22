/* Equipamentos: cadastro dos sistemas do prédio, garantia e histórico. */
'use strict';

(function (CO) {
  const { esc, Store, F, K } = CO;
  const icon = (n, c) => CO.icon(n, c);
  const ui = (CO.ui = CO.ui || {});
  ui.eFilter = ui.eFilter || 'todos';

  const TICKET_CAT = { elevador: 'elevador', bomba: 'hidraulica', gerador: 'eletrica', portao: 'portao', cftv: 'seguranca', incendio: 'outro', spda: 'eletrica', reservatorio: 'hidraulica', interfone: 'interfone', iluminacao: 'eletrica', outro: 'outro' };
  const TICKET_AREA = { bomba: 'Casa de bombas', gerador: 'Garagem (subsolo)', portao: 'Portão da garagem', cftv: 'Portaria', incendio: 'Escadas e corredores', spda: 'Cobertura e telhado', reservatorio: 'Cobertura e telhado', interfone: 'Portaria', iluminacao: 'Escadas e corredores' };
  const areaFor = (e) => (e.type === 'elevador' ? `Elevador Bloco ${/B$/.test(e.location) ? 'B' : 'A'}` : TICKET_AREA[e.type] || '');

  const nextMaintenance = (e) => {
    const plans = Store.plansFor(e.id).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
    return plans[0] || null;
  };

  const warrantyText = (e) => {
    if (!e.warrantyUntil) return 'Sem garantia vigente';
    const d = CO.daysFromToday(e.warrantyUntil);
    return d < 0 ? `Encerrada em ${CO.date(e.warrantyUntil, { year: true })}` : `Até ${CO.date(e.warrantyUntil, { year: true })} (${CO.relDay(e.warrantyUntil)})`;
  };

  const age = (iso) => {
    const years = Math.floor(-CO.daysFromToday(iso) / 365.25);
    return years < 1 ? 'menos de 1 ano' : CO.plural(years, 'ano', 'anos');
  };

  const card = (e) => {
    const st = K.EQUIP_STATUS[e.status];
    const next = nextMaintenance(e);
    const nst = next ? Store.planStatus(next) : null;
    const openT = Store.s.tickets.filter((t) => t.equipmentId === e.id && Store.isOpen(t)).length;
    return `
      <button class="card-btn" type="button" data-action="open-equip" data-id="${e.id}">
        <span class="card-top">
          <span class="ico-tile tone-${st.tone === 'ok' ? 'accent' : st.tone}">${icon(K.EQUIP_TYPES[e.type].icon)}</span>
          <span class="row-main"><span class="row-title">${esc(e.name)}</span><span class="row-meta"><span>${esc(e.location)}</span></span></span>
          ${CO.pill(st.tone, st.label, st.icon)}
        </span>
        <span class="card-facts">
          <span class="fact"><span class="k">Próxima manutenção</span><span class="v${nst && nst.key === 'late' ? ' tone-crit-text' : ''}">${next ? `${CO.date(next.nextDue)}, ${CO.relDay(next.nextDue)}` : 'Sem plano'}</span></span>
          <span class="fact"><span class="k">Garantia</span><span class="v">${esc(e.warrantyUntil && CO.daysFromToday(e.warrantyUntil) >= 0 ? `Até ${CO.date(e.warrantyUntil, { year: true })}` : 'Fora da garantia')}</span></span>
          <span class="fact"><span class="k">Responsável</span><span class="v">${esc(Store.supplierName(e.supplierId))}</span></span>
          <span class="fact"><span class="k">Chamados abertos</span><span class="v">${openT || 'Nenhum'}</span></span>
        </span>
      </button>`;
  };

  CO.views.equipamentos = {
    title: () => 'Equipamentos',
    render() {
      const all = Store.s.equipment;
      const list = ui.eFilter === 'todos' ? all : all.filter((e) => e.status === ui.eFilter);
      const n = (s) => all.filter((e) => e.status === s).length;
      const chip = (id, label, count) => `<button class="chip" type="button" data-action="e-filter" data-v="${id}" aria-pressed="${ui.eFilter === id}">${label}<span class="n">${count}</span></button>`;
      return `
        <header class="page-head">
          <div class="titles">
            <h1 class="page-title" tabindex="-1">Equipamentos</h1>
            <p class="page-sub">Os sistemas do prédio com garantia, responsável, plano de manutenção e tudo o que já aconteceu com cada um.</p>
          </div>
          <div class="page-actions"><button class="btn btn-primary" type="button" data-action="new-equip">${icon('plus')}Cadastrar equipamento</button></div>
        </header>
        <div class="toolbar"><div class="chips" role="group" aria-label="Filtrar por estado">${chip('todos', 'Todos', all.length)}${chip('atencao', 'Atenção', n('atencao'))}${chip('parado', 'Parados', n('parado'))}${chip('operando', 'Operando', n('operando'))}</div></div>
        ${list.length ? `<div class="cards">${list.map(card).join('')}</div>` : `<div class="panel">${CO.empty({ title: ui.eFilter === 'parado' ? 'Nenhum equipamento parado' : 'Nada por aqui', text: 'Use os filtros acima para ver os outros equipamentos.' })}</div>`}`;
    },
  };

  CO.actions['e-filter'] = (el) => { ui.eFilter = el.dataset.v; CO.App.render(); };

  const relatedRow = (act, id, ic, title, meta, pill) => `
    <li><button class="row-btn" type="button" data-action="${act}" data-id="${esc(id)}">
      <span class="ico-tile">${icon(ic)}</span>
      <span class="row-main"><span class="row-title">${esc(title)}</span><span class="row-meta"><span>${meta}</span></span></span>
      ${pill || ''}
    </button></li>`;

  const equipBody = (id) => () => {
    const e = Store.equipment(id);
    const plans = Store.plansFor(id);
    const tickets = Store.s.tickets.filter((t) => t.equipmentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const docs = Store.s.documents.filter((d) => d.equipmentId === id);
    return `
      <div class="detail">
        ${F.seg({ name: 'eq-status', id: 'f-eq-status', label: 'Estado atual', value: e.status, change: 'equip-status', data: ` data-id="${e.id}"`, options: Object.entries(K.EQUIP_STATUS).map(([value, s]) => ({ value, label: s.label, icon: s.icon })) })}
        <dl class="kv">
          <div class="fact"><dt>Local</dt><dd>${esc(e.location)}</dd></div>
          <div class="fact"><dt>Tipo</dt><dd>${esc(K.EQUIP_TYPES[e.type].label)}</dd></div>
          <div class="fact"><dt>Marca e modelo</dt><dd>${esc(e.brand)}, ${esc(e.model)}</dd></div>
          <div class="fact"><dt>Instalado em</dt><dd>${CO.dateNum(e.installedAt)} (${age(e.installedAt)})</dd></div>
          <div class="fact"><dt>Garantia</dt><dd>${esc(warrantyText(e))}</dd></div>
          <div class="fact"><dt>Responsável</dt><dd>${e.supplierId ? `<button class="link-btn" type="button" data-action="open-supplier" data-id="${e.supplierId}">${esc(Store.supplierName(e.supplierId))}</button>` : 'Equipe interna'}</dd></div>
        </dl>
        ${e.notes ? `<div class="callout">${icon('note')}<span>${esc(e.notes)}</span></div>` : ''}
        <section class="detail-section">
          <h3>Plano de manutenção</h3>
          ${plans.length ? `<ul class="list">${plans.map((p) => { const st = Store.planStatus(p); return relatedRow('open-plan', p.id, 'wrench', p.title, `${esc(Store.freq(p.freq).label)}, próxima em ${CO.date(p.nextDue)}`, CO.pill(st.tone, st.label, st.icon)); }).join('')}</ul>` : '<p class="text-sm muted">Nenhum item do plano ligado a este equipamento.</p>'}
        </section>
        <section class="detail-section">
          <h3>Chamados</h3>
          ${tickets.length ? `<ul class="list">${tickets.map((t) => relatedRow('open-ticket', t.id, CO.catIcon(t.category), t.title, `${t.id}, ${CO.date(t.createdAt)}`, CO.ticketPill(t))).join('')}</ul>` : '<p class="text-sm muted">Nenhum chamado registrado para este equipamento.</p>'}
        </section>
        ${docs.length ? `<section class="detail-section"><h3>Documentos</h3><ul class="list">${docs.map((d) => { const st = Store.docStatus(d); return relatedRow('open-doc', d.id, 'file-text', d.title, d.expiresAt ? `Validade ${CO.dateNum(d.expiresAt)}` : 'Sem validade', st.key !== 'none' ? CO.pill(st.tone, st.label, st.icon) : ''); }).join('')}</ul></section>` : ''}
      </div>`;
  };

  CO.openEquip = (id) => {
    const e = Store.equipment(id);
    if (!e) return;
    const spec = {
      title: e.name,
      eyebrow: 'Equipamento',
      live: true,
      body: equipBody(id),
      foot: () => `<button class="btn btn-secondary" type="button" data-action="new-ticket" data-category="${TICKET_CAT[e.type]}" data-area="${esc(areaFor(e))}" data-equip="${e.id}">${icon('chat-circle-text')}Abrir chamado</button>`,
    };
    if (CO.Sheet.isOpen()) CO.Sheet.push(spec);
    else CO.Sheet.open(spec);
  };

  CO.actions['open-equip'] = (el) => CO.openEquip(el.dataset.id);

  CO.changes['equip-status'] = (el) => {
    Store.setEquipmentStatus(el.dataset.id, el.value);
    CO.done(`Estado alterado para ${K.EQUIP_STATUS[el.value].label.toLowerCase()}.`);
  };

  CO.actions['new-equip'] = () => {
    CO.Sheet.open({
      title: 'Cadastrar equipamento',
      body: () => `
        <form class="form" id="equip-form" data-form="equip" novalidate>
          ${F.text({ name: 'name', id: 'f-eq-name', label: 'Nome', required: 'Dê um nome que todos reconheçam.', placeholder: 'Ex.: Bomba da piscina' })}
          <div class="field-row">
            ${F.select({ name: 'type', id: 'f-eq-type', label: 'Tipo', value: 'outro', options: Object.entries(K.EQUIP_TYPES).map(([value, t]) => ({ value, label: t.label })) })}
            ${F.text({ name: 'location', id: 'f-eq-loc', label: 'Onde fica', required: 'Informe onde o equipamento fica.', placeholder: 'Ex.: Casa de máquinas da piscina' })}
          </div>
          <div class="field-row">
            ${F.text({ name: 'brand', id: 'f-eq-brand', label: 'Marca', optional: true })}
            ${F.text({ name: 'model', id: 'f-eq-model', label: 'Modelo', optional: true })}
          </div>
          <div class="field-row">
            ${F.date({ name: 'installedAt', id: 'f-eq-inst', label: 'Instalado em', value: CO.iso(CO.today()), required: 'Informe a data aproximada.' })}
            ${F.date({ name: 'warrantyUntil', id: 'f-eq-war', label: 'Garantia até', optional: true })}
          </div>
          ${F.select({ name: 'supplierId', id: 'f-eq-sup', label: 'Responsável pela manutenção', options: [{ value: '', label: 'Equipe interna' }].concat(Store.s.suppliers.map((s) => ({ value: s.id, label: s.name }))) })}
          ${F.textarea({ name: 'notes', id: 'f-eq-notes', label: 'Observações', optional: true, rows: 3 })}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-close">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="equip-form">${icon('plus')}Cadastrar</button>`,
    });
  };

  CO.forms.equip = (form, d) => {
    Store.addEquipment({ name: d.name, type: d.type, location: d.location, brand: d.brand || 'Não informada', model: d.model || 'Não informado', installedAt: d.installedAt, warrantyUntil: d.warrantyUntil || null, supplierId: d.supplierId || null, notes: d.notes });
    CO.Sheet.close();
    CO.done('Equipamento cadastrado. Que tal criar um item no plano de manutenção para ele?');
  };
})(window.CO);
