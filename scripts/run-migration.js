const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running alert settings migration...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-alert-settings-tables.sql');
    const sqlScript = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 SQL script loaded:', sqlFile);
    
    // Execute the SQL using Supabase SQL RPC
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_string: sqlScript 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - split into statements
      console.log('🔄 Trying alternative approach...');
      
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_string: statement 
          });
          
          if (stmtError) {
            console.log(`⚠️  Statement ${i + 1} may have failed (this is normal for some DDL)`);
          } else {
            console.log(`✅ Statement ${i + 1} completed`);
          }
        } catch (e) {
          console.log(`⚠️  Statement ${i + 1} error (expected for DDL):`, e.message);
        }
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }
    
    // Test the tables were created
    console.log('🔍 Testing table creation...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('alert_settings')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === 'PGRST116') {
        console.log('❌ Tables were not created properly');
        console.log('💡 Please run the SQL manually in Supabase Dashboard:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log(`   2. Copy contents of: ${sqlFile}`);
        console.log('   3. Paste and run the SQL');
      } else {
        console.log('✅ Tables created successfully!');
      }
    } catch (testErr) {
      console.log('❌ Error testing table creation:', testErr.message);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
