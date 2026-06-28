import { useState, useEffect, useCallback } from "react";

// ============================================================
// SUPABASE CONFIG
// ============================================================
const SUPABASE_URL = "https://uwyebdagzjpgstjqsyxg.supabase.co";
const SUPABASE_KEY = "sb_publishable_4XIQ0zIlSMaUwHFLikcbpQ_vLsTR5-u";

const db = {
  async select(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    if (options.order) url += `&order=${options.order}`;
    if (options.filter) url += `&${options.filter}`;
    const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async update(table, id, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) throw new Error(await r.text());
  },
};

// ============================================================
// DESIGN TOKENS
// ============================================================
const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222", borderLight: "#2a2a2a",
  yellow: "#F5C518", yellowBg: "rgba(245,197,24,0.08)", yellowBgHover: "rgba(245,197,24,0.14)",
  white: "#FFFFFF", gray: "#888888", grayLight: "#555555",
  success: "#22c55e", successBg: "rgba(34,197,94,0.1)",
  danger: "#ef4444", dangerBg: "rgba(239,68,68,0.1)",
  warn: "#f97316", warnBg: "rgba(249,115,22,0.1)",
  info: "#3b82f6", infoBg: "rgba(59,130,246,0.1)",
  text: "#e8e8e8", textMuted: "#999999",
};

const S = {
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gray },
  bigNumber: { fontSize: 32, fontWeight: 800, color: C.white, letterSpacing: "-0.02em", lineHeight: 1 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: C.yellow, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 },
  badge: (color, bg) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }),
  input: { background: "#161616", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" },
  btn: { background: C.yellow, color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase" },
  btnGhost: { background: "transparent", color: C.gray, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnDanger: { background: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
};

const STATUS_COLORS = {
  "Aguardando pagamento": [C.warn, C.warnBg], "Pago": [C.info, C.infoBg],
  "Separado": [C.yellow, C.yellowBg], "Enviado": [C.warn, C.warnBg],
  "Entregue": [C.success, C.successBg], "Finalizado": [C.success, C.successBg],
  "Cancelado": [C.danger, C.dangerBg], "Pendente": [C.warn, C.warnBg],
  "Atrasado": [C.danger, C.dangerBg], "Em trânsito": [C.info, C.infoBg],
  "Recebido": [C.success, C.successBg], "Aguardando envio": [C.info, C.infoBg],
  "Saiu para entrega": [C.warn, C.warnBg], "Pedido realizado": [C.info, C.infoBg],
  "Publicado": [C.info, C.infoBg], "Concluído": [C.success, C.successBg],
  "PIX": [C.success, C.successBg], "Crédito": [C.info, C.infoBg],
  "Débito": [C.info, C.infoBg], "Dinheiro": [C.yellow, C.yellowBg],
  "Fiado": [C.danger, C.dangerBg], "Torcedor": [C.info, C.infoBg],
  "Jogador": [C.yellow, C.yellowBg], "Retrô": [C.warn, C.warnBg],
  "Polo": [C.success, C.successBg], "Treino": [C.gray, "#333"],
};

// ============================================================
// HELPERS
// ============================================================
const fmt = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v, t) => t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0;
const today = () => new Date().toISOString().slice(0, 10);

// ============================================================
// SHARED COMPONENTS
// ============================================================
function Badge({ status }) {
  const [color, bg] = STATUS_COLORS[status] || [C.gray, "#222"];
  return <span style={S.badge(color, bg)}>{status}</span>;
}

function KpiCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={S.label}>{label}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ ...S.bigNumber, color: accent || C.white, fontSize: 26 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textMuted }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div style={S.sectionTitle}>{title}</div>
      {action}
    </div>
  );
}

function Table({ cols, rows, emptyMsg = "Nenhum registro." }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{cols.map((c) => <th key={c.key + c.label} style={{ ...S.label, textAlign: c.align || "left", padding: "0 12px 12px", whiteSpace: "nowrap" }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} style={{ padding: 32, textAlign: "center", color: C.gray }}>{emptyMsg}</td></tr>
            : rows.map((row, i) => (
              <tr key={row.id || i} style={{ borderTop: `1px solid ${C.border}` }}>
                {cols.map((c) => <td key={c.key + c.label} style={{ padding: "12px", color: C.text, textAlign: c.align || "left" }}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>)}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
          <div style={S.sectionTitle}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ ...S.label, display: "block", marginBottom: 6 }}>{label}</label>{children}</div>;
}

function Input(props) { return <input style={S.input} {...props} />; }

function Select({ options, ...props }) {
  return (
    <select style={{ ...S.input, cursor: "pointer" }} {...props}>
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

function Btn({ ghost, danger, children, ...props }) {
  const style = danger ? S.btnDanger : ghost ? S.btnGhost : S.btn;
  return <button style={style} {...props}>{children}</button>;
}

function ProgressBar({ value, max, color = C.yellow }) {
  const p = pct(value, max);
  return (
    <div>
      <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: C.gray }}>
        <span>{p}% atingido</span><span>Meta: {max}</span>
      </div>
    </div>
  );
}

function Loading() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, color: C.gray, fontSize: 14 }}>⚡ Carregando...</div>;
}

function useTable(table, order = "criado_em.desc") {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.select(table, { order });
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [table, order]);

  useEffect(() => { load(); }, [load]);

  const add = async (item) => {
    const [saved] = await db.insert(table, item);
    setRows(prev => [saved, ...prev]);
    return saved;
  };

  const edit = async (id, data) => {
    const [saved] = await db.update(table, id, data);
    setRows(prev => prev.map(r => r.id === id ? saved : r));
    return saved;
  };

  const remove = async (id) => {
    await db.delete(table, id);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  return { rows, loading, error, reload: load, add, edit, remove };
}

