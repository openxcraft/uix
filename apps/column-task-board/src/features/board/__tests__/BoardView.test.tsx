import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { getState, resetForTests, store } from "../../../data/store";
import { BoardView } from "../BoardView";
import { strings } from "../../../i18n/strings";

beforeEach(() => {
  localStorage.clear();
  resetForTests();
  cleanup();
});

function setup() {
  const board = store.createBoard("Sprint board", "workspace");
  const columns = getState().columns.filter((c) => c.boardId === board.id);
  const todo = columns[0]!;
  const doing = columns[1]!;
  const done = columns[2]!;
  store.createCard(board.id, todo.id, "First task");
  store.createCard(board.id, todo.id, "Second task");
  const cards = () => getState().cards.filter((c) => c.deletedAt === null && !c.archived);
  render(
    <MemoryRouter initialEntries={[`/boards/${board.id}`]}>
      <BoardView boardId={board.id} cards={cards()} />
    </MemoryRouter>,
  );
  return { board, columns: { todo, doing, done } };
}

describe("BoardView", () => {
  it("renders columns and cards", () => {
    setup();
    expect(screen.getByRole("heading", { name: "To do" })).toBeInTheDocument();
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
  });

  it("moves a card with the keyboard across columns", async () => {
    const user = userEvent.setup();
    const { columns } = setup();
    const card = screen.getByText("First task").closest('[role="button"]') as HTMLElement;
    card.focus();
    await user.keyboard("{ArrowRight}");

    const moved = getState().cards.find((c) => c.title === "First task");
    expect(moved?.columnId).toBe(columns.doing.id);
  });

  it("moves a card with the keyboard within a column", async () => {
    const user = userEvent.setup();
    setup();
    const card = screen.getByText("First task").closest('[role="button"]') as HTMLElement;
    card.focus();
    await user.keyboard("{ArrowDown}");

    const first = getState().cards.find((c) => c.title === "First task");
    const second = getState().cards.find((c) => c.title === "Second task");
    expect(first?.position).toBeGreaterThan(second?.position ?? 0);
  });

  it("creates a card through the composer", async () => {
    const user = userEvent.setup();
    const { board } = setup();
    await user.click(screen.getAllByRole("button", { name: `+ ${strings.addCard}` })[0]!);
    const input = screen.getByLabelText(strings.cardTitle);
    await user.type(input, "Third task");
    await user.keyboard("{Enter}");

    const created = getState().cards.find((c) => c.title === "Third task");
    expect(created).toBeDefined();
    expect(created?.boardId).toBe(board.id);
  });

  it("announces keyboard moves to screen readers", async () => {
    const user = userEvent.setup();
    setup();
    const card = screen.getByText("First task").closest('[role="button"]') as HTMLElement;
    card.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => {
      expect(screen.getByText(strings.cardMoved("First task", "Doing"))).toBeInTheDocument();
    });
  });
});
