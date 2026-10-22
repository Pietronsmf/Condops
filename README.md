# CondOps

Plataforma para a gestão operacional de condomínios: **chamados, manutenções, equipamentos, fornecedores, documentos e custos** em um só lugar. O síndico administra; todos os condôminos acompanham.

Este repositório contém o **MVP navegável**, com dados de exemplo do *Residencial Jardim das Acácias* (48 unidades, 2 blocos), e a pesquisa de UX que orientou as decisões.

## Como rodar

Não há etapa de build. Abra o `index.html` no navegador, ou sirva a pasta:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Na tela inicial, escolha entrar como **síndica (Márcia Ribeiro)** ou como **condômino (Rafael Moura, 304-B)**. Dá para trocar de perfil a qualquer momento em *Perfil e configurações*. Tudo o que você fizer fica salvo apenas no seu navegador; use *Restaurar dados de exemplo* para recomeçar.

## O que cada perfil faz

### Síndico
- **Início:** uma frase diz quantas coisas precisam de atenção; abaixo, a lista "Para resolver" separa o que é para agora do que vence nas próximas semanas, cada item com sua ação de um toque (Feito hoje, Renovar, Atualizar, Responder). Ao lado, a agenda da semana e o mural com a porcentagem de unidades que leram cada aviso.
- **Botão Novo e busca:** registrar chamado, manutenção feita, aviso, gasto ou documento a partir de qualquer tela; busca em tudo com Ctrl K (ou ⌘ K) ou "/".
- **Chamados:** lista ou quadro por etapa. No detalhe, um único botão leva à próxima etapa (Começar análise, Iniciar conserto, Marcar como resolvido), há respostas prontas para os moradores e a gestão avançada (urgência, fornecedor, equipamento, orçamentos) fica recolhida até ser necessária.
- **Manutenções:** plano preventivo no espírito da NBR 5674 (o que, a cada quanto tempo, quem faz), "Feito hoje" com um toque para o que está atrasado ou vencendo, agendamento, aviso aos moradores e registro detalhado quando precisar.
- **Equipamentos:** ficha com garantia, responsável, plano, chamados e documentos de cada sistema do prédio.
- **Fornecedores:** contatos para copiar, contrato e vigência, avaliação e histórico de serviços e pagamentos.
- **Documentos:** AVCB, laudos, certificados, contratos, atas e prestações de contas, com alerta 60 dias antes de vencer, renovação e controle de quem pode ver.
- **Custos:** gasto mensal contra o orçamento, relação entre corretiva e preventiva, categorias, fornecedores e lançamentos ligados à origem.

### Condômino
- **Início:** convite para relatar problema, só os avisos ainda não lidos em destaque (os lidos ficam recolhidos), meus chamados com as etapas, agenda do prédio e o gasto do mês contado em uma frase.
- **Relatar problema em 3 passos:** categoria, local (as áreas mais prováveis para cada tipo de problema aparecem primeiro) e o que você viu, com foto. A primeira frase vira o título, sem campo extra. Se já existir um chamado parecido, o app sugere apoiar o existente em vez de duplicar.
- **Chamados:** os meus e os que estão abertos no prédio, com o botão "Também me afeta".
- **Confirmação:** quando a síndica resolve, o morador confirma ou reabre o chamado.
- **Documentos e Transparência:** documentos públicos e os mesmos números de gastos que a síndica vê, inclusive o custo por unidade.

## Estrutura

```
index.html            Página única
css/styles.css        Tokens de design e componentes (tema claro e escuro)
js/util.js            Datas, dinheiro, utilidades
js/icons.js           Ícones Phosphor usados (gerado)
js/data.js            Catálogos e dados de exemplo
js/store.js           Estado, persistência local, consultas e ações (com desfazer)
js/ui.js              Folha lateral/inferior, avisos rápidos, formulários, validação
js/app.js             Navegação por perfil, rotas e eventos globais
js/quick.js           Botão Novo, registrar manutenção feita e busca global
js/views/*.js         Telas: entrada, início, chamados, manutenções, equipamentos,
                      fornecedores, documentos, custos
docs/pesquisa-ux.md   Hipóteses de pesquisa, dores, oportunidades, roteiro de
                      entrevistas e teste de usabilidade
docs/design-system.md Cores, tipografia, componentes e movimento
tools/build-icons.mjs Gera js/icons.js a partir do pacote @phosphor-icons/core
```

Para regenerar os ícones depois de usar um novo nome em `CO.icon(...)`:

```bash
npm install
npm run icons
```

## Decisões técnicas

- **HTML, CSS e JavaScript puros**, sem framework nem build, para qualquer pessoa da equipe abrir, entender e alterar.
- **Dados no `localStorage`**: suficiente para validar o fluxo com usuários. O próximo passo é um servidor (por exemplo, Django, como no Motion Club) com contas, anexos reais e notificações.
- **Acessível por padrão:** contraste AA, foco visível, navegação por teclado, estados com ícone e texto, respeito a "reduzir movimento".

## Próximos passos

Veja a seção 11 de [`docs/pesquisa-ux.md`](docs/pesquisa-ux.md): validar as hipóteses com entrevistas, rodar o teste de usabilidade e então partir para servidor, notificações e o perfil do zelador.
