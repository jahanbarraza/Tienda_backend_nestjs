# Módulo de Gestión de Organización - StampOut POS Backend

## Descripción General

El módulo de Gestión de Organización proporciona funcionalidades CRUD completas para la gestión de compañías y tiendas en el sistema StampOut POS. Este módulo permite a los usuarios administrar la estructura organizacional de sus negocios de manera eficiente y segura.

## Características Principales

- ✅ CRUD completo para compañías
- ✅ CRUD completo para tiendas
- ✅ Relaciones entre compañías y tiendas
- ✅ Control de acceso basado en roles
- ✅ Filtros y búsqueda avanzada
- ✅ Paginación de resultados
- ✅ Validaciones robustas
- ✅ Consultas SQL puras
- ✅ Soft delete para preservar integridad

## Arquitectura

### Componentes Principales

1. **CompaniesModule** - Gestión de compañías
2. **StoresModule** - Gestión de tiendas
3. **OrganizationModule** - Módulo contenedor
4. **DTOs** - Validación de datos
5. **Interfaces** - Definiciones de tipos
6. **Services** - Lógica de negocio
7. **Controllers** - Endpoints de API

### Estructura de Archivos

```
src/organization/
├── companies/
│   ├── controllers/
│   │   └── companies.controller.ts
│   ├── services/
│   │   └── companies.service.ts
│   ├── dto/
│   │   ├── create-company.dto.ts
│   │   ├── update-company.dto.ts
│   │   └── query-company.dto.ts
│   ├── interfaces/
│   │   └── company.interface.ts
│   └── companies.module.ts
├── stores/
│   ├── controllers/
│   │   └── stores.controller.ts
│   ├── services/
│   │   └── stores.service.ts
│   ├── dto/
│   │   ├── create-store.dto.ts
│   │   ├── update-store.dto.ts
│   │   └── query-store.dto.ts
│   ├── interfaces/
│   │   └── store.interface.ts
│   └── stores.module.ts
├── common/
│   └── dto/
│       └── pagination.dto.ts
└── organization.module.ts
```

## Base de Datos

### Tablas Relacionadas

#### companies
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### stores
```sql
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);
```

### Relaciones

- Una **compañía** puede tener múltiples **tiendas**
- Una **tienda** pertenece a una sola **compañía**
- Los **usuarios** están asociados a una **compañía**
- Relación 1:N entre companies y stores

## API Endpoints

### Compañías

#### GET /api/companies

Listar compañías con filtros y paginación.

**Query Parameters:**
```typescript
{
  page?: number;           // Página (default: 1)
  limit?: number;          // Límite por página (default: 10, max: 100)
  search?: string;         // Búsqueda en nombre, tax_id, email
  isActive?: boolean;      // Filtrar por estado activo
  createdFrom?: string;    // Fecha desde (ISO string)
  createdTo?: string;      // Fecha hasta (ISO string)
  includeStats?: boolean;  // Incluir estadísticas (default: false)
  sortBy?: string;         // Campo de ordenamiento
  sortOrder?: 'ASC'|'DESC'; // Orden (default: ASC)
}
```

**Response:**
```typescript
{
  data: CompanyResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

**Ejemplo:**
```bash
GET /api/companies?search=demo&includeStats=true&page=1&limit=10
```

#### GET /api/companies/:id

Obtener una compañía específica con estadísticas.

**Response:**
```typescript
{
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  storesCount: number;
  usersCount: number;
}
```

#### POST /api/companies

Crear nueva compañía (Solo Super Admin).

**Request Body:**
```typescript
{
  name: string;           // 2-255 caracteres
  taxId?: string;         // Máximo 50 caracteres, único
  email?: string;         // Email válido
  phone?: string;         // Máximo 20 caracteres
  address?: string;       // Máximo 500 caracteres
}
```

**Response:** CompanyResponse

#### PATCH /api/companies/:id

Actualizar compañía existente.

**Request Body:**
```typescript
{
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}
```

**Response:** CompanyResponse

#### DELETE /api/companies/:id

Eliminar compañía (Soft delete, Solo Super Admin).

**Response:** 204 No Content

### Tiendas

#### GET /api/stores

Listar tiendas con filtros y paginación.

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;         // Búsqueda en nombre, código, dirección
  companyId?: string;      // Filtrar por compañía (Solo Super Admin)
  isActive?: boolean;
  createdFrom?: string;
  createdTo?: string;
  includeStats?: boolean;
  includeCompany?: boolean; // Incluir datos de compañía (default: true)
  sortBy?: string;
  sortOrder?: 'ASC'|'DESC';
}
```

