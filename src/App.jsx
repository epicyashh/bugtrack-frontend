import { useState, useContext, useRef, createContext, useReducer, useCallback } from "react";

// ============================================================
// DESIGN SYSTEM & CONSTANTS
// ============================================================
const PRIORITIES = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };
const STATUSES = { OPEN: "Open", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", CLOSED: "Closed" };
const ROLES = { ADMIN: "Admin", DEV: "Developer", QA: "QA", VIEWER: "Viewer" };

const PRIORITY_CONFIG = {
  Low:      { color: "#4ade80", bg: "rgba(74,222,128,0.12)", icon: "▼" },
  Medium:   { color: "#facc15", bg: "rgba(250,204,21,0.12)", icon: "■" },
  High:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", icon: "▲" },
  Critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.15)", icon: "⚡" },
};

const STATUS_CONFIG = {
  "Open":        { color: "#64748b", bg: "rgba(100,116,139,0.15)", dot: "#94a3b8" },
  "In Progress": { color: "#3b82f6", bg: "rgba(59,130,246,0.15)", dot: "#60a5fa" },
  "In Review":   { color: "#a855f7", bg: "rgba(168,85,247,0.15)", dot: "#c084fc" },
  "Closed":      { color: "#22c55e", bg: "rgba(34,197,94,0.15)", dot: "#4ade80" },
};

// ============================================================
// SEED DATA
// ============================================================
const SEED_USERS = [
  { id: "u1", name: "Alex Rivera", email: "alex@bugtrack.io", role: ROLES.ADMIN, avatar: "AR", color: "#6366f1" },
  { id: "u2", name: "Sam Chen", email: "sam@bugtrack.io", role: ROLES.DEV, avatar: "SC", color: "#ec4899" },
  { id: "u3", name: "Jordan Lee", email: "jordan@bugtrack.io", role: ROLES.QA, avatar: "JL", color: "#f59e0b" },
  { id: "u4", name: "Morgan Park", email: "morgan@bugtrack.io", role: ROLES.DEV, avatar: "MP", color: "#10b981" },
  { id: "u5", name: "Casey Walsh", email: "casey@bugtrack.io", role: ROLES.VIEWER, avatar: "CW", color: "#8b5cf6" },
];

const SEED_PROJECTS = [
  { id: "p1", name: "Phoenix Platform", key: "PHX", description: "Core B2B SaaS platform rebuild", color: "#6366f1", members: ["u1","u2","u3","u4"], createdAt: "2025-01-10" },
  { id: "p2", name: "Nebula Mobile", key: "NEB", description: "Cross-platform mobile application", color: "#ec4899", members: ["u1","u2","u5"], createdAt: "2025-02-14" },
  { id: "p3", name: "Atlas API", key: "ATL", description: "Public REST API gateway & docs", color: "#f59e0b", members: ["u1","u3","u4"], createdAt: "2025-03-01" },
];

