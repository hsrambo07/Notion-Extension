import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Define the WhatsApp config schema
const WhatsAppConfigSchema = z.object({
  WHATSAPP_API_TOKEN: z.string().min(1, "WhatsApp API token is required"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1, "WhatsApp Phone Number ID is required"),
  WHATSAPP_VERSION: z.string().default("v17.0"),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(1, "WhatsApp webhook verify token is required"),
});

type WhatsAppConfig = z.infer<typeof WhatsAppConfigSchema>;

// Check if in test mode
const isTestMode = process.env.NODE_ENV === 'test' || process.argv.includes('--test-whatsapp');

// Try to parse config from environment variables
const getConfig = (): WhatsAppConfig => {
  try {
    // Use mock values in test mode
    if (isTestMode) {
      console.log('[TEST MODE] Using mock WhatsApp configuration');
      return {
        WHATSAPP_API_TOKEN: 'test-token',
        WHATSAPP_PHONE_NUMBER_ID: 'test-phone-id',
        WHATSAPP_VERSION: 'v17.0',
        WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'test-verify-token'
      };
    }
    
    return WhatsAppConfigSchema.parse({
      WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_VERSION: process.env.WHATSAPP_VERSION || "v17.0",
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("WhatsApp configuration error:", error.errors);
    } else {
      console.error("Unknown WhatsApp configuration error:", error);
    }
    throw new Error("Failed to load WhatsApp configuration");
  }
};

export { isTestMode };
export default getConfig; 