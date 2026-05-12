"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { PageTile } from "@/components/pdf/page-tile";
import type { Page, Source } from "@/components/pdf/merge-reducer";

export interface PageGridProps {
  pages: Page[];
  sources: Map<string, Source>;
  onReorder: (from: number, to: number) => void;
  onDelete: (pageId: string) => void;
}

function SortablePageTile({
  page,
  sourceName,
  position,
  onDelete,
}: {
  page: Page;
  sourceName: string;
  position: number;
  onDelete: (pageId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PageTile
        page={page}
        sourceName={sourceName}
        position={position}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
}

export function PageGrid({
  pages,
  sources,
  onReorder,
  onDelete,
}: PageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = pages.findIndex((p) => p.id === active.id);
    const to = pages.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(from, to);
  }

  if (pages.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        Drop PDFs above to start building the merged document.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pages.map((p) => p.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {pages.map((page, index) => {
            const source = sources.get(page.sourceId);
            const sourceName = source?.name ?? "Unknown";
            return (
              <SortablePageTile
                key={page.id}
                page={page}
                sourceName={sourceName}
                position={index + 1}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default PageGrid;
