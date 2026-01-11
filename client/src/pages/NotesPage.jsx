import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  X,
  Pin,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  GripVertical,
  Palette,
  Highlighter,
  List,
  ListOrdered,
  Eraser,
} from "lucide-react";

// --- DND KIT ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* =========================
   QUILL: FONT SIZE SETUP
========================= */
const Size = Quill.import("attributors/style/size");

const FONT_SIZES = [
  "8px",
  "9px",
  "10px",
  "11px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "22px",
  "24px",
  "26px",
  "28px",
  "36px",
  "48px",
  "72px",
];
const DEFAULT_SIZE = "14px";
const MIXED = "mixed";

Size.whitelist = FONT_SIZES;
Quill.register(Size, true);

/* =========================
   NOTE BG COLORS
========================= */
const noteBgColors = [
  { id: "white", hex: "#ffffff", btnClass: "bg-white border-2 border-gray-300" },
  { id: "red", hex: "#fef2f2", btnClass: "bg-red-600 border-2 border-red-800" },
  { id: "orange", hex: "#fff7ed", btnClass: "bg-orange-50 border-2 border-orange-700" },
  { id: "amber", hex: "#fffbeb", btnClass: "bg-amber-500 border-2 border-amber-700" },
  { id: "green", hex: "#f0fdf4", btnClass: "bg-green-600 border-2 border-green-800" },
  { id: "teal", hex: "#f0fdfa", btnClass: "bg-teal-600 border-2 border-teal-800" },
  { id: "blue", hex: "#eff6ff", btnClass: "bg-blue-600 border-2 border-blue-800" },
  { id: "indigo", hex: "#eef2ff", btnClass: "bg-indigo-600 border-2 border-indigo-800" },
  { id: "violet", hex: "#f5f3ff", btnClass: "bg-violet-600 border-2 border-violet-800" },
  { id: "pink", hex: "#fdf2f8", btnClass: "bg-pink-600 border-2 border-pink-800" },
  { id: "gray", hex: "#f3f4f6", btnClass: "bg-gray-600 border-2 border-gray-800" },
  { id: "dark", hex: "#1f2937", btnClass: "bg-gray-800 border-2 border-gray-900 text-white" },
];

