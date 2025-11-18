import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { videos } from '../db/schema';
import { getVideoDurationInSeconds } from 'get-video-duration';
import path from 'path';
import { promises as fs } from 'fs';

// Create database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5455/cracktet_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function formatDuration(seconds: number): Promise<string> {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function updateVideoDurations() {
  try {
    console.log('Fetching all videos from database...');
    const allVideos = await db.select().from(videos);
    
    for (const video of allVideos) {
      // Skip if video already has duration
      if (video.duration && video.duration !== '00:00') {
        console.log(`Video ${video.title} already has duration: ${video.duration}`);
        continue;
      }
      
      if (video.videoType !== 'upload') {
        console.log(`Skipping non-uploaded video: ${video.title}`);
        continue;
      }
      
      const videoPath = path.join(
        process.cwd(),
        'storage',
        'videos',
        video.uuid,
        'hls',
        'video.mp4'
      );
      
      try {
        // Check if file exists
        await fs.access(videoPath);
        
        console.log(`Extracting duration for: ${video.title}`);
        const durationInSeconds = await getVideoDurationInSeconds(videoPath);
        const formattedDuration = await formatDuration(durationInSeconds);
        
        console.log(`  Duration: ${formattedDuration} (${durationInSeconds.toFixed(2)} seconds)`);
        
        // Update the video in database
        await db
          .update(videos)
          .set({ duration: formattedDuration })
          .where(eq(videos.id, video.id));
        
        console.log(`  ✓ Updated successfully`);
      } catch (error) {
        console.error(`  ✗ Failed to process ${video.title}:`, error);
      }
    }
    
    console.log('\nDuration update complete!');
  } catch (error) {
    console.error('Error updating video durations:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

// Add missing import
import { eq } from 'drizzle-orm';

updateVideoDurations();