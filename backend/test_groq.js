require('dotenv').config();
const { downloadAudio } = require('./services/ytdlpService');
const { transcribeAudio } = require('./services/groqService');

async function test() {
  const videoId = 'eo17uDr2_XA';
  console.log(`Testing with video ${videoId}`);

  try {
    console.log('1. Downloading audio...');
    const audioPath = await downloadAudio(videoId);
    console.log(`Audio downloaded to: ${audioPath}`);

    console.log('2. Transcribing with Groq...');
    const cues = await transcribeAudio(audioPath);
    console.log(`Transcription got ${cues.length} cues.`);
    console.log('First 3 cues:');
    console.log(cues.slice(0, 3));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
