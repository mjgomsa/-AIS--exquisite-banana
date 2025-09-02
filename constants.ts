export const NOIR_STYLE_IMAGE_PATH = 'noirRef.jpeg';
export const NOIR_THUMB = 'noir_thumb.png';

// Add new style image paths
export const WATERCOLOR_STYLE_IMAGE_PATH = 'watercolorRef.jpeg';
export const WATERCOLOR_THUMB = 'watercolor_thumb.jpeg';

// Image generation prompts
export const IMAGE_PROMPTS = {
  head: {
    replace: 'Entirely replace the head in this reference image with a head of {prompt}. Do NOT keep the head in the reference image, create an entirely new head and place in the same location (upper edge) as the reference phot.',
    continue: 'Continue this drawing by adding a {prompt} head above the existing torso. Build upon the current image.'
  },
  torso: {
    continue: 'Continue this drawing by adding the torso of a {prompt} below the existing head. Seamlessly, build upon the current image so that the torso is connected to the head-- stop your drawing where the legs should be.'
  },
  legs: {
    continue: 'Continue this drawing by adding {prompt} legs below the existing torso. Seamlessly, build upon the current image so that the legs are connected to the torso.'
  }
};

  // Stylistic references object
 export const stylisticReferences = {
    noir: {
      path: NOIR_STYLE_IMAGE_PATH,
      description: 'This artistic style, best described as Whimsical Grotesque Illustration with Neo-Traditional Tattoo and Dark Carnival Aesthetic, features eccentric, often unsettling anthropomorphic or clown-like characters. It is defined by dominant, thick black outlines and fine, illustrative hatching for textures, all rendered in a high-contrast, limited palette of black and white, strikingly accented by bright red for key features like lips, beaks, or makeup. Shading is minimal, relying on solid fills or cross-hatching to maintain a flat, graphic appearance, contributing to a darkly whimsical and surreal mood, often against a plain white background, making it ideal for replication using prompts like "ink illustration, neo-traditional tattoo style, black and white with red accents, strong black outlines, detailed hatching, plain white background" for a desired character. IMPORTANT: NEVER MAKE THE PROMPT SCARY-- AIM FOR SATIRICAL AND OLD FASHION COMEDY DRAWINGS',
      promptStyle: 'Mantain the artistic style of the reference photo: Whimsical Grotesque Illustration with Neo-Traditional Tattoo and Dark Carnival Aesthetic, features eccentric, often unsettling anthropomorphic or clown-like characters. It is defined by dominant, thick black outlines and fine, illustrative hatching for textures, all rendered in a high-contrast, limited palette of black and white, strikingly accented by bright red for key features like lips, beaks, or makeup.',
      features: [
        'black and white line art',
        'high contrast',
        'fine line work',
        'dramatic shadows',
        'art deco aesthetic'
      ]
    },
    watercolor: {
      path: WATERCOLOR_STYLE_IMAGE_PATH,
      description: 'This artistic style features soft, flowing watercolor paintings with gentle color transitions and organic forms. It is characterized by translucent layers of paint, subtle color bleeding, and a dreamy, ethereal quality. The style uses a muted, pastel color palette with soft edges and natural color gradients, creating a peaceful and contemplative mood. Perfect for prompts like "soft watercolor painting, gentle color transitions, organic forms, dreamy atmosphere, muted pastel palette, soft edges, natural color bleeding"',
      promptStyle: 'Mantain the artistic style of the reference photo: flowing watercolor paintings with gentle color transitions and organic forms. It is characterized by translucent layers of paint, subtle color bleeding, and a dreamy, ethereal quality. The style uses a muted, pastel color palette with soft edges and natural color gradients',
      features: [
        'soft watercolor washes',
        'gentle color transitions',
        'organic flowing forms',
        'muted pastel palette',
        'dreamy atmosphere'
      ]
    }
  };



export const promptGenSysInstruct = 
`
You're a master player of the art game exquisite corpse, with a keen eye for describing unique anthropomorphic items. Your task is to generate a single, unique prompt for an exquisite corpse body part when given either a body part.

AVAILABLE BODY PARTS: head, torso or legs.

Below are good examples meant to guide you on the type of creatively unique prompts:

DO NOT include very colorful descriptive words that might steer to specific colors.

Head:
    'a tucan with a red beak and wild curly hair',
    'a bird person with a long beak and feathered head',
    'a cat person with pointy ears and whiskers',
    'a robot with metallic head and glowing eyes',
    'a monster with horns and multiple eyes',
    'a fairy with delicate wings and flower crown',
    'a dragon with scales blowing smoke',
    'a ghost with a mustache',
    'a snail with two hats over its eyes',
    'a cockatoo with star eyes'

Torso:
    'a hairy blazer',
    'a slender torso with flowing robes',
    'a robotic body with exposed gears',
    'a furry sweater with colorful patches',
    'a scaly fish torso with armored plates',
    'a inverted lightbulb',
    'a wooden torso with carved patterns',
    'a crystalline body with geometric facets',
    'a metallic torso with circuit patterns',
    'a fluffy body with cloud-like texture'

Legs:
    'long spindly legs with bird-like feet',
    'thick muscular legs with hooves',
    'mechanical legs with hydraulic joints',
    'slender legs with webbed feet riding a tricylce',
    'scaly legs with clawed toes',
    'furry legs with paw-like feet wearing a hula skirt',
    'crystalline legs with geometric shapes',
    'metallic legs with wheel attachments',
    'wooden legs with root-like feet',
    'transparent legs with glowing bones'
`
// Random prompts for automatic generation
export const RANDOM_FALLBACK_PROMPTS = {
  head: [
    'a tucan with a red beak and wild curly hair',
    'a bird person with a long beak and feathered head',
    'a cat person with pointy ears and whiskers',
    'a robot with metallic head and glowing eyes',
    'a monster with horns and multiple eyes',
    'a fairy with delicate wings and flower crown',
    'a dragon with scales blowing smoke',
    'a ghost with a mustache',
    'a snail with two hats over its eyes',
    'a cockatoo with star eyes'
  ],
  torso: [
    'a hairy blaxer',
    'a slender torso with flowing robes',
    'a robotic body with exposed gears',
    'a furry sweater with colorful patches',
    'a scaly fish torso with armored plates',
    'a inverted lightbulb',
    'a wooden torso with carved patterns',
    'a crystalline body with geometric facets',
    'a metallic torso with circuit patterns',
    'a fluffy body with cloud-like texture'
  ],
  legs: [
    'long spindly legs with bird-like feet',
    'thick muscular legs with hooves',
    'mechanical legs with hydraulic joints',
    'slender legs with webbed feet riding a tricylce',
    'scaly legs with clawed toes',
    'furry legs with paw-like feet wearing a hula skirt',
    'crystalline legs with geometric shapes',
    'metallic legs with wheel attachments',
    'wooden legs with root-like feet',
    'transparent legs with glowing bones'
  ]
};