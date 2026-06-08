// ─── EditProfileModal ─────────────────────────────────────────────────────────
// Drop-in replacement for the existing EditProfileModal.
// Fixes:
//   1. Username uniqueness check (server-side, excludes self)
//   2. Username cannot contain spaces
//   3. NIM must be exactly 10 digits (numbers only), or left empty
//   4. Avatar uses a fixed storage path to avoid orphaned files

import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  nim: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export default function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [username, setUsername]       = useState(profile.username);
  const [nim, setNim]                 = useState(profile.nim ?? "");
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const avatarRef = useRef<HTMLInputElement>(null);

  // ── Derived NIM badge preview ──────────────────────────────────────────────
  const nimBadgePreview =
    /^\d{10}$/.test(nim) ? `B${nim[0]}${nim[1]}` : null;

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};

    if (username.trim().length < 3)
      e.username = "Username minimal 3 karakter.";
    else if (username.trim().length > 30)
      e.username = "Username maksimal 30 karakter.";
    else if (/\s/.test(username))
      e.username = "Username tidak boleh mengandung spasi.";
    else if (!/^[\w.]+$/.test(username))
      e.username = "Username hanya boleh huruf, angka, underscore, dan titik.";

    if (nim.trim() !== "" && !/^\d{10}$/.test(nim.trim()))
      e.nim = "NIM harus 10 digit angka.";

    return e;
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setErrors({});

    // 1. Username uniqueness check
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .neq("id", profile.id)
      .maybeSingle();

    if (existing) {
      setErrors({ username: "Username sudah dipakai orang lain." });
      setSubmitting(false);
      return;
    }

    // 2. Avatar upload (fixed path → overwrites previous, no orphans)
    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      const ext  = avatarFile.name.split(".").pop();
      const path = `avatars/${profile.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("attachments")
        .upload(path, avatarFile, { upsert: true });

      if (uploadErr) {
        setErrors({ general: "Gagal upload foto profil: " + uploadErr.message });
        setSubmitting(false);
        return;
      }
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      avatar_url = data.publicUrl;
    }

    // 3. Update profile
    const { data, error: updateErr } = await supabase
      .from("profiles")
      .update({
        username:     username.trim(),
        display_name: displayName.trim() || null,
        nim:          nim.trim() || null,
        avatar_url,
        updated_at:   new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (updateErr || !data) {
      setErrors({ general: updateErr?.message || "Gagal menyimpan profil." });
      setSubmitting(false);
      return;
    }

    onSaved(data as Profile);
    onClose();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-extrabold">Edit Profil</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errors.general && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-2">
              {errors.general}
            </p>
          )}

          {/* Avatar */}
          <div>
            <label className="font-bold text-sm block mb-2">Foto Profil</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400 text-2xl">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => avatarRef.current?.click()}
                className="text-sm font-semibold text-blue-500 hover:underline"
              >
                Ganti foto
              </button>
            </div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setAvatarFile(f);
                if (f) setAvatarPreview(URL.createObjectURL(f));
              }}
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="font-bold text-sm block mb-2">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama tampilan (opsional, boleh pakai spasi)"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Username */}
          <div>
            <label className="font-bold text-sm block mb-2">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} // strip spaces on type
              placeholder="username (tanpa spasi)"
              maxLength={30}
              className={`w-full rounded-xl bg-slate-50 dark:bg-slate-800 border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${
                errors.username
                  ? "border-red-400 focus:ring-red-400"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.username
                ? <p className="text-xs text-red-500">{errors.username}</p>
                : <span />
              }
              <span className="text-xs text-slate-400">{username.length}/30</span>
            </div>
          </div>

          {/* NIM */}
          <div>
            <label className="font-bold text-sm block mb-2">NIM</label>
            <div className="flex items-center gap-3">
              <input
                value={nim}
                onChange={(e) => {
                  // only allow digits, max 10
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setNim(val);
                  if (errors.nim) setErrors((prev) => ({ ...prev, nim: "" }));
                }}
                placeholder="10 digit angka"
                inputMode="numeric"
                maxLength={10}
                className={`flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono tracking-widest ${
                  errors.nim
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              />
              {/* Live badge preview */}
              {nimBadgePreview && (
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-extrabold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 tracking-wide whitespace-nowrap">
                  {nimBadgePreview}
                </span>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.nim
                ? <p className="text-xs text-red-500">{errors.nim}</p>
                : <p className="text-xs text-slate-400">Kosongkan jika tidak ingin menampilkan badge NIM.</p>
              }
              <span className="text-xs text-slate-400">{nim.length}/10</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-full px-5 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}