import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';

type Env = {
  Bindings: {
    DB: D1Database;
    STORAGE: R2Bucket;
    ASSETS: Fetcher;
    JWT_SECRET: string;
    TURNSTILE_SITE_KEY: string;
    R2_PUBLIC_DOMAIN: string;
    R2_BUCKET_NAME: string;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
  };
  Variables: {
    user: { id: string; role: string; name: string; email?: string; canManageArtists?: boolean };
  };
};

const app = new Hono<Env>();

const authMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, 'token');
  console.log('[authMiddleware] Token from cookie:', token ? 'Present' : 'Missing');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    const userId = (payload as any).id;
    
    console.log('[authMiddleware] Verifying user ID:', userId);

    const dbUserRaw = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();
    const dbUser = dbUserRaw as any;

    if (!dbUser?.id) {
      console.log('[authMiddleware] User not found in DB for ID:', userId);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isAdmin = dbUser.role === 'Owner' || dbUser.role === 'Employee' || dbUser.role === 'admin';

    c.set('user', {
      id: String(dbUser.id),
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email ?? undefined,
      canManageArtists: isAdmin,
    });
    await next();
  } catch (err: any) {
    console.error('[authMiddleware] JWT Error:', err.message);
    return c.json({ error: 'Forbidden' }, 403);
  }
};

// Helper to fetch label info for a user
const getLabelForUser = async (db: D1Database, userId: string, email?: string) => {
  try {
    const label = await db.prepare(`
      SELECT * FROM labels 
      WHERE CAST(owner_id AS TEXT) = CAST(? AS TEXT)
      OR (LOWER(owner_id) = LOWER(?) AND ? IS NOT NULL)
    `)
      .bind(userId, email || null, email || null)
      .first<any>();
    return label;
  } catch (err) {
    console.error('[getLabelForUser] Error:', err);
    return null;
  }
};

app.get('/api/health', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT count(*) as count FROM users').first<{ count: number }>();
    return c.json({ status: 'ok', users: result?.count ?? 0, database: 'connected' });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

app.post('/api/login', async (c) => {
  const requestId = crypto.randomUUID();

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { success: false, message: 'Invalid request body', requestId },
      400
    );
  }

  const email = body?.username; // Frontend sends "username" field, but we treat it as email
  const password = body?.password;

  if (!email || !password) {
    return c.json(
      { success: false, message: 'Email and password are required', requestId },
      400
    );
  }

  const identifierRaw = String(email).trim();
  const passwordRaw = String(password).trim();

  let user: any = null;

  try {
    // 🔥 Strictly query by email and use password_hash
    user = await c.env.DB.prepare(`
      SELECT * FROM users 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
    `)
      .bind(identifierRaw)
      .first<any>();
  } catch (err: any) {
    console.error('[login] DB Error:', err.message);
    return c.json(
      { success: false, message: 'Database error', requestId },
      500
    );
  }

  if (!user) {
    return c.json({ success: false, message: 'Invalid email or password', requestId }, 401);
  }

  // 🔥 Strictly use password_hash column
  const storedPassword = String(user.password_hash || '').trim();
  
  if (storedPassword !== passwordRaw) {
    return c.json(
      { success: false, message: 'Invalid email or password', requestId },
      401
    );
  }

  // Generate JWT
  const token = await sign(
    {
      id: user.id, // Use raw ID (could be Number or String)
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 86400, // 1 day
    },
    c.env.JWT_SECRET
  );

  // Set secure cookie
  const url = new URL(c.req.url);
  const isHttps = url.protocol === 'https:';

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'None' : 'Lax',
    path: '/',
    maxAge: 86400,
  });

  return c.json({
    success: true,
    requestId,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      currency: user.currency || 'USD',
      canManageArtists: user.role === 'Owner' || user.role === 'Employee',
    },
  });
});

app.post('/api/logout', (c) => {
  deleteCookie(c, 'token', { path: '/' });
  return c.json({ success: true });
});

app.use('/api/*', authMiddleware);

