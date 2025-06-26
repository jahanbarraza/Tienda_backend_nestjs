# StampOut POS Backend

Backend del sistema de punto de venta StampOut POS construido con NestJS, PostgreSQL y consultas SQL puras.

## Características

- ✅ Autenticación JWT
- ✅ Arquitectura modular
- ✅ Consultas SQL puras (sin ORM)
- ✅ Validaciones y sanitización
- ✅ Middleware de autenticación
- ✅ Migraciones automáticas
- ✅ CORS configurado
- ✅ Variables de entorno

## Requisitos

- Node.js 18+
- PostgreSQL 12+
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd stampout-pos-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=stampout_pos

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

4. Crear la base de datos PostgreSQL:
```sql
CREATE DATABASE stampout_pos;
```

5. Ejecutar la aplicación:
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Estructura del Proyecto

```
src/
├── auth/                 # Módulo de autenticación
│   ├── controllers/      # Controladores
│   ├── services/         # Servicios
│   ├── guards/           # Guards y estrategias
│   ├── dto/              # Data Transfer Objects
│   └── interfaces/       # Interfaces TypeScript
├── database/             # Módulo de base de datos
│   └── services/         # Servicios de DB y migraciones
├── config/               # Configuración
├── common/               # Utilidades compartidas
│   └── decorators/       # Decoradores personalizados
└── main.ts              # Punto de entrada
```

## API Endpoints

### Autenticación

#### POST /api/auth/login
Iniciar sesión con usuario y contraseña.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@stampoutpos.com",
    "person": {
      "firstName": "Admin",
      "lastName": "Sistema"
    },
    "company": {
      "id": "uuid",
      "name": "StampOut POS Demo"
    },
    "role": {
      "id": "uuid",
      "name": "Super Admin",
      "permissions": {"all": true}
    }
  }
}
```

#### GET /api/auth/profile
Obtener perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

#### GET /api/auth/validate
Validar token de acceso.

#### POST /api/auth/logout
Cerrar sesión.

### Salud del Sistema

#### GET /api/health
Verificar estado del sistema.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "StampOut POS Backend",
  "version": "1.0.0"
}
```

## Usuario por Defecto

El sistema incluye un usuario administrador por defecto:

- **Usuario:** admin
- **Contraseña:** admin123
- **Email:** admin@stampoutpos.com

## Base de Datos

### Tablas Principales

- `identification_types` - Tipos de identificación
- `companies` - Compañías
- `stores` - Tiendas
- `roles` - Roles de usuario
- `persons` - Personas
- `users` - Usuarios del sistema
- `user_sessions` - Sesiones de usuario

### Migraciones

Las migraciones se ejecutan automáticamente al iniciar la aplicación. Los archivos están en:
- `database/migrations/001_create_auth_tables.sql`
- `database/migrations/002_insert_initial_data.sql`

## Desarrollo

### Comandos Disponibles

```bash
# Desarrollo con hot reload
npm run start:dev

# Construcción
npm run build

# Producción
npm run start:prod

# Linting
npm run lint

# Formateo
npm run format

# Pruebas
npm run test
npm run test:e2e
```

### Generar Hash de Contraseña

```bash
node scripts/generate-password-hash.js
```

## Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Validación de entrada con class-validator
- Sanitización automática
- CORS configurado
- Guards de autenticación

## Próximos Módulos

1. Gestión de Organización (Compañías y Tiendas)
2. Gestión de Personas (Personas, Usuarios, Roles)
3. Gestión de Productos (Productos, Categorías, Impuestos)
4. Gestión de Ventas (POS, Reportes)
5. Gestión de Inventario (Entradas, Salidas, Ajustes)
6. Reportería (Cierres diarios)

## Licencia

MIT

