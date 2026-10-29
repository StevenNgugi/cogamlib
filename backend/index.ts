import {
  router,
  json,
  error,
  db,
  storage,
  requireAuth,
  type RouterMiddleware,
} from '@appdeploy/sdk';

type MediaItem = {
  id?: string;
  title: string;
  speaker: string;
  summary: string;
  category: string;
  format: string;
  language: string;
  coverUrl: string;
  mediaUrl: string;
  filePath: string;
  fileName: string;
  duration: string;
  published: boolean;
  featured: boolean;
  audience?: string;
  access?: 'Free' | 'Premium';
  downloadable?: boolean;
  createdAt: string;
  updatedAt: string;
};

const TABLE = 'cogam_library_content';
const ADMIN_EMAILS = ['stevewesh14@gmail.com'];
const adminGate: RouterMiddleware = async ctx => {
  const email = (ctx.user?.email || '').toLowerCase();
  if (ADMIN_EMAILS.includes(email)) return;
  const page = await db.list<{ email: string; approved: boolean }>('cogam_approved_admins', { limit: 150 });
  if (!page.items.some(row => row.email === email && row.approved)) return error('Administrator approval required.', 403);
};
const adminOnly = [requireAuth(), adminGate];
const userTable = (uid: string) => 'cogam_member_' + uid.replace(/[^a-zA-Z0-9]/g, '');
type Member = { name: string; email: string; image: string; imagePath?: string; suspended?: boolean; plan: string; saved: string[]; liked: string[]; history: string[]; audioOpened: string[]; videoOpened: string[]; theme: string };
const defaultMember = (name: string, email: string): Member => ({
  name, email, image: '', imagePath: '', suspended: false, plan: 'Free', saved: [], liked: [], history: [], audioOpened: [], videoOpened: [], theme: 'system'
});
async function memberRecord(uid: string, name: string, email: string) {
  const table = userTable(uid);
  const page = await db.list<Member>(table, { limit: 5 });
  if (page.items[0]) return { id: page.items[0].id, item: page.items[0] };
  const created = defaultMember(name, email);
  const [id] = await db.add(table, [created]);
  if (!id) throw new Error('Unable to create member record');
  await db.add('cogam_member_directory', [{ userId: uid, name, email, plan: 'Free', createdAt: new Date().toISOString() }]);
  return { id, item: created };
}
const PLANS = [
  { name: 'Free', priceUsd: 0, currency: 'USD', billingInterval: 'month', audio: 3, video: 2, description: '3 audio teachings and 2 videos' },
  { name: 'Growth', priceUsd: 5, currency: 'USD', billingInterval: 'month', audio: 15, video: 10, description: 'Expanded teaching access' },
  { name: 'Faith', priceUsd: 10, currency: 'USD', billingInterval: 'month', audio: 40, video: 25, description: 'More teaching resources' },
  { name: 'Faith Plus', priceUsd: 15, currency: 'USD', billingInterval: 'month', audio: 70, video: 50, description: 'Extended teaching access' },
  { name: 'Kingdom', priceUsd: 30, currency: 'USD', billingInterval: 'month', audio: 100000, video: 100000, description: 'Full teaching library' },
  { name: 'Sonship', priceUsd: 50, currency: 'USD', billingInterval: 'month', audio: 100000, video: 100000, description: 'Full library; additional benefits to be defined' },
] as const;
async function getPublicSettings() {
 const page = await db.list<Record<string, unknown>>('cogam_site_settings', { limit: 5 });
 return page.items[0] || { heading: 'COGAM DIGITAL LIBRARY', heroHeading: 'Grow in the Word. Live in His Truth.', heroSubtitle: 'Explore faith-building teachings from COGAM Word of Truth.', footerText: 'Rooted in the Word. Growing in truth.', announcement: '', primary: '#293EBA', accent: '#B2FF56', logoUrl: '', logoPath: '', sections: ['Home','Browse','Categories','My Library','Everyday Solutions','Teenager','Youths','Kids / Sunday School'], youtube: '', facebook: '', instagram: '', tiktok: '', contactEmail: '' };
}


