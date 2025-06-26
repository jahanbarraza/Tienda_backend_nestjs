const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = 'admin123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Verificar que el hash funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification:', isValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

generatePasswordHash();

