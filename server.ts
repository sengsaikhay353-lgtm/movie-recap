import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared server-side Gemini client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: System status and Quota Check
app.get('/api/status', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasGeminiKey: hasKey,
    quotaStatus: hasKey ? 'active' : 'no_key',
    activeModel: 'gemini-3.8-flash',
    ttsModel: 'gemini-3.8-flash-lite-tts',
    app: 'TEAM ALPHA AI Movie Recap Studio',
  });
});

// API: Analyze movie & generate Burmese recap script with timestamps
app.post('/api/analyze-movie-script', async (req: Request, res: Response) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'API Key not configured in environment. ကျေးဇူးပြု၍ API ကီးစစ်ဆေးပါ။',
        code: 'MISSING_API_KEY',
      });
    }

    const {
      movieTitle = 'Untitled Movie',
      recapLength = 'medium', // 'short' (1-2 min), 'medium' (3-5 min), 'long' (10-15 min)
      durationMinutes = 3,
      tone = 'dramatic',
      outputLanguage = 'burmese', // 'burmese' | 'english' | 'both'
      videoDuration = 180,
      extractedFrames = [],
      storyNotes = '',
      isV2 = false,
    } = req.body;

    // Determine target scene count based on recap length
    let targetSceneCount = 5;
    let wordBudget = 700;
    if (recapLength === 'short' || durationMinutes <= 2) {
      targetSceneCount = 3;
      wordBudget = 350;
    } else if (recapLength === 'long' || durationMinutes >= 10) {
      targetSceneCount = 10;
      wordBudget = 1600;
    } else {
      targetSceneCount = isV2 ? 7 : 5;
      wordBudget = 850;
    }

    const hasRealFrames = Array.isArray(extractedFrames) && extractedFrames.length > 0;

    const systemInstruction = `You are the master movie recap scriptwriter for "TEAM ALPHA AI", Myanmar's premier movie recap production studio.
Your mission is to generate a viral, captivating, suspenseful, and emotionally gripping movie recap script in ${outputLanguage === 'english' ? 'English' : 'natural spoken Burmese (မြန်မာစကားပြောဟန်)'} divided into scene segments with precise start and end timestamps.

Recap Length Requirement: ${recapLength.toUpperCase()} (${targetSceneCount} distinct scene acts, ~${wordBudget} total words).
Style / Tone: ${tone}.

Rules:
1. Every scene must have:
   - Burmese narration script (scriptMy): written in natural, fluent, cinematic spoken Burmese (ဇာတ်လမ်းပြော စကားပြောဟန်).
   - English translation script (scriptEn): for bilingual subtitles or international viewers.
   - Burmese scene title (titleMy) and English scene title (titleEn).
   - Timestamp bounds (startTime and endTime in seconds) spanning 0 to ${Math.floor(videoDuration)} seconds.
   - Emotional beat (e.g., "Hook", "Inciting Incident", "Tension Build", "Shocking Twist", "Climax", "Resolution").
2. The fullScriptText should be a complete, ready-to-read narration script with timestamps like [00:15], act titles, and audio/visual cues in brackets.
3. If isV2 is true, craft an advanced Plot Twist & Viral Hook format with cliffhangers and intense viewer retention.
4. Output strict JSON matching the schema provided.`;

    const promptText = `Analyze this movie and create a ${recapLength} cinematic movie recap script.
Movie Title: ${movieTitle}
Total Video Duration: ${videoDuration} seconds
Visual Frames Extracted: ${hasRealFrames ? extractedFrames.length + ' keyframes provided' : 'None provided'}
User Plot Notes / Transcript: ${storyNotes || 'Classic cinematic progression and plot twists.'}
Style: ${tone}
Requested Output Language: ${outputLanguage}
Version: ${isV2 ? 'Story Recap V2 (Viral Narrative)' : 'Standard Team Alpha Recap'}

Generate the scene timestamps, Burmese spoken narration, English translation, and complete formatted script.`;

    const parts: any[] = [{ text: promptText }];

    // If client sent keyframe thumbnails, include up to 5 inline frame parts for multimodal vision analysis
    if (hasRealFrames) {
      const selectedFrames = extractedFrames.slice(0, 5);
      for (const frame of selectedFrames) {
        if (frame.base64) {
          const cleanBase64 = frame.base64.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleMy: {
              type: Type.STRING,
              description: 'Catchy Burmese movie recap title',
            },
            titleEn: {
              type: Type.STRING,
              description: 'English movie recap title',
            },
            loglineMy: {
              type: Type.STRING,
              description: 'One sentence gripping Burmese hook summary',
            },
            fullScriptText: {
              type: Type.STRING,
              description: 'Complete formatted cinematic movie recap script with timestamps [00:00], Acts (1. Hook & Intro, 2. Setup, 3. Rising Action, 4. Climax, 5. Outro) and voiceover cues',
            },
            totalScenes: {
              type: Type.INTEGER,
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  startTime: { type: Type.NUMBER, description: 'Start time in seconds' },
                  endTime: { type: Type.NUMBER, description: 'End time in seconds' },
                  titleMy: { type: Type.STRING, description: 'Burmese scene title' },
                  titleEn: { type: Type.STRING, description: 'English scene title' },
                  scriptMy: {
                    type: Type.STRING,
                    description: 'Burmese spoken movie recap narration script',
                  },
                  scriptEn: {
                    type: Type.STRING,
                    description: 'English subtitle translation',
                  },
                  emotionalBeat: { type: Type.STRING },
                },
                required: ['id', 'startTime', 'endTime', 'titleMy', 'titleEn', 'scriptMy', 'scriptEn'],
              },
            },
          },
          required: ['titleMy', 'titleEn', 'loglineMy', 'fullScriptText', 'scenes'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);
    return res.json({
      success: true,
      data: parsedData,
      analysisMethod: hasRealFrames ? 'multimodal_vision_keyframes' : 'plot_and_notes',
      framesAnalyzed: hasRealFrames ? Math.min(extractedFrames.length, 5) : 0,
    });
  } catch (err: any) {
    console.error('Error generating recap script:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'ဗီဒီယို ဇာတ်လမ်းခွဲခြမ်းစိတ်ဖြာရာတွင် အမှားဖြစ်ပေါ်ခဲ့သည် (Video analysis failed).',
      details: err?.toString(),
    });
  }
});

