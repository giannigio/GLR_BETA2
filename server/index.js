
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// --- DEFAULT SETTINGS (SINGLE SOURCE OF TRUTH) ---
const DEFAULT_SETTINGS = {
    companyName: 'GLR Productions Srl',
    pIva: 'IT1234567890',
    address: 'Via Roma 1, 00100 Roma RM',
    bankName: 'Banca Credito Esempio',
    iban: 'IT60X0542811101000000123456',
    logoUrl: '',
    defaultDailyIndemnity: 50,
    kmCost: 0.5,
    defaultVatRate: 22,
    googleCalendarClientId: '',
    googleCalendarClientSecret: '',
    googleCalendarId: '',
    crewRoles: ['Project Manager', 'Audio Engineer', 'Light Operator', 'Video Tech', 'Rigger', 'Facchino'],
    permissions: {
        ADMIN: {
            canViewDashboard: true, canViewJobs: true, canViewTasks: true, canViewKits: true, canViewRentals: true, canViewInventory: true, canViewLocations: true, canViewCrew: true, canViewExpenses: true, canViewCompany: true,
            canManageJobs: true, canDeleteJobs: true, canViewBudget: true, canManageCrew: true, canManageExpenses: true, canManageInventory: true, canManageLocations: true, canManageRentals: true,
        },
        MANAGER: {
            canViewDashboard: true, canViewJobs: true, canViewTasks: true, canViewKits: true, canViewRentals: true, canViewInventory: true, canViewLocations: true, canViewCrew: true, canViewExpenses: true, canViewCompany: true,
            canManageJobs: true, canDeleteJobs: false, canViewBudget: true, canManageCrew: true, canManageExpenses: true, canManageInventory: true, canManageLocations: true, canManageRentals: true,
        },
        TECH: {
            canViewDashboard: true, canViewJobs: true, canViewTasks: true, canViewKits: true, canViewRentals: true, canViewInventory: true, canViewLocations: true, canViewCrew: true, canViewExpenses: true, canViewCompany: false,
            canManageJobs: false, canDeleteJobs: false, canViewBudget: false, canManageCrew: false, canManageExpenses: false, canManageInventory: false, canManageLocations: false, canManageRentals: false
        }
    }
};


// --- SEEDING INITIAL DATA ---
async function seedInitialData() {
    try {
        // 1. Seed Admin User
        const adminUserExists = await prisma.user.findUnique({
            where: { email: 'admin@glr.it' }
        });

        if (!adminUserExists) {
            console.log('Seeding default admin user...');
            
            const crewMember = await prisma.crewMember.create({
                data: {
                    id: 'admin-crew-id',
                    name: 'Amministratore',
                    type: 'Interno',
                    roles: ['Project Manager'],
                    email: 'admin@glr.it',
                    phone: '0000000000',
                }
            });

            await prisma.user.create({
                data: {
                    id: 'admin-user-id',
                    email: 'admin@glr.it',
                    password: 'password', // IN PRODUCTION: Hash this!
                    role: 'ADMIN',
                    crewMemberId: crewMember.id
                }
            });
            console.log('Default admin created: admin@glr.it / password');
        }

        // 2. Seed App Settings
        const settingsExist = await prisma.appSettings.findFirst();
        if (!settingsExist) {
            console.log('Seeding default app settings...');
            await prisma.appSettings.create({
                data: {
                    id: 1,
                    settings: DEFAULT_SETTINGS
                }
            });
            console.log('Default settings seeded.');
        }

    } catch (e) {
        console.error('Error during initial seeding:', e);
    }
}

