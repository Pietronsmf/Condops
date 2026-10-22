/* Fornecedores: contatos, contratos, avaliação e histórico de serviços. */
'use strict';

(function (CO) {
  const { esc, Store, F } = CO;
  const icon = (n, c) => CO.icon(n, c);
  const ui = (CO.ui = CO.ui || {});
  ui.sFilter = ui.sFilter || 'todos';
  ui.sQuery = ui.sQuery || '';

  const row = (s) => {
    const cs = Store.contractStatus(s);
    const spend = Store.supplierSpend(s.id);
    return `
      <button class="row-btn" type="button" data-action="open-supplier" data-id="${s.id}">
        ${CO.avatar(s.name)}
        <span class="row-main">
          <span class="row-title">${esc(s.name)}</span>
          <span class="row-meta"><span>${esc(s.category)}</span><span>${CO.stars(s.rating)}</span></span>
        </span>
        <span class="row-trail">
          ${cs ? CO.pill(cs.tone, cs.label, cs.tone === 'ok' ? 'handshake' : 'clock') : '<span class="pill pill-outline">Serviço avulso</span>'}
          <span class="when num">${spend ? `${CO.money0(spend)} em 12 meses` : 'Sem pagamentos em 12 meses'}</span>
        </span>
      </button>`;
  };

  const results = () => {
    const q = CO.normalize(ui.sQuery);
    let list = Store.s.suppliers.filter((s) => !q || CO.normalize(`${s.name} ${s.category} ${s.contact}`).includes(q));
    if (ui.sFilter === 'contrato') list = list.filter((s) => s.contract);
    if (ui.sFilter === 'avulso') list = list.filter((s) => !s.contract);
    list.sort((a, b) => Store.supplierSpend(b.id) - Store.supplierSpend(a.id));
    if (!list.length) return `<div class="panel">${CO.empty({ ic: 'magnifying-glass', tone: 'accent', title: 'Nenhum fornecedor encontrado', text: 'Busque pelo nome, pelo serviço ou pelo contato.' })}</div>`;
    return `<div class="panel"><ul class="list">${list.map((s) => `<li>${row(s)}</li>`).join('')}</ul></div>`;
  };

  CO.views.fornecedores = {
    title: () => 'Fornecedores',
    render() {
      const all = Store.s.suppliers;
      const withC = all.filter((s) => s.contract).length;
      const chip = (id, label, n) => `<button class="chip" type="button" data-action="s-filter" data-v="${id}" aria-pressed="${ui.sFilter === id}">${label}<span class="n">${n}</span></button>`;
      return `
        <header class="page-head">
          <div class="titles">
            <h1 class="page-title" tabindex="-1">Fornecedores</h1>
            <p class="page-sub">Contatos, contratos, avaliações e tudo o que cada empresa já fez no prédio. Ordenados pelo valor pago nos últimos 12 meses.</p>
          </div>
          <div class="page-actions"><button class="btn btn-primary" type="button" data-action="new-supplier">${icon('plus')}Cadastrar fornecedor</button></div>
        </header>
        <div class="toolbar">
          <label class="search" for="s-search"><span class="sr-only">Buscar fornecedores</span>${icon('magnifying-glass')}<input class="input" id="s-search" type="search" placeholder="Buscar por nome ou serviço" value="${esc(ui.sQuery)}" autocomplete="off" enterkeyhint="search"></label>
          <div class="chips" role="group" aria-label="Filtrar">${chip('todos', 'Todos', all.length)}${chip('contrato', 'Com contrato', withC)}${chip('avulso', 'Avulsos', all.length - withC)}</div>
        </div>
        <div id="s-results">${results()}</div>`;
    },
    mount(root) {
      const input = root.querySelector('#s-search');
      input.addEventListener('input', () => {
        ui.sQuery = input.value;
        root.querySelector('#s-results').innerHTML = results();
      });
    },
  };

  CO.actions['s-filter'] = (el) => { ui.sFilter = el.dataset.v; CO.App.render(); };

  const contactLine = (ic, value, label) =>
    value
      ? `<div class="contact-line">${icon(ic)}<span class="v">${esc(value)}</span><button class="btn btn-ghost btn-sm" type="button" data-action="copy" data-v="${esc(value)}" data-label="${esc(label)}">${icon('copy')}Copiar</button></div>`
      : '';

  const supplierBody = (id) => () => {
    const s = Store.supplier(id);
    const cs = Store.contractStatus(s);
    const hist = Store.supplierHistory(id).slice(0, 12);
    const docs = Store.s.documents.filter((d) => d.supplierId === id);
    const spend = Store.supplierSpend(id);
    const rate = [1, 2, 3, 4, 5].map((n) => `<button type="button" class="${s.rating && n <= s.rating ? 'is-on' : ''}" data-action="rate-supplier" data-id="${id}" data-v="${n}" aria-label="${n} de 5">${icon(s.rating && n <= s.rating ? 'star-fill' : 'star')}</button>`).join('');
    const histRow = (h) => {
      const label = h.kind === 'ticket' ? `Chamado ${h.ref.id}` : h.kind === 'execution' ? 'Manutenção preventiva' : h.status === 'previsto' ? 'Pagamento previsto' : 'Pagamento';
      return `
        <li class="tl-item"><span class="tl-dot">${icon(h.kind === 'ticket' ? 'chat-circle-text' : h.kind === 'execution' ? 'wrench' : 'receipt')}</span>
          <div class="tl-body"><div class="tl-head"><strong>${CO.dateNum(h.date)}</strong><span>${label}</span>${h.amount ? `<span class="num">${CO.money(h.amount)}</span>` : ''}</div><p class="tl-text">${esc(h.title)}</p></div></li>`;
    };
    return `
      <div class="detail">
        <div class="badges">${cs ? CO.pill(cs.tone, cs.label, 'handshake') : '<span class="pill pill-outline">Serviço avulso</span>'}<span class="pill">${esc(s.category)}</span></div>
        <section class="detail-section">
          <h3>Contato</h3>
          ${s.contact ? `<p class="desc"><strong>${esc(s.contact)}</strong></p>` : ''}
          ${contactLine('phone', s.phone, 'Telefone')}
          ${contactLine('envelope', s.email, 'E-mail')}
          ${s.cnpj ? `<p class="text-sm muted">CNPJ <span class="mono">${esc(s.cnpj)}</span></p>` : ''}
        </section>
        ${s.contract ? `
          <section class="detail-section">
            <h3>Contrato</h3>
            <dl class="kv">
              <div class="fact"><dt>Valor mensal</dt><dd class="num">${CO.money(s.contract.value)}</dd></div>
              <div class="fact"><dt>Vigência</dt><dd>${CO.dateNum(s.contract.start)} a ${CO.dateNum(s.contract.end)}</dd></div>
            </dl>
            ${s.contract.scope ? `<p class="desc">${esc(s.contract.scope)}</p>` : ''}
          </section>` : ''}
        <section class="detail-section">
          <h3>Avaliação da síndica</h3>
          <div class="rate-input" role="group" aria-label="Avaliar fornecedor">${rate}</div>
          <p class="text-sm muted">Avalie depois de cada serviço. Ajuda a decidir renovações e a escolher entre orçamentos.</p>
        </section>
        <dl class="kv">
          <div class="fact"><dt>Pago em 12 meses</dt><dd class="num">${CO.money(spend)}</dd></div>
          <div class="fact"><dt>Serviços registrados</dt><dd>${Store.supplierHistory(id).length}</dd></div>
        </dl>
        ${s.notes ? `<div class="callout">${icon('note')}<span>${esc(s.notes)}</span></div>` : ''}
        ${docs.length ? `<section class="detail-section"><h3>Documentos</h3><ul class="list">${docs.map((d) => { const st = Store.docStatus(d); return `<li><button class="row-btn" type="button" data-action="open-doc" data-id="${d.id}"><span class="ico-tile">${icon('file-text')}</span><span class="row-main"><span class="row-title">${esc(d.title)}</span></span>${st.key !== 'none' ? CO.pill(st.tone, st.label, st.icon) : ''}</button></li>`; }).join('')}</ul></section>` : ''}
        <section class="detail-section">
          <h3>Histórico no prédio</h3>
          ${hist.length ? `<ol class="timeline">${hist.map(histRow).join('')}</ol>` : '<p class="text-sm muted">Nenhum serviço registrado ainda.</p>'}
        </section>
      </div>`;
  };

  CO.openSupplier = (id) => {
    const s = Store.supplier(id);
    if (!s) return;
    const spec = { title: s.name, eyebrow: 'Fornecedor', live: true, body: supplierBody(id) };
    if (CO.Sheet.isOpen()) CO.Sheet.push(spec);
    else CO.Sheet.open(spec);
  };

  CO.actions['open-supplier'] = (el) => CO.openSupplier(el.dataset.id);

  CO.actions['rate-supplier'] = (el) => {
    const n = Number(el.dataset.v);
    Store.rateSupplier(el.dataset.id, n);
    CO.toast(`Avaliação salva: ${n} de 5.`);
  };

  CO.actions.copy = (el) => {
    const value = el.dataset.v;
    const fallback = () => {
      const target = el.parentElement.querySelector('.v');
      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      CO.toast(`${el.dataset.label} selecionado. Use copiar do seu aparelho.`);
    };
    try {
      navigator.clipboard.writeText(value).then(() => CO.toast(`${el.dataset.label} copiado.`), fallback);
    } catch (e) {
      fallback();
    }
  };

  CO.actions['new-supplier'] = () => {
    CO.Sheet.open({
      title: 'Cadastrar fornecedor',
      body: () => `
        <form class="form" id="supplier-form" data-form="supplier" novalidate>
          ${F.text({ name: 'name', id: 'f-sp-name', label: 'Nome da empresa', required: 'Informe o nome da empresa.', autocomplete: 'organization' })}
          ${F.text({ name: 'category', id: 'f-sp-cat', label: 'Serviço', required: 'Informe o tipo de serviço.', placeholder: 'Ex.: Impermeabilização' })}
          <div class="field-row">
            ${F.text({ name: 'contact', id: 'f-sp-contact', label: 'Pessoa de contato', optional: true, autocomplete: 'name' })}
            ${F.text({ name: 'phone', id: 'f-sp-phone', label: 'Telefone', type: 'tel', inputmode: 'tel', optional: true, autocomplete: 'tel', placeholder: '(21) 99999-0000' })}
          </div>
          <div class="field-row">
            ${F.text({ name: 'email', id: 'f-sp-email', label: 'E-mail', type: 'email', inputmode: 'email', optional: true, autocomplete: 'email' })}
            ${F.text({ name: 'cnpj', id: 'f-sp-cnpj', label: 'CNPJ', inputmode: 'numeric', optional: true })}
          </div>
          ${F.toggle({ name: 'hasContract', id: 'f-sp-hasc', label: 'Tem contrato mensal', hint: 'Informe o valor e até quando vale para receber aviso antes do fim.', change: 'sp-contract' })}
          <div class="field-row" id="sp-contract-fields" hidden>
            ${F.money({ name: 'value', id: 'f-sp-value', label: 'Valor mensal' })}
            ${F.date({ name: 'end', id: 'f-sp-end', label: 'Contrato vale até' })}
          </div>
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-close">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="supplier-form">${icon('plus')}Cadastrar</button>`,
    });
  };

  CO.changes['sp-contract'] = (el) => {
    document.getElementById('sp-contract-fields').hidden = !el.checked;
  };

  CO.forms.supplier = (form, d) => {
    const contract = d.hasContract && d.value && d.end ? { value: CO.parseMoney(d.value), start: CO.iso(CO.today()), end: d.end, scope: '' } : null;
    Store.addSupplier({ name: d.name, category: d.category, contact: d.contact, phone: d.phone, email: d.email, cnpj: d.cnpj, contract });
    CO.Sheet.close();
    CO.done('Fornecedor cadastrado.');
  };
})(window.CO);