app.get('/api/me', async (c) => {
  const user = c.get('user');
  try {
    const result = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(user.id)
      .first<any>();
      
    if (!result?.id) return c.json({ error: 'Unauthorized' }, 401);
    
    const label = await getLabelForUser(c.env.DB, user.id, result.email);

    return c.json({
      id: result.id,
      email: result.email,
      role: result.role,
      name: result.name,
      currency: result.currency || 'USD',
      canManageArtists: result.role === 'Owner' || result.role === 'Employee' || result.role === 'admin',
      revenueShare: label?.revenue_share ?? 0
    });
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get('/api/admin/stats', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  try {
    // Get monthly royalties for the last 6 months
    const royaltiesRaw = await c.env.DB.prepare(`
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
      FROM royalties
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all<any>();

    // Get monthly withdrawals
    const withdrawalsRaw = await c.env.DB.prepare(`
      SELECT strftime('%Y-%m', request_date) as month, SUM(amount) as total
      FROM withdrawals
      WHERE status = 'approved'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all<any>();

    return c.json({
      royalties: royaltiesRaw.results || [],
      withdrawals: withdrawalsRaw.results || []
    });
  } catch (err: any) {
    return c.json({ royalties: [], withdrawals: [] });
  }
});

app.get('/api/admin/clients', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, name, email FROM users WHERE role = 'Label Admin'"
    ).all<any>();
    return c.json(results || []);
  } catch (err: any) {
    return c.json([]);
  }
});

app.get('/api/admin/labels', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  
  if (!isAdmin) {
    console.log('[admin/labels] Forbidden: Role is', user.role);
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const stmt = c.env.DB.prepare("SELECT id, name, owner_id, revenue_share FROM labels");
    const { results } = await stmt.all<any>();
    
    console.log('[admin/labels] Query successful. Count:', results?.length);
    
    if (!results || results.length === 0) {
      console.log('[admin/labels] Warning: No labels found in database.');
    }

    return c.json(results || []);
  } catch (err: any) {
    console.error('[admin/labels] Database Error:', err.message);
    return c.json({ error: 'Database error', message: err.message }, 500);
  }
});

app.post('/api/admin/royalties', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  const { user_id, amount, date, description, source } = await c.req.json();
  await c.env.DB.prepare(
    'INSERT INTO royalties (user_id, amount, date, description, source) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(user_id, amount, date, description, source)
    .run();
  return c.json({ success: true });
});