**Response:** PaginationResponseDto<StoreResponse>

#### GET /api/stores/:id

Obtener una tienda específica con estadísticas.

**Response:**
```typescript
{
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  usersCount: number;
}
```

#### POST /api/stores

Crear nueva tienda.

**Request Body:**
```typescript
{
  companyId?: string;     // Opcional, se usa la del usuario si no se especifica
  name: string;           // 2-255 caracteres
  code: string;           // 2-50 caracteres, único por compañía
  address?: string;       // Máximo 500 caracteres
  phone?: string;         // Máximo 20 caracteres
  email?: string;         // Email válido
}
```

**Response:** StoreResponse

#### PATCH /api/stores/:id

Actualizar tienda existente.

**Request Body:**
```typescript
{
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}
```

**Response:** StoreResponse

#### DELETE /api/stores/:id

Eliminar tienda (Soft delete).

**Response:** 204 No Content

## Control de Acceso

### Roles y Permisos

#### Super Admin
- ✅ Ver todas las compañías
- ✅ Crear, actualizar y eliminar compañías
- ✅ Ver tiendas de todas las compañías
- ✅ Crear tiendas en cualquier compañía
- ✅ Actualizar y eliminar tiendas

#### Admin / Manager / Otros
- ✅ Ver solo su compañía
- ❌ No puede crear/eliminar compañías
- ✅ Puede actualizar datos de su compañía
- ✅ Ver solo tiendas de su compañía
- ✅ Crear, actualizar y eliminar tiendas de su compañía

### Validaciones de Seguridad

1. **Acceso por Compañía**: Los usuarios solo pueden acceder a datos de su compañía (excepto Super Admin)
2. **Validación de Propiedad**: Se valida que el usuario tenga permisos sobre los recursos
3. **Integridad Referencial**: Se verifican las relaciones antes de eliminar
4. **Códigos Únicos**: Los códigos de tienda son únicos por compañía

## Validaciones

### Compañías

```typescript
class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
```

### Tiendas

```typescript
class CreateStoreDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
```

## Consultas SQL Utilizadas

### Listar Compañías con Estadísticas

```sql
SELECT 
  c.id, c.name, c.tax_id, c.email, c.phone, c.address, 
  c.is_active, c.created_at, c.updated_at,
  COUNT(DISTINCT s.id) as stores_count,
  COUNT(DISTINCT u.id) as users_count
FROM companies c
LEFT JOIN stores s ON c.id = s.company_id AND s.is_active = true
LEFT JOIN users u ON c.id = u.company_id AND u.is_active = true
WHERE c.name ILIKE $1 AND c.is_active = $2
GROUP BY c.id, c.name, c.tax_id, c.email, c.phone, c.address, c.is_active, c.created_at, c.updated_at
ORDER BY c.name ASC
LIMIT $3 OFFSET $4
```

### Listar Tiendas con Información de Compañía

```sql
SELECT 
  s.id, s.company_id, s.name, s.code, s.address, s.phone, s.email, 
  s.is_active, s.created_at, s.updated_at,
  c.name as company_name,
  COUNT(DISTINCT u.id) as users_count
FROM stores s
INNER JOIN companies c ON s.company_id = c.id
LEFT JOIN users u ON s.company_id = u.company_id AND u.is_active = true
WHERE s.company_id = $1 AND s.name ILIKE $2
GROUP BY s.id, s.company_id, s.name, s.code, s.address, s.phone, s.email, s.is_active, s.created_at, s.updated_at, c.name
ORDER BY s.name ASC
LIMIT $3 OFFSET $4
```

### Crear Compañía

```sql
INSERT INTO companies (name, tax_id, email, phone, address, is_active)
VALUES ($1, $2, $3, $4, $5, true)
RETURNING id, name, tax_id, email, phone, address, is_active, created_at, updated_at
```