const SEED_TICKETS = [
  { id: "t1", key: "PHX-001", title: "Login page crashes on Safari 17", description: "Users report blank screen after OAuth redirect on Safari 17.x. Console shows CORS policy error.", projectId: "p1", status: STATUSES.OPEN, priority: PRIORITIES.CRITICAL, assigneeId: "u2", reporterId: "u3", createdAt: "2025-06-01", updatedAt: "2025-06-02", tags: ["frontend","auth","safari"], comments: [{ id: "c1", userId: "u3", text: "Reproduced on Safari 17.1 and 17.2. Works fine on Chrome.", createdAt: "2025-06-01" }, { id: "c2", userId: "u2", text: "Looking into the CORS headers. Might be a preflight issue.", createdAt: "2025-06-02" }] },
  { id: "t2", key: "PHX-002", title: "Dashboard widgets load slowly on large datasets", description: "When project has >10k tickets, the dashboard takes 8-12 seconds to render. Needs pagination or virtualization.", projectId: "p1", status: STATUSES.IN_PROGRESS, priority: PRIORITIES.HIGH, assigneeId: "u4", reporterId: "u1", createdAt: "2025-06-03", updatedAt: "2025-06-04", tags: ["performance","dashboard"], comments: [] },
  { id: "t3", key: "PHX-003", title: "Add CSV export for ticket reports", description: "Product team needs ability to export filtered ticket lists to CSV for stakeholder reporting.", projectId: "p1", status: STATUSES.OPEN, priority: PRIORITIES.MEDIUM, assigneeId: null, reporterId: "u1", createdAt: "2025-06-05", updatedAt: "2025-06-05", tags: ["feature","export"], comments: [] },
  { id: "t4", key: "NEB-001", title: "Push notifications not delivering on Android 14", description: "FCM tokens are being registered but notifications don't arrive. Background mode affected.", projectId: "p2", status: STATUSES.IN_REVIEW, priority: PRIORITIES.HIGH, assigneeId: "u2", reporterId: "u5", createdAt: "2025-06-02", updatedAt: "2025-06-06", tags: ["android","notifications"], comments: [{ id: "c3", userId: "u2", text: "Fixed in branch feat/android-fcm-fix. Opening PR.", createdAt: "2025-06-06" }] },
  { id: "t5", key: "NEB-002", title: "Dark mode colors inconsistent on settings screen", description: "Several components use hardcoded colors that don't respect the system dark mode preference.", projectId: "p2", status: STATUSES.OPEN, priority: PRIORITIES.LOW, assigneeId: "u5", reporterId: "u3", createdAt: "2025-06-07", updatedAt: "2025-06-07", tags: ["ui","darkmode"], comments: [] },
  { id: "t6", key: "ATL-001", title: "Rate limiter returns 500 instead of 429", description: "When rate limit is exceeded, the API returns HTTP 500 with a generic error instead of the correct 429 Too Many Requests.", projectId: "p3", status: STATUSES.CLOSED, priority: PRIORITIES.HIGH, assigneeId: "u4", reporterId: "u1", createdAt: "2025-05-20", updatedAt: "2025-06-01", tags: ["api","bug"], comments: [{ id: "c4", userId: "u4", text: "Fixed. Deployed to prod.", createdAt: "2025-06-01" }] },
  { id: "t7", key: "ATL-002", title: "Swagger docs missing authentication endpoints", description: "The /auth/* routes are not documented in the OpenAPI spec. Developers are confused about how to authenticate.", projectId: "p3", status: STATUSES.IN_PROGRESS, priority: PRIORITIES.MEDIUM, assigneeId: "u4", reporterId: "u3", createdAt: "2025-06-04", updatedAt: "2025-06-05", tags: ["docs","api"], comments: [] },
  { id: "t8", key: "PHX-004", title: "User invitation emails going to spam", description: "New user invitation emails have low deliverability. SPF and DKIM records need to be verified.", projectId: "p1", status: STATUSES.OPEN, priority: PRIORITIES.MEDIUM, assigneeId: "u1", reporterId: "u2", createdAt: "2025-06-08", updatedAt: "2025-06-08", tags: ["email","devops"], comments: [] },
];

// ============================================================
// STATE MANAGEMENT (useReducer)
// ============================================================
const initialState = {
  tickets: SEED_TICKETS,
  projects: SEED_PROJECTS,
  users: SEED_USERS,
  currentUser: SEED_USERS[0],
  notifications: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TICKET":
      return { ...state, tickets: [action.payload, ...state.tickets] };
    case "UPDATE_TICKET":
      return { ...state, tickets: state.tickets.map(t => t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: new Date().toISOString().slice(0,10) } : t) };
    case "DELETE_TICKET":
      return { ...state, tickets: state.tickets.filter(t => t.id !== action.payload) };
    case "ADD_COMMENT":
      return { ...state, tickets: state.tickets.map(t => t.id === action.payload.ticketId ? { ...t, comments: [...t.comments, action.payload.comment] } : t) };
    case "ADD_PROJECT":
      return { ...state, projects: [action.payload, ...state.projects] };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.payload, ...state.notifications.slice(0, 9)] };
    case "CLEAR_NOTIFICATIONS":
      return { ...state, notifications: [] };
    case "SET_USER":
      return { ...state, currentUser: action.payload };
    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const genId = () => Math.random().toString(36).slice(2, 10);
const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

// ============================================================
// MICRO COMPONENTS
// ============================================================
const Avatar = ({ user, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: user?.color || "#6366f1",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.35, fontWeight: 700, color: "#fff",
    flexShrink: 0, fontFamily: "'Space Mono', monospace",
    border: "2px solid rgba(255,255,255,0.1)",
  }}>{user?.avatar || "?"}</div>
);

const Badge = ({ label, type = "status" }) => {
  const cfg = type === "priority" ? PRIORITY_CONFIG[label] : STATUS_CONFIG[label];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      letterSpacing: "0.03em", whiteSpace: "nowrap",
      fontFamily: "'Space Mono', monospace",
    }}>
      {type === "status" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />}
      {type === "priority" && <span style={{ fontSize: 9 }}>{cfg.icon}</span>}
      {label}
    </span>
  );
};

