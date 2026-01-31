import React from "react";
import renderer, { act } from "react-test-renderer";

const mockMount = jest.fn().mockResolvedValue(undefined);
const mockHide = jest.fn().mockResolvedValue(undefined);
const mockIsVisible = jest.fn().mockResolvedValue(false);
const mockCreateDynamicSplash = jest.fn(() => ({ mount: mockMount }));

jest.mock("@parrotnavy/react-native-dynamic-splash", () => ({
	createDynamicSplash: mockCreateDynamicSplash,
	DynamicSplash: {
		hide: mockHide,
		isVisible: mockIsVisible,
	},
}));

jest.mock("expo-status-bar", () => ({
	StatusBar: "StatusBar",
}));

jest.useFakeTimers();

let App;
beforeAll(() => {
	App = require("../App").default;
});

function treeContainsText(tree, text) {
	return JSON.stringify(tree.toJSON()).includes(text);
}

function findActionButtons(tree) {
	return tree.root.findAll(
		(node) =>
			typeof node.type === "function" && node.type.name === "ActionButton",
	);
}

describe("App", () => {
	let tree;

	afterEach(() => {
		if (tree) {
			act(() => {
				tree.unmount();
			});
			tree = null;
		}
		jest.clearAllMocks();
		jest.clearAllTimers();
	});

	async function renderApp() {
		await act(async () => {
			tree = renderer.create(<App />);
		});
		return tree;
	}

	describe("rendering", () => {
		it("renders without crashing", async () => {
			await renderApp();
			expect(tree.toJSON()).toBeTruthy();
		});

		it("renders header titles", async () => {
			await renderApp();
			expect(treeContainsText(tree, "Dynamic Splash")).toBe(true);
			expect(treeContainsText(tree, "Expo Feature Showcase")).toBe(true);
		});

		it("renders footer with package name", async () => {
			await renderApp();
			expect(
				treeContainsText(tree, "@parrotnavy/react-native-dynamic-splash"),
			).toBe(true);
		});

		it("renders initial visibility status as 'unknown'", async () => {
			await renderApp();
			expect(treeContainsText(tree, "unknown")).toBe(true);
		});
	});

	describe("API calls", () => {
		it("calls createDynamicSplash on mount", async () => {
			await renderApp();
			expect(mockCreateDynamicSplash).toHaveBeenCalledTimes(1);
		});

		it("passes splashConfig to createDynamicSplash", async () => {
			await renderApp();
			const config = mockCreateDynamicSplash.mock.calls[0][0];
			expect(config).toHaveProperty("configProvider");
			expect(config).toHaveProperty("minDurationMs");
			expect(config).toHaveProperty("maxDurationMs");
			expect(config).toHaveProperty("animation");
			expect(config).toHaveProperty("storageKey");
		});

		it("calls mount() on component mount", async () => {
			await renderApp();
			expect(mockMount).toHaveBeenCalledTimes(1);
		});

		it("does not call hide before 4 seconds", async () => {
			await renderApp();
			await act(async () => {
				jest.advanceTimersByTime(3999);
			});
			expect(mockHide).not.toHaveBeenCalled();
		});

		it("calls DynamicSplash.hide() after 4 seconds", async () => {
			await renderApp();
			expect(mockHide).not.toHaveBeenCalled();
			await act(async () => {
				jest.advanceTimersByTime(4000);
			});
			expect(mockHide).toHaveBeenCalledTimes(1);
		});

		it("shows auto-hide action badge after timer fires", async () => {
			await renderApp();
			await act(async () => {
				jest.advanceTimersByTime(4000);
			});
			expect(treeContainsText(tree, "hide (auto @ 4s)")).toBe(true);
		});
	});

	describe("button interactions", () => {
		it("renders three action buttons", async () => {
			await renderApp();
			const buttons = findActionButtons(tree);
			expect(buttons).toHaveLength(3);
		});

		it("Hide button calls DynamicSplash.hide()", async () => {
			await renderApp();
			const buttons = findActionButtons(tree);
			const hideButton = buttons.find((b) => b.props.label === "Hide");
			expect(hideButton).toBeDefined();

			await act(async () => {
				hideButton.props.onPress();
			});
			expect(mockHide).toHaveBeenCalledTimes(1);
		});

		it("Hide button updates last action badge", async () => {
			await renderApp();
			const hideButton = findActionButtons(tree).find(
				(b) => b.props.label === "Hide",
			);

			await act(async () => {
				hideButton.props.onPress();
			});
			expect(treeContainsText(tree, "hide (manual)")).toBe(true);
		});

		it("Visible? button calls DynamicSplash.isVisible()", async () => {
			await renderApp();
			const visibleButton = findActionButtons(tree).find(
				(b) => b.props.label === "Visible?",
			);
			expect(visibleButton).toBeDefined();

			await act(async () => {
				await visibleButton.props.onPress();
			});
			expect(mockIsVisible).toHaveBeenCalledTimes(1);
		});

		it("Visible? button shows 'hidden' when isVisible returns false", async () => {
			mockIsVisible.mockResolvedValue(false);
			await renderApp();
			const visibleButton = findActionButtons(tree).find(
				(b) => b.props.label === "Visible?",
			);

			await act(async () => {
				await visibleButton.props.onPress();
			});
			expect(treeContainsText(tree, "hidden")).toBe(true);
		});

		it("Visible? button shows 'visible' when isVisible returns true", async () => {
			mockIsVisible.mockResolvedValue(true);
			await renderApp();
			const visibleButton = findActionButtons(tree).find(
				(b) => b.props.label === "Visible?",
			);

			await act(async () => {
				await visibleButton.props.onPress();
			});
			expect(treeContainsText(tree, "visible")).toBe(true);
		});

		it("Refetch button calls mount()", async () => {
			await renderApp();
			const refetchButton = findActionButtons(tree).find(
				(b) => b.props.label === "Refetch",
			);
			expect(refetchButton).toBeDefined();

			mockMount.mockClear();
			await act(async () => {
				refetchButton.props.onPress();
			});
			expect(mockMount).toHaveBeenCalledTimes(1);
		});

		it("Refetch button updates last action badge", async () => {
			await renderApp();
			const refetchButton = findActionButtons(tree).find(
				(b) => b.props.label === "Refetch",
			);

			await act(async () => {
				refetchButton.props.onPress();
			});
			expect(treeContainsText(tree, "mount() refetch")).toBe(true);
		});
	});

	describe("feature checklist", () => {
		const EXPECTED_FEATURES = [
			"configProvider (async fetch)",
			"minDurationMs timing",
			"maxDurationMs auto-hide",
			"Fade animation",
			"Scale animation",
			"Custom storageKey",
			"fileLocation setting",
			"initialConfig pre-seed",
			"Logger hook",
			"storageReadyTimeoutMs",
			"showOnUpdate flag",
			"DynamicSplash.hide()",
			"DynamicSplash.isVisible()",
			"manager.mount()",
			"createDynamicSplash()",
		];

		it("renders all 15 feature items", async () => {
			await renderApp();
			for (const feature of EXPECTED_FEATURES) {
				expect(treeContainsText(tree, feature)).toBe(true);
			}
		});

		it("renders Feature Checklist card title", async () => {
			await renderApp();
			expect(treeContainsText(tree, "Feature Checklist")).toBe(true);
		});
	});

	describe("ConfigOverviewCard", () => {
		it("renders InitOptions count", async () => {
			await renderApp();
			expect(treeContainsText(tree, "InitOptions (")).toBe(true);
			expect(treeContainsText(tree, "/11)")).toBe(true);
		});

		it("renders all option labels", async () => {
			await renderApp();
			const labels = [
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
			];
			for (const label of labels) {
				expect(treeContainsText(tree, label)).toBe(true);
			}
		});
	});

	describe("ConfigDetailsCard", () => {
		it("renders SplashConfig Items card", async () => {
			await renderApp();
			expect(treeContainsText(tree, "SplashConfig Items")).toBe(true);
		});

		it("renders config item names from SHOWCASE_CONFIG_DATA", async () => {
			await renderApp();
			expect(treeContainsText(tree, "mobility-welcome-2026q1")).toBe(true);
			expect(treeContainsText(tree, "mobility-commute-pass-2026q1")).toBe(true);
			expect(treeContainsText(tree, "mobility-safety-update-2026q1")).toBe(
				true,
			);
		});
	});

	describe("ApiDemoSection", () => {
		it("renders API Methods card title", async () => {
			await renderApp();
			expect(treeContainsText(tree, "API Methods")).toBe(true);
		});

		it("renders visibility status row", async () => {
			await renderApp();
			expect(treeContainsText(tree, "Visibility:")).toBe(true);
		});

		it("renders button sublabels", async () => {
			await renderApp();
			expect(treeContainsText(tree, "DynamicSplash.hide()")).toBe(true);
			expect(treeContainsText(tree, "DynamicSplash.isVisible()")).toBe(true);
			expect(treeContainsText(tree, "manager.mount()")).toBe(true);
		});
	});
});