// Run seed on server start
seedInitialData();

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
            const responseUser = {
                id: user.crewMember?.id || user.id, // Prefer crew ID for consistency
                name: user.crewMember?.name || user.email,
                role: user.role
            };

            res.json({
                success: true,
                user: responseUser,
                token: 'mock-jwt-token-for-session' 
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

// --- GENERIC CRUD HANDLERS ---
const createCrud = (model) => ({
    getAll: async (req, res) => {
        try {
            const items = await prisma[model].findMany();
            res.json(items);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    create: async (req, res) => {
        try {
            const item = await prisma[model].create({ data: req.body });
            res.json(item);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    update: async (req, res) => {
        try {
            const item = await prisma[model].update({ where: { id: req.params.id }, data: req.body });
            res.json(item);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    delete: async (req, res) => {
        try {
            await prisma[model].delete({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }
});

// --- JOBS ---
const jobsCrud = createCrud('job');
app.get('/api/jobs', jobsCrud.getAll);
app.post('/api/jobs', jobsCrud.create);
app.put('/api/jobs/:id', jobsCrud.update);
app.delete('/api/jobs/:id', jobsCrud.delete);

// --- CREW ---
app.get('/api/crew', async (req, res) => {
  try {
    const crew = await prisma.crewMember.findMany({ include: { user: true } });
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
    const crew = await prisma.crewMember.create({ data: crewData });
    if (crewData.type === 'Interno' && email && password) {
        await prisma.user.create({
            data: { email, password, role: accessRole || 'TECH', crewMemberId: crew.id }
        });
    }
    res.json({ ...crew, email, password, accessRole });
  } catch (e) { res.status(500).json(e); }
});

app.put('/api/crew/:id', async (req, res) => {
  try {
    const { id, email, password, accessRole, ...crewData } = req.body;
    const crew = await prisma.crewMember.update({ where: { id: req.params.id }, data: crewData });
    if (crewData.type === 'Interno') {
        const user = await prisma.user.findUnique({ where: { crewMemberId: id } });
        if (user) {
            await prisma.user.update({ where: { crewMemberId: id }, data: { email, password, role: accessRole } });
        } else if (email && password) {
            await prisma.user.create({ data: { email, password, role: accessRole || 'TECH', crewMemberId: id } });
        }
    }
    res.json({ ...crew, email, password, accessRole });
  } catch (e) { res.status(500).json(e); }
});

// --- LOCATIONS ---
const locCrud = createCrud('location');
app.get('/api/locations', locCrud.getAll);
app.post('/api/locations', locCrud.create);
app.put('/api/locations/:id', locCrud.update);
app.delete('/api/locations/:id', locCrud.delete);

// --- INVENTORY ---
const invCrud = createCrud('inventoryItem');
app.get('/api/inventory', invCrud.getAll);
app.post('/api/inventory', invCrud.create);
app.put('/api/inventory/:id', invCrud.update);
app.delete('/api/inventory/:id', invCrud.delete);

// --- STANDARD LISTS (KITS) ---
const stdCrud = createCrud('standardMaterialList');
app.get('/api/standard-lists', stdCrud.getAll);
app.post('/api/standard-lists', stdCrud.create);
app.put('/api/standard-lists/:id', stdCrud.update);
app.delete('/api/standard-lists/:id', stdCrud.delete);

// --- RENTALS ---
const rentCrud = createCrud('rental');
app.get('/api/rentals', rentCrud.getAll);
app.post('/api/rentals', rentCrud.create);
app.put('/api/rentals/:id', rentCrud.update);
app.delete('/api/rentals/:id', rentCrud.delete);

// --- COST CENTERS ---
const costCrud = createCrud('costCenter');
app.get('/api/cost-centers', costCrud.getAll);
app.post('/api/cost-centers', costCrud.create);
app.put('/api/cost-centers/:id', costCrud.update);
app.delete('/api/cost-centers/:id', costCrud.delete);

// --- F24 PAYMENTS ---
const f24Crud = createCrud('f24Payment');
app.get('/api/f24-payments', f24Crud.getAll);
app.post('/api/f24-payments', f24Crud.create);
app.delete('/api/f24-payments/:id', f24Crud.delete);

// --- TASKS ---
const taskCrud = createCrud('task');
app.get('/api/tasks', taskCrud.getAll);
app.post('/api/tasks', taskCrud.create);
app.put('/api/tasks/:id', taskCrud.update);
app.delete('/api/tasks/:id', taskCrud.delete);

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
    try {
        const config = await prisma.appSettings.findFirst();
        if (config && config.settings) {
            res.json(config.settings);
        } else {
            // Fallback in case seeding failed or DB was wiped without server restart
            res.json(DEFAULT_SETTINGS); 
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

// --- NOTIFICATIONS (Mock for now, easy to extend) ---
app.get('/api/notifications', (req, res) => {
    res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
