# StampOut POS Backend

Backend del sistema de punto de venta (POS) StampOut construido con NestJS, PostgreSQL y consultas SQL puras.

## 🚀 Características

- ✅ **Autenticación JWT** - Sistema de login seguro con tokens
- ✅ **Gestión de Organización** - CRUD completo para compañías y tiendas
- ✅ **Control de Acceso** - Autorización basada en roles
- ✅ **Consultas SQL Puras** - Sin ORM, máximo control sobre la base de datos
- ✅ **Validaciones Robustas** - Validación en múltiples capas
- ✅ **Arquitectura Modular** - Código organizado y escalable
- ✅ **Documentación Completa** - API y módulos documentados
- ✅ **Pruebas Automatizadas** - Scripts de testing incluidos

## 📋 Módulos Implementados

### 1. Módulo de Autenticación ✅
- Login con usuario y contraseña
- Generación de tokens JWT
- Middleware de autenticación
- Protección de rutas

### 2. Módulo de Gestión de Organización ✅
- **Compañías**: CRUD completo con filtros y paginación
- **Tiendas**: CRUD completo asociado a compañías
- Control de acceso por roles
- Validaciones de integridad

### 3. Próximos Módulos 🔄
- Gestión de Personas (usuarios, roles, tipos de identificación)
- Gestión de Productos (productos, categorías, impuestos)
- Gestión de Ventas (punto de venta, reportes)
- Gestión de Inventario (entradas, salidas, ajustes)
- Reportería (cierre diario, reportes avanzados)

## 🛠️ Tecnologías

- **Framework**: NestJS 10.x
- **Base de Datos**: PostgreSQL 14+
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer
- **Lenguaje**: TypeScript
- **Consultas**: SQL puro (sin ORM)

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/jahanbarraza/Tienda_backend_nestjs.git
cd Tienda_backend_nestjs
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**
```bash
# Crear base de datos
createdb stampout_pos

# Ejecutar migraciones
psql -d stampout_pos -f database/migrations/001_create_auth_tables.sql
psql -d stampout_pos -f database/migrations/002_insert_initial_data.sql
```

5. **Iniciar la aplicación**
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 🔧 Configuración

### Variables de Entorno

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=stampout_pos

# JWT
JWT_SECRET=tu-jwt-secret-muy-seguro
JWT_EXPIRES_IN=24h

# API
API_PREFIX=api
API_VERSION=1.0.0
```

### Base de Datos

La aplicación utiliza PostgreSQL con las siguientes tablas principales:

- `companies` - Compañías del sistema
- `stores` - Tiendas asociadas a compañías
- `users` - Usuarios del sistema
- `persons` - Información personal de usuarios
- `roles` - Roles y permisos
- `identification_types` - Tipos de identificación

## 🔐 Autenticación

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Usuario por Defecto

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Super Admin

### Uso del Token

```bash
Authorization: Bearer <tu-jwt-token>
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario
- `POST /api/auth/refresh` - Renovar token

### Compañías
- `GET /api/companies` - Listar compañías
- `GET /api/companies/:id` - Obtener compañía
- `POST /api/companies` - Crear compañía (Solo Super Admin)
- `PATCH /api/companies/:id` - Actualizar compañía
- `DELETE /api/companies/:id` - Eliminar compañía (Solo Super Admin)

### Tiendas
- `GET /api/stores` - Listar tiendas
- `GET /api/stores/:id` - Obtener tienda
- `POST /api/stores` - Crear tienda
- `PATCH /api/stores/:id` - Actualizar tienda
- `DELETE /api/stores/:id` - Eliminar tienda

### Salud del Sistema
- `GET /api/health` - Estado del servidor

## 🧪 Pruebas

### Ejecutar Pruebas Automatizadas

```bash
# Pruebas del módulo de autenticación
node scripts/test-auth-endpoints.js

# Pruebas del módulo de organización
node scripts/test-organization-endpoints.js
```

### Pruebas Manuales con cURL

```bash
# Login
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  http://localhost:3000/api/auth/login

# Listar compañías
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/companies

# Crear tienda
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Mi Tienda",
    "code": "TIENDA01",
    "address": "Calle 123"
  }' \
  http://localhost:3000/api/stores
```

## 📖 Documentación

- [Guía de Instalación](docs/INSTALLATION_GUIDE.md)
- [Documentación de API](docs/API_DOCUMENTATION.md)
- [Módulo de Autenticación](docs/AUTHENTICATION_MODULE.md)
- [Módulo de Organización](docs/ORGANIZATION_MODULE.md)

## 🏗️ Arquitectura

```
src/
├── auth/                    # Módulo de autenticación
│   ├── controllers/         # Controladores de auth
│   ├── services/           # Servicios de auth
│   ├── guards/             # Guards JWT
│   ├── dto/                # DTOs de auth
│   └── interfaces/         # Interfaces de auth
├── organization/           # Módulo de organización
│   ├── companies/          # Submódulo de compañías
│   ├── stores/             # Submódulo de tiendas
│   └── common/             # DTOs comunes
├── database/               # Servicios de base de datos
│   └── services/           # Conexión y consultas
├── common/                 # Utilidades comunes
│   ├── decorators/         # Decoradores personalizados
│   ├── filters/            # Filtros de excepción
│   └── pipes/              # Pipes de validación
└── config/                 # Configuración de la app
```

## 🔒 Seguridad

### Control de Acceso

- **Super Admin**: Acceso completo a todas las funcionalidades
- **Admin/Manager**: Acceso limitado a su compañía
- **Usuario**: Acceso básico según permisos

### Validaciones

- Validación de entrada con class-validator
- Sanitización de datos
- Prevención de inyección SQL
- Tokens JWT seguros

### Mejores Prácticas

- Consultas SQL parametrizadas
- Soft delete para preservar integridad
- Timestamps automáticos
- Validación en múltiples capas

## 🚀 Despliegue

### Desarrollo

```bash
npm run start:dev
```

### Producción

```bash
npm run build
npm run start:prod
```

### Docker (Próximamente)

```bash
docker-compose up -d
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Jahan Barraza** - *Desarrollo inicial* - [jahanbarraza](https://github.com/jahanbarraza)

## 🙏 Agradecimientos

- NestJS por el excelente framework
- PostgreSQL por la robusta base de datos
- La comunidad de desarrolladores por las mejores prácticas

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- 📧 Email: jahanyu@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/jahanbarraza/Tienda_backend_nestjs/issues)
- 📖 Documentación: [Docs](docs/)

---

⭐ ¡No olvides dar una estrella al proyecto si te fue útil!

