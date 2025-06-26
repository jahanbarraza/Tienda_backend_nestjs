# Módulo de Autenticación - StampOut POS Backend

## Descripción General

El módulo de autenticación es el componente central de seguridad del sistema StampOut POS. Proporciona funcionalidades de login, validación de usuarios, generación de tokens JWT y protección de rutas mediante middleware.

## Arquitectura

### Componentes Principales

1. **AuthService** - Lógica de negocio para autenticación
2. **AuthController** - Endpoints de la API
3. **JwtStrategy** - Estrategia de validación JWT
4. **JwtAuthGuard** - Guard para protección de rutas
5. **DTOs** - Validación de datos de entrada
6. **Interfaces** - Definiciones de tipos TypeScript

### Flujo de Autenticación

```
1. Usuario envía credenciales → POST /api/auth/login
2. AuthService valida credenciales contra la base de datos
3. Si es válido, genera token JWT
4. Guarda sesión en user_sessions
5. Retorna token y datos del usuario
6. Cliente incluye token en header Authorization
7. JwtAuthGuard valida token en cada request
8. Si es válido, permite acceso al endpoint
```

## Estructura de Archivos

```
src/auth/
├── controllers/
│   └── auth.controller.ts      # Endpoints de autenticación
├── services/
│   └── auth.service.ts         # Lógica de negocio
├── guards/
│   ├── jwt.strategy.ts         # Estrategia JWT
│   └── jwt-auth.guard.ts       # Guard de autenticación
├── dto/
│   └── login.dto.ts            # Validación de login
├── interfaces/
│   └── auth.interface.ts       # Tipos TypeScript
└── auth.module.ts              # Configuración del módulo
```

## Base de Datos

### Tablas Relacionadas

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES persons(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### user_sessions
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Consultas SQL Utilizadas

#### Validación de Usuario
```sql
SELECT 
  u.id, u.username, u.email, u.password_hash, u.is_active, 
  u.company_id, u.role_id, u.person_id, u.last_login, 
  u.created_at, u.updated_at,
  p.id as person_id, p.first_name, p.last_name, 
  p.email as person_email, p.identification_number,
  c.id as company_id, c.name as company_name,
  r.id as role_id, r.name as role_name, r.permissions
FROM users u
INNER JOIN persons p ON u.person_id = p.id
INNER JOIN companies c ON u.company_id = c.id
INNER JOIN roles r ON u.role_id = r.id
WHERE u.username = $1 AND u.is_active = true
```

#### Actualizar Último Login
```sql
UPDATE users 
SET last_login = CURRENT_TIMESTAMP 
WHERE id = $1
```

#### Crear Sesión
```sql
INSERT INTO user_sessions (user_id, token_hash, expires_at, is_active) 
VALUES ($1, $2, $3, true)
```

## API Endpoints

### POST /api/auth/login

Autentica un usuario con username y password.

**Request Body:**
```typescript
{
  username: string;  // 3-50 caracteres
  password: string;  // mínimo 6 caracteres
}
```

**Response:**
```typescript
{
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    person: {
      firstName: string;
      lastName: string;
    };
    company: {
      id: string;
      name: string;
    };
    role: {
      id: string;
      name: string;
      permissions: object;
    };
  };
}
```

**Códigos de Estado:**
- `200` - Login exitoso
- `400` - Datos de entrada inválidos
- `401` - Credenciales incorrectas o usuario inactivo

### GET /api/auth/profile

Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
{
  id: string;
  username: string;
  email: string;
  person: {
    firstName: string;
    lastName: string;
  };
  company: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
    permissions: object;
  };
}
```

### GET /api/auth/validate

Valida si un token JWT es válido.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
{
  valid: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    company: string;
  };
}
```

### POST /api/auth/logout

Cierra la sesión del usuario (marca la sesión como inactiva).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
{
  message: string;
}
```

## Seguridad

### Hashing de Contraseñas

- Utiliza **bcryptjs** con salt rounds = 10
- Las contraseñas nunca se almacenan en texto plano
- Comparación segura durante el login

```typescript
// Generar hash
const hash = await bcrypt.hash(password, 10);

// Verificar contraseña
const isValid = await bcrypt.compare(password, hash);
```

### JWT (JSON Web Tokens)

**Payload del Token:**
```typescript
{
  sub: string;        // User ID
  username: string;   // Username
  email: string;      // Email
  companyId: string;  // Company ID
  roleId: string;     // Role ID
  roleName: string;   // Role Name
  iat: number;        // Issued At
  exp: number;        // Expiration
}
```

**Configuración:**
- Algoritmo: HS256
- Expiración: 24 horas (configurable)
- Secret: Variable de entorno JWT_SECRET

### Validaciones

#### LoginDto
```typescript
class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
```

### Protección de Rutas

#### Guard Global
```typescript
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
}
```

#### Rutas Públicas
```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Endpoint público
}
```

#### Rutas Protegidas
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: UserWithDetails) {
  // Requiere autenticación
}
```

## Decoradores Personalizados

### @Public()
Marca un endpoint como público (no requiere autenticación).

```typescript
@Public()
@Get('health')
getHealth() {
  return { status: 'ok' };
}
```

### @CurrentUser()
Inyecta el usuario autenticado en el parámetro del método.

```typescript
@Get('profile')
getProfile(@CurrentUser() user: UserWithDetails) {
  return user;
}
```

## Manejo de Errores

### Errores Comunes

- `UnauthorizedException` - Credenciales inválidas o token expirado
- `BadRequestException` - Datos de entrada inválidos
- `ForbiddenException` - Usuario sin permisos suficientes

### Respuestas de Error

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
}
```

## Configuración

### Variables de Entorno

```env
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### Módulo de Configuración

```typescript
JwtModule.registerAsync({
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('jwt.secret'),
    signOptions: {
      expiresIn: configService.get('jwt.expiresIn'),
    },
  }),
  inject: [ConfigService],
})
```

## Testing

### Casos de Prueba Recomendados

1. **Login exitoso con credenciales válidas**
2. **Login fallido con credenciales inválidas**
3. **Login fallido con usuario inactivo**
4. **Validación de token válido**
5. **Validación de token expirado**
6. **Acceso a ruta protegida sin token**
7. **Acceso a ruta protegida con token válido**
8. **Acceso a ruta pública sin token**

### Ejemplo de Test

```typescript
describe('AuthController', () => {
  it('should login with valid credentials', async () => {
    const loginDto = {
      username: 'admin',
      password: 'admin123'
    };
    
    const result = await controller.login(loginDto);
    
    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('user');
    expect(result.user.username).toBe('admin');
  });
});
```

## Próximas Mejoras

1. **Refresh Tokens** - Implementar tokens de renovación
2. **Rate Limiting** - Limitar intentos de login
3. **2FA** - Autenticación de dos factores
4. **Password Policies** - Políticas de contraseñas
5. **Session Management** - Gestión avanzada de sesiones
6. **Audit Logs** - Registro de eventos de seguridad

## Dependencias

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.0",
  "bcryptjs": "^2.4.3",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0"
}
```

## Conclusión

El módulo de autenticación proporciona una base sólida y segura para el sistema StampOut POS. Implementa las mejores prácticas de seguridad y está diseñado para ser escalable y mantenible. La arquitectura modular permite futuras extensiones y mejoras sin afectar el funcionamiento actual del sistema.

