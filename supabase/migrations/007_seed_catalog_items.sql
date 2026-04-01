-- ============================================================
-- NOK Owner Platform — Seed Catalog Items
-- Migration 007: Products from BASE sheets of both market files
-- COL = Colombia (COP) | DO = República Dominicana (DOP)
-- ============================================================

-- ============================================================
-- REPÚBLICA DOMINICANA (DOP) — From V1_PPTO_COT_EXPRESS_RD_PREMIUM
-- ============================================================

-- Kit Cocina — RD
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Set cubiertos x16',              'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 1395,   true,  null),
  ('Vaso de vidrio',                 'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 59,     true,  null),
  ('Copa de vidrio',                 'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 99,     true,  null),
  ('Aceitero',                       'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 275,    true,  null),
  ('Kit de especias',                'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 275,    false, null),
  ('Set protectores para ollas',     'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 249,    false, null),
  ('Plato hondo redondo blanco',     'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 80,     true,  null),
  ('Plato pando redondo blanco',     'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 80,     true,  null),
  ('Plato té redondo blanco',        'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 80,     true,  null),
  ('Plato bowl blanco',              'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 80,     true,  null),
  ('Taza de café de vidrio',         'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 80,     true,  null),
  ('Jarra de vidrio',                'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 595,    true,  null),
  ('Set utensilios 5 piezas',        'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 575,    true,  null),
  ('Set 3 cuchillos',                'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 595,    true,  null),
  ('Tijeras de cocina',              'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 200,    true,  null),
  ('Rallador',                       'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 275,    true,  null),
  ('Exprimidor de limones',          'JUMBO',  'cocina',          'cocina',  'DO', 'DOP', 280,    true,  null),
  ('Sacacorcho y destapador',        'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 345,    true,  null),
  ('Colador',                        'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 200,    false, null),
  ('Abrelatas',                      'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 495,    false, null),
  ('Set ollas 6 piezas',             'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 5195,   true,  null),
  ('Set ollas 6 piezas inducción',   'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 6000,   false, 'Solo si estufa de inducción'),
  ('Bol grande',                     'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 695,    false, null),
  ('Paños de limpiar (limpión)',     'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 250,    true,  null),
  ('Tabla para cortar',              'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 200,    true,  'Sin madera'),
  ('Ganchos de ropa madera x5',     'IKEA',   'general',         'general', 'DO', 'DOP', 500,    true,  null),
  ('Porta cubiertos acrílico',       'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 200,    true,  null),
  ('Portarrollos papel cocina',      'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 100,    true,  null),
  ('Zafacón / caneca cocina',        'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 1500,   true,  'Sin metálicos en costas'),
  ('Escurridor de platos',           'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 995,    true,  null),
  ('Recogedor y escoba',             'JUMBO',  'general',         'general', 'DO', 'DOP', 400,    true,  null),
  ('Dispensador lavaloza',           'IKEA',   'cocina',          'cocina',  'DO', 'DOP', 275,    true,  null),
  ('Mesa de planchar',               'IKEA',   'general',         'general', 'DO', 'DOP', 700,    true,  null),
  ('Cepillo de baño',                'JUMBO',  'baño',            'baño',    'DO', 'DOP', 120,    true,  null),
  ('Envase dispensador NOK',         'NOK',    'baño',            'baño',    'DO', 'DOP', 400,    true,  'x4 tipos: acondicionador, jabón manos, jabón ducha, shampoo'),
  ('Zafacón / caneca baño',          'JUMBO',  'baño',            'baño',    'DO', 'DOP', 1085,   true,  'Sin metálicos en costas'),
  ('Manta decorativa',               'IKEA',   'general',         'general', 'DO', 'DOP', 1095,   true,  null),
  ('Manta térmica',                  'IKEA',   'general',         'general', 'DO', 'DOP', 695,    false, null),
  ('Tendedero',                      'IKEA',   'general',         'lavanderia','DO','DOP',1200,   false, null),
  ('Suape (trapeador)',               'JUMBO',  'general',         'general', 'DO', 'DOP', 300,    false, null),
  ('Cubeta de limpieza',             'JUMBO',  'general',         'general', 'DO', 'DOP', 250,    false, null);

-- Electrodomésticos — RD
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Cafetera eléctrica',                 'JUMBO',   'electrodomesticos', 'cocina',     'DO', 'DOP', 3000,   true,  null),
  ('Hervidor de agua eléctrico',         'JUMBO',   'electrodomesticos', 'cocina',     'DO', 'DOP', 1600,   true,  null),
  ('Licuadora',                          'JUMBO',   'electrodomesticos', 'cocina',     'DO', 'DOP', 3500,   true,  null),
  ('Secador de pelo empotrado en muro',  'NOK',     'electrodomesticos', 'baño',       'DO', 'DOP', 3000,   false, null),
  ('Plancha de ropa',                    'JUMBO',   'electrodomesticos', 'general',    'DO', 'DOP', 2000,   true,  null),
  ('Lavadora secadora Samsung 11.5 kg',  'CORRIPIO','electrodomesticos', 'lavanderia', 'DO', 'DOP', 60000,  true,  null),
  ('Microondas',                         'CORRIPIO','electrodomesticos', 'cocina',     'DO', 'DOP', 8000,   true,  null),
  ('Nevera 245 litros',                  'CORRIPIO','electrodomesticos', 'cocina',     'DO', 'DOP', 46000,  true,  null),
  ('Ventilador de torre',                'CORRIPIO','electrodomesticos', 'general',    'DO', 'DOP', 5000,   false, null),
  ('Smart lock TTlock',                  'NOK',     'tecnologia',        'general',    'DO', 'DOP', 12000,  true,  null),
  ('Detector monóxido de carbono',       'NOK',     'tecnologia',        'cocina',     'DO', 'DOP', 0,      false, 'Solo si estufa a gas'),
  ('Soporte TV flexible 23"-55"',        'CORRIPIO','tecnologia',        'general',    'DO', 'DOP', 1600,   false, null),
  ('Soporte TV fijo 37"-80"',            'CORRIPIO','tecnologia',        'general',    'DO', 'DOP', 795,    true,  null),
  ('Smart TV 50 pulgadas',               'CORRIPIO','tecnologia',        'general',    'DO', 'DOP', 47000,  true,  null),
  ('Smart TV 55 pulgadas',               'CORRIPIO','tecnologia',        'general',    'DO', 'DOP', 41600,  false, null),
  ('Smart TV 65 pulgadas',               'CORRIPIO','tecnologia',        'general',    'DO', 'DOP', 65900,  false, null);

-- Sala / Muebles — RD (ITALICA)
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Sofá 2 puestos',           'ITALICA', 'sala', 'sala', 'DO', 'DOP', 89880,  false, 'Telas de alto tráfico. Prohibido terciopelo/velvet'),
  ('Sofá 3 puestos',           'ITALICA', 'sala', 'sala', 'DO', 'DOP', 115560, true,  'Telas de alto tráfico'),
  ('Sofá en L',                'ITALICA', 'sala', 'sala', 'DO', 'DOP', 141240, false, 'Para salas grandes'),
  ('Poltrona / sillón',        'ITALICA', 'sala', 'sala', 'DO', 'DOP', 43656,  false, null),
  ('Mesa de centro',           'ITALICA', 'sala', 'sala', 'DO', 'DOP', 22470,  true,  null),
  ('Tapete sala pequeño',      'ITALICA', 'sala', 'sala', 'DO', 'DOP', 11235,  true,  'Bajo patas posteriores del sofá'),
  ('Tapete sala grande',       'ITALICA', 'sala', 'sala', 'DO', 'DOP', 22470,  false, null),
  ('Mesa de comedor 4 puestos','ITALICA', 'comedor','sala','DO', 'DOP', 35000,  true,  '80x120 cm'),
  ('Mesa de comedor 6 puestos','ITALICA', 'comedor','sala','DO', 'DOP', 55000,  false, '90x160 cm'),
  ('Silla de comedor',         'ITALICA', 'comedor','sala','DO', 'DOP', 9500,   true,  null);

-- Lencería / Cama — RD (ITALICA + ONATEXTILES)
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Colchón tipo hotelero King',      'ITALICA',     'lenceria', 'habitacion', 'DO', 'DOP', 57780, true,  null),
  ('Colchón tipo hotelero Queen',     'ITALICA',     'lenceria', 'habitacion', 'DO', 'DOP', 48150, true,  null),
  ('Colchón tipo hotelero Doble',     'ITALICA',     'lenceria', 'habitacion', 'DO', 'DOP', 41730, true,  null),
  ('Colchón tipo hotelero Twin',      'ITALICA',     'lenceria', 'habitacion', 'DO', 'DOP', 19000, true,  null),
  ('Almohada premium plumas King',    'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 1415,  true,  '90x50 cm, 250 hilos'),
  ('Almohada premium plumas Queen',   'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 1218,  true,  '70x50 cm, 250 hilos'),
  ('Almohada fibra siliconada',       'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 900,   true,  null),
  ('Juego de sábanas King',           'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 5030,  true,  '250 hilos, blanco liso, polyalgodón'),
  ('Juego de sábanas Queen',          'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 4482,  true,  '250 hilos, blanco liso, polyalgodón'),
  ('Juego de sábanas Doble',          'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 4069,  true,  '250 hilos, blanco liso, polyalgodón'),
  ('Plumón microfibra',               'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 2500,  true,  '100% poliéster 300 gr'),
  ('Duvet blanco liso',               'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 3200,  true,  '250 hilos, blanco, polyalgodón'),
  ('Protector impermeable colchón',   'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 1800,  true,  null),
  ('Protector de almohada',           'ONATEXTILES', 'lenceria', 'habitacion', 'DO', 'DOP', 350,   true,  null);

-- Toallas — RD (ONATEXTILES)
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Toalla de cuerpo blanca (con bordado NOK)', 'ONATEXTILES', 'toallas', 'baño', 'DO', 'DOP', 879,  true,  '100% algodón, 620g, 70x140 cm'),
  ('Toalla de mano blanca',                     'ONATEXTILES', 'toallas', 'baño', 'DO', 'DOP', 370,  true,  '100% algodón, 620g, 50x90 cm'),
  ('Toalla de suelo (bathmat) blanca',          'ONATEXTILES', 'toallas', 'baño', 'DO', 'DOP', 569,  true,  '100% algodón, 800g, 50x80 cm'),
  ('Toalla de piscina blanca',                  'ONATEXTILES', 'toallas', 'baño', 'DO', 'DOP', 1359, false, '100% algodón, 500g, 90x170 cm');

-- ============================================================
-- COLOMBIA (COP) — From Copy of PPTO_COT_EXPRESS_COL BASE sheet
-- ============================================================

-- Kit Cocina — CO
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Set cubiertos x16',              'IKEA',        'cocina',    'cocina',    'CO', 'COP', 16900,   true,  null),
  ('Vaso de vidrio',                 'IKEA',        'cocina',    'cocina',    'CO', 'COP', 3990,    true,  null),
  ('Copa de vidrio',                 'IKEA',        'cocina',    'cocina',    'CO', 'COP', 3990,    true,  null),
  ('Aceitero',                       'IKEA',        'cocina',    'cocina',    'CO', 'COP', 14990,   true,  null),
  ('Plato hondo redondo blanco',     'IKEA',        'cocina',    'cocina',    'CO', 'COP', 4990,    true,  null),
  ('Plato pando redondo blanco',     'IKEA',        'cocina',    'cocina',    'CO', 'COP', 4990,    true,  null),
  ('Plato té redondo blanco',        'IKEA',        'cocina',    'cocina',    'CO', 'COP', 4990,    true,  null),
  ('Plato bowl blanco',              'IKEA',        'cocina',    'cocina',    'CO', 'COP', 4990,    true,  null),
  ('Taza de café de vidrio',         'IKEA',        'cocina',    'cocina',    'CO', 'COP', 4990,    true,  null),
  ('Jarra de vidrio',                'IKEA',        'cocina',    'cocina',    'CO', 'COP', 19990,   true,  null),
  ('Set utensilios 5 piezas',        'IKEA',        'cocina',    'cocina',    'CO', 'COP', 29990,   true,  null),
  ('Set 3 cuchillos',                'IKEA',        'cocina',    'cocina',    'CO', 'COP', 29990,   true,  null),
  ('Tijeras de cocina',              'IKEA',        'cocina',    'cocina',    'CO', 'COP', 8990,    true,  null),
  ('Rallador',                       'IKEA',        'cocina',    'cocina',    'CO', 'COP', 12990,   true,  null),
  ('Exprimidor de limones',          'ÉXITO',       'cocina',    'cocina',    'CO', 'COP', 29350,   true,  null),
  ('Sacacorcho y destapador',        'IKEA',        'cocina',    'cocina',    'CO', 'COP', 12990,   true,  null),
  ('Set ollas 6 piezas',             'IKEA',        'cocina',    'cocina',    'CO', 'COP', 229990,  true,  null),
  ('Set ollas 6 piezas inducción',   'IKEA',        'cocina',    'cocina',    'CO', 'COP', 229900,  false, 'Solo si estufa de inducción'),
  ('Paños de limpiar (limpión)',     'IKEA',        'cocina',    'cocina',    'CO', 'COP', 19990,   true,  null),
  ('Tabla para cortar',              'IKEA',        'cocina',    'cocina',    'CO', 'COP', 14990,   true,  'Sin madera'),
  ('Escurridor de pasta',            'IKEA',        'cocina',    'cocina',    'CO', 'COP', 17990,   true,  null),
  ('Ganchos de ropa madera x5',     'IKEA',        'general',   'general',   'CO', 'COP', 19990,   true,  null),
  ('Porta cubiertos acrílico',       'IKEA',        'cocina',    'cocina',    'CO', 'COP', 14990,   true,  null),
  ('Portarrollos papel cocina',      'IKEA',        'cocina',    'cocina',    'CO', 'COP', 12990,   true,  null),
  ('Caneca de cocina',               'IKEA',        'cocina',    'cocina',    'CO', 'COP', 59990,   true,  'Sin metálicos en costas'),
  ('Escurridor de platos',           'IKEA',        'cocina',    'cocina',    'CO', 'COP', 8990,    true,  null),
  ('Recogedor y escoba',             'IKEA',        'general',   'general',   'CO', 'COP', 59990,   true,  null),
  ('Dispensador lavaloza',           'HOMECENTER',  'cocina',    'cocina',    'CO', 'COP', 13900,   true,  null),
  ('Mesa de planchar',               'IKEA',        'general',   'general',   'CO', 'COP', 39990,   true,  null),
  ('Cepillo de baño',                'IKEA',        'baño',      'baño',      'CO', 'COP', 9900,    true,  null),
  ('Envase dispensador NOK',         'NOK',         'baño',      'baño',      'CO', 'COP', 14500,   true,  'x4 tipos'),
  ('Caneca de baño',                 'IKEA',        'baño',      'baño',      'CO', 'COP', 39990,   true,  null),
  ('Manta decorativa',               'IKEA',        'general',   'general',   'CO', 'COP', 99990,   true,  null),
  ('Manta térmica',                  'DISTRIHOGAR', 'general',   'general',   'CO', 'COP', 85000,   false, 'Solo Bogotá'),
  ('Tendedero',                      'HOMECENTER',  'general',   'lavanderia','CO', 'COP', 128900,  false, null);

-- Electrodomésticos — CO
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Cafetera eléctrica',                'KTRONIX',    'electrodomesticos', 'cocina',     'CO', 'COP', 59900,   true,  null),
  ('Licuadora',                         'KTRONIX',    'electrodomesticos', 'cocina',     'CO', 'COP', 89900,   true,  null),
  ('Secador de pelo empotrado en muro', 'NOK',        'electrodomesticos', 'baño',       'CO', 'COP', 82000,   true,  'Estándar Bogotá'),
  ('Plancha de ropa',                   'KTRONIX',    'electrodomesticos', 'general',    'CO', 'COP', 47900,   true,  null),
  ('Lavadora secadora Samsung 11.5 kg', 'KTRONIX',    'electrodomesticos', 'lavanderia', 'CO', 'COP', 2399000, true,  null),
  ('Microondas MS23J Black',            'KTRONIX',    'electrodomesticos', 'cocina',     'CO', 'COP', 274900,  true,  null),
  ('Nevera 245 litros',                 'KTRONIX',    'electrodomesticos', 'cocina',     'CO', 'COP', 1419000, true,  null),
  ('Ventilador de torre',               'KTRONIX',    'electrodomesticos', 'general',    'CO', 'COP', 129900,  false, 'Punta Cana, Medellín, Cartagena'),
  ('Smart lock TTlock',                 'NOK',        'tecnologia',        'general',    'CO', 'COP', 549900,  true,  null),
  ('Detector monóxido de carbono',      'NOK',        'tecnologia',        'cocina',     'CO', 'COP', 29750,   false, 'Solo si estufa a gas'),
  ('Soporte TV flexible 23"-55"',       'KTRONIX',    'tecnologia',        'general',    'CO', 'COP', 129900,  false, null),
  ('Soporte TV fijo 37"-80"',           'KTRONIX',    'tecnologia',        'general',    'CO', 'COP', 69900,   true,  null),
  ('Smart TV 50 pulgadas',              'KTRONIX',    'tecnologia',        'general',    'CO', 'COP', 1199000, true,  null);

-- Sala / Muebles — CO
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Sofá 2 puestos',           'IKEA',  'sala',    'sala', 'CO', 'COP', 1300000, false, 'Telas de alto tráfico'),
  ('Sofá 3 puestos',           'IKEA',  'sala',    'sala', 'CO', 'COP', 3250000, true,  'Telas de alto tráfico'),
  ('Sofá en L',                'IKEA',  'sala',    'sala', 'CO', 'COP', 4160000, false, 'Para salas grandes'),
  ('Poltrona / sillón',        'IKEA',  'sala',    'sala', 'CO', 'COP', 660000,  false, null),
  ('Mesa de centro',           'IKEA',  'sala',    'sala', 'CO', 'COP', 605000,  true,  null),
  ('Tapete sala pequeño',      'IKEA',  'sala',    'sala', 'CO', 'COP', 182000,  true,  null),
  ('Tapete sala grande',       'IKEA',  'sala',    'sala', 'CO', 'COP', 550000,  false, null),
  ('Mesa de comedor 4 puestos','IKEA',  'comedor', 'sala', 'CO', 'COP', 800000,  true,  '80x120 cm'),
  ('Mesa de comedor 6 puestos','IKEA',  'comedor', 'sala', 'CO', 'COP', 1200000, false, '90x160 cm'),
  ('Silla de comedor',         'IKEA',  'comedor', 'sala', 'CO', 'COP', 180000,  true,  null),
  ('Barra de comedor',         'IKEA',  'comedor', 'sala', 'CO', 'COP', 1060000, false, 'Alternativa a mesa');

-- Lencería / Cama — CO (Los Sueños + Pa Soñar)
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Colchón tipo hotelero King',      'LOS SUEÑOS',  'lenceria', 'habitacion', 'CO', 'COP', 2023000, true,  null),
  ('Colchón tipo hotelero Queen',     'LOS SUEÑOS',  'lenceria', 'habitacion', 'CO', 'COP', 1428000, true,  null),
  ('Colchón tipo hotelero Doble',     'LOS SUEÑOS',  'lenceria', 'habitacion', 'CO', 'COP', 1368500, true,  null),
  ('Colchón tipo hotelero Semidoble', 'LOS SUEÑOS',  'lenceria', 'habitacion', 'CO', 'COP', 1118600, true,  null),
  ('Colchón tipo hotelero Sencillo',  'LOS SUEÑOS',  'lenceria', 'habitacion', 'CO', 'COP', 952000,  true,  null),
  ('Almohada premium plumas',         'PA SOÑAR',    'lenceria', 'habitacion', 'CO', 'COP', 89000,   true,  '250 hilos'),
  ('Almohada fibra siliconada',       'PA SOÑAR',    'lenceria', 'habitacion', 'CO', 'COP', 45000,   true,  null),
  ('Juego de sábanas',                'PA SOÑAR',    'lenceria', 'habitacion', 'CO', 'COP', 120000,  true,  '250 hilos, blanco, polyalgodón'),
  ('Plumón microfibra',               'PA SOÑAR',    'lenceria', 'habitacion', 'CO', 'COP', 95000,   true,  '100% poliéster 300 gr'),
  ('Duvet blanco liso',               'PA SOÑAR',    'lenceria', 'habitacion', 'CO', 'COP', 140000,  true,  '250 hilos, blanco, polyalgodón'),
  ('Protector impermeable colchón',   'PA SOÑAR',    'lenceria', 'habitacion', 'CO', 'COP', 75000,   true,  null),
  ('Protector de almohada',           'PA SOÑAR',    'lenceria', 'habitacion', 'CO', 'COP', 18000,   true,  null);

-- Toallas — CO
insert into public.catalog_items (name, provider, category, space_type, country, currency, price, is_nok_standard, notes) values
  ('Toalla de cuerpo blanca (con bordado NOK)', 'PA SOÑAR', 'toallas', 'baño', 'CO', 'COP', 57200, true,  '100% algodón, 620g, 70x140 cm'),
  ('Toalla de mano blanca',                     'PA SOÑAR', 'toallas', 'baño', 'CO', 'COP', 26320, true,  '100% algodón, 620g, 50x90 cm'),
  ('Toalla de suelo (bathmat) blanca',          'PA SOÑAR', 'toallas', 'baño', 'CO', 'COP', 25520, true,  '100% algodón, 800g, 50x80 cm');
