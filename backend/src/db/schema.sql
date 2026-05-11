-- RistoBrain + MenuMaster — Schema PostgreSQL v1.0
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    locale          TEXT NOT NULL DEFAULT 'it',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- WORKSPACES
CREATE TABLE IF NOT EXISTS workspaces (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    plan            TEXT NOT NULL DEFAULT 'free',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- WORKSPACE USERS
CREATE TABLE IF NOT EXISTS workspace_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'viewer',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

-- LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    address         TEXT,
    city            TEXT,
    seats           INT,
    cuisine_type    TEXT,
    target_fc_default NUMERIC(5,2) DEFAULT 30.00,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    contact_name    TEXT,
    phone           TEXT,
    email           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- INGREDIENT CATEGORIES
CREATE TABLE IF NOT EXISTS ingredient_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    UNIQUE (workspace_id, name)
);

-- INGREDIENTS
CREATE TABLE IF NOT EXISTS ingredients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES ingredient_categories(id),
    code            TEXT,
    name            TEXT NOT NULL,
    brand           TEXT,
    purchase_unit   TEXT NOT NULL DEFAULT 'kg',
    recipe_unit     TEXT NOT NULL DEFAULT 'g',
    conversion_factor NUMERIC(12,6) NOT NULL DEFAULT 1000,
    waste_pct       NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    yield_pct       NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    allergens       TEXT[] DEFAULT '{}',
    primary_supplier_id UUID REFERENCES suppliers(id),
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- INGREDIENT PRICES (storico)
CREATE TABLE IF NOT EXISTS ingredient_prices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    supplier_id     UUID REFERENCES suppliers(id),
    price_per_purchase_unit NUMERIC(12,4) NOT NULL,
    valid_from      DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to        DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id)
);

-- RECIPE CATEGORIES
CREATE TABLE IF NOT EXISTS recipe_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    target_fc_pct   NUMERIC(5,2),
    sort_order      INT NOT NULL DEFAULT 0,
    UNIQUE (workspace_id, name)
);

-- RECIPES
CREATE TABLE IF NOT EXISTS recipes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    location_id     UUID REFERENCES locations(id),
    category_id     UUID REFERENCES recipe_categories(id),
    name            TEXT NOT NULL,
    description     TEXT,
    version         INT NOT NULL DEFAULT 1,
    parent_id       UUID REFERENCES recipes(id),
    yield_portions  NUMERIC(8,2) NOT NULL DEFAULT 1,
    portion_size_g  NUMERIC(8,2),
    prep_time_min   INT,
    cook_time_min   INT,
    tags            TEXT[] DEFAULT '{}',
    notes           TEXT,
    photo_url       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id)
);

-- RECIPE ITEMS (BOM)
CREATE TABLE IF NOT EXISTS recipe_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id   UUID REFERENCES ingredients(id),
    sub_recipe_id   UUID REFERENCES recipes(id),
    quantity        NUMERIC(12,4) NOT NULL,
    unit            TEXT NOT NULL,
    item_type       TEXT NOT NULL DEFAULT 'primary',
    waste_pct_override  NUMERIC(5,2),
    yield_pct_override  NUMERIC(5,2),
    sort_order      INT NOT NULL DEFAULT 0,
    notes           TEXT
);

-- MENU CATEGORIES
CREATE TABLE IF NOT EXISTS menu_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    location_id     UUID REFERENCES locations(id),
    name            TEXT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    target_fc_pct   NUMERIC(5,2),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- MENUS
CREATE TABLE IF NOT EXISTS menus (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    is_current      BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id         UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES menu_categories(id),
    recipe_id       UUID REFERENCES recipes(id),
    name            TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',
    tags            TEXT[] DEFAULT '{}',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SALES PERIODS
CREATE TABLE IF NOT EXISTS sales_periods (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    period_from     DATE NOT NULL,
    period_to       DATE NOT NULL,
    source          TEXT NOT NULL DEFAULT 'manual',
    total_covers    INT,
    total_revenue   NUMERIC(12,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id)
);

-- SALES LINES
CREATE TABLE IF NOT EXISTS sales_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_period_id UUID NOT NULL REFERENCES sales_periods(id) ON DELETE CASCADE,
    menu_item_id    UUID REFERENCES menu_items(id),
    item_name       TEXT NOT NULL,
    qty_sold        INT NOT NULL DEFAULT 0,
    unit_price      NUMERIC(10,2),
    total_revenue   NUMERIC(12,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL,
    user_id         UUID REFERENCES users(id),
    action          TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ingredients_workspace ON ingredients (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_workspace ON recipes (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_menu ON menu_items (menu_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_current ON ingredient_prices (ingredient_id) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_lines_period ON sales_lines (sales_period_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_workspace ON audit_log (workspace_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$ DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','workspaces','locations','suppliers','ingredients','recipes','menus','menu_items']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl, tbl);
  END LOOP;
END; $$;
