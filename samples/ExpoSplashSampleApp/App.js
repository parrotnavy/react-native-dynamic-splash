import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo } from "react";
import {
	createDynamicSplash,
	DynamicSplash,
} from "@parrotnavy/react-native-dynamic-splash";

export default function App() {
	const manager = useMemo(
		() =>
			createDynamicSplash({
				configProvider: async () => {
					const splashData = await fetch('https://raw.githubusercontent.com/parrotnavy/react-native-dynamic-splash/refs/heads/main/docs/splash.json');
					const splashJson = await splashData.json();
					return splashJson;
				},
				minDurationMs: 2000,
				animation: {
					fade: { enabled: true, durationMs: 200 },
					scale: { startScale: 1.0, endScale: 1.02, durationMs: 2000, easing: "linear" },
				},
			}),
		[],
	);

	useEffect(() => {
		manager.mount();
	}, [manager]);

	useEffect(() => {
		const timer = setTimeout(() => {
			DynamicSplash.hide();
		}, 4000);
		return () => clearTimeout(timer);
	}, []);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Dynamic Splash Expo Demo</Text>
			<Text>The dynamic splash will hide in 4 seconds.</Text>
			<StatusBar style="auto" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 10,
	},
});
