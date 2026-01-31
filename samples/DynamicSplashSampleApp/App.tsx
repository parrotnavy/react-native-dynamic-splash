import { type JSX, useCallback, useEffect, useMemo, useState } from "react";
import {
	NativeModules,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SplashConfig } from "../../dist";
import { createDynamicSplash, DynamicSplash } from "../../dist";
import { INITIAL_CONFIG, SHOWCASE_CONFIGS, splashConfig } from "./splashConfig";

const LIB_VERSION = "1.0.0";

const FEATURE_CHECKLIST = [
	{ label: "configProvider", desc: "Embedded showcase array" },
	{ label: "minDurationMs", desc: "2000ms minimum" },
	{ label: "maxDurationMs", desc: "5000ms safety cap" },
	{ label: "animation.fade", desc: "300ms fade-out" },
	{ label: "animation.scale", desc: "1.0 → 1.05x easeInOut" },
	{ label: "storageKey", desc: "Custom key" },
	{ label: "fileLocation", desc: '"cache" mode' },
	{ label: "initialConfig", desc: "Pre-seed fallback" },
	{ label: "logger", desc: "[Splash] prefix" },
	{ label: "storageReadyTimeoutMs", desc: "3000ms timeout" },
	{ label: "showOnUpdate", desc: "Enabled" },
	{ label: "createDynamicSplash()", desc: "Singleton manager" },
	{ label: "manager.mount()", desc: "Background sync" },
	{ label: "DynamicSplash.hide()", desc: "Native hide" },
	{ label: "DynamicSplash.isVisible()", desc: "Visibility check" },
	{ label: "Weighted selection", desc: "3 configs w/ weights" },
	{ label: "GIF/APNG support", desc: "Animated config item" },
] as const;

