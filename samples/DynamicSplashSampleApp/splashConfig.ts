import { Platform } from "react-native";
import type { InitOptions } from "../../dist";

export const splashConfig: InitOptions = {
    configProvider: async () => {
        // const splashData = await fetch('https://raw.githubusercontent.com/parrotnavy/react-native-dynamic-splash/refs/heads/main/docs/splash.json');
        let splashData = null;
        if (Platform.OS === 'android') {
            splashData = await fetch('http://10.0.2.2:3000/splash.json');
        } else {
            splashData = await fetch('http://localhost:3000/splash.json');
        }
        return splashData.json();
    },
    logger: (msg: string, ...args: any[]) => console.log('[SampleApp]', msg, ...args),
    minDurationMs: 2000,
    maxDurationMs: 2000,
    enableFade: true,
    fadeDurationMs: 200,
    showOnUpdate: false,
};
