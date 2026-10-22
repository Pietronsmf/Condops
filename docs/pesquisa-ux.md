# CondOps: pesquisa de UX e decisões do MVP

Este documento reúne o que sabemos (e o que ainda precisamos confirmar) sobre como a gestão operacional de um condomínio funciona na prática, onde estão as dificuldades e quais oportunidades o MVP ataca.

> **Status:** as seções 2 a 5 são **hipóteses de pesquisa** montadas a partir de pesquisa documental (normas técnicas, legislação e rotina comum de condomínios residenciais). Elas ainda precisam ser validadas com entrevistas reais usando o roteiro da seção 7. Nada aqui deve ser tratado como dado coletado até essa validação.

---

## 1. Objetivo da pesquisa

Entender, com síndicos, condôminos, zeladores e administradoras:

1. **Como** os processos de manutenção, equipamentos, fornecedores, documentos e custos funcionam hoje.
2. **Quais** são as principais dificuldades de cada pessoa envolvida.
3. **Onde** existem oportunidades de melhoria que um produto digital resolve melhor do que o WhatsApp, a planilha e a pasta de papel.

Pergunta central: *o que impede o condomínio de manter o prédio em dia e de mostrar isso a quem mora nele?*

---

## 2. Como os processos funcionam hoje (hipóteses)

| Processo | Como costuma acontecer | Onde a informação fica |
|---|---|---|
| **Problemas do dia a dia (chamados)** | Morador avisa o porteiro, manda mensagem no grupo de WhatsApp ou fala com o síndico no elevador. O síndico liga para um fornecedor conhecido. | Conversas de WhatsApp, memória do síndico e do zelador |
| **Manutenção preventiva** | Depende da memória do síndico ou do contrato com cada empresa. A NBR 5674 pede um programa de manutenção com registros, mas poucos prédios pequenos têm um. | Planilha, agenda pessoal, contrato em papel |
| **Equipamentos** | Elevadores, bombas, portão, gerador, CFTV, extintores e SPDA são conhecidos pelo zelador, mas sem cadastro com garantia, fornecedor e histórico. | Cabeça do zelador, notas fiscais soltas |
| **Fornecedores** | Lista de contatos no celular do síndico. Orçamentos chegam por WhatsApp ou e-mail e a escolha raramente é registrada. | Celular do síndico, e-mail |
| **Documentos** | AVCB, laudo do SPDA, apólice de seguro (obrigatória pelo art. 1.346 do Código Civil), certificados de limpeza da caixa d'água e dedetização, contratos e atas ficam em pastas físicas ou com a administradora. Vencimentos são descobertos tarde. | Pasta física, Drive pessoal, administradora |
| **Custos** | A administradora emite balancete mensal. O morador vê o boleto e, uma vez por ano, a prestação de contas em assembleia (art. 1.348, VIII, do Código Civil). | Sistema da administradora, PDF da prestação de contas |
| **Comunicação** | Avisos impressos no elevador e mensagens no grupo, que se perdem em meio a outras conversas. Não há como saber quem leu. | Mural físico, WhatsApp |

---

## 3. Quem está envolvido (proto-personas)

### Márcia, síndica moradora (perfil principal do MVP)
- 52 anos, mora no 601-A, foi eleita por dois anos. Trabalha meio período.
- Usa WhatsApp o dia todo, planilha com dificuldade, e guarda os documentos numa pasta azul.
- **Precisa:** saber o que está atrasado ou para vencer, responder rápido aos moradores e se proteger em caso de problema (seguro, multa, cobrança em assembleia).
- **Frase provável:** "Eu só descubro que o laudo venceu quando o seguro pede."

### Rafael, condômino (perfil principal do MVP)
- 34 anos, apartamento 304-B, trabalha fora o dia todo.
- Silenciou o grupo do prédio. Paga a taxa sem saber para onde vai o dinheiro.
- **Precisa:** relatar um problema sem burocracia, saber se alguém está cuidando e entender os gastos.
- **Frase provável:** "Avisei do vazamento três vezes e ninguém me respondeu."

### Seu Antônio, zelador (próxima versão)
- Faz as inspeções de rotina (extintores, iluminação de emergência), recebe fornecedores e conhece cada equipamento.
- **Precisa:** uma lista simples do que verificar e um jeito de registrar com foto.

