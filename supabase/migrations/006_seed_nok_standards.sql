-- ============================================================
-- NOK Owner Platform — Seed NOK Standards
-- Migration 006: Standards extracted from "Estandares NOK.xlsx"
-- Source sheets: KIT COCINA + LENCERIA Y TOALLA + cross-space rules
-- ============================================================

-- ============================================================
-- COCINA — Kit Cocina (quantities per 2 pax, scale +2 per extra occupancy)
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  -- Vajilla y utensilios de mesa
  ('cocina', 'utensilios', 'Set cubiertos x16',         1, 1,    'juego',   null,                                              true,  'all', '+2 juego sobre la ocupación máxima'),
  ('cocina', 'utensilios', 'Vaso de vidrio',             4, null, 'unidad',  null,                                              true,  'all', '+2 unidades sobre la ocupación'),
  ('cocina', 'utensilios', 'Copa de vidrio',             4, null, 'unidad',  null,                                              true,  'all', '+2 unidades sobre la ocupación'),
  ('cocina', 'utensilios', 'Aceitero',                   2, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Plato hondo redondo blanco', 4, null, 'unidad',  'Blanco liso, apilable',                           true,  'all', '+2 unidades sobre la ocupación'),
  ('cocina', 'utensilios', 'Plato pando redondo blanco', 4, null, 'unidad',  'Blanco liso, apilable',                           true,  'all', '+2 unidades sobre la ocupación'),
  ('cocina', 'utensilios', 'Plato té redondo blanco',    4, null, 'unidad',  'Blanco liso',                                     true,  'all', '+2 unidades sobre la ocupación'),
  ('cocina', 'utensilios', 'Plato bowl blanco',          4, null, 'unidad',  'Blanco liso',                                     true,  'all', '+2 unidades sobre la ocupación'),
  ('cocina', 'utensilios', 'Taza de café de vidrio',     4, null, 'unidad',  null,                                              true,  'all', '+2 unidades sobre la ocupación'),
  ('cocina', 'utensilios', 'Jarra de vidrio',            1, null, 'unidad',  null,                                              true,  'all', null),
  -- Utensilios de cocina
  ('cocina', 'utensilios', 'Set utensilios 5 piezas',    1, null, 'juego',   null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Set 3 cuchillos',            1, null, 'juego',   null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Tijeras de cocina',          1, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Rallador',                   1, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Exprimidor de limones',      1, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Sacacorcho y destapador',    1, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Set ollas 6 piezas',         1, null, 'juego',   'Inducción si la estufa es de inducción',          true,  'all', null),
  ('cocina', 'utensilios', 'Tabla para cortar',          2, null, 'unidad',  'Sin madera — vidrio templado o polietileno',      true,  'all', 'Prohibido usar tablas de madera'),
  ('cocina', 'utensilios', 'Escurridor de pasta',        1, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Porta cubiertos acrílico',   1, null, 'unidad',  'Sin metálicos en zonas de costa',                 true,  'all', null),
  ('cocina', 'utensilios', 'Portarrollos papel cocina',  1, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Escurridor de platos',       1, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'utensilios', 'Dispensador de lavaloza',    1, null, 'unidad',  null,                                              true,  'all', null),
  -- Limpieza cocina
  ('cocina', 'limpieza',   'Limpión (paños de limpieza)',3, null, 'unidad',  null,                                              true,  'all', null),
  ('cocina', 'limpieza',   'Caneca de basura cocina',    1, null, 'unidad',  'Sin metálicos en zonas de costa',                 true,  'all', null),
  ('cocina', 'limpieza',   'Recogedor y escoba',         1, null, 'unidad',  null,                                              true,  'all', null);

-- ============================================================
-- GENERAL / LAVANDERIA — Items que aplican al apartamento completo
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  ('general',     'limpieza',        'Mesa de planchar',                  1, null, 'unidad', null,                                            true,  'all', null),
  ('general',     'limpieza',        'Plancha',                           1, null, 'unidad', null,                                            true,  'all', null),
  ('general',     'limpieza',        'Ganchos de ropa madera (x5)',       2, null, 'juego',  '2 kits por persona de ocupación',               true,  'all', null),
  ('general',     'tecnologia',      'Smart lock TTlock',                 1, null, 'unidad', null,                                            true,  'all', null),
  ('general',     'tecnologia',      'Smart TV 50 pulgadas mínimo',       1, null, 'unidad', 'Mínimo 50". Borde inferior a 1.06 m del suelo',true,  'all', '16 cm de distancia al entrepaño'),
  ('general',     'tecnologia',      'Soporte TV (fijo o flexible)',      1, null, 'unidad', null,                                            true,  'all', null),
  ('general',     'tecnologia',      'Internet 300 megas',                1, null, 'servicio',null,                                           true,  'all', null),
  ('lavanderia',  'electrodomesticos','Lavadora secadora Samsung 11.5 kg',1, null, 'unidad', null,                                            true,  'all', null),
  ('general',     'decoracion',      'Manta decorativa',                  1, null, 'unidad', null,                                            true,  'all', null),
  ('general',     'decoracion',      'Manta térmica',                     1, null, 'unidad', null,                                            false, 'CO',  'Solo Bogotá / mercado frío');

-- ============================================================
-- ELECTRODOMÉSTICOS cocina
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  ('cocina', 'electrodomesticos', 'Cafetera eléctrica',               1, null, 'unidad', null,                                  true,  'all', null),
  ('cocina', 'electrodomesticos', 'Licuadora',                        1, null, 'unidad', null,                                  true,  'all', null),
  ('cocina', 'electrodomesticos', 'Microondas',                       1, null, 'unidad', null,                                  true,  'all', null),
  ('cocina', 'electrodomesticos', 'Nevera 245 litros mínimo',         1, null, 'unidad', 'Mínimo 245 litros',                   true,  'all', null),
  ('cocina', 'electrodomesticos', 'Hervidor de agua eléctrico',       1, null, 'unidad', null,                                  true,  'all', null),
  ('cocina', 'electrodomesticos', 'Detector sensor monóxido de carbono', 1, null, 'unidad', null,                               false, 'all', 'Solo si la estufa es a gas'),
  ('cocina', 'electrodomesticos', 'Secador de pelo empotrado en muro',1, null, 'unidad', null,                                  false, 'CO',  'Estándar solo en Bogotá; recomendado en RD');

-- ============================================================
-- BAÑO — Dispensadores y accesorios por baño
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  ('baño', 'accesorios', 'Cepillo de baño',                        1, null, 'por baño', null,                                   true,  'all', null),
  ('baño', 'accesorios', 'Caneca de baño',                         1, null, 'por baño', 'Sin metálicos en zonas de costa',       true,  'all', null),
  ('baño', 'accesorios', 'Envase dispensador acondicionador NOK',  1, null, 'por baño', 'Implementado por NOK',                  true,  'all', null),
  ('baño', 'accesorios', 'Envase dispensador jabón de manos NOK',  1, null, 'por baño', 'Implementado por NOK',                  true,  'all', null),
  ('baño', 'accesorios', 'Envase dispensador jabón de ducha NOK',  1, null, 'por baño', 'Implementado por NOK',                  true,  'all', null),
  ('baño', 'accesorios', 'Envase dispensador shampoo NOK',         1, null, 'por baño', 'Implementado por NOK',                  true,  'all', null);

-- ============================================================
-- HABITACIÓN — Lencería (cantidades por cama)
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  ('habitacion', 'cama',    'Colchón tipo hotelero',                    1, null, 'por cama', 'King, Queen, Doble, Semidoble o Sencillo',                               true,  'all', 'Preferir Queen o King'),
  ('habitacion', 'cama',    'Basecama con patas de madera',             1, null, 'por cama', 'Evitar patas metálicas',                                                 true,  'all', null),
  ('habitacion', 'cama',    'Almohada premium de plumas',               2, null, 'por cama', 'King 90x50 cm / resto 70x50 cm — 250 hilos',                             true,  'all', null),
  ('habitacion', 'cama',    'Almohada fibra siliconada',                2, null, 'por cama', 'King 90x50 cm / resto 70x50 cm — 250 hilos',                             true,  'all', null),
  ('habitacion', 'cama',    'Protector de almohada',                    8, null, 'por cama', null,                                                                      true,  'all', null),
  ('habitacion', 'cama',    'Funda de almohada',                        6, null, 'por cama', '250 hilos, blanco liso, polyalgodón',                                    true,  'all', null),
  ('habitacion', 'cama',    'Protector impermeable de colchón',         2, null, 'por cama', null,                                                                      true,  'all', null),
  ('habitacion', 'cama',    'Juego de sábanas',                         3, null, 'por cama', '250 hilos, blanco liso, polyalgodón',                                    true,  'all', '3 juegos para rotación de lavado'),
  ('habitacion', 'cama',    'Plumón de microfibra',                     2, null, 'por cama', '100% poliéster 300 gr',                                                   true,  'all', null),
  ('habitacion', 'cama',    'Duvet',                                    2, null, 'por cama', '250 hilos, blanco liso, polyalgodón',                                    true,  'all', null),
  -- Mesas de noche y closet
  ('habitacion', 'muebles', 'Mesa de noche',                            2, null, 'por cama', '2 mesas de noche por cama (una a cada lado)',                            true,  'all', null),
  ('habitacion', 'muebles', 'Closet o gavetero',                        1, null, 'por habitación', null,                                                               true,  'all', null),
  ('habitacion', 'muebles', 'Lámpara de noche (sobre mesa de noche)',   2, null, 'por cama', 'Altura: 50 cm. Una por mesa de noche',                                   true,  'all', null),
  ('habitacion', 'tecnologia','A/C o ventilador',                       1, null, 'por habitación', null,                                                               true,  'all', null),
  ('habitacion', 'decoracion','Blackout en ventanas',                   1, null, 'por habitación', 'Blackout en TODAS las ventanas de habitaciones',                   true,  'all', null);

-- ============================================================
-- BAÑO — Toallas (cantidades por cama / por baño)
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  ('baño', 'toallas', 'Toalla de cuerpo (con bordado NOK)',  6, null, 'por cama', '100% algodón, 620g, blanca, 70x140 cm',               true,  'all', 'Con bordado de branding NOK'),
  ('baño', 'toallas', 'Toalla de mano',                      3, null, 'por baño', '100% algodón, 620g, blanca, 50x90 cm',                true,  'all', null),
  ('baño', 'toallas', 'Toalla de suelo (bathmat)',           3, null, 'por baño', '100% algodón, 800g, blanca, 50x80 cm',                true,  'all', null),
  ('baño', 'toallas', 'Toalla de piscina',                   4, null, 'por cama', '100% algodón, 500g, blanca, 90x170 cm',               false, 'all', 'Solo si la propiedad tiene piscina');

-- ============================================================
-- SALA — Estándares de sala según ocupación
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  ('sala', 'muebles',    'Sofá (plazas coherentes con ocupación)',    1, null, 'unidad',      'Mín 2 plazas. Sofá L para salas grandes. Telas de alto tráfico', true,  'all', 'Prohibido terciopelo, satinado, velvet'),
  ('sala', 'muebles',    'Mesa de centro',                           1, null, 'unidad',      null,                                                              true,  'all', null),
  ('sala', 'muebles',    'Tapete',                                   1, null, 'unidad',      'Bajo patas posteriores del sofá',                                 true,  'all', null),
  ('sala', 'decoracion', 'Solar screen en ventanas de sala',         1, null, 'por ventana', null,                                                              true,  'all', null),
  ('sala', 'decoracion', 'Plantas naturales',                        1, null, 'unidad',      'Solo naturales — PROHIBIDAS artificiales',                        false, 'all', null);

-- ============================================================
-- COMEDOR — Dimensiones según número de puestos
-- ============================================================
insert into public.nok_standards (space_type, category, item_name, quantity_min, quantity_max, unit, size_notes, is_required, market, notes) values
  ('sala', 'muebles', 'Mesa de comedor',    1, null, 'unidad',
   '2 pax: circular 80cm | 4 pax: rectangular 80x120cm | 6 pax: 90x160cm | 8 pax: 90x200cm | 10 pax: 90x250cm',
   true, 'all', 'Coherente con la ocupación máxima del apartamento'),
  ('sala', 'muebles', 'Sillas de comedor',  2, null, 'unidad',
   'Cantidad según puestos: al menos 1 silla por puesto de ocupación',
   true, 'all', null);
