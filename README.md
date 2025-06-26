# StampOut POS Backend

Backend del sistema de punto de venta (POS) StampOut construido con NestJS, PostgreSQL y consultas SQL puras.

## 🚀 Características

- ✅ **Autenticación JWT** - Sistema de login seguro con tokens
- ✅ **Gestión de Organización** - CRUD completo para compañías y tiendas
- ✅ **Gestión de Personas** - CRUD completo para usuarios, roles y personas
- ✅ **Control de Acceso** - Autorización basada en roles
- ✅ **Consultas SQL Puras** - Sin ORM, máximo control sobre la base de datos
- ✅ **Validaciones Robustas** - Validación en múltiples capas
- ✅ **Arquitectura Modular** - Código organizado y escalable
- ✅ **Documentación Completa** - API y módulos documentados
- ✅ **Pruebas Automatizadas** - Scripts de prueba para todos los módulos

## ✨ Funcionalidades Implementadas

### 🔐 Módulo de Autenticación
- Login con usuario y contraseña
- Generación de tokens JWT
- Middleware de autenticación
- Protección de rutas

### 🏢 Módulo de Gestión de Organización
- **Compañías**: CRUD completo con validaciones
- **Tiendas**: CRUD completo asociado a compañías
- Filtros avanzados y paginación
- Control de acceso por roles

### 👥 Módulo de Gestión de Personas
- **Tipos de Identificación**: CRUD completo para documentos
- **Roles**: CRUD completo con sistema de permisos granular
- **Personas**: CRUD completo con información personal
- **Usuarios**: CRUD completo con autenticación y autorización
- Relaciones complejas entre entidades
- Validaciones robustas y seguridad avanzada

### 🔄 Próximos Módulos
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
# Puerto de la aplicación
PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=stampout_pos

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Compañías
- `GET /api/companies` - Listar compañías
- `POST /api/companies` - Crear compañía
- `GET /api/companies/:id` - Obtener compañía
- `PATCH /api/companies/:id` - Actualizar compañía
- `DELETE /api/companies/:id` - Eliminar compañía

### Tiendas
- `GET /api/stores` - Listar tiendas
- `POST /api/stores` - Crear tienda
- `GET /api/stores/:id` - Obtener tienda
- `PATCH /api/stores/:id` - Actualizar tienda
- `DELETE /api/stores/:id` - Eliminar tienda

### Tipos de Identificación
- `GET /api/identification-types` - Listar tipos
- `POST /api/identification-types` - Crear tipo
- `GET /api/identification-types/:id` - Obtener tipo
- `PATCH /api/identification-types/:id` - Actualizar tipo
- `DELETE /api/identification-types/:id` - Eliminar tipo

### Roles
- `GET /api/roles` - Listar roles
- `POST /api/roles` - Crear rol
- `GET /api/roles/:id` - Obtener rol
- `PATCH /api/roles/:id` - Actualizar rol
- `DELETE /api/roles/:id` - Eliminar rol

### Personas
- `GET /api/persons` - Listar personas
- `POST /api/persons` - Crear persona
- `GET /api/persons/:id` - Obtener persona
- `PATCH /api/persons/:id` - Actualizar persona
- `DELETE /api/persons/:id` - Eliminar persona

### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/:id` - Obtener usuario
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

## 🧪 Pruebas

### Ejecutar Pruebas Automatizadas

```bash
# Pruebas del módulo de organización
node scripts/test-organization-endpoints.js

# Pruebas del módulo de personas
node scripts/test-people-endpoints.js
```

### Datos de Prueba

**Usuario por defecto:**
- Username: `admin`
- Password: `admin123`

## 📖 Documentación

- [Documentación de API](docs/API_DOCUMENTATION.md)
- [Módulo de Autenticación](docs/AUTHENTICATION_MODULE.md)
- [Módulo de Organización](docs/ORGANIZATION_MODULE.md)
- [Módulo de Personas](docs/PEOPLE_MODULE.md)
- [Guía de Instalación](docs/INSTALLATION_GUIDE.md)

## 🏗️ Arquitectura

### Estructura del Proyecto

```
src/
├── auth/                 # Módulo de autenticación
├── organization/         # Módulo de organización
│   ├── companies/       # Submódulo de compañías
│   └── stores/          # Submódulo de tiendas
├── people/              # Módulo de personas
│   ├── identification-types/  # Tipos de identificación
│   ├── roles/           # Roles y permisos
│   ├── persons/         # Información personal
│   └── users/           # Usuarios del sistema
├── database/            # Servicios de base de datos
├── common/              # Utilidades comunes
└── config/              # Configuración
```

### Principios de Diseño

- **Modularidad**: Cada módulo es independiente y reutilizable
- **Separación de responsabilidades**: Controladores, servicios y DTOs bien definidos
- **Consultas SQL puras**: Control total sobre las consultas de base de datos
- **Validaciones en capas**: DTO, servicio y base de datos
- **Seguridad por defecto**: Autenticación y autorización en todos los endpoints

## 🔒 Seguridad

### Medidas Implementadas

- Autenticación JWT obligatoria
- Autorización basada en roles
- Validación de permisos por compañía
- Encriptación de contraseñas con bcrypt
- Sanitización de datos de entrada
- Protección contra inyección SQL
- CORS configurado

### Roles del Sistema

- **Super Admin**: Acceso completo a todo el sistema
- **Admin**: Gestión de su compañía y tiendas
- **Vendedor**: Acceso a ventas e inventario
- **Cajero**: Acceso limitado a punto de venta

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

## 👨‍💻 Autor

**Jahan Barraza**
- GitHub: [@jahanbarraza](https://github.com/jahanbarraza)
- Email: jahanyu@gmail.com

## 🙏 Agradecimientos

- NestJS por el excelente framework
- PostgreSQL por la robusta base de datos
- La comunidad de desarrolladores por las mejores prácticas

---

⭐ ¡No olvides dar una estrella al proyecto si te ha sido útil!

