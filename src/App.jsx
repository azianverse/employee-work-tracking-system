import { useState, useEffect } from "react";
import {
  Clock, ListChecks, CalendarDays, LayoutDashboard, Users, ShieldCheck,
  CheckCircle2, XCircle, Plus, ChevronDown, BarChart3, Loader2,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES = {
  employee: { label: "Employee", chip: "text-emerald-700 bg-emerald-50", avatar: "text-white bg-emerald-600" },
  manager:  { label: "Manager",  chip: "text-violet-700 bg-violet-50",   avatar: "text-white bg-violet-600"  },
  admin:    { label: "Admin",    chip: "text-orange-700 bg-orange-50",   avatar: "text-white bg-orange-600"  },
};

const STATUS_STYLES = {
  draft:       "text-gray-600 bg-gray-100",
  submitted:   "text-amber-700 bg-amber-50",
  approved:    "text-emerald-700 bg-emerald-50",
  rejected:    "text-red-700 bg-red-50",
  open:        "text-amber-700 bg-amber-50",
  in_progress: "text-blue-700 bg-blue-50",
  completed:   "text-emerald-700 bg-emerald-50",
  pending:     "text-amber-700 bg-amber-50",
};

const STATUS_LABEL = {
  draft: "Draft", submitted: "Submitted", approved: "Approved", rejected: "Rejected",
  open: "Open", in_progress: "In progress", completed: "Completed", pending: "Pending",
};

const PEOPLE = [
  { id: "u_clarissa", name: "Clarissa Gutlay", role: "employee", manager: "u_marco" },
  { id: "u_diego",    name: "Diego Santos",    role: "employee", manager: "u_marco" },
  { id: "u_marco",    name: "Marco Reyes",     role: "manager",  manager: null },
  { id: "u_admin",    name: "System Admin",    role: "admin",    manager: null },
];

const NAV_BY_ROLE = {
  employee: [
    { id: "timesheet", label: "My timesheet",   icon: Clock },
    { id: "tasks",     label: "My tasks",        icon: ListChecks },
    { id: "leave",     label: "Leave requests",  icon: CalendarDays },
  ],
  manager: [
    { id: "approvals", label: "Approvals",    icon: ShieldCheck },
    { id: "tasks",     label: "Assign tasks", icon: ListChecks },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users",    label: "Users",    icon: Users },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid      = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate  = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const initials = (name) => name.split(" ").map((n) => n[0]).join("");
const nameOf   = (id)   => PEOPLE.find((p) => p.id === id)?.name || id;

function seedData() {
  const ago = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  return {
    timesheets: [
      { id: uid("ts"), employee: "u_clarissa", work_date: ago(1),   hours_worked: 8,   overtime_hours: 0,   status: "approved",  approved_by: "u_marco" },
      { id: uid("ts"), employee: "u_clarissa", work_date: ago(2),   hours_worked: 9.5, overtime_hours: 1.5, status: "approved",  approved_by: "u_marco" },
      { id: uid("ts"), employee: "u_diego",    work_date: ago(1),   hours_worked: 8,   overtime_hours: 0,   status: "submitted", approved_by: null },
      { id: uid("ts"), employee: "u_diego",    work_date: todayISO(), hours_worked: 7, overtime_hours: 0,   status: "draft",     approved_by: null },
    ],
    tasks: [
      { id: uid("tk"), title: "Configure ACL rules for Timesheet table", assigned_to: "u_clarissa", assigned_by: "u_marco", status: "in_progress", due_date: ago(-3), priority: "high" },
      { id: uid("tk"), title: "Build employee timesheet form",           assigned_to: "u_clarissa", assigned_by: "u_marco", status: "completed",   due_date: ago(2),  priority: "medium" },
      { id: uid("tk"), title: "Set up Flow Designer approval flow",      assigned_to: "u_diego",    assigned_by: "u_marco", status: "open",        due_date: ago(-5), priority: "high" },
    ],
    leaveRequests: [
      { id: uid("lv"), employee: "u_diego",    leave_type: "Vacation", start_date: ago(-10), end_date: ago(-8), reason: "Family trip", status: "pending",  approved_by: null },
      { id: uid("lv"), employee: "u_clarissa", leave_type: "Sick",     start_date: ago(5),   end_date: ago(5),  reason: "Flu",         status: "approved", approved_by: "u_marco" },
    ],
  };
}

// ─── Data store (localStorage) ───────────────────────────────────────────────

function useStore() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("emptrack:data");
      setData(raw ? JSON.parse(raw) : seedData());
    } catch {
      setData(seedData());
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (next) => {
    setData(next);
    setSaving(true);
    try { localStorage.setItem("emptrack:data", JSON.stringify(next)); } catch {}
    // brief visual feedback
    setTimeout(() => setSaving(false), 600);
  };

  return { data, setData: persist, loading, saving };
}

// ─── UI primitives ───────────────────────────────────────────────────────────

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${ROLES[role]?.chip}`}>
      {ROLES[role]?.label}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function StatTile({ label, value, accent = "text-gray-900" }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-4 flex-1 min-w-[130px]">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`font-semibold text-3xl leading-none ${accent}`}>{value}</p>
    </div>
  );
}

const btnBase = "inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
const btnMap  = {
  default: "bg-gray-900 text-white hover:bg-gray-800",
  outline: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
  success: "bg-emerald-700 text-white hover:bg-emerald-800",
  danger:  "bg-white text-red-700 border border-red-200 hover:bg-red-50",
};

function Btn({ children, onClick, variant = "default", disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${btnBase} ${btnMap[variant]}`}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] text-gray-600 font-medium">
      {label}
      {children}
    </label>
  );
}

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 w-full";

