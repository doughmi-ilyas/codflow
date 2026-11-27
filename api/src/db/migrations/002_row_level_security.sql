-- The application connects as the table owner but runs every tenant request
-- under this restricted role (SET LOCAL ROLE app_user), so policies apply.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END $$;
GRANT app_user TO CURRENT_USER;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT ON tenants TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, role_permissions, orders, order_events TO app_user;
GRANT USAGE, SELECT ON SEQUENCE order_events_id_seq TO app_user;

-- Current tenant, or NULL when unset (NULL matches no row: deny by default).
CREATE FUNCTION app_tenant() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            FORCE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE orders           FORCE ROW LEVEL SECURITY;
ALTER TABLE order_events     FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users            USING (tenant_id = app_tenant()) WITH CHECK (tenant_id = app_tenant());
CREATE POLICY tenant_isolation ON role_permissions USING (tenant_id = app_tenant()) WITH CHECK (tenant_id = app_tenant());
CREATE POLICY tenant_isolation ON orders           USING (tenant_id = app_tenant()) WITH CHECK (tenant_id = app_tenant());
CREATE POLICY tenant_isolation ON order_events     USING (tenant_id = app_tenant()) WITH CHECK (tenant_id = app_tenant());
