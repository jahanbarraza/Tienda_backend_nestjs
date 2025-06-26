# Documentación de API - StampOut POS Backend

## Información General

- **Base URL:** `http://localhost:3000/api`
- **Versión:** 1.0.0
- **Autenticación:** JWT Bearer Token
- **Formato:** JSON

## Autenticación

Todos los endpoints (excepto los marcados como públicos) requieren un token JWT en el header Authorization.

```
Authorization: Bearer <jwt_token>
```

## Endpoints Públicos

### GET /health

Verificar estado del sistema.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "StampOut POS Backend",
  "version": "1.0.0"
}
```

**Códigos de Estado:**
- `200` - Sistema funcionando correctamente

---

### GET /

Mensaje de bienvenida del sistema.

**Request:**
```http
GET /api/
```

**Response:**
```json
"StampOut POS Backend API - Sistema de Punto de Venta"
```

**Códigos de Estado:**
- `200` - Respuesta exitosa

---

## Autenticación

### POST /auth/login

Autenticar usuario con credenciales.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Validaciones:**
- `username`: Requerido, string, 3-50 caracteres
- `password`: Requerido, string, mínimo 6 caracteres

**Response Exitosa:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjI4YzY4Zi0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzdGFtcG91dHBvcy5jb20iLCJjb21wYW55SWQiOiI5ZjI4YzY4Zi0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJyb2xlSWQiOiI5ZjI4YzY4Zi0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJyb2xlTmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQxNTM2MDB9.example_signature",
  "user": {
    "id": "9f28c68f-1234-5678-90ab-cdef12345678",
    "username": "admin",
    "email": "admin@stampoutpos.com",
    "person": {
      "firstName": "Admin",
      "lastName": "Sistema"
    },
    "company": {
      "id": "9f28c68f-1234-5678-90ab-cdef12345678",
      "name": "StampOut POS Demo"
    },
    "role": {
      "id": "9f28c68f-1234-5678-90ab-cdef12345678",
      "name": "Super Admin",
      "permissions": {
        "all": true
      }
    }
  }
}
```

**Errores:**
```json
// 400 - Datos inválidos
{
  "statusCode": 400,
  "message": [
    "username must be longer than or equal to 3 characters",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}

// 401 - Credenciales incorrectas
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}

// 401 - Usuario inactivo
{
  "statusCode": 401,
  "message": "Usuario inactivo",
  "error": "Unauthorized"
}
```

**Códigos de Estado:**
- `200` - Login exitoso
- `400` - Datos de entrada inválidos
- `401` - Credenciales incorrectas o usuario inactivo

---

## Endpoints Protegidos

### GET /auth/profile

Obtener perfil del usuario autenticado.

**Request:**
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "9f28c68f-1234-5678-90ab-cdef12345678",
  "username": "admin",
  "email": "admin@stampoutpos.com",
  "person": {
    "firstName": "Admin",
    "lastName": "Sistema"
  },
  "company": {
    "id": "9f28c68f-1234-5678-90ab-cdef12345678",
    "name": "StampOut POS Demo"
  },
  "role": {
    "id": "9f28c68f-1234-5678-90ab-cdef12345678",
    "name": "Super Admin",
    "permissions": {
      "all": true
    }
  }
}
```

**Códigos de Estado:**
- `200` - Perfil obtenido exitosamente
- `401` - Token inválido o expirado

---

### GET /auth/validate

Validar token de acceso.

**Request:**
```http
GET /api/auth/validate
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "9f28c68f-1234-5678-90ab-cdef12345678",
    "username": "admin",
    "email": "admin@stampoutpos.com",
    "role": "Super Admin",
    "company": "StampOut POS Demo"
  }
}
```

**Códigos de Estado:**
- `200` - Token válido
- `401` - Token inválido o expirado

---

### POST /auth/logout

Cerrar sesión del usuario.

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Logout exitoso"
}
```

**Códigos de Estado:**
- `200` - Logout exitoso
- `401` - Token inválido o expirado

---

## Ejemplos de Uso

### Ejemplo con cURL

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

#### Obtener Perfil
```bash
# Primero hacer login y obtener el token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Ejemplo con JavaScript (Fetch)

```javascript
// Login
async function login(username, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

// Obtener perfil
async function getProfile() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get profile');
  }
  
  return response.json();
}

// Uso
try {
  const loginResult = await login('admin', 'admin123');
  console.log('Login exitoso:', loginResult);
  
  const profile = await getProfile();
  console.log('Perfil:', profile);
} catch (error) {
  console.error('Error:', error);
}
```

### Ejemplo con Axios

```javascript
import axios from 'axios';