### Crear Tienda

```sql
INSERT INTO stores (company_id, name, code, address, phone, email, is_active)
VALUES ($1, $2, $3, $4, $5, $6, true)
RETURNING id, company_id, name, code, address, phone, email, is_active, created_at, updated_at
```

## Manejo de Errores

### Errores Comunes

#### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 2 characters",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

#### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Token de acceso requerido",
  "error": "Unauthorized"
}
```

#### 403 - Forbidden
```json
{
  "statusCode": 403,
  "message": "No tienes permisos para actualizar esta compañía",
  "error": "Forbidden"
}
```

#### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Compañía no encontrada",
  "error": "Not Found"
}
```

#### 409 - Conflict
```json
{
  "statusCode": 409,
  "message": "Ya existe una compañía con este NIT/Tax ID",
  "error": "Conflict"
}
```

## Ejemplos de Uso

### JavaScript/Fetch

```javascript
// Listar compañías
const companies = await fetch('/api/companies?includeStats=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json());

// Crear compañía
const newCompany = await fetch('/api/companies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Mi Empresa',
    taxId: '900123456-7',
    email: 'contacto@miempresa.com',
    phone: '+57 300 123 4567',
    address: 'Calle 123 #45-67'
  })
}).then(res => res.json());

// Listar tiendas
const stores = await fetch('/api/stores?includeCompany=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json());

// Crear tienda
const newStore = await fetch('/api/stores', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Tienda Centro',
    code: 'CENTRO01',
    address: 'Centro Comercial Plaza',
    phone: '+57 300 987 6543',
    email: 'centro@miempresa.com'
  })
}).then(res => res.json());
```

### cURL

```bash
# Listar compañías
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/companies?includeStats=true"

# Crear compañía
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mi Empresa",
    "taxId": "900123456-7",
    "email": "contacto@miempresa.com"
  }' \
  http://localhost:3000/api/companies

# Listar tiendas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/stores?includeCompany=true"

# Crear tienda
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Tienda Centro",
    "code": "CENTRO01",
    "address": "Centro Comercial Plaza"
  }' \
  http://localhost:3000/api/stores
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3000/api'
headers = {'Authorization': f'Bearer {token}'}

# Listar compañías
companies = requests.get(
    f'{BASE_URL}/companies?includeStats=true',
    headers=headers
).json()

# Crear compañía
new_company = requests.post(
    f'{BASE_URL}/companies',
    headers={**headers, 'Content-Type': 'application/json'},
    json={
        'name': 'Mi Empresa',
        'taxId': '900123456-7',
        'email': 'contacto@miempresa.com'
    }
).json()

# Listar tiendas
stores = requests.get(
    f'{BASE_URL}/stores?includeCompany=true',
    headers=headers
).json()

# Crear tienda
new_store = requests.post(
    f'{BASE_URL}/stores',
    headers={**headers, 'Content-Type': 'application/json'},
    json={
        'name': 'Tienda Centro',
        'code': 'CENTRO01',
        'address': 'Centro Comercial Plaza'
    }
).json()
```

## Filtros y Búsqueda

### Búsqueda de Compañías

La búsqueda se realiza en los campos:
- `name` (nombre)
- `tax_id` (NIT/Tax ID)
- `email` (correo electrónico)

```bash
GET /api/companies?search=demo
GET /api/companies?search=900123456
GET /api/companies?search=@stampout
```

### Búsqueda de Tiendas

La búsqueda se realiza en los campos:
- `name` (nombre)
- `code` (código)
- `address` (dirección)

```bash
GET /api/stores?search=principal
GET /api/stores?search=MAIN
GET /api/stores?search=bogotá
```

### Filtros Avanzados

```bash
# Compañías activas creadas en el último mes
GET /api/companies?isActive=true&createdFrom=2024-01-01

# Tiendas de una compañía específica (Solo Super Admin)
GET /api/stores?companyId=uuid-company-id

# Ordenamiento personalizado
GET /api/companies?sortBy=created_at&sortOrder=DESC
GET /api/stores?sortBy=name&sortOrder=ASC
```

## Paginación

### Parámetros de Paginación

- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)

### Respuesta de Paginación

