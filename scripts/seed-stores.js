#!/usr/bin/env node
/**
 * Seed script for Local Store Finder stores directory
 *
 * Usage:
 *   node scripts/seed-stores.js
 *
 * This script will:
 * - Create the stores table if it doesn't exist
 * - Insert or update the default stores for each category
 * - Can be run multiple times safely (uses upsert logic)
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Store definitions organized by type
const STORES = {
  home: [
    {
      name: 'Home Depot',
      base_url: 'https://www.homedepot.com',
      search_url_template: 'https://www.homedepot.com/s/{query}',
      notes: 'Major home improvement retailer'
    },
    {
      name: 'Lowes',
      base_url: 'https://www.lowes.com',
      search_url_template: 'https://www.lowes.com/search?searchTerm={query}',
      notes: 'Home improvement and appliances'
    },
    {
      name: 'Menards',
      base_url: 'https://www.menards.com',
      search_url_template: 'https://www.menards.com/main/search.html?search={query}',
      notes: 'Midwest home improvement chain'
    }
  ],
  appliances: [
    {
      name: 'Best Buy',
      base_url: 'https://www.bestbuy.com',
      search_url_template: 'https://www.bestbuy.com/site/searchpage.jsp?st={query}',
      notes: 'Electronics and appliances'
    },
    {
      name: 'Home Depot Appliances',
      base_url: 'https://www.homedepot.com/b/Appliances',
      search_url_template: 'https://www.homedepot.com/s/{query}?NCNI-5',
      notes: 'Home Depot appliance section'
    },
    {
      name: 'Lowes Appliances',
      base_url: 'https://www.lowes.com/l/Appliances',
      search_url_template: 'https://www.lowes.com/search?searchTerm={query}&refinement=4294857975',
      notes: 'Lowes appliance section'
    }
  ],
  clothing: [
    {
      name: 'Target',
      base_url: 'https://www.target.com',
      search_url_template: 'https://www.target.com/s?searchTerm={query}',
      notes: 'General merchandise including clothing'
    },
    {
      name: 'Walmart',
      base_url: 'https://www.walmart.com',
      search_url_template: 'https://www.walmart.com/search?q={query}',
      notes: 'General merchandise including clothing'
    },
    {
      name: 'Kohls',
      base_url: 'https://www.kohls.com',
      search_url_template: 'https://www.kohls.com/search.jsp?search={query}',
      notes: 'Department store with clothing focus'
    }
  ],
  restaurants: [
    {
      name: 'Grubhub',
      base_url: 'https://www.grubhub.com',
      search_url_template: 'https://www.grubhub.com/search?queryText={query}',
      notes: 'Restaurant delivery aggregator'
    },
    {
      name: 'DoorDash',
      base_url: 'https://www.doordash.com',
      search_url_template: 'https://www.doordash.com/search/store/{query}',
      notes: 'Restaurant delivery aggregator'
    },
    {
      name: 'Yelp',
      base_url: 'https://www.yelp.com',
      search_url_template: 'https://www.yelp.com/search?find_desc={query}',
      notes: 'Restaurant reviews and info'
    }
  ]
};

async function seedStores() {
  const client = await pool.connect();

  try {
    console.log('🏪 Seeding stores directory...\n');

    // Create store_type enum if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE store_type AS ENUM ('home', 'appliances', 'clothing', 'restaurants');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create stores table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        store_type store_type NOT NULL,
        base_url VARCHAR(500) NOT NULL,
        search_url_template VARCHAR(500),
        logo_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_name_type ON stores(name, store_type);
    `);

    let totalInserted = 0;
    let totalUpdated = 0;

    for (const [storeType, stores] of Object.entries(STORES)) {
      console.log(`📦 Processing ${storeType} stores...`);

      for (const store of stores) {
        const result = await client.query(`
          INSERT INTO stores (name, store_type, base_url, search_url_template, notes)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name, store_type)
          DO UPDATE SET
            base_url = EXCLUDED.base_url,
            search_url_template = EXCLUDED.search_url_template,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS inserted
        `, [store.name, storeType, store.base_url, store.search_url_template, store.notes]);

        if (result.rows[0].inserted) {
          console.log(`  ✅ Inserted: ${store.name}`);
          totalInserted++;
        } else {
          console.log(`  🔄 Updated: ${store.name}`);
          totalUpdated++;
        }
      }
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Inserted: ${totalInserted} stores`);
    console.log(`   Updated: ${totalUpdated} stores`);

    // Display summary
    const summary = await client.query(`
      SELECT store_type, COUNT(*) as count
      FROM stores
      WHERE is_active = true
      GROUP BY store_type
      ORDER BY store_type
    `);

    console.log('\n📊 Store counts by type:');
    for (const row of summary.rows) {
      console.log(`   ${row.store_type}: ${row.count} stores`);
    }

  } catch (error) {
    console.error('❌ Error seeding stores:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedStores()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedStores, STORES };
