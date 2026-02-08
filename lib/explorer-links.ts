/**
 * Explorer / verification links for judges and users.
 * Yellow Scan: https://yellowscan.io (search by address, channel ID, session ID)
 * 8004scan: https://www.8004scan.io (ERC-8004 agent registry on Base)
 */

export const YELLOW_SCAN_BASE = "https://yellowscan.io";
export const SCAN_8004_AGENTS_BASE = "https://www.8004scan.io/agents/base";

/** Yellow Scan: view sessions and channels for an address */
export function yellowScanAddressUrl(address: string): string {
  return `${YELLOW_SCAN_BASE}/address/${address}`;
}

/** Yellow Scan: view a channel by ID */
export function yellowScanChannelUrl(channelId: string): string {
  return `${YELLOW_SCAN_BASE}/channel/${channelId}`;
}

/** Yellow Scan: view a session by ID */
export function yellowScanSessionUrl(sessionId: string): string {
  return `${YELLOW_SCAN_BASE}/session/${sessionId}`;
}

/** 8004scan: view agent on Base by agent ID */
export function scan8004AgentUrl(agentId: string | number): string {
  return `${SCAN_8004_AGENTS_BASE}/${agentId}`;
}