```typescript
{
  data: T[];           // Datos de la página actual
  total: number;       // Total de elementos
  page: number;        // Página actual
  limit: number;       // Límite por página
  totalPages: number;  // Total de páginas
  hasNext: boolean;    // Hay página siguiente
  hasPrev: boolean;    // Hay página anterior
}
```

### Ejemplos

```bash
# Primera página con 5 elementos
GET /api/companies?page=1&limit=5

# Segunda página con 10 elementos
GET /api/stores?page=2&limit=10

# Última página
GET /api/companies?page=999&limit=10  # Retorna la última página disponible
```

## Testing

### Script de Pruebas

El módulo incluye un script completo de pruebas:

```bash
node scripts/test-organization-endpoints.js
```

### Casos de Prueba Cubiertos

1. **Autenticación**
   - Login exitoso
   - Obtención de token JWT

2. **Compañías**
   - Listar compañías
   - Obtener compañía específica
   - Crear nueva compañía
   - Actualizar compañía
   - Búsqueda con filtros

3. **Tiendas**
   - Listar tiendas
   - Obtener tienda específica
   - Crear nueva tienda
   - Actualizar tienda
   - Eliminar tienda
   - Búsqueda con información completa

4. **Validaciones**
   - Datos inválidos en compañías
   - Datos inválidos en tiendas
   - Conflictos de unicidad

### Resultados Esperados

```
🚀 Iniciando pruebas del módulo de Organización...
🔐 Iniciando sesión...
✅ Login exitoso

📊 Probando endpoints de Compañías...
✅ Compañías obtenidas: 1
✅ Compañía obtenida: StampOut POS Demo
✅ Compañía creada: Compañía de Prueba
✅ Compañía actualizada: Compañía de Prueba Actualizada
✅ Búsqueda exitosa, resultados: 1

🏪 Probando endpoints de Tiendas...
✅ Tiendas obtenidas: 1
✅ Tienda obtenida: Tienda Principal
✅ Tienda creada: Tienda de Prueba
✅ Tienda actualizada: Tienda de Prueba Actualizada
✅ Tiendas con detalles obtenidas: 2

🔍 Probando validaciones...
✅ Validación funcionando correctamente
✅ Todas las pruebas completadas exitosamente!
```

## Mejores Prácticas

### Desarrollo

1. **Consultas SQL Puras**: Todas las operaciones usan SQL directo para máximo control
2. **Validaciones Robustas**: Validación en múltiples capas (DTO, servicio, base de datos)
3. **Control de Acceso**: Verificación de permisos en cada operación
4. **Manejo de Errores**: Errores descriptivos y códigos HTTP apropiados
5. **Paginación**: Límites razonables para evitar sobrecarga

### Seguridad

1. **Autorización por Roles**: Diferentes niveles de acceso según el rol
2. **Validación de Propiedad**: Los usuarios solo acceden a sus recursos
3. **Sanitización**: Prevención de inyección SQL y XSS
4. **Soft Delete**: Preservación de integridad referencial
5. **Auditoría**: Timestamps automáticos para tracking

### Performance

1. **Índices Optimizados**: Índices en campos de búsqueda frecuente
2. **Consultas Eficientes**: JOINs optimizados y subconsultas cuando es necesario
3. **Paginación**: Evita cargar grandes volúmenes de datos
4. **Filtros**: Reducción de datos en la base de datos, no en la aplicación

## Próximas Mejoras

1. **Cache**: Implementar cache para consultas frecuentes
2. **Auditoría**: Log de cambios en entidades críticas
3. **Bulk Operations**: Operaciones en lote para eficiencia
4. **Export/Import**: Funcionalidades de exportación e importación
5. **Validaciones Avanzadas**: Reglas de negocio más complejas
6. **Notificaciones**: Alertas por cambios importantes

## Dependencias

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0",
  "pg": "^8.11.0"
}
```

## Conclusión

El módulo de Gestión de Organización proporciona una base sólida para la administración de compañías y tiendas en el sistema StampOut POS. Con funcionalidades CRUD completas, control de acceso robusto y validaciones exhaustivas, este módulo está preparado para escalar y adaptarse a las necesidades futuras del sistema.