// Configurar base URL
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
async function login(username, password) {
  try {
    const response = await api.post('/auth/login', {
      username,
      password,
    });
    
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response.data);
    throw error;
  }
}

// Obtener perfil
async function getProfile() {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Profile error:', error.response.data);
    throw error;
  }
}
```

### Ejemplo con Python (requests)

```python
import requests
import json

BASE_URL = 'http://localhost:3000/api'

def login(username, password):
    """Realizar login y obtener token"""
    url = f'{BASE_URL}/auth/login'
    data = {
        'username': username,
        'password': password
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f'Login failed: {response.text}')

def get_profile(token):
    """Obtener perfil del usuario"""
    url = f'{BASE_URL}/auth/profile'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f'Failed to get profile: {response.text}')

# Uso
try:
    # Login
    login_result = login('admin', 'admin123')
    token = login_result['access_token']
    print('Login exitoso')
    
    # Obtener perfil
    profile = get_profile(token)
    print(f'Usuario: {profile["username"]}')
    print(f'Empresa: {profile["company"]["name"]}')
    print(f'Rol: {profile["role"]["name"]}')
    
except Exception as e:
    print(f'Error: {e}')
```

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 400 | Bad Request - Datos de entrada inválidos |
| 401 | Unauthorized - No autenticado o token inválido |
| 403 | Forbidden - No autorizado para esta acción |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error interno del servidor |

## Estructura de Errores

Todos los errores siguen la misma estructura:

```json
{
  "statusCode": 400,
  "message": "Descripción del error o array de errores",
  "error": "Tipo de error"
}
```

### Ejemplos de Errores

#### Error de Validación
```json
{
  "statusCode": 400,
  "message": [
    "username must be longer than or equal to 3 characters",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

#### Error de Autenticación
```json
{
  "statusCode": 401,
  "message": "Token de acceso requerido",
  "error": "Unauthorized"
}
```

#### Error de Token Expirado
```json
{
  "statusCode": 401,
  "message": "Token inválido o usuario inactivo",
  "error": "Unauthorized"
}
```

## Headers Requeridos

### Para Endpoints Públicos
```
Content-Type: application/json
```

### Para Endpoints Protegidos
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

## Rate Limiting

Actualmente no implementado. Se recomienda implementar en producción:

- Login: 5 intentos por minuto por IP
- Otros endpoints: 100 requests por minuto por usuario

## CORS

El servidor está configurado para aceptar requests desde:
- `http://localhost:3001` (configurable via `CORS_ORIGIN`)

Para desarrollo local, se permite cualquier origen.

## Versionado

La API actualmente no tiene versionado. Se recomienda implementar versionado para futuras versiones:

- `/api/v1/auth/login`
- `/api/v2/auth/login`

## Próximos Endpoints

Los siguientes endpoints serán implementados en futuras versiones:

### Gestión de Organización
- `GET /api/companies` - Listar compañías
- `POST /api/companies` - Crear compañía
- `GET /api/companies/:id` - Obtener compañía
- `PUT /api/companies/:id` - Actualizar compañía
- `DELETE /api/companies/:id` - Eliminar compañía

### Gestión de Tiendas
- `GET /api/stores` - Listar tiendas
- `POST /api/stores` - Crear tienda
- `GET /api/stores/:id` - Obtener tienda
- `PUT /api/stores/:id` - Actualizar tienda
- `DELETE /api/stores/:id` - Eliminar tienda

### Gestión de Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Punto de Venta
- `POST /api/sales` - Registrar venta
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/products/:id` - Obtener producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

## Soporte

Para soporte de la API:
1. Consultar esta documentación
2. Revisar logs del servidor
3. Crear issue en GitHub
4. Contactar al equipo de desarrollo



## Módulo de Gestión de Organización

### Compañías

#### GET /api/companies
Listar compañías con filtros y paginación.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, opcional): Página (default: 1)
- `limit` (number, opcional): Límite por página (default: 10, max: 100)
- `search` (string, opcional): Búsqueda en nombre, tax_id, email
- `isActive` (boolean, opcional): Filtrar por estado activo
- `createdFrom` (string, opcional): Fecha desde (ISO string)
- `createdTo` (string, opcional): Fecha hasta (ISO string)
- `includeStats` (boolean, opcional): Incluir estadísticas (default: false)
- `sortBy` (string, opcional): Campo de ordenamiento
- `sortOrder` (string, opcional): Orden ASC|DESC (default: ASC)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "StampOut POS Demo",
      "taxId": "900123456-1",
      "email": "demo@stampoutpos.com",
      "phone": "+57 300 123 4567",
      "address": "Calle 123 #45-67, Bogotá, Colombia",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "storesCount": 5,
      "usersCount": 10
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

#### GET /api/companies/:id
Obtener una compañía específica.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "StampOut POS Demo",
  "taxId": "900123456-1",
  "email": "demo@stampoutpos.com",
  "phone": "+57 300 123 4567",
  "address": "Calle 123 #45-67, Bogotá, Colombia",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "storesCount": 5,
  "usersCount": 10
}
```

#### POST /api/companies
Crear nueva compañía (Solo Super Admin).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Mi Nueva Empresa",
  "taxId": "900123456-7",
  "email": "contacto@miempresa.com",
  "phone": "+57 300 123 4567",
  "address": "Calle 123 #45-67"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Mi Nueva Empresa",
  "taxId": "900123456-7",
  "email": "contacto@miempresa.com",
  "phone": "+57 300 123 4567",
  "address": "Calle 123 #45-67",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PATCH /api/companies/:id
Actualizar compañía existente.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Empresa Actualizada",
  "phone": "+57 300 999 8888",
  "isActive": true
}
```

**Response (200):** CompanyResponse

#### DELETE /api/companies/:id
Eliminar compañía (Soft delete, Solo Super Admin).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):** No Content

### Tiendas

#### GET /api/stores
Listar tiendas con filtros y paginación.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, opcional): Página (default: 1)
- `limit` (number, opcional): Límite por página (default: 10, max: 100)
- `search` (string, opcional): Búsqueda en nombre, código, dirección
- `companyId` (string, opcional): Filtrar por compañía (Solo Super Admin)
- `isActive` (boolean, opcional): Filtrar por estado activo
- `createdFrom` (string, opcional): Fecha desde (ISO string)
- `createdTo` (string, opcional): Fecha hasta (ISO string)
- `includeStats` (boolean, opcional): Incluir estadísticas (default: false)
- `includeCompany` (boolean, opcional): Incluir datos de compañía (default: true)
- `sortBy` (string, opcional): Campo de ordenamiento
- `sortOrder` (string, opcional): Orden ASC|DESC (default: ASC)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "name": "Tienda Principal",
      "code": "MAIN",
      "address": "Calle 123 #45-67, Bogotá, Colombia",
      "phone": "+57 300 123 4567",
      "email": "tienda@stampoutpos.com",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "company": {
        "id": "uuid",
        "name": "StampOut POS Demo"
      },
      "usersCount": 5
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

#### GET /api/stores/:id
Obtener una tienda específica.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "name": "Tienda Principal",
  "code": "MAIN",
  "address": "Calle 123 #45-67, Bogotá, Colombia",
  "phone": "+57 300 123 4567",
  "email": "tienda@stampoutpos.com",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "company": {
    "id": "uuid",
    "name": "StampOut POS Demo"
  },
  "usersCount": 5
}
```

#### POST /api/stores
Crear nueva tienda.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "name": "Tienda Centro",
  "code": "CENTRO01",
  "address": "Centro Comercial Plaza",
  "phone": "+57 300 987 6543",
  "email": "centro@miempresa.com"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "name": "Tienda Centro",
  "code": "CENTRO01",
  "address": "Centro Comercial Plaza",
  "phone": "+57 300 987 6543",
  "email": "centro@miempresa.com",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PATCH /api/stores/:id
Actualizar tienda existente.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tienda Centro Actualizada",
  "phone": "+57 300 111 2222",
  "isActive": true
}
```

**Response (200):** StoreResponse

#### DELETE /api/stores/:id
Eliminar tienda (Soft delete).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):** No Content

### Códigos de Error Específicos

#### 409 - Conflict
```json
{
  "statusCode": 409,
  "message": "Ya existe una compañía con este NIT/Tax ID",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Ya existe una tienda con este código en la compañía",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "No se puede eliminar la compañía porque tiene tiendas o usuarios activos",
  "error": "Conflict"
}
```

### Ejemplos de Uso

#### Listar compañías con estadísticas
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/companies?includeStats=true&page=1&limit=10"
```

#### Buscar tiendas por nombre
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/stores?search=principal&includeCompany=true"
```

#### Crear nueva compañía
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mi Empresa",
    "taxId": "900123456-7",
    "email": "contacto@miempresa.com",
    "phone": "+57 300 123 4567",
    "address": "Calle 123 #45-67"
  }' \
  http://localhost:3000/api/companies
```

#### Crear nueva tienda
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Tienda Norte",
    "code": "NORTE01",
    "address": "Centro Comercial Norte",
    "phone": "+57 300 555 6666",
    "email": "norte@miempresa.com"
  }' \
  http://localhost:3000/api/stores
```

