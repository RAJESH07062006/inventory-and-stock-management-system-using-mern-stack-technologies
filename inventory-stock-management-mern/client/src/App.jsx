import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes, LayoutDashboard, Package, Search, Plus, Bell, RefreshCw, Pencil,
  Trash2, ArrowDownToLine, ArrowUpFromLine, X, ChevronDown, CircleAlert,
  TrendingUp, PackageCheck, DollarSign, Menu, CheckCircle2, LockKeyhole, LogOut, Eye, EyeOff
} from "lucide-react";
import { api } from "./api";

const money = value => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(value || 0);

const emptyForm = {
  name: "", sku: "", category: "General", supplier: "", price: "", quantity: "", reorderLevel: "5"
};

function statusOf(product) {
  if (product.quantity === 0) return "Out of stock";
  if (product.quantity <= product.reorderLevel) return "Low stock";
  return "In stock";
}

function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(sessionStorage.getItem("inventoryToken")));
  const [adminEmail, setAdminEmail] = useState(() => sessionStorage.getItem("inventoryAdminEmail") || "");
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, totalUnits: 0, inventoryValue: 0, lowStock: 0, outOfStock: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stockAmount, setStockAmount] = useState("1");
  const [stockAction, setStockAction] = useState("in");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== "All categories") params.category = category;
      if (status !== "All statuses") params.status = status;
      const [list, stats] = await Promise.all([api.products(params), api.summary()]);
      setProducts(list);
      setSummary(stats);
    } catch (e) {
      if (e.status === 401) {
        sessionStorage.removeItem("inventoryToken");
        sessionStorage.removeItem("inventoryAdminEmail");
        setAuthenticated(false);
        setError(e.message);
      } else setError(`${e.message} Make sure the backend and MongoDB are running.`);
    } finally { setLoading(false); }
  }, [search, category, status]);

  useEffect(() => {
    if (authenticated) load();
    else { setLoading(false); setProducts([]); }
  }, [authenticated, load]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products]);

  async function handleLogin(email, password) {
    setBusy(true); setError("");
    try {
      const result = await api.login({ email, password });
      sessionStorage.setItem("inventoryToken", result.token);
      sessionStorage.setItem("inventoryAdminEmail", result.admin.email);
      setAdminEmail(result.admin.email);
      setAuthenticated(true);
      setNotice("Welcome back, admin.");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function logout() {
    sessionStorage.removeItem("inventoryToken");
    sessionStorage.removeItem("inventoryAdminEmail");
    setAuthenticated(false); setAdminEmail(""); setProducts([]);
    setSummary({ totalProducts: 0, totalUnits: 0, inventoryValue: 0, lowStock: 0, outOfStock: 0 });
    setModal(null); setNotice(""); setError("");
  }

  if (!authenticated) return <AdminLogin onLogin={handleLogin} busy={busy} error={error} />;

  function openAdd() { setForm(emptyForm); setModal({ type: "product" }); }
  function openEdit(p) {
    setForm({ name: p.name, sku: p.sku, category: p.category, supplier: p.supplier || "", price: String(p.price), quantity: String(p.quantity), reorderLevel: String(p.reorderLevel) });
    setModal({ type: "product", product: p });
  }
  function openStock(p, action) {
    setStockAmount("1");
    setStockAction(action);
    setModal({ type: "stock", product: p });
  }
  function updateField(e) { setForm(current => ({ ...current, [e.target.name]: e.target.value })); }

  async function saveProduct(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const payload = {
      name: form.name.trim(), sku: form.sku.trim().toUpperCase(), category: form.category.trim(),
      supplier: form.supplier.trim(), price: Number(form.price), quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel)
    };
    try {
      if (modal.product) await api.update(modal.product._id, payload);
      else await api.create(payload);
      setModal(null); setNotice(modal.product ? "Product updated successfully." : "Product added successfully.");
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function saveStock(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.stock(modal.product._id, { action: stockAction, amount: Number(stockAmount) });
      setModal(null); setNotice(stockAction === "in" ? "Stock added successfully." : "Stock removed successfully.");
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function deleteProduct(p) {
    if (!window.confirm(`Delete "${p.name}" from inventory? This cannot be undone.`)) return;
    setError("");
    try { await api.remove(p._id); setNotice("Product deleted."); await load(); }
    catch (e) { setError(e.message); }
  }

  const recentProducts = [...products].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Boxes size={23} /></div><div><strong>STOCK ANALYZER</strong><span></span></div></div>
        <div className="nav-label">WORKSPACE</div>
        <button className={`nav-item ${activeNav === "Dashboard" ? "active" : ""}`} onClick={() => setActiveNav("Dashboard")}><LayoutDashboard size={18}/> Dashboard</button>
        <button className={`nav-item ${activeNav === "Inventory" ? "active" : ""}`} onClick={() => { setActiveNav("Inventory"); document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" }); }}><Package size={18}/> Inventory <span className="nav-count">{summary.totalProducts}</span></button>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleAlert size={18}/></div><strong>Stock alert</strong><p>{summary.lowStock + summary.outOfStock} item(s) need your attention.</p><button onClick={() => { setStatus("Low stock"); document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" }); }}>Review items <span>→</span></button></div><div className="user-row"><div className="avatar">A</div><div><strong>Admin</strong><span>{adminEmail || "Inventory manager"}</span></div><button className="logout-button" onClick={logout} title="Log out"><LogOut size={16}/></button></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>{activeNav}</strong></div><div className="top-actions"><div className="live-status"><span/>YOU'RE ACTIVE NOW </div><button className="icon-button" title="Refresh data" onClick={load}><RefreshCw size={18}/></button><button className="icon-button" title="Log out" onClick={logout}><LogOut size={18}/></button><button className="icon-button notification" title="Stock alerts" onClick={() => { setStatus("Low stock"); document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" }); }}><Bell size={18}/>{(summary.lowStock + summary.outOfStock) > 0 && <i/>}</button></div></header>

        <div className="content">
          <div className="page-heading"><div><div className="eyebrow">OVERVIEW</div><h1>Inventory dashboard</h1><p>Monitor stock levels, manage products, and keep your business moving.</p></div><button className="primary-button" onClick={openAdd}><Plus size={18}/> Add product</button></div>

          {error && <div className="alert error-alert"><CircleAlert size={18}/><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}
          {notice && <div className="alert success-alert"><CheckCircle2 size={18}/>{notice}</div>}

          <section className="stats-grid">
            <StatCard title="Total products" value={summary.totalProducts.toLocaleString("en-IN")} note="Unique product records" icon={<Package size={20}/>} tone="purple"/>
            <StatCard title="Units in stock" value={summary.totalUnits.toLocaleString("en-IN")} note="Across all products" icon={<Boxes size={20}/>} tone="blue"/>
            <StatCard title="Inventory value" value={money(summary.inventoryValue)} note="Current stock valuation" icon={<DollarSign size={20}/>} tone="green"/>
            <StatCard title="Low stock items" value={summary.lowStock + summary.outOfStock} note={`${summary.outOfStock} completely out of stock`} icon={<TrendingUp size={20}/>} tone="orange"/>
          </section>

          <section className="panel inventory-panel" id="inventory">
            <div className="panel-heading"><div><h2>Product inventory</h2><p>Manage and track your product stock</p></div><button className="secondary-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
            <div className="filters"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, SKU, category..." aria-label="Search inventory"/></div><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter category"><option>All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select><select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter stock status"><option>All statuses</option><option>In stock</option><option>Low stock</option><option>Out of stock</option></select></div>
            <div className="table-wrap">
              <table><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>UNIT PRICE</th><th>QUANTITY</th><th>STATUS</th><th className="actions-col">ACTIONS</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="7" className="empty-state">Loading inventory…</td></tr> :
                   products.length === 0 ? <tr><td colSpan="7" className="empty-state"><div className="empty-icon"><Package size={24}/></div><strong>No products found</strong><span>Add a product or change your search filters.</span><button className="primary-button small" onClick={openAdd}><Plus size={15}/> Add product</button></td></tr> :
                   products.map(p => <tr key={p._id}>
                     <td><div className="product-cell"><div className={`product-avatar color-${(p.name.charCodeAt(0) || 0) % 5}`}>{p.name.slice(0,1).toUpperCase()}</div><div><strong>{p.name}</strong><span>{p.supplier || "No supplier listed"}</span></div></div></td>
                     <td><span className="sku">{p.sku}</span></td><td><span className="category-chip">{p.category}</span></td><td className="price-cell">{money(p.price)}</td>
                     <td><div className="qty-cell"><strong>{p.quantity}</strong><span>units</span></div></td>
                     <td><StatusPill status={statusOf(p)}/></td>
                     <td><div className="row-actions"><button title="Stock in" onClick={() => openStock(p, "in")}><ArrowDownToLine size={16}/></button><button title="Stock out" onClick={() => openStock(p, "out")}><ArrowUpFromLine size={16}/></button><button title="Edit product" onClick={() => openEdit(p)}><Pencil size={16}/></button><button className="delete-action" title="Delete product" onClick={() => deleteProduct(p)}><Trash2 size={16}/></button></div></td>
                   </tr>)}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{products.length}</strong> product(s)</span><span>Stock status updates automatically</span></div>
          </section>

          <section className="bottom-grid">
            <div className="panel recent-panel"><div className="panel-heading"><div><h2>Recently updated</h2><p>Latest changes to your inventory</p></div><span className="subtle-tag">Recent</span></div>
              {recentProducts.length === 0 ? <div className="mini-empty">Your recent products will appear here.</div> : recentProducts.map(p => <div className="recent-row" key={p._id}><div className="recent-product-icon"><PackageCheck size={18}/></div><div className="recent-info"><strong>{p.name}</strong><span>{p.sku} · {p.category}</span></div><div className="recent-right"><strong>{p.quantity} units</strong><StatusPill status={statusOf(p)}/></div></div>)}
            </div>
            <div className="panel attention-panel"><div className="panel-heading"><div><h2>Needs attention</h2><p>Products at or below reorder level</p></div><span className="alert-count">{summary.lowStock + summary.outOfStock}</span></div>
              {products.filter(p => p.quantity <= p.reorderLevel).length === 0 ? <div className="all-good"><div><CheckCircle2 size={22}/></div><strong>All stocked up!</strong><span>No low-stock products in this view.</span></div> : products.filter(p => p.quantity <= p.reorderLevel).slice(0, 4).map(p => <div className="attention-row" key={p._id}><div className="attention-dot"/><div className="attention-info"><strong>{p.name}</strong><span>{p.sku}</span></div><div className="attention-qty"><strong>{p.quantity}</strong><span>left</span></div><button title="Add stock" onClick={() => openStock(p, "in")}><Plus size={16}/></button></div>)}
              <button className="text-link" onClick={() => { setStatus("Low stock"); document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" }); }}>View low-stock products <span>→</span></button>
            </div>
          </section>
          <footer className="footer"><span>© {new Date().getFullYear()} STOCK ANALYZER</span><span>Built with MERN Stack <span className="footer-dot">•</span> MongoDB · Express · React · Node.js</span></footer>
        </div>
      </main>

      {modal?.type === "product" && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(null); }}><div className="modal-card"><div className="modal-header"><div><div className="eyebrow">{modal.product ? "UPDATE INVENTORY" : "NEW INVENTORY ITEM"}</div><h2>{modal.product ? "Edit product" : "Add a product"}</h2><p>Enter product details below.</p></div><button className="icon-button" onClick={() => setModal(null)} disabled={busy}><X size={19}/></button></div>
        <form onSubmit={saveProduct} className="modal-form"><div className="form-grid">
          <label className="full-field">Product name *<input name="name" value={form.name} onChange={updateField} required maxLength="120" placeholder="e.g. Wireless keyboard"/></label>
          <label>SKU / Product code *<input name="sku" value={form.sku} onChange={updateField} required maxLength="40" placeholder="e.g. ACC-001"/></label>
          <label>Category *<input name="category" value={form.category} onChange={updateField} required maxLength="80" placeholder="e.g. Accessories"/></label>
          <label>Unit price (₹) *<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} required placeholder="0.00"/></label>
          <label>Quantity *<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={updateField} required placeholder="0"/></label>
          <label>Reorder level *<input name="reorderLevel" type="number" min="0" step="1" value={form.reorderLevel} onChange={updateField} required/></label>
          <label>Supplier<input name="supplier" value={form.supplier} onChange={updateField} maxLength="120" placeholder="Supplier name (optional)"/></label>
        </div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : modal.product ? "Save changes" : <><Plus size={17}/> Add product</>}</button></div></form>
      </div></div>}

      {modal?.type === "stock" && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(null); }}><div className="modal-card stock-modal"><div className="modal-header"><div><div className="eyebrow">STOCK ADJUSTMENT</div><h2>{stockAction === "in" ? "Add stock" : "Remove stock"}</h2><p>{modal.product.name} · Current quantity: <strong>{modal.product.quantity}</strong></p></div><button className="icon-button" onClick={() => setModal(null)} disabled={busy}><X size={19}/></button></div>
        <form onSubmit={saveStock} className="modal-form"><div className="stock-switch"><button type="button" className={stockAction === "in" ? "selected" : ""} onClick={() => setStockAction("in")}><ArrowDownToLine size={17}/> Stock in</button><button type="button" className={stockAction === "out" ? "selected" : ""} onClick={() => setStockAction("out")}><ArrowUpFromLine size={17}/> Stock out</button></div><label>Quantity to {stockAction === "in" ? "add" : "remove"}<input type="number" min="1" step="1" max={stockAction === "out" ? modal.product.quantity : undefined} value={stockAmount} onChange={e => setStockAmount(e.target.value)} required/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Updating…" : "Update stock"}</button></div></form>
      </div></div>}
    </div>
  );
}

