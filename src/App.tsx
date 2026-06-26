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
  const empty = { nome: "", whatsapp: "", instagram: "", cidade: "", time_favorito: "", aniversario: "", obs: "" };
  const [form, setForm] = useState(empty);

  const clienteVendas = (nome) => vendas.filter(v => v.cliente_nome === nome);
  const msgWhats = (nome, valor) => encodeURIComponent(`Fala, ${nome}! Passando para lembrar do pagamento de ${fmt(valor)} da Vibra FC. Pode fazer o PIX e me manda o comprovante. Obrigado! ⚡`);

  const salvar = async () => {
    if (!form.nome) return;
    setSaving(true);
    try {
      await add(form);
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