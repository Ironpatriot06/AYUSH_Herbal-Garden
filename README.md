# 🌿 Ayush Herbal Garden — Traditional Ayurvedic Medicine Reference

Ayush Herbal Garden is a modern web platform built with **Next.js, TypeScript, TailwindCSS, and Supabase**.  
It provides a structured way to explore Ayurvedic plants, their **medicinal properties, preparations, and scientific references** — with an **admin dashboard** for secure content management.

---

## ✨ Features

- 🌱 **Browse Plant Catalog** — Explore all plants with search & filter.  
- 📖 **Detailed Plant Pages** — Properties, uses, dosage, precautions.  
- 🧪 **Preparations & References** — Linked methods and citations.  
- 🔐 **Authentication** — Supabase Auth with Google sign-in.  
- 🛡️ **Row-Level Security** — Only admin can insert/update plants.  
- 🧑‍💻 **Admin Dashboard** — Add plants, view chat logs, manage entries.  
- 🖼️ **Image Support** — Plant images stored in Supabase Storage.  

---

## ⚙️ Tech Stack

- **Frontend:** Next.js (React, TypeScript, App Router)  
- **Styling:** TailwindCSS + shadcn/ui components  
- **Icons:** lucide-react  
- **Auth & Database:** Supabase (Postgres + RLS + OAuth)  
- **Deployment:** Vercel (recommended)
  

---

## 📂 Project Structure
```
ayush-herbal-garden/
├── app/
│ ├── plants/ # Plant catalog
│ │ ├── [id]/ # Plant detail page
│ │ └── new/ # Add plant form (admin only)
│ ├── admin/ # Admin dashboard
│ │ └── logs/ # Chat logs (admin only)
│ └── api/ # API routes
├── components/ # Reusable UI components
├── lib/ # Supabase client + types
├── public/ # Static assets (logos, images)
├── .env.local # Environment variables
├── package.json
└── README.md
```

---

## 🚀 Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ayush-herbal-garden.git
cd ayush-herbal-garden
```

2. Install dependencies
```bash
# pick one
npm install
# or
yarn install
# or
pnpm install
```

3. Create `.env.local` with your Supabase keys & api keys:
```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# (server-only if you use it; not required for client-only flows)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# optional: set your site url if you need it
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_API_KEY=<you_key>
EOF
```
Make sure .env is gitignored (default for Next.js).

4. Run the dev server
```bash
pnpm run dev
# or
yarn dev
# or
npm run dev
```
Open http://localhost:3000

🗄️ Database (SQL you can paste in Supabase)
1) Base schema
```
-- Plants table
create table if not exists public.plants (
  id bigint generated always as identity primary key,
  common_name text,
  scientific_name text,
  family text,
  description text,
  parts_used text[],
  medicinal_properties text[],
  ailments text[],
  dosage text,
  contraindications text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Optional: preparations
create table if not exists public.preparations (
  id bigserial primary key,
  plant_id bigint references public.plants(id) on delete cascade,
  name text,
  method text,
  notes text,
  created_at timestamptz default now()
);

-- Optional: references
create table if not exists public.references (
  id bigserial primary key,
  plant_id bigint references public.plants(id) on delete cascade,
  title text,
  authors text,
  journal text,
  year int,
  doi text,
  url text,
  created_at timestamptz default now()
);

-- Optional: logs (for /admin/logs)
create table if not exists public.logs (
  id bigserial primary key,
  user_id uuid,
  question text,
  answer text,
  meta jsonb,
  created_at timestamptz default now()
);
```

2) Enable RLS + policies
```
-- Enable RLS
alter table public.plants enable row level security;
alter table public.preparations enable row level security;
alter table public.references enable row level security;
alter table public.logs enable row level security;

-- SELECT policies (public read for plants; tweak if you want auth-only)
create policy plants_select_public
on public.plants for select
to anon, authenticated
using (true);

-- Admin-only INSERT on plants (use your admin UUID)
drop policy if exists plants_insert_admin_uid on public.plants;
create policy plants_insert_admin_uid
on public.plants for insert
to authenticated
with check (auth.uid() = 'YOUR-ADMIN-UUID-HERE');

-- Let everyone signed-in read related tables (adjust as needed)
create policy preparations_select_all
on public.preparations for select
to anon, authenticated
using (true);

create policy references_select_all
on public.references for select
to anon, authenticated
using (true);

-- Logs: admin read, any authed can insert (adjust if needed)
create policy logs_select_admin
on public.logs for select
to authenticated
using (auth.jwt()->>'email' = 'your-admin@email.com');

create policy logs_insert_authed
on public.logs for insert
to authenticated
with check (true);
```


🧭 Useful package scripts
```bash
# dev
npm run dev

# type-check
npm run type-check

# build for production
npm run build

# run production build locally
npm start
```

---

🔐 Auth notes
```
Use Supabase Authentication → URL Configuration to set:

Site URL: http://localhost:3000 (dev) and your Vercel URL (prod)

Add the same to Redirect URLs

For Google OAuth, configure the provider with the same callback URL.
```

---

🧑‍💻 Admin routes (built in)
```
/plants/new — create a plant (RLS: admin-only insert)
/admin — dashboard
/admin/logs — chat logs (create logs table + policies above)
```
---

## 🤝 Contributing

Contributions are welcome — open an issue first for big changes. Please follow the standard PR workflow.

---

## 📜 License

MIT © 2025 RatishKapoor|Ironpatriot06