function AdminLogin({ onLogin, busy, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  function submit(e) { e.preventDefault(); onLogin(email.trim(), password); }
  return (
    <div className="login-page">
      <div className="login-decoration decoration-one"/><div className="login-decoration decoration-two"/>
      <section className="login-card">
        <div className="login-brand"><div className="brand-mark"><Boxes size={24}/></div><div><strong>STOCK</strong><span>ANALYZER</span></div></div>
        <div className="login-icon"><LockKeyhole size={24}/></div>
        <div className="login-heading"><div className="eyebrow">ADMINISTRATOR ACCESS</div><h1>Welcome back</h1><p>Sign in to manage your inventory and stock levels.</p></div>
        {error && <div className="login-error"><CircleAlert size={17}/><span>{error}</span></div>}
        <form onSubmit={submit} className="login-form">
          <label>Email address<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your Admin Email" required autoFocus/></label>
          <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
          <button type="submit" className="primary-button login-submit" disabled={busy}>{busy ? "Signing in…" : <><LockKeyhole size={17}/> Sign in as admin</>}</button>
        </form>
        <div className="login-security"><LockKeyhole size={14}/><span>Restricted access · Admin account only</span></div>
        <div className="login-footer">STOCK ANALYZER</div>
      </section>
    </div>
  );
}

function StatCard({ title, value, note, icon, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-title">{title}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

function StatusPill({ status }) {
  const cls = status === "In stock" ? "in-stock" : status === "Low stock" ? "low-stock" : "out-stock";
  return <span className={`status-pill ${cls}`}><span/>{status}</span>;
}

export default App;