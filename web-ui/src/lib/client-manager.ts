/**
 * Client manager — singleton that manages the clankie client and updates stores.
 */

import { updateLoginFlow } from "@/stores/auth";
import { connectionStore, updateConnectionStatus } from "@/stores/connection";
import {
	appendStreamToken,
	appendThinkingToken,
	endAssistantMessage,
	endThinking,
	startAssistantMessage,
	startThinking,
} from "@/stores/messages";
import {
	setCompacting,
	setModel,
	setSessionId,
	setSessionName,
	setStreaming,
	setThinkingLevel,
	updateSessionState,
} from "@/stores/session";
import { ClankieClient } from "./clankie-client";
import type { AgentSessionEvent, AuthEvent, RpcResponse } from "./types";

class ClientManager {
	private client: ClankieClient | null = null;

	connect(): void {
		if (this.client) {
			console.warn("Client already connected");
			return;
		}

		const { settings } = connectionStore.state;

		if (!settings.authToken) {
			updateConnectionStatus("error", "Auth token is required");
			return;
		}

		this.client = new ClankieClient({
			url: settings.url,
			authToken: settings.authToken,
			onEvent: (sessionId, event) => this.handleEvent(sessionId, event),
			onAuthEvent: (event) => this.handleAuthEvent(event),
			onStateChange: (state, error) => updateConnectionStatus(state, error),
		});

		this.client.connect();
	}

	disconnect(): void {
		if (this.client) {
			this.client.disconnect();
			this.client = null;
		}
	}

	getClient(): ClankieClient | null {
		return this.client;
	}

	isConnected(): boolean {
		return this.client?.getConnectionState() === "connected";
	}

	private handleEvent(sessionId: string, event: AgentSessionEvent | RpcResponse): void {
		// Handle RPC responses (shouldn't normally reach here as they're handled by promises)
		if (event.type === "response") {
			console.log("[client-manager] RPC response:", event);
			return;
		}

		// Handle agent session events (pi-agent-core event protocol)
		switch (event.type) {
			// ─── Session events ────────────────────────────────────────────────
			case "session_start":
				// Use the wrapper sessionId (matches the server's this.sessions key),
				// NOT event.sessionId which is the pi agent's internal ID and may differ.
				setSessionId(sessionId);
				break;

			case "session_name_changed":
				setSessionName(event.name);
				break;

			case "model_changed":
				setModel(event.model);
				break;

			case "thinking_level_changed":
				setThinkingLevel(event.level);
				break;

			case "state_update":
				updateSessionState(event.state);
				break;

			// ─── Agent lifecycle ───────────────────────────────────────────────
			case "agent_start":
				setStreaming(true);
				break;

			case "agent_end":
				setStreaming(false);
				break;

			// ─── Message streaming ─────────────────────────────────────────────
			case "message_start":
				if (event.message?.role === "assistant") {
					startAssistantMessage();
				}
				break;

			case "message_update": {
				const ame = event.assistantMessageEvent;
				if (!ame) break;

				switch (ame.type) {
					case "text_delta":
						// Use the accumulated text from the partial assistant message
						appendStreamToken(
							ame.partial?.content
								?.filter((c: any) => c.type === "text")
								.map((c: any) => c.text)
								.join("") ?? "",
						);
						break;

					case "thinking_start":
						startThinking();
						break;

					case "thinking_delta":
						appendThinkingToken(
							ame.partial?.content
								?.filter((c: any) => c.type === "thinking")
								.map((c: any) => c.thinking)
								.join("") ?? "",
						);
						break;

					case "thinking_end":
						endThinking();
						break;
				}
				break;
			}

			case "message_end":
				if (event.message?.role === "assistant") {
					endAssistantMessage();
				}
				break;

			// ─── Turn lifecycle ────────────────────────────────────────────────
			case "turn_start":
			case "turn_end":
				break;

			// ─── Tool execution ────────────────────────────────────────────────
			case "tool_execution_start":
				console.log("[client-manager] Tool execution:", event.toolName);
				break;

			case "tool_execution_update":
				break;

			case "tool_execution_end":
				break;

			// ─── Compaction ────────────────────────────────────────────────────
			case "compact_start":
			case "auto_compaction_start":
				setCompacting(true);
				break;

			case "compact_end":
			case "auto_compaction_end":
				setCompacting(false);
				break;

			// ─── Errors ────────────────────────────────────────────────────────
			case "error":
				console.error("[client-manager] Agent error:", event.error);
				break;

			default:
				console.log("[client-manager] Unhandled event:", event);
		}
	}

	private handleAuthEvent(event: AuthEvent): void {
		console.log("[client-manager] Auth event:", event);
		updateLoginFlow(event);
	}
}

export const clientManager = new ClientManager();
