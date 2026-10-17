export function isTrustedExtensionSender(senderUrl: string | undefined, extensionOrigin: string): boolean {
  return typeof senderUrl === 'string' && senderUrl.startsWith(extensionOrigin);
}
