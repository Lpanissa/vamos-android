import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Share, Alert, AppState, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useC, Card, H, T, Row, Btn, Inp, Pill, Empty, Pick } from './ui';
import { SB, KEY, REDIRECT, SITE, T_TRIPS, T_ROWS, lsGet, lsSet, ctx, api, authReq, authFrom, genCode, fmtCode, parseCode, buildS, strip, emptyS } from './lib';
import { Resumo, Amigos, Hosp, Cardapio, Transp, Convidar } from './screens';

WebBrowser.maybeCompleteAuthSession();
const TABS = [['resumo', 'Início'], ['amigos', 'Amigos'], ['hosp', 'Hospedagem'], ['cardapio', 'Cardápio'], ['transp', 'Carona']];

export default function App() {
  const c = useC();
  const [ready, setReady] = useState(false);
  const [auth, setAuthS] = useState(null);
  const [tripId, setTripId] = useState('');
  const [snap, setSnap] = useState(null);
  const [me, setMe] = useState('');
  const [tab, setTab] = useState('resumo');
  const [trips, setTrips] = useState([]);
  const [owned, setOwned] = useState([]);
  const [msg, setMsg] = useState('');
  const [offline, setOffline] = useState(false);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [pw2, setPw2] = useState('');
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const tt = useRef(null), q = useRef(Promise.resolve()), autoBusy = useRef(false), scroller = useRef(null);

  const toast = useCallback(m => { setMsg(m); clearTimeout(tt.current); tt.current = setTimeout(() => setMsg(''), 3800); }, []);
  const setAuth = useCallback(a => { ctx.auth = a; setAuthS(a); lsSet('v_auth', a ? JSON.stringify(a) : ''); }, []);
  ctx.onAuth = setAuth; ctx.tripId = tripId;
  const S = useMemo(() => (snap ? buildS(snap) : emptyS()), [snap]);

  /* início: carrega dados salvos */
  useEffect(() => { (async () => {
    try { const a = JSON.parse(await lsGet('v_auth', 'null')); if (a) { ctx.auth = a; setAuthS(a); } } catch (e) {}
    try { setTrips(JSON.parse(await lsGet('v_trips', '[]')) || []); } catch (e) {}
    setReady(true);
  })(); }, []);
  const saveTrips = a => { setTrips(a); lsSet('v_trips', JSON.stringify(a)); };

  /* grupos criados por mim */
  const loadOwned = useCallback(async () => { if (!ctx.auth) { setOwned([]); return; } try { const r = await api(T_TRIPS + '?select=id,data&owner=eq.' + ctx.auth.id + '&order=created_at.desc'); setOwned((r || []).map(x => ({ id: x.id, name: (x.data || {}).name || 'Nova viagem' }))); } catch (e) {} }, []);
  useEffect(() => { if (ready && !tripId) loadOwned(); }, [ready, auth, tripId]);

  /* sincronização */
  const refresh = useCallback(async () => {
    const id = ctx.tripId; if (!id) return;
    try {
      const [t, rows] = await Promise.all([api(T_TRIPS + '?id=eq.' + id + '&select=data,owner'), api(T_ROWS + '?trip_id=eq.' + id + '&select=id,kind,key,data,created_at&order=created_at.asc&limit=3000')]);
      if (id !== ctx.tripId) return;
      if (!t || !t.length) { toast('Grupo não encontrado. Confira o código.'); closeTrip(true, id); return; }
      const sn = { trip: t[0].data, owner: t[0].owner, rows: rows || [] };
      setSnap(prev => (prev && JSON.stringify(prev) === JSON.stringify(sn) ? prev : sn)); lsSet('v_cache_' + id, JSON.stringify(sn)); setOffline(false);
      setTrips(list => { const e = list.find(x => x.id === id); if (e && e.name !== sn.trip.name) { const n = list.map(x => x.id === id ? { ...x, name: sn.trip.name || 'Nova viagem' } : x); lsSet('v_trips', JSON.stringify(n)); return n; } return list; });
    } catch (e) { setOffline(true); }
  }, []);
  useEffect(() => { if (!tripId) return; refresh(); const iv = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 8000); const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh(); }); return () => { clearInterval(iv); sub.remove(); }; }, [tripId]);

  const openTrip = useCallback(async id => {
    ctx.tripId = id; setSnap(null); setTab('resumo'); setTripId(id);
    setMe(await lsGet('v_me_' + id, ''));
    try { const ch = JSON.parse(await lsGet('v_cache_' + id, 'null')); if (ch) setSnap(ch); } catch (e) {}
    setTrips(list => { if (list.find(x => x.id === id)) return list; const n = [{ id, name: '' }, ...list]; lsSet('v_trips', JSON.stringify(n)); return n; });
  }, []);
  function closeTrip(forget, id) { if (forget) setTrips(list => { const n = list.filter(x => x.id !== id); lsSet('v_trips', JSON.stringify(n)); return n; }); ctx.tripId = ''; setTripId(''); setSnap(null); setMe(''); setMenu(false); }

  /* escrita */
  const w = fn => { q.current = q.current.then(fn).then(() => refresh()).catch(() => toast('Não deu pra salvar. Verifique a internet e tente de novo.')); return q.current; };
  const G = {
    c, S, me, tripId, toast,
    isOwner: !!(auth && S.owner && S.owner === auth.id),
    add: (kind, data, key = null) => w(() => api(T_ROWS, { method: 'POST', prefer: 'return=minimal', body: { trip_id: ctx.tripId, kind, key, data } })),
    addOnce: (kind, data, key) => w(() => api(T_ROWS + '?on_conflict=trip_id,kind,key', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: { trip_id: ctx.tripId, kind, key, data } })),
    addMany: (kind, arr) => w(() => api(T_ROWS + '?on_conflict=trip_id,kind,key', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: arr.map(x => ({ trip_id: ctx.tripId, kind, key: x.key, data: x.data })) })),
    delKey: (kind, key) => w(() => api(`${T_ROWS}?trip_id=eq.${ctx.tripId}&kind=eq.${kind}&key=eq.${encodeURIComponent(key)}`, { method: 'DELETE', prefer: 'return=minimal' })),
    delMany: (kind, keys) => w(() => api(`${T_ROWS}?trip_id=eq.${ctx.tripId}&kind=eq.${kind}&key=in.(${keys.map(k => '"' + k + '"').join(',')})`, { method: 'DELETE', prefer: 'return=minimal' })),
    del: id => w(() => api(T_ROWS + '?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' })),
    upd: (coll, id, patch) => { const o = S[coll].find(x => x.id === id); if (!o) return Promise.resolve(); return w(() => api(T_ROWS + '?id=eq.' + id, { method: 'PATCH', prefer: 'return=minimal', body: { data: { ...strip(o), ...patch } } })); },
    saveTrip: patch => w(() => api(T_TRIPS + '?id=eq.' + ctx.tripId, { method: 'PATCH', prefer: 'return=minimal', body: { data: { ...S.trip, ...patch } } })),
    share: m => Share.share({ message: m }).catch(() => {}),
  };

  /* reconhece a pessoa automaticamente */
  useEffect(() => { (async () => {
    if (autoBusy.current || !auth || !tripId || !snap || (me && S.people.find(p => p.id === me))) return;
    const em = String(auth.email || '').toLowerCase();
    let p = em ? S.people.find(x => String(x.email || '').toLowerCase() === em) : null;
    if (!p) { const n0 = String(auth.name || '').trim().toLowerCase(); if (n0) p = S.people.find(x => x.name.trim().toLowerCase() === n0); }
    if (!p) { const fn = String(auth.name || '').trim().toLowerCase().split(/\s+/)[0]; if (fn) { const cs = S.people.filter(x => !x.email && x.name.trim().toLowerCase() === fn); if (cs.length === 1) p = cs[0]; } }
    if (p) { setMe(p.id); lsSet('v_me_' + tripId, p.id); return; }
    const name = String(auth.name || '').split('@')[0].trim().slice(0, 40); if (!name) return;
    autoBusy.current = true;
    try { await G.add('person', { name, email: em }); } finally { autoBusy.current = false; }
  })(); }, [auth, tripId, snap, me]);
  useEffect(() => { if (!auth || !me || !tripId) return; const p = S.people.find(x => x.id === me); if (p && auth.email && String(p.email || '').toLowerCase() !== String(auth.email).toLowerCase()) G.upd('people', me, { email: String(auth.email).toLowerCase() }); }, [me, snap]);

  /* login */
  const loginGoogle = async () => {
    try {
      const r = await WebBrowser.openAuthSessionAsync(SB + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(REDIRECT), REDIRECT);
      if (r.type !== 'success' || !r.url) return;
      const p = new URLSearchParams((r.url.split('#')[1] || '')), at = p.get('access_token');
      if (!at) return toast('Não consegui entrar com o Google. Tente de novo.');
      setAuth(authFrom(at, p.get('refresh_token'))); toast('Conectado ✓');
    } catch (e) { toast('Não consegui abrir o login do Google.'); }
  };
  const submitEmail = async () => {
    const em = email.trim().toLowerCase(); if (!em || !pw) return toast('Digite e-mail e senha.');
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (pw.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.');
        if (pw !== pw2) return toast('As senhas não são iguais. Digite de novo.');
        const r = await authReq('signup', { email: em, password: pw });
        if (r.ok && r.j.access_token) { setAuth(authFrom(r.j.access_token, r.j.refresh_token)); toast('Conta criada ✓'); return; }
        if (r.ok) { toast('Conta criada. Confirme pelo link enviado ao seu e-mail e depois toque em Entrar.'); setMode('login'); return; }
        return toast(r.status === 422 || /registered|exists/i.test(JSON.stringify(r.j)) ? 'Esse e-mail já tem conta. Toque em Entrar.' : 'Não foi possível criar a conta. Confira o e-mail e a senha.');
      }
      const r = await authReq('token?grant_type=password', { email: em, password: pw });
      if (r.ok && r.j.access_token) { setAuth(authFrom(r.j.access_token, r.j.refresh_token)); toast('Conectado ✓'); setPw(''); return; }
      toast(/confirm/i.test(JSON.stringify(r.j)) ? 'Confirme seu e-mail pelo link que enviamos e tente de novo.' : 'E-mail ou senha incorretos.');
    } catch (e) { toast('Sem internet. Tente de novo.'); } finally { setBusy(false); }
  };
  const forgot = async () => { const em = email.trim().toLowerCase(); if (!em) return toast('Digite seu e-mail e toque de novo em "Esqueci minha senha".'); const r = await authReq('recover?redirect_to=' + encodeURIComponent(SITE), { email: em }); toast(r.ok ? 'Enviamos um link para o seu e-mail. Abra e crie a nova senha.' : 'Não consegui enviar. Confira o e-mail.'); };
  const logout = () => { setAuth(null); setOwned([]); setMenu(false); };

  const AuthCard = (
    <Card c={c}>
      <H c={c}>Entre para participar</H>
      <T c={c} small muted>Entre com Google ou e-mail. O app te reconhece em qualquer aparelho, sem pedir o nome.</T>
      <Btn c={c} label="Entrar com Google" onPress={loginGoogle} />
      <T c={c} small muted>ou use e-mail e senha</T>
      <Row><Btn c={c} small ghost={mode !== 'login'} label="Entrar" onPress={() => setMode('login')} /><Btn c={c} small ghost={mode !== 'signup'} label="Criar conta" onPress={() => setMode('signup')} /></Row>
      <Inp c={c} value={email} onChangeText={setEmail} placeholder="Seu e-mail" kb="email-address" autoCapitalize="none" maxLength={80} />
      <Inp c={c} value={pw} onChangeText={setPw} placeholder="Senha (mínimo 6 caracteres)" secure autoCapitalize="none" />
      {mode === 'signup' ? <Inp c={c} value={pw2} onChangeText={setPw2} placeholder="Repita a senha" secure autoCapitalize="none" /> : null}
      <Btn c={c} label={mode === 'signup' ? 'Criar conta' : 'Entrar'} disabled={busy} onPress={submitEmail} />
      {mode === 'login' ? <Btn c={c} small ghost label="Esqueci minha senha" onPress={forgot} /> : null}
    </Card>
  );

  const createTrip = async () => {
    const name = newName.trim(); if (!name) return; if (!auth) return toast('Entre para criar um grupo.');
    const id = genCode(); ctx.tripId = id;
    try { await api(T_TRIPS, { method: 'POST', prefer: 'return=minimal', body: { id, data: { name } } }); }
    catch (x) { ctx.tripId = ''; return toast(x.status === 401 || x.status === 403 ? 'Entre de novo para criar o grupo.' : 'Não deu pra criar. Verifique a internet.'); }
    saveTrips([{ id, name }, ...trips]); setNewName(''); openTrip(id);
  };
  const joinTrip = () => { const cd = parseCode(code); if (!cd) return toast('Código ou link inválido. O código tem 10 letras e números.'); setCode(''); openTrip(cd); };
  const rotate = async () => { const nw = genCode(); try { await api(T_TRIPS + '?id=eq.' + tripId, { method: 'PATCH', prefer: 'return=minimal', body: { id: nw } }); } catch (e) { return toast('Não deu pra gerar o novo código. Entre de novo e tente.'); } const old = tripId; saveTrips(trips.map(x => x.id === old ? { ...x, id: nw } : x)); lsSet('v_me_' + nw, me); setMenu(false); openTrip(nw); toast('Novo código gerado. O antigo deixou de funcionar.'); };
  const delTrip = async () => { const id = tripId; try { await api(T_TRIPS + '?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }); } catch (e) { return toast('Não deu pra apagar o grupo.'); } saveTrips(trips.filter(x => x.id !== id)); toast('Grupo apagado.'); closeTrip(false, id); };
  const ask = (t, fn) => Alert.alert(t, 'Tem certeza?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', style: 'destructive', onPress: fn }]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  const merged = (() => { const m = new Map(); trips.forEach(t => m.set(t.id, { ...t })); owned.forEach(t => m.set(t.id, { ...(m.get(t.id) || {}), ...t, mine: true })); return [...m.values()]; })();
  const meP = S.people.find(p => p.id === me);
  const role = (meP || {}).role || '';

  let body;
  if (!tripId) {
    body = (
      <View style={{ gap: 12 }}>
        <Card c={c}><H c={c}>Tenho um código</H>
          <Inp c={c} value={code} onChangeText={setCode} placeholder="Código ou link do grupo" autoCapitalize="characters" />
          <Btn c={c} label="Entrar no grupo" onPress={joinTrip} /></Card>
        {auth ? <Card c={c}><H c={c}>Criar grupo</H>
          <Inp c={c} value={newName} onChangeText={setNewName} placeholder="Ex.: Fim de semana na serra" maxLength={60} />
          <Btn c={c} label="Criar grupo" onPress={createTrip} />
          <T c={c} small muted>Você entrou como {auth.name || auth.email}.</T></Card> : <View style={{ gap: 12 }}><T c={c} bold>Quero criar um grupo</T>{AuthCard}</View>}
        <Card c={c}><H c={c}>Meus grupos</H>
          {merged.length ? merged.map(t => <Row key={t.id} style={{ borderTopWidth: 1, borderColor: c.line, paddingTop: 8 }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => openTrip(t.id)}><T c={c} bold>{t.name || 'Grupo'}</T>{t.mine ? <T c={c} small muted>Criado por você</T> : null}</TouchableOpacity>
            <TouchableOpacity onPress={() => saveTrips(trips.filter(x => x.id !== t.id))}><Text style={{ color: c.muted, fontSize: 13 }}>Tirar da lista</Text></TouchableOpacity></Row>) : <Empty c={c}>Você ainda não tem grupos.</Empty>}
        </Card>
        {auth ? <Btn c={c} ghost label={'Sair da conta (' + (auth.name || auth.email) + ')'} onPress={logout} /> : null}
      </View>
    );
  } else if (!snap) {
    body = <Card c={c}><T c={c} muted>Carregando o grupo…</T></Card>;
  } else if (!auth && !meP) {
    body = <View style={{ gap: 12 }}><Card c={c}><T c={c}>Você está entrando no grupo <T c={c} bold>{S.trip.name || fmtCode(tripId)}</T>.</T></Card>{AuthCard}</View>;
  } else if (!meP) {
    body = <Card c={c}><H c={c}>Entrando no grupo…</H><T c={c} small muted>Conectado como {auth.name || auth.email}.</T>
      {snap && S.people.length ? <View style={{ gap: 6 }}><T c={c} small muted>Já foi adicionado pelo grupo? Toque no seu nome:</T><Row wrap>{S.people.map(p => <Btn key={p.id} c={c} small ghost label={p.name} onPress={() => { setMe(p.id); lsSet('v_me_' + tripId, p.id); }} />)}</Row></View> : null}</Card>;
  } else {
    body = tab === 'resumo' ? <Resumo g={G} /> : tab === 'amigos' ? <Amigos g={G} /> : tab === 'hosp' ? <Hosp g={G} /> : tab === 'cardapio' ? <Cardapio g={G} /> : <Transp g={G} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle={c.bg === '#11161C' ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
        {tripId ? <TouchableOpacity onPress={() => closeTrip(false, tripId)}><Text style={{ color: c.accent, fontSize: 22 }}>‹</Text></TouchableOpacity> : null}
        <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{tripId ? (S.trip.name || 'Vamos') : 'Vamos'}</Text>{!tripId ? <Text style={{ color: c.muted, fontSize: 13 }}>Vamos viajar?</Text> : null}</View>
        {tripId && meP ? <TouchableOpacity onPress={() => setMenu(true)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: c.line }}><Text style={{ color: c.ink, fontWeight: '700' }}>{meP.name.split(' ')[0]} ⚙</Text></TouchableOpacity> : null}
      </View>
      {offline ? <View style={{ backgroundColor: c.warn, paddingVertical: 4 }}><Text style={{ color: '#fff', textAlign: 'center', fontSize: 12 }}>Sem conexão. Mostrando os últimos dados salvos.</Text></View> : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroller} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 40 }} refreshControl={tripId ? <RefreshControl refreshing={false} onRefresh={refresh} /> : undefined}>
          {body}
        </ScrollView>
      </KeyboardAvoidingView>
      {tripId && meP ? <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
        {TABS.map(([k, l]) => <TouchableOpacity key={k} onPress={() => { setTab(k); scroller.current && scroller.current.scrollTo({ y: 0, animated: false }); }} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}><Text style={{ color: tab === k ? c.accent : c.muted, fontWeight: tab === k ? '800' : '500', fontSize: 11 }}>{l}</Text></TouchableOpacity>)}
      </View> : null}
      {msg ? <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: tripId ? 80 : 30, backgroundColor: c.ink, padding: 12, borderRadius: 12 }}><Text style={{ color: c.bg, textAlign: 'center' }}>{msg}</Text></View> : null}

      <Modal visible={menu} animationType="slide" onRequestClose={() => setMenu(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            <Row><H c={c} size={20}>Perfil e grupo</H><View style={{ flex: 1 }} /><Btn c={c} small ghost label="Fechar" onPress={() => setMenu(false)} /></Row>
            {meP ? <ProfileCard g={G} p={meP} role={role} auth={auth} onSwitch={() => { setMe(''); lsSet('v_me_' + tripId, ''); setMenu(false); }} /> : null}
            <Convidar g={G} />
            <Card c={c}><H c={c}>Gerenciar grupo</H>
              {G.isOwner ? <View style={{ gap: 8 }}><T c={c} small muted>Você criou este grupo. Gerar um novo código desativa o código e o link atuais.</T><Btn c={c} ghost label="Gerar novo código" onPress={() => ask('Gerar novo código?', rotate)} /><Btn c={c} ghost danger label="Apagar grupo e todos os dados" onPress={() => ask('Apagar o grupo?', delTrip)} /></View> : <T c={c} small muted>Só quem criou o grupo pode gerar novo código ou apagá-lo.</T>}
              <Btn c={c} ghost label="Voltar para Meus grupos" onPress={() => closeTrip(false, tripId)} />
            </Card>
            <Card c={c}><H c={c}>Conta</H>{auth ? <View style={{ gap: 8 }}><T c={c}>Conectado como <T c={c} bold>{auth.name || auth.email}</T></T><Btn c={c} ghost label="Sair da conta" onPress={logout} /></View> : <T c={c} small muted>Você ainda não entrou com conta.</T>}</Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileCard({ g, p, role, auth, onSwitch }) {
  const { c } = g; const [name, setName] = useState(p.name);
  return (
    <Card c={c}><H c={c}>Perfil</H>
      <Inp c={c} label="Seu nome" value={name} onChangeText={setName} maxLength={40} />
      <Btn c={c} small label="Salvar nome" onPress={() => { const n = name.trim(); if (n) g.upd('people', p.id, { name: n }).then(() => g.toast('Nome salvo ✓')); }} />
      <Pick c={c} label="Transporte" value={role || 'nenhum'} onChange={k => g.upd('people', p.id, { role: k === 'nenhum' ? '' : k })} options={[['motorista', 'Sou motorista'], ['passageiro', 'Sou passageiro'], ['coletivo', 'Vou de coletivo'], ['aviao', 'Vou de avião'], ['nenhum', 'Nenhum']]} />
      {g.S.owner ? <T c={c} small muted>Você é {g.isOwner ? 'o criador do grupo' : (g.S.admins.some(a => a.person === p.id) ? 'administrador' : 'participante')}.</T> : null}
      <Btn c={c} small ghost label="Não sou eu · trocar de pessoa" onPress={onSwitch} />
    </Card>
  );
}