app.get('/api/admin/withdrawals', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM withdrawals
    ORDER BY request_date DESC
  `).all<any>();
  return c.json(results || []);
});

app.post('/api/admin/withdrawals/:id', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  const { status } = await c.req.json();
  const id = c.req.param('id');
  
  try {
    // 1. Update withdrawal status
    await c.env.DB.prepare('UPDATE withdrawals SET status = ?, processed_date = ? WHERE id = ?')
      .bind(status, new Date().toISOString().split('T')[0], id)
      .run();

    // 2. Notify client
    const withdrawal = await c.env.DB.prepare('SELECT user_id, amount FROM withdrawals WHERE id = ?')
      .bind(id)
      .first<any>();

    if (withdrawal) {
      await c.env.DB.prepare(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)'
      )
        .bind(
          String(withdrawal.user_id), 
          `Your withdrawal request for $${withdrawal.amount} has been ${status}.`, 
          'withdrawal'
        )
        .run();
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/admin/withdrawals/:id', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  const id = c.req.param('id');
  try {
    await c.env.DB.prepare('DELETE FROM withdrawals WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/admin/royalties/bulk', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  const { royalties } = await c.req.json();

  try {
    const statements = royalties.map((item: any) =>
      c.env.DB.prepare(
        'INSERT INTO royalties (user_id, amount, date, description, source) VALUES (?, ?, ?, ?, ?)'
      ).bind(item.user_id, item.amount, item.date, item.description, item.source)
    );
    await c.env.DB.batch(statements);
    return c.json({ success: true, count: royalties.length });
  } catch {
    return c.json({ success: false, message: 'Failed to upload royalties' }, 500);
  }
});

app.get('/api/client/royalties', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM royalties WHERE user_id = ? ORDER BY date DESC'
  )
    .bind(user.id)
    .all<any>();
  return c.json(results || []);
});

app.get('/api/client/withdrawals', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY request_date DESC'
  )
    .bind(user.id)
    .all<any>();
  return c.json(results || []);
});

app.post('/api/client/withdrawals', async (c) => {
  const user = c.get('user');
  const { amount } = await c.req.json();
  
  if (!amount || amount <= 0) {
    return c.json({ success: false, message: 'Invalid withdrawal amount' }, 400);
  }

  try {
    await c.env.DB.prepare(
      'INSERT INTO withdrawals (user_id, amount, request_date, status) VALUES (?, ?, CURRENT_TIMESTAMP, ?)'
    )
      .bind(user.id, amount, 'pending')
      .run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/client/stats', async (c) => {
  const user = c.get('user');
  console.log('[client/stats] Fetching stats for user:', user.id, user.email);

  try {
    const label = await getLabelForUser(c.env.DB, user.id, user.email);
    
    console.log('[client/stats] Label found:', label ? `Yes (${label.name})` : 'No');
    const sharePercent = label?.revenue_share ?? 0;

    // 2. Get Gross Revenue (Sum of all royalty reports total_revenue)
    const grossResult = await c.env.DB.prepare(
      'SELECT SUM(total_revenue) as total_gross FROM royalty_reports WHERE user_id = ? OR user_id = ?'
    )
      .bind(user.id, Number(user.id))
      .first<{ total_gross: number | null }>();
    
    const totalGross = grossResult?.total_gross ?? 0;

    // 3. Calculate Net Revenue
    const totalNet = totalGross * (sharePercent / 100);
    const totalDeductions = totalGross - totalNet;

    // 4. Get Total Withdrawn (Approved only)
    const withdrawn = await c.env.DB.prepare(
      "SELECT SUM(amount) as total_withdrawn FROM withdrawals WHERE user_id = ? AND status = 'approved'"
    )
      .bind(user.id)
      .first<{ total_withdrawn: number | null }>();
    
    const totalWithdrawn = withdrawn?.total_withdrawn ?? 0;

    // 5. Get Pending Withdrawals
    const pending = await c.env.DB.prepare(
      "SELECT SUM(amount) as pending_withdrawal FROM withdrawals WHERE user_id = ? AND status = 'pending'"
    )
      .bind(user.id)
      .first<{ pending_withdrawal: number | null }>();
    
    const pendingAmount = pending?.pending_withdrawal ?? 0;

    // 6. Calculate Available Balance
    // Formula: Sum of all Net Revenue - Sum of all Withdrawals (Approved + Pending)
    const balance = totalNet - totalWithdrawn - pendingAmount;

    return c.json({ 
      totalGross, 
      totalNet, 
      totalWithdrawn, 
      pendingAmount, 
      balance,
      sharePercent,
      totalDeductions,
      labelName: label?.name || 'Unknown Label'
    });
  } catch (error: any) {
    console.error('[client/stats] Error:', error.message);
    return c.json({ success: false, message: error.message }, 500);
  }
});

app.post('/api/client/settings', async (c) => {
  const user = c.get('user');
  const { currency } = await c.req.json();
  await c.env.DB.prepare('UPDATE users SET currency = ? WHERE id = ?')
    .bind(currency, user.id)
    .run();
  return c.json({ success: true });
});

app.post('/api/admin/reports/upload', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  try {
    const formData = await c.req.parseBody();
    const file = formData['file'] as File;
    const metadataStr = formData['metadata'] as string;
    const royaltyDataStr = formData['royalty_data'] as string;

    if (!file || !metadataStr) {
      return c.json({ success: false, message: 'Missing file or metadata' }, 400);
    }

    const metadata = JSON.parse(metadataStr);
    const royaltyData = royaltyDataStr ? JSON.parse(royaltyDataStr) : [];

    // 1. Upload file to R2
    const fileKey = `reports/${metadata.client_id}/${Date.now()}_${file.name}`;
    await c.env.STORAGE.put(fileKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    // 2. Insert into royalty_reports
    const reportResult = await c.env.DB.prepare(
      'INSERT INTO royalty_reports (user_id, start_date, end_date, file_url, filename, total_revenue) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(
        metadata.client_id ?? null, 
        metadata.start_date ?? '', 
        metadata.end_date ?? '', 
        fileKey ?? '', 
        file.name ?? 'report.xlsx',
        metadata.total_revenue ?? 0
      )
      .run();

    // 4. Create Notification for Client
    try {
      // Ensure notifications table exists before inserting
      await c.env.DB.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT,
          is_read INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const monthName = new Date(metadata.start_date).toLocaleDateString('en-US', { month: 'long' });
      await c.env.DB.prepare(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)'
      )
        .bind(String(metadata.client_id), `Present month (${monthName}) revenue added.`, 'revenue')
        .run();
      console.log('[admin/reports] Created notification for user:', metadata.client_id);
    } catch (notifErr: any) {
      console.warn('[admin/reports] Notification creation failed:', notifErr.message);
    }

    // 3. Insert royalty data into royalties table (if provided)
    if (royaltyData.length > 0) {
      const statements = royaltyData
        .filter((item: any) => item.amount !== undefined && item.date !== undefined)
        .map((item: any) =>
          c.env.DB.prepare(
            'INSERT INTO royalties (user_id, amount, date, description, source) VALUES (?, ?, ?, ?, ?)'
          ).bind(
            metadata.client_id ?? null, 
            item.amount ?? 0, 
            item.date ?? '', 
            item.description || 'Monthly Report', 
            item.source || 'Excel Upload'
          )
        );
      
      if (statements.length > 0) {
        await c.env.DB.batch(statements);
      }
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Report upload error:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/client/reports', async (c) => {
  const user = c.get('user');
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM royalty_reports WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(user.id)
      .all<any>();
    return c.json(results || []);
  } catch (err: any) {
    return c.json([]);
  }
});

app.get('/api/client/chart-data', async (c) => {
  const user = c.get('user');
  const view = c.req.query('view') || 'monthly';

  try {
    // 1. Fetch real data first to determine the range
    const { results } = await c.env.DB.prepare(`
      SELECT strftime('%Y-%m', start_date) as month, SUM(total_revenue) as revenue
      FROM royalty_reports
      WHERE CAST(user_id AS TEXT) = CAST(? AS TEXT)
      GROUP BY month
      ORDER BY month ASC
    `)
      .bind(user.id)
      .all<any>();
    
    const realData = results || [];

    if (view === 'yearly') {
      // Generate last 12 months leading up to the LATEST report or NOW
      const now = new Date();
      const latestReportDate = realData.length > 0 ? new Date(realData[realData.length - 1].month + '-01') : now;
      const endDate = latestReportDate > now ? latestReportDate : now;

      const last12Months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const monthKey = d.toISOString().slice(0, 7);
        last12Months.push({
          key: monthKey,
          date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: 0
        });
      }

      const merged = last12Months.map(m => {
        const real = realData.find((r: any) => r.month === m.key);
        return {
          date: m.date,
          revenue: real ? real.revenue : 0
        };
      });
      return c.json(merged);
    } else {
      // Monthly view: Show past 3 months leading up to the LATEST report or NOW
      const now = new Date();
      const latestReportDate = realData.length > 0 ? new Date(realData[realData.length - 1].month + '-01') : now;
      const endDate = latestReportDate > now ? latestReportDate : now;

      const last4Months = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const monthKey = d.toISOString().slice(0, 7);
        last4Months.push({
          key: monthKey,
          date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: 0
        });
      }

      const merged = last4Months.map(m => {
        const real = realData.find((r: any) => r.month === m.key);
        return {
          date: m.date,
          revenue: real ? real.revenue : 0
        };
      });
      return c.json(merged);
    }
  } catch (err: any) {
    return c.json([]);
  }
});

app.get('/api/client/reports/:id/download', async (c) => {
  const user = c.get('user');
  const reportId = c.req.param('id');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';

  try {
    let report;
    if (isAdmin) {
      // Admins can download any report
      report = await c.env.DB.prepare('SELECT * FROM royalty_reports WHERE id = ?')
        .bind(reportId)
        .first<any>();
    } else {
      // Clients can only download their own reports
      report = await c.env.DB.prepare('SELECT * FROM royalty_reports WHERE id = ? AND user_id = ?')
        .bind(reportId, user.id)
        .first<any>();
    }

    if (!report) return c.text('Report not found', 404);

    const object = await c.env.STORAGE.get(report.file_url);
    if (!object) return c.text('File not found', 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Content-Disposition', `attachment; filename="${report.filename}"`);

    return new Response(object.body, { headers });
  } catch (err: any) {
    return c.text('Error downloading file', 500);
  }
});

app.get('/api/admin/reports', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, u.name as client_name, u.email as client_email
      FROM royalty_reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `).all<any>();
    return c.json(results || []);
  } catch (err: any) {
    return c.json([]);
  }
});

