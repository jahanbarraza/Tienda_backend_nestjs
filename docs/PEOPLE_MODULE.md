# Módulo de Gestión de Personas - StampOut POS

## Descripción General

El módulo de Gestión de Personas es un componente fundamental del sistema StampOut POS que maneja toda la información relacionada con personas, usuarios, roles y tipos de identificación. Este módulo proporciona una base sólida para la gestión de recursos humanos y control de acceso en el sistema.

## Arquitectura del Módulo

El módulo está organizado en cuatro submódulos principales:

### 1. Tipos de Identificación
- **Propósito**: Gestionar los diferentes tipos de documentos de identificación
- **Funcionalidades**: CRUD completo con validaciones y estadísticas
- **Casos de uso**: Cédula, Pasaporte, Licencia de Conducir, etc.

### 2. Roles
- **Propósito**: Definir roles y permisos dentro del sistema
- **Funcionalidades**: CRUD completo con sistema de permisos granular
- **Casos de uso**: Super Admin, Admin, Vendedor, Cajero, etc.

### 3. Personas
- **Propósito**: Almacenar información personal de individuos
- **Funcionalidades**: CRUD completo con validaciones de datos personales
- **Casos de uso**: Empleados, clientes, proveedores

### 4. Usuarios
- **Propósito**: Gestionar cuentas de acceso al sistema
- **Funcionalidades**: CRUD completo con autenticación y autorización
- **Casos de uso**: Cuentas de empleados con acceso al sistema

## Características Principales

### 🔐 Seguridad y Autenticación
- Autenticación JWT requerida para todos los endpoints
- Autorización basada en roles
- Validación de permisos por compañía
- Encriptación de contraseñas con bcrypt

### 📊 Validaciones Robustas
- Validación de datos en múltiples capas (DTO, servicio, base de datos)
- Verificación de unicidad en campos críticos
- Validación de relaciones entre entidades
- Sanitización de datos de entrada

### 🔍 Funcionalidades Avanzadas
- Búsqueda y filtrado avanzado
- Paginación configurable
- Ordenamiento dinámico
- Soft delete para preservar integridad
- Estadísticas y métricas

### 🏗️ Arquitectura Modular
- Separación clara de responsabilidades
- Consultas SQL puras para máximo rendimiento
- Interfaces bien definidas
- Fácil mantenimiento y escalabilidad

## Endpoints Disponibles

### Tipos de Identificación

#### GET /api/identification-types
Listar tipos de identificación con filtros y paginación.

