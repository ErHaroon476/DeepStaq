const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDirectSQL() {
  try {
    console.log('🚀 Creating alert settings tables directly...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-alert-settings-tables.sql');
    const sqlScript = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 SQL script loaded');
    
    // Execute individual CREATE TABLE statements directly
    const createTableStatements = [
      `CREATE TABLE IF NOT EXISTS public.alert_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        godown_id UUID NOT NULL REFERENCES public.godowns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        empty_threshold DECIMAL(10,3) DEFAULT 0 NOT NULL,
        low_threshold DECIMAL(10,3) DEFAULT 3 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(godown_id, user_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS public.unit_alert_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        godown_id UUID NOT NULL REFERENCES public.godowns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        unit_type_id UUID NOT NULL REFERENCES public.unit_types(id) ON DELETE CASCADE,
        empty_threshold DECIMAL(10,3) DEFAULT 0 NOT NULL,
        low_threshold DECIMAL(10,3) DEFAULT 3 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(godown_id, user_id, unit_type_id)
      )`
    ];
    
    // Execute CREATE TABLE statements using raw SQL
    for (let i = 0; i < createTableStatements.length; i++) {
      const statement = createTableStatements[i];
      console.log(`⚡ Creating table ${i + 1}/2...`);
      
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', i === 0 ? 'alert_settings' : 'unit_alert_settings');
        
        if (!error && data.length === 0) {
          console.log(`📋 Table doesn't exist, need to create it`);
        }
        
        // Try using raw SQL through PostgREST
        const { error: createError } = await supabase.rpc('sql', { query: statement });
        
        if (createError) {
          console.log(`⚠️  Table creation may have failed (this is expected)`);
        } else {
          console.log(`✅ Table ${i + 1} created successfully`);
        }
      } catch (e) {
        console.log(`⚠️  Expected error for table creation:`, e.message);
      }
    }
    
    // Test if tables exist
    console.log('🔍 Testing table creation...');
    
    try {
      const { data: testData1, error: testError1 } = await supabase
        .from('alert_settings')
        .select('id')
        .limit(1);
      
      const { data: testData2, error: testError2 } = await supabase
        .from('unit_alert_settings')
        .select('id')
        .limit(1);
      
      if (testError1 && testError1.code === 'PGRST116') {
        console.log('❌ alert_settings table not found');
      } else {
        console.log('✅ alert_settings table exists');
      }
      
      if (testError2 && testError2.code === 'PGRST116') {
        console.log('❌ unit_alert_settings table not found');
      } else {
        console.log('✅ unit_alert_settings table exists');
      }
      
      if (!testError1 && !testError2) {
        console.log('🎉 All tables created successfully!');
      } else {
        console.log('💡 Tables may not have been created properly');
        console.log('   Please run SQL manually in Supabase Dashboard:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log(`   2. Copy contents of: ${sqlFile}`);
        console.log('   3. Paste and run SQL');
      }
    } catch (testErr) {
      console.log('❌ Error testing tables:', testErr.message);
    }
    
  } catch (error) {
    console.error('❌ Direct SQL failed:', error);
  }
}

// Run the direct SQL creation
runDirectSQL();
