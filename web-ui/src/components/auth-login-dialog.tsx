import { useStore } from "@tanstack/react-store";
import { CheckCircle, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { clientManager } from "@/lib/client-manager";
import { authStore, clearLoginFlow, type LoginFlowState } from "@/stores/auth";

interface AuthLoginDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AuthLoginDialog({ open, onOpenChange }: AuthLoginDialogProps) {
	const { loginFlow } = useStore(authStore, (state) => ({
		loginFlow: state.loginFlow,
	}));

	// Close and clear flow when dialog is closed
	useEffect(() => {
		if (!open && loginFlow) {
			clearLoginFlow();
		}
	}, [open, loginFlow]);

	if (!loginFlow) {
		return null;
	}

	const handleCancel = () => {
		if (loginFlow.loginFlowId && loginFlow.status !== "complete" && loginFlow.status !== "error") {
			const client = clientManager.getClient();
			client?.authLoginCancel(loginFlow.loginFlowId);
		}
		onOpenChange(false);
	};

	const handleClose = () => {
		onOpenChange(false);
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{loginFlow.status === "complete" && loginFlow.success
							? "Login Successful"
							: loginFlow.status === "error"
								? "Login Failed"
								: `Sign in to ${loginFlow.providerId}`}
					</AlertDialogTitle>
					<AlertDialogDescription>
						<LoginFlowContent flow={loginFlow} />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					{loginFlow.status === "complete" || loginFlow.status === "error" ? (
						<AlertDialogAction onClick={handleClose}>Close</AlertDialogAction>
					) : (
						<AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function LoginFlowContent({ flow }: { flow: LoginFlowState }) {
	const client = clientManager.getClient();

	const handleManualInput = (value: string) => {
		if (flow.loginFlowId && client) {
			client.authLoginInput(flow.loginFlowId, value);
		}
	};

	const handlePromptSubmit = (value: string) => {
		if (flow.loginFlowId && client) {
			client.authLoginInput(flow.loginFlowId, value);
		}
	};

	// Idle state (just started)
	if (flow.status === "idle") {
		return (
			<div className="flex items-center gap-3 py-4">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				<span className="text-sm">Starting login...</span>
			</div>
		);
	}

	// URL received (OAuth flow)
	if (flow.status === "waiting_url" && flow.url) {
		return (
			<div className="space-y-4 py-4">
				<div className="space-y-2">
					<p className="text-sm">Please complete the authentication in your browser:</p>
					<Button onClick={() => window.open(flow.url, "_blank")} className="w-full" variant="default">
						<ExternalLink className="mr-2 h-4 w-4" />
						Open in Browser
					</Button>
				</div>

				{flow.instructions && (
					<p className="text-xs text-muted-foreground rounded-md bg-muted p-2">{flow.instructions}</p>
				)}

				{flow.showManualInput && <ManualCodeInput onSubmit={handleManualInput} />}

				{flow.progressMessage && (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Loader2 className="h-3 w-3 animate-spin" />
						<span>{flow.progressMessage}</span>
					</div>
				)}
			</div>
		);
	}

	// Waiting for user input (prompt from OAuth flow)
	if (flow.status === "waiting_input" && flow.promptMessage) {
		return (
			<div className="py-4">
				<PromptInput message={flow.promptMessage} placeholder={flow.promptPlaceholder} onSubmit={handlePromptSubmit} />
			</div>
		);
	}

	// In progress
	if (flow.status === "in_progress") {
		return (
			<div className="flex items-center gap-3 py-4">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				<span className="text-sm">{flow.progressMessage || "Completing authentication..."}</span>
			</div>
		);
	}

	// Complete (success)
	if (flow.status === "complete" && flow.success) {
		return (
			<div className="flex items-center gap-3 py-4 text-green-600">
				<CheckCircle className="h-5 w-5" />
				<span className="text-sm">Successfully authenticated with {flow.providerId}</span>
			</div>
		);
	}

	// Complete (error)
	if (flow.status === "error" || (flow.status === "complete" && !flow.success)) {
		return (
			<div className="space-y-2 py-4">
				<div className="flex items-center gap-3 text-destructive">
					<XCircle className="h-5 w-5" />
					<span className="text-sm font-medium">Authentication failed</span>
				</div>
				{flow.error && <p className="text-xs text-muted-foreground rounded-md bg-muted p-2">{flow.error}</p>}
			</div>
		);
	}

	return null;
}

function ManualCodeInput({ onSubmit }: { onSubmit: (value: string) => void }) {
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const code = formData.get("code") as string;
		if (code?.trim()) {
			onSubmit(code.trim());
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			<Field>
				<FieldLabel htmlFor="manual-code">Or paste the authorization code/URL here:</FieldLabel>
				<div className="flex gap-2">
					<Input id="manual-code" name="code" type="text" placeholder="Paste code or redirect URL" className="flex-1" />
					<Button type="submit" size="sm">
						Submit
					</Button>
				</div>
			</Field>
		</form>
	);
}

function PromptInput({
	message,
	placeholder,
	onSubmit,
}: {
	message: string;
	placeholder?: string;
	onSubmit: (value: string) => void;
}) {
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const value = formData.get("prompt-value") as string;
		if (value?.trim()) {
			onSubmit(value.trim());
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<p className="text-sm">{message}</p>
			<Field>
				<div className="flex gap-2">
					<Input
						id="prompt-value"
						name="prompt-value"
						type="text"
						placeholder={placeholder || "Enter value"}
						className="flex-1"
						autoFocus
					/>
					<Button type="submit" size="sm">
						Submit
					</Button>
				</div>
			</Field>
		</form>
	);
}
