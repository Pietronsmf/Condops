/* Estado da aplicação: persistência local, consultas e ações. */
'use strict';

(function (CO) {
  const K = CO.K;
  const KEY = 'condops:v1';

  const Store = (CO.Store = {
    s: null,
    history: [],

    /* ---------- Persistência ---------- */

    load() {
      let data = null;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) {
        data = null;
      }
      this.s = data && data.version === 1 ? data : CO.seed();
    },

    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.s));
        return true;
      } catch (e) {
        return false;
      }
    },

    commit() {
      const ok = this.save();
      CO.App.render();
      if (!ok && !this._warned) {
        this._warned = true;
        CO.toast('Este navegador não deixou salvar. As mudanças valem até você fechar a página.', { tone: 'warn' });
      }
    },

    /** Guarda uma cópia do estado para o botão Desfazer. */
    checkpoint() {
      this.history.push(JSON.stringify(this.s));
      if (this.history.length > 20) this.history.shift();
    },

    undo() {
      const prev = this.history.pop();
      if (!prev) return;
      this.s = JSON.parse(prev);
      this.commit();
    },

    reset() {
      const role = this.s.session.role;
      this.s = CO.seed();
      this.s.session.role = role;
      this.history = [];
      this.commit();
    },

    /* ---------- Consultas ---------- */

    role() { return this.s.session.role; },
    isSindico() { return this.s.session.role === 'sindico'; },
    me() { return this.user(this.isSindico() ? 'u-marcia' : 'u-rafael'); },
    user(id) { return this.s.users.find((u) => u.id === id); },
    supplier(id) { return this.s.suppliers.find((x) => x.id === id); },
    equipment(id) { return this.s.equipment.find((x) => x.id === id); },
    plan(id) { return this.s.plans.find((x) => x.id === id); },
    ticket(id) { return this.s.tickets.find((x) => x.id === id); },
    doc(id) { return this.s.documents.find((x) => x.id === id); },
    notice(id) { return this.s.notices.find((x) => x.id === id); },
    expense(id) { return this.s.expenses.find((x) => x.id === id); },
    cat(id) { return K.TICKET_CATS.find((c) => c.id === id) || K.TICKET_CATS[K.TICKET_CATS.length - 1]; },
    freq(id) { return K.FREQS.find((f) => f.id === id) || K.FREQS[2]; },
    freqDays(id) {
      const f = this.freq(id);
      return f.days || Math.round(f.months * 30.4);
    },

    supplierName(id) {
      if (!id) return 'Equipe interna';
      const s = this.supplier(id);
      return s ? s.name : 'Fornecedor removido';
    },

    userLabel(id) {
      const u = this.user(id);
      if (!u) return 'Morador';
      if (u.role === 'sindico') return `${u.name} (síndica)`;
      if (u.role === 'zelador') return `${u.name} (zelador)`;
      return `${u.name}, ${u.unit}`;
    },

    planStatus(p) {
      const d = CO.daysFromToday(p.nextDue);
      const soon = Math.min(15, Math.max(3, Math.round(this.freqDays(p.freq) * 0.25)));
      const sched = p.scheduledAt && CO.daysFromToday(p.scheduledAt) >= 0 ? p.scheduledAt : null;
      if (d < 0) {
        return sched
          ? { key: 'late', tone: 'warn', label: 'Atrasada, já agendada', icon: 'calendar-check', days: d, sched }
          : { key: 'late', tone: 'crit', label: `Atrasada há ${CO.plural(-d, 'dia', 'dias')}`, icon: 'warning-circle', days: d };
      }
      if (d <= soon) return { key: 'soon', tone: 'warn', label: d === 0 ? 'Vence hoje' : `Vence ${CO.relDay(p.nextDue)}`, icon: 'clock', days: d, sched };
      return { key: 'ok', tone: 'ok', label: 'Em dia', icon: 'check-circle', days: d, sched };
    },

    docStatus(doc) {
      if (!doc.expiresAt) return { key: 'none', tone: 'neutral', label: 'Sem validade', icon: 'file-text' };
      const d = CO.daysFromToday(doc.expiresAt);
      if (d < 0) return { key: 'expired', tone: 'crit', label: `Vencido há ${CO.plural(-d, 'dia', 'dias')}`, icon: 'warning-circle', days: d };
      if (d <= 60) return { key: 'soon', tone: 'warn', label: d === 0 ? 'Vence hoje' : `Vence ${CO.relDay(doc.expiresAt)}`, icon: 'clock', days: d };
      return { key: 'ok', tone: 'ok', label: 'Válido', icon: 'seal-check', days: d };
    },

    contractStatus(s) {
      if (!s.contract) return null;
      const d = CO.daysFromToday(s.contract.end);
      if (d < 0) return { tone: 'crit', label: 'Contrato vencido' };
      if (d <= 45) return { tone: 'warn', label: `Contrato vence ${CO.relDay(s.contract.end)}` };
      return { tone: 'ok', label: `Contrato até ${CO.date(s.contract.end, { year: true })}` };
    },

    lastPublicUpdate(t) {
      const pub = t.updates.filter((u) => u.visibility === 'public');
      return pub[pub.length - 1];
    },

    isOpen(t) { return t.status !== 'resolvido'; },

    /** Chamados que o morador acompanha: os que abriu e os que apoiou. */
    myTickets() {
      const me = this.me().id;
      return this.s.tickets.filter((t) => t.createdBy === me || t.supporters.includes(me));
    },

    /** Chamados de áreas comuns visíveis para todos os moradores. */
    buildingTickets() {
      return this.s.tickets.filter((t) => t.location.type === 'common');
    },

    canSee(t) {
      if (this.isSindico()) return true;
      const me = this.me().id;
      return t.location.type === 'common' || t.createdBy === me;
    },

    /** Chamados abertos parecidos: mesma área comum, ou mesmo sistema do prédio. */
    similarOpen(category, area) {
      const shared = ['elevador', 'portao', 'seguranca'];
      return this.s.tickets.filter(
        (t) => this.isOpen(t) && t.location.type === 'common' && (t.location.area === area || (shared.includes(category) && t.category === category))
      );
    },

    plansSorted() {
      return [...this.s.plans].sort((a, b) => a.nextDue.localeCompare(b.nextDue));
    },

    plansFor(equipmentId) {
      return this.s.plans.filter((p) => p.equipmentIds.includes(equipmentId));
    },

    lastDone(p) {
      const ex = [...p.executions].sort((a, b) => b.date.localeCompare(a.date))[0];
      return ex ? ex.date : null;
    },

    allExecutions() {
      const out = [];
      for (const p of this.s.plans) for (const e of p.executions) out.push({ ...e, plan: p });
      return out.sort((a, b) => b.date.localeCompare(a.date));
    },

    expensesBetween(from, to) {
      return this.s.expenses.filter((e) => e.date >= from && e.date <= to);
    },

    /** Totais mensais dos últimos n meses, do mais antigo ao atual. */
    monthTotals(n) {
      const t = CO.today();
      const out = [];
      for (let i = n - 1; i >= 0; i--) {
        const m = new Date(t.getFullYear(), t.getMonth() - i, 1);
        const key = CO.monthKey(CO.iso(m));
        const list = this.s.expenses.filter((e) => e.date.startsWith(key));
        const paid = list.filter((e) => e.status === 'pago').reduce((a, e) => a + e.amount, 0);
        const planned = list.filter((e) => e.status !== 'pago').reduce((a, e) => a + e.amount, 0);
        out.push({ key, paid, planned, total: paid + planned, partial: i === 0, list });
      }
      return out;
    },

    periodRange(months) {
      const t = CO.today();
      const from = new Date(t.getFullYear(), t.getMonth() - (months - 1), 1);
      const to = new Date(t.getFullYear(), t.getMonth() + 1, 0);
      return { from: CO.iso(from), to: CO.iso(to) };
    },

    supplierSpend(id, days = 365) {
      const from = CO.iso(CO.addDays(CO.today(), -days));
      return this.s.expenses.filter((e) => e.supplierId === id && e.date >= from).reduce((a, e) => a + e.amount, 0);
    },

    supplierHistory(id) {
      const items = [];
      for (const e of this.s.expenses) if (e.supplierId === id) items.push({ kind: 'expense', date: e.date, title: e.description, amount: e.amount, status: e.status, ref: e });
      for (const p of this.s.plans) for (const x of p.executions) if (x.supplierId === id && !x.expenseId) items.push({ kind: 'execution', date: x.date, title: p.title, amount: 0, ref: p });
      for (const t of this.s.tickets) if (t.supplierId === id) items.push({ kind: 'ticket', date: t.createdAt.slice(0, 10), title: t.title, ref: t });
      return items.sort((a, b) => b.date.localeCompare(a.date));
    },

    /** O que pede ação do síndico agora, do mais grave ao menos grave. */
    attention() {
      const items = [];
      for (const d of this.s.documents) {
        const st = this.docStatus(d);
        if (st.key === 'expired') items.push({ tone: 'crit', icon: 'file-text', title: `${d.title} vencido`, meta: `Venceu ${CO.relDay(d.expiresAt)}`, act: 'open-doc', id: d.id, cta: 'Renovar', sort: st.days });
        else if (st.key === 'soon') items.push({ tone: 'warn', icon: 'file-text', title: d.title, meta: st.label, act: 'open-doc', id: d.id, cta: 'Ver', sort: 100 + st.days });
      }
      for (const p of this.s.plans) {
        const st = this.planStatus(p);
        if (st.key !== 'late') continue;
        if (st.sched) items.push({ tone: 'warn', icon: 'calendar-check', title: p.title, meta: `Atrasada, agendada para ${CO.weekdayShort(st.sched)}, ${CO.date(st.sched)} às ${CO.time(st.sched)}`, act: 'open-plan', id: p.id, cta: 'Ver', sort: 50 + st.days });
        else items.push({ tone: 'crit', icon: 'wrench', title: p.title, meta: `Manutenção atrasada há ${CO.plural(-st.days, 'dia', 'dias')}`, act: 'open-plan', id: p.id, cta: 'Registrar', sort: st.days });
      }
      for (const t of this.s.tickets) {
        if (!this.isOpen(t)) continue;
        const last = this.lastPublicUpdate(t);
        const quiet = -CO.daysFromToday(last.at);
        if (t.urgency === 'alta' && quiet >= 3) {
          items.push({ tone: 'crit', icon: 'chat-circle-text', title: t.title, meta: `Urgente, sem retorno aos moradores há ${quiet} dias`, act: 'open-ticket', id: t.id, cta: 'Atualizar', sort: -quiet });
        } else if (t.status === 'aberto' && quiet >= 5) {
          items.push({ tone: 'warn', icon: 'chat-circle-text', title: t.title, meta: `Sem resposta há ${quiet} dias`, act: 'open-ticket', id: t.id, cta: 'Responder', sort: 40 - quiet });
        }
      }
      for (const e of this.s.equipment) {
        if (e.status === 'parado') items.push({ tone: 'crit', icon: 'warning-circle', title: `${e.name} parado`, meta: e.location, act: 'open-equip', id: e.id, cta: 'Ver', sort: -50 });
      }
      const rank = { crit: 0, warn: 1 };
      return items.sort((a, b) => rank[a.tone] - rank[b.tone] || a.sort - b.sort);
    },

    counts() {
      const s = this.s;
      const open = s.tickets.filter((t) => this.isOpen(t));
      return {
        openTickets: open.length,
        urgentTickets: open.filter((t) => t.urgency === 'alta').length,
        latePlans: s.plans.filter((p) => this.planStatus(p).key === 'late').length,
        docsAction: s.documents.filter((d) => ['expired', 'soon'].includes(this.docStatus(d).key)).length,
        docsExpired: s.documents.filter((d) => this.docStatus(d).key === 'expired').length,
      };
    },

    /* ---------- Ações: chamados ---------- */

    addTicket(d) {
      this.checkpoint();
      const id = `CH-${String(this.s.nextTicket++).padStart(4, '0')}`;
      const now = CO.isoTime(new Date());
      const me = this.me().id;
      this.s.tickets.unshift({
        id,
        title: d.title,
        category: d.category,
        location: d.location,
        urgency: d.urgency,
        status: 'aberto',
        createdAt: now,
        createdBy: d.createdBy || me,
        supporters: [],
        supplierId: null,
        equipmentId: d.equipmentId || null,
        photo: d.photo || null,
        description: d.description,
        updates: [{ id: CO.uid('u'), at: now, by: me, kind: 'created', text: 'Chamado aberto', visibility: 'public' }],
        quotes: [],
        feedback: null,
        resolvedAt: null,
      });
      this.commit();
      return id;
    },

    toggleSupport(id) {
      const t = this.ticket(id);
      const me = this.me().id;
      this.checkpoint();
      const i = t.supporters.indexOf(me);
      if (i >= 0) t.supporters.splice(i, 1);
      else t.supporters.push(me);
      this.commit();
      return i < 0;
    },

    setTicketStatus(id, status, note) {
      const t = this.ticket(id);
      if (t.status === status) return;
      this.checkpoint();
      const now = CO.isoTime(new Date());
      t.status = status;
      t.resolvedAt = status === 'resolvido' ? now : null;
      if (status !== 'resolvido') t.feedback = null;
      const text = note || `Status alterado para ${K.TICKET_STATUS[status].label.toLowerCase()}.`;
      t.updates.push({ id: CO.uid('u'), at: now, by: this.me().id, kind: 'status', status, text, visibility: 'public' });
      this.commit();
    },

    /** Fecha o chamado com o que foi feito e leva o custo para Custos. */
    resolveTicket(id, { note, cost }) {
      const t = this.ticket(id);
      this.checkpoint();
      const now = CO.isoTime(new Date());
      t.status = 'resolvido';
      t.resolvedAt = now;
      t.feedback = null;
      t.updates.push({ id: CO.uid('u'), at: now, by: this.me().id, kind: 'status', status: 'resolvido', text: note, visibility: 'public' });
      const planned = this.s.expenses.find((e) => e.source && e.source.type === 'ticket' && e.source.id === id && e.status === 'previsto');
      if (planned) {
        planned.status = 'pago';
        planned.date = CO.iso(CO.today());
        if (cost > 0) planned.amount = cost;
      } else if (cost > 0) {
        this.s.expenses.push({ id: CO.uid('x'), date: CO.iso(CO.today()), description: t.title, category: 'corretiva', amount: cost, supplierId: t.supplierId, source: { type: 'ticket', id }, status: 'pago' });
      }
      this.commit();
    },

    /** Média de horas entre a abertura e a primeira resposta da síndica. */
    avgFirstResponse() {
      const hours = [];
      for (const t of this.s.tickets) {
        const first = t.updates.find((u) => u.kind !== 'created' && u.by !== t.createdBy && u.visibility === 'public');
        if (first) hours.push((CO.parse(first.at) - CO.parse(t.createdAt)) / 3600000);
      }
      return hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;
    },

    setTicketField(id, field, value) {
      const t = this.ticket(id);
      if (t[field] === value) return;
      this.checkpoint();
      t[field] = value || null;
      if (field === 'supplierId' && value) {
        t.updates.push({ id: CO.uid('u'), at: CO.isoTime(new Date()), by: this.me().id, kind: 'comment', text: `Fornecedor definido: ${this.supplierName(value)}.`, visibility: 'internal' });
      }
      this.commit();
    },

    addTicketUpdate(id, text, visibility) {
      const t = this.ticket(id);
      this.checkpoint();
      t.updates.push({ id: CO.uid('u'), at: CO.isoTime(new Date()), by: this.me().id, kind: 'comment', text, visibility });
      this.commit();
    },

    addQuote(id, q) {
      const t = this.ticket(id);
      this.checkpoint();
      t.quotes.push({ id: CO.uid('q'), status: 'pendente', ...q });
      this.commit();
    },

    approveQuote(ticketId, quoteId) {
      const t = this.ticket(ticketId);
      const q = t.quotes.find((x) => x.id === quoteId);
      this.checkpoint();
      t.quotes.forEach((x) => { x.status = x.id === quoteId ? 'aprovado' : x.status === 'aprovado' ? 'pendente' : x.status; });
      t.supplierId = q.supplierId;
      this.s.expenses = this.s.expenses.filter((e) => !(e.source && e.source.type === 'ticket' && e.source.id === ticketId && e.status === 'previsto'));
      this.s.expenses.push({ id: CO.uid('x'), date: CO.iso(CO.today()), description: `${t.title} (orçamento aprovado)`, category: 'corretiva', amount: q.amount, supplierId: q.supplierId, source: { type: 'ticket', id: ticketId }, status: 'previsto' });
      t.updates.push({ id: CO.uid('u'), at: CO.isoTime(new Date()), by: this.me().id, kind: 'comment', text: `Orçamento aprovado: ${this.supplierName(q.supplierId)}, ${CO.money(q.amount)}, prazo de ${CO.plural(q.days, 'dia', 'dias')}.`, visibility: 'public' });
      this.commit();
    },

    ticketFeedback(id, ok) {
      const t = this.ticket(id);
      this.checkpoint();
      const now = CO.isoTime(new Date());
      if (ok) {
        t.feedback = { ok: true, at: now };
        t.updates.push({ id: CO.uid('u'), at: now, by: this.me().id, kind: 'comment', text: 'Morador confirmou que o problema foi resolvido.', visibility: 'public' });
      } else {
        t.feedback = null;
        t.status = 'aberto';
        t.resolvedAt = null;
        t.updates.push({ id: CO.uid('u'), at: now, by: this.me().id, kind: 'status', status: 'aberto', text: 'Morador informou que o problema continua. Chamado reaberto.', visibility: 'public' });
      }
      this.commit();
    },

    /* ---------- Ações: manutenção ---------- */

    nextFrom(dateIso, freqId) {
      const f = this.freq(freqId);
      const d = CO.parse(dateIso);
      return CO.iso(f.days ? CO.addDays(d, f.days) : CO.addMonths(d, f.months));
    },

    addPlan(d) {
      this.checkpoint();
      const id = CO.uid('p');
      this.s.plans.push({ id, title: d.title, equipmentIds: d.equipmentId ? [d.equipmentId] : [], freq: d.freq, nextDue: d.nextDue, scheduledAt: null, supplierId: d.supplierId || null, estCost: d.estCost || 0, covered: false, affectsResidents: !!d.affectsResidents, impact: d.impact || '', notes: d.notes || '', executions: [] });
      this.commit();
      return id;
    },

    registerExecution(planId, d) {
      const p = this.plan(planId);
      this.checkpoint();
      let expenseId = null;
      if (d.cost > 0 && d.toExpense) {
        expenseId = CO.uid('x');
        this.s.expenses.push({ id: expenseId, date: d.date, description: p.title, category: 'preventiva', amount: d.cost, supplierId: d.supplierId || null, source: { type: 'plan', id: p.id }, status: 'pago' });
      }
      p.executions.push({ id: CO.uid('ex'), date: d.date, cost: d.cost || 0, supplierId: d.supplierId || null, note: d.note || '', fileName: d.fileName || '', expenseId });
      const last = this.lastDone(p);
      p.nextDue = this.nextFrom(last, p.freq);
      p.scheduledAt = null;
      this.commit();
      return p.nextDue;
    },

    schedulePlan(planId, at) {
      const p = this.plan(planId);
      this.checkpoint();
      p.scheduledAt = at;
      this.commit();
    },

    /* ---------- Ações: cadastros ---------- */

    addEquipment(d) {
      this.checkpoint();
      const id = CO.uid('e');
      this.s.equipment.push({ id, status: 'operando', notes: '', warrantyUntil: null, ...d });
      this.commit();
      return id;
    },

    setEquipmentStatus(id, status) {
      const e = this.equipment(id);
      if (e.status === status) return;
      this.checkpoint();
      e.status = status;
      this.commit();
    },

    addSupplier(d) {
      this.checkpoint();
      const id = CO.uid('s');
      this.s.suppliers.push({ id, contract: null, rating: null, notes: '', ...d });
      this.commit();
      return id;
    },

    rateSupplier(id, n) {
      const s = this.supplier(id);
      this.checkpoint();
      s.rating = n;
      this.commit();
    },

    addDocument(d) {
      this.checkpoint();
      const id = CO.uid('d');
      this.s.documents.push({ id, equipmentId: null, supplierId: null, notes: '', size: '', ...d });
      this.commit();
      return id;
    },

    renewDocument(id, d) {
      const doc = this.doc(id);
      this.checkpoint();
      doc.issuedAt = d.issuedAt;
      doc.expiresAt = d.expiresAt || null;
      if (d.fileName) { doc.fileName = d.fileName; doc.size = d.size || doc.size; }
      this.commit();
    },

    setDocVisibility(id, v) {
      const doc = this.doc(id);
      if (doc.visibility === v) return;
      this.checkpoint();
      doc.visibility = v;
      this.commit();
    },

    addExpense(d) {
      this.checkpoint();
      this.s.expenses.push({ id: CO.uid('x'), source: null, supplierId: null, ...d });
      this.commit();
    },

    markExpensePaid(id) {
      const e = this.expense(id);
      this.checkpoint();
      e.status = 'pago';
      this.commit();
    },

    addNotice(d) {
      this.checkpoint();
      this.s.notices.unshift({ id: CO.uid('n'), createdAt: CO.isoTime(new Date()), readBy: [], planId: null, place: '', ...d });
      this.commit();
    },

    ackNotice(id) {
      const n = this.notice(id);
      const unit = this.me().unit;
      if (n.readBy.includes(unit)) return;
      this.checkpoint();
      n.readBy.push(unit);
      this.commit();
    },

    setRole(role) {
      this.s.session.role = role;
      this.save();
    },
  });
})(window.CO);
