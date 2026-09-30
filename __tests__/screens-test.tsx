import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

import HomeScreen from "../app/(tabs)/index";
import ExploreScreen from "../app/(tabs)/explore";
import ProfileScreen from "../app/(tabs)/profile";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock("expo-clipboard", () => ({
  getStringAsync: jest.fn(),
  setStringAsync: jest.fn(),
}));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockAsyncStorage = jest.requireMock(
  "@react-native-async-storage/async-storage",
) as {
  getItem: jest.Mock;
  setItem: jest.Mock;
};
const mockClipboard = jest.requireMock("expo-clipboard") as {
  getStringAsync: jest.Mock;
  setStringAsync: jest.Mock;
};

describe("portfolio screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockClipboard.getStringAsync.mockResolvedValue("");
    mockClipboard.setStringAsync.mockResolvedValue(undefined);
  });

  test("files, searches, pins, copies, and deletes a snippet", async () => {
    const screen = render(<HomeScreen />);

    await waitFor(() =>
      expect(
        screen.getByText("No saved snippets yet. File your first useful line above."),
      ).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByLabelText("New snippet"), "  npm run release  ");
    fireEvent.press(screen.getByText("File snippet"));

    expect(screen.getByText("npm run release")).toBeTruthy();
    expect(screen.getByText("FILED / SNIPPET IN ARCHIVE")).toBeTruthy();
    await waitFor(() =>
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "clipboard-manager.snippets.v1",
        expect.stringContaining("npm run release"),
      ),
    );

    fireEvent.press(screen.getByText("Pin"));
    expect(screen.getByText("Unpin")).toBeTruthy();

    fireEvent.press(screen.getByText("Copy"));
    await waitFor(() =>
      expect(mockClipboard.setStringAsync).toHaveBeenCalledWith("npm run release"),
    );

    fireEvent.changeText(screen.getByLabelText("Search snippets"), "missing");
    expect(screen.getByText("No saved snippets match this search.")).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("Search snippets"), "");
    fireEvent.press(screen.getByText("Delete"));
    expect(
      screen.getByText("No saved snippets yet. File your first useful line above."),
    ).toBeTruthy();
  });

  test("loads persisted snippets and reads the device clipboard on demand", async () => {
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify([
        {
          id: "seed",
          text: "already saved",
          createdAt: 1_700_000_000_000,
          pinned: true,
        },
      ]),
    );
    mockClipboard.getStringAsync.mockResolvedValue("from the clipboard");

    const screen = render(<HomeScreen />);

    await waitFor(() => expect(screen.getByText("already saved")).toBeTruthy());
    expect(screen.getByText("Unpin")).toBeTruthy();

    fireEvent.press(screen.getByText("Read clipboard"));
    await waitFor(() =>
      expect(screen.getByLabelText("New snippet").props.value).toBe(
        "from the clipboard",
      ),
    );
    expect(screen.getByText("LOADED / READY TO FILE")).toBeTruthy();
    expect(Clipboard.getStringAsync).toHaveBeenCalledTimes(1);
  });

  test("renders the Explore screen's stable content", () => {
    const screen = render(<ExploreScreen />);

    expect(screen.getByText("Explore")).toBeTruthy();
    expect(screen.getByText("File snippets")).toBeTruthy();
    expect(
      screen.getByText(
        "Clipboard access is explicit: the app reads or writes it only after you tap a clipboard action.",
      ),
    ).toBeTruthy();
  });

  test("renders the Profile screen's owner and links", () => {
    const screen = render(<ProfileScreen />);

    expect(screen.getByText("Chaowalit Greepoke")).toBeTruthy();
    expect(screen.getByText("bookchaowalit.com")).toBeTruthy();
    expect(screen.getByText("github.com/bookchaowalit")).toBeTruthy();
  });
});

describe("archive safety and export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockClipboard.getStringAsync.mockResolvedValue("");
  });

  test("filing a duplicate moves it up instead of adding a copy", async () => {
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify([
        { id: "a", text: "older line", createdAt: 1_700_000_000_000, pinned: false },
        { id: "b", text: "newer line", createdAt: 1_700_000_100_000, pinned: false },
      ]),
    );
    const screen = render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("older line")).toBeTruthy());

    fireEvent.changeText(screen.getByLabelText("New snippet"), "older line");
    fireEvent.press(screen.getByText("File snippet"));

    expect(screen.getByText("MOVED UP / ALREADY FILED")).toBeTruthy();
    expect(screen.getAllByText("older line")).toHaveLength(1);
    await waitFor(() => {
      const saved = JSON.parse(mockAsyncStorage.setItem.mock.calls.at(-1)[1]);
      expect(saved.map((s: { id: string }) => s.id)).toEqual(["a", "b"]);
    });
  });

  test("a failed read never overwrites the stored archive", async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error("storage offline"));
    const screen = render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("ARCHIVE UNAVAILABLE / RETRY LATER")).toBeTruthy());

    fireEvent.changeText(screen.getByLabelText("New snippet"), "session only");
    fireEvent.press(screen.getByText("File snippet"));
    expect(screen.getByText("session only")).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test("exports the archive as a JSON backup through the share sheet", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify([{ id: "a", text: "keep me", createdAt: 1_700_000_000_000, pinned: true }]),
    );
    const screen = render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("keep me")).toBeTruthy());

    fireEvent.press(screen.getByText("Export archive (JSON)"));
    await waitFor(() => expect(screen.getByText("EXPORTED / JSON BACKUP SHARED")).toBeTruthy());
    const payload = JSON.parse(share.mock.calls[0][0].message as string);
    expect(payload).toMatchObject({ app: "clipboard-manager", version: 1 });
    expect(payload.snippets[0].text).toBe("keep me");
  });
});
