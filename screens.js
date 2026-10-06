import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Image, Alert } from 'react-native';
import { Card, H, T, Row, Btn, Inp, Pill, Bar, KV, Empty, Pick } from './ui';
import { brl, num, dayLabel, when, days, costs, settle, votesOf, stayLinks, CATS, KINDS, MEALS, maskMoney, maskDate, brToIso, isoToBr, maskTime, fmtCode, SITE } from './lib';

const catOpts = Object.entries(CATS);
const confirmDel = (what, fn) => Alert.alert('Apagar', 'Apagar ' + what + '?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: fn }]);
const P = (g, id) => g.S.people.find(p => p.id === id);
const nm = (g, id) => (P(g, id) ? P(g, id).name : '(removido)');
const Money = ({ c, label, value, set }) => <Inp c={c} label={label} value={value} onChangeText={t => { const d = String(t).replace(/\D/g, '').replace(/^0+/, ''); set(d ? (parseInt(d.slice(0, 11), 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''); }} kb="numeric" placeholder="0,00" />;
const PersonPick = ({ g, label, value, onChange, blank }) => <Pick c={g.c} label={label} value={value} onChange={onChange} options={[['', blank || 'Ninguém'], ...g.S.people.map(p => [p.id, p.name])]} />;
const Del = ({ g, what, id }) => <TouchableOpacity onPress={() => confirmDel(what, () => g.del(id))}><Text style={{ color: g.c.bad, fontSize: 13, fontWeight: '600' }}>Apagar</Text></TouchableOpacity>;
const DateIn = ({ c, label, value, set }) => { const [t, setT] = useState(isoToBr(value)); return <Inp c={c} label={label} value={t} placeholder="dd/mm/aaaa" kb="numeric" onChangeText={x => { const m = maskDate(x); setT(m); set(brToIso(m)); }} />; };

/* ---------- Início ---------- */
export function Avisos({ g }) {
  const { c, S } = g; const [txt, setTxt] = useState(''); const [pin, setPin] = useState(false);
  const L = [...S.notices].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.at - a.at);
  return (
    <Card c={c}>
      <H c={c}>Comunicados</H>
      <Inp c={c} value={txt} onChangeText={setTxt} placeholder="Ex.: Saída sábado às 7h, levem documento." multiline maxLength={600} />
      <Row><Btn c={c} small ghost={!pin} label={pin ? 'Fixado no topo' : 'Fixar no topo'} onPress={() => setPin(!pin)} /><View style={{ flex: 1 }} /><Btn c={c} small label="Publicar" onPress={() => { if (!txt.trim()) return; g.add('notice', { text: txt.trim(), pin, by: g.me ? nm(g, g.me) : '', byId: g.me || '' }); setTxt(''); setPin(false); }} /></Row>
      {L.length ? L.map(n => <View key={n.id} style={{ gap: 2, borderTopWidth: 1, borderColor: c.line, paddingTop: 8 }}><T c={c}>{n.pin ? '📌 ' : ''}{n.text}</T><Row><T c={c} small muted>{n.by ? n.by + ' · ' : ''}{new Date(n.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</T><View style={{ flex: 1 }} /><Del g={g} what="o comunicado" id={n.id} /></Row></View>) : <Empty c={c}>Nenhum comunicado ainda.</Empty>}
    </Card>
  );
}
export function Viagem({ g }) {
  const { c, S } = g; const t = S.trip; const mine = g.isOwner || !S.owner;
  const [f, setF] = useState({ name: t.name || '', dest: t.dest || '', start: t.start || '', end: t.end || '', cin: t.cin || '', cout: t.cout || '', budget: t.budget ? maskMoney(t.budget) : '', notes: t.notes || '' });
  const set = k => v => setF(o => ({ ...o, [k]: v }));
  if (!mine) return (
    <Card c={c}><H c={c}>{t.name || 'A viagem'}</H>
      {t.dest ? <KV c={c} k="Destino" v={t.dest} /> : null}
      {t.start ? <KV c={c} k="Datas" v={dayLabel(t.start) + (t.end && t.end !== t.start ? ' a ' + dayLabel(t.end) : '')} /> : <T c={c} small muted>Datas ainda não definidas.</T>}
      {t.cin ? <KV c={c} k="Check-in" v={t.cin} /> : null}{t.cout ? <KV c={c} k="Check-out" v={t.cout} /> : null}
      {t.notes ? <T c={c} small>{t.notes}</T> : null}
      <T c={c} small muted>Somente quem criou o grupo altera estas informações.</T>
    </Card>
  );
  return (
    <Card c={c}><H c={c}>A viagem</H>
      <Inp c={c} label="Nome" value={f.name} onChangeText={set('name')} placeholder="Ex.: Fim de semana na serra" />
      <Inp c={c} label="Destino" value={f.dest} onChangeText={set('dest')} placeholder="Cidade ou endereço" />
      <Row><View style={{ flex: 1 }}><DateIn c={c} label="Chegada" value={f.start} set={set('start')} /></View><View style={{ flex: 1 }}><DateIn c={c} label="Saída" value={f.end} set={set('end')} /></View></Row>
      <Row><View style={{ flex: 1 }}><Inp c={c} label="Check-in" value={f.cin} onChangeText={x => set('cin')(maskTime(x))} placeholder="14:00" kb="numeric" /></View><View style={{ flex: 1 }}><Inp c={c} label="Check-out" value={f.cout} onChangeText={x => set('cout')(maskTime(x))} placeholder="11:00" kb="numeric" /></View></Row>
      <Money c={c} label="Orçamento por pessoa (R$)" value={f.budget} set={set('budget')} />
      <Inp c={c} label="Avisos do grupo" value={f.notes} onChangeText={set('notes')} multiline placeholder="Regras da casa, o que não esquecer…" />
      <Btn c={c} label="Salvar" onPress={() => g.saveTrip({ name: f.name.trim(), dest: f.dest.trim(), start: f.start, end: f.end, cin: f.cin, cout: f.cout, budget: f.budget ? String(num(f.budget)) : '', notes: f.notes.trim() }).then(() => g.toast('Salvo ✓'))} />
    </Card>
  );
}
export function Resumo({ g }) {
  const { c, S } = g; const t = S.trip, n = S.people.length, C = costs(S), bud = num(t.budget);
  let cd = null;
  if (t.start) { const a = new Date(t.start + 'T00:00:00'), now = new Date(); now.setHours(0, 0, 0, 0); const d = Math.round((a - now) / 864e5); const nights = Math.max(days(S).length - 1, 0); cd = d > 0 ? d + (d === 1 ? ' dia' : ' dias') + ' até a viagem' + (nights ? ' · ' + nights + (nights === 1 ? ' noite' : ' noites') : '') : d > -days(S).length ? 'Em viagem. Boa estadia!' : 'Viagem concluída'; }
  const todo = [];
  if (!n) todo.push('Cadastre os participantes na aba Amigos.');
  if (!t.start) todo.push('Defina as datas da estadia.');
  const un = S.items.filter(i => !i.who).length; if (un) todo.push(un + (un === 1 ? ' item sem responsável.' : ' itens sem responsável.'));
  if (!S.stays.length) todo.push('Nenhuma hospedagem cadastrada para votação.'); else if (!S.stays.some(s => s.booked)) todo.push('Hospedagem ainda não escolhida.');
  if (S.rides.length && n) { const inR = new Set(); S.rides.forEach(r => { (r.pax || []).forEach(i => inR.add(i)); if (r.driverId) inR.add(r.driverId); }); const out = S.people.filter(p => !inR.has(p.id) && ['motorista', 'passageiro'].includes(p.role)); if (out.length) todo.push('Sem transporte: ' + out.map(p => p.name).join(', ') + '.'); }
  else if (n && !S.rides.length) todo.push('Nenhum transporte combinado ainda.');
  if (C.unpaid > 0) todo.push(brl(C.unpaid) + ' em custos sem pagador definido.');
  return (
    <View style={{ gap: 12 }}>
      {cd ? <Card c={c}><Text style={{ color: c.accent, fontSize: 20, fontWeight: '800' }}>{cd}</Text></Card> : null}
      <Avisos g={g} />
      <Viagem g={g} key={JSON.stringify([t.name, t.start, t.end, t.dest, t.cin, t.cout, t.budget, t.notes, g.isOwner])} />
      <Card c={c}><H c={c}>Pendências</H>{todo.length ? todo.map((x, i) => <T key={i} c={c}>• {x}</T>) : <T c={c} color={c.good}>Tudo organizado por enquanto.</T>}</Card>
      <Card c={c}><H c={c}>Orçamento calculado</H>
        <T c={c} small muted>Soma automática de hospedagem, cardápio, itens, transporte e gastos, dividida entre os participantes.</T>
        {Object.entries(CATS).map(([k, l]) => <View key={k} style={{ gap: 4 }}><KV c={c} k={l} v={brl(C.byCat[k] || 0)} /><Bar c={c} pct={(C.byCat[k] || 0) / Math.max(1, ...Object.values(C.byCat)) * 100} /></View>)}
        <KV c={c} k="Total do grupo" v={brl(C.total)} /><KV c={c} k={'Média por pessoa (' + n + ')'} v={brl(C.avg)} />
        {bud ? <View style={{ gap: 4 }}><Bar c={c} pct={C.avg / bud * 100} over={C.avg > bud} /><T c={c} small muted>{C.avg > bud ? 'Passou ' + brl(C.avg - bud) + ' do orçamento de ' + brl(bud) + ' por pessoa' : 'Sobram ' + brl(bud - C.avg) + ' do orçamento de ' + brl(bud) + ' por pessoa'}</T></View> : null}
      </Card>
      <Contas g={g} />
    </View>
  );
}
export function Contas({ g }) {
  const { c, S } = g; const C = costs(S), tr = settle(C.bal), bud = num(S.trip.budget);
  const [d, setD] = useState(''), [amt, setAmt] = useState(''), [cat, setCat] = useState('outros'), [by, setBy] = useState(g.me || ''), [sp, setSp] = useState(null);
  const split = sp || S.people.map(p => p.id);
  if (!S.people.length) return <Card c={c}><Empty c={c}>Cadastre os participantes primeiro, na aba Amigos.</Empty></Card>;
  const sorted = [...S.people].sort((a, b) => C.shares[b.id].total - C.shares[a.id].total);
  return (
    <View style={{ gap: 12 }}>
      <Card c={c}><H c={c}>Lançar gasto extra</H>
        <Inp c={c} value={d} onChangeText={setD} placeholder="O que foi? Ex.: Mercado" maxLength={80} />
        <Money c={c} label="Valor (R$)" value={amt} set={setAmt} />
        <Pick c={c} label="Categoria" value={cat} onChange={setCat} options={catOpts} />
        <PersonPick g={g} label="Quem pagou" value={by} onChange={setBy} blank="Ninguém" />
        <Pick c={c} label="Dividir entre" value="" onChange={id => setSp(split.includes(id) ? split.filter(x => x !== id) : [...split, id])} options={S.people.map(p => [p.id, (split.includes(p.id) ? '✓ ' : '') + p.name])} />
        <Btn c={c} label="Lançar" onPress={() => { const a = num(amt); if (!d.trim()) return; if (a <= 0) return g.toast('Informe um valor maior que zero.'); if (!split.length) return g.toast('Escolha pelo menos uma pessoa.'); g.add('expense', { desc: d.trim(), amount: a, cat, paidBy: by, split: split.length === S.people.length ? [] : split }); setD(''); setAmt(''); setSp(null); }} />
      </Card>
      <Card c={c}><H c={c}>Quanto cada um gasta</H>
        {sorted.map(p => { const s = C.shares[p.id]; return <View key={p.id} style={{ gap: 4 }}><KV c={c} k={p.name} v={brl(s.total)} color={bud && s.total > bud ? c.bad : c.ink} /><Row wrap>{Object.entries(CATS).filter(([k]) => s.cat[k] > 0.004).map(([k, l]) => <Pill key={k} c={c} label={l + ' ' + brl(s.cat[k])} />)}</Row></View>; })}
        <KV c={c} k="Total do grupo" v={brl(C.total)} />
      </Card>
      <Card c={c}><H c={c}>Quem paga quem</H>
        {tr.length ? tr.map((t, i) => <KV key={i} c={c} k={nm(g, t.from) + ' paga ' + nm(g, t.to)} v={brl(t.v)} />) : <Empty c={c}>{C.E.length ? 'Todo mundo está quite.' : 'Os acertos aparecem quando houver custos com quem pagou definido.'}</Empty>}
        {C.E.length ? <View style={{ gap: 6 }}><T c={c} bold>Saldo de cada um</T>{S.people.map(p => { const v = C.bal[p.id] || 0; return <KV key={p.id} c={c} k={p.name} v={(v > 0.009 ? '+' : '') + brl(v)} color={v > 0.009 ? c.good : v < -0.009 ? c.bad : c.ink} />; })}</View> : null}
        {C.unpaid > 0 ? <T c={c} small muted>{brl(C.unpaid)} sem pagador definido ficam fora dos acertos, mas contam na cota de cada um.</T> : null}
      </Card>
      <Card c={c}><Row><H c={c}>Lançamentos</H><View style={{ flex: 1 }} /><T c={c} bold>{brl(C.total)}</T></Row>
        {C.E.length ? C.E.map((e, i) => <View key={i} style={{ borderTopWidth: 1, borderColor: c.line, paddingTop: 8, gap: 2 }}><Row><T c={c} bold style={{ flex: 1 }}>{e.src}</T><T c={c} bold>{brl(e.amount)}</T></Row><T c={c} small muted>{e.auto ? e.auto + ' · ' : ''}{CATS[e.cat] || ''} · {e.paidBy ? nm(g, e.paidBy) + ' pagou' : 'sem pagador'} · {e.split.length === S.people.length ? 'todos' : e.split.length + ' pessoas'} · {brl(e.amount / e.split.length)} cada</T>{e.id ? <Del g={g} what="o gasto" id={e.id} /> : <Pill c={c} label="auto" />}</View>) : <Empty c={c}>Nenhum custo ainda.</Empty>}
      </Card>
    </View>
  );
}

/* ---------- Amigos ---------- */
export function Amigos({ g }) {
  const { c, S } = g; const [nome, setNome] = useState(''); const [it, setIt] = useState(''), [who, setWho] = useState(''), [cost, setCost] = useState(''), [cat, setCat] = useState('alim');
  const dayN = id => S.here.filter(h => h.person === id).length;
  const rideOf = id => { if (!['motorista', 'passageiro'].includes((P(g, id) || {}).role)) return ''; const r = S.rides.find(r => r.driverId === id && r.kind === 'carro'); if (r) return 'Motorista · ' + r.title; const j = S.rides.find(r => (r.pax || []).includes(id)); return j ? 'Com carona · ' + j.title : (S.needs.some(n => n.person === id) ? 'Precisa de carona' : ''); };
  const free = S.items.filter(i => !i.who || !P(g, i.who));
  return (
    <View style={{ gap: 12 }}>
      <Card c={c}><H c={c}>Amigos do grupo</H>
        <T c={c} small muted>Quem criou o grupo e os administradores editam as informações. Os demais confirmam presença, votam e combinam carona.</T>
        {S.people.length ? S.people.map(p => <Row key={p.id} style={{ borderTopWidth: 1, borderColor: c.line, paddingTop: 8 }}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{(S.avatars.find(a => a.person === p.id) || {}).photo ? <Image source={{ uri: S.avatars.find(a => a.person === p.id).photo }} style={{ width: 38, height: 38 }} /> : <Text style={{ color: c.onAccent, fontWeight: '800' }}>{p.name.trim().charAt(0).toUpperCase()}</Text>}</View>
          <View style={{ flex: 1 }}><T c={c} bold>{p.name}</T><T c={c} small muted>{dayN(p.id)} {dayN(p.id) === 1 ? 'dia' : 'dias'} marcados{rideOf(p.id) ? ' · ' + rideOf(p.id) : ''}</T></View>
          {g.isOwner ? <Btn c={c} small ghost={!S.admins.some(a => a.person === p.id)} label="Adm" onPress={() => { if (S.admins.some(a => a.person === p.id)) return g.delKey('admin', p.id); if (!p.email) return g.toast('Essa pessoa precisa entrar com e-mail ou Google no app antes de virar Adm.'); g.addOnce('admin', { person: p.id, email: String(p.email).toLowerCase() }, p.id); }} /> : (S.admins.some(a => a.person === p.id) ? <Pill c={c} label="Adm" /> : null)}
          <Del g={g} what={p.name} id={p.id} />
        </Row>) : <Empty c={c}>Ninguém entrou ainda. Compartilhe o código do grupo.</Empty>}
        <Row><View style={{ flex: 1 }}><Inp c={c} value={nome} onChangeText={setNome} placeholder="Adicionar nome" maxLength={40} /></View><Btn c={c} label="Adicionar" onPress={() => { if (nome.trim()) { g.add('person', { name: nome.trim() }); setNome(''); } }} /></Row>
      </Card>
      <Convidar g={g} />
      <Presenca g={g} />
      <Card c={c}><H c={c}>O que cada um leva</H>
        {S.people.length ? <View style={{ gap: 8 }}>
          <Inp c={c} value={it} onChangeText={setIt} placeholder="Ex.: 2 pacotes de carvão" maxLength={80} />
          <PersonPick g={g} label="Quem leva" value={who} onChange={setWho} blank="Ainda sem responsável" />
          <Money c={c} label="Valor, se comprar (R$)" value={cost} set={setCost} />
          <Pick c={c} label="Categoria" value={cat} onChange={setCat} options={catOpts} />
          <Btn c={c} label="Adicionar" onPress={() => { if (!it.trim()) return; g.add('item', { name: it.trim(), who, cost: num(cost), cat }); setIt(''); setCost(''); }} />
        </View> : <Empty c={c}>Cadastre participantes para distribuir os itens.</Empty>}
        {S.people.map(p => { const L = S.items.filter(i => i.who === p.id); return L.length ? <View key={p.id} style={{ gap: 4 }}><T c={c} bold>{p.name}</T>{L.map(i => <Row key={i.id}><View style={{ flex: 1 }}><T c={c}>{i.name}</T>{i.cost > 0 ? <T c={c} small muted>{brl(i.cost)} · {CATS[i.cat] || ''}</T> : null}</View><Del g={g} what={i.name} id={i.id} /></Row>)}</View> : null; })}
        {free.length ? <View style={{ gap: 4 }}><T c={c} bold>Sem responsável</T>{free.map(i => <Row key={i.id}><View style={{ flex: 1 }}><T c={c}>{i.name}</T>{i.cost > 0 ? <T c={c} small muted>{brl(i.cost)}</T> : null}</View>{g.me ? <Btn c={c} small ghost label="Eu levo" onPress={() => g.upd('items', i.id, { who: g.me })} /> : null}<Del g={g} what={i.name} id={i.id} /></Row>)}</View> : null}
        {!S.items.length ? <Empty c={c}>Lista vazia.</Empty> : null}
      </Card>
    </View>
  );
}
export function Convidar({ g }) {
  const { c } = g; const link = SITE + '?g=' + g.tripId;
  return (
    <Card c={c}><H c={c}>Convidar amigos</H>
      <T c={c} small muted>Grupo fechado: só entra quem tiver o código ou o link.</T>
      <Text selectable style={{ color: c.accent, fontSize: 26, fontWeight: '800', letterSpacing: 2, textAlign: 'center' }}>{fmtCode(g.tripId)}</Text>
      <Btn c={c} label="Enviar convite" onPress={() => g.share('Entre no nosso grupo de viagem no Vamos. Código: ' + fmtCode(g.tripId) + '\n' + link)} />
    </Card>
  );
}
export function Presenca({ g }) {
  const { c, S } = g; const ds = days(S);
  if (!ds.length) return <Card c={c}><H c={c}>Quais dias você vai?</H><Empty c={c}>Defina a chegada e a saída da viagem na aba Início. Depois cada pessoa marca aqui os dias em que vai estar.</Empty></Card>;
  const mine = new Set(S.here.filter(h => h.person === g.me).map(h => h.day)); const n = S.people.length;
  const setHere = (list, on) => { if (!g.me) return g.toast('Diga quem você é primeiro.'); if (on) { const a = list.filter(d => !mine.has(d)); if (a.length) g.addMany('here', a.map(d => ({ key: d + ':' + g.me, data: { day: d, person: g.me } }))); } else { const a = list.filter(d => mine.has(d)); if (a.length) g.delMany('here', a.map(d => d + ':' + g.me)); } };
  const rows = ds.map(d => { const who = S.people.filter(p => S.here.some(h => h.day === d && h.person === p.id)); return { d, who, cnt: who.length }; }); const max = Math.max(1, ...rows.map(r => r.cnt));
  return (
    <View style={{ gap: 12 }}>
      <Card c={c}><H c={c}>Quais dias você vai?</H>
        <T c={c} small muted>Toque nos dias em que você vai estar.</T>
        <Row wrap>{ds.map(d => { const on = mine.has(d); return <TouchableOpacity key={d} onPress={() => setHere([d], !on)} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : 'transparent', alignItems: 'center', minWidth: 62 }}><Text style={{ color: on ? c.onAccent : c.ink, fontWeight: '700', fontSize: 13 }}>{dayLabel(d)}</Text><Text style={{ color: on ? c.onAccent : c.muted, fontSize: 11 }}>{S.here.filter(h => h.day === d).length}</Text></TouchableOpacity>; })}</Row>
        <Row><Btn c={c} small ghost label="Todos os dias" onPress={() => setHere(ds, true)} /><Btn c={c} small ghost label="Limpar" onPress={() => setHere(ds, false)} /></Row>
      </Card>
      <Card c={c}><H c={c}>Presença por dia</H>
        {rows.map(r => <View key={r.d} style={{ gap: 4 }}><Row><T c={c} bold style={{ flex: 1 }}>{dayLabel(r.d)}</T><T c={c} color={n && r.cnt === n ? c.good : c.muted}>{r.cnt}/{n}</T></Row><Bar c={c} pct={r.cnt / max * 100} />{r.cnt ? <T c={c} small muted>{r.who.map(p => p.name).join(', ')}</T> : <T c={c} small muted>Ninguém marcou ainda.</T>}</View>)}
      </Card>
    </View>
  );
}

/* ---------- Hospedagem ---------- */
export function Hosp({ g }) {
  const { c, S } = g; const n = S.people.length || 1, max = Math.max(1, ...S.stays.map(votesOf)); const t = S.trip;
  const [f, setF] = useState({ name: '', addr: '', links: '', price: '', beds: '', by: '', note: '' }); const set = k => v => setF(o => ({ ...o, [k]: v }));
  const sorted = [...S.stays].sort((a, b) => (b.booked ? 1 : 0) - (a.booked ? 1 : 0) || votesOf(b) - votesOf(a) || (a.at || 0) - (b.at || 0));
  return (
    <View style={{ gap: 12 }}>
      {(t.cin || t.cout) ? <Card c={c}><KV c={c} k="Check-in" v={t.cin || '—'} /><KV c={c} k="Check-out" v={t.cout || '—'} /></Card> : null}
      <Card c={c}><H c={c}>Adicionar opção de hospedagem</H>
        <Inp c={c} value={f.name} onChangeText={set('name')} placeholder="Nome do lugar" maxLength={80} />
        <Inp c={c} value={f.addr} onChangeText={set('addr')} placeholder="Endereço ou região (opcional)" maxLength={140} />
        <Inp c={c} value={f.links} onChangeText={set('links')} placeholder="Links do anúncio (um por linha)" multiline autoCapitalize="none" />
        <Money c={c} label="Valor total (R$)" value={f.price} set={set('price')} />
        <Inp c={c} label="Quartos / camas" value={f.beds} onChangeText={set('beds')} placeholder="Ex.: 3 quartos" />
        <PersonPick g={g} label="Quem reserva" value={f.by} onChange={set('by')} blank="Ainda não definido" />
        <Inp c={c} value={f.note} onChangeText={set('note')} placeholder="Observações: piscina, distância, regras…" multiline />
        <Btn c={c} label="Adicionar à votação" onPress={() => { if (!f.name.trim()) return; g.add('stay', { name: f.name.trim(), links: f.links.split(/\s+/).map(x => x.trim()).filter(x => /^https?:\/\//i.test(x)), photos: [], addr: f.addr.trim(), price: num(f.price), beds: f.beds.trim(), paidBy: f.by, note: f.note.trim(), booked: false }); setF({ name: '', addr: '', links: '', price: '', beds: '', by: '', note: '' }); }} />
      </Card>
      {sorted.length ? sorted.map(s => { const v = votesOf(s), mine = g.me && s.votes && s.votes[g.me]; return (
        <Card c={c} key={s.id}>
          <Row><H c={c}>{s.name}</H><View style={{ flex: 1 }} />{s.booked ? <Pill c={c} label="Escolhida" color={c.good} /> : null}<Del g={g} what={s.name} id={s.id} /></Row>
          <Row wrap><T c={c} bold>{brl(s.price || 0)}</T><T c={c} small muted>{brl((s.price || 0) / n)} por pessoa</T>{s.beds ? <Pill c={c} label={s.beds} /> : null}</Row>
          {s.paidBy && P(g, s.paidBy) ? <T c={c} small muted>Reserva: {nm(g, s.paidBy)}</T> : null}
          {(s.photos && s.photos.length) ? <Row wrap>{s.photos.filter(p => /^data:image\//.test(p)).map((p, i) => <Image key={i} source={{ uri: p }} style={{ width: 96, height: 72, borderRadius: 10 }} />)}</Row> : null}
          {s.addr ? <TouchableOpacity onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.addr))}><T c={c} small color={c.accent}>📍 {s.addr}</T></TouchableOpacity> : null}
          {stayLinks(s).map((u, i, a) => <TouchableOpacity key={i} onPress={() => Linking.openURL(u)}><T c={c} small color={c.accent}>{a.length > 1 ? 'Anúncio ' + (i + 1) : 'Abrir anúncio'}</T></TouchableOpacity>)}
          {s.note ? <T c={c} small>{s.note}</T> : null}
          <Bar c={c} pct={v / max * 100} />
          <T c={c} bold>{v} {v === 1 ? 'voto' : 'votos'}{Object.keys(s.votes || {}).filter(i => P(g, i)).length ? ' · ' + Object.keys(s.votes).filter(i => P(g, i)).map(i => nm(g, i)).join(', ') : ''}</T>
          <Row wrap><Btn c={c} small on={!!mine} disabled={!g.me} label={mine ? 'Voto dado · tirar' : 'Votar nesta'} onPress={() => { const key = s.id + ':' + g.me; if (mine) g.delKey('vote', key); else g.addOnce('vote', { stay: s.id, person: g.me }, key); }} />
            <Btn c={c} small ghost label={s.booked ? 'Desmarcar escolha' : 'Marcar como escolhida'} onPress={() => { const was = s.booked; S.stays.forEach(x => { const want = x.id === s.id ? !was : false; if (!!x.booked !== want) g.upd('stays', x.id, { booked: want }); }); }} /></Row>
          {!g.me ? <T c={c} small muted>Escolha quem você é (menu ⚙) para votar.</T> : null}
        </Card>); }) : <Card c={c}><Empty c={c}>Nenhuma opção ainda. Sugira o primeiro lugar e o grupo vota.</Empty></Card>}
    </View>
  );
}

/* ---------- Cardápio, compras e votações ---------- */
export function Cardapio({ g }) {
  const { c, S } = g; const dl = days(S); const ds = [...new Set([...dl, ...S.menu.map(m => m.date)])].sort();
  const [date, setDate] = useState(ds[0] || ''), [meal, setMeal] = useState('almoco'), [dish, setDish] = useState(''), [who, setWho] = useState(''), [cost, setCost] = useState('');
  if (!S.trip.start && !S.menu.length) return <View style={{ gap: 12 }}><Card c={c}><Empty c={c}>Defina as datas da estadia na aba Início para montar o cardápio dia a dia.</Empty></Card><Compras g={g} /><Votacoes g={g} /></View>;
  return (
    <View style={{ gap: 12 }}>
      <Card c={c}><H c={c}>Adicionar refeição</H>
        <Pick c={c} label="Dia" value={date || ds[0]} onChange={setDate} options={ds.map(d => [d, dayLabel(d)])} />
        <Pick c={c} label="Refeição" value={meal} onChange={setMeal} options={MEALS} />
        <Inp c={c} value={dish} onChangeText={setDish} placeholder="Ex.: Churrasco" maxLength={60} />
        <PersonPick g={g} label="Quem leva ou compra" value={who} onChange={setWho} blank="Ainda sem responsável" />
        <Money c={c} label="Custo estimado (R$)" value={cost} set={setCost} />
        <Btn c={c} label="Adicionar" onPress={() => { if (!dish.trim()) return; g.add('menu', { date: date || ds[0], meal, dish: dish.trim(), who, cost: num(cost) }); setDish(''); setCost(''); }} />
      </Card>
      {ds.map(d => { const ms = S.menu.filter(m => m.date === d).sort((a, b) => MEALS.findIndex(x => x[0] === a.meal) - MEALS.findIndex(x => x[0] === b.meal)); const idx = dl.indexOf(d); const sub = ms.reduce((a, m) => a + (m.cost || 0), 0); return (
        <Card c={c} key={d}><Row><H c={c}>{dayLabel(d)}</H><View style={{ flex: 1 }} /><T c={c} small muted>{idx >= 0 ? 'Dia ' + (idx + 1) : 'Fora das datas'}{sub > 0 ? ' · ' + brl(sub) : ''}</T></Row>
          {ms.length ? ms.map(m => <Row key={m.id}><Pill c={c} label={(MEALS.find(x => x[0] === m.meal) || [0, m.meal])[1]} /><View style={{ flex: 1 }}><T c={c}>{m.dish}</T>{(m.who || m.cost > 0) ? <T c={c} small muted>{[m.who ? nm(g, m.who) : '', m.cost > 0 ? brl(m.cost) : ''].filter(Boolean).join(' · ')}</T> : null}</View><Del g={g} what={m.dish} id={m.id} /></Row>) : <Empty c={c}>Nada planejado.</Empty>}
        </Card>); })}
      <Compras g={g} />
      <Votacoes g={g} />
    </View>
  );
}
function shopN(g, s) { const S = g.S; if (s.ppl > 0) return [s.ppl, 'informado']; const m = S.menu.find(x => x.id === s.menu); if (m) { const cc = S.here.filter(h => h.day === m.date).length; if (cc > 0) return [cc, 'presentes em ' + dayLabel(m.date)]; } return [S.people.length || 1, 'no grupo']; }
export function Compras({ g }) {
  const { c, S } = g; const [name, setName] = useState(''), [per, setPer] = useState(''), [unit, setUnit] = useState('g'), [menu, setMenu] = useState(''), [ppl, setPpl] = useState(''), [price, setPrice] = useState('');
  const fmt = (q, u) => u === 'un' ? q.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' un' : (q >= 1000 ? (q / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' ' + (u === 'ml' ? 'L' : 'kg') : Math.round(q) + ' ' + (u === 'ml' ? 'ml' : 'g'));
  let tot = 0;
  const rows = S.shop.map(s => { const [n, why] = shopN(g, s), q = s.per * n, base = s.unit === 'un' ? q : q / 1000, cost = s.price > 0 ? base * s.price : 0; tot += cost; const m = S.menu.find(x => x.id === s.menu); return <Row key={s.id}><View style={{ flex: 1 }}><T c={c} bold>{s.name}: comprar {fmt(q, s.unit)}</T><T c={c} small muted>{fmt(s.per, s.unit)} por pessoa × {n} {n === 1 ? 'pessoa' : 'pessoas'} ({why}){m ? ' · ' + m.dish : ''}{cost > 0 ? ' · ' + brl(cost) : ''}</T></View><Del g={g} what={s.name} id={s.id} /></Row>; });
  return (
    <Card c={c}><H c={c}>Calculadora de compras</H>
      <Inp c={c} value={name} onChangeText={setName} placeholder="Ex.: Macarrão" maxLength={60} />
      <Row><View style={{ flex: 1 }}><Inp c={c} label="Quantidade por pessoa" value={per} onChangeText={setPer} kb="numeric" placeholder="500" /></View></Row>
      <Pick c={c} label="Unidade" value={unit} onChange={setUnit} options={[['g', 'gramas'], ['ml', 'ml'], ['un', 'unidades']]} />
      <Pick c={c} label="Refeição do cardápio (usa quem está presente no dia)" value={menu} onChange={setMenu} options={[['', 'Todo o grupo'], ...S.menu.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(m => [m.id, dayLabel(m.date) + ' · ' + m.dish])]} />
      <Row><View style={{ flex: 1 }}><Inp c={c} label="Nº de pessoas (opcional)" value={ppl} onChangeText={setPpl} kb="numeric" placeholder="Automático" /></View><View style={{ flex: 1 }}><Money c={c} label="Preço por kg, L ou un" value={price} set={setPrice} /></View></Row>
      <Btn c={c} label="Calcular e salvar" onPress={() => { const p = num(per); if (!name.trim() || p <= 0) return g.toast('Informe o nome e a quantidade por pessoa.'); g.add('shop', { name: name.trim(), per: p, unit, menu, ppl: parseInt(ppl) || 0, price: num(price) }); setName(''); setPer(''); setPpl(''); setPrice(''); }} />
      <H c={c} size={15}>Lista de compras</H>
      {rows.length ? rows : <Empty c={c}>Adicione itens para ver quanto comprar.</Empty>}
      {tot > 0 ? <KV c={c} k="Custo estimado" v={brl(tot)} /> : null}
    </Card>
  );
}
export function Votacoes({ g }) {
  const { c, S } = g; const [title, setTitle] = useState(''), [desc, setDesc] = useState(''), [multi, setMulti] = useState('0');
  const vote = async (p, o) => { const me = g.me; if (!me) return g.toast('Escolha quem você é (menu ⚙).'); const pid = p.id, oid = o.id; const mv = S.pvotes.filter(v => v.poll === pid && v.person === me);
    if (p.multi) { const k = pid + ':' + oid + ':' + me; if (mv.some(v => v.opt === oid)) { await g.delKey('pvote', k); await g.delKey('pvote', pid + ':' + me); return; } await g.addOnce('pvote', { poll: pid, opt: oid, person: me }, k); return; }
    const had = mv.some(v => v.opt === oid); await g.delKey('pvote', pid + ':' + me); for (const v of mv) if (v.opt !== oid) await g.delKey('pvote', pid + ':' + v.opt + ':' + me); if (had) return; await g.addOnce('pvote', { poll: pid, opt: oid, person: me }, pid + ':' + me); };
  return (
    <View style={{ gap: 12 }}>
      <Card c={c}><H c={c}>Nova votação</H>
        <Inp c={c} value={title} onChangeText={setTitle} placeholder="Título. Ex.: Dogão" maxLength={80} />
        <Inp c={c} value={desc} onChangeText={setDesc} placeholder={'Itens ou detalhes (um por linha)'} multiline maxLength={600} />
        <Pick c={c} label="Cada pessoa pode votar em" value={multi} onChange={setMulti} options={[['0', 'Apenas 1 opção'], ['1', 'Várias opções']]} />
        <Btn c={c} label="Abrir votação" onPress={() => { if (!title.trim()) return; g.add('poll', { title: title.trim(), desc: desc.trim(), multi: multi === '1', closed: false }); setTitle(''); setDesc(''); }} />
      </Card>
      {S.polls.length ? [...S.polls].sort((a, b) => b.at - a.at).map(p => <Poll key={p.id} g={g} p={p} vote={vote} />) : <Card c={c}><Empty c={c}>Nenhuma votação aberta.</Empty></Card>}
    </View>
  );
}
function Poll({ g, p, vote }) {
  const { c, S } = g; const [nm2, setNm] = useState(''), [links, setLinks] = useState(''), [note, setNote] = useState('');
  const opts = S.popts.filter(o => o.poll === p.id), vs = S.pvotes.filter(v => v.poll === p.id && opts.some(o => o.id === v.opt));
  const cnt = o => vs.filter(v => v.opt === o.id).length, mx = Math.max(1, ...opts.map(cnt)), mine = vs.filter(v => v.person === g.me);
  const sorted = [...opts].sort((a, b) => cnt(b) - cnt(a) || a.at - b.at);
  return (
    <Card c={c}><Row><H c={c}>{p.title}{p.closed ? ' (encerrada)' : ''}</H><View style={{ flex: 1 }} /><Del g={g} what={p.title} id={p.id} /></Row>
      <T c={c} small muted>{p.multi ? 'Pode votar em várias opções' : 'Vote em apenas 1 opção'}</T>
      {p.desc ? <T c={c} small muted>{p.desc}</T> : null}
      {sorted.length ? sorted.map((o, i) => { const cc = cnt(o), on = mine.some(v => v.opt === o.id); return (
        <TouchableOpacity key={o.id} disabled={!!p.closed} onPress={() => vote(p, o)} style={{ borderWidth: 1, borderColor: on ? c.accent : c.line, borderRadius: 12, padding: 10, gap: 6 }}>
          <Row><T c={c} bold style={{ flex: 1 }}>{i === 0 && cc > 0 ? '🏆 ' : ''}{on ? '✓ ' : ''}{o.name}</T><T c={c}>{cc} {cc === 1 ? 'voto' : 'votos'}</T></Row>
          {o.note ? <T c={c} small muted>{o.note}</T> : null}
          <Bar c={c} pct={cc / mx * 100} />
          {(o.links || []).map((u, k) => <TouchableOpacity key={k} onPress={() => Linking.openURL(u)}><T c={c} small color={c.accent}>Link {k + 1}</T></TouchableOpacity>)}
          {cc ? <T c={c} small muted>{vs.filter(v => v.opt === o.id).map(v => nm(g, v.person)).join(', ')}</T> : null}
          <Del g={g} what={o.name} id={o.id} />
        </TouchableOpacity>); }) : <Empty c={c}>Sem opções ainda.</Empty>}
      {!p.closed ? <View style={{ gap: 6 }}><T c={c} bold>Adicionar opção</T>
        <Inp c={c} value={nm2} onChangeText={setNm} placeholder="Nome da opção" maxLength={80} />
        <Inp c={c} value={links} onChangeText={setLinks} placeholder="Links, um por linha" multiline autoCapitalize="none" />
        <Inp c={c} value={note} onChangeText={setNote} placeholder="Valor, endereço, observação" maxLength={140} />
        <Btn c={c} ghost label="Adicionar opção" onPress={() => { if (!nm2.trim()) return; g.add('popt', { poll: p.id, name: nm2.trim(), links: links.split(/\s+/).map(x => x.trim()).filter(x => /^https?:\/\//i.test(x)), photos: [], note: note.trim() }); setNm(''); setLinks(''); setNote(''); }} /></View> : null}
      <Btn c={c} small ghost label={p.closed ? 'Reabrir votação' : 'Encerrar votação'} onPress={() => g.upd('polls', p.id, { closed: !p.closed })} />
    </Card>
  );
}

/* ---------- Carona ---------- */
export function Transp({ g }) {
  const { c, S } = g; const role = (P(g, g.me) || {}).role; const mot = role === 'motorista';
  const [f, setF] = useState({ kind: 'carro', title: '', from: '', day: '', time: '', seats: '', body: '', driver: '', fuel: '', toll: '', cost: '', mode: 'total', note: '' }); const set = k => v => setF(o => ({ ...o, [k]: v }));
  const ds = days(S); const car = f.kind === 'carro';
  const rides = [...S.rides].sort((a, b) => String(a.depart || '').localeCompare(String(b.depart || '')) || (a.at || 0) - (b.at || 0));
  const needMe = g.me && S.needs.some(n => n.person === g.me);
  const form = (
    <Card c={c}><H c={c}>{mot ? 'Sou motorista: oferecer carona' : 'Oferecer ou combinar transporte'}</H>
      <Pick c={c} label="Tipo" value={f.kind} onChange={set('kind')} options={Object.entries(KINDS)} />
      <Inp c={c} value={f.title} onChangeText={set('title')} placeholder="Ex.: Carro do Léo" maxLength={80} />
      <Inp c={c} label="Saída de" value={f.from} onChangeText={set('from')} placeholder="Local de encontro" />
      {ds.length ? <Pick c={c} label="Dia" value={f.day} onChange={set('day')} options={[['', 'A combinar'], ...ds.map(d => [d, dayLabel(d)])]} /> : <DateIn c={c} label="Dia" value={f.day} set={set('day')} />}
      <Inp c={c} label="Hora" value={f.time} onChangeText={x => set('time')(maskTime(x))} placeholder="07:00" kb="numeric" />
      {car ? <View style={{ gap: 8 }}>
        <Inp c={c} label="Lugares disponíveis" value={f.seats} onChangeText={set('seats')} kb="numeric" placeholder="Sem limite" />
        <Pick c={c} label="Tipo do carro" value={f.body} onChange={set('body')} options={[['', '—'], ...['Hatch', 'Sedan', 'SUV', 'Van', 'Picape'].map(x => [x, x])]} />
        <PersonPick g={g} label="Motorista" value={f.driver || (mot ? g.me : '')} onChange={set('driver')} blank="Ninguém definido" />
        <Money c={c} label="Combustível (R$)" value={f.fuel} set={set('fuel')} /><Money c={c} label="Pedágio (R$)" value={f.toll} set={set('toll')} />
        <Pick c={c} label="Como dividir" value={f.mode} onChange={set('mode')} options={[['total', 'Custo do veículo, entre quem vai'], ['pessoa', 'Valor por pessoa']]} />
      </View> : <Money c={c} label="Custo (R$)" value={f.cost} set={set('cost')} />}
      <Inp c={c} value={f.note} onChangeText={set('note')} placeholder="Observações: paradas, bagagem…" multiline />
      <Btn c={c} label="Adicionar" onPress={() => { if (!f.title.trim()) return; if (car && g.me && !mot && !f.driver) g.upd('people', g.me, { role: 'motorista' }); const depart = f.day ? (f.time ? f.day + 'T' + f.time : f.day) : ''; g.add('ride', { by: g.me, kind: f.kind, title: f.title.trim(), from: f.from.trim(), depart, seats: car ? Math.max(0, parseInt(f.seats) || 0) : 0, body: car ? f.body : '', driverId: car ? (f.driver || g.me || '') : '', fuel: car ? num(f.fuel) : 0, toll: car ? num(f.toll) : 0, cost: car ? num(f.fuel) + num(f.toll) : num(f.cost), costMode: car ? f.mode : 'pessoa', note: f.note.trim() }); setF({ ...f, title: '', from: '', fuel: '', toll: '', cost: '', note: '', seats: '' }); }} />
    </Card>);
  return (
    <View style={{ gap: 12 }}>
      {mot ? form : null}
      <Card c={c}><H c={c}>Preciso de carona</H><T c={c} small muted>{S.needs.length ? 'Precisam de carona: ' + S.needs.map(n => nm(g, n.person)).join(', ') : 'Ninguém pediu carona ainda.'}</T>
        <Btn c={c} small ghost={!!needMe} label={needMe ? 'Já tenho carona' : 'Preciso de carona'} disabled={!g.me} onPress={() => { if (needMe) g.delKey('need', g.me); else g.addOnce('need', { person: g.me }, g.me); }} /></Card>
      {mot ? null : form}
      {rides.length ? rides.map(r => { const pax = (r.pax || []).filter(i => P(g, i)), cap = r.seats || 0, full = cap && pax.length >= cap, inside = g.me && pax.includes(g.me);
        const occ = new Set([...pax, ...(P(g, r.driverId) ? [r.driverId] : [])]).size; const each = r.cost > 0 ? (r.costMode === 'pessoa' ? r.cost : r.cost / Math.max(occ, 1)) : 0; return (
        <Card c={c} key={r.id}><Row><Pill c={c} label={KINDS[r.kind] || 'Outro'} /><H c={c}>{r.title}</H><View style={{ flex: 1 }} /><Del g={g} what={r.title} id={r.id} /></Row>
          <T c={c} small>{r.depart ? when(r.depart) : 'Horário a combinar'}{r.from ? ' · saindo de ' + r.from : ''}</T>
          {r.driverId && r.kind === 'carro' ? <T c={c} small muted>Motorista: {nm(g, r.driverId)}</T> : null}
          {r.kind === 'carro' && (r.body || cap) ? <T c={c} small muted>{[r.body, cap ? Math.max(cap - pax.length, 0) + ' de ' + cap + ' lugares disponíveis' : ''].filter(Boolean).join(' · ')}</T> : null}
          {r.cost > 0 ? <T c={c} small>{brl(r.cost)} {r.costMode === 'pessoa' ? 'por pessoa' : 'no total'} · {brl(each)} para cada um</T> : null}
          {r.note ? <T c={c} small>{r.note}</T> : null}
          <Row><T c={c} bold>{pax.length}{cap ? ' / ' + cap : ''}</T><T c={c} small muted>{r.kind !== 'carro' ? 'vão por conta própria' : cap ? 'lugares ocupados' : 'passageiros'}</T>{full ? <Pill c={c} label="Lotado" color={c.warn} /> : null}</Row>
          {pax.length ? <T c={c} small>{pax.map(i => nm(g, i)).join(', ')}</T> : null}
          <Btn c={c} small ghost={!!inside} disabled={!g.me || (!inside && !!full)} label={r.kind !== 'carro' ? (inside ? 'Não vou neste' : 'Eu vou neste') : inside ? 'Sair desta carona' : 'Entrar'} onPress={() => { if (!['motorista', 'passageiro'].includes(role)) g.upd('people', g.me, { role: 'passageiro' }); const key = r.id + ':' + g.me; if (inside) g.delKey('join', key); else g.addOnce('join', { ride: r.id, person: g.me }, key); }} />
        </Card>); }) : <Card c={c}><Empty c={c}>Nenhum transporte ainda. Ofereça carona, combine ônibus ou registre os voos.</Empty></Card>}
    </View>
  );
}
