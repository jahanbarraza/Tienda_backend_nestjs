const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Configurar axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let authToken = '';

// Función para hacer login y obtener token
async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = response.data.access_token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ Login exitoso');
    return response.data;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Función para probar endpoints de compañías
async function testCompaniesEndpoints() {
  console.log('\n📊 Probando endpoints de Compañías...');
  
  try {
    // 1. Listar compañías
    console.log('\n1. GET /companies - Listar compañías');
    const companiesResponse = await api.get('/companies');
    console.log('✅ Compañías obtenidas:', companiesResponse.data.data.length);
    
    // 2. Obtener compañía específica
    if (companiesResponse.data.data.length > 0) {
      const companyId = companiesResponse.data.data[0].id;
      console.log('\n2. GET /companies/:id - Obtener compañía específica');
      const companyResponse = await api.get(`/companies/${companyId}`);
      console.log('✅ Compañía obtenida:', companyResponse.data.name);
    }
    
    // 3. Crear nueva compañía (solo para Super Admin)
    console.log('\n3. POST /companies - Crear nueva compañía');
    try {
      const newCompanyResponse = await api.post('/companies', {
        name: 'Compañía de Prueba',
        taxId: '900123456-2',
        email: 'prueba@test.com',
        phone: '+57 300 123 4567',
        address: 'Dirección de prueba'
      });
      console.log('✅ Compañía creada:', newCompanyResponse.data.name);
      
      // 4. Actualizar compañía
      const createdCompanyId = newCompanyResponse.data.id;
      console.log('\n4. PATCH /companies/:id - Actualizar compañía');
      const updatedCompanyResponse = await api.patch(`/companies/${createdCompanyId}`, {
        name: 'Compañía de Prueba Actualizada',
        phone: '+57 300 999 8888'
      });
      console.log('✅ Compañía actualizada:', updatedCompanyResponse.data.name);
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️ No tienes permisos para crear/actualizar compañías (esperado para usuarios no Super Admin)');
      } else {
        console.error('❌ Error:', error.response?.data || error.message);
      }
    }
    
    // 5. Probar filtros y paginación
    console.log('\n5. GET /companies?search=demo - Buscar compañías');
    const searchResponse = await api.get('/companies?search=demo&includeStats=true');
    console.log('✅ Búsqueda exitosa, resultados:', searchResponse.data.data.length);
    
  } catch (error) {
    console.error('❌ Error en pruebas de compañías:', error.response?.data || error.message);
  }
}

// Función para probar endpoints de tiendas
async function testStoresEndpoints() {
  console.log('\n🏪 Probando endpoints de Tiendas...');
  
  try {
    // 1. Listar tiendas
    console.log('\n1. GET /stores - Listar tiendas');
    const storesResponse = await api.get('/stores');
    console.log('✅ Tiendas obtenidas:', storesResponse.data.data.length);
    
    // 2. Obtener tienda específica
    if (storesResponse.data.data.length > 0) {
      const storeId = storesResponse.data.data[0].id;
      console.log('\n2. GET /stores/:id - Obtener tienda específica');
      const storeResponse = await api.get(`/stores/${storeId}`);
      console.log('✅ Tienda obtenida:', storeResponse.data.name);
    }
    
    // 3. Crear nueva tienda
    console.log('\n3. POST /stores - Crear nueva tienda');
    try {
      const newStoreResponse = await api.post('/stores', {
        name: 'Tienda de Prueba',
        code: 'TEST001',
        address: 'Dirección de tienda de prueba',
        phone: '+57 300 111 2222',
        email: 'tienda@test.com'
      });
      console.log('✅ Tienda creada:', newStoreResponse.data.name);
      
      // 4. Actualizar tienda
      const createdStoreId = newStoreResponse.data.id;
      console.log('\n4. PATCH /stores/:id - Actualizar tienda');
      const updatedStoreResponse = await api.patch(`/stores/${createdStoreId}`, {
        name: 'Tienda de Prueba Actualizada',
        phone: '+57 300 333 4444'
      });
      console.log('✅ Tienda actualizada:', updatedStoreResponse.data.name);
      
      // 5. Eliminar tienda (soft delete)
      console.log('\n5. DELETE /stores/:id - Eliminar tienda');
      await api.delete(`/stores/${createdStoreId}`);
      console.log('✅ Tienda eliminada (soft delete)');
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Conflicto: Ya existe una tienda con ese código');
      } else {
        console.error('❌ Error:', error.response?.data || error.message);
      }
    }
    
    // 6. Probar filtros y paginación
    console.log('\n6. GET /stores?includeCompany=true&includeStats=true - Tiendas con información completa');
    const detailedStoresResponse = await api.get('/stores?includeCompany=true&includeStats=true');
    console.log('✅ Tiendas con detalles obtenidas:', detailedStoresResponse.data.data.length);
    
  } catch (error) {
    console.error('❌ Error en pruebas de tiendas:', error.response?.data || error.message);
  }
}

// Función para probar validaciones
async function testValidations() {
  console.log('\n🔍 Probando validaciones...');
  
  try {
    // Probar validación de compañía con datos inválidos
    console.log('\n1. Validación de compañía con datos inválidos');
    try {
      await api.post('/companies', {
        name: 'A', // Muy corto
        taxId: '',
        email: 'email-invalido'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validación funcionando correctamente:', error.response.data.message);
      }
    }
    
    // Probar validación de tienda con datos inválidos
    console.log('\n2. Validación de tienda con datos inválidos');
    try {
      await api.post('/stores', {
        name: '', // Vacío
        code: 'A', // Muy corto
        email: 'email-invalido'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validación funcionando correctamente:', error.response.data.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en pruebas de validación:', error.response?.data || error.message);
  }
}

// Función principal
async function runTests() {
  console.log('🚀 Iniciando pruebas del módulo de Organización...');
  
  try {
    // Login
    await login();
    
    // Probar endpoints de compañías
    await testCompaniesEndpoints();
    
    // Probar endpoints de tiendas
    await testStoresEndpoints();
    
    // Probar validaciones
    await testValidations();
    
    console.log('\n✅ Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error general en las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests();

