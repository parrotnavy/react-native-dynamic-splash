import React from "react";
import { View } from "react-native";

export const SafeAreaView = ({ children, ...props }: any) => (
	<View {...props}>{children}</View>
);

export const SafeAreaProvider = ({ children }: any) => <>{children}</>;

export const useSafeAreaInsets = () => ({
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
});
