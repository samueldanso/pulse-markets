/**
 * Yellow Network Client
 * Raw WebSocket client for Yellow state channels (sandbox-compatible)
 */

import {
	createAuthRequestMessage,
	createAuthVerifyMessageFromChallenge,
	createECDSAMessageSigner,
	createEIP712AuthMessageSigner,
	createGetConfigMessage,
	createGetLedgerBalancesMessage,
} from "@erc7824/nitrolite";
import type { WalletClient } from "viem";
import WebSocket from "ws";

import { generateSessionKey, getSessionExpiry } from "./auth";
import {
	APP_NAME,
	AUTH_SCOPE,
	CLEARNODE_SANDBOX_URL,
	SESSION_DURATION,
} from "./constants";
import type {
	SessionKey,
	UnifiedBalance,
	YellowClientConfig,
	YellowConnectionStatus,
} from "./types";

interface PendingRequest {
	resolve: (value: unknown) => void;
	reject: (reason: Error) => void;
}

type MessageListener = (method: string, params: Record<string, unknown>) => void;

export class YellowClient {
	private ws: WebSocket | null = null;
	private sessionKey: SessionKey | null = null;
	private sessionSigner: ReturnType<typeof createECDSAMessageSigner> | null =
		null;
	private walletClient: WalletClient | null = null;
	private connectionStatus: YellowConnectionStatus = {
		connected: false,
		authenticated: false,
		sessionExpiry: null,
		channelId: null,
		unifiedBalance: "0",
	};
	private pendingRequests = new Map<number, PendingRequest>();
	private listeners: MessageListener[] = [];

	constructor(private config: YellowClientConfig) {}

	async connect(walletClient: WalletClient): Promise<void> {
		this.walletClient = walletClient;

		this.sessionKey = generateSessionKey();
		this.sessionSigner = createECDSAMessageSigner(this.sessionKey.privateKey);

		const url = this.config.clearNodeUrl || CLEARNODE_SANDBOX_URL;

		await new Promise<void>((resolve, reject) => {
			this.ws = new WebSocket(url);

			this.ws.on("open", () => {
				this.connectionStatus.connected = true;
				console.log("[Yellow] Connected to ClearNode");
				resolve();
			});

			this.ws.on("error", (error) => {
				reject(new Error(`WebSocket connection failed: ${error.message}`));
			});

			this.ws.on("message", (data) => {
				this.handleRawMessage(data.toString());
			});

			this.ws.on("close", () => {
				this.connectionStatus.connected = false;
				this.connectionStatus.authenticated = false;
				console.log("[Yellow] Disconnected");
			});
		});

		await this.authenticate();
	}

