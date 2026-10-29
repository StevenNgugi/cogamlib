import { useEffect, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import { UserRound, Menu, X, LogOut, Mail, Wallet, CreditCard, History, Bookmark, Palette, Info, HelpCircle, Shield, Megaphone, Users, Youtube, Facebook, Instagram, CheckCircle2, Lock, Send, Heart, Eye, Settings, MessageCircle, ChevronRight } from 'lucide-react';

type Member={name:string;email:string;image:string;plan:string;saved:string[];liked:string[];history:string[];audioOpened:string[];videoOpened:string[];theme:string};
type SiteSettings={heading:string;heroHeading?:string;heroSubtitle?:string;footerText?:string;announcement:string;primary:string;accent:string;logoUrl:string;logoPath?:string;sections?:string[];youtube:string;facebook:string;instagram:string;tiktok:string;contactEmail:string};
type Plan={name:string;priceUsd:number;currency:string;billingInterval:string;audio:number;video:number;description:string};
type Media={id:string;title:string;speaker:string;category:string;format:string;coverUrl?:string;audience?:string};
const sections=['Profile','Send Email','Wallet','Subscription','Watch History','Watchlist','Themes','About CDL','FAQs','Privacy Policy','Everyday Solutions','Teenager','Youths','Kids / Sunday School'];
const descriptions:Record<string,string>={
'Everyday Solutions':'Biblical encouragement for everyday decisions, challenges and hopeful living.',
'Teenager':'Age-appropriate faith and character resources for teenagers.',
'Youths':'Teachings on purpose, growth, education, calling and wise choices.',
'Kids / Sunday School':'Simple Bible stories and Sunday School resources, selected by ministry leaders.'
};
const tinyButton:React.CSSProperties={border:'1px solid #d8def1',background:'#fff',padding:'10px 14px',borderRadius:10,color:'#283f8e',fontWeight:700,cursor:'pointer'};
const inputStyle:React.CSSProperties={width:'100%',border:'1px solid #cdd3e8',borderRadius:10,padding:12,background:'#fff',color:'#1d2864',fontSize:14};
const panel:React.CSSProperties={padding:22,background:'white',borderRadius:18,border:'1px solid #e0e4f4'};
function errMessage(e:unknown){return e instanceof Error?e.message:'The request did not succeed. Please try again.'}
export function MemberDock(){
 const [opened,setOpened]=useState(false);
 const [section,setSection]=useState('');
 const [member,setMember]=useState<Member|null>(null);
 const [logged,setLogged]=useState(false);
 const [loading,setLoading]=useState(false);
 const [msg,setMsg]=useState('');
 const [name,setName]=useState('');
 const [image,setImage]=useState('');
 const [photoUploading,setPhotoUploading]=useState(false);
 const [settings,setSettings]=useState<SiteSettings|null>(null);
 const [plans,setPlans]=useState<Plan[]>([]);
 const [contents,setContents]=useState<Media[]>([]);
 const [planChoice,setPlanChoice]=useState('');
 const [reference,setReference]=useState('');
 const load=async()=>{
  try{
   const s=await api.get('/api/settings');
   setSettings(s.data.settings);
   if(s.data.settings?.primary&&/^#[0-9a-fA-F]{6}$/.test(s.data.settings.primary))document.documentElement.style.setProperty('--cogam-primary',s.data.settings.primary);
   if(s.data.settings?.accent&&/^#[0-9a-fA-F]{6}$/.test(s.data.settings.accent))document.documentElement.style.setProperty('--cogam-accent',s.data.settings.accent);
   setPlans(s.data.plans||[]);
   const c=await api.get('/api/library'); setContents(c.data.items||[]);
  }catch(e){setMsg(errMessage(e))}
  try{
   const u=await auth.getUser();
   setLogged(Boolean(u));
   if(u){const r=await api.get('/api/member/me');setMember(r.data.member);setName(r.data.member.name);setImage(r.data.member.image||'')}
  }catch(e){setMsg(errMessage(e))}
 };
 useEffect(()=>{void load()},[]);
 const signin=async()=>{setLoading(true);setMsg('');try{await auth.signInWithRedirect()}catch(e){setMsg(errMessage(e));setLoading(false)}};
 const logout=async()=>{await auth.signOut();setLogged(false);setMember(null);setOpened(false);setSection('');setMsg('')};
 const uploadPhoto=async(file:File)=>{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1400000){setMsg('Choose a JPG, PNG or WebP image under 1.4 MB.');return}
  setPhotoUploading(true);setMsg('');
  try{
    const base64=await new Promise<string>((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
      reader.onerror=()=>reject(new Error('Could not read this image'));
      reader.readAsDataURL(file);
    });
    const r=await api.post('/api/member/avatar',{contentType:file.type,base64});
    setImage(r.data.image);
    if(member)setMember({...member,image:r.data.image});
    setMsg('Profile picture uploaded successfully');
  }catch(e){setMsg(errMessage(e))}finally{setPhotoUploading(false)}
 };
 const save=async()=>{setLoading(true);setMsg('');try{const r=await api.put('/api/member/me',{name,image});setMember(r.data.member);setMsg('Profile saved')}catch(e){setMsg(errMessage(e))}finally{setLoading(false)}};
 const choose=(s:string)=>{setSection(s);setOpened(false);setMsg('')};
 const upgradereq=async()=>{if(!member){await signin();return}setLoading(true);try{const r=await api.post('/api/member/subscription-request',{plan:planChoice,reference});setMsg(r.data.message)}catch(e){setMsg(errMessage(e))}finally{setLoading(false)}};
 const history=contents.filter(c=>(section==='Watch History'?member?.history:member?.saved)?.includes(c.id));
 const [theme,setTheme]=useState('system');
 useEffect(()=>{if(member?.theme)setTheme(member.theme)},[member?.theme]);
 const saveTheme=async(v:string)=>{setTheme(v);document.documentElement.dataset.theme=v;if(member){try{const r=await api.put('/api/member/me',{theme:v});setMember(r.data.member)}catch(e){setMsg(errMessage(e))}}};
 useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
 const visibleAccountSections=sections.filter(s=>!Object.keys(descriptions).includes(s)||(settings?.sections||['Everyday Solutions','Teenager','Youths','Kids / Sunday School']).includes(s));
 const audience=contents.filter(c=>c.audience===section);
 return <div className="cogam-member-dock">
  <div className="member-dock-tools">
    <button aria-label="Open profile and navigation" title="Profile and menu" style={{...tinyButton,display:'flex',gap:9,alignItems:'center',borderRadius:30}} onClick={()=>setOpened(!opened)}>
      {member?.image?<img alt="" src={member.image} style={{width:29,height:29,objectFit:'cover',borderRadius:'50%'}}/>:<UserRound size={20}/>}
      <span>{member?.name||'My Account'}</span>{opened?<X size={18}/>:<Menu size={18}/>}
    </button>
    {opened&&<nav className="member-dock-menu" aria-label="Account navigation">
      {!logged&&<button onClick={()=>void signin()}>Register / Sign in</button>}
      {visibleAccountSections.map(s=><button key={s} onClick={()=>choose(s)}>{s}<ChevronRight size={14}/></button>)}
      {logged&&<button onClick={()=>void logout()}><LogOut size={15}/> Logout</button>}
    </nav>}
  </div>
  {settings?.announcement&&<div className="member-announcement"><Megaphone size={15}/>{settings.announcement}</div>}
  {section&&<div className="member-overlay" role="dialog" aria-modal="true" aria-label={section}>
    <div className="member-overlay-panel">
     <div className="member-overlay-top"><h2>{section}</h2><button style={tinyButton} aria-label="Close page" onClick={()=>setSection('')}><X size={17}/></button></div>
     {msg&&<p role="status" style={{padding:12,background:'#e9f9eb',borderRadius:10,color:'#254671'}}>{msg}</p>}
     {!logged&&['Profile','Wallet','Subscription','Watch History','Watchlist'].includes(section)&&<div style={panel}><h3>Create an account or log in</h3><p>Use your email or a supported account provider to keep your library and subscription associated with your own account.</p><button style={tinyButton} disabled={loading} onClick={()=>void signin()}>Register / Log in</button></div>}
     {section==='Profile'&&member&&<div style={panel}><p>Plan: <strong>{member.plan}</strong></p><label>Display name<input style={inputStyle} value={name} maxLength={90} onChange={e=>setName(e.target.value)}/></label><label>Upload your profile photo<input type="file" accept="image/jpeg,image/png,image/webp" style={inputStyle} disabled={photoUploading} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadPhoto(f)}}/></label>{image&&<img src={image} alt="Your profile" style={{width:86,height:86,objectFit:'cover',borderRadius:'50%',margin:12}}/>}<p style={{fontSize:12}}>Use a JPG, PNG or WebP image under 1.4 MB.</p><button style={tinyButton} disabled={loading} onClick={()=>void save()}>Save changes</button></div>}
     {section==='Send Email'&&<div style={panel}><p>Contact the ministry using its configured email address.</p>{settings?.contactEmail?<a style={tinyButton} href={'mailto:'+settings.contactEmail}>Send email to COGAM</a>:<p>The administrator has not published a contact email yet.</p>}</div>}
     {section==='Wallet'&&member&&<div style={panel}><h3>Wallet</h3><p>Payments and wallet balances are not activated. No amount has been charged or credited.</p><p>Current access: <strong>{member.plan}</strong></p></div>}
     {section==='Subscription'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
       {plans.map(p=><div style={panel} key={p.name}><h3>{p.name}</h3><p style={{fontSize:23,fontWeight:800}}>${p.priceUsd}/month</p><p>{p.description}</p><p>Audio: {p.audio>1000?'Full':p.audio} · Video: {p.video>1000?'Full':p.video}</p><button style={tinyButton} disabled={!member||p.name===member?.plan||p.name==='Free'} onClick={()=>setPlanChoice(p.name)}>{p.name===member?.plan?'Current plan':'Request upgrade'}</button></div>)}
       {planChoice&&member&&<div style={{...panel,gridColumn:'1/-1'}}><h3>Request {planChoice}</h3><p>No payment is collected here. A ministry administrator must verify payment separately before enabling access.</p><input placeholder="Optional payment reference" value={reference} onChange={e=>setReference(e.target.value)} style={inputStyle}/><button style={{...tinyButton,marginTop:12}} disabled={loading} onClick={()=>void upgradereq()}>Submit upgrade request</button></div>}
     </div>}
     {(section==='Watch History'||section==='Watchlist')&&member&&(history.length?<div className="member-results">{history.map(c=><div key={c.id} style={panel}><strong>{c.title}</strong><p>{c.speaker} · {c.format}</p></div>)}</div>:<div style={panel}><p>No saved content in this section yet.</p></div>)}
     {section==='Themes'&&<div style={panel}><p>Choose your interface preference.</p>{['system','light','dark'].map(v=><button style={{...tinyButton,marginRight:8,background:theme===v?'#ddf6d2':'#fff'}} key={v} onClick={()=>void saveTheme(v)}>{v}</button>)}</div>}
     {section==='About CDL'&&<div style={panel}><p><strong>COGAM Digital Library</strong> is a Word of Truth resource for Bible teaching, Christian growth, audio messages, video messages and eBooks.</p><p>Content and announcements are published by approved administrators.</p></div>}
     {section==='FAQs'&&<div style={panel}><h3>How do I register?</h3><p>Select My Account, then Register / Sign in.</p><h3>What does Free include?</h3><p>Three distinct audio teachings and two distinct videos. Premium messages require a paid plan.</p><h3>How are upgrades activated?</h3><p>An administrator verifies your payment independently before approving your plan.</p><h3>Can I download everything?</h3><p>No. Downloads depend on membership and the content owner's settings.</p></div>}
     {section==='Privacy Policy'&&<div style={panel}><h3>Privacy information</h3><p>COGAM Digital Library uses your account identity, profile details, saved teachings, likes, listening history, comments and subscription status to operate your library experience. Profile photos are stored securely by the platform. Comments are reviewed by authorized ministry administrators before public display.</p><p>Payment collection is not currently active in CDL. When payment processing is enabled, payment details will be handled by the payment provider rather than stored as card data in the library.</p><p>You may request correction or deletion of your account information through the ministry contact email shown in this app. Please do not post passwords, payment details, or private information about children in comments.</p></div>}
     {Object.keys(descriptions).includes(section)&&<div style={panel}><p>{descriptions[section]}</p>{audience.length?<div className="member-results">{audience.map(c=><div key={c.id} style={{...panel,background:'#f7f8ff'}}><strong>{c.title}</strong><p>{c.format} · {c.speaker}</p></div>)}</div>:<p>Content for this collection will appear after a ministry administrator publishes it.</p>}</div>}
     <div style={{marginTop:30,display:'flex',flexWrap:'wrap',gap:12}}>
      {settings?.youtube&&<a href={settings.youtube} rel="noopener noreferrer" target="_blank" style={tinyButton}><Youtube size={16}/> YouTube</a>}
      {settings?.facebook&&<a href={settings.facebook} rel="noopener noreferrer" target="_blank" style={tinyButton}><Facebook size={16}/> Facebook</a>}
      {settings?.instagram&&<a href={settings.instagram} rel="noopener noreferrer" target="_blank" style={tinyButton}><Instagram size={16}/> Instagram</a>}
      {settings?.tiktok&&<a href={settings.tiktok} rel="noopener noreferrer" target="_blank" style={tinyButton}>TikTok</a>}
     </div>
    </div>
   </div>}
 </div>;
}
export function AdminControlCenter(){
 const [tab,setTab]=useState('Site Settings');
 const [open,setOpen]=useState(false);
 const [settings,setSettings]=useState<SiteSettings|null>(null);
 const [members,setMembers]=useState<any[]>([]);
 const changeMember=async(id:string,suspended:boolean)=>{try{await api.put('/api/admin/members/'+id,{suspended});setInfo('Member account status updated');await refresh()}catch(e){setInfo(errMessage(e))}};
 const [requests,setRequests]=useState<any[]>([]);
 const [comments,setComments]=useState<any[]>([]);
 const [admins,setAdmins]=useState<any[]>([]);
 const [logoUploading,setLogoUploading]=useState(false);
 const [email,setEmail]=useState('');
 const changeAdmin=async(id:string,approved:boolean)=>{try{await api.put('/api/admin/approvals/'+id,{approved});setInfo('Administrator approval updated');await refresh()}catch(e){setInfo(errMessage(e))}};
 const [info,setInfo]=useState('');
 const [loading,setLoading]=useState(false);
 const refresh=async()=>{try{const [s,m,r,c,a]=await Promise.all([
 api.get('/api/settings'),api.get('/api/admin/members'),api.get('/api/admin/subscriptions'),api.get('/api/admin/comments'),api.get('/api/admin/approvals')]);
 setSettings(s.data.settings);setMembers(m.data.members||[]);setRequests(r.data.requests||[]);setComments(c.data.comments||[]);setAdmins(a.data.admins||[]);
 }catch(e){setInfo(errMessage(e))}};
 const start=()=>{setOpen(true);void refresh()};
 const uploadLogo=async(file:File)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1400000){setInfo('Choose a logo under 1.4 MB.');return}
  setLogoUploading(true);
  try{
    const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=()=>reject(new Error('Unable to read logo'));reader.readAsDataURL(file)});
    const r=await api.post('/api/admin/logo',{base64,contentType:file.type});
    setSettings(old=>old?{...old,logoUrl:'',logoPath:r.data.logoPath}:old);setInfo('New ministry logo uploaded');
  }catch(e){setInfo(errMessage(e))}finally{setLogoUploading(false)}
 };
 const saveSettings=async()=>{setLoading(true);try{await api.put('/api/admin/settings',settings);setInfo('Site settings saved');window.dispatchEvent(new Event('cogam-settings-updated'))}catch(e){setInfo(errMessage(e))}finally{setLoading(false)}};
 const approveAdmin=async()=>{setLoading(true);try{await api.post('/api/admin/approvals',{email});setEmail('');setInfo('Administrator approved');await refresh()}catch(e){setInfo(errMessage(e))}finally{setLoading(false)}};
 const review=async(id:string)=>{setLoading(true);try{await api.put('/api/admin/subscription/'+id,{decision:'decline'});setInfo('Subscription request declined. Only Stripe-verified payments can activate membership.');await refresh()}catch(e){setInfo(errMessage(e))}finally{setLoading(false)}};
 const moderate=async(id:string,approve:boolean)=>{try{await api.put('/api/admin/comments/'+id,{approve});setInfo('Comment reviewed');await refresh()}catch(e){setInfo(errMessage(e))}};
 return <div className="cogam-admin-controls"><button style={{...tinyButton,background:'#d5efbb'}} onClick={start}><Settings size={17}/> Extended Admin Controls</button>
 {open&&<div className="member-overlay" role="dialog" aria-modal="true" aria-label="Admin management">
  <div className="member-overlay-panel">
   <div className="member-overlay-top"><h2>CDL Management</h2><button style={tinyButton} onClick={()=>setOpen(false)}><X size={17}/></button></div>
   <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:25}}>{['Site Settings','Members','Subscriptions','Comments','Admin Approvals'].map(x=><button key={x} style={{...tinyButton,background:tab===x?'#d7e8ff':'white'}} onClick={()=>setTab(x)}>{x}</button>)}</div>
   {info&&<p role="status">{info}</p>}
   {tab==='Site Settings'&&settings&&<div style={panel}><p>Changes are visible to visitors after saving. Only verified administrators can edit these settings.</p>{(['heading','heroHeading','heroSubtitle','footerText','announcement','primary','accent','logoUrl','youtube','facebook','tiktok','instagram','contactEmail'] as const).map(key=><label key={key} style={{display:'block',marginBottom:14,fontWeight:700}}>{key}<input type={key==='primary'||key==='accent'?'color':'text'} style={inputStyle} value={settings[key]||''} onChange={e=>setSettings(old=>old?{...old,[key]:e.target.value,...(key==='logoUrl'?{logoPath:''}:{})}:old)}/></label>)}<div style={{...panel,marginBottom:16}}><strong>Visible website and app sections</strong><p>Choose which library sections appear in navigation and the member menu.</p>{['Home','Browse','Categories','My Library','Everyday Solutions','Teenager','Youths','Kids / Sunday School'].map(sectionName=><label key={sectionName} style={{display:'flex',gap:10,alignItems:'center',margin:'10px 0'}}><input type="checkbox" checked={(settings.sections||['Home','Browse','Categories','My Library','Everyday Solutions','Teenager','Youths','Kids / Sunday School']).includes(sectionName)} onChange={e=>setSettings(old=>old?{...old,sections:e.target.checked?[...new Set([...(old.sections||[]),sectionName])]:((old.sections||[]).filter(x=>x!==sectionName))}:old)}/>{sectionName}</label>)}</div><label>Upload ministry logo<input type="file" disabled={logoUploading} accept="image/jpeg,image/png,image/webp" style={inputStyle} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadLogo(f)}}/></label>
    <button disabled={loading} style={tinyButton} onClick={()=>void saveSettings()}>Save website settings</button></div>}
   {tab==='Members'&&<div>{members.map(m=><div style={{...panel,marginBottom:10}} key={m.id}><strong>{m.name||m.email}</strong><p>{m.email} · {m.plan||'Free'} · {m.suspended?'Suspended':'Active'}</p><button style={tinyButton} onClick={()=>void changeMember(m.id,!m.suspended)}>{m.suspended?'Reactivate account':'Suspend account'}</button></div>)}</div>}
   {tab==='Subscriptions'&&<div>{requests.map(r=><div style={{...panel,marginBottom:10}} key={r.id}><h3>{r.email}</h3><p>{r.plan} · USD ${r.priceUsd}/month · {r.status}</p>{r.reference&&<p>Reference: {r.reference}</p>}{r.status==='pending'&&<div style={{display:'flex',gap:10}}><button style={tinyButton} disabled={loading} onClick={()=>void review(r.id)}>Decline request</button><span style={{fontSize:12}}>Payment activation is unavailable until Stripe webhook verification is deployed.</span></div>}</div>)}</div>}
   {tab==='Comments'&&<div>{comments.map(c=><div style={{...panel,marginBottom:10}} key={c.id}><strong>{c.author}</strong><p>{c.text}</p><p>Status: {c.moderated?'Published':'Awaiting moderation'}</p><button style={tinyButton} onClick={()=>void moderate(c.id,true)}>Approve</button><button style={{...tinyButton,marginLeft:8}} onClick={()=>void moderate(c.id,false)}>Hide</button></div>)}</div>}
   {tab==='Admin Approvals'&&<div style={panel}><h3>Approved administrators</h3>{admins.map(a=><div key={a.id} style={{display:'flex',gap:12,alignItems:'center',marginBottom:9}}><span>{a.email} · {a.approved?'Approved':'Revoked'}</span><button style={tinyButton} onClick={()=>void changeAdmin(a.id,!a.approved)}>{a.approved?'Revoke':'Approve'}</button></div>)}<label>Approve administrator email<input style={inputStyle} value={email} onChange={e=>setEmail(e.target.value)}/></label><p>For security, only the original owner can approve additional administrators.</p><button disabled={loading} style={tinyButton} onClick={()=>void approveAdmin()}>Approve email</button></div>}
  </div>
 </div>}
 </div>;
}