app.delete('/api/admin/reports/:id', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  const id = c.req.param('id');
  console.log('[admin/reports] Attempting to delete report ID:', id);

  try {
    // 1. Get report info
    const report = await c.env.DB.prepare('SELECT * FROM royalty_reports WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!report) {
      console.log('[admin/reports] Report not found:', id);
      return c.json({ success: false, message: 'Report not found' }, 404);
    }

    // 2. Delete from R2 (Optional - don't fail if file is already gone)
    if (report.file_url) {
      try {
        console.log('[admin/reports] Deleting file from R2:', report.file_url);
        await c.env.STORAGE.delete(report.file_url);
      } catch (r2Err: any) {
        console.warn('[admin/reports] R2 Delete Warning:', r2Err.message);
      }
    }

    // 3. Delete associated royalties
    try {
      await c.env.DB.prepare(`
        DELETE FROM royalties 
        WHERE user_id = ? 
        AND date >= ? 
        AND date <= ?
        AND description = 'Monthly Report'
      `)
        .bind(report.user_id, report.start_date, report.end_date)
        .run();
    } catch (royErr: any) {
      console.warn('[admin/reports] Royalties Delete Warning:', royErr.message);
    }

    // 4. Delete from DB
    await c.env.DB.prepare('DELETE FROM royalty_reports WHERE id = ?').bind(id).run();

    console.log('[admin/reports] Successfully deleted report:', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[admin/reports] Critical Delete Error:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/admin/reports/:id', async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'Owner' || user.role === 'Employee' || user.role === 'admin';
  if (!isAdmin) return c.json({ error: 'Forbidden' }, 403);

  const id = c.req.param('id');
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: 'Invalid JSON' }, 400);
  }

  const { user_id, start_date, end_date, total_revenue } = body;

  try {
    await c.env.DB.prepare(
      'UPDATE royalty_reports SET user_id = ?, start_date = ?, end_date = ?, total_revenue = ? WHERE id = ?'
    )
      .bind(
        user_id ?? null, 
        start_date ?? '', 
        end_date ?? '', 
        total_revenue ?? 0, 
        id
      )
      .run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('[admin/reports] Update Error:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/client/notifications', async (c) => {
  const user = c.get('user');
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM notifications 
      WHERE CAST(user_id AS TEXT) = CAST(? AS TEXT)
      ORDER BY created_at DESC LIMIT 10
    `)
      .bind(user.id)
      .all<any>();
    return c.json(results || []);
  } catch (err: any) {
    console.error('[client/notifications] Error:', err.message);
    // Self-healing: Create table if missing
    if (err.message.includes('no such table: notifications')) {
      try {
        await c.env.DB.exec(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            type TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);
        console.log('[client/notifications] Created notifications table');
      } catch (createErr: any) {
        console.error('[client/notifications] Table creation failed:', createErr.message);
      }
    }
    return c.json([]);
  }
});

app.post('/api/client/notifications/read', async (c) => {
  const user = c.get('user');
  try {
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
      .bind(user.id)
      .run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false });
  }
});

app.get('*', async (c) => {
  try {
    const url = new URL(c.req.url);
    url.pathname = '/index.html';
    return c.env.ASSETS.fetch(new Request(url.toString()));
  } catch {
    return c.text('Not Found', 404);
  }
});

export default app;
