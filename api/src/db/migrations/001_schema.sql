-- Multi-tenant schema. Every business table carries tenant_id.
CREATE TABLE tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text NOT NULL,
  currency    text NOT NULL DEFAULT 'MAD',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'agent', 'courier');
CREATE TYPE order_status AS ENUM ('new', 'confirmed', 'shipped', 'delivered', 'refused', 'returned');

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          text NOT NULL,
  password_hash  text NOT NULL,
  full_name      text NOT NULL,
  role           user_role NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

-- Which role may do what; editable per tenant by its owner.
CREATE TABLE role_permissions (
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  permission  text NOT NULL,
  PRIMARY KEY (tenant_id, role, permission)
);

CREATE TABLE orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference             text NOT NULL,
  customer_name         text NOT NULL,
  phone                 text NOT NULL,
  city                  text NOT NULL,
  address               text NOT NULL,
  total_cents           integer NOT NULL CHECK (total_cents >= 0),
  currency              text NOT NULL,
  status                order_status NOT NULL DEFAULT 'new',
  courier_id            uuid REFERENCES users(id),
  cash_collected_cents  integer CHECK (cash_collected_cents >= 0),
  created_by            uuid REFERENCES users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, reference)
);
CREATE INDEX orders_tenant_status_idx ON orders (tenant_id, status, created_at DESC);
CREATE INDEX orders_tenant_courier_idx ON orders (tenant_id, courier_id);

CREATE TABLE order_events (
  id           bigserial PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  order_status,
  to_status    order_status NOT NULL,
  actor_id     uuid REFERENCES users(id),
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events (order_id, created_at);