### Síndico profissional e administradora (próxima versão)
- Cuidam de vários prédios. Precisam de visão consolidada e de histórico que sobreviva à troca de síndico.

### Conselho fiscal (próxima versão)
- Confere contas e orçamentos. Precisa de lançamentos com origem e comprovante.

---

## 4. Principais dificuldades (hipóteses a validar)

### Síndico
1. **Informação espalhada** em WhatsApp, e-mail, papel e administradora. Nada conversa entre si.
2. **Manutenção reativa:** a preventiva é esquecida até virar conserto caro (ex.: rolamento de bomba que vira troca de bomba).
3. **Vencimentos descobertos tarde:** AVCB, laudo do SPDA, certificado da caixa d'água, contratos. Vencido significa risco de multa e de problema com o seguro.
4. **Chamados repetidos:** dez moradores avisam o mesmo vazamento, cada um num canal.
5. **Sem histórico por equipamento:** quem consertou, quando, quanto custou, se ainda está na garantia.
6. **Orçamentos difíceis de comparar e de justificar** na prestação de contas.
7. **Troca de síndico apaga a memória do prédio.**

### Condômino
1. **Não sabe se o problema foi recebido** nem quem está cuidando.
2. **Não sabe se outras pessoas já avisaram**, então avisa de novo ou não avisa.
3. **Fica sabendo de interrupções tarde** (água, elevador) porque o aviso no elevador passa despercebido.
4. **Desconfia dos gastos** porque só vê o total uma vez por ano.
5. **Não encontra documentos** como regimento interno e atas quando precisa.

### Zelador
1. Recebe ordens por vários canais.
2. Não tem onde registrar o que verificou.

---

## 5. Oportunidades e o que entrou no MVP

Cada oportunidade foi escrita como "Como poderíamos..." e priorizada por **impacto** (dor resolvida, frequência) e **esforço**.

| # | Como poderíamos... | Impacto | Esforço | No MVP |
|---|---|---|---|---|
| O1 | ...mostrar ao síndico, numa tela, tudo o que está atrasado ou para vencer? | Alto | Baixo | **Sim**: painel "Precisa de atenção" |
| O2 | ...deixar o morador relatar um problema em menos de um minuto e acompanhar cada etapa? | Alto | Médio | **Sim**: chamado em 3 passos com foto e linha do tempo |
| O3 | ...evitar chamados repetidos? | Alto | Baixo | **Sim**: aviso de chamado parecido e botão "Também me afeta" |
| O4 | ...transformar a NBR 5674 num plano simples de seguir? | Alto | Médio | **Sim**: plano preventivo com frequência, responsável e registro de execução |
| O5 | ...ligar cada gasto à sua origem (chamado, plano, contrato)? | Alto | Médio | **Sim**: execução e orçamento aprovado viram lançamento em Custos |
| O6 | ...avisar antes dos documentos vencerem? | Alto | Baixo | **Sim**: alerta 60 dias antes, renovação com nova validade |
| O7 | ...dar ao morador a mesma visão de gastos que o síndico tem? | Alto | Baixo | **Sim**: página Transparência com custo por unidade |
| O8 | ...saber quem leu um aviso importante? | Médio | Baixo | **Sim**: "Estou ciente" e contagem de unidades |
| O9 | ...fechar o ciclo do chamado com quem reclamou? | Médio | Baixo | **Sim**: morador confirma se foi resolvido ou reabre |
| O10 | ...comparar orçamentos e documentar a escolha? | Médio | Baixo | **Sim**: orçamentos no chamado, aprovação registrada |
| O11 | ...guardar o histórico de cada equipamento? | Médio | Médio | **Sim**: ficha do equipamento com plano, chamados e documentos |
| O12 | ...dar ao zelador uma rotina de inspeção pelo celular? | Médio | Médio | Próxima versão |
| O13 | ...enviar notificações por WhatsApp, e-mail ou push? | Alto | Alto | Próxima versão (precisa de servidor) |
| O14 | ...integrar com a administradora e o banco? | Médio | Alto | Fora do escopo inicial |
| O15 | ...atender síndicos profissionais com vários prédios? | Médio | Alto | Próxima versão |

---

