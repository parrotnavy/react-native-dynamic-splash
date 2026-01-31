import {
	createDynamicSplash,
	DynamicSplash,
} from "@parrotnavy/react-native-dynamic-splash";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SHOWCASE_CONFIG_DATA, splashConfig } from "./splashConfig";

const HIDE_DELAY_MS = 4000;

export default function App() {
	const [visibilityStatus, setVisibilityStatus] = useState("unknown");
	const [lastAction, setLastAction] = useState(null);

	const manager = useMemo(() => createDynamicSplash(splashConfig), []);

	useEffect(() => {
		manager.mount();
	}, [manager]);

	useEffect(() => {
		const timer = setTimeout(() => {
			DynamicSplash.hide();
			setLastAction("hide (auto @ 4s)");
		}, HIDE_DELAY_MS);
		return () => clearTimeout(timer);
	}, []);

	const handleHide = useCallback(() => {
		DynamicSplash.hide();
		setLastAction("hide (manual)");
	}, []);

	const handleCheckVisibility = useCallback(async () => {
		try {
			const visible = await DynamicSplash.isVisible();
			setVisibilityStatus(visible ? "visible" : "hidden");
			setLastAction("isVisible()");
		} catch (e) {
			setVisibilityStatus("error");
		}
	}, []);

	const handleRefetch = useCallback(() => {
		manager.mount();
		setLastAction("mount() refetch");
	}, [manager]);

	return (
		<View style={styles.root}>
			<StatusBar style="light" />
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Dynamic Splash</Text>
					<Text style={styles.headerSubtitle}>Expo Feature Showcase</Text>
				</View>

				{lastAction && (
					<View style={styles.actionBadge}>
						<Text style={styles.actionBadgeText}>Last: {lastAction}</Text>
					</View>
				)}

				<ConfigOverviewCard config={splashConfig} />
				<ApiDemoSection
					onHide={handleHide}
					onCheckVisibility={handleCheckVisibility}
					onRefetch={handleRefetch}
					visibilityStatus={visibilityStatus}
				/>
				<ConfigDetailsCard configs={SHOWCASE_CONFIG_DATA} />
				<FeatureChecklistCard />

				<View style={styles.footer}>
					<Text style={styles.footerText}>
						@parrotnavy/react-native-dynamic-splash
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}

function ConfigOverviewCard({ config }) {
	const options = [
		{ label: "configProvider", value: "async () => [...]", active: true },
		{
			label: "minDurationMs",
			value: `${config.minDurationMs}ms`,
			active: config.minDurationMs != null,
		},
		{
			label: "maxDurationMs",
			value: `${config.maxDurationMs}ms`,
			active: config.maxDurationMs != null,
		},
		{
			label: "animation.fade",
			value: config.animation?.fade?.enabled
				? `${config.animation.fade.durationMs}ms`
				: "disabled",
			active: config.animation?.fade != null,
		},
		{
			label: "animation.scale",
			value: config.animation?.scale
				? `${config.animation.scale.startScale} -> ${config.animation.scale.endScale}`
				: "disabled",
			active: config.animation?.scale != null,
		},
		{
			label: "storageKey",
			value: config.storageKey ?? "default",
			active: config.storageKey != null,
		},
		{
			label: "fileLocation",
			value: config.fileLocation ?? "document",
			active: config.fileLocation != null,
		},
		{
			label: "initialConfig",
			value: config.initialConfig ? "set" : "none",
			active: config.initialConfig != null,
		},
		{
			label: "logger",
			value: config.logger ? "enabled" : "none",
			active: config.logger != null,
		},
		{
			label: "storageReadyTimeoutMs",
			value:
				config.storageReadyTimeoutMs != null
					? `${config.storageReadyTimeoutMs}ms`
					: "0",
			active: config.storageReadyTimeoutMs != null,
		},
		{
			label: "showOnUpdate",
			value: String(config.showOnUpdate ?? false),
			active: config.showOnUpdate != null,
		},
	];

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>InitOptions ({options.length}/11)</Text>
			{options.map((opt) => (
				<View key={opt.label} style={styles.optionRow}>
					<View
						style={[
							styles.dot,
							opt.active ? styles.dotActive : styles.dotInactive,
						]}
					/>
					<Text style={styles.optionLabel}>{opt.label}</Text>
					<Text style={styles.optionValue}>{opt.value}</Text>
				</View>
			))}
		</View>
	);
}

function ApiDemoSection({
	onHide,
	onCheckVisibility,
	onRefetch,
	visibilityStatus,
}) {
	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>API Methods</Text>
			<View style={styles.buttonRow}>
				<ActionButton
					label="Hide"
					sublabel="DynamicSplash.hide()"
					onPress={onHide}
					color="#EF4444"
				/>
				<ActionButton
					label="Visible?"
					sublabel="DynamicSplash.isVisible()"
					onPress={onCheckVisibility}
					color="#3B82F6"
				/>
				<ActionButton
					label="Refetch"
					sublabel="manager.mount()"
					onPress={onRefetch}
					color="#10B981"
				/>
			</View>
			<View style={styles.statusRow}>
				<Text style={styles.statusLabel}>Visibility:</Text>
				<Text style={styles.statusValue}>{visibilityStatus}</Text>
			</View>
		</View>
	);
}

function ActionButton({ label, sublabel, onPress, color }) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.actionButton,
				{ backgroundColor: color, opacity: pressed ? 0.7 : 1 },
			]}
		>
			<Text style={styles.actionButtonLabel}>{label}</Text>
			<Text style={styles.actionButtonSublabel}>{sublabel}</Text>
		</Pressable>
	);
}

