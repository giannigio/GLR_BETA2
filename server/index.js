
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- SEEDING DEFAULT ADMIN ---
async function seedDefaultAdmin() {
    try {
        const adminExists = await prisma.crewMember.findFirst({
            where: { 
               user: { email: 'admin@glr.it' }
            }
        });

        const adminUserExists = await prisma.user.findUnique({
            where: { email: 'admin@glr.it' }
        });

        if (!adminUserExists) {
            console.log('Seeding default admin user...');
            
            // 1. Create Crew Member Profile
            const crewMember = await prisma.crewMember.create({
                data: {
                    name: 'Amministratore',
                    type: 'Interno',
                    roles: ['PROJECT_MGR'],
                    dailyRate: 0,
                    phone: '0000000000'
                }
            });

            // 2. Create User Login Linked
            await prisma.user.create({
                data: {
                    email: 'admin@glr.it',
                    password: 'password', // IN PRODUCTION: Hash this!
                    role: 'ADMIN',
                    crewMemberId: crewMember.id
                }
            });
            console.log('Default admin created: admin@glr.it / password');
        }
    } catch (e) {
        console.error('Error seeding admin:', e);
    }
}

// Run seed on start
seedDefaultAdmin();

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: { crewMember: true }
        });

        if (user && user.password === password) {
            // Structure response to match frontend expectations
            const crewData = user.crewMember;
            const userData = {
                ...crewData,
                email: user.email,
                accessRole: user.role
            };

            res.json({
                success: true,
                user: userData,
                token: 'mock-jwt-token-12345' 
            });
        } else {
            res.status(401).json({ success: false, message: 'Credenziali non valide' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- JOBS ---
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({ orderBy: { startDate: 'desc' } });
    res.json(jobs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const job = await prisma.job.create({ data: req.body });
    res.json(job);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const job = await prisma.job.update({ where: { id: req.params.id }, data });
    res.json(job);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CREW ---
app.get('/api/crew', async (req, res) => {
  try {
    // Join with User table to get email/role
    const crew = await prisma.crewMember.findMany({
        include: { user: true }
    });
    // Flatten for frontend
    const flatCrew = crew.map(c => ({
        ...c,
        email: c.user?.email,
        password: c.user?.password,
        accessRole: c.user?.role
    }));
    res.json(flatCrew);
  } catch (e) { res.status(500).json(e); }
});

app.post('/api/crew', async (req, res) => {
  try {
    const { email, password, accessRole, ...crewData } = req.body;
    
    // 1. Create Crew Member
    const crew = await prisma.crewMember.create({ data: crewData });

    // 2. If internal, create User
    if (crewData.type === 'Interno' && email && password) {
        await prisma.user.create({
            data: {
                email,
                password,
                role: accessRole || 'TECH',
                crewMemberId: crew.id
            }
        });
    }
    
    // Return unified object
    res.json({ ...crew, email, password, accessRole });
  } catch (e) { res.status(500).json(e); }
});

app.put('/api/crew/:id', async (req, res) => {
  try {
    const { id, email, password, accessRole, ...crewData } = req.body;
    
    // 1. Update Crew
    const crew = await prisma.crewMember.update({ where: { id: req.params.id }, data: crewData });

    // 2. Update User if exists, or create
    if (crewData.type === 'Interno') {
        const user = await prisma.user.findUnique({ where: { crewMemberId: id } });
        if (user) {
            await prisma.user.update({
                where: { crewMemberId: id },
                data: { email, password, role: accessRole }
            });
        } else if (email && password) {
            await prisma.user.create({
                data: { email, password, role: accessRole || 'TECH', crewMemberId: id }
            });
        }
    }

    res.json({ ...crew, email, password, accessRole });
  } catch (e) { res.status(500).json(e); }
});

// --- LOCATIONS ---
app.get('/api/locations', async (req, res) => {
  try {
    const locs = await prisma.location.findMany();
    res.json(locs);
  } catch (e) { res.status(500).json(e); }
});

app.post('/api/locations', async (req, res) => {
  try {
    const loc = await prisma.location.create({ data: req.body });
    res.json(loc);
  } catch (e) { res.status(500).json(e); }
});

app.put('/api/locations/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const loc = await prisma.location.update({ where: { id: req.params.id }, data });
    res.json(loc);
  } catch (e) { res.status(500).json(e); }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json(e); }
});

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany();
    res.json(items);
  } catch (e) { res.status(500).json(e); }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const item = await prisma.inventoryItem.create({ data: req.body });
    res.json(item);
  } catch (e) { res.status(500).json(e); }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const item = await prisma.inventoryItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (e) { res.status(500).json(e); }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json(e); }
});

// --- STANDARD LISTS (KITS) ---
app.get('/api/standard-lists', async (req, res) => {
  try {
    const lists = await prisma.standardMaterialList.findMany();
    res.json(lists);
  } catch (e) { res.status(500).json(e); }
});

app.post('/api/standard-lists', async (req, res) => {
  try {
    const list = await prisma.standardMaterialList.create({ data: req.body });
    res.json(list);
  } catch (e) { res.status(500).json(e); }
});

app.put('/api/standard-lists/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const list = await prisma.standardMaterialList.update({ where: { id: req.params.id }, data });
    res.json(list);
  } catch (e) { res.status(500).json(e); }
});

app.delete('/api/standard-lists/:id', async (req, res) => {
  try {
    await prisma.standardMaterialList.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json(e); }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
    try {
        const config = await prisma.appSettings.findFirst();
        if (config) {
            res.json(config.settings);
        } else {
            res.json({ companyName: 'GLR Productions' }); 
        }
    } catch (e) { res.status(500).json(e); }
});

app.put('/api/settings', async (req, res) => {
    try {
        const config = await prisma.appSettings.upsert({
            where: { id: 1 },
            update: { settings: req.body },
            create: { id: 1, settings: req.body }
        });
        res.json(config.settings);
    } catch (e) { res.status(500).json(e); }
});

// --- NOTIFICATIONS (Mock for now) ---
app.get('/api/notifications', (req, res) => {
    res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
