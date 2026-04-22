export interface Env {
    AI: any;
}

// With mask (for testing only)
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const body = (await request.json()) as {
        photoBase64: string;
        maskBase64:  string;
        styleId: string;
        view: 'front' | 'left' | 'right';
      };

      const { photoBase64, maskBase64, styleId, view } = body;

      if (!photoBase64 || !maskBase64) {
        return new Response(JSON.stringify({ error: 'Missing image or mask' }), { status: 400 });
      }

      const STYLE_PROMPTS: Record<string, string> = {
        pixie:           'pixie cut, very short cropped hair, tapered nape, textured top',
        bob:             'blunt bob haircut, chin length, straight sleek hair',
        lob:             'long bob lob haircut, collarbone length, straight smooth hair',
        layers:          'long layered hair, flowing waves, face framing layers',
        male_slickback:  'mens slicked back hairstyle, short sides, hair swept back',
        male_swept:      'mens side swept hair, soft side part, casual loose look',
        male_sidepart:   'mens hard side part haircut, short back and sides, combed over',
        male_voluminous: 'mens voluminous textured quiff, lifted at the front',
      };

      const viewPrompt =
        view === 'left'  ? 'profile view left side' :
        view === 'right' ? 'profile view right side' :
                           'front facing portrait';

      const prompt = [
        'portrait photo of a person,',
        STYLE_PROMPTS[styleId] ?? 'natural hairstyle',
        ', ' + viewPrompt + ',',
        'photorealistic hair, sharp detailed hair strands,',
        'natural lighting, high quality photograph',
      ].join(' ');

      const negative_prompt = [
        'jewelry', 'necklace', 'earrings', 'accessories', 'hat', 'headband',
        'distorted face', 'deformed', 'bad anatomy', 'blurry', 'low quality',
        'cartoon', 'anime', 'painting', 'extra hair', 'bald patches',
        'watermark', 'text',
      ].join(', ');

      const imageArray = [...new Uint8Array(
        Buffer.from(photoBase64, 'base64')
      )];
      const maskArray  = [...new Uint8Array(
        Buffer.from(maskBase64,  'base64')
      )];

      const result = await env.AI.run(
        '@cf/runwayml/stable-diffusion-v1-5-inpainting',
        {
          prompt,
          negative_prompt,
          image:     imageArray,
          mask:      maskArray,
          num_steps: 20,
          guidance:  7.5,
        }
      );

      return new Response(result, {
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (err: any) {
      console.error('💥 Worker crash:', err);
      return new Response(
        JSON.stringify({ error: 'Worker crashed', details: err.message }),
        { status: 500 }
      );
    }
  },
};

//WITHOUT MASK
// export default {
//     async fetch(request: Request, env: Env): Promise<Response> {
//         try {
//             if (request.method === 'OPTIONS') {
//                 return new Response(null, {
//                     headers: {
//                         'Access-Control-Allow-Origin': '*',
//                         'Access-Control-Allow-Methods': 'POST',
//                         'Access-Control-Allow-Headers': 'Content-Type',
//                     },
//                 });
//             }

//             const body = (await request.json()) as {
//                 photoBase64: string;
//                 styleId: string;
//                 view: 'front' | 'left' | 'right';
//             };

//             const { photoBase64, styleId, view } = body;

//             if (!photoBase64) {
//                 return new Response(JSON.stringify({ error: 'Missing image' }), { status: 400 });
//             }

//             // --- HAIR-ONLY style prompts ---
//             // Keep prompts focused ONLY on hair — no face/body/clothing descriptors
//             const STYLE_PROMPTS: Record<string, string> = {
//                 pixie:           'pixie cut, very short cropped hair, tapered nape, textured top',
//                 bob:             'blunt bob haircut, chin length, straight sleek hair, no layers',
//                 lob:             'long bob lob haircut, collarbone length, straight smooth hair',
//                 layers:          'long layered hair, flowing waves, face framing layers',
//                 male_slickback:  'mens slicked back hairstyle, short sides, hair swept back with gel',
//                 male_swept:      'mens side swept hair, soft side part, casual loose look',
//                 male_sidepart:   'mens hard side part haircut, short back and sides, combed over',
//                 male_voluminous: 'mens voluminous textured quiff, lifted at the front, natural finish',
//             };

//             const viewPrompt =
//                 view === 'left'  ? ', profile view left side' :
//                 view === 'right' ? ', profile view right side' :
//                                    ', front facing portrait';

//             // Anchor prompt: hair change ONLY, preserve everything else
//             const prompt = [
//                 'photo of a person,',
//                 'ONLY the hairstyle is changed,',
//                 STYLE_PROMPTS[styleId] ?? 'natural hairstyle',
//                 viewPrompt + ',',
//                 'photorealistic hair,',
//                 'sharp detailed hair strands,',
//                 'natural skin,',
//                 'no makeup change,',
//                 'no clothing change,',
//                 'identical face and facial features,',
//                 'studio portrait lighting',
//             ].join(' ');

//             // Comprehensive negative prompt
//             const negative_prompt = [
//                 // Face protection
//                 'distorted face', 'deformed face', 'disfigured', 'mutated face',
//                 'extra eyes', 'extra ears', 'bad anatomy', 'face morphing',
//                 'different person', 'face swap', 'age change', 'gender change',
//                 // Accessories (your main complaint)
//                 'jewelry', 'necklace', 'earrings', 'rings', 'accessories',
//                 'hat', 'headband', 'hair clip', 'hair ornament', 'tiara', 'crown',
//                 // Quality
//                 'blurry', 'out of focus', 'low quality', 'pixelated', 'noise',
//                 'watermark', 'text', 'logo',
//                 // Style drift
//                 'cartoon', 'anime', 'painting', 'illustration', 'CGI', 'render',
//                 'makeup change', 'lipstick change', 'skin color change',
//                 // Body drift
//                 'clothing change', 'background change', 'cropped head', 'cut off hair',
//             ].join(', ');

//             const cleanBase64 = photoBase64.includes(',')
//                 ? photoBase64.split(',')[1]
//                 : photoBase64;

//             const result = await env.AI.run('@cf/runwayml/stable-diffusion-v1-5-img2img', {
//                 prompt,
//                 negative_prompt,
//                 image_b64: cleanBase64,

//                 // KEY FIXES:
//                 // Lower strength = model stays closer to input image (less creative drift)
//                 // 0.3–0.4 is the sweet spot for hair-only changes
//                 strength: 0.35,

//                 // Lower guidance = softer prompt adherence, less aggressive face overwrite
//                 // 7.5 is the SD default and most stable
//                 guidance: 7.5,

//                 num_steps: 20, // max allowed
//             });

//             return new Response(result, {
//                 headers: {
//                     'Content-Type': 'image/png',
//                     'Access-Control-Allow-Origin': '*',
//                 },
//             });

//         } catch (err: any) {
//             console.error('💥 Worker crash:', err);
//             return new Response(
//                 JSON.stringify({ error: 'Worker crashed', details: err.message }),
//                 { status: 500 }
//             );
//         }
//     },
// };