function App(): JSX.Element {
	const [nativeMeta, setNativeMeta] = useState<string | null>(null);
	const [nativeMetaError, setNativeMetaError] = useState<string | null>(null);
	const [isVisible, setIsVisible] = useState<boolean | null>(null);
	const [lastAction, setLastAction] = useState<string>("");

	const manager = useMemo(() => createDynamicSplash(splashConfig), []);

	const loadNativeMeta = useCallback(async () => {
		try {
			const getLastLoadedMeta =
				NativeModules.DynamicSplashNative?.getLastLoadedMeta;
			if (typeof getLastLoadedMeta !== "function") {
				setNativeMeta(null);
				setNativeMetaError(
					"DynamicSplashNative.getLastLoadedMeta is unavailable",
				);
				return;
			}
			const value = await getLastLoadedMeta();
			setNativeMeta(typeof value === "string" ? value : null);
			setNativeMetaError(null);
		} catch (error) {
			setNativeMeta(null);
			setNativeMetaError(
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	}, []);

	const checkVisibility = useCallback(async () => {
		try {
			const visible = await DynamicSplash.isVisible();
			setIsVisible(visible);
			setLastAction(`isVisible() → ${visible}`);
		} catch {
			setIsVisible(null);
			setLastAction("isVisible() → error");
		}
	}, []);

	const handleHide = useCallback(async () => {
		await DynamicSplash.hide();
		setLastAction("hide() called");
		await checkVisibility();
	}, [checkVisibility]);

	const handleRefetch = useCallback(async () => {
		setLastAction("mount() started...");
		await manager.mount();
		setLastAction("mount() completed");
		await loadNativeMeta();
	}, [manager, loadNativeMeta]);

	useEffect(() => {
		void manager.mount();
		void loadNativeMeta();
		void checkVisibility();
	}, [manager, loadNativeMeta, checkVisibility]);

	useEffect(() => {
		const timer = setTimeout(() => {
			DynamicSplash.hide();
			setLastAction("Auto-hide after 3s");
			checkVisibility();
		}, 3000);
		return () => clearTimeout(timer);
	}, [checkVisibility]);

	const parsedMeta = useMemo(() => {
		if (!nativeMeta) return null;
		try {
			return JSON.parse(nativeMeta);
		} catch {
			return null;
		}
	}, [nativeMeta]);

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={styles.title}>Dynamic Splash</Text>
					<Text style={styles.subtitle}>Feature Showcase</Text>
					<View style={styles.versionBadge}>
						<Text style={styles.versionText}>v{LIB_VERSION}</Text>
					</View>
				</View>

				<Card title="API Demo" titleColor="#6366F1">
					<View style={styles.statusRow}>
						<View
							style={[
								styles.statusDot,
								isVisible === true
									? styles.statusActive
									: isVisible === false
										? styles.statusInactive
										: styles.statusUnknown,
							]}
						/>
						<Text style={styles.statusLabel}>
							{isVisible === true
								? "Splash Visible"
								: isVisible === false
									? "Splash Hidden"
									: "Unknown"}
						</Text>
					</View>

					{lastAction !== "" && (
						<View style={styles.actionLog}>
							<Text style={styles.actionLogText}>{lastAction}</Text>
						</View>
					)}

					<View style={styles.buttonRow}>
						<ActionButton
							label="Hide Splash"
							color="#EF4444"
							onPress={handleHide}
						/>
						<ActionButton
							label="Check Visibility"
							color="#6366F1"
							onPress={checkVisibility}
						/>
						<ActionButton
							label="Refetch Config"
							color="#10B981"
							onPress={handleRefetch}
						/>
					</View>
				</Card>

				<Card title="Config Overview" titleColor="#F59E0B">
					<ConfigRow label="configProvider" value="Embedded array (3 items)" />
					<ConfigRow label="minDurationMs" value="2000" />
					<ConfigRow label="maxDurationMs" value="5000" />
					<ConfigRow label="animation.fade" value="enabled, 300ms" />
					<ConfigRow
						label="animation.scale"
						value="1.0→1.05x, 2000ms, easeInOut"
					/>
					<ConfigRow label="storageKey" value="SAMPLE_APP_SPLASH_META" />
					<ConfigRow label="fileLocation" value='"cache"' />
					<ConfigRow label="initialConfig" value="1 fallback item" />
					<ConfigRow label="logger" value="[Splash] prefix" />
					<ConfigRow label="storageReadyTimeoutMs" value="3000" />
					<ConfigRow label="showOnUpdate" value="true" last />
				</Card>

				<Card title="Splash Configs" titleColor="#10B981">
					{[...SHOWCASE_CONFIGS, INITIAL_CONFIG].map(
						(config: SplashConfig, index: number) => (
							<View
								key={config.imageName}
								style={[
									styles.configItem,
									index < SHOWCASE_CONFIGS.length && styles.configItemBorder,
								]}
							>
								<View style={styles.configHeader}>
									<Text style={styles.configName} numberOfLines={1}>
										{config.imageName}
									</Text>
									{config === INITIAL_CONFIG && (
										<View style={styles.fallbackBadge}>
											<Text style={styles.fallbackBadgeText}>fallback</Text>
										</View>
									)}
								</View>
								<Text style={styles.configAlt} numberOfLines={1}>
									{config.alt}
								</Text>
								<View style={styles.configMeta}>
									<View style={styles.configMetaItem}>
										<Text style={styles.configMetaLabel}>weight</Text>
										<Text style={styles.configMetaValue}>
											{config.weight ?? 1}
										</Text>
									</View>
									<View style={styles.configMetaItem}>
										<Text style={styles.configMetaLabel}>version</Text>
										<Text style={styles.configMetaValue}>
											{config.configVersion}
										</Text>
									</View>
									{config.backgroundColor && (
										<View style={styles.configMetaItem}>
											<View
												style={[
													styles.colorSwatch,
													{ backgroundColor: config.backgroundColor },
												]}
											/>
											<Text style={styles.configMetaValue}>
												{config.backgroundColor}
											</Text>
										</View>
									)}
								</View>
								<Text style={styles.configDates}>
									{new Date(config.startAt).toLocaleDateString()} {" → "}
									{new Date(config.endAt).toLocaleDateString()}
								</Text>
							</View>
						),
					)}
				</Card>

				<Card title="Native Meta" titleColor="#8B5CF6">
					{nativeMetaError ? (
						<Text style={styles.errorText}>{nativeMetaError}</Text>
					) : parsedMeta ? (
						<View style={styles.metaGrid}>
							{Object.entries(parsedMeta).map(([key, value]) => (
								<View key={key} style={styles.metaRow}>
									<Text style={styles.metaKey}>{key}</Text>
									<Text style={styles.metaValue} numberOfLines={2}>
										{typeof value === "object"
											? JSON.stringify(value)
											: String(value)}
									</Text>
								</View>
							))}
						</View>
					) : (
						<View style={styles.codeBlock}>
							<Text style={styles.codeText}>
								{nativeMeta ?? "No native meta stored"}
							</Text>
						</View>
					)}
					<Pressable style={styles.refreshMeta} onPress={loadNativeMeta}>
						<Text style={styles.refreshMetaText}>Reload Meta</Text>
					</Pressable>
				</Card>

				<Card title="Feature Checklist" titleColor="#EC4899">
					<Text style={styles.checklistSubtitle}>
						{FEATURE_CHECKLIST.length} features demonstrated
					</Text>
					{FEATURE_CHECKLIST.map((item) => (
						<View key={item.label} style={styles.checkItem}>
							<View style={styles.checkBox}>
								<Text style={styles.checkMark}>{"✓"}</Text>
							</View>
							<View style={styles.checkContent}>
								<Text style={styles.checkLabel}>{item.label}</Text>
								<Text style={styles.checkDesc}>{item.desc}</Text>
							</View>
						</View>
					))}
				</Card>

				<View style={styles.footer}>
					<Text style={styles.footerText}>
						@parrotnavy/react-native-dynamic-splash
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function Card({
	title,
	titleColor,
	children,
}: {
	title: string;
	titleColor: string;
	children: React.ReactNode;
}) {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<View style={[styles.cardAccent, { backgroundColor: titleColor }]} />
				<Text style={styles.cardTitle}>{title}</Text>
			</View>
			{children}
		</View>
	);
}

function ActionButton({
	label,
	color,
	onPress,
}: {
	label: string;
	color: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			style={({ pressed }) => [
				styles.actionButton,
				{ backgroundColor: color, opacity: pressed ? 0.8 : 1 },
			]}
			onPress={onPress}
		>
			<Text style={styles.actionButtonText}>{label}</Text>
		</Pressable>
	);
}

function ConfigRow({
	label,
	value,
	last,
}: {
	label: string;
	value: string;
	last?: boolean;
}) {
	return (
		<View style={[styles.configRow, !last && styles.configRowBorder]}>
			<Text style={styles.configRowLabel}>{label}</Text>
			<Text style={styles.configRowValue}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0F1117",
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 20,
		paddingBottom: 40,
	},

	header: {
		marginBottom: 24,
		paddingTop: 8,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: "#F9FAFB",
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 15,
		color: "#6B7280",
		marginTop: 2,
	},
	versionBadge: {
		position: "absolute",
		right: 0,
		top: 12,
		backgroundColor: "#1F2937",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 6,
	},
	versionText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#9CA3AF",
		fontFamily: "Menlo",
	},

	card: {
		backgroundColor: "#1A1D27",
		borderRadius: 14,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#2A2D3A",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 14,
	},
	cardAccent: {
		width: 3,
		height: 18,
		borderRadius: 2,
		marginRight: 10,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#E5E7EB",
		letterSpacing: -0.2,
	},

	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	statusDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: 8,
	},
	statusActive: {
		backgroundColor: "#10B981",
	},
	statusInactive: {
		backgroundColor: "#6B7280",
	},
	statusUnknown: {
		backgroundColor: "#F59E0B",
	},
	statusLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#D1D5DB",
	},

	actionLog: {
		backgroundColor: "#111318",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginBottom: 14,
	},
	actionLogText: {
		fontSize: 12,
		fontFamily: "Menlo",
		color: "#9CA3AF",
	},

	buttonRow: {
		flexDirection: "row",
		gap: 8,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center",
	},
	actionButtonText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#FFFFFF",
	},

	configRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
	},
	configRowBorder: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#2A2D3A",
	},
	configRowLabel: {
		fontSize: 13,
		fontFamily: "Menlo",
		color: "#9CA3AF",
		flex: 1,
	},
	configRowValue: {
		fontSize: 13,
		color: "#E5E7EB",
		fontWeight: "500",
		textAlign: "right",
		flex: 1,
	},

	configItem: {
		paddingVertical: 12,
	},
	configItemBorder: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#2A2D3A",
	},
	configHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
	},
	configName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#E5E7EB",
		flex: 1,
	},
	fallbackBadge: {
		backgroundColor: "#F59E0B20",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#F59E0B40",
	},
	fallbackBadgeText: {
		fontSize: 10,
		fontWeight: "600",
		color: "#F59E0B",
		textTransform: "uppercase",
	},
	configAlt: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 8,
	},
	configMeta: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 4,
	},
	configMetaItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	configMetaLabel: {
		fontSize: 11,
		color: "#6B7280",
	},
	configMetaValue: {
		fontSize: 11,
		fontWeight: "600",
		color: "#9CA3AF",
		fontFamily: "Menlo",
	},
	colorSwatch: {
		width: 12,
		height: 12,
		borderRadius: 3,
		borderWidth: 1,
		borderColor: "#3A3D4A",
	},
	configDates: {
		fontSize: 11,
		color: "#4B5563",
		fontFamily: "Menlo",
	},

	metaGrid: {},
	metaRow: {
		flexDirection: "row",
		paddingVertical: 6,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#2A2D3A",
	},
	metaKey: {
		fontSize: 12,
		fontFamily: "Menlo",
		color: "#6B7280",
		width: 130,
	},
	metaValue: {
		fontSize: 12,
		fontFamily: "Menlo",
		color: "#D1D5DB",
		flex: 1,
	},
	codeBlock: {
		backgroundColor: "#111318",
		borderRadius: 8,
		padding: 12,
	},
	codeText: {
		fontSize: 12,
		fontFamily: "Menlo",
		color: "#9CA3AF",
	},
	errorText: {
		fontSize: 13,
		color: "#FCA5A5",
		marginBottom: 8,
	},
	refreshMeta: {
		marginTop: 12,
		backgroundColor: "#8B5CF620",
		paddingVertical: 8,
		borderRadius: 8,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#8B5CF640",
	},
	refreshMetaText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#8B5CF6",
	},

	checklistSubtitle: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 12,
	},
	checkItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 6,
	},
	checkBox: {
		width: 20,
		height: 20,
		borderRadius: 4,
		backgroundColor: "#10B98120",
		borderWidth: 1,
		borderColor: "#10B98160",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	checkMark: {
		fontSize: 12,
		fontWeight: "700",
		color: "#10B981",
	},
	checkContent: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	checkLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#D1D5DB",
	},
	checkDesc: {
		fontSize: 11,
		color: "#6B7280",
	},

	footer: {
		alignItems: "center",
		paddingVertical: 20,
	},
	footerText: {
		fontSize: 12,
		color: "#4B5563",
	},
});

export default App;
