/* Componentes de interface: folha lateral/inferior, avisos rápidos, dicas, formulários. */
'use strict';

(function (CO) {
  const { esc } = CO;
  const K = CO.K;
  const icon = (n, c) => CO.icon(n, c);

  /* ---------- Pequenos componentes ---------- */

  CO.pill = (tone, label, ic) =>
    `<span class="pill${tone && tone !== 'neutral' ? ' pill-' + tone : ''}">${ic ? icon(ic) : ''}${esc(label)}</span>`;

  CO.ticketPill = (t) => {
    const s = K.TICKET_STATUS[t.status];
    return CO.pill(s.tone, s.label, s.icon);
  };

  CO.urgencyPill = (t) => (t.urgency === 'alta' ? CO.pill('crit', 'Urgente', 'warning') : '');

  const STEP_LABEL = { aberto: 'Aberto', analise: 'Em análise', andamento: 'Andamento', resolvido: 'Resolvido' };
  CO.stepper = (t) => {
    const idx = K.STATUS_ORDER.indexOf(t.status);
    const steps = K.STATUS_ORDER.map((st, i) => `<span class="step${i < idx ? ' is-done' : ''}${i === idx ? ' is-current' : ''}"><span class="bar-s"></span><span>${STEP_LABEL[st]}</span></span>`).join('');
    return `<span class="stepper${t.status === 'resolvido' ? ' is-resolved' : ''}" role="img" aria-label="Situação: ${K.TICKET_STATUS[t.status].label}">${steps}</span>`;
  };

  CO.avatar = (name, cls = '') => `<span class="avatar ${cls}" aria-hidden="true">${esc(CO.initials(name))}</span>`;

  CO.stars = (n) => {
    if (!n) return '<span class="muted text-sm">Sem avaliação</span>';
    let out = '';
    for (let i = 1; i <= 5; i++) out += icon(i <= n ? 'star-fill' : 'star', i <= n ? '' : 'off');
    return `<span class="stars" role="img" aria-label="${n} de 5 estrelas">${out}</span><span class="rating-text">${n},0</span>`;
  };

  CO.empty = ({ ic = 'check-circle', tone = 'ok', title, text, action = '' }) => `
    <div class="empty">
      <span class="ico-tile tone-${tone}">${icon(ic)}</span>
      <h3>${esc(title)}</h3>
      ${text ? `<p>${esc(text)}</p>` : ''}
      ${action}
    </div>`;

  CO.catIcon = (catId) => CO.Store.cat(catId).icon;

  CO.locationLabel = (loc) => (loc.detail ? `${loc.area}, ${loc.detail}` : loc.area);

  /* ---------- Folha (painel lateral no computador, folha inferior no celular) ---------- */

  const rubber = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
  const isPhone = () => window.matchMedia('(max-width: 767px)').matches;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const Sheet = (CO.Sheet = {
    stack: [],
    el: null,
    scrim: null,
    opener: null,

    isOpen() {
      return this.stack.length > 0;
    },

    top() {
      return this.stack[this.stack.length - 1];
    },

    open(spec) {
      if (this.isOpen()) {
        this.stack = [spec];
        this.render('swap');
        return;
      }
      this.opener = document.activeElement;
      this.stack = [spec];
      this.mount();
    },

    push(spec) {
      if (!this.isOpen()) return this.open(spec);
      this.stack.push(spec);
      this.render('swap');
    },

    back() {
      if (this.stack.length <= 1) return this.close();
      this.stack.pop();
      this.render('swap-back');
    },

    replace(spec) {
      this.stack[this.stack.length - 1] = spec;
      this.render('swap');
    },

    /** Re-renderiza a folha aberta quando os dados mudam (só folhas marcadas como live). */
    refresh() {
      if (this.isOpen() && this.top().live) this.render();
    },

    mount() {
      const host = document.getElementById('sheet-root');
      host.innerHTML =
        '<div class="scrim" data-action="sheet-close"></div>' +
        '<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
        '<div class="sheet-grab" aria-hidden="true"><span></span></div><div class="sheet-content"></div></section>';
      this.scrim = host.querySelector('.scrim');
      this.el = host.querySelector('.sheet');
      this.render();
      document.body.classList.add('is-locked');
      const app = document.getElementById('app');
      if (app) app.inert = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          this.scrim.classList.add('is-open');
          this.el.classList.add('is-open');
        })
      );
      this.bindDrag();
      this.focusTitle();
    },

    render(anim) {
      const spec = this.top();
      const old = this.el.querySelector('.sheet-content');
      const oldBody = old.querySelector('.sheet-body');
      const keepScroll = !anim && oldBody ? oldBody.scrollTop : 0;
      const kept = {};
      let focusedId = null;
      if (!anim) {
        CO.$$('[data-keep]', old).forEach((el) => { if (el.id) kept[el.id] = el.value; });
        if (old.contains(document.activeElement) && document.activeElement.id) focusedId = document.activeElement.id;
      }
      // Um elemento novo a cada renderização evita acumular ouvintes de eventos do mount
      const content = document.createElement('div');
      content.className = 'sheet-content';
      old.replaceWith(content);
      const back = this.stack.length > 1
        ? `<button class="btn-icon" type="button" data-action="sheet-back" aria-label="Voltar">${icon('arrow-left')}</button>`
        : '';
      const foot = spec.foot ? spec.foot() : '';
      content.innerHTML = `
        <header class="sheet-head">
          ${back}
          <div class="titles">
            ${spec.eyebrow ? `<p class="sheet-eyebrow">${spec.eyebrow}</p>` : ''}
            <h2 id="sheet-title" tabindex="-1">${esc(spec.title)}</h2>
          </div>
          <button class="btn-icon" type="button" data-action="sheet-close" aria-label="Fechar">${icon('x')}</button>
        </header>
        <div class="sheet-body">${spec.body()}</div>
        ${foot ? `<footer class="sheet-foot">${foot}</footer>` : ''}`;
      if (anim === 'swap' || anim === 'swap-back') content.classList.add(anim === 'swap' ? 'is-swap' : 'is-swap-back');
      for (const [id, v] of Object.entries(kept)) {
        const el = content.querySelector('#' + CSS.escape(id));
        if (el) el.value = v;
      }
      if (spec.mount) spec.mount(content);
      if (!anim) {
        content.querySelector('.sheet-body').scrollTop = keepScroll;
        if (focusedId) {
          const f = content.querySelector('#' + CSS.escape(focusedId));
          if (f) f.focus({ preventScroll: true });
        }
      } else {
        this.focusTitle();
      }
    },

    focusTitle() {
      const h = this.el && this.el.querySelector('#sheet-title');
      if (h) h.focus({ preventScroll: true });
    },

    close() {
      if (!this.isOpen()) return;
      const el = this.el;
      const scrim = this.scrim;
      this.stack = [];
      el.classList.add('is-closing');
      el.classList.remove('is-open');
      scrim.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      const app = document.getElementById('app');
      if (app) app.inert = false;
      setTimeout(() => {
        if (!this.isOpen()) document.getElementById('sheet-root').innerHTML = '';
      }, 300);
      if (this.opener && document.contains(this.opener)) this.opener.focus({ preventScroll: true });
    },

    /** Arrastar para baixo fecha a folha no celular; um gesto rápido basta. */
    bindDrag() {
      const el = this.el;
      let startY = 0;
      let dy = 0;
      let dragging = false;
      let pid = null;
      let samples = [];
      el.addEventListener('pointerdown', (e) => {
        if (!isPhone() || CO.reducedMotion()) return;
        if (!e.target.closest('.sheet-grab, .sheet-head') || e.target.closest('button, a, input, select, textarea')) return;
        dragging = true;
        startY = e.clientY;
        dy = 0;
        pid = e.pointerId;
        samples = [{ y: e.clientY, t: e.timeStamp }];
        el.setPointerCapture(pid);
        el.style.transition = 'none';
      });
      el.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pid) return;
        const raw = e.clientY - startY;
        dy = raw >= 0 ? raw : -rubber(-raw, el.offsetHeight);
        el.style.transform = `translateY(${dy}px)`;
        samples.push({ y: e.clientY, t: e.timeStamp });
        if (samples.length > 5) samples.shift();
      });
      const end = (e) => {
        if (!dragging || e.pointerId !== pid) return;
        dragging = false;
        const a = samples[0];
        const b = samples[samples.length - 1];
        const v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0;
        el.style.transition = '';
        el.style.transform = '';
        if (dy > el.offsetHeight * 0.3 || v > 0.5) this.close();
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    },

    trapTab(e) {
      const items = CO.$$(FOCUSABLE, this.el).filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !this.el.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
  });

  document.addEventListener('keydown', (e) => {
    if (!Sheet.isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      Sheet.close();
    } else if (e.key === 'Tab') {
      Sheet.trapTab(e);
    }
  });

  /** Confirmação dentro da própria interface (o visualizador não exibe confirm()). */
  CO.confirm = ({ title, text, confirmLabel, danger, onConfirm }) => {
    const spec = {
      title,
      body: () => `<p class="desc">${esc(text)}</p>`,
      foot: () => `
        <button class="btn btn-secondary" type="button" data-action="sheet-back">Cancelar</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm>${esc(confirmLabel)}</button>`,
      mount: (root) => {
        root.querySelector('[data-confirm]').addEventListener('click', () => {
          Sheet.close();
          onConfirm();
        });
      },
    };
    if (Sheet.isOpen()) Sheet.push(spec);
    else Sheet.open(spec);
  };

  /* ---------- Avisos rápidos (toasts) ---------- */

  CO.toast = (msg, { action, tone, duration = 5200 } = {}) => {
    const host = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${icon(tone === 'warn' ? 'warning' : 'check-circle', tone === 'warn' ? 'tone-warn-text' : '')}<span class="t-msg"></span>${action ? `<button class="t-act" type="button">${esc(action.label)}</button>` : ''}`;
    el.querySelector('.t-msg').textContent = msg;
    host.appendChild(el);
    while (host.children.length > 3) host.firstChild.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
    let timer;
    let remaining = duration;
    let started = 0;
    const dismiss = () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 220);
    };
    const start = () => {
      started = Date.now();
      clearTimeout(timer);
      timer = setTimeout(dismiss, remaining);
    };
    const pause = () => {
      clearTimeout(timer);
      remaining = Math.max(1500, remaining - (Date.now() - started));
    };
    const onVis = () => (document.hidden ? pause() : start());
    el.addEventListener('pointerenter', pause);
    el.addEventListener('pointerleave', start);
    document.addEventListener('visibilitychange', onVis);
    if (action) {
      el.querySelector('.t-act').addEventListener('click', () => {
        action.fn();
        dismiss();
      });
    }
    start();
  };

  CO.done = (msg) =>
    CO.toast(msg, {
      action: {
        label: 'Desfazer',
        fn: () => {
          CO.Store.undo();
          CO.toast('Alteração desfeita.');
        },
      },
    });

  /* ---------- Dica flutuante dos gráficos ---------- */

  CO.tip = {
    el: null,
    show(html, x, y) {
      if (!this.el) this.el = document.getElementById('tooltip');
      this.el.innerHTML = html;
      this.el.hidden = false;
      const w = this.el.offsetWidth;
      const left = Math.min(Math.max(x, w / 2 + 8), window.innerWidth - w / 2 - 8);
      this.el.style.left = left + 'px';
      this.el.style.top = Math.max(y, this.el.offsetHeight + 18) + 'px';
    },
    hide() {
      if (this.el) this.el.hidden = true;
    },
  };

  /* ---------- Formulários ---------- */

  const F = (CO.F = {});
  const fid = (o) => o.id || `f-${o.name}`;
  const req = (o) => (o.required ? ` data-required="${esc(o.required === true ? 'Preencha este campo.' : o.required)}"` : '');
  const aria = (o, id) => ` aria-describedby="${o.hint ? id + '-hint ' : ''}${id}-err"`;
  const attr = (k, v) => (v === undefined || v === null || v === false || v === '' ? '' : ` ${k}="${esc(v)}"`);

  F.label = (o, id) =>
    `<label class="label" for="${id}">${esc(o.label)}${o.optional ? ' <span class="opt">(opcional)</span>' : ''}</label>`;

  F.wrap = (o, id, control) => `
    <div class="field">
      ${F.label(o, id)}
      ${control}
      ${o.hint ? `<p class="hint" id="${id}-hint">${esc(o.hint)}</p>` : ''}
      <p class="error" id="${id}-err" hidden></p>
    </div>`;

  F.text = (o) => {
    const id = fid(o);
    return F.wrap(o, id, `<input class="input" id="${id}" name="${o.name}" type="${o.type || 'text'}" value="${esc(o.value ?? '')}"${attr('placeholder', o.placeholder)}${attr('inputmode', o.inputmode)}${attr('maxlength', o.maxlength)}${attr('enterkeyhint', o.enterkeyhint)} autocomplete="${o.autocomplete || 'off'}"${req(o)}${aria(o, id)}${o.keep ? ' data-keep' : ''}>`);
  };

  F.textarea = (o) => {
    const id = fid(o);
    return F.wrap(o, id, `<textarea class="textarea" id="${id}" name="${o.name}" rows="${o.rows || 4}"${attr('placeholder', o.placeholder)}${attr('maxlength', o.maxlength)}${req(o)}${aria(o, id)}${o.keep ? ' data-keep' : ''}>${esc(o.value ?? '')}</textarea>`);
  };

  F.select = (o) => {
    const id = fid(o);
    const opts = (o.placeholder ? `<option value="">${esc(o.placeholder)}</option>` : '') +
      o.options.map((op) => `<option value="${esc(op.value)}"${String(op.value) === String(o.value ?? '') ? ' selected' : ''}>${esc(op.label)}</option>`).join('');
    return F.wrap(o, id, `<select class="select" id="${id}" name="${o.name}"${req(o)}${aria(o, id)}${o.change ? ` data-change="${o.change}"` : ''}${o.data || ''}>${opts}</select>`);
  };

  F.money = (o) => {
    const id = fid(o);
    const v = o.value || o.value === 0 ? String(o.value).replace('.', ',') : '';
    return F.wrap(o, id, `<div class="input-prefix"><span aria-hidden="true">R$</span><input class="input" id="${id}" name="${o.name}" type="text" inputmode="decimal" placeholder="0,00" value="${esc(v)}" autocomplete="off" data-money${req(o)}${aria(o, id)}></div>`);
  };

  F.date = (o) => F.text({ ...o, type: 'date' });
  F.datetime = (o) => F.text({ ...o, type: 'datetime-local' });

  F.seg = (o) => {
    const id = fid(o);
    return `
      <fieldset class="fieldset-plain"${o.required ? ` data-required-group="${o.name}" data-msg="${esc(o.required)}"` : ''}>
        <legend class="label${o.hideLabel ? ' sr-only' : ''}">${esc(o.label)}</legend>
        <div class="seg">
          ${o.options.map((op) => `<label class="seg-opt"><input type="radio" name="${o.name}" value="${esc(op.value)}"${op.value === o.value ? ' checked' : ''}${o.change ? ` data-change="${o.change}"` : ''}${o.data || ''}><span>${op.icon ? icon(op.icon) : ''}${esc(op.label)}</span></label>`).join('')}
        </div>
        ${o.hint ? `<p class="hint">${esc(o.hint)}</p>` : ''}
        <p class="error" id="${id}-err" hidden></p>
      </fieldset>`;
  };

  F.choices = (o) => {
    const id = fid(o);
    return `
      <fieldset class="fieldset-plain"${o.required ? ` data-required-group="${o.name}" data-msg="${esc(o.required)}"` : ''}>
        <legend class="label">${esc(o.label)}</legend>
        <div class="choice-cards">
          ${o.options.map((op) => `<label class="choice-card"><input type="radio" name="${o.name}" value="${esc(op.value)}"${op.value === o.value ? ' checked' : ''}><span class="cc"><span class="radio" aria-hidden="true"></span><span><strong>${esc(op.label)}</strong>${op.hint ? `<small>${esc(op.hint)}</small>` : ''}</span></span></label>`).join('')}
        </div>
        <p class="error" id="${id}-err" hidden></p>
      </fieldset>`;
  };

  F.toggle = (o) => {
    const id = fid(o);
    return `
      <label class="toggle" for="${id}">
        <input type="checkbox" id="${id}" name="${o.name}"${o.checked ? ' checked' : ''}${o.change ? ` data-change="${o.change}"` : ''}>
        <span class="track" aria-hidden="true"></span>
        <span class="t-text"><strong>${esc(o.label)}</strong>${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</span>
      </label>`;
  };

  F.file = (o) => {
    const id = fid(o);
    return `
      <div class="field">
        <span class="label" id="${id}-label">${esc(o.label)}${o.optional ? ' <span class="opt">(opcional)</span>' : ''}</span>
        <div class="dropzone" data-dropzone>
          ${icon(o.icon || 'paperclip')}
          <span class="dz-text">${esc(o.text || 'Escolher arquivo')}</span>
          <input type="file" id="${id}" name="${o.name}"${attr('accept', o.accept)} aria-labelledby="${id}-label">
        </div>
        ${o.hint ? `<p class="hint">${esc(o.hint)}</p>` : ''}
      </div>`;
  };

  const showError = (form, el, id, msg) => {
    const err = form.querySelector('#' + CSS.escape(id + '-err'));
    if (el) el.setAttribute('aria-invalid', 'true');
    if (err) {
      err.hidden = false;
      err.innerHTML = `${icon('warning-circle')}${esc(msg)}`;
    }
  };

  /** Valida campos obrigatórios e valores em reais; foca o primeiro erro. */
  CO.validate = (form) => {
    let first = null;
    CO.$$('[aria-invalid="true"]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    CO.$$('.error', form).forEach((el) => (el.hidden = true));
    CO.$$('[data-required], [data-money]', form).forEach((el) => {
      const v = el.value.trim();
      let msg = '';
      if (el.hasAttribute('data-required') && !v) msg = el.dataset.required;
      else if (el.hasAttribute('data-money') && v && (isNaN(CO.parseMoney(v)) || CO.parseMoney(v) < 0)) msg = 'Use só números, por exemplo 1.350,00.';
      if (msg) {
        showError(form, el, el.id, msg);
        first = first || el;
      }
    });
    CO.$$('[data-required-group]', form).forEach((fs) => {
      const name = fs.dataset.requiredGroup;
      if (!form.querySelector(`input[name="${name}"]:checked`)) {
        showError(form, null, `f-${name}`, fs.dataset.msg);
        first = first || fs.querySelector('input');
      }
    });
    if (first) first.focus();
    return !first;
  };

  CO.formObj = (form) => {
    const out = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; else if (!(el.name in out)) out[el.name] = ''; }
      else if (el.type === 'file') out[el.name] = el.files && el.files[0] ? el.files[0] : null;
      else out[el.name] = el.value.trim();
    }
    return out;
  };

  CO.fileSize = (bytes) => (bytes >= 1048576 ? `${CO.num1(bytes / 1048576)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

  /** Reduz a foto antes de guardar, para caber no armazenamento do navegador. */
  CO.readPhoto = (file, max = 960) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  // Limpa o erro do campo assim que a pessoa corrige
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.getAttribute && el.getAttribute('aria-invalid') === 'true') {
      el.removeAttribute('aria-invalid');
      const err = document.getElementById(el.id + '-err');
      if (err) err.hidden = true;
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.type === 'radio') {
      const fs = el.closest('[data-required-group]');
      const err = fs && document.getElementById(`f-${fs.dataset.requiredGroup}-err`);
      if (err) err.hidden = true;
    }
    if (el.type === 'file' && el.closest('[data-dropzone]')) {
      const dz = el.closest('[data-dropzone]');
      const f = el.files[0];
      if (f && !dz.dataset.custom) dz.querySelector('.dz-text').textContent = `${f.name} (${CO.fileSize(f.size)})`;
    }
  });
  ['dragenter', 'dragover'].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      const dz = e.target.closest && e.target.closest('[data-dropzone]');
      if (dz) dz.classList.add('is-over');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      const dz = e.target.closest && e.target.closest('[data-dropzone]');
      if (dz) dz.classList.remove('is-over');
    })
  );
})(window.CO);
