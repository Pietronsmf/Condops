/* Catálogos fixos e dados de exemplo do Residencial Jardim das Acácias.
   As datas são geradas em relação ao dia em que os dados são criados,
   para a demonstração continuar plausível em qualquer data. */
'use strict';

(function (CO) {
  const K = (CO.K = {});

  K.TICKET_CATS = [
    { id: 'eletrica', label: 'Elétrica e iluminação', icon: 'lightbulb' },
    { id: 'hidraulica', label: 'Vazamento e hidráulica', icon: 'drop' },
    { id: 'elevador', label: 'Elevador', icon: 'elevator' },
    { id: 'portao', label: 'Portão e acesso', icon: 'garage' },
    { id: 'seguranca', label: 'Câmeras e segurança', icon: 'security-camera' },
    { id: 'interfone', label: 'Interfone', icon: 'phone' },
    { id: 'estrutura', label: 'Infiltração e estrutura', icon: 'wall' },
    { id: 'limpeza', label: 'Limpeza e lixo', icon: 'broom' },
    { id: 'jardim', label: 'Jardim e área externa', icon: 'plant' },
    { id: 'outro', label: 'Outro assunto', icon: 'dots-three' },
  ];

  K.AREAS = [
    'Garagem (subsolo)',
    'Portão da garagem',
    'Portaria',
    'Hall de entrada Bloco A',
    'Hall de entrada Bloco B',
    'Elevador Bloco A',
    'Elevador Bloco B',
    'Escadas e corredores',
    'Salão de festas',
    'Academia',
    'Piscina',
    'Playground',
    'Jardim frontal',
    'Casa de bombas',
    'Área de lixo',
    'Cobertura e telhado',
    'Fachada',
  ];

  K.TICKET_STATUS = {
    aberto: { label: 'Aberto', tone: 'neutral', icon: 'circle-dashed' },
    analise: { label: 'Em análise', tone: 'warn', icon: 'hourglass-medium' },
    andamento: { label: 'Em andamento', tone: 'accent', icon: 'wrench' },
    resolvido: { label: 'Resolvido', tone: 'ok', icon: 'check-circle' },
  };
  K.STATUS_ORDER = ['aberto', 'analise', 'andamento', 'resolvido'];

  K.URGENCY = {
    baixa: { label: 'Pode esperar', short: 'Baixa', hint: 'Incomoda, mas não atrapalha a rotina.' },
    media: { label: 'Atrapalha a rotina', short: 'Média', hint: 'Afeta o uso do prédio ou da unidade.' },
    alta: { label: 'Risco ou urgente', short: 'Urgente', hint: 'Pode causar acidente, dano ou prejuízo.' },
  };

  K.EXPENSE_CATS = {
    contratos: { label: 'Contratos de manutenção', short: 'Contratos' },
    preventiva: { label: 'Manutenção preventiva', short: 'Preventiva' },
    corretiva: { label: 'Manutenção corretiva', short: 'Corretiva' },
    consumo: { label: 'Água e energia', short: 'Consumo' },
    obras: { label: 'Obras e melhorias', short: 'Obras' },
    seguros: { label: 'Seguros e taxas', short: 'Seguros' },
  };

  K.EQUIP_TYPES = {
    elevador: { label: 'Elevador', icon: 'elevator' },
    bomba: { label: 'Bombas', icon: 'pipe' },
    gerador: { label: 'Gerador', icon: 'lightning' },
    portao: { label: 'Portão', icon: 'garage' },
    cftv: { label: 'CFTV', icon: 'security-camera' },
    incendio: { label: 'Incêndio', icon: 'fire-extinguisher' },
    spda: { label: 'SPDA', icon: 'cloud-lightning' },
    reservatorio: { label: 'Reservatórios', icon: 'drop-half-bottom' },
    interfone: { label: 'Interfone', icon: 'phone' },
    iluminacao: { label: 'Iluminação', icon: 'lightbulb' },
    outro: { label: 'Outro', icon: 'gear' },
  };

  K.EQUIP_STATUS = {
    operando: { label: 'Operando', tone: 'ok', icon: 'check-circle' },
    atencao: { label: 'Atenção', tone: 'warn', icon: 'warning' },
    parado: { label: 'Parado', tone: 'crit', icon: 'warning-circle' },
  };

  K.FREQS = [
    { id: '1w', label: 'Semanal', days: 7 },
    { id: '2w', label: 'Quinzenal', days: 14 },
    { id: '1m', label: 'Mensal', months: 1 },
    { id: '2m', label: 'Bimestral', months: 2 },
    { id: '3m', label: 'Trimestral', months: 3 },
    { id: '6m', label: 'Semestral', months: 6 },
    { id: '12m', label: 'Anual', months: 12 },
    { id: '24m', label: 'A cada 2 anos', months: 24 },
    { id: '60m', label: 'A cada 5 anos', months: 60 },
  ];

  K.DOC_GROUPS = {
    seguranca: { label: 'Segurança, laudos e certificados', icon: 'shield-check' },
    contratos: { label: 'Contratos, seguros e garantias', icon: 'handshake' },
    regras: { label: 'Assembleias e regras', icon: 'users-three' },
    financeiro: { label: 'Prestação de contas', icon: 'receipt' },
  };

  K.NOTICE_KINDS = {
    interrupcao: { label: 'Interrupção', icon: 'warning', tone: 'warn' },
    obra: { label: 'Manutenção', icon: 'wrench', tone: 'accent' },
    assembleia: { label: 'Assembleia', icon: 'users-three', tone: 'accent' },
    geral: { label: 'Aviso geral', icon: 'megaphone', tone: 'neutral' },
  };

  K.UNITS = (() => {
    const out = [];
    for (const b of ['A', 'B']) for (let f = 1; f <= 6; f++) for (let a = 1; a <= 4; a++) out.push(`${f}0${a}-${b}`);
    return out;
  })();

  CO.seed = function seed() {
    const t = CO.today();
    const D = (n) => CO.iso(CO.addDays(t, n));
    const DT = (n, h = 9, m = 0) => {
      const d = CO.addDays(t, n);
      d.setHours(h, m, 0, 0);
      return CO.isoTime(d);
    };
    const upd = (at, by, kind, text, extra = {}) => ({ id: `u${Math.random().toString(36).slice(2, 9)}`, at, by, kind, text, visibility: 'public', ...extra });
    const unitsExcept = (n, except = []) => K.UNITS.filter((u) => !except.includes(u)).slice(0, n);

    const users = [
      { id: 'u-marcia', name: 'Márcia Ribeiro', unit: '601-A', role: 'sindico', title: 'Síndica' },
      { id: 'u-rafael', name: 'Rafael Moura', unit: '304-B', role: 'morador' },
      { id: 'u-helena', name: 'Helena Duarte', unit: '102-A', role: 'morador' },
      { id: 'u-carlos', name: 'Carlos Tanaka', unit: '501-A', role: 'morador' },
      { id: 'u-joana', name: 'Joana Pires', unit: '503-A', role: 'morador' },
      { id: 'u-beatriz', name: 'Beatriz Nogueira', unit: '203-B', role: 'morador' },
      { id: 'u-otavio', name: 'Otávio Lins', unit: '401-B', role: 'morador' },
      { id: 'u-antonio', name: 'José Antônio Lima', unit: null, role: 'zelador', title: 'Zelador' },
    ];

    const suppliers = [
      { id: 's-vertical', name: 'Vertical Elevadores', category: 'Elevadores', contact: 'Fábio Matos', phone: '(21) 3712-4400', email: 'atendimento@verticalelevadores.com.br', cnpj: '12.418.330/0001-07', contract: { value: 1890, start: D(-610), end: D(245), scope: 'Manutenção preventiva mensal e atendimento de emergência 24 h.' }, rating: 4, notes: 'Emergência 24 h pelo telefone do contrato.' },
      { id: 's-hidroserv', name: 'HidroServ Bombas e Hidráulica', category: 'Hidráulica e bombas', contact: 'Luciana Prado', phone: '(21) 99812-3307', email: 'luciana@hidroserv.com.br', cnpj: '27.904.115/0001-62', contract: null, rating: 5, notes: 'Atende no mesmo dia para vazamentos.' },
      { id: 's-clara', name: 'Clara Reservatórios', category: "Limpeza de caixa d'água", contact: 'Renato Clara', phone: '(21) 98877-1402', email: 'agenda@clarareservatorios.com.br', cnpj: '33.120.884/0001-90', contract: null, rating: 4, notes: '' },
      { id: 's-fortex', name: 'Fortex Extintores', category: 'Prevenção de incêndio', contact: 'Sandra Quintela', phone: '(21) 2620-5531', email: 'comercial@fortexextintores.com.br', cnpj: '08.771.402/0001-15', contract: null, rating: 4, notes: '' },
      { id: 's-raio', name: 'Raio Seguro Engenharia', category: 'SPDA e laudos técnicos', contact: 'Eng. Marcos Viana', phone: '(21) 3095-7720', email: 'laudos@raioseguro.eng.br', cnpj: '19.552.630/0001-44', contract: null, rating: 3, notes: 'Emite laudo com ART. Atrasou a entrega do último relatório em 3 semanas.' },
      { id: 's-energia', name: 'Energia Contínua Geradores', category: 'Geradores', contact: 'Paulo Severino', phone: '(21) 3301-8890', email: 'contratos@energiacontinua.com.br', cnpj: '05.338.917/0001-03', contract: { value: 320, start: D(-400), end: D(330), scope: 'Teste mensal com carga e revisão semestral.' }, rating: 4, notes: '' },
      { id: 's-portal', name: 'Portal Automação', category: 'Portões e controle de acesso', contact: 'Diego Araújo', phone: '(21) 97401-2268', email: 'suporte@portalautomacao.com.br', cnpj: '30.184.556/0001-21', contract: null, rating: 3, notes: 'Instalou o portão novo. Garantia de 12 meses.' },
      { id: 's-barreira', name: 'Barreira Controle de Pragas', category: 'Dedetização', contact: 'Simone Barreto', phone: '(21) 2717-4012', email: 'atendimento@barreirapragas.com.br', cnpj: '14.660.209/0001-58', contract: null, rating: 5, notes: '' },
      { id: 's-verdevivo', name: 'Verde Vivo Paisagismo', category: 'Jardinagem', contact: 'André Lacerda', phone: '(21) 98120-7745', email: 'contato@verdevivopaisagismo.com.br', cnpj: '22.903.471/0001-30', contract: { value: 1250, start: D(-500), end: D(230), scope: 'Manutenção semanal do jardim e poda mensal.' }, rating: 4, notes: '' },
      { id: 's-olhovivo', name: 'Olho Vivo Segurança Eletrônica', category: 'CFTV e monitoramento', contact: 'Tatiane Rocha', phone: '(21) 3505-6610', email: 'suporte@olhovivoseg.com.br', cnpj: '17.245.880/0001-09', contract: { value: 680, start: D(-340), end: D(25), scope: 'Monitoramento das câmeras e manutenção do gravador.' }, rating: 3, notes: 'Demora para responder chamados técnicos.' },
      { id: 's-cobertura', name: 'Cobertura Engenharia', category: 'Impermeabilização e estrutura', contact: 'Eng. Lúcia Fontes', phone: '(21) 3022-1187', email: 'orcamentos@coberturaeng.com.br', cnpj: '25.410.396/0001-77', contract: null, rating: null, notes: '' },
      { id: 's-ampere', name: 'Ampère Instalações Elétricas', category: 'Elétrica e interfone', contact: 'Rogério Batista', phone: '(21) 99430-5582', email: 'rogerio@ampereinstalacoes.com.br', cnpj: '11.087.663/0001-26', contract: null, rating: 4, notes: '' },
    ];

    const equipment = [
      { id: 'e-elev-a', name: 'Elevador social Bloco A', type: 'elevador', location: 'Bloco A', brand: 'Atlas Schindler', model: '3300, 8 pessoas (600 kg)', installedAt: '2012-03-10', warrantyUntil: null, supplierId: 's-vertical', status: 'atencao', notes: 'Parando desnivelado. Sensor de nivelamento encomendado.' },
      { id: 'e-elev-b', name: 'Elevador social Bloco B', type: 'elevador', location: 'Bloco B', brand: 'Atlas Schindler', model: '3300, 8 pessoas (600 kg)', installedAt: '2012-03-10', warrantyUntil: null, supplierId: 's-vertical', status: 'operando', notes: '' },
      { id: 'e-bombas', name: 'Bombas de recalque', type: 'bomba', location: 'Casa de bombas (subsolo)', brand: 'Schneider', model: 'BC-92 S 1,5 cv, 2 unidades', installedAt: '2021-06-02', warrantyUntil: '2023-06-02', supplierId: 's-hidroserv', status: 'operando', notes: 'Funcionam em revezamento automático.' },
      { id: 'e-gerador', name: 'Grupo gerador', type: 'gerador', location: 'Subsolo', brand: 'Cummins', model: 'C55 D5, 55 kVA', installedAt: '2018-09-14', warrantyUntil: null, supplierId: 's-energia', status: 'operando', notes: 'Atende elevadores, bombas e iluminação de emergência.' },
      { id: 'e-portao', name: 'Portão automático da garagem', type: 'portao', location: 'Entrada de veículos', brand: 'PPA', model: 'Jet Flex deslizante', installedAt: D(-305), warrantyUntil: D(60), supplierId: 's-portal', status: 'atencao', notes: 'Demorando a fechar. Ainda na garantia.' },
      { id: 'e-cftv', name: 'Circuito de câmeras (CFTV)', type: 'cftv', location: 'Portaria e áreas comuns', brand: 'Intelbras', model: '16 câmeras e gravador NVR', installedAt: '2022-02-20', warrantyUntil: null, supplierId: 's-olhovivo', status: 'atencao', notes: 'Câmera da entrada de pedestres sem imagem.' },
      { id: 'e-incendio', name: 'Extintores e hidrantes', type: 'incendio', location: 'Todos os andares e garagem', brand: 'Diversos', model: '24 extintores (PQS, CO2 e água) e 4 hidrantes', installedAt: '2009-11-01', warrantyUntil: null, supplierId: 's-fortex', status: 'operando', notes: '' },
      { id: 'e-spda', name: 'SPDA (para-raios)', type: 'spda', location: 'Cobertura', brand: 'Termotécnica', model: 'Captor Franklin e malha de aterramento', installedAt: '2009-11-01', warrantyUntil: null, supplierId: 's-raio', status: 'atencao', notes: 'Laudo anual vencido. Falta nova medição do aterramento.' },
      { id: 'e-reserv', name: 'Reservatórios de água', type: 'reservatorio', location: 'Cobertura e subsolo', brand: 'Fortlev', model: '2 caixas de 15.000 L e cisterna de 40.000 L', installedAt: '2009-11-01', warrantyUntil: null, supplierId: 's-clara', status: 'operando', notes: '' },
      { id: 'e-interfone', name: 'Central de interfone', type: 'interfone', location: 'Portaria', brand: 'Intelbras', model: 'Comunic 48 ramais', installedAt: '2019-05-08', warrantyUntil: null, supplierId: 's-ampere', status: 'operando', notes: '' },
      { id: 'e-ilum', name: 'Iluminação de emergência', type: 'iluminacao', location: 'Escadas, halls e garagem', brand: 'Segurimax', model: '38 blocos autônomos LED', installedAt: '2020-07-15', warrantyUntil: null, supplierId: null, status: 'operando', notes: '' },
    ];

    const ex = (id, date, cost, supplierId, note, expenseId = null) => ({ id, date, cost, supplierId, note, expenseId });

    const plans = [
      { id: 'p-elev', title: 'Manutenção preventiva dos elevadores', equipmentIds: ['e-elev-a', 'e-elev-b'], freq: '1m', nextDue: D(9), scheduledAt: null, supplierId: 's-vertical', estCost: 0, covered: true, affectsResidents: true, impact: 'Cada elevador fica parado por cerca de 1 hora.', notes: 'Coberto pelo contrato mensal.', executions: [ex('x1', D(-21), 0, 's-vertical', 'Ajuste de freio e limpeza do poço. Sem pendências.'), ex('x2', D(-52), 0, 's-vertical', 'Rotina mensal.'), ex('x3', D(-82), 0, 's-vertical', 'Troca de lâmpada da cabine do Bloco B.')] },
      { id: 'p-reserv', title: 'Limpeza e desinfecção dos reservatórios', equipmentIds: ['e-reserv'], freq: '6m', nextDue: D(1), scheduledAt: DT(1, 9, 0), supplierId: 's-clara', estCost: 2300, covered: false, affectsResidents: true, impact: 'Água desligada por cerca de 3 horas.', notes: 'A vigilância sanitária exige limpeza a cada 6 meses e certificado emitido pela empresa.', executions: [ex('x4', D(-181), 2300, 's-clara', 'Limpeza das 2 caixas e da cisterna. Certificado emitido.', 'x-reserv')] },
      { id: 'p-extint-recarga', title: 'Recarga e teste dos extintores', equipmentIds: ['e-incendio'], freq: '12m', nextDue: D(38), scheduledAt: null, supplierId: 's-fortex', estCost: 3980, covered: false, affectsResidents: false, impact: '', notes: 'Necessário para renovar o AVCB.', executions: [ex('x5', D(-327), 3980, 's-fortex', 'Recarga dos 24 extintores e teste hidrostático de 6.', 'x-extintores')] },
      { id: 'p-extint-insp', title: 'Inspeção visual de extintores e hidrantes', equipmentIds: ['e-incendio'], freq: '1m', nextDue: D(-2), scheduledAt: null, supplierId: null, estCost: 0, covered: false, affectsResidents: false, impact: '', notes: 'Feita pelo zelador: lacre, pressão, validade e acesso livre.', executions: [ex('x6', D(-32), 0, null, 'Tudo conforme. Hidrante do 2º andar B estava obstruído por bicicleta.'), ex('x7', D(-63), 0, null, 'Tudo conforme.')] },
      { id: 'p-spda', title: 'Inspeção do SPDA e laudo de aterramento', equipmentIds: ['e-spda'], freq: '12m', nextDue: D(-12), scheduledAt: null, supplierId: 's-raio', estCost: 1800, covered: false, affectsResidents: false, impact: '', notes: 'Laudo com ART exigido para o AVCB e pelo seguro.', executions: [ex('x8', D(-377), 1800, 's-raio', 'Medição de aterramento dentro do limite.', 'x-spda')] },
      { id: 'p-bombas', title: 'Revisão das bombas de recalque', equipmentIds: ['e-bombas'], freq: '3m', nextDue: D(21), scheduledAt: null, supplierId: 's-hidroserv', estCost: 650, covered: false, affectsResidents: false, impact: '', notes: '', executions: [ex('x9', D(-71), 650, 's-hidroserv', 'Revisão completa, sem anomalias.', 'x-bombas-1'), ex('x10', D(-163), 650, 's-hidroserv', 'Ruído no rolamento da bomba 2. Recomendada troca.', 'x-bombas-2')] },
      { id: 'p-gerador', title: 'Teste do gerador com carga', equipmentIds: ['e-gerador'], freq: '1m', nextDue: D(3), scheduledAt: null, supplierId: 's-energia', estCost: 0, covered: true, affectsResidents: false, impact: '', notes: 'Coberto pelo contrato mensal.', executions: [ex('x11', D(-27), 0, 's-energia', 'Partida em 8 s. Nível de diesel em 70%.'), ex('x12', D(-58), 0, 's-energia', 'Rotina mensal.')] },
      { id: 'p-portao', title: 'Manutenção preventiva do portão da garagem', equipmentIds: ['e-portao'], freq: '3m', nextDue: D(47), scheduledAt: null, supplierId: 's-portal', estCost: 380, covered: false, affectsResidents: false, impact: '', notes: '', executions: [ex('x13', D(-45), 380, 's-portal', 'Lubrificação e regulagem do fim de curso.', 'x-portao-1'), ex('x14', D(-137), 380, 's-portal', 'Rotina trimestral.', 'x-portao-2')] },
      { id: 'p-pragas', title: 'Dedetização e desratização das áreas comuns', equipmentIds: [], freq: '6m', nextDue: D(64), scheduledAt: null, supplierId: 's-barreira', estCost: 1450, covered: false, affectsResidents: true, impact: 'Áreas comuns fechadas por 4 horas. Animais devem ficar dentro dos apartamentos.', notes: '', executions: [ex('x15', D(-118), 1450, 's-barreira', 'Aplicação em garagem, lixeira, casa de bombas e jardins.', 'x-pragas')] },
      { id: 'p-ilum', title: 'Teste da iluminação de emergência', equipmentIds: ['e-ilum'], freq: '1m', nextDue: D(12), scheduledAt: null, supplierId: null, estCost: 0, covered: false, affectsResidents: false, impact: '', notes: 'Feito pelo zelador desligando o disjuntor de cada andar.', executions: [ex('x16', D(-18), 0, null, '2 blocos com bateria fraca na garagem.')] },
      { id: 'p-cftv', title: 'Revisão das câmeras e do gravador', equipmentIds: ['e-cftv'], freq: '6m', nextDue: D(95), scheduledAt: null, supplierId: 's-olhovivo', estCost: 0, covered: true, affectsResidents: false, impact: '', notes: 'Coberto pelo contrato de monitoramento.', executions: [ex('x17', D(-87), 0, 's-olhovivo', 'Limpeza de lentes e teste de gravação de 30 dias.')] },
      { id: 'p-cobertura', title: 'Inspeção da impermeabilização da cobertura', equipmentIds: [], freq: '12m', nextDue: D(150), scheduledAt: null, supplierId: 's-cobertura', estCost: 1200, covered: false, affectsResidents: false, impact: '', notes: '', executions: [ex('x18', D(-215), 1200, 's-cobertura', 'Manta em bom estado. Ralos limpos.', 'x-cobertura')] },
      { id: 'p-jardim', title: 'Jardinagem e poda', equipmentIds: [], freq: '1m', nextDue: D(14), scheduledAt: null, supplierId: 's-verdevivo', estCost: 0, covered: true, affectsResidents: false, impact: '', notes: 'Coberto pelo contrato mensal.', executions: [ex('x19', D(-16), 0, 's-verdevivo', 'Poda das palmeiras da entrada.')] },
      { id: 'p-gordura', title: 'Limpeza da caixa de gordura', equipmentIds: [], freq: '3m', nextDue: D(30), scheduledAt: null, supplierId: 's-hidroserv', estCost: 420, covered: false, affectsResidents: false, impact: '', notes: '', executions: [ex('x20', D(-62), 420, 's-hidroserv', 'Rotina trimestral.', 'x-gordura-1'), ex('x21', D(-154), 420, 's-hidroserv', 'Rotina trimestral.', 'x-gordura-2')] },
    ];

    const tickets = [
      {
        id: 'CH-0148', title: 'Lâmpada queimada no corredor do 3º andar', category: 'eletrica',
        location: { type: 'common', area: 'Escadas e corredores', detail: '3º andar, Bloco B' }, urgency: 'baixa', status: 'aberto',
        createdAt: DT(-1, 20, 14), createdBy: 'u-rafael', supporters: ['u-beatriz'], supplierId: null, equipmentId: null, photo: null,
        description: 'A lâmpada do corredor perto do elevador queimou no domingo. À noite fica bem escuro para sair do elevador.',
        updates: [upd(DT(-1, 20, 14), 'u-rafael', 'created', 'Chamado aberto')], quotes: [], feedback: null, resolvedAt: null,
      },
      {
        id: 'CH-0147', title: 'Vazamento no teto da garagem, perto da vaga 22', category: 'hidraulica',
        location: { type: 'common', area: 'Garagem (subsolo)', detail: 'Vaga 22' }, urgency: 'alta', status: 'andamento',
        createdAt: DT(-6, 7, 52), createdBy: 'u-helena', supporters: ['u-rafael', 'u-carlos', 'u-otavio', 'u-joana'], supplierId: 's-hidroserv', equipmentId: null, photo: null,
        description: 'Está pingando água do teto em cima da vaga 22 e já formou uma poça. Parece vir de um cano. O carro ficou manchado.',
        updates: [
          upd(DT(-6, 7, 52), 'u-helena', 'created', 'Chamado aberto'),
          upd(DT(-6, 10, 5), 'u-marcia', 'status', 'Recebido. Pedi vistoria da HidroServ.', { status: 'analise' }),
          upd(DT(-5, 16, 30), 'u-marcia', 'comment', 'Vistoria feita: rachadura na tubulação de esgoto que desce do 1º andar. Pedi dois orçamentos.'),
          upd(DT(-4, 11, 0), 'u-marcia', 'status', 'Orçamento da HidroServ aprovado (R$ 1.350). Reparo previsto para esta semana.', { status: 'andamento' }),
          upd(DT(-4, 11, 2), 'u-marcia', 'comment', 'Cobertura Engenharia cotou R$ 2.180 incluindo impermeabilização da laje. Levar para a assembleia.', { visibility: 'internal' }),
        ],
        quotes: [
          { id: 'q-1', supplierId: 's-hidroserv', amount: 1350, days: 3, note: 'Troca de 2 m de tubulação de esgoto e reparo do forro.', status: 'aprovado' },
          { id: 'q-2', supplierId: 's-cobertura', amount: 2180, days: 7, note: 'Reparo da tubulação e impermeabilização da laje.', status: 'pendente' },
        ],
        feedback: null, resolvedAt: null,
      },
      {
        id: 'CH-0146', title: 'Portão da garagem demorando a fechar', category: 'portao',
        location: { type: 'common', area: 'Portão da garagem', detail: '' }, urgency: 'media', status: 'analise',
        createdAt: DT(-3, 8, 20), createdBy: 'u-carlos', supporters: ['u-helena'], supplierId: 's-portal', equipmentId: 'e-portao', photo: null,
        description: 'O portão leva quase um minuto para fechar e às vezes volta a abrir sozinho. À noite fica aberto tempo demais.',
        updates: [
          upd(DT(-3, 8, 20), 'u-carlos', 'created', 'Chamado aberto'),
          upd(DT(-2, 9, 40), 'u-marcia', 'status', 'A Portal Automação vem avaliar na sexta. O portão ainda está na garantia.', { status: 'analise' }),
        ],
        quotes: [], feedback: null, resolvedAt: null,
      },
      {
        id: 'CH-0145', title: 'Elevador do Bloco A parando desnivelado', category: 'elevador',
        location: { type: 'common', area: 'Elevador Bloco A', detail: '' }, urgency: 'alta', status: 'andamento',
        createdAt: DT(-2, 18, 45), createdBy: 'u-joana', supporters: ['u-carlos', 'u-helena'], supplierId: 's-vertical', equipmentId: 'e-elev-a', photo: null,
        description: 'O elevador está parando uns 5 cm abaixo do andar. Minha mãe quase tropeçou ontem.',
        updates: [
          upd(DT(-2, 18, 45), 'u-joana', 'created', 'Chamado aberto'),
          upd(DT(-2, 19, 30), 'u-marcia', 'status', 'Acionei o atendimento de emergência da Vertical. Técnico vem amanhã às 14h.', { status: 'andamento' }),
          upd(DT(-1, 16, 10), 'u-marcia', 'comment', 'Técnico ajustou o nivelamento. Volta na segunda para trocar o sensor, que já foi encomendado.'),
        ],
        quotes: [], feedback: null, resolvedAt: null,
      },
      {
        id: 'CH-0144', title: 'Infiltração na parede do salão de festas', category: 'estrutura',
        location: { type: 'common', area: 'Salão de festas', detail: 'Parede da churrasqueira' }, urgency: 'media', status: 'aberto',
        createdAt: DT(-8, 13, 5), createdBy: 'u-otavio', supporters: [], supplierId: null, equipmentId: null, photo: null,
        description: 'Mancha de umidade na parede ao lado da churrasqueira, com a pintura descascando. Reservei o salão para daqui a duas semanas.',
        updates: [upd(DT(-8, 13, 5), 'u-otavio', 'created', 'Chamado aberto')], quotes: [], feedback: null, resolvedAt: null,
      },
      {
        id: 'CH-0143', title: 'Câmera da entrada de pedestres sem imagem', category: 'seguranca',
        location: { type: 'common', area: 'Portaria', detail: 'Entrada de pedestres' }, urgency: 'media', status: 'analise',
        createdAt: DT(-10, 22, 15), createdBy: 'u-beatriz', supporters: ['u-joana'], supplierId: 's-olhovivo', equipmentId: 'e-cftv', photo: null,
        description: 'O porteiro comentou que a câmera da entrada de pedestres está sem imagem desde o fim de semana.',
        updates: [
          upd(DT(-10, 22, 15), 'u-beatriz', 'created', 'Chamado aberto'),
          upd(DT(-9, 10, 0), 'u-marcia', 'status', 'Abri chamado com a Olho Vivo, que cuida do monitoramento.', { status: 'analise' }),
          upd(DT(-5, 15, 0), 'u-marcia', 'comment', 'A Olho Vivo informou que a câmera queimou. Aguardando orçamento de troca.', { visibility: 'internal' }),
        ],
        quotes: [], feedback: null, resolvedAt: null,
      },
      {
        id: 'CH-0141', title: 'Interfone do apartamento sem áudio', category: 'interfone',
        location: { type: 'unit', area: 'Unidade 304-B', detail: '' }, urgency: 'media', status: 'resolvido',
        createdAt: DT(-18, 9, 30), createdBy: 'u-rafael', supporters: [], supplierId: 's-ampere', equipmentId: 'e-interfone', photo: null,
        description: 'Consigo ouvir a portaria, mas eles não me ouvem. Já testei com outro aparelho e continua igual.',
        updates: [
          upd(DT(-18, 9, 30), 'u-rafael', 'created', 'Chamado aberto'),
          upd(DT(-17, 11, 0), 'u-marcia', 'status', 'Vou pedir para o zelador testar a linha.', { status: 'analise' }),
          upd(DT(-16, 10, 0), 'u-antonio', 'comment', 'Testei: problema na fiação do ramal 304-B dentro da prumada.', { visibility: 'internal' }),
          upd(DT(-14, 9, 0), 'u-marcia', 'status', 'Ampère agendada para quinta às 9h. Alguém precisa estar no apartamento.', { status: 'andamento' }),
          upd(DT(-12, 15, 0), 'u-marcia', 'status', 'Fiação do ramal trocada. Custo de R$ 240 pago pelo condomínio.', { status: 'resolvido' }),
        ],
        quotes: [], feedback: null, resolvedAt: DT(-12, 15, 0),
      },
      {
        id: 'CH-0139', title: 'Barulho forte na bomba d’água durante a noite', category: 'hidraulica',
        location: { type: 'common', area: 'Casa de bombas', detail: '' }, urgency: 'alta', status: 'resolvido',
        createdAt: DT(-101, 23, 10), createdBy: 'u-helena', supporters: ['u-carlos', 'u-rafael'], supplierId: 's-hidroserv', equipmentId: 'e-bombas', photo: null,
        description: 'Um barulho metálico alto vem da casa de bombas toda vez que a bomba liga. Dá para ouvir do primeiro andar.',
        updates: [
          upd(DT(-101, 23, 10), 'u-helena', 'created', 'Chamado aberto'),
          upd(DT(-100, 8, 0), 'u-marcia', 'status', 'HidroServ vem hoje às 14h.', { status: 'andamento' }),
          upd(DT(-96, 17, 0), 'u-marcia', 'status', 'Rolamento e selo mecânico da bomba 2 trocados.', { status: 'resolvido' }),
        ],
        quotes: [], feedback: { ok: true, at: DT(-95, 9, 0) }, resolvedAt: DT(-96, 17, 0),
      },
      {
        id: 'CH-0138', title: 'Lixeira da coleta seletiva quebrada', category: 'limpeza',
        location: { type: 'common', area: 'Área de lixo', detail: '' }, urgency: 'baixa', status: 'resolvido',
        createdAt: DT(-29, 8, 0), createdBy: 'u-beatriz', supporters: [], supplierId: null, equipmentId: null, photo: null,
        description: 'A tampa da lixeira azul quebrou e os gatos estão espalhando o lixo.',
        updates: [
          upd(DT(-29, 8, 0), 'u-beatriz', 'created', 'Chamado aberto'),
          upd(DT(-25, 12, 0), 'u-marcia', 'status', 'Lixeira nova instalada.', { status: 'resolvido' }),
        ],
        quotes: [], feedback: { ok: true, at: DT(-24, 8, 0) }, resolvedAt: DT(-25, 12, 0),
      },
      {
        id: 'CH-0136', title: 'Galho de árvore encostando na fiação', category: 'jardim',
        location: { type: 'common', area: 'Jardim frontal', detail: '' }, urgency: 'media', status: 'resolvido',
        createdAt: DT(-34, 17, 30), createdBy: 'u-carlos', supporters: ['u-otavio'], supplierId: 's-verdevivo', equipmentId: null, photo: null,
        description: 'O galho da mangueira da entrada está encostando no fio que vai para o poste.',
        updates: [
          upd(DT(-34, 17, 30), 'u-carlos', 'created', 'Chamado aberto'),
          upd(DT(-33, 9, 0), 'u-marcia', 'status', 'Verde Vivo vai podar na próxima visita.', { status: 'andamento' }),
          upd(DT(-30, 11, 0), 'u-marcia', 'status', 'Poda feita.', { status: 'resolvido' }),
        ],
        quotes: [], feedback: { ok: true, at: DT(-29, 19, 0) }, resolvedAt: DT(-30, 11, 0),
      },
    ];

    // Lançamentos recorrentes dos últimos 12 meses
    const expenses = [];
    const energia = [4380, 4290, 4450, 4510, 4480, 4620, 4810, 5120, 4980, 4710, 4590, 4560];
    const agua = [6420, 6380, 6550, 6610, 6710, 6840, 7120, 7410, 6980, 6650, 6720, 6690];
    for (let i = 11; i >= 0; i--) {
      const m0 = new Date(t.getFullYear(), t.getMonth() - i, 1);
      const k = 11 - i;
      const push = (day, key, o) => {
        const d = new Date(m0.getFullYear(), m0.getMonth(), day);
        if (d > t) return;
        const date = CO.iso(d);
        expenses.push({ id: `x-${CO.monthKey(date)}-${key}`, date, status: 'pago', supplierId: null, source: null, ...o });
      };
      push(5, 'elev', { description: 'Contrato de manutenção dos elevadores', category: 'contratos', amount: 1890, supplierId: 's-vertical' });
      push(8, 'cftv', { description: 'Contrato de monitoramento do CFTV', category: 'contratos', amount: 680, supplierId: 's-olhovivo' });
      push(10, 'jardim', { description: 'Contrato de jardinagem', category: 'contratos', amount: 1250, supplierId: 's-verdevivo' });
      push(12, 'energia', { description: 'Conta de energia das áreas comuns', category: 'consumo', amount: energia[k] });
      push(15, 'agua', { description: 'Conta de água e esgoto', category: 'consumo', amount: agua[k] });
      push(20, 'seguro', { description: 'Seguro predial, parcela mensal', category: 'seguros', amount: 812 });
      push(26, 'gerador', { description: 'Contrato do gerador, teste mensal', category: 'contratos', amount: 320, supplierId: 's-energia' });
    }

    const one = (id, d, description, category, amount, supplierId, source, status = 'pago') =>
      expenses.push({ id, date: D(d), description, category, amount, supplierId, source, status });
    one('x-quadro', -300, 'Reparo no quadro elétrico do Bloco B', 'corretiva', 1120, 's-ampere', null);
    one('x-portao-novo', -305, 'Instalação do portão automático novo', 'obras', 14800, 's-portal', null);
    one('x-gerador-sem', -290, 'Revisão semestral do gerador', 'preventiva', 980, 's-energia', null);
    one('x-ria', -270, 'Inspeção anual dos elevadores', 'preventiva', 950, 's-vertical', null);
    one('x-exaustor', -250, 'Troca do motor do exaustor da garagem', 'corretiva', 2140, 's-ampere', null);
    one('x-extintores', -327, 'Recarga e teste dos extintores', 'preventiva', 3980, 's-fortex', { type: 'plan', id: 'p-extint-recarga' });
    one('x-cobertura', -215, 'Inspeção da impermeabilização da cobertura', 'preventiva', 1200, 's-cobertura', { type: 'plan', id: 'p-cobertura' });
    one('x-reserv', -181, 'Limpeza e desinfecção dos reservatórios', 'preventiva', 2300, 's-clara', { type: 'plan', id: 'p-reserv' });
    one('x-bombas-2', -163, 'Revisão das bombas de recalque', 'preventiva', 650, 's-hidroserv', { type: 'plan', id: 'p-bombas' });
    one('x-gordura-2', -154, 'Limpeza da caixa de gordura', 'preventiva', 420, 's-hidroserv', { type: 'plan', id: 'p-gordura' });
    one('x-portao-2', -137, 'Manutenção preventiva do portão da garagem', 'preventiva', 380, 's-portal', { type: 'plan', id: 'p-portao' });
    one('x-portao-placa', -128, 'Troca da placa eletrônica do portão', 'corretiva', 2890, 's-portal', null);
    one('x-pragas', -118, 'Dedetização e desratização das áreas comuns', 'preventiva', 1450, 's-barreira', { type: 'plan', id: 'p-pragas' });
    one('x-bomba2', -96, 'Troca de rolamento e selo mecânico da bomba 2', 'corretiva', 5940, 's-hidroserv', { type: 'ticket', id: 'CH-0139' });
    one('x-bombas-1', -71, 'Revisão das bombas de recalque', 'preventiva', 650, 's-hidroserv', { type: 'plan', id: 'p-bombas' });
    one('x-gordura-1', -62, 'Limpeza da caixa de gordura', 'preventiva', 420, 's-hidroserv', { type: 'plan', id: 'p-gordura' });
    one('x-hall', -54, 'Reparo de infiltração no hall do Bloco A', 'corretiva', 1780, 's-cobertura', null);
    one('x-portao-1', -45, 'Manutenção preventiva do portão da garagem', 'preventiva', 380, 's-portal', { type: 'plan', id: 'p-portao' });
    one('x-led', -33, 'Troca de 22 lâmpadas LED na garagem', 'corretiva', 860, 's-ampere', null);
    one('x-lixeira', -25, 'Lixeira nova para a coleta seletiva', 'corretiva', 410, null, { type: 'ticket', id: 'CH-0138' });
    one('x-interfone', -12, 'Reparo da fiação do interfone do 304-B', 'corretiva', 240, 's-ampere', { type: 'ticket', id: 'CH-0141' });
    one('x-vazamento', 0, 'Reparo da tubulação de esgoto na garagem', 'corretiva', 1350, 's-hidroserv', { type: 'ticket', id: 'CH-0147' }, 'previsto');

    const prev1 = CO.addMonths(new Date(t.getFullYear(), t.getMonth(), 1), -1);
    const prev2 = CO.addMonths(new Date(t.getFullYear(), t.getMonth(), 1), -2);
    const documents = [
      { id: 'd-avcb', title: 'AVCB (Auto de Vistoria do Corpo de Bombeiros)', group: 'seguranca', issuedAt: D(-1054), expiresAt: D(41), visibility: 'publico', fileName: 'avcb-jardim-das-acacias.pdf', size: '1,2 MB', equipmentId: 'e-incendio', supplierId: null, notes: 'A renovação exige extintores recarregados e laudo do SPDA em dia.' },
      { id: 'd-spda', title: 'Laudo de inspeção do SPDA com ART', group: 'seguranca', issuedAt: D(-377), expiresAt: D(-12), visibility: 'restrito', fileName: 'laudo-spda.pdf', size: '3,4 MB', equipmentId: 'e-spda', supplierId: 's-raio', notes: '' },
      { id: 'd-ria', title: 'Relatório de inspeção anual dos elevadores', group: 'seguranca', issuedAt: D(-270), expiresAt: D(95), visibility: 'publico', fileName: 'ria-elevadores.pdf', size: '860 KB', equipmentId: 'e-elev-a', supplierId: 's-vertical', notes: 'Cópia afixada dentro de cada elevador.' },
      { id: 'd-reserv', title: 'Certificado de limpeza dos reservatórios', group: 'seguranca', issuedAt: D(-181), expiresAt: D(1), visibility: 'publico', fileName: 'certificado-limpeza-reservatorios.pdf', size: '420 KB', equipmentId: 'e-reserv', supplierId: 's-clara', notes: '' },
      { id: 'd-pragas', title: 'Certificado de dedetização', group: 'seguranca', issuedAt: D(-118), expiresAt: D(64), visibility: 'publico', fileName: 'certificado-dedetizacao.pdf', size: '380 KB', equipmentId: null, supplierId: 's-barreira', notes: '' },
      { id: 'd-seguro', title: 'Apólice do seguro predial', group: 'contratos', issuedAt: D(-213), expiresAt: D(152), visibility: 'publico', fileName: 'apolice-seguro-predial.pdf', size: '2,1 MB', equipmentId: null, supplierId: null, notes: 'Cobertura de incêndio, raio e explosão e responsabilidade civil do síndico.' },
      { id: 'd-contrato-elev', title: 'Contrato de manutenção dos elevadores', group: 'contratos', issuedAt: D(-610), expiresAt: D(245), visibility: 'restrito', fileName: 'contrato-vertical-elevadores.pdf', size: '640 KB', equipmentId: 'e-elev-a', supplierId: 's-vertical', notes: '' },
      { id: 'd-contrato-cftv', title: 'Contrato de monitoramento do CFTV', group: 'contratos', issuedAt: D(-340), expiresAt: D(25), visibility: 'restrito', fileName: 'contrato-olho-vivo.pdf', size: '510 KB', equipmentId: 'e-cftv', supplierId: 's-olhovivo', notes: 'Avaliar renovação: dois chamados técnicos demoraram mais de uma semana.' },
      { id: 'd-garantia-portao', title: 'Termo de garantia do portão automático', group: 'contratos', issuedAt: D(-305), expiresAt: D(60), visibility: 'restrito', fileName: 'garantia-portao.pdf', size: '210 KB', equipmentId: 'e-portao', supplierId: 's-portal', notes: '' },
      { id: 'd-convencao', title: 'Convenção do condomínio', group: 'regras', issuedAt: '2009-08-14', expiresAt: null, visibility: 'publico', fileName: 'convencao.pdf', size: '1,8 MB', equipmentId: null, supplierId: null, notes: '' },
      { id: 'd-regimento', title: 'Regimento interno (revisão de 2024)', group: 'regras', issuedAt: '2024-04-22', expiresAt: null, visibility: 'publico', fileName: 'regimento-interno-2024.pdf', size: '540 KB', equipmentId: null, supplierId: null, notes: '' },
      { id: 'd-ata-ago', title: 'Ata da assembleia geral ordinária', group: 'regras', issuedAt: D(-198), expiresAt: null, visibility: 'publico', fileName: 'ata-ago.pdf', size: '730 KB', equipmentId: null, supplierId: null, notes: 'Aprovou a previsão orçamentária e a troca do portão.' },
      { id: 'd-contas-1', title: `Prestação de contas de ${CO.MONTHS_LONG[prev1.getMonth()]}`, group: 'financeiro', issuedAt: D(-12), expiresAt: null, visibility: 'publico', fileName: `prestacao-contas-${CO.monthKey(CO.iso(prev1))}.pdf`, size: '1,1 MB', equipmentId: null, supplierId: null, notes: '' },
      { id: 'd-contas-2', title: `Prestação de contas de ${CO.MONTHS_LONG[prev2.getMonth()]}`, group: 'financeiro', issuedAt: D(-42), expiresAt: null, visibility: 'publico', fileName: `prestacao-contas-${CO.monthKey(CO.iso(prev2))}.pdf`, size: '1,0 MB', equipmentId: null, supplierId: null, notes: '' },
    ];

    const notices = [
      { id: 'n-agua', kind: 'interrupcao', title: 'Água desligada para limpeza dos reservatórios', body: 'A Clara Reservatórios faz a limpeza e desinfecção das caixas. Separe água para o período. Ao religar, as torneiras podem soltar ar por alguns minutos.', createdAt: DT(-2, 18, 0), startsAt: DT(1, 9, 0), endsAt: DT(1, 12, 0), place: '', pinned: true, planId: 'p-reserv', readBy: unitsExcept(29, ['304-B']) },
      { id: 'n-elev', kind: 'obra', title: 'Elevador do Bloco A pode parar para ajustes', body: 'A Vertical Elevadores está corrigindo o nivelamento. Até a troca do sensor, use as escadas ou o elevador de serviço se o social estiver parado.', createdAt: DT(-1, 17, 0), startsAt: null, endsAt: null, place: '', pinned: false, planId: null, readBy: unitsExcept(17, ['304-B']) },
      { id: 'n-assembleia', kind: 'assembleia', title: 'Assembleia geral extraordinária', body: 'Pauta: reparo e impermeabilização da laje da garagem, renovação do AVCB e troca da câmera da entrada de pedestres.', createdAt: DT(-6, 10, 0), startsAt: DT(15, 19, 30), endsAt: null, place: 'Salão de festas', pinned: false, planId: null, readBy: unitsExcept(22, ['304-B']) },
      { id: 'n-coleta', kind: 'geral', title: 'Novos horários da coleta seletiva', body: 'Recicláveis às terças e sextas até as 19h. Vidro em sacola separada e identificada.', createdAt: DT(-9, 9, 0), startsAt: null, endsAt: null, place: '', pinned: false, planId: null, readBy: unitsExcept(34).concat('304-B') },
    ];

    return {
      version: 1,
      seededAt: CO.iso(t),
      session: { role: null },
      condo: { name: 'Residencial Jardim das Acácias', address: 'Rua das Acácias, 215, Niterói (RJ)', units: K.UNITS.length, blocks: ['A', 'B'], budgetMonthly: 19500, porterPhone: '(21) 2611-4080' },
      users, suppliers, equipment, plans, tickets, expenses, documents, notices,
      nextTicket: 149,
    };
  };
})(window.CO);