function ConfigDetailsCard({ configs }) {
	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>
				SplashConfig Items ({configs.length})
			</Text>
			{configs.map((cfg, idx) => (
				<View
					key={cfg.imageName + idx}
					style={[styles.configItem, idx > 0 && styles.configItemBorder]}
				>
					<Text style={styles.configName}>{cfg.imageName}</Text>
					<Text style={styles.configAlt}>{cfg.alt}</Text>
					<View style={styles.configMeta}>
						<ConfigTag label={`v${cfg.configVersion}`} />
						<ConfigTag label={`w:${cfg.weight ?? 1}`} />
						<ConfigTag
							label={cfg.backgroundColor ?? "no bg"}
							bgColor={cfg.backgroundColor}
						/>
					</View>
					<Text style={styles.configDate}>
						{cfg.startAt.slice(0, 10)} ~ {cfg.endAt.slice(0, 10)}
					</Text>
				</View>
			))}
		</View>
	);
}

function ConfigTag({ label, bgColor }) {
	return (
		<View style={[styles.tag, bgColor ? { backgroundColor: bgColor } : null]}>
			<Text style={[styles.tagText, bgColor ? { color: "#FFF" } : null]}>
				{label}
			</Text>
		</View>
	);
}

function FeatureChecklistCard() {
	const features = [
		{ label: "configProvider (async fetch)", done: true },
		{ label: "minDurationMs timing", done: true },
		{ label: "maxDurationMs auto-hide", done: true },
		{ label: "Fade animation", done: true },
		{ label: "Scale animation", done: true },
		{ label: "Custom storageKey", done: true },
		{ label: "fileLocation setting", done: true },
		{ label: "initialConfig pre-seed", done: true },
		{ label: "Logger hook", done: true },
		{ label: "storageReadyTimeoutMs", done: true },
		{ label: "showOnUpdate flag", done: true },
		{ label: "DynamicSplash.hide()", done: true },
		{ label: "DynamicSplash.isVisible()", done: true },
		{ label: "manager.mount()", done: true },
		{ label: "createDynamicSplash()", done: true },
	];

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>Feature Checklist</Text>
			{features.map((f) => (
				<View key={f.label} style={styles.checkRow}>
					<Text style={styles.checkIcon}>{f.done ? "\u2705" : "\u2B1C"}</Text>
					<Text style={styles.checkLabel}>{f.label}</Text>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#0F172A",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	header: {
		paddingTop: 64,
		paddingBottom: 20,
		paddingHorizontal: 24,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "800",
		color: "#F8FAFC",
		letterSpacing: -0.5,
	},
	headerSubtitle: {
		fontSize: 15,
		color: "#94A3B8",
		marginTop: 4,
	},
	actionBadge: {
		marginHorizontal: 24,
		marginBottom: 16,
		backgroundColor: "#1E293B",
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 14,
		alignSelf: "flex-start",
		borderWidth: 1,
		borderColor: "#334155",
	},
	actionBadgeText: {
		color: "#CBD5E1",
		fontSize: 13,
		fontFamily: "monospace",
	},
	card: {
		marginHorizontal: 16,
		marginBottom: 16,
		backgroundColor: "#1E293B",
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: "#334155",
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#F1F5F9",
		marginBottom: 16,
	},
	optionRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 6,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 10,
	},
	dotActive: {
		backgroundColor: "#22C55E",
	},
	dotInactive: {
		backgroundColor: "#475569",
	},
	optionLabel: {
		flex: 1,
		fontSize: 13,
		color: "#CBD5E1",
		fontFamily: "monospace",
	},
	optionValue: {
		fontSize: 13,
		color: "#94A3B8",
		fontFamily: "monospace",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 16,
	},
	actionButton: {
		flex: 1,
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 8,
		alignItems: "center",
	},
	actionButtonLabel: {
		color: "#FFF",
		fontSize: 14,
		fontWeight: "700",
	},
	actionButtonSublabel: {
		color: "rgba(255,255,255,0.7)",
		fontSize: 9,
		marginTop: 3,
		fontFamily: "monospace",
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#0F172A",
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 14,
	},
	statusLabel: {
		color: "#94A3B8",
		fontSize: 13,
		marginRight: 8,
	},
	statusValue: {
		color: "#F1F5F9",
		fontSize: 13,
		fontWeight: "600",
		fontFamily: "monospace",
	},
	configItem: {
		paddingVertical: 12,
	},
	configItemBorder: {
		borderTopWidth: 1,
		borderTopColor: "#334155",
	},
	configName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#E2E8F0",
		fontFamily: "monospace",
	},
	configAlt: {
		fontSize: 12,
		color: "#94A3B8",
		marginTop: 4,
	},
	configMeta: {
		flexDirection: "row",
		gap: 6,
		marginTop: 8,
	},
	tag: {
		backgroundColor: "#334155",
		borderRadius: 6,
		paddingVertical: 3,
		paddingHorizontal: 8,
	},
	tagText: {
		fontSize: 11,
		color: "#CBD5E1",
		fontFamily: "monospace",
	},
	configDate: {
		fontSize: 11,
		color: "#64748B",
		marginTop: 6,
		fontFamily: "monospace",
	},
	checkRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 4,
	},
	checkIcon: {
		fontSize: 14,
		marginRight: 10,
	},
	checkLabel: {
		fontSize: 13,
		color: "#CBD5E1",
	},
	footer: {
		alignItems: "center",
		paddingVertical: 24,
	},
	footerText: {
		fontSize: 12,
		color: "#475569",
		fontFamily: "monospace",
	},
});
