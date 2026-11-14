"use client";

import { ChevronDown, Download, FolderOpen, Info, NotebookPen, Save, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n";
import type { SavedPlan } from "@/lib/types";

export function PlanNotes({ notes, onNotesChange, plans, assumptions, onSave, onRestore, onDelete, onDownload }: {
  notes: string; onNotesChange: (value: string) => void; plans: SavedPlan[]; assumptions: string[];
  onSave: () => void; onRestore: (plan: SavedPlan) => void; onDelete: (id: string) => void; onDownload: () => void;
}) {
  const { L, lang } = useI18n();
  return <div className="grid items-start gap-5 lg:grid-cols-2">
    <div className="space-y-5">
      <Card className="rounded-3xl border-[#cbd5cd] p-5 md:p-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-forest"><NotebookPen className="h-7 w-7 shrink-0" aria-hidden />{L("Your notes", "Ghi chú của bạn")}</h2>
        <p className="mt-3 text-base leading-relaxed text-ink">{L("Write down what you need to prepare or discuss with your farm adviser.", "Ghi lại việc cần chuẩn bị hoặc trao đổi với cán bộ khuyến nông.")}</p>
        <label htmlFor="notes" className="mt-5 block text-lg font-bold text-ink">{L("Notes for this plan", "Ghi chú cho kế hoạch này")}</label>
        <textarea id="notes" value={notes} onChange={e => onNotesChange(e.target.value)} rows={6} className="mt-3 w-full resize-y rounded-2xl border-2 border-[#9eafa3] bg-white p-4 text-lg leading-relaxed text-ink placeholder:text-[#56645d] focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20" placeholder={L("For example: check the pump, ask about soybean seed, confirm the planting date…", "Ví dụ: kiểm tra máy bơm, hỏi giống đậu nành, xác nhận ngày gieo…")} />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button onClick={onSave} className="min-h-13 h-auto rounded-xl px-5 py-3 text-base"><Save className="h-5 w-5 shrink-0" aria-hidden />{L("Save this plan", "Lưu kế hoạch này")}</Button>
          <Button variant="outline" onClick={onDownload} className="min-h-13 h-auto rounded-xl border-[#9eafa3] px-5 py-3 text-base"><Download className="h-5 w-5 shrink-0" aria-hidden />{L("Download summary", "Tải bản tóm tắt")}</Button>
        </div>
        <p className="mt-4 flex items-start gap-2 text-base leading-relaxed text-ink"><Info className="mt-1 h-5 w-5 shrink-0 text-forest" aria-hidden />{L("Notes are saved with the plan on this browser and device. Download a copy to keep elsewhere.", "Ghi chú được lưu cùng kế hoạch trên trình duyệt và thiết bị này. Tải bản tóm tắt để giữ thêm một bản.")}</p>
      </Card>
      <details className="group rounded-3xl border border-[#cbd5cd] bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 p-5 text-lg font-bold text-forest">{L("Assumptions behind this plan", "Các giả định của kế hoạch")}<ChevronDown className="h-6 w-6 shrink-0 transition-transform group-open:rotate-180" aria-hidden /></summary>
        <ul className="list-disc space-y-3 border-t border-[#cbd5cd] p-5 pl-10 text-base leading-relaxed text-ink">{assumptions.map((a,i) => <li key={i}>{a}</li>)}</ul>
      </details>
      <p className="rounded-2xl border border-[#dcb56f] bg-[#fff6e6] p-5 text-base leading-relaxed text-[#623d0a]">{L("This plan supports your decision. Check real field conditions and consult a local adviser before planting.", "Kế hoạch giúp bạn cân nhắc cách trồng. Cần kiểm tra điều kiện thực tế và trao đổi với cán bộ khuyến nông trước khi áp dụng.")}</p>
    </div>
    <Card className="overflow-hidden rounded-3xl border-[#cbd5cd]">
      <div className="border-b border-[#cbd5cd] bg-[#f4f7ef] p-5 md:p-6"><h2 className="flex items-center gap-3 text-2xl font-bold text-forest"><FolderOpen className="h-7 w-7 shrink-0" aria-hidden />{L("Saved plans", "Kế hoạch đã lưu")}<span className="ml-auto rounded-full border border-[#b6c8b5] bg-white px-3 py-1 text-lg tabular">{plans.length}</span></h2><p className="mt-3 text-base text-ink">{L("For this farm · on this device", "Của ruộng này · trên thiết bị này")}</p></div>
      <div className="p-5 md:p-6">
        {plans.length === 0 ? <div className="rounded-2xl border-2 border-dashed border-[#b6c8b5] bg-[#f8faf5] px-5 py-10 text-center"><FolderOpen className="mx-auto h-12 w-12 text-forest" aria-hidden /><h3 className="mt-4 text-xl font-bold text-forest">{L("No saved plans yet", "Chưa có kế hoạch đã lưu")}</h3><p className="mt-3 text-base leading-relaxed text-ink">{L("Add a note, then choose “Save this plan”. You can open it again here.", "Thêm ghi chú rồi bấm “Lưu kế hoạch này”. Bạn có thể mở lại kế hoạch tại đây.")}</p></div>
          : <ul className="space-y-4">{plans.map(p => <li key={p.id} className="rounded-2xl border border-[#b6c8b5] p-4">
            <h3 className="break-words text-lg font-bold leading-relaxed text-forest">{p.name}</h3><p className="mt-2 text-base text-ink">{L("Saved", "Đã lưu")}: {new Date(p.savedAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-GB")}</p>
            {p.notes && <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-[#f4f7ef] p-3 text-base leading-relaxed text-ink">{p.notes}</p>}
            <div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" onClick={() => onRestore(p)} aria-label={L(`Open plan ${p.name}`, `Mở kế hoạch ${p.name}`)} className="min-h-12 h-auto rounded-xl border-[#9eafa3] px-4 py-3 text-base"><FolderOpen className="h-5 w-5 shrink-0" aria-hidden />{L("Open plan", "Mở kế hoạch")}</Button><Button variant="ghost" onClick={() => onDelete(p.id)} aria-label={L(`Delete plan ${p.name}`, `Xóa kế hoạch ${p.name}`)} className="min-h-12 h-auto rounded-xl px-4 py-3 text-base text-[#92352a] hover:bg-risk-soft"><Trash2 className="h-5 w-5 shrink-0" aria-hidden />{L("Delete", "Xóa")}</Button></div>
          </li>)}</ul>}
      </div>
    </Card>
  </div>;
}
