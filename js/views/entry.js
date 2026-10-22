/* Tela de entrada: escolha do perfil da demonstração. */
'use strict';

(function (CO) {
  const { esc, Store } = CO;
  const icon = (n, c) => CO.icon(n, c);

  // Janelas acesas na fachada: cada bloco tem 6 andares x 4 apartamentos.
  const facade = (name, lit, alert) => {
    let cells = '';
    for (let floor = 6; floor >= 1; floor--) {
      for (let apt = 1; apt <= 4; apt++) {
        const unit = `${floor}0${apt}`;
        const on = lit.includes(unit);
        const cls = alert === unit ? 'on alert' : on ? 'on' : '';
        const delay = on ? ` style="--d:${(7 - floor) * 70 + apt * 40}ms"` : '';
        cells += `<i class="${cls}"${delay}></i>`;
      }
    }
    return `
      <div class="block">
        <div class="block-body">${cells}<span class="door"></span></div>
        <span class="block-name">Bloco ${name}</span>
      </div>`;
  };

  CO.views.entry = {
    render() {
      const condo = Store.s.condo;
      return `
        <main class="entry">
          <section class="entry-art" aria-label="Apresentação">
            <div>
              <div class="brand" style="padding:0">
                ${CO.brandMark()}
                <span class="brand-name">CondOps</span>
              </div>
              <h1 class="entry-headline" style="margin-top:36px">O prédio inteiro, em dia e à vista de todos.</h1>
              <p class="entry-lede">Chamados, manutenções, equipamentos, fornecedores, documentos e custos do condomínio em um só lugar. Quem administra organiza; quem mora acompanha.</p>
            </div>
            <div>
              <div class="facade" aria-hidden="true">
                ${facade('A', ['601', '503', '501', '402', '304', '202', '102', '103', '604'], '')}
                ${facade('B', ['603', '502', '401', '304', '302', '203', '104', '101'], '304')}
              </div>
              <div class="facade-ground"></div>
            </div>
          </section>
          <section class="entry-pick">
            <h2>Como você quer entrar?</h2>
            <button class="choice" type="button" data-action="enter" data-role="sindico">
              ${CO.avatar('Márcia Ribeiro')}
              <span class="choice-main">
                <span class="choice-role">Síndica</span>
                <span class="choice-name">Márcia Ribeiro</span>
                <span class="choice-desc">Administra o ${esc(condo.name)}: chamados, plano de manutenção, fornecedores, documentos e custos.</span>
              </span>
              ${icon('arrow-right', 'choice-go')}
            </button>
            <button class="choice" type="button" data-action="enter" data-role="morador">
              ${CO.avatar('Rafael Moura')}
              <span class="choice-main">
                <span class="choice-role">Condômino</span>
                <span class="choice-name">Rafael Moura</span>
                <span class="choice-desc">Apartamento 304, Bloco B. Relata problemas, acompanha chamados, lê avisos e vê para onde vai o dinheiro.</span>
              </span>
              ${icon('arrow-right', 'choice-go')}
            </button>
            <p class="entry-note">${icon('info')}<span>Demonstração com dados de exemplo de um condomínio de ${condo.units} unidades. O que você fizer fica salvo apenas neste navegador.</span></p>
          </section>
        </main>`;
    },
  };

  CO.actions.enter = (el) => {
    Store.setRole(el.dataset.role);
    CO.App.route = 'inicio';
    CO.App.render(true);
  };
})(window.CO);
