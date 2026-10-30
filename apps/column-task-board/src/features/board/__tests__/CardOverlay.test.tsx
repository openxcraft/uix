import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { getState, resetForTests, store } from "../../../data/store";
import { CardOverlay } from "../CardOverlay";
import { strings } from "../../../i18n/strings";

beforeEach(() => {
  localStorage.clear();
  resetForTests();
  cleanup();
});

function setup() {
  const board = store.createBoard("Board", "workspace");
  const column = getState().columns.filter((c) => c.boardId === board.id)[0]!;
  store.createCard(board.id, column.id, "Plan the launch");
  const card = getState().cards[0]!;
  render(
    <MemoryRouter initialEntries={[`/boards/${board.id}/card/${card.id}`]}>
      <CardOverlay cardId={card.id} />
    </MemoryRouter>,
  );
  return { board, card };
}

describe("CardOverlay", () => {
  it("shows the card title and editing fields", () => {
    setup();
    expect(screen.getByDisplayValue("Plan the launch")).toBeInTheDocument();
    expect(screen.getByLabelText(strings.description)).toBeInTheDocument();
    expect(screen.getByLabelText(strings.dueDate)).toBeInTheDocument();
  });

  it("adds a comment and records it", async () => {
    const user = userEvent.setup();
    const { card } = setup();
    await user.type(screen.getByLabelText(strings.commentPlaceholder), "Ship it");
    await user.click(screen.getByRole("button", { name: strings.send }));

    expect(screen.getByText("Ship it")).toBeInTheDocument();
    expect(getState().comments.find((c) => c.cardId === card.id)?.body).toBe("Ship it");
  });

  it("creates and toggles a label", async () => {
    const user = userEvent.setup();
    const { board, card } = setup();
    await user.type(screen.getByLabelText(strings.labelName), "Priority");
    await user.click(screen.getByRole("button", { name: `+ ${strings.addLabel}` }));

    const label = getState().labels.find((l) => l.boardId === board.id);
    expect(label?.name).toBe("Priority");
    expect(getState().cards.find((c) => c.id === card.id)?.labelIds).toEqual([label?.id]);

    await user.click(screen.getByRole("button", { name: /Priority/ }));
    expect(getState().cards.find((c) => c.id === card.id)?.labelIds).toEqual([]);
  });

  it("adds a checklist and tracks progress", async () => {
    const user = userEvent.setup();
    const { card } = setup();
    await user.type(screen.getByLabelText(strings.checklistTitle), "Steps");
    await user.click(screen.getByRole("button", { name: `+ ${strings.addChecklist}` }));

    await user.type(screen.getByLabelText(strings.addItem), "Draft the note");
    await user.keyboard("{Enter}");
    await user.type(screen.getByLabelText(strings.addItem), "Send the note");
    await user.keyboard("{Enter}");

    expect(screen.getByText(strings.progress(0))).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]!);
    expect(screen.getByText(strings.progress(50))).toBeInTheDocument();
    expect(getState().activity.some((a) => a.action === "item-toggled")).toBe(true);
    expect(card.id).toBeDefined();
  });
});
