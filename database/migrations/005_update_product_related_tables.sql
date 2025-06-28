-- Migración para asegurar la estructura correcta de las tablas categories, subcategories y products

-- Tabla categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, name)
);

-- Tabla subcategories
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, name)
);

-- Modificar la tabla products
DO $$
BEGIN
    -- Añadir columnas created_at y updated_at si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=\'products\' AND column_name=\'created_at\') THEN
        ALTER TABLE products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=\'products\' AND column_name=\'updated_at\') THEN
        ALTER TABLE products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Eliminar la columna deleted_at si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=\'products\' AND column_name=\'deleted_at\') THEN
        ALTER TABLE products DROP COLUMN deleted_at;
    END IF;

    -- Asegurar que las referencias a tablas sean correctas
    -- Eliminar y recrear FKs si es necesario para asegurar que apunten a las tablas correctas
    -- (Esto es un ejemplo, la lógica real podría ser más compleja dependiendo de las FKs existentes)
    -- ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
    -- ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

    -- ALTER TABLE products DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;
    -- ALTER TABLE products ADD CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE;

END
$$;