## 6. Jornada: vazamento na garagem

**Hoje (hipótese)**

1. Helena vê água pingando na vaga 22 e manda mensagem no grupo.
2. Quatro vizinhos respondem "aqui também" e dois mandam mensagem direto para a síndica.
3. A síndica liga para um encanador conhecido, recebe dois orçamentos por WhatsApp e aprova um por áudio.
4. Ninguém avisa os moradores. Dias depois, alguém pergunta de novo no grupo.
5. Na assembleia, perguntam quanto custou e por que aquela empresa. A síndica procura no celular.

**Com o CondOps**

1. Helena abre um chamado em 3 passos com foto. Recebe o número CH-0147.
2. Rafael tenta abrir o mesmo chamado, vê que já existe e toca em "Também me afeta". A síndica vê "5 moradores afetados".
3. A síndica muda a situação para "Em análise", define o fornecedor, registra dois orçamentos e aprova um. O valor entra em Custos como previsto.
4. Cada atualização pública aparece para quem abriu e para quem apoiou. Anotações internas (como a negociação) ficam só para a síndica.
5. Ao marcar como resolvido, a síndica conta o que foi feito e informa o custo final. Helena confirma que resolveu, ou reabre.
6. O gasto aparece na Transparência com o fornecedor e o número do chamado.

---

## 7. Roteiro de entrevistas (validação)

Entrevistas semiestruturadas de 30 a 40 minutos, de preferência no próprio prédio. Meta inicial: **5 síndicos (3 moradores e 2 profissionais), 6 condôminos, 2 zeladores e 1 administradora**.

**Abertura (todos)**
- Conte como é o seu papel no condomínio. Há quanto tempo?
- Como é uma semana normal em relação ao prédio?

**Síndico**
1. Conte a última vez que algo quebrou no prédio. Como você ficou sabendo? O que fez depois?
2. Como você sabe quais manutenções estão em dia? Onde isso fica anotado?
3. Algum documento já venceu sem você perceber? O que aconteceu?
4. Como você escolhe um fornecedor? Como guarda os orçamentos?
5. O que os moradores mais cobram de você? Por qual canal?
6. Como é a prestação de contas? O que é mais difícil de explicar?
7. Se você deixasse de ser síndico amanhã, o que o próximo perderia?
8. Que ferramentas você usa hoje (WhatsApp, planilha, app da administradora)? O que funciona e o que não funciona?

**Condômino**
1. Conte a última vez que você viu um problema no prédio. O que fez?
2. Como você soube se alguém estava cuidando?
3. Como você fica sabendo de interrupções de água, elevador ou obras?
4. Você sabe para onde vai o dinheiro da taxa? O que gostaria de saber?
5. Você já precisou de um documento do condomínio (regimento, ata)? Conseguiu achar?

**Zelador**
1. Quais verificações você faz toda semana ou todo mês? Como registra?
2. Como recebe pedidos do síndico e dos moradores?
3. Qual equipamento dá mais trabalho? Quem você chama quando ele para?

**Fechamento (todos)**
- Se pudesse resolver uma única coisa, qual seria?
- Posso mostrar um protótipo e ouvir sua opinião? (leva ao teste da seção 8)

**Cuidados:** perguntar sobre fatos passados, não sobre opiniões futuras; não mostrar o protótipo antes das perguntas abertas; anotar frases literais; registrar consentimento antes de gravar.

---

## 8. Teste de usabilidade do MVP

Teste moderado, 5 participantes por perfil, pensando em voz alta, no celular do participante quando possível.

| Perfil | Tarefa | Sucesso quando |
|---|---|---|
| Condômino | "A lâmpada da garagem queimou. Avise o condomínio." | Chamado enviado com categoria, área e urgência corretas |
| Condômino | "Você viu que o portão está demorando a fechar. Veja se alguém já avisou." | Encontra o chamado em "No prédio" e apoia em vez de abrir outro |
| Condômino | "Quanto o condomínio gastou no mês passado com manutenção corretiva?" | Encontra o valor na Transparência |
| Condômino | "Ache o regimento interno." | Abre o documento em até 3 toques |
| Síndico | "O que precisa da sua atenção hoje?" | Cita os itens críticos do painel sem rolar a página inteira |
| Síndico | "A limpeza da caixa d'água foi feita hoje e custou R$ 2.300. Registre." | Execução registrada e lançamento criado em Custos |
| Síndico | "Atualize os moradores sobre o vazamento da garagem sem mostrar o valor negociado." | Publica uma atualização pública e uma anotação interna |
| Síndico | "O laudo do SPDA foi renovado por um ano. Registre." | Documento renovado com nova validade |

