import { z } from "zod";

export function parseEnv<TShape extends z.ZodRawShape>(
	shape: TShape,
	input: NodeJS.ProcessEnv = process.env,
) {
	return z.object(shape).parse(input);
}

export function formatEnvError(error: unknown): string {
	if (error instanceof z.ZodError) {
		return error.issues
			.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
			.join("\n");
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Unknown environment parsing failure";
}