// ============================================================
// MÓDULO: DASHBOARD
// ============================================================
function Dashboard({ onNav }) {
  const { rows: vendas, loading: lv } = useTable("vendas");
  const { rows: fiado } = useTable("fiado");
  const { rows: produtos } = useTable("produtos");
  const { rows: metas } = useTable("metas");

  if (lv) return <Loading />;

  const fat = vendas.reduce((a, v) => a + Number(v.valor || 0), 0);
  const lucro = vendas.reduce((a, v) => a + Number(v.lucro || 0), 0);
  const ticket = vendas.length > 0 ? fat / vendas.length : 0;
  const aReceber = fiado.filter(f => f.status !== "Pago").reduce((a, f) => a + Number(f.valor || 0), 0);
  const valorEstoque = produtos.reduce((a, p) => a + Number(p.custo || 0) * Number(p.quantidade || 0), 0);
  const baixoEstoque = produtos.filter(p => Number(p.quantidade) > 0 && Number(p.quantidade) <= 3);
  const zerado = produtos.filter(p => Number(p.quantidade) === 0);
  const atrasados = fiado.filter(f => f.status === "Atrasado");

  return (
    <div>
      <div style={S.sectionTitle}>Visão Geral — {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>

      {vendas.length === 0 && (
        <div style={{ ...S.card, background: C.yellowBg, border: `1px solid ${C.yellow}44`, marginBottom: 24, fontSize: 14, color: C.text }}>
          ⚡ <strong>Bem-vindo ao Vibra FC ERP!</strong> Comece cadastrando produtos e registrando suas primeiras vendas.
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Btn onClick={() => onNav("produtos")} style={{ ...S.btn, padding: "8px 16px", fontSize: 12 }}>📦 Cadastrar Produto</Btn>
            <Btn onClick={() => onNav("vendas")} style={{ ...S.btn, padding: "8px 16px", fontSize: 12 }}>💰 Registrar Venda</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Faturamento" value={fmt(fat)} icon="📈" />
        <KpiCard label="Lucro Total" value={fmt(lucro)} accent={C.yellow} icon="✨" />
        <KpiCard label="Qtd Vendas" value={vendas.length} icon="🛍️" />
        <KpiCard label="Ticket Médio" value={fmt(ticket)} icon="🎯" />
        <KpiCard label="A Receber" value={fmt(aReceber)} accent={C.warn} icon="⏳" />
        <KpiCard label="Valor em Estoque" value={fmt(valorEstoque)} icon="📦" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>Alertas</div>
          {atrasados.length === 0 && baixoEstoque.length === 0 && zerado.length === 0 ? (
            <div style={{ color: C.success, fontSize: 13 }}>✅ Tudo em ordem!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {atrasados.map(f => (
                <div key={f.id} style={{ padding: "8px 12px", background: C.dangerBg, borderRadius: 8, fontSize: 12, color: C.text }}>
                  🚨 Fiado atrasado: <strong>{f.cliente}</strong> — {fmt(f.valor)}
                </div>
              ))}
              {zerado.map(p => (
                <div key={p.id} style={{ padding: "8px 12px", background: C.dangerBg, borderRadius: 8, fontSize: 12, color: C.text }}>
                  🚫 Estoque zerado: <strong>{p.nome}</strong>
                </div>
              ))}
              {baixoEstoque.map(p => (
                <div key={p.id} style={{ padding: "8px 12px", background: C.warnBg, borderRadius: 8, fontSize: 12, color: C.text }}>
                  ⚠️ Estoque baixo: <strong>{p.nome}</strong> — {p.quantidade} un.
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.card}>
          <div style={S.sectionTitle}>Metas</div>
          {metas.length === 0 ? (
            <div style={{ color: C.gray, fontSize: 13 }}>Nenhuma meta cadastrada. <button onClick={() => onNav("metas")} style={{ background: "none", border: "none", color: C.yellow, cursor: "pointer", fontSize: 13 }}>Criar meta →</button></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {metas.slice(0, 3).map(m => {
                const p = pct(Number(m.atual), Number(m.meta));
                const cor = p >= 100 ? C.success : p >= 70 ? C.yellow : C.warn;
                return (
                  <div key={m.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: C.text }}>{m.tipo}</span>
                      <span style={{ color: cor, fontWeight: 700 }}>{p}%</span>
                    </div>
                    <ProgressBar value={Number(m.atual)} max={Number(m.meta)} color={cor} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {vendas.length > 0 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Últimas Vendas</div>
          <Table
            cols={[
              { key: "data", label: "Data" },
              { key: "cliente_nome", label: "Cliente" },
              { key: "produto_nome", label: "Produto" },
              { key: "forma_pagamento", label: "Pgto", render: v => <Badge status={v} /> },
              { key: "valor", label: "Valor", align: "right", render: v => fmt(v) },
              { key: "lucro", label: "Lucro", align: "right", render: v => <span style={{ color: C.success, fontWeight: 700 }}>{fmt(v)}</span> },
            ]}
            rows={vendas.slice(0, 8)}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: PRODUTOS (ESTOQUE)
// ============================================================
function Produtos() {
  const { rows, loading, add, edit, remove } = useTable("produtos", "nome.asc");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const empty = { nome: "", clube: "", temporada: "", categoria: "Torcedor", cor: "", tamanho: "M", quantidade: "", custo: "", preco: "", obs: "" };
  const [form, setForm] = useState(empty);

  const filtrados = rows.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()) || p.clube?.toLowerCase().includes(search.toLowerCase()));
  const valorEstoque = rows.reduce((a, p) => a + Number(p.custo || 0) * Number(p.quantidade || 0), 0);
  const baixo = rows.filter(p => Number(p.quantidade) > 0 && Number(p.quantidade) <= 3).length;
  const zerado = rows.filter(p => Number(p.quantidade) === 0).length;

  const abrir = (prod = null) => {
    setEditando(prod);
    setForm(prod ? { ...prod } : empty);
    setModal(true);
  };

  const salvar = async () => {
    if (!form.nome) return;
    setSaving(true);
    try {
      const payload = { ...form, quantidade: Number(form.quantidade) || 0, custo: Number(form.custo) || 0, preco: Number(form.preco) || 0 };
      if (editando) { await edit(editando.id, payload); }
      else { await add(payload); }
      setModal(false);
    } finally { setSaving(false); }
  };

  const excluir = async (id) => { if (confirm("Excluir produto?")) await remove(id); };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Valor em Estoque" value={fmt(valorEstoque)} icon="📦" />
        <KpiCard label="Estoque Baixo (≤3)" value={baixo} accent={C.warn} icon="⚠️" />
        <KpiCard label="Zerado" value={zerado} accent={C.danger} icon="🚫" />
      </div>
      <SectionHeader title="Produtos em Estoque" action={<Btn onClick={() => abrir()}>+ Novo Produto</Btn>} />
      <div style={{ marginBottom: 16 }}>
        <Input placeholder="Buscar produto ou clube..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={S.card}>
        <Table
          cols={[
            { key: "nome", label: "Produto" },
            { key: "clube", label: "Clube" },
            { key: "categoria", label: "Categoria", render: v => <Badge status={v} /> },
            { key: "tamanho", label: "Tam." },
            { key: "quantidade", label: "Qtd", align: "center", render: v => <span style={{ color: Number(v) === 0 ? C.danger : Number(v) <= 3 ? C.warn : C.success, fontWeight: 700 }}>{v}</span> },
            { key: "custo", label: "Custo", align: "right", render: v => fmt(v) },
            { key: "preco", label: "Preço", align: "right", render: v => <span style={{ color: C.yellow, fontWeight: 700 }}>{fmt(v)}</span> },
            { key: "preco", label: "Margem", align: "right", render: (v, r) => <span style={{ color: C.success }}>{r.preco > 0 ? Math.round(((Number(r.preco) - Number(r.custo)) / Number(r.preco)) * 100) : 0}%</span> },
            { key: "id", label: "", render: (v, r) => (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => abrir(r)} style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 11 }}>✏️</button>
                <button onClick={() => excluir(v)} style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 11 }}>🗑</button>
              </div>
            )},
          ]}
          rows={filtrados}
          emptyMsg="Nenhum produto cadastrado ainda."
        />
      </div>

      {modal && (
        <Modal title={editando ? "Editar Produto" : "Novo Produto"} onClose={() => setModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}><Field label="Nome"><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Brasil 2026 Home" /></Field></div>
            <Field label="Clube/Seleção"><Input value={form.clube || ""} onChange={e => setForm({ ...form, clube: e.target.value })} /></Field>
            <Field label="Temporada"><Input value={form.temporada || ""} onChange={e => setForm({ ...form, temporada: e.target.value })} /></Field>
            <Field label="Categoria"><Select value={form.categoria || "Torcedor"} onChange={e => setForm({ ...form, categoria: e.target.value })} options={["Torcedor", "Jogador", "Retrô", "Polo", "Treino"]} /></Field>
            <Field label="Cor"><Input value={form.cor || ""} onChange={e => setForm({ ...form, cor: e.target.value })} /></Field>
            <Field label="Tamanho"><Select value={form.tamanho || "M"} onChange={e => setForm({ ...form, tamanho: e.target.value })} options={["PP", "P", "M", "G", "GG", "2GG", "3GG", "4GG"]} /></Field>
            <Field label="Quantidade"><Input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></Field>
            <Field label="Custo (R$)"><Input type="number" value={form.custo} onChange={e => setForm({ ...form, custo: e.target.value })} /></Field>
            <Field label="Preço de Venda (R$)"><Input type="number" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} /></Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Observações"><Input value={form.obs || ""} onChange={e => setForm({ ...form, obs: e.target.value })} /></Field></div>
          </div>
          {form.custo && form.preco && (
            <div style={{ background: C.yellowBg, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.yellow, marginBottom: 12 }}>
              Margem: {Math.round(((Number(form.preco) - Number(form.custo)) / Number(form.preco)) * 100)}% · Lucro unitário: {fmt(Number(form.preco) - Number(form.custo))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar Produto"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: VENDAS
// ============================================================
const SINC_KEY = "vibra_vendas_sinc_v1";
const getSincronizadas = () => new Set(JSON.parse(localStorage.getItem(SINC_KEY) || "[]"));
const marcarSincronizada = (id) => {
  const s = getSincronizadas(); s.add(String(id));
  localStorage.setItem(SINC_KEY, JSON.stringify([...s]));
};

const isVendaCancelada = (v) => v.status === "Cancelada" || String(v.obs || "").startsWith("[CANCELADA");

function Vendas() {
  const { rows, loading, add, edit } = useTable("vendas");
  const { rows: produtos, reload: reloadProdutos } = useTable("produtos", "nome.asc");
  const { rows: clientes } = useTable("clientes", "nome.asc");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState(null);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [modalSinc, setModalSinc] = useState(false);
  const [sincLog, setSincLog] = useState(null);
  const empty = { cliente_nome: "", produto_nome: "", tamanho: "", quantidade: 1, valor: "", custo: "", desconto: 0, frete: 0, forma_pagamento: "PIX", data: today(), obs: "" };
  const [form, setForm] = useState(empty);

  // Separa canceladas dos KPIs
  const vendasAtivas = rows.filter(v => !isVendaCancelada(v));
  const fat = vendasAtivas.reduce((a, v) => a + Number(v.valor || 0), 0);
  const lucro = vendasAtivas.reduce((a, v) => a + Number(v.lucro || 0), 0);
  const ticket = vendasAtivas.length > 0 ? fat / vendasAtivas.length : 0;
  const margem = fat > 0 ? (lucro / fat) * 100 : 0;

  // Vendas antigas ainda não rastreadas pelo sistema (potencialmente sem baixa no estoque)
  const naoSincronizadas = rows.filter(v => !isVendaCancelada(v) && !getSincronizadas().has(String(v.id)));

  const nomesUnicos = [...new Set(produtos.map(p => p.nome))].sort();
  const tamanhosDisponiveis = form.produto_nome
    ? produtos.filter(p => p.nome === form.produto_nome && Number(p.quantidade) > 0).map(p => p.tamanho)
    : [];
  const produtoEscolhido = produtos.find(p => p.nome === form.produto_nome && p.tamanho === form.tamanho);

  const selecionarProduto = (nome) => {
    const c = produtos.filter(p => p.nome === nome && Number(p.quantidade) > 0)[0];
    setForm({ ...form, produto_nome: nome, tamanho: c?.tamanho || "", custo: c?.custo || "", valor: c?.preco || "" });
  };
  const selecionarTamanho = (tam) => {
    const p = produtos.find(p => p.nome === form.produto_nome && p.tamanho === tam);
    setForm({ ...form, tamanho: tam, custo: p?.custo || form.custo, valor: p?.preco || form.valor });
  };

  const salvar = async () => {
    if (!form.cliente_nome || !form.produto_nome || !form.valor) return;
    setSaving(true);
    setErro(null);
    try {
      const custo = Number(form.custo) || Number(produtoEscolhido?.custo) || 0;
      const lucroCalc = Number(form.valor) - custo - Number(form.desconto || 0);
      const payload = { ...form, valor: Number(form.valor), custo, lucro: lucroCalc, desconto: Number(form.desconto || 0), frete: Number(form.frete || 0), quantidade: Number(form.quantidade) };

      // Tenta salvar com status; cai sem ele se coluna não existir
      let saved;
      try { saved = await add({ ...payload, status: "Concluída" }); }
      catch { saved = await add(payload); }

      // Rastreia no localStorage que essa venda já reduziu estoque
      if (saved?.id) marcarSincronizada(saved.id);

      // Baixa no estoque
      if (produtoEscolhido) {
        await db.update("produtos", produtoEscolhido.id, {
          quantidade: Math.max(0, Number(produtoEscolhido.quantidade) - Number(form.quantidade)),
        });
        await reloadProdutos();
      }

      setModal(false);
      setForm(empty);
    } catch (e) {
      setErro(e.message || "Erro ao salvar a venda.");
    } finally { setSaving(false); }
  };

  // ── CANCELAMENTO ──────────────────────────────────────────────
  const confirmarCancelar = async () => {
    const v = modalCancelar;
    setSaving(true);
    try {
      // Tenta marcar como cancelada no DB; fallback em obs se status não existir
      try {
        await edit(v.id, { status: "Cancelada", cancelado_em: new Date().toISOString() });
      } catch {
        await edit(v.id, { obs: `[CANCELADA em ${new Date().toLocaleDateString("pt-BR")}] ${v.obs || ""}`.trim() });
      }

      // Devolve estoque
      const prod = produtos.find(p => p.nome === v.produto_nome && p.tamanho === v.tamanho);
      if (prod) {
        await db.update("produtos", prod.id, { quantidade: Number(prod.quantidade) + Number(v.quantidade) });
        await reloadProdutos();
      }

      // Remove da lista de sincronizadas para evitar ressincronização futura
      const s = getSincronizadas(); s.delete(String(v.id));
      localStorage.setItem(SINC_KEY, JSON.stringify([...s]));

      setModalCancelar(null);
    } catch (e) {
      alert("Erro ao cancelar: " + (e.message || "tente novamente"));
    } finally { setSaving(false); }
  };

  // ── SINCRONIZAÇÃO MANUAL ─────────────────────────────────────
  const executarSinc = async () => {
    setSaving(true);
    const log = { ok: [], semProduto: [], erros: [] };
    try {
      const sinc = getSincronizadas();
      const pendentes = rows.filter(v => !isVendaCancelada(v) && !sinc.has(String(v.id)));
      for (const v of pendentes) {
        try {
          const prod = produtos.find(p => p.nome === v.produto_nome && p.tamanho === v.tamanho);
          if (prod) {
            await db.update("produtos", prod.id, {
              quantidade: Math.max(0, Number(prod.quantidade) - Number(v.quantidade)),
            });
            log.ok.push(`${v.produto_nome} ${v.tamanho} (${v.cliente_nome})`);
          } else {
            log.semProduto.push(`${v.produto_nome} ${v.tamanho} — produto não encontrado`);
          }
          marcarSincronizada(v.id);
        } catch (e) {
          log.erros.push(`${v.produto_nome}: ${e.message}`);
        }
      }
      await reloadProdutos();
      setSincLog(log);
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Faturamento" value={fmt(fat)} icon="💰" />
        <KpiCard label="Lucro Total" value={fmt(lucro)} accent={C.yellow} icon="✨" />
        <KpiCard label="Qtd Vendas" value={vendasAtivas.length} icon="🛍️" />
        <KpiCard label="Margem Média" value={`${margem.toFixed(1)}%`} accent={C.success} icon="📊" />
      </div>

      {/* Aviso de vendas não sincronizadas */}
      {naoSincronizadas.length > 0 && (
        <div style={{ ...S.card, background: C.warnBg, border: `1px solid ${C.warn}44`, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: C.text }}>
            ⚠️ <strong>{naoSincronizadas.length} venda{naoSincronizadas.length > 1 ? "s" : ""}</strong> anterior{naoSincronizadas.length > 1 ? "es" : ""} ao novo sistema pode{naoSincronizadas.length > 1 ? "m" : ""} não ter descontado o estoque.
          </div>
          <Btn onClick={() => { setSincLog(null); setModalSinc(true); }} style={{ ...S.btn, padding: "7px 14px", fontSize: 12 }}>Sincronizar Estoque</Btn>
        </div>
      )}

      <SectionHeader title="Registro de Vendas" action={<Btn onClick={() => { setErro(null); setModal(true); }}>+ Nova Venda</Btn>} />
      <div style={S.card}>
        <Table
          cols={[
            { key: "data", label: "Data" },
            { key: "cliente_nome", label: "Cliente" },
            { key: "produto_nome", label: "Produto" },
            { key: "tamanho", label: "Tam." },
            { key: "forma_pagamento", label: "Pgto", render: v => <Badge status={v} /> },
            { key: "valor", label: "Valor", align: "right", render: (v, r) => <span style={{ textDecoration: isVendaCancelada(r) ? "line-through" : "none", color: isVendaCancelada(r) ? C.gray : C.text }}>{fmt(v)}</span> },
            { key: "lucro", label: "Lucro", align: "right", render: (v, r) => isVendaCancelada(r) ? <Badge status="Cancelada" /> : <span style={{ color: C.success, fontWeight: 700 }}>{fmt(v)}</span> },
            { key: "id", label: "", render: (v, r) => !isVendaCancelada(r) && (
              <button onClick={() => setModalCancelar(r)} style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 11 }}>✕ Cancelar</button>
            )},
          ]}
          rows={rows}
          emptyMsg="Nenhuma venda registrada ainda."
        />
      </div>

      {/* Modal: Nova Venda */}
      {modal && (
        <Modal title="Registrar Venda" onClose={() => setModal(false)}>
          <Field label="Cliente">
            <Input list="clientes-list" value={form.cliente_nome} onChange={e => setForm({ ...form, cliente_nome: e.target.value })} placeholder="Nome do cliente" />
            <datalist id="clientes-list">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
          </Field>
          <Field label="Produto">
            <Input list="produtos-unicos-list" value={form.produto_nome} onChange={e => selecionarProduto(e.target.value)} placeholder="Buscar produto..." />
            <datalist id="produtos-unicos-list">{nomesUnicos.map(n => <option key={n} value={n} />)}</datalist>
          </Field>
          {form.produto_nome && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="Tamanho">
                {tamanhosDisponiveis.length > 0
                  ? <Select value={form.tamanho} onChange={e => selecionarTamanho(e.target.value)} options={tamanhosDisponiveis} />
                  : <div style={{ color: C.danger, fontSize: 12, padding: "10px 0" }}>⚠️ Sem estoque</div>}
              </Field>
              <Field label="Qtd"><Input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></Field>
              <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
            </div>
          )}
          {produtoEscolhido && (
            <div style={{ background: C.successBg, border: `1px solid ${C.success}33`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.text, marginBottom: 10 }}>
              ✅ <strong>{produtoEscolhido.nome} {produtoEscolhido.tamanho}</strong> · Estoque: {produtoEscolhido.quantidade} un. · Custo: {fmt(produtoEscolhido.custo)}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="Custo (R$)"><Input type="number" value={form.custo} onChange={e => setForm({ ...form, custo: e.target.value })} /></Field>
            <Field label="Desconto (R$)"><Input type="number" value={form.desconto} onChange={e => setForm({ ...form, desconto: e.target.value })} /></Field>
            <Field label="Frete (R$)"><Input type="number" value={form.frete} onChange={e => setForm({ ...form, frete: e.target.value })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Pagamento"><Select value={form.forma_pagamento} onChange={e => setForm({ ...form, forma_pagamento: e.target.value })} options={["PIX", "Dinheiro", "Débito", "Crédito", "Fiado", "Outro"]} /></Field>
            <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
          </div>
          {form.valor && form.custo && (
            <div style={{ background: C.yellowBg, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.yellow, marginBottom: 12 }}>
              Lucro estimado: {fmt(Number(form.valor) - Number(form.custo) - Number(form.desconto || 0))}
            </div>
          )}
          {erro && <div style={{ background: C.dangerBg, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 12 }}>❌ {erro}</div>}
          <Field label="Observações"><Input value={form.obs} onChange={e => setForm({ ...form, obs: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Concluir Venda"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar Cancelamento */}
      {modalCancelar && (
        <Modal title="Cancelar Venda" onClose={() => setModalCancelar(null)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: C.white, marginBottom: 4 }}>{modalCancelar.produto_nome} {modalCancelar.tamanho}</div>
            <div style={{ color: C.gray, fontSize: 12, marginBottom: 10 }}>Cliente: {modalCancelar.cliente_nome} · Data: {modalCancelar.data} · {fmt(modalCancelar.valor)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
              <div>📦 Qtd vendida: <strong style={{ color: C.white }}>{modalCancelar.quantidade} un.</strong></div>
              {(() => {
                const p = produtos.find(x => x.nome === modalCancelar.produto_nome && x.tamanho === modalCancelar.tamanho);
                return p
                  ? <div style={{ color: C.success }}>✅ Estoque voltará de {p.quantidade} → {Number(p.quantidade) + Number(modalCancelar.quantidade)} un.</div>
                  : <div style={{ color: C.warn }}>⚠️ Produto não encontrado no estoque — devolução não será feita automaticamente.</div>;
              })()}
              <div style={{ color: C.danger }}>💰 Faturamento reduzirá em {fmt(modalCancelar.valor)}</div>
              <div style={{ color: C.danger }}>📊 Lucro reduzirá em {fmt(modalCancelar.lucro)}</div>
            </div>
          </div>
          <div style={{ background: C.warnBg, border: `1px solid ${C.warn}44`, borderRadius: 6, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: C.warn }}>
            ⚠️ Esta ação desfaz todos os efeitos desta venda no estoque e financeiro. A venda permanecerá no histórico como <strong>Cancelada</strong>.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={confirmarCancelar} disabled={saving} style={{ ...S.btnDanger, padding: "10px 20px", fontSize: 13, fontWeight: 800 }}>
              {saving ? "Cancelando..." : "✕ Confirmar Cancelamento"}
            </button>
            <Btn ghost onClick={() => setModalCancelar(null)}>Voltar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal: Sincronização de Estoque */}
      {modalSinc && (
        <Modal title="Sincronizar Estoque de Vendas Antigas" onClose={() => { setModalSinc(false); setSincLog(null); }}>
          {!sincLog ? (
            <>
              <div style={{ background: C.warnBg, border: `1px solid ${C.warn}44`, borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 13, color: C.text }}>
                <div style={{ fontWeight: 700, color: C.warn, marginBottom: 8 }}>⚠️ Atenção antes de sincronizar</div>
                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                  Esta ação descontará do estoque as <strong>{naoSincronizadas.length} venda{naoSincronizadas.length > 1 ? "s" : ""}</strong> que o sistema não rastreou automaticamente.<br /><br />
                  <strong>Faça isso apenas uma vez.</strong> Se o estoque já foi ajustado manualmente, essa ação pode deixá-lo negativo.<br /><br />
                  Vendas que serão processadas:
                </div>
                <div style={{ marginTop: 10, maxHeight: 180, overflowY: "auto" }}>
                  {naoSincronizadas.map(v => (
                    <div key={v.id} style={{ fontSize: 11, color: C.textMuted, padding: "2px 0" }}>
                      {v.data} · {v.cliente_nome} · {v.produto_nome} {v.tamanho} · {v.quantidade} un. · {fmt(v.valor)}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={executarSinc} disabled={saving} style={{ ...S.btn, padding: "10px 20px", fontSize: 13 }}>
                  {saving ? "Sincronizando..." : `Sincronizar ${naoSincronizadas.length} venda${naoSincronizadas.length > 1 ? "s" : ""}`}
                </button>
                <Btn ghost onClick={() => { setModalSinc(false); setSincLog(null); }}>Cancelar</Btn>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: C.successBg, borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 13 }}>
                <div style={{ color: C.success, fontWeight: 700, marginBottom: 8 }}>✅ Sincronização concluída</div>
                {sincLog.ok.length > 0 && <div style={{ fontSize: 12, marginBottom: 6 }}><strong>{sincLog.ok.length}</strong> item{sincLog.ok.length > 1 ? "s" : ""} atualizados no estoque.</div>}
                {sincLog.semProduto.length > 0 && <div style={{ fontSize: 12, color: C.warn, marginBottom: 4 }}><strong>{sincLog.semProduto.length}</strong> sem produto encontrado (estoque não alterado).</div>}
                {sincLog.erros.length > 0 && <div style={{ fontSize: 12, color: C.danger }}><strong>{sincLog.erros.length}</strong> erro{sincLog.erros.length > 1 ? "s" : ""}.</div>}
              </div>
              <Btn onClick={() => { setModalSinc(false); setSincLog(null); }}>Fechar</Btn>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: CLIENTES
// ============================================================
function Clientes() {
  const { rows, loading, add, edit, remove } = useTable("clientes", "nome.asc");
  const { rows: vendas } = useTable("vendas");
  const [modal, setModal] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [erroCliente, setErroCliente] = useState(null);
  // aniversario removido — coluna não existe no banco
  const empty = { nome: "", whatsapp: "", instagram: "", cidade: "", time_favorito: "", obs: "" };
  const [form, setForm] = useState(empty);

  const clienteVendas = (nome) => vendas.filter(v => v.cliente_nome === nome);
  const msgWhats = (nome, valor) => encodeURIComponent(`Fala, ${nome}! Passando para lembrar do pagamento de ${fmt(valor)} da Vibra FC. Pode fazer o PIX e me manda o comprovante. Obrigado! ⚡`);

  const salvar = async () => {
    if (!form.nome.trim()) { setErroCliente("O nome do cliente é obrigatório."); return; }
    const duplicado = rows.find(r => r.nome.trim().toLowerCase() === form.nome.trim().toLowerCase());
    if (duplicado) { setErroCliente(`Já existe um cliente com o nome "${duplicado.nome}".`); return; }
    setSaving(true);
    setErroCliente(null);
    try {
      await add(form);
      setModal(false);
      setForm(empty);
    } catch (e) {
      setErroCliente(e.message || "Erro ao salvar cliente. Tente novamente.");
    } finally { setSaving(false); }
  };

  const excluir = async (id) => { if (confirm("Excluir cliente?")) await remove(id); };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total de Clientes" value={rows.length} icon="👥" />
        <KpiCard label="Com compras" value={[...new Set(vendas.map(v => v.cliente_nome))].length} icon="🛍️" />
        <KpiCard label="Faturamento Total" value={fmt(vendas.reduce((a, v) => a + Number(v.valor || 0), 0))} icon="💰" />
      </div>
      <SectionHeader title="CRM de Clientes" action={<Btn onClick={() => setModal(true)}>+ Novo Cliente</Btn>} />
      <div style={S.card}>
        <Table
          cols={[
            { key: "nome", label: "Nome", render: (v, r) => <button onClick={() => setDetalhe(r)} style={{ background: "none", border: "none", color: C.yellow, cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0 }}>{v}</button> },
            { key: "cidade", label: "Cidade" },
            { key: "time_favorito", label: "Time" },
            { key: "nome", label: "Compras", align: "center", render: (v) => clienteVendas(v).length },
            { key: "nome", label: "Total Gasto", align: "right", render: (v) => <span style={{ color: C.yellow, fontWeight: 700 }}>{fmt(clienteVendas(v).reduce((a, x) => a + Number(x.valor || 0), 0))}</span> },
            { key: "id", label: "", render: (v) => <button onClick={() => excluir(v)} style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 11 }}>🗑</button> },
          ]}
          rows={rows}
          emptyMsg="Nenhum cliente cadastrado ainda."
        />
      </div>

      {detalhe && (
        <Modal title={detalhe.nome} onClose={() => setDetalhe(null)}>
          {(() => {
            const cv = clienteVendas(detalhe.nome);
            const total = cv.reduce((a, v) => a + Number(v.valor || 0), 0);
            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <KpiCard label="Compras" value={cv.length} />
                  <KpiCard label="Total Gasto" value={fmt(total)} accent={C.yellow} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, marginBottom: 16 }}>
                  {detalhe.whatsapp && <div><span style={S.label}>WhatsApp: </span><span style={{ color: C.text }}>{detalhe.whatsapp}</span></div>}
                  {detalhe.instagram && <div><span style={S.label}>Instagram: </span><span style={{ color: C.text }}>{detalhe.instagram}</span></div>}
                  {detalhe.cidade && <div><span style={S.label}>Cidade: </span><span style={{ color: C.text }}>{detalhe.cidade}</span></div>}
                  {detalhe.time_favorito && <div><span style={S.label}>Time: </span><span style={{ color: C.text }}>{detalhe.time_favorito}</span></div>}
                </div>
                {detalhe.obs && (
                  <div style={{ background: C.yellowBg, borderRadius: 8, padding: 14, fontSize: 13, color: C.text, marginBottom: 14 }}>
                    <div style={{ ...S.label, marginBottom: 6 }}>Observações</div>{detalhe.obs}
                  </div>
                )}
                {detalhe.whatsapp && (
                  <a href={`https://wa.me/55${detalhe.whatsapp}?text=${msgWhats(detalhe.nome, total)}`} target="_blank" rel="noreferrer">
                    <Btn>💬 Abrir WhatsApp</Btn>
                  </a>
                )}
              </>
            );
          })()}
        </Modal>
      )}

      {modal && (
        <Modal title="Novo Cliente" onClose={() => { setModal(false); setErroCliente(null); setForm(empty); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}><Field label="Nome *"><Input value={form.nome} onChange={e => { setErroCliente(null); setForm({ ...form, nome: e.target.value }); }} placeholder="Nome completo" /></Field></div>
            <Field label="WhatsApp"><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="11999990000" /></Field>
            <Field label="Instagram"><Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" /></Field>
            <Field label="Cidade"><Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></Field>
            <Field label="Time Favorito"><Input value={form.time_favorito} onChange={e => setForm({ ...form, time_favorito: e.target.value })} /></Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Observações"><Input value={form.obs} onChange={e => setForm({ ...form, obs: e.target.value })} placeholder="Preferências, indicações, observações..." /></Field></div>
          </div>
          {erroCliente && <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 4 }}>❌ {erroCliente}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar Cliente"}</Btn>
            <Btn ghost onClick={() => { setModal(false); setErroCliente(null); setForm(empty); }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: PEDIDOS
// ============================================================
const KANBAN_COLS = [
  { key: "Aguardando pagamento", label: "Aguard. Pgto", color: C.warn },
  { key: "Pago", label: "Pago", color: C.info },
  { key: "Separado", label: "Separado", color: C.yellow },
  { key: "Enviado", label: "Enviado", color: C.warn },
  { key: "Entregue", label: "Entregue", color: C.success },
  { key: "Finalizado", label: "Finalizado", color: C.success },
];

function Pedidos() {
  const { rows, loading, add, edit } = useTable("pedidos");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const empty = { cliente: "", produto: "", tamanho: "M", quantidade: 1, valor: "", data: today(), status: "Aguardando pagamento" };
  const [form, setForm] = useState(empty);

  const moverStatus = async (id, status) => { await edit(id, { status }); };

  const salvar = async () => {
    if (!form.cliente) return;
    setSaving(true);
    try {
      await add({ ...form, quantidade: Number(form.quantidade), valor: Number(form.valor) });
      setModal(false);
      setForm(empty);
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <SectionHeader title="Pedidos — Kanban" action={<Btn onClick={() => setModal(true)}>+ Novo Pedido</Btn>} />
      <div style={{ overflowX: "auto", paddingBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, minWidth: 900 }}>
          {KANBAN_COLS.map(col => {
            const cards = rows.filter(p => p.status === col.key);
            return (
              <div key={col.key} style={{ flex: "0 0 180px", background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, minHeight: 300 }}>
                <div style={{ ...S.label, color: col.color, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>{col.label}</span>
                  <span style={{ background: col.color + "22", color: col.color, borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>{cards.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cards.map(card => (
                    <div key={card.id} style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 12, color: C.text, fontWeight: 700, marginBottom: 4 }}>{card.cliente}</div>
                      <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{card.produto} — {card.tamanho}</div>
                      <div style={{ fontSize: 12, color: C.yellow, fontWeight: 700, marginBottom: 8 }}>{fmt(card.valor)}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {KANBAN_COLS.filter(k => k.key !== card.status).slice(0, 2).map(k => (
                          <button key={k.key} onClick={() => moverStatus(card.id, k.key)} style={{ fontSize: 10, padding: "2px 7px", background: k.color + "22", color: k.color, border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700 }}>
                            → {k.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <Modal title="Novo Pedido" onClose={() => setModal(false)}>
          <Field label="Cliente"><Input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} /></Field>
          <Field label="Produto"><Input value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="Tamanho"><Select value={form.tamanho} onChange={e => setForm({ ...form, tamanho: e.target.value })} options={["PP", "P", "M", "G", "GG", "2GG", "3GG", "4GG"]} /></Field>
            <Field label="Qtd"><Input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></Field>
            <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
          </div>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar Pedido"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: FIADO
// ============================================================
function Fiado() {
  const { rows, loading, add, edit } = useTable("fiado");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const empty = { cliente: "", whatsapp: "", produto: "", valor: "", data: today(), vencimento: "", status: "Pendente" };
  const [form, setForm] = useState(empty);

  const pendentes = rows.filter(f => f.status !== "Pago");
  const atrasados = rows.filter(f => f.status === "Atrasado");
  const total = pendentes.reduce((a, f) => a + Number(f.valor || 0), 0);

  const marcarPago = async (id) => { await edit(id, { status: "Pago" }); };
  const msg = (nome, valor) => encodeURIComponent(`Fala, ${nome}, tudo certo? Passando para lembrar do pagamento de ${fmt(valor)} da Vibra FC. Assim que fizer o PIX, me manda o comprovante. Obrigado! ⚡`);

  const salvar = async () => {
    if (!form.cliente || !form.valor) return;
    setSaving(true);
    try {
      await add({ ...form, valor: Number(form.valor) });
      setModal(false);
      setForm(empty);
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="A Receber Total" value={fmt(total)} accent={C.warn} icon="⏳" />
        <KpiCard label="Atrasados" value={atrasados.length} accent={C.danger} icon="🚨" />
        <KpiCard label="Pendentes" value={pendentes.length} icon="👤" />
      </div>

      {atrasados.length > 0 && (
        <div style={{ ...S.card, background: C.dangerBg, border: `1px solid ${C.danger}33`, marginBottom: 20 }}>
          <div style={{ ...S.sectionTitle, color: C.danger }}>🚨 Pagamentos Atrasados</div>
          {atrasados.map(f => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{f.cliente}</div>
                <div style={{ color: C.gray, fontSize: 12 }}>{f.produto} — venceu {f.vencimento}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: C.danger, fontWeight: 700 }}>{fmt(f.valor)}</span>
                <a href={`https://wa.me/55${f.whatsapp}?text=${msg(f.cliente, f.valor)}`} target="_blank" rel="noreferrer">
                  <Btn style={{ ...S.btn, padding: "6px 12px", fontSize: 11 }}>💬 Cobrar</Btn>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionHeader title="Fiado e Contas a Receber" action={<Btn onClick={() => setModal(true)}>+ Registrar Fiado</Btn>} />
      <div style={S.card}>
        <Table
          cols={[
            { key: "cliente", label: "Cliente" },
            { key: "produto", label: "Produto" },
            { key: "valor", label: "Valor", align: "right", render: v => fmt(v) },
            { key: "vencimento", label: "Vencimento" },
            { key: "status", label: "Status", render: v => <Badge status={v} /> },
            { key: "id", label: "Ações", render: (v, r) => (
              <div style={{ display: "flex", gap: 6 }}>
                {r.status !== "Pago" && <>
                  <button onClick={() => marcarPago(v)} style={{ ...S.btn, padding: "4px 10px", fontSize: 11 }}>✓ Pago</button>
                  {r.whatsapp && <a href={`https://wa.me/55${r.whatsapp}?text=${msg(r.cliente, r.valor)}`} target="_blank" rel="noreferrer"><button style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 11 }}>💬</button></a>}
                </>}
              </div>
            )},
          ]}
          rows={rows}
          emptyMsg="Nenhum fiado registrado."
        />
      </div>

      {modal && (
        <Modal title="Registrar Fiado" onClose={() => setModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Cliente"><Input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} /></Field>
            <Field label="WhatsApp"><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="11999990000" /></Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Produto"><Input value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })} /></Field></div>
            <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
            <Field label="Vencimento"><Input type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: FINANCEIRO
// ============================================================
function Financeiro() {
  const { rows: manual, loading: loadingFin, add } = useTable("financeiro");
  const { rows: vendas, loading: loadingVendas } = useTable("vendas");
  const { rows: compras, loading: loadingCompras } = useTable("compras");
  const [modal, setModal] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [periodoFiltro, setPeriodoFiltro] = useState("todos");
  const [saving, setSaving] = useState(false);
  const [erroFin, setErroFin] = useState(null);
  const empty = { tipo: "saida", categoria: "Outros", descricao: "", valor: "", data: today(), forma_pagamento: "" };
  const [form, setForm] = useState(empty);

  // ── Entradas automáticas: vendas não canceladas ────────────
  const autoEntradas = vendas
    .filter(v => !isVendaCancelada(v))
    .map(v => ({
      id: `venda_${v.id}`,
      tipo: "entrada",
      categoria: "Venda",
      descricao: `Venda – ${v.cliente_nome || "Cliente"} – ${v.produto_nome || ""} ${v.tamanho || ""}`.trim(),
      valor: Number(v.valor || 0),
      data: v.data,
      forma_pagamento: v.forma_pagamento || "",
      origem: "venda",
      origem_id: v.id,
    }));

  // ── Saídas automáticas: compras ────────────────────────────
  // Agrupa por fornecedor+data para evitar duplicar linhas de um mesmo pedido multi-item
  const pedidosMap = new Map();
  compras.forEach(c => {
    const key = `${c.fornecedor}|${c.data}`;
    if (!pedidosMap.has(key)) pedidosMap.set(key, { fornecedor: c.fornecedor, data: c.data, total: 0, ids: [] });
    const g = pedidosMap.get(key);
    g.total += Number(c.total || 0);
    g.ids.push(c.id);
  });
  const autoSaidas = [...pedidosMap.entries()].map(([key, g]) => ({
    id: `compra_${key}`,
    tipo: "saida",
    categoria: "Compra de estoque",
    descricao: `Compra – ${g.fornecedor}`,
    valor: g.total,
    data: g.data,
    forma_pagamento: "",
    origem: "compra",
    origem_id: key,
  }));

  // ── Lançamentos manuais ────────────────────────────────────
  const manualRows = manual.map(m => ({ ...m, origem: "manual" }));

  // ── Unificado ──────────────────────────────────────────────
  const todasMovs = [...autoEntradas, ...autoSaidas, ...manualRows]
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  // ── Filtro por período ──────────────────────────────────────
  const hoje = new Date();
  const movsFiltradas = todasMovs.filter(m => {
    if (periodoFiltro === "mes") {
      const d = new Date(m.data);
      return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
    }
    if (periodoFiltro === "ano") return new Date(m.data).getFullYear() === hoje.getFullYear();
    return true;
  }).filter(m => filtro === "todos" || m.tipo === filtro);

  // ── KPIs ──────────────────────────────────────────────────
  const totEntradas = movsFiltradas.filter(m => m.tipo === "entrada").reduce((a, m) => a + Number(m.valor || 0), 0);
  const totSaidas = movsFiltradas.filter(m => m.tipo === "saida").reduce((a, m) => a + Number(m.valor || 0), 0);
  const saldo = totEntradas - totSaidas;
  const receitaVendas = autoEntradas.reduce((a, m) => a + m.valor, 0);
  const custoCompras = autoSaidas.reduce((a, m) => a + m.valor, 0);
  const lucroVendas = vendas.filter(v => !isVendaCancelada(v)).reduce((a, v) => a + Number(v.lucro || 0), 0);
  const margem = receitaVendas > 0 ? (lucroVendas / receitaVendas) * 100 : 0;

  // ── Por forma de pagamento ────────────────────────────────
  const porPgto = {};
  autoEntradas.forEach(m => { porPgto[m.forma_pagamento || "Outro"] = (porPgto[m.forma_pagamento || "Outro"] || 0) + m.valor; });

  const salvar = async () => {
    if (!form.descricao || !form.valor) { setErroFin("Preencha descrição e valor."); return; }
    setSaving(true);
    setErroFin(null);
    try {
      const payload = { tipo: form.tipo, categoria: form.categoria, descricao: form.descricao, valor: Number(form.valor), data: form.data };
      if (form.forma_pagamento) payload.forma_pagamento = form.forma_pagamento;
      await add(payload);
      setModal(false);
      setForm(empty);
    } catch (e) {
      setErroFin(e.message || "Erro ao salvar lançamento.");
    } finally { setSaving(false); }
  };

  if (loadingFin || loadingVendas || loadingCompras) return <Loading />;

  return (
    <div>
      {/* KPIs principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
        <KpiCard label="Entradas" value={fmt(totEntradas)} accent={C.success} icon="📈" />
        <KpiCard label="Saídas" value={fmt(totSaidas)} accent={C.danger} icon="📉" />
        <KpiCard label="Saldo" value={fmt(saldo)} accent={saldo >= 0 ? C.yellow : C.danger} icon="💵" />
      </div>
      {/* KPIs secundários */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Receita Vendas" value={fmt(receitaVendas)} accent={C.success} icon="🛍️" />
        <KpiCard label="Custo Compras" value={fmt(custoCompras)} accent={C.danger} icon="📦" />
        <KpiCard label="Lucro Líquido" value={fmt(lucroVendas)} accent={C.yellow} icon="✨" />
        <KpiCard label="Margem" value={`${margem.toFixed(1)}%`} accent={margem >= 30 ? C.success : margem >= 15 ? C.warn : C.danger} icon="📊" />
      </div>

      {/* Por forma de pagamento */}
      {Object.keys(porPgto).length > 0 && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={S.sectionTitle}>Receita por Forma de Pagamento</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {Object.entries(porPgto).sort((a, b) => b[1] - a[1]).map(([pgto, val]) => (
              <div key={pgto} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", minWidth: 120 }}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{pgto}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.success }}>{fmt(val)}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{receitaVendas > 0 ? ((val / receitaVendas) * 100).toFixed(0) : 0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionHeader title="Movimentações" action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Filtro período */}
          {["todos", "mes", "ano"].map(p => (
            <button key={p} onClick={() => setPeriodoFiltro(p)} style={{ ...S.btnGhost, padding: "6px 12px", fontSize: 11, background: periodoFiltro === p ? C.infoBg : "transparent", color: periodoFiltro === p ? C.info : C.gray, borderColor: periodoFiltro === p ? C.info : C.border }}>
              {p === "todos" ? "Tudo" : p === "mes" ? "Este mês" : "Este ano"}
            </button>
          ))}
          <div style={{ width: 1, background: C.border }} />
          {/* Filtro tipo */}
          {["todos", "entrada", "saida"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ ...S.btnGhost, padding: "6px 12px", fontSize: 11, background: filtro === f ? C.yellowBg : "transparent", color: filtro === f ? C.yellow : C.gray, borderColor: filtro === f ? C.yellow : C.border }}>
              {f === "todos" ? "Todos" : f === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
          <Btn onClick={() => { setErroFin(null); setModal(true); }}>+ Lançamento</Btn>
        </div>
      } />
      <div style={S.card}>
        <Table
          cols={[
            { key: "data", label: "Data" },
            { key: "tipo", label: "Tipo", render: v => <span style={{ color: v === "entrada" ? C.success : C.danger, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{v === "entrada" ? "↑ Entrada" : "↓ Saída"}</span> },
            { key: "categoria", label: "Categoria" },
            { key: "descricao", label: "Descrição" },
            { key: "origem", label: "Origem", render: v => {
              if (v === "venda") return <span style={S.badge(C.success, C.successBg)}>Venda</span>;
              if (v === "compra") return <span style={S.badge(C.info, C.infoBg)}>Compra</span>;
              return <span style={S.badge(C.gray, "#222")}>Manual</span>;
            }},
            { key: "valor", label: "Valor", align: "right", render: (v, r) => <span style={{ color: r.tipo === "entrada" ? C.success : C.danger, fontWeight: 700 }}>{r.tipo === "saida" ? "−" : "+"}{fmt(v)}</span> },
          ]}
          rows={movsFiltradas}
          emptyMsg="Nenhuma movimentação no período."
        />
      </div>

      {modal && (
        <Modal title="Novo Lançamento Manual" onClose={() => setModal(false)}>
          <div style={{ background: C.infoBg, border: `1px solid ${C.info}33`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: C.textMuted, marginBottom: 14 }}>
            ℹ️ Use para despesas e receitas avulsas (motoboy, embalagem, etc). Vendas e compras são lançadas automaticamente.
          </div>
          <Field label="Tipo"><Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} options={[{ value: "saida", label: "Saída (Despesa)" }, { value: "entrada", label: "Entrada (Receita extra)" }]} /></Field>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
              options={form.tipo === "entrada" ? ["Frete cobrado", "Personalização", "Outra receita"] : ["Motoboy", "Tráfego pago", "Marketing", "Parcerias", "Embalagens", "Assinaturas", "Taxas", "Outros"]} />
          </Field>
          <Field label="Descrição"><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Motoboy entrega bairro X" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
            <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
          </div>
          {erroFin && <div style={{ background: C.dangerBg, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 4 }}>❌ {erroFin}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar Lançamento"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: METAS
// ============================================================
function Metas() {
  const { rows, loading, add, edit, remove } = useTable("metas");
  const { rows: vendas } = useTable("vendas");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const empty = { tipo: "", meta: "", atual: 0, unidade: "R$" };
  const [form, setForm] = useState(empty);

  const fatTotal = vendas.reduce((a, v) => a + Number(v.valor || 0), 0);
  const lucroTotal = vendas.reduce((a, v) => a + Number(v.lucro || 0), 0);

  const getAtual = (m) => {
    if (m.tipo === "Faturamento") return fatTotal;
    if (m.tipo === "Lucro") return lucroTotal;
    if (m.tipo === "Qtd vendas") return vendas.length;
    if (m.tipo === "Ticket médio") return vendas.length > 0 ? fatTotal / vendas.length : 0;
    return Number(m.atual || 0);
  };

  const salvar = async () => {
    if (!form.tipo || !form.meta) return;
    setSaving(true);
    try {
      await add({ ...form, meta: Number(form.meta), atual: 0 });
      setModal(false);
      setForm(empty);
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <SectionHeader title="Metas" action={<Btn onClick={() => setModal(true)}>+ Nova Meta</Btn>} />
      {rows.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 40, color: C.gray }}>Nenhuma meta criada ainda. Defina sua primeira meta!</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {rows.map(m => {
            const atual = getAtual(m);
            const p = pct(atual, Number(m.meta));
            const cor = p >= 100 ? C.success : p >= 70 ? C.yellow : p >= 40 ? C.warn : C.danger;
            return (
              <div key={m.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.tipo}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ ...S.badge(cor, cor + "22"), fontSize: 13 }}>{p}%</span>
                    <button onClick={() => remove(m.id)} style={{ ...S.btnDanger, padding: "2px 8px", fontSize: 11 }}>🗑</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "baseline", marginBottom: 12 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: cor }}>{m.unidade === "R$" ? fmt(atual) : Math.round(atual)}</span>
                  <span style={{ fontSize: 13, color: C.gray }}>de {m.unidade === "R$" ? fmt(m.meta) : `${m.meta} ${m.unidade}`}</span>
                </div>
                <ProgressBar value={atual} max={Number(m.meta)} color={cor} />
                {p >= 100
                  ? <div style={{ marginTop: 10, fontSize: 12, color: C.success, fontWeight: 700 }}>✅ Meta atingida!</div>
                  : <div style={{ marginTop: 10, fontSize: 12, color: C.gray }}>Faltam: <span style={{ color: C.text }}>{m.unidade === "R$" ? fmt(Number(m.meta) - atual) : `${Math.round(Number(m.meta) - atual)} ${m.unidade}`}</span></div>
                }
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Nova Meta" onClose={() => setModal(false)}>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
              options={[{ value: "", label: "Selecione..." }, "Faturamento", "Lucro", "Qtd vendas", "Ticket médio", "Outro"]} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <Field label="Valor da Meta"><Input type="number" value={form.meta} onChange={e => setForm({ ...form, meta: e.target.value })} /></Field>
            <Field label="Unidade"><Select value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} options={["R$", "un", "%"]} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Criar Meta"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: FORNECEDORES
// ============================================================
function Fornecedores() {
  const { rows: fornecedores, loading, add: addForn } = useTable("fornecedores", "nome.asc");
  const { rows: compras, add: addCompra, edit: editCompra, remove: removeCompra } = useTable("compras");
  const { rows: produtos, reload: reloadProdutos } = useTable("produtos", "nome.asc");
  const [aba, setAba] = useState("fornecedores");
  const [modalForn, setModalForn] = useState(false);
  const [modalCompra, setModalCompra] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(null);
  const [expandido, setExpandido] = useState({});
  const [saving, setSaving] = useState(false);
  const [erroPedido, setErroPedido] = useState(null);
  const emptyF = { nome: "", whatsapp: "", instagram: "", cidade: "", prazo: "", obs: "" };
  const emptyHeader = { fornecedor: "", data: today(), prazo_entrega: "", frete: "" };
  const emptyItem = { produto_nome: "", tamanho: "M", quantidade: "", valor_unit: "" };
  const [formF, setFormF] = useState(emptyF);
  const [pedidoHeader, setPedidoHeader] = useState(emptyHeader);
  const [pedidoItens, setPedidoItens] = useState([{ ...emptyItem }]);

  const produtosUnicos = [...new Set(produtos.map(p => p.nome))].sort();
  const comprasAtivas = compras.filter(c => c.status !== "Cancelado");
  const totalInvestido = comprasAtivas.reduce((a, c) => a + Number(c.total || 0), 0);

  // Agrupa compras por fornecedor+data (pedido)
  const pedidosMap = compras.reduce((acc, c) => {
    const key = `${c.fornecedor}|${c.data}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});
  const pedidosOrdenados = Object.entries(pedidosMap).sort((a, b) =>
    (b[1][0].data || "").localeCompare(a[1][0].data || "")
  );

  // Subtotal do carrinho em construção
  const subtotalPedido = pedidoItens.reduce((a, i) => a + (Number(i.quantidade) || 0) * (Number(i.valor_unit) || 0), 0);
  const fretePedido = Number(pedidoHeader.frete) || 0;
  const totalPedidoForm = subtotalPedido + fretePedido;
  const totalPecasForm = pedidoItens.reduce((a, i) => a + (Number(i.quantidade) || 0), 0);

  const addItem = () => setPedidoItens(prev => [...prev, { ...emptyItem }]);
  const removeItem = (idx) => setPedidoItens(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => setPedidoItens(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const SIZES = ["PP", "P", "M", "G", "GG", "2GG", "3GG", "4GG"];
  const parseProduto = (compra) => {
    if (compra.produto_nome && compra.tamanho) return { nome: compra.produto_nome, tamanho: compra.tamanho };
    const parts = (compra.produto || "").trim().split(" ");
    const last = parts[parts.length - 1];
    if (SIZES.includes(last)) return { nome: parts.slice(0, -1).join(" "), tamanho: last };
    return { nome: compra.produto || "", tamanho: "" };
  };
  const getProdEstoque = (compra) => {
    const { nome, tamanho } = parseProduto(compra);
    if (nome && tamanho) return produtos.find(p => p.nome === nome && p.tamanho === tamanho);
    return produtos.find(p => p.nome === nome);
  };

  const calcImpacto = (compra) => {
    const prod = getProdEstoque(compra);
    const qtdCompra = Number(compra.quantidade);
    const estoqueAtual = Number(prod?.quantidade ?? 0);
    return { prod, jaVendido: Math.max(0, qtdCompra - estoqueAtual), podeRemover: Math.min(qtdCompra, estoqueAtual), qtdCompra, estoqueAtual };
  };

  const salvarForn = async () => {
    if (!formF.nome) return;
    setSaving(true);
    try { await addForn(formF); setModalForn(false); setFormF(emptyF); } finally { setSaving(false); }
  };

  const fecharModalCompra = () => {
    setModalCompra(false);
    setPedidoItens([{ ...emptyItem }]);
    setPedidoHeader(emptyHeader);
    setErroPedido(null);
  };

  const salvarPedido = async () => {
    const itensValidos = pedidoItens.filter(i => i.produto_nome && i.quantidade && i.valor_unit);
    if (!pedidoHeader.fornecedor || itensValidos.length === 0) return;
    setSaving(true);
    setErroPedido(null);
    try {
      for (const item of itensValidos) {
        const qtd = Number(String(item.quantidade).replace(",", "."));
        const vunit = Number(String(item.valor_unit).replace(",", "."));
        const itemSubtotal = qtd * vunit;
        const freteRateado = subtotalPedido > 0 ? (itemSubtotal / subtotalPedido) * fretePedido : 0;
        const total = itemSubtotal + freteRateado;
        const custoReal = qtd > 0 ? total / qtd : 0;

        // Envia apenas as colunas que existem na tabela original de compras
        await addCompra({
          fornecedor: pedidoHeader.fornecedor,
          produto: `${item.produto_nome} ${item.tamanho}`.trim(),
          quantidade: qtd,
          valor_unit: vunit,
          frete: freteRateado,
          total,
          data: pedidoHeader.data,
          prazo_entrega: pedidoHeader.prazo_entrega || null,
          status: "Pedido realizado",
        });

        // Atualiza ou cria produto no estoque — erro aqui não cancela o pedido já salvo
        try {
          const prod = produtos.find(p => p.nome === item.produto_nome && p.tamanho === item.tamanho);
          if (prod) {
            await db.update("produtos", prod.id, { quantidade: Number(prod.quantidade) + qtd, custo: custoReal });
          } else {
            // Produto/tamanho novo: cria a variação no estoque
            await db.insert("produtos", {
              nome: item.produto_nome,
              tamanho: item.tamanho,
              quantidade: qtd,
              custo: custoReal,
              preco: 0,
              categoria: "Torcedor",
              clube: "",
              temporada: "",
              cor: "",
              obs: `Criado automaticamente via compra de ${pedidoHeader.fornecedor}`,
            });
          }
        } catch (estoqueErr) {
          console.warn("Estoque não atualizado para", item.produto_nome, item.tamanho, ":", estoqueErr.message);
        }
      }
      await reloadProdutos();
      fecharModalCompra();
    } catch (e) {
      setErroPedido(e.message || "Erro ao salvar o pedido. Verifique os campos e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // Cancelar / excluir item individual
  const abrirCancelarItem = (c) => { if (c.status !== "Cancelado") setModalConfirm({ tipo: "cancelar", compra: c, ...calcImpacto(c) }); };
  const confirmarCancelarItem = async () => {
    const { compra, prod, podeRemover } = modalConfirm;
    setSaving(true);
    try {
      await editCompra(compra.id, { status: "Cancelado" });
      if (prod && podeRemover > 0) { await db.update("produtos", prod.id, { quantidade: Number(prod.quantidade) - podeRemover }); await reloadProdutos(); }
      setModalConfirm(null);
    } finally { setSaving(false); }
  };
  const abrirExcluirItem = (c) => setModalConfirm({ tipo: "excluir", compra: c, ...calcImpacto(c) });
  const confirmarExcluirItem = async () => {
    const { compra, prod, podeRemover } = modalConfirm;
    setSaving(true);
    try {
      if (compra.status !== "Cancelado" && prod && podeRemover > 0) { await db.update("produtos", prod.id, { quantidade: Number(prod.quantidade) - podeRemover }); await reloadProdutos(); }
      await removeCompra(compra.id);
      setModalConfirm(null);
    } finally { setSaving(false); }
  };

  // Cancelar / excluir pedido inteiro
  const abrirCancelarPedido = (itens) => setModalConfirm({ tipo: "cancelar_pedido", itens });
  const confirmarCancelarPedido = async () => {
    setSaving(true);
    try {
      for (const c of modalConfirm.itens.filter(x => x.status !== "Cancelado")) {
        await editCompra(c.id, { status: "Cancelado" });
        const { prod, podeRemover } = calcImpacto(c);
        if (prod && podeRemover > 0) await db.update("produtos", prod.id, { quantidade: Number(prod.quantidade) - podeRemover });
      }
      await reloadProdutos();
      setModalConfirm(null);
    } finally { setSaving(false); }
  };
  const abrirExcluirPedido = (itens) => setModalConfirm({ tipo: "excluir_pedido", itens });
  const confirmarExcluirPedido = async () => {
    setSaving(true);
    try {
      for (const c of modalConfirm.itens) {
        if (c.status !== "Cancelado") {
          const { prod, podeRemover } = calcImpacto(c);
          if (prod && podeRemover > 0) await db.update("produtos", prod.id, { quantidade: Number(prod.quantidade) - podeRemover });
        }
        await removeCompra(c.id);
      }
      await reloadProdutos();
      setModalConfirm(null);
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total em Compras" value={fmt(totalInvestido)} icon="💸" />
        <KpiCard label="Em Trânsito" value={compras.filter(c => c.status === "Em trânsito").length} accent={C.warn} icon="🚚" />
        <KpiCard label="Fornecedores" value={fornecedores.length} icon="🏭" />
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[{ key: "fornecedores", label: "Fornecedores" }, { key: "compras", label: "Histórico de Compras" }].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: aba === a.key ? C.yellow : C.surface, color: aba === a.key ? "#000" : C.gray }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "fornecedores" && (
        <>
          <SectionHeader title="Fornecedores" action={<Btn onClick={() => setModalForn(true)}>+ Novo Fornecedor</Btn>} />
          {fornecedores.length === 0
            ? <div style={{ ...S.card, textAlign: "center", padding: 40, color: C.gray }}>Nenhum fornecedor cadastrado.</div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {fornecedores.map(f => (
                <div key={f.id} style={S.card}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.white, marginBottom: 4 }}>{f.nome}</div>
                  <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{f.cidade} · ⏱ {f.prazo}</div>
                  {f.obs && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>{f.obs}</div>}
                  {f.whatsapp && <a href={`https://wa.me/55${f.whatsapp}`} target="_blank" rel="noreferrer"><Btn style={{ ...S.btn, padding: "6px 14px", fontSize: 11 }}>💬 WhatsApp</Btn></a>}
                </div>
              ))}
            </div>
          }
        </>
      )}

      {aba === "compras" && (
        <>
          <SectionHeader title="Histórico de Pedidos" action={<Btn onClick={() => setModalCompra(true)}>+ Registrar Pedido</Btn>} />
          {pedidosOrdenados.length === 0
            ? <div style={{ ...S.card, textAlign: "center", padding: 40, color: C.gray }}>Nenhuma compra registrada.</div>
            : pedidosOrdenados.map(([key, itens]) => {
              const aberto = expandido[key];
              const totalPed = itens.reduce((a, c) => a + Number(c.total || 0), 0);
              const cancelados = itens.every(c => c.status === "Cancelado");
              const parcialCanc = !cancelados && itens.some(c => c.status === "Cancelado");
              const [forn, dataPed] = key.split("|");
              const statusRef = cancelados ? "Cancelado" : itens.find(c => c.status !== "Cancelado")?.status || itens[0]?.status;
              return (
                <div key={key} style={{ ...S.card, marginBottom: 12, opacity: cancelados ? 0.65 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, color: C.white, fontSize: 14 }}>{forn}</span>
                      <span style={{ fontSize: 12, color: C.gray }}>{dataPed}</span>
                      <Badge status={statusRef} />
                      {parcialCanc && <span style={{ fontSize: 11, color: C.warn }}>parcialmente cancelado</span>}
                      <span style={{ fontSize: 13, color: C.yellow, fontWeight: 700 }}>{fmt(totalPed)}</span>
                      <span style={{ fontSize: 11, color: C.gray }}>{itens.length} item{itens.length > 1 ? "s" : ""} · {itens.reduce((a, c) => a + Number(c.quantidade || 0), 0)} peças</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {!cancelados && <button onClick={() => abrirCancelarPedido(itens)} style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 11 }}>✕ Cancelar Tudo</button>}
                      <button onClick={() => abrirExcluirPedido(itens)} style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 11 }}>🗑 Excluir Tudo</button>
                      <button onClick={() => setExpandido(e => ({ ...e, [key]: !e[key] }))} style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 11 }}>{aberto ? "▲ Fechar" : "▼ Ver Itens"}</button>
                    </div>
                  </div>
                  {aberto && (
                    <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14, overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr>{["Produto", "Tam.", "Qtd", "Unit.", "Frete Rat.", "Total", "Custo/un", "Status", ""].map(h => (
                            <th key={h} style={{ ...S.label, textAlign: "left", padding: "0 8px 8px", whiteSpace: "nowrap" }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {itens.map(c => {
                            const { nome: pNome, tamanho: pTam } = parseProduto(c);
                            const custoUnit = Number(c.quantidade) > 0 ? Number(c.total) / Number(c.quantidade) : 0;
                            return (
                              <tr key={c.id} style={{ borderTop: `1px solid ${C.border}`, opacity: c.status === "Cancelado" ? 0.5 : 1 }}>
                                <td style={{ padding: "8px", color: C.text }}>{pNome}</td>
                                <td style={{ padding: "8px", color: C.text }}>{pTam}</td>
                                <td style={{ padding: "8px", color: C.text, textAlign: "center" }}>{c.quantidade}</td>
                                <td style={{ padding: "8px", color: C.text }}>{fmt(c.valor_unit)}</td>
                                <td style={{ padding: "8px", color: C.gray }}>{fmt(c.frete)}</td>
                                <td style={{ padding: "8px", color: c.status === "Cancelado" ? C.gray : C.yellow, fontWeight: 700, textDecoration: c.status === "Cancelado" ? "line-through" : "none" }}>{fmt(c.total)}</td>
                                <td style={{ padding: "8px", color: C.success }}>{fmt(custoUnit)}</td>
                                <td style={{ padding: "8px" }}>
                                  {c.status === "Cancelado" ? <Badge status="Cancelado" /> : (
                                    <select value={c.status} onChange={e => {
                                      if (e.target.value === "Cancelado") abrirCancelarItem(c);
                                      else editCompra(c.id, { status: e.target.value });
                                    }} style={{ ...S.input, padding: "3px 6px", fontSize: 11, width: "auto" }}>
                                      {["Pedido realizado", "Aguardando envio", "Em trânsito", "Recebido", "Cancelado"].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                  )}
                                </td>
                                <td style={{ padding: "8px" }}>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    {c.status !== "Cancelado" && <button onClick={() => abrirCancelarItem(c)} style={{ ...S.btnDanger, padding: "3px 7px", fontSize: 10 }}>✕</button>}
                                    <button onClick={() => abrirExcluirItem(c)} style={{ ...S.btnDanger, padding: "3px 7px", fontSize: 10 }}>🗑</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          }
        </>
      )}

      {modalForn && (
        <Modal title="Novo Fornecedor" onClose={() => setModalForn(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}><Field label="Nome"><Input value={formF.nome} onChange={e => setFormF({ ...formF, nome: e.target.value })} /></Field></div>
            <Field label="WhatsApp"><Input value={formF.whatsapp} onChange={e => setFormF({ ...formF, whatsapp: e.target.value })} /></Field>
            <Field label="Cidade"><Input value={formF.cidade} onChange={e => setFormF({ ...formF, cidade: e.target.value })} /></Field>
            <Field label="Prazo médio"><Input value={formF.prazo} onChange={e => setFormF({ ...formF, prazo: e.target.value })} placeholder="Ex: 3-5 dias" /></Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Observações"><Input value={formF.obs} onChange={e => setFormF({ ...formF, obs: e.target.value })} /></Field></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvarForn} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Btn>
            <Btn ghost onClick={() => setModalForn(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal: Registrar Pedido Multi-Item */}
      {modalCompra && (
        <Modal title="Registrar Pedido de Compra" onClose={fecharModalCompra}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Fornecedor">
                <Select value={pedidoHeader.fornecedor} onChange={e => setPedidoHeader({ ...pedidoHeader, fornecedor: e.target.value })}
                  options={[{ value: "", label: "Selecione o fornecedor..." }, ...fornecedores.map(f => ({ value: f.nome, label: f.nome }))]} />
              </Field>
            </div>
            <Field label="Data da Compra"><Input type="date" value={pedidoHeader.data} onChange={e => setPedidoHeader({ ...pedidoHeader, data: e.target.value })} /></Field>
            <Field label="Prazo de Entrega"><Input type="date" value={pedidoHeader.prazo_entrega} onChange={e => setPedidoHeader({ ...pedidoHeader, prazo_entrega: e.target.value })} /></Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Frete Total (R$)"><Input type="number" value={pedidoHeader.frete} onChange={e => setPedidoHeader({ ...pedidoHeader, frete: e.target.value })} placeholder="0,00 — será rateado entre os itens" /></Field>
            </div>
          </div>

          <div style={{ ...S.label, marginBottom: 10 }}>Itens do Pedido</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {pedidoItens.map((item, idx) => {
              const tamOpts = ["PP", "P", "M", "G", "GG", "2GG", "3GG", "4GG"];
              const itemSub = (Number(item.quantidade) || 0) * (Number(item.valor_unit) || 0);
              const freteRat = subtotalPedido > 0 ? (itemSub / subtotalPedido) * fretePedido : 0;
              const custoUn = Number(item.quantidade) > 0 ? (itemSub + freteRat) / Number(item.quantidade) : 0;
              const noEstoque = !!produtos.find(p => p.nome === item.produto_nome && p.tamanho === item.tamanho);

              return (
                <div key={idx} style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.gray }}>ITEM {idx + 1}</span>
                    {pedidoItens.length > 1 && <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 15, lineHeight: 1 }}>✕</button>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ ...S.label, marginBottom: 4 }}>Produto</div>
                      <Input list={`pl-${idx}`} value={item.produto_nome} onChange={e => updateItem(idx, "produto_nome", e.target.value)} placeholder="Nome do produto" />
                      <datalist id={`pl-${idx}`}>{produtosUnicos.map(n => <option key={n} value={n} />)}</datalist>
                    </div>
                    <div>
                      <div style={{ ...S.label, marginBottom: 4 }}>Tamanho</div>
                      <Select value={item.tamanho} onChange={e => updateItem(idx, "tamanho", e.target.value)}
                        options={tamOpts.length > 0 ? tamOpts : ["PP", "P", "M", "G", "GG", "2GG", "3GG", "4GG"]} />
                    </div>
                    <div>
                      <div style={{ ...S.label, marginBottom: 4 }}>Qtd</div>
                      <Input type="number" value={item.quantidade} onChange={e => updateItem(idx, "quantidade", e.target.value)} />
                    </div>
                    <div>
                      <div style={{ ...S.label, marginBottom: 4 }}>Unit. (R$)</div>
                      <Input type="number" value={item.valor_unit} onChange={e => updateItem(idx, "valor_unit", e.target.value)} />
                    </div>
                  </div>
                  {itemSub > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: C.gray, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>Subtotal: <strong style={{ color: C.yellow }}>{fmt(itemSub)}</strong></span>
                      {fretePedido > 0 && <><span>Frete rat.: <strong>{fmt(freteRat)}</strong></span><span>Custo/un: <strong style={{ color: C.success }}>{fmt(custoUn)}</strong></span></>}
                      {item.produto_nome && <span style={{ color: noEstoque ? C.success : C.info }}>{noEstoque ? "✅ estoque será atualizado" : "🆕 será criado no estoque automaticamente"}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={addItem} style={{ ...S.btnGhost, width: "100%", marginBottom: 16, fontSize: 13, padding: "10px" }}>+ Adicionar Item</button>

          {subtotalPedido > 0 && (
            <div style={{ background: C.yellowBg, border: `1px solid ${C.yellow}33`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 20px", fontSize: 13 }}>
                <span style={{ color: C.textMuted }}>Subtotal produtos</span><span style={{ color: C.text, textAlign: "right" }}>{fmt(subtotalPedido)}</span>
                <span style={{ color: C.textMuted }}>Frete</span><span style={{ color: C.text, textAlign: "right" }}>{fmt(fretePedido)}</span>
                <span style={{ color: C.textMuted }}>Total de peças</span><span style={{ color: C.text, textAlign: "right" }}>{totalPecasForm} un.</span>
                <span style={{ color: C.yellow, fontWeight: 800 }}>Total geral</span><span style={{ color: C.yellow, fontWeight: 800, textAlign: "right" }}>{fmt(totalPedidoForm)}</span>
              </div>
            </div>
          )}

          {erroPedido && (
            <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 12 }}>
              ❌ {erroPedido}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {(() => {
              const validos = pedidoItens.filter(i => i.produto_nome && i.quantidade && i.valor_unit).length;
              return <Btn onClick={salvarPedido} disabled={saving || !pedidoHeader.fornecedor || validos === 0}>{saving ? "Salvando..." : `Registrar Pedido — ${validos} item${validos !== 1 ? "s" : ""}`}</Btn>;
            })()}
            <Btn ghost onClick={fecharModalCompra}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmação de cancelamento/exclusão */}
      {modalConfirm && (() => {
        const isPedido = modalConfirm.tipo === "cancelar_pedido" || modalConfirm.tipo === "excluir_pedido";
        const isExcluir = modalConfirm.tipo.startsWith("excluir");

        if (isPedido) {
          const { itens } = modalConfirm;
          const ativas = itens.filter(c => c.status !== "Cancelado");
          const totalUnsold = ativas.reduce((a, c) => a + calcImpacto(c).podeRemover, 0);
          return (
            <Modal title={isExcluir ? "Excluir Pedido Inteiro" : "Cancelar Pedido Inteiro"} onClose={() => setModalConfirm(null)}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: C.white, marginBottom: 4 }}>{itens[0]?.fornecedor} · {itens[0]?.data}</div>
                <div style={{ color: C.gray, fontSize: 12, marginBottom: 10 }}>{itens.length} item{itens.length > 1 ? "s" : ""} · {fmt(itens.reduce((a, c) => a + Number(c.total || 0), 0))}</div>
                <div style={{ fontSize: 12, color: C.success }}>✅ Serão removidas do estoque: <strong>{totalUnsold} unidades</strong> (apenas as ainda disponíveis)</div>
              </div>
              {isExcluir
                ? <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: C.danger }}>🗑️ Exclusão permanente — todos os {itens.length} itens serão removidos do histórico.</div>
                : <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>Os registros ficam no histórico com status <strong>Cancelado</strong> e não contam para relatórios.</div>
              }
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={isExcluir ? confirmarExcluirPedido : confirmarCancelarPedido} disabled={saving} style={{ ...S.btnDanger, padding: "10px 20px", fontSize: 13, fontWeight: 800 }}>
                  {saving ? "Processando..." : isExcluir ? "🗑 Confirmar Exclusão" : "✕ Confirmar Cancelamento"}
                </button>
                <Btn ghost onClick={() => setModalConfirm(null)}>Voltar</Btn>
              </div>
            </Modal>
          );
        }

        const { compra, prod, jaVendido, podeRemover, qtdCompra, estoqueAtual } = modalConfirm;
        const isExcCancelada = isExcluir && compra.status === "Cancelado";
        return (
          <Modal title={isExcluir ? "Excluir Item" : "Cancelar Item"} onClose={() => setModalConfirm(null)}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: C.white, marginBottom: 4 }}>{compra.produto_nome || compra.produto} {compra.tamanho}</div>
              <div style={{ color: C.gray, fontSize: 12, marginBottom: 10 }}>{compra.fornecedor} · {compra.data} · {fmt(compra.total)}</div>
              {!isExcCancelada && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                  <div>📦 Comprado: <strong style={{ color: C.white }}>{qtdCompra} un.</strong></div>
                  <div>🏬 Estoque atual: <strong style={{ color: estoqueAtual > 0 ? C.success : C.danger }}>{prod ? `${estoqueAtual} un.` : "produto não encontrado"}</strong></div>
                  {jaVendido > 0 && <div style={{ color: C.warn }}>🛍️ Já vendidas: <strong>{jaVendido} un.</strong> (histórico preservado)</div>}
                  <div style={{ color: C.success, fontWeight: 700 }}>✅ Serão removidas: {podeRemover} un.</div>
                  {jaVendido > 0 && <div style={{ background: C.warnBg, borderRadius: 6, padding: "6px 10px", marginTop: 4, color: C.warn }}>⚠️ {jaVendido} un. já vendidas não serão afetadas.</div>}
                </div>
              )}
              {isExcCancelada && <div style={{ fontSize: 12, color: C.gray }}>Compra já cancelada — apenas o registro será removido do histórico.</div>}
            </div>
            {isExcluir && !isExcCancelada && <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: C.danger }}>🗑️ A exclusão é permanente.</div>}
            {!isExcluir && <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>O registro ficará no histórico como <strong>Cancelado</strong> sem afetar relatórios.</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={isExcluir ? confirmarExcluirItem : confirmarCancelarItem} disabled={saving} style={{ ...S.btnDanger, padding: "10px 20px", fontSize: 13, fontWeight: 800 }}>
                {saving ? "Processando..." : isExcluir ? "🗑 Confirmar Exclusão" : "✕ Confirmar Cancelamento"}
              </button>
              <Btn ghost onClick={() => setModalConfirm(null)}>Voltar</Btn>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ============================================================
// MÓDULO: ENTREGAS
// ============================================================
function Entregas() {
  const { rows, loading, add, edit } = useTable("entregas");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const empty = { cliente: "", endereco: "", motoboy: "", valor: "", data: today(), status: "Aguardando envio" };
  const [form, setForm] = useState(empty);

  const salvar = async () => {
    if (!form.cliente) return;
    setSaving(true);
    try { await add({ ...form, valor: Number(form.valor) }); setModal(false); setForm(empty); } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  const ativas = rows.filter(e => e.status !== "Entregue");

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total Gasto" value={fmt(rows.reduce((a, e) => a + Number(e.valor || 0), 0))} icon="🚚" />
        <KpiCard label="Em Rota" value={rows.filter(e => e.status === "Saiu para entrega").length} accent={C.warn} icon="📍" />
        <KpiCard label="Entregues" value={rows.filter(e => e.status === "Entregue").length} accent={C.success} icon="✅" />
      </div>

      {ativas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={S.sectionTitle}>Em Andamento</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {ativas.map(e => (
              <div key={e.id} style={{ ...S.card, borderLeft: `3px solid ${e.status === "Saiu para entrega" ? C.warn : C.info}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{e.cliente}</div>
                  <Badge status={e.status} />
                </div>
                <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>📍 {e.endereco}<br />🏍 {e.motoboy}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C.yellow, fontWeight: 700 }}>{fmt(e.valor)}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {e.status === "Aguardando envio" && <button onClick={() => edit(e.id, { status: "Saiu para entrega" })} style={{ ...S.btn, padding: "5px 12px", fontSize: 11 }}>🏍 Saiu</button>}
                    {e.status === "Saiu para entrega" && <button onClick={() => edit(e.id, { status: "Entregue" })} style={{ ...S.btn, padding: "5px 12px", fontSize: 11 }}>✅ Entregue</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionHeader title="Histórico de Entregas" action={<Btn onClick={() => setModal(true)}>+ Nova Entrega</Btn>} />
      <div style={S.card}>
        <Table
          cols={[
            { key: "data", label: "Data" },
            { key: "cliente", label: "Cliente" },
            { key: "motoboy", label: "Motoboy" },
            { key: "valor", label: "Valor", align: "right", render: v => <span style={{ color: C.yellow, fontWeight: 700 }}>{fmt(v)}</span> },
            { key: "status", label: "Status", render: v => <Badge status={v} /> },
          ]}
          rows={rows}
          emptyMsg="Nenhuma entrega registrada."
        />
      </div>

      {modal && (
        <Modal title="Nova Entrega" onClose={() => setModal(false)}>
          <Field label="Cliente"><Input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} /></Field>
          <Field label="Endereço"><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Motoboy / Serviço"><Input value={form.motoboy} onChange={e => setForm({ ...form, motoboy: e.target.value })} /></Field>
            <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
            <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
            <Field label="Status"><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={["Aguardando envio", "Saiu para entrega", "Entregue"]} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO: DINHEIRO DO PEDRO
// ============================================================
function DinheiroPedro() {
  const { rows: retiradas, loading, add } = useTable("retiradas");
  const { rows: vendas } = useTable("vendas");
  const { rows: produtos } = useTable("produtos");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ valor: "", data: today(), motivo: "" });

  const totalRetirado = retiradas.reduce((a, r) => a + Number(r.valor || 0), 0);
  const lucroEmpresa = vendas.reduce((a, v) => a + Number(v.lucro || 0), 0);
  const valorEstoque = produtos.reduce((a, p) => a + Number(p.custo || 0) * Number(p.quantidade || 0), 0);
  const disponivel = lucroEmpresa - totalRetirado;

  const salvar = async () => {
    if (!form.valor) return;
    setSaving(true);
    try { await add({ ...form, valor: Number(form.valor) }); setModal(false); setForm({ valor: "", data: today(), motivo: "" }); } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 24, borderColor: C.yellow, background: "linear-gradient(135deg, #111 0%, #1a1500 100%)" }}>
        <div style={{ fontSize: 13, color: C.yellow, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>👑 Centro Financeiro do Pedro</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <div><div style={S.label}>Lucro da Empresa</div><div style={{ ...S.bigNumber, fontSize: 22, color: C.success, marginTop: 6 }}>{fmt(lucroEmpresa)}</div></div>
          <div><div style={S.label}>Total Retirado</div><div style={{ ...S.bigNumber, fontSize: 22, color: C.danger, marginTop: 6 }}>{fmt(totalRetirado)}</div></div>
          <div><div style={S.label}>Disponível p/ Retirada</div><div style={{ ...S.bigNumber, fontSize: 22, color: C.yellow, marginTop: 6 }}>{fmt(disponivel)}</div></div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>Empresa</div>
          {[
            { label: "Valor em Estoque", value: fmt(valorEstoque), icon: "📦" },
            { label: "Lucro Acumulado", value: fmt(lucroEmpresa), icon: "✨" },
            { label: "Total Retirado", value: fmt(totalRetirado), icon: "💸" },
            { label: "Saldo Disponível", value: fmt(disponivel), icon: "💰" },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 13, color: C.text }}>{item.icon} {item.label}</span>
              <span style={{ fontSize: 13, color: C.yellow, fontWeight: 700 }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={S.sectionTitle}>Minhas Retiradas</div>
            <Btn onClick={() => setModal(true)}>+ Retirar</Btn>
          </div>
          {retiradas.length === 0
            ? <div style={{ color: C.gray, fontSize: 13 }}>Nenhuma retirada registrada.</div>
            : retiradas.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <div><div style={{ fontSize: 13, color: C.text }}>{r.motivo}</div><div style={{ fontSize: 11, color: C.gray }}>{r.data}</div></div>
                <span style={{ color: C.danger, fontWeight: 700 }}>{fmt(r.valor)}</span>
              </div>
            ))
          }
        </div>
      </div>

      {modal && (
        <Modal title="Registrar Retirada" onClose={() => setModal(false)}>
          <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
          <Field label="Motivo"><Input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} /></Field>
          {disponivel > 0 && Number(form.valor) > disponivel && (
            <div style={{ background: C.dangerBg, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 12 }}>
              ⚠️ Valor acima do disponível ({fmt(disponivel)})
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Registrar Retirada"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
const MODULOS = [
  { id: "dashboard", label: "Dashboard", icon: "📊", comp: Dashboard },
  { id: "produtos", label: "Estoque", icon: "📦", comp: Produtos },
  { id: "vendas", label: "Vendas", icon: "💰", comp: Vendas },
  { id: "pedidos", label: "Pedidos", icon: "📋", comp: Pedidos },
  { id: "clientes", label: "Clientes", icon: "👥", comp: Clientes },
  { id: "fiado", label: "Fiado", icon: "⏳", comp: Fiado },
  { id: "financeiro", label: "Financeiro", icon: "💵", comp: Financeiro },
  { id: "fornecedores", label: "Fornecedores", icon: "🏭", comp: Fornecedores },
  { id: "entregas", label: "Entregas", icon: "🚚", comp: Entregas },
  { id: "metas", label: "Metas", icon: "🎯", comp: Metas },
  { id: "pedro", label: "Meu Dinheiro", icon: "👑", comp: DinheiroPedro },
];

export default function App() {
  const [ativo, setAtivo] = useState("dashboard");
  const modulo = MODULOS.find(m => m.id === ativo);
  const Comp = modulo?.comp;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Topbar */}
      <div style={{ position: "sticky", top: 0, zIndex: 200, background: C.surface, borderBottom: `1px solid ${C.border}`, height: 54, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
          <div style={{ width: 30, height: 30, background: C.yellow, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.white, letterSpacing: "0.05em" }}>VIBRA FC</div>
        </div>
        <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
          {MODULOS.map(m => (
            <button key={m.id} onClick={() => setAtivo(m.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: ativo === m.id ? C.yellowBg : "transparent", color: ativo === m.id ? C.yellow : C.gray, border: ativo === m.id ? `1px solid ${C.yellow}33` : "1px solid transparent", cursor: "pointer", fontSize: 11, fontWeight: ativo === m.id ? 700 : 500, whiteSpace: "nowrap" }}>
              <span>{m.icon}</span><span>{m.label}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: C.grayLight, whiteSpace: "nowrap" }}>🟢 Conectado</div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>{modulo?.icon}</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.white }}>{modulo?.label}</span>
          <span style={{ fontSize: 11, color: C.grayLight, marginLeft: 4 }}>· Vibra FC ERP</span>
        </div>
        {Comp && <Comp onNav={setAtivo} />}
      </div>
    </div>
  );
}