**Métricas:** taxa de sucesso por tarefa, tempo, número de erros, nota de facilidade de 1 a 7 após cada tarefa (SEQ) e SUS ao final.
**Meta para seguir para o piloto:** 80% de sucesso sem ajuda nas tarefas do condômino e SEQ médio acima de 5,5.

---

## 9. Como saberemos que o produto funciona (piloto)

| Métrica | Por que importa |
|---|---|
| Tempo até a primeira resposta ao morador | Mede se o morador se sente ouvido (o MVP já calcula a média) |
| % de chamados abertos por apoio em vez de duplicados | Mede redução de retrabalho |
| % do plano preventivo em dia | Mede a mudança de manutenção reativa para preventiva |
| Documentos vencidos | Deve chegar a zero |
| Relação corretiva x preventiva em R$ | Deve cair com o tempo |
| % de unidades que confirmam avisos de interrupção | Mede alcance da comunicação |
| Moradores ativos por mês | Mede adoção pelo lado de quem mora |

---

## 10. Decisões de UX e UI aplicadas

**Dois produtos no mesmo app.** O síndico vê ferramentas de gestão; o condômino vê só o que precisa: relatar, acompanhar, ler avisos, documentos públicos e gastos. A navegação muda por perfil e nunca mostra opções que a pessoa não pode usar.

**Celular primeiro.** O morador usa no celular; o síndico, nos dois. No celular há abas inferiores com alvos de toque grandes e folhas que sobem de baixo (e fecham arrastando); no computador, barra lateral e painel à direita, sem perder a lista de vista.

**Heurísticas de Nielsen no produto**

| Heurística | Onde aparece |
|---|---|
| Visibilidade do estado do sistema | Etapas do chamado (Aberto, Em análise, Andamento, Resolvido), contadores na navegação, avisos de confirmação |
| Correspondência com o mundo real | Termos do condomínio: unidade 304-B, AVCB, SPDA, NBR 5674, prestação de contas, "Também me afeta" |
| Controle e liberdade | "Desfazer" em toda alteração, voltar entre passos, fechar com Esc ou arrastando |
| Consistência | Mesmas cores para o mesmo significado: vermelho atrasado ou vencido, âmbar vencendo, verde em dia |
| Prevenção de erros | Aviso de chamado parecido, datas validadas, confirmação antes de apagar dados |
| Reconhecer em vez de lembrar | Categorias com ícones, áreas comuns como opções, orçamentos lado a lado |
| Eficiência | Filtros e busca, visão em quadro para o síndico, atalhos do painel direto para a ação |
| Design minimalista | Cada tela responde uma pergunta; detalhes ficam no painel lateral |
| Ajudar a recuperar de erros | Mensagens que dizem como corrigir, junto do campo |
| Ajuda | Dicas curtas nos campos e aviso de risco imediato com o telefone da portaria |

**Acessibilidade.** Contraste AA nos textos, estados nunca só por cor (sempre ícone e texto), foco visível, navegação por teclado com foco preso nos painéis, rótulos acima dos campos, campos com 16 px para o celular não dar zoom, respeito a "reduzir movimento" e tema claro e escuro.

**Movimento com propósito.** Só onde comunica algo: o painel entra e sai pelo mesmo lado, o botão afunda ao toque, as janelas acesas da fachada na entrada. Animações curtas (até 300 ms) e nada que se repita sem parar.

---

## 11. Fora do MVP (próximos passos)

1. Servidor e contas reais (o MVP guarda dados só no navegador).
2. Notificações por e-mail, push e WhatsApp.
3. Perfil do zelador com checklist de inspeção e fotos.
4. Anexos reais (PDF e fotos de notas fiscais).
5. Vários condomínios por conta, para síndicos profissionais e administradoras.
6. Reserva de áreas comuns e assembleia digital, se a pesquisa confirmar a demanda.
