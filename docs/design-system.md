# CondOps: sistema de design

Os tokens vivem no topo de `css/styles.css`. Este guia explica as escolhas para quem for continuar o projeto.

## Direção

Produto de confiança para um tema cotidiano: calmo, legível, sem enfeite. A identidade vem do próprio assunto: o símbolo é uma fachada com seis janelas, a tela de entrada desenha os dois blocos do prédio com as janelas acesas, e os textos usam a linguagem do condomínio (unidade 304-B, AVCB, SPDA, NBR 5674).

## Cores

| Token | Uso |
|---|---|
| `--bg`, `--surface`, `--surface-2`, `--surface-3` | Fundo cinza-concreto levemente esverdeado; superfícies dos painéis e campos |
| `--ink`, `--ink-2`, `--ink-3` | Texto principal, secundário e de apoio (todos com contraste AA) |
| `--line`, `--line-2` | Divisórias e bordas de campos |
| `--accent` (petróleo) | Ação principal, item ativo, barras dos gráficos |
| `--ok`, `--warn`, `--crit` (e versões `-soft` e `-mark`) | Estado: em dia, vencendo, atrasado ou vencido. Nunca usados como cor decorativa |
| `--serious-mark` | Meses acima do orçamento no gráfico |
| `--hero` | Faixa escura da entrada e do convite "Relatar problema" |

O tema escuro redefine os mesmos tokens. Ele segue o sistema por padrão e pode ser fixado em Perfil e configurações.

## Tipografia

| Papel | Fonte | Onde |
|---|---|---|
| Títulos e números grandes | Bricolage Grotesque | Título da página, números dos indicadores, títulos de painel |
| Interface e texto | Geist | Todo o resto |
| Códigos | Geist Mono | Número do chamado (CH-0147), CNPJ |

Números em colunas usam `tabular-nums`. Campos de formulário têm 16 px para o iPhone não dar zoom.

## Forma e espaço

- Botões e campos: raio de 10 px. Painéis: 16 px. Folhas: 22 px no topo. Chips e etiquetas: totalmente arredondados.
- Grupos usam `gap` em grid ou flex; nada de margens soltas entre irmãos.
- Margem lateral mínima de 16 px, respeitando as áreas seguras do celular.

## Componentes

| Componente | Regra |
|---|---|
| Etiqueta de estado (`.pill`) | Sempre ícone + texto, nunca só cor |
| Linha de lista (`.row-btn`) | Ícone, título, metadados e estado à direita; faixa lateral vermelha ou âmbar para urgência |
| Folha (`CO.Sheet`) | Painel à direita no computador, folha inferior no celular, com pilha (voltar) e foco preso |
| Aviso rápido (`CO.toast`) | Confirma toda ação; quando a ação muda dados, oferece "Desfazer" |
| Formulário (`CO.F`) | Rótulo acima, dica abaixo, erro abaixo com ícone e instrução de correção |
| Etapas do chamado (`CO.stepper`) | Aberto, Em análise, Andamento, Resolvido |
| Lista "Para resolver" | Marca de gravidade, título, motivo em uma linha e uma única ação de um toque |
| Seção recolhível (`.disclosure`) | Esconde o que é avançado ou já lido; o resumo mostra o estado sem abrir |
| Botão flutuante (`.fab`) | Só no celular; "Novo" para a síndica, "Relatar problema" para o condômino |
| Gráfico mensal | Um eixo, linha tracejada do orçamento, rótulo direto só no último mês fechado, detalhes ao passar o mouse ou focar |

## Movimento

| Elemento | Duração e curva |
|---|---|
| Toque em botão | `scale(0.97)`, 140 ms |
| Painel lateral e folha | Entra em 420 ms com curva de gaveta, sai em 260 ms pelo mesmo caminho |
| Troca de passo dentro da folha | 240 ms deslizando 14 px |
| Troca de página | 220 ms, só opacidade e 6 px de deslocamento |
| Menu Novo (computador) | Cresce a partir do botão, 180 ms |
| Item concluído na lista | Desliza 12 px e recolhe em 260 ms antes de sair, mostrando que foi resolvido |

Com "reduzir movimento" ativado, tudo vira troca de opacidade. Efeitos de passar o mouse só valem em dispositivos com mouse.

## Ícones

Phosphor (licença MIT), peso regular, e preenchido no item ativo da navegação. `tools/build-icons.mjs` gera `js/icons.js` só com os ícones usados no código.