// ─── Employee views ───────────────────────────────────────────────────────────

function EmployeeTimesheet({ user, data, setData }) {
  const [hours, setHours] = useState("");
  const [date,  setDate]  = useState(todayISO());

  const mine = [...data.timesheets]
    .filter((t) => t.employee === user.id)
    .sort((a, b) => (a.work_date < b.work_date ? 1 : -1));

  const submit = () => {
    if (!hours || Number(hours) <= 0) return;
    const h = Number(hours);
    setData({
      ...data,
      timesheets: [
        { id: uid("ts"), employee: user.id, work_date: date, hours_worked: h,
          overtime_hours: h > 8 ? +(h - 8).toFixed(1) : 0, status: "submitted", approved_by: null },
        ...data.timesheets,
      ],
    });
    setHours("");
  };

  const approvedHrs = mine.filter((t) => t.status === "approved").reduce((s, t) => s + t.hours_worked, 0);
  const otHrs       = mine.filter((t) => t.status === "approved").reduce((s, t) => s + t.overtime_hours, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3 flex-wrap">
        <StatTile label="Approved hours"  value={approvedHrs} accent="text-emerald-700" />
        <StatTile label="Overtime hours"  value={otHrs}       accent="text-amber-700" />
        <StatTile label="Pending entries" value={mine.filter((t) => t.status === "submitted").length} />
      </div>

      <Card>
        <p className="font-semibold text-[15px] mb-4">Log work hours</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Date">
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Hours worked">
            <input type="number" min="0" max="24" step="0.5" placeholder="8" value={hours}
              onChange={(e) => setHours(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Btn variant="success" onClick={submit} disabled={!hours}><Plus size={15} /> Submit timesheet</Btn>
      </Card>

      <Card>
        <p className="font-semibold text-[15px] mb-4">Timesheet history</p>
        <div className="flex flex-col gap-2">
          {mine.length === 0 && <p className="text-gray-400 text-sm">No entries yet. Log your first day above.</p>}
          {mine.map((t) => (
            <div key={t.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium">{fmtDate(t.work_date)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.hours_worked}h worked{t.overtime_hours > 0 ? ` · ${t.overtime_hours}h overtime` : ""}
                </p>
              </div>
              <Badge status={t.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmployeeTasks({ user, data, setData }) {
  const mine = data.tasks.filter((t) => t.assigned_to === user.id);

  return (
    <Card>
      <p className="font-semibold text-[15px] mb-4">My tasks</p>
      <div className="flex flex-col gap-2">
        {mine.length === 0 && <p className="text-gray-400 text-sm">No tasks assigned yet.</p>}
        {mine.map((t) => (
          <div key={t.id} className="flex justify-between items-center gap-3 px-3.5 py-3 bg-gray-50 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">Due {fmtDate(t.due_date)} · {t.priority} priority</p>
            </div>
            <Badge status={t.status} />
            <select value={t.status}
              onChange={(e) => setData({ ...data, tasks: data.tasks.map((tk) => tk.id === t.id ? { ...tk, status: e.target.value } : tk) })}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none">
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EmployeeLeave({ user, data, setData }) {
  const [type,   setType]   = useState("Vacation");
  const [start,  setStart]  = useState(todayISO());
  const [end,    setEnd]    = useState(todayISO());
  const [reason, setReason] = useState("");

  const mine = data.leaveRequests.filter((l) => l.employee === user.id);

  const submit = () => {
    setData({
      ...data,
      leaveRequests: [
        { id: uid("lv"), employee: user.id, leave_type: type, start_date: start,
          end_date: end, reason, status: "pending", approved_by: null },
        ...data.leaveRequests,
      ],
    });
    setReason("");
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <p className="font-semibold text-[15px] mb-4">Request leave</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option>Vacation</option><option>Sick</option><option>Personal</option><option>Unpaid</option>
            </select>
          </Field>
          <Field label="Start date">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
          </Field>
          <Field label="End date">
            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Reason">
          <input type="text" placeholder="Brief reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
        </Field>
        <div className="mt-4">
          <Btn variant="success" onClick={submit}><Plus size={15} /> Submit request</Btn>
        </div>
      </Card>

      <Card>
        <p className="font-semibold text-[15px] mb-4">My leave requests</p>
        <div className="flex flex-col gap-2">
          {mine.length === 0 && <p className="text-gray-400 text-sm">No requests yet.</p>}
          {mine.map((l) => (
            <div key={l.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium">{l.leave_type}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</p>
              </div>
              <Badge status={l.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Manager views ────────────────────────────────────────────────────────────

function ManagerApprovals({ user, data, setData }) {
  const teamIds = PEOPLE.filter((p) => p.manager === user.id).map((p) => p.id);
  const pending  = data.timesheets.filter((t) => teamIds.includes(t.employee) && t.status === "submitted");
  const leaves   = data.leaveRequests.filter((l) => teamIds.includes(l.employee) && l.status === "pending");

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <p className="font-semibold text-[15px] mb-4">Timesheets awaiting approval ({pending.length})</p>
        <div className="flex flex-col gap-2">
          {pending.length === 0 && <p className="text-gray-400 text-sm">All caught up — nothing pending.</p>}
          {pending.map((t) => (
            <div key={t.id} className="flex justify-between items-center gap-3 px-3.5 py-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium">{nameOf(t.employee)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {fmtDate(t.work_date)} · {t.hours_worked}h{t.overtime_hours > 0 ? ` (${t.overtime_hours}h OT)` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Btn variant="success" onClick={() => setData({ ...data, timesheets: data.timesheets.map((ts) => ts.id === t.id ? { ...ts, status: "approved", approved_by: user.id } : ts) })}>
                  <CheckCircle2 size={14} /> Approve
                </Btn>
                <Btn variant="danger" onClick={() => setData({ ...data, timesheets: data.timesheets.map((ts) => ts.id === t.id ? { ...ts, status: "rejected", approved_by: user.id } : ts) })}>
                  <XCircle size={14} /> Reject
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="font-semibold text-[15px] mb-4">Leave requests awaiting decision ({leaves.length})</p>
        <div className="flex flex-col gap-2">
          {leaves.length === 0 && <p className="text-gray-400 text-sm">No pending leave requests.</p>}
          {leaves.map((l) => (
            <div key={l.id} className="flex justify-between items-center gap-3 px-3.5 py-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium">{nameOf(l.employee)} · {l.leave_type}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmtDate(l.start_date)} – {fmtDate(l.end_date)} · {l.reason}</p>
              </div>
              <div className="flex gap-2">
                <Btn variant="success" onClick={() => setData({ ...data, leaveRequests: data.leaveRequests.map((lr) => lr.id === l.id ? { ...lr, status: "approved", approved_by: user.id } : lr) })}>
                  <CheckCircle2 size={14} /> Approve
                </Btn>
                <Btn variant="danger" onClick={() => setData({ ...data, leaveRequests: data.leaveRequests.map((lr) => lr.id === l.id ? { ...lr, status: "rejected", approved_by: user.id } : lr) })}>
                  <XCircle size={14} /> Reject
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ManagerTasks({ user, data, setData }) {
  const team = PEOPLE.filter((p) => p.manager === user.id);
  const [title,    setTitle]    = useState("");
  const [assignee, setAssignee] = useState(team[0]?.id || "");
  const [due,      setDue]      = useState(todayISO());
  const [priority, setPriority] = useState("medium");

  const teamTasks = data.tasks.filter((t) => team.some((m) => m.id === t.assigned_to));

  const assign = () => {
    if (!title || !assignee) return;
    setData({
      ...data,
      tasks: [
        { id: uid("tk"), title, assigned_to: assignee, assigned_by: user.id, status: "open", due_date: due, priority },
        ...data.tasks,
      ],
    });
    setTitle("");
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <p className="font-semibold text-[15px] mb-4">Assign a new task</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Task title">
            <input type="text" placeholder="e.g. Configure ACL rules" value={title}
              onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Assign to">
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputCls}>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </Field>
        </div>
        <Btn variant="success" onClick={assign} disabled={!title}><Plus size={15} /> Assign task</Btn>
      </Card>

      <Card>
        <p className="font-semibold text-[15px] mb-4">Team tasks ({teamTasks.length})</p>
        <div className="flex flex-col gap-2">
          {teamTasks.map((t) => (
            <div key={t.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{nameOf(t.assigned_to)} · Due {fmtDate(t.due_date)}</p>
              </div>
              <Badge status={t.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Admin views ──────────────────────────────────────────────────────────────

function AdminOverview({ data }) {
  const approvedTS   = data.timesheets.filter((t) => t.status === "approved");
  const totalHrs     = approvedTS.reduce((s, t) => s + t.hours_worked, 0);
  const totalOT      = approvedTS.reduce((s, t) => s + t.overtime_hours, 0);
  const doneCount    = data.tasks.filter((t) => t.status === "completed").length;
  const completion   = data.tasks.length ? Math.round((doneCount / data.tasks.length) * 100) : 0;
  const pendingCount = data.timesheets.filter((t) => t.status === "submitted").length
                     + data.leaveRequests.filter((l) => l.status === "pending").length;

  const perEmployee = PEOPLE.filter((p) => p.role === "employee").map((p) => {
    const hrs   = approvedTS.filter((t) => t.employee === p.id).reduce((s, t) => s + t.hours_worked, 0);
    const tasks = data.tasks.filter((t) => t.assigned_to === p.id);
    return { ...p, hrs, total: tasks.length, done: tasks.filter((t) => t.status === "completed").length };
  });
  const maxHrs = Math.max(1, ...perEmployee.map((p) => p.hrs));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3 flex-wrap">
        <StatTile label="Approved hours"    value={totalHrs}     accent="text-emerald-700" />
        <StatTile label="Overtime hours"    value={totalOT}      accent="text-amber-700" />
        <StatTile label="Task completion"   value={`${completion}%`} accent="text-blue-700" />
        <StatTile label="Pending approvals" value={pendingCount} accent="text-orange-700" />
      </div>

      <Card>
        <p className="font-semibold text-[15px] mb-4 flex items-center gap-2">
          <BarChart3 size={16} /> Approved hours by employee
        </p>
        <div className="flex flex-col gap-3">
          {perEmployee.map((p) => (
            <div key={p.id}>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-500">{p.hrs}h · {p.done}/{p.total} tasks done</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(p.hrs / maxHrs) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="font-semibold text-[15px] mb-4">Recent activity</p>
        <div className="flex flex-col">
          {[...data.timesheets].slice(0, 6).map((t) => (
            <div key={t.id} className="flex justify-between items-center text-[13.5px] py-2 border-b border-gray-100 last:border-0">
              <span>{nameOf(t.employee)} logged {t.hours_worked}h on {fmtDate(t.work_date)}</span>
              <Badge status={t.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminUsers() {
  return (
    <Card>
      <p className="font-semibold text-[15px] mb-4">User accounts</p>
      <div className="flex flex-col gap-2">
        {PEOPLE.map((p) => (
          <div key={p.id} className="flex justify-between items-center px-3 py-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${ROLES[p.role].avatar}`}>
                {initials(p.name)}
              </div>
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.manager ? `Reports to ${nameOf(p.manager)}` : "No direct manager"}</p>
              </div>
            </div>
            <RoleBadge role={p.role} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Root shell ───────────────────────────────────────────────────────────────

export default function App() {
  const { data, setData, loading, saving } = useStore();
  const [userId,       setUserId]       = useState("u_clarissa");
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const user = PEOPLE.find((p) => p.id === userId);
  const nav  = NAV_BY_ROLE[user.role];

  const [tab, setTab] = useState(nav[0].id);

  // Reset tab when role changes
  useEffect(() => { setTab(NAV_BY_ROLE[user.role][0].id); }, [user.role]);

  // Close switcher on outside click
  useEffect(() => {
    if (!switcherOpen) return;
    const close = (e) => { if (!e.target.closest("#role-switcher")) setSwitcherOpen(false); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [switcherOpen]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading workspace…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-start justify-center p-6">
      <div className="w-full max-w-5xl bg-[#FBFAF7] border border-gray-200 rounded-2xl shadow-sm flex overflow-visible">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col rounded-l-2xl">
          {/* Logo */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-100">
            <p className="font-semibold text-[16px] leading-snug text-gray-900">
              Employee Work<br />Tracking System
            </p>
            <p className="text-[10.5px] text-gray-400 mt-1.5 tracking-widest uppercase">x_emptrack</p>
          </div>

          {/* Nav */}
          <nav className="p-3 flex flex-col gap-0.5 flex-1">
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13.5px] w-full transition-colors ${
                  tab === id ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <Icon size={15} strokeWidth={tab === id ? 2.2 : 1.8} /> {label}
              </button>
            ))}
          </nav>

          {/* Role switcher */}
          <div className="p-3 border-t border-gray-100">
            <div id="role-switcher" className="relative">
              <button onClick={() => setSwitcherOpen((s) => !s)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${ROLES[user.role].avatar}`}>
                  {initials(user.name)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[12.5px] font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-[10.5px] text-gray-400 capitalize">{user.role}</p>
                </div>
                <ChevronDown size={13} className={`text-gray-400 transition-transform ${switcherOpen ? "rotate-180" : ""}`} />
              </button>

              {switcherOpen && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50">
                  <p className="text-[10px] text-gray-400 px-2 py-1 tracking-widest uppercase">Switch role (demo)</p>
                  {PEOPLE.map((p) => (
                    <button key={p.id} onClick={() => { setUserId(p.id); setSwitcherOpen(false); }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        p.id === userId ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${ROLES[p.role].avatar}`}>
                          {initials(p.name)}
                        </div>
                        <span className="text-gray-800">{p.name}</span>
                      </div>
                      <RoleBadge role={p.role} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0 p-6 rounded-r-2xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="font-semibold text-xl text-gray-900">
                {nav.find((n) => n.id === tab)?.label}
              </h1>
              <p className="text-[13px] text-gray-400 mt-1 flex items-center gap-1.5">
                {user.name} <RoleBadge role={user.role} />
              </p>
            </div>
            {saving && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                <Loader2 size={12} className="animate-spin" /> Saving…
              </span>
            )}
          </div>

          {/* Views */}
          {user.role === "employee" && tab === "timesheet" && <EmployeeTimesheet user={user} data={data} setData={setData} />}
          {user.role === "employee" && tab === "tasks"     && <EmployeeTasks     user={user} data={data} setData={setData} />}
          {user.role === "employee" && tab === "leave"     && <EmployeeLeave     user={user} data={data} setData={setData} />}
          {user.role === "manager"  && tab === "approvals" && <ManagerApprovals  user={user} data={data} setData={setData} />}
          {user.role === "manager"  && tab === "tasks"     && <ManagerTasks      user={user} data={data} setData={setData} />}
          {user.role === "admin"    && tab === "overview"  && <AdminOverview     data={data} />}
          {user.role === "admin"    && tab === "users"     && <AdminUsers />}
        </main>
      </div>
    </div>
  );
}
