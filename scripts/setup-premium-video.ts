import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { videos } from '../db/schema';
import { eq } from 'drizzle-orm';

async function setupPremiumVideo() {
  try {
    const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5455/cracktet_db');
    const db = drizzle(sql);
    
    // Get all videos
    const allVideos = await db.select().from(videos);
    
    if (allVideos.length >= 2) {
      // Make the second video premium with 30 second preview
      await db
        .update(videos)
        .set({ 
          isPremium: true, 
          previewDuration: 30 
        })
        .where(eq(videos.id, allVideos[1].id));
      
      console.log('✅ Premium video setup complete!');
      console.log(`\n🎬 Video Configuration:`);
      allVideos.forEach((video, index) => {
        const isPremium = index === 1 ? true : video.isPremium;
        const previewDuration = index === 1 ? 30 : video.previewDuration;
        console.log(`   ${index + 1}. ${video.title}`);
        console.log(`      Type: ${isPremium ? 'Premium' : 'Free'}`);
        console.log(`      Preview: ${previewDuration} seconds`);
      });
      
      console.log('\n🧪 Test the following scenarios:');
      console.log('1. Visit videos page without login (guest)');
      console.log('2. Play any video → Should stop after preview time');
      console.log('3. Login as normal@test.com → Free videos: full access, Premium videos: preview only');
      console.log('4. Login as premium@test.com → Full access to all videos');
      
    } else {
      console.log('❌ Not enough videos found. Please add some videos first.');
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error setting up premium video:', error);
  }
}

setupPremiumVideo();