const Tag = ({ label }) => (
  <span style={{
    padding: "2px 8px", borderRadius: 4, fontSize: 10,
    background: "rgba(99,102,241,0.12)", color: "#818cf8",
    border: "1px solid rgba(99,102,241,0.25)", fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.05em",
  }}>{label}</span>
);



// ============================================================
// MODAL SYSTEM
// ============================================================
const Modal = ({ title, onClose, children, width = 560 }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, animation: "fadeIn 0.15s ease",
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, width: "100%", maxWidth: width,
      maxHeight: "90vh", overflowY: "auto",
      boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
      animation: "slideUp 0.2s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8",
          width: 30, height: 30, borderRadius: 8, cursor: "pointer",
          fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

// ============================================================
// FORM COMPONENTS
// ============================================================
const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{label}</label>}
    <input {...props} style={{
      width: "100%", padding: "10px 12px", borderRadius: 8,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
      color: "#f1f5f9", fontSize: 14, outline: "none",
      transition: "border-color 0.2s", boxSizing: "border-box",
      fontFamily: "'Space Grotesk', sans-serif",
      ...props.style,
    }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{label}</label>}
    <select {...props} style={{
      width: "100%", padding: "10px 12px", borderRadius: 8,
      background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)",
      color: "#f1f5f9", fontSize: 14, outline: "none",
      cursor: "pointer", boxSizing: "border-box",
      fontFamily: "'Space Grotesk', sans-serif",
      ...props.style,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{label}</label>}
    <textarea {...props} style={{
      width: "100%", padding: "10px 12px", borderRadius: 8,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
      color: "#f1f5f9", fontSize: 14, outline: "none", resize: "vertical",
      minHeight: 90, boxSizing: "border-box",
      fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.6,
      ...props.style,
    }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
  </div>
);

const Btn = ({ children, variant = "primary", ...props }) => {
  const styles = {
    primary: { background: "#6366f1", color: "#fff", border: "none" },
    secondary: { background: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)" },
    danger: { background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" },
    ghost: { background: "transparent", color: "#94a3b8", border: "1px solid transparent" },
  };
  return (
    <button {...props} style={{
      padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13,
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
      transition: "all 0.15s", fontFamily: "'Space Grotesk', sans-serif",
      whiteSpace: "nowrap",
      ...styles[variant], ...props.style,
    }}>{children}</button>
  );
};

// ============================================================
// TICKET FORM MODAL
// ============================================================
const TicketForm = ({ ticket, onClose, defaultProjectId }) => {
  const { state, dispatch } = useApp();
  const isEdit = !!ticket;
  const [form, setForm] = useState({
    title: ticket?.title || "",
    description: ticket?.description || "",
    projectId: ticket?.projectId || defaultProjectId || state.projects[0]?.id || "",
    status: ticket?.status || STATUSES.OPEN,
    priority: ticket?.priority || PRIORITIES.MEDIUM,
    assigneeId: ticket?.assigneeId || "",
    tags: ticket?.tags?.join(", ") || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const project = state.projects.find(p => p.id === form.projectId);
  const projectMembers = state.users.filter(u => project?.members.includes(u.id));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (isEdit) {
      dispatch({ type: "UPDATE_TICKET", payload: { ...ticket, ...form, tags } });
      dispatch({ type: "ADD_NOTIFICATION", payload: { id: genId(), msg: `Ticket ${ticket.key} updated`, time: new Date().toISOString() } });
    } else {
      const proj = state.projects.find(p => p.id === form.projectId);
      const count = state.tickets.filter(t => t.projectId === form.projectId).length + 1;
      const newTicket = {
        id: genId(), key: `${proj?.key}-${String(count).padStart(3,"0")}`,
        ...form, tags, reporterId: state.currentUser.id,
        createdAt: new Date().toISOString().slice(0,10),
        updatedAt: new Date().toISOString().slice(0,10),
        comments: [],
      };
      dispatch({ type: "ADD_TICKET", payload: newTicket });
      dispatch({ type: "ADD_NOTIFICATION", payload: { id: genId(), msg: `New ticket ${newTicket.key} created`, time: new Date().toISOString() } });
    }
    onClose();
  };

  return (
    <Modal title={isEdit ? `Edit ${ticket.key}` : "Create New Ticket"} onClose={onClose} width={580}>
      <Input label="Title *" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Brief description of the issue..." />
      <Textarea label="Description" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Steps to reproduce, expected vs actual behavior, environment details..." rows={4} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Project" value={form.projectId} onChange={e => set("projectId", e.target.value)}
          options={state.projects.map(p => ({ value: p.id, label: p.name }))} />
        <Select label="Status" value={form.status} onChange={e => set("status", e.target.value)}
          options={Object.values(STATUSES).map(s => ({ value: s, label: s }))} />
        <Select label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)}
          options={Object.values(PRIORITIES).map(p => ({ value: p, label: p }))} />
        <Select label="Assignee" value={form.assigneeId} onChange={e => set("assigneeId", e.target.value)}
          options={[{ value: "", label: "Unassigned" }, ...projectMembers.map(u => ({ value: u.id, label: u.name }))]} />
      </div>
      <Input label="Tags (comma-separated)" value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="frontend, api, performance..." />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Ticket"}</Btn>
      </div>
    </Modal>
  );
};

