import "server-only";

/**
 * WhatsApp Cloud API configuration.
 *
 * Every value is read from the environment — no credential is ever committed.
 * Sending is behind a second, deliberate interlock (WHATSAPP_ENABLE_SENDING)
 * so that merely having credentials present can never start messaging real
 * people, which matters while a test number is still pointed at the app.
 */

export const whatsappConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN?.trim() ?? "",
  appSecret: process.env.WHATSAPP_APP_SECRET?.trim() ?? "",
  sendingEnabled: process.env.WHATSAPP_ENABLE_SENDING?.trim() === "true",
  graphVersion: process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v25.0",
};

/** Can we accept inbound webhooks? */
export function canReceive() {
  return Boolean(whatsappConfig.verifyToken && whatsappConfig.appSecret);
}

/** Can we actually send a reply back? */
export function canSend() {
  return Boolean(
    whatsappConfig.sendingEnabled &&
      whatsappConfig.accessToken &&
      whatsappConfig.phoneNumberId,
  );
}

export function whatsappStatus() {
  return {
    receiving: canReceive(),
    sending: canSend(),
    sendingEnabled: whatsappConfig.sendingEnabled,
    hasAccessToken: Boolean(whatsappConfig.accessToken),
    hasPhoneNumberId: Boolean(whatsappConfig.phoneNumberId),
    hasVerifyToken: Boolean(whatsappConfig.verifyToken),
    hasAppSecret: Boolean(whatsappConfig.appSecret),
  };
}
