import {
  router,
  json,
  error,
  db,
  storage,
  requireAuth,
  requireAdminEmailAllowlist,
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
  createdAt: string;
  updatedAt: string;
};

const TABLE = 'cogam_library_content';
const ADMIN_EMAILS = ['stevewesh14@gmail.com'];
const adminOnly = [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS)];

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
      const paths = published
        .filter(item => item.filePath)
        .map(item => item.filePath);
      const signed = paths.length ? await storage.url(paths) : [];
      const byPath = new Map(signed.map(entry => [entry.path, entry.url]));
      const items = published.map(item => ({
        ...item,
        assetUrl: item.filePath
          ? byPath.get(item.filePath) || ''
          : item.mediaUrl,
        filePath: undefined,
      }));
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return json({ items });
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
      const record = normalize(body);
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
      const record = normalize(body, previous);
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