// ============================================================
// TICKET DETAIL MODAL
// ============================================================
const TicketDetail = ({ ticket, onClose, onEdit }) => {
  const { state, dispatch } = useApp();
  const [comment, setComment] = useState("");
  const assignee = state.users.find(u => u.id === ticket.assigneeId);
  const reporter = state.users.find(u => u.id === ticket.reporterId);
  const project = state.projects.find(p => p.id === ticket.projectId);

  const handleComment = () => {
    if (!comment.trim()) return;
    dispatch({ type: "ADD_COMMENT", payload: { ticketId: ticket.id, comment: { id: genId(), userId: state.currentUser.id, text: comment, createdAt: new Date().toISOString() } } });
    dispatch({ type: "ADD_NOTIFICATION", payload: { id: genId(), msg: `Comment added to ${ticket.key}`, time: new Date().toISOString() } });
    setComment("");
  };

  const handleDelete = () => {
    dispatch({ type: "DELETE_TICKET", payload: ticket.id });
    dispatch({ type: "ADD_NOTIFICATION", payload: { id: genId(), msg: `Ticket ${ticket.key} deleted`, time: new Date().toISOString() } });
    onClose();
  };

  const updatedTicket = state.tickets.find(t => t.id === ticket.id) || ticket;

  return (
    <Modal title="" onClose={onClose} width={680}>
      <div style={{ marginTop: -8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#6366f1", fontWeight: 700, letterSpacing: "0.05em" }}>{ticket.key}</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
              <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>{project?.name}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, fontFamily: "'Space Grotesk', sans-serif" }}>{ticket.title}</h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(state.currentUser.role === ROLES.ADMIN || state.currentUser.id === ticket.reporterId) && (
              <>
                <Btn variant="ghost" style={{ padding: "7px 12px" }} onClick={() => { onClose(); setTimeout(() => onEdit(ticket), 50); }}>✏️ Edit</Btn>
                <Btn variant="danger" style={{ padding: "7px 12px" }} onClick={handleDelete}>🗑</Btn>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <Badge label={updatedTicket.status} type="status" />
          <Badge label={updatedTicket.priority} type="priority" />
          {updatedTicket.tags?.map(t => <Tag key={t} label={t} />)}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14, lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif" }}>{ticket.description || "No description provided."}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Assignee", content: assignee ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar user={assignee} size={24} /><span style={{ color: "#e2e8f0", fontSize: 13 }}>{assignee.name}</span></div> : <span style={{ color: "#475569", fontSize: 13 }}>Unassigned</span> },
            { label: "Reporter", content: reporter ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar user={reporter} size={24} /><span style={{ color: "#e2e8f0", fontSize: 13 }}>{reporter.name}</span></div> : null },
            { label: "Created", content: <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>{formatDate(ticket.createdAt)}</span> },
            { label: "Updated", content: <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>{formatDate(ticket.updatedAt)}</span> },
          ].map(({ label, content }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>{label}</div>
              {content}
            </div>
          ))}
        </div>

        <div>
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>
            Comments ({updatedTicket.comments?.length || 0})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {updatedTicket.comments?.map(c => {
              const u = state.users.find(x => x.id === c.userId);
              return (
                <div key={c.id} style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Avatar user={u} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{u?.name}</span>
                      <span style={{ fontSize: 11, color: "#475569", fontFamily: "'Space Mono', monospace" }}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{c.text}</p>
                  </div>
                </div>
              );
            })}
            {!updatedTicket.comments?.length && <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "12px 0" }}>No comments yet.</p>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Avatar user={state.currentUser} size={32} />
            <div style={{ flex: 1, display: "flex", gap: 8 }}>
              <input value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleComment()}
                placeholder="Add a comment… (Enter to submit)"
                style={{ flex: 1, padding: "9px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", fontSize: 13, outline: "none", fontFamily: "'Space Grotesk', sans-serif" }} />
              <Btn onClick={handleComment} style={{ padding: "9px 16px" }}>Post</Btn>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// TICKET ROW COMPONENT
