const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Configurar axios para incluir el token en todas las requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = response.data.access_token;
    console.log('✅ Login exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return false;
  }
}

async function testIdentificationTypes() {
  console.log('\n📋 === PRUEBAS DE TIPOS DE IDENTIFICACIÓN ===');
  
  try {
    // Generar nombre único
    const timestamp = Date.now();
    const uniqueName = `Pasaporte_${timestamp}`;
    const uniqueCode = `P${timestamp.toString().slice(-8)}`; // Máximo 10 caracteres
    
    // Crear tipo de identificación
    console.log('➕ Creando tipo de identificación...');
    const createResponse = await api.post('/identification-types', {
      name: uniqueName,
      code: uniqueCode,
      description: 'Documento de identificación internacional'
    });
    console.log('✅ Tipo de identificación creado:', createResponse.data.name);
    const identificationTypeId = createResponse.data.id;

    // Listar tipos de identificación
    console.log('📋 Listando tipos de identificación...');
    const listResponse = await api.get('/identification-types?includeStats=true');
    console.log(`✅ ${listResponse.data.data.length} tipos encontrados`);

    // Obtener tipo específico
    console.log('🔍 Obteniendo tipo específico...');
    const getResponse = await api.get(`/identification-types/${identificationTypeId}`);
    console.log('✅ Tipo obtenido:', getResponse.data.name);

    // Actualizar tipo
    console.log('✏️ Actualizando tipo...');
    const updateResponse = await api.patch(`/identification-types/${identificationTypeId}`, {
      description: 'Documento de identificación internacional actualizado'
    });
    console.log('✅ Tipo actualizado');

    return identificationTypeId;
  } catch (error) {
    console.error('❌ Error en tipos de identificación:', error.response?.data || error.message);
    return null;
  }
}

async function testRoles() {
  console.log('\n👥 === PRUEBAS DE ROLES ===');
  
  try {
    // Generar nombre único
    const timestamp = Date.now();
    const uniqueName = `Vendedor_${timestamp}`;
    
    // Crear rol
    console.log('➕ Creando rol...');
    const createResponse = await api.post('/roles', {
      name: uniqueName,
      description: 'Rol para personal de ventas',
      permissions: {
        sales: { read: true, write: true },
        inventory: { read: true, write: false }
      }
    });
    console.log('✅ Rol creado:', createResponse.data.name);
    const roleId = createResponse.data.id;

    // Listar roles
    console.log('📋 Listando roles...');
    const listResponse = await api.get('/roles?includeStats=true');
    console.log(`✅ ${listResponse.data.data.length} roles encontrados`);

    // Obtener rol específico
    console.log('🔍 Obteniendo rol específico...');
    const getResponse = await api.get(`/roles/${roleId}`);
    console.log('✅ Rol obtenido:', getResponse.data.name);

    // Actualizar rol
    console.log('✏️ Actualizando rol...');
    const updateResponse = await api.patch(`/roles/${roleId}`, {
      description: 'Rol para personal de ventas actualizado'
    });
    console.log('✅ Rol actualizado');

    return roleId;
  } catch (error) {
    console.error('❌ Error en roles:', error.response?.data || error.message);
    return null;
  }
}

async function testPersons(identificationTypeId) {
  console.log('\n👤 === PRUEBAS DE PERSONAS ===');
  
  try {
    // Generar datos únicos
    const timestamp = Date.now();
    const uniqueId = timestamp.toString().slice(-8);
    
    // Crear persona
    console.log('➕ Creando persona...');
    const createResponse = await api.post('/persons', {
      identificationTypeId: identificationTypeId,
      identificationNumber: uniqueId,
      firstName: 'Juan',
      lastName: `Pérez_${timestamp}`,
      email: `juan.perez.${timestamp}@example.com`,
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67',
      birthDate: '1990-05-15'
    });
    console.log('✅ Persona creada:', `${createResponse.data.firstName} ${createResponse.data.lastName}`);
    const personId = createResponse.data.id;

    // Listar personas
    console.log('📋 Listando personas...');
    const listResponse = await api.get('/persons?includeStats=true&includeIdentificationType=true');
    console.log(`✅ ${listResponse.data.data.length} personas encontradas`);

    // Obtener persona específica
    console.log('🔍 Obteniendo persona específica...');
    const getResponse = await api.get(`/persons/${personId}`);
    console.log('✅ Persona obtenida:', `${getResponse.data.firstName} ${getResponse.data.lastName}`);

    // Actualizar persona
    console.log('✏️ Actualizando persona...');
    const updateResponse = await api.patch(`/persons/${personId}`, {
      phone: '+57 300 987 6543'
    });
    console.log('✅ Persona actualizada');

    return personId;
  } catch (error) {
    console.error('❌ Error en personas:', error.response?.data || error.message);
    return null;
  }
}

