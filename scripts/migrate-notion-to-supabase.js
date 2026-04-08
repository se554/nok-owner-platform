#!/usr/bin/env node

/**
 * Migrate Propietarios and Apartamentos from Notion to Supabase.
 *
 * Usage:
 *   node scripts/migrate-notion-to-supabase.js
 *
 * Required env vars (via .env.local or exported):
 *   NOTION_API_KEY
 *   SUPABASE_URL  (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const { Client } = require("@notionhq/client");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// ---------------------------------------------------------------------------
// Load .env.local if present
// ---------------------------------------------------------------------------
try {
  const fs = require("fs");
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
    console.log("📄 Loaded .env.local");
  }
} catch (_) {
  // ignore
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NOTION_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing env vars. Need NOTION_API_KEY, SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Notion data source IDs (collection IDs for SDK v5)
const PROPIETARIOS_DB = "46f954eb-171f-4538-814f-b03f2eb9b265";
const APARTAMENTOS_DB = "02fbfad5-0e35-4eaa-8c28-94c9505f28b7";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a typed value from a Notion page property.
 */
function getNotionProp(props, name) {
  const p = props[name];
  if (!p) return null;
  switch (p.type) {
    case "title":
      return p.title?.map((t) => t.plain_text).join("") || null;
    case "rich_text":
      return p.rich_text?.map((t) => t.plain_text).join("") || null;
    case "email":
      return p.email || null;
    case "phone_number":
      return p.phone_number || null;
    case "select":
      return p.select?.name || null;
    case "number":
      return p.number;
    case "checkbox":
      return p.checkbox ?? false;
    case "url":
      return p.url || null;
    case "relation":
      return p.relation?.map((r) => r.id) || [];
    default:
      return null;
  }
}

/**
 * Query ALL pages from a Notion database, handling pagination.
 */
