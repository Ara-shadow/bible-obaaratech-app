import { useEffect, useState } from "react";
import { adminFetch, adminLogout } from "../../lib/adminApi";

type Vibe = { id:string; publishDate:string; reflection:string; language:string; published:boolean };
type Story = { id:string; title:string; body:string; ageRange?:string; moralLesson?:string; prayer?:string; activity?:string; language:string; published:boolean };

export function AdminDashboardPage() {
  const [tab, setTab] = useState<"overview"|"vibes"|"stories">("overview");
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [v, s] = await Promise.all([adminFetch("/api/admin/vibes"), adminFetch("/api/admin/stories")]);
      setVibes(v); setStories(s);
    } catch (e) {
      if (e instanceof Error && e.message === "AUTH_REQUIRED") window.location.href="/admin/login";
      else setError(e instanceof Error ? e.message : "Unable to load dashboard.");
    }
  }
  useEffect(()=>{ load(); },[]);

  return <div className="admin-app">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="admin-logo">✦</span><div><strong>Bible AI</strong><small>Admin</small></div></div>
      <button className={tab==="overview"?"side-active":""} onClick={()=>setTab("overview")}>Dashboard</button>
      <button className={tab==="vibes"?"side-active":""} onClick={()=>setTab("vibes")}>Bible Vibes</button>
      <button className={tab==="stories"?"side-active":""} onClick={()=>setTab("stories")}>Kids Stories</button>
      <a href="/" className="side-link">View Website</a>
      <button className="side-link logout" onClick={adminLogout}>Sign out</button>
    </aside>

    <section className="admin-main">
      <header className="admin-topbar"><div><span className="eyebrow">ADMINISTRATION</span><h1>{tab==="overview"?"Dashboard":tab==="vibes"?"Bible Vibes":"Kids Bible Stories"}</h1></div></header>
      {error && <div className="admin-error">{error}</div>}

      {tab==="overview" && <div className="admin-grid">
        <div className="stat-card"><span>Published Vibes</span><strong>{vibes.filter(x=>x.published).length}</strong></div>
        <div className="stat-card"><span>Stories</span><strong>{stories.length}</strong></div>
        <div className="stat-card"><span>Published Stories</span><strong>{stories.filter(x=>x.published).length}</strong></div>
        <div className="admin-card wide"><h2>Content management</h2><p className="muted">Publish daily Bible Vibes and children's Bible stories from one place. Scripture content should use a translation licensed for your intended distribution.</p><div className="action-row"><button className="primary-btn" onClick={()=>setTab("vibes")}>Manage Vibes</button><button className="secondary-btn" onClick={()=>setTab("stories")}>Manage Stories</button></div></div>
      </div>}

      {tab==="vibes" && <Vibes items={vibes} onReload={load}/>}
      {tab==="stories" && <Stories items={stories} onReload={load}/>}
    </section>
  </div>;
}

function Vibes({items,onReload}:{items:Vibe[];onReload:()=>Promise<void>}) {
  const empty={publishDate:new Date().toISOString().slice(0,10),reflection:"",language:"en",published:false};
  const [form,setForm]=useState(empty); const [editing,setEditing]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  async function save(){
    setBusy(true);
    try { await adminFetch(editing?`/api/admin/vibes/${editing}`:"/api/admin/vibes",{method:editing?"PUT":"POST",body:JSON.stringify(form)}); setForm(empty);setEditing(null);await onReload(); }
    finally {setBusy(false);}
  }
  async function remove(id:string){if(!confirm("Delete this Bible Vibe?"))return;await adminFetch(`/api/admin/vibes/${id}`,{method:"DELETE"});await onReload();}
  return <div className="admin-content">
    <div className="admin-card"><h2>{editing?"Edit Bible Vibe":"Add Bible Vibe"}</h2><div className="form-grid"><label>Date<input type="date" value={form.publishDate} onChange={e=>setForm({...form,publishDate:e.target.value})}/></label><label>Language<input value={form.language} onChange={e=>setForm({...form,language:e.target.value})}/></label></div><label>Reflection<textarea rows={7} value={form.reflection} onChange={e=>setForm({...form,reflection:e.target.value})}/></label><label className="check"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/> Publish immediately</label><div className="action-row"><button className="primary-btn" onClick={save} disabled={busy}>{busy?"Saving…":editing?"Update":"Save Vibe"}</button>{editing&&<button className="secondary-btn" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel</button>}</div></div>
    <div className="admin-card"><h2>Existing Vibes</h2>{items.map(x=><div className="content-row" key={x.id}><div><strong>{new Date(x.publishDate).toLocaleDateString()}</strong><p>{x.reflection.slice(0,180)}{x.reflection.length>180?"…":""}</p></div><span className={x.published?"status live":"status draft"}>{x.published?"Published":"Draft"}</span><button onClick={()=>{setEditing(x.id);setForm({publishDate:x.publishDate.slice(0,10),reflection:x.reflection,language:x.language,published:x.published})}}>Edit</button><button className="danger" onClick={()=>remove(x.id)}>Delete</button></div>)}</div>
  </div>
}

function Stories({items,onReload}:{items:Story[];onReload:()=>Promise<void>}) {
  const empty={title:"",body:"",ageRange:"",moralLesson:"",prayer:"",activity:"",language:"en",published:false};
  const [form,setForm]=useState(empty); const [editing,setEditing]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  async function save(){setBusy(true);try{await adminFetch(editing?`/api/admin/stories/${editing}`:"/api/admin/stories",{method:editing?"PUT":"POST",body:JSON.stringify(form)});setForm(empty);setEditing(null);await onReload()}finally{setBusy(false)}}
  async function remove(id:string){if(!confirm("Delete this story?"))return;await adminFetch(`/api/admin/stories/${id}`,{method:"DELETE"});await onReload();}
  return <div className="admin-content">
    <div className="admin-card"><h2>{editing?"Edit Story":"Add Children's Bible Story"}</h2><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><div className="form-grid"><label>Age range<input value={form.ageRange} onChange={e=>setForm({...form,ageRange:e.target.value})}/></label><label>Language<input value={form.language} onChange={e=>setForm({...form,language:e.target.value})}/></label></div><label>Story<textarea rows={10} value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></label><label>Moral lesson<textarea rows={4} value={form.moralLesson} onChange={e=>setForm({...form,moralLesson:e.target.value})}/></label><label>Prayer<textarea rows={4} value={form.prayer} onChange={e=>setForm({...form,prayer:e.target.value})}/></label><label>Activity<textarea rows={4} value={form.activity} onChange={e=>setForm({...form,activity:e.target.value})}/></label><label className="check"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/> Publish immediately</label><div className="action-row"><button className="primary-btn" onClick={save} disabled={busy}>{busy?"Saving…":editing?"Update Story":"Save Story"}</button>{editing&&<button className="secondary-btn" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel</button>}</div></div>
    <div className="admin-card"><h2>Existing Stories</h2>{items.map(x=><div className="content-row" key={x.id}><div><strong>{x.title}</strong><p>{x.body.slice(0,180)}{x.body.length>180?"…":""}</p></div><span className={x.published?"status live":"status draft"}>{x.published?"Published":"Draft"}</span><button onClick={()=>{setEditing(x.id);setForm({title:x.title,body:x.body,ageRange:x.ageRange||"",moralLesson:x.moralLesson||"",prayer:x.prayer||"",activity:x.activity||"",language:x.language,published:x.published})}}>Edit</button><button className="danger" onClick={()=>remove(x.id)}>Delete</button></div>)}</div>
  </div>
}
