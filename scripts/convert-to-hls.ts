import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function convertVideoToHLS(inputPath: string, outputDir: string) {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'index.m3u8');
    const segmentPattern = path.join(outputDir, 'segment%03d.ts');

    // Convert video to HLS format with segments
    const ffmpegCommand = `ffmpeg -i "${inputPath}" \
      -c:v h264 -profile:v main -crf 23 -preset medium \
      -c:a aac -ar 44100 -b:a 128k \
      -hls_time 10 \
      -hls_list_size 0 \
      -hls_segment_filename "${segmentPattern}" \
      -f hls \
      "${outputPath}"`;

    console.log('Converting video to HLS format...');
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    
    if (stderr && !stderr.includes('frame=')) {
      console.error('FFmpeg stderr:', stderr);
    }

    console.log('HLS conversion complete!');
    return true;
  } catch (error) {
    console.error('Error converting video:', error);
    return false;
  }
}

async function convertAllVideos() {
  const storageDir = path.join(process.cwd(), 'storage', 'videos');
  
  try {
    const videoDirs = await fs.readdir(storageDir);
    
    for (const videoId of videoDirs) {
      const videoDir = path.join(storageDir, videoId);
      const hlsDir = path.join(videoDir, 'hls');
      const mp4Path = path.join(hlsDir, 'video.mp4');
      
      // Check if video.mp4 exists
      try {
        await fs.access(mp4Path);
        console.log(`\nProcessing video: ${videoId}`);
        
        // Backup existing files
        const backupDir = path.join(videoDir, 'hls_backup');
        await fs.mkdir(backupDir, { recursive: true });
        
        // Copy existing files to backup
        const files = await fs.readdir(hlsDir);
        for (const file of files) {
          if (file !== 'video.mp4') {
            await fs.copyFile(
              path.join(hlsDir, file),
              path.join(backupDir, file)
            );
          }
        }
        
        // Clear HLS directory except video.mp4
        for (const file of files) {
          if (file !== 'video.mp4') {
            await fs.unlink(path.join(hlsDir, file));
          }
        }
        
        // Convert video to HLS
        const success = await convertVideoToHLS(mp4Path, hlsDir);
        
        if (success) {
          console.log(`✓ Successfully converted ${videoId}`);
        } else {
          console.log(`✗ Failed to convert ${videoId}`);
          // Restore backup if conversion failed
          const backupFiles = await fs.readdir(backupDir);
          for (const file of backupFiles) {
            await fs.copyFile(
              path.join(backupDir, file),
              path.join(hlsDir, file)
            );
          }
        }
      } catch (error) {
        console.log(`Skipping ${videoId} - video.mp4 not found`);
      }
    }
  } catch (error) {
    console.error('Error processing videos:', error);
  }
}

// Check if ffmpeg is installed
async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const hasFFmpeg = await checkFFmpeg();
  
  if (!hasFFmpeg) {
    console.error('FFmpeg is not installed. Please install FFmpeg to convert videos.');
    console.log('\nInstallation instructions:');
    console.log('- macOS: brew install ffmpeg');
    console.log('- Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg');
    console.log('- Windows: Download from https://ffmpeg.org/download.html');
    process.exit(1);
  }
  
  console.log('Starting HLS conversion process...');
  await convertAllVideos();
  console.log('\nConversion process complete!');
}

main().catch(console.error);