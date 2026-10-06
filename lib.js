import AsyncStorage from '@react-native-async-storage/async-storage';

export const SB = 'https://fyxksvydxwvygjebanno.supabase.co';
export const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eGtzdnlkeHd2eWdqZWJhbm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzE5MDMsImV4cCI6MjEwNjcwNzkwM30.qUHr5gl00vF2JG7YaostqpOqhEMSEPSci1ySH1D-Fik';
export const REDIRECT = 'vamos://auth';
export const SITE = 'https://vamos-ja.pages.dev/';
export const T_TRIPS = 'vamos_trips', T_ROWS = 'vamos_rows';
export const CATS = { hosp: 'Hospedagem', alim: 'Alimentação', transp: 'Transporte', outros: 'Outros' };
export const KINDS = { carro: 'Carro', onibus: 'Ônibus', aviao: 'Avião', outro: 'Outro' };
export const MEALS = [['cafe', 'Café'], ['almoco', 'Almoço'], ['lanche', 'Lanche'], ['jantar', 'Jantar']];

export const lsGet = async (k, d) => { try { const v = await AsyncStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
export const lsSet = async (k, v) => { try { await AsyncStorage.setItem(k, v); } catch (e) {} };

export const brl = n => 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const num = v => { const s = String(v || '').trim(); if (!s) return 0; const n = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s); return isFinite(n) ? n : 0; };
export const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const dayLabel = s => { const d = new Date(s + 'T12:00:00'); return isNaN(d) ? '' : WD[d.getDay()] + ', ' + String(d.getDate()).padStart(2, '0') + ' ' + MO[d.getMonth()]; };
export const when = s => { if (!s) return ''; if (/^\d{4}-\d\d-\d\d$/.test(s)) return dayLabel(s); const d = new Date(s); if (isNaN(d)) return ''; return dayLabel(s.slice(0, 10)) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
export const isoToBr = s => /^\d{4}-\d\d-\d\d$/.test(s || '') ? s.slice(8) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '';
export const maskDate = t => { const d = String(t).replace(/\D/g, '').slice(0, 8); return d.length > 4 ? d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4) : d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };
export const brToIso = t => { const m = String(t).match(/^(\d\d)\/(\d\d)\/(\d{4})$/); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; };
export const maskTime = t => { const d = String(t).replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + ':' + d.slice(2) : d; };
export const maskMoney = v => { const n = num(v); return n ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; };

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const genCode = () => { let s = ''; for (let i = 0; i < 10; i++) s += ALPHA[Math.floor(Math.random() * 32)]; return s; };
export const fmtCode = c => c ? c.slice(0, 5) + '-' + c.slice(5) : '';
export const parseCode = s => { const m = String(s || '').match(/[?&]g=([A-Za-z0-9-]+)/); const raw = (m ? m[1] : String(s || '')).toUpperCase().replace(/[^A-Z2-9]/g, ''); return raw.length === 10 ? raw : null; };

const jwt = t => { try { return JSON.parse(global.atob ? global.atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')) : Buffer.from(t.split('.')[1], 'base64').toString()); } catch (e) { return {}; } };
export const authFrom = (at, rt) => { const c = jwt(at), md = c.user_metadata || {}; return { access_token: at, refresh_token: rt, expires_at: c.exp || 0, id: c.sub, email: c.email, name: md.full_name || md.name || c.email }; };

export const ctx = { auth: null, tripId: '', onAuth: () => {} };
export async function token() {
  const a = ctx.auth; if (!a) return KEY;
  if (a.expires_at - 60 < Date.now() / 1000) {
    try {
      const r = await fetch(SB + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: a.refresh_token }) });
      if (!r.ok) throw 0; const j = await r.json(); const n = authFrom(j.access_token, j.refresh_token); ctx.onAuth(n); return n.access_token;
    } catch (e) { ctx.onAuth(null); return KEY; }
  }
  return a.access_token;
}
export async function api(path, o = {}) {
  const h = { apikey: KEY, Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json', 'x-trip-id': ctx.tripId || '' };
  if (o.prefer) h.Prefer = o.prefer;
  const r = await fetch(SB + '/rest/v1/' + path, { method: o.method || 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined });
  if (!r.ok) { const e = new Error('http ' + r.status); e.status = r.status; throw e; }
  if (r.status === 204) return null;
  try { return await r.json(); } catch (e) { return null; }
}
export async function authReq(path, body, method = 'POST', bearer) {
  const r = await fetch(SB + '/auth/v1/' + path, { method, headers: { apikey: KEY, 'Content-Type': 'application/json', ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}) }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch (e) {}
  return { ok: r.ok, status: r.status, j };
}

export const emptyS = () => ({ trip: {}, owner: null, people: [], items: [], stays: [], menu: [], expenses: [], rides: [], here: [], admins: [], avatars: [], needs: [], notices: [], polls: [], popts: [], pvotes: [], shop: [] });

export function buildS(sn) {
  const S = emptyS();
  const P = id => S.people.find(p => p.id === id);
  const by = k => sn.rows.filter(r => r.kind === k).map(r => ({ ...r.data, id: r.id, key: r.key, at: Date.parse(r.created_at) }));
  S.trip = { ...sn.trip }; S.owner = sn.owner || null;
  S.people = by('person'); S.items = by('item'); S.stays = by('stay'); S.menu = by('menu'); S.expenses = by('expense'); S.rides = by('ride');
  S.here = by('here').filter(h => P(h.person)); S.notices = by('notice'); S.admins = by('admin'); S.avatars = by('avatar');
  S.needs = by('need').filter(n => P(n.person)); S.polls = by('poll'); S.popts = by('popt'); S.pvotes = by('pvote').filter(v => P(v.person)); S.shop = by('shop');
  S.stays.forEach(x => { x.votes = {}; }); S.rides.forEach(x => { x.pax = []; });
  by('vote').forEach(v => { const x = S.stays.find(s => s.id === v.stay); if (x && P(v.person)) x.votes[v.person] = true; });
  by('join').forEach(v => { const x = S.rides.find(s => s.id === v.ride); if (x && P(v.person) && ['motorista', 'passageiro'].includes((P(v.person) || {}).role) && !x.pax.includes(v.person)) x.pax.push(v.person); });
  return S;
}

export const strip = o => { const { id, at, key, votes, pax, ...d } = o; return d; };
export const votesOf = s => Object.keys(s.votes || {}).length;
export const stayLinks = s => { const l = Array.isArray(s.links) ? [...s.links] : []; if (s.link) l.push(s.link); return [...new Set(l)].filter(u => /^https?:\/\//i.test(u)); };

export function days(S) { const a = S.trip.start, b = S.trip.end; if (!a) return []; const out = []; let d = new Date(a + 'T12:00:00'); const e = new Date((b || a) + 'T12:00:00'); let g = 0; while (d <= e && g++ < 60) { out.push(iso(d)); d.setDate(d.getDate() + 1); } return out; }
export const chosenStay = S => S.stays.find(s => s.booked) || [...S.stays].filter(s => votesOf(s) > 0).sort((a, b) => votesOf(b) - votesOf(a))[0] || null;

export function entries(S) {
  const P = id => S.people.find(p => p.id === id);
  const all = S.people.map(p => p.id), E = [];
  const ex = (src, cat, amount, paidBy, split, id, auto) => { if (amount > 0) E.push({ src, cat, amount, paidBy: P(paidBy) ? paidBy : '', split: (split && split.length ? split : all).filter(P), id, auto }); };
  const st = chosenStay(S); if (st) ex(st.name, 'hosp', st.price, st.paidBy, all, null, 'Hospedagem ' + (st.booked ? 'escolhida' : 'mais votada'));
  S.menu.forEach(m => ex(m.dish, 'alim', m.cost, m.who, all, null, 'Cardápio · ' + (m.date ? dayLabel(m.date) : '')));
  S.items.forEach(i => ex(i.name, i.cat || 'alim', i.cost, i.who, all, null, 'Item do grupo'));
  S.rides.forEach(r => {
    const cost = (r.cost > 0 ? r.cost : 0) || ((r.fuel || 0) + (r.toll || 0)); if (!(cost > 0)) return;
    const occ = [...new Set([...(r.pax || []), ...(P(r.driverId) ? [r.driverId] : [])])];
    if (r.costMode === 'pessoa') { if (occ.length) ex(r.title, 'transp', cost * occ.length, '', occ, null, 'Transporte · valor por pessoa'); }
    else ex(r.title, 'transp', cost, r.driverId, occ.length ? occ : all, null, 'Transporte · custo do veículo');
  });
  S.expenses.forEach(e => ex(e.desc, e.cat || 'outros', e.amount, e.paidBy, e.split, e.id, ''));
  return E;
}
export function costs(S) {
  const E = entries(S), shares = {}, bal = {}, byCat = { hosp: 0, alim: 0, transp: 0, outros: 0 }; let total = 0, unpaid = 0;
  S.people.forEach(p => { shares[p.id] = { total: 0, cat: { hosp: 0, alim: 0, transp: 0, outros: 0 } }; bal[p.id] = 0; });
  E.forEach(e => {
    if (!e.split.length) return;
    const sh = e.amount / e.split.length; total += e.amount; byCat[e.cat] = (byCat[e.cat] || 0) + e.amount;
    e.split.forEach(i => { shares[i].total += sh; shares[i].cat[e.cat] = (shares[i].cat[e.cat] || 0) + sh; if (e.paidBy) bal[i] -= sh; });
    if (e.paidBy) bal[e.paidBy] += e.amount; else unpaid += e.amount;
  });
  const n = S.people.length; return { E, shares, bal, byCat, total, unpaid, avg: n ? total / n : 0 };
}
export function settle(bal) {
  const cr = [], de = [];
  for (const id in bal) { const v = Math.round(bal[id] * 100) / 100; if (v > 0.01) cr.push([id, v]); else if (v < -0.01) de.push([id, -v]); }
  cr.sort((a, b) => b[1] - a[1]); de.sort((a, b) => b[1] - a[1]);
  const out = []; let i = 0, j = 0;
  while (i < de.length && j < cr.length) { const x = Math.min(de[i][1], cr[j][1]); out.push({ from: de[i][0], to: cr[j][0], v: x }); de[i][1] -= x; cr[j][1] -= x; if (de[i][1] < 0.01) i++; if (cr[j][1] < 0.01) j++; }
  return out;
}
