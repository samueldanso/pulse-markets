/**
 * Yellow Network Channels
 * Channel creation and fund allocation
 */

import {
  createCreateChannelMessage,
  createGetChannelsMessage,
  createResizeChannelMessage,
} from "@erc7824/nitrolite";
import type { Hex } from "viem";
import type { YellowClient } from "./client";
import { USDC_ADDRESS, YELLOW_CHAIN_ID } from "./constants";
import type { AllocateParams, ChannelInfo } from "./types";

/**
 * Create a new channel on Yellow Network
 *
 * @param client - YellowClient instance
 * @param asset - Asset address (e.g., USDC contract address)
 * @param chainId - Chain ID (default: Base)
 * @returns Channel ID
 */
export async function createChannel(
  client: YellowClient,
  asset: string = USDC_ADDRESS,
  chainId: number = YELLOW_CHAIN_ID,
): Promise<Hex> {
  const sessionSigner = client.getSessionSigner();
  if (!sessionSigner) {
    throw new Error("Client not authenticated");
  }

  console.log(`[Yellow] Creating channel for ${asset} on chain ${chainId}...`);

  const createMessage = await createCreateChannelMessage(sessionSigner, {
    chain_id: chainId,
    token: asset as `0x${string}`,
  });

  const response = (await client.sendMessage(createMessage)) as Record<string, unknown>;

  const params = response.params as Record<string, unknown> | Record<string, unknown>[] | undefined;
  let channelId: string | undefined;

  if (Array.isArray(params)) {
    channelId = (params[0] as Record<string, unknown>)?.channel_id as string | undefined;
  } else if (params) {
    channelId = (params.channel_id ?? params.channelId) as string | undefined;
  }

  // Some ClearNode versions return channel_id at response top level
  if (!channelId && typeof (response as Record<string, unknown>).channel_id === "string") {
    channelId = (response as Record<string, unknown>).channel_id as string;
  }

  if (!channelId) {
    console.error("[Yellow] Channel create response:", JSON.stringify(response));
    throw new Error("Failed to create channel - no channel_id in response");
  }

  console.log(`[Yellow] Channel created: ${channelId}`);

  return channelId as Hex;
}

/**
 * Allocate funds from Unified Balance to a channel
 * This moves off-chain funds into the channel for use in app sessions
 *
 * @param client - YellowClient instance
 * @param params - Allocation parameters (channel ID, amount)
 * @returns RPC response
 */
export async function allocateToChannel(
  client: YellowClient,
  params: AllocateParams,
): Promise<{ method: string; params: Record<string, unknown> }> {
  const sessionSigner = client.getSessionSigner();
  if (!sessionSigner) {
    throw new Error("Client not authenticated");
  }

  console.log(
    `[Yellow] Allocating ${params.amount} to channel ${params.channelId}...`,
  );

  // Use resize_channel with allocate_amount (not resize_amount!)
  const resizeMessage = await createResizeChannelMessage(sessionSigner, {
    channel_id: params.channelId,
    allocate_amount: BigInt(params.amount), // Move from Unified Balance → Channel
    funds_destination: params.channelId, // Destination address
  });

  const response = await client.sendMessage(resizeMessage);

  console.log(`[Yellow] Allocated successfully`);

  return response;
}

/**
 * Deallocate funds from a channel back to Unified Balance
 *
 * @param client - YellowClient instance
 * @param channelId - Channel ID
 * @param amount - Amount to deallocate
 * @returns RPC response
 */
export async function deallocateFromChannel(
  client: YellowClient,
  channelId: Hex,
  amount: string,
): Promise<{ method: string; params: Record<string, unknown> }> {
  const sessionSigner = client.getSessionSigner();
  if (!sessionSigner) {
    throw new Error("Client not authenticated");
  }

  console.log(`[Yellow] Deallocating ${amount} from channel ${channelId}...`);

  const resizeMessage = await createResizeChannelMessage(sessionSigner, {
    channel_id: channelId,
    resize_amount: -BigInt(amount),
    funds_destination: channelId,
  });

  const response = await client.sendMessage(resizeMessage);

  console.log(`[Yellow] Deallocated successfully`);

  return response;
}

/**
 * Get all channels for the authenticated account
 *
 * @param client - YellowClient instance
 * @returns List of channels
 */
export async function getChannels(
  client: YellowClient,
): Promise<ChannelInfo[]> {
  const sessionSigner = client.getSessionSigner();
  if (!sessionSigner) {
    throw new Error("Client not authenticated");
  }

  const channelsMessage = await createGetChannelsMessage(sessionSigner);
  const response = (await client.sendMessage(channelsMessage)) as any;

  // ClearNode may return params as array of channels or object with .channels key
  const params = response.params;
  const channels = Array.isArray(params)
    ? params
    : params?.channels || [];

  return channels.map((ch: Record<string, unknown>) => ({
    channelId: ch.channel_id as string,
    chainId: ch.chain_id as number,
    asset: (ch.token || ch.asset || "") as string,
    balance: (ch.balance || "0") as string,
    status: (ch.status || "open") as string,
    participants: (ch.participants || []) as string[],
  }));
}

/**
 * Get or create a channel for USDC on Base
 * If channel already exists, return it. Otherwise, create new one.
 *
 * @param client - YellowClient instance
 * @returns Channel ID
 */
export async function getOrCreateChannel(client: YellowClient): Promise<Hex> {
  // Check for existing channels
  const channels = await getChannels(client);

  // Find any open channel on the configured chain
  const openChannel = channels.find(
    (ch) => ch.status === "open" && ch.chainId === YELLOW_CHAIN_ID,
  );

  if (openChannel) {
    console.log(`[Yellow] Using existing channel: ${openChannel.channelId}`);
    return openChannel.channelId;
  }

  // Create new channel
  console.log("[Yellow] No existing channel found, creating new one...");
  return await createChannel(client);
}
