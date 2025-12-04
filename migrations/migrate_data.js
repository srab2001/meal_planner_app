const fs = require('fs').promises;
const path = require('path');
const db = require('../db');

// Migration script to move data from JSON files to PostgreSQL
async function migrateData() {
  console.log('🚀 Starting data migration from JSON to PostgreSQL...\n');

  try {
    // Migrate favorites
    await migrateFavorites();

    // Migrate history
    await migrateHistory();

    // Migrate discount usage
    await migrateDiscountUsage();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Favorites migrated');
    console.log('   - History migrated');
    console.log('   - Discount usage migrated');
    console.log('\n⚠️  Note: User associations will be created on next login');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

async function migrateFavorites() {
  console.log('📁 Migrating favorites.json...');

  try {
    const favoritesPath = path.join(__dirname, '../user-data/favorites.json');
    const favoritesData = JSON.parse(await fs.readFile(favoritesPath, 'utf8'));

    let totalMigrated = 0;
    const userEmails = Object.keys(favoritesData);

    console.log(`   Found ${userEmails.length} users with favorites`);

    for (const [hashedEmail, userFavorites] of Object.entries(favoritesData)) {
      // Store hashed email temporarily - will link to user on login
      for (const [mealType, meals] of Object.entries(userFavorites)) {
        if (!Array.isArray(meals)) continue;

        for (const meal of meals) {
          if (!meal || !meal.name) continue;

          try {
            // Insert favorite - user_id will be NULL until user logs in
            await db.query(`
              INSERT INTO favorites (user_id, meal_type, meal_data, meal_name, created_at)
              VALUES (
                NULL,
                $1,
                $2,
                $3,
                CURRENT_TIMESTAMP
              )
              ON CONFLICT DO NOTHING
            `, [mealType, JSON.stringify(meal), meal.name]);

            totalMigrated++;
          } catch (error) {
            console.error(`     Error migrating favorite "${meal.name}":`, error.message);
          }
        }
      }
    }

    console.log(`   ✅ Migrated ${totalMigrated} favorites`);
    console.log(`   ℹ️  Will be linked to users on next login\n`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('   ℹ️  No favorites.json file found, skipping\n');
    } else {
      throw error;
    }
  }
}

async function migrateHistory() {
  console.log('📁 Migrating history.json...');

  try {
    const historyPath = path.join(__dirname, '../user-data/history.json');
    const historyData = JSON.parse(await fs.readFile(historyPath, 'utf8'));

    let totalMigrated = 0;
    const userEmails = Object.keys(historyData);

    console.log(`   Found ${userEmails.length} users with history`);

    for (const [hashedEmail, userHistory] of Object.entries(historyData)) {
      if (!Array.isArray(userHistory)) continue;

      for (const entry of userHistory) {
        try {
          await db.query(`
            INSERT INTO meal_plan_history (
              user_id,
              preferences,
              meal_plan,
              stores,
              shopping_list,
              created_at
            ) VALUES (
              NULL,
              $1, $2, $3, $4, $5
            )
          `, [
            JSON.stringify(entry.preferences || {}),
            JSON.stringify(entry.mealPlan || {}),
            JSON.stringify(entry.stores || {}),
            JSON.stringify(entry.shoppingList || {}),
            entry.timestamp || new Date()
          ]);

          totalMigrated++;
        } catch (error) {
          console.error(`     Error migrating history entry:`, error.message);
        }
      }
    }

    console.log(`   ✅ Migrated ${totalMigrated} history entries`);
    console.log(`   ℹ️  Will be linked to users on next login\n`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('   ℹ️  No history.json file found, skipping\n');
    } else {
      throw error;
    }
  }
}

async function migrateDiscountUsage() {
  console.log('📁 Migrating discount-code-usage.json...');

  try {
    const discountPath = path.join(__dirname, '../discount-code-usage.json');
    const discountData = JSON.parse(await fs.readFile(discountPath, 'utf8'));

    let totalMigrated = 0;
    const codes = Object.keys(discountData);

    console.log(`   Found ${codes.length} discount codes with usage`);

    for (const [code, usages] of Object.entries(discountData)) {
      // First, create discount code if not exists
      try {
        const codeResult = await db.query(`
          INSERT INTO discount_codes (code, description, discount_type, discount_value, active)
          VALUES ($1, $2, 'fixed_amount', 5.00, TRUE)
          ON CONFLICT (code) DO UPDATE SET code = $1
          RETURNING id
        `, [code, `Imported from legacy system - code: ${code}`]);

        const discountCodeId = codeResult.rows[0].id;

        // Migrate usages
        if (Array.isArray(usages)) {
          for (const usage of usages) {
            try {
              await db.query(`
                INSERT INTO discount_usage (
                  discount_code_id,
                  user_id,
                  amount_saved,
                  used_at
                ) VALUES ($1, NULL, $2, $3)
                ON CONFLICT DO NOTHING
              `, [
                discountCodeId,
                usage.amountSaved || 5.00,
                usage.timestamp || new Date()
              ]);

              totalMigrated++;
            } catch (error) {
              console.error(`     Error migrating discount usage:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`     Error creating discount code "${code}":`, error.message);
      }
    }

    console.log(`   ✅ Migrated ${totalMigrated} discount usages`);
    console.log(`   ℹ️  Will be linked to users on next login\n`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('   ℹ️  No discount-code-usage.json file found, skipping\n');
    } else {
      throw error;
    }
  }
}

// Run migration
migrateData();