/* =========================
   TEXT / HIGHLIGHT COLORS
   (CANLI + GENİŞ)
========================= */
const LIVE_COLORS = [
  // grayscale
  { name: "Siyah", hex: "#111827" },
  { name: "Koyu Gri", hex: "#374151" },
  { name: "Gri", hex: "#6b7280" },
  { name: "Açık Gri", hex: "#9ca3af" },

  // red
  { name: "Kırmızı", hex: "#dc2626" },
  { name: "Açık Kırmızı", hex: "#ef4444" },
  { name: "Pembe Kırmızı", hex: "#fb7185" },

  // orange/amber/yellow
  { name: "Turuncu", hex: "#f97316" },
  { name: "Açık Turuncu", hex: "#fb923c" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Sarı", hex: "#eab308" },

  // green
  { name: "Yeşil", hex: "#16a34a" },
  { name: "Açık Yeşil", hex: "#22c55e" },
  { name: "Lime", hex: "#84cc16" },

  // teal/cyan
  { name: "Teal", hex: "#0d9488" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Açık Cyan", hex: "#22d3ee" },

  // blue
  { name: "Mavi", hex: "#2563eb" },
  { name: "Açık Mavi", hex: "#3b82f6" },
  { name: "Sky", hex: "#0ea5e9" },

  // indigo/violet/purple
  { name: "İndigo", hex: "#4f46e5" },
  { name: "Mor", hex: "#9333ea" },
  { name: "Açık Mor", hex: "#a855f7" },
  { name: "Violet", hex: "#7c3aed" },

  // pink
  { name: "Pembe", hex: "#db2777" },
  { name: "Fuşya", hex: "#c026d3" },
];

/* =========================
   UTILS
========================= */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const parsePx = (val) => {
  if (val == null) return NaN;
  const s = String(val).trim();
  const m = s.match(/^(\d+)\s*px$/i);
  if (m) return Number(m[1]);
  const num = Number(s);
  return Number.isFinite(num) ? num : NaN;
};

const sizeToIndex = (size) => {
  const idx = FONT_SIZES.indexOf(size);
  if (idx !== -1) return idx;

  const px = parsePx(size);
  if (!Number.isFinite(px)) return FONT_SIZES.indexOf(DEFAULT_SIZE);

  let best = 0;
  let diff = Infinity;
  for (let i = 0; i < FONT_SIZES.length; i++) {
    const d = Math.abs(parsePx(FONT_SIZES[i]) - px);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return best;
};

const getOpLength = (insert) => (typeof insert === "string" ? insert.length : 1);

/* =========================
   NOTE CARDS
========================= */
const NoteCardContent = ({ note, onPin, onDelete }) => (
  <>
    {!note.isPinned && (
      <div className="absolute top-3 left-3 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing p-1 z-20 drag-handle">
        <GripVertical size={18} />
      </div>
    )}

    <button
      onClick={(e) => onPin(e, note)}
      className={`absolute top-3 right-3 z-20 p-2 rounded-full transition-all duration-300 ${
        note.isPinned
          ? "bg-white text-orange-600 shadow-md rotate-45 border border-orange-200"
          : "text-gray-400 hover:bg-white/80 hover:text-gray-700"
      }`}
    >
      <Pin size={18} className={note.isPinned ? "fill-current" : ""} />
    </button>

    <h3 className={`font-bold text-lg text-gray-800 mb-2 pr-8 truncate mt-1 ${!note.isPinned ? "pl-6" : ""}`}>
      {note.title}
    </h3>

    <div
      className="text-gray-700 text-sm overflow-hidden flex-1 prose prose-sm max-w-none mask-fade-bottom ql-editor-preview"
      style={{ fontFamily: "sans-serif" }}
      dangerouslySetInnerHTML={{ __html: note.content }}
    />

    <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-xs text-gray-400 font-medium">{new Date(note.updatedAt).toLocaleDateString()}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note._id);
        }}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </>
);

const SortableNoteItem = ({ note, onClick, onPin, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: note.color,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-2xl p-5 shadow-sm border border-gray-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-64 flex flex-col ${
        isDragging ? "shadow-2xl ring-4 ring-indigo-200 rotate-2" : ""
      }`}
      onClick={() => onClick(note)}
    >
      <NoteCardContent note={note} onPin={onPin} onDelete={onDelete} />
    </div>
  );
};

const StaticNoteItem = ({ note, onClick, onPin, onDelete }) => (
  <div
    className="relative group rounded-2xl p-5 shadow-md border-l-4 border-l-orange-400 border-y border-r border-gray-200/60 bg-white hover:shadow-xl transition-all duration-300 h-64 flex flex-col"
    style={{ backgroundColor: note.color }}
    onClick={() => onClick(note)}
  >
    <div className="absolute -top-2 -left-2 bg-orange-100 text-orange-600 p-1 rounded-full border border-orange-200 shadow-sm z-30">
      <Pin size={12} className="fill-current" />
    </div>
    <NoteCardContent note={note} onPin={onPin} onDelete={onDelete} />
  </div>
);

/* =========================
   TOOLBAR UI
========================= */
function ToolbarButton({ state, title, onMouseDown, children }) {
  const isOn = state === true;
  const isMixed = state === MIXED;

  const cls = isOn
    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
    : isMixed
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";

  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // selection kaybolmasın
        onMouseDown?.(e);
      }}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${cls}`}
    >
      {children}
    </button>
  );
}

