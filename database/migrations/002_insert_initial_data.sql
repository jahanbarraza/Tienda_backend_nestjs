-- Insertar tipos de identificación
INSERT INTO identification_types (name, code, description) VALUES
('Cédula de Ciudadanía', 'CC', 'Documento de identidad para ciudadanos colombianos'),
('Cédula de Extranjería', 'CE', 'Documento de identidad para extranjeros residentes'),
('Pasaporte', 'PA', 'Documento de identidad internacional'),
('NIT', 'NIT', 'Número de Identificación Tributaria'),
('Tarjeta de Identidad', 'TI', 'Documento de identidad para menores de edad')
ON CONFLICT (code) DO NOTHING;

-- Insertar roles básicos
INSERT INTO roles (name, description, permissions) VALUES
('Super Admin', 'Administrador con acceso completo al sistema', '{"all": true}'),
('Admin', 'Administrador de compañía', '{"company_management": true, "user_management": true, "reports": true}'),
('Manager', 'Gerente de tienda', '{"store_management": true, "sales": true, "inventory": true, "reports": true}'),
('Cashier', 'Cajero', '{"sales": true, "basic_inventory": true}'),
('Inventory', 'Encargado de inventario', '{"inventory": true, "products": true}')
ON CONFLICT (name) DO NOTHING;

-- Insertar compañía por defecto
INSERT INTO companies (name, tax_id, email, phone, address) VALUES
('StampOut POS Demo', '900123456-1', 'demo@stampoutpos.com', '+57 300 123 4567', 'Calle 123 #45-67, Bogotá, Colombia')
ON CONFLICT (tax_id) DO NOTHING;

-- Obtener IDs para referencias
DO $$
DECLARE
    demo_company_id UUID;
    super_admin_role_id UUID;
    cc_type_id UUID;
BEGIN
    -- Obtener IDs necesarios
    SELECT id INTO demo_company_id FROM companies WHERE tax_id = '900123456-1';
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin';
    SELECT id INTO cc_type_id FROM identification_types WHERE code = 'CC';
    
    -- Insertar tienda por defecto
    INSERT INTO stores (company_id, name, code, address, phone, email) VALUES
    (demo_company_id, 'Tienda Principal', 'MAIN', 'Calle 123 #45-67, Bogotá, Colombia', '+57 300 123 4567', 'tienda@stampoutpos.com')
    ON CONFLICT (company_id, code) DO NOTHING;
    
    -- Insertar persona administrador
    INSERT INTO persons (identification_type_id, identification_number, first_name, last_name, email, phone) VALUES
    (cc_type_id, '12345678', 'Admin', 'Sistema', 'admin@stampoutpos.com', '+57 300 123 4567')
    ON CONFLICT (identification_type_id, identification_number) DO NOTHING;
    
    -- Insertar usuario administrador
    INSERT INTO users (person_id, company_id, role_id, username, password_hash, email) 
    SELECT 
        p.id,
        demo_company_id,
        super_admin_role_id,
        'admin',
        '$2b$10$Blb5wWl31A11ad5CVkR2Ke4Vvdy/hkaqkvc86wKJDVK1xqVHXgGdW', -- password: admin123
        'admin@stampoutpos.com'
    FROM persons p 
    WHERE p.identification_number = '12345678' AND p.identification_type_id = cc_type_id
    ON CONFLICT (username) DO NOTHING;
END $$;

