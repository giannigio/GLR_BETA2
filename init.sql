-- Abilita l'estensione UUID se necessaria (opzionale, qui usiamo TEXT per compatibilità col frontend)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELLA CREW MEMBER (Anagrafica Tecnici)
CREATE TABLE IF NOT EXISTS "CrewMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'Interno' o 'Esterno'
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dailyRate" DOUBLE PRECISION DEFAULT 0,
    "phone" TEXT DEFAULT '',
    "email" TEXT,
    "notes" TEXT,
    "monthlyNetCost" DOUBLE PRECISION,
    "monthlyTaxCost" DOUBLE PRECISION,
    -- Campi JSONB per dati complessi (array di oggetti)
    "absences" JSONB DEFAULT '[]',
    "expenses" JSONB DEFAULT '[]',
    "tasks" JSONB DEFAULT '[]',
    "documents" JSONB DEFAULT '[]',
    "financialDocuments" JSONB DEFAULT '[]',
    
    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- 2. TABELLA USER (Autenticazione)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECH', -- 'ADMIN', 'MANAGER', 'TECH'
    "crewMemberId" TEXT,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_crewMemberId_key" ON "User"("crewMemberId");

-- 3. TABELLA JOBS (Schede Lavoro)
CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "internalClient" TEXT,
    "location" TEXT NOT NULL,
    "locationId" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" TEXT NOT NULL, -- 'Bozza', 'Confermato', etc.
    "logisticsStatus" TEXT DEFAULT 'PREPARATION',
    "description" TEXT,
    "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAwayJob" BOOLEAN DEFAULT false,
    "isSubcontracted" BOOLEAN DEFAULT false,
    "subcontractorName" TEXT,
    "outfitNoLogo" BOOLEAN DEFAULT false,
    "outfit" TEXT,
    
    -- Contatti e Logistica
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "hotelName" TEXT,
    "hotelAddress" TEXT,
    "hasPorterage" BOOLEAN DEFAULT false,
    "porterageAgency" TEXT,
    "porterageTime" TEXT,
    
    -- Dati Finanziari
    "invoiceAmount" DOUBLE PRECISION DEFAULT 0,
    "extraCosts" JSONB DEFAULT '[]',
    
    -- Array complessi JSONB
    "phases" JSONB DEFAULT '[]',
    "vehicles" JSONB DEFAULT '[]',
    "materialList" JSONB DEFAULT '[]',
    "assignedCrew" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- 4. TABELLA INVENTORY (Magazzino)
CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT,
    "quantityOwned" INTEGER DEFAULT 0,
    "serialNumber" TEXT,
    "status" TEXT DEFAULT 'Operativo',
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "related" TEXT,
    "accessories" TEXT,
    "correlationType" TEXT,
    
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- 5. TABELLA LOCATION
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "hallSizeMQ" INTEGER DEFAULT 0,
    "mapsLink" TEXT,
    "isZtl" BOOLEAN DEFAULT false,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "accessHours" TEXT,
    "generalSurveyNotes" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Strutture complesse salvate come JSONB
    "power" JSONB DEFAULT '{}',
    "network" JSONB DEFAULT '{}',
    "logistics" JSONB DEFAULT '{}',
    "equipment" JSONB DEFAULT '{}',
    
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- 6. TABELLA RENTALS (Noleggi)
CREATE TABLE IF NOT EXISTS "Rental" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "pickupDate" TEXT NOT NULL,
    "returnDate" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "totalPrice" DOUBLE PRECISION,
    "items" JSONB DEFAULT '[]',
    
    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- 7. TABELLA STANDARD LISTS (Kit Predefiniti)
CREATE TABLE IF NOT EXISTS "StandardMaterialList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'TEMPLATE',
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "items" JSONB DEFAULT '[]',
    
    CONSTRAINT "StandardMaterialList_pkey" PRIMARY KEY ("id")
);

-- 8. TABELLA COST CENTERS (Costi Fissi)
CREATE TABLE IF NOT EXISTS "CostCenter" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "periodicity" TEXT NOT NULL,
    "expiryDate" TEXT,
    "supplier" TEXT,
    "autoRenew" BOOLEAN DEFAULT false,
    "notes" TEXT,
    
    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- 9. TABELLA F24 PAYMENTS
CREATE TABLE IF NOT EXISTS "F24Payment" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "notes" TEXT,
    
    CONSTRAINT "F24Payment_pkey" PRIMARY KEY ("id")
);

-- 10. TABELLA TASKS (Task Generici)
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT,
    "jobId" TEXT,
    "deadline" TEXT,
    "status" TEXT DEFAULT 'PENDING',
    
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- 11. TABELLA APP SETTINGS
CREATE TABLE IF NOT EXISTS "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB DEFAULT '{}',
    
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- --- SEED DATI INIZIALI ---

-- Inserimento Profilo Crew per Admin (se non esiste)
INSERT INTO "CrewMember" ("id", "name", "type", "roles", "phone", "email")
VALUES ('admin-crew-id', 'Amministratore Sistema', 'Interno', ARRAY['Project Manager', 'Admin'], '0000000000', 'admin@glr.it')
ON CONFLICT ("id") DO NOTHING;

-- Inserimento Utente di Login (se non esiste)
-- Password in chiaro: 'password' (In produzione usare hash!)
INSERT INTO "User" ("id", "email", "password", "role", "crewMemberId")
VALUES ('admin-user-id', 'admin@glr.it', 'password', 'ADMIN', 'admin-crew-id')
ON CONFLICT ("email") DO NOTHING;

-- Inserimento Settings Default (opzionale, il backend lo gestisce)
INSERT INTO "AppSettings" ("id", "settings")
VALUES (1, '{
    "companyName": "GLR Productions Srl",
    "crewRoles": ["Project Manager", "Audio Engineer", "Light Operator", "Video Tech", "Rigger", "Facchino"],
    "defaultVatRate": 22,
    "defaultDailyIndemnity": 50,
    "kmCost": 0.5,
    "permissions": {
        "MANAGER": { "canViewBudget": true, "canManageCrew": true, "canManageJobs": true },
        "TECH": { "canViewBudget": false, "canManageCrew": false, "canManageJobs": false }
    }
}')
ON CONFLICT ("id") DO NOTHING;