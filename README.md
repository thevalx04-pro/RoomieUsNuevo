# RoomieUs — Guia de posada en marxa

## 1. Configurar Supabase (base de dades gratuïta)

1. Ves a https://supabase.com → "Start your project" → registra't
2. Crea un nou projecte (dona-li el nom "roomieus")
3. Un cop creat, ves a **SQL Editor** i pega tot el contingut de `supabase_schema.sql`
4. Fes clic a **Run** — crearà totes les taules, polítiques de seguretat i el trigger d'usuaris
5. Ves a **Project Settings > API** i copia:
   - **Project URL** (ex: `https://abcde12345.supabase.co`)
   - **anon public key** (clau llarga que comença per `eyJ...`)
6. A Supabase, ves a **Authentication > URL Configuration** i posa:
   - Site URL: `https://roomieus.vercel.app` (o el teu domini)

## 2. Configurar el projecte localment

```bash
# Clona o copia la carpeta roomieus/
cd roomieus
npm install

# Crea el fitxer d'entorn
cp .env.example .env
# Edita .env i posa la teva URL i clau de Supabase

npm start  # Obre http://localhost:3000
```

## 3. Desplegar a Vercel (gratis)

1. Ves a https://vercel.com → registra't amb GitHub
2. Puja la carpeta `roomieus/` a un repositori de GitHub
3. A Vercel: **Add New Project** → importa el repositori
4. A **Environment Variables** afegeix:
   - `REACT_APP_SUPABASE_URL` = la teva URL
   - `REACT_APP_SUPABASE_ANON_KEY` = la teva clau
5. Fes clic a **Deploy** → en 2 minuts tens la URL pública

## Estructura del projecte

```
roomieus/
├── public/
│   └── index.html
├── src/
│   ├── lib/
│   │   └── supabase.js          ← client Supabase
│   ├── context/
│   │   ├── AuthContext.js       ← autenticació global
│   │   └── PisContext.js        ← estat del pis actiu
│   ├── components/
│   │   └── AppShell.js          ← layout amb sidebar
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.js
│   │   │   ├── Registre.js
│   │   │   └── RecuperarContrasenya.js
│   │   └── dashboard/
│   │       ├── Inici.js
│   │       ├── Tasques.js
│   │       ├── Despeses.js
│   │       ├── Xat.js           ← temps real amb Supabase Realtime
│   │       ├── Calendari.js
│   │       ├── Membres.js
│   │       ├── Suport.js
│   │       └── ConfigPis.js
│   ├── App.js                   ← routing principal
│   ├── index.js
│   └── index.css
├── supabase_schema.sql          ← copia i pega a Supabase
├── .env.example                 ← plantilla de variables d'entorn
└── package.json
```

## Funcionament bàsic

1. L'usuari es registra amb correu @id.uib.eu
2. Confirma el correu (Supabase envia l'email automàticament)
3. Inicia sessió → si no té pis, pot crear-ne un o unir-se amb codi
4. El creador del pis es converteix en administrador automàticament
5. L'administrador convida membres per correu o codi

## Cost

- **Supabase Free Tier**: fins a 50.000 usuaris, 500MB base de dades, 2GB de fitxers — gratuït
- **Vercel Hobby**: hosting gratuït, dominis `.vercel.app` gratuïts
- **Domini propi** (opcional): ~10€/any a Namecheap o Cloudflare

## Per llançar-la "de debò" (passos addicionals)

1. **Domini**: Compra `roomieus.es` (~10€/any) i connecta'l a Vercel
2. **Email transaccional**: Configura Supabase amb SendGrid o Resend per enviar emails de verificació personalitzats
3. **PWA**: Afegeix un manifest.json per instal·lar-la al mòbil com a app nativa
4. **Analytics**: Afegeix Plausible o Vercel Analytics per veure l'ús
5. **Legal**: Crea una política de privacitat i termes d'ús (obligatori a la UE)
