/* Ações rápidas: botão "Novo", registrar manutenção feita e busca global. */
'use strict';

(function (CO) {
  const { esc, Store } = CO;
  const icon = (n, c) => CO.icon(n, c);

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  CO.shortcutLabel = () => (isMac ? '⌘ K' : 'Ctrl K');

  /* ---------- Botão "Novo" ---------- */

  const NEW_ACTIONS = [
    { act: 'new-ticket', ic: 'chat-circle-text', label: 'Registrar chamado', hint: 'Problema visto por você ou avisado na portaria' },
    { act: 'quick-exec', ic: 'check-circle', label: 'Registrar manutenção feita', hint: 'Escolha o item do plano e confirme' },
    { act: 'new-notice', ic: 'megaphone', label: 'Publicar aviso', hint: 'Interrupção, obra ou assembleia' },
    { act: 'new-expense', ic: 'receipt', label: 'Lançar gasto', hint: 'Conta, serviço ou compra' },
    { act: 'new-doc', ic: 'upload-simple', label: 'Adicionar documento', hint: 'Laudo, contrato, ata ou certificado' },
  ];

  CO.actions['open-new'] = (el) => {
    const desktop = window.matchMedia('(min-width: 1024px)').matches && !el.classList.contains('fab');
    if (desktop) {
      CO.Popover.open(
        el,
        NEW_ACTIONS.map((a) => `<button class="menu-item" type="button" role="menuitem" data-action="${a.act}">${icon(a.ic)}<span><strong>${a.label}</strong><small>${a.hint}</small></span></button>`).join('')
      );
      return;
    }
    CO.Sheet.open({
      title: 'O que você quer fazer?',
      body: () => `
        <ul class="list action-list">
          ${NEW_ACTIONS.map((a) => `
            <li><button class="row-btn" type="button" data-action="${a.act}">
              <span class="ico-tile tone-accent">${icon(a.ic)}</span>
              <span class="row-main"><span class="row-title">${a.label}</span><span class="row-meta"><span>${a.hint}</span></span></span>
              ${icon('caret-right', 'muted')}
            </button></li>`).join('')}
        </ul>`,
    });
  };

  /** Lista do plano para escolher o que foi feito; um toque abre a confirmação. */
  CO.actions['quick-exec'] = () => {
    const spec = {
      title: 'Qual manutenção foi feita?',
      live: true,
      body: () => {
        const plans = Store.plansSorted();
        return `
          <p class="text-sm muted" style="margin-bottom:8px">Os itens mais urgentes aparecem primeiro.</p>
          <ul class="list">
            ${plans.map((p) => {
              const st = Store.planStatus(p);
              return `<li><button class="row-btn" type="button" data-action="register-exec" data-id="${p.id}">
                <span class="row-main"><span class="row-title">${esc(p.title)}</span><span class="row-meta"><span>${esc(Store.supplierName(p.supplierId))}</span></span></span>
                ${CO.pill(st.tone, st.label, st.icon)}
              </button></li>`;
            }).join('')}
          </ul>`;
      },
    };
    if (CO.Sheet.isOpen()) CO.Sheet.replace(spec);
    else CO.Sheet.open(spec);
  };

  /* ---------- Busca global ---------- */

  const pages = () =>
    (Store.isSindico()
      ? [['inicio', 'Início', 'house'], ['chamados', 'Chamados', 'chat-circle-text'], ['manutencoes', 'Manutenções', 'wrench'], ['equipamentos', 'Equipamentos', 'gauge'], ['fornecedores', 'Fornecedores', 'handshake'], ['documentos', 'Documentos', 'folder'], ['custos', 'Custos', 'chart-bar']]
      : [['inicio', 'Início', 'house'], ['chamados', 'Chamados', 'chat-circle-text'], ['documentos', 'Documentos', 'folder'], ['custos', 'Transparência', 'chart-bar']]);

  const index = () => {
    const sind = Store.isSindico();
    const items = [];
    for (const t of Store.s.tickets) {
      if (!Store.canSee(t)) continue;
      items.push({ group: 'Chamados', ic: CO.catIcon(t.category), title: t.title, meta: `${t.id}, ${CO.locationLabel(t.location)}`, pill: CO.ticketPill(t), act: 'open-ticket', id: t.id, text: `${t.id} ${t.title} ${t.description} ${CO.locationLabel(t.location)}` });
    }
    if (sind) {
      for (const p of Store.s.plans) {
        const st = Store.planStatus(p);
        items.push({ group: 'Manutenções', ic: 'wrench', title: p.title, meta: Store.supplierName(p.supplierId), pill: CO.pill(st.tone, st.label, st.icon), act: 'open-plan', id: p.id, text: `${p.title} ${Store.supplierName(p.supplierId)}` });
      }
      for (const e of Store.s.equipment) {
        items.push({ group: 'Equipamentos', ic: CO.K.EQUIP_TYPES[e.type].icon, title: e.name, meta: e.location, act: 'open-equip', id: e.id, text: `${e.name} ${e.location} ${e.brand} ${e.model}` });
      }
      for (const s of Store.s.suppliers) {
        items.push({ group: 'Fornecedores', ic: 'handshake', title: s.name, meta: s.category, act: 'open-supplier', id: s.id, text: `${s.name} ${s.category} ${s.contact} ${s.phone}` });
      }
    }
    for (const d of Store.s.documents) {
      if (!sind && d.visibility !== 'publico') continue;
      const st = Store.docStatus(d);
      items.push({ group: 'Documentos', ic: 'file-text', title: d.title, meta: d.expiresAt ? `Validade ${CO.dateNum(d.expiresAt)}` : 'Sem validade', pill: st.key !== 'none' ? CO.pill(st.tone, st.label, st.icon) : '', act: 'open-doc', id: d.id, text: d.title });
    }
    return items;
  };

  const resultRow = (it) => `
    <li><button class="row-btn" type="button" data-action="${it.act}" data-id="${esc(it.id)}">
      <span class="ico-tile">${icon(it.ic)}</span>
      <span class="row-main"><span class="row-title">${esc(it.title)}</span><span class="row-meta"><span>${esc(it.meta)}</span></span></span>
      ${it.pill || ''}
    </button></li>`;

  const results = (q) => {
    const nq = CO.normalize(q.trim());
    if (!nq) {
      return `
        <h3 class="search-group">Ir para</h3>
        <ul class="list">${pages().map(([id, label, ic]) => `<li><button class="row-btn" type="button" data-go="${id}"><span class="ico-tile tone-accent">${icon(ic)}</span><span class="row-main"><span class="row-title">${label}</span></span>${icon('arrow-right', 'muted')}</button></li>`).join('')}</ul>
        <p class="text-sm muted search-tip">Busque por número do chamado, local, equipamento, fornecedor ou documento.</p>`;
    }
    const words = nq.split(/\s+/);
    const scored = index()
      .map((it) => {
        const hay = CO.normalize(it.text);
        if (!words.every((w) => hay.includes(w))) return null;
        const title = CO.normalize(it.title);
        return { it, score: title.startsWith(nq) ? 0 : title.includes(nq) ? 1 : 2 };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 24)
      .map((x) => x.it);
    if (!scored.length) return CO.empty({ ic: 'magnifying-glass', tone: 'accent', title: `Nada encontrado para "${q.trim()}"`, text: 'Tente outra palavra, como o local, o fornecedor ou o número do chamado.' });
    const groups = [...new Set(scored.map((x) => x.group))];
    return groups.map((g) => `<h3 class="search-group">${g}</h3><ul class="list">${scored.filter((x) => x.group === g).map(resultRow).join('')}</ul>`).join('');
  };

  CO.actions['open-search'] = () => {
    let query = '';
    const spec = {
      title: 'Buscar',
      focus: '#g-search',
      body: () => `
        <label class="search search-lg" for="g-search"><span class="sr-only">Buscar no condomínio</span>${icon('magnifying-glass')}<input class="input" id="g-search" type="search" placeholder="Chamado, equipamento, fornecedor..." value="${esc(query)}" autocomplete="off" enterkeyhint="search"></label>
        <div id="g-results" aria-live="polite">${results(query)}</div>`,
      mount: (root) => {
        const input = root.querySelector('#g-search');
        const out = root.querySelector('#g-results');
        input.addEventListener('input', () => {
          query = input.value;
          out.innerHTML = results(query);
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const first = out.querySelector('button');
            if (first) first.click();
          }
        });
      },
    };
    CO.Sheet.open(spec);
  };

  // Atalhos: Ctrl/Cmd+K ou "/" abrem a busca (sem animação extra: é uma ação de teclado frequente)
  document.addEventListener('keydown', (e) => {
    if (!Store.s || !Store.role()) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      CO.actions['open-search']();
    }
  });
})(window.CO);
