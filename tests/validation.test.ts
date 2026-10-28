import { describe, expect, it } from "vitest";
import { normalizeVnPhone } from "@/lib/phone";
import { createPetSchema, updatePetSchema } from "@/lib/validation";
import { parseVideoLink } from "@/lib/video-links";

describe("normalizeVnPhone", () => {
  it.each([
    ["0901234567", "0901234567"],
    ["090 123 4567", "0901234567"],
    ["+84901234567", "0901234567"],
    ["84901234567", "0901234567"],
    ["090.123.4567", "0901234567"],
  ])("%s -> %s", (input, out) => expect(normalizeVnPhone(input)).toBe(out));

  it.each(["123", "1901234567", "09012345678", "abc"])("từ chối %s", (input) =>
    expect(normalizeVnPhone(input)).toBeNull(),
  );
});

const base = {
  name: "Mun",
  species: "dog",
  breed: "",
  gender: "male",
  birthDate: "2021-03-14",
  coatColor: "",
  traits: "",
  note: "",
  tagline: "",
  lifeStatus: "alive",
  passedDate: "",
  ownerName: "Nguyễn Minh Anh",
  phone: "+84 901 234 567",
  phone2: "",
  zaloMessenger: "",
  area: "",
  address: "",
  showCallButton: true,
  showPhone: true,
  showPhone2: false,
  showArea: true,
  showAddress: false,
  showNote: true,
  showMedia: true,
  showMemories: true,
  package: "full_box",
  orderNote: "",
  confirmDuplicate: false,
};

describe("createPetSchema", () => {
  it("chuẩn hóa số điện thoại và đổi chuỗi rỗng thành null", () => {
    const r = createPetSchema.parse(base);
    expect(r.phone).toBe("0901234567");
    expect(r.breed).toBeNull();
    expect(r.birthDate?.toISOString()).toBe("2021-03-14T00:00:00.000Z");
  });

  it("bắt buộc tên bé, tên chủ, số điện thoại (FR-10)", () => {
    const r = createPetSchema.safeParse({ ...base, name: " ", ownerName: "A", phone: "" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["name", "ownerName", "phone"]));
  });

  it("từ chối ngày sinh ở tương lai", () => {
    const r = createPetSchema.safeParse({ ...base, birthDate: "2999-01-01" });
    expect(r.success).toBe(false);
  });

  it("nhận ngày dạng dd/mm/yyyy và từ chối ngày không tồn tại", () => {
    expect(createPetSchema.parse({ ...base, birthDate: "14/03/2021" }).birthDate?.getUTCDate()).toBe(14);
    expect(createPetSchema.safeParse({ ...base, birthDate: "31/02/2021" }).success).toBe(false);
  });

  it("ngày mất không được trước ngày sinh", () => {
    const r = createPetSchema.safeParse({ ...base, lifeStatus: "memorial", passedDate: "2020-01-01" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0].path).toEqual(["passedDate"]);
  });

  it("bỏ ngày mất khi bé đang sống", () => {
    const r = createPetSchema.parse({ ...base, lifeStatus: "alive", passedDate: "2024-01-01" });
    expect(r.passedDate).toBeNull();
  });

  it("Zalo nhận số điện thoại hoặc https", () => {
    expect(createPetSchema.parse({ ...base, zaloMessenger: "0901234567" }).zaloMessenger).toBe("0901234567");
    expect(createPetSchema.parse({ ...base, zaloMessenger: "https://m.me/abc" }).zaloMessenger).toBe("https://m.me/abc");
    expect(createPetSchema.safeParse({ ...base, zaloMessenger: "http://m.me/abc" }).success).toBe(false);
  });

  it("giới hạn độ dài (mục 10.2)", () => {
    expect(createPetSchema.safeParse({ ...base, name: "x".repeat(51) }).success).toBe(false);
    expect(createPetSchema.safeParse({ ...base, tagline: "x".repeat(81) }).success).toBe(false);
  });
});

describe("updatePetSchema", () => {
  it("cần version để khóa lạc quan", () => {
    expect(updatePetSchema.safeParse({ ...base, version: "3" }).success).toBe(true);
    expect(updatePetSchema.safeParse({ ...base }).success).toBe(false);
  });
});

describe("parseVideoLink", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
  ])("%s", (input, embed) => expect(parseVideoLink(input)?.embedUrl).toBe(embed));

  it.each([
    "http://youtu.be/dQw4w9WgXcQ",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
    "https://www.youtube.com/watch?v=short",
  ])("từ chối %s", (input) => expect(parseVideoLink(input)).toBeNull());
});

describe("ô vắng mặt trong FormData", () => {
  it("các ô không bắt buộc có thể không được gửi lên", () => {
    const { passedDate, breed, phone2, zaloMessenger, orderNote, ...rest } = base;
    void passedDate, breed, phone2, zaloMessenger, orderNote;
    const r = createPetSchema.safeParse(rest);
    expect(r.success).toBe(true);
    expect(r.data?.passedDate).toBeNull();
  });
});