const clean = (value: unknown, max = 2000) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
const httpsUrl = (value: unknown) => {
  const url = clean(value, 2048);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? url : '';
  } catch {
    return '';
  }
};
const categories = [
  'Faith & Victory',
  'Prayer & Worship',
  'Holy Spirit',
  'Healing & Restoration',
  'Christian Living',
  'Prophecy & Revelation',
  'Soul Winning',
  'Leadership & Purpose',
  'Bible Study',
  'Other',
];
const formats = ['Audio', 'Video', 'eBook', 'Article'];
const languages = ['English', 'Kiswahili', 'Other'];
const normalize = (body: unknown, previous?: MediaItem): MediaItem => {
  const b = (body || {}) as Partial<MediaItem>;
  const now = new Date().toISOString();
  return {
    title: clean(b.title, 160),
    speaker: clean(b.speaker, 120) || 'COGAM Word of Truth',
    summary: clean(b.summary, 2500),
    category: categories.includes(clean(b.category))
      ? clean(b.category)
      : 'Other',
    format: formats.includes(clean(b.format)) ? clean(b.format) : 'Audio',
    language: languages.includes(clean(b.language))
      ? clean(b.language)
      : 'English',
    coverUrl: httpsUrl(b.coverUrl),
    mediaUrl: httpsUrl(b.mediaUrl),
    filePath: clean(b.filePath, 450),
    fileName: clean(b.fileName, 200),
    duration: clean(b.duration, 40),
    published: b.published === true,
    featured: b.featured === true,
    audience: ['General','Everyday Solutions','Teenager','Youths','Kids / Sunday School'].includes(clean(b.audience)) ? clean(b.audience) : 'General',
    access: clean(b.access) === 'Premium' ? 'Premium' : 'Free',
    downloadable: b.downloadable === true,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
};

export const handler = router({
  'GET /api/_healthcheck': [
    async () => json({ status: 'ok', service: 'COGAM Digital Library' }),
  ],
  'GET /api/library': [
    async () => {
      const result = await db.list<MediaItem>(TABLE, { limit: 300 });
      const published = result.items.filter(item => item.published === true);
      const items = published.map(item => ({
        ...item,
        mediaUrl: '',
        filePath: undefined,
        assetUrl: '',
        audience: (item as MediaItem).audience || 'General',
        access: (item as MediaItem).access || 'Free',
        downloadable: (item as MediaItem).downloadable === true,
      }));
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return json({ items });
    },
  ],

  'GET /api/settings': [async ()=>{
    const settings=await getPublicSettings();
    let logoUrl=settings.logoUrl||'';
    if(typeof settings.logoPath==='string'&&settings.logoPath)logoUrl=(await storage.url([settings.logoPath]))[0]?.url||logoUrl;
    return json({settings:{...settings,logoUrl},plans:PLANS});
  }],
  'GET /api/member/me': [
    requireAuth(),
    async ({ user }) => {
      const row = await memberRecord(user!.userId, user!.name || '', user!.email || '');
      const image=row.item.imagePath ? (await storage.url([row.item.imagePath]))[0]?.url || '' : row.item.image;
      return json({member:{...row.item,image}});
    },
  ],
  'PUT /api/member/me': [
    requireAuth(),
    async ({ user, body }) => {
      const row = await memberRecord(user!.userId, user!.name || '', user!.email || '');
      const b = (body || {}) as Partial<Member>;
      const updated = { ...row.item,
        name: clean(b.name, 90) || row.item.name,
        image: httpsUrl(b.image) || row.item.image,
        theme: ['light','dark','system'].includes(clean(b.theme)) ? clean(b.theme) : row.item.theme
      };
      const [ok]=await db.tx.update(userTable(user!.userId),[{id:row.id,record:{name:updated.name,image:updated.image,theme:updated.theme}}],{patch:true});
      if(!ok)return error('Could not save profile',409);
      const image=updated.imagePath ? (await storage.url([updated.imagePath]))[0]?.url || '' : updated.image;
      return json({member:{...updated,image}});
    },
  ],
  'POST /api/member/avatar': [
    requireAuth(),
    async ({user,body})=>{
      const b=(body||{}) as {base64?:string;contentType?:string};
      const type=clean(b.contentType,60), data=clean(b.base64,2000001);
      if(!['image/png','image/jpeg','image/webp'].includes(type) || !data || data.length>2000000 || !/^[a-zA-Z0-9+/]+={0,2}$/.test(data))return error('Upload a JPG, PNG or WebP image below 1.4MB',400);
      const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
      const path='avatars/'+user!.userId.replace(/[^a-zA-Z0-9]/g,'')+'-'+Date.now()+'.'+ext;
      const [ok]=await storage.write([{path,content:data,contentType:type}]);
      if(!ok)return error('Upload failed',500);
      const row=await memberRecord(user!.userId,user!.name||'',user!.email||'');
      const [saved]=await db.tx.update(userTable(user!.userId),[{id:row.id,record:{imagePath:path,image:''}}],{patch:true});
      if(!saved)return error('Could not save profile picture',409);
      return json({image:(await storage.url([path]))[0]?.url||''});
    }
  ],
  'POST /api/member/action': [
    requireAuth(),
    async ({ user, body }) => {
      const b = (body || {}) as { action?: string; contentId?: string; comment?: string };
      const id = clean(b.contentId, 120);
      if (!id) return error('Content is required', 400);
      const [item] = await db.get<MediaItem>(TABLE, [id]);
      if (!item?.published) return error('Content not found', 404);
      const row = await memberRecord(user!.userId, user!.name || '', user!.email || '');
      if(row.item.suspended===true)return error('This account is suspended. Contact the administrator.',403);
      const updated = { ...row.item };
      if (b.action === 'like' || b.action === 'save') {
        const field = b.action === 'like' ? 'liked' : 'saved';
        const values = updated[field] || [];
        updated[field] = values.includes(id) ? values.filter(x => x !== id) : [...values, id].slice(-300);
      } else if (b.action === 'history') {
        updated.history = [id, ...(updated.history || []).filter(x => x !== id)].slice(0,100);
      } else if (b.action === 'comment') {
        const message = clean(b.comment, 500);
        if (!message) return error('Comment cannot be empty',400);
        await db.add('cogam_comments', [{ contentId: id, author: updated.name, userId: user!.userId, text: message, moderated: false, createdAt: new Date().toISOString() }]);
        return json({ submitted: true, moderation: 'pending' });
      } else return error('Unknown action', 400);
      await db.update(userTable(user!.userId), [{ id: row.id, record: updated }]);
      return json({ member: updated });
    },
  ],
  'GET /api/member/media/:id': [
    requireAuth(),
    async ({ user, params }) => {
      const [item] = await db.get<MediaItem & { access?: string; downloadable?: boolean }>(TABLE, [params.id]);
      if (!item?.published) return error('Media not found', 404);
      const row = await memberRecord(user!.userId, user!.name || '', user!.email || '');
      if(row.item.suspended===true)return error('Account access has been suspended',403);
      const plan = PLANS.find(p => p.name === row.item.plan) || PLANS[0];
      const required = item.access || 'Free';
      if (required === 'Premium' && row.item.plan === 'Free') return error('Upgrade to access this premium teaching', 403);
      const field = item.format === 'Audio' ? 'audioOpened' : item.format === 'Video' ? 'videoOpened' : null;
      if (field) {
        const watched = row.item[field] || [];
        const limit = field === 'audioOpened' ? plan.audio : plan.video;
        if (!watched.includes(params.id) && watched.length >= limit) return error('Your plan teaching limit has been reached', 403);
        if (!watched.includes(params.id)) {
          await db.update(userTable(user!.userId), [{id: row.id, record: {...row.item, [field]: [...watched, params.id]} }]);
        }
      }
      const signed = item.filePath ? await storage.url([item.filePath]) : [];
      return json({ url: signed[0]?.url || item.mediaUrl || '', downloadable: item.downloadable === true && row.item.plan !== 'Free' });
    },
  ],
  'POST /api/member/subscription-request': [
    requireAuth(),
    async ({ user, body }) => {
      const b = (body || {}) as { plan?: string; reference?: string };
      const plan = PLANS.find(p => p.name === b.plan && p.name !== 'Free');
      if (!plan) return error('Choose a valid upgrade',400);
      const [id] = await db.add('cogam_subscription_requests', [{userId:user!.userId,email:user!.email||'',plan:plan.name,priceUsd:plan.priceUsd,currency:'USD',billingInterval:'month',reference:clean(b.reference,120),status:'pending',createdAt:new Date().toISOString()}]);
      return json({id,status:'pending',message:'Request received. No payment has been taken or verified.'},201);
    },
  ],
  'GET /api/content/comments/:id': [
    async ({params}) => {const page=await db.list<{contentId:string;moderated:boolean;text:string;author:string;createdAt:string}>('cogam_comments',{limit:200});return json({comments:page.items.filter(c=>c.contentId===params.id && c.moderated).map(c=>({id:c.id,text:c.text,author:c.author,createdAt:c.createdAt}))});}
  ],
  'GET /api/admin/members': [
    ...adminOnly,
    async () => json({ members: (await db.list('cogam_member_directory',{limit:200})).items }),
  ],
  'GET /api/admin/subscriptions': [
    ...adminOnly,
    async () => json({requests:(await db.list('cogam_subscription_requests',{limit:200})).items}),
  ],
  'PUT /api/admin/subscription/:id': [
    ...adminOnly,
    async ({params,body})=>{
      const decision=((body||{}) as {decision?:string}).decision;
      if(decision!=='decline')return error('Paid access can only be activated after a verified Stripe webhook. Billing is not active.',409);
      const [record]=await db.get<{status:string}>('cogam_subscription_requests',[params.id],{consistent:true});
      if(!record)return error('Request not found',404);
      if(record.status!=='pending')return error('Request already reviewed',409);
      const [ok]=await db.tx.update('cogam_subscription_requests',[{id:params.id,record:{status:'declined',reviewedAt:new Date().toISOString()}}],{patch:true});
      return ok?json({status:'declined'}):error('Request was changed',409);
    }
  ],
  'PUT /api/admin/members/:id': [
    ...adminOnly,
    async ({params,body})=>{
      const b=(body||{}) as {suspended?:boolean};
      if(typeof b.suspended!=='boolean')return error('Invalid account status',400);
      const [entry]=await db.get<{userId:string;email:string}>('cogam_member_directory',[params.id],{consistent:true});
      if(!entry)return error('Member not found',404);
      if(ADMIN_EMAILS.includes((entry.email||'').toLowerCase()))return error('Owner cannot be suspended',403);
      const page=await db.list<Member>(userTable(entry.userId),{limit:5});
      if(!page.items[0])return error('Member record missing',404);
      const [ok]=await db.tx.update(userTable(entry.userId),[{id:page.items[0].id,record:{suspended:b.suspended}}],{patch:true});
      if(!ok)return error('Unable to modify member',409);
      await db.tx.update('cogam_member_directory',[{id:params.id,record:{suspended:b.suspended}}],{patch:true});
      return json({updated:true,suspended:b.suspended});
    }
  ],
  'GET /api/admin/approvals': [
    ...adminOnly,
    async () => json({admins:(await db.list('cogam_approved_admins',{limit:100})).items}),
  ],
  'POST /api/admin/approvals': [
    ...adminOnly,
    async ({user,body}) => {
      if(!ADMIN_EMAILS.includes((user?.email||'').toLowerCase()))return error('Only the owner can approve new administrators',403);
      const b=(body||{}) as {email?:string};
      const email=clean(b.email,180).toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return error('Valid email required',400);
      const [id]=await db.add('cogam_approved_admins',[{email,approved:true,approvedBy:user!.email,approvedAt:new Date().toISOString()}]);
      return json({id,approved:true},201);
    },
  ],
  'PUT /api/admin/approvals/:id': [
    ...adminOnly,
    async ({user,params,body})=>{
      if(!ADMIN_EMAILS.includes((user?.email||'').toLowerCase()))return error('Only the owner can change approvals',403);
      const [record]=await db.get<{email:string}>('cogam_approved_admins',[params.id],{consistent:true});
      if(!record)return error('Admin approval not found',404);
      const approved=((body||{}) as {approved?:boolean}).approved===true;
      const [ok]=await db.tx.update('cogam_approved_admins',[{id:params.id,record:{approved}}],{patch:true});
      return ok?json({approved}):error('Approval changed',409);
    }
  ],
  'GET /api/admin/comments': [
    ...adminOnly,
    async () => json({comments:(await db.list('cogam_comments',{limit:200})).items}),
  ],
  'PUT /api/admin/comments/:id': [
    ...adminOnly,
    async ({params,body}) => {
      const [comment]=await db.get<Record<string,unknown>>('cogam_comments',[params.id]);
      if(!comment)return error('Comment not found',404);
      await db.update('cogam_comments',[{id:params.id,record:{...comment,moderated:((body||{}) as {approve?:boolean}).approve===true}}]);
      return json({saved:true});
    },
  ],
  'POST /api/admin/logo': [
    ...adminOnly,
    async ({body})=>{
      const b=(body||{}) as {base64?:string;contentType?:string};
      const type=clean(b.contentType,50), data=clean(b.base64,2000001);
      if(!['image/png','image/jpeg','image/webp'].includes(type)||!data||data.length>2000000||!/^[a-zA-Z0-9+/]+={0,2}$/.test(data))return error('Choose a PNG, JPG or WebP logo below 1.4MB',400);
      const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
      const path='branding/cogam-logo-'+Date.now()+'.'+ext;
      const [ok]=await storage.write([{path,content:data,contentType:type}]);
      if(!ok)return error('Could not upload logo',500);
      const existing=await db.list<Record<string,unknown>>('cogam_site_settings',{limit:5});
      if(existing.items[0])await db.tx.update('cogam_site_settings',[{id:existing.items[0].id,record:{logoPath:path,logoUrl:''}}],{patch:true});
      else await db.add('cogam_site_settings',[{...await getPublicSettings(),logoPath:path,logoUrl:''}]);
      return json({logoUrl:(await storage.url([path]))[0]?.url||'',logoPath:path});
    }
  ],
  'PUT /api/admin/settings': [
    ...adminOnly,
    async ({body}) => {
      const b=(body||{}) as Record<string,unknown>;
      const existing=await db.list<Record<string,unknown>>('cogam_site_settings',{limit:5});
      const allowed=['heading','heroHeading','heroSubtitle','footerText','announcement','primary','accent','logoUrl','youtube','facebook','instagram','tiktok','contactEmail'];
      const next:Record<string,unknown>={...await getPublicSettings()};
      for(const key of allowed) if(key in b){
        const value=['logoUrl','youtube','facebook','instagram','tiktok'].includes(key)?httpsUrl(b[key]):clean(b[key],key==='announcement'?1000:250);
        if(['primary','accent'].includes(key)&&!/^#[a-fA-F0-9]{6}$/.test(value))return error('Colours must be six-digit hex values',400);
        next[key]=value;
        if(key==='logoUrl'&&value)next.logoPath='';
      }
      if(typeof b.logoPath==='string' && b.logoPath.startsWith('branding/')){
        next.logoPath=clean(b.logoPath,450);
        next.logoUrl='';
      }
      if(Array.isArray(b.sections)){
        const permitted=['Home','Browse','Categories','My Library','Everyday Solutions','Teenager','Youths','Kids / Sunday School'];
        next.sections=[...new Set(b.sections.filter((v):v is string=>typeof v==='string'&&permitted.includes(v)))];
      }
      if(existing.items[0]) await db.update('cogam_site_settings',[{id:existing.items[0].id,record:next}]);
      else await db.add('cogam_site_settings',[next]);
      return json({settings:next});
    },
  ],
  'GET /api/admin/me': [
    ...adminOnly,
    async ({ user }) => json({ authorized: true, email: user?.email }),
  ],
  'GET /api/admin/items': [
    ...adminOnly,
    async () => {
      const result = await db.list<MediaItem>(TABLE, { limit: 300 });
      return json({
        items: result.items.sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        ),
      });
    },
  ],
  'POST /api/admin/items': [
    ...adminOnly,
    async ({ body }) => {
      const record = {...normalize(body), access: (body as {access?: string})?.access === 'Premium' ? 'Premium' : 'Free', downloadable: (body as {downloadable?:boolean})?.downloadable === true, audience: clean((body as {audience?:string})?.audience,40) || 'General' };
      if (!record.title) return error('A content title is required.', 400);
      if (record.format !== 'Article' && !record.filePath && !record.mediaUrl) {
        return error('Attach a file or enter an HTTPS content URL.', 400);
      }
      const [id] = await db.add(TABLE, [record]);
      if (!id) return error('Unable to create content.', 500);
      return json({ id, item: { ...record, id } }, 201);
    },
  ],
  'PUT /api/admin/items/:id': [
    ...adminOnly,
    async ({ params, body }) => {
      const [previous] = await db.get<MediaItem>(TABLE, [params.id], {
        consistent: true,
      });
      if (!previous) return error('Content not found.', 404);
      const record = {...normalize(body, previous), access: (body as {access?:string})?.access === 'Premium' ? 'Premium' : 'Free', downloadable: (body as {downloadable?:boolean})?.downloadable === true, audience: clean((body as {audience?:string})?.audience,40) || 'General' };
      if (!record.title) return error('A content title is required.', 400);
      if (record.format !== 'Article' && !record.filePath && !record.mediaUrl) {
        return error('Attach a file or enter an HTTPS content URL.', 400);
      }
      const [ok] = await db.update(TABLE, [{ id: params.id, record }]);
      if (!ok) return error('Unable to update content.', 500);
      return json({ item: { ...record, id: params.id } });
    },
  ],
  'DELETE /api/admin/items/:id': [
    ...adminOnly,
    async ({ params }) => {
      const [previous] = await db.get<MediaItem>(TABLE, [params.id], {
        consistent: true,
      });
      if (!previous) return error('Content not found.', 404);
      const [ok] = await db.delete(TABLE, [params.id]);
      if (!ok) return error('Unable to delete content.', 500);
      if (previous.filePath) {
        try {
          await storage.delete([previous.filePath]);
        } catch (err) {
          console.warn('Orphaned storage cleanup', err);
        }
      }
      return json({ deleted: true });
    },
  ],
  'POST /api/admin/upload': [
    ...adminOnly,
    async ({ body }) => {
      const b = (body || {}) as {
        fileName?: string;
        contentType?: string;
        base64?: string;
      };
      const allowed = [
        'image/png',
        'image/jpeg',
        'application/pdf',
        'application/epub+zip',
        'audio/mpeg',
        'audio/mp4',
        'audio/x-m4a',
        'audio/wav',
        'audio/x-wav',
        'audio/aac',
        'video/mp4',
        'video/webm',
      ];
      const contentType = clean(b.contentType, 80);
      const encoded = clean(b.base64, 6500000);
      if (!allowed.includes(contentType))
        return error('Unsupported file format.', 400);
      if (
        !encoded ||
        encoded.length > 4900000 ||
        !/^[A-Za-z0-9+/=]+$/.test(encoded)
      ) {
        return error(
          'File is too large. Upload files under 3.5 MB or use a hosted HTTPS link.',
          400
        );
      }
      const name =
        clean(b.fileName, 160).replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
      const path =
        'library/' +
        Date.now() +
        '-' +
        Math.random().toString(36).slice(2, 10) +
        '-' +
        name;
      const [ok] = await storage.write([
        { path, content: encoded, contentType },
      ]);
      if (!ok) return error('Unable to upload file.', 500);
      return json({ filePath: path, fileName: name });
    },
  ],
});