function ColorPopover({ open, anchorRect, title, colors, onPick, onClose, showClear = true }) {
  useEffect(() => {
    if (!open) return;

    const onDocDown = (e) => {
      const insidePopover = e.target?.closest?.("[data-popover-root='true']");
      const insideAnchor = e.target?.closest?.("[data-popover-anchor='true']");
      if (!insidePopover && !insideAnchor) onClose?.();
    };

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open, onClose]);

  if (!open || !anchorRect) return null;

  const top = Math.round(anchorRect.bottom + 10);
  const left = Math.round(anchorRect.left);

  return createPortal(
    <div
      data-popover-root="true"
      className="fixed z-[9999] bg-white rounded-2xl border border-gray-200 shadow-2xl p-3 w-[320px]"
      style={{ top, left }}
    >
      <div className="text-xs font-extrabold text-gray-600 mb-2">{title}</div>

      <div className="grid grid-cols-8 gap-3">
        {colors.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.name}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(c.hex);
              onClose?.();
            }}
            className="w-7 h-7 rounded-full border border-gray-200 shadow-sm transform-gpu transition-transform hover:scale-[1.08]"
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      {showClear && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(null);
            onClose?.();
          }}
          className="mt-3 w-full text-sm font-semibold py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
        >
          Temizle
        </button>
      )}
    </div>,
    document.body
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  // YENİ: SİLME ONAY MODALI STATE
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  const quillRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Popover states
  const [openTextColor, setOpenTextColor] = useState(false);
  const [openHighlight, setOpenHighlight] = useState(false);
  const textBtnRef = useRef(null);
  const hlBtnRef = useRef(null);
  const [textAnchorRect, setTextAnchorRect] = useState(null);
  const [hlAnchorRect, setHlAnchorRect] = useState(null);

  const [currentFormats, setCurrentFormats] = useState({
    size: DEFAULT_SIZE,
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    list: null,
    color: null,
    background: null,
  });

  // Boyut input: mixed ise boş + placeholder ile "—" göstereceğiz
  const [sizeInput, setSizeInput] = useState("14");

  // Note fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [isPinned, setIsPinned] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getEditor = useCallback(() => quillRef.current?.getEditor?.() || null, []);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get("/notes");
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = unpinnedNotes.findIndex((n) => n._id === active.id);
    const newIndex = unpinnedNotes.findIndex((n) => n._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedUnpinned = arrayMove(unpinnedNotes, oldIndex, newIndex);
    setNotes([...pinnedNotes, ...reorderedUnpinned]);
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
    setSelectedColor("#ffffff");
    setIsPinned(false);
    setError(null);
    setLoading(false);

    setOpenTextColor(false);
    setOpenHighlight(false);
    setTextAnchorRect(null);
    setHlAnchorRect(null);

    savedRangeRef.current = null;
    setCurrentFormats({
      size: DEFAULT_SIZE,
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      list: null,
      color: null,
      background: null,
    });
    setSizeInput("14");
  }, []);

  const openModal = (note = null) => {
    setError(null);

    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content || "");
      setSelectedColor(note.color || "#ffffff");
      setIsPinned(!!note.isPinned);
    } else {
      setEditingNote(null);
      setTitle("");
      setContent("");
      setSelectedColor("#ffffff");
      setIsPinned(false);
    }

    setOpenTextColor(false);
    setOpenHighlight(false);
    setIsModalOpen(true);

    setTimeout(() => {
      const q = getEditor();
      if (q) q.focus();
    }, 0);
  };

  const togglePin = async (e, note) => {
    e.stopPropagation();
    const newStatus = !note.isPinned;
    try {
      await api.put(`/notes/${note._id}`, { isPinned: newStatus });
      await fetchNotes();
    } catch (err) {
      console.error(err);
      await fetchNotes();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Not başlığı boş olamaz.");
      return;
    }
    setLoading(true);
    try {
      const payload = { title, content, color: selectedColor, isPinned };

      if (editingNote) {
        await api.put(`/notes/${editingNote._id}`, payload);
      } else {
        await api.post("/notes", payload);
      }

      await fetchNotes();
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // --- DÜZELTİLEN handleDelete (Popup tetikler) ---
  const handleDelete = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  // --- ASIL SİLME İŞLEMİ (Confirm sonrası) ---
  const confirmDeleteAction = async () => {
    const id = deleteConfirm.id;
    if (!id) return;
    try {
      await api.delete(`/notes/${id}`);
      await fetchNotes();
      if (editingNote?._id === id) closeModal();
    } catch (err) {
      console.error(err);
      alert("Silinemedi.");
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  /* =========================
      SELECTION / TOOLBAR SYNC
========================= */
  const captureSelection = useCallback(() => {
    const quill = getEditor();
    if (!quill) return null;

    // true => editor focus + selection gelir
    const r = quill.getSelection(true);
    if (r) savedRangeRef.current = r;
    return r;
  }, [getEditor]);

  const restoreSelection = useCallback(() => {
    const quill = getEditor();
    if (!quill) return null;

    let r = savedRangeRef.current || quill.getSelection();
    if (!r) {
      const idx = Math.max(0, quill.getLength() - 1);
      r = { index: idx, length: 0 };
    }
    quill.focus();
    quill.setSelection(r.index, r.length, "silent");
    return r;
  }, [getEditor]);

  const syncListMarkerFontSizes = useCallback(
    (range) => {
      const quill = getEditor();
      if (!quill || !range) return;

      const lines = quill.getLines(range.index, Math.max(1, range.length));
      for (const line of lines) {
        const dom = line?.domNode;
        if (!dom) continue;
        const li = dom.tagName === "LI" ? dom : dom.closest?.("li");
        if (!li) continue;

        let max = 0;
        const nodes = li.querySelectorAll?.("[style*='font-size']");
        if (nodes && nodes.length) {
          nodes.forEach((n) => {
            const fs = n.style?.fontSize;
            const px = parsePx(fs);
            if (Number.isFinite(px)) max = Math.max(max, px);
          });
        }
        if (!max) max = parsePx(DEFAULT_SIZE);
        li.style.fontSize = `${max}px`;
      }
    },
    [getEditor]
  );

  const computeMixedInline = useCallback((quill, range, key, defaultVal) => {
  if (range.length === 0) {
    const f = quill.getFormat(range);
    const v = f[key];
    return v == null ? defaultVal : v;
  }

  const delta = quill.getContents(range.index, range.length);
  const seen = new Set();

  for (const op of delta.ops || []) {
    const v = op.attributes?.[key];

    // Inline attrs: yoksa default kabul
    const normalized = v == null ? defaultVal : v;

    seen.add(normalized);
    if (seen.size > 1) return MIXED;
  }

  return seen.size === 1 ? [...seen][0] : defaultVal;
}, []);


  const computeMixedSize = useCallback((quill, range) => {
    const val = computeMixedInline(quill, range, "size", DEFAULT_SIZE);
    return val === true ? DEFAULT_SIZE : val; // safety
  }, [computeMixedInline]);

  const computeMixedColor = useCallback((quill, range, key) => {
    const v = computeMixedInline(quill, range, key, null);
    return v;
  }, [computeMixedInline]);

  const computeMixedList = useCallback((quill, range) => {
    const lines = quill.getLines(range.index, Math.max(1, range.length));
    const seen = new Set();
    for (const line of lines) {
      const idx = quill.getIndex(line);
      const f = quill.getFormat(idx, 1);
      seen.add(f.list || null);
      if (seen.size > 1) return MIXED;
    }
    return seen.size === 1 ? [...seen][0] : null;
  }, []);

  const syncToolbarFromEditor = useCallback(
    (range) => {
      const quill = getEditor();
      if (!quill || !range) return;

      savedRangeRef.current = range;

      const sizeState = computeMixedSize(quill, range);
      const boldState = computeMixedInline(quill, range, "bold", false);
      const italicState = computeMixedInline(quill, range, "italic", false);
      const underlineState = computeMixedInline(quill, range, "underline", false);
      const strikeState = computeMixedInline(quill, range, "strike", false);
      const listState = computeMixedList(quill, range);

      const colorState = computeMixedColor(quill, range, "color");
      const bgState = computeMixedColor(quill, range, "background");

      setCurrentFormats({
        size: sizeState,
        bold: boldState,
        italic: italicState,
        underline: underlineState,
        strike: strikeState,
        list: listState,
        color: colorState,
        background: bgState,
      });

      // size input otomatik:
      if (sizeState === MIXED) {
        setSizeInput("");
      } else {
        const px = parsePx(sizeState);
        setSizeInput(Number.isFinite(px) ? String(px) : "14");
      }

      // list marker size sync
      if (listState) syncListMarkerFontSizes(range);
    },
    [
      getEditor,
      computeMixedSize,
      computeMixedInline,
      computeMixedList,
      computeMixedColor,
      syncListMarkerFontSizes,
    ]
  );

  /* =========================
      FORMATTING ACTIONS
========================= */
  const toggleInline = (fmt) => {
    const quill = getEditor();
    if (!quill) return;

    captureSelection();
    const r = restoreSelection();
    if (!r) return;

    const f = quill.getFormat(r);
    const next = !f[fmt];
    quill.format(fmt, next, "user");

    const rr = quill.getSelection() || r;
    syncToolbarFromEditor(rr);
  };

  const setList = (type) => {
    const quill = getEditor();
    if (!quill) return;

    captureSelection();
    const r = restoreSelection();
    if (!r) return;

    const current = computeMixedList(quill, r);
    const next = current === type ? false : type;
    quill.format("list", next, "user");

    const rr = quill.getSelection() || r;
    syncToolbarFromEditor(rr);
  };

  const clearFormatting = () => {
    const quill = getEditor();
    if (!quill) return;

    captureSelection();
    const r = restoreSelection();
    if (!r || r.length === 0) return;

    quill.removeFormat(r.index, r.length, "user");
    quill.setSelection(r.index, r.length, "silent");
    syncToolbarFromEditor(r);
  };

  const applyTextColor = (hexOrNull) => {
    const quill = getEditor();
    if (!quill) return;

    captureSelection();
    const r = restoreSelection();
    if (!r) return;

    quill.format("color", hexOrNull ? hexOrNull : false, "user");
    const rr = quill.getSelection() || r;
    syncToolbarFromEditor(rr);
  };

  const applyHighlight = (hexOrNull) => {
    const quill = getEditor();
    if (!quill) return;

    captureSelection();
    const r = restoreSelection();
    if (!r) return;

    quill.format("background", hexOrNull ? hexOrNull : false, "user");
    const rr = quill.getSelection() || r;
    syncToolbarFromEditor(rr);
  };

  const adjustSizeByStep = useCallback(
    (direction) => {
      const quill = getEditor();
      if (!quill) return;

      captureSelection();
      const r = restoreSelection();
      if (!r) return;

      if (r.length === 0) {
        const f = quill.getFormat(r);
        const cur = f.size || DEFAULT_SIZE;
        const curIdx = sizeToIndex(cur);
        const nextIdx = clamp(curIdx + direction, 0, FONT_SIZES.length - 1);
        quill.format("size", FONT_SIZES[nextIdx], "user");
        const rr = quill.getSelection() || r;
        syncToolbarFromEditor(rr);
        return;
      }

      // mixed selection: her parçayı kendi boyutuna göre ayarla
      const delta = quill.getContents(r.index, r.length);
      let offset = 0;

      for (const op of delta.ops || []) {
        const len = getOpLength(op.insert);
        if (len <= 0) continue;

        const curSize = op.attributes?.size || DEFAULT_SIZE;
        const curIdx = sizeToIndex(curSize);
        const nextIdx = clamp(curIdx + direction, 0, FONT_SIZES.length - 1);
        quill.formatText(r.index + offset, len, "size", FONT_SIZES[nextIdx], "user");

        offset += len;
      }

      quill.setSelection(r.index, r.length, "silent");
      syncListMarkerFontSizes(r);
      syncToolbarFromEditor(r);
    },
    [getEditor, captureSelection, restoreSelection, syncToolbarFromEditor, syncListMarkerFontSizes]
  );

  const applySizePx = useCallback(
    (pxValue) => {
      const quill = getEditor();
      if (!quill) return;

      const px = parsePx(pxValue);
      if (!Number.isFinite(px)) return;

      let best = 0;
      let diff = Infinity;
      for (let i = 0; i < FONT_SIZES.length; i++) {
        const d = Math.abs(parsePx(FONT_SIZES[i]) - px);
        if (d < diff) {
          diff = d;
          best = i;
        }
      }
      const targetSize = FONT_SIZES[best];

      captureSelection();
      const r = restoreSelection();
      if (!r) return;

      if (r.length === 0) {
        quill.format("size", targetSize, "user");
        const rr = quill.getSelection() || r;
        syncToolbarFromEditor(rr);
        return;
      }

      quill.formatText(r.index, r.length, "size", targetSize, "user");
      quill.setSelection(r.index, r.length, "silent");
      syncListMarkerFontSizes(r);
      syncToolbarFromEditor(r);
    },
    [getEditor, captureSelection, restoreSelection, syncToolbarFromEditor, syncListMarkerFontSizes]
  );

  /* =========================
      POPOVER OPEN HELPERS
========================= */
  const openTextPopover = () => {
    captureSelection();
    setOpenHighlight(false);

    const rect = textBtnRef.current?.getBoundingClientRect?.();
    setTextAnchorRect(rect || null);
    setOpenTextColor((v) => !v);
  };

  const openHighlightPopover = () => {
    captureSelection();
    setOpenTextColor(false);

    const rect = hlBtnRef.current?.getBoundingClientRect?.();
    setHlAnchorRect(rect || null);
    setOpenHighlight((v) => !v);
  };

  /* =========================
      QUILL MODULES / FORMATS
========================= */
  const modules = useMemo(
    () => ({
      toolbar: false,
      history: { delay: 1200, maxStack: 200, userOnly: true },
    }),
    []
  );

  const formats = useMemo(
    () => ["size", "bold", "italic", "underline", "strike", "color", "background", "list"],
    []
  );

  return (
    <div className="h-full flex flex-col p-4 md:p-8 relative">
      <style>{`
        .mask-fade-bottom {
          -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
        }
        .note-editor .ql-container { border: none !important; font-family: sans-serif; }
        .note-editor .ql-editor { padding: 32px; min-height: 100%; color: #111827; }

        /* List marker sizing */
        .note-editor .ql-editor li::before { font-size: inherit !important; line-height: inherit !important; }

        /* Bullet şekli */
        .note-editor .ql-editor ul > li::before { content: "◦" !important; }
        .note-editor .ql-editor ul li.ql-indent-1::before { content: "▪" !important; }
        .note-editor .ql-editor ul li.ql-indent-2::before { content: "•" !important; }

        /* Ordered list Word-ish */
        .note-editor .ql-editor ol > li::before { font-weight: 700 !important; color: rgba(17,24,39,0.7) !important; }
      `}</style>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Not Defteri</h2>
          <p className="text-gray-500 text-sm">Fikirlerini özgürce not al, sürükle ve düzenle.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 hover:-translate-y-1"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Not Ekle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {pinnedNotes.map((note) => (
          <StaticNoteItem key={note._id} note={note} onClick={openModal} onPin={togglePin} onDelete={handleDelete} />
        ))}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={unpinnedNotes.map((n) => n._id)} strategy={rectSortingStrategy}>
            {unpinnedNotes.map((note) => (
              <SortableNoteItem key={note._id} note={note} onClick={openModal} onPin={togglePin} onDelete={handleDelete} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <p>Henüz hiç notun yok.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] h-[800px]">
            {/* Header */}
            <div className="bg-gray-50 rounded-t-3xl">
              <div className="flex justify-between items-center p-4 md:p-6 pb-3 gap-3">
                <input
                  type="text"
                  placeholder="Başlık"
                  className="text-2xl font-bold bg-transparent outline-none w-full placeholder:text-gray-300"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    className={`p-2 rounded-xl transition-colors ${
                      isPinned
                        ? "bg-orange-100 text-orange-600 shadow-sm border border-orange-200"
                        : "text-gray-400 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <Pin size={24} className={isPinned ? "fill-current" : ""} />
                  </button>
                  <button onClick={closeModal} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                    <X size={28} />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-4 md:px-6 pb-4">
                    <div className="note-toolbar flex items-center flex-wrap gap-3 p-2 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  {/* SIZE GROUP */}
                  <div className="flex items-center gap-2 flex-nowrap">
                    <select
                      className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm font-semibold"
                      value={currentFormats.size === MIXED ? "" : currentFormats.size}
                      title={currentFormats.size === MIXED ? "Karışık boyut" : "Yazı boyutu"}
                      onMouseDown={() => captureSelection()}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        applySizePx(v);
                      }}
                      data-popover-anchor="true"
                    >
                      <option value="">—</option>
                      {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("px", "")}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={sizeInput}
                      placeholder={currentFormats.size === MIXED ? "—" : ""}
                      onChange={(e) => setSizeInput(e.target.value.replace(/[^\d]/g, ""))}
                      onMouseDown={() => captureSelection()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (sizeInput.trim()) applySizePx(sizeInput);
                        }
                      }}
                      onBlur={() => {
                        if (sizeInput.trim()) applySizePx(sizeInput);
                      }}
                      className="w-16 h-9 rounded-lg border border-gray-200 px-2 text-sm font-bold text-gray-800"
                      title={currentFormats.size === MIXED ? "Karışık (sayı yazıp Enter)" : "Yazı boyutu"}
                    />

                    <ToolbarButton title="Küçült" state={false} onMouseDown={() => adjustSizeByStep(-1)}>
                      <Minus size={16} strokeWidth={3} />
                    </ToolbarButton>
                    <ToolbarButton title="Büyüt" state={false} onMouseDown={() => adjustSizeByStep(1)}>
                      <Plus size={16} strokeWidth={3} />
                    </ToolbarButton>
                  </div>

                  <div className="w-px h-6 bg-gray-200" />

                  {/* INLINE GROUP */}
                  <div className="flex items-center gap-2 flex-nowrap">
                    <ToolbarButton state={currentFormats.bold} title="Kalın" onMouseDown={() => toggleInline("bold")}>
                      <span className="font-black">B</span>
                    </ToolbarButton>
                    <ToolbarButton state={currentFormats.italic} title="İtalik" onMouseDown={() => toggleInline("italic")}>
                      <span className="italic font-bold">I</span>
                    </ToolbarButton>
                    <ToolbarButton state={currentFormats.underline} title="Altı çizili" onMouseDown={() => toggleInline("underline")}>
                      <span className="underline font-bold">U</span>
                    </ToolbarButton>
                    <ToolbarButton state={currentFormats.strike} title="Üstü çizili" onMouseDown={() => toggleInline("strike")}>
                      <span className="line-through font-bold">S</span>
                    </ToolbarButton>
                  </div>

                  <div className="w-px h-6 bg-gray-200" />

                  {/* COLOR GROUP */}
                  <div className="flex items-center gap-3 flex-nowrap">
                    <button
                      ref={textBtnRef}
                      data-popover-anchor="true"
                      type="button"
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${
                        currentFormats.color === MIXED
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : currentFormats.color
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                      title="Yazı rengi"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        openTextPopover();
                      }}
                    >
                      <div className="relative">
                        <Palette size={18} />
                        <span
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded"
                          style={{
                            background:
                              currentFormats.color === MIXED
                                ? "linear-gradient(90deg,#ef4444,#3b82f6,#22c55e)"
                                : currentFormats.color || "#111827",
                          }}
                        />
                      </div>
                    </button>

                    <button
                      ref={hlBtnRef}
                      data-popover-anchor="true"
                      type="button"
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${
                        currentFormats.background === MIXED
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : currentFormats.background
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                      title="Vurgu (highlight)"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        openHighlightPopover();
                      }}
                    >
                      <div className="relative">
                        <Highlighter size={18} />
                        <span
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded"
                          style={{
                            background:
                              currentFormats.background === MIXED
                                ? "linear-gradient(90deg,#fde047,#a7f3d0,#bfdbfe)"
                                : currentFormats.background || "#fde047",
                          }}
                        />
                      </div>
                    </button>

                    <ColorPopover
                      open={openTextColor}
                      anchorRect={textAnchorRect}
                      title="Yazı Rengi"
                      colors={LIVE_COLORS}
                      onPick={(hex) => applyTextColor(hex)}
                      onClose={() => setOpenTextColor(false)}
                    />

                    <ColorPopover
                      open={openHighlight}
                      anchorRect={hlAnchorRect}
                      title="Vurgu Rengi"
                      colors={LIVE_COLORS}
                      onPick={(hex) => applyHighlight(hex)}
                      onClose={() => setOpenHighlight(false)}
                    />
                  </div>

                  <div className="w-px h-6 bg-gray-200" />

                  {/* LIST GROUP */}
                  <div className="flex items-center gap-2 flex-nowrap">
                    <ToolbarButton
                      state={currentFormats.list === MIXED ? MIXED : currentFormats.list === "bullet"}
                      title="Madde işaretleri"
                      onMouseDown={() => setList("bullet")}
                    >
                      <List size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                      state={currentFormats.list === MIXED ? MIXED : currentFormats.list === "ordered"}
                      title="Numaralı liste"
                      onMouseDown={() => setList("ordered")}
                    >
                      <ListOrdered size={18} />
                    </ToolbarButton>
                  </div>

                  <div className="w-px h-6 bg-gray-200" />

                  <ToolbarButton state={false} title="Biçimi temizle" onMouseDown={clearFormatting}>
                    <Eraser size={18} />
                  </ToolbarButton>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto transition-colors duration-300 relative" style={{ backgroundColor: selectedColor }}>
              {error && (
                <div className="m-4 p-3 bg-red-100 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold absolute top-0 left-0 right-0 z-10">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={(v) => setContent(v)}
                onChangeSelection={(range) => {
                  if (!range) return;
                  syncToolbarFromEditor(range);
                }}
                onFocus={(range) => {
                  if (!range) return;
                  syncToolbarFromEditor(range);
                }}
                modules={modules}
                formats={formats}
                className="h-full pb-20 note-editor"
                placeholder="Notlarını buraya yaz..."
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
              <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[60%] justify-center sm:justify-start">
                {noteBgColors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`
                      w-8 h-8 rounded-full shadow-sm transition-all duration-200 transform-gpu
                      ${c.btnClass}
                      ${selectedColor === c.hex ? "scale-110 ring-2 ring-gray-400 ring-offset-2 z-10" : "hover:scale-105 opacity-85 hover:opacity-100"}
                    `}
                    title={c.id}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                ))}
              </div>

              <div className="flex gap-3 w-full sm:w-auto justify-end">
                {editingNote && (
                  <button
                    onClick={() => handleDelete(editingNote._id)}
                    className="px-5 py-2.5 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm flex items-center gap-2 border border-transparent hover:border-red-100"
                  >
                    <Trash2 size={18} /> Sil
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAY PORTAL MODAL */}
      {deleteConfirm.open && createPortal(
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Notu Sil?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Bu notu silmek istediğine emin misin? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm({ open: false, id: null })}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}