	private async authenticate(): Promise<void> {
		if (!this.ws || !this.sessionKey || !this.walletClient) {
			throw new Error("Client not initialized");
		}

		const walletAddress = this.walletClient.account?.address;
		if (!walletAddress) {
			throw new Error("Wallet address not available");
		}

		const sessionExpiry = getSessionExpiry(SESSION_DURATION);

		const authParams = {
			session_key: this.sessionKey.address,
			allowances: [] as { asset: string; amount: string }[],
			expires_at: BigInt(sessionExpiry),
			scope: AUTH_SCOPE,
		};

		const authMessage = await createAuthRequestMessage({
			address: walletAddress,
			application: APP_NAME,
			...authParams,
		});

		return new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Authentication timed out"));
			}, 15000);

			const originalHandler = this.handleRawMessage.bind(this);

			this.handleRawMessage = (data: string) => {
				const response = JSON.parse(data);

				if (response.res?.[1] === "auth_challenge") {
					const challenge = response.res[2].challenge_message;
					console.log("[Yellow] Received auth challenge");

					if (!this.walletClient || !this.ws) return;

					const eip712Signer = createEIP712AuthMessageSigner(
						this.walletClient,
						authParams,
						{ name: APP_NAME },
					);

					const ws = this.ws;
					createAuthVerifyMessageFromChallenge(eip712Signer, challenge).then(
						(verifyMsg) => {
							ws.send(verifyMsg);
							console.log("[Yellow] Sent auth verify");
						},
					);
					return;
				}

				if (response.res?.[1] === "auth_verify") {
					clearTimeout(timeout);
					this.connectionStatus.authenticated = true;
					this.connectionStatus.sessionExpiry = sessionExpiry;
					console.log("[Yellow] Authenticated successfully");

					// Restore normal message handler
					this.handleRawMessage = originalHandler;
					resolve();

					// Fetch initial balances
					this.fetchLedgerBalances().catch((error) => {
						console.error("[Yellow] Failed to fetch balances:", error);
					});
					return;
				}

				if (response.error || response.res?.[1] === "error") {
					const errorData = response.error || response.res?.[2];
					clearTimeout(timeout);
					this.handleRawMessage = originalHandler;
					reject(
						new Error(
							`Auth failed: ${JSON.stringify(errorData)}`,
						),
					);
					return;
				}

				// Pass other messages (assets, channels, balance) to normal handler
				originalHandler(data);
			};

			if (!this.ws) return reject(new Error("WebSocket not connected"));
			this.ws.send(authMessage);
			console.log("[Yellow] Sent auth request");
		});
	}

	/**
	 * Handle raw WebSocket messages after authentication
	 * Routes responses to pending promises or event listeners
	 */
	private handleRawMessage(data: string): void {
		try {
			const response = JSON.parse(data);

			// Response to a pending request (matched by ID)
			if (response.res) {
				const requestId = response.res[0];
				const method = response.res[1];
				const params = response.res[2] || {};

				const pending = this.pendingRequests.get(requestId);
				if (pending) {
					this.pendingRequests.delete(requestId);
					pending.resolve({ method, params });
					return;
				}

				// Unsolicited event — notify listeners
				this.handleEvent(method, params);
			}

			if (response.error) {
				const requestId = response.error[0];
				const pending = this.pendingRequests.get(requestId);
				if (pending) {
					this.pendingRequests.delete(requestId);
					pending.reject(
						new Error(JSON.stringify(response.error)),
					);
				}
			}
		} catch {
			console.error("[Yellow] Failed to parse message:", data.substring(0, 200));
		}
	}

	private handleEvent(method: string, params: Record<string, unknown>): void {
		if (method === "channels") {
			const channels = (params as { channels?: { channel_id: string }[] })
				.channels;
			if (channels && channels.length > 0) {
				this.connectionStatus.channelId =
					channels[0].channel_id as `0x${string}`;
			}
		}

		if (method === "balance" || method === "balance_update") {
			const balances = (params as { ledger_balances?: UnifiedBalance[] })
				.ledger_balances;
			if (balances) {
				const usdcBalance = balances.find(
					(b) => b.asset === "usdc" || b.asset === "ytest.usd",
				);
				if (usdcBalance) {
					this.connectionStatus.unifiedBalance = usdcBalance.amount;
				}
			}
		}

		for (const listener of this.listeners) {
			listener(method, params);
		}
	}

	/**
	 * Send an RPC message and wait for the response
	 */
	async sendMessage(message: string): Promise<{ method: string; params: Record<string, unknown> }> {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error("Client not connected");
		}

		const parsed = JSON.parse(message);
		const requestId = parsed.req?.[0];

		if (requestId === undefined) {
			this.ws.send(message);
			return { method: "unknown", params: {} };
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(requestId);
				reject(new Error(`Request ${requestId} timed out`));
			}, 10000);

			this.pendingRequests.set(requestId, {
				resolve: (value) => {
					clearTimeout(timeout);
					resolve(value as { method: string; params: Record<string, unknown> });
				},
				reject: (error) => {
					clearTimeout(timeout);
					reject(error);
				},
			});

			if (!this.ws) return reject(new Error("WebSocket closed"));
			this.ws.send(message);
		});
	}

	async fetchLedgerBalances(): Promise<UnifiedBalance[]> {
		if (!this.ws || !this.sessionSigner) {
			throw new Error("Client not connected");
		}

		const walletAddress = this.walletClient?.account?.address;
		const balanceMessage = await createGetLedgerBalancesMessage(
			this.sessionSigner,
			walletAddress,
		);
		const response = await this.sendMessage(balanceMessage);

		const balances =
			(response.params as { ledger_balances?: UnifiedBalance[] })
				?.ledger_balances || [];

		// Update status with latest balance
		const primaryBalance = balances.find(
			(b) => b.asset === "usdc" || b.asset === "ytest.usd",
		);
		if (primaryBalance) {
			this.connectionStatus.unifiedBalance = primaryBalance.amount;
		}

		return balances;
	}

	async fetchConfig(): Promise<Record<string, unknown>> {
		if (!this.ws || !this.sessionSigner) {
			throw new Error("Client not connected");
		}

		const configMessage = await createGetConfigMessage(this.sessionSigner);
		const response = await this.sendMessage(configMessage);
		return response.params;
	}

	/**
	 * Register a listener for unsolicited events
	 */
	onEvent(listener: MessageListener): void {
		this.listeners.push(listener);
	}

	getStatus(): YellowConnectionStatus {
		return { ...this.connectionStatus };
	}

	getSessionSigner() {
		return this.sessionSigner;
	}

	getWalletAddress(): string | undefined {
		return this.walletClient?.account?.address;
	}

	async disconnect(): Promise<void> {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.connectionStatus = {
			connected: false,
			authenticated: false,
			sessionExpiry: null,
			channelId: null,
			unifiedBalance: "0",
		};
	}
}