// ============================================================
const TicketRow = ({ ticket, onClick }) => {
  const { state } = useApp();
  const assignee = state.users.find(u => u.id === ticket.assigneeId);
  const [hovered, setHovered] = useState(false);

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: "90px 1fr 110px 110px 36px",
        alignItems: "center", gap: 12, padding: "14px 16px",
        background: hovered ? "rgba(99,102,241,0.06)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer", transition: "background 0.15s",
      }}>
      <span style={{ fontSize: 11, color: "#6366f1", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{ticket.key}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ticket.title}</div>
        <div style={{ display: "flex", gap: 4 }}>{ticket.tags?.slice(0,3).map(t => <Tag key={t} label={t} />)}</div>
      </div>
      <Badge label={ticket.status} type="status" />
      <Badge label={ticket.priority} type="priority" />
      <div>{assignee ? <Avatar user={assignee} size={28} /> : <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#475569", fontSize: 12 }}>?</span></div>}</div>
    </div>
  );
};

// ============================================================
// TICKET BOARD (KANBAN)
// ============================================================
const KanbanBoard = ({ tickets, onTicketClick }) => {
  const { state } = useApp();
  const cols = Object.values(STATUSES);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, overflowX: "auto" }}>
      {cols.map(status => {
        const colTickets = tickets.filter(t => t.status === status);
        const cfg = STATUS_CONFIG[status];
        return (
          <div key={status} style={{ minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Space Mono', monospace" }}>{status}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, background: "rgba(255,255,255,0.06)", color: "#475569", padding: "1px 7px", borderRadius: 10, fontFamily: "'Space Mono', monospace" }}>{colTickets.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {colTickets.map(ticket => {
                const assignee = state.users.find(u => u.id === ticket.assigneeId);
                const pCfg = PRIORITY_CONFIG[ticket.priority];
                return (
                  <div key={ticket.id} onClick={() => onTicketClick(ticket)}
                    style={{
                      background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10, padding: 14, cursor: "pointer",
                      transition: "transform 0.15s, box-shadow 0.15s",
                      borderLeft: `3px solid ${pCfg?.color}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontSize: 10, color: "#6366f1", fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 6 }}>{ticket.key}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 10 }}>{ticket.title}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Badge label={ticket.priority} type="priority" />
                      {assignee ? <Avatar user={assignee} size={22} /> : <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px dashed rgba(255,255,255,0.15)" }} />}
                    </div>
                    {ticket.comments?.length > 0 && <div style={{ marginTop: 8, fontSize: 10, color: "#475569", fontFamily: "'Space Mono', monospace" }}>💬 {ticket.comments.length}</div>}
                  </div>
                );
              })}
              {colTickets.length === 0 && <div style={{ border: "1.5px dashed rgba(255,255,255,0.07)", borderRadius: 10, padding: "20px", textAlign: "center", color: "#334155", fontSize: 12 }}>Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// TICKETS PAGE
// ============================================================
const TicketsPage = ({ projectFilter = null }) => {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [view, setView] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [sortBy, setSortBy] = useState("updatedAt");

  const filtered = state.tickets
    .filter(t => !projectFilter || t.projectId === projectFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.key.toLowerCase().includes(search.toLowerCase()) || t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => filterPriority === "all" || t.priority === filterPriority)
    .filter(t => filterAssignee === "all" || t.assigneeId === filterAssignee)
    .sort((a, b) => {
      if (sortBy === "priority") {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return (order[a.priority] || 9) - (order[b.priority] || 9);
      }
      return new Date(b[sortBy]) - new Date(a[sortBy]);
    });

  const stats = {
    total: filtered.length,
    open: filtered.filter(t => t.status === STATUSES.OPEN).length,
    inProgress: filtered.filter(t => t.status === STATUSES.IN_PROGRESS).length,
    critical: filtered.filter(t => t.priority === PRIORITIES.CRITICAL).length,
  };

  return (
    <div>
      {/* Stats Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", value: stats.total, color: "#6366f1" },
          { label: "Open", value: stats.open, color: "#94a3b8" },
          { label: "In Progress", value: stats.inProgress, color: "#3b82f6" },
          { label: "Critical", value: stats.critical, color: "#f43f5e" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
            style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#f1f5f9", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Space Grotesk', sans-serif" }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, background: "#0f1117", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8", fontSize: 12, outline: "none", fontFamily: "'Space Mono', monospace" }}>
          <option value="all">All Status</option>
          {Object.values(STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, background: "#0f1117", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8", fontSize: 12, outline: "none", fontFamily: "'Space Mono', monospace" }}>
          <option value="all">All Priority</option>
          {Object.values(PRIORITIES).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, background: "#0f1117", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8", fontSize: 12, outline: "none", fontFamily: "'Space Mono', monospace" }}>
          <option value="all">All Assignees</option>
          {state.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, background: "#0f1117", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8", fontSize: 12, outline: "none", fontFamily: "'Space Mono', monospace" }}>
          <option value="updatedAt">Sort: Updated</option>
          <option value="createdAt">Sort: Created</option>
          <option value="priority">Sort: Priority</option>
        </select>
        <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, overflow: "hidden" }}>
          {["list", "board"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "9px 14px", background: view === v ? "rgba(99,102,241,0.2)" : "transparent", border: "none", color: view === v ? "#818cf8" : "#475569", cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>
              {v === "list" ? "≡" : "⊞"}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowForm(true)}>+ New Ticket</Btn>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 110px 36px", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["KEY", "TITLE", "STATUS", "PRIORITY", ""].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.08em", fontFamily: "'Space Mono', monospace" }}>{h}</span>)}
          </div>
          {filtered.length ? filtered.map(t => <TicketRow key={t.id} ticket={t} onClick={() => setDetailTicket(t)} />) : (
            <div style={{ textAlign: "center", padding: 48, color: "#334155" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>No tickets match your filters.</div>
            </div>
          )}
        </div>
      ) : (
        <KanbanBoard tickets={filtered} onTicketClick={setDetailTicket} />
      )}

      {showForm && <TicketForm onClose={() => setShowForm(false)} defaultProjectId={projectFilter} />}
      {editTicket && <TicketForm ticket={editTicket} onClose={() => setEditTicket(null)} />}
      {detailTicket && <TicketDetail ticket={detailTicket} onClose={() => setDetailTicket(null)} onEdit={t => { setDetailTicket(null); setEditTicket(t); }} />}
    </div>
  );
};

// ============================================================
// PROJECTS PAGE
// ============================================================
const ProjectsPage = ({ onSelectProject }) => {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", description: "", color: "#6366f1" });

  const handleCreate = () => {
    if (!form.name.trim() || !form.key.trim()) return;
    const project = { id: genId(), ...form, key: form.key.toUpperCase(), members: [state.currentUser.id], createdAt: new Date().toISOString().slice(0,10) };
    dispatch({ type: "ADD_PROJECT", payload: project });
    dispatch({ type: "ADD_NOTIFICATION", payload: { id: genId(), msg: `Project "${form.name}" created`, time: new Date().toISOString() } });
    setShowForm(false);
    setForm({ name: "", key: "", description: "", color: "#6366f1" });
  };

  const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#f43f5e","#06b6d4"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" }}>Projects</h2>
          <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 13 }}>{state.projects.length} active projects</p>
        </div>
        <Btn onClick={() => setShowForm(true)}>+ New Project</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {state.projects.map(p => {
          const ticketCount = state.tickets.filter(t => t.projectId === p.id).length;
          const openCount = state.tickets.filter(t => t.projectId === p.id && t.status === STATUSES.OPEN).length;
          const members = state.users.filter(u => p.members.includes(u.id));
          return (
            <div key={p.id} onClick={() => onSelectProject(p)}
              style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, cursor: "pointer", transition: "border-color 0.15s, transform 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.color + "66"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: p.color + "22", border: `1.5px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: p.color, fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>{p.key}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{p.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>{ticketCount} tickets</span>
                  <span style={{ fontSize: 11, color: "#f43f5e", fontFamily: "'Space Mono', monospace" }}>{openCount} open</span>
                </div>
                <div style={{ display: "flex" }}>
                  {members.slice(0,4).map((u, i) => <div key={u.id} style={{ marginLeft: i > 0 ? -8 : 0, border: "2px solid #0d1018", borderRadius: "50%" }}><Avatar user={u} size={26} /></div>)}
                  {members.length > 4 && <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#64748b", marginLeft: -8, border: "2px solid #0d1018", fontFamily: "'Space Mono', monospace" }}>+{members.length - 4}</div>}
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginTop: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${ticketCount ? ((ticketCount - openCount) / ticketCount) * 100 : 0}%`, background: p.color, borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
                {ticketCount ? Math.round(((ticketCount - openCount) / ticketCount) * 100) : 0}% resolved
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <Modal title="Create New Project" onClose={() => setShowForm(false)}>
          <Input label="Project Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Phoenix Platform" />
          <Input label="Project Key *" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toUpperCase().slice(0,5) }))} placeholder="PHX" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" rows={3} />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "3px solid white" : "3px solid transparent", transition: "border 0.15s" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Create Project</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// TEAM PAGE
// ============================================================
const TeamPage = () => {
  const { state } = useApp();
  const ROLE_COLORS = { Admin: "#f43f5e", Developer: "#3b82f6", QA: "#f59e0b", Viewer: "#64748b" };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" }}>Team Members</h2>
        <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 13 }}>{state.users.length} members across all projects</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {state.users.map(u => {
          const assigned = state.tickets.filter(t => t.assigneeId === u.id);
          const open = assigned.filter(t => t.status !== STATUSES.CLOSED);
          return (
            <div key={u.id} style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <Avatar user={u} size={48} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{u.email}</div>
                  <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: (ROLE_COLORS[u.role] || "#64748b") + "22", color: ROLE_COLORS[u.role] || "#64748b", fontFamily: "'Space Mono', monospace" }}>{u.role.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#6366f1", fontFamily: "'Space Mono', monospace" }}>{assigned.length}</div>
                  <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", fontFamily: "'Space Mono', monospace" }}>{open.length}</div>
                  <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD
// ============================================================
const Dashboard = ({ onNavigate }) => {
  const { state } = useApp();
  const tickets = state.tickets;
  const recentTickets = [...tickets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  const byStatus = Object.values(STATUSES).map(s => ({ status: s, count: tickets.filter(t => t.status === s).length }));
  const byPriority = Object.values(PRIORITIES).map(p => ({ priority: p, count: tickets.filter(t => t.priority === p).length }));
  const maxCount = Math.max(...byStatus.map(s => s.count), 1);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" }}>
          Good day, {state.currentUser.name.split(" ")[0]} 👋
        </h2>
        <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 13 }}>Here's what's happening across your projects.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Tickets", value: tickets.length, icon: "🎫", color: "#6366f1" },
          { label: "Open Issues", value: tickets.filter(t => t.status === STATUSES.OPEN).length, icon: "📬", color: "#f59e0b" },
          { label: "In Progress", value: tickets.filter(t => t.status === STATUSES.IN_PROGRESS).length, icon: "⚙️", color: "#3b82f6" },
          { label: "Critical", value: tickets.filter(t => t.priority === PRIORITIES.CRITICAL).length, icon: "🔥", color: "#f43f5e" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>{s.label}</div>
              </div>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: 16, marginBottom: 24 }}>
        {/* By Status */}
        <div style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>By Status</h3>
          {byStatus.map(({ status, count }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{status}</span>
                  <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: cfg.dot }}>{count}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ height: "100%", width: `${(count / maxCount) * 100}%`, background: cfg.dot, borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* By Priority */}
        <div style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>By Priority</h3>
          {byPriority.map(({ priority, count }) => {
            const cfg = PRIORITY_CONFIG[priority];
            const max = Math.max(...byPriority.map(p => p.count), 1);
            return (
              <div key={priority} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{priority}</span>
                  <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: cfg.color }}>{count}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: cfg.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>Recent Tickets</h3>
          {recentTickets.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#6366f1", fontWeight: 700, whiteSpace: "nowrap" }}>{t.key}</span>
              <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
              <Badge label={t.priority} type="priority" />
            </div>
          ))}
        </div>
      </div>

      {/* Project Summary */}
      <div style={{ background: "#0d1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>Project Overview</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {state.projects.map(p => {
            const pTickets = tickets.filter(t => t.projectId === p.id);
            const open = pTickets.filter(t => t.status !== STATUSES.CLOSED).length;
            return (
              <div key={p.id} onClick={() => onNavigate("project", p)}
                style={{ padding: 14, borderRadius: 10, border: `1px solid ${p.color}33`, background: p.color + "0a", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = p.color + "15"}
                onMouseLeave={e => e.currentTarget.style.background = p.color + "0a"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: "'Space Mono', monospace" }}>{p.key}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{open} open</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginTop: 4 }}>{p.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PROJECT DETAIL PAGE
// ============================================================
const ProjectDetailPage = ({ project, onBack }) => {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>← Back</button>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: project.color + "22", border: `1.5px solid ${project.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: project.color, fontFamily: "'Space Mono', monospace", fontSize: 13 }}>{project.key}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" }}>{project.name}</h2>
          <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{project.description}</p>
        </div>
      </div>
      <TicketsPage projectFilter={project.id} />
    </div>
  );
};

// ============================================================
// NOTIFICATIONS PANEL
// ============================================================
const NotificationsPanel = ({ onClose }) => {
  const { state, dispatch } = useApp();
  return (
    <div style={{
      position: "fixed", top: 60, right: 20, width: 320, zIndex: 500,
      background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      animation: "slideDown 0.2s ease",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>Notifications</span>
        <button onClick={() => dispatch({ type: "CLEAR_NOTIFICATIONS" })} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace" }}>Clear all</button>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {state.notifications.length ? state.notifications.map(n => (
          <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, marginTop: 1 }}>🔔</span>
            <div>
              <div style={{ fontSize: 12, color: "#cbd5e1" }}>{n.msg}</div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>{timeAgo(n.time)}</div>
            </div>
          </div>
        )) : (
          <div style={{ padding: 24, textAlign: "center", color: "#334155", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>No notifications</div>
        )}
      </div>
      <div style={{ padding: 8 }}>
        <button onClick={onClose} style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>Close</button>
      </div>
    </div>
  );
};

// ============================================================
// SIDEBAR
// ============================================================
const Sidebar = ({ page, onNavigate, collapsed }) => {
  const { state } = useApp();
  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "tickets", label: "All Tickets", icon: "⊛" },
    { id: "projects", label: "Projects", icon: "⬡" },
    { id: "team", label: "Team", icon: "◉" },
  ];

  return (
    <div style={{
      width: collapsed ? 60 : 220, background: "#080b10",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      flexShrink: 0, transition: "width 0.2s ease",
      overflow: "hidden",
    }}>
      <div style={{ padding: collapsed ? "20px 12px" : "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🐛</div>
          {!collapsed && <span style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", whiteSpace: "nowrap" }}>BugTrack</span>}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => onNavigate(n.id)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: collapsed ? "10px 14px" : "10px 12px",
              borderRadius: 8, border: "none", marginBottom: 2,
              background: page === n.id ? "rgba(99,102,241,0.15)" : "transparent",
              color: page === n.id ? "#818cf8" : "#475569",
              cursor: "pointer", transition: "all 0.15s", textAlign: "left",
              borderLeft: page === n.id ? "2px solid #6366f1" : "2px solid transparent",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onMouseEnter={e => { if (page !== n.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { if (page !== n.id) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
            {!collapsed && <span style={{ fontSize: 13, fontWeight: page === n.id ? 600 : 400, whiteSpace: "nowrap", fontFamily: "'Space Grotesk', sans-serif" }}>{n.label}</span>}
          </button>
        ))}

        {!collapsed && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 10, color: "#334155", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px", marginBottom: 8 }}>Projects</div>
            {state.projects.map(p => (
              <button key={p.id} onClick={() => onNavigate("project", p)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#475569", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Space Grotesk', sans-serif" }}>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      <div style={{ padding: collapsed ? "12px 6px" : "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
          <Avatar user={state.currentUser} size={28} />
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.currentUser.name}</div>
              <div style={{ fontSize: 10, color: "#334155", fontFamily: "'Space Mono', monospace" }}>{state.currentUser.role}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [page, setPage] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const onNavigate = useCallback

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={onNavigate} />;
      case "tickets": return <TicketsPage />;
      case "projects": return <ProjectsPage onSelectProject={p => onNavigate("project", p)} />;
      case "team": return <TeamPage />;
      case "project": return selectedProject ? <ProjectDetailPage project={selectedProject} onBack={() => onNavigate("projects")} /> : null;
      default: return null;
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080b10; color: #f1f5f9; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #334155 !important; }
        select option { background: #0f1117; }
      `}</style>
      <div style={{ display: "flex", height: "100vh", fontFamily: "'Space Grotesk', sans-serif", background: "#080b10", overflow: "hidden" }}>
        <Sidebar page={page} onNavigate={onNavigate} collapsed={sidebarCollapsed} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top Bar */}
          <div style={{ height: 52, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, background: "#080b10" }}>
            <button onClick={() => setSidebarCollapsed(c => !c)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center" }}>☰</button>
            <span style={{ fontSize: 13, color: "#334155", fontFamily: "'Space Mono', monospace" }}>/</span>
            <span style={{ fontSize: 13, color: "#64748b", fontFamily: "'Space Mono', monospace", textTransform: "capitalize" }}>{page === "project" ? selectedProject?.name : page}</span>
            <div style={{ flex: 1 }} />
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setShowNotifications(s => !s)}
                style={{ background: showNotifications ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                🔔
                {state.notifications.length > 0 && <span style={{ background: "#f43f5e", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{state.notifications.length}</span>}
              </button>
              {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
            </div>
            {/* User Switcher */}
            <select value={state.currentUser.id} onChange={e => dispatch({ type: "SET_USER", payload: state.users.find(u => u.id === e.target.value) })}
              style={{ padding: "6px 10px", borderRadius: 8, background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, outline: "none", cursor: "pointer", fontFamily: "'Space Mono', monospace" }}>
              {state.users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {renderPage()}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