**Parámetros de consulta:**
- `page` (number): Número de página (default: 1)
- `limit` (number): Elementos por página (default: 10, max: 100)
- `search` (string): Búsqueda por nombre o código
- `sortBy` (string): Campo para ordenar (default: 'name')
- `sortOrder` ('ASC'|'DESC'): Orden de clasificación (default: 'ASC')
- `isActive` (boolean): Filtrar por estado activo
- `createdFrom` (string): Fecha de creación desde (ISO 8601)
- `createdTo` (string): Fecha de creación hasta (ISO 8601)
- `includeStats` (boolean): Incluir estadísticas de uso

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Cédula de Ciudadanía",
      "code": "CC",
      "description": "Documento de identificación nacional",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "stats": {
        "totalPersons": 150
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

#### GET /api/identification-types/:id
Obtener un tipo de identificación específico.

**Parámetros:**
- `id` (UUID): ID del tipo de identificación

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "name": "Cédula de Ciudadanía",
  "code": "CC",
  "description": "Documento de identificación nacional",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST /api/identification-types
Crear un nuevo tipo de identificación.

**Permisos requeridos:** Super Admin

**Cuerpo de la solicitud:**
```json
{
  "name": "Pasaporte",
  "code": "PASS",
  "description": "Documento de identificación internacional"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "uuid",
  "name": "Pasaporte",
  "code": "PASS",
  "description": "Documento de identificación internacional",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PATCH /api/identification-types/:id
Actualizar un tipo de identificación existente.

**Permisos requeridos:** Super Admin o Admin

**Parámetros:**
- `id` (UUID): ID del tipo de identificación

**Cuerpo de la solicitud:**
```json
{
  "name": "Pasaporte Internacional",
  "description": "Documento de identificación internacional actualizado"
}
```

#### DELETE /api/identification-types/:id
Eliminar (soft delete) un tipo de identificación.

**Permisos requeridos:** Super Admin

**Parámetros:**
- `id` (UUID): ID del tipo de identificación

### Roles

#### GET /api/roles
Listar roles con filtros y paginación.

**Parámetros de consulta:** (similares a tipos de identificación)

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Vendedor",
      "description": "Rol para personal de ventas",
      "permissions": {
        "sales": { "read": true, "write": true },
        "inventory": { "read": true, "write": false }
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "stats": {
        "totalUsers": 25
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

#### POST /api/roles
Crear un nuevo rol.

**Permisos requeridos:** Super Admin

**Cuerpo de la solicitud:**
```json
{
  "name": "Cajero",
  "description": "Rol para personal de caja",
  "permissions": {
    "sales": { "read": true, "write": true },
    "payments": { "read": true, "write": true },
    "inventory": { "read": true, "write": false }
  }
}
```

### Personas

#### GET /api/persons
Listar personas con filtros y paginación.

**Parámetros de consulta adicionales:**
- `identificationTypeId` (UUID): Filtrar por tipo de identificación
- `includeIdentificationType` (boolean): Incluir datos del tipo de identificación

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "identificationTypeId": "uuid",
      "identificationNumber": "12345678",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "phone": "+57 300 123 4567",
      "address": "Calle 123 #45-67",
      "birthDate": "1990-05-15",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "identificationType": {
        "id": "uuid",
        "name": "Cédula de Ciudadanía",
        "code": "CC"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

#### POST /api/persons
Crear una nueva persona.

**Cuerpo de la solicitud:**
```json
{
  "identificationTypeId": "uuid",
  "identificationNumber": "87654321",
  "firstName": "María",
  "lastName": "González",
  "email": "maria.gonzalez@example.com",
  "phone": "+57 300 987 6543",
  "address": "Carrera 45 #67-89",
  "birthDate": "1985-08-20"
}
```

### Usuarios

#### GET /api/users
Listar usuarios con filtros y paginación.

**Parámetros de consulta adicionales:**
- `companyId` (UUID): Filtrar por compañía
- `roleId` (UUID): Filtrar por rol
- `includeDetails` (boolean): Incluir datos de persona, compañía y rol

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "personId": "uuid",
      "companyId": "uuid",
      "roleId": "uuid",
      "username": "juan.perez",
      "email": "juan.perez@company.com",
      "isActive": true,
      "lastLogin": "2024-01-01T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "person": {
        "id": "uuid",
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan.perez@example.com"
      },
      "company": {
        "id": "uuid",
        "name": "StampOut POS Demo",
        "code": "DEMO"
      },
      "role": {
        "id": "uuid",
        "name": "Vendedor",
        "permissions": {}
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

#### POST /api/users
Crear un nuevo usuario.

**Cuerpo de la solicitud:**
```json
{
  "personId": "uuid",
  "companyId": "uuid",
  "roleId": "uuid",
  "username": "maria.gonzalez",
  "password": "password123",
  "email": "maria.gonzalez@company.com"
}
```

## Validaciones y Restricciones

### Tipos de Identificación
- **name**: Requerido, único, máximo 100 caracteres
- **code**: Requerido, único, máximo 10 caracteres
- **description**: Opcional, máximo 500 caracteres

### Roles
- **name**: Requerido, único, máximo 100 caracteres
- **description**: Opcional, máximo 500 caracteres
- **permissions**: Objeto JSON con estructura de permisos

### Personas
- **identificationTypeId**: Requerido, debe existir
- **identificationNumber**: Requerido, único por tipo de identificación
- **firstName**: Requerido, máximo 100 caracteres
- **lastName**: Requerido, máximo 100 caracteres
- **email**: Opcional, formato de email válido, único
- **phone**: Opcional, máximo 20 caracteres
- **birthDate**: Opcional, fecha válida

### Usuarios
- **personId**: Requerido, debe existir, una persona por usuario
- **companyId**: Opcional, se usa la del usuario actual si no se especifica
- **roleId**: Requerido, debe existir
- **username**: Requerido, único, 3-50 caracteres
- **password**: Requerido, mínimo 6 caracteres
- **email**: Opcional, formato de email válido

## Códigos de Error

### Errores Comunes
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: Token de autenticación requerido
- **403 Forbidden**: Permisos insuficientes
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto de unicidad (duplicados)
- **500 Internal Server Error**: Error interno del servidor

### Ejemplos de Respuestas de Error

**400 Bad Request:**
```json
{
  "message": [
    "name should not be empty",
    "code must be shorter than or equal to 10 characters"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**409 Conflict:**
```json
{
  "message": "Ya existe un tipo de identificación con este nombre",
  "error": "Conflict",
  "statusCode": 409
}
```

## Relaciones entre Entidades

### Diagrama de Relaciones
```
identification_types (1) -----> (N) persons
                                   |
                                   | (1)
                                   v
companies (1) -----> (N) users <----- (N) roles
                                   |
                                   | (1)
                                   v
                               persons
```

### Descripción de Relaciones
1. **Tipos de Identificación → Personas**: Un tipo puede tener muchas personas
2. **Personas → Usuarios**: Una persona puede tener un usuario (1:1)
3. **Compañías → Usuarios**: Una compañía puede tener muchos usuarios
4. **Roles → Usuarios**: Un rol puede ser asignado a muchos usuarios

## Consideraciones de Rendimiento

### Optimizaciones Implementadas
- Índices en campos de búsqueda frecuente
- Consultas SQL optimizadas
- Paginación para evitar cargas masivas
- Soft delete para preservar integridad referencial

### Recomendaciones
- Usar filtros específicos en consultas grandes
- Limitar el número de elementos por página
- Implementar caché para datos estáticos (tipos, roles)
- Monitorear consultas lentas

## Seguridad

### Medidas Implementadas
- Autenticación JWT obligatoria
- Autorización basada en roles
- Validación de permisos por compañía
- Encriptación de contraseñas
- Sanitización de datos de entrada
- Protección contra inyección SQL

### Buenas Prácticas
- Cambiar contraseñas regularmente
- Usar roles con permisos mínimos necesarios
- Auditar accesos y cambios
- Mantener logs de seguridad

## Casos de Uso Comunes

### 1. Registro de Nuevo Empleado
1. Crear persona con datos personales
2. Crear usuario asociado a la persona
3. Asignar rol apropiado
4. Configurar permisos específicos

### 2. Gestión de Roles
1. Definir nuevo rol con permisos específicos
2. Asignar rol a usuarios existentes
3. Modificar permisos según necesidades
4. Desactivar roles obsoletos

### 3. Actualización de Información Personal
1. Modificar datos de persona
2. Actualizar información de contacto
3. Cambiar datos de usuario si es necesario
4. Mantener historial de cambios

## Mantenimiento y Monitoreo

### Tareas de Mantenimiento
- Limpieza periódica de registros inactivos
- Actualización de índices de base de datos
- Revisión de permisos y roles
- Backup de datos críticos

### Métricas a Monitorear
- Número de usuarios activos
- Frecuencia de login por usuario
- Distribución de roles
- Tiempo de respuesta de endpoints

## Conclusión

El módulo de Gestión de Personas proporciona una base sólida y escalable para la gestión de recursos humanos en el sistema StampOut POS. Con su arquitectura modular, validaciones robustas y sistema de seguridad avanzado, permite un control granular de usuarios y permisos mientras mantiene la flexibilidad necesaria para adaptarse a diferentes necesidades organizacionales.

Todo Probado y ok 