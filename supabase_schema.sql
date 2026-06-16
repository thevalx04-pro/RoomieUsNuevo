-- ============================================================
-- ROOMIEUS — Esquema de base de dades (Supabase / PostgreSQL)
-- Executa aquest SQL a Supabase > SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- USUARIS (extén auth.users de Supabase)
-- Nota: la validación de correo (gmail, hotmail, etc.) se hace en el frontend,
-- aquí no hay restricción de dominio.
-- ──────────────────────────────────────────
create table public.usuaris (
  id           uuid primary key references auth.users(id) on delete cascade,
  nom          text not null,
  correu       text not null unique,
  foto_url     text,
  plan         text not null default 'gratis' check (plan in ('gratis','premium')),
  stripe_customer_id text,
  estat_compte text not null default 'actiu' check (estat_compte in ('actiu','suspès','eliminat')),
  creat_a      timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- PISOS
-- ──────────────────────────────────────────
create table public.pisos (
  id               uuid primary key default uuid_generate_v4(),
  nom              text not null,
  limit_residents  int not null default 5,
  normes           text,
  codi_invitacio   text unique default substr(md5(random()::text), 1, 8),
  creat_a          timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- MEMBRES DEL PIS
-- ──────────────────────────────────────────
create table public.membres_pis (
  id           uuid primary key default uuid_generate_v4(),
  usuari_id    uuid not null references public.usuaris(id) on delete cascade,
  pis_id       uuid not null references public.pisos(id) on delete cascade,
  rol          text not null default 'resident' check (rol in ('administrador','resident')),
  data_entrada timestamptz not null default now(),
  data_sortida timestamptz,
  unique(usuari_id, pis_id)
);

-- ──────────────────────────────────────────
-- INVITACIONS
-- ──────────────────────────────────────────
create table public.invitacions (
  id        uuid primary key default uuid_generate_v4(),
  pis_id    uuid not null references public.pisos(id) on delete cascade,
  correu    text not null,
  estat     text not null default 'pendent' check (estat in ('pendent','acceptada','rebutjada')),
  codi      text unique default substr(md5(random()::text), 1, 12),
  creat_a   timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- TASQUES
-- ──────────────────────────────────────────
create table public.tasques (
  id           uuid primary key default uuid_generate_v4(),
  pis_id       uuid not null references public.pisos(id) on delete cascade,
  nom          text not null,
  descripcio   text,
  frequencia   text not null default 'setmanal' check (frequencia in ('diaria','setmanal','mensual','puntual')),
  estat        text not null default 'pendent' check (estat in ('pendent','completada')),
  data_creacio timestamptz not null default now()
);

-- Assignació de tasques a membres
create table public.assignacions_tasca (
  id               uuid primary key default uuid_generate_v4(),
  tasca_id         uuid not null references public.tasques(id) on delete cascade,
  membre_id        uuid not null references public.membres_pis(id) on delete cascade,
  data_assignacio  timestamptz not null default now(),
  data_completada  timestamptz
);

-- ──────────────────────────────────────────
-- DESPESES
-- ──────────────────────────────────────────
create table public.despeses (
  id            uuid primary key default uuid_generate_v4(),
  pis_id        uuid not null references public.pisos(id) on delete cascade,
  creador_id    uuid not null references public.usuaris(id),
  concepte      text not null,
  import_total  numeric(10,2) not null check (import_total > 0),
  data          date not null default current_date,
  comprovant_url text,
  creat_a       timestamptz not null default now()
);

-- Participació en despeses
create table public.participacions_despesa (
  id              uuid primary key default uuid_generate_v4(),
  despesa_id      uuid not null references public.despeses(id) on delete cascade,
  usuari_id       uuid not null references public.usuaris(id) on delete cascade,
  import          numeric(10,2) not null,
  percentatge     numeric(5,2),
  estat_pagament  text not null default 'pendent' check (estat_pagament in ('pendent','sol·licitat','pagat'))
);

-- ──────────────────────────────────────────
-- MISSATGES (XAT)
-- ──────────────────────────────────────────
create table public.missatges (
  id          uuid primary key default uuid_generate_v4(),
  pis_id      uuid not null references public.pisos(id) on delete cascade,
  autor_id    uuid not null references public.usuaris(id) on delete cascade,
  contingut   text not null,
  fitxer_url  text,
  eliminat    boolean not null default false,
  data_hora   timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- ESDEVENIMENTS (CALENDARI)
-- ──────────────────────────────────────────
create table public.esdeveniments (
  id          uuid primary key default uuid_generate_v4(),
  pis_id      uuid not null references public.pisos(id) on delete cascade,
  creador_id  uuid not null references public.usuaris(id) on delete cascade,
  titol       text not null,
  descripcio  text,
  data        timestamptz not null,
  tipus       text not null default 'visita' check (tipus in ('visita','festa','recordatori','absencia')),
  creat_a     timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- INCIDÈNCIES
-- ──────────────────────────────────────────
create table public.incidencies (
  id           uuid primary key default uuid_generate_v4(),
  pis_id       uuid not null references public.pisos(id) on delete cascade,
  usuari_id    uuid not null references public.usuaris(id) on delete cascade,
  descripcio   text not null,
  estat        text not null default 'pendent' check (estat in ('pendent','en_revisio','resolta')),
  data_creacio timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- NOTIFICACIONS
-- ──────────────────────────────────────────
create table public.notificacions (
  id          uuid primary key default uuid_generate_v4(),
  usuari_id   uuid not null references public.usuaris(id) on delete cascade,
  tipus       text not null,
  missatge    text not null,
  llegida     boolean not null default false,
  data        timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────
alter table public.usuaris enable row level security;
alter table public.pisos enable row level security;
alter table public.membres_pis enable row level security;
alter table public.invitacions enable row level security;
alter table public.tasques enable row level security;
alter table public.assignacions_tasca enable row level security;
alter table public.despeses enable row level security;
alter table public.participacions_despesa enable row level security;
alter table public.missatges enable row level security;
alter table public.esdeveniments enable row level security;
alter table public.incidencies enable row level security;
alter table public.notificacions enable row level security;

-- Políticas bàsiques: cada usuari veu el seu pis
create policy "Usuari veu el seu perfil" on public.usuaris
  for all using (auth.uid() = id);

create policy "Membres veuen el pis" on public.pisos
  for select using (
    id in (select pis_id from public.membres_pis where usuari_id = auth.uid())
  );

create policy "Membres veuen membres del seu pis" on public.membres_pis
  for select using (
    pis_id in (select pis_id from public.membres_pis where usuari_id = auth.uid())
  );

create policy "Membres veuen tasques del pis" on public.tasques
  for all using (
    pis_id in (select pis_id from public.membres_pis where usuari_id = auth.uid())
  );

create policy "Membres veuen despeses del pis" on public.despeses
  for all using (
    pis_id in (select pis_id from public.membres_pis where usuari_id = auth.uid())
  );

create policy "Membres veuen participacions" on public.participacions_despesa
  for all using (
    despesa_id in (
      select id from public.despeses
      where pis_id in (select pis_id from public.membres_pis where usuari_id = auth.uid())
    )
  );

create policy "Membres veuen missatges del pis" on public.missatges
  for all using (
    pis_id in (select pis_id from public.membres_pis where usuari_id = auth.uid())
  );

create policy "Membres veuen esdeveniments" on public.esdeveniments
  for all using (
    pis_id in (select pis_id from public.membres_pis where usuari_id = auth.uid())
  );

create policy "Usuari veu les seves incidències" on public.incidencies
  for all using (usuari_id = auth.uid());

create policy "Usuari veu les seves notificacions" on public.notificacions
  for all using (usuari_id = auth.uid());

-- Trigger: crear usuari a public.usuaris quan es registra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuaris (id, nom, correu)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