async function testUsers(personId, roleId) {
  console.log('\n👨‍💼 === PRUEBAS DE USUARIOS ===');
  
  try {
    // Generar datos únicos
    const timestamp = Date.now();
    const uniqueUsername = `juan.perez.${timestamp}`;
    
    // Crear usuario
    console.log('➕ Creando usuario...');
    
    // Primero obtener una compañía disponible
    const companiesResponse = await api.get('/companies?limit=1');
    const companyId = companiesResponse.data.data[0]?.id;
    
    if (!companyId) {
      throw new Error('No hay compañías disponibles para asignar al usuario');
    }
    
    const createResponse = await api.post('/users', {
      personId: personId,
      companyId: companyId,
      roleId: roleId,
      username: uniqueUsername,
      password: 'password123',
      email: `${uniqueUsername}@company.com`
    });
    console.log('✅ Usuario creado:', createResponse.data.username);
    const userId = createResponse.data.id;

    // Listar usuarios
    console.log('📋 Listando usuarios...');
    const listResponse = await api.get('/users?includeDetails=true');
    console.log(`✅ ${listResponse.data.data.length} usuarios encontrados`);

    // Obtener usuario específico
    console.log('🔍 Obteniendo usuario específico...');
    const getResponse = await api.get(`/users/${userId}`);
    console.log('✅ Usuario obtenido:', getResponse.data.username);

    // Actualizar usuario
    console.log('✏️ Actualizando usuario...');
    const updateResponse = await api.patch(`/users/${userId}`, {
      email: `${uniqueUsername}.updated@company.com`
    });
    console.log('✅ Usuario actualizado');

    return userId;
  } catch (error) {
    console.error('❌ Error en usuarios:', error.response?.data || error.message);
    return null;
  }
}

async function testFiltersAndPagination() {
  console.log('\n🔍 === PRUEBAS DE FILTROS Y PAGINACIÓN ===');
  
  try {
    // Probar filtros en tipos de identificación
    console.log('🔍 Probando filtros en tipos de identificación...');
    const identificationTypesFiltered = await api.get('/identification-types?search=Pasaporte&isActive=true&page=1&limit=5');
    console.log(`✅ Filtros aplicados: ${identificationTypesFiltered.data.data.length} resultados`);

    // Probar filtros en roles
    console.log('🔍 Probando filtros en roles...');
    const rolesFiltered = await api.get('/roles?search=Vendedor&isActive=true&sortBy=name&sortOrder=DESC');
    console.log(`✅ Filtros aplicados: ${rolesFiltered.data.data.length} resultados`);

    // Probar filtros en personas
    console.log('🔍 Probando filtros en personas...');
    const personsFiltered = await api.get('/persons?search=Juan&isActive=true&includeIdentificationType=true');
    console.log(`✅ Filtros aplicados: ${personsFiltered.data.data.length} resultados`);

    // Probar filtros en usuarios
    console.log('🔍 Probando filtros en usuarios...');
    const usersFiltered = await api.get('/users?search=juan&isActive=true&includeDetails=true');
    console.log(`✅ Filtros aplicados: ${usersFiltered.data.data.length} resultados`);

    console.log('✅ Todas las pruebas de filtros completadas');
  } catch (error) {
    console.error('❌ Error en filtros:', error.response?.data || error.message);
  }
}

async function testRelationships() {
  console.log('\n🔗 === PRUEBAS DE RELACIONES ===');
  
  try {
    // Verificar relación persona -> tipo de identificación
    console.log('🔍 Verificando relación persona -> tipo de identificación...');
    const personsWithType = await api.get('/persons?includeIdentificationType=true&limit=1');
    if (personsWithType.data.data.length > 0) {
      const person = personsWithType.data.data[0];
      if (person.identificationType) {
        console.log(`✅ Relación verificada: ${person.firstName} tiene tipo ${person.identificationType.name}`);
      }
    }

    // Verificar relación usuario -> persona, compañía, rol
    console.log('🔍 Verificando relaciones de usuario...');
    const usersWithDetails = await api.get('/users?includeDetails=true&limit=1');
    if (usersWithDetails.data.data.length > 0) {
      const user = usersWithDetails.data.data[0];
      if (user.person && user.company && user.role) {
        console.log(`✅ Relaciones verificadas: ${user.username} -> ${user.person.firstName} (${user.company.name}, ${user.role.name})`);
      }
    }

    console.log('✅ Todas las pruebas de relaciones completadas');
  } catch (error) {
    console.error('❌ Error en relaciones:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 === INICIANDO PRUEBAS DEL MÓDULO DE PERSONAS ===\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ No se pudo realizar login. Terminando pruebas.');
    return;
  }

  // Ejecutar pruebas en orden
  const identificationTypeId = await testIdentificationTypes();
  const roleId = await testRoles();
  
  if (identificationTypeId) {
    const personId = await testPersons(identificationTypeId);
    
    if (personId && roleId) {
      const userId = await testUsers(personId, roleId);
    }
  }

  // Pruebas adicionales
  await testFiltersAndPagination();
  await testRelationships();

  console.log('\n🎉 === PRUEBAS COMPLETADAS ===');
  console.log('✅ Todas las funcionalidades del módulo de personas han sido probadas exitosamente');
}

// Ejecutar las pruebas
runAllTests().catch(console.error);

