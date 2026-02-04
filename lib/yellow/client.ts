/**
 * Yellow Network Client
 * Core WebSocket client for Yellow state channels
 */

import { Client } from "yellow-ts";
import {
	createAuthRequestMessage,
	createAuthVerifyMessage,
	createEIP712AuthMessageSigner,
	createECDSAMessageSigner,
	createGetConfigMessage,
	createGetLedgerBalancesMessage,
	RPCMethod,
	type RPCResponse,
} from "@erc7824/nitrolite";
import type { WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type {
	YellowClientConfig,
	SessionKey,
	YellowConnectionStatus,
	UnifiedBalance,
} from "./types";
import {
	CLEARNODE_URL,
	SESSION_DURATION,
	APP_NAME,
	AUTH_SCOPE,
} from "./constants";
import { generateSessionKey, getSessionExpiry } from "./auth";

export class YellowClient {
	private wsClient: Client | null = null;
	private sessionKey: SessionKey | null = null;
	private sessionSigner: any = null; // MessageSigner type from SDK
	private walletClient: WalletClient | null = null;
	private connectionStatus: YellowConnectionStatus = {
		connected: false,
		authenticated: false,
		sessionExpiry: null,
		channelId: null,
		unifiedBalance: "0",
	};

	constructor(private config: YellowClientConfig) {}

	/**
	 * Connect to Yellow ClearNode and authenticate
	 *
	 * @param walletClient - Viem wallet client (from Privy or MetaMask)
	 */
	async connect(walletClient: WalletClient): Promise<void> {
		this.walletClient = walletClient;

		// Generate temporary session key
		this.sessionKey = generateSessionKey();
		this.sessionSigner = createECDSAMessageSigner(this.sessionKey.privateKey);

		// Connect WebSocket
		this.wsClient = new Client({
			url: this.config.clearNodeUrl || CLEARNODE_URL,
		});

		await this.wsClient.connect();
		this.connectionStatus.connected = true;

		console.log("[Yellow] Connected to ClearNode");

		// Start authentication flow
		await this.authenticate();
	}

	/**
	 * Authenticate with Yellow Network via EIP-712 challenge-response
	 */
	private async authenticate(): Promise<void> {
		if (!this.wsClient || !this.sessionKey || !this.walletClient) {
			throw new Error("Client not initialized");
		}

		const walletAddress = this.walletClient.account?.address;
		if (!walletAddress) {
			throw new Error("Wallet address not available");
		}

		const sessionExpiry = getSessionExpiry(SESSION_DURATION);

		// Create auth request
		const authMessage = await createAuthRequestMessage({
			address: walletAddress,
			session_key: this.sessionKey.address,
			allowances: [], // No spending limits for hackathon
			expires_at: BigInt(sessionExpiry),
			scope: AUTH_SCOPE,
			application: walletAddress,
		});

		// Send auth request
		await this.wsClient.sendMessage(authMessage);

		// Listen for auth challenge and complete flow
		this.wsClient.listen(async (response: RPCResponse) => {
			await this.handleMessage(response, {
				walletAddress,
				sessionExpiry,
			});
		});
	}

	/**
	 * Handle incoming RPC messages from ClearNode
	 */
	private async handleMessage(
		response: RPCResponse,
		authContext?: { walletAddress: `0x${string}`; sessionExpiry: number },
	): Promise<void> {
		switch (response.method) {
			case RPCMethod.AuthChallenge:
				if (!authContext) return;
				await this.handleAuthChallenge(response, authContext);
				break;

			case RPCMethod.AuthVerify:
				this.handleAuthSuccess(response);
				break;

			case RPCMethod.BalanceUpdate:
				this.handleBalanceUpdate(response);
				break;

			case RPCMethod.ChannelsUpdate:
				this.handleChannelsUpdate(response);
				break;

			case RPCMethod.Error:
				console.error("[Yellow] RPC Error:", response.params);
				break;

			default:
				// Log other messages for debugging
				console.log(`[Yellow] RPC: ${response.method}`, response.params);
		}
	}

	/**
	 * Handle auth challenge - sign with main wallet via EIP-712
	 */
	private async handleAuthChallenge(
		response: RPCResponse,
		context: { walletAddress: `0x${string}`; sessionExpiry: number },
	): Promise<void> {
		if (!this.walletClient || !this.sessionKey || !this.wsClient) return;

		console.log("[Yellow] Received auth challenge, signing...");

		const authParams = {
			wallet: context.walletAddress,
			session_key: this.sessionKey.address,
			scope: AUTH_SCOPE,
			expires_at: BigInt(context.sessionExpiry),
			allowances: [],
			application: context.walletAddress,
		};

		// Create EIP-712 signer
		const eip712Signer = createEIP712AuthMessageSigner(
			this.walletClient,
			authParams,
			{ name: APP_NAME },
		);

		// Create and send auth verify message
		const verifyMessage = await createAuthVerifyMessage(
			eip712Signer,
			response as any,
		);
		await this.wsClient.sendMessage(verifyMessage);
	}

	/**
	 * Handle successful authentication
	 */
	private handleAuthSuccess(response: RPCResponse): void {
		console.log("[Yellow] Authenticated successfully");

		if (!this.sessionKey) return;

		this.connectionStatus.authenticated = true;
		this.connectionStatus.sessionExpiry = getSessionExpiry(SESSION_DURATION);

		// Fetch initial balances
		this.fetchLedgerBalances().catch((error) => {
			console.error("[Yellow] Failed to fetch balances:", error);
		});
	}

	/**
	 * Handle balance updates from ClearNode
	 */
	private handleBalanceUpdate(response: RPCResponse): void {
		const params = response.params as any;
		const balances = params?.balances || [];
		console.log("[Yellow] Balance update:", balances);

		// Find USDC balance
		const usdcBalance = balances.find((b: UnifiedBalance) => b.asset === "usdc");
		if (usdcBalance) {
			this.connectionStatus.unifiedBalance = usdcBalance.amount;
		}
	}

	/**
	 * Handle channel updates from ClearNode
	 */
	private handleChannelsUpdate(response: RPCResponse): void {
		const params = response.params as any;
		const channels = params?.channels || [];
		console.log("[Yellow] Channels update:", channels);

		// TODO: Store channel info for later use
		if (channels.length > 0) {
			this.connectionStatus.channelId = channels[0].channel_id;
		}
	}

	/**
	 * Fetch unified ledger balances
	 */
	async fetchLedgerBalances(): Promise<UnifiedBalance[]> {
		if (!this.wsClient || !this.sessionSigner) {
			throw new Error("Client not connected");
		}

		const balanceMessage = await createGetLedgerBalancesMessage(
			this.sessionSigner,
		);
		const response = await this.wsClient.sendMessage(balanceMessage);

		return response.params?.balances || [];
	}

	/**
	 * Fetch Yellow Network configuration (custody/adjudicator addresses)
	 */
	async fetchConfig(): Promise<any> {
		if (!this.wsClient || !this.sessionSigner) {
			throw new Error("Client not connected");
		}

		const configMessage = await createGetConfigMessage(this.sessionSigner);
		const response = (await this.wsClient.sendMessage(configMessage)) as any;

		return response.params;
	}

	/**
	 * Send a raw RPC message
	 */
	async sendMessage(message: string): Promise<any> {
		if (!this.wsClient) {
			throw new Error("Client not connected");
		}

		return await this.wsClient.sendMessage(message);
	}

	/**
	 * Get current connection status
	 */
	getStatus(): YellowConnectionStatus {
		return { ...this.connectionStatus };
	}

	/**
	 * Get session signer for signing RPC messages
	 */
	getSessionSigner() {
		return this.sessionSigner;
	}

	/**
	 * Disconnect from Yellow Network
	 */
	async disconnect(): Promise<void> {
		if (this.wsClient) {
			await this.wsClient.disconnect();
			this.wsClient = null;
		}

		this.connectionStatus = {
			connected: false,
			authenticated: false,
			sessionExpiry: null,
			channelId: null,
			unifiedBalance: "0",
		};

		console.log("[Yellow] Disconnected");
	}
}
