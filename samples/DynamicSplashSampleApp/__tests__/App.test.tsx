import React from "react";
import { NativeModules } from "react-native";
import {
	act,
	create,
	type ReactTestInstance,
	type ReactTestRenderer,
} from "react-test-renderer";
import {
	createDynamicSplash,
	DynamicSplash,
	mockManager,
} from "../__mocks__/dist";
import App from "../App";

jest.useFakeTimers();

function findPressableByText(
	root: ReactTestInstance,
	text: string,
): ReactTestInstance {
	const textElements = root.findAll((el) => el.props.children === text);
	if (textElements.length === 0) {
		throw new Error(`Text "${text}" not found`);
	}
	for (const textEl of textElements) {
		let node: ReactTestInstance | null = textEl.parent;
		while (node) {
			if (node.props.onPress) return node;
			node = node.parent;
		}
	}
	throw new Error(`Pressable with text "${text}" not found`);
}

function collectTextContent(root: ReactTestInstance): string[] {
	return root
		.findAll((el) => typeof el.props.children === "string")
		.map((el) => el.props.children as string);
}

describe("App", () => {
	let tree: ReactTestRenderer;

	beforeEach(() => {
		jest.clearAllMocks();
		mockManager.mount.mockResolvedValue(undefined);
		mockManager.hide.mockResolvedValue(undefined);
		mockManager.isVisible.mockResolvedValue(false);
		DynamicSplash.hide.mockResolvedValue(undefined);
		DynamicSplash.isVisible.mockResolvedValue(false);
		(
			NativeModules.DynamicSplashNative.getLastLoadedMeta as jest.Mock
		).mockResolvedValue(null);
	});

	afterEach(async () => {
		await act(async () => {
			if (tree) tree.unmount();
		});
	});

	it("renders without crashing", async () => {
		await act(async () => {
			tree = create(<App />);
		});
		expect(tree.toJSON()).toBeTruthy();
	});

	it("calls createDynamicSplash with splashConfig on render", async () => {
		await act(async () => {
			tree = create(<App />);
		});
		expect(createDynamicSplash).toHaveBeenCalledTimes(1);
		expect(createDynamicSplash).toHaveBeenCalledWith(
			expect.objectContaining({
				minDurationMs: 2000,
				maxDurationMs: 5000,
				storageKey: "SAMPLE_APP_SPLASH_META",
				fileLocation: "cache",
				showOnUpdate: true,
				storageReadyTimeoutMs: 3000,
			}),
		);
	});

	it("calls manager.mount() on mount", async () => {
		await act(async () => {
			tree = create(<App />);
		});
		expect(mockManager.mount).toHaveBeenCalled();
	});

	it("calls DynamicSplash.hide() after 3s timeout", async () => {
		await act(async () => {
			tree = create(<App />);
		});

		(DynamicSplash.hide as jest.Mock).mockClear();

		await act(async () => {
			jest.advanceTimersByTime(3000);
		});

		expect(DynamicSplash.hide).toHaveBeenCalled();
	});

	it('"Hide Splash" button calls DynamicSplash.hide()', async () => {
		await act(async () => {
			tree = create(<App />);
		});

		(DynamicSplash.hide as jest.Mock).mockClear();

		const hideButton = findPressableByText(tree.root, "Hide Splash");
		await act(async () => {
			hideButton.props.onPress();
		});

		expect(DynamicSplash.hide).toHaveBeenCalled();
	});

	it('"Check Visibility" calls isVisible() and displays result', async () => {
		DynamicSplash.isVisible.mockResolvedValue(false);

		await act(async () => {
			tree = create(<App />);
		});

		(DynamicSplash.isVisible as jest.Mock).mockClear();
		DynamicSplash.isVisible.mockResolvedValue(true);

		const checkButton = findPressableByText(tree.root, "Check Visibility");
		await act(async () => {
			checkButton.props.onPress();
		});

		expect(DynamicSplash.isVisible).toHaveBeenCalled();

		const texts = collectTextContent(tree.root);
		expect(texts).toContain("Splash Visible");
	});

	it('"Refetch Config" button calls manager.mount()', async () => {
		await act(async () => {
			tree = create(<App />);
		});

		mockManager.mount.mockClear();

		const refetchButton = findPressableByText(tree.root, "Refetch Config");
		await act(async () => {
			refetchButton.props.onPress();
		});

		expect(mockManager.mount).toHaveBeenCalled();
	});

	it("loads and displays native meta", async () => {
		const metaJson = JSON.stringify({
			imageName: "test-image",
			status: "READY",
		});
		(
			NativeModules.DynamicSplashNative.getLastLoadedMeta as jest.Mock
		).mockResolvedValue(metaJson);

		await act(async () => {
			tree = create(<App />);
		});

		const texts = collectTextContent(tree.root);
		expect(texts).toContain("imageName");
		expect(texts).toContain("test-image");
	});

	it("renders all feature checklist items", async () => {
		await act(async () => {
			tree = create(<App />);
		});

		const texts = collectTextContent(tree.root);

		const featureLabels = [
			"configProvider",
			"minDurationMs",
			"maxDurationMs",
			"animation.fade",
			"animation.scale",
			"storageKey",
			"fileLocation",
			"initialConfig",
			"logger",
			"storageReadyTimeoutMs",
			"showOnUpdate",
			"createDynamicSplash()",
			"manager.mount()",
			"DynamicSplash.hide()",
			"DynamicSplash.isVisible()",
			"Weighted selection",
			"GIF/APNG support",
		];

		for (const label of featureLabels) {
			expect(texts).toContain(label);
		}
	});
});
