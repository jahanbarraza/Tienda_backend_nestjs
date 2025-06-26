# Guía de Instalación - StampOut POS Backend

## Requisitos del Sistema

### Software Requerido

- **Node.js** 18.0.0 o superior
- **npm** 8.0.0 o superior (incluido con Node.js)
- **PostgreSQL** 12.0 o superior
- **Git** (para clonar el repositorio)

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version
# Debe mostrar v18.0.0 o superior

# Verificar npm
npm --version
# Debe mostrar 8.0.0 o superior

# Verificar PostgreSQL
psql --version
# Debe mostrar PostgreSQL 12 o superior

# Verificar Git
git --version
```

## Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/stampout-pos-backend.git
cd stampout-pos-backend
```

### 2. Instalar Dependencias

```bash
npm install
```

Este comando instalará todas las dependencias necesarias:
- NestJS framework
- PostgreSQL driver (pg)
- JWT y Passport para autenticación
- bcryptjs para hashing de contraseñas
- class-validator para validaciones
- Y otras dependencias del proyecto

### 3. Configurar Base de Datos PostgreSQL

#### 3.1 Crear Base de Datos

Conectarse a PostgreSQL como superusuario:

```bash
# En Linux/Mac
sudo -u postgres psql

# En Windows (desde Command Prompt como administrador)
psql -U postgres
```

Crear la base de datos:

```sql
CREATE DATABASE stampout_pos;
CREATE USER stampout_user WITH PASSWORD 'stampout_password';
GRANT ALL PRIVILEGES ON DATABASE stampout_pos TO stampout_user;
\q
```

#### 3.2 Verificar Conexión

```bash
psql -h localhost -U stampout_user -d stampout_pos
```

### 4. Configurar Variables de Entorno

#### 4.1 Copiar Archivo de Ejemplo

```bash
cp .env.example .env
```

#### 4.2 Editar Configuración

Abrir el archivo `.env` y configurar las variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=stampout_user
DB_PASSWORD=stampout_password
DB_NAME=stampout_pos

# JWT Configuration
JWT_SECRET=tu-clave-secreta-muy-segura-cambiar-en-produccion
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

**⚠️ Importante:** Cambiar `JWT_SECRET` por una clave segura en producción.

### 5. Compilar la Aplicación

```bash
npm run build
```

### 6. Ejecutar la Aplicación

#### Modo Desarrollo (con hot reload)

```bash
npm run start:dev
```

#### Modo Producción

```bash
npm run start:prod
```

### 7. Verificar Instalación

#### 7.1 Verificar Estado del Servidor

Abrir navegador en: http://localhost:3000/api/health

Debe mostrar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "StampOut POS Backend",
  "version": "1.0.0"
}
```

#### 7.2 Probar Autenticación

**Login con usuario por defecto:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Debe retornar un token JWT y datos del usuario.

## Configuración Avanzada

### Configuración de Producción

#### Variables de Entorno para Producción

```env
NODE_ENV=production
PORT=3000
DB_HOST=tu-servidor-db.com
DB_PORT=5432
DB_USERNAME=usuario_produccion
DB_PASSWORD=contraseña_muy_segura
DB_NAME=stampout_pos_prod
JWT_SECRET=clave-jwt-super-secreta-de-al-menos-32-caracteres
JWT_EXPIRES_IN=8h
CORS_ORIGIN=https://tu-frontend.com
```

#### Configuración de SSL para PostgreSQL

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Configuración de Proxy Reverso (Nginx)

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Configuración con PM2 (Process Manager)

#### Instalar PM2

```bash
npm install -g pm2
```

#### Crear archivo ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'stampout-pos-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Ejecutar con PM2

```bash
# Compilar
npm run build

# Crear directorio de logs
mkdir logs

# Iniciar con PM2
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

## Configuración de Base de Datos

### Backup de Base de Datos

```bash
# Crear backup
pg_dump -h localhost -U stampout_user stampout_pos > backup.sql

# Restaurar backup
psql -h localhost -U stampout_user stampout_pos < backup.sql
```

### Configuración de Pool de Conexiones

En `src/database/services/database.service.ts`:

```typescript
this.pool = new Pool({
  host: this.configService.get('database.host'),
  port: this.configService.get('database.port'),
  user: this.configService.get('database.username'),
  password: this.configService.get('database.password'),
  database: this.configService.get('database.name'),
  max: 20,                    // Máximo de conexiones
  idleTimeoutMillis: 30000,   // Tiempo de inactividad
  connectionTimeoutMillis: 2000, // Timeout de conexión
});
```

## Solución de Problemas

### Error: "Cannot connect to database"

**Posibles causas:**
1. PostgreSQL no está ejecutándose
2. Credenciales incorrectas en `.env`
3. Base de datos no existe
4. Firewall bloqueando conexión

**Soluciones:**
```bash
# Verificar estado de PostgreSQL
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Verificar conexión manual
psql -h localhost -U stampout_user -d stampout_pos
```

### Error: "Port 3000 already in use"

**Solución:**
```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Terminar proceso
kill -9 <PID>

# O cambiar puerto en .env
PORT=3001
```

### Error: "JWT secret not configured"

**Solución:**
Verificar que `JWT_SECRET` esté configurado en `.env`:
```env
JWT_SECRET=tu-clave-secreta-aqui
```

### Error de Compilación TypeScript

**Solución:**
```bash
# Limpiar cache
npm run build --clean

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run start:dev

# Compilar proyecto
npm run build

# Ejecutar en producción
npm run start:prod

# Ejecutar tests
npm run test

# Tests end-to-end
npm run test:e2e

# Linting
npm run lint

# Formatear código
npm run format

# Generar hash de contraseña
node scripts/generate-password-hash.js
```

## Logs y Monitoreo

### Ubicación de Logs

- **Desarrollo:** Consola
- **Producción:** `./logs/` (con PM2)

### Niveles de Log

- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `debug` - Información de depuración

### Monitoreo con PM2

```bash
# Ver logs en tiempo real
pm2 logs

# Ver estado de procesos
pm2 status

# Reiniciar aplicación
pm2 restart stampout-pos-backend

# Detener aplicación
pm2 stop stampout-pos-backend
```

## Seguridad

### Checklist de Seguridad

- [ ] Cambiar `JWT_SECRET` por valor seguro
- [ ] Usar HTTPS en producción
- [ ] Configurar CORS apropiadamente
- [ ] Usar contraseñas seguras para base de datos
- [ ] Configurar firewall
- [ ] Mantener dependencias actualizadas
- [ ] Configurar rate limiting
- [ ] Implementar logs de auditoría

### Actualizar Dependencias

```bash
# Verificar vulnerabilidades
npm audit

# Corregir vulnerabilidades automáticamente
npm audit fix

# Actualizar dependencias
npm update
```

## Soporte

Para soporte técnico o reportar problemas:

1. Revisar esta guía de instalación
2. Consultar la documentación del módulo
3. Verificar logs de error
4. Crear issue en el repositorio de GitHub

## Próximos Pasos

Una vez completada la instalación del módulo de autenticación:

1. **Gestión de Organización** - Implementar CRUD de compañías y tiendas
2. **Gestión de Personas** - Implementar CRUD de personas, usuarios y roles
3. **Gestión de Productos** - Implementar CRUD de productos y categorías
4. **Punto de Venta** - Implementar funcionalidades de ventas
5. **Inventario** - Implementar gestión de inventario
6. **Reportería** - Implementar reportes y cierres

Cada módulo se construirá sobre la base de autenticación establecida en esta instalación.

