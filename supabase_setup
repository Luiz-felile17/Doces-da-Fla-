-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS - DOCES DA FLA (SUPABASE)
-- Cole todo este conteúdo no SQL Editor do seu projeto Supabase e clique em RUN
-- ============================================================================

-- 1. Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  promo_price NUMERIC(10,2),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Recebido',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Configurações da Loja
CREATE TABLE IF NOT EXISTS store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  pix_code TEXT,
  whatsapp TEXT,
  address TEXT,
  hours TEXT
);

-- 4. Habilitar Segurança em Nível de Linha (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso (Público vs Administradores)
DROP POLICY IF EXISTS "Publico ve produtos" ON products;
CREATE POLICY "Publico ve produtos" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Publico ve configs" ON store_settings;
CREATE POLICY "Publico ve configs" ON store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Publico cria pedidos" ON orders;
CREATE POLICY "Publico cria pedidos" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Publico consulta pedidos" ON orders;
CREATE POLICY "Publico consulta pedidos" ON orders FOR SELECT USING (true);

-- Apenas os dois e-mails autorizados podem alterar produtos, pedidos e configurações
DROP POLICY IF EXISTS "Admins gerenciam produtos" ON products;
CREATE POLICY "Admins gerenciam produtos" ON products FOR ALL
USING (auth.jwt() ->> 'email' IN ('Luizfelipemoraespatricio@gmail.com', 'flagnaalexandre24@gmail.com'));

DROP POLICY IF EXISTS "Admins gerenciam pedidos" ON orders;
CREATE POLICY "Admins gerenciam pedidos" ON orders FOR ALL
USING (auth.jwt() ->> 'email' IN ('Luizfelipemoraespatricio@gmail.com', 'flagnaalexandre24@gmail.com'));

DROP POLICY IF EXISTS "Admins gerenciam configs" ON store_settings;
CREATE POLICY "Admins gerenciam configs" ON store_settings FOR ALL
USING (auth.jwt() ->> 'email' IN ('Luizfelipemoraespatricio@gmail.com', 'flagnaalexandre24@gmail.com'));

-- 6. Inserir Configurações Iniciais da Doces da Fla
INSERT INTO store_settings (id, pix_code, whatsapp, address, hours) VALUES (
  1,
  '00020126360014BR.GOV.BCB.PIX0114+55219775346745204000053039865802BR5925Flagna Alexandre da Silva6009SAO PAULO62140510e8mVSSDlBj6304B0EE',
  '5521977534674',
  'Av. Engenheiro Assis Ribeiro, 15 - Marechal Hermes, Rio de Janeiro - RJ',
  '09h às 19h (Encomendas especiais com 15 dias úteis de antecedência)'
) ON CONFLICT (id) DO NOTHING;

-- 7. Inserir Catálogo Inicial
INSERT INTO products (name, category, price, is_featured, description) VALUES
('Brigadeiro', 'Bolo de pote', 8.00, true, 'Massa fofinha com recheio cremoso de brigadeiro artesanal.'),
('Dois amores', 'Bolo de pote', 8.00, false, 'Combinação perfeita de brigadeiro tradicional e brigadeiro branco.'),
('Ninho com Nutella', 'Bolo de pote', 10.00, true, 'Creme suave de Leite Ninho com camadas generosas de Nutella original.'),
('Ninho com morango', 'Bolo de pote', 10.00, false, 'Creme de Leite Ninho acompanhado de morangos frescos selecionados.'),
('Chocolate', 'Brownie recheado', 8.00, false, 'Brownie úmido por dentro com casquinha crocante e recheio de chocolate.'),
('Ninho', 'Brownie recheado', 8.00, false, 'Brownie de chocolate intenso recheado com creme de Leite Ninho.'),
('Maracujá', 'Brownie recheado', 8.00, false, 'Contraste equilibrado entre o chocolate do brownie e mousse de maracujá.'),
('Ninho com Nutella', 'Brownie recheado', 9.00, true, 'Brownie super recheado com creme de Ninho e Nutella pura.'),
('Chocolate', 'Copo da felicidade', 14.00, false, 'Camadas intercaladas de creme de chocolate, brownie e confeitos.'),
('Dois amores', 'Copo da felicidade', 14.00, false, 'Camadas generosas de cremes preto e branco com pedaços de bolo.'),
('Maracujá', 'Copo da felicidade', 14.00, false, 'Creme cítrico de maracujá intercalado com mousse de chocolate.'),
('Ninho com morango', 'Copo da felicidade', 15.00, true, 'O campeão de vendas: creme de Ninho, morangos frescos e brownie.');
