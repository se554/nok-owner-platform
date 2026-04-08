-- Enable vector extension for embeddings
create extension if not exists vector;

-- FAQs / Knowledge Base table
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  pregunta_tipo text not null,
  respuesta_base text,
  area text,
  responsable_principal text,
  correo_responsable text,
  palabras_clave text,
  auto_respondible boolean default false,
  veces_consultada integer default 0,
  scope text default 'all' check (scope in ('all', 'specific')),
  property_ids uuid[] default '{}',
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for vector similarity search
create index if not exists faqs_embedding_idx on faqs using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- RLS
alter table faqs enable row level security;

create policy "Service role can manage faqs" on faqs
  for all using (true) with check (true);

-- Seed with NOK FAQ data from Notion
insert into faqs (pregunta_tipo, respuesta_base, area, responsable_principal, correo_responsable, palabras_clave, auto_respondible, veces_consultada) values
('¿Cómo interpreto el reporte mensual?', 'El reporte mensual incluye ocupación, ADR (tarifa promedio diaria) e ingresos netos. Si tienes dudas sobre alguna cifra específica, Jorge puede orientarte.', 'Revenue Management', 'Jorge Duque', 'jad@nok.rent', 'reporte, informe, liquidación, ingresos, ocupación, ADR, RevPAR', false, 15),
('Ocupación del apto - ¿cómo va?', 'El equipo de Revenue puede compartirte el reporte de ocupación actualizado de tu apartamento con el detalle de noches ocupadas, noches disponibles y comparativo del mercado.', 'Revenue Management', 'Jorge Duque', 'jad@nok.rent', 'ocupación, cuántas noches, porcentaje ocupación, cuántas reservas, rendimiento', false, 0),
('Offboarding - salida de NOK', 'El proceso de salida incluye liquidación, retiro de listings en plataformas y entrega del apartamento. El equipo de Operaciones y Growth coordinan el offboarding.', 'Growth', 'Santiago Estrada', 'se@nok.rent', 'salir de NOK, terminar contrato, retirar apto, offboarding, dejar de operar con NOK', false, 0),
('¿Cómo bloqueo fechas en mi apartamento?', 'Puedes solicitar el bloqueo de fechas con mínimo 72 horas de anticipación, sujeto a que no haya reservas confirmadas. El equipo de CX gestiona los bloqueos en el calendario.', 'CX', 'Maria Alejandra Mejía', 'mam@nok.rent', 'bloqueo, bloquear fechas, reserva personal, uso propio, calendario bloqueado', false, 0),
('Aclaraciones de descuentos en reportes', 'Los descuentos en el reporte corresponden a deducciones de limpieza, mantenimiento, servicios u otros costos operativos. Jorge puede desglosarte cada ítem.', 'Operaciones Colombia', 'Juan Camilo Chibuque', 'jcc@nok.rent', 'descuento, deducción reporte, por qué me descontaron, ajuste en reporte', false, 0),
('Gestionar reservas directas', 'Las reservas directas se pueden gestionar a través de NOK. El equipo de CX puede orientarte sobre el proceso para registrarlas correctamente.', 'CX', 'Maria Alejandra Mejía', 'mam@nok.rent', 'reserva directa, reserva sin plataforma, pago directo, huésped directo, reserva personal', false, 0),
('Aclaraciones de descuentos en reportes (RD)', 'Los descuentos en el reporte corresponden a deducciones de limpieza, mantenimiento, servicios u otros costos operativos. Jorge puede desglosarte cada ítem.', 'Operaciones Republica Dominicana', 'Ricardo Green', 'rg@nok.rent', 'descuento, deducción reporte, por qué me descontaron, ajuste en reporte', false, 0),
('Comprobantes de pago', 'El equipo de Finance puede enviarte los comprobantes de pago que necesites. Indícales el período o concepto específico.', 'C-level', 'Santiago Estrada', 'se@nok.rent', 'comprobante, soporte pago, recibo, voucher, prueba de pago, factura', false, 0),
('Actualización de fotos del apto', 'La gestión y actualización de fotos en las plataformas la coordina el equipo de Revenue. Jorge puede orientarte sobre el proceso y tiempos.', 'Revenue Management', 'Jorge Duque', 'jad@nok.rent', 'fotos, actualizar fotos, nuevas fotos, cambiar fotos, sesión fotográfica', false, 0),
('Pago servicios públicos - confirmación (Colombia)', 'El equipo de Finance puede enviarte la confirmación de pago de servicios públicos y el soporte correspondiente al período consultado.', 'Operaciones Colombia', 'Juan Camilo Chibuque', 'jcc@nok.rent', 'servicios públicos pagados, confirmación pago servicios, recibo servicios, agua luz gas pagado', false, 0),
('Descripción del listing', 'La descripción del listing la redacta y optimiza el equipo de Growth. Johan puede compartirte el texto actual y recibir sugerencias de tu parte.', 'Revenue Management', 'Jorge Duque', 'jad@nok.rent', 'descripción, texto Airbnb, texto Booking, copy listing, qué dice mi anuncio', false, 0),
('Quejas de huéspedes y malas limpiezas', 'Cuando hay quejas de huéspedes relacionadas con limpieza, el equipo de Operaciones investiga, toma acciones correctivas y puede enviarte el informe del caso.', 'CX', 'Maria Alejandra Mejía', 'mam@nok.rent', 'queja huésped, limpieza mala, apto sucio, huésped insatisfecho, falla limpieza', false, 0),
('Pago servicios públicos - confirmación (RD)', 'El equipo de Finance puede enviarte la confirmación de pago de servicios públicos y el soporte correspondiente al período consultado.', 'Operaciones Republica Dominicana', 'Ricardo Green', 'rg@nok.rent', 'servicios públicos pagados, confirmación pago servicios, recibo servicios, agua luz gas pagado', false, 0),
('¿Cómo pagar la contribución parafiscal?', 'La contribución parafiscal al turismo (FONTUR) es una obligación legal en Colombia. El equipo de Finance puede explicarte cómo funciona y si NOK la gestiona por ti.', 'Finance', 'Juan David Parra', 'jp@nok.rent', 'contribución parafiscal, aporte parafiscal, FONTUR, impuesto turismo, contribución', false, 0),
('¿Cuándo me transfieren el dinero?', 'Los pagos a propietarios se realizan los primeros días hábiles de cada mes, correspondientes a la ocupación del mes anterior. El equipo de Finance puede confirmar la fecha exacta y el monto.', 'C-level', 'Santiago Estrada', 'se@nok.rent', 'pago, transferencia, cuándo pagan, liquidación, dinero, depósito', false, 0),
('Entregar apartamento a NOK', 'El proceso de entrega del apartamento a NOK incluye inventario, inspección y configuración en plataformas. El equipo de Operaciones coordina cada paso.', 'Growth', 'Johan Cañon', 'mc@nok.rent', 'entregar apto, inicio operación, onboarding, primer entrega, cómo empezamos', false, 0),
('Accesos a Guesty', 'Los accesos a Guesty los gestiona el equipo de Growth. Johan puede crearte o restablecer tus credenciales.', 'Growth', 'Johan Cañon', 'mc@nok.rent', 'acceso, Guesty, credenciales, usuario, login, entrar plataforma', false, 0),
('¿Cuándo llega el próximo huésped?', 'El equipo de CX puede consultarte el calendario de reservas actualizado de tu apartamento y decirte las próximas llegadas.', 'CX', 'Maria Alejandra Mejía', 'mam@nok.rent', 'próxima reserva, check-in, huésped, cuándo llega, reserva', false, 0),
('Resolución de incidencias en el apartamento (RD)', 'El equipo de Operaciones atiende y resuelve incidencias en el apartamento. Ricardo puede informarte sobre el estado de cualquier situación reportada.', 'Operaciones Republica Dominicana', 'Ricardo Green', 'rg@nok.rent', 'incidencia, problema, daño, falla, emergencia, inconveniente en el apto', false, 0),
('Preguntar fecha de pago / Reclamar falta de pagos', 'Los pagos se realizan los primeros días hábiles de cada mes. Si el pago está pendiente, el equipo de Finance puede verificar el estado y darte una fecha exacta.', 'C-level', 'Santiago Estrada', 'se@nok.rent', 'cuándo me pagan, fecha pago, no me han pagado, falta el pago, pago atrasado, reclamo pago', false, 0),
('Resolución de incidencias en el apartamento (Colombia)', 'El equipo de Operaciones atiende y resuelve incidencias en el apartamento. Juan Camilo puede informarte sobre el estado de cualquier situación reportada.', 'Operaciones Colombia', 'Juan Camilo Chibuque', 'jcc@nok.rent', 'incidencia, problema, daño, falla, emergencia, inconveniente en el apto', false, 0),
('Solicitar bloqueos de fechas', 'Puedes solicitar bloqueos con mínimo 72 horas de anticipación, sujeto a disponibilidad. El equipo de CX gestiona los bloqueos en el calendario directamente.', 'CX', 'Maria Alejandra Mejía', 'mam@nok.rent', 'bloqueo, bloquear, reservar para mí, uso personal, no quiero huéspedes, fechas bloqueadas', false, 0),
('Quién me envía las fotos del apartamento', 'El equipo de Growth coordina las sesiones fotográficas y el envío de fotos. Johan puede informarte el estado y enviarte el material.', 'Growth', 'Johan Cañon', 'mc@nok.rent', 'fotos, quién toma las fotos, sesión de fotos, fotógrafo, recibir fotos', false, 0),
('Configuración de Airbnb, listings, etc.', 'Toda la configuración y optimización de listings en plataformas la gestiona el equipo de Revenue. Jorge puede orientarte sobre cualquier cambio o consulta.', 'Revenue Management', 'Jorge Duque', 'jad@nok.rent', 'configuración Airbnb, listing, anuncio, publicación, fotos listing, descripción plataforma', false, 0),
('Quejas por bajo rendimiento del apto', 'El rendimiento del apartamento depende de factores como temporada, competencia, precio y ocupación histórica. Jorge del equipo de Revenue puede compartirte un análisis detallado.', 'Revenue Management', 'Jorge Duque', 'jad@nok.rent', 'bajo rendimiento, pocas reservas, mal desempeño, no está generando, ingresos bajos, no renta', false, 0);