async function queryAllPages(databaseId) {
  const pages = [];
  let cursor = undefined;
  let pageNum = 1;

  // Notion SDK v5: databases.query moved to dataSources.query
  const queryFn = notion.databases.query
    ? notion.databases.query.bind(notion.databases)
    : notion.dataSources.query.bind(notion.dataSources);
  const idKey = notion.databases.query ? "database_id" : "data_source_id";

  do {
    const response = await queryFn({
      [idKey]: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
    console.log(
      `   📥 Fetched page ${pageNum} (${response.results.length} records, ${pages.length} total)`
    );
    pageNum++;
  } while (cursor);

  return pages;
}

// ---------------------------------------------------------------------------
// Step 1: Migrate Propietarios → owners
// ---------------------------------------------------------------------------
async function migrateOwners() {
  console.log("\n🏠 Step 1: Migrating Propietarios → owners");
  console.log("─".repeat(50));

  const pages = await queryAllPages(PROPIETARIOS_DB);
  console.log(`   📊 Found ${pages.length} propietarios in Notion`);

  // Map: Notion page ID → Supabase owner UUID
  const notionToSupabaseMap = new Map();

  let upserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const page of pages) {
    const props = page.properties;
    const notionId = page.id;
    const name = getNotionProp(props, "Name");
    const email = getNotionProp(props, "Email");

    if (!name) {
      console.log(
        `   ⚠️  Skipping propietario "(no name)" — missing name`
      );
      skipped++;
      continue;
    }

    const ownerData = {
      name,
      email: email || null,
      phone: getNotionProp(props, "Phone Number"),
      pais: getNotionProp(props, "Pais"),
      banco: getNotionProp(props, "Banco"),
      numero_cuenta: getNotionProp(props, "Numero de cuenta"),
      swift_routing: getNotionProp(props, "Swift/Routing"),
      direccion: getNotionProp(props, "Direccion"),
      rut_url: getNotionProp(props, "Select"),
      notion_id: notionId,
    };

    let data, error;

    if (email) {
      // Owner has email → upsert on email
      ({ data, error } = await supabase
        .from("owners")
        .upsert(ownerData, { onConflict: "email" })
        .select("id")
        .single());
    } else {
      // No email → upsert on notion_id
      const { data: existing } = await supabase
        .from("owners")
        .select("id")
        .eq("notion_id", notionId)
        .maybeSingle();

      if (existing) {
        ({ data, error } = await supabase
          .from("owners")
          .update(ownerData)
          .eq("id", existing.id)
          .select("id")
          .single());
      } else {
        ({ data, error } = await supabase
          .from("owners")
          .insert(ownerData)
          .select("id")
          .single());
      }
    }

    if (error) {
      console.log(`   ❌ Error upserting "${name}" (${email}): ${error.message}`);
      errors++;
    } else {
      notionToSupabaseMap.set(notionId, data.id);
      upserted++;
      console.log(`   ✅ ${name} → ${data.id}`);
    }
  }

  console.log(
    `\n   📈 Owners summary: ${upserted} upserted, ${skipped} skipped, ${errors} errors`
  );
  return notionToSupabaseMap;
}

// ---------------------------------------------------------------------------
// Step 2: Migrate Apartamentos → properties
// ---------------------------------------------------------------------------
async function migrateProperties(ownerMap) {
  console.log("\n🏢 Step 2: Migrating Apartamentos → properties");
  console.log("─".repeat(50));

  const pages = await queryAllPages(APARTAMENTOS_DB);
  console.log(`   📊 Found ${pages.length} apartamentos in Notion`);

  let upserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const page of pages) {
    const props = page.properties;
    const notionId = page.id;
    const name = getNotionProp(props, "Listing");

    if (!name) {
      console.log(`   ⚠️  Skipping apartamento with no Listing name`);
      skipped++;
      continue;
    }

    // Resolve owner relation
    const propietarioRelation = getNotionProp(props, "Propietarios");
    let ownerId = null;
    if (Array.isArray(propietarioRelation) && propietarioRelation.length > 0) {
      ownerId = ownerMap.get(propietarioRelation[0]) || null;
      if (!ownerId) {
        console.log(
          `   ⚠️  Owner not found for "${name}" (Notion relation: ${propietarioRelation[0]})`
        );
      }
    }

    if (!ownerId) {
      console.log(`   ⚠️  "${name}" — no owner resolved, migrating as orphan`);
    }

    const guestyId = getNotionProp(props, "guesty_listing_id");

    const propertyData = {
      name,
      owner_id: ownerId,
      guesty_listing_id: guestyId || null,
      country: getNotionProp(props, "Location"),
      tipo: getNotionProp(props, "Tipo"),
      bedrooms: getNotionProp(props, "Habitaciones"),
      nok_commission_rate: getNotionProp(props, "Comision"),
      tarifa_mensual: getNotionProp(props, "Tarifa Mensual"),
      tarifa_short_term: getNotionProp(props, "Tarifa Short Term Indicativa"),
      cleaning_fee: getNotionProp(props, "Tarifa de Limpieza (a Propietario)"),
      cuenta_principal: getNotionProp(props, "Cuenta Principal"),
      mantenimiento_responsable: getNotionProp(props, "Mantenimiento"),
      cobro_automatizacion: getNotionProp(props, "Cobro Automatización"),
      pago_ingresos_adicionales: getNotionProp(props, "Pago Ingresos Adicionales"),
      airbnb_url: getNotionProp(props, "Airbnb"),
      booking_url: getNotionProp(props, "Booking.com"),
      marriot_url: getNotionProp(props, "Marriot"),
      nok_booking_engine_url: getNotionProp(props, "Nok Booking Engine"),
      notion_id: notionId,
    };

    let result;

    if (guestyId) {
      // Upsert on guesty_listing_id
      result = await supabase
        .from("properties")
        .upsert(propertyData, { onConflict: "guesty_listing_id" })
        .select("id")
        .single();
    } else {
      // No guesty_listing_id — try upsert on notion_id, or plain insert
      // First check if this notion_id already exists
      const { data: existing } = await supabase
        .from("properties")
        .select("id")
        .eq("notion_id", notionId)
        .maybeSingle();

      if (existing) {
        result = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", existing.id)
          .select("id")
          .single();
      } else {
        result = await supabase
          .from("properties")
          .insert(propertyData)
          .select("id")
          .single();
      }
    }

    if (result.error) {
      console.log(
        `   ❌ Error upserting "${name}": ${result.error.message}`
      );
      errors++;
    } else {
      upserted++;
      console.log(`   ✅ ${name} → ${result.data.id}`);
    }
  }

  console.log(
    `\n   📈 Properties summary: ${upserted} upserted, ${skipped} skipped, ${errors} errors`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🚀 NOK Notion → Supabase Migration");
  console.log("═".repeat(50));
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Propietarios DB: ${PROPIETARIOS_DB}`);
  console.log(`   Apartamentos DB: ${APARTAMENTOS_DB}`);

  const ownerMap = await migrateOwners();
  await migrateProperties(ownerMap);

  console.log("\n🎉 Migration complete!");
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
