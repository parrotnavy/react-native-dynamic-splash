import type { SplashConfig } from "../types";

export function validateSplashConfig(config: any): config is SplashConfig {
	if (typeof config !== "object" || config === null) return false;

	const {
		imageName,
		alt,
		startAt,
		endAt,
		imageUrl,
		backgroundColor,
		weight,
		configVersion,
	} = config;

	if (typeof imageName !== "string" || !imageName) return false;
	if (typeof alt !== "string") return false;
	if (typeof imageUrl !== "string" || !imageUrl.startsWith("http"))
		return false;
	if (typeof configVersion !== "string" || !configVersion) return false;

	if (backgroundColor && typeof backgroundColor !== "string") return false;
	if (
		weight !== undefined &&
		(typeof weight !== "number" || Number.isNaN(weight) || weight < 0)
	) {
		return false;
	}

	if (!isValidDate(startAt)) return false;
	if (!isValidDate(endAt)) return false;

	const start = new Date(startAt).getTime();
	const end = new Date(endAt).getTime();

	if (start >= end) return false;

	return true;
}

function isValidDate(dateStr: any): boolean {
	if (typeof dateStr !== "string") return false;
	const date = new Date(dateStr);
	return !Number.isNaN(date.getTime());
}

export function isWithinTimeWindow(startAt: string, endAt: string): boolean {
	const now = Date.now();
	const start = new Date(startAt).getTime();
	const end = new Date(endAt).getTime();
	return now >= start && now <= end;
}
