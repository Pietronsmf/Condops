/* Estrutura da aplicação: navegação por perfil, rotas, eventos globais e perfil. */
'use strict';

(function (CO) {
  const { esc, Store, F } = CO;
  const icon = (n, c) => CO.icon(n, c);

  CO.views = CO.views || {};
  CO.actions = CO.actions || {};
  CO.forms = CO.forms || {};
  CO.changes = CO.changes || {};

  const NAV = {
    sindico: [
      { id: 'inicio', label: 'Início', icon: 'house', group: 'Dia a dia' },
      { id: 'chamados', label: 'Chamados', icon: 'chat-circle-text', count: (c) => [c.openTickets, false], group: 'Dia a dia' },
      { id: 'manutencoes', label: 'Manutenções', icon: 'wrench', count: (c) => [c.latePlans, true], group: 'Dia a dia' },
      { id: 'equipamentos', label: 'Equipamentos', icon: 'gauge', group: 'Prédio' },
      { id: 'fornecedores', label: 'Fornecedores', icon: 'handshake', group: 'Prédio' },
      { id: 'documentos', label: 'Documentos', icon: 'folder', count: (c) => [c.docsAction, c.docsExpired > 0], group: 'Prédio' },
      { id: 'custos', label: 'Custos', icon: 'chart-bar', group: 'Dinheiro' },
    ],
    morador: [
      { id: 'inicio', label: 'Início', icon: 'house', group: 'Meu condomínio' },
      { id: 'chamados', label: 'Chamados', icon: 'chat-circle-text', group: 'Meu condomínio' },
      { id: 'documentos', label: 'Documentos', icon: 'folder', group: 'Meu condomínio' },
      { id: 'custos', label: 'Transparência', icon: 'chart-bar', group: 'Meu condomínio' },
    ],
  };
  const TABS = {
    sindico: ['inicio', 'chamados', 'manutencoes', 'custos', 'mais'],
    morador: ['inicio', 'chamados', 'documentos', 'custos'],
  };
  const THEME_KEY = 'condops:theme';

  const App = (CO.App = {
    route: 'inicio',
    shellRole: null,
    hostTheme: null,

    start() {
      this.hostTheme = document.documentElement.getAttribute('data-theme');
      Store.load();
      this.applyTheme(this.theme());
      this.route = this.routeFromHash() || 'inicio';
      const onNav = () => {
        const r = this.routeFromHash();
        if (r && r !== this.route) {
          this.route = r;
          this.render(true);
        }
      };
      window.addEventListener('hashchange', onNav);
      window.addEventListener('popstate', onNav);
      this.render(true);
    },

    routeFromHash() {
      const h = (location.hash || '').replace('#', '');
      return /^[a-z]+$/.test(h) ? h : null;
    },

    allowed(route) {
      const role = Store.role();
      return !!role && NAV[role].some((n) => n.id === route);
    },

    go(route) {
      if (!this.allowed(route)) route = 'inicio';
      if (route === this.route) {
        window.scrollTo({ top: 0, behavior: CO.reducedMotion() ? 'auto' : 'smooth' });
        return;
      }
      this.route = route;
      try {
        history.pushState(null, '', '#' + route);
      } catch (e) {
        /* o visualizador pode bloquear a troca de endereço; a navegação segue em memória */
      }
      this.render(true);
    },

    render(routeChanged) {
      const root = document.getElementById('app');
      const role = Store.role();
      if (!role) {
        this.shellRole = null;
        root.innerHTML = CO.views.entry.render();
        document.title = 'CondOps';
        return;
      }
      if (!this.allowed(this.route)) this.route = 'inicio';
      if (this.shellRole !== role) {
        root.innerHTML = this.shell(role);
        this.shellRole = role;
        routeChanged = true;
      }
      this.renderNav(role);
      const view = CO.views[this.route];
      const host = document.getElementById('view');
      const y = window.scrollY;
      host.innerHTML = view.render();
      if (view.mount) view.mount(host);
      document.getElementById('topbar-title').textContent = view.title();
      document.title = `${view.title()} | CondOps`;
      if (routeChanged) {
        host.classList.remove('view-enter');
        void host.offsetWidth;
        host.classList.add('view-enter');
        window.scrollTo(0, 0);
        // Leitores de tela anunciam a nova página; no primeiro carregamento o foco fica onde está
        if (this.started) {
          const h1 = host.querySelector('h1');
          if (h1 && !CO.Sheet.isOpen()) h1.focus({ preventScroll: true });
        }
        this.started = true;
      } else {
        window.scrollTo(0, y);
      }
      CO.Sheet.refresh();
    },

    shell(role) {
      const me = Store.me();
      const sub = role === 'sindico' ? 'Síndica' : `Apto ${me.unit.replace('-', ', Bloco ')}`;
      return `
        <div class="shell">
          <aside class="sidebar" aria-label="Menu">
            <div class="brand">
              ${CO.brandMark()}
              <div>
                <div class="brand-name">CondOps</div>
                <div class="brand-sub">${esc(Store.s.condo.name)}</div>
              </div>
            </div>
            <div class="side-actions">
              ${role === 'sindico'
                ? `<button class="btn btn-primary btn-block" type="button" data-action="open-new" aria-haspopup="menu" aria-expanded="false">${icon('plus')}Novo</button>`
                : `<button class="btn btn-primary btn-block" type="button" data-action="new-ticket">${icon('plus')}Relatar problema</button>`}
              <button class="search-trigger" type="button" data-action="open-search">${icon('magnifying-glass')}<span>Buscar</span><kbd>${CO.shortcutLabel()}</kbd></button>
            </div>
            <nav class="nav" id="side-nav" aria-label="Seções"></nav>
            <div class="sidebar-foot">
              <button class="me-card" type="button" data-action="open-profile">
                ${CO.avatar(me.name)}
                <span class="who"><span class="name">${esc(me.name)}</span><span class="role">${esc(sub)}</span></span>
                ${icon('dots-three-vertical', 'icon-sm muted')}
              </button>
            </div>
          </aside>
          <div class="main">
            <header class="topbar">
              <div class="topbar-brand">${CO.brandMark()}<span class="topbar-title" id="topbar-title"></span></div>
              <button class="btn-icon" type="button" data-action="open-search" aria-label="Buscar">${icon('magnifying-glass')}</button>
              <button class="avatar-btn" type="button" data-action="open-profile" aria-label="Perfil e configurações">${CO.avatar(me.name)}</button>
            </header>
            <main class="content" id="view"></main>
          </div>
          ${role === 'sindico'
            ? `<button class="fab" id="fab" type="button" data-action="open-new" aria-label="Novo: chamado, manutenção, aviso, gasto ou documento">${icon('plus')}</button>`
            : `<button class="fab fab-wide" id="fab" type="button" data-action="new-ticket">${icon('plus')}<span>Relatar problema</span></button>`}
          <nav class="tabbar" id="tabbar" aria-label="Seções"></nav>
        </div>`;
    },

    renderNav(role) {
      const c = Store.counts();
      const unread = Store.s.notices.filter((n) => !n.readBy.includes(Store.me().unit)).length;
      let lastGroup = null;
      const side = NAV[role]
        .map((n) => {
          const [num, crit] = n.count ? n.count(c) : [0, false];
          const cur = n.id === this.route ? ' aria-current="page"' : '';
          const label = n.group !== lastGroup ? `<p class="nav-label">${esc(n.group)}</p>` : '';
          lastGroup = n.group;
          return `${label}<a class="nav-link" href="#${n.id}" data-go="${n.id}"${cur}>${icon(n.id === this.route ? n.icon + '-fill' : n.icon)}<span>${esc(n.label)}</span>${num ? `<span class="count${crit ? ' is-crit' : ''}">${num}</span>` : ''}</a>`;
        })
        .join('');
      document.getElementById('side-nav').innerHTML = side;
      // O morador já tem o convite para relatar no Início; o botão flutuante aparece nas outras telas
      document.getElementById('fab').hidden = role === 'morador' && this.route === 'inicio';

      const moreRoutes = ['equipamentos', 'fornecedores', 'documentos'];
      const tabs = TABS[role]
        .map((id) => {
          if (id === 'mais') {
            const cur = moreRoutes.includes(this.route) ? ' aria-current="page"' : '';
            const alert = c.docsExpired ? `<span class="badge-dot">${c.docsAction}</span>` : '';
            return `<button type="button" data-action="open-more"${cur}>${icon(cur ? 'squares-four-fill' : 'squares-four')}<span>Mais</span>${alert}</button>`;
          }
          const n = NAV[role].find((x) => x.id === id);
          const cur = id === this.route;
          let badge = '';
          if (role === 'sindico' && id === 'manutencoes' && c.latePlans) badge = `<span class="badge-dot">${c.latePlans}</span>`;
          if (role === 'morador' && id === 'inicio' && unread) badge = `<span class="badge-dot">${unread}</span>`;
          return `<a href="#${id}" data-go="${id}"${cur ? ' aria-current="page"' : ''}>${icon(cur ? n.icon + '-fill' : n.icon)}<span>${esc(n.label)}</span>${badge}</a>`;
        })
        .join('');
      document.getElementById('tabbar').innerHTML = tabs;
    },

    theme() {
      try {
        return localStorage.getItem(THEME_KEY) || 'system';
      } catch (e) {
        return 'system';
      }
    },

    applyTheme(t) {
      const root = document.documentElement;
      if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
      else if (this.hostTheme) root.setAttribute('data-theme', this.hostTheme);
      else root.removeAttribute('data-theme');
    },
  });

  CO.brandMark = () => `<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>`;

  /* ---------- Perfil e menu "Mais" ---------- */

  CO.actions['open-profile'] = () => {
    const sind = Store.isSindico();
    CO.Sheet.open({
      title: 'Perfil e configurações',
      live: true,
      body: () => {
        const me = Store.me();
        const condo = Store.s.condo;
        return `
          <div class="detail">
            <div style="display:flex;align-items:center;gap:14px">
              ${CO.avatar(me.name, '')}
              <div>
                <div style="font-weight:650;font-size:17px">${esc(me.name)}</div>
                <div class="muted">${sind ? 'Síndica do condomínio' : `Condômino, apartamento ${esc(me.unit)}`}</div>
              </div>
            </div>
            <section class="detail-section">
              <h3>Condomínio</h3>
              <dl class="kv">
                <div class="fact"><dt>Nome</dt><dd>${esc(condo.name)}</dd></div>
                <div class="fact"><dt>Unidades</dt><dd>${condo.units} em ${condo.blocks.length} blocos</dd></div>
                <div class="fact"><dt>Endereço</dt><dd>${esc(condo.address)}</dd></div>
                <div class="fact"><dt>Portaria</dt><dd>${esc(condo.porterPhone)}</dd></div>
              </dl>
            </section>
            <section class="detail-section">
              <h3>Aparência</h3>
              ${F.seg({ name: 'theme', label: 'Tema', hideLabel: true, value: App.theme(), change: 'theme', options: [{ value: 'system', label: 'Sistema', icon: 'circle-half' }, { value: 'light', label: 'Claro', icon: 'sun' }, { value: 'dark', label: 'Escuro', icon: 'moon' }] })}
            </section>
            <section class="detail-section">
              <h3>Demonstração</h3>
              <p class="text-sm muted">Os dados são de exemplo e ficam salvos só neste navegador. Troque de perfil para ver o outro lado do mesmo condomínio.</p>
              <div class="inline-actions">
                <button class="btn btn-secondary" type="button" data-action="switch-role">${icon('user-switch')}Entrar como ${sind ? 'condômino' : 'síndica'}</button>
                <button class="btn btn-ghost" type="button" data-action="reset-data">${icon('arrow-counter-clockwise')}Restaurar dados de exemplo</button>
              </div>
            </section>
            <section class="detail-section">
              <h3>Sobre</h3>
              <p class="text-sm muted">CondOps reúne chamados, plano de manutenção, equipamentos, fornecedores, documentos e custos do condomínio. Esta é a versão MVP para validar o fluxo com síndicos e moradores.</p>
            </section>
          </div>`;
      },
      foot: () => `<button class="btn btn-secondary" type="button" data-action="logout">${icon('sign-out')}Sair</button>`,
    });
  };

  CO.actions['open-more'] = () => {
    const c = Store.counts();
    const item = (route, ic, label, sub, extra = '') => `
      <li><button class="row-btn" type="button" data-go="${route}">
        <span class="ico-tile tone-accent">${icon(ic)}</span>
        <span class="row-main"><span class="row-title">${label}</span><span class="row-meta">${sub}</span></span>
        ${extra}${icon('caret-right', 'muted')}
      </button></li>`;
    CO.Sheet.open({
      title: 'Mais seções',
      body: () => `
        <ul class="list more-list">
          ${item('equipamentos', 'gauge', 'Equipamentos', `${Store.s.equipment.length} cadastrados`)}
          ${item('fornecedores', 'handshake', 'Fornecedores', `${Store.s.suppliers.length} cadastrados`)}
          ${item('documentos', 'folder', 'Documentos', c.docsAction ? `${c.docsAction} exigem ação` : 'Tudo em dia', c.docsExpired ? CO.pill('crit', `${c.docsExpired} vencido`, 'warning-circle') : '')}
        </ul>
        <div class="mt-16"><button class="btn btn-secondary btn-block" type="button" data-action="open-profile">${icon('user-circle')}Perfil e configurações</button></div>`,
    });
  };

  CO.actions['switch-role'] = () => {
    const next = Store.isSindico() ? 'morador' : 'sindico';
    CO.Sheet.close();
    Store.setRole(next);
    App.route = 'inicio';
    App.render(true);
    CO.toast(next === 'sindico' ? 'Você entrou como síndica.' : 'Você entrou como condômino do 304-B.');
  };

  CO.actions['logout'] = () => {
    CO.Sheet.close();
    Store.setRole(null);
    App.render(true);
  };

  CO.actions['reset-data'] = () => {
    CO.confirm({
      title: 'Restaurar dados de exemplo?',
      text: 'Tudo o que você criou ou alterou nesta demonstração será apagado deste navegador.',
      confirmLabel: 'Restaurar',
      danger: true,
      onConfirm: () => {
        Store.reset();
        CO.toast('Dados de exemplo restaurados.');
      },
    });
  };

  CO.actions['sheet-close'] = () => CO.Sheet.close();
  CO.actions['sheet-back'] = () => CO.Sheet.back();

  CO.changes.theme = (el) => {
    try {
      localStorage.setItem(THEME_KEY, el.value);
    } catch (e) {
      /* sem armazenamento: o tema vale até recarregar */
    }
    App.applyTheme(el.value);
  };

  /* ---------- Eventos globais ---------- */

  document.addEventListener('click', (e) => {
    if (CO.Popover.isOpen()) {
      const inside = e.target.closest('.popover');
      const toggle = e.target.closest('[data-action="open-new"]');
      if (!inside || e.target.closest('[data-action], [data-go]')) CO.Popover.close();
      if (toggle && !inside) return;
    }
    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      if (CO.Sheet.isOpen()) CO.Sheet.close();
      App.go(go.dataset.go);
      return;
    }
    const a = e.target.closest('[data-action]');
    if (a && CO.actions[a.dataset.action]) {
      e.preventDefault();
      CO.actions[a.dataset.action](a, e);
    }
  });

  document.addEventListener('submit', (e) => {
    // Nenhum formulário sai da página: tudo é tratado aqui
    e.preventDefault();
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    const h = CO.forms[f.dataset.form];
    if (h && CO.validate(f)) h(f, CO.formObj(f));
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const h = CO.changes[el.dataset.change];
    if (h) h(el, e);
  });
})(window.CO);
