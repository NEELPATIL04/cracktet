import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function testPreviewColumn() {
  try {
    const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5455/cracktet_db');
    
    // Check if the column exists
    const result = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      AND column_name = 'preview_duration'
    `;
    
    if (result.length > 0) {
      console.log('✅ preview_duration column exists!');
      console.log('Column details:', result[0]);
      
      // Test by selecting from videos table
      const videoTest = await sql`
        SELECT uuid, title, is_premium, preview_duration 
        FROM videos 
        LIMIT 2
      `;
      
      console.log('\n📹 Sample videos with preview_duration:');
      videoTest.forEach(video => {
        console.log(`- ${video.title}: ${video.preview_duration}s preview (Premium: ${video.is_premium})`);
      });
      
    } else {
      console.log('❌ preview_duration column does not exist');
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testPreviewColumn();