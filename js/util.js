/* Utilitários: datas, dinheiro, escape de HTML. */
'use strict';

window.CO = window.CO || {};

(function (CO) {
  const DAY = 86400000;
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  CO.MONTHS = MONTHS;
  CO.MONTHS_LONG = MONTHS_LONG;

  CO.esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  CO.today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const z = (n) => String(n).padStart(2, '0');

  /** Data local no formato AAAA-MM-DD. */
  CO.iso = (d) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;

  /** Data e hora local no formato AAAA-MM-DDTHH:MM. */
  CO.isoTime = (d) => `${CO.iso(d)}T${z(d.getHours())}:${z(d.getMinutes())}`;

  CO.parse = (s) => {
    if (!s) return null;
    if (s instanceof Date) return new Date(s);
    if (s.length === 10) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const [date, time] = s.split('T');
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = (time || '00:00').split(':').map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0);
  };

  CO.addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  CO.addMonths = (d, n) => {
    const x = new Date(d);
    const day = x.getDate();
    x.setDate(1);
    x.setMonth(x.getMonth() + n);
    const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(day, last));
    return x;
  };

  /** Dias inteiros entre hoje e a data (negativo = passado). */
  CO.daysFromToday = (s) => {
    const d = CO.parse(s);
    d.setHours(0, 0, 0, 0);
    return Math.round((d - CO.today()) / DAY);
  };

  CO.relDay = (s) => {
    const n = CO.daysFromToday(s);
    if (n === 0) return 'hoje';
    if (n === 1) return 'amanhã';
    if (n === -1) return 'ontem';
    return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
  };

  /** Tempo decorrido para datas com hora: "há 3 h", "há 2 dias". */
  CO.ago = (s) => {
    const d = CO.parse(s);
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const h = Math.round(mins / 60);
    if (h < 24 && CO.daysFromToday(s) === 0) return `há ${h} h`;
    const days = -CO.daysFromToday(s);
    if (days <= 1) return 'ontem';
    if (days < 30) return `há ${days} dias`;
    return CO.date(s);
  };

  /** 22 out | 22 out 2025 (quando o ano difere do atual). */
  CO.date = (s, { year } = {}) => {
    const d = CO.parse(s);
    const showYear = year ?? d.getFullYear() !== new Date().getFullYear();
    return `${d.getDate()} ${MONTHS[d.getMonth()]}${showYear ? ' ' + d.getFullYear() : ''}`;
  };

  CO.dateNum = (s) => {
    const d = CO.parse(s);
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  CO.dateLong = (s) => {
    const d = CO.parse(s);
    return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`;
  };

  CO.weekdayLong = (s) => {
    const d = CO.parse(s);
    const w = WEEKDAYS[d.getDay()];
    return `${w.charAt(0).toUpperCase() + w.slice(1)}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
  };

  CO.weekdayShort = (s) => WEEKDAYS_SHORT[CO.parse(s).getDay()];

  CO.time = (s) => {
    const d = CO.parse(s);
    return d.getMinutes() ? `${d.getHours()}h${z(d.getMinutes())}` : `${d.getHours()}h`;
  };

  CO.monthKey = (s) => {
    const d = CO.parse(s);
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}`;
  };

  CO.monthLabel = (key, long) => {
    const [y, m] = key.split('-').map(Number);
    return long ? `${MONTHS_LONG[m - 1]} de ${y}` : `${MONTHS[m - 1]}`;
  };

  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const BRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const NUM1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

  CO.money = (n) => BRL.format(n || 0).replace(/ /g, ' ');
  CO.money0 = (n) => BRL0.format(Math.round(n || 0)).replace(/ /g, ' ');
  CO.moneyShort = (n) => (Math.abs(n) >= 1000 ? `R$ ${NUM1.format(n / 1000)} mil` : CO.money0(n));
  CO.pct = (n) => `${Math.round(n * 100)}%`;
  CO.num1 = (n) => NUM1.format(n);

  /** Aceita "1.350,50", "1350,5", "1350.5" ou "R$ 1.350". */
  CO.parseMoney = (s) => {
    if (s == null) return NaN;
    let t = String(s).replace(/[R$\s]/g, '');
    if (!t) return NaN;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
    else if (/^\d{1,3}\.\d{3}$/.test(t)) t = t.replace('.', '');
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  };

  CO.initials = (name) =>
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .filter((w, i, arr) => i === 0 || i === arr.length - 1)
      .map((w) => w[0].toUpperCase())
      .join('');

  CO.plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  CO.uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  CO.$ = (sel, root = document) => root.querySelector(sel);
  CO.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  CO.normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

  CO.reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})(window.CO);
