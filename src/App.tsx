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
        {/* Alertas */}
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

        {/* Metas */}
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

      {/* Últimas vendas */}
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
            <Field label="Tamanho"><Select value={form.tamanho || "M"} onChange={e => setForm({ ...form, tamanho: e.target.value })} options={["PP", "P", "M", "G", "GG", "XG", "G4"]} /></Field>
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
function Vendas() {
  const { rows, loading, add } = useTable("vendas");
  const { rows: produtos } = useTable("produtos", "nome.asc");
  const { rows: clientes } = useTable("clientes", "nome.asc");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const empty = { cliente_nome: "", produto_nome: "", tamanho: "M", quantidade: 1, valor: "", custo: "", desconto: 0, frete: 0, forma_pagamento: "PIX", data: today(), obs: "" };
  const [form, setForm] = useState(empty);

  const fat = rows.reduce((a, v) => a + Number(v.valor || 0), 0);
  const lucro = rows.reduce((a, v) => a + Number(v.lucro || 0), 0);
  const ticket = rows.length > 0 ? fat / rows.length : 0;
  const margem = fat > 0 ? (lucro / fat) * 100 : 0;

  const prodSelecionado = produtos.find(p => p.nome === form.produto_nome);

  const salvar = async () => {
    if (!form.cliente_nome || !form.produto_nome || !form.valor) return;
    setSaving(true);
    try {
      const custo = Number(form.custo) || Number(prodSelecionado?.custo) || 0;
      const lucroCalc = Number(form.valor) - custo - Number(form.desconto || 0);
      await add({ ...form, valor: Number(form.valor), custo, lucro: lucroCalc, desconto: Number(form.desconto || 0), frete: Number(form.frete || 0), quantidade: Number(form.quantidade) });
      setModal(false);
      setForm(empty);
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Faturamento" value={fmt(fat)} icon="💰" />
        <KpiCard label="Lucro Total" value={fmt(lucro)} accent={C.yellow} icon="✨" />
        <KpiCard label="Qtd Vendas" value={rows.length} icon="🛍️" />
        <KpiCard label="Margem Média" value={`${margem.toFixed(1)}%`} accent={C.success} icon="📊" />
      </div>
      <SectionHeader title="Registro de Vendas" action={<Btn onClick={() => setModal(true)}>+ Nova Venda</Btn>} />
      <div style={S.card}>
        <Table
          cols={[
            { key: "data", label: "Data" },
            { key: "cliente_nome", label: "Cliente" },
            { key: "produto_nome", label: "Produto" },
            { key: "forma_pagamento", label: "Pgto", render: v => <Badge status={v} /> },
            { key: "valor", label: "Valor", align: "right", render: v => fmt(v) },
            { key: "custo", label: "Custo", align: "right", render: v => fmt(v) },
            { key: "lucro", label: "Lucro", align: "right", render: v => <span style={{ color: C.success, fontWeight: 700 }}>{fmt(v)}</span> },
          ]}
          rows={rows}
          emptyMsg="Nenhuma venda registrada ainda."
        />
      </div>

      {modal && (
        <Modal title="Registrar Venda" onClose={() => setModal(false)}>
          <Field label="Cliente">
            <Input list="clientes-list" value={form.cliente_nome} onChange={e => setForm({ ...form, cliente_nome: e.target.value })} placeholder="Nome do cliente" />
            <datalist id="clientes-list">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
          </Field>
          <Field label="Produto">
            <Input list="produtos-list" value={form.produto_nome} onChange={e => {
              const p = produtos.find(x => x.nome === e.target.value);
              setForm({ ...form, produto_nome: e.target.value, custo: p?.custo || form.custo, tamanho: p?.tamanho || form.tamanho, valor: p?.preco || form.valor });
            }} placeholder="Nome do produto" />
            <datalist id="produtos-list">{produtos.map(p => <option key={p.id} value={p.nome} />)}</datalist>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="Tamanho"><Select value={form.tamanho} onChange={e => setForm({ ...form, tamanho: e.target.value })} options={["PP", "P", "M", "G", "GG", "XG", "G4"]} /></Field>
            <Field label="Qtd"><Input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></Field>
            <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
          </div>
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
          <Field label="Observações"><Input value={form.obs} onChange={e => setForm({ ...form, obs: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Concluir Venda"}</Btn>
            <Btn ghost onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
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
  const empty = { nome: "", whatsapp: "", instagram: "", cidade: "", time_favorito: "", aniversario: null, obs: "" };
  const [form, setForm] = useState(empty);

  const clienteVendas = (nome) => vendas.filter(v => v.cliente_nome === nome);
  const msgWhats = (nome, valor) => encodeURIComponent(`Fala, ${nome}! Passando para lembrar do pagamento de ${fmt(valor)} da Vibra FC. Pode fazer o PIX e me manda o comprovante. Obrigado! ⚡`);

  const salvar = async () => {
    if (!form.nome) return;
    setSaving(true);
    try {
      await add({ ...form, aniversario: form.aniversario || null });
      setModal(false);
      setForm(empty);
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
        <Modal title="Novo Cliente" onClose={() => setModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}><Field label="Nome"><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></Field></div>
            <Field label="WhatsApp"><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="11999990000" /></Field>
            <Field label="Instagram"><Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" /></Field>
            <Field label="Cidade"><Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></Field>
            <Field label="Time Favorito"><Input value={form.time_favorito} onChange={e => setForm({ ...form, time_favorito: e.target.value })} /></Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Observações"><Input value={form.obs} onChange={e => setForm({ ...form, obs: e.target.value })} placeholder="Preferências, indicações, observações..." /></Field></div>
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
            <Field label="Tamanho"><Select value={form.tamanho} onChange={e => setForm({ ...form, tamanho: e.target.value })} options={["PP", "P", "M", "G", "GG", "XG", "G4"]} /></Field>
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
  const { rows, loading, add } = useTable("financeiro");
  const [modal, setModal] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [saving, setSaving] = useState(false);
  const empty = { tipo: "entrada", categoria: "Venda", descricao: "", valor: "", data: today() };
  const [form, setForm] = useState(empty);

  const entradas = rows.filter(m => m.tipo === "entrada").reduce((a, m) => a + Number(m.valor || 0), 0);
  const saidas = rows.filter(m => m.tipo === "saida").reduce((a, m) => a + Number(m.valor || 0), 0);
  const filtrados = rows.filter(m => filtro === "todos" || m.tipo === filtro);

  const salvar = async () => {
    if (!form.descricao || !form.valor) return;
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
        <KpiCard label="Entradas" value={fmt(entradas)} accent={C.success} icon="📈" />
        <KpiCard label="Saídas" value={fmt(saidas)} accent={C.danger} icon="📉" />
        <KpiCard label="Saldo" value={fmt(entradas - saidas)} accent={entradas - saidas >= 0 ? C.yellow : C.danger} icon="💵" />
      </div>
      <SectionHeader title="Movimentações" action={
        <div style={{ display: "flex", gap: 8 }}>
          {["todos", "entrada", "saida"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ ...S.btnGhost, padding: "6px 14px", background: filtro === f ? C.yellowBg : "transparent", color: filtro === f ? C.yellow : C.gray, borderColor: filtro === f ? C.yellow : C.border }}>
              {f === "todos" ? "Todos" : f === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
          <Btn onClick={() => setModal(true)}>+ Lançamento</Btn>
        </div>
      } />
      <div style={S.card}>
        <Table
          cols={[
            { key: "data", label: "Data" },
            { key: "tipo", label: "Tipo", render: v => <span style={{ color: v === "entrada" ? C.success : C.danger, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{v}</span> },
            { key: "categoria", label: "Categoria" },
            { key: "descricao", label: "Descrição" },
            { key: "valor", label: "Valor", align: "right", render: (v, r) => <span style={{ color: r.tipo === "entrada" ? C.success : C.danger, fontWeight: 700 }}>{r.tipo === "saida" ? "−" : "+"}{fmt(v)}</span> },
          ]}
          rows={filtrados}
          emptyMsg="Nenhuma movimentação registrada."
        />
      </div>

      {modal && (
        <Modal title="Novo Lançamento" onClose={() => setModal(false)}>
          <Field label="Tipo"><Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} options={[{ value: "entrada", label: "Entrada" }, { value: "saida", label: "Saída" }]} /></Field>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
              options={form.tipo === "entrada" ? ["Venda", "Frete cobrado", "Personalização", "Outra receita"] : ["Estoque", "Motoboy", "Tráfego pago", "Marketing", "Parcerias", "Embalagens", "Assinaturas", "Taxas", "Outros"]} />
          </Field>
          <Field label="Descrição"><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
            <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
          </div>
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
  const { rows: compras, add: addCompra, edit: editCompra } = useTable("compras");
  const [aba, setAba] = useState("fornecedores");
  const [modalForn, setModalForn] = useState(false);
  const [modalCompra, setModalCompra] = useState(false);
  const [saving, setSaving] = useState(false);
  const emptyF = { nome: "", whatsapp: "", instagram: "", cidade: "", prazo: "", obs: "" };
  const emptyC = { fornecedor: "", produto: "", quantidade: "", valor_unit: "", frete: 0, data: today(), prazo_entrega: "", status: "Pedido realizado" };
  const [formF, setFormF] = useState(emptyF);
  const [formC, setFormC] = useState(emptyC);

  const totalInvestido = compras.reduce((a, c) => a + Number(c.total || 0), 0);

  const salvarForn = async () => {
    if (!formF.nome) return;
    setSaving(true);
    try { await addForn(formF); setModalForn(false); setFormF(emptyF); } finally { setSaving(false); }
  };

  const salvarCompra = async () => {
    if (!formC.fornecedor || !formC.produto) return;
    setSaving(true);
    try {
      const qtd = Number(formC.quantidade), vunit = Number(formC.valor_unit), frete = Number(formC.frete || 0);
      await addCompra({ ...formC, quantidade: qtd, valor_unit: vunit, frete, total: qtd * vunit + frete });
      setModalCompra(false);
      setFormC(emptyC);
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
          <SectionHeader title="Histórico de Compras" action={<Btn onClick={() => setModalCompra(true)}>+ Registrar Compra</Btn>} />
          <div style={S.card}>
            <Table
              cols={[
                { key: "data", label: "Data" },
                { key: "fornecedor", label: "Fornecedor" },
                { key: "produto", label: "Produto" },
                { key: "quantidade", label: "Qtd", align: "center" },
                { key: "valor_unit", label: "Unit.", align: "right", render: v => fmt(v) },
                { key: "total", label: "Total", align: "right", render: v => <span style={{ color: C.yellow, fontWeight: 700 }}>{fmt(v)}</span> },
                { key: "status", label: "Status", render: v => <Badge status={v} /> },
                { key: "id", label: "Status", render: (v, r) => (
                  <select value={r.status} onChange={e => editCompra(v, { status: e.target.value })} style={{ ...S.input, padding: "4px 8px", fontSize: 11, width: "auto" }}>
                    {["Pedido realizado", "Aguardando envio", "Em trânsito", "Recebido", "Cancelado"].map(s => <option key={s}>{s}</option>)}
                  </select>
                )},
              ]}
              rows={compras}
              emptyMsg="Nenhuma compra registrada."
            />
          </div>
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

      {modalCompra && (
        <Modal title="Registrar Compra" onClose={() => setModalCompra(false)}>
          <Field label="Fornecedor">
            <Select value={formC.fornecedor} onChange={e => setFormC({ ...formC, fornecedor: e.target.value })}
              options={[{ value: "", label: "Selecione..." }, ...fornecedores.map(f => ({ value: f.nome, label: f.nome }))]} />
          </Field>
          <Field label="Produto"><Input value={formC.produto} onChange={e => setFormC({ ...formC, produto: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="Qtd"><Input type="number" value={formC.quantidade} onChange={e => setFormC({ ...formC, quantidade: e.target.value })} /></Field>
            <Field label="Valor unit. (R$)"><Input type="number" value={formC.valor_unit} onChange={e => setFormC({ ...formC, valor_unit: e.target.value })} /></Field>
            <Field label="Frete (R$)"><Input type="number" value={formC.frete} onChange={e => setFormC({ ...formC, frete: e.target.value })} /></Field>
          </div>
          {formC.quantidade && formC.valor_unit && (
            <div style={{ background: C.yellowBg, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.yellow, marginBottom: 12 }}>
              Total: {fmt(Number(formC.quantidade) * Number(formC.valor_unit) + Number(formC.frete || 0))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Data"><Input type="date" value={formC.data} onChange={e => setFormC({ ...formC, data: e.target.value })} /></Field>
            <Field label="Prazo entrega"><Input type="date" value={formC.prazo_entrega} onChange={e => setFormC({ ...formC, prazo_entrega: e.target.value })} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={salvarCompra} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Btn>
            <Btn ghost onClick={() => setModalCompra(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
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
          <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QDsRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAC5ADAAIAAAAUAAAApJAEAAIAAAAUAAAAuJAQAAIAAAAHAAAAzJARAAIAAAAHAAAA1JASAAIAAAAHAAAA3JKQAAIAAAAEMDAwAJKRAAIAAAAEMDAwAJKSAAIAAAAEMDAwAKABAAMAAAAB//8AAKACAAQAAAABAAAGQKADAAQAAAABAAAGQAAAAAAyMDI2OjAzOjE5IDIxOjU3OjA1ADIwMjY6MDM6MTkgMjE6NTc6MDUALTAzOjAwAAAtMDM6MDAAAC0wMzowMAAA/+0AfFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAABEHAFaAAMbJUccAgAAAgACHAI/AAYyMTU3MDUcAj4ACDIwMjYwMzE5HAI3AAgyMDI2MDMxORwCPAALMjE1NzA1LTAzMDA4QklNBCUAAAAAABBXEnLJChTnG3g30TJ7JF+w/+IB2ElDQ19QUk9GSUxFAAEBAAAByAAAAAAEMAAAbW50clJHQiBYWVogB+AAAQABAAAAAAAAYWNzcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJZGVzYwAAAPAAAAAkclhZWgAAARQAAAAUZ1hZWgAAASgAAAAUYlhZWgAAATwAAAAUd3RwdAAAAVAAAAAUclRSQwAAAWQAAAAoZ1RSQwAAAWQAAAAoYlRSQwAAAWQAAAAoY3BydAAAAYwAAAA8bWx1YwAAAAAAAAABAAAADGVuVVMAAAAIAAAAHABzAFIARwBCWFlaIAAAAAAAAG+iAAA49QAAA5BYWVogAAAAAAAAYpkAALeFAAAY2lhZWiAAAAAAAAAkoAAAD4QAALbPWFlaIAAAAAAAAPbWAAEAAAAA0y1wYXJhAAAAAAAEAAAAAmZmAADypwAADVkAABPQAAAKWwAAAAAAAAAAbWx1YwAAAAAAAAABAAAADGVuVVMAAAAgAAAAHABHAG8AbwBnAGwAZQAgAEkAbgBjAC4AIAAyADAAMQA2/8AAEQgGQAZAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwUDAwMFBgUFBQUGCAYGBgYGCAoICAgICAgKCgoKCgoKCgwMDAwMDA4ODg4ODw8PDw8PDw8PD//bAEMBAgMDBAQEBwQEBxALCQsQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEP/dAAQAZP/aAAwDAQACEQMRAD8A/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooATgUwnuaUnNJVJFJBRRRWqRQUhOKWmE5pgBOaYT2oLelMJ7VaRoBOKMCgDFLWoBRRSE4oAQmm0E9zTevJoAOvJo6/Sjr9KCe1aF2EJzTScUE4plWkMUnNJRRVJAFITignFMrRIpIKTg0nX6U6rKCkJxSE+lNJ71SVwCigj1orRKxaQUUUhOKoYE4pp5oJzSUAFNJ7CgnsKYTigBc4phOaCc0lWjQKKKQnFUkApPemk4+tHT602tEhpBRRSE4qywJxTKKDx1qkrgkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFSRffX6j+dR1JGcSL/ALw/nWsd0D2P/9D9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACoye5oJ7miqSKSCiiitUigoJx1pCcU0nNMAJzTC3pQT2phOKtI0DIoAxQBilrUAooppNACk4pmcUU3ryaADryaOv0o6/SkJzWhoBOaTOKDxTCc1aQATmkooqkgCkJxQTimVokUkFN6/Sjr9KdVlBSE4oJxTKpK4BRRRWiVi0goopCcVQwJxTKKKACmk9hQT2FNJ7mgBCcUyiitDQKKKKaQCE9hSdPrQTj602tEhpBRRSE4qywJxTKKKpK4krCE4ppOaCc0lapWGFFFFMAphOaCc0lUkAUUUhOKoAJxTo+ZU/3hUVPi/1if7wrSK1RXQ//0f0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAphOaQnuaKpIpIKKKK1SKCg8daQnFNJzTACc0wntQW9KYelWkaATigDFAGKWtQCiimk0AKTimUU3ryaADryaOv0o6/SkJzWhoBOaSkJxTSc1aQCUUUVSQBSE4oJxTK0SKSCk4NHBpasoKaT2pScUyqSuAUUUVolYtIKKKQnFUMCcUylPNJQAU0nsKCfSm0AFMJzQTmkq0i0FFFIT2qkhi008dO9BOPrTa0SGkFFFITirHuBOKZRRVJXKSCmE5oJzSVqlYAooopgFMJzQTmkqkgCiikJxVABOKZRRVpGgUsZxKn+8KYT2pY+JE/3hWsFqga0P/9L9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAphOaQnuaKpIpIKKKK1SKCikJxTSc00UgJzTCewoJ7UwnFWkUBOKAMUAYpa1AKKKQnFAATimE9zRTevJoAOvJo6/Sjr9KQnNaGgpPamE4pc45qOrSAKKKKpIApCcUE4plaJFJBTev0o6/SnVZQU0n0oJ9KbVJXACe9FFFaJWLSCiikJxVDAnFNJzSZzRQAU0nsKCewphOKAAnFNJzQTmkrSxoFFFIT2FNIAJxSdPrQePrTa0SGkFFFITirLAnFMooqkrgkB460wnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKKtI0Cmk44FBPam1SQ0gp8f+sT/eH86YTjrTYyfNT/AHhW8Vqimf/T/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqMnuaUnNJVJFJBRRRWqRQUhOKCcU0nNMAJzTC3pQT2phOKtI0An0owKAMUtagFFFNJoACabQT3NN68mgA68mjr9KOv0pCc1oaATmk6daCcc1HnNWkApOaSiiqSAKQnFBOKZWiRSQU3r9KXg0tWUFITikJ7U2qSuAUUUVolYtIKKKQnFUMCcUyiigAppPYUE9hTaAEJxTKUnNJWiNAoooppAFN6fWg8dO9NrRIaQUUUhOKssCcUyiiqSuCQUwnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKKtI0Cmk9hQT2ptUkNIKQnFKTjmoupzWiRYdeafH/rU/3hTadHjzEz/eH861juhS2P/U/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITilphOaYATmmE9qCe1MJxVpGgE4oAxQBilrUAooppNAATTaCe5pvXk0AHXk0dfpR1+lITmtC7ATmmk4oJxTKtIYpOaSiiqSAKQnFBOKZWiRSQUnBpOv0p1WUFITignFMJ71SVwCiiitErFpBRRSE4qhgTimnmgnNJQAU0nsKCaYTigBaYTmgnNJVpGgUUUhOKpIBaaTj60dPrTa0SGkFFFITirLAnFMooqkrgkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNEFNJ7UE9hTapIaQUhOKCcVHwa0SLDg0tFITirACcU6M/vU/3hUVPi/1qf7w/nWkVqJn/9X9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiik4FAC0wnNIT3NFUkUkFFFFapFBRSE4ppOaYATmmE9hQW9KYTirSuaATigDFAGKWtQCiimk0AKTimUE96b15NABjPJo6/Sjr9KQnNaFpAT2FNJxS9OtR1aQwoooqkAUhOKCcUytEikgpODSdfpTqsoKaT6UhOaSqSuAUD1oorRKxSVgoopCcVRQE4pmc0UUAFNJ7CgnsKYTigAJxTSc0lFaWNAoooJ9KaQCE9hSdPrR0+tNrRIaQUUUhOKse4E4plFB461SVykgphOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUUVaRogpCcUhPYU2qSGkFITignFR9ea0SLDg0tFITirACcUygnvRVpAFPi/1qf7wplOjP71Meoq47lPY/9b9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITignFNJzTACc0wt6UE9qYTitUjQMigDFAGKWrAKKKaTQApOKYT60U3ryaADryaOv0o6/SkJzWhaAnNNJxQTimk5q0hgTmkooqkgCkJxQTimVokUkFJwaWirKCkJxQTimVSVwCiiitErFpBRRSE4qhgTimUp5pKACmk9hQT2FNoAQnFNJzQTmkrRGgUUUU0gCm5xxQTj602tEhpBRRSE4qx7gTimUUVSVykgphOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUUVaRoFNJ7UpOKZVJDSCkJxQTimVokWJwaWikJxVgBOKYT60E96KtIAoopCcUzQQn0p8X+tT6ioqli/1qfUVrFaky2P/1/0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAphOaCc0laJFJBRRRVpFBQT3NFMJzTACc0wntQW9KYTirSNAJxQBigdKWtQCiikJxQAhNNJ7mkJxSdeTQAdeTR1+lHX6UE9q0LQhOaaTignFMq0hhnNFFFUkAUhOKCcUytEikgpODRwaWrKCkJxQTimVSVwAnvRQPWitErFpBRRSE4qhgTimk5pM5ooAKaT2FBPYU0nuaACmE5oJzSVaRoFFFIT2FUkAE9qQkD60dPrTa0SGkFFFITirLAnFMooziqSuCQUwnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKKtI0Cmk9hQT2FNqkhpBSE4oJxUfBrRIsODS0UhOKsAJxTKKKtIAoopCcUzQQntTaKKtIApYz+9QD+8KYW9KdF/rE/wB4VrFaoHsf/9D9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBOBTCe5pSc0lUkUkFFFFapFBQT3NITimk5pgBOaYT2FBPamZFWkaAelAGKAMUtagFFFITigBCabRn1pvXk0AHXk0dfpR1+lBPatDQQnNIeOtHTmmE5q0gEoooqkgCkJxQTimVokUkFN6/Sl4NLVlBTSfSlJxTKpK4BRRRWiVi0goopCcVQwJxTKKKACmk9hQT2FMJxQAE4plKetJWhoFFFFNIAJ703p9aOBTa0SGkFFFITirLAnFMooqkrgkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNAppOOBQT2ptUkNIKQnFITjmmEZrRIsXOeaKKQnFWAE4phPc0E+tFWkAUUU0n0pmgpOKZRRVoAppPagntTatIAqSM4lQ/7QqInFEZ/eofcVrHdA1of/0f0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKYTmgnNJVJFJBRRRWqRQUhOKCcU0nNMAJzTC3pQW9KYTitUjQCewoAxQBilqwCiimk0ABNMJxSk9zTevJoAOvJo689qXr7CkJ9K0LsITmmk4oJxTSc1aQwJzSUUVSQBSE4oJxTK0SKSCk4NHBpasoKQnFBOKZVJXAKKKK0SsWkFFFITiqGBOKZSk5pKACmk9qCewptAAeOtMJzQTmkq0jQKKKKpIAppOPrQTim1okNIKKKQnFWWBOKZRRVJXBIKYTmgnNJWqVgCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaIKaT2FBPYU2qSGkFITignFR9etaJFh160tFITirACcUyiirSAKKKQnFM0EJ9KbRRVoAppPYUFvSm1aQBSE4oJxTKoaQU+L/Wp/vCmU+L/Wp/vCtIrUp7H/0v0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiik4FAC1GT3NBPc0VSRSQUUUVqkUFITilphOadirATmmE9qCe1MJxVpFATigdKAMUtagFFFNJoAUnFMopvXk0AHXk0dfpS9foKQn0rQtICe1Nzig8dajq0hhRRRVJAFIT6UE4plaJFJBScGk6/SnVZQUhOKQn0ptUlcAoHrRRWiVi0goopCcVQwJxTM5pTzSUAFNJ7CgnsKYTigBSe5phOaSirsaBRRQT3qkgEJ7Ck6fWjp9abWiQ0goopCcVY9wJxTKKKpK5SQZxTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFMooq0jRBTSe1BPYU2qSGkFITignFR9ea0SLDg0tFITirACcUygnuaKtIAooppPamaCk4plFFWlYAppb0oJ7U2rSAKQnFBOKZVDSCiiirSLCnocSJ9RURbFOj/wBYmf7wq1uJ7H//0/0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITignFNJzTACc0wnsKCewphPatUjQCfSgDFA6UtWAUUU0mgBScUzPrSE4pOvJoAOvJo6/Sjr9KQnNaF2FJ7U3pzSE4ppOatIYE5pKKKpIApCcUE4plaJFJBTev0peDS1ZQUhOKCcUyqSuAUUUVolYtIKKKQnFUMCcUyiigAppPYUE9hTSe5oAQnFMpSc0laI0CiiimkAA+lN6fWgnHHem1okNIKKKQnFWWBOKZRRVJXBIKYTmgnNJWqVgCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaBSE4pCfSm1SQ0gppOOT1pScVHyfatEiwPJ5paKQnFWAE4phPrRn1oq0gCiimk+lM0An0ptFFXYAppPYUE9hTatIApCcUE4plUNICe5oooq0iwpCcUE4pnuaYB7mljJMqf7wqMnNOi/wBYn1H86qO6Ka0P/9T9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITignFNJzTACc0wntQW9KbVpGghOKAMUYFLWoBRRSE4oAQmmk9zRTevJoAOvJo6/Sjr9KQnNaGgE5pKOnWo6tIBSc0lFFUkAUhOKCfSmVokUkFJwaODS1ZQU0ntSk4plUlcAooorRKxaQUUUhOKoYE4plGc0UAFNJ7UE9hTSe5oAKYTmgnNJVJWNAoooz2q0gCm5x9aCcfWm1okNIKKKQnFWWBOKZRRVJXElYKYTmgnNJWqVhhRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNAppPYUE+lNqkhpBSE4oJxUfBrRIsOvWlopCcVYATimUUVaQBRRTSfSmaAT2ptFFWgCmk9qC3pTatIApCcUE4plUNIKKKKtIsKQkUE4ph9TTAPc0wnNBOab1+lBaQcGpI/9Yn+8P50ynx/6xP94fzrVbgz/9X9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooATgUwnuaUnNJVJFJBRRRWqRQUUUwnNMpATmmE9qC3pTCe1WkUBOKAMUAYpa1AKKKQnFACE00nvQT603ryaADryaOv0o6/SkJzWhaFJ9KbR05qOrSGFFFFUkAUhOKCcUytEikgpvX6UdfpTqsoKQnFIT6U2qSuAUUUVolYtIKKKQnFUMCcU080lFABTSewoJ7CmE4oAUnuajoorQ0CiikJ7U0gFJ703p9aOn1ptaJDSCiikJxVlgTimUUZxVJXBIKYTmgnNJWqVgCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaBTSccCgntTapIaQUhOKQnHXrTOv0rRIsODS0UhOKsAJxTCe5oJ9aKtIAoopCcUzQQntTaKKtAFNJ7UE9hTatIApCcUE4phPc1Q0goooq0iwpCcUE4pnuaYB7mmE5oJzTev0oGkHXiloorQsKki/wBYn+8Kjp0RzKn+8P51a3Ez/9b9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqMnuaUnNJVJFJBRRRWqRQUZxQT3NM5NMAJzTCewoJ7CmE+lapGgHpQOlAGKWrAKKKaTQApOKZQT3NNxnk0AHXk0dfpR1+lITmtDQCc0nTmg8VHVpAKTmkooqkgCkJxQTimVokUkFJwaODS1ZQUhOKQntTapK4BRRRWiVi0goopCcVQwJxTKKKACmk9hQT2FNoACe5phOaSitLWNAoooppAFNJx9TQTj602tEhpBRRSE4qywJxTKKKpK4krBTCc0E5pK1SsMKKKKYBTCc0E5pKpIAoopCcVQATimUUVaRogppPpQT2FNqkhpBSE4oJxUfXrWiRYcGlopCcVYATimZ9aKKtIAooppPamaCk4plFFXYAppb0oJ7U2rSAKQnFBOKZVDSCiiirSLCkJxQTime5pgHuaYTmgnNN4NBaQdfpS0UVoMKQnFLTCc0ABOadGcSp/vD+dRk4pYj+9T/eH861itRtaH/9f9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKTgUALTCc0hPc0VSRSQUUUVqkUFBOOaKYTmnYqwE5phb0oLelMJxVpFC0gGKB0pa1AKKKaTQAE02gnuaT3NACdeTR1+lHX6UhOa0LSAnNJ060ZxTCc1aQwJzSUUVSQBSE4oJxTK0SKSCk4NHBpasoKQnFBOKZVJXAKKKK0SsUlYKKKQnFUUBOKZnNKeaSgAppPYUE9hTSe5oAKYTmgnNJV2NAoooJ71SQBTScfWjOPrTa0SGkHuaKKQnFWPcCcUyijOKpK5SQUwnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKKtI0Cmk9hQT2FNqkhpBSE4oJxUfBrRIsODS0UhOKsAJxTKCe5oq0gCiikJxTNAJxTKKKtKwBTSe1BPam1aQBSE4oJxTKoaQUUUVaRYUhOKCcVH7k0wF9zTCc0E5pvBoLSDg0tFFaDCiimE5oACc00nFBOKZV2KSCnx/61P94fzpme5pYjmZP94fzrSK1RT2P/0P0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAphOaQnuaKpIpIKKKK1SKCijOKYTmmAE5phPagntTD0q0jQCe1AGKAMUtagFFFITigAJxTM+tFN68mgA68mjr9KOv0pCc1oXYCc0zpyetO6c0wnNWkMSiiiqSAKQnFBOKZWiRSQU3r9KXg0tWUFNJ7UpOKZVJXAKCPWiitErFpBRRSE4qhgTimk5pKKACmk9hQT2FNJ7mgBCcU0nNJRWhoFFFFNIBCe1J0+tB4+pptaJDSCiikJxVlgTimUUVSVwSCmE5oJzSVqlYAooopgFMJzQTmkqkgCiikJxVABOKZRRVpGgUhOKQntTapIaQUhOKCcVHwa0SLDr9KWikJxVgBOKYT60Z9aKtIAooppPamaCk4plFFWkAU0nsKC3pTatIApCcUE4plUNICe5oooq0iwpCcUE4pnuaYB7mmE5oJzTev0oGkHBpaKK0LCikJxTSc0ABOaaTignFMrQpIKD6mjOOTUdNIoKkh/1qfUfzqOnxf61P94fzrWO6B7H/9H9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAphOaCc0lUkUkFFFFapFBSE4pTx1phOaYATmmFvSgnsKYTitUjQCfSgDFAGKWrAKKKQnFACE00nuaKb15NAB15NHX6UdfpSE5rQtATmkPFHTrTCc1aQwJzSUUVSQBSE4oJxTK0SKSCk4NLRVlBTCc04nFMqkrgFFFFaJWLSCiikJxVDAnFMozmigAppPYUE9hTaAAnuajpSc0lWjQKKKKpIAppOPrQTim+5rRIaQUUUhOKssCcUyiiqSuJKwUwnNBOaStUrDCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaBTSewoJ9KbVJDSCkJxQTio+DWiRYdetLRSE4qwAnFMJ70E+tFWkAUUUhOKZoIT2ptFFWgCmk9hQT2ptWkAUhOKCcUyqGkFFFFWkWFISKCcUz3NMA9zTCc0E5pvX6UFpBwaWiitBhSE4paYTmgAJzTScUE4plWikgoJx1o6c0wnNUkUJRRRVgFPi/1ifUfzqMnFOiOZU+o/nVxWoWuj/9L9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAE4FMJ7mlJzSVSRSQUUUVqkUFFFMJzTKsBOaYT2oLelMJ7VaRQE4paQDFLWoBRRSE4oAQmm0Z9ab15NAC+5pOv0o6/SgntWhaQhOaTOKbnHWm1aQxSc0lFFUkAUhOKCcUytEikgpODSdfpTqsoKQnFIT6U0nvVJXAKKCPWitErFpBRRSE4qhgTimnmgnNJQAU0nsKCewphOKAFzimE5oJzSVaNAoopCe1UkApPemk4+tHT602tEhpBRRSE4qywJxTKKKpK4JBTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFMooq0jQKaT2oJ9KbVJDSCkJxQTio+DWiRYcGlopCcVYATimE96KKtIAooppPpTNBScUyiirQBTSe1Bb0ptWkAUhOKCcUwnuaoaQUUUVaRYUhOKCcUz3NMA9zTCc0E5pvBoGkHX6UtFFaFhRRTCc0ABOaaTignFMrQpIKM4oPHJqOmkUKeaSiirAKQnFB45plWkNIKdGcyp/vD+dRE5p8P+tT6j+daR3Kex/9P9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKYTmgnNJVJFJBRRRWqRQUE460E9zTCc0wAnNMLelBPamE+lWkaATigDFAGKWtQCiimk0AKTioycUpPc03ryaADryaOv0o6/SkJzWhoBOaYeOnendOtMJzVpABOaSiiqSAKQnFBOKZWiRSQU3r9KOv0p1WUFITimk5pKpK4BRRRWiVi0goopCcVQwJxTKKKACmk9hQT2FNJ7mgBCcUyiitDQKKKKaQCE9hSE4+tBOPrTa0SGkFFFITirLAnFMooqkriSsITimk5oJzSVqlYYUUUUwCmE5oJzSVSQBRRSE4qgAnFMooq0jRBTSewoJ7Cm1SQ0gpCcUE4qPg1okWHJ60tFITirACcUzPrQT3oq0gCiikJxTNBCe1Nooq7AFNLelBb0ptWkAUhOKCcUyqGkFFFFWkWFNLYpSRTPc0wD3NMJzQTmm8GgtIOv0paKK0GFITignFNJzQAE5ppOKCcUytCkgozjk00nFNppFBRRRVgFITignFMq0hpBTCc0E5pKZYVJF/rk/3h/Oo6ki/1yf7w/nWkVqU9Ef/U/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoopOBQAtMJzSE9zRVJFJBRRRWqRQUHjrRTCc0wDk0wntQT2FMPStUjQCcUAYowKWrAKKKaTQApOKZRSe5oATryaOv0o6/SkJzWhoBOaTp1pCcU0nNWkAlFFFUkAUhOKCcUytEikgpODRwaWrKCmk9qUnFMqkrgFFFFaJWLSCiikJxVDAnFMpTzSUAFNJ7CgnsKbQAUwnNBOaSrSNAoooqkgCmnjp3oJx9abWiQ0goopCcVY9wJxTKKKpK5SQUwnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKKtI0Cmk9qUnFMqkhpBQTjrSE4qPg1okWHU5paKQnFWAE4plFFWkAUUUhOKZoIT2ptFFWkAU0ntQT2FNq0gCkJxQTimVQ0goooq0iwpCcUE4pnuaYB7mmE5oJzTev0oLSDr9KWiitBhRRTCc0ABOaaTignFMrQpIKOnNFMPNNIoSiiirAKQnFBOKZVpDSCmE5oJzSUywooorRIvYKWI5lT6j+dRk5p8P8ArU+o/nVxWpm9j//V/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAphOaQnuaKpIpIKKKK1SKCikJxTSc07XHa4E5phb0oLelMJxVpFgT2oAxQBilrUAoopCcUABOKYT3NGcU3ryaADryaOv0o6/SkJzWhaAnFMJxQTim1aQwoooqkgCkJxQTimVokUkFN6/Sjr9KdVlBTSfSgn0ptUlcAJ70EetFFaJWLSCiikJxVDAnFNJzSdetFABTSewoJ7CmE4oACcU0nNBOaStLGgUUUhPYU0gAntSdPrQTj602tEhpBRRSE4qywJxTKKKpK4JAeOtMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyik69KtI0Dg0hOOBQT2FNqkhpBSE4oJxUfJ61okWHXrS0UhOKsAJxTKCe5oq0gCiimk9qZoBPam0UVaQBTSewoLelNq0gCkJxQTimZ9aoaQE+tFFFWkWFITikLYpvuaYB7mmE5oJzTev0oGkHBpaKK0LCikJxTSc0ABOaaTignFMrQpIDxQeOtGccmo6aRQZzRRRVgFITignFMJ71aQ0gphOaCc0lMtIKKKK0SL2G9fpSE5oJzSU0iAqSI4mT/eH86iJxToT++T/eH861W4W0P//W/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITignFNJzTACc0wt6UE9qYTirSNAJ9KAMUAYpa1AKKKaTQAE02gnuab15NAB15NHX6UdfpSE5rQ0AnNJQeOajzmrSAKKKKpIApCcUE4plaJFJBTev0peDS1ZQUhOKQntTapK4BRRRWiVi0goopCcVQwJxTKKKACmk9hQT2FNoAQnFMpSc0lWjQKKKKpIAppOPrQeOnem1okNIKKKQnFWWBOKZRRVJXBIKYTmgnNJWqVgCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaCcGkJ7CgnHAptUkNIKQnFKTjmoupzWiRYdeaWikJxVgBOKYT3ooq0gCiimk9qZoBPpTaKKtIAppb0oJ7U2rSAKQnFBOKYT3NUNIKKKKtIsKQkUE4pnuaYB7mmE5oJzTev0oLSDg0tFFaDCkJxQelNJzQAE5ppOKCcUytCkgo6daDxzUdNIoKKKKsApCcUE4plWkNIKYTmgnNJTLSCiiitEitgphOaCc0lNIkKQnFBOKZVjSCpYf9Yn1H86iqWH/WJ9R/OtYrUpn//X/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKjJ7mlJzSVSRSQUUUVqkUFITilphOaZVgJzTC3pQT2FMJxWqRQHpQBigdKWrAKKKQnFACE02gnuab15NAC+5pOv0o6/SkJzWhdgJzTScUucVHVpDFJzSUUVSQBSE4oJxTK0SKSCk4NJ1+lOqygpCcUhPpTSe9UlcAooorRKxaQUUUhOKoYE4pp5oJzSUAFNJ7CgnsKYTigBaYTmgnNJVpGgUUUhPaqSAWmk4+tGcD3ptaJDSCiikJxVlgTimUUVSVwSCmE5oJzSVqlYAooopgFMJzQTmkqkgCiikJxVABOKZRScGrSNELTSewoJxwKbVJDSCkJxQTimVokWFFFITirACcUyiirSAKKKQnFM0AnFMooq0AU0nsKC3pTatIApCcUE4phPrVDSCiiirSLCkJxQTime5pgHuaYTmgnNN4NBaQdfpS0UVoMKKKYTmgAJzTScUE4plaWsUkBPejOKCcdaYTmmkUBOaSiirAKQnFBOKZVpDSCmE5oJzSUywoooz37VokXsFMJzQTmkppEBSE4oJxTKsaQUUUVaRYU+I4lT6j+dRk4pYT++T/eH86pbja0P//Q/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiik4FAC1GT3NKTmkqkikgooorVIoKQnFBOKaTmmAE5phPagt6Uwn0q0rmgE4oAxQBilrUAooppNACk4plBPem9eTQAdeTR1+lHX6UhOa0NAJzTDxzTjxUdWkAUUUVSQBSE4oJxTK0SKSCm9fpR1+lOqygppPpSE5pKpK4BRRRWiVi0goopCcVQwJxTM5oooAKaT2FBPYUwnFAATimk5pKK0NAoooJ9KaQCE9hSE4+tBOPrTa0SGkFFFITirHuBOKZRQeOtUlcpIKYTmgnNJWqVgCiiimAUwnNBOaSqSAKKKQnFUAE4plFJwatI0QcGkJxwKCccCm1SQ0gpCcUE4qPrzWiRYtFFITirACcUygnvRVpAFFFNJ9KZoKTimUUVdgCmk9qC3pTatIApCcUE4plUNIKKKKtIsKaWxSM1J7mmAe5phOaCc03g0DSDr9KWiitCwopCcU0nNAATmmk4oJxTK0KSCjpzQT3NR00igoooqwCkJxQTimVaQ0gJ70wnNBOaSmWkFFFFaJF7B7mmE5oJzSU0iApCcUE4plWNIKKKKtIsKQnFBOKYT3plJBT4eJUP8AtD+dMpYjmZP94fzq47g9j//R/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITignFNJzTACc0wt6UE9qYTitUjQMigDFAGKWrAKKKaTQApOKYT60U3ryaADryaOv0o6/SkJzWhaAnNJ060ZxTCc1aQwJzSUUVSQBSE4oJxTK0SKSCk4NLRVlBTSfSlJxTKpK4BRRRWiVi0goopCcVQwJxTKOvNFABTSewoJ7Cm0AITimk5oJzSVaRoFFFFUkAU0nFBOPrTa0SGkFFFITirHuBOKZRRVJXKSCmE5oJzSVqlYAooopgFMJzQTmkqkgCiikJxVABOKZRRVpGgU0nsKCewptUkNIKQnFBOKZWiRYnBpaKQnFWAE4pmfWgnvRVpAFFFITimaATimUUVoAU0ntQT2FNqkgCkJxQTimVQ0gJ9aKKKtIsKaxwKUnFM9zTAPc0wnNBOabwaC0g6/SloorQYUhOKWmE5oACc00nFBOKZWhSQU08cmnZxTCc00ihKKKKsApCcUE4plWkNICfWmE5oJzSUywooorRIvYKYTmgnNJTSICkJxQTimVY0goooq0iwpCcUE4plMpIKKKYTmgoCc0+H/AFqfUfzqOpIf9an1H861itQex//S/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKYTmkJ7miqSKSCiiitUigoJ7mimE5p2uO1wJzTCe1Bb0phPpWqRYE4owKAMUtWAUUUhOKAEJppPc0hOKTryaADryaOv0o6/SgntWhaQhOaSm9OTTatIYUUUVSQBSE4oJxTK0SKSCk4NHBpasoKaT6UpOKZVJXACe9FA9aK0SsWkFFFITiqGBOKaTmkzmigAppPYUE+lMJxQAtMJzQTmkq0jQKKKQnsKpIAJ7UhOPrQTj602tEhpBRRSE4qywJxTKKM4qkrgkFMJzQTmkrVaAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKTg1aRoHBpCccCgnHAptUkNIKQnFBOKZWiRYUUUhOKsAJxTKKKtIAooppPpTNBScUyiirSAKaW9KCe1Nq0gCkJxQTimVQ0gJ7miiirSLCkJxQTime5pgHuaYTmgnNN6/SgtIODS0UVoMKKKYTmgAJzTScUE4phPrWhSQUdOtN6cnrTaaRQpOaSiirAKQnFBOKYT3q0hpBTCc0E5pKZYUUU33NaJF7Ds96YTmgnNJTSICkJxQTimVY0goooq0iwpCcUE4phPemUkBPeijpzTCc0FATmkoorQAqSH/Wp9R/Oo6kh/1qfUfzpoHsf//T/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBOBTSc0E5pKpIpIKKKK1SKCgnuaQnFNJzTACc0wnsKCe1MyKtI0A9KAMUAYpa1AKKKQnFACE00nvRn1pvXk0AHXk0dfpR1+lITmtDQCc0w8dO9O6c0wnNWkAlFFFUkAUhOKCcUytEikgpvX6UvBpasoKYTmlJ9KbVJXAKKKK0SsWkFFFITiqGBOKZRRQAU0nsKCewphOKAAnFMpT1pK0NAoooppABPemk4+tB4+tNrRIaQUUUhOKssCcUyiiqSuCQHjrTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFMopODVpGgcGkJxwKCccCm1SRSCkJxSE45pnBrRIoODS0UhOKsAJxTCe5oJ9aKtIAoopCcUzQCcUyiirQBTSewoJ7U2rSAKQnFBOKYT3NUNIKKKKtIsKQnikY4FN9zTAPc0wnNBOab1+lA0g4NLRRWhYUhOKCcU0nNAATmmk4oJxTK0KSCgnuaDxyajppFBRRRVgFITignFMJ9atIaQUwnNBOaSmWkFFFFaJF7BTCc0E5pKaRAUhOKCcUyrGkFFFFWkWFITignFMplJBRRTCc0FATmkooq0AUUUUwCpIf9an1H86jqSH/Wp9R/Omgex//U/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITilJ7mmE5pgHJphb0oJ7UzIrVI0AnFAGKAMUtWAUUU0mgAJptBPc03ryaADryaOv0pevsKQn0rQuwhOaQ8UHio85q0hik5pKKKpIApCcUE4plaJFJBScGjg0tWUFITikJ9KbVJXAKKKK0SsWkFFFITiqGBOKZSk5pKACmk9hQT2FNoAKYTmgnNJVpGgUUUVSQBTScd+aCcU2tEhpBRRSE4qywJxTKKKpK4JBTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFMopODVpGiFppPYUE44FNqkhpBSE4oJxTK0SLE69aWikJxVgBOKZRRVpAFFFITimaCE+lNooq0AU0nsKC3pTatIApCcUE4plUNIKKKKtIsKQnFBOKZ7mmAe5phOaCc03g0FpBwaWiitBhRRTCc0ABOaaTignFMq0UkFGcUUwnNUkUJRRRVgFITignFMq0hpBTCc0E5pKZYUUUVaVi9gphOaCc0lUkQFITignFMqxpBRRRVpFhSE4oJxTKZSQUUUwnNBQE5pKKK0AKKKKACiiigAqSH/Wp9R/Oo6kh/wBan1H86aB7H//V/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoopOBQAtRk9zQT3NFUkUkFFFFapFBRQT3NMJzTHa4E5phPagntTCcVqkWBOKAMUAYpasAooppNACk4qMnFLTevJoAOvJo6/Sl6/QU0nNaFpCk9qj6cmj7tNq0hhRRRVJAFITignFMrRIpIKTg0nX6U6rKCkJxSE+lNqkrgFA9aKK0SsWkFFFITiqGBOKZnNKeaSgAppPYUE0wnFACk9zTCc0lFXY0CiignvVJAIT2FITj60E4+tNrRIaQUUUhOKse4E4plFFUlcpIM4phOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimk5pKTg1aRog4NITjgUE9hTapIaQUhOKCcVH15rRIsWiikJxVgBOKZQT3NFWkAUUU0ntTNBScUyiirsAU0ntQT2FNq0gCkJxQTimVQ0goooq0iwpCcUE8Uz3NMA9zTCc0E5pvBoGkHX6UtFFaFhRSZFNJzQAE5ppOKCcUwnvWhSQU3OOtHTk02mkUKTmkooqwCkJxQTimVaQ0gJ70wnNBOaSmWkFFFN9zWiRew6mE5oJzSU0iApCcUE4plWNIKKKKtIsKQnFBOKYT3plJAT3o9zRTCc0FATmkoorQAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/1qfUfzpoHsf/1v0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKYTmgnNJVJFJBRRRWqRQUhOKCcU0nNMAJzTCewoLelMJ7VqkaAT6UAYoAxS1YBRRTSaAFJxTM+tITik68mgA68mjr9KOv0pCc1oaATmm9OT1oJxTSc1aQCUUUVSQBSE4oJxTK0SKSCm9fpS8GlqygpCcUE4plUlcAooorRKxaQUUUhOKoYE4plFFABTSewoJ7Cm0AITimUpOaStEaBRRRTSAAfSm9PrQTj602tEhpBRRSE4qywJxTKKKpK4JBTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFMooq0jQTg0hOOBQTjgU2qSGkFNJxyetKTio+TzWiRYd/pS0UhOKsAJxTCfWiirSAKKKQnFM0EJ9KbRRV2AKaT2FBPYU2rSAKQnFBOKZVDSAnuaKKKtIsKQnFBOKZ7mmAe5phOaCc03g0FpB1+lLRRWgwpCcUE4ppOaAAnNNJxQTimE960KSEJxSfd60dOabTSKCiiirAKQnFBOKZVoaQZ9aYTmgnNJTLSCiiitEitgphOaCc0lNIkKQnFBOKZVjSCiiirSLCkJxQTimUykgoophOaCgJzSUUVaAKKKKYBRRRQAUUUUAFFFFABUkP8ArU+o/nUdSQ/61PqP500D2P/X/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITignFNJzTACc0wt6UE9qYTitUjQCcUAYoHSlqwCiikJxQAhNNJ7mim9eTQAdeTR1+lHU+1ITmtC0BOaaTilzjk1HVpDFJzSUUVSQBSE4oJxTK0SKSCk4NHBpasoKaT6UpOKZVJXAKKKK0SsWkFFFITiqGBOKaTmgnNJQAU0nsKCewppPc0AFMJzQTmkqkrGgUUUhPYVaQC00nFBOPrTa0SGkFFFITirLAnFMooqkrgkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUylJzTeDVpGgcGkJ7CgnHAptUkNIKQnFBOKZWiRYdetFFITirACcU0nNJRVpAFFFNJ9KZoITmkooq0gCmlvSgt6U2rSAKQnFBOKZVDSCiiirSLCkJxQTime5pgHuaYTmgnNN6/SgtIODS0UVoMKKKYTmgAJzTScUE4plaFJAT3oozimE5ppFATmkooqwCkJxQTimE96tIaQUwnNBOaSmWFFFHua0SK2CmE5oJzSU0iQpCcUE4plWNIKKKKtIsKQnFBOKYT3plJAT3oo9zTCc0FATmkoorQAooooAKKKKACiiigAooooAKKKKACpIf9an1H86jqSH/AFqfUfzpoHsf/9D9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBOBTCe5pSc0lUkUkFFFFapFBRSE4ppOaYATmmE9qC3pTCe1apGgE4oAxQBilqwCiikJxQAhNNJ70E+tN68mgA68ml6/QUnX6UE9q0NAJ9KjJxR05NNq0gCiiiqSAKQnFBOKZWiRSQU3r9KOv0p1WUFNJ9KCfSm1SVwCiiitErFpBRRSE4qhgTimnmkooAKaT2FBPYUwnFAATimUUVoaBRRSE9qaQCk96aTj60dPrTfc1okNIKKKQnFWWBOKZRRnFUlcEgphOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUUnBq0jQOvFITjgUE9hTapIaQUhOKQnHXrTODWiRYdeaWikJxVgBOKYT3NBPrRVpAFFFITimaCE9qbRRVoAppPYUE9hTatIApCcUE4phPc1Q0goooq0iwpCeKCcUz3NMA9zTCc0E5pvBoGkHX6UtFFaFhRSE4ppOaAAnNNJxQTioycVoUkKT3o6c03pyabTSKCiiirAKQnFBOKYT61aQ0gphOaCc0lMtIKKKD71okXsN9zSE5oJzSU0iApCcUE4plWNIKKKKtIsKQnFBOKZTKSAnvRR060wnNBQE5pKKK0AKKKKACiiigAooooAKKKKACiiigAooooAKkh/1qfUfzqOpIf9an1H86aB7H//0f0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKjJ7mlJzSVSRSQUUUVqkUFGcUhOKaTmmAE5phPYUE9qYT6VqkaATigdKAMUtWAUUU0mgAJptBPc03ryaADryaOv0o6/SkJzWhoBOaTOKDxTCc1aQATmkooqkgCkJxQTimVokUkFJwaODS1ZQUhOKQntTapK4BRRRWiVi0goopCcVQwJxTKKKACmk9hQT2FNoACe5phOaCc0laWsaBRRRTSAKaTj60EgfWm1okNIKKKQnFWWBOKZRRVJXElYKYTmgnNJWuwwooopgFMJzQTmkqkgCiikJxVABOKZRRVpGiCmk44FBPYU2qSGkFITignFR8GtEiw4NLRSE4qwAnFMz60UVaQBRRSE4pmgE4plFFXYAppPYUE9qbVpAFITignFMqhpBRRRVpFhSE4oJFM9zTAPc0wnNBOabwaC0g4NLRRWgwpCcUtMJzQAE5ppOKCcUwnvWhSQE96b05NOph5ppFCUUUVYBSE4oJxTKuw0gphOaCc0lMtIKKKK0SK2CmE5oJzSU0iQpCcUE4plWNIKKKKtIsKQnFBOKYT3plJBRQeKYTmgoCc0lFFaWsAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFSQ/wCtT6j+dR1JD/rU+o/nTQPY/9L9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoopOBQAtMJzSE9zRVJFJBRRRWqRQUE45ophOadirATmmFvSgt6UwnFapFAT2oAxQBilqwCiimk0ABNNoJ7mm9eTQAdeTR1+lHX6UE+laFpCE5pOnWmk4pCc1aQxKKKKpIApCcUE4plaJFJBScGjg0tWUFITignFMqkrgFFFFaJWKSsFFFITiqKAnFMzmlPNJQAU0ntQT2FNJ7mgAphOaSirsaBRRQT3qkgDPamk4+tBOPrTa0SGkHuaKKQnFWPcCcUyikJxVJXKSFphOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUpOabwatI0QcGkJxwKCewptUkNIKQnFBOKZWiRYUUUhOKsAJxTKCe5oq0gCiikJxTNAJxTKKKuwBTSe1BPYU2rSAKQnFBOKZVDSCiiirSLCkJxQTime5pgHuaYTmgnNN4NBaQcGloorQYUUUwnNAATmmk4oJxTK0KSCjpzTc44ptNIoM5oooqwCkJxQTimU0hpBTCc0E5pKssKKKbnua0SL2HUwnNBOaSmkQFITignFMqxpBRRRVpFhSE4oJxTCe9MpICe9HTrTeBSE5oKAnNJRRWgBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFSQ/61PqP51HUkP8ArU+o/nTQPY//0/0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5pCe5oqkikgooorVIoKKM4phOaYATmmE9qCe1MJxVpGgE9qAMUAYpa1AKKKQnFAATimZ9aKb15NAB15NHX6UdfpSE5rQuwE5pnTk9ad05phOatIYlFFFUkAUhOKCcUytEikgpvX6UvBpasoKaT6UpOKZVJXAKKKK0SsWkFFFITiqGBOKZRRQAU0nsKCewppPc0AITimUUVoaBRRRTSAQntSdPrQTj602tEhpBRRSE4qywJxTKKKpK4JBnFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNBODSE44FBOOBTapIaQUhOKCcVHwa0SLFoopCcVYATimE9zRn1oq0gCiikJxTNAJxTKKKtIAppPYUE9hTatIApCcUE4plUNICe5oooq0iwpCcUE4pnuaYB7mmE5oJzTeDQNIODS0UVoWFITignFNJzQAE5ppOKCcUwnvWhSQhOKTpyaOnJ602mkUFFFFWAUHjrSE4plWkNICfWmE5oJzSUy0gooorRIrYD+lMJzQTmkppEhSE4oJxTKsaQUUUVaRYUhOKCcUymUkBPeijpzTCc0FATmkooq0AUUUUwCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKkh/wBan1H86jqSH/Wp9R/Omgex/9T9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFBPc0HjrTCc0wAnNMJ7CgnsKYTitUjQCfSgDFAGKWrAKKKQnFACE00nuaKb15NAB15NHX6UdfpSE5rQtATmkPFHTrTCc1aQxKKKKpIApCcUE4plaJFJBScGjg0tWUFNJ7UpOKZVJXAKKKK0SsWkFFFITiqGBOKZRnNFABTSewoJ7Cm0AFR0pOaSrRoFFFFUkAU0nH1oJx9ab7mtEhpBRRSE4qywJxTKKKpK4krBTCc0E5pK1SsMKKKKYBTCc0E5pKpIAoopCcVQATimUUnBq0jQWmk9hQTjgU2qSGkFITignFMrRIsTr1paKQnFWAE4plBPrRVpAFFFMJzTNBxOKZRRVoAppPagntTatIApCcUE4plUNIKKKKtIsKQnFBOKZ7mmAe5phOaCc03r9KC0g4NLRRWgwoophOaAAnNNJxQTimVoUkFB45o6c1HnNNIoKKKKsApCcUE4plWkNIKYTmgnNJTLCiiitEi9gphOaCc0lNIgKQnFBOKZVjSCiiirSLCkJxQTimUykgoo6daYTmgoCc0lFFaAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUkP+tT6j+dR1JD/rU+o/nTQPY//V/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAE4FMJ7mlJzSVSRSQUUUVqkUFFFMJzTACc0wntQW9KYT2rVI0AnFAGKAMUtWAUUUhOKAEJptGfWm9eTQAvuaTr9KOv0oJ7VoWhCc0mcU3OOtNq0hik5pKKKpIApCcUE4plaJFJBScGk6/SnVZQUhOKQntTapK4BRQR60VolYtIKKKQnFUMCcU080E5pKACmk9qCewphOKAFJ7mmE5oJzSVaNAoopCe1UkApPemk4+tHT602tEhpBRRSE4qywJxTKKKpK4JBnFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcU0nNJScGrSNA4NIT2FBOOBTapIaQUhOKUnHWo60SLCiikJxVgBOKYT3ooq0gCiikJxTNBpOaSiirQBTSewoLelNq0gCkJxQTimE9zVDSCiiirSLCkJxQTime5pgHuaYTmgnNN6/SgtIODS0UVoMKKKYTmgAJzTScUE4phPetCkgozjmjp1qOmkUKeaSiirAKQnFHTk0yrSGkFMJzQTmkplhRRTev0rRIvYdTCc0E5pKaRAUhOKCcUyrGkFFFFWkWFITignFMJ70ykgJ70dOaOnWmE5oKAnNJRRWgBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFSQ/61PqP51HUkP+tT6j+dNA9j//1v0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFGcUE9zTCc0wAnNMJ7UFvSmE+lapGgE4oAxQBilqwCiimk0AKTimHjrQT3NN68mgA68mjr9KOv0pCc1oaATmk6c0HimE5q0gAnNJRRVJAFITignFMrRIpIKTg0cGlqygppPakJzSVSVwCiiitErFpBRRSE4qhgTimUUUAFNJ7CgnsKaT3NACE4plFFaGgUUUU0gA+1NJx9TQTj602tEhpBRRSE4qywJxTKKKpK4krAeOtMJzQTmkrVKwwooopgFMJzQTmkqkgCiikJxVABOKZRRVpGiE4NITjgUE9hTapIaQUhOKCcVH161okWHJ60tFITirACcUzPrRRVpAFFFITimaATimUUVdgCmk9hQW9KbVpAFITignFMqhpBRRRVpFhSE4oJFM9zTAPc0wnNBOabwaC0g6/SloorQYUhOKCcU0nNAATmmk4oJxTCe9aFJAT3pvTk9aOnJptNIoKKKKsApCcUE4plWhpBTCc0E5pKZYUUUVokVsFMJzQTmkppEhSE4oJxTKsaQUUUVaRYUhOKCcUymUkFHTmg8UwnNBQE5pKKKuwBRRRTAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/1qfUfzpoHsf/1/0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArwL9pr4j+JPhP8AB7VvHHhQw/2lZS2qR+enmR4mnSNsrkZ4Y9699r5F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UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFSQ/61PqP51HUkP+tT6j+dNA9j//1v0kooor/Kc/pQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACoye5pSc0lUkUkFFFFapFBSE4oJxTSc0wAnNMJ7UFvSmE+lapGgE4oAxRgUtWAUUU0mgBScUyim9eTQAdeTR1+lHX6UhOa0NAJzTDxzTunWo6tIBSc0lFFUkAUhOKCcUytEikgpvX6UdfpTqsoKaT6UpOKZVJXAKKKK0SsWkFFFITiqGBOKZ160UUAFNJ7UE9hTCcUABOKaTmkorQ0CiiimkAhPYUhOPrQTj602tEhpBRRSE4qywJxTKKKpK4JBTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFMopODVpGiDg0hOOBQT2FNqkhpBSE4oJxUfXmtEixTyc0UUhOKsAJxTKKKtIAoopCcUzQCcUyiirsAU0ntQW9KbVpAFITignFMqhpBRRRVpFhTS2KUkUz3NMA9zTCc0E5pvBoLSDr9KWiitBhSE4oJxTSc0ABOaaTignFMJ71oUkBPem9OTR05NNppFBRRRVgFITignFMq0NICe9MJzQTmkplhRRRWiRewH37UwnNBOaSmkQFITignFMqxpBRRRVpFhSE4oJxTKZSQUdOaDxTCc0FATmkoorQAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/wBan1H86aB7H//X/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAphOaQnuaKpIpIKKKK1SKCkJxQTimk5pgBOaYT2oLelM+lapGgE4oAxQBilqwCiimk0ABNNJ7mik9zQAnXk0dfpR1+lITmtC0BOaTpzSE4ppOatIYmc0UUVSQBSE4oJxTK0SKSCk4NHBpasoKaT2pScUyqSuAUUUVolYtIKKKQnFUMCcUylPNJQAU0nsKCewptABTCc0E5pKtI0CiiiqSAKaTj8aCcfWm1okNIKKKQnFWPcCcUyiiqSuUkFMJzQTmkrXYAooopgFMJzQTmkqkgCiikJxVABOKZRRVpGgU0nHAoJ7Cm1SQ0goJxzSE4plaJFidTmlopCcVYATimUE96KtIAoopCcUzQCcUyiitACmk9qCewptUkAUhOKCcUyqGkBPc0UUVaRYUhOKCcUz3NMA9zTCc0E5pvBoLSDr9KWiitBhSHpS0wnNAATmmk4oJxTCe9aFJAT3o6c0UwnNNIoSiiirAKQnFBOKZVpDSCmE5oJzSUywooorRIrYKYTmgnNJVpEhSE4oJxTKY0goooq0iwpCcUE4plMpICe9HTmimE5oKAnNJRRWgBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVJD/rU+o/nUdSQ/61PqP500D2P//Q/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACmE5pCe5oqkikgooorVIoKKQnFNJzTRSAnNMJ7CgnsKYT6VaRQE4oHSgDFLWoBRRSE4oACcUwnuaKb15NAB15NHX6UdfpSE5rQtATmkzim9OT1ptWkMKKKKpIApCcUE4plaJFJBTev0o6/SnVZQU0n0oJ9KbVJXACe9FA9aK0SsWkFFFITiqGBOKaTmkzmigAppPYUE9hTCcUABOKaTmgnNJVpGgUUUhPYVSQAT2pCcD3oJx9abWiQ0goopCcVZYE4plFFUlcEgphOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimk5pKTg1aRoHBpCccCgnHAptUkNIKQnFBOKZWiRYUUUhOKsAJxTKKKtIA6/SiikJxTNBpOaSiirSAKaW9KCe1Nq0gCkJxQTimVQ0gJ9aKKKtIsKQnFIWxTfc0wD3NMJzQTmm9fpQWkHBpaKK0GFFFMJzQAE5ppOKCcUwnvWhSQUHjrTenJ602mkUKTmkooqwCkJxQTimE96tIaQUwnNBOaSmWFFFN/3q0SL2DPekJzQTmkq0iApCcUE4plMaQUUUVaRYUhOKCcUymUkBPejp1o6c0wnNBQE5pKKK0AKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/wBan1H86aB7H//R/SSiiiv8pz+lAooooAKKKKACiiigAooooAKKKKACiiigAooooATgU0nNBOaSqSKSCiiitUigpCcUE4ppOaYATmmFvSgt6UwnFWkaATigDFAGKWtQCiikJxQAhNNJ70E+tN68mgA68mjr9KOv0pCc1oaATmkPFHTrTCc1aQCUUUVSQBSE4oJxTK0SKSCm9fpS8GlqygphOaUn0ptUlcAooorRKxaQUUUhOKoYE4plFFABTSewoJ7CmE4oACcUylJzSVoaBRRRTSACfSmk4+tBOPrTa0SGkFFFITirLAnFMooqkrgkB460wnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKKtI0E4NITjgUE9hTapIaQUhOKCcVHwa0SLDrzS0UhOKsAJxTKM+tFWkAUUUwnNM0HE4plFFWgCmlvSgntTatIApCcUE4phPrVDSCiiirSLCkJ4pGOBTfc0wD3NMJzQTmm9fpQWkHBpaKK0GFITignFNJzQAE5ppOKCcUwnvWhSQE96b05NH3etNppFBRRRVgFITignFMJ9atIaQUwnNBOaSmWkFFFFaJFbBTCc0E5pKtIkKQnFBOKZTGkFFFFWkWFITignFMJ70ykgopCcU0nNBQE5pKKK0AKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKkh/wBan1H86jqSH/Wp9R/Omgex/9L9JKKKK/ynP6UCiiigAooooAKKKKACiiigAooooAKKKKACmE5oJzSVSRSQUUUVqkUFITilJ7mmE5pgBOaYT2oJ7UwnFapGgE4oAxQBilqwCiimk0ABNNoJ7mm9eTQAdeTR1+lHX6UhOa0LsBOaTOKDxUdWkMUnNJRRVJAFITignFMrRIpIKKTg0tWUFITikJ9KaT3qkrgFFFFaJWLSCiikJxVDAnFM680pOaSgAppPYUE9hTaACmE5oJzSVaRoFFFIT2qkgFppOPrQTj602tEhpBRRSE4qywJxTKKKpK4JBTCc0E5pK12AKKKKYBTCc0E5pKpIAoopCcVQATimUUnBq0jRC00nsKCccCm1SQ0gpCcUE4plaJFhRRSE4qwAnFMJ70UVaQBRRSE4pmgE4plFFWgCmk9hQW9KbVpAFITignFMJ7mqGkFFFFWkWFITignFM9zTAPc0wnNBOabwaC0g4NLRRWgwoophOaAAnNNJxQTimE960KSAnvRnFFMJzTSKAnNJRRVgFITignFMq0hpBTCc0E5pKZYUUUZ71okXsFMJzQTmkq0iApCcUE4plMaQUUUVaRYUhOKCcUwnvTKSAnvRQeKYTmgoCc0lFFaAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUkP+tT6j+dR1JD/rU+o/nTQPY//9P9JKKKK/ynP6UCiiigAooooAKKKKACiiigAoopOBQAtRk9zSk5pKpIpIKKKK1SKCignuaYTmmAE5phb0oJ7CmHpVpGgE+lAGKAMUtagFFFNJoAUnFRk4pab15NAB15NHX6UdfpSE5rQtIUntTOnJ60vTmo6tIYUUUVSQBSE4oJxTK0SKSCk4NJ1+lOqygpCcU0nNJVJXAKB60UVolYtIKKKQnFUMCcUzOaKKACmk9hQT2FMJxQAE4ppOaSirsaBRRQT3qkgEJ7CkJx9aCcfWm1okNIKKKQnFWPcCcUyig8dapK5SQZxTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFNJzSUnBq0jRBwaQnHAoJxwKbVJDSCkJxQTio+DWiRYtFFITirACcUygnuaKtIAoopCcUzQaTmkooq7AFNJ7UE9hTatIApCcUE4plUNIKKKKtIsKQnFBPFM9zTAPc0wnNBOabwaC0g6/SloorQYUUhOKaTmgAJzTScUE4phPetCkgpucdaOnJptNIoKKKKsApCcUE4plWkNICe9MJzQTmkplpBRRRWiRew33NITmgnNJTSICkJxQTimVY0goooq0iwpCcUE4plMpIKOnNFMJzQUBOaSiitACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKkh/wBan1H86jqSH/Wp9R/Omgex/9T9JKKKK/ynP6UCiiigAooooAKKKKACiiigAphOaCc0lUkUkFFFFapFBSE4oJxTSc0wAnNMJ7UFvSmE4q0jQMigDFAGKWtQCiimk0AKTimZ9aKb15NAB15NHX6UdfpSE5rQ0AnNJ05oPFMJzVpABOaSiiqSAKQnFBOKZWiRSQUnBo4NLVlBSE4oJxTKpK4BRRRWiVi0goopCcVQwJxTKKKACmk9hQT2FNoAQnFNPWgnNJWiNAoooppAFNJA+tBOPrTa0SGkFFFITirHuBOKZRRVJXKSCmE5oJzSVqlYAooopgFMJzQTmkqkgCiikJxVABOKZRRVpGgnBpCccCgnsKbVJDSCmk45pScVH161okWHBpaKQnFWAE4phPrRRVpAFFFITimaATimUUVdgCmk9qCewptWkAUhOKCcUyqGkBPc0UUVaRYU1jgUpOKZ7mmAe5phOaCc03g0FpB1+lLRRWgwpCcUtMJzQAE5ppOKCcUytCkhCcUnTk07pzUdNIoKKKKsApCcUE4plWkNICfWmE5oJzSUywooorRIrYKYTmgnNJVpEhSE4oJxTKY0goooq0iwpCcUE4plMpIKQnFLTCc0FATmkoorQAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/wBan1H86aB7H//V/SSiiiv8pz+lAooooAKKKKACiiigAphOaQnuaKpIpIKKKK1SKCkJxS0wnNMAJzTC3pQT2phOKtI0AnFAGKAMUtagFFFITigBCaaT3NITik68mgA68ml6+wpOv0oJ7VoWgJ9KYTil6c1HVpDDOaKKKpIApCcUE4plaJFJBScGjg0tWUFNJ9KUnFMqkrgFFA9aK0SsWkFFFITiqGBOKaTmkzmigAppPYUE9hTSe5oAKYTmgnNJVpGgUUUhPYVSQC00nFBOPrTa0SGkFFFITirLAnFMooziqSuCQUwnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKUnNN4NWkaBwaQnsKCccCm1SQ0gpCcUE4plaJFidetLRSE4qwAnFMooq0gCiikJxTNAJxTKKKtIAppb0oJ7Cm1aQBSE4oJxTKoaQUUUVaRYUhOKCcUz3NMA9zTCc0E5pvX6UFpBwaWiitBhRRTCc0ABOaaTignFMrQpIKKbnHWkJzTSKAnNJRRVgFITignFMJ71aQ0gphOaCc0lMsKKKD61okVsFMJzQTmkq0iQpCcUE4plMaQUUUVaRYUhOKCcUwnvTKSAnvR060dOaYTmgoCc0lFFaAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUkP+tT6j+dR1JD/rU+o/nTQPY//W/SSiiiv8pz+lAooooAKKKKAE4FMJ7mlJzSVSRSQUUUVqkUFFITimk5pgBOaYT2oJ7CmE+lWkaATigDFAGKWtQCiikJxQAhNNoz603ryaADryaXr9BSdfpSE5rQ0FJ9KbnHNB4qOrSAKKKKpIApCe1BOKZWiRSQU3r9KOv0p1WUFNJ9KUnFMqkrgFFFFaJWLSCiikJxVDAnFNPNJRQAU0nsKCewphOKAAnFMoorQ0CiigH0ppABPemk4+tHT602tEhpBRRSE4qywJxTKKKpK4JBTCc0E5pK1SsAUUUUwCmE5oJzSVSQBRRSE4qgAnFMopODVpGgcGkJ7CgnHAptUkNIKQnFITjk9aZ3+laJFi9eaKKQnFWAE4phPc0E+tFWkAUUU0n0pmgpOKZRRVoAppPYUE9hTatIApCcUE4phPc1Q0goooq0iwpCeKCcUz3NMA9zTCc0E5pvX6UFpBwaWiitBhRSE4ppOaAAnNNJxQTioycVoUkKT3pvTmj7vWm00igoooqwCkJxQTimZ9atIaQUwnNBOaSmWkFFFFaJF7Dfc0hOaCc0lNIgKQnFBOKZVjSCiiirSLCkJxQTimUykgopCcU0nNBQE5pKKK0AKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/1qfUfzpoHsf/1/0kooor/Kc/pQKKKKACoye5pSc0lUkUkFFFFapFBSE4oJxTSc0wAnNMLelBb0phOKtI0AntQBigDFLWoBRRTSfSgAJphOKUnuab15NAB15NHX6UdfpQT6VoWhCc00nFBOKaTmrSGJRRRVJAFITignFMrRIpIKTg0cGlqygpCcUhPpTapK4BRRRWiVi0goopCcVQwJxTKUnNJQAU0nsKCewptABTCc0E5pKuxoFFFFUkAU0nH1oJxTa0SGkFFFITirLAnFMooqkrgkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyik4NWkaIWmk44FBPYU2qSGkFITignFR9etaJFhyeaWikJxVgBOKZn1pSc0lWkAUUUhOKZoBOKZRRVoAppPYUFvSm1aQBSE4oJxTKoaQUUUVaRYUhOKCcUz3NMA9zTCc0E5pvBoLSDg0tFFaDCkJxS0wnNAATmmk4oJxTCe9aFJAT3pvTk06mE5ppFCUUUVYBSE4oJxTKtIaQUwnNBOaSmWFFFFaJFbBTCc0E5pKtIkKQnFBOKZTGkFFFFWkWFITignFMJ70ykgpCcUtMJzQUBOaSiitACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpIf9an1H86jqSH/Wp9R/Omgex//Q/SSiik4Ff5Tn9KC1GT3NBPc0VSRSQUUUVqkUFITilphOadirATmmFvSgntTCcVaRQE4oAxQBilrUAooppNACk4plBPem9eTQAdeTR1PtR1+lBPpWhaQhOaTOKM45qOrSGFFFFUkAUhOKCe1MrRIpIKTg0nX6U6rKCkJxSE+lNqkrgFFFFaJWLSCiikJxVDAnFMzmlPNJQAU0nsKCewppPc0ABPc0wnNJRV2NAoooJ71SQCE9hSE4+tBOPrTa0SuNIKKKQnFWPcCcUyiiqSuUkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUylJzTevFWkaBwaQnHAoJxwKbVJDSCkJxQTimVokWFFFITirACcUygnuaKtIAoopCcUzQQn0ptFFXYAppb0oJ7Cm1aQBSE4oJxTKoaQUUUVaRYUhOKCcUz3NMA9zTCc0E5pvX6UFpB1+lLRRWgwoophOaAAnNNJxQTimVoUkFHTmjpzUdNIoM5oooqwCkJxQTimVaQ0gJ70wnNBOaSmWFFFN9zWiRew73NMJzQTmkppEBSE4oJxTKsaQUUUVaRYUhOKCcUymUkBPejOOTR05phOaCgJzSUUVoAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUU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AUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVJD/rU+o/nUdSQ/61PqP500D2P/1P0dJzTCe1Bb0phPpX+WSR/TgHpQBigDFLWoBRRTSaAFJxTKCe5pvXk0AHXk0dfpR1+lITmtDQCc00nFBOKZVpAFFFFVYApCcUE4plaJFJBScGjg0tWUFITignFMqkrgFFFFaJWLSCiikJxVDAnFMoooAKaT2FBPpTSe5oACe5qOiitDQKKKKaQBTScfWgnH1ptaJDSCiikJxVlgTimUUVSVxJWCmE5oJzSVqlYYUUUUwCmE5oJzSVSQBRRSE4qgAnFMooq0jRBTSccCgnsKbVJDSCkJxQTio+vWtEiw4NLRSE4qwAnFMz60UVaQBRRSE4pmghPam0UVdgCmk9hQW9KbVpAFITignFMqhpBRRRVpFhSE4oJFM9zTAPc0wnNBOabwaC0g4NLRRWgwpCcUE4ppOaAAnNNJxQTimE960KSAnvTenJ60Hjp3ptNIoKKKKsApCcUE4plWkNIKYTmgnNJTLSCiiitEitgphOaCc0lNIkKQnFBOKZVjSCiiirSLCkJxQTimUykgoPHNHTrTCc0FATmkoorQAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpIf9an1H86jqSH/Wp9R/Omgex//V/RcnFAGKB0pa/wAtz+nAooppNACk4plFN68mgBevJ6UnX6UdfpSE5rQ0AnNITjrRnFMPNWkAmc0U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BhSE4oJxTSc0ABOaaTignFMJ71oUkBPem9OTR05NNppFBRRRVgFITignFMq0NICe9MJzQTmkplhRRRWiRewUwnNBOaSmkQFITignFMqxpBRRRVpFhSE4oJxTKZSQUdOaDxTCc0FATmkoorQAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKkh/wBan1H86jqSH/Wp9R/Omgex/9L9DM5ooor/ADASP6gCkJxQTimVokUkFJwaODS1ZQU0ntSk4plUlcAooorRKxaQUUUhOKoYE4plKeaSgAppPYUE9hTaACmE5oJzSVaRoFFFFUkAU08dO9BOKbWiQ0goopCcVY9wJxTKKKpK5SQUwnNBOaStUrAFFFFMAphOaCc0lUkAUUUhOKoAJxTKKKtI0Cmk9qCewptUkNIKQnFBOKj4NaJFh1OaWikJxVgBOKZRRVpAFFFNJ7UzQUnFMoorQAppPagnsKbVJAFITignFMqhpAT3NFFFWkWFITignFM9zTAPc0wnNBOab1+lA0g6/SloorQsKQ9KWmE5oACc00nFBOKYT3rQpICe9HTmimE5ppFCUUUVYBSE4oJxTKtIaQUwnNBOaSmWFFFFaJFbBTCc0E5pKaRIUhOKCcUyrGkFFFFWkWFITignFMplJAT3o6c0UwnNBQE5pKKKuwBRRRTAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpIf9an1H86jqSH/Wp9R/Omgex//9P9DKQnFBOKZX+YiR/USQU3r9KOv0p1WUFITikJ9KbVJXACe9FFFaJWLSCiikJxVDAnFNJzSZzRQAU0nsKCewphOKAAnFNJzQTmkrQ0CiikJ7CmkAE9qToPejp9abWiQ0goopCcVZYE4plFFUlcEgphOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUUVaRoFNJ9KCe1NqkhpBSE4oJxUfXrWiRYcGlopCcVYATimE+tFFWkAUUUhOKZoBOKZRRVpAFNLelBPam1aQBSE4oJxTKoaQUUUVaRYUhOKQtim+5pgHuaYTmgnNN6/SgtIODS0UVoMKKKYTmgAJzTScUE4phPetLWKSCg8dab05NNppFCk5pKKKsApCcUE4phPerSGkFMJzQTmkplhRRR7mtEi9hue9ITmgnNJTSICkJxQTimVY0goooq0iwpCcUE4plMpICe5o6daOnNMJzQUBOaSiitACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpIf9an1H86jqSH/Wp9R/Omgex//9T9CKb1+lLwaWv8xz+pApCcUhPpTapK4BRRRWiVi0goopCcVQwJxTKKKACmk9qCewphOKAAnFMpSc0laItBRRRTSGBPpTen1oJx+NNrRIaQUUUhOKse4E4plFFUlcpIDx1phOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUUVaRoFNJ7CgnsKbVJDSCkJxQTio+DWiRYdeaWikJxVgBOKZRn1oq0gCiimE5pmg4nFMooq0rAFNJ7UE9qbVpAFITignFMqhpBRRRVpFhSE8UE4pme5pgHuaYTmgnNN6/SgtIODS0UVoMKQnFBOKaTmgAJzTScUE4phPersUkBPem9OTR93rTapIoKKKKsApCcUE4phPrVpDSCmE5oJzSUy0gooorRIrYKYTmgnNJTSJCkJxQTimVY0goooq0iwpCcUE4plMpIKOnWjOKYTmgoCc0lFFaAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUkP8ArU+o/nUdSQ/61PqP500D2P/V/QikJxQTimE96/zJSuf1IFFFFaJWLSCiikJxVDAnFNPNBOaSgAppPYUE9hTaACmE5oJzSVdjQKKKQntVJALTScfWg8fWm1okNIKKKQnFWWBOKZRRVJXBIKYTmgnNJWqVgCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaIKaT2FBPam1SQ0gpCcUE4qPg1okWHX6UtFITirACcUwnvRn1oq0gCiimk9qZoITmkooq0AU0nsKC3pTatIApCcUE4plUNIKKKKtIsKQnFBOKYfU0wCmE5oJzTeDQNIODS0UVoWFFFMJzQAE5ppOKCcUytCkgJ70dOtFMJzTSKAnNJRRVgFITignFMq0hpBTCc0E5pKZYUUUZ71okXsFMJzQTmkppEBSE4oJxTKsaQUUUVaRYUhOKCcUwnuaZSQE96KKYTmgoCc0lFFWgCiiimAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFSQ/61PqP51HUkP+tT6j+dNA9j/9b9BKB60UV/malY/qZKwUUUhOKooCcUzOaKKACmk9hQT2FMJxQAE4ppOaSitDQKKKQnFNIAJ7CkJx9aOn1ptapDSCiikJxVD3AnFMooPHWqSuUkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNEFITikJxwKbVJDSCkJxQTio+vNaJFh160tFITirACcUygnuaKtIAoopCcUzQCcUyiirsAU0ntQT2ptWkAUhOKCcUyqGkFFFFWkWFITignime5pgHuaYTmgnNN4NBaQdfpS0UVoMKKQnFNJzQAE5ppOKCcUwnvVopIKb05NHTk02qSKCiiirAKQnFBOKZVpDSCmE5oJzSUy0gooorRIvYb7mkJzQTmkppEBSE4oJxTKsaQUUUVaRYUhOKCcUymUkFFHTrTCc0FATmkoorQAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/AFqfUfzqOpIf9an1H86aB7H/1/0EoopCcV/mef1QBOKZRRQAU0ntQT2FNoAQnFMpSc0laI0CiiimkAU3+tBOPrTa0SGkFFFITirHuBOKZRRVJXKSCmE5oJzSVqlYAooopgFMJzQTmkqkgCiikJxVABOKZRRVpGgU0ntQT2FNqkhpBTScc0pOKj6/StEiw4NLRSE4qwAnFMJ9aKKtIAoopCcUzQaTmkoorQAppPagt6U2qSAKQnFBOKZVDSCiiirSLCkJxQTimUwA+pphOaCc03g0FpB1+lLRRWgwpCcUtMJzQAE5ppOKCcUwnvWhSQhOKTpyetO6c1HTSKCiiirAKQnFBOKZVpDSAn1phOaCc0lMsKKKK0SK2CmE5oJzSU0iQpCcUE4plWNIKKKKtIsKQnFBOKYT3plJBR05ophOaCgJzSUUVoAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFSQ/61PqP51HUkP+tT6j+dNA9j//0P0DJxTSc0mc0V/mef1QFNJ7CgnsKYTigBaYTmgnNJWhoFFFIT2FNIBabnHFHT602tEhpBRRSE4qywJxTKKM4qkrgkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNAppPagntTapIaQUhOKCcVH161okWHBpaKQnFWAE4plFFWkAUUU0n0pmgpOKZRRVpAFNLelBPYU2rSAKQnFBOKZVDSCiiirSLCkJxQTime5pgB9TTCc0E5pvX6UDSDg0tFFaFhRRTCc0ABOaaTignFMrQpIKDxTc45NITmmkUBOaSiirAKQnFBOKYT3q0hpBTCc0E5pKZYUUU33NaJFbDqYTmgnNJTSJCkJxQTimVY0goooq0iwpCcUE4phPemUkBPeijpzTCc0FATmkooq7AFFFFMAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKkh/1qfUfzqOpIf8AWp9R/Omgex//0f0AppPYUE9hTCcV/mef1QBOKZRRWhoFFFBPpTSAQnFJ0+tHT6mm1okNIKKKQnFWPcCcUyiiqSuUkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNAppOOBSk4plUkNIKQnFITjk9aZ3+laJFh15paKQnFWAE4phPc0E+tFWkAUUUhOKZoBOKZRRVpWAKaT2oJ7Cm1aQBSE4oJxTKoaQUUUVaRYUhOKCcUz3NMBPcmmk5oJzTev0oLSDg0tFFaDCkyKCcU0nNAATmmk4oJxUZOK0KSFJ703pyaOnJptNIoKKKKsApCcUE4phPrVpDSCmE5oJzSUy0gooorRIvYKYTmgnNJTSICkJxQTimVY0goooq0iwpCcUE4plMpICe9HTrRTCc0FATmkoorQAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/wBan1H86aB7H//S+/KYTmgnNJX+aVj+rAoooJ71SQBTScfWjOPrTa0SGkFFFITirLAnFMooqkrgkFMJzQTmkrVKwBRRRTAKYTmgnNJVJAFFFITiqACcUyiirSNEFNJ7CgnsKbVJDSCkJxQTio+vWtEixc55oopCcVYATimUUVaQBRRTSfSmaCk4plFFWgCmk9hQW9KbVpAFITignFMqhpBRRRVpFhSE4oJxTD6mmAUwnNBOabwaBpBwaWiitCwpCcUtMJzQAE5ppOKCcUytCkgJ703pyadTCc00ihKKKKsApCcUE4plWkNIKYTmgnNJTLCiiitEitgphOaCc0lNIkKQnFBOKZVjSCiiirSLCkJxQTimE96ZSQUUUwnNBQE5pKKK0tYAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKkh/wBan1H86jqSH/Wp9R/Omgex/9P74oopCcV/mokf1YBPYUhOPrR0+tNrVIaQUUUhOKoe4E4plFFUlcpIKYTmgnNJWqVgCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaBSE4pCewptUkNIKQnFBOKj4NaJFhwaWikJxVgBOKZQT3NFWkAUUU0ntTNAJ9KbRRV2AKaW9KCe1Nq0gCkJxQTimVQ0goooq0iwpCcUE8etM9zTAPc0wnNBOabwaC0g6/SloorQYUUUwnNAATmmk4oJxTCe9Wikgozim9OTTapIoUnNJRRVgFITignFMq0hpAT3phOaCc0lMsKKKb7mtEi9h3uaYTmgnNJTSICkJxQTimVY0goooq0iwpCcUE4plMpIKKKYTmgoCc0lFFaAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVJD/rU+o/nUdSQ/61PqP500D2P//U++Ce9N6fU0E4+tNr/NhI/q1IKKKQnFWWBOKZRRVJXBIM4phOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUUVaRoFNJ7CgnHAptUkNIKaTjr1pScVGDmtEiw680tFITirACcUwn1oz60VaQBRRSE4pmghPpTaKKuwBTSewoLelNq0gCkJxQTimVQ0goooq0iwpCcUE4plMA9zTCc0E5pvBoLSDr9KWiitBhSE4oJxTSc0ABOaaTignFMJ71oUkITik6cmjpyabTSKCiiirAKQnFBOKZVpDSAn1phOaCc0lMtIKKKK0SL2A+9MJzQTmkppEBSE4oJxTKsaQUUUVaRYUhOKCcUymUkFFFMJzQUBOaSiitACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpIf9an1H86jqSH/Wp9R/Omgex//V+9KKKQnFf5tn9YATimUUVSVxJWCmE5oJzSVqlYYUUUUwCmE5oJzSVSQBRRSE4qgAnFMooq0jQKaT2oJ9KbVJDSCkJxQTio+DWiRYp560UUhOKsAJxTKKKtIAooppPpTNBScUyiirQBTSe1Bb0ptWkAUhOKCcUyqGkFFFFWkWFITignFMPqaYAfU0wnNBOabwaBpBwaWiitCwoophOaAAnNNJxQTimVoUkBPeijpzUec00ihTzSUUVYBSE4oJxTKtIaQUwnNBOaSmWFFFFaJF7BTCc0E5pKaRAUhOKCcUyrGkFFFFWkWFITignFMplJBRRTCc0FATmkooq7AFFFFMAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSH/Wp9R/Oo6kh/1qfUfzpoHsf/1vvMnFMooziv83Urn9YJCE4ppOaCc0lapWAKKKKYBTCc0E5pKpIAoopCcVQATimUUVaRoFNJ7CgntTapIaQUhOKCcUytEixODS0UhOKsAJxTCe5oJ9aKtIAoopCcUzQQntTaKKtKwBTSe1BPYU2rSAKQnFBOKZVDSCiiirSLCkJxQTime5pgHuaYTmgnNN4NBaQcGloorQYUUhOKaTmgAJzTScUE4qMnFXYpIUnvTenNHTk02qSKCiiirAKQnFKeOtRk+tWkNIKYTmgnNJTLCiig/pWiRew3Pc0hOaCc0lNIgKQnFBOKZVjSCiiirSLCkJxQTimUykgoophOaCgJzSUUVoAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUkP+tT6j+dR1JD/rU+o/nTQPY//9f7wphOaCc0lf5xJWP6wCiiimAUwnNBOaSqSAKKKQnFUAE4plFFWkaIKaT2FKTimVSQ0gpCcUE4qPr1rRIsODS0UhOKsAJxTM+tFFWkAUUUhOKZoBOKZRRV2AKaW9KCe1Nq0gCkJxQTimVQ0goooq0iwpCcUE4ph9TTAKYTmgnNN4NBaQcGloorQYUhOKWmE5oACc00nFBOKYT3q7FJAT3pvTk048VHVJFBRRRVgFITignFMq0hpBTCc0E5pKZaQUUUVokVsFMJzQTmkppEhSE4oJxTKsaQUUUVaRYUhOKCcUymUkFFFMJzQUBOaSiitACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpIf8AWp9R/Oo6kh/1qfUfzpoHsf/Q+7KKKK/zjP6wCmE5oJzSVSQBRRSE4qgAnFMooq0jQKaT6UE9hTapIaQUhOKCcVHwa0SLDg0tFITirACcUwn1oJ7mirSAKKKaT2pmgE9qbRRV2AKaT2oJ7U2rSAKQnFBOKZVDSCiiirSLCkJxQTio89yaYC+5phOaCc03g0DSDr9KWiitCwoophOaAAnNNJxQTimVoUkFHTmjOOTTCc00ihM5oooqwCkJxQTimVaQ0gphOaCc0lMsKKKK0SL2CmE5oJzSU0iApCcUE4plWNIKKKKtIsKQnFBOKZTKSCiimE5oKAnNJRRV2AKKKKYBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUkP+tT6j+dR1JD/rU+o/nTQPY//R+7KYTmgnNJX+cqR/WAUUUhOKoAJxTKKKtI0Cmk+lBOOBTapIaQUE460hOKj5PWtEiw4NLRSE4qwAnFMJ9aM+tFWkOwUUUhOKZYE4plFFWkAU0t6UFvSm1aQBSE4oJxTKoaQUUUVa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" alt="Vibra FC" style={{ height: 32, width: "auto", borderRadius: 6, objectFit: "contain" }} />
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
