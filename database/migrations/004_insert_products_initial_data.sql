-- Insertar datos iniciales para el módulo de productos

-- Insertar unidades de medida básicas
INSERT INTO units_of_measure (name, code, description) VALUES
('Unidad', 'UND', 'Unidad individual'),
('Kilogramo', 'KG', 'Kilogramo'),
('Gramo', 'GR', 'Gramo'),
('Litro', 'LT', 'Litro'),
('Mililitro', 'ML', 'Mililitro'),
('Metro', 'MT', 'Metro'),
('Centímetro', 'CM', 'Centímetro'),
('Caja', 'CJA', 'Caja o empaque'),
('Paquete', 'PAQ', 'Paquete'),
('Docena', 'DOC', 'Docena (12 unidades)')
ON CONFLICT (code) DO NOTHING;

-- Insertar impuestos básicos (Colombia)
INSERT INTO taxes (name, code, rate, description) VALUES
('IVA 19%', 'IVA19', 0.1900, 'Impuesto al Valor Agregado del 19%'),
('IVA 5%', 'IVA5', 0.0500, 'Impuesto al Valor Agregado del 5%'),
('IVA 0%', 'IVA0', 0.0000, 'Exento de IVA'),
('INC 8%', 'INC8', 0.0800, 'Impuesto Nacional al Consumo del 8%'),
('INC 16%', 'INC16', 0.1600, 'Impuesto Nacional al Consumo del 16%')
ON CONFLICT (code) DO NOTHING;

-- Insertar categorías de ejemplo para la compañía demo
INSERT INTO categories (company_id, name, code, description) 
SELECT 
    c.id,
    'Electrónicos',
    'ELEC',
    'Productos electrónicos y tecnológicos'
FROM companies c 
WHERE c.name = 'StampOut POS Demo'
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO categories (company_id, name, code, description) 
SELECT 
    c.id,
    'Ropa y Accesorios',
    'ROPA',
    'Prendas de vestir y accesorios'
FROM companies c 
WHERE c.name = 'StampOut POS Demo'
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO categories (company_id, name, code, description) 
SELECT 
    c.id,
    'Hogar y Jardín',
    'HOGAR',
    'Artículos para el hogar y jardín'
FROM companies c 
WHERE c.name = 'StampOut POS Demo'
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO categories (company_id, name, code, description) 
SELECT 
    c.id,
    'Alimentos y Bebidas',
    'ALIM',
    'Productos alimenticios y bebidas'
FROM companies c 
WHERE c.name = 'StampOut POS Demo'
ON CONFLICT (company_id, code) DO NOTHING;

-- Insertar subcategorías de ejemplo
INSERT INTO subcategories (category_id, name, code, description)
SELECT 
    cat.id,
    'Smartphones',
    'SMART',
    'Teléfonos inteligentes'
FROM categories cat 
WHERE cat.code = 'ELEC' AND cat.company_id = (SELECT id FROM companies WHERE name = 'StampOut POS Demo')
ON CONFLICT (category_id, code) DO NOTHING;

INSERT INTO subcategories (category_id, name, code, description)
SELECT 
    cat.id,
    'Laptops',
    'LAPTOP',
    'Computadoras portátiles'
FROM categories cat 
WHERE cat.code = 'ELEC' AND cat.company_id = (SELECT id FROM companies WHERE name = 'StampOut POS Demo')
ON CONFLICT (category_id, code) DO NOTHING;

INSERT INTO subcategories (category_id, name, code, description)
SELECT 
    cat.id,
    'Camisetas',
    'CAMIS',
    'Camisetas y polos'
FROM categories cat 
WHERE cat.code = 'ROPA' AND cat.company_id = (SELECT id FROM companies WHERE name = 'StampOut POS Demo')
ON CONFLICT (category_id, code) DO NOTHING;

INSERT INTO subcategories (category_id, name, code, description)
SELECT 
    cat.id,
    'Pantalones',
    'PANT',
    'Pantalones y jeans'
FROM categories cat 
WHERE cat.code = 'ROPA' AND cat.company_id = (SELECT id FROM companies WHERE name = 'StampOut POS Demo')
ON CONFLICT (category_id, code) DO NOTHING;

