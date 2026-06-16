# RoomieUs — Guía de puesta en marcha

## 1. Configurar Supabase (base de datos gratuita)

1. Ve a https://supabase.com → "Start your project" → regístrate
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y pega el contenido de `supabase_schema.sql`
4. Haz clic en **Run**
5. Ve a **Project Settings > API Keys** y copia:
   - **Project URL** (ej: `https://abcde12345.supabase.co`)
   - **anon public key**

## 2. Arreglar el envío de correos (verificación, recuperación de contraseña)

Por defecto, Supabase usa un servidor de correo de pruebas limitado a 3 emails/hora.
Para producción real, conecta Resend (gratis hasta 3.000 emails/mes):

1. Crea cuenta en https://resend.com
2. Verifica tu dominio (o usa el dominio de pruebas de Resend al principio)
3. Genera una API Key en Resend
4. En Supabase: **Project Settings > Auth > SMTP Settings**
5. Activa "Enable Custom SMTP" y rellena:
   - Host: `smtp.resend.com`
   - Puerto: `465`
   - Usuario: `resend`
   - Contraseña: tu API Key de Resend
   - Sender email: el correo de tu dominio verificado

## 3. Configurar el proyecto localmente

```bash
cd roomieus
npm install
cp .env.example .env
# Edita .env con tu URL y clave de Supabase
npm start
```

## 4. Desplegar a Vercel

1. Sube la carpeta a un repositorio de GitHub
2. En https://vercel.com: **Add New Project** → importa el repositorio
3. Añade las variables de entorno:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Asegúrate de que `vercel.json` está en la raíz (ya incluido)
5. **Deploy**

## Estructura del proyecto

```
roomieus/
├── public/index.html
├── src/
│   ├── lib/supabase.js
│   ├── context/
│   │   ├── AuthContext.js       ← autenticación (acepta cualquier correo válido)
│   │   └── PisContext.js
│   ├── components/AppShell.js
│   ├── pages/
│   │   ├── Landing.js           ← página de presentación pública
│   │   ├── Landing.css
│   │   ├── auth/
│   │   │   ├── Login.js
│   │   │   ├── Registro.js
│   │   │   └── RecuperarContrasena.js
│   │   └── dashboard/
│   │       ├── Inicio.js
│   │       ├── Tareas.js
│   │       ├── Gastos.js
│   │       ├── Chat.js          ← tiempo real con Supabase Realtime
│   │       ├── Calendario.js
│   │       ├── Miembros.js
│   │       ├── Soporte.js
│   │       └── ConfigPiso.js
│   ├── App.js                   ← rutas: "/" es la landing, "/app" es el dashboard
│   ├── index.js
│   └── index.css
├── supabase_schema.sql
├── vercel.json
├── .env.example
└── package.json
```

## Rutas de la app

- `/` → Landing page pública
- `/login` → Iniciar sesión
- `/registro` → Crear cuenta
- `/app` → Dashboard (requiere login)
- `/app/tareas`, `/app/gastos`, `/app/chat`, `/app/calendario`, `/app/miembros`, `/app/soporte`, `/app/configuracion`

## Próximos pasos para monetizar (pendiente de implementar)

1. **Stripe Checkout** — añadir botón de pago en la landing y página de planes dentro de la app
2. **Webhook de Stripe** — función serverless que actualice `usuaris.plan` a `'premium'` cuando se confirme el pago
3. **Límites por plan** — bloquear creación de más de 1 piso o más de 4 miembros en plan gratis
4. **Dominio propio** — comprar `roomieus.es` o similar y conectarlo en Vercel

## Coste actual

- Supabase Free Tier: gratis hasta 50.000 usuarios
- Vercel Hobby: gratis
- Resend: gratis hasta 3.000 emails/mes
- Dominio propio (opcional): ~10€/año