// API: Generate 10 Viral Titles, Thumbnail Text, and SEO Package
app.post('/api/generate-viral-package', async (req: Request, res: Response) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'API Key not configured in environment.',
        code: 'MISSING_API_KEY',
      });
    }

    const {
      movieTitle = 'Movie Recap',
      plotSummary = '',
      tone = 'Cinematic & Dramatic',
    } = req.body;

    const systemInstruction = `You are a viral social media strategist specializing in movie recap content across YouTube, Facebook Watch, and TikTok.
Generate a complete high-CTR growth package for the movie recap: "${movieTitle}".
Tone: ${tone}.
Context: ${plotSummary || 'Movie recap production.'}

Requirements:
1. 10 Viral Click-Worthy Titles: Mix of high curiosity gap, shocking reveals, and emotional hooks (both Burmese and English).
2. 5 Large Thumbnail Headline Texts: 2 to 4 words max, punchy, high-impact text designed to be placed in bold on YouTube/TikTok video thumbnails.
3. 3 Viral 5-Second Video Hooks: Short spoken opening lines that stop viewers from scrolling.
4. YouTube SEO: Full video description with synopsis, chapter stamps template, tags (comma-separated), and hashtags.
5. TikTok / Reels Caption: Short viral caption with emojis and trending tags.
6. Facebook Post: Engaging post copy asking an opinion question to drive comment section debate.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate viral package for: ${movieTitle}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  burmese: { type: Type.STRING },
                  english: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'e.g., Mystery, Shocking, Emotional, Question' },
                },
                required: ['burmese', 'english'],
              },
            },
            thumbnailTexts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  burmese: { type: Type.STRING, description: '2-4 words high impact' },
                  english: { type: Type.STRING, description: '2-4 words high impact' },
                },
                required: ['burmese', 'english'],
              },
            },
            viralHooks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            youtubeDescription: { type: Type.STRING },
            tags: { type: Type.STRING, description: 'Comma separated keywords' },
            hashtags: { type: Type.STRING, description: 'Space separated hashtags' },
            tiktokCaption: { type: Type.STRING },
            facebookPost: { type: Type.STRING },
          },
          required: [
            'titles',
            'thumbnailTexts',
            'viralHooks',
            'youtubeDescription',
            'tags',
            'hashtags',
            'tiktokCaption',
            'facebookPost',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error generating viral package:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate viral SEO package',
    });
  }
});

// API: Generate Voiceover Speech using Gemini TTS
app.post('/api/generate-tts', async (req: Request, res: Response) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'API Key not configured. Using client-side speech synthesis.',
        code: 'MISSING_API_KEY',
      });
    }

    const {
      text = '',
      voiceName = 'Kore', // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      style = 'Deep, cinematic, expressive movie recap narration',
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 1000),
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({
        error: 'TTS generation failed to return audio stream.',
      });
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS generation error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'အသံဖန်တီးရာတွင် အဆင်မပြေပါ (TTS service error)',
    });
  }
});

// API: Generate AI Thumbnail Image using Imagen
app.post('/api/generate-ai-thumbnail', async (req: Request, res: Response) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'API Key not configured in environment.',
        code: 'MISSING_API_KEY',
      });
    }

    const {
      prompt = '',
      movieTitle = 'Cinematic Movie',
      aspectRatio = '16:9',
    } = req.body;

    const fullPrompt =
      prompt ||
      `Cinematic movie recap poster for "${movieTitle}", dramatic lighting, hyper-realistic film still, high octane suspense movie aesthetic, 8k resolution, ultra detailed`;

    try {
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio:
            aspectRatio === '9:16'
              ? '9:16'
              : aspectRatio === '1:1'
              ? '1:1'
              : aspectRatio === '3:4'
              ? '3:4'
              : '16:9',
          outputMimeType: 'image/jpeg',
        },
      });

      const imgBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (imgBytes) {
        return res.json({
          success: true,
          imageBase64: `data:image/jpeg;base64,${imgBytes}`,
          source: 'imagen-3.0-generate-002',
        });
      }
    } catch (imgErr: any) {
      console.warn('Imagen 3 API failed or unavailable:', imgErr);
      return res.status(502).json({
        success: false,
        error:
          imgErr?.message ||
          'AI Image generation model unavailable with current quota/key. Use high-res video frame thumbnail compositor instead.',
      });
    }

    return res.status(502).json({
      success: false,
      error: 'No image returned from AI generator',
    });
  } catch (err: any) {
    console.error('AI thumbnail generation error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate AI thumbnail',
    });
  }
});

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`TEAM ALPHA AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
