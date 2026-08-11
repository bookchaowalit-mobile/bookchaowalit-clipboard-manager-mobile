import { render } from "@testing-library/react-native";

import ExploreScreen from "../app/(tabs)/explore";
import ProfileScreen from "../app/(tabs)/profile";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

describe("portfolio screens", () => {
  test("renders the Explore screen's stable content", () => {
    const screen = render(<ExploreScreen />);

    expect(screen.getByText("Explore")).toBeTruthy();
    expect(
      screen.getByText("Discover features and content for Clipboard Manager."),
    ).toBeTruthy();
  });

  test("renders the Profile screen's owner and links", () => {
    const screen = render(<ProfileScreen />);

    expect(screen.getByText("Chaowalit Greepoke")).toBeTruthy();
    expect(screen.getByText("bookchaowalit.com")).toBeTruthy();
    expect(screen.getByText("github.com/bookchaowalit")).toBeTruthy();
  });
});
