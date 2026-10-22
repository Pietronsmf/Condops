/* Documentos: laudos, certificados, contratos, atas e prestações de contas. */
'use strict';

(function (CO) {
  const { esc, Store, F, K } = CO;
  const icon = (n, c) => CO.icon(n, c);
  const ui = (CO.ui = CO.ui || {});
  ui.dFilter = ui.dFilter || 'todos';

  const visLabel = (d) => (d.visibility === 'publico' ? `${icon('globe', 'icon-sm')}Todos os moradores` : `${icon('lock', 'icon-sm')}Só a síndica`);

  const docRow = (d) => {
    const st = Store.docStatus(d);
    const sind = Store.isSindico();
    const meta = d.expiresAt ? `Validade ${CO.dateNum(d.expiresAt)}` : `Emitido em ${CO.dateNum(d.issuedAt)}`;
    return `
      <button class="row-btn" type="button" data-action="open-doc" data-id="${d.id}">
        <span class="ico-tile${st.key === 'expired' ? ' tone-crit' : st.key === 'soon' ? ' tone-warn' : ''}">${icon(d.fileName.endsWith('.pdf') ? 'file-pdf' : 'file-text')}</span>
        <span class="row-main">
          <span class="row-title">${esc(d.title)}</span>
          <span class="row-meta"><span>${meta}</span>${sind ? `<span>${visLabel(d)}</span>` : ''}</span>
        </span>
        ${st.key !== 'none' ? `<span class="row-trail">${CO.pill(st.tone, st.label, st.icon)}</span>` : ''}
      </button>`;
  };

  const grouped = (list) =>
    Object.entries(K.DOC_GROUPS)
      .map(([g, meta]) => {
        const items = list.filter((d) => d.group === g).sort((a, b) => (a.expiresAt || '9999').localeCompare(b.expiresAt || '9999') || b.issuedAt.localeCompare(a.issuedAt));
        if (!items.length) return '';
        return `
          <section class="panel" aria-label="${esc(meta.label)}">
            <div class="panel-head"><h2 class="panel-title">${icon(meta.icon)}${esc(meta.label)} <span class="count">${items.length}</span></h2></div>
            <ul class="list">${items.map((d) => `<li>${docRow(d)}</li>`).join('')}</ul>
          </section>`;
      })
      .join('');

  CO.views.documentos = {
    title: () => 'Documentos',
    render() {
      const sind = Store.isSindico();
      let all = Store.s.documents;
      if (!sind) all = all.filter((d) => d.visibility === 'publico');
      const action = all.filter((d) => ['expired', 'soon'].includes(Store.docStatus(d).key));
      let list = all;
      if (sind && ui.dFilter === 'acao') list = action;
      if (sind && ui.dFilter === 'publico') list = all.filter((d) => d.visibility === 'publico');
      if (sind && ui.dFilter === 'restrito') list = all.filter((d) => d.visibility === 'restrito');
      const chip = (id, label, n) => `<button class="chip" type="button" data-action="d-filter" data-v="${id}" aria-pressed="${ui.dFilter === id}">${label}<span class="n">${n}</span></button>`;
      const head = sind
        ? `<header class="page-head">
            <div class="titles">
              <h1 class="page-title" tabindex="-1">Documentos</h1>
              <p class="page-sub">Laudos, certificados, contratos e atas em um só lugar, com alerta 60 dias antes de vencer.</p>
            </div>
            <div class="page-actions"><button class="btn btn-primary" type="button" data-action="new-doc">${icon('upload-simple')}Adicionar documento</button></div>
          </header>
          <div class="toolbar"><div class="chips" role="group" aria-label="Filtrar">${chip('todos', 'Todos', all.length)}${chip('acao', 'Exigem ação', action.length)}${chip('publico', 'Públicos', all.filter((d) => d.visibility === 'publico').length)}${chip('restrito', 'Só a síndica', all.filter((d) => d.visibility === 'restrito').length)}</div></div>`
        : `<header class="page-head">
            <div class="titles">
              <h1 class="page-title" tabindex="-1">Documentos</h1>
              <p class="page-sub">Regras, atas, certificados de segurança e prestações de contas do condomínio. Você pode conferir a validade de cada um.</p>
            </div>
          </header>`;
      return `${head}${list.length ? `<div class="stack">${grouped(list)}</div>` : `<div class="panel">${CO.empty({ title: 'Nenhum documento exige ação', text: 'Todos os documentos com validade estão em dia.' })}</div>`}`;
    },
  };

  CO.actions['d-filter'] = (el) => { ui.dFilter = el.dataset.v; CO.App.render(); };

  const docBody = (id) => () => {
    const d = Store.doc(id);
    const st = Store.docStatus(d);
    const sind = Store.isSindico();
    const eq = d.equipmentId ? Store.equipment(d.equipmentId) : null;
    const sup = d.supplierId ? Store.supplier(d.supplierId) : null;
    const banner = st.key === 'expired'
      ? `<div class="callout tone-crit">${icon('warning-circle')}<div><strong>Documento vencido.</strong> ${sind ? 'Providencie a renovação e anexe a nova versão. Documentos de segurança vencidos podem gerar multa e complicar o seguro em caso de sinistro.' : 'A síndica já foi alertada sobre a renovação.'}</div></div>`
      : st.key === 'soon'
        ? `<div class="callout tone-warn">${icon('clock')}<div><strong>${esc(st.label)}.</strong> ${sind ? 'Renovações costumam levar semanas. Peça os orçamentos agora.' : 'A síndica recebe o alerta com antecedência.'}</div></div>`
        : '';
    return `
      <div class="detail">
        <div class="badges">${st.key !== 'none' ? CO.pill(st.tone, st.label, st.icon) : ''}<span class="pill">${esc(K.DOC_GROUPS[d.group].label)}</span></div>
        ${banner}
        <dl class="kv">
          <div class="fact"><dt>Emitido em</dt><dd>${CO.dateNum(d.issuedAt)}</dd></div>
          <div class="fact"><dt>Validade</dt><dd>${d.expiresAt ? CO.dateNum(d.expiresAt) : 'Não vence'}</dd></div>
          ${eq ? `<div class="fact"><dt>Equipamento</dt><dd>${sind ? `<button class="link-btn" type="button" data-action="open-equip" data-id="${eq.id}">${esc(eq.name)}</button>` : esc(eq.name)}</dd></div>` : ''}
          ${sup ? `<div class="fact"><dt>Emitido por</dt><dd>${sind ? `<button class="link-btn" type="button" data-action="open-supplier" data-id="${sup.id}">${esc(sup.name)}</button>` : esc(sup.name)}</dd></div>` : ''}
        </dl>
        <div class="contact-line">${icon('paperclip')}<span class="v">${esc(d.fileName)}</span>${d.size ? `<span class="text-sm muted">${esc(d.size)}</span>` : ''}</div>
        <p class="text-sm muted">Nesta demonstração os arquivos não são guardados. Na versão com servidor, o arquivo abre aqui.</p>
        ${d.notes ? `<section class="detail-section"><h3>Observações</h3><p class="desc">${esc(d.notes)}</p></section>` : ''}
        ${sind ? `<section class="detail-section"><h3>Quem pode ver</h3>${F.seg({ name: 'doc-vis', id: 'f-doc-vis', label: 'Quem pode ver', hideLabel: true, value: d.visibility, change: 'doc-vis', data: ` data-id="${d.id}"`, options: [{ value: 'publico', label: 'Todos os moradores', icon: 'globe' }, { value: 'restrito', label: 'Só a síndica', icon: 'lock' }] })}</section>` : ''}
      </div>`;
  };

  CO.openDoc = (id) => {
    const d = Store.doc(id);
    if (!d) return;
    const spec = {
      title: d.title,
      eyebrow: 'Documento',
      live: true,
      body: docBody(id),
      foot: Store.isSindico() && d.expiresAt ? () => `<button class="btn btn-primary" type="button" data-action="renew-doc" data-id="${id}">${icon('arrow-clockwise')}Renovar documento</button>` : null,
    };
    if (CO.Sheet.isOpen()) CO.Sheet.push(spec);
    else CO.Sheet.open(spec);
  };

  CO.actions['open-doc'] = (el) => CO.openDoc(el.dataset.id);

  CO.changes['doc-vis'] = (el) => {
    Store.setDocVisibility(el.dataset.id, el.value);
    CO.done(el.value === 'publico' ? 'Agora todos os moradores veem este documento.' : 'Agora só a síndica vê este documento.');
  };

  CO.actions['renew-doc'] = (el) => {
    const d = Store.doc(el.dataset.id);
    const validity = d.expiresAt ? CO.parse(d.expiresAt) - CO.parse(d.issuedAt) : 0;
    const today = CO.today();
    const newExp = validity ? CO.iso(new Date(today.getTime() + validity)) : '';
    CO.Sheet.push({
      title: 'Renovar documento',
      eyebrow: esc(d.title),
      body: () => `
        <form class="form" id="renew-form" data-form="renew" data-id="${d.id}" novalidate>
          <div class="field-row">
            ${F.date({ name: 'issuedAt', id: 'f-rn-issued', label: 'Emitido em', value: CO.iso(today), required: 'Informe a data de emissão.' })}
            ${F.date({ name: 'expiresAt', id: 'f-rn-exp', label: 'Nova validade', value: newExp, required: 'Informe a nova validade.' })}
          </div>
          ${F.file({ name: 'file', id: 'f-rn-file', label: 'Arquivo novo', optional: true, accept: 'application/pdf,image/*', text: 'Anexar PDF ou foto' })}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-back">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="renew-form">${icon('check')}Salvar renovação</button>`,
    });
  };

  CO.forms.renew = (form, d) => {
    if (d.expiresAt <= d.issuedAt) {
      const el = form.querySelector('#f-rn-exp');
      el.setAttribute('aria-invalid', 'true');
      const err = form.querySelector('#f-rn-exp-err');
      err.hidden = false;
      err.innerHTML = `${icon('warning-circle')}A validade precisa ser depois da emissão.`;
      el.focus();
      return;
    }
    Store.renewDocument(form.dataset.id, { issuedAt: d.issuedAt, expiresAt: d.expiresAt, fileName: d.file ? d.file.name : '', size: d.file ? CO.fileSize(d.file.size) : '' });
    CO.Sheet.back();
    CO.done(`Documento renovado até ${CO.dateNum(d.expiresAt)}.`);
  };

  CO.actions['new-doc'] = () => {
    CO.Sheet.open({
      title: 'Adicionar documento',
      body: () => `
        <form class="form" id="doc-form" data-form="doc" novalidate>
          ${F.text({ name: 'title', id: 'f-dc-title', label: 'Nome do documento', required: 'Dê um nome ao documento.', placeholder: 'Ex.: Laudo de estanqueidade do gás' })}
          ${F.select({ name: 'group', id: 'f-dc-group', label: 'Categoria', value: 'seguranca', options: Object.entries(K.DOC_GROUPS).map(([value, g]) => ({ value, label: g.label })) })}
          <div class="field-row">
            ${F.date({ name: 'issuedAt', id: 'f-dc-issued', label: 'Emitido em', value: CO.iso(CO.today()), required: 'Informe a data de emissão.' })}
            ${F.date({ name: 'expiresAt', id: 'f-dc-exp', label: 'Validade', optional: true, hint: 'Deixe em branco se não vence.' })}
          </div>
          ${F.select({ name: 'equipmentId', id: 'f-dc-eq', label: 'Equipamento relacionado', placeholder: 'Nenhum', options: Store.s.equipment.map((e) => ({ value: e.id, label: e.name })) })}
          ${F.seg({ name: 'visibility', id: 'f-dc-vis', label: 'Quem pode ver', value: 'publico', options: [{ value: 'publico', label: 'Todos os moradores', icon: 'globe' }, { value: 'restrito', label: 'Só a síndica', icon: 'lock' }] })}
          ${F.file({ name: 'file', id: 'f-dc-file', label: 'Arquivo', accept: 'application/pdf,image/*', text: 'Anexar PDF ou foto' })}
        </form>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-close">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="doc-form">${icon('upload-simple')}Adicionar</button>`,
    });
  };

  CO.forms.doc = (form, d) => {
    if (d.expiresAt && d.expiresAt <= d.issuedAt) {
      const el = form.querySelector('#f-dc-exp');
      el.setAttribute('aria-invalid', 'true');
      const err = form.querySelector('#f-dc-exp-err');
      err.hidden = false;
      err.innerHTML = `${icon('warning-circle')}A validade precisa ser depois da emissão.`;
      el.focus();
      return;
    }
    const slug = CO.normalize(d.title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    Store.addDocument({ title: d.title, group: d.group, issuedAt: d.issuedAt, expiresAt: d.expiresAt || null, visibility: d.visibility || 'publico', equipmentId: d.equipmentId || null, fileName: d.file ? d.file.name : `${slug}.pdf`, size: d.file ? CO.fileSize(d.file.size) : '' });
    CO.Sheet.close();
    CO.done('Documento adicionado.');
  };
})(window.CO);
