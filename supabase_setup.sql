-- Crear la tabla de placas
CREATE TABLE public.plates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    "order" INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.plates ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso a usuarios autenticados
-- Como solo son 2 personas, una política simple de 'authenticated' es suficiente
CREATE POLICY "Permitir todo a usuarios autenticados" 
ON public.plates 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
