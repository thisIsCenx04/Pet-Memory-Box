"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import {
  OwnerFields,
  PetInfoFields,
  VisibilityToggles,
  noContactLeft,
  type PetFieldDefaults,
  type VisibilityName,
} from "@/components/admin/pet-fields";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

type BoundAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function EditPetForm({ action, defaults }: { action: BoundAction; defaults: PetFieldDefaults }) {
  const [state, formAction] = useActionState(action, {});
  const values = state.values ?? defaults;
  return (
    <form action={formAction} noValidate className="space-y-6">
      <Notice state={state} />
      <input type="hidden" name="version" value={defaults.version} />
      <PetInfoFields defaults={values} errors={state.errors} showLifeStatus={false} />
      <div>
        <h3 className="mb-3 text-lg font-semibold">Chủ nuôi</h3>
        <OwnerFields defaults={values} errors={state.errors} />
      </div>
      <SubmitButton>Lưu thay đổi</SubmitButton>
    </form>
  );
}

export function VisibilityForm({
  action,
  initial,
  publicUrl,
}: {
  action: BoundAction;
  initial: Record<VisibilityName, boolean>;
  publicUrl: string | null;
}) {
  const [state, formAction] = useActionState(action, {});
  const [v, setV] = useState(initial);
  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(e) => {
        if (noContactLeft(v) && !window.confirm("Người quét sẽ không liên lạc được với chủ. Vẫn lưu?")) e.preventDefault();
      }}
    >
      <Notice state={state} />
      <VisibilityToggles checked={v} onChange={(name, val) => setV((c) => ({ ...c, [name]: val }))} />
      {!v.showCallButton && v.showPhone ? (
        <p className="text-xs text-ink-soft">Nút gọi tắt nhưng số điện thoại chính vẫn hiện dạng chữ.</p>
      ) : null}
      {noContactLeft(v) ? (
        <p role="alert" className="rounded-xl bg-peach-soft px-4 py-3 text-sm text-rust">
          Người quét sẽ không liên lạc được với chủ nuôi.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton>Lưu cấu hình</SubmitButton>
        {publicUrl ? (
          <a href={publicUrl} target="_blank" rel="noopener" className="btn-outline">
            Xem trang công khai
          </a>
        ) : null}
      </div>
    </form>
  );
}

export function LifeStatusForm({
  action,
  lifeStatus,
  passedDate,
}: {
  action: BoundAction;
  lifeStatus: "alive" | "memorial";
  passedDate: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const toMemorial = lifeStatus === "alive";
  return (
    <form
      action={formAction}
      className="space-y-3"
      onSubmit={(e) => {
        const msg = toMemorial
          ? "Chuyển sang trang tưởng niệm? Nút gọi, số điện thoại và lời nhắn tìm bé đi lạc sẽ bị ẩn. Mã QR giữ nguyên."
          : "Chuyển về bé đang sống?";
        if (!window.confirm(msg)) e.preventDefault();
      }}
    >
      <Notice state={state} />
      <input type="hidden" name="lifeStatus" value={toMemorial ? "memorial" : "alive"} />
      {toMemorial ? (
        <Field label="Ngày mất (không bắt buộc)" htmlFor="passedDate-life" error={state.errors?.passedDate}>
          <input id="passedDate-life" name="passedDate" type="date" className="input" defaultValue={passedDate} />
        </Field>
      ) : (
        <input type="hidden" name="passedDate" value="" />
      )}
      <SubmitButton className="btn-outline w-full" pendingText="Đang chuyển…">
        {toMemorial ? "Chuyển sang trang tưởng niệm" : "Chuyển về bé đang sống"}
      </SubmitButton>
    </form>
  );
}

export function LockForm({ action }: { action: BoundAction }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <details className="rounded-xl border border-sand bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-danger">Khóa mã</summary>
      <form action={formAction} className="mt-3 space-y-3">
        <Notice state={state} />
        <Field label="Lý do khóa" htmlFor="reason" error={state.errors?.reason}>
          <select id="reason" name="reason" className="input" defaultValue="Mất vòng cổ">
            <option>Mất vòng cổ</option>
            <option>Theo yêu cầu của chủ nuôi</option>
            <option>Nghi ngờ lộ mã</option>
          </select>
        </Field>
        <SubmitButton className="btn-danger w-full" pendingText="Đang khóa…">
          Xác nhận khóa mã
        </SubmitButton>
      </form>
    </details>
  );
}

export function OrderForm({
  action,
  defaults,
}: {
  action: BoundAction;
  defaults: { package: string; status: string; note: string };
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-3">
      <Notice state={state} />
      <Field label="Gói" htmlFor="order-package">
        <select id="order-package" name="package" className="input" defaultValue={defaults.package}>
          <option value="full_box">Hộp đầy đủ</option>
          <option value="tag_only">Chỉ vòng QR</option>
        </select>
      </Field>
      <Field label="Trạng thái" htmlFor="order-status">
        <select id="order-status" name="status" className="input" defaultValue={defaults.status}>
          <option value="received">Đã nhận</option>
          <option value="preparing">Đang làm</option>
          <option value="issued">Đã phát hành</option>
          <option value="delivered">Đã giao</option>
        </select>
      </Field>
      <Field label="Ghi chú" htmlFor="order-note" error={state.errors?.note}>
        <textarea id="order-note" name="note" rows={2} className="input" maxLength={1000} defaultValue={defaults.note} />
      </Field>
      <SubmitButton className="btn-outline w-full">Lưu đơn hàng</SubmitButton>
    </form>
  );
}

export function MemoryForm({ action }: { action: BoundAction }) {
  const [state, formAction] = useActionState(action, {});
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form action={formAction} className="space-y-3" noValidate>
      <Notice state={state} />
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Field label="Tiêu đề *" htmlFor="mem-title" error={state.errors?.title}>
          <input id="mem-title" name="title" className="input" maxLength={100} defaultValue={v.title} />
        </Field>
        <Field label="Ngày" htmlFor="mem-date" error={state.errors?.memoryDate}>
          <input id="mem-date" name="memoryDate" type="date" className="input" defaultValue={v.memoryDate} />
        </Field>
      </div>
      <Field label="Nội dung *" htmlFor="mem-content" error={state.errors?.content} hint="Tối đa 5.000 ký tự.">
        <textarea id="mem-content" name="content" rows={4} className="input" maxLength={5000} defaultValue={v.content} />
      </Field>
      <SubmitButton>Thêm kỷ niệm</SubmitButton>
    </form>
  );
}

export function VideoLinkForm({ action }: { action: BoundAction }) {
  const [state, formAction] = useActionState(action, {});
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form action={formAction} className="space-y-3" noValidate>
      <Notice state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Liên kết YouTube hoặc Vimeo *" htmlFor="video-url" error={state.errors?.url}>
          <input id="video-url" name="url" type="url" className="input" placeholder="https://youtu.be/…" defaultValue={v.url} />
        </Field>
        <Field label="Tiêu đề" htmlFor="video-title">
          <input id="video-title" name="title" className="input" maxLength={100} defaultValue={v.title} />
        </Field>
      </div>
      <SubmitButton>Thêm video</SubmitButton>
    </form>
  );